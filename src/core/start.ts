/**
 * Chooses start positions: good land for a first city, as far apart as possible.
 *
 * Every land tile gets a score from the 21 tiles a city there could work.
 * Then we greedily add the candidate that is farthest from the starts chosen
 * so far, with the score as a tie breaker, and try several first picks to keep
 * the layout with the largest minimum distance.
 *
 * Everybody starts on the main continent. Islands are land to settle later
 * by ship, never a start.
 */
import { cityRadiusTiles, distance, fromIndex, neighbors8, type GridSize, type Point } from "./geometry";
import { TERRAINS } from "./rules";
import type { Rng } from "./rng";
import type { GameMap } from "./state";
import { tileYield } from "./world";

/** How many of the best-scoring tiles may become a start. */
const CANDIDATE_SHARE = 0.4;
const FIRST_PICK_TRIES = 30;
/** Out of the 21 tiles a city works. */
const MIN_LAND_IN_RADIUS = 14;

export function siteScore(map: GameMap, center: Point): number {
  const centerTerrain = map.terrain[center.y * map.width + center.x];
  if (!centerTerrain || !TERRAINS[centerTerrain].land) return -Infinity;
  if (centerTerrain === "mountains" || centerTerrain === "arctic") return -Infinity;
  let score = 0;
  let landTiles = 0;
  for (const i of cityRadiusTiles(map, center)) {
    const t = TERRAINS[map.terrain[i] ?? "ocean"];
    const y = tileYield(map, i, false);
    const value = y.food * 1.5 + y.shields + y.trade * 0.5;
    // Sea is worth less: without ships it gives no room to expand.
    score += t.land ? value : value * 0.5;
    if (t.land) landTiles++;
  }
  // A peninsula tip or a narrow strip is a poor capital.
  if (landTiles < MIN_LAND_IN_RADIUS) return -Infinity;
  return score;
}

/** Tiles of the largest landmass, polar ice left out. */
export function mainContinent(map: GameMap): Set<number> {
  const size: GridSize = map;
  const isLandTile = (i: number) => {
    const t = map.terrain[i];
    return !!t && TERRAINS[t].land && t !== "arctic";
  };
  const seen = new Uint8Array(map.terrain.length);
  let best: number[] = [];
  for (let start = 0; start < map.terrain.length; start++) {
    if (seen[start] || !isLandTile(start)) continue;
    const part: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length > 0) {
      const i = stack.pop()!;
      part.push(i);
      for (const n of neighbors8(size, i)) {
        if (!seen[n] && isLandTile(n)) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    if (part.length > best.length) best = part;
  }
  return new Set(best);
}

export function chooseStartPositions(map: GameMap, count: number, rng: Rng): Point[] {
  const size: GridSize = map;
  const continent = mainContinent(map);
  const scored = map.terrain
    .map((_, i) => ({ i, score: continent.has(i) ? siteScore(map, fromIndex(size, i)) : -Infinity }))
    .filter((c) => Number.isFinite(c.score))
    .sort((a, b) => b.score - a.score);

  const candidates = scored.slice(0, Math.max(count, Math.round(scored.length * CANDIDATE_SHARE)));
  if (candidates.length < count) throw new Error("chooseStartPositions: not enough land");

  const maxScore = candidates[0]?.score ?? 1;
  const minScore = candidates[candidates.length - 1]?.score ?? 0;
  const norm = (s: number) => (maxScore === minScore ? 0 : (s - minScore) / (maxScore - minScore));

  let best: Point[] = [];
  let bestMinDistance = -1;
  const firstPicks = rng.shuffle(candidates.slice(0, Math.min(candidates.length, 60))).slice(0, FIRST_PICK_TRIES);

  for (const first of firstPicks) {
    const chosen: Point[] = [fromIndex(size, first.i)];
    while (chosen.length < count) {
      let pick: Point | null = null;
      let pickValue = -Infinity;
      for (const c of candidates) {
        const p = fromIndex(size, c.i);
        const minD = Math.min(...chosen.map((q) => distance(p, q)));
        if (minD === 0) continue;
        const value = minD + norm(c.score) * 2;
        if (value > pickValue) {
          pickValue = value;
          pick = p;
        }
      }
      if (!pick) break;
      chosen.push(pick);
    }
    if (chosen.length < count) continue;
    const minDistance = minPairDistance(chosen);
    if (minDistance > bestMinDistance) {
      bestMinDistance = minDistance;
      best = chosen;
    }
  }
  if (best.length < count) throw new Error("chooseStartPositions: no valid layout");
  return best;
}

export function minPairDistance(points: Point[]): number {
  let min = Infinity;
  for (let a = 0; a < points.length; a++) {
    for (let b = a + 1; b < points.length; b++) {
      min = Math.min(min, distance(points[a] as Point, points[b] as Point));
    }
  }
  return min;
}
