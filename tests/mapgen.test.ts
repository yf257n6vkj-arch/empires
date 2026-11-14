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

function countLandComponents(map: GameMap): number {
  const seen = new Uint8Array(map.terrain.length);
  let components = 0;
  map.terrain.forEach((t, start) => {
    if (seen[start] || !isLand(t)) return;
    components++;
    const stack = [start];
    seen[start] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      for (const n of neighbors8(map, i)) {
        if (!seen[n] && isLand(map.terrain[n]!)) {
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
        expect(t).toBe("ocean");
      }
    });
  });

  it.each(SEEDS)("keeps the land share near the target (%s)", (seed) => {
    const map = generateMap(Rng.fromSeed(seed));
    const share = map.terrain.filter(isLand).length / map.terrain.length;
    expect(share).toBeGreaterThan(0.35);
    expect(share).toBeLessThan(0.5);
  });

  it("uses all seven terrain types", () => {
    const map = generateMap(Rng.fromSeed("variety"));
    expect(new Set(map.terrain).size).toBe(7);
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
