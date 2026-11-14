/**
 * Ending a player's turn and starting the next one. Players move one after
 * another; when the last player ends, a new game turn begins.
 */
import { processCityDraft } from "./city";
import { continueGotoDraft } from "./units";
import type { GameEvent } from "./events";
import { IMPROVEMENTS, type ImprovementId } from "./rules";
import type { GameState, PlayerId, Unit } from "./state";
import { fullMoves, idx } from "./world";

/** Ends the current player's turn and starts the next player's (mutates the draft). */
export function endTurnDraft(draft: GameState, events: GameEvent[]): void {
  const player = draft.currentPlayer;

  for (const city of draft.cities.filter((c) => c.owner === player)) {
    processCityDraft(draft, city, events);
  }
  for (const unit of draft.units.filter((u) => u.owner === player && u.work)) {
    progressWorkDraft(draft, unit, events);
  }

  const next = (player + 1) % draft.players.length;
  if (next === 0) draft.turn += 1;
  draft.currentPlayer = next;
  startTurnDraft(draft, next, events);
}

function startTurnDraft(draft: GameState, player: PlayerId, events: GameEvent[]): void {
  for (const unit of draft.units.filter((u) => u.owner === player)) {
    unit.movesLeft = unit.work || unit.fortified ? 0 : fullMoves(unit);
  }
  for (const unit of draft.units.filter((u) => u.owner === player && u.goto)) {
    continueGotoDraft(draft, unit, events);
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
