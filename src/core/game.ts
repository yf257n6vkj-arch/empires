/**
 * Creating a game. Everything in the core is pure: the input state is never
 * modified, a new state is returned.
 */
import { applyCommand } from "./commands";
import type { GameEvent } from "./events";
import { DEFAULT_MAP_OPTIONS, generateMap, type MapOptions } from "./mapgen";
import { Rng } from "./rng";
import { mapOptionsFor, parseGameCode, type WorldSettings } from "./setup";
import { BUILDING_IDS, CIV_IDS, CIVS, RULES, TECH_IDS, TERRAINS, UNIT_TYPES, type BarbarianLevel, type CivId, type TechId } from "./rules";
import { distance, type Point } from "./geometry";
import { chooseStartPositions } from "./start";
import { canResearch, clampRate, fallbackProduction, fitRates, startingEconomy } from "./economy";
import { emptySpaceship, isBarbarian, STATE_VERSION, type GameState, type Player } from "./state";
import { makeUnit, reveal } from "./world";

export interface NewGameOptions {
  seed: string;
  /** Number of players including the human, who is always player 0. */
  playerCount: number;
  map?: MapOptions;
  /** World settings; when omitted they are read from the map code in `seed`. */
  world?: WorldSettings;
  /**
   * Whether computer players get starting units. Off until the AI exists,
   * so in phase 1 the human explores the continent alone.
   */
  opponentUnits?: boolean;
  /** Nation of the human player; a random one when omitted. */
  civ?: CivId;
  /** How many barbarians; none when omitted. */
  barbarians?: BarbarianLevel;
}

/** Scatters ruins over land away from the starts (mutates the map). */
function placeRuins(map: GameState["map"], starts: Point[], rng: Rng): void {
  const land: number[] = [];
  for (let i = 0; i < map.terrain.length; i++) {
    if (!TERRAINS[map.terrain[i]!].land || map.terrain[i] === "arctic") continue;
    const p = { x: i % map.width, y: Math.floor(i / map.width) };
    if (starts.some((s) => distance(s, p) < RULES.ruins.minStartDistance)) continue;
    land.push(i);
  }
  const count = Math.floor(map.terrain.filter((t) => TERRAINS[t].land).length / RULES.ruins.perLandTiles);
  for (const i of rng.shuffle(land).slice(0, count)) map.ruins[i] = 1;
}

/** The barbarian player: it sits last, knows the land and is at war with everybody. */
function barbarianPlayer(id: number, map: GameState["map"]): Player {
  return {
    id,
    civ: "barbarians",
    name: CIVS.barbarians.name,
    isHuman: false,
    start: { x: 0, y: 0 },
    explored: new Array<number>(map.width * map.height).fill(1),
    citiesFounded: 0,
    captured: 0,
    ...startingEconomy(),
    scienceRate: 0,
  };
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
  const world = options.world ?? parseGameCode(options.seed).world;
  const map = generateMap(rng.fork("map"), options.map ?? (world ? mapOptionsFor(world) : DEFAULT_MAP_OPTIONS));
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
    captured: 0,
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
    warming: 0,
    victory: null,
    barbarians: options.barbarians ?? "none",
  };
  placeRuins(map, starts, rng.fork("ruins"));
  if (state.barbarians !== "none") {
    const b = barbarianPlayer(players.length, map);
    for (const p of players) p.atWar.push(b.id);
    b.atWar = players.map((p) => p.id);
    players.push(b);
  }

  for (const player of players) {
    if (isBarbarian(player)) continue;
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
      if (c.production.kind === "building" && !(BUILDING_IDS as readonly string[]).includes(c.production.id)) {
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
  if (version <= 7) {
    // Version 8 adds production queues and standing orders for settlers.
    for (const u of state.units) u.orders ??= null;
    for (const c of state.cities) c.queue ??= [];
  }
  if (version <= 8) {
    // Version 9 adds special resources and more terrains; old maps have no specials.
    state.map.special ??= new Array<number>(state.map.width * state.map.height).fill(0);
  }
  if (version <= 9) {
    // Version 10 splits trade three ways; old games spent nothing on luxuries.
    for (const p of state.players) {
      p.luxuryRate ??= 0;
      // Taxes now have the same limit as science, so an old low science rate moves up.
      const fitted = fitRates(p.scienceRate, p.luxuryRate, p.government, "luxury");
      p.scienceRate = fitted.science;
      p.luxuryRate = fitted.luxury;
    }
  }
  if (version <= 10) {
    // Version 11 adds happy citizens, specialists, tile pollution and global warming.
    state.map.pollution ??= new Array<number>(state.map.width * state.map.height).fill(0);
    state.warming ??= 0;
    for (const c of state.cities) {
      c.taxmen ??= 0;
      c.scientists ??= 0;
      c.celebrating ??= false;
      c.disorderTurns ??= 0;
      c.soldTurn ??= null;
    }
  }
  if (version <= 11) {
    // Version 12 adds combat: hit points, veterans and defeated players.
    for (const u of state.units) {
      u.hp ??= UNIT_TYPES[u.type].hp;
      u.veteran ??= false;
    }
    for (const p of state.players) p.defeated ??= false;
  }
  if (version <= 12) {
    // Version 13 adds contact and war. Old games start at peace; everybody has met everybody seen so far.
    for (const p of state.players) {
      p.contacts ??= [];
      p.atWar ??= [];
    }
  }
  if (version <= 13) {
    // Version 14 adds the city governor.
    for (const c of state.cities) c.governor ??= null;
    // It also adds ruins and barbarians; older games have neither.
    state.map.ruins ??= new Array<number>(state.map.width * state.map.height).fill(0);
    state.barbarians ??= "none";
  }
  if (version <= 14) {
    // Version 15 counts conquered cities for the score and the guide; earlier conquests are not known.
    for (const p of state.players) p.captured ??= 0;
  }
  state.version = STATE_VERSION;
  return state;
}
