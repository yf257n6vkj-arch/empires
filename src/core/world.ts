/**
 * Small helpers for reading and updating the world. Functions that take a
 * `draft` mutate it and must only be called on a fresh copy made by
 * `cloneState`, never on a state somebody else holds.
 */
import { cityRadiusTiles, distance, inBounds, neighbors8, tilesInRadius, type Point } from "./geometry";
import { CIVS, IMPROVEMENTS, RULES, TERRAINS, UNIT_TYPES, type ImprovementId, type UnitDomain, type Yield } from "./rules";
import type { City, GameMap, GameState, Player, PlayerId, Unit } from "./state";

export function cloneState(state: GameState): GameState {
  return JSON.parse(JSON.stringify(state)) as GameState;
}

export function idx(map: { width: number }, p: Point): number {
  return p.y * map.width + p.x;
}

export function getPlayer(state: GameState, id: PlayerId): Player {
  const player = state.players[id];
  if (!player) throw new Error(`Unknown player ${id}`);
  return player;
}

export function cityAt(state: GameState, p: Point): City | undefined {
  return state.cities.find((c) => c.x === p.x && c.y === p.y);
}

export function unitsAt(state: GameState, p: Point): Unit[] {
  return state.units.filter((u) => u.x === p.x && u.y === p.y);
}

export function fullMoves(unit: Unit): number {
  return UNIT_TYPES[unit.type].moves * RULES.movesFraction;
}

/** A new unit with no orders and full movement. */
export function makeUnit(id: number, owner: PlayerId, type: Unit["type"], at: Point, homeCity: City["id"] | null): Unit {
  const unit: Unit = {
    id,
    owner,
    type,
    x: at.x,
    y: at.y,
    movesLeft: 0,
    homeCity,
    fortified: false,
    work: null,
    goto: null,
    orders: null,
    carriedBy: null,
    turnsAloft: 0,
    hp: UNIT_TYPES[type].hp,
    veteran: false,
  };
  unit.movesLeft = fullMoves(unit);
  return unit;
}

/** Marks tiles around `center` as explored for `player` (mutates the draft). */
export function reveal(draft: GameState, player: PlayerId, center: Point, radius: number): void {
  const explored = getPlayer(draft, player).explored;
  for (const i of tilesInRadius(draft.map, center, radius)) explored[i] = 1;
}

export function hasRoad(state: GameState, p: Point): boolean {
  return state.map.road[idx(state.map, p)] === 1 || cityAt(state, p) !== undefined;
}

/** Cities count as railroad stations, so a railroad leading to a city is free to use. */
export function hasRailroad(state: GameState, p: Point): boolean {
  return state.map.railroad[idx(state.map, p)] === 1 || cityAt(state, p) !== undefined;
}

export function domainOf(unit: Pick<Unit, "type">): UnitDomain {
  return UNIT_TYPES[unit.type].domain;
}

/** True when some land tile touches `p` (or `p` is land itself). */
export function touchesLand(state: GameState, p: Point): boolean {
  const i = idx(state.map, p);
  const land = (t: number) => {
    const terrain = state.map.terrain[t];
    return terrain !== undefined && TERRAINS[terrain].land;
  };
  return land(i) || neighbors8(state.map, i).some(land);
}

/**
 * Movement cost in fractions of a move from `from` to the adjacent tile `to`
 * for a unit of the given domain, or null when it cannot go there at all.
 * Land units walk over land; boarding a ship is checked by the move rules.
 * Ships sail on the ocean and into cities on the coast. Aircraft fly anywhere.
 */
export function moveCost(state: GameState, from: Point, to: Point, domain: UnitDomain = "land"): number | null {
  if (!inBounds(state.map, to.x, to.y) || distance(from, to) !== 1) return null;
  const terrain = state.map.terrain[idx(state.map, to)];
  if (!terrain) return null;
  if (domain === "air") return RULES.movesFraction;
  if (domain === "sea") {
    if (!TERRAINS[terrain].land) return RULES.movesFraction;
    return cityAt(state, to) ? RULES.movesFraction : null;
  }
  if (!TERRAINS[terrain].land) return null;
  if (hasRailroad(state, from) && hasRailroad(state, to) && (state.map.railroad[idx(state.map, from)] || state.map.railroad[idx(state.map, to)])) return 0;
  if (hasRoad(state, from) && hasRoad(state, to)) return RULES.roadMoveCost;
  return TERRAINS[terrain].moveCost * RULES.movesFraction;
}

/** Yield of one tile, including improvements. City centres get a free road and irrigation. */
export function tileYield(map: GameMap, index: number, isCityCenter: boolean): Yield {
  const terrain = map.terrain[index];
  if (!terrain) return { food: 0, shields: 0, trade: 0 };
  const t = TERRAINS[terrain];
  const result: Yield = { food: t.food, shields: t.shields, trade: t.trade };
  const add = (improvement: ImprovementId) => {
    const bonus = IMPROVEMENTS[improvement].bonus[terrain];
    if (!bonus) return;
    result.food += bonus.food ?? 0;
    result.shields += bonus.shields ?? 0;
    result.trade += bonus.trade ?? 0;
  };
  const special = TERRAINS[terrain].special;
  if (special && map.special?.[index]) {
    result.food += special.food ?? 0;
    result.shields += special.shields ?? 0;
    result.trade += special.trade ?? 0;
  }
  if (map.road[index] || isCityCenter) add("road");
  if (map.irrigation[index] || (isCityCenter && !map.mine[index])) add("irrigation");
  if (map.mine[index]) add("mine");
  if (map.railroad[index]) result.shields = Math.floor((result.shields * (100 + (IMPROVEMENTS.railroad.shieldsPct ?? 0))) / 100);
  // Pollution halves everything the tile gives until a settler cleans it.
  if (map.pollution?.[index]) {
    result.food = Math.floor(result.food / 2);
    result.shields = Math.floor(result.shields / 2);
    result.trade = Math.floor(result.trade / 2);
  }
  if (isCityCenter) result.shields = Math.max(result.shields, RULES.cityCenterMinShields);
  return result;
}

/** Tiles a city could work: its radius minus the centre, explored by the owner and not used by another city. */
export function workableTiles(state: GameState, city: City): number[] {
  const explored = getPlayer(state, city.owner).explored;
  const center = idx(state.map, city);
  const takenByOthers = new Set<number>();
  for (const other of state.cities) {
    if (other.id === city.id) continue;
    takenByOthers.add(idx(state.map, other));
    for (const i of other.worked) takenByOthers.add(i);
  }
  return cityRadiusTiles(state.map, city).filter(
    (i) => i !== center && explored[i] === 1 && !takenByOthers.has(i),
  );
}

/**
 * Name for the player's next city: the nation's own list first, then the
 * shared list of made-up names, then numbered repeats.
 */
export function cityName(player: Player, index: number, names: readonly string[]): string {
  const own = CIVS[player.civ]?.cities ?? [];
  if (index < own.length) return own[index]!;
  const rest = index - own.length;
  const offset = player.id * 6;
  const base = names[(offset + rest) % names.length] ?? `Město ${index + 1}`;
  const round = Math.floor((offset + rest) / names.length);
  return round === 0 ? base : `${base} ${round + 1}`;
}
