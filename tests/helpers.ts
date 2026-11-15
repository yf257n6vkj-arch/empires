import { startingEconomy, STATE_VERSION, type GameState, type TerrainId, type Unit, type UnitTypeId } from "../src/core";
import { Rng, fullMoves } from "../src/core";

const LEGEND: Record<string, TerrainId> = {
  "~": "ocean",
  ".": "grassland",
  ",": "plains",
  f: "forest",
  h: "hills",
  M: "mountains",
  d: "desert",
};

/**
 * Builds a small hand-made state from an ASCII map, for precise rule tests.
 * All tiles are explored by player 0.
 */
export function stateFromAscii(rows: string[], players = 1): GameState {
  const height = rows.length;
  const width = rows[0]!.length;
  const terrain = rows.join("").split("").map((ch) => {
    const t = LEGEND[ch];
    if (!t) throw new Error(`Unknown map char "${ch}"`);
    return t;
  });
  const zeros = () => new Array<number>(width * height).fill(0);
  return {
    version: STATE_VERSION,
    seed: "test",
    rng: Rng.fromSeed("test").getState(),
    turn: 1,
    currentPlayer: 0,
    nextId: 100,
    map: { width, height, terrain, road: zeros(), irrigation: zeros(), mine: zeros(), railroad: zeros(), fortress: zeros(), special: zeros() },
    players: Array.from({ length: players }, (_, id) => ({
      id,
      civ: (["czechs", "romans", "germans", "egyptians", "greeks", "zulus"] as const)[id % 6]!,
      name: `P${id}`,
      isHuman: id === 0,
      start: { x: 0, y: 0 },
      explored: id === 0 ? new Array<number>(width * height).fill(1) : zeros(),
      citiesFounded: 0,
      ...startingEconomy(),
    })),
    units: [],
    cities: [],
    victory: null,
  };
}

export function addUnit(state: GameState, type: UnitTypeId, x: number, y: number, owner = 0): Unit {
  const unit: Unit = {
    id: state.nextId++,
    owner,
    type,
    x,
    y,
    movesLeft: 0,
    homeCity: null,
    fortified: false,
    work: null,
    goto: null,
    orders: null,
    carriedBy: null,
    turnsAloft: 0,
  };
  unit.movesLeft = fullMoves(unit);
  state.units.push(unit);
  return unit;
}

export function unit(state: GameState, id: number): Unit {
  const u = state.units.find((x) => x.id === id);
  if (!u) throw new Error(`unit ${id} missing`);
  return u;
}
