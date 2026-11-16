/**
 * Nuclear missiles. Michal chose that the AI uses them freely: in a war it
 * keeps a missile in its most productive city and fires it when the strike
 * can decide the fight, at the city its army is after or at a big enemy
 * city with many soldiers around. It never fires at a target with its own
 * cities or units in the blast, nor at a city it knows a missile shield
 * protects. Once somebody has the Manhattan Project, its biggest cities
 * build a missile shield.
 */
import { BUILDINGS, distance, RULES, UNIT_TYPES, type BuildingId, type City, type Command, type PlayerView, type UnitTypeId } from "../core";
import type { Unit } from "../core";
import { unitAvailable } from "./build";

/** Points a strike must be worth when it is not the army's target: enemy citizens lost plus two per soldier killed. */
const STRIKE_WORTH = 8;

function isMissile(id: UnitTypeId): boolean {
  return UNIT_TYPES[id].special === "nuclear";
}

export function missileType(view: PlayerView): UnitTypeId | null {
  return (Object.keys(UNIT_TYPES) as UnitTypeId[]).find((id) => isMissile(id) && unitAvailable(view, id)) ?? null;
}

/** A missile for the most productive city while the AI is at war and has none. */
export function missileProduction(view: PlayerView, city: City, enemies: number[]): UnitTypeId | null {
  if (enemies.length === 0) return null;
  const missile = missileType(view);
  if (!missile) return null;
  const have = view.units.filter((u) => isMissile(u.type)).length + view.cities.filter((c) => c.production.kind === "unit" && isMissile(c.production.id)).length;
  if (have > 0) return null;
  const best = [...view.cities].sort((a, b) => (view.cityShields[b.id] ?? 0) - (view.cityShields[a.id] ?? 0) || a.id - b.id)[0];
  return best?.id === city.id ? missile : null;
}

/** True when the AI knows a missile shield guards the point: a shield it saw through an embassy. */
function knownShield(view: PlayerView, at: { x: number; y: number }, owner: number): boolean {
  return view.foreignCities.some((c) => {
    if (c.owner === owner || !c.buildings.some((b) => (BUILDINGS[b as BuildingId].effects.nuclearShield ?? 0) > 0)) return false;
    const reach = Math.max(...c.buildings.map((b) => BUILDINGS[b as BuildingId].effects.nuclearShield ?? 0));
    return distance(c, at) <= reach;
  });
}

/** What a strike on the point is worth, or null when it would hit the AI itself. */
export function strikeWorth(view: PlayerView, at: { x: number; y: number }, enemies: number[]): number | null {
  const r = RULES.nuclearRadius;
  if (view.cities.some((c) => distance(c, at) <= r)) return null;
  if (view.units.some((u) => !isMissile(u.type) && distance(u, at) <= r)) return null;
  if (knownShield(view, at, view.playerId)) return null;
  let worth = 0;
  for (const c of view.foreignCities) {
    if (distance(c, at) > r) continue;
    // Hitting a city of a nation at peace would start a war nobody chose.
    if (!enemies.includes(c.owner)) return null;
    worth += c.size - Math.max(1, Math.floor(c.size / 2));
  }
  for (const u of view.foreignUnits) {
    if (distance(u, at) > r) continue;
    if (!enemies.includes(u.owner)) return null;
    if (UNIT_TYPES[u.type].attack > 0 || UNIT_TYPES[u.type].defense > 0) worth += 2;
  }
  return worth;
}

/**
 * A missile's turn: fire at the army's target when it is defended, or at the
 * enemy city where the blast does the most harm, if that is worth it;
 * otherwise wait in the own city nearest the enemy.
 */
export function missileCommands(view: PlayerView, u: Unit, enemies: number[], target: City | null): Command[] {
  if (u.fortified) return [{ type: "cancelOrders", unitId: u.id }];
  if (u.movesLeft <= 0 || enemies.length === 0) return [];
  const reach = Math.floor(u.movesLeft / RULES.movesFraction);
  const inCity = view.cities.some((c) => c.x === u.x && c.y === u.y);
  let best: { at: City; worth: number } | null = null;
  for (const c of view.foreignCities) {
    if (!enemies.includes(c.owner) || distance(u, c) > reach) continue;
    const worth = strikeWorth(view, c, enemies);
    if (worth === null) continue;
    const defended = view.foreignUnits.some((f) => f.x === c.x && f.y === c.y);
    const decisive = target?.id === c.id && defended;
    if ((decisive || worth >= STRIKE_WORTH) && (!best || worth > best.worth)) best = { at: c, worth };
  }
  if (best) return [{ type: "detonate", unitId: u.id, at: { x: best.at.x, y: best.at.y } }];
  if (!inCity) {
    const home = [...view.cities].sort((a, b) => distance(a, u) - distance(b, u))[0];
    return home ? [{ type: "goto", unitId: u.id, to: { x: home.x, y: home.y } }] : [];
  }
  // Move up to the city nearest the enemy, if the missile gets there this turn.
  const enemyCities = view.foreignCities.filter((c) => enemies.includes(c.owner));
  if (enemyCities.length === 0) return [];
  const closest = (p: { x: number; y: number }) => Math.min(...enemyCities.map((c) => distance(p, c)));
  const front = [...view.cities].sort((a, b) => closest(a) - closest(b))[0];
  if (front && closest(front) < closest(u) && distance(u, front) <= reach) return [{ type: "goto", unitId: u.id, to: { x: front.x, y: front.y } }];
  return [];
}

/** True when a missile shield is worth building in the city: somebody has the Manhattan Project and the city is among the AI's biggest. */
export function wantsShield(view: PlayerView, city: City): boolean {
  if (!view.builtWonders.includes("manhattanProject")) return false;
  const bigger = view.cities.filter((c) => c.size > city.size).length;
  return bigger < 2 && city.size >= 6;
}

export function isMissileUnit(u: Pick<Unit, "type">): boolean {
  return isMissile(u.type);
}
