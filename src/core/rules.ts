/**
 * Game rules loaded from the data files in ./data.
 * Numbers live in JSON so they can be tuned without touching the code.
 */
import buildingData from "./data/buildings.json";
import cityNameData from "./data/city-names.json";
import gameData from "./data/game.json";
import improvementData from "./data/improvements.json";
import terrainData from "./data/terrain.json";
import unitData from "./data/units.json";

export const TERRAIN_IDS = [
  "ocean",
  "grassland",
  "plains",
  "forest",
  "hills",
  "mountains",
  "desert",
] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const UNIT_TYPE_IDS = ["settlers", "warriors"] as const;
export type UnitTypeId = (typeof UNIT_TYPE_IDS)[number];

export const BUILDING_IDS = ["granary"] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export const IMPROVEMENT_IDS = ["road", "irrigation", "mine"] as const;
export type ImprovementId = (typeof IMPROVEMENT_IDS)[number];

export interface Yield {
  food: number;
  shields: number;
  trade: number;
}

export interface TerrainRule extends Yield {
  id: TerrainId;
  name: string;
  moveCost: number;
  /** Percent bonus for the defender, e.g. 50 means x1.5. */
  defenseBonus: number;
  land: boolean;
}

export interface UnitRule {
  id: UnitTypeId;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  moves: number;
  foundsCity: boolean;
  buildsImprovements: boolean;
  /** Citizens the city loses when the unit is completed. */
  populationCost: number;
  /** Food per turn the home city pays for the unit. */
  foodUpkeep: number;
}

export interface BuildingRule {
  id: BuildingId;
  name: string;
  cost: number;
  upkeep: number;
  keepFoodOnGrowth: number;
}

export interface ImprovementRule {
  id: ImprovementId;
  name: string;
  /** Work turns per terrain; terrain missing here cannot get the improvement. */
  turns: Partial<Record<TerrainId, number>>;
  bonus: Partial<Record<TerrainId, Partial<Yield>>>;
}

export interface GameConstants {
  maxTurns: number;
  movesFraction: number;
  roadMoveCost: number;
  unitSight: number;
  citySight: number;
  minCityDistance: number;
  foodPerCitizen: number;
  growthFoodBase: number;
  cityCenterMinShields: number;
  startingUnits: UnitTypeId[];
}

function indexById<Id extends string, T extends { id: string }>(
  file: string,
  ids: readonly Id[],
  items: readonly T[],
): Record<Id, T> {
  const result = {} as Record<Id, T>;
  for (const item of items) {
    if (!(ids as readonly string[]).includes(item.id)) throw new Error(`${file}: unknown id "${item.id}"`);
    result[item.id as Id] = item;
  }
  for (const id of ids) if (!result[id]) throw new Error(`${file}: missing "${id}"`);
  return result;
}

export const TERRAINS: Readonly<Record<TerrainId, TerrainRule>> = indexById(
  "terrain.json",
  TERRAIN_IDS,
  terrainData.terrains as TerrainRule[],
);

export const UNIT_TYPES: Readonly<Record<UnitTypeId, UnitRule>> = indexById(
  "units.json",
  UNIT_TYPE_IDS,
  unitData.units as UnitRule[],
);

export const BUILDINGS: Readonly<Record<BuildingId, BuildingRule>> = indexById(
  "buildings.json",
  BUILDING_IDS,
  buildingData.buildings as BuildingRule[],
);

export const IMPROVEMENTS: Readonly<Record<ImprovementId, ImprovementRule>> = indexById(
  "improvements.json",
  IMPROVEMENT_IDS,
  improvementData.improvements as ImprovementRule[],
);

export const RULES: Readonly<GameConstants> = gameData as GameConstants;

export const CITY_NAMES: readonly string[] = cityNameData.names;

export function isLand(terrain: TerrainId): boolean {
  return TERRAINS[terrain].land;
}
