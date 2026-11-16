/**
 * Technologies, gold and what a city may build. Pure functions over GameState;
 * functions named *Draft mutate a cloned state.
 */
import type { GameEvent } from "./events";
import {
  BUILDINGS,
  GOVERNMENTS,
  RULES,
  TECHS,
  UNIT_TYPES,
  type BuildingEffects,
  type BuildingId,
  type BuildingRule,
  type GovernmentId,
  type TechId,
  type UnitTypeId,
} from "./rules";
import { distance, neighbors8 } from "./geometry";
import { emptySpaceship, type City, type GameState, type Player, type PlayerId, type ProductionItem } from "./state";

/** Economy fields of a player at the start of a game. */
export function startingEconomy(): Pick<
  Player,
  | "techs"
  | "researching"
  | "researchGoal"
  | "research"
  | "gold"
  | "scienceRate"
  | "luxuryRate"
  | "government"
  | "revolution"
  | "spaceship"
  | "embassies"
  | "defeated"
  | "contacts"
  | "atWar"
  | "peaceOffers"
  | "warSince"
  | "peaceSince"
  | "declaredOnMe"
  | "offeredPeace"
  | "treatiesBroken"
> {
  return {
    techs: [],
    researching: null,
    researchGoal: null,
    research: 0,
    gold: RULES.startingGold,
    scienceRate: RULES.startingScienceRate,
    luxuryRate: 0,
    government: "despotism",
    revolution: null,
    spaceship: emptySpaceship(),
    embassies: [],
    defeated: false,
    contacts: [],
    atWar: [],
    peaceOffers: [],
    warSince: {},
    peaceSince: {},
    declaredOnMe: {},
    offeredPeace: {},
    treatiesBroken: 0,
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

/**
 * Gives the player a technology (mutates the draft). Research in progress
 * moves on towards the goal, as when the player discovers it himself.
 */
export function learnTechDraft(draft: GameState, playerId: PlayerId, tech: TechId, events: GameEvent[]): void {
  const player = draft.players[playerId];
  if (!player || player.techs.includes(tech)) return;
  player.techs.push(tech);
  events.push({ type: "techLearned", player: playerId, tech });
  if (player.researching === tech || (player.researching !== null && !canResearch(player, player.researching))) player.researching = null;
  if (player.researching === null && player.researchGoal !== null) {
    player.researching = nextStepToGoal(player, player.researchGoal);
    if (player.researching === null) player.researchGoal = null;
  }
  if (player.researching === null && researchableTechs(player).length > 0) events.push({ type: "researchNeeded", player: playerId });
}

/** The technology a free discovery goes to: the current research, or the cheapest available one. */
export function freeTechChoice(player: Player): TechId | null {
  if (player.researching !== null) return player.researching;
  const options = researchableTechs(player).sort((a, b) => TECHS[a].era - TECHS[b].era);
  return options[0] ?? null;
}

/** Highest era among known technologies, 0 before the first one. */
export function currentEra(player: Player): number {
  return player.techs.reduce((e, t) => Math.max(e, TECHS[t].era), 0);
}

// ---------- governments ----------

/** Science rate allowed under the government: neither science nor gold may exceed maxRate. */
export function clampRate(rate: number, government: GovernmentId): number {
  const max = GOVERNMENTS[government].maxRate;
  if (max === 0) return rate;
  return Math.min(max, Math.max(100 - max, rate));
}

/**
 * True when science, luxuries and the taxes left over are each a multiple of
 * the rate step and none of them is above what the government allows.
 */
export function ratesAllowed(science: number, luxury: number, government: GovernmentId): boolean {
  const step = RULES.rateStep;
  const ok = (x: number) => Number.isInteger(x) && x >= 0 && x <= 100 && x % step === 0;
  if (!ok(science) || !ok(luxury) || science + luxury > 100) return false;
  const max = GOVERNMENTS[government].maxRate;
  if (max === 0) return true;
  return science <= max && luxury <= max && 100 - science - luxury <= max;
}

/**
 * The closest allowed split to the wanted one. The share named in `keep`
 * stays as wanted when it can; the other one gives way. Used by the screen
 * sliders and after a change of government.
 */
export function fitRates(science: number, luxury: number, government: GovernmentId, keep: "science" | "luxury" = "science"): { science: number; luxury: number } {
  const step = RULES.rateStep;
  const max = GOVERNMENTS[government].maxRate || 100;
  const round = (x: number) => Math.min(max, Math.max(0, Math.round(x / step) * step));
  let s = round(science);
  let l = round(luxury);
  for (let guard = 0; guard < 40 && !ratesAllowed(s, l, government); guard++) {
    const tax = 100 - s - l;
    const other = keep === "science" ? "luxury" : "science";
    if (tax < 0) {
      // Too much: the other share gives way first, then the kept one.
      if (other === "luxury" ? l > 0 : s > 0) other === "luxury" ? (l -= step) : (s -= step);
      else keep === "science" ? (s -= step) : (l -= step);
    } else if (tax > max) {
      // Taxes above the limit: the other share takes the rest, then the kept one.
      if (other === "luxury" ? l < max : s < max) other === "luxury" ? (l += step) : (s += step);
      else keep === "science" ? (s += step) : (l += step);
    } else break;
  }
  return { science: s, luxury: l };
}

/** Whether the player may choose the government; `anyGovernment` is the gift of the pyramids. */
export function canChooseGovernment(player: Player, government: GovernmentId, anyGovernment = false): boolean {
  if (government === "anarchy") return false;
  return anyGovernment || knowsTech(player, GOVERNMENTS[government].requires);
}

// ---------- wonders ----------

/** The player who owns the wonder while it still works (its owner does not know the technology that ends it). */
export function wonderOwner(state: GameState, id: BuildingId): PlayerId | null {
  const city = state.cities.find((c) => c.buildings.includes(id));
  if (!city) return null;
  const obsolete = BUILDINGS[id].obsoleteBy;
  const player = state.players[city.owner];
  if (obsolete && player?.techs.includes(obsolete)) return null;
  return city.owner;
}

export function hasWonder(state: GameState, player: PlayerId, id: BuildingId): boolean {
  return wonderOwner(state, id) === player;
}

/** Sum of a numeric effect over the player's working wonders. */
export function wonderEffect(state: GameState, player: PlayerId, key: "shipMoves" | "militaryUnhappyCut"): number {
  let total = 0;
  for (const c of state.cities) {
    if (c.owner !== player) continue;
    for (const b of c.buildings) if (BUILDINGS[b].wonder && wonderOwner(state, b) === player) total += BUILDINGS[b].effects[key] ?? 0;
  }
  return total;
}

export function wonderFlag(state: GameState, player: PlayerId, key: "safeTriremes" | "noAnarchy" | "allGovernments" | "seesAllCities" | "peaceOffers"): boolean {
  const owner = state.players[player];
  return state.cities.some(
    (c) =>
      c.owner === player &&
      c.buildings.some((b) => {
        const rule = BUILDINGS[b];
        // A wonder stops working once its owner knows the technology that makes it obsolete.
        if (rule.obsoleteBy && owner && knowsTech(owner, rule.obsoleteBy)) return false;
        return rule.effects[key] && wonderOwner(state, b) === player;
      }),
  );
}

// ---------- what can be built ----------

/** Wonders that exist anywhere in the game. */
export function builtWonders(state: GameState): BuildingId[] {
  const result: BuildingId[] = [];
  for (const c of state.cities) for (const b of c.buildings) if (BUILDINGS[b].wonder) result.push(b);
  return result;
}

export function canBuildUnitType(player: Player, id: UnitTypeId): boolean {
  const rule = UNIT_TYPES[id];
  if (!knowsTech(player, rule.requires)) return false;
  // A unit disappears from the list once its replacement can be built.
  const next = rule.obsoleteBy;
  return next === null || !knowsTech(player, UNIT_TYPES[next].requires);
}

/**
 * The newest unit this one can be upgraded to: follows the chain of
 * replacements (obsoleteBy) as far as the player knows the technologies.
 * Only needs the player's technologies, so the AI can ask the same question.
 */
export function upgradeTarget(player: Pick<Player, "techs">, type: UnitTypeId): UnitTypeId | null {
  let target: UnitTypeId | null = null;
  let next = UNIT_TYPES[type].obsoleteBy;
  while (next !== null) {
    const rule = UNIT_TYPES[next];
    if (rule.requiresWonder || !player.techs.includes(rule.requires as TechId)) break;
    target = next;
    next = rule.obsoleteBy;
  }
  return target;
}

export function upgradeCost(from: UnitTypeId, to: UnitTypeId): number {
  const diff = Math.max(0, UNIT_TYPES[to].cost - UNIT_TYPES[from].cost);
  return RULES.upgradeGoldBase + RULES.upgradeGoldPerShield * diff;
}

/** Shields a unit adds to a city's production when it is disbanded there. */
export function disbandShields(type: UnitTypeId): number {
  return Math.floor((UNIT_TYPES[type].cost * RULES.disbandShieldsPct) / 100);
}

/** True when the city stands next to the ocean. */
export function isCoastal(state: GameState, city: City): boolean {
  return neighbors8(state.map, city.y * state.map.width + city.x).some((i) => state.map.terrain[i] === "ocean");
}

/** Whether this city can build the unit: the technology, a coast for ships, a wonder some units need. */
export function canBuildUnit(state: GameState, city: City, id: UnitTypeId): boolean {
  const player = state.players[city.owner];
  if (!player || !canBuildUnitType(player, id)) return false;
  const rule = UNIT_TYPES[id];
  if (rule.domain === "sea" && !isCoastal(state, city)) return false;
  if (rule.requiresWonder && !builtWonders(state).includes(rule.requiresWonder)) return false;
  return true;
}

export function canBuildBuilding(state: GameState, city: City, rule: BuildingRule): boolean {
  const player = state.players[city.owner];
  if (!player || !knowsTech(player, rule.requires)) return false;
  if (rule.requiresWonder && !builtWonders(state).includes(rule.requiresWonder)) return false;
  if (rule.spaceship) {
    const ship = player.spaceship;
    const max = { structural: RULES.spaceship.maxStructural, component: RULES.spaceship.maxComponent, module: RULES.spaceship.maxModule }[rule.spaceship];
    return ship.launchedTurn === null && ship[rule.spaceship] < max && capitalOf(state, city.owner) !== undefined;
  }
  if (city.buildings.includes(rule.id)) return false;
  if (rule.requiresBuilding !== null && !city.buildings.includes(rule.requiresBuilding)) return false;
  if (rule.coastal && !isCoastal(state, city)) return false;
  if (rule.wonder && builtWonders(state).includes(rule.id)) return false;
  return true;
}

export function canBuild(state: GameState, city: City, item: ProductionItem): boolean {
  const player = state.players[city.owner];
  if (!player) return false;
  if (item.kind === "wealth") return true;
  return item.kind === "unit" ? canBuildUnit(state, city, item.id) : canBuildBuilding(state, city, BUILDINGS[item.id]);
}

/** What the city can be set to produce, units first. */
export function productionOptions(state: GameState, city: City): ProductionItem[] {
  const player = state.players[city.owner];
  if (!player) return [];
  const units: ProductionItem[] = Object.values(UNIT_TYPES)
    .filter((u) => canBuildUnit(state, city, u.id))
    .map((u) => ({ kind: "unit", id: u.id }));
  const buildings: ProductionItem[] = Object.values(BUILDINGS)
    .filter((b) => canBuildBuilding(state, city, b))
    .map((b) => ({ kind: "building", id: b.id }));
  return [...units, ...buildings, { kind: "wealth" }];
}

/**
 * What a city switches to when its production is finished or no longer
 * possible: the best defender it can build.
 */
export function fallbackProduction(state: GameState, owner: PlayerId): ProductionItem {
  const player = state.players[owner];
  const military = Object.values(UNIT_TYPES)
    .filter((u) => u.domain === "land" && u.attack > 0 && !u.special && player && canBuildUnitType(player, u.id))
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
  tradeOnTradeTiles: number;
  noUnhappy: boolean;
  militaryUnhappyCut: number;
  defenseVsSeaPct: number;
  defenseVsLandPct: number;
  veteranUnits: boolean;
  nuclearShield: number;
}

/** Buildings of the city that work: the needed building stands and the owner does not know what makes them obsolete. */
export function workingBuildings(state: GameState, city: City): BuildingId[] {
  const player = state.players[city.owner];
  return city.buildings.filter((b) => {
    const rule = BUILDINGS[b];
    if (rule.requiresBuilding !== null && !city.buildings.includes(rule.requiresBuilding)) return false;
    return !(rule.obsoleteBy && player?.techs.includes(rule.obsoleteBy));
  });
}

/**
 * Combined effect of the city's buildings and of its owner's wonders that work everywhere.
 * A building that needs another one (a power plant needs a factory) does nothing without it,
 * and a wonder stops working once its owner knows the technology that makes it obsolete.
 */
export function cityEffects(state: GameState, city: City): CityEffects {
  const own = workingBuildings(state, city);
  const empireWide: BuildingId[] = [];
  for (const other of state.cities) {
    if (other.owner !== city.owner || other.id === city.id) continue;
    for (const b of workingBuildings(state, other)) if (BUILDINGS[b].wonder && BUILDINGS[b].scope === "all") empireWide.push(b);
  }
  const all = [...own, ...empireWide];
  const sum = (key: "templePct" | "cathedralPct" | "libraryBoostPct") => all.reduce((n, b) => n + (BUILDINGS[b].effects[key] ?? 0), 0);
  const templePct = sum("templePct");
  const cathedralPct = sum("cathedralPct");
  const libraryBoostPct = sum("libraryBoostPct");

  const sources: BuildingEffects[] = all.map((b) => {
    const e = BUILDINGS[b].effects;
    if (b === "temple" && templePct) return { ...e, content: Math.round(((e.content ?? 0) * (100 + templePct)) / 100) };
    if (b === "cathedral" && cathedralPct) return { ...e, content: Math.round(((e.content ?? 0) * (100 + cathedralPct)) / 100) };
    if ((b === "library" || b === "university" || b === "researchLab") && libraryBoostPct) {
      return { ...e, sciencePct: (e.sciencePct ?? 0) + libraryBoostPct };
    }
    return e;
  });
  // A dam for everyone: a city with a factory and no power plant works as if it had a hydro plant.
  if (all.some((b) => BUILDINGS[b].effects.plantInEveryCity) && own.includes("factory") && !own.some((b) => BUILDINGS[b].group === "power")) {
    sources.push(BUILDINGS.hydroPlant.effects);
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
    tradeOnTradeTiles: 0,
    noUnhappy: false,
    militaryUnhappyCut: 0,
    defenseVsSeaPct: 0,
    defenseVsLandPct: 0,
    veteranUnits: false,
    nuclearShield: 0,
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
    result.tradeOnTradeTiles += e.tradeOnTradeTiles ?? 0;
    result.noUnhappy ||= e.noUnhappy ?? false;
    result.militaryUnhappyCut += e.militaryUnhappyCut ?? 0;
    result.defenseVsSeaPct += e.defenseVsSeaPct ?? 0;
    result.defenseVsLandPct += e.defenseVsLandPct ?? 0;
    result.veteranUnits ||= e.veteranUnits ?? false;
    result.nuclearShield = Math.max(result.nuclearShield, e.nuclearShield ?? 0);
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
  const gov = GOVERNMENTS[state.players[city.owner]?.government ?? "despotism"];
  const capital = capitalOf(state, city.owner);
  const byDistance = capital ? distance(city, capital) * RULES.corruptionPerTile : RULES.corruptionMaxPct;
  const raw = Math.min(RULES.corruptionMaxPct, (byDistance * gov.corruptionPct) / 100 + gov.corruptionFlatPct);
  return Math.round((raw * (100 - effects.corruptionCutPct)) / 100);
}

// ---------- gold ----------

export function buildingUpkeep(state: GameState, player: PlayerId): number {
  let total = 0;
  for (const c of state.cities) if (c.owner === player) for (const b of c.buildings) total += BUILDINGS[b].upkeep;
  return total;
}

/** Turns a spaceship with these parts flies, and its chance of a safe landing. */
export function spaceshipFlight(ship: { component: number; module: number }): { turns: number; successPct: number } {
  const r = RULES.spaceship;
  return {
    turns: Math.max(r.minTurns, r.baseTurns - r.turnsPerComponent * ship.component),
    successPct: Math.min(100, r.successPerModule * ship.module),
  };
}

/** Null when the ship can start, otherwise why not. */
export function spaceshipLaunchProblem(state: GameState, player: PlayerId): "launched" | "noCapital" | "noComponent" | "noModule" | "tooFewStructures" | null {
  const ship = state.players[player]?.spaceship;
  if (!ship) return "noCapital";
  if (ship.launchedTurn !== null) return "launched";
  if (!capitalOf(state, player)) return "noCapital";
  if (ship.component < 1) return "noComponent";
  if (ship.module < 1) return "noModule";
  if (ship.structural < ship.component + ship.module) return "tooFewStructures";
  return null;
}

/** Gold needed to finish the city's current production this turn, 0 when it is already paid. */
export function buyCost(city: City): number {
  const item = city.production;
  if (item.kind === "wealth") return 0;
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
