/**
 * Where the AI founds its cities. Each candidate tile gets a score from the
 * tiles a city there would work, weighted by distance from the centre as in
 * Unciv, with bonuses for a river, the coast and hills. Tiles the AI has not
 * seen count as the average of those it has (Unciv), sites other settlers are
 * heading for are taken (Freeciv), and every tile of travel lowers the value
 * by (23/24)^3 (Freeciv), so settlers do not wander off on death marches.
 */
import { distance, IMPROVEMENTS, RULES, TERRAINS, type Point, type PlayerView, type Unit } from "../core";
import { at, centerFood, isLand, isSea, knownCities, pointOf, radius, tileValue } from "./knowledge";

/** Land tiles that can give two food a good site has around it. */
const FEEDING_TILES = 6;

/** Below this a site is not worth a settler. */
export const MIN_SITE_SCORE = 18;
/** How far a settler looks for a site. */
const SEARCH_RADIUS = 10;

export interface Site {
  i: number;
  score: number;
}

/** Average value of the known tiles, used for the ones nobody has seen. */
export function averageKnownValue(view: PlayerView): number {
  let sum = 0;
  let n = 0;
  for (let i = 0; i < view.terrain.length; i++) {
    if (view.terrain[i] === null) continue;
    sum += tileValue(view, i);
    n++;
  }
  return n ? sum / n : 2;
}

/** Value of a city on tile `i`, before travel; -Infinity where a city cannot or should not stand. */
export function siteValue(view: PlayerView, i: number, reserved: Point[], average: number): number {
  if (!isLand(view, i)) return -Infinity;
  const p = pointOf(view, i);
  const terrain = view.terrain[i];
  if (terrain === "mountains") return -Infinity;
  // A city has to feed itself: a centre on forest, jungle or swamp gives one food and the city hardly grows.
  if (centerFood(view, i) < 2) return -Infinity;
  for (const c of knownCities(view)) {
    const d = distance(c, p);
    if (d < Math.max(3, RULES.minCityDistance)) return -Infinity;
  }
  if (reserved.some((r) => distance(r, p) < 3)) return -Infinity;
  if (view.foreignUnits.some((u) => u.x === p.x && u.y === p.y)) return -Infinity;

  let score = 0;
  for (const j of radius(view, p)) {
    const q = pointOf(view, j);
    const d = distance(q, p);
    const weight = d === 0 ? 2 : d === 1 ? 1.5 : 1;
    score += (view.terrain[j] === null ? average * 0.8 : tileValue(view, j)) * weight;
  }
  // Few tiles that feed a citizen, even after irrigation, keep the city small for good (Freeciv weighs food the same way).
  const feeding = radius(view, p).filter((j) => {
    const t = view.terrain[j];
    if (!t || !TERRAINS[t].land) return false;
    return TERRAINS[t].food + (IMPROVEMENTS.irrigation.bonus[t]?.food ?? 0) + (view.special[j] && TERRAINS[t].special ? (TERRAINS[t].special!.food ?? 0) : 0) >= 2;
  }).length;
  if (feeding < FEEDING_TILES) score -= (FEEDING_TILES - feeding) * 3;
  if (terrain === "river") score += 4;
  if (terrain === "hills") score += 2;
  if (radius(view, p).some((j) => isSea(view, j))) score += 2;

  // Cities about four tiles apart share little land and stay easy to defend.
  const own = view.cities.map((c) => distance(c, p));
  if (own.length > 0) {
    const d = Math.min(...own);
    score += d === 3 ? -6 : d === 4 ? 6 : d === 5 ? 8 : d === 6 ? 4 : -(d - 6) * 2;
  }
  for (const c of view.foreignCities) if (distance(c, p) <= 4) score -= 10;
  return score;
}

/** Targets other settlers are already heading for. */
export function reservedSites(view: PlayerView, except: number | null): Point[] {
  return view.units.filter((u) => u.id !== except && u.type === "settlers" && u.goto).map((u) => u.goto!);
}

/**
 * The best site for a settler on its own landmass, travel included, or null
 * when there is no site worth the trip.
 */
export function bestSite(view: PlayerView, settler: Unit, land: Int32Array, average: number, claimed: Point[] = []): Site | null {
  const reserved = [...reservedSites(view, settler.id), ...claimed];
  const home = land[at(view, settler)];
  let best: Site | null = null;
  for (let dy = -SEARCH_RADIUS; dy <= SEARCH_RADIUS; dy++) {
    for (let dx = -SEARCH_RADIUS; dx <= SEARCH_RADIUS; dx++) {
      const x = settler.x + dx;
      const y = settler.y + dy;
      if (x < 0 || y < 0 || x >= view.width || y >= view.height) continue;
      const i = y * view.width + x;
      if (home !== undefined && home >= 0 && land[i] !== home) continue;
      const value = siteValue(view, i, reserved, average);
      if (!Number.isFinite(value)) continue;
      const score = value * (23 / 24) ** (3 * distance(settler, { x, y }));
      if (score >= MIN_SITE_SCORE && (!best || score > best.score)) best = { i, score };
    }
  }
  return best;
}

/**
 * Good sites on land the AI cannot walk to: islands. Measured from the
 * nearest own coastal city, so the travel discount counts the sea voyage.
 */
export function islandSites(view: PlayerView, land: Int32Array, average: number): Site[] {
  const ownLand = new Set(view.cities.map((c) => land[at(view, c)]));
  const reserved = reservedSites(view, null);
  const result: Site[] = [];
  for (let i = 0; i < view.terrain.length; i++) {
    const label = land[i]!;
    if (label < 0 || ownLand.has(label)) continue;
    const value = siteValue(view, i, reserved, average);
    if (!Number.isFinite(value)) continue;
    const p = pointOf(view, i);
    const near = Math.min(...view.cities.map((c) => distance(c, p)));
    const score = value * (23 / 24) ** (2 * near);
    if (score >= MIN_SITE_SCORE) result.push({ i, score });
  }
  return result.sort((a, b) => b.score - a.score);
}

/**
 * How many more cities fit on the land the AI owns: good sites a settler from
 * one of its cities would accept, counted so that they do not overlap.
 */
export function roomToExpand(view: PlayerView, land: Int32Array, average: number): number {
  const ownLand = new Set(view.cities.map((c) => land[at(view, c)]));
  const reserved = reservedSites(view, null);
  const sites: Site[] = [];
  for (let i = 0; i < view.terrain.length; i++) {
    if (!ownLand.has(land[i]!)) continue;
    const value = siteValue(view, i, reserved, average);
    if (!Number.isFinite(value)) continue;
    const p = pointOf(view, i);
    const d = Math.min(...view.cities.map((c) => distance(c, p)));
    if (d > SEARCH_RADIUS) continue;
    const score = value * (23 / 24) ** (3 * d);
    if (score >= MIN_SITE_SCORE) sites.push({ i, score });
  }
  sites.sort((a, b) => b.score - a.score);
  const taken: Point[] = [];
  for (const s of sites) {
    const p = pointOf(view, s.i);
    if (taken.some((q) => distance(q, p) < 4)) continue;
    taken.push(p);
    if (taken.length >= 8) break;
  }
  return taken.length;
}
