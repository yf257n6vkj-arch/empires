import { describe, expect, it } from "vitest";
import {
  cityRadiusTiles,
  DEFAULT_MAP_OPTIONS,
  generateMap,
  isLand,
  neighbors8,
  Rng,
  type GameMap,
} from "../src/core";

const SEEDS = Array.from({ length: 40 }, (_, i) => `test-${i}`);

/** The continent: land without the polar ice along the map edges. */
const continent = (t: string) => isLand(t as never) && t !== "arctic";

function countLandComponents(map: GameMap): number {
  const seen = new Uint8Array(map.terrain.length);
  let components = 0;
  map.terrain.forEach((t, start) => {
    if (seen[start] || !continent(t)) return;
    components++;
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      for (const n of neighbors8(map, i)) {
        if (!seen[n] && continent(map.terrain[n]!)) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
  });
  return components;
}

describe("generateMap", () => {
  it("is deterministic for a seed", () => {
    expect(generateMap(Rng.fromSeed("same"))).toEqual(generateMap(Rng.fromSeed("same")));
  });

  it("has the configured size", () => {
    const map = generateMap(Rng.fromSeed("size"));
    expect(map.width).toBe(40);
    expect(map.height).toBe(28);
    expect(map.terrain).toHaveLength(40 * 28);
  });

  it.each(SEEDS)("creates exactly one continent surrounded by sea (%s)", (seed) => {
    const map = generateMap(Rng.fromSeed(seed));
    expect(countLandComponents(map)).toBe(1);
    const border = DEFAULT_MAP_OPTIONS.seaBorder;
    map.terrain.forEach((t, i) => {
      const x = i % map.width;
      const y = Math.floor(i / map.width);
      if (x < border || y < border || x >= map.width - border || y >= map.height - border) {
        // Sea, or polar ice along the top and bottom edge.
        expect(t === "ocean" || (t === "arctic" && (y <= 1 || y >= map.height - 2))).toBe(true);
      }
    });
  });

  it.each(SEEDS)("keeps the land share near the target (%s)", (seed) => {
    const map = generateMap(Rng.fromSeed(seed));
    const share = map.terrain.filter(continent).length / map.terrain.length;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.5);
  });

  it("uses all twelve terrain types across a few maps", () => {
    const seen = new Set(SEEDS.slice(0, 10).flatMap((seed) => generateMap(Rng.fromSeed(seed)).terrain));
    expect(seen.size).toBe(12);
  });

  it.each(SEEDS)("never puts two special resources side by side (%s)", (seed) => {
    const map = generateMap(Rng.fromSeed(seed));
    map.special.forEach((v, i) => {
      if (!v) return;
      for (const n of neighbors8(map, i)) expect(map.special[n]).toBe(0);
      const t = map.terrain[i]!;
      expect(t).not.toBe("river");
      // Fish only where the continent can reach it.
      if (t === "ocean") expect(neighbors8(map, i).some((n) => continent(map.terrain[n]!))).toBe(true);
    });
  });

  it.each(SEEDS)("lets every river reach the sea (%s)", (seed) => {
    const map = generateMap(Rng.fromSeed(seed));
    const seen = new Set<number>();
    map.terrain.forEach((t, start) => {
      if (t !== "river" || seen.has(start)) return;
      // Walk the river and look for a tile next to the sea.
      const stack = [start];
      let coast = false;
      seen.add(start);
      while (stack.length) {
        const i = stack.pop()!;
        const x = i % map.width;
        const y = Math.floor(i / map.width);
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
          const n = (y + dy) * map.width + x + dx;
          if (x + dx < 0 || y + dy < 0 || x + dx >= map.width || y + dy >= map.height) continue;
          if (map.terrain[n] === "ocean") coast = true;
          if (map.terrain[n] === "river" && !seen.has(n)) {
            seen.add(n);
            stack.push(n);
          }
        }
      }
      expect(coast).toBe(true);
    });
  });

  it("keeps tundra away from the equator", () => {
    for (const seed of SEEDS.slice(0, 10)) {
      const map = generateMap(Rng.fromSeed(seed));
      map.terrain.forEach((t, i) => {
        if (t !== "tundra") return;
        const y = Math.floor(i / map.width);
        expect(Math.abs(y - (map.height - 1) / 2)).toBeGreaterThan(map.height * 0.25);
      });
    }
  });
});

describe("cityRadiusTiles", () => {
  it("returns the 21 tiles of a Civilization 1 city", () => {
    expect(cityRadiusTiles({ width: 40, height: 28 }, { x: 10, y: 10 })).toHaveLength(21);
  });

  it("clips tiles outside the map", () => {
    expect(cityRadiusTiles({ width: 40, height: 28 }, { x: 0, y: 0 })).toHaveLength(8);
  });
});
