/**
 * Unit movement: checks, single steps and multi-turn goto orders.
 */
import { exploreRuinsDraft } from "./barbarians";
import type { GameEvent } from "./events";
import { distance, type Point } from "./geometry";
import { findPath } from "./path";
import { wonderEffect } from "./economy";
import { RULES, TERRAINS, UNIT_TYPES } from "./rules";
import type { GameState, Unit } from "./state";
import type { CommandError } from "./commands";
import { cityAt, domainOf, fullMoves, idx, moveCost, reveal, unitsAt } from "./world";
import { atWar, canCapture, captureCityDraft } from "./combat";
import { Rng } from "./rng";

/** Units on board of a ship or carrier. */
export function cargoOf(state: GameState, carrier: Unit): Unit[] {
  return state.units.filter((u) => u.carriedBy === carrier.id);
}

/** An own ship on the tile with room for this unit, or undefined. */
export function shipWithRoom(state: GameState, unit: Unit, at: Point): Unit | undefined {
  const kind = domainOf(unit) === "air" ? "air" : "land";
  return unitsAt(state, at).find((s) => {
    const rule = UNIT_TYPES[s.type];
    if (s.owner !== unit.owner || s.id === unit.id || rule.domain !== "sea" || !rule.capacity) return false;
    if ((rule.carries ?? "land") !== kind) return false;
    return cargoOf(state, s).length < rule.capacity;
  });
}

/** Moves a unit has at the start of its turn: ships get more from the owner's wonders. */
export function turnMoves(state: GameState, unit: Unit): number {
  const base = fullMoves(unit);
  if (domainOf(unit) !== "sea") return base;
  return base + wonderEffect(state, unit.owner, "shipMoves") * RULES.movesFraction;
}

/** Move cost including boarding: a land unit may step onto an ocean tile where its own ship has room. */
export function stepCost(state: GameState, unit: Unit, to: Point): number | null {
  const domain = domainOf(unit);
  const cost = moveCost(state, unit, to, domain);
  if (cost !== null) return cost;
  if (distance(unit, to) !== 1) return null;
  const terrain = state.map.terrain[idx(state.map, to)];
  if (domain !== "sea" && terrain && !TERRAINS[terrain].land && shipWithRoom(state, unit, to)) return RULES.movesFraction;
  return null;
}

export function canMove(state: GameState, unit: Unit, to: Point): CommandError | null {
  if (unit.movesLeft <= 0) return "noMovesLeft";
  if (distance(unit, to) !== 1) return "notAdjacent";
  const cost = stepCost(state, unit, to);
  if (cost === null) return "cannotEnter";
  // A unit with full movement may always make one step, even into mountains.
  if (unit.movesLeft < cost && unit.movesLeft < fullMoves(unit)) return "notEnoughMoves";
  if (unitsAt(state, to).some((u) => u.owner !== unit.owner)) return "occupiedByOther";
  // An empty enemy city falls to a soldier who walks in.
  const city = cityAt(state, to);
  if (city && city.owner !== unit.owner && (!canCapture(unit) || !atWar(state, unit.owner, city.owner))) return "occupiedByOther";
  return null;
}

/** Moves a unit one tile and takes an empty enemy city it walks into (mutates the draft). */
export function enterTileDraft(draft: GameState, unit: Unit, to: Point, events: GameEvent[]): void {
  moveDraft(draft, unit, to);
  if (draft.map.ruins[idx(draft.map, to)]) exploreRuinsDraft(draft, unit, events);
  const city = cityAt(draft, to);
  if (city && city.owner !== unit.owner) {
    const rng = Rng.fromState(draft.rng);
    captureCityDraft(draft, city, unit, rng, events);
    draft.rng = rng.getState();
    // Taking a city ends the unit's move.
    unit.movesLeft = 0;
    unit.goto = null;
  }
}

/** Moves a unit one tile (mutates the draft; the move must already be checked). */
export function moveDraft(draft: GameState, unit: Unit, to: Point): void {
  const cost = stepCost(draft, unit, to) ?? 0;
  const ship = domainOf(unit) === "sea" ? undefined : shipWithRoom(draft, unit, to);
  unit.x = to.x;
  unit.y = to.y;
  unit.movesLeft = Math.max(0, unit.movesLeft - cost);
  unit.fortified = false;
  unit.work = null;
  // Stepping onto open sea means boarding; any other step leaves the ship.
  const terrain = draft.map.terrain[idx(draft.map, to)];
  const atSea = terrain !== undefined && !TERRAINS[terrain].land;
  unit.carriedBy = atSea && ship ? ship.id : null;
  if (unit.carriedBy !== null && domainOf(unit) === "air") unit.turnsAloft = 0;
  reveal(draft, unit.owner, unit, UNIT_TYPES[unit.type].sight ?? RULES.unitSight);
  // A ship takes its cargo along.
  for (const passenger of draft.units) {
    if (passenger.carriedBy !== unit.id) continue;
    passenger.x = to.x;
    passenger.y = to.y;
  }
}

/** Puts a unit standing in a city on board an own ship in the same city (mutates the draft). */
export function boardDraft(draft: GameState, unit: Unit): CommandError | null {
  const ship = shipWithRoom(draft, unit, unit);
  if (!ship) return "noShip";
  unit.carriedBy = ship.id;
  unit.fortified = false;
  unit.work = null;
  unit.goto = null;
  return null;
}

/** True when an aircraft can refuel where it stands: in an own city or on a carrier. */
export function aircraftSafe(state: GameState, unit: Unit): boolean {
  const city = cityAt(state, unit);
  return (city !== undefined && city.owner === unit.owner) || unit.carriedBy !== null;
}


/**
 * Follows the unit's goto order as far as its movement allows this turn
 * (mutates the draft). The path is recomputed each time because newly
 * explored land can open a shorter route.
 */
export function continueGotoDraft(draft: GameState, unit: Unit, events: GameEvent[]): void {
  const target = unit.goto;
  if (!target) return;
  const path = findPath(draft, unit.owner, unit, target, domainOf(unit));
  if (!path) {
    unit.goto = null;
    events.push({ type: "gotoBlocked", unitId: unit.id });
    return;
  }
  for (const step of path) {
    if (canMove(draft, unit, step) !== null) break;
    enterTileDraft(draft, unit, step, events);
    if (!draft.units.includes(unit) || unit.movesLeft <= 0) break;
  }
  if (unit.x === target.x && unit.y === target.y) unit.goto = null;
  else unit.goto = target;
}

