/**
 * Unit movement: checks, single steps and multi-turn goto orders.
 */
import type { GameEvent } from "./events";
import { distance, type Point } from "./geometry";
import { findPath } from "./path";
import { RULES } from "./rules";
import type { GameState, Unit } from "./state";
import type { CommandError } from "./commands";
import { cityAt, fullMoves, moveCost, reveal, unitsAt } from "./world";

export function canMove(state: GameState, unit: Unit, to: Point): CommandError | null {
  if (unit.movesLeft <= 0) return "noMovesLeft";
  if (distance(unit, to) !== 1) return "notAdjacent";
  const cost = moveCost(state, unit, to);
  if (cost === null) return "cannotEnter";
  // A unit with full movement may always make one step, even into mountains.
  if (unit.movesLeft < cost && unit.movesLeft < fullMoves(unit)) return "notEnoughMoves";
  const city = cityAt(state, to);
  if (city && city.owner !== unit.owner) return "occupiedByOther";
  if (unitsAt(state, to).some((u) => u.owner !== unit.owner)) return "occupiedByOther";
  return null;
}

/** Moves a unit one tile (mutates the draft; the move must already be checked). */
export function moveDraft(draft: GameState, unit: Unit, to: Point): void {
  const cost = moveCost(draft, unit, to) ?? 0;
  unit.x = to.x;
  unit.y = to.y;
  unit.movesLeft = Math.max(0, unit.movesLeft - cost);
  unit.fortified = false;
  unit.work = null;
  reveal(draft, unit.owner, unit, RULES.unitSight);
}

/**
 * Follows the unit's goto order as far as its movement allows this turn
 * (mutates the draft). The path is recomputed each time because newly
 * explored land can open a shorter route.
 */
export function continueGotoDraft(draft: GameState, unit: Unit, events: GameEvent[]): void {
  const target = unit.goto;
  if (!target) return;
  const path = findPath(draft, unit.owner, unit, target);
  if (!path) {
    unit.goto = null;
    events.push({ type: "gotoBlocked", unitId: unit.id });
    return;
  }
  for (const step of path) {
    if (canMove(draft, unit, step) !== null) break;
    moveDraft(draft, unit, step);
  }
  if (unit.x === target.x && unit.y === target.y) unit.goto = null;
  else unit.goto = target;
}

