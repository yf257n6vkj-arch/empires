/**
 * Game rules loaded from the data files in ./data.
 * Numbers live in JSON so they can be tuned without touching the code.
 */
import buildingData from "./data/buildings.json";
import cityNameData from "./data/city-names.json";
import gameData from "./data/game.json";
import improvementData from "./data/improvements.json";
import techData from "./data/techs.json";
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

export const UNIT_TYPE_IDS = [
  "settlers",
  "warriors",
  "spearmen",
  "horsemen",
  "archers",
  "swordsmen",
  "catapult",
  "knights",
  "musketeers",
  "cannon",
  "riflemen",
  "tank",
] as const;
export type UnitTypeId = (typeof UNIT_TYPE_IDS)[number];

export const BUILDING_IDS = [
  "granary",
  "temple",
  "walls",
  "barracks",
  "library",
  "marketplace",
  "amphitheater",
  "aqueduct",
  "university",
  "factory",
  "stoneCircle",
  "hallOfScholars",
  "greatObservatory",
  "grandBazaar",
  "greatWork",
] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export const TECH_IDS = [
  "pottery",
  "bronze",
  "masonry",
  "ceremonies",
  "horseback",
  "writing",
  "iron",
  "archery",
  "currency",
  "mathematics",
  "mysticism",
  "construction",
  "engineering",
  "philosophy",
  "chivalry",
  "astronomy",
  "banking",
  "scholarship",
  "gunpowder",
  "metallurgy",
  "conscription",
  "industry",
  "combustion",
  "modernScience",
] as const;
export type TechId = (typeof TECH_IDS)[number];

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
  /** Technology that unlocks the unit, null = known from the start. */
  requires: TechId | null;
  /** Once this unit can be built, the old one disappears from the production list. */
  obsoleteBy: UnitTypeId | null;
}

/** What a building changes in a city. Missing fields mean no change. */
export interface BuildingEffects {
  /** Unhappy citizens the building makes content. */
  content?: number;
  sciencePct?: number;
  goldPct?: number;
  shieldsPct?: number;
  /** Share of the food box kept when the city grows. */
  keepFoodOnGrowth?: number;
  /** Largest size the city can reach with this building. */
  maxSize?: number;
}

export interface BuildingRule {
  id: BuildingId;
  name: string;
  cost: number;
  /** Gold per turn. */
  upkeep: number;
  requires: TechId | null;
  /** Building the city must already have. */
  requiresBuilding: BuildingId | null;
  /** A wonder can exist only once in the whole game. */
  wonder: boolean;
  /** For wonders: "all" = the effect applies in every city of the owner. */
  scope?: "city" | "all";
  /** The last wonder; building it wins the game (victory rules come in phase 3). */
  victory?: boolean;
  effects: BuildingEffects;
}

export interface TechRule {
  id: TechId;
  name: string;
  era: number;
  requires: TechId[];
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
  /** Citizens content without any help; the rest are unhappy. */
  contentBase: number;
  /** At most this many military units in a city calm one unhappy citizen each. */
  martialLawMax: number;
  /** Largest city size without a building that raises it. */
  maxCitySize: number;
  /** Research cost = researchCostBase + researchCostPerTech × techs known. */
  researchCostBase: number;
  researchCostPerTech: number;
  startingGold: number;
  /** Share of trade going to science at the start, in percent. */
  startingScienceRate: number;
  /** The science/gold slider moves in steps of this many percent. */
  rateStep: number;
  /** Buying the rest of production costs buyPerShield × r + r² / buyQuadratic gold for r missing shields. */
  buyPerShield: number;
  buyQuadratic: number;
  /** Price multiplier when nothing has been produced yet. */
  buyEmptyMultiplier: number;
  /** Price multiplier for wonders. */
  buyWonderMultiplier: number;
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

export const TECHS: Readonly<Record<TechId, TechRule>> = indexById(
  "techs.json",
  TECH_IDS,
  techData.techs as TechRule[],
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

// Cross-references between data files are checked once at load time, so a
// typo in JSON fails immediately instead of making something unbuildable.
function checkReferences(): void {
  const tech = (where: string, id: string | null) => {
    if (id !== null && !(TECH_IDS as readonly string[]).includes(id)) throw new Error(`${where}: unknown tech "${id}"`);
  };
  for (const t of Object.values(TECHS)) for (const r of t.requires) tech(`techs.json ${t.id}`, r);
  for (const u of Object.values(UNIT_TYPES)) {
    tech(`units.json ${u.id}`, u.requires);
    if (u.obsoleteBy !== null && !(UNIT_TYPE_IDS as readonly string[]).includes(u.obsoleteBy)) {
      throw new Error(`units.json ${u.id}: unknown obsoleteBy "${u.obsoleteBy}"`);
    }
  }
  for (const b of Object.values(BUILDINGS)) {
    tech(`buildings.json ${b.id}`, b.requires);
    if (b.requiresBuilding !== null && !(BUILDING_IDS as readonly string[]).includes(b.requiresBuilding)) {
      throw new Error(`buildings.json ${b.id}: unknown requiresBuilding "${b.requiresBuilding}"`);
    }
  }
}
checkReferences();
