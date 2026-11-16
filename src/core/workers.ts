/**
 * Standing orders for settlers (see WorkerOrder in state.ts): building a road
 * or railroad along the whole way to a tile, and improving the land around
 * the owner's cities without being told what to do.
 *
 * The same functions serve the human and the AI. They read the map only where
 * the owner has explored it and the owner's own cities, so they know nothing a
 * player in that seat would not.
 */
import { cityRadiusTiles, distance, fromIndex, type Point } from "./geometry";
import { IMPROVEMENTS, RULES, TERRAINS, type ImprovementId } from "./rules";
import type { GameEvent } from "./events";
import { findPath } from "./path";
import type { GameMap, GameState, Unit, WorkKind } from "./state";
import { canMove, moveDraft } from "./units";
import { getPlayer, idx, tileYield } from "./world";
import { cityReport } from "./city";
import { improvementProblemAt } from "./commands";

/** Improvements an automatic settler considers, in the order it prefers them on a tie. */
const AUTO_IMPROVEMENTS: ImprovementId[] = ["irrigation", "mine", "road", "railroad"];

export interface WorkerTask {
  at: Point;
  improvement: WorkKind;
  score: number;
}

/** Yield of tile `i` after the work is done, as the rules would count it. */
function improvedYield(map: GameMap, i: number, work: WorkKind) {
  const one = <T>(arr: T[]) => ({ [i]: arr[i] }) as unknown as T[];
  const stub = {
    ...map,
    terrain: one(map.terrain),
    road: one(map.road),
    irrigation: one(map.irrigation),
    mine: one(map.mine),
    railroad: one(map.railroad),
    pollution: one(map.pollution),
  };
  if (work === "clean") {
    stub.pollution[i] = 0;
    return tileYield(stub, i, false);
  }
  const into = IMPROVEMENTS[work].transform?.[map.terrain[i]!];
  if (into) {
    stub.terrain[i] = into;
    stub.irrigation[i] = 0;
    stub.mine[i] = 0;
    return tileYield(stub, i, false);
  }
  stub[work][i] = 1;
  if (work === "mine") stub.irrigation[i] = 0;
  if (work === "irrigation") stub.mine[i] = 0;
  return tileYield(stub, i, false);
}

/** How much a tile's yield is worth to a city: food first, then shields, then trade. A city that has stopped growing wants food two and a half times as much. */
function worth(y: { food: number; shields: number; trade: number }, hungry = false): number {
  return y.food * (hungry ? 10 : 4) + y.shields * 3 + y.trade * 2;
}

/**
 * The most useful piece of work for an automatic settler: the improvement
 * that raises a city tile's yield the most, weighed against the time to walk
 * there and build it. Tiles the city works count double, and food counts
 * more around a city that has stopped growing. Tiles another of the
 * owner's settlers works on or heads for are left to that settler.
 */
export function bestWorkerTask(state: GameState, unit: Unit): WorkerTask | null {
  const map = state.map;
  const explored = getPlayer(state, unit.owner).explored;
  const taken = new Set<number>();
  for (const u of state.units) {
    if (u.owner !== unit.owner || u.id === unit.id) continue;
    if (u.work) taken.add(idx(map, u));
    if (u.orders?.kind === "auto" && u.orders.target) taken.add(idx(map, u.orders.target));
  }
  let best: WorkerTask | null = null;
  const seen = new Set<number>();
  for (const city of state.cities) {
    if (city.owner !== unit.owner) continue;
    const worked = new Set(city.worked);
    const report = cityReport(state, city);
    const hungry = report.foodSurplus <= 0 && city.size < report.maxSize;
    for (const i of cityRadiusTiles(map, city)) {
      if (seen.has(i) || taken.has(i) || explored[i] !== 1) continue;
      seen.add(i);
      const terrain = map.terrain[i];
      if (!terrain || !TERRAINS[terrain].land) continue;
      const at = fromIndex(map, i);
      const dist = distance(unit, at);
      if (dist > RULES.autoWorkRange) continue;
      const nowYield = tileYield(map, i, false);
      const now = worth(nowYield, hungry);
      const consider = (work: WorkKind, turns: number) => {
        const after = improvedYield(map, i, work);
        // Land is never changed into land that feeds fewer people.
        if (work !== "clean" && IMPROVEMENTS[work].transform?.[terrain] && after.food <= nowYield.food) return;
        // Pollution hurts the whole world through warming, so cleaning counts double.
        const gain = (worth(after, hungry) - now) * (worked.has(i) ? 2 : 1) * (work === "clean" ? 2 : 1);
        if (gain <= 0) return;
        const score = gain / (turns + dist + 1);
        if (!best || score > best.score) best = { at, improvement: work, score };
      };
      if (map.pollution[i]) consider("clean", RULES.pollutionCleanTurns);
      for (const improvement of AUTO_IMPROVEMENTS) {
        if (improvementProblemAt(state, unit.owner, i, improvement) !== null) continue;
        consider(improvement, IMPROVEMENTS[improvement].turns[terrain] ?? 1);
      }
    }
  }
  return best;
}

/** Starts work on the unit's tile (mutates the draft). */
function startWork(unit: Unit, improvement: WorkKind): void {
  unit.work = { improvement, progress: 0 };
  unit.movesLeft = 0;
}

/**
 * Walks the unit one step at a time towards `to` while it has moves and the
 * way is free. Returns false when no known way leads there.
 */
function walk(draft: GameState, unit: Unit, to: Point, stopAt: (u: Unit) => boolean): boolean {
  const path = findPath(draft, unit.owner, unit, to);
  if (!path) return false;
  for (const step of path) {
    if (unit.movesLeft <= 0 || stopAt(unit)) break;
    if (canMove(draft, unit, step) !== null) break;
    moveDraft(draft, unit, step);
  }
  return true;
}

/** What the route order still has to build on the unit's tile, or null. */
function routeWorkHere(draft: GameState, unit: Unit, improvement: "road" | "railroad"): ImprovementId | null {
  const i = idx(draft.map, unit);
  // A railroad needs a road under it first.
  const next: ImprovementId = improvement === "railroad" && !draft.map.road[i] ? "road" : improvement;
  return improvementProblemAt(draft, unit.owner, i, next) === null ? next : null;
}

/**
 * Carries out the unit's standing orders as far as its moves allow this turn
 * (mutates the draft). Called when the order is given and at the start of
 * every turn of the owner.
 */
export function workerStepDraft(draft: GameState, unit: Unit, events: GameEvent[]): void {
  const orders = unit.orders;
  if (!orders || unit.work || unit.goto) return;

  if (orders.kind === "route") {
    const build = (u: Unit) => routeWorkHere(draft, u, orders.improvement) !== null;
    if (!build(unit) && !(unit.x === orders.to.x && unit.y === orders.to.y)) {
      if (!walk(draft, unit, orders.to, build)) {
        unit.orders = null;
        events.push({ type: "gotoBlocked", unitId: unit.id });
        return;
      }
    }
    const here = routeWorkHere(draft, unit, orders.improvement);
    if (here) {
      if (unit.movesLeft > 0) startWork(unit, here);
      return;
    }
    if (unit.x === orders.to.x && unit.y === orders.to.y) {
      unit.orders = null;
      events.push({ type: "routeBuilt", unitId: unit.id, improvement: orders.improvement });
    }
    return;
  }

  const task = bestWorkerTask(draft, unit);
  orders.target = task ? { ...task.at } : null;
  if (!task) return;
  const there = (u: Unit) => u.x === task.at.x && u.y === task.at.y;
  if (!there(unit)) walk(draft, unit, task.at, there);
  if (there(unit) && unit.movesLeft > 0) startWork(unit, task.improvement);
}
