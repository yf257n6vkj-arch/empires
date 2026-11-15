/**
 * Everything a player can do, as commands. The human screen and the AI use
 * the same commands and the same checks, so the AI can never do something a
 * human could not.
 *
 * Each `can*` function returns null when the action is allowed, otherwise a
 * reason code. `applyCommand` never mutates its input; it returns a new state.
 */
import { assignWorkersDraft, removeUnitDraft, sameItem } from "./city";
import {
  buyCost,
  canBuild,
  canChooseGovernment,
  canResearch,
  capitalOf,
  cityEffects,
  clampRate,
  fallbackProduction,
  knowsTech,
  learnTechDraft,
  nextStepToGoal,
  spaceshipFlight,
  spaceshipLaunchProblem,
  wonderFlag,
} from "./economy";
import { cityReport } from "./city";
import { Rng } from "./rng";
import type { GameEvent } from "./events";
import { distance, neighbors4, type Point } from "./geometry";
import { findPath } from "./path";
import { boardDraft, canMove, continueGotoDraft, moveDraft } from "./units";

export { canMove };
import {
  BUILDINGS,
  CITY_NAMES,
  GOVERNMENTS,
  IMPROVEMENTS,
  RULES,
  TECHS,
  TERRAINS,
  UNIT_TYPES,
  type GovernmentId,
  type ImprovementId,
  type TechId,
} from "./rules";
import type { City, CityId, GameState, ProductionItem, Unit, UnitId } from "./state";
import { endTurnDraft } from "./turn";
import { cityAt, cityName, cloneState, getPlayer, idx, reveal, workableTiles } from "./world";

export type Command =
  | { type: "move"; unitId: UnitId; to: Point }
  | { type: "goto"; unitId: UnitId; to: Point }
  | { type: "foundCity"; unitId: UnitId }
  | { type: "buildImprovement"; unitId: UnitId; improvement: ImprovementId }
  | { type: "fortify"; unitId: UnitId }
  | { type: "skipTurn"; unitId: UnitId }
  | { type: "cancelOrders"; unitId: UnitId }
  | { type: "setProduction"; cityId: CityId; item: ProductionItem }
  | { type: "buy"; cityId: CityId }
  | { type: "setResearch"; tech: TechId }
  | { type: "setResearchGoal"; tech: TechId }
  | { type: "setWorkedTiles"; cityId: CityId; tiles: number[] }
  | { type: "autoAssignWorkers"; cityId: CityId }
  | { type: "setScienceRate"; rate: number }
  | { type: "board"; unitId: UnitId }
  | { type: "revolution"; government: GovernmentId }
  | { type: "launchSpaceship" }
  | { type: "helpWonder"; unitId: UnitId }
  | { type: "tradeRoute"; unitId: UnitId; cityId: CityId }
  | { type: "diplomat"; unitId: UnitId; cityId: CityId; action: DiplomatAction }
  | { type: "detonate"; unitId: UnitId; at: Point }
  | { type: "endTurn" };

export type DiplomatAction = "embassy" | "stealTech" | "sabotage" | "incite";

export type CommandError =
  | "unknownUnit"
  | "notYourUnit"
  | "unknownCity"
  | "notYourCity"
  | "noMovesLeft"
  | "notAdjacent"
  | "cannotEnter"
  | "notEnoughMoves"
  | "occupiedByOther"
  | "cannotFoundCity"
  | "cityTooClose"
  | "cannotBuildImprovements"
  | "terrainNotSuitable"
  | "alreadyBuilt"
  | "needsWater"
  | "onCityTile"
  | "noPath"
  | "invalidProduction"
  | "alreadyComplete"
  | "notEnoughGold"
  | "unknownTech"
  | "cannotResearch"
  | "invalidRate"
  | "alreadyKnown"
  | "tileNotWorkable"
  | "tooManyWorkers"
  | "noShip"
  | "unknownGovernment"
  | "governmentNotKnown"
  | "alreadyGovernment"
  | "revolutionRunning"
  | "spaceshipNotReady"
  | "wrongUnit"
  | "notBuildingWonder"
  | "notInCity"
  | "tooClose"
  | "routeExists"
  | "tooManyRoutes"
  | "noHomeCity"
  | "notForeign"
  | "embassyExists"
  | "nothingToSteal"
  | "alreadyStolen"
  | "isCapital"
  | "tooFar"
  | "needsTech"
  | "needsRoad";

export type CommandResult =
  | { ok: true; state: GameState; events: GameEvent[] }
  | { ok: false; error: CommandError };

function ownUnit(state: GameState, unitId: UnitId): Unit | CommandError {
  const unit = state.units.find((u) => u.id === unitId);
  if (!unit) return "unknownUnit";
  if (unit.owner !== state.currentPlayer) return "notYourUnit";
  return unit;
}

export function canFoundCity(state: GameState, unit: Unit): CommandError | null {
  if (!UNIT_TYPES[unit.type].foundsCity) return "cannotFoundCity";
  if (unit.movesLeft <= 0) return "noMovesLeft";
  const terrain = state.map.terrain[idx(state.map, unit)];
  if (!terrain || !TERRAINS[terrain].land) return "terrainNotSuitable";
  if (state.cities.some((c) => distance(c, unit) < RULES.minCityDistance)) return "cityTooClose";
  return null;
}

export function canBuildImprovement(
  state: GameState,
  unit: Unit,
  improvement: ImprovementId,
): CommandError | null {
  if (!UNIT_TYPES[unit.type].buildsImprovements) return "cannotBuildImprovements";
  if (unit.movesLeft <= 0) return "noMovesLeft";
  if (cityAt(state, unit)) return "onCityTile";
  const i = idx(state.map, unit);
  const terrain = state.map.terrain[i];
  const rule = IMPROVEMENTS[improvement];
  if (!terrain || rule.turns[terrain] === undefined) return "terrainNotSuitable";
  if (state.map[improvement][i]) return "alreadyBuilt";
  if (rule.requires && !knowsTech(getPlayer(state, unit.owner), rule.requires)) return "needsTech";
  if (rule.requiresImprovement && !state.map[rule.requiresImprovement][i]) return "needsRoad";
  if (improvement === "irrigation") {
    const watered = neighbors4(state.map, i).some(
      (n) =>
        state.map.terrain[n] === "ocean" ||
        state.map.irrigation[n] === 1 ||
        state.cities.some((c) => idx(state.map, c) === n),
    );
    if (!watered) return "needsWater";
  }
  return null;
}

export function applyCommand(state: GameState, command: Command): CommandResult {
  const events: GameEvent[] = [];

  switch (command.type) {
    case "move": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      const error = canMove(state, unit, command.to);
      if (error) return { ok: false, error };
      const draft = cloneState(state);
      const u = draft.units.find((x) => x.id === unit.id)!;
      u.goto = null;
      moveDraft(draft, u, command.to);
      return { ok: true, state: draft, events };
    }

    case "goto": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      if (!findPath(state, unit.owner, unit, command.to)) return { ok: false, error: "noPath" };
      const draft = cloneState(state);
      const u = draft.units.find((x) => x.id === unit.id)!;
      u.goto = { ...command.to };
      u.fortified = false;
      u.work = null;
      continueGotoDraft(draft, u, events);
      return { ok: true, state: draft, events };
    }

    case "foundCity": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      const error = canFoundCity(state, unit);
      if (error) return { ok: false, error };
      const draft = cloneState(state);
      const player = getPlayer(draft, unit.owner);
      const cityId = draft.nextId++;
      const city = {
        id: cityId,
        owner: unit.owner,
        name: cityName(player, player.citiesFounded, CITY_NAMES),
        x: unit.x,
        y: unit.y,
        size: 1,
        food: 0,
        shields: 0,
        production: fallbackProduction(draft, unit.owner),
        // The first city of a player is the capital.
        buildings: player.citiesFounded === 0 ? ["palace" as const] : [],
        worked: [],
        manualTiles: false,
        foundedTurn: draft.turn,
        tradeRoutes: [],
        stolenBy: [],
      };
      player.citiesFounded += 1;
      draft.cities.push(city);
      draft.units = draft.units.filter((u) => u.id !== unit.id);
      reveal(draft, unit.owner, unit, RULES.citySight);
      assignWorkersDraft(draft, draft.cities[draft.cities.length - 1]!);
      events.push({ type: "cityFounded", cityId, owner: unit.owner });
      return { ok: true, state: draft, events };
    }

    case "buildImprovement": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      const error = canBuildImprovement(state, unit, command.improvement);
      if (error) return { ok: false, error };
      const draft = cloneState(state);
      const u = draft.units.find((x) => x.id === unit.id)!;
      u.work = { improvement: command.improvement, progress: 0 };
      u.goto = null;
      u.fortified = false;
      u.movesLeft = 0;
      return { ok: true, state: draft, events };
    }

    case "fortify":
    case "skipTurn":
    case "cancelOrders": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      const draft = cloneState(state);
      const u = draft.units.find((x) => x.id === unit.id)!;
      u.goto = null;
      u.work = null;
      if (command.type === "fortify") {
        u.fortified = true;
        u.movesLeft = 0;
      } else if (command.type === "skipTurn") {
        u.movesLeft = 0;
      } else {
        u.fortified = false;
      }
      return { ok: true, state: draft, events };
    }

    case "setProduction": {
      const city = state.cities.find((c) => c.id === command.cityId);
      if (!city) return { ok: false, error: "unknownCity" };
      if (city.owner !== state.currentPlayer) return { ok: false, error: "notYourCity" };
      if (!canBuild(state, city, command.item)) return { ok: false, error: "invalidProduction" };
      const draft = cloneState(state);
      draft.cities.find((c) => c.id === city.id)!.production = { ...command.item };
      return { ok: true, state: draft, events };
    }

    case "buy": {
      const city = state.cities.find((c) => c.id === command.cityId);
      if (!city) return { ok: false, error: "unknownCity" };
      if (city.owner !== state.currentPlayer) return { ok: false, error: "notYourCity" };
      const price = buyCost(city);
      if (price === 0) return { ok: false, error: "alreadyComplete" };
      if (getPlayer(state, city.owner).gold < price) return { ok: false, error: "notEnoughGold" };
      const draft = cloneState(state);
      const c = draft.cities.find((x) => x.id === city.id)!;
      getPlayer(draft, c.owner).gold -= price;
      c.shields = c.production.kind === "unit" ? UNIT_TYPES[c.production.id].cost : BUILDINGS[c.production.id].cost;
      return { ok: true, state: draft, events };
    }

    case "setResearch": {
      if (!(command.tech in TECHS)) return { ok: false, error: "unknownTech" };
      const player = getPlayer(state, state.currentPlayer);
      if (!canResearch(player, command.tech)) return { ok: false, error: "cannotResearch" };
      const draft = cloneState(state);
      const p = getPlayer(draft, state.currentPlayer);
      p.researching = command.tech;
      p.researchGoal = null;
      return { ok: true, state: draft, events };
    }

    case "setResearchGoal": {
      if (!(command.tech in TECHS)) return { ok: false, error: "unknownTech" };
      const player = getPlayer(state, state.currentPlayer);
      if (player.techs.includes(command.tech)) return { ok: false, error: "alreadyKnown" };
      const draft = cloneState(state);
      const p = getPlayer(draft, state.currentPlayer);
      // Collected science is shared, so switching to the first step loses nothing.
      p.researching = nextStepToGoal(p, command.tech);
      p.researchGoal = p.researching === command.tech ? null : command.tech;
      return { ok: true, state: draft, events };
    }

    case "setWorkedTiles": {
      const city = state.cities.find((c) => c.id === command.cityId);
      if (!city) return { ok: false, error: "unknownCity" };
      if (city.owner !== state.currentPlayer) return { ok: false, error: "notYourCity" };
      const tiles = [...new Set(command.tiles)];
      if (tiles.length > city.size) return { ok: false, error: "tooManyWorkers" };
      const allowed = new Set(workableTiles(state, city));
      if (tiles.some((i) => !allowed.has(i))) return { ok: false, error: "tileNotWorkable" };
      const draft = cloneState(state);
      const c = draft.cities.find((x) => x.id === city.id)!;
      c.worked = tiles.sort((a, b) => a - b);
      c.manualTiles = true;
      return { ok: true, state: draft, events };
    }

    case "autoAssignWorkers": {
      const city = state.cities.find((c) => c.id === command.cityId);
      if (!city) return { ok: false, error: "unknownCity" };
      if (city.owner !== state.currentPlayer) return { ok: false, error: "notYourCity" };
      const draft = cloneState(state);
      const c = draft.cities.find((x) => x.id === city.id)!;
      c.manualTiles = false;
      assignWorkersDraft(draft, c);
      return { ok: true, state: draft, events };
    }

    case "setScienceRate": {
      const rate = command.rate;
      if (!Number.isInteger(rate) || rate < 0 || rate > 100 || rate % RULES.rateStep !== 0) {
        return { ok: false, error: "invalidRate" };
      }
      const player = getPlayer(state, state.currentPlayer);
      if (clampRate(rate, player.government) !== rate) return { ok: false, error: "invalidRate" };
      const draft = cloneState(state);
      getPlayer(draft, state.currentPlayer).scienceRate = rate;
      return { ok: true, state: draft, events };
    }

    case "board": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      const draft = cloneState(state);
      const error = boardDraft(draft, draft.units.find((x) => x.id === unit.id)!);
      if (error) return { ok: false, error };
      return { ok: true, state: draft, events };
    }

    case "revolution": {
      if (!(command.government in GOVERNMENTS)) return { ok: false, error: "unknownGovernment" };
      const player = getPlayer(state, state.currentPlayer);
      if (!canChooseGovernment(player, command.government)) return { ok: false, error: "governmentNotKnown" };
      if (player.revolution) return { ok: false, error: "revolutionRunning" };
      if (player.government === command.government) return { ok: false, error: "alreadyGovernment" };
      const draft = cloneState(state);
      const p = getPlayer(draft, state.currentPlayer);
      const turns = wonderFlag(state, p.id, "fastRevolution") ? 1 : RULES.anarchyTurns;
      p.government = "anarchy";
      p.revolution = { target: command.government, turnsLeft: turns };
      events.push({ type: "revolutionStarted", player: p.id, target: command.government, turns });
      return { ok: true, state: draft, events };
    }

    case "launchSpaceship": {
      if (spaceshipLaunchProblem(state, state.currentPlayer)) return { ok: false, error: "spaceshipNotReady" };
      const draft = cloneState(state);
      const ship = getPlayer(draft, state.currentPlayer).spaceship;
      const flight = spaceshipFlight(ship);
      ship.launchedTurn = draft.turn;
      ship.arrivalTurn = draft.turn + flight.turns;
      ship.successPct = flight.successPct;
      events.push({ type: "spaceshipLaunched", player: state.currentPlayer, arrivalTurn: ship.arrivalTurn });
      return { ok: true, state: draft, events };
    }

    case "helpWonder": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      if (UNIT_TYPES[unit.type].special !== "caravan") return { ok: false, error: "wrongUnit" };
      const city = cityAt(state, unit);
      if (!city || city.owner !== unit.owner) return { ok: false, error: "notInCity" };
      if (city.production.kind !== "building" || !BUILDINGS[city.production.id].wonder) return { ok: false, error: "notBuildingWonder" };
      const draft = cloneState(state);
      const c = draft.cities.find((x) => x.id === city.id)!;
      const shields = UNIT_TYPES[unit.type].cost;
      c.shields += shields;
      removeUnitDraft(draft, unit.id);
      events.push({ type: "wonderHelped", cityId: c.id, shields });
      return { ok: true, state: draft, events };
    }

    case "tradeRoute": {
      const unit = ownUnit(state, command.unitId);
      if (typeof unit === "string") return { ok: false, error: unit };
      if (UNIT_TYPES[unit.type].special !== "caravan") return { ok: false, error: "wrongUnit" };
      const error = canOpenTradeRoute(state, unit, command.cityId);
      if (error) return { ok: false, error };
      const draft = cloneState(state);
      const home = draft.cities.find((c) => c.id === unit.homeCity)!;
      const target = draft.cities.find((c) => c.id === command.cityId)!;
      // One-time reward: gold and science for the long journey.
      const bonus = Math.floor(((distance(home, target) + 10) * (cityReport(draft, home).production.trade + cityReport(draft, target).production.trade)) / 24);
      const owner = getPlayer(draft, unit.owner);
      owner.gold += bonus;
      owner.research += bonus;
      home.tradeRoutes.push(target.id);
      if (target.tradeRoutes.length < RULES.tradeRoutesPerCity && !target.tradeRoutes.includes(home.id)) target.tradeRoutes.push(home.id);
      removeUnitDraft(draft, unit.id);
      events.push({ type: "tradeRouteOpened", from: home.id, to: target.id, bonus });
      return { ok: true, state: draft, events };
    }

    case "diplomat":
      return diplomatCommand(state, command.unitId, command.cityId, command.action);

    case "detonate":
      return detonateCommand(state, command.unitId, command.at);

    case "endTurn": {
      const draft = cloneState(state);
      endTurnDraft(draft, events);
      return { ok: true, state: draft, events };
    }
  }
}

/** Null when the caravan can open a trade route to the city: it stands in it or next to it, far enough from home. */
export function canOpenTradeRoute(state: GameState, unit: Unit, cityId: CityId): CommandError | null {
  const target = state.cities.find((c) => c.id === cityId);
  if (!target) return "unknownCity";
  if (distance(unit, target) > 1) return "notAdjacent";
  const home = state.cities.find((c) => c.id === unit.homeCity);
  if (!home) return "noHomeCity";
  if (home.id === target.id || distance(home, target) < RULES.tradeRouteMinDistance) return "tooClose";
  if (home.tradeRoutes.includes(target.id)) return "routeExists";
  if (home.tradeRoutes.length >= RULES.tradeRoutesPerCity) return "tooManyRoutes";
  return null;
}

/** Gold a diplomat must pay to make a city change sides. */
export function inciteCost(state: GameState, city: City): number {
  const owner = getPlayer(state, city.owner);
  const capital = capitalOf(state, city.owner);
  const far = capital ? distance(city, capital) : 32;
  const units = state.units.filter((u) => u.x === city.x && u.y === city.y).length;
  const base = ((owner.gold + 1000) * city.size) / (far + 3) + units * 20;
  return Math.round(cityReport(state, city).happiness.disorder ? base / 2 : base);
}

function diplomatCommand(state: GameState, unitId: UnitId, cityId: CityId, action: DiplomatAction): CommandResult {
  const events: GameEvent[] = [];
  const unit = ownUnit(state, unitId);
  if (typeof unit === "string") return { ok: false, error: unit };
  if (UNIT_TYPES[unit.type].special !== "diplomat") return { ok: false, error: "wrongUnit" };
  if (unit.movesLeft <= 0) return { ok: false, error: "noMovesLeft" };
  const city = state.cities.find((c) => c.id === cityId);
  if (!city) return { ok: false, error: "unknownCity" };
  if (city.owner === unit.owner) return { ok: false, error: "notForeign" };
  if (distance(unit, city) > 1) return { ok: false, error: "notAdjacent" };
  const me = getPlayer(state, unit.owner);
  const them = getPlayer(state, city.owner);
  const draft = cloneState(state);
  const actor = getPlayer(draft, unit.owner);
  const rng = Rng.fromState(draft.rng);
  const target = draft.cities.find((c) => c.id === city.id)!;
  switch (action) {
    case "embassy":
      if (me.embassies.includes(city.owner)) return { ok: false, error: "embassyExists" };
      actor.embassies.push(city.owner);
      events.push({ type: "embassyOpened", player: me.id, with: them.id });
      break;
    case "stealTech": {
      if (city.stolenBy.includes(me.id)) return { ok: false, error: "alreadyStolen" };
      const options = them.techs.filter((t) => !me.techs.includes(t));
      if (options.length === 0) return { ok: false, error: "nothingToSteal" };
      const tech = options[rng.int(options.length)]!;
      target.stolenBy.push(me.id);
      learnTech(draft, me.id, tech, events);
      events.push({ type: "techStolen", player: me.id, from: them.id, tech });
      break;
    }
    case "sabotage": {
      const targets = target.buildings.filter((b) => !BUILDINGS[b].wonder && b !== "palace");
      if (targets.length === 0 || rng.chance(0.5)) {
        target.shields = 0;
        events.push({ type: "citySabotaged", cityId: target.id, building: null });
      } else {
        const b = targets[rng.int(targets.length)]!;
        target.buildings = target.buildings.filter((x) => x !== b);
        events.push({ type: "citySabotaged", cityId: target.id, building: b });
      }
      break;
    }
    case "incite": {
      if (target.buildings.includes("palace")) return { ok: false, error: "isCapital" };
      const price = inciteCost(state, city);
      if (me.gold < price) return { ok: false, error: "notEnoughGold" };
      actor.gold -= price;
      const from = target.owner;
      target.owner = me.id;
      target.tradeRoutes = [];
      target.manualTiles = false;
      for (const u of draft.units) {
        if (u.x === target.x && u.y === target.y && u.owner === from) {
          u.owner = me.id;
          u.homeCity = target.id;
        }
      }
      // Units of the old owner that this city fed now belong to nobody's city.
      for (const u of draft.units) if (u.homeCity === target.id && u.owner === from) u.homeCity = null;
      reveal(draft, me.id, target, RULES.citySight);
      assignWorkersDraft(draft, target);
      events.push({ type: "cityIncited", cityId: target.id, from, to: me.id });
      break;
    }
  }
  draft.rng = rng.getState();
  removeUnitDraft(draft, unit.id);
  return { ok: true, state: draft, events };
}

function learnTech(draft: GameState, player: number, tech: TechId, events: GameEvent[]): void {
  learnTechDraft(draft, player, tech, events);
}

/** Where a missile still reaches this turn: as far as its remaining moves. */
function detonateCommand(state: GameState, unitId: UnitId, at: Point): CommandResult {
  const events: GameEvent[] = [];
  const unit = ownUnit(state, unitId);
  if (typeof unit === "string") return { ok: false, error: unit };
  if (UNIT_TYPES[unit.type].special !== "nuclear") return { ok: false, error: "wrongUnit" };
  if (distance(unit, at) * RULES.movesFraction > unit.movesLeft) return { ok: false, error: "tooFar" };
  const draft = cloneState(state);
  removeUnitDraft(draft, unit.id);
  // A missile shield stops it when a protected city lies close enough to the target.
  const shielded = draft.cities.some((c) => {
    const shield = cityEffects(draft, c).nuclearShield;
    return shield > 0 && c.owner !== unit.owner && distance(c, at) <= shield;
  });
  if (!shielded) {
    const r = RULES.nuclearRadius;
    const hit = (p: Point) => distance(p, at) <= r;
    const victims = draft.units.filter((u) => hit(u)).map((u) => u.id);
    for (const id of victims) removeUnitDraft(draft, id);
    for (const c of draft.cities) {
      if (!hit(c)) continue;
      c.size = Math.max(1, Math.floor(c.size / 2));
      c.manualTiles = false;
      assignWorkersDraft(draft, c);
    }
  }
  events.push({ type: "nuclearStrike", at: { ...at }, owner: unit.owner, intercepted: shielded });
  return { ok: true, state: draft, events };
}

/** Convenience for tests and tools: applies a command and throws on refusal. */
export function apply(state: GameState, command: Command): GameState {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Command ${command.type} refused: ${result.error}`);
  return result.state;
}

