/**
 * City economy: which tiles citizens work, what the city yields, happiness,
 * growth, starvation and production. Functions named *Draft mutate a cloned state.
 */
import {
  canBuild,
  cityEffects,
  corruptionPct,
  fallbackProduction,
  freeTechChoice,
  knowsTech,
  learnTechDraft,
  workingBuildings,
  type CityEffects,
} from "./economy";
import type { GameEvent } from "./events";
import { cityRadiusTiles, distance, fromIndex } from "./geometry";
import { Rng } from "./rng";
import { BUILDINGS, GOVERNMENTS, RULES, TERRAINS, UNIT_TYPES, type GovernmentRule, type Yield } from "./rules";
import type { City, GameState, ProductionItem, Unit } from "./state";
import { cityAt, idx, makeUnit, tileYield, workableTiles } from "./world";

function governmentOf(state: GameState, city: City): GovernmentRule {
  return GOVERNMENTS[state.players[city.owner]?.government ?? "despotism"];
}


export function growthThreshold(size: number): number {
  return RULES.growthFoodBase * (size + 1);
}

/** Shields the item costs; 0 when the city earns gold and builds nothing. */
export function productionCost(item: ProductionItem): number {
  if (item.kind === "wealth") return 0;
  return item.kind === "unit" ? UNIT_TYPES[item.id].cost : BUILDINGS[item.id].cost;
}

export function productionName(item: ProductionItem): string {
  if (item.kind === "wealth") return RULES.wealthName;
  return item.kind === "unit" ? UNIT_TYPES[item.id].name : BUILDINGS[item.id].name;
}

export function sameItem(a: ProductionItem, b: ProductionItem): boolean {
  if (a.kind === "wealth" || b.kind === "wealth") return a.kind === b.kind;
  return a.kind === b.kind && a.id === b.id;
}

/** Yield of a tile for this city: the tile itself plus what the city's buildings add (a harbour on the ocean). */
export function cityTileYield(state: GameState, city: City, index: number, effects = cityEffects(state, city)): Yield {
  const y = tileYield(state.map, index, index === idx(state.map, city));
  if (state.map.terrain[index] === "ocean") y.food += effects.oceanFood;
  const gov = governmentOf(state, city);
  const party = city.celebrating ? gov.celebration : "none";
  // Despotism wastes the best tiles: anything above 2 gives one less. The city
  // centre is spared, otherwise new cities would barely grow in a 120-turn game.
  // A celebrating city works its land as under a monarchy.
  if (gov.tilePenalty && party !== "noTilePenalty" && index !== idx(state.map, city)) {
    if (y.food > 2) y.food -= 1;
    if (y.shields > 2) y.shields -= 1;
    if (y.trade > 2) y.trade -= 1;
  }
  if (y.trade > 0) y.trade += effects.tradeOnTradeTiles + (gov.tradeBonus || party === "tradeBonus" ? 1 : 0);
  return y;
}

/** Trade a city gets from its trade routes; a route to another player's city counts double. */
export function routeTrade(state: GameState, city: City): number {
  const base = (c: City) => grossYield(state, c, cityEffects(state, c)).trade;
  let total = 0;
  for (const id of city.tradeRoutes) {
    const other = state.cities.find((c) => c.id === id);
    if (!other) continue;
    const value = Math.floor((base(city) + base(other) + 4) / 8);
    total += other.owner === city.owner ? Math.floor(value / 2) : value;
  }
  return total;
}

/** Units the city pays for: everything whose home it is. */
export function supportedUnits(state: GameState, city: City): Unit[] {
  return state.units.filter((u) => u.homeCity === city.id);
}

/** Shields per turn the city pays for its units beyond those it keeps for free. */
export function unitShieldUpkeep(state: GameState, city: City): number {
  return Math.max(0, supportedUnits(state, city).length - governmentOf(state, city).freeUnits);
}

/** Food per turn for the city's settlers. */
function settlerFood(state: GameState, city: City): number {
  const perSettler = governmentOf(state, city).settlerFood;
  return supportedUnits(state, city).filter((u) => UNIT_TYPES[u.type].foodUpkeep > 0).length * perSettler;
}

/** Citizens made unhappy by the city's soldiers away from home, under a republic or democracy. */
export function militaryUnhappiness(state: GameState, city: City, effects: CityEffects): number {
  const per = Math.max(0, governmentOf(state, city).militaryUnhappy - effects.militaryUnhappyCut);
  if (per === 0) return 0;
  const abroad = supportedUnits(state, city).filter((u) => {
    if (UNIT_TYPES[u.type].attack === 0) return false;
    const there = cityAt(state, u);
    if (there && there.owner === u.owner) return false;
    // A fortress near one of the owner's cities counts as home.
    if (state.map.fortress[idx(state.map, u)] && state.cities.some((c) => c.owner === u.owner && distance(c, u) <= 3)) return false;
    return true;
  });
  return abroad.length * per;
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
  /** Chance in percent that a tile around the city gets polluted this turn. */
  chancePct: number;
}

/**
 * Pollution as in Civilization 1: a city with too much industry and too many
 * people may pollute a tile around it every turn. It counts what the city
 * could produce, so disorder does not clean the air.
 */
export function cityPollution(state: GameState, city: City, effects = cityEffects(state, city)): Pollution {
  const shields = Math.floor((grossYield(state, city, effects).shields * (100 + effects.shieldsPct)) / 100);
  const industry = Math.floor((shields * effects.industryPollutionPct) / 100);
  const player = state.players[city.owner];
  const known = player ? RULES.pollutionTechs.filter((t) => player.techs.includes(t)).length : 0;
  const population = effects.noPopulationPollution ? 0 : Math.floor((city.size * known) / 4);
  const over = industry + population - RULES.pollutionFree;
  const chancePct = over > 0 ? Math.min(100, over * RULES.pollutionPctPerPoint) : 0;
  return { industry, population, chancePct };
}

/** Food surplus the automatic assignment tries to reach before it goes for shields. */
const TARGET_FOOD_SURPLUS = 1;

/** Military units of the owner standing in the city, each calming one unhappy citizen up to a limit. */
export function martialLaw(state: GameState, city: City): number {
  if (!governmentOf(state, city).martialLaw) return 0;
  const soldiers = state.units.filter(
    (u) =>
      u.owner === city.owner && u.x === city.x && u.y === city.y && UNIT_TYPES[u.type].attack > 0 && UNIT_TYPES[u.type].domain === "land",
  ).length;
  return Math.min(soldiers, RULES.martialLawMax);
}

export interface Happiness {
  happy: number;
  content: number;
  unhappy: number;
  /** Citizens who do not work a tile and keep the city calm instead. */
  entertainers: number;
  /** Citizens who do not work a tile and collect taxes or do research. */
  taxmen: number;
  scientists: number;
  /** More unhappy than content and happy citizens together: the city produces nothing. */
  disorder: boolean;
  /** Nobody unhappy, at least as many happy as content: the city celebrates. */
  celebrate: boolean;
}

/**
 * Citizens content without any help in each city of the owner. A large
 * empire is harder to keep happy: every RULES.empireSizeStep cities above
 * RULES.empireSizeBase cost one content citizen.
 */
export function contentLimit(state: GameState, owner: number): number {
  const cities = state.cities.filter((c) => c.owner === owner).length;
  const over = Math.max(0, cities - RULES.empireSizeBase);
  return Math.max(0, RULES.contentBase - Math.ceil(over / RULES.empireSizeStep));
}

/** How many of the citizens off the fields entertain, collect taxes or do research. */
export function specialists(city: City, idle = Math.max(0, city.size - city.worked.length)): { entertainers: number; taxmen: number; scientists: number } {
  if (city.size < RULES.specialistMinSize) return { entertainers: idle, taxmen: 0, scientists: 0 };
  const taxmen = Math.min(city.taxmen, idle);
  const scientists = Math.min(city.scientists, idle - taxmen);
  return { entertainers: idle - taxmen - scientists, taxmen, scientists };
}

/** Trade of the city after corruption, before it is split into science, luxuries and taxes. */
function netTrade(state: GameState, city: City, effects: CityEffects): { trade: number; corruption: number } {
  const gross = grossYield(state, city, effects).trade + routeTrade(state, city);
  const corruption = Math.round((gross * corruptionPct(state, city, effects)) / 100);
  return { trade: gross - corruption, corruption };
}

/** Science, luxury and tax shares of the owner, in percent. In anarchy all trade goes to luxuries. */
function rates(state: GameState, city: City): { science: number; luxury: number } {
  if (governmentOf(state, city).maxRate === 0) return { science: 0, luxury: 100 };
  const p = state.players[city.owner];
  return { science: p?.scienceRate ?? 0, luxury: p?.luxuryRate ?? 0 };
}

/**
 * Luxury points of the city: its share of trade plus what entertainers add,
 * raised by the buildings that raise gold.
 */
export function cityLuxury(state: GameState, city: City, effects = cityEffects(state, city), entertainers = specialists(city).entertainers): number {
  const share = rates(state, city).luxury;
  const fromTrade = share === 0 ? 0 : Math.round((netTrade(state, city, effects).trade * share) / 100);
  const base = fromTrade + entertainers * RULES.specialistYield;
  return Math.floor((base * (100 + effects.goldPct)) / 100);
}

/** Unhappy citizens before luxuries and specialists: the crowd and soldiers abroad, minus buildings and martial law. */
function unhappyBeforeLuxury(state: GameState, city: City, effects: CityEffects): number {
  if (effects.noUnhappy) return 0;
  const crowd = Math.max(0, city.size - contentLimit(state, city.owner));
  const unhappy = Math.min(city.size, crowd + militaryUnhappiness(state, city, effects));
  return Math.max(0, unhappy - effects.content - martialLaw(state, city));
}

/** Moods of the city with `idle` citizens off the fields. */
function moods(state: GameState, city: City, effects: CityEffects, idle: number): Happiness {
  const kinds = specialists(city, idle);
  // Specialists are taken from the unhappy first.
  let unhappy = Math.max(0, unhappyBeforeLuxury(state, city, effects) - idle);
  let content = city.size - idle - unhappy;
  // Luxuries calm the unhappy first, then make content citizens happy.
  let steps = Math.floor(cityLuxury(state, city, effects, kinds.entertainers) / RULES.luxuryPerContent);
  const calmed = Math.min(steps, unhappy);
  unhappy -= calmed;
  content += calmed;
  steps -= calmed;
  const happy = Math.min(steps, content);
  content -= happy;
  const disorder = unhappy > content + happy;
  const celebrate =
    !disorder &&
    governmentOf(state, city).celebration !== "none" &&
    city.size >= RULES.celebrationMinSize &&
    unhappy === 0 &&
    happy > 0 &&
    happy >= content;
  return { happy, content, unhappy, ...kinds, disorder, celebrate };
}

export function cityHappiness(state: GameState, city: City, effects = cityEffects(state, city)): Happiness {
  return moods(state, city, effects, Math.max(0, city.size - city.worked.length));
}

/** Unhappy citizens the luxuries make content, for the city screen. */
export function calmedByLuxury(state: GameState, city: City, effects = cityEffects(state, city)): number {
  const idle = Math.max(0, city.size - city.worked.length);
  const before = Math.max(0, unhappyBeforeLuxury(state, city, effects) - idle);
  return before - moods(state, city, effects, idle).unhappy;
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
  // As few citizens off the fields as the city needs to stay calm.
  let idle = 0;
  while (idle < city.size && moods(draft, city, effects, idle).disorder) idle++;
  const workers = city.size - idle;

  const candidates = workableTiles(draft, city).map((i) => ({ i, y: cityTileYield(draft, city, i, effects) }));
  const settlerUpkeep = settlerFood(draft, city);
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
  /** Trade from trade routes, included in production.trade. */
  routes: number;
  /** Trade lost on the way to the capital. */
  corruption: number;
  /** Shields paid for units beyond the free ones. */
  unitUpkeep: number;
  /** Trade split by the owner's shares, after corruption, buildings and disorder. */
  science: number;
  gold: number;
  /** Luxury points; every RULES.luxuryPerContent of them calm one unhappy citizen or make a content one happy. */
  luxury: number;
  /** Gold from shields when the city earns gold instead of building. */
  wealthGold: number;
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
  const routes = routeTrade(state, city);
  production.trade += routes;
  const settlerUpkeep = settlerFood(state, city);
  const foodUpkeep = city.size * RULES.foodPerCitizen + settlerUpkeep;
  const foodSurplus = production.food - foodUpkeep;
  const happiness = cityHappiness(state, city, effects);

  const gov = governmentOf(state, city);
  const share = rates(state, city);
  const { trade, corruption } = netTrade(state, city, effects);
  const baseScience = Math.round((trade * share.science) / 100);
  const baseLuxury = Math.round((trade * share.luxury) / 100);
  const baseGold = trade - baseScience - baseLuxury;
  const calm = !happiness.disorder;
  const unitUpkeep = unitShieldUpkeep(state, city);
  const shieldSurplus = calm ? Math.max(0, Math.floor((production.shields * (100 + effects.shieldsPct)) / 100) - unitUpkeep) : 0;
  // In anarchy trade only keeps people busy: no science and no gold.
  const paid = calm && gov.maxRate > 0;
  // Taxmen and scientists add to the base, before libraries and marketplaces.
  const extraScience = happiness.scientists * RULES.specialistYield;
  const extraGold = happiness.taxmen * RULES.specialistYield;
  const science = paid ? Math.floor(((baseScience + extraScience) * (100 + effects.sciencePct)) / 100) : 0;
  const gold = paid ? Math.floor(((baseGold + extraGold) * (100 + effects.goldPct)) / 100) : 0;

  const threshold = growthThreshold(city.size);
  const cost = productionCost(city.production);
  const popCost = city.production.kind === "unit" ? UNIT_TYPES[city.production.id].populationCost : 0;
  const canGrow = foodSurplus > 0 && city.size < effects.maxSize;
  return {
    production,
    foodUpkeep,
    foodSurplus,
    shieldSurplus,
    routes,
    corruption,
    unitUpkeep,
    science,
    gold,
    luxury: cityLuxury(state, city, effects),
    wealthGold: city.production.kind === "wealth" ? shieldSurplus * RULES.wealthGoldPerShield : 0,
    happiness,
    pollution: cityPollution(state, city, effects),
    growthThreshold: threshold,
    maxSize: effects.maxSize,
    turnsToGrow: canGrow ? Math.max(1, Math.ceil((threshold - city.food) / foodSurplus)) : null,
    turnsToComplete:
      city.production.kind === "wealth"
        ? null
        : city.shields >= cost
          ? 1
          : shieldSurplus > 0
            ? Math.max(1, Math.ceil((cost - city.shields) / shieldSurplus))
            : null,
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
  const gov = governmentOf(draft, city);
  const rng = Rng.fromState(draft.rng);
  if (report.happiness.disorder) events.push({ type: "cityDisorder", cityId: city.id });
  meltdownDraft(draft, city, report, rng, events);
  pollutionDraft(draft, city, report, rng, events);
  draft.rng = rng.getState();

  // Food: growth or starvation. A city at its size limit keeps a full food box.
  // A city that celebrates under a republic or democracy grows every turn it has food to spare.
  const rapture =
    city.celebrating && gov.celebration === "rapture" && report.happiness.celebrate && report.foodSurplus > 0 && city.size < effects.maxSize;
  if (rapture) {
    city.size += 1;
    city.manualTiles = false;
    events.push({ type: "cityGrew", cityId: city.id, size: city.size });
  } else city.food += report.foodSurplus;
  if (rapture) {
    // The food box stays as it is.
  } else if (city.food < 0) {
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

  // Units the city cannot pay for go home: the newest one is disbanded.
  const gross = Math.floor((report.production.shields * (100 + effects.shieldsPct)) / 100);
  if (!report.happiness.disorder && report.unitUpkeep > gross) {
    const newest = supportedUnits(draft, city).sort((a, b) => b.id - a.id)[0];
    if (newest) {
      removeUnitDraft(draft, newest.id);
      events.push({ type: "unitDisbanded", cityId: city.id, unitType: newest.type });
    }
  }

  // Production. Something that became impossible (a wonder built elsewhere,
  // an obsolete unit) is replaced before shields are added.
  if (!canBuild(draft, city, city.production)) nextProductionDraft(draft, city, events);
  city.shields += report.shieldSurplus;
  const item = city.production;
  if (item.kind === "wealth") {
    // Nothing is built: this turn's shields become gold, stored shields wait.
    city.shields -= report.shieldSurplus;
    endOfTurnMoodDraft(draft, city, events);
    return { science: report.science, gold: report.gold + report.wealthGold };
  }
  const cost = productionCost(item);
  if (city.shields >= cost) completeProductionDraft(draft, city, cost, events);
  endOfTurnMoodDraft(draft, city, events);
  return { science: report.science, gold: report.gold };
}

/**
 * Places the citizens for the next turn and notes how the city feels at the
 * end of the turn: a celebration starts or ends, and turns of disorder count up.
 */
function endOfTurnMoodDraft(draft: GameState, city: City, events: GameEvent[]): void {
  assignWorkersDraft(draft, city);
  if (!draft.cities.includes(city)) return;
  const h = cityHappiness(draft, city);
  city.disorderTurns = h.disorder ? city.disorderTurns + 1 : 0;
  if (h.celebrate !== city.celebrating) {
    city.celebrating = h.celebrate;
    events.push({ type: h.celebrate ? "celebrationStarted" : "celebrationEnded", cityId: city.id });
  }
}

/** A tile in the city's reach the city may pollute: land, not the centre, not polluted yet. */
function pollutableTiles(state: GameState, city: City): number[] {
  const center = idx(state.map, city);
  return cityRadiusTiles(state.map, city).filter((i) => i !== center && TERRAINS[state.map.terrain[i]!].land && !state.map.pollution[i]);
}

/** A dirty city may pollute one tile around it (mutates the draft). */
function pollutionDraft(draft: GameState, city: City, report: CityReport, rng: Rng, events: GameEvent[]): void {
  if (report.pollution.chancePct <= 0 || rng.int(100) >= report.pollution.chancePct) return;
  const tiles = pollutableTiles(draft, city);
  if (tiles.length === 0) return;
  const i = tiles[rng.int(tiles.length)]!;
  draft.map.pollution[i] = 1;
  events.push({ type: "tilePolluted", cityId: city.id, at: fromIndex(draft.map, i) });
}

/**
 * A nuclear plant in a city in disorder may melt down: half the citizens
 * die and the land around is polluted. Fusion power removes the danger.
 */
function meltdownDraft(draft: GameState, city: City, report: CityReport, rng: Rng, events: GameEvent[]): void {
  if (!report.happiness.disorder || !workingBuildings(draft, city).includes("nuclearPlant")) return;
  if (knowsTech(draft.players[city.owner]!, "fusionPower")) return;
  if (rng.int(100) >= RULES.meltdownPct) return;
  city.size = Math.max(1, city.size - Math.floor(city.size / 2));
  city.manualTiles = false;
  const center = idx(draft.map, city);
  for (const i of cityRadiusTiles(draft.map, city)) {
    if (i !== center && distance(fromIndex(draft.map, i), city) <= 1 && TERRAINS[draft.map.terrain[i]!].land) draft.map.pollution[i] = 1;
  }
  events.push({ type: "nuclearMeltdown", cityId: city.id, size: city.size });
}

function completeProductionDraft(draft: GameState, city: City, cost: number, events: GameEvent[]): void {
  const item = city.production;
  if (item.kind === "wealth") return;
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
    const built = makeUnit(unitId, city.owner, item.id, city, city.id);
    // Barracks train soldiers as veterans.
    if (rule.domain === "land" && rule.attack > 0 && cityEffects(draft, city).veteranUnits) built.veteran = true;
    draft.units.push(built);
    events.push({ type: "unitBuilt", cityId: city.id, unitId, unitType: item.id });
    // Without plans the city keeps making the same unit.
    if (city.queue.length > 0) nextProductionDraft(draft, city, events);
    return;
  }
  city.shields -= cost;
  const rule = BUILDINGS[item.id];
  if (rule.spaceship) {
    const player = draft.players[city.owner]!;
    player.spaceship[rule.spaceship] += 1;
    events.push({ type: "spaceshipPartBuilt", cityId: city.id, building: item.id });
    // The city keeps building parts while it can and has nothing else planned.
    if (city.queue.length > 0 || !canBuild(draft, city, item)) nextProductionDraft(draft, city, events);
    return;
  }
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
  for (let k = 0; k < (rule.effects.freeTechs ?? 0); k++) {
    const player = draft.players[city.owner]!;
    const tech = freeTechChoice(player);
    if (tech) learnTechDraft(draft, city.owner, tech, events);
  }
  // A building cannot be built twice: the city takes the next planned item or falls back to a defender.
  nextProductionDraft(draft, city, events);
}

/**
 * Moves the city on to the first item of its queue that it can still build,
 * dropping ones that became impossible, or to a defender when nothing is
 * planned (mutates the draft).
 */
function nextProductionDraft(draft: GameState, city: City, events: GameEvent[]): void {
  while (city.queue.length > 0) {
    const next = city.queue.shift()!;
    if (canBuild(draft, city, next)) {
      city.production = next;
      events.push({ type: "queueAdvanced", cityId: city.id, item: next });
      return;
    }
  }
  city.production = fallbackProduction(draft, city.owner);
  events.push({ type: "productionNeeded", cityId: city.id });
}

/** Removes a unit together with everything it carries (mutates the draft). */
export function removeUnitDraft(draft: GameState, unitId: number): void {
  const gone = new Set([unitId]);
  for (const u of draft.units) if (u.carriedBy === unitId) gone.add(u.id);
  draft.units = draft.units.filter((u) => !gone.has(u.id));
}
