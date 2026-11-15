/**
 * Creating a game. Everything in the core is pure: the input state is never
 * modified, a new state is returned.
 */
import { applyCommand } from "./commands";
import type { GameEvent } from "./events";
import { DEFAULT_MAP_OPTIONS, generateMap, type MapOptions } from "./mapgen";
import { Rng } from "./rng";
import { BUILDING_IDS, CIV_IDS, CIVS, RULES, TECH_IDS, type CivId, type TechId } from "./rules";
import { chooseStartPositions } from "./start";
import { canResearch, clampRate, fallbackProduction, startingEconomy } from "./economy";
import { emptySpaceship, STATE_VERSION, type GameState, type Player } from "./state";
import { makeUnit, reveal } from "./world";

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
  /** Nation of the human player; a random one when omitted. */
  civ?: CivId;
}

/**
 * Nations for a game: the human's choice first, then random nations whose
 * colours differ from all chosen ones, the way Civilization 1 kept colours apart.
 */
export function chooseCivs(human: CivId | undefined, count: number, rng: Rng): CivId[] {
  const chosen: CivId[] = [];
  const first = human ?? rng.pick(CIV_IDS);
  chosen.push(first);
  for (const civ of rng.shuffle(CIV_IDS)) {
    if (chosen.length >= count) break;
    if (chosen.some((c) => CIVS[c].colorGroup === CIVS[civ].colorGroup)) continue;
    chosen.push(civ);
  }
  return chosen;
}

export function newGame(options: NewGameOptions): GameState {
  const rng = Rng.fromSeed(options.seed);
  const map = generateMap(rng.fork("map"), options.map ?? DEFAULT_MAP_OPTIONS);
  const starts = chooseStartPositions(map, options.playerCount, rng.fork("starts"));

  const civs = chooseCivs(options.civ, starts.length, rng.fork("civs"));
  const players: Player[] = starts.map((start, id) => ({
    id,
    civ: civs[id]!,
    name: CIVS[civs[id]!].name,
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
    victory: null,
  };

  for (const player of players) {
    reveal(state, player.id, player.start, RULES.unitSight);
    if (!player.isHuman && !options.opponentUnits) continue;
    for (const type of RULES.startingUnits) state.units.push(makeUnit(state.nextId++, player.id, type, player.start, null));
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
 * that is not possible. Each step lifts the save by one or more versions.
 */
export function migrateState(saved: { version?: number } & Record<string, unknown>): GameState | null {
  if (saved.version === STATE_VERSION) return saved as unknown as GameState;
  const version = saved.version ?? 0;
  if (version < 2 || version > STATE_VERSION) return null;
  const state = JSON.parse(JSON.stringify(saved)) as GameState;

  if (version === 2) state.players = state.players.map((p) => ({ ...startingEconomy(), ...p }));
  if (version <= 3) {
    // Version 4 has the full tree of phase 2b. Renamed technologies keep their
    // place, ones that no longer exist are dropped, research in progress stays.
    const renamed: Record<string, TechId | undefined> = { scholarship: "university", industry: "industrialization" };
    const fix = (t: string): TechId | null => {
      const id = renamed[t] ?? t;
      return (TECH_IDS as readonly string[]).includes(id) ? (id as TechId) : null;
    };
    for (const p of state.players) {
      p.techs = p.techs.map(fix).filter((t): t is TechId => t !== null);
      p.researching = p.researching === null ? null : fix(p.researching);
      if (p.researching && !canResearch(p, p.researching)) p.researching = null;
      p.researchGoal = null;
    }
    for (const c of state.cities) c.manualTiles = false;
  }
  if (version <= 4) {
    // Version 5 adds the palace: the oldest city of every player becomes the capital.
    for (const p of state.players) {
      const own = state.cities.filter((c) => c.owner === p.id);
      if (own.length > 0 && !own.some((c) => c.buildings.includes("palace"))) {
        const oldest = own.reduce((a, b) => (b.foundedTurn < a.foundedTurn || (b.foundedTurn === a.foundedTurn && b.id < a.id) ? b : a));
        oldest.buildings.unshift("palace");
      }
    }
  }
  if (version <= 5) {
    // Version 6 adds governments, ships, railroads, the spaceship and trade routes.
    // The last wonder made way for the spaceship and is dropped.
    const zeros = () => new Array<number>(state.map.width * state.map.height).fill(0);
    state.map.railroad ??= zeros();
    state.map.fortress ??= zeros();
    for (const p of state.players) {
      p.government ??= "despotism";
      p.revolution ??= null;
      p.spaceship ??= emptySpaceship();
      p.embassies ??= [];
      p.scienceRate = clampRate(p.scienceRate, p.government);
    }
    for (const u of state.units) {
      u.carriedBy ??= null;
      u.turnsAloft ??= 0;
    }
    for (const c of state.cities) {
      c.tradeRoutes ??= [];
      c.stolenBy ??= [];
      c.buildings = c.buildings.filter((b) => (BUILDING_IDS as readonly string[]).includes(b));
      if (!(BUILDING_IDS as readonly string[]).includes(c.production.id) && c.production.kind === "building") {
        c.production = fallbackProduction(state, c.owner);
      }
    }
    state.victory ??= null;
  }
  if (version <= 6) {
    // Version 7 adds nations. Old games get fixed ones with different colours;
    // cities keep the names they already have.
    const fixed: CivId[] = ["czechs", "romans", "germans", "egyptians", "greeks", "zulus", "indians", "chinese"];
    state.players = state.players.map((p, i) => {
      const civ = p.civ ?? fixed[i % fixed.length]!;
      return { ...p, civ, name: CIVS[civ].name };
    });
  }
  state.version = STATE_VERSION;
  return state;
}
