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
 *     predictable share of the land.
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
  };
}

export const DEFAULT_MAP_OPTIONS: MapOptions = {
  width: 40,
  height: 28,
  landShare: 0.42,
  seaBorder: 2,
  shares: { mountains: 0.07, hills: 0.12, desert: 0.08, forest: 0.2, plains: 0.25 },
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
      return {
        width: size.width,
        height: size.height,
        terrain: assignTerrain(rng, size, land, options),
        road: empty(),
        irrigation: empty(),
        mine: empty(),
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

  const terrain: TerrainId[] = land.map((isLandTile) => (isLandTile ? "grassland" : "ocean"));
  const landTiles = land.flatMap((v, i) => (v ? [i] : []));
  const total = landTiles.length;
  const { shares } = options;

  // Mountains and hills: the most rugged tiles.
  const byRugged = [...landTiles].sort((a, b) => (rugged[b] ?? 0) - (rugged[a] ?? 0));
  const nMountains = Math.round(total * shares.mountains);
  const nHills = Math.round(total * shares.hills);
  byRugged.slice(0, nMountains).forEach((i) => (terrain[i] = "mountains"));
  byRugged.slice(nMountains, nMountains + nHills).forEach((i) => (terrain[i] = "hills"));

  // Flat land by moisture: driest is desert, then plains, wettest stays grassland.
  const flat = landTiles.filter((i) => terrain[i] === "grassland");
  const byDry = [...flat].sort((a, b) => (moisture[a] ?? 0) - (moisture[b] ?? 0));
  const nDesert = Math.round(total * shares.desert);
  const nPlains = Math.round(total * shares.plains);
  byDry.slice(0, nDesert).forEach((i) => (terrain[i] = "desert"));
  byDry.slice(nDesert, nDesert + nPlains).forEach((i) => (terrain[i] = "plains"));

  // Forest grows on grassland and plains with the highest vegetation.
  const green = landTiles.filter((i) => terrain[i] === "grassland" || terrain[i] === "plains");
  const byVegetation = [...green].sort((a, b) => (vegetation[b] ?? 0) - (vegetation[a] ?? 0));
  byVegetation.slice(0, Math.round(total * shares.forest)).forEach((i) => (terrain[i] = "forest"));

  return terrain;
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
