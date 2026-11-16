/**
 * Aircraft. In a war the AI keeps a few bombers and strikes only at targets it
 * can come back from: enemy units in the open and the defenders of the city
 * its army is after. Fighters wait in the city nearest the enemy and shoot
 * down aircraft that come within reach. Aircraft carriers are left out.
 */
import { combatOddsInView, distance, neighbors8, RULES, UNIT_TYPES, type City, type Command, type PlayerView, type Point, type Unit, type UnitTypeId } from "../core";
import { at, pointOf } from "./knowledge";
import { unitAvailable } from "./build";

/** Chance of winning a bomber needs before it flies out. */
const BOMB_ODDS = 0.65;
/** Chance of winning a fighter needs to attack an aircraft. */
const INTERCEPT_ODDS = 0.55;

export function isAircraft(u: Pick<Unit, "type">): boolean {
  const r = UNIT_TYPES[u.type];
  return r.domain === "air" && r.special !== "nuclear";
}

/** Bombers hit hard; fighters have the most moves and catch other aircraft. */
function isBomber(id: UnitTypeId): boolean {
  const r = UNIT_TYPES[id];
  return r.domain === "air" && r.special !== "nuclear" && r.attack > r.defense * 3;
}

function isFighter(id: UnitTypeId): boolean {
  const r = UNIT_TYPES[id];
  return r.domain === "air" && r.special !== "nuclear" && !isBomber(id);
}

function bestOf(view: PlayerView, test: (id: UnitTypeId) => boolean): UnitTypeId | null {
  let best: UnitTypeId | null = null;
  for (const id of Object.keys(UNIT_TYPES) as UnitTypeId[]) {
    if (!test(id) || !unitAvailable(view, id)) continue;
    if (!best || UNIT_TYPES[id].attack > UNIT_TYPES[best].attack) best = id;
  }
  return best;
}

export function bomberType(view: PlayerView): UnitTypeId | null {
  return bestOf(view, isBomber);
}

export function fighterType(view: PlayerView): UnitTypeId | null {
  return bestOf(view, isFighter);
}

/** Enemy aircraft the AI sees in the open sky. */
function enemyAircraft(view: PlayerView, enemies: number[]): Unit[] {
  return view.foreignUnits.filter((u) => enemies.includes(u.owner) && UNIT_TYPES[u.type].domain === "air");
}

/**
 * What a city should build for the air war, or null. Fighters only once enemy
 * aircraft have been seen; bombers come out of the army's own budget, up to
 * the number given, so the air war takes no shields from the rest.
 */
export function aircraftProduction(view: PlayerView, city: City, enemies: number[], kind: "fighters" | "bombers", bombers = 0): UnitTypeId | null {
  if (city.size < 3 || enemies.length === 0) return null;
  const count = (test: (id: UnitTypeId) => boolean) =>
    view.units.filter((u) => test(u.type)).length + view.cities.filter((c) => c.id !== city.id && c.production.kind === "unit" && test(c.production.id)).length;
  if (kind === "fighters") {
    const fighter = fighterType(view);
    const wanted = enemyAircraft(view, enemies).length > 0 ? Math.min(2, 1 + Math.floor(view.cities.length / 6)) : 0;
    return fighter && count(isFighter) < wanted ? fighter : null;
  }
  const bomber = bomberType(view);
  return bomber && count(isBomber) < bombers ? bomber : null;
}

function homeCity(view: PlayerView, from: Point): City | null {
  return [...view.cities].sort((a, b) => distance(a, from) - distance(b, from))[0] ?? null;
}

/**
 * A strike: fly next to the target, attack and fly back to the city it came
 * from. The commands run in order on the real state, so each one finds the
 * aircraft where the one before left it.
 */
function sortie(view: PlayerView, u: Unit, home: City, odds: number, targets: Point[], range: number): Command[] | null {
  let best: { from: Point; to: Point; chance: number } | null = null;
  for (const t of targets) {
    if (distance(home, t) > range) continue;
    for (const n of neighbors8(view, at(view, t))) {
      const from = pointOf(view, n);
      if (view.foreignUnits.some((f) => f.x === from.x && f.y === from.y)) continue;
      if (view.foreignCities.some((c) => c.x === from.x && c.y === from.y)) continue;
      const result = combatOddsInView(view, { ...u, x: from.x, y: from.y }, t);
      if (!result || result.winChance < odds) continue;
      const better = !best || result.winChance > best.chance || (result.winChance === best.chance && distance(home, from) < distance(home, best.from));
      if (better) best = { from, to: t, chance: result.winChance };
    }
  }
  if (!best) return null;
  const out: Command[] = [];
  if (!(best.from.x === u.x && best.from.y === u.y)) out.push({ type: "goto", unitId: u.id, to: best.from });
  out.push({ type: "attack", unitId: u.id, to: best.to });
  out.push({ type: "goto", unitId: u.id, to: { x: home.x, y: home.y } });
  return out;
}

/**
 * One aircraft's turn. Away from a city it flies home first. A bomber strikes
 * at enemies in the open or at the defenders of the army's target, as far as
 * it can go and still be back before its fuel runs out; a fighter goes for
 * enemy aircraft near its city and otherwise waits in the city nearest the enemy.
 */
export function aircraftCommands(view: PlayerView, u: Unit, enemies: number[], target: City | null): Command[] {
  if (u.fortified) return [{ type: "cancelOrders", unitId: u.id }];
  if (u.movesLeft <= 0) return [];
  const here = view.cities.find((c) => c.x === u.x && c.y === u.y);
  const home = here ?? homeCity(view, u);
  if (!home) return [];
  if (!here) return [{ type: "goto", unitId: u.id, to: { x: home.x, y: home.y } }];
  if (enemies.length === 0 || u.hp < UNIT_TYPES[u.type].hp * 0.6) return [];
  const steps = Math.floor(u.movesLeft / RULES.movesFraction);
  // Out, one move for the attack, and back the same turn.
  const range = Math.floor((steps + 1) / 2);

  if (isFighter(u.type)) {
    const strike = sortie(view, u, home, INTERCEPT_ODDS, enemyAircraft(view, enemies), range);
    if (strike) return strike;
    // Wait in the city nearest the enemy.
    const enemyCities = view.foreignCities.filter((c) => enemies.includes(c.owner));
    const front = [...view.cities].sort((a, b) => nearestTo(a, enemyCities) - nearestTo(b, enemyCities))[0];
    if (front && front.id !== here.id && distance(here, front) <= steps) return [{ type: "goto", unitId: u.id, to: { x: front.x, y: front.y } }];
    return [];
  }

  const inField = view.foreignUnits.filter(
    (f) => enemies.includes(f.owner) && UNIT_TYPES[f.type].domain === "land" && !view.foreignCities.some((c) => c.x === f.x && c.y === f.y),
  );
  const cityTarget = target && enemies.includes(target.owner) ? [{ x: target.x, y: target.y }] : [];
  return sortie(view, u, home, BOMB_ODDS, [...inField, ...cityTarget], range) ?? [];
}

function nearestTo(p: Point, list: Point[]): number {
  return list.length ? Math.min(...list.map((q) => distance(p, q))) : 99;
}
