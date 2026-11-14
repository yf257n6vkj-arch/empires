/**
 * City economy: which tiles citizens work, what the city yields, happiness,
 * growth, starvation and production. Functions named *Draft mutate a cloned state.
 */
import { canBuild, cityEffects, fallbackProduction, type CityEffects } from "./economy";
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
  const unhappy = Math.max(0, city.size - RULES.contentBase);
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
 * First it keeps as many citizens off the fields as entertainers as the city
 * needs to stay calm. The rest pick food-heavy tiles until the city has a
 * surplus of TARGET_FOOD_SURPLUS, then they weigh food and shields equally.
 */
export function assignWorkersDraft(draft: GameState, city: City): void {
  const unhappy = unhappyAfterHelp(draft, city, cityEffects(draft, city));
  // Smallest number of entertainers e with unhappy - e <= size - e - (unhappy - e).
  const entertainers = Math.min(unhappy, Math.max(0, 2 * unhappy - city.size));
  const workers = city.size - entertainers;

  const candidates = workableTiles(draft, city).map((i) => ({ i, y: tileYield(draft.map, i, false) }));
  const settlerUpkeep = draft.units
    .filter((u) => u.homeCity === city.id)
    .reduce((sum, u) => sum + UNIT_TYPES[u.type].foodUpkeep, 0);
  let food = tileYield(draft.map, idx(draft.map, city), true).food - city.size * RULES.foodPerCitizen - settlerUpkeep;
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
  /** Trade split by the owner's slider, after buildings and disorder. */
  science: number;
  gold: number;
  happiness: Happiness;
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
  const production: Yield = tileYield(state.map, idx(state.map, city), true);
  for (const i of city.worked) {
    const y = tileYield(state.map, i, false);
    production.food += y.food;
    production.shields += y.shields;
    production.trade += y.trade;
  }
  const settlerUpkeep = state.units
    .filter((u) => u.homeCity === city.id)
    .reduce((sum, u) => sum + UNIT_TYPES[u.type].foodUpkeep, 0);
  const foodUpkeep = city.size * RULES.foodPerCitizen + settlerUpkeep;
  const foodSurplus = production.food - foodUpkeep;
  const happiness = cityHappiness(state, city, effects);

  const rate = state.players[city.owner]?.scienceRate ?? 0;
  const baseScience = Math.round((production.trade * rate) / 100);
  const baseGold = production.trade - baseScience;
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
    science,
    gold,
    happiness,
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
  city.buildings.push(item.id);
  const rule = BUILDINGS[item.id];
  events.push(
    rule.wonder
      ? { type: "wonderBuilt", cityId: city.id, owner: city.owner, building: item.id }
      : { type: "buildingBuilt", cityId: city.id, building: item.id },
  );
  // A building cannot be built twice, so the city falls back to a defender.
  city.production = fallbackProduction(draft, city.owner);
  events.push({ type: "productionNeeded", cityId: city.id });
}
