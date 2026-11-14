/**
 * Creating a game. Everything in the core is pure: the input state is never
 * modified, a new state is returned.
 */
import { applyCommand } from "./commands";
import type { GameEvent } from "./events";
import { DEFAULT_MAP_OPTIONS, generateMap, type MapOptions } from "./mapgen";
import { Rng } from "./rng";
import { RULES } from "./rules";
import { chooseStartPositions } from "./start";
import { startingEconomy } from "./economy";
import { STATE_VERSION, type GameState, type Player, type Unit } from "./state";
import { fullMoves, reveal } from "./world";

export interface NewGameOptions {
  seed: string;
  /** Number of players including the human, who is always player 0. */
  playerCount: number;
  map?: MapOptions;
  /**
   * Whether computer players get starting units. Off until the AI exists,
   * so in phase 1 the human explores the continent alone.
   */
  opponentUnits?: boolean;
}

export function newGame(options: NewGameOptions): GameState {
  const rng = Rng.fromSeed(options.seed);
  const map = generateMap(rng.fork("map"), options.map ?? DEFAULT_MAP_OPTIONS);
  const starts = chooseStartPositions(map, options.playerCount, rng.fork("starts"));

  const players: Player[] = starts.map((start, id) => ({
    id,
    name: id === 0 ? "Hráč" : `Soupeř ${id}`,
    isHuman: id === 0,
    start,
    explored: new Array<number>(map.width * map.height).fill(0),
    citiesFounded: 0,
    ...startingEconomy(),
  }));

  const state: GameState = {
    version: STATE_VERSION,
    seed: options.seed,
    rng: rng.getState(),
    turn: 1,
    currentPlayer: 0,
    nextId: 1,
    map,
    players,
    units: [],
    cities: [],
  };

  for (const player of players) {
    reveal(state, player.id, player.start, RULES.unitSight);
    if (!player.isHuman && !options.opponentUnits) continue;
    for (const type of RULES.startingUnits) {
      const unit: Unit = {
        id: state.nextId++,
        owner: player.id,
        type,
        x: player.start.x,
        y: player.start.y,
        movesLeft: 0,
        homeCity: null,
        fortified: false,
        work: null,
        goto: null,
      };
      unit.movesLeft = fullMoves(unit);
      state.units.push(unit);
    }
  }
  return state;
}

/**
 * Ends the turns of all computer players until a human is on turn again.
 * Placeholder until the AI exists: computer players do nothing yet.
 */
export function passComputerTurns(state: GameState): { state: GameState; events: GameEvent[] } {
  let current = state;
  const events: GameEvent[] = [];
  let guard = current.players.length;
  while (!current.players[current.currentPlayer]?.isHuman && guard-- > 0) {
    const result = applyCommand(current, { type: "endTurn" });
    if (!result.ok) break;
    current = result.state;
    events.push(...result.events);
  }
  return { state: current, events };
}

/**
 * Brings a saved game from an older version up to date, or returns null when
 * that is not possible. Version 2 saves only lack the economy of phase 2.
 */
export function migrateState(saved: { version?: number } & Record<string, unknown>): GameState | null {
  if (saved.version === STATE_VERSION) return saved as unknown as GameState;
  if (saved.version === 2) {
    const state = JSON.parse(JSON.stringify(saved)) as GameState;
    state.version = STATE_VERSION;
    state.players = state.players.map((p) => ({ ...startingEconomy(), ...p }));
    return state;
  }
  return null;
}
