/**
 * Everything a player can do, as commands. The human screen and the AI use
 * the same commands and the same checks, so the AI can never do something a
 * human could not.
 *
 * Each `can*` function returns null when the action is allowed, otherwise a
 * reason code. `applyCommand` never mutates its input; it returns a new state.
 */
import { assignWorkersDraft, sameItem } from "./city";
import { buyCost, canBuild, canResearch, fallbackProduction, nextStepToGoal } from "./economy";
import type { GameEvent } from "./events";
import { distance, neighbors4, type Point } from "./geometry";
import { findPath } from "./path";
import { canMove, continueGotoDraft, moveDraft } from "./units";

export { canMove };
import { BUILDINGS, CITY_NAMES, IMPROVEMENTS, RULES, TECHS, TERRAINS, UNIT_TYPES, type ImprovementId, type TechId } from "./rules";
import type { CityId, GameState, ProductionItem, Unit, UnitId } from "./state";
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
  | { type: "endTurn" };

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
  | "tooManyWorkers";

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
  if (!terrain || IMPROVEMENTS[improvement].turns[terrain] === undefined) return "terrainNotSuitable";
  if (state.map[improvement][i]) return "alreadyBuilt";
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
      const draft = cloneState(state);
      getPlayer(draft, state.currentPlayer).scienceRate = rate;
      return { ok: true, state: draft, events };
    }

    case "endTurn": {
      const draft = cloneState(state);
      endTurnDraft(draft, events);
      return { ok: true, state: draft, events };
    }
  }
}

/** Convenience for tests and tools: applies a command and throws on refusal. */
export function apply(state: GameState, command: Command): GameState {
  const result = applyCommand(state, command);
  if (!result.ok) throw new Error(`Command ${command.type} refused: ${result.error}`);
  return result.state;
}

