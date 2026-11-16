/**
 * Game rules loaded from the data files in ./data.
 * Numbers live in JSON so they can be tuned without touching the code.
 */
import buildingData from "./data/buildings.json";
import cityNameData from "./data/city-names.json";
import civData from "./data/civs.json";
import gameData from "./data/game.json";
import governmentData from "./data/governments.json";
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
  "tundra",
  "arctic",
  "jungle",
  "swamp",
  "river",
] as const;
export type TerrainId = (typeof TERRAIN_IDS)[number];

export const UNIT_TYPE_IDS = [
  "settlers",
  "warriors",
  "spearmen",
  "horsemen",
  "archers",
  "swordsmen",
  "chariot",
  "catapult",
  "knights",
  "musketeers",
  "cannon",
  "riflemen",
  "artillery",
  "mechInf",
  "tank",
  "diplomat",
  "caravan",
  "trireme",
  "sail",
  "frigate",
  "ironclad",
  "cruiser",
  "battleship",
  "submarine",
  "transport",
  "carrier",
  "fighter",
  "bomber",
  "nuclear",
] as const;
export type UnitTypeId = (typeof UNIT_TYPE_IDS)[number];

export const BUILDING_IDS = [
  "palace",
  "granary",
  "temple",
  "walls",
  "barracks",
  "library",
  "marketplace",
  "courthouse",
  "harbour",
  "amphitheater",
  "aqueduct",
  "cathedral",
  "university",
  "bank",
  "factory",
  "powerPlant",
  "hydroPlant",
  "nuclearPlant",
  "manufacturingPlant",
  "massTransit",
  "recyclingCenter",
  "researchLab",
  "coastalFortress",
  "sdiDefense",
  "ssStructural",
  "ssComponent",
  "ssModule",
  "stoneCircle",
  "pyramids",
  "colossus",
  "hangingGardens",
  "greatWall",
  "lighthouse",
  "oracle",
  "greatLibrary",
  "hallOfScholars",
  "greatObservatory",
  "circumnavigation",
  "sistineChapel",
  "stVitus",
  "globeTheatre",
  "grandBazaar",
  "royalSociety",
  "darwinVoyage",
  "womensSuffrage",
  "hooverDam",
  "unitedNations",
  "manhattanProject",
  "setiProgram",
  "apolloProgram",
  "genomeProject",
] as const;
export type BuildingId = (typeof BUILDING_IDS)[number];

export const TECH_IDS = [
  "pottery",
  "bronze",
  "masonry",
  "ceremonies",
  "horseback",
  "wheel",
  "archery",
  "writing",
  "alphabet",
  "codeOfLaws",
  "mysticism",
  "currency",
  "iron",
  "mapMaking",
  "mathematics",
  "literacy",
  "monarchy",
  "republic",
  "construction",
  "trade",
  "astronomy",
  "philosophy",
  "bridgeBuilding",
  "engineering",
  "feudalism",
  "chivalry",
  "medicine",
  "university",
  "banking",
  "navigation",
  "religion",
  "physics",
  "invention",
  "gunpowder",
  "theoryOfGravity",
  "magnetism",
  "steamEngine",
  "chemistry",
  "metallurgy",
  "democracy",
  "railroad",
  "conscription",
  "explosives",
  "electricity",
  "atomicTheory",
  "industrialization",
  "corporation",
  "steel",
  "refining",
  "electronics",
  "communism",
  "combustion",
  "automobile",
  "flight",
  "advancedFlight",
  "massProduction",
  "laborUnion",
  "geneticEngineering",
  "computers",
  "rocketry",
  "nuclearFission",
  "spaceFlight",
  "plastics",
  "robotics",
  "superconductor",
  "nuclearPower",
  "recycling",
  "fusionPower",
] as const;
export type TechId = (typeof TECH_IDS)[number];

export const IMPROVEMENT_IDS = ["road", "irrigation", "mine", "railroad", "fortress"] as const;
export type ImprovementId = (typeof IMPROVEMENT_IDS)[number];

export const GOVERNMENT_IDS = ["anarchy", "despotism", "monarchy", "communism", "republic", "democracy"] as const;
export type GovernmentId = (typeof GOVERNMENT_IDS)[number];

export type UnitDomain = "land" | "sea" | "air";

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
  /** Special resource that appears on some tiles of this terrain and adds to their yield. */
  special?: SpecialRule;
}

export interface SpecialRule extends Partial<Yield> {
  id: string;
  name: string;
}

export interface UnitRule {
  id: UnitTypeId;
  name: string;
  cost: number;
  attack: number;
  defense: number;
  /** Hit points of a healthy unit, as in Civilization 2 (10, 20, 30 or 40). */
  hp: number;
  /** Hit points a won combat round takes from the enemy. */
  firepower: number;
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
  /** Land units walk, ships sail on the ocean, aircraft fly over anything. */
  domain: UnitDomain;
  /** Units a ship carries: land units, or aircraft when `carries` is "air". */
  capacity?: number;
  carries?: "land" | "air";
  /** Turns an aircraft can stay in the air before it must land in a city or on a carrier. */
  fuel?: number;
  /** A trireme may sink when it ends a turn away from the coast. */
  coastal?: boolean;
  /** How far the unit sees; RULES.unitSight when missing. */
  sight?: number;
  special?: "diplomat" | "caravan" | "nuclear";
  /** A wonder that must stand somewhere in the world before anyone can build the unit. */
  requiresWonder?: BuildingId;
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
  /** The seat of government: no corruption here, other cities lose trade by distance. */
  capital?: boolean;
  /** Percent of the city's corruption that disappears. */
  corruptionCutPct?: number;
  /** Extra food on every worked ocean tile. */
  oceanFood?: number;
  /** Pollution from shields is multiplied by this percentage. */
  industryPollutionPct?: number;
  /** Citizens no longer pollute the air. */
  noPopulationPollution?: boolean;
  /** Extra trade on every worked tile that already yields trade. */
  tradeOnTradeTiles?: number;
  /** Percent added to what temples and cathedrals calm. */
  templePct?: number;
  cathedralPct?: number;
  /** Percent added to the science bonus of every library, university and research lab. */
  libraryBoostPct?: number;
  /** Nobody in the city is unhappy. */
  noUnhappy?: boolean;
  /** Every city with a factory and no power plant works as if it had a hydro plant. */
  plantInEveryCity?: boolean;
  /** Extra moves for the owner's ships. */
  shipMoves?: number;
  /** Triremes no longer sink. */
  safeTriremes?: boolean;
  /** The owner learns every technology that this many other players know. */
  techsFromOthers?: number;
  /** Technologies given at once when the wonder is finished. */
  freeTechs?: number;
  /** A change of government needs no anarchy. */
  noAnarchy?: boolean;
  /** Every government can be chosen, even without its technology. */
  allGovernments?: boolean;
  /** The owner sees every city in the world. */
  seesAllCities?: boolean;
  /** Military units abroad make this many fewer citizens unhappy each. */
  militaryUnhappyCut?: number;
  /** Other leaders keep offering peace (diplomacy comes in phase 3). */
  peaceOffers?: boolean;
  /** Defence bonus against ships in percent. */
  defenseVsSeaPct?: number;
  /** Defence bonus against land units in percent (walls). */
  defenseVsLandPct?: number;
  /** Land units built in the city start as veterans (barracks). */
  veteranUnits?: boolean;
  /** Nuclear attacks within this many tiles fail. */
  nuclearShield?: number;
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
  /** Only a city next to the ocean can build it. */
  coastal?: boolean;
  /** A player has only one; building it in another city moves it there. */
  onePerPlayer?: boolean;
  /** A city has only one building of the group; a new one replaces the old one. */
  group?: string;
  /** Once the owner knows this technology, the building (usually a wonder) stops working. */
  obsoleteBy?: TechId;
  /** A wonder that must stand somewhere in the world first. */
  requiresWonder?: BuildingId;
  /** A part of the spaceship: built in a city, but it goes to the player's ship. */
  spaceship?: "structural" | "component" | "module";
  /** For wonders: "all" = the effect applies in every city of the owner. */
  scope?: "city" | "all";
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
  /** Technology needed to build it. */
  requires?: TechId;
  /** Improvement that must already be on the tile. */
  requiresImprovement?: ImprovementId;
  /** Percent more shields on the tile (railroad). */
  shieldsPct?: number;
  /** Work turns per terrain; terrain missing here cannot get the improvement. */
  turns: Partial<Record<TerrainId, number>>;
  bonus: Partial<Record<TerrainId, Partial<Yield>>>;
  /** Technology needed on a particular terrain, e.g. bridge building for a road over a river. */
  requiresOn?: Partial<Record<TerrainId, TechId>>;
  /** On these terrains the work changes the terrain instead of adding a bonus. */
  transform?: Partial<Record<TerrainId, TerrainId>>;
}

export interface GovernmentRule {
  id: GovernmentId;
  name: string;
  requires: TechId | null;
  /** Tiles yielding more than 2 of something give one less (despotism). */
  tilePenalty: boolean;
  /** Tiles that yield trade give one more. */
  tradeBonus: boolean;
  /** Highest share of trade for science or for gold, in percent; 0 = neither (anarchy). */
  maxRate: number;
  /** Percent of the distance-based corruption that applies. */
  corruptionPct: number;
  /** Corruption that does not depend on distance (communism). */
  corruptionFlatPct: number;
  /** Soldiers in a city calm unhappy citizens. */
  martialLaw: boolean;
  /** Unhappy citizens per military unit outside the owner's cities. */
  militaryUnhappy: number;
  /** Units every city supports for free; each further unit costs one shield. */
  freeUnits: number;
  /** Food each settler costs its home city. */
  settlerFood: number;
  /** A senate forces peace (diplomacy comes in phase 3). */
  senate: boolean;
  /** What a celebrating city gains: no despotism penalty, more trade, or growth every turn. */
  celebration: "none" | "noTilePenalty" | "tradeBonus" | "rapture";
  /** Cities in disorder for two turns running may bring the government down. */
  collapsesInDisorder: boolean;
}

export type DisasterId = "earthquake" | "fire" | "flood" | "famine" | "piracy" | "plague" | "volcano";

export interface DisasterRule {
  id: DisasterId;
  /** Terrain the city must stand on or next to, null = any city. */
  near: TerrainId | null;
  /** building = one building burns down, population = citizens die, famine = the food box empties and a citizen dies, piracy = food box and production are lost. */
  hit: "building" | "population" | "famine" | "piracy";
  preventBuilding?: BuildingId;
  preventTech?: TechId;
}

export interface CombatConstants {
  fortifiedPct: number;
  fortressPct: number;
  veteranPct: number;
  veteranChancePct: number;
  healFieldPct: number;
  healFortressPct: number;
  healCityPct: number;
  captureBuildingLossPct: number;
}

export type RuinOutcome = "gold" | "tech" | "mercenaries" | "settlers" | "barbarians" | "empty";

export interface RuinConstants {
  perLandTiles: number;
  minStartDistance: number;
  outcomes: Record<RuinOutcome, number>;
  /** Gold amounts, one picked at random. */
  gold: number[];
  /** Unit types a ruin may give; the strongest one the finder could build itself wins, else the first. */
  mercenaries: UnitTypeId[];
  settlersBeforeTurn: number;
  barbariansFromTurn: number;
  /** Barbarians stay in a ruin this close to any city. */
  barbarianCityDistance: number;
}

export type BarbarianLevel = "none" | "few" | "many";

export interface BarbarianLevelConstants {
  startTurn: number;
  uprisingPct: number;
  landingPct: number;
  maxUnits: number;
  groupMin: number;
  groupMax: number;
}

export interface BarbarianConstants {
  levels: Record<Exclude<BarbarianLevel, "none">, BarbarianLevelConstants>;
  uprisingCityDistance: number;
  /** Nearest and farthest distance of a landing from the city it threatens. */
  landingCityDistance: number[];
  /** Unit types by the most advanced technology anyone knows; the last row whose tech is known applies. */
  units: { tech: TechId | null; units: UnitTypeId[] }[];
  attackChance: number;
}

export interface GovernorGoalConstants {
  tile: Yield;
  foodTarget: number;
  food: number;
  shields: number;
  science: number;
  gold: number;
  content: number;
  defenders: number;
}

export interface GovernorConstants {
  balanced: GovernorGoalConstants;
  growth: GovernorGoalConstants;
  production: GovernorGoalConstants;
  science: GovernorGoalConstants;
  gold: GovernorGoalConstants;
  defense: GovernorGoalConstants;
  /** Below this much gold the governor builds nothing whose upkeep the treasury cannot pay. */
  reserveGold: number;
  /** Extra points for buildings that pay off only later, per goal or for "any" goal. */
  later: Record<string, Record<string, number>>;
}

export interface GameConstants {
  combat: CombatConstants;
  governor: GovernorConstants;
  ruins: RuinConstants;
  score: { citizen: number; happy: number; tech: number; wonder: number; spaceship: number };
  barbarians: BarbarianConstants;
  maxTurns: number;
  movesFraction: number;
  roadMoveCost: number;
  unitSight: number;
  citySight: number;
  minCityDistance: number;
  /** Items a city can plan after its current production. */
  queueLength: number;
  /** Gold per shield when a city builds nothing and earns gold instead. */
  wealthGoldPerShield: number;
  /** Luxury points that turn one unhappy citizen content, or a content one happy. */
  luxuryPerContent: number;
  /** Smallest city that can celebrate. */
  celebrationMinSize: number;
  /** Luxury, gold or science points from one entertainer, taxman or scientist. */
  specialistYield: number;
  /** Smallest city that can have taxmen and scientists. */
  specialistMinSize: number;
  /** Cities a player can have before every city loses a content citizen. */
  empireSizeBase: number;
  /** Every further this many cities cost one more content citizen. */
  empireSizeStep: number;
  /** Settlers cannot join a city of this size or larger. */
  joinCityMaxSize: number;
  /** Chance per turn in percent that a government which collapses in disorder falls. */
  collapseChancePct: number;
  /** Name of that choice in the production list. */
  wealthName: string;
  /** How far (in tiles) an automatic settler looks for work around its owner's cities. */
  autoWorkRange: number;
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
  /** Percent of trade lost per tile of distance from the capital. */
  corruptionPerTile: number;
  /** Corruption never exceeds this percent; a player without a capital loses this much everywhere. */
  corruptionMaxPct: number;
  /** Pollution a city produces before its air bothers anyone. */
  pollutionFree: number;
  /** Chance in percent per point of pollution above pollutionFree that a tile gets polluted this turn. */
  pollutionPctPerPoint: number;
  /** Turns of settler work to clean a polluted tile. */
  pollutionCleanTurns: number;
  /** Polluted tiles the world can have without bringing global warming closer. */
  warmingSafeTiles: number;
  /** Global warming happens when the warming counter reaches this. */
  warmingLimit: number;
  /** Chance in percent that a tile changes in global warming. */
  warmingTilePct: number;
  /** Chance in percent that a nuclear plant in a city in disorder melts down. */
  meltdownPct: number;
  /** Each known technology here makes every fourth citizen add one point of pollution. */
  pollutionTechs: TechId[];
  /** Turns of anarchy after a revolution (none with the pyramids). */
  anarchyTurns: number;
  /** Chance in percent per turn that a disaster strikes one of the player's cities. */
  disasterPct: number;
  /** No disasters before this turn. */
  disasterStartTurn: number;
  /** Share of citizens a disaster that hits population takes, at least one. */
  populationLossPct: number;
  disasters: DisasterRule[];
  /** Chance in percent that a trireme sinks when it ends a turn away from the coast. */
  triremeLossPct: number;
  /** Shortest distance between two cities joined by a trade route. */
  tradeRouteMinDistance: number;
  tradeRoutesPerCity: number;
  /** Nuclear attack: radius of destruction and of the protection of a missile shield. */
  nuclearRadius: number;
  /** A unit disbanded in its owner's city adds this percent of its cost to production. */
  disbandShieldsPct: number;
  /** Upgrading a unit costs upgradeGoldBase + upgradeGoldPerShield × the difference in shield cost. */
  upgradeGoldBase: number;
  upgradeGoldPerShield: number;
  spaceship: {
    maxStructural: number;
    maxComponent: number;
    maxModule: number;
    /** Flight time = baseTurns - turnsPerComponent × components, at least minTurns. */
    baseTurns: number;
    turnsPerComponent: number;
    minTurns: number;
    /** Chance of a safe landing = successPerModule × modules, at most 100. */
    successPerModule: number;
  };
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

export const GOVERNMENTS: Readonly<Record<GovernmentId, GovernmentRule>> = indexById(
  "governments.json",
  GOVERNMENT_IDS,
  governmentData.governments as GovernmentRule[],
);

export const CITY_NAMES: readonly string[] = cityNameData.names;

export const CIV_IDS = [
  "romans",
  "babylonians",
  "germans",
  "egyptians",
  "americans",
  "greeks",
  "indians",
  "russians",
  "zulus",
  "french",
  "aztecs",
  "chinese",
  "english",
  "mongols",
  "czechs",
] as const;
export type CivId = (typeof CIV_IDS)[number];

/** Every nation in the game: the playable ones and the barbarians. */
export const NATION_IDS = [...CIV_IDS, "barbarians"] as const;
export type NationId = (typeof NATION_IDS)[number];

/** What the computer player is inclined to do; read by the AI. */
export type Personality = "expansion" | "war" | "science";

export interface CivRule {
  id: NationId;
  /** The people, in plural: "Češi". */
  name: string;
  /** Adjective for a feminine noun, as in "česká říše". */
  adjective: string;
  leader: string;
  color: string;
  /** Two nations of the same group never meet in one game, so colours stay apart. */
  colorGroup: string;
  personality: Personality;
  /** Names for new cities, in order; the first one is the capital. */
  cities: string[];
}

export const CIVS: Readonly<Record<NationId, CivRule>> = indexById("civs.json", NATION_IDS, civData.civs as CivRule[]);

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
  const building = (where: string, id: string | null | undefined) => {
    if (id && !(BUILDING_IDS as readonly string[]).includes(id)) throw new Error(`${where}: unknown building "${id}"`);
  };
  for (const u of Object.values(UNIT_TYPES)) building(`units.json ${u.id}`, u.requiresWonder);
  for (const g of Object.values(GOVERNMENTS)) tech(`governments.json ${g.id}`, g.requires);
  for (const i of Object.values(IMPROVEMENTS)) {
    tech(`improvements.json ${i.id}`, i.requires ?? null);
    for (const t of Object.values(i.requiresOn ?? {})) tech(`improvements.json ${i.id} requiresOn`, t ?? null);
  }
  for (const b of Object.values(BUILDINGS)) {
    tech(`buildings.json ${b.id}`, b.requires);
    tech(`buildings.json ${b.id}`, b.obsoleteBy ?? null);
    building(`buildings.json ${b.id}`, b.requiresWonder);
    if (b.requiresBuilding !== null && !(BUILDING_IDS as readonly string[]).includes(b.requiresBuilding)) {
      throw new Error(`buildings.json ${b.id}: unknown requiresBuilding "${b.requiresBuilding}"`);
    }
  }
  for (const t of RULES.pollutionTechs) tech("game.json pollutionTechs", t);
  const terrain = (where: string, id: string | null | undefined) => {
    if (id && !(TERRAIN_IDS as readonly string[]).includes(id)) throw new Error(`${where}: unknown terrain "${id}"`);
  };
  for (const i of Object.values(IMPROVEMENTS)) for (const [from, to] of Object.entries(i.transform ?? {})) {
    terrain(`improvements.json ${i.id} transform`, from);
    terrain(`improvements.json ${i.id} transform`, to);
  }
  for (const d of RULES.disasters) {
    terrain(`game.json disasters ${d.id}`, d.near);
    building(`game.json disasters ${d.id}`, d.preventBuilding);
    tech(`game.json disasters ${d.id}`, d.preventTech ?? null);
  }
  for (const c of Object.values(CIVS)) {
    if (c.cities.length === 0) throw new Error(`civs.json ${c.id}: no city names`);
    if (!["expansion", "war", "science"].includes(c.personality)) throw new Error(`civs.json ${c.id}: unknown personality "${c.personality}"`);
  }
}
checkReferences();
