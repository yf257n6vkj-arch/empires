/**
 * Creating a game and advancing turns. Everything here is pure: the input
 * state is never modified, a new state is returned.
 */
import { tilesInRadius } from "./geometry";
import { DEFAULT_MAP_OPTIONS, generateMap, type MapOptions } from "./mapgen";
import { Rng } from "./rng";
import { chooseStartPositions } from "./start";
import { STATE_VERSION, type GameState, type Player } from "./state";

export interface NewGameOptions {
  seed: string;
  /** Number of players including the human, who is always player 0. */
  playerCount: number;
  map?: MapOptions;
}

/** Radius a starting player has already seen (a unit sees 1 tile around it). */
export const START_SIGHT = 1;

export function newGame(options: NewGameOptions): GameState {
  const rng = Rng.fromSeed(options.seed);
  const map = generateMap(rng.fork("map"), options.map ?? DEFAULT_MAP_OPTIONS);
  const starts = chooseStartPositions(map, options.playerCount, rng.fork("starts"));

  const players: Player[] = starts.map((start, id) => {
    const explored = new Array<number>(map.width * map.height).fill(0);
    for (const i of tilesInRadius(map, start, START_SIGHT)) explored[i] = 1;
    return {
      id,
      name: id === 0 ? "Hráč" : `Soupeř ${id}`,
      isHuman: id === 0,
      start,
      explored,
    };
  });

  return {
    version: STATE_VERSION,
    seed: options.seed,
    rng: rng.getState(),
    turn: 1,
    map,
    players,
  };
}

/** Placeholder for the turn function; phase 1 adds units, cities and commands. */
export function endTurn(state: GameState): GameState {
  return { ...state, turn: state.turn + 1 };
}
