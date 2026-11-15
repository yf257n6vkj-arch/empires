/**
 * Path finding for land units (A*). It reads only what the player knows:
 * unexplored tiles are assumed to be passable flat land, so a route may lead
 * into the unknown and is planned again once the unit sees more. The real
 * terrain of unexplored tiles is never looked at, so the AI cannot cheat here.
 */
import { distance, fromIndex, neighbors8, type GridSize, type Point } from "./geometry";
import { RULES, TERRAINS, type UnitDomain } from "./rules";
import type { GameState, PlayerId, Unit } from "./state";
import { domainOf, fullMoves, getPlayer, idx, moveCost } from "./world";

/** Returns the tiles to step on, excluding `from`, or null when there is no known route. */
export function findPath(
  state: GameState,
  player: PlayerId,
  from: Point,
  to: Point,
  domain: UnitDomain = "type" in from ? domainOf(from as Unit) : "land",
): Point[] | null {
  const map = state.map;
  const explored = getPlayer(state, player).explored;
  const start = idx(map, from);
  const goal = idx(map, to);
  if (start === goal) return [];

  const g = new Map<number, number>([[start, 0]]);
  const cameFrom = new Map<number, number>();
  const open = new Set<number>([start]);
  const f = new Map<number, number>([[start, distance(from, to) * RULES.roadMoveCost]]);

  while (open.size > 0) {
    let current = -1;
    let best = Infinity;
    for (const i of open) {
      const score = f.get(i) ?? Infinity;
      if (score < best || (score === best && i < current)) {
        best = score;
        current = i;
      }
    }
    if (current === goal) return rebuild(map, cameFrom, current);
    open.delete(current);
    const currentPoint = fromIndex(map, current);

    for (const n of neighbors8(map, current)) {
      const cost = knownMoveCost(state, explored, current, currentPoint, n, domain);
      if (cost === null) continue;
      const tentative = (g.get(current) ?? Infinity) + cost;
      if (tentative < (g.get(n) ?? Infinity)) {
        cameFrom.set(n, current);
        g.set(n, tentative);
        f.set(n, tentative + distance(fromIndex(map, n), to) * RULES.roadMoveCost);
        open.add(n);
      }
    }
  }
  return null;
}

/** Move cost as far as the player knows it; unexplored tiles count as one flat move. */
function knownMoveCost(
  state: GameState,
  explored: number[],
  from: number,
  fromPoint: Point,
  to: number,
  domain: UnitDomain = "land",
): number | null {
  const toPoint = fromIndex(state.map, to);
  if (domain === "air" || !explored[to]) return RULES.movesFraction;
  if (!explored[from] && domain === "land") {
    // Roads on unexplored tiles are unknown, so only the terrain counts.
    const terrain = state.map.terrain[to];
    return terrain && TERRAINS[terrain].land ? TERRAINS[terrain].moveCost * RULES.movesFraction : null;
  }
  return moveCost(state, fromPoint, toPoint, domain);
}

export interface PathPlan {
  /** Turns of movement needed, counting the current turn as 1. */
  turns: number;
  /** For every step of the path, the turn (1-based) in which the unit makes it. */
  stepTurns: number[];
}

/**
 * Estimates how many turns a unit needs to walk `path`, with the same
 * movement rules as real moves and only the costs the player knows.
 * Used by the screen to show the arrival turn and by the AI to compare targets.
 */
export function planPath(state: GameState, unit: Unit, path: Point[]): PathPlan {
  const explored = getPlayer(state, unit.owner).explored;
  const full = fullMoves(unit);
  let moves = unit.movesLeft;
  let turn = 1;
  const stepTurns: number[] = [];
  let from: Point = unit;
  for (const step of path) {
    const cost =
      knownMoveCost(state, explored, idx(state.map, from), from, idx(state.map, step), domainOf(unit)) ?? full;
    if (moves <= 0 || (moves < cost && moves < full)) {
      turn += 1;
      moves = full;
    }
    moves = Math.max(0, moves - cost);
    stepTurns.push(turn);
    from = step;
  }
  return { turns: path.length === 0 ? 0 : turn, stepTurns };
}

function rebuild(map: GridSize, cameFrom: Map<number, number>, end: number): Point[] {
  const path: Point[] = [];
  let current: number | undefined = end;
  while (current !== undefined && cameFrom.has(current)) {
    path.push(fromIndex(map, current));
    current = cameFrom.get(current);
  }
  return path.reverse();
}
