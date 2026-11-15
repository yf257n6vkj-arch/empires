/**
 * Map generator: one continent surrounded by sea on a square grid.
 *
 * Steps:
 *  1. Elevation = value noise minus an elliptical falloff from the centre.
 *  2. Pick the threshold so that roughly `landShare` of the map is land.
 *  3. Keep a ring of sea along the edges, keep only the largest landmass
 *     and fill enclosed water, so there is exactly one continent and no lakes.
 *  4. Hand out terrain types by ranking land tiles by independent noise
 *     fields (ruggedness, moisture, vegetation) so each type gets a
 *     predictable share of the land. Tundra lies towards the poles, jungle
 *     and swamp in wet lowland nearer the equator.
 *  5. Rivers run from hills and mountains down to the sea.
 *  6. Polar ice along the top and bottom edges, as in Civilization 1.
 *  7. Special resources on some tiles, never two side by side.
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
  /** Sea tiles kept along every edge. */
  seaBorder: number;
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
  /** Chance that a land tile, or a sea tile next to the continent, gets a special resource. */
  specialChance: number;
}

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  width: 40,
  height: 28,
  landShare: 0.42,
  seaBorder: 2,
  shares: { mountains: 0.07, hills: 0.12, desert: 0.07, forest: 0.16, plains: 0.22, jungle: 0.06, swamp: 0.05 },
  tundraLatitude: 0.7,
  rivers: 4,
  specialChance: 0.1,
};

/** Land must not shrink below this share of the target after cleanup. */
const MIN_LAND_RATIO = 0.85;
const MAX_ATTEMPTS = 30;

export function generateMap(rng: Rng, options: MapOptions = DEFAULT_MAP_OPTIONS): GameMap {
  const size: GridSize = { width: options.width, height: options.height };
  const targetLand = Math.round(options.width * options.height * options.landShare);

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const land = generateLandMask(rng, size, options);
    const landCount = land.reduce((n, v) => n + (v ? 1 : 0), 0);
    if (landCount >= targetLand * MIN_LAND_RATIO) {
      const empty = () => new Array<number>(size.width * size.height).fill(0);
      const terrain = assignTerrain(rng, size, land, options);
      addRivers(rng, size, terrain, options.rivers);
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
      };
    }
  }
  throw new Error("generateMap: could not create a large enough continent");
}

function generateLandMask(rng: Rng, size: GridSize, options: MapOptions): boolean[] {
  const { width, height } = size;
  const noise = valueNoise(rng, size, [
    { cell: 10, weight: 1 },
    { cell: 5, weight: 0.5 },
    { cell: 2.5, weight: 0.25 },
  ]);

  const elevation: number[] = new Array(width * height);
  const cx = (width - 1) / 2;
  const cy = (height - 1) / 2;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const nx = (x - cx) / (width / 2);
      const ny = (y - cy) / (height / 2);
      const d2 = nx * nx + ny * ny;
      elevation[toIndex(size, x, y)] = (noise[toIndex(size, x, y)] ?? 0) - 0.9 * d2;
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
  return centerLand(size, land);
}

/** Moves the continent so its bounding box sits in the middle of the map. */
function centerLand(size: GridSize, land: boolean[]): boolean[] {
  let minX = size.width, maxX = -1, minY = size.height, maxY = -1;
  land.forEach((v, i) => {
    if (!v) return;
    const x = i % size.width;
    const y = Math.floor(i / size.width);
    minX = Math.min(minX, x); maxX = Math.max(maxX, x);
    minY = Math.min(minY, y); maxY = Math.max(maxY, y);
  });
  if (maxX < 0) return land;
  const dx = Math.floor((size.width - 1 - maxX - minX) / 2);
  const dy = Math.floor((size.height - 1 - maxY - minY) / 2);
  const result = new Array<boolean>(land.length).fill(false);
  land.forEach((v, i) => {
    if (!v) return;
    const x = (i % size.width) + dx;
    const y = Math.floor(i / size.width) + dy;
    result[toIndex(size, x, y)] = true;
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

function assignTerrain(rng: Rng, size: GridSize, land: boolean[], options: MapOptions): TerrainId[] {
  // Ridged noise (1 - |2n - 1|) peaks along thin lines, which gives mountain ranges instead of blobs.
  const rugged = valueNoise(rng, size, [{ cell: 6, weight: 1 }, { cell: 3, weight: 0.35 }]).map(
    (n) => 1 - Math.abs(2 * n - 1),
  );
  const moisture = valueNoise(rng, size, [{ cell: 8, weight: 1 }, { cell: 3, weight: 0.4 }]);
  const vegetation = valueNoise(rng, size, [{ cell: 3, weight: 1 }, { cell: 1.5, weight: 0.4 }]);
  const wobble = valueNoise(rng, size, [{ cell: 4, weight: 1 }]);
  const cy = (size.height - 1) / 2;
  const latitude = (i: number) => Math.abs(Math.floor(i / size.width) - cy) / (size.height / 2) + ((wobble[i] ?? 0.5) - 0.5) * 0.16;

  const terrain: TerrainId[] = land.map((isLandTile) => (isLandTile ? "grassland" : "ocean"));
  const landTiles = land.flatMap((v, i) => (v ? [i] : []));
  const total = landTiles.length;
  const { shares } = options;
  const take = (from: number[], share: number, to: TerrainId) => {
    const n = Math.round(total * share);
    from.slice(0, n).forEach((i) => (terrain[i] = to));
    return from.slice(n);
  };

  // Mountains and hills: the most rugged tiles.
  const byRugged = [...landTiles].sort((a, b) => (rugged[b] ?? 0) - (rugged[a] ?? 0));
  take(take(byRugged, shares.mountains, "mountains"), shares.hills, "hills");

  // Flat land near the poles is tundra.
  for (const i of landTiles) if (terrain[i] === "grassland" && latitude(i) > options.tundraLatitude) terrain[i] = "tundra";

  // Flat land by moisture: driest is desert (away from the poles), then plains, wettest stays grassland.
  const flat = landTiles.filter((i) => terrain[i] === "grassland");
  const byDry = [...flat].sort((a, b) => (moisture[a] ?? 0) + latitude(a) * 0.3 - ((moisture[b] ?? 0) + latitude(b) * 0.3));
  take(take(byDry, shares.desert, "desert"), shares.plains, "plains");

  // The wettest lowland: jungle nearer the equator, swamp elsewhere.
  const wet = landTiles.filter((i) => terrain[i] === "grassland").sort((a, b) => (moisture[b] ?? 0) - (moisture[a] ?? 0));
  const byHeat = [...wet.slice(0, Math.round(wet.length * 0.45))].sort((a, b) => latitude(a) - latitude(b));
  take(byHeat, shares.jungle, "jungle");
  const marsh = landTiles.filter((i) => terrain[i] === "grassland").sort((a, b) => (moisture[b] ?? 0) - (moisture[a] ?? 0));
  take(marsh, shares.swamp, "swamp");

  // Forest grows on grassland and plains with the highest vegetation.
  const green = landTiles.filter((i) => terrain[i] === "grassland" || terrain[i] === "plains");
  const byVegetation = [...green].sort((a, b) => (vegetation[b] ?? 0) - (vegetation[a] ?? 0));
  take(byVegetation, shares.forest, "forest");

  return terrain;
}

/** Terrain a river may run through; it replaces it. */
const RIVER_BED: TerrainId[] = ["grassland", "plains", "desert", "forest", "tundra", "jungle", "swamp"];

/**
 * Rivers start next to hills or mountains and run downhill, which here means
 * towards the nearest sea, until they reach the coast (mutates `terrain`).
 */
function addRivers(rng: Rng, size: GridSize, terrain: TerrainId[], count: number): void {
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
  const sources = rng.shuffle(
    terrain.flatMap((t, i) =>
      RIVER_BED.includes(t) && dist[i]! >= 4 && near4(i).some((n) => terrain[n] === "hills" || terrain[n] === "mountains") ? [i] : [],
    ),
  );
  const wanted = count - 1 + rng.int(3);
  let made = 0;
  for (const source of sources) {
    if (made >= wanted) break;
    // Keep rivers apart from each other.
    if (terrain[source] === "river" || near4(source).some((n) => terrain[n] === "river")) continue;
    const path: number[] = [source];
    let at = source;
    while (dist[at]! > 1 && path.length < 16) {
      const bed = near4(at).filter((n) => RIVER_BED.includes(terrain[n]!) && !path.includes(n) && !near4(n).some((m) => m !== at && path.includes(m)));
      const down = bed.filter((n) => dist[n]! < dist[at]!);
      // Now and then the river wanders sideways before it falls again, so it bends.
      const level = bed.filter((n) => dist[n] === dist[at]);
      const options = level.length && rng.next() < 0.45 ? level : down;
      if (options.length === 0) break;
      at = options[rng.int(options.length)]!;
      path.push(at);
    }
    // Only rivers that reach the coast and are long enough.
    if (dist[at] !== 1 || path.length < 3) continue;
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
