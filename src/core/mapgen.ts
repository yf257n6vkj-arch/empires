/**
 * Map generator: one continent surrounded by sea on a square grid. The
 * geography comes first and the Civilization 1 tiles follow from it.
 *
 * Steps:
 *  1. Elevation = value noise minus a bent falloff from the centre, plus a
 *     few mountain ranges that run along curved lines like plate edges.
 *  2. Pick the threshold so that roughly `landShare` of the map is land.
 *  3. Keep a ring of sea along the edges, keep only the largest landmass
 *     and fill enclosed water, so there is exactly one continent and no lakes.
 *  4. Climate: temperature falls towards the poles. Rain comes with a
 *     westerly wind, falls where the land rises and leaves a dry shadow
 *     behind the mountains; a dry belt lies between the tropics and the cold.
 *  5. Each terrain type gets the same share of the land as before, but
 *     climate decides where: mountains on the ridges, hills on the
 *     foothills, desert where it is driest, jungle where it is hot and wet,
 *     swamp in wet lowland by the sea, forest where rain is plentiful.
 *  6. Rivers start below the mountains and run downhill to the sea; a
 *     river that meets another one joins it.
 *  7. Polar ice along the top and bottom edges, as in Civilization 1.
 *  8. Special resources on some tiles, never two side by side.
 *
 * With `islandShare` above zero a part of the land becomes small islands in
 * the sea around the continent, at least two sea tiles away from it.
 */
import { neighbors8, toIndex, type GridSize } from "./geometry";
import type { TerrainId } from "./rules";
import { Rng } from "./rng";
import type { GameMap } from "./state";

export interface MapOptions {
  width: number;
  height: number;
  /** Target share of land on the whole map, 0..1. */
  landShare: number;
  /** Sea tiles kept along every edge around the continent. */
  seaBorder: number;
  /** Share of the land that forms islands instead of the continent, 0..1. */
  islandShare: number;
  /** Shares of land tiles per terrain type (forest is taken from grass/plains). */
  shares: {
    mountains: number;
    hills: number;
    desert: number;
    forest: number;
    plains: number;
    jungle: number;
    swamp: number;
  };
  /** Distance from the equator (0 = middle row, 1 = top or bottom edge) beyond which flat land turns to tundra. */
  tundraLatitude: number;
  /** How many rivers to try, the actual number varies by one. */
  rivers: number;
  /** Mountain ranges across the continent. */
  ranges: number;
  /** Chance that a land tile, or a sea tile next to the continent, gets a special resource. */
  specialChance: number;
}

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  width: 40,
  height: 28,
  landShare: 0.42,
  seaBorder: 2,
  islandShare: 0,
  shares: { mountains: 0.07, hills: 0.12, desert: 0.07, forest: 0.16, plains: 0.22, jungle: 0.06, swamp: 0.05 },
  tundraLatitude: 0.7,
  rivers: 5,
  ranges: 2,
  specialChance: 0.1,
};

/** Land must not shrink below this share of the target after cleanup. */
const MIN_LAND_RATIO = 0.85;
const MAX_ATTEMPTS = 30;

export function generateMap(rng: Rng, options: MapOptions = DEFAULT_MAP_OPTIONS): GameMap {
  const size: GridSize = { width: options.width, height: options.height };
  const area = options.width * options.height;
  const continentOptions = { ...options, landShare: options.landShare * (1 - options.islandShare) };
  const targetLand = Math.round(area * continentOptions.landShare);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { land, elevation, ridge } = generateLandMask(rng, size, continentOptions);
    const landCount = land.reduce((n, v) => n + (v ? 1 : 0), 0);
    if (landCount >= targetLand * MIN_LAND_RATIO) {
      addIslands(rng, size, land, elevation, Math.round(area * options.landShare * options.islandShare));
      const empty = () => new Array<number>(size.width * size.height).fill(0);
      const terrain = assignTerrain(rng, size, land, elevation, ridge, options);
      addRivers(rng, size, terrain, elevation, options.rivers);
      addPolarIce(rng, size, terrain);
      return {
        width: size.width,
        height: size.height,
        terrain,
        special: placeSpecials(rng, size, terrain, options.specialChance),
        road: empty(),
        irrigation: empty(),
        mine: empty(),
        railroad: empty(),
        fortress: empty(),
        pollution: empty(),
      };
    }
  }
  throw new Error("generateMap: could not create a large enough continent");
}

function generateLandMask(rng: Rng, size: GridSize, options: MapOptions): { land: boolean[]; elevation: number[]; ridge: number[] } {
  const { width, height } = size;
  const noise = valueNoise(rng, size, [
    { cell: 10, weight: 1 },
    { cell: 5, weight: 0.5 },
    { cell: 2.5, weight: 0.25 },
  ]);
  // The falloff is bent by slow noise, so the continent is not a plain oval.
  const bendX = valueNoise(rng, size, [{ cell: 12, weight: 1 }]);
  const bendY = valueNoise(rng, size, [{ cell: 12, weight: 1 }]);
  const ridge = mountainRanges(rng, size, options.ranges);

  const elevation: number[] = new Array(width * height);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = toIndex(size, x, y);
      const nx = (x - cx) / (width / 2) + ((bendX[i] ?? 0.5) - 0.5) * 0.5;
      const ny = (y - cy) / (height / 2) + ((bendY[i] ?? 0.5) - 0.5) * 0.5;
      const d2 = nx * nx + ny * ny * 1.15;
      elevation[i] = (noise[i] ?? 0) - 0.9 * d2 + (ridge[i] ?? 0) * 0.35;
    }
  }

  // Threshold by percentile, computed over the tiles that may become land.
  const interior: number[] = [];
  for (let y = options.seaBorder; y < height - options.seaBorder; y++) {
    for (let x = options.seaBorder; x < width - options.seaBorder; x++) {
      interior.push(elevation[toIndex(size, x, y)] ?? 0);
    }
  }
  interior.sort((a, b) => b - a);
  const targetLand = Math.round(width * height * options.landShare);
  const threshold = interior[Math.min(targetLand, interior.length - 1)] ?? 0;

  let land = elevation.map((e, i) => {
    const x = i % width;
    const y = Math.floor(i / width);
    const nearEdge =
      x < options.seaBorder || y < options.seaBorder ||
      x >= width - options.seaBorder || y >= height - options.seaBorder;
    return !nearEdge && e > threshold;
  });

  land = keepLargestComponent(size, land, true);
  land = fillEnclosedWater(size, land);
  // Height above the sea, 0..1; the sea itself is 0.
  const above = elevation.map((e, i) => (land[i] ? Math.max(0.01, e - threshold) : 0));
  const top = Math.max(...above);
  const shift = centerShift(size, land);
  return {
    land: shifted(size, land, shift, false),
    elevation: shifted(size, above.map((e) => e / top), shift, 0),
    ridge: shifted(size, ridge, shift, 0),
  };
}

/** Islands are this far from the continent (Chebyshev distance), so at least one sea tile lies between. */
const ISLAND_GAP = 2;
const ISLAND_MIN = 3;
const ISLAND_MAX = 12;

/**
 * Small islands in the sea around the continent, until about `target` tiles
 * are land. Islands never touch each other and stay off the polar rows. Their
 * land is low, so they get few hills (mutates `land` and `elevation`).
 */
function addIslands(rng: Rng, size: GridSize, land: boolean[], elevation: number[], target: number): void {
  if (target <= 0) return;
  const { width, height } = size;
  // Distance from the continent in steps of 8 neighbours.
  const dist = new Array<number>(width * height).fill(Infinity);
  const queue: number[] = [];
  land.forEach((v, i) => {
    if (v) {
      dist[i] = 0;
      queue.push(i);
    }
  });
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    for (const n of neighbors8(size, i)) {
      if (dist[n]! > dist[i]! + 1) {
        dist[n] = dist[i]! + 1;
        queue.push(n);
      }
    }
  }
  const owner = new Array<number>(width * height).fill(0);
  const fits = (i: number, id: number) => {
    const x = i % width;
    const y = Math.floor(i / width);
    if (x < 1 || x > width - 2 || y < 2 || y > height - 3) return false;
    if (dist[i]! < ISLAND_GAP || owner[i]) return false;
    return neighbors8(size, i).every((n) => owner[n] === 0 || owner[n] === id);
  };
  let placed = 0;
  let id = 0;
  for (let tries = 0; placed < target && tries < 300; tries++) {
    const start = rng.int(width * height);
    const want = Math.min(ISLAND_MIN + rng.int(ISLAND_MAX - ISLAND_MIN + 1), target - placed + ISLAND_MIN);
    if (!fits(start, id + 1)) continue;
    id++;
    const tiles = [start];
    owner[start] = id;
    while (tiles.length < want) {
      // Grow where the island already surrounds a tile most, so it stays round.
      const frontier = new Map<number, number>();
      for (const from of tiles) {
        const x = from % width;
        const y = Math.floor(from / width);
        for (const n of [x > 0 ? from - 1 : -1, x < width - 1 ? from + 1 : -1, y > 0 ? from - width : -1, y < height - 1 ? from + width : -1]) {
          if (n < 0 || frontier.has(n) || owner[n] === id || !fits(n, id)) continue;
          const around = neighbors8(size, n).filter((m) => owner[m] === id).length;
          frontier.set(n, around * around);
        }
      }
      const total = [...frontier.values()].reduce((a, b) => a + b, 0);
      if (total === 0) break;
      let r = rng.next() * total;
      let next = -1;
      for (const [n, w] of frontier) {
        next = n;
        r -= w;
        if (r < 0) break;
      }
      owner[next] = id;
      tiles.push(next);
    }
    // A thin strip of land looks like a reef, not an island.
    const xs = tiles.map((i) => i % width);
    const ys = tiles.map((i) => Math.floor(i / width));
    const thin = tiles.length >= 4 && (Math.max(...xs) === Math.min(...xs) || Math.max(...ys) === Math.min(...ys));
    if (tiles.length < ISLAND_MIN || thin) {
      for (const i of tiles) owner[i] = 0;
      continue;
    }
    for (const i of tiles) {
      land[i] = true;
      elevation[i] = 0.05 + rng.next() * 0.3;
    }
    placed += tiles.length;
  }
}

/**
 * Mountain ranges: each runs along a gently curved line through the middle
 * part of the map and fades out at both ends. Values are 0..1 per tile.
 */
function mountainRanges(rng: Rng, size: GridSize, count: number): number[] {
  const { width, height } = size;
  const result = new Array<number>(width * height).fill(0);
  const wobble = valueNoise(rng, size, [{ cell: 5, weight: 1 }, { cell: 2.5, weight: 0.4 }]);
  // The ranges start in different parts of the continent, so they do not pile up in the middle.
  const firstSide = rng.next() < 0.5 ? -1 : 1;
  for (let k = 0; k < count; k++) {
    const angle = rng.next() * Math.PI;
    const side = (k % 2 === 0 ? firstSide : -firstSide) * (0.08 + rng.next() * 0.12);
    const cx = width * (0.5 + side + (rng.next() - 0.5) * 0.08);
    const cy = height * (0.35 + rng.next() * 0.3);
    const half = width * (0.2 + rng.next() * 0.14);
    const bend = (rng.next() - 0.5) * 0.06;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = toIndex(size, x, y);
        const along = (x - cx) * dx + (y - cy) * dy;
        const across = -(x - cx) * dy + (y - cy) * dx - bend * along * along + ((wobble[i] ?? 0.5) - 0.5) * 3;
        const taper = Math.max(0, 1 - Math.abs(along) / half);
        const v = Math.exp(-((across / 1.6) ** 2)) * Math.sqrt(taper);
        if (v > (result[i] ?? 0)) result[i] = v;
      }
    }
  }
  return result;
}

/** How far to move everything so the continent's bounding box sits in the middle of the map. */
function centerShift(size: GridSize, land: boolean[]): { dx: number; dy: number } {
  let minX = size.width, maxX = -1, minY = size.height, maxY = -1;
  land.forEach((v, i) => {
    if (!v) return;
    const x = i % size.width;
    const y = Math.floor(i / size.width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  });
  if (maxX < 0) return { dx: 0, dy: 0 };
  return { dx: Math.floor((size.width - 1 - maxX - minX) / 2), dy: Math.floor((size.height - 1 - maxY - minY) / 2) };
}

/** A copy of a per-tile array moved by (dx, dy); uncovered tiles get `fill`. */
function shifted<T>(size: GridSize, values: T[], shift: { dx: number; dy: number }, fill: T): T[] {
  const result = new Array<T>(values.length).fill(fill);
  values.forEach((v, i) => {
    const x = (i % size.width) + shift.dx;
    const y = Math.floor(i / size.width) + shift.dy;
    if (x >= 0 && y >= 0 && x < size.width && y < size.height) result[toIndex(size, x, y)] = v;
  });
  return result;
}

/** Keeps only the largest connected group of `value` tiles (8-connectivity). */
function keepLargestComponent(size: GridSize, mask: boolean[], value: boolean): boolean[] {
  const components = findComponents(size, mask, value);
  let largest: number[] = [];
  for (const c of components) if (c.length > largest.length) largest = c;
  const result = mask.map((v) => (v === value ? !value : v));
  for (const i of largest) result[i] = value;
  return result;
}

/** Water that cannot reach the map edge becomes land, so there are no lakes. */
function fillEnclosedWater(size: GridSize, land: boolean[]): boolean[] {
  const result = [...land];
  for (const component of findComponents(size, land, false)) {
    const touchesEdge = component.some((i) => {
      const x = i % size.width;
      const y = Math.floor(i / size.width);
      return x === 0 || y === 0 || x === size.width - 1 || y === size.height - 1;
    });
    if (!touchesEdge) for (const i of component) result[i] = true;
  }
  return result;
}

function findComponents(size: GridSize, mask: boolean[], value: boolean): number[][] {
  const seen = new Uint8Array(mask.length);
  const components: number[][] = [];
  for (let start = 0; start < mask.length; start++) {
    if (seen[start] || mask[start] !== value) continue;
    const component: number[] = [];
    const stack = [start];
    seen[start] = 1;
    while (stack.length > 0) {
      const i = stack.pop() as number;
      component.push(i);
      for (const n of neighbors8(size, i)) {
        if (!seen[n] && mask[n] === value) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Rain per tile: a westerly wind picks up water over the sea and drops it
 * where the land rises, so the windward side of mountains is wet and the
 * land behind them dry. Values are relative; only their order matters.
 */
function rainfall(size: GridSize, land: boolean[], elevation: number[]): number[] {
  const { width, height } = size;
  const rain = new Array<number>(width * height).fill(0);
  for (let y = 0; y < height; y++) {
    let carried = 1;
    let previous = 0;
    for (let x = 0; x < width; x++) {
      const i = toIndex(size, x, y);
      if (!land[i]) {
        carried = Math.min(1, carried + 0.25);
        previous = 0;
        continue;
      }
      const e = elevation[i] ?? 0;
      const uplift = Math.max(0, e - previous);
      const fall = carried * Math.min(0.9, 0.1 + uplift * 2.2 + e * 0.15);
      rain[i] = fall;
      carried = Math.max(0.05, carried - fall * 0.85);
      previous = e;
    }
  }
  // Spread a little, as clouds do.
  return rain.map((_, i) => {
    let sum = 0;
    let n = 0;
    for (const j of [i, ...neighbors8(size, i)]) {
      if (!land[j]) continue;
      const k = j === i ? 2 : 1;
      sum += (rain[j] ?? 0) * k;
      n += k;
    }
    return n ? sum / n : 0;
  });
}

function assignTerrain(rng: Rng, size: GridSize, land: boolean[], elevation: number[], ridge: number[], options: MapOptions): TerrainId[] {
  const vegetation = valueNoise(rng, size, [{ cell: 3, weight: 1 }, { cell: 1.5, weight: 0.4 }]);
  const patchy = valueNoise(rng, size, [{ cell: 5, weight: 1 }, { cell: 2, weight: 0.5 }]);
  const wobble = valueNoise(rng, size, [{ cell: 4, weight: 1 }]);
  const cy = (size.height - 1) / 2;
  const latitude = (i: number) => Math.abs(Math.floor(i / size.width) - cy) / (size.height / 2) + ((wobble[i] ?? 0.5) - 0.5) * 0.16;
  const height = (i: number) => elevation[i] ?? 0;
  const rain = rainfall(size, land, elevation);
  const coastal = (i: number) => neighbors8(size, i).some((n) => !land[n]);
  // A dry belt between the tropics and the cold, as on Earth around 25 to 30 degrees.
  const wet = land.map((_, i) => {
    const belt = 1 - 0.5 * Math.exp(-(((latitude(i) - 0.42) / 0.14) ** 2));
    return ((rain[i] ?? 0) * 2.2 + (patchy[i] ?? 0.5) * 0.6 + (coastal(i) ? 0.15 : 0)) * belt;
  });
  const moist = (i: number) => wet[i] ?? 0;

  const terrain: TerrainId[] = land.map((isLandTile) => (isLandTile ? "grassland" : "ocean"));
  const landTiles = land.flatMap((v, i) => (v ? [i] : []));
  const total = landTiles.length;
  const { shares } = options;
  const take = (from: number[], share: number, to: TerrainId) => {
    const n = Math.round(total * share);
    from.slice(0, n).forEach((i) => (terrain[i] = to));
    return from.slice(n);
  };
  const by = (score: (i: number) => number) => (a: number, b: number) => score(b) - score(a);

  // Mountains along the ranges, hills on their foothills and on other high ground.
  const range = (i: number) => ridge[i] ?? 0;
  take([...landTiles].sort(by((i) => range(i) + height(i) * 0.4)), shares.mountains, "mountains");
  const nearMountains = (i: number) => (neighbors8(size, i).some((n) => terrain[n] === "mountains") ? 0.3 : 0);
  take(landTiles.filter((i) => terrain[i] === "grassland").sort(by((i) => height(i) + range(i) * 0.5 + nearMountains(i))), shares.hills, "hills");

  // Flat land near the poles is tundra.
  for (const i of landTiles) if (terrain[i] === "grassland" && latitude(i) > options.tundraLatitude) terrain[i] = "tundra";

  // Flat land by moisture: driest is desert, then plains, the wettest stays grassland.
  const byDry = landTiles.filter((i) => terrain[i] === "grassland").sort(by((i) => -moist(i)));
  take(take(byDry, shares.desert, "desert"), shares.plains, "plains");

  // Jungle where it is hot and wet, near the equator.
  const hotWet = landTiles.filter((i) => terrain[i] === "grassland" && latitude(i) < 0.45).sort(by((i) => moist(i) - latitude(i) * 0.8));
  take(hotWet, shares.jungle, "jungle");
  // Swamp in wet lowland, mostly by the sea.
  const marsh = landTiles.filter((i) => terrain[i] === "grassland").sort(by((i) => moist(i) - height(i) * 3 + (coastal(i) ? 0.3 : 0)));
  take(marsh, shares.swamp, "swamp");

  // Forest grows where rain is plentiful, on grassland and plains.
  const green = landTiles.filter((i) => terrain[i] === "grassland" || terrain[i] === "plains");
  take([...green].sort(by((i) => moist(i) * 0.6 + (vegetation[i] ?? 0) + (terrain[i] === "plains" ? 0.08 : 0))), shares.forest, "forest");

  return terrain;
}

/** Terrain a river may run through; it replaces it. */
const RIVER_BED: TerrainId[] = ["grassland", "plains", "desert", "forest", "tundra", "jungle", "swamp"];

/**
 * Rivers start next to hills or mountains and run downhill to the sea. The
 * way down follows the height of the land; the distance to the sea breaks
 * ties and keeps a river from getting stuck in a hollow. A river that runs
 * into another one joins it (mutates `terrain`).
 */
function addRivers(rng: Rng, size: GridSize, terrain: TerrainId[], elevation: number[], count: number): void {
  const { width, height } = size;
  // Distance from the sea over land, 4-neighbour steps.
  const dist = new Array<number>(width * height).fill(Infinity);
  const queue: number[] = [];
  terrain.forEach((t, i) => {
    if (t === "ocean") {
      dist[i] = 0;
      queue.push(i);
    }
  });
  const near4 = (i: number) => {
    const x = i % width;
    const y = Math.floor(i / width);
    return [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, y > 0 ? i - width : -1, y < height - 1 ? i + width : -1].filter((n) => n >= 0);
  };
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    for (const n of near4(i)) {
      if (dist[n]! > dist[i]! + 1) {
        dist[n] = dist[i]! + 1;
        queue.push(n);
      }
    }
  }
  const downhill = (i: number) => (elevation[i] ?? 0) * 6 + dist[i]!;
  const sources = rng.shuffle(
    terrain.flatMap((t, i) =>
      RIVER_BED.includes(t) && dist[i]! >= 4 && near4(i).some((n) => terrain[n] === "hills" || terrain[n] === "mountains") ? [i] : [],
    ),
  );
  const wanted = count - 1 + rng.int(3);
  let made = 0;
  for (const source of sources) {
    if (made >= wanted) break;
    // A new river starts away from the others.
    if (terrain[source] === "river" || near4(source).some((n) => terrain[n] === "river")) continue;
    const path: number[] = [source];
    let at = source;
    let joined = false;
    while (dist[at]! > 1 && path.length < 18) {
      const next = near4(at).filter((n) => (RIVER_BED.includes(terrain[n]!) || terrain[n] === "river") && !path.includes(n));
      // The river never touches its own course again, so it does not run in loops.
      const clear = next.filter((n) => terrain[n] === "river" || !near4(n).some((m) => m !== at && path.includes(m)));
      if (clear.length === 0) break;
      const ahead = clear.filter((n) => dist[n]! <= dist[at]!);
      const pool = (ahead.length ? ahead : clear).sort((a, b) => downhill(a) - downhill(b));
      // Mostly the steepest way, sometimes the second one, so rivers bend.
      at = pool.length > 1 && rng.next() < 0.3 ? pool[1]! : pool[0]!;
      path.push(at);
      if (terrain[at] === "river") {
        joined = true;
        break;
      }
    }
    // Only rivers that reach the coast or another river and are long enough.
    if (!(joined || dist[at] === 1) || path.length < 3) continue;
    for (const i of path) terrain[i] = "river";
    made++;
  }
}

/** Ice along the top and bottom edge of the map, ragged where it meets the sea (mutates `terrain`). */
function addPolarIce(rng: Rng, size: GridSize, terrain: TerrainId[]): void {
  const { width, height } = size;
  for (const [edge, inner] of [
    [0, 1],
    [height - 1, height - 2],
  ] as const) {
    for (let x = 0; x < width; x++) {
      if (rng.next() < 0.8) terrain[edge * width + x] = "arctic";
    }
    for (let x = 0; x < width; x++) {
      // Ice never touches the continent, so the coast and river mouths stay open.
      const beyond = inner + (inner - edge);
      const clear = [x - 1, x, x + 1].every((bx) => bx < 0 || bx >= width || terrain[beyond * width + bx] === "ocean");
      if (terrain[edge * width + x] === "arctic" && terrain[inner * width + x] === "ocean" && clear && rng.next() < 0.22) terrain[inner * width + x] = "arctic";
    }
  }
}

/**
 * Special resources: a share of land tiles and of the sea next to the
 * continent, never two on neighbouring tiles. Rivers have none.
 */
function placeSpecials(rng: Rng, size: GridSize, terrain: TerrainId[], chance: number): number[] {
  const special = new Array<number>(size.width * size.height).fill(0);
  for (let i = 0; i < terrain.length; i++) {
    const t = terrain[i]!;
    if (t === "river") continue;
    const neighbours = neighbors8(size, i);
    if (t === "ocean" && !neighbours.some((n) => terrain[n] !== "ocean" && terrain[n] !== "arctic")) {
      // Fish only next to the continent, where cities can reach it.
      rng.next();
      continue;
    }
    if (rng.next() >= chance) continue;
    if (neighbours.some((n) => special[n])) continue;
    special[i] = 1;
  }
  return special;
}

interface Octave {
  /** Distance between random lattice points, in tiles. */
  cell: number;
  weight: number;
}

/** Smooth value noise in roughly [0, 1], sum of bilinear-interpolated lattices. */
function valueNoise(rng: Rng, size: GridSize, octaves: Octave[]): number[] {
  const result = new Array<number>(size.width * size.height).fill(0);
  let totalWeight = 0;
  for (const octave of octaves) {
    totalWeight += octave.weight;
    const lw = Math.ceil(size.width / octave.cell) + 2;
    const lh = Math.ceil(size.height / octave.cell) + 2;
    const lattice = Array.from({ length: lw * lh }, () => rng.next());
    const at = (lx: number, ly: number) => lattice[ly * lw + lx] ?? 0;
    for (let y = 0; y < size.height; y++) {
      for (let x = 0; x < size.width; x++) {
        const fx = x / octave.cell;
        const fy = y / octave.cell;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = smooth(fx - x0);
        const ty = smooth(fy - y0);
        const top = lerp(at(x0, y0), at(x0 + 1, y0), tx);
        const bottom = lerp(at(x0, y0 + 1), at(x0 + 1, y0 + 1), tx);
        const i = toIndex(size, x, y);
        result[i] = (result[i] ?? 0) + lerp(top, bottom, ty) * octave.weight;
      }
    }
  }
  return result.map((v) => v / totalWeight);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}
