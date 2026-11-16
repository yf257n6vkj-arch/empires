/**
 * Orders for the AI's units: settlers found cities or improve the land,
 * soldiers guard cities and one of them explores, ships ferry settlers to
 * islands. Unciv's order of checks: wounded units first go home to heal.
 */
import { distance, neighbors8, RULES, UNIT_TYPES, type City, type Command, type PlayerView, type Point, type Unit } from "../core";
import { armyCommands, attackNow, isAttacker } from "./war";
import { garrison, garrisonNeed, type Plan } from "./build";
import { at, coastal, frontier, isLand, isMilitary, isSea, isSettler, pointOf, seaPath, seaReach } from "./knowledge";
import { averageKnownValue, bestSite, islandSites, MIN_SITE_SCORE, siteValue, type Site } from "./settle";

const same = (a: Point | null | undefined, b: Point) => !!a && a.x === b.x && a.y === b.y;

function goto(u: Unit, to: Point): Command[] {
  if (same(u.goto, to) || (u.x === to.x && u.y === to.y)) return [];
  return [{ type: "goto", unitId: u.id, to }];
}

function nearest<T extends Point>(from: Point, items: T[]): T | undefined {
  let best: T | undefined;
  for (const it of items) if (!best || distance(from, it) < distance(from, best)) best = it;
  return best;
}

export interface Context {
  view: PlayerView;
  land: Int32Array;
  average: number;
  plan: Plan;
  islands: Site[];
  /** Sites settlers chose earlier in this decision, so two do not head for the same place. */
  claimed: Point[];
}

export function makeContext(view: PlayerView, land: Int32Array, plan: Omit<Plan, "islands">): Context {
  const average = averageKnownValue(view);
  const islands = islandSites(view, land, average);
  return { view, land, average, islands, plan: { ...plan, islands: islands.length }, claimed: [] };
}

// ---------- settlers ----------

export function settlerCommands(ctx: Context, u: Unit): Command[] {
  const { view, land, average } = ctx;
  if (u.orders || u.work) return [];
  if (u.carriedBy !== null) return [];
  if (u.movesLeft <= 0) return [];
  const here = siteValue(view, at(view, u), ctx.claimed, average);
  const best = bestSite(view, u, land, average, ctx.claimed);
  if (Number.isFinite(here) && here >= 0.6 * MIN_SITE_SCORE && (!best || here >= best.score * 0.9)) {
    ctx.claimed.push({ x: u.x, y: u.y });
    return [{ type: "foundCity", unitId: u.id }];
  }
  if (best) {
    const target = pointOf(view, best.i);
    ctx.claimed.push(target);
    return goto(u, target);
  }

  // No land left: wait in a coastal city for a ship to the islands.
  if (ctx.islands.length > 0) {
    const ports = view.cities.filter((c) => coastal(view, c) && land[at(view, c)] === land[at(view, u)]);
    const port = nearest(u, ports);
    if (port) {
      if (u.x === port.x && u.y === port.y) {
        const ship = view.units.find((s) => s.x === u.x && s.y === u.y && UNIT_TYPES[s.type].domain === "sea" && (UNIT_TYPES[s.type].capacity ?? 0) > 0);
        return ship ? [{ type: "board", unitId: u.id }] : [];
      }
      return goto(u, port);
    }
  }
  // Nothing to found: improve the land around the cities.
  return [{ type: "automate", unitId: u.id }];
}

/** A settler on a ship steps onto the island when the ship lies next to it. */
export function passengerCommands(ctx: Context, u: Unit): Command[] {
  const { view } = ctx;
  if (u.carriedBy === null || u.movesLeft <= 0) return [];
  const target = ctx.islands[0];
  for (const n of neighbors8(view, at(view, u))) {
    if (!isLand(view, n)) continue;
    if (target && ctx.land[n] !== ctx.land[target.i]) continue;
    const p = pointOf(view, n);
    if (view.foreignUnits.some((f) => f.x === p.x && f.y === p.y)) continue;
    return [{ type: "move", unitId: u.id, to: p }];
  }
  return [];
}

// ---------- ships ----------

/** Steps along a sea route as far as the ship's moves go this turn. */
function sail(view: PlayerView, s: Unit, to: Point): Command[] {
  const path = seaPath(view, s, to, !!UNIT_TYPES[s.type].coastal);
  if (!path) return [];
  const steps = Math.floor(s.movesLeft / RULES.movesFraction);
  return path.slice(0, Math.max(0, steps)).map((p) => ({ type: "move" as const, unitId: s.id, to: p }));
}

export function shipCommands(ctx: Context, s: Unit): Command[] {
  const { view } = ctx;
  if ((UNIT_TYPES[s.type].capacity ?? 0) === 0 || s.movesLeft <= 0) return [];
  const hug = !!UNIT_TYPES[s.type].coastal;
  const reach = seaReach(view, s, hug);
  const cargo = view.units.filter((u) => u.carriedBy === s.id);
  if (cargo.length > 0) {
    // The reachable water next to an island, nearest to the best island site.
    let landing: { p: Point; cost: number } | null = null;
    for (const target of ctx.islands) {
      const site = pointOf(view, target.i);
      for (const [i, steps] of reach) {
        if (!isSea(view, i)) continue;
        if (!neighbors8(view, i).some((n) => ctx.land[n] === ctx.land[target.i] && isLand(view, n))) continue;
        const p = pointOf(view, i);
        const cost = steps + 2 * distance(p, site);
        if (!landing || cost < landing.cost) landing = { p, cost };
      }
      if (landing) break;
    }
    if (!landing) return [];
    if (landing.p.x === s.x && landing.p.y === s.y) return [];
    return sail(view, s, landing.p);
  }
  // Pick up a settler waiting in a port.
  const waiting = view.units.filter((u) => isSettler(u) && !u.orders && u.carriedBy === null && view.cities.some((c) => c.x === u.x && c.y === u.y && coastal(view, c)));
  const pick = nearest(s, waiting.filter((u) => reach.has(at(view, u))));
  if (pick && ctx.islands.length > 0) return pick.x === s.x && pick.y === s.y ? [] : sail(view, s, pick);
  // Otherwise look for islands along the unexplored coast.
  const edge = frontier(view, false).filter((i) => reach.has(i));
  let target: Point | undefined;
  for (const i of edge) {
    const p = pointOf(view, i);
    if (p.x === s.x && p.y === s.y) continue;
    if (!target || reach.get(i)! < reach.get(at(view, target))!) target = p;
  }
  if (target) return sail(view, s, target);
  const port = nearest(s, view.cities.filter((c) => reach.has(at(view, c))));
  return port && !(port.x === s.x && port.y === s.y) ? sail(view, s, port) : [];
}

// ---------- soldiers ----------

/** Soldiers: wounded go home, cities keep their garrison, one explores, the rest reinforce. */
export function soldierCommands(ctx: Context, soldiers: Unit[], target: City | null = null): Command[] {
  const { view } = ctx;
  const commands: Command[] = [];
  const need = new Map(view.cities.map((c) => [c.id, garrisonNeed(view, c, ctx.plan)]));
  const stays = new Map<number, number>();
  const free: Unit[] = [];

  for (const u of soldiers) {
    const city = view.cities.find((c) => c.x === u.x && c.y === u.y);
    if (city && (stays.get(city.id) ?? 0) < (need.get(city.id) ?? 1)) {
      stays.set(city.id, (stays.get(city.id) ?? 0) + 1);
      // A defender strikes at an enemy next to its city when it is very likely to win and others hold the city.
      const strike = garrison(view, city) >= 2 ? attackNow(view, u, 0.75) : null;
      if (strike) commands.push(strike);
      else if (!u.fortified && u.movesLeft > 0) commands.push({ type: "fortify", unitId: u.id });
      continue;
    }
    free.push(u);
  }

  // At war the free attackers march on the target together.
  if (target) {
    const army = free.filter((u) => isAttacker(u));
    commands.push(...armyCommands(view, army, target));
    free.splice(0, free.length, ...free.filter((u) => !army.includes(u)));
  }

  // One free soldier explores while there is land left to see.
  const edge = frontier(view, true).filter((i) => ctx.land[i] === ctx.land[at(view, view.cities[0] ?? view.start)]);
  let explorer = free.find((u) => u.goto && edge.some((i) => same(u.goto, pointOf(view, i))));
  if (!explorer && edge.length > 0 && view.cities.length > 0) explorer = free.find((u) => u.hp === UNIT_TYPES[u.type].hp);
  for (const u of free) {
    if (u.movesLeft <= 0) continue;
    const hurt = u.hp < UNIT_TYPES[u.type].hp * 0.5;
    if (u === explorer && !hurt) {
      if (u.goto && edge.some((i) => same(u.goto, pointOf(view, i)))) continue;
      const target = nearest(u, edge.map((i) => pointOf(view, i)).filter((p) => !(p.x === u.x && p.y === u.y)));
      if (target) {
        commands.push(...goto(u, target));
        continue;
      }
    }
    // The city that needs a defender most, or the nearest for the wounded.
    const short = view.cities
      .map((c) => ({ c, gap: (need.get(c.id) ?? 1) - garrison(view, c) }))
      .filter((x) => hurt || x.gap > 0)
      .sort((a, b) => b.gap - a.gap || distance(u, a.c) - distance(u, b.c));
    const home = hurt ? nearest(u, view.cities) : short[0]?.c ?? nearest(u, view.cities);
    if (home) {
      if (home.x === u.x && home.y === u.y) {
        if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
      } else commands.push(...goto(u, home));
    } else if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
  }
  return commands;
}

export function exploring(view: PlayerView, land: Int32Array): boolean {
  const home = view.cities[0] ?? view.start;
  const edge = frontier(view, true).filter((i) => land[i] === land[at(view, home)]);
  if (edge.length === 0) return true;
  return view.units.some((u) => isMilitary(u) && !view.cities.some((c) => c.x === u.x && c.y === u.y));
}
