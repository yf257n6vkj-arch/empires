/**
 * Technologies, gold and what a city may build. Pure functions over GameState;
 * functions named *Draft mutate a cloned state.
 */
import type { GameEvent } from "./events";
import {
  BUILDINGS,
  RULES,
  TECHS,
  UNIT_TYPES,
  type BuildingEffects,
  type BuildingId,
  type BuildingRule,
  type TechId,
} from "./rules";
import { distance, neighbors8 } from "./geometry";
import type { City, GameState, Player, PlayerId, ProductionItem } from "./state";

/** Economy fields of a player at the start of a game. */
export function startingEconomy(): Pick<
  Player,
  "techs" | "researching" | "researchGoal" | "research" | "gold" | "scienceRate"
> {
  return {
    techs: [],
    researching: null,
    researchGoal: null,
    research: 0,
    gold: RULES.startingGold,
    scienceRate: RULES.startingScienceRate,
  };
}

// ---------- technologies ----------

export function knowsTech(player: Player, tech: TechId | null): boolean {
  return tech === null || player.techs.includes(tech);
}

/** True when the player can start researching the technology now. */
export function canResearch(player: Player, tech: TechId): boolean {
  return !player.techs.includes(tech) && TECHS[tech].requires.every((r) => player.techs.includes(r));
}

export function researchableTechs(player: Player): TechId[] {
  return (Object.keys(TECHS) as TechId[]).filter((t) => canResearch(player, t));
}

/**
 * Technologies still missing on the way to `goal`, the goal included, in an
 * order in which they can be researched (prerequisites first).
 */
export function pathToTech(player: Player, goal: TechId): TechId[] {
  const result: TechId[] = [];
  const visit = (t: TechId) => {
    if (player.techs.includes(t) || result.includes(t)) return;
    for (const r of TECHS[t].requires) visit(r);
    result.push(t);
  };
  visit(goal);
  return result;
}

/** The next technology to research on the way to `goal`, or null when the goal is known. */
export function nextStepToGoal(player: Player, goal: TechId): TechId | null {
  return pathToTech(player, goal).find((t) => canResearch(player, t)) ?? null;
}

/** Science needed for the player's next technology. */
export function researchCost(player: Player): number {
  return Math.round(RULES.researchCostBase + RULES.researchCostPerTech * player.techs.length);
}

/** Highest era among known technologies, 0 before the first one. */
export function currentEra(player: Player): number {
  return player.techs.reduce((e, t) => Math.max(e, TECHS[t].era), 0);
}

// ---------- what can be built ----------

/** Wonders that exist anywhere in the game. */
export function builtWonders(state: GameState): BuildingId[] {
  const result: BuildingId[] = [];
  for (const c of state.cities) for (const b of c.buildings) if (BUILDINGS[b].wonder) result.push(b);
  return result;
}

export function canBuildUnitType(player: Player, id: keyof typeof UNIT_TYPES): boolean {
  const rule = UNIT_TYPES[id];
  if (!knowsTech(player, rule.requires)) return false;
  // A unit disappears from the list once its replacement can be built.
  const next = rule.obsoleteBy;
  return next === null || !knowsTech(player, UNIT_TYPES[next].requires);
}

/** True when the city stands next to the ocean. */
export function isCoastal(state: GameState, city: City): boolean {
  return neighbors8(state.map, city.y * state.map.width + city.x).some((i) => state.map.terrain[i] === "ocean");
}

export function canBuildBuilding(state: GameState, city: City, rule: BuildingRule): boolean {
  const player = state.players[city.owner];
  if (!player || !knowsTech(player, rule.requires)) return false;
  if (city.buildings.includes(rule.id)) return false;
  if (rule.requiresBuilding !== null && !city.buildings.includes(rule.requiresBuilding)) return false;
  if (rule.coastal && !isCoastal(state, city)) return false;
  if (rule.wonder && builtWonders(state).includes(rule.id)) return false;
  return true;
}

export function canBuild(state: GameState, city: City, item: ProductionItem): boolean {
  const player = state.players[city.owner];
  if (!player) return false;
  return item.kind === "unit" ? canBuildUnitType(player, item.id) : canBuildBuilding(state, city, BUILDINGS[item.id]);
}

/** What the city can be set to produce, units first. */
export function productionOptions(state: GameState, city: City): ProductionItem[] {
  const player = state.players[city.owner];
  if (!player) return [];
  const units: ProductionItem[] = Object.values(UNIT_TYPES)
    .filter((u) => canBuildUnitType(player, u.id))
    .map((u) => ({ kind: "unit", id: u.id }));
  const buildings: ProductionItem[] = Object.values(BUILDINGS)
    .filter((b) => canBuildBuilding(state, city, b))
    .map((b) => ({ kind: "building", id: b.id }));
  return [...units, ...buildings];
}

/**
 * What a city switches to when its production is finished or no longer
 * possible: the best defender it can build.
 */
export function fallbackProduction(state: GameState, owner: PlayerId): ProductionItem {
  const player = state.players[owner];
  const military = Object.values(UNIT_TYPES)
    .filter((u) => !u.foundsCity && player && canBuildUnitType(player, u.id))
    .sort((a, b) => b.defense - a.defense || a.cost - b.cost);
  return { kind: "unit", id: military[0]?.id ?? "warriors" };
}

// ---------- building effects ----------

export interface CityEffects {
  content: number;
  sciencePct: number;
  goldPct: number;
  shieldsPct: number;
  keepFoodOnGrowth: number;
  maxSize: number;
  capital: boolean;
  corruptionCutPct: number;
  oceanFood: number;
  /** Multiplier for pollution from shields, in percent. */
  industryPollutionPct: number;
  noPopulationPollution: boolean;
}

/**
 * Combined effect of the city's buildings and of its owner's wonders that work everywhere.
 * A building that needs another one (a power plant needs a factory) does nothing without it.
 */
export function cityEffects(state: GameState, city: City): CityEffects {
  const sources: BuildingEffects[] = city.buildings
    .filter((b) => {
      const needs = BUILDINGS[b].requiresBuilding;
      return needs === null || city.buildings.includes(needs);
    })
    .map((b) => BUILDINGS[b].effects);
  for (const other of state.cities) {
    if (other.owner !== city.owner || other.id === city.id) continue;
    for (const b of other.buildings) if (BUILDINGS[b].wonder && BUILDINGS[b].scope === "all") sources.push(BUILDINGS[b].effects);
  }
  const result: CityEffects = {
    content: 0,
    sciencePct: 0,
    goldPct: 0,
    shieldsPct: 0,
    keepFoodOnGrowth: 0,
    maxSize: RULES.maxCitySize,
    capital: false,
    corruptionCutPct: 0,
    oceanFood: 0,
    industryPollutionPct: 100,
    noPopulationPollution: false,
  };
  for (const e of sources) {
    result.content += e.content ?? 0;
    result.sciencePct += e.sciencePct ?? 0;
    result.goldPct += e.goldPct ?? 0;
    result.shieldsPct += e.shieldsPct ?? 0;
    result.keepFoodOnGrowth = Math.max(result.keepFoodOnGrowth, e.keepFoodOnGrowth ?? 0);
    result.maxSize = Math.max(result.maxSize, e.maxSize ?? 0);
    result.capital ||= e.capital ?? false;
    result.corruptionCutPct = Math.min(100, result.corruptionCutPct + (e.corruptionCutPct ?? 0));
    result.oceanFood += e.oceanFood ?? 0;
    result.industryPollutionPct = Math.round((result.industryPollutionPct * (e.industryPollutionPct ?? 100)) / 100);
    result.noPopulationPollution ||= e.noPopulationPollution ?? false;
  }
  return result;
}

/** The player's city with the palace, if any. */
export function capitalOf(state: GameState, player: PlayerId): City | undefined {
  return state.cities.find((c) => c.owner === player && c.buildings.includes("palace"));
}

/**
 * Percent of the city's trade lost to corruption: it grows with the distance
 * from the capital, the capital itself has none, a courthouse cuts it.
 */
export function corruptionPct(state: GameState, city: City, effects = cityEffects(state, city)): number {
  if (effects.capital) return 0;
  const capital = capitalOf(state, city.owner);
  const raw = capital ? Math.min(RULES.corruptionMaxPct, distance(city, capital) * RULES.corruptionPerTile) : RULES.corruptionMaxPct;
  return Math.round((raw * (100 - effects.corruptionCutPct)) / 100);
}

// ---------- gold ----------

export function buildingUpkeep(state: GameState, player: PlayerId): number {
  let total = 0;
  for (const c of state.cities) if (c.owner === player) for (const b of c.buildings) total += BUILDINGS[b].upkeep;
  return total;
}

/** Gold needed to finish the city's current production this turn, 0 when it is already paid. */
export function buyCost(city: City): number {
  const item = city.production;
  const cost = item.kind === "unit" ? UNIT_TYPES[item.id].cost : BUILDINGS[item.id].cost;
  const missing = cost - city.shields;
  if (missing <= 0) return 0;
  let price = RULES.buyPerShield * missing + (missing * missing) / RULES.buyQuadratic;
  if (city.shields === 0) price *= RULES.buyEmptyMultiplier;
  if (item.kind === "building" && BUILDINGS[item.id].wonder) price *= RULES.buyWonderMultiplier;
  return Math.ceil(price);
}

/**
 * When a player cannot pay upkeep, buildings are sold one at a time
 * (the one with the highest upkeep first) until the treasury is not negative.
 */
export function sellBuildingsForUpkeepDraft(draft: GameState, playerId: PlayerId, events: GameEvent[]): void {
  const player = draft.players[playerId];
  if (!player) return;
  while (player.gold < 0) {
    let best: { city: City; building: BuildingId } | null = null;
    for (const c of draft.cities) {
      if (c.owner !== playerId) continue;
      for (const b of c.buildings) {
        const rule = BUILDINGS[b];
        if (rule.wonder || rule.upkeep <= 0) continue;
        if (!best || rule.upkeep > BUILDINGS[best.building].upkeep) best = { city: c, building: b };
      }
    }
    if (!best) {
      player.gold = 0;
      return;
    }
    best.city.buildings = best.city.buildings.filter((b) => b !== best!.building);
    player.gold += BUILDINGS[best.building].cost;
    events.push({ type: "buildingSold", cityId: best.city.id, building: best.building });
  }
}
