/**
 * City economy: which tiles citizens work, what the city yields, happiness,
 * growth, starvation and production. Functions named *Draft mutate a cloned state.
 */
import { canBuild, cityEffects, corruptionPct, fallbackProduction, type CityEffects } from "./economy";
import type { GameEvent } from "./events";
import { BUILDINGS, RULES, UNIT_TYPES, type Yield } from "./rules";
import type { City, GameState, ProductionItem } from "./state";
import { fullMoves, idx, tileYield, workableTiles } from "./world";


export function growthThreshold(size: number): number {
  return RULES.growthFoodBase * (size + 1);
}

export function productionCost(item: ProductionItem): number {
  return item.kind === "unit" ? UNIT_TYPES[item.id].cost : BUILDINGS[item.id].cost;
}

export function productionName(item: ProductionItem): string {
  return item.kind === "unit" ? UNIT_TYPES[item.id].name : BUILDINGS[item.id].name;
}

export function sameItem(a: ProductionItem, b: ProductionItem): boolean {
  return a.kind === b.kind && a.id === b.id;
}

/** Yield of a tile for this city: the tile itself plus what the city's buildings add (a harbour on the ocean). */
export function cityTileYield(state: GameState, city: City, index: number, effects = cityEffects(state, city)): Yield {
  const y = tileYield(state.map, index, index === idx(state.map, city));
  if (state.map.terrain[index] === "ocean") y.food += effects.oceanFood;
  return y;
}

/** Centre plus worked tiles. */
function grossYield(state: GameState, city: City, effects: CityEffects): Yield {
  const total = cityTileYield(state, city, idx(state.map, city), effects);
  for (const i of city.worked) {
    const y = cityTileYield(state, city, i, effects);
    total.food += y.food;
    total.shields += y.shields;
    total.trade += y.trade;
  }
  return total;
}

export interface Pollution {
  /** From shields after factory and plant bonuses, reduced by clean plants and recycling. */
  industry: number;
  /** From citizens, growing with industrial technologies. */
  population: number;
  /** Citizens the dirty air makes unhappy. */
  unhappy: number;
}

/**
 * Pollution in a simple form: instead of dirty tiles as in Civilization 1,
 * a city with too much industry and too many people gets unhappy citizens.
 * It counts what the city could produce, so disorder does not clean the air.
 */
export function cityPollution(state: GameState, city: City, effects = cityEffects(state, city)): Pollution {
  const shields = Math.floor((grossYield(state, city, effects).shields * (100 + effects.shieldsPct)) / 100);
  const industry = Math.floor((shields * effects.industryPollutionPct) / 100);
  const player = state.players[city.owner];
  const known = player ? RULES.pollutionTechs.filter((t) => player.techs.includes(t)).length : 0;
  const population = effects.noPopulationPollution ? 0 : Math.floor((city.size * known) / 4);
  const over = industry + population - RULES.pollutionFree;
  const unhappy = over > 0 ? Math.min(city.size, Math.ceil(over / RULES.pollutionPerUnhappy)) : 0;
  return { industry, population, unhappy };
}

/** Food surplus the automatic assignment tries to reach before it goes for shields. */
const TARGET_FOOD_SURPLUS = 1;

/** Military units of the owner standing in the city, each calming one unhappy citizen up to a limit. */
export function martialLaw(state: GameState, city: City): number {
  const soldiers = state.units.filter(
    (u) => u.owner === city.owner && u.x === city.x && u.y === city.y && UNIT_TYPES[u.type].attack > 0,
  ).length;
  return Math.min(soldiers, RULES.martialLawMax);
}

export interface Happiness {
  content: number;
  unhappy: number;
  /** Citizens who do not work a tile. They keep the city calm instead. */
  entertainers: number;
  /** More unhappy than content citizens: the city produces nothing. */
  disorder: boolean;
}

/** Unhappy citizens left after buildings and soldiers have calmed whom they can, before entertainers. */
function unhappyAfterHelp(state: GameState, city: City, effects: CityEffects): number {
  const crowd = Math.max(0, city.size - RULES.contentBase);
  const unhappy = Math.min(city.size, crowd + cityPollution(state, city, effects).unhappy);
  return Math.max(0, unhappy - effects.content - martialLaw(state, city));
}

export function cityHappiness(state: GameState, city: City, effects = cityEffects(state, city)): Happiness {
  const entertainers = Math.max(0, city.size - city.worked.length);
  const unhappy = Math.max(0, unhappyAfterHelp(state, city, effects) - entertainers);
  const content = city.size - entertainers - unhappy;
  return { content, unhappy, entertainers, disorder: unhappy > content };
}

/**
 * Puts citizens on the best available tiles (mutates the draft).
 * Tiles the owner chose by hand are kept while they stay valid.
 * Otherwise it first keeps as many citizens off the fields as entertainers as the city
 * needs to stay calm. The rest pick food-heavy tiles until the city has a
 * surplus of TARGET_FOOD_SURPLUS, then they weigh food and shields equally.
 */
export function assignWorkersDraft(draft: GameState, city: City): void {
  if (city.manualTiles) {
    // A hand-made choice stays while every chosen tile is still free to work.
    const allowed = new Set(workableTiles(draft, city));
    if (city.worked.length <= city.size && city.worked.every((i) => allowed.has(i))) return;
    city.manualTiles = false;
  }
  const effects = cityEffects(draft, city);
  const unhappy = unhappyAfterHelp(draft, city, effects);
  // Smallest number of entertainers e with unhappy - e <= size - e - (unhappy - e).
  const entertainers = Math.min(unhappy, Math.max(0, 2 * unhappy - city.size));
  const workers = city.size - entertainers;

  const candidates = workableTiles(draft, city).map((i) => ({ i, y: cityTileYield(draft, city, i, effects) }));
  const settlerUpkeep = draft.units
    .filter((u) => u.homeCity === city.id)
    .reduce((sum, u) => sum + UNIT_TYPES[u.type].foodUpkeep, 0);
  let food = cityTileYield(draft, city, idx(draft.map, city), effects).food - city.size * RULES.foodPerCitizen - settlerUpkeep;
  const worked: number[] = [];
  for (let n = 0; n < workers && candidates.length > 0; n++) {
    const hungry = food < TARGET_FOOD_SURPLUS;
    const score = (y: Yield) => (hungry ? y.food * 10 + y.shields * 3 + y.trade * 2 : y.food * 4 + y.shields * 4 + y.trade * 2);
    candidates.sort((a, b) => score(b.y) - score(a.y) || a.i - b.i);
    const pick = candidates.shift()!;
    worked.push(pick.i);
    food += pick.y.food;
  }
  city.worked = worked.sort((a, b) => a - b);
}

export interface CityReport {
  /** Total from the centre and worked tiles. */
  production: Yield;
  /** Food eaten by citizens plus food upkeep of settlers. */
  foodUpkeep: number;
  foodSurplus: number;
  /** Shields added to production this turn, after buildings and disorder. */
  shieldSurplus: number;
  /** Trade lost on the way to the capital. */
  corruption: number;
  /** Trade split by the owner's slider, after corruption, buildings and disorder. */
  science: number;
  gold: number;
  happiness: Happiness;
  pollution: Pollution;
  growthThreshold: number;
  /** Largest size the city can reach with its buildings. */
  maxSize: number;
  /** Turns until the city grows, null when it does not grow. */
  turnsToGrow: number | null;
  /** Turns until the current production is done, null when there are no shields. */
  turnsToComplete: number | null;
  /** True when the current unit needs more citizens than the city has. */
  waitingForSize: boolean;
}

export function cityReport(state: GameState, city: City): CityReport {
  const effects = cityEffects(state, city);
  const production = grossYield(state, city, effects);
  const settlerUpkeep = state.units
    .filter((u) => u.homeCity === city.id)
    .reduce((sum, u) => sum + UNIT_TYPES[u.type].foodUpkeep, 0);
  const foodUpkeep = city.size * RULES.foodPerCitizen + settlerUpkeep;
  const foodSurplus = production.food - foodUpkeep;
  const happiness = cityHappiness(state, city, effects);

  const rate = state.players[city.owner]?.scienceRate ?? 0;
  const corruption = Math.round((production.trade * corruptionPct(state, city, effects)) / 100);
  const trade = production.trade - corruption;
  const baseScience = Math.round((trade * rate) / 100);
  const baseGold = trade - baseScience;
  const calm = !happiness.disorder;
  const shieldSurplus = calm ? Math.floor((production.shields * (100 + effects.shieldsPct)) / 100) : 0;
  const science = calm ? Math.floor((baseScience * (100 + effects.sciencePct)) / 100) : 0;
  const gold = calm ? Math.floor((baseGold * (100 + effects.goldPct)) / 100) : 0;

  const threshold = growthThreshold(city.size);
  const cost = productionCost(city.production);
  const popCost = city.production.kind === "unit" ? UNIT_TYPES[city.production.id].populationCost : 0;
  const canGrow = foodSurplus > 0 && city.size < effects.maxSize;
  return {
    production,
    foodUpkeep,
    foodSurplus,
    shieldSurplus,
    corruption,
    science,
    gold,
    happiness,
    pollution: cityPollution(state, city, effects),
    growthThreshold: threshold,
    maxSize: effects.maxSize,
    turnsToGrow: canGrow ? Math.max(1, Math.ceil((threshold - city.food) / foodSurplus)) : null,
    turnsToComplete:
      city.shields >= cost ? 1 : shieldSurplus > 0 ? Math.max(1, Math.ceil((cost - city.shields) / shieldSurplus)) : null,
    waitingForSize: popCost > 0 && city.size <= popCost,
  };
}

/** What a city adds to its owner's treasury and research this turn. */
export interface CityOutput {
  science: number;
  gold: number;
}

/** End-of-turn processing for one city (mutates the draft). */
export function processCityDraft(draft: GameState, city: City, events: GameEvent[]): CityOutput {
  assignWorkersDraft(draft, city);
  const report = cityReport(draft, city);
  const effects = cityEffects(draft, city);
  if (report.happiness.disorder) events.push({ type: "cityDisorder", cityId: city.id });

  // Food: growth or starvation. A city at its size limit keeps a full food box.
  city.food += report.foodSurplus;
  if (city.food < 0) {
    if (city.size > 1) {
      city.size -= 1;
      city.manualTiles = false;
      events.push({ type: "cityStarved", cityId: city.id, size: city.size });
    }
    city.food = 0;
  } else if (city.food >= report.growthThreshold) {
    if (city.size >= effects.maxSize) {
      if (city.food - report.foodSurplus < report.growthThreshold) {
        events.push({ type: "cityAtMaxSize", cityId: city.id, size: city.size });
      }
      city.food = report.growthThreshold;
    } else {
      city.size += 1;
      city.manualTiles = false;
      city.food = Math.floor(report.growthThreshold * effects.keepFoodOnGrowth);
      events.push({ type: "cityGrew", cityId: city.id, size: city.size });
    }
  }

  // Production. Something that became impossible (a wonder built elsewhere,
  // an obsolete unit) is replaced before shields are added.
  if (!canBuild(draft, city, city.production)) {
    city.production = fallbackProduction(draft, city.owner);
    events.push({ type: "productionNeeded", cityId: city.id });
  }
  city.shields += report.shieldSurplus;
  const item = city.production;
  const cost = productionCost(item);
  if (city.shields >= cost) completeProductionDraft(draft, city, cost, events);
  assignWorkersDraft(draft, city);
  return { science: report.science, gold: report.gold };
}

function completeProductionDraft(draft: GameState, city: City, cost: number, events: GameEvent[]): void {
  const item = city.production;
  if (item.kind === "unit") {
    const rule = UNIT_TYPES[item.id];
    if (city.size <= rule.populationCost) {
      city.shields = cost;
      events.push({ type: "cityNeedsSize", cityId: city.id, item });
      return;
    }
    city.size -= rule.populationCost;
    if (rule.populationCost > 0) city.manualTiles = false;
    city.shields -= cost;
    const unitId = draft.nextId++;
    draft.units.push({
      id: unitId,
      owner: city.owner,
      type: item.id,
      x: city.x,
      y: city.y,
      movesLeft: 0,
      homeCity: city.id,
      fortified: false,
      work: null,
      goto: null,
    });
    const unit = draft.units[draft.units.length - 1];
    if (unit) unit.movesLeft = fullMoves(unit);
    events.push({ type: "unitBuilt", cityId: city.id, unitId, unitType: item.id });
    return;
  }
  city.shields -= cost;
  const rule = BUILDINGS[item.id];
  // A new palace moves the capital; a new power plant replaces the old one.
  if (rule.onePerPlayer) {
    for (const other of draft.cities) {
      if (other.owner === city.owner) other.buildings = other.buildings.filter((b) => b !== item.id);
    }
  }
  if (rule.group) city.buildings = city.buildings.filter((b) => BUILDINGS[b].group !== rule.group);
  city.buildings.push(item.id);
  events.push(
    rule.wonder
      ? { type: "wonderBuilt", cityId: city.id, owner: city.owner, building: item.id }
      : { type: "buildingBuilt", cityId: city.id, building: item.id },
  );
  // A building cannot be built twice, so the city falls back to a defender.
  city.production = fallbackProduction(draft, city.owner);
  events.push({ type: "productionNeeded", cityId: city.id });
}
