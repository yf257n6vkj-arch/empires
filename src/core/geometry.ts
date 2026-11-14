/**
 * Square grid helpers. Tiles are stored in a flat array, index = y * width + x.
 * Units move in 8 directions and a diagonal step costs the same as a straight
 * one (as in Civilization 1), so the natural distance is Chebyshev distance.
 */

export interface Point {
  x: number;
  y: number;
}

export interface GridSize {
  width: number;
  height: number;
}

export function toIndex(size: GridSize, x: number, y: number): number {
  return y * size.width + x;
}

export function fromIndex(size: GridSize, index: number): Point {
  return { x: index % size.width, y: Math.floor(index / size.width) };
}

export function inBounds(size: GridSize, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < size.width && y < size.height;
}

/** Number of moves between two tiles ignoring terrain. */
export function distance(a: Point, b: Point): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

const DIRS_8: readonly Point[] = [
  { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
  { x: -1, y: 0 },                   { x: 1, y: 0 },
  { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 },
];

const DIRS_4: readonly Point[] = [
  { x: 0, y: -1 }, { x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 },
];

export function neighbors8(size: GridSize, index: number): number[] {
  return neighbors(size, index, DIRS_8);
}

export function neighbors4(size: GridSize, index: number): number[] {
  return neighbors(size, index, DIRS_4);
}

function neighbors(size: GridSize, index: number, dirs: readonly Point[]): number[] {
  const { x, y } = fromIndex(size, index);
  const result: number[] = [];
  for (const d of dirs) {
    const nx = x + d.x;
    const ny = y + d.y;
    if (inBounds(size, nx, ny)) result.push(toIndex(size, nx, ny));
  }
  return result;
}

/** Tiles within Chebyshev distance `radius` (a square), clipped to the map. */
export function tilesInRadius(size: GridSize, center: Point, radius: number): number[] {
  const result: number[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (inBounds(size, x, y)) result.push(toIndex(size, x, y));
    }
  }
  return result;
}

/**
 * The 21 tiles a city can work, as in Civilization 1: a 5x5 square
 * without its four corners. Tiles outside the map are dropped.
 */
export function cityRadiusTiles(size: GridSize, center: Point): number[] {
  const result: number[] = [];
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (Math.abs(dx) === 2 && Math.abs(dy) === 2) continue;
      const x = center.x + dx;
      const y = center.y + dy;
      if (inBounds(size, x, y)) result.push(toIndex(size, x, y));
    }
  }
  return result;
}
