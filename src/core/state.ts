/**
 * The whole game state as one plain, JSON-serialisable object.
 * A turn is a function from the old state and commands to a new state.
 */
import type { Point } from "./geometry";
import type { BuildingId, ImprovementId, TechId, TerrainId, UnitTypeId } from "./rules";
import type { RngState } from "./rng";

export const STATE_VERSION = 4;

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
}

export type PlayerId = number;
export type UnitId = number;
export type CityId = number;

export interface Player {
  id: PlayerId;
  name: string;
  isHuman: boolean;
  /** Where the player starts. */
  start: Point;
  /** 1 = the player has seen this tile at least once. */
  explored: number[];
  /** How many city names the player has used, for naming the next city. */
  citiesFounded: number;
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
}

export interface WorkOrder {
  improvement: ImprovementId;
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
}

export type ProductionItem =
  | { kind: "unit"; id: UnitTypeId }
  | { kind: "building"; id: BuildingId };

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
  buildings: BuildingId[];
  /** Tile indexes worked by citizens; the city centre is always worked on top of these. */
  worked: number[];
  /**
   * True when the owner chose the worked tiles by hand. The choice holds until
   * the city grows or shrinks, then the city places citizens itself again.
   */
  manualTiles: boolean;
  foundedTurn: number;
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
}
