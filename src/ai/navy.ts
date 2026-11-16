/**
 * War at sea. Warships stay near their coast in peace and in a war go for
 * enemy ships, units on the shore and the coastal city the war is about.
 * When no enemy city can be reached on foot, the army sails: it gathers in
 * a port, boards a ship there, lands next to the enemy city and attacks
 * from the shore.
 */
import { distance, neighbors8, RULES, UNIT_TYPES, type City, type Command, type PlayerView, type Point, type Unit, type UnitTypeId } from "../core";
import { at, coastal, isLand, isSea, pointOf, seaPath, seaReach } from "./knowledge";
import { unitAvailable } from "./build";
import { attackNow } from "./war";

/** A landing on an enemy coast: where the army boards, where the ship waits and where the army steps ashore. */
export interface Invasion {
  target: City;
  port: City;
  /** Sea tile next to the shore where the ship lets the army off. */
  landing: Point;
  /** Free land tile next to the target. */
  shore: Point;
}

/** Ships that fight: sea units with an attack and no room for soldiers. */
export function isWarship(u: Pick<Unit, "type">): boolean {
  const r = UNIT_TYPES[u.type];
  return r.domain === "sea" && r.attack >= 2 && !((r.capacity ?? 0) > 0 && (r.carries ?? "land") === "land");
}

/** Ships that carry land units. */
export function isTransport(u: Pick<Unit, "type">): boolean {
  const r = UNIT_TYPES[u.type];
  return r.domain === "sea" && (r.capacity ?? 0) > 0 && (r.carries ?? "land") === "land";
}

/** The strongest warship the player can build, or null before there is one. */
export function warshipType(view: PlayerView): UnitTypeId | null {
  let best: UnitTypeId | null = null;
  for (const id of Object.keys(UNIT_TYPES) as UnitTypeId[]) {
    if (!isWarship({ type: id }) || !unitAvailable(view, id)) continue;
    if (!best || UNIT_TYPES[id].attack > UNIT_TYPES[best].attack) best = id;
  }
  return best;
}

/** The roomiest ship for soldiers the player can build, the cheaper one on a tie. */
export function invasionShipType(view: PlayerView): UnitTypeId | null {
  let best: UnitTypeId | null = null;
  for (const id of Object.keys(UNIT_TYPES) as UnitTypeId[]) {
    if (!isTransport({ type: id }) || !unitAvailable(view, id)) continue;
    const r = UNIT_TYPES[id];
    if (!best || (r.capacity ?? 0) > (UNIT_TYPES[best].capacity ?? 0) || ((r.capacity ?? 0) === (UNIT_TYPES[best].capacity ?? 0) && r.cost < UNIT_TYPES[best].cost)) best = id;
  }
  return best;
}

/**
 * The enemy coastal city the army can sail to most easily: for every own port,
 * the free land tile next to an enemy city that a ship reaches in the fewest
 * steps. Null when no ship for soldiers can be built or nothing is reachable.
 */
export function seaInvasion(view: PlayerView, land: Int32Array, enemies: number[]): Invasion | null {
  const ship = invasionShipType(view) ?? view.units.find(isTransport)?.type ?? null;
  if (!ship) return null;
  const hug = !!UNIT_TYPES[ship].coastal;
  const targets = view.foreignCities.filter((c) => enemies.includes(c.owner) && coastal(view, c));
  if (targets.length === 0) return null;
  let best: (Invasion & { cost: number }) | null = null;
  for (const port of view.cities.filter((c) => coastal(view, c))) {
    const reach = seaReach(view, port, hug);
    for (const target of targets) {
      // A target on the port's own land is a march, not a landing.
      if (land[at(view, target)] === land[at(view, port)]) continue;
      for (const n of neighbors8(view, at(view, target))) {
        if (!isLand(view, n)) continue;
        const shore = pointOf(view, n);
        if (view.foreignUnits.some((f) => f.x === shore.x && f.y === shore.y)) continue;
        if (view.foreignCities.some((c) => c.x === shore.x && c.y === shore.y)) continue;
        for (const m of neighbors8(view, n)) {
          const steps = reach.get(m);
          if (steps === undefined || !isSea(view, m)) continue;
          const cost = steps + distance(port, target) / 4;
          if (!best || cost < best.cost) best = { target, port, landing: pointOf(view, m), shore, cost };
        }
      }
    }
  }
  if (!best) return null;
  const { cost: _cost, ...invasion } = best;
  return invasion;
}

/** Warships the AI keeps: none in peace, a few in a war it can fight at sea. */
export function warshipsWanted(view: PlayerView, enemies: number[]): number {
  if (enemies.length === 0 || !warshipType(view)) return 0;
  const ports = view.cities.filter((c) => coastal(view, c));
  if (ports.length === 0) return 0;
  const enemyCoast = view.foreignCities.some((c) => enemies.includes(c.owner) && coastal(view, c));
  const enemyShips = view.foreignUnits.some((u) => enemies.includes(u.owner) && UNIT_TYPES[u.type].domain === "sea");
  if (!enemyCoast && !enemyShips) return 0;
  return Math.min(3, Math.max(1, Math.floor(ports.length / 2)));
}

/** Steps along a sea route as far as the ship's moves go this turn. */
function sail(view: PlayerView, s: Unit, to: Point): Command[] {
  if (s.x === to.x && s.y === to.y) return [];
  const path = seaPath(view, s, to, !!UNIT_TYPES[s.type].coastal);
  if (!path) return [];
  const steps = Math.floor(s.movesLeft / RULES.movesFraction);
  return path.slice(0, Math.max(0, steps)).map((p) => ({ type: "move" as const, unitId: s.id, to: p }));
}

/** The reachable sea tile next to the point, fewest steps first. */
function waterNextTo(view: PlayerView, reach: Map<number, number>, p: Point): Point | null {
  let best: { i: number; steps: number } | null = null;
  for (const n of neighbors8(view, at(view, p))) {
    const steps = reach.get(n);
    if (steps === undefined || !isSea(view, n)) continue;
    if (view.foreignUnits.some((f) => at(view, f) === n)) continue;
    if (!best || steps < best.steps) best = { i: n, steps };
  }
  return best ? pointOf(view, best.i) : null;
}

function homePort(view: PlayerView, s: Unit, reach: Map<number, number>): City | null {
  let best: City | null = null;
  for (const c of view.cities) {
    const steps = reach.get(at(view, c));
    if (steps === undefined) continue;
    if (!best || steps < reach.get(at(view, best))!) best = c;
  }
  return best;
}

/**
 * A warship's turn: home to mend when badly hurt, strike at an enemy next to
 * it when the odds are good, otherwise sail to the coastal city the war is
 * about or the nearest enemy ship; in peace it waits in port.
 */
export function warshipCommands(view: PlayerView, s: Unit, enemies: number[], goal: City | null): Command[] {
  // A fortified unit gets no moves; ships wait in port without fortifying.
  if (s.fortified) return [{ type: "cancelOrders", unitId: s.id }];
  if (s.movesLeft <= 0) return [];
  const reach = seaReach(view, s, !!UNIT_TYPES[s.type].coastal);
  const port = homePort(view, s, reach);
  const rest = (): Command[] => (port && !(port.x === s.x && port.y === s.y) ? sail(view, s, port) : []);
  if (s.hp < UNIT_TYPES[s.type].hp * 0.5) return rest();
  const strike = attackNow(view, s, 0.6);
  if (strike) return [strike];
  if (enemies.length === 0) return rest();

  // The city the war is about, if it lies on the coast; else the nearest enemy coastal city or ship.
  const coastalGoal = goal && coastal(view, goal) ? goal : null;
  const enemyShips = view.foreignUnits.filter((u) => enemies.includes(u.owner) && UNIT_TYPES[u.type].domain === "sea" && reach.has(at(view, u)));
  const enemyCoast = view.foreignCities.filter((c) => enemies.includes(c.owner) && coastal(view, c));
  const byReach = <T extends Point>(list: T[]) =>
    list
      .map((x) => ({ x, w: waterNextTo(view, reach, x) }))
      .filter((o) => o.w !== null)
      .sort((a, b) => reach.get(at(view, a.w!))! - reach.get(at(view, b.w!))!)[0];
  const shipTarget = byReach(enemyShips);
  const cityTarget = coastalGoal ? byReach([coastalGoal]) : byReach(enemyCoast);
  const next = shipTarget && (!cityTarget || reach.get(at(view, shipTarget.w!))! <= reach.get(at(view, cityTarget.w!))!) ? shipTarget : cityTarget;
  if (!next) return rest();
  // Next to the city: shell its defenders when the odds are fair.
  if (distance(s, next.x) <= 1) {
    const shell = attackNow(view, s, 0.5);
    return shell ? [shell] : [];
  }
  return sail(view, s, next.w!);
}

/**
 * A ship for soldiers during a landing: with soldiers aboard it sails to the
 * landing spot, empty it waits in the port where the army gathers. Null when
 * the ship is not needed for the landing.
 */
export function invasionShipCommands(view: PlayerView, s: Unit, invasion: Invasion): Command[] | null {
  if (s.fortified) return [{ type: "cancelOrders", unitId: s.id }];
  if (s.movesLeft <= 0) return [];
  const cargo = view.units.filter((u) => u.carriedBy === s.id);
  const soldiers = cargo.filter((u) => UNIT_TYPES[u.type].attack > 0 && !UNIT_TYPES[u.type].foundsCity);
  if (soldiers.length > 0) return sail(view, s, invasion.landing);
  if (cargo.length > 0) return null;
  // The empty ship nearest the port serves the landing; others go on with their own work.
  const ships = view.units.filter((u) => isTransport(u) && !view.units.some((c) => c.carriedBy === u.id));
  const nearest = ships.sort((a, b) => distance(a, invasion.port) - distance(b, invasion.port))[0];
  if (nearest?.id !== s.id) return null;
  return sail(view, s, invasion.port);
}

/** A soldier on a ship at the landing spot steps ashore. */
export function landingCommands(view: PlayerView, u: Unit, invasion: Invasion): Command[] {
  if (u.carriedBy === null || u.movesLeft <= 0) return [];
  if (distance(u, invasion.shore) > 1) return [];
  if (view.foreignUnits.some((f) => f.x === invasion.shore.x && f.y === invasion.shore.y)) return [];
  return [{ type: "move", unitId: u.id, to: invasion.shore }];
}
