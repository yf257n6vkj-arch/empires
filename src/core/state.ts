/**
 * The whole game state as one plain, JSON-serialisable object.
 * A turn is a function from the old state and commands to a new state.
 */
import type { Point } from "./geometry";
import type { GovernorGoal } from "./governor";
import type { BarbarianLevel, BuildingId, Difficulty, CivId, GovernmentId, ImprovementId, NationId, TechId, TerrainId, UnitTypeId } from "./rules";
import type { RngState } from "./rng";

export const STATE_VERSION = 17;

export interface GameMap {
  width: number;
  height: number;
  /** Terrain per tile, index = y * width + x. */
  terrain: TerrainId[];
  /** 1 = the tile has a road. */
  road: number[];
  /** 1 = the tile is irrigated. Irrigation and mine exclude each other. */
  irrigation: number[];
  /** 1 = the tile has a mine. */
  mine: number[];
  /** 1 = the tile has a railroad (always on top of a road). */
  railroad: number[];
  /** 1 = the tile has a fortress. */
  fortress: number[];
  /** 1 = the tile has its terrain's special resource (fish, horses, gold...). */
  special: number[];
  /** 1 = the tile is polluted and gives half its yield until a settler cleans it. */
  pollution: number[];
  /** 1 = ruins of an old town lie here; the first land unit to enter finds what is left. */
  ruins: number[];
}

export type PlayerId = number;
export type UnitId = number;
export type CityId = number;

export interface Player {
  id: PlayerId;
  /** The nation the player leads; it gives the name, colour and city names. */
  /** Nation; "barbarians" for the barbarian player, which plays no seat. */
  civ: NationId;
  /** Name of the nation in plural, "Češi". */
  name: string;
  isHuman: boolean;
  /** Where the player starts. */
  start: Point;
  /** 1 = the player has seen this tile at least once. */
  explored: number[];
  /** How many city names the player has used, for naming the next city. */
  citiesFounded: number;
  /** Enemy cities this player has taken or razed. */
  captured: number;
  /** Technologies the player knows, in the order they were learned. */
  techs: TechId[];
  /** Technology being researched, null = the player has to choose. */
  researching: TechId | null;
  /** Technology the player is heading for; the next step is chosen automatically. */
  researchGoal: TechId | null;
  /** Science collected towards the next technology. */
  research: number;
  gold: number;
  /** Share of trade that goes to science, in percent; the rest is gold. */
  scienceRate: number;
  /** Share of trade spent on luxuries in percent; the rest of trade after science and luxuries is taxes. */
  luxuryRate: number;
  government: GovernmentId;
  /** A revolution in progress: anarchy until turnsLeft reaches 0, then `target`. */
  revolution: { target: GovernmentId; turnsLeft: number } | null;
  spaceship: Spaceship;
  /** Players whose capital hosts an embassy of this player. */
  embassies: PlayerId[];
  /** The player lost the last city and is out of the game. */
  defeated: boolean;
  /** Players this one has met: their units or cities have been in sight. */
  contacts: PlayerId[];
  /** Players this one is at war with; the list is kept the same on both sides. */
  atWar: PlayerId[];
  /** Players who offered this one peace and wait for an answer; the offer lapses at the end of this player's turn. */
  peaceOffers: PlayerId[];
  /** Turn the war with each player began, keyed by player id. */
  warSince: Record<string, number>;
  /** Turn of the last peace with each player, keyed by player id. */
  peaceSince: Record<string, number>;
  /** How many times each player has declared war on this one, keyed by player id. */
  declaredOnMe: Record<string, number>;
  /** Turn this player last offered peace to each player, keyed by player id. */
  offeredPeace: Record<string, number>;
  /** Peace treaties this player broke by declaring war too soon; every nation hears of it. */
  treatiesBroken: number;
}

export interface Spaceship {
  structural: number;
  component: number;
  module: number;
  /** Turn of the launch, null while the ship is on the ground. */
  launchedTurn: number | null;
  arrivalTurn: number | null;
  /** Chance of a safe landing in percent, fixed at launch. */
  successPct: number;
}

export function emptySpaceship(): Spaceship {
  return { structural: 0, component: 0, module: 0, launchedTurn: null, arrivalTurn: null, successPct: 0 };
}

/**
 * Standing orders for a unit that builds improvements: build a road or
 * railroad along the whole way to a tile, or improve the land around the
 * owner's cities on its own. They are carried out at the start of each turn.
 */
export type WorkerOrder =
  | { kind: "route"; to: Point; improvement: "road" | "railroad" }
  | { kind: "auto"; target: Point | null };

/** What a settler can work on: an improvement, or cleaning up pollution. */
export type WorkKind = ImprovementId | "clean";

export interface WorkOrder {
  improvement: WorkKind;
  /** Turns of work done so far. */
  progress: number;
}

export interface Unit {
  id: UnitId;
  owner: PlayerId;
  type: UnitTypeId;
  x: number;
  y: number;
  /** Movement left this turn, in fractions (see RULES.movesFraction). */
  movesLeft: number;
  /** City that pays upkeep, null for starting units. */
  homeCity: CityId | null;
  fortified: boolean;
  /** Settler building an improvement on its tile. */
  work: WorkOrder | null;
  /** Multi-turn move target, continued at the start of every turn. */
  goto: Point | null;
  /** Standing orders of a settler, see WorkerOrder. */
  orders: WorkerOrder | null;
  /** The ship (or carrier) this unit travels on. */
  carriedBy: UnitId | null;
  /** Turns an aircraft has ended away from a city or carrier. */
  turnsAloft: number;
  /** Hit points left; a healthy unit has the full hp of its type. */
  hp: number;
  /** Veterans attack and defend better; units from a city with barracks start as veterans. */
  veteran: boolean;
}

export type ProductionItem =
  | { kind: "unit"; id: UnitTypeId }
  | { kind: "building"; id: BuildingId }
  /** Build nothing: the city's shields turn into gold every turn. */
  | { kind: "wealth" };

export interface City {
  id: CityId;
  owner: PlayerId;
  name: string;
  x: number;
  y: number;
  size: number;
  /** Food stored towards the next citizen. */
  food: number;
  /** Shields stored towards the current production. */
  shields: number;
  production: ProductionItem;
  /** What to build after the current production, in order. */
  queue: ProductionItem[];
  buildings: BuildingId[];
  /** Tile indexes worked by citizens; the city centre is always worked on top of these. */
  worked: number[];
  /**
   * True when the owner chose the worked tiles by hand. The choice holds until
   * the city grows or shrinks, then the city places citizens itself again.
   */
  manualTiles: boolean;
  foundedTurn: number;
  /** Cities this one trades with; each route brings trade every turn. */
  tradeRoutes: CityId[];
  /** Players whose diplomats already stole a technology here. */
  stolenBy: PlayerId[];
  /** Citizens off the fields who collect taxes or do research instead of entertaining. */
  taxmen: number;
  scientists: number;
  /** The city celebrated at the end of its owner's last turn; the gains apply now. */
  celebrating: boolean;
  /** Turns in a row the city has ended in disorder. */
  disorderTurns: number;
  /** Goal of the city governor, null when the owner runs the city alone. */
  governor: GovernorGoal | null;
  /** Turn when the owner last sold a building here; one sale per turn. */
  soldTurn: number | null;
}

export interface GameState {
  version: number;
  seed: string;
  /** Generator state after the last random draw, so saves continue identically. */
  rng: RngState;
  turn: number;
  /** Player whose turn it is. Turns are sequential. */
  currentPlayer: PlayerId;
  nextId: number;
  map: GameMap;
  players: Player[];
  units: Unit[];
  cities: City[];
  /** Global warming counter: grows with polluted tiles, warming strikes at RULES.warmingLimit. */
  warming: number;
  /** Set when somebody has won; the game can go on, but the result stays. */
  victory: { player: PlayerId; kind: "space" | "conquest" | "score"; turn: number } | null;
  /** How many barbarians the game has; with any, the last player is the barbarians. */
  barbarians: BarbarianLevel;
  /** How strong the computer players are. */
  difficulty: Difficulty;
}

/** True for the barbarian player. */
export function isBarbarian(player: { civ: NationId } | undefined): boolean {
  return player?.civ === "barbarians";
}

/** Id of the barbarian player, or null when the game has none. */
export function barbarianId(state: Pick<GameState, "players">): PlayerId | null {
  const p = state.players.find((x) => x.civ === "barbarians");
  return p ? p.id : null;
}
