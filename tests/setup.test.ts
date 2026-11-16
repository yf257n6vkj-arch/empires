import { describe, expect, it } from "vitest";
import {
  DEFAULT_WORLD,
  DEFAULT_WORLD_CHOICE,
  formatGameCode,
  generateMap,
  mainContinent,
  mapOptionsFor,
  maxOpponents,
  neighbors8,
  newGame,
  parseGameCode,
  resolveWorld,
  Rng,
  WORLD_OPTIONS,
  WORLD_RULES,
  type GameMap,
  type TerrainId,
  type WorldSettings,
} from "../src/core";

const SEEDS = Array.from({ length: 12 }, (_, i) => `world-${i}`);

function mapFor(world: Partial<WorldSettings>, seed: string): GameMap {
  return generateMap(Rng.fromSeed(seed), mapOptionsFor({ ...DEFAULT_WORLD, ...world }));
}

/** Share of land tiles of the given kinds, summed over the seeds. */
function share(world: Partial<WorldSettings>, kinds: TerrainId[]): number {
  let hit = 0;
  let land = 0;
  for (const seed of SEEDS) {
    for (const t of mapFor(world, seed).terrain) {
      if (t === "ocean" || t === "arctic") continue;
      land++;
      if (kinds.includes(t)) hit++;
    }
  }
  return hit / land;
}

/** Land groups other than the main continent, polar ice left out. */
function islands(map: GameMap): number[][] {
  const main = mainContinent(map);
  const isLand = (i: number) => map.terrain[i] !== "ocean" && map.terrain[i] !== "arctic" && !main.has(i);
  const seen = new Uint8Array(map.terrain.length);
  const groups: number[][] = [];
  for (let s = 0; s < map.terrain.length; s++) {
    if (seen[s] || !isLand(s)) continue;
    const group: number[] = [];
    const stack = [s];
    seen[s] = 1;
    while (stack.length) {
      const i = stack.pop()!;
      group.push(i);
      for (const n of neighbors8(map, i)) {
        if (!seen[n] && isLand(n)) {
          seen[n] = 1;
          stack.push(n);
        }
      }
    }
    groups.push(group);
  }
  return groups;
}

describe("world settings", () => {
  it("gives the standard map for the default settings", () => {
    expect(generateMap(Rng.fromSeed("same"), mapOptionsFor(DEFAULT_WORLD))).toEqual(generateMap(Rng.fromSeed("same")));
  });

  it.each(WORLD_OPTIONS.size)("makes a %s world of its size", (size) => {
    const map = mapFor({ size }, "size");
    expect(map.width).toBe(WORLD_RULES.sizes[size].width);
    expect(map.height).toBe(WORLD_RULES.sizes[size].height);
  });

  it.each(SEEDS)("puts islands around the continent and every start on the continent (%s)", (seed) => {
    const world: WorldSettings = { ...DEFAULT_WORLD, shape: "islands" };
    const game = newGame({ seed, playerCount: world.opponents + 1, world });
    const groups = islands(game.map);
    expect(groups.length).toBeGreaterThanOrEqual(2);
    const main = mainContinent(game.map);
    for (const group of groups) {
      // At least one sea tile between an island and the continent.
      for (const i of group) expect(neighbors8(game.map, i).some((n) => main.has(n))).toBe(false);
    }
    for (const p of game.players) expect(main.has(p.start.y * game.map.width + p.start.x)).toBe(true);
  });

  it("keeps the continent alone without the islands shape", () => {
    for (const seed of SEEDS) expect(islands(mapFor({}, seed))).toHaveLength(0);
  });

  it("changes the amount of land", () => {
    const land = (amount: WorldSettings["land"]) =>
      SEEDS.reduce((n, seed) => n + mapFor({ land: amount }, seed).terrain.filter((t) => t !== "ocean" && t !== "arctic").length, 0);
    expect(land("less")).toBeLessThan(land("normal"));
    expect(land("normal")).toBeLessThan(land("more"));
  });

  it("makes a warm world hotter and a cool one colder", () => {
    expect(share({ temperature: "warm" }, ["desert", "jungle"])).toBeGreaterThan(share({ temperature: "cool" }, ["desert", "jungle"]));
    expect(share({ temperature: "cool" }, ["tundra"])).toBeGreaterThan(share({ temperature: "warm" }, ["tundra"]));
  });

  it("makes a wet world greener and a dry one barer", () => {
    expect(share({ rainfall: "wet" }, ["forest", "swamp", "jungle"])).toBeGreaterThan(share({ rainfall: "arid" }, ["forest", "swamp", "jungle"]));
    expect(share({ rainfall: "arid" }, ["desert"])).toBeGreaterThan(share({ rainfall: "wet" }, ["desert"]));
  });

  it("gives a young world more mountains and an old one more hills", () => {
    expect(share({ age: "young" }, ["mountains"])).toBeGreaterThan(share({ age: "old" }, ["mountains"]));
    expect(share({ age: "old" }, ["hills"])).toBeGreaterThan(share({ age: "young" }, ["hills"]));
  });

  it("places more special resources when they are abundant", () => {
    const specials = (resources: WorldSettings["resources"]) =>
      SEEDS.reduce((n, seed) => n + mapFor({ resources }, seed).special.filter(Boolean).length, 0);
    expect(specials("rare")).toBeLessThan(specials("normal"));
    expect(specials("normal")).toBeLessThan(specials("abundant"));
  });

  it("starts a game with the chosen number of opponents", () => {
    for (const size of WORLD_OPTIONS.size) {
      const opponents = maxOpponents(size);
      const world: WorldSettings = { ...DEFAULT_WORLD, size, opponents, land: "less" };
      const game = newGame({ seed: formatGameCode("count", world), playerCount: opponents + 1, world });
      expect(game.players).toHaveLength(opponents + 1);
    }
  });

  it("creates every combination of extreme settings", () => {
    let made = 0;
    for (const size of WORLD_OPTIONS.size)
      for (const shape of WORLD_OPTIONS.shape)
        for (const land of ["less", "more"] as const)
          for (const temperature of ["cool", "warm"] as const) {
            const world: WorldSettings = { ...DEFAULT_WORLD, size, shape, land, temperature, rainfall: "arid", age: "young", opponents: maxOpponents(size) };
            const game = newGame({ seed: `extreme-${made}`, playerCount: world.opponents + 1, world });
            expect(game.players).toHaveLength(world.opponents + 1);
            made++;
          }
    expect(made).toBe(24);
  });
});

describe("map code", () => {
  it("keeps the plain seed for the standard world", () => {
    expect(formatGameCode("les-4821", DEFAULT_WORLD)).toBe("les-4821");
    expect(parseGameCode("les-4821")).toEqual({ seed: "les-4821", world: null });
  });

  it("carries the settings and reads them back", () => {
    const world: WorldSettings = { size: "large", opponents: 5, shape: "islands", land: "more", temperature: "cool", rainfall: "wet", age: "old", resources: "rare" };
    const code = formatGameCode("hora-1234", world);
    expect(code).toBe("hora-1234/25120220");
    expect(parseGameCode(code)).toEqual({ seed: "hora-1234", world });
  });

  it("treats a code with impossible settings as a plain seed", () => {
    expect(parseGameCode("x/09011111").world).toBeNull();
    expect(parseGameCode("x/13911111").world).toBeNull();
  });

  it("reads the world from the map code when a game starts", () => {
    const world: WorldSettings = { ...DEFAULT_WORLD, size: "small", opponents: 2 };
    const game = newGame({ seed: formatGameCode("kod", world), playerCount: 3 });
    expect(game.map.width).toBe(WORLD_RULES.sizes.small.width);
  });
});

describe("resolveWorld", () => {
  it("keeps the chosen settings and gives the opponents by size", () => {
    expect(resolveWorld(DEFAULT_WORLD_CHOICE, "any")).toEqual(DEFAULT_WORLD);
    expect(resolveWorld({ ...DEFAULT_WORLD_CHOICE, size: "large" }, "any").opponents).toBe(WORLD_RULES.sizes.large.opponents);
  });

  it("limits the opponents to what the size has room for", () => {
    expect(resolveWorld({ ...DEFAULT_WORLD_CHOICE, size: "small", opponents: 5 }, "any").opponents).toBe(maxOpponents("small"));
  });

  it("draws random settings from the seed", () => {
    const all = { size: "random", opponents: "random", shape: "random", land: "random", temperature: "random", rainfall: "random", age: "random", resources: "random" } as const;
    expect(resolveWorld(all, "a")).toEqual(resolveWorld(all, "a"));
    const worlds = new Set(Array.from({ length: 20 }, (_, i) => JSON.stringify(resolveWorld(all, `s${i}`))));
    expect(worlds.size).toBeGreaterThan(10);
    for (const w of worlds) {
      const world = JSON.parse(w) as WorldSettings;
      expect(world.opponents).toBeGreaterThanOrEqual(1);
      expect(world.opponents).toBeLessThanOrEqual(maxOpponents(world.size));
    }
  });
});
