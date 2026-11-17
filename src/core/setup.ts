/**
 * World settings chosen when a game starts: size, shape, land, climate, age
 * and resources, in the spirit of Civilization 1's "Customize World". The
 * numbers live in data/world.json; the default of every setting gives the
 * standard map.
 *
 * The settings travel inside the map code, so the same code always gives
 * the same world: "les-4821" is the standard world, "les-4821/24121011"
 * carries eight digits, one per setting in the order of SETTING_KEYS.
 */
import worldData from "./data/world.json";
import { DEFAULT_MAP_OPTIONS, type MapOptions } from "./mapgen";
import { Rng } from "./rng";

export type WorldSize = "small" | "medium" | "large";
export type WorldShape = "continent" | "islands";
export type LandAmount = "less" | "normal" | "more";
export type Temperature = "cool" | "temperate" | "warm";
export type Rainfall = "arid" | "normal" | "wet";
export type WorldAge = "young" | "normal" | "old";
export type ResourceAmount = "rare" | "normal" | "abundant";

export interface WorldSettings {
  size: WorldSize;
  /** Computer players; between 1 and the size's maxOpponents. */
  opponents: number;
  shape: WorldShape;
  land: LandAmount;
  temperature: Temperature;
  rainfall: Rainfall;
  age: WorldAge;
  resources: ResourceAmount;
}

/** What the player picked: any setting may be left to chance, opponents may follow the size. */
export type WorldChoice = {
  [K in keyof WorldSettings]: K extends "opponents" ? number | "auto" | "random" : WorldSettings[K] | "random";
};

interface SizeRule {
  width: number;
  height: number;
  opponents: number;
  maxOpponents: number;
  rivers: number;
  ranges: number;
}
type Factors = Partial<Record<keyof MapOptions["shares"], number>>;

interface WorldRules {
  sizes: Record<WorldSize, SizeRule>;
  shapes: Record<WorldShape, { islandShare: number; seaBorder: number }>;
  land: Record<LandAmount, { landShare: number }>;
  temperature: Record<Temperature, Factors & { tundraLatitude: number }>;
  rainfall: Record<Rainfall, Factors & { rivers: number }>;
  age: Record<WorldAge, Factors & { ranges: number }>;
  resources: Record<ResourceAmount, { specialChance: number }>;
}

export const WORLD_RULES: Readonly<WorldRules> = worldData as unknown as WorldRules;

export const WORLD_OPTIONS = {
  size: ["small", "medium", "large"],
  shape: ["continent", "islands"],
  land: ["less", "normal", "more"],
  temperature: ["cool", "temperate", "warm"],
  rainfall: ["arid", "normal", "wet"],
  age: ["young", "normal", "old"],
  resources: ["rare", "normal", "abundant"],
} as const satisfies { [K in Exclude<keyof WorldSettings, "opponents">]: readonly WorldSettings[K][] };

export const DEFAULT_WORLD: Readonly<WorldSettings> = {
  size: "medium",
  opponents: WORLD_RULES.sizes.medium.opponents,
  shape: "continent",
  land: "normal",
  temperature: "temperate",
  rainfall: "normal",
  age: "normal",
  resources: "normal",
};

export const DEFAULT_WORLD_CHOICE: Readonly<WorldChoice> = { ...DEFAULT_WORLD, opponents: "auto" };

/** The order of the digits in a map code. */
const SETTING_KEYS = ["size", "opponents", "shape", "land", "temperature", "rainfall", "age", "resources"] as const;

/** The highest number of computer players a world of this size has room for. */
export function maxOpponents(size: WorldSize): number {
  return WORLD_RULES.sizes[size].maxOpponents;
}

/**
 * Turns a choice into concrete settings. Settings left to chance are drawn
 * from the seed, so the same seed and choice always give the same world.
 */
export function resolveWorld(choice: WorldChoice, seed: string): WorldSettings {
  const rng = Rng.fromSeed(seed).fork("world");
  const pick = <K extends keyof typeof WORLD_OPTIONS>(key: K): WorldSettings[K] => {
    const value = choice[key];
    // Always draw, so one random setting does not change what the others get.
    const drawn = rng.pick(WORLD_OPTIONS[key]) as WorldSettings[K];
    return value === "random" ? drawn : (value as WorldSettings[K]);
  };
  const size = pick("size");
  const max = maxOpponents(size);
  const drawnOpponents = 1 + rng.int(max);
  const opponents =
    choice.opponents === "auto" ? WORLD_RULES.sizes[size].opponents
    : choice.opponents === "random" ? drawnOpponents
    : Math.max(1, Math.min(max, Math.round(choice.opponents)));
  return {
    size,
    opponents,
    shape: pick("shape"),
    land: pick("land"),
    temperature: pick("temperature"),
    rainfall: pick("rainfall"),
    age: pick("age"),
    resources: pick("resources"),
  };
}

/** Map generator options for the settings. */
export function mapOptionsFor(world: WorldSettings): MapOptions {
  const size = WORLD_RULES.sizes[world.size];
  const temperature = WORLD_RULES.temperature[world.temperature];
  const rainfall = WORLD_RULES.rainfall[world.rainfall];
  const age = WORLD_RULES.age[world.age];
  const base = DEFAULT_MAP_OPTIONS.shares;
  const shares = { ...base };
  for (const key of Object.keys(base) as (keyof typeof base)[]) {
    shares[key] = base[key] * (temperature[key] ?? 1) * (rainfall[key] ?? 1) * (age[key] ?? 1);
  }
  return {
    ...DEFAULT_MAP_OPTIONS,
    width: size.width,
    height: size.height,
    landShare: WORLD_RULES.land[world.land].landShare,
    islandShare: WORLD_RULES.shapes[world.shape].islandShare,
    seaBorder: WORLD_RULES.shapes[world.shape].seaBorder,
    shares,
    tundraLatitude: temperature.tundraLatitude,
    rivers: Math.max(1, size.rivers + rainfall.rivers),
    ranges: Math.max(1, size.ranges + age.ranges),
    specialChance: WORLD_RULES.resources[world.resources].specialChance,
  };
}

function digitOf(world: WorldSettings, key: (typeof SETTING_KEYS)[number]): number {
  if (key === "opponents") return world.opponents;
  return (WORLD_OPTIONS[key] as readonly string[]).indexOf(world[key]);
}

function isDefault(world: WorldSettings): boolean {
  return SETTING_KEYS.every((k) => world[k] === DEFAULT_WORLD[k]);
}

/** The map code for a seed and settings; the standard world keeps just the seed. */
export function formatGameCode(seed: string, world: WorldSettings): string {
  if (isDefault(world)) return seed;
  return `${seed}/${SETTING_KEYS.map((k) => digitOf(world, k)).join("")}`;
}

/**
 * Reads a map code. A code without settings, or with settings that do not
 * make sense, gives the standard world and keeps the whole text as the seed.
 */
export function parseGameCode(code: string): { seed: string; world: WorldSettings | null } {
  const match = /^(.*)\/(\d{8})$/.exec(code.trim());
  if (!match) return { seed: code.trim(), world: null };
  const digits = match[2]!.split("").map(Number);
  const world = { ...DEFAULT_WORLD };
  for (let k = 0; k < SETTING_KEYS.length; k++) {
    const key = SETTING_KEYS[k]!;
    const d = digits[k]!;
    if (key === "opponents") {
      world.opponents = d;
      continue;
    }
    const options = WORLD_OPTIONS[key] as readonly string[];
    if (d >= options.length) return { seed: code.trim(), world: null };
    (world as Record<string, unknown>)[key] = options[d];
  }
  if (world.opponents < 1 || world.opponents > maxOpponents(world.size)) return { seed: code.trim(), world: null };
  return { seed: match[1]!, world };
}

/** The settings a game was started with, read back from its map code. */
export function worldOfGame(code: string): WorldSettings {
  return parseGameCode(code).world ?? DEFAULT_WORLD;
}

/** The world of a quick game: the standard world made small, with the opponents that size suggests. */
export const QUICK_WORLD_SETTINGS: Readonly<WorldSettings> = {
  ...DEFAULT_WORLD,
  size: "small",
  opponents: WORLD_RULES.sizes.small.opponents,
};

/** The eight digits of the quick world, as they follow the seed in a map code. */
export const QUICK_WORLD = SETTING_KEYS.map((k) => digitOf(QUICK_WORLD_SETTINGS, k)).join("");
