/**
 * Ending a player's turn and starting the next one. Players move one after
 * another; when the last player ends, a new game turn begins.
 */
import { processCityDraft, removeUnitDraft } from "./city";
import {
  buildingUpkeep,
  fitRates,
  learnTechDraft,
  nextStepToGoal,
  researchCost,
  sellBuildingsForUpkeepDraft,
  wonderFlag,
  wonderOwner,
} from "./economy";
import { aircraftSafe, continueGotoDraft, turnMoves } from "./units";
import type { GameEvent } from "./events";
import { BUILDINGS, IMPROVEMENTS, RULES, TECH_IDS, UNIT_TYPES, type ImprovementId } from "./rules";
import { Rng } from "./rng";
import type { GameState, PlayerId, Unit } from "./state";
import { workerStepDraft } from "./workers";
import { cityAt, idx, touchesLand } from "./world";

/** Ends the current player's turn and starts the next player's (mutates the draft). */
export function endTurnDraft(draft: GameState, events: GameEvent[]): void {
  const player = draft.currentPlayer;

  let science = 0;
  let gold = 0;
  for (const city of draft.cities.filter((c) => c.owner === player)) {
    const out = processCityDraft(draft, city, events);
    science += out.science;
    gold += out.gold;
  }
  economyDraft(draft, player, science, gold, events);
  for (const unit of draft.units.filter((u) => u.owner === player && u.work)) {
    progressWorkDraft(draft, unit, events);
  }
  perilsDraft(draft, player, events);

  const next = (player + 1) % draft.players.length;
  if (next === 0) {
    draft.turn += 1;
    spaceshipsDraft(draft, events);
  }
  draft.currentPlayer = next;
  startTurnDraft(draft, next, events);
}

/**
 * Dangers at the end of a turn: aircraft away from a city or carrier burn
 * fuel and crash when it runs out, triremes away from the coast may sink.
 */
function perilsDraft(draft: GameState, player: PlayerId, events: GameEvent[]): void {
  const rng = Rng.fromState(draft.rng);
  const safeTriremes = wonderFlag(draft, player, "safeTriremes");
  for (const unit of draft.units.filter((u) => u.owner === player)) {
    if (!draft.units.includes(unit)) continue;
    const rule = UNIT_TYPES[unit.type];
    if (rule.domain === "air") {
      if (aircraftSafe(draft, unit)) {
        unit.turnsAloft = 0;
        continue;
      }
      unit.turnsAloft += 1;
      if (unit.turnsAloft >= (rule.fuel ?? 1)) {
        removeUnitDraft(draft, unit.id);
        events.push({ type: "unitLost", unitId: unit.id, unitType: unit.type, owner: player, reason: "fuel" });
      }
    } else if (rule.coastal && !safeTriremes && !cityAt(draft, unit)) {
      const nearCoast = touchesLand(draft, unit);
      if (!nearCoast && rng.chance(RULES.triremeLossPct / 100)) {
        removeUnitDraft(draft, unit.id);
        events.push({ type: "unitLost", unitId: unit.id, unitType: unit.type, owner: player, reason: "sea" });
      }
    }
  }
  draft.rng = rng.getState();
}

/** Spaceships that reach their destination this turn land, or are lost. */
function spaceshipsDraft(draft: GameState, events: GameEvent[]): void {
  const rng = Rng.fromState(draft.rng);
  for (const p of draft.players) {
    const ship = p.spaceship;
    if (ship.arrivalTurn === null || draft.turn < ship.arrivalTurn) continue;
    const success = rng.int(100) < ship.successPct;
    events.push({ type: "spaceshipArrived", player: p.id, success });
    if (success && !draft.victory) draft.victory = { player: p.id, kind: "space", turn: draft.turn };
    if (!success) Object.assign(ship, { structural: 0, component: 0, module: 0, launchedTurn: null, arrivalTurn: null, successPct: 0 });
    else ship.arrivalTurn = null;
  }
  draft.rng = rng.getState();
}

/** Pays upkeep, adds gold and science, and finishes research (mutates the draft). */
function economyDraft(draft: GameState, playerId: PlayerId, science: number, gold: number, events: GameEvent[]): void {
  const player = draft.players[playerId];
  if (!player) return;
  player.gold += gold - buildingUpkeep(draft, playerId);
  sellBuildingsForUpkeepDraft(draft, playerId, events);

  // Science collects even with nothing chosen, so no turn of research is lost.
  player.research += science;
  const tech = player.researching;
  if (tech !== null && player.research >= researchCost(player)) {
    player.research -= researchCost(player);
    player.techs.push(tech);
    player.researching = null;
    events.push({ type: "techLearned", player: playerId, tech });
    if (player.researchGoal !== null) player.researching = nextStepToGoal(player, player.researchGoal);
    if (player.researching === null) {
      player.researchGoal = null;
      events.push({ type: "researchNeeded", player: playerId });
    }
  }
}

/** A library of the world: the owner learns every technology that enough other players know. */
function libraryDraft(draft: GameState, playerId: PlayerId, events: GameEvent[]): void {
  for (const id of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
    const need = BUILDINGS[id].effects.techsFromOthers;
    if (!need || wonderOwner(draft, id) !== playerId) continue;
    const me = draft.players[playerId]!;
    for (const tech of TECH_IDS) {
      if (me.techs.includes(tech)) continue;
      const knownBy = draft.players.filter((p) => p.id !== playerId && p.techs.includes(tech)).length;
      if (knownBy >= need) learnTechDraft(draft, playerId, tech, events);
    }
  }
}

function startTurnDraft(draft: GameState, player: PlayerId, events: GameEvent[]): void {
  const p = draft.players[player];
  if (p?.revolution) {
    p.revolution.turnsLeft -= 1;
    if (p.revolution.turnsLeft <= 0) {
      p.government = p.revolution.target;
      p.revolution = null;
      // Luxuries stay as the player set them; science takes up what taxes may no longer carry.
      const fitted = fitRates(p.scienceRate, p.luxuryRate, p.government, "luxury");
      p.scienceRate = fitted.science;
      p.luxuryRate = fitted.luxury;
      events.push({ type: "governmentChanged", player, government: p.government });
    }
  }
  libraryDraft(draft, player, events);
  for (const unit of draft.units.filter((u) => u.owner === player)) {
    unit.movesLeft = unit.work || unit.fortified ? 0 : turnMoves(draft, unit);
  }
  for (const unit of draft.units.filter((u) => u.owner === player && u.goto)) {
    continueGotoDraft(draft, unit, events);
  }
  for (const unit of draft.units.filter((u) => u.owner === player && u.orders && !u.work)) {
    workerStepDraft(draft, unit, events);
  }
  events.push({ type: "turnStarted", turn: draft.turn, player });
}

function progressWorkDraft(draft: GameState, unit: Unit, events: GameEvent[]): void {
  const work = unit.work;
  if (!work) return;
  const i = idx(draft.map, unit);
  const terrain = draft.map.terrain[i];
  const needed = terrain ? IMPROVEMENTS[work.improvement].turns[terrain] : undefined;
  if (needed === undefined) {
    unit.work = null;
    return;
  }
  work.progress += 1;
  if (work.progress < needed) return;
  finishImprovement(draft, i, work.improvement);
  unit.work = null;
  events.push({ type: "improvementDone", unitId: unit.id, at: { x: unit.x, y: unit.y }, improvement: work.improvement });
}

function finishImprovement(draft: GameState, i: number, improvement: ImprovementId): void {
  draft.map[improvement][i] = 1;
  // A mine and irrigation cannot share a tile; the newer one replaces the older.
  if (improvement === "mine") draft.map.irrigation[i] = 0;
  if (improvement === "irrigation") draft.map.mine[i] = 0;
}
