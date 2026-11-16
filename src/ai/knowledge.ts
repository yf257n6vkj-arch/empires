/**
 * What the AI works out from its PlayerView: the value of tiles, which land
 * hangs together, where the explored world ends. Everything here reads only
 * the view, so the AI knows no more than a human in its seat.
 */
import { cityRadiusTiles, neighbors8, TERRAINS, tileYield, toIndex, UNIT_TYPES, type City, type Point, type PlayerView, type TerrainId, type Unit } from "../core";

export function at(view: PlayerView, p: Point): number {
  return toIndex(view, p.x, p.y);
}

export function pointOf(view: PlayerView, i: number): Point {
  return { x: i % view.width, y: Math.floor(i / view.width) };
}

/** Land a city could stand on: known, not sea and not polar ice. */
export function isLand(view: PlayerView, i: number): boolean {
  const t = view.terrain[i];
  return t !== null && t !== undefined && TERRAINS[t].land && t !== "arctic";
}

export function isSea(view: PlayerView, i: number): boolean {
  const t = view.terrain[i];
  return t !== null && t !== undefined && !TERRAINS[t].land;
}

/** What a worked tile is worth to a city, food first: food × 1.5 + shields + trade / 2. */
export function tileValue(view: PlayerView, i: number): number {
  const t = view.terrain[i] as TerrainId | null;
  if (!t) return 0;
  const rule = TERRAINS[t];
  let food = rule.food;
  let shields = rule.shields;
  let trade = rule.trade;
  if (view.special[i] && rule.special) {
    food += rule.special.food ?? 0;
    shields += rule.special.shields ?? 0;
    trade += rule.special.trade ?? 0;
  }
  const value = food * 1.5 + shields + trade * 0.5;
  // Sea gives little without a harbour.
  return rule.land ? value : value * 0.6;
}

/** All cities the player knows, own and foreign. */
export function knownCities(view: PlayerView): City[] {
  return [...view.cities, ...view.foreignCities];
}

/**
 * Connected pieces of known land, 8 neighbours apart. Returns a label per
 * tile, -1 for sea and unknown tiles.
 */
export function landmasses(view: PlayerView): Int32Array {
  const label = new Int32Array(view.width * view.height).fill(-1);
  let next = 0;
  for (let start = 0; start < label.length; start++) {
    if (label[start] !== -1 || !isLand(view, start)) continue;
    const stack = [start];
    label[start] = next;
    while (stack.length > 0) {
      const i = stack.pop()!;
      for (const n of neighbors8(view, i)) {
        if (label[n] === -1 && isLand(view, n)) {
          label[n] = next;
          stack.push(n);
        }
      }
    }
    next++;
  }
  return label;
}

/** Known tiles next to unexplored ones: where exploring goes next. */
export function frontier(view: PlayerView, land: boolean): number[] {
  const result: number[] = [];
  for (let i = 0; i < view.terrain.length; i++) {
    if (land ? !isLand(view, i) : !isSea(view, i)) continue;
    if (neighbors8(view, i).some((n) => view.terrain[n] === null)) result.push(i);
  }
  return result;
}

export function isMilitary(u: Pick<Unit, "type">): boolean {
  const rule = UNIT_TYPES[u.type];
  return rule.attack > 0 && rule.domain === "land" && !rule.special;
}

export function isSettler(u: Pick<Unit, "type">): boolean {
  return UNIT_TYPES[u.type].foundsCity;
}

/** Sea tiles within a city's reach: a coastal city can build ships. */
export function coastal(view: PlayerView, c: Point): boolean {
  return neighbors8(view, at(view, c)).some((n) => isSea(view, n));
}

/** Tiles a city on this spot would work. */
export function radius(view: PlayerView, c: Point): number[] {
  return cityRadiusTiles(view, c);
}

/**
 * A route over known water from `from` to `to`, own ports included. With
 * `hugCoast` every step touches land, so a trireme never ends a turn on the
 * open sea where it could sink. Returns the tiles to step on, or null.
 */
export function seaPath(view: PlayerView, from: Point, to: Point, hugCoast: boolean): Point[] | null {
  const ports = new Set(view.cities.map((c) => at(view, c)));
  const start = at(view, from);
  const goal = at(view, to);
  const ok = (i: number) => {
    if (i === goal && ports.has(i)) return true;
    if (ports.has(i)) return true;
    if (!isSea(view, i)) return false;
    return !hugCoast || neighbors8(view, i).some((n) => isLand(view, n));
  };
  const came = new Map<number, number>([[start, -1]]);
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    if (i === goal) break;
    for (const n of neighbors8(view, i)) {
      if (came.has(n) || !ok(n)) continue;
      came.set(n, i);
      queue.push(n);
    }
  }
  if (!came.has(goal)) return null;
  const path: Point[] = [];
  for (let i = goal; i !== start; i = came.get(i)!) path.unshift(pointOf(view, i));
  return path;
}

/** Water tiles reachable from a ship, with the number of steps. */
export function seaReach(view: PlayerView, from: Point, hugCoast: boolean): Map<number, number> {
  const ports = new Set(view.cities.map((c) => at(view, c)));
  const start = at(view, from);
  const steps = new Map<number, number>([[start, 0]]);
  const queue = [start];
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    for (const n of neighbors8(view, i)) {
      if (steps.has(n)) continue;
      if (!ports.has(n) && !(isSea(view, n) && (!hugCoast || neighbors8(view, n).some((m) => isLand(view, m))))) continue;
      steps.set(n, steps.get(i)! + 1);
      queue.push(n);
    }
  }
  return steps;
}

/** Food a city founded on the tile would get from its centre, from what the player has seen of the tile. */
export function centerFood(view: PlayerView, i: number): number {
  const map = { width: view.width, height: view.height, terrain: view.terrain as TerrainId[], road: view.road, irrigation: view.irrigation, mine: view.mine, railroad: view.railroad, fortress: view.fortress, special: view.special, pollution: view.pollution, ruins: view.ruins };
  return tileYield(map, i, true).food;
}
