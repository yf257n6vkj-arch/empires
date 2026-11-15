import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  BUILDINGS,
  canBuildBuilding,
  capitalOf,
  cityEffects,
  cityHappiness,
  cityPollution,
  cityReport,
  corruptionPct,
  migrateState,
  RULES,
  STATE_VERSION,
  type BuildingId,
  type City,
  type GameState,
} from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

// Two cities eight tiles apart on grassland with an ocean strip in the north.
const MAP = [
  "~~~~~~~~~~~~~",
  ".............",
  ".............",
  ".............",
  ".............",
];

function twoCities(rows = MAP): GameState {
  let s = stateFromAscii(rows);
  const a = addUnit(s, "settlers", 1, 2);
  s = apply(s, { type: "foundCity", unitId: a.id });
  const b = addUnit(s, "settlers", 9, 2);
  return apply(s, { type: "foundCity", unitId: b.id });
}

/** Finishes a building in the city by paying all its shields up front. */
function build(s: GameState, city: City, id: BuildingId): GameState {
  const draft = structuredClone(s);
  const c = draft.cities.find((x) => x.id === city.id)!;
  c.production = { kind: "building", id };
  c.shields = BUILDINGS[id].cost;
  draft.players[c.owner]!.techs.push(BUILDINGS[id].requires!);
  return apply(draft, { type: "endTurn" });
}

function giveTrade(s: GameState): void {
  for (let i = 0; i < s.map.road.length; i++) s.map.road[i] = 1;
}

describe("palace and corruption", () => {
  it("puts a free palace into the first city only", () => {
    const s = twoCities();
    expect(s.cities[0]!.buildings).toEqual(["palace"]);
    expect(s.cities[1]!.buildings).toEqual([]);
    expect(capitalOf(s, 0)?.id).toBe(s.cities[0]!.id);
  });

  it("takes trade from cities far from the capital and none from the capital", () => {
    const s = twoCities();
    expect(corruptionPct(s, s.cities[0]!)).toBe(0);
    expect(corruptionPct(s, s.cities[1]!)).toBe(8 * RULES.corruptionPerTile);
  });

  it("caps corruption, and a player without a palace loses the maximum everywhere", () => {
    const s = twoCities();
    s.cities[0]!.buildings = [];
    expect(corruptionPct(s, s.cities[0]!)).toBe(RULES.corruptionMaxPct);
    expect(corruptionPct(s, s.cities[1]!)).toBe(RULES.corruptionMaxPct);
  });

  it("subtracts corruption from trade before science and gold", () => {
    const s = twoCities();
    giveTrade(s);
    const far = s.cities[1]!;
    const r = cityReport(s, far);
    expect(r.production.trade).toBeGreaterThan(0);
    expect(r.corruption).toBe(Math.round((r.production.trade * corruptionPct(s, far)) / 100));
    expect(r.science + r.gold).toBe(r.production.trade - r.corruption);
  });

  it("halves corruption with a courthouse", () => {
    let s = twoCities();
    const before = corruptionPct(s, s.cities[1]!);
    s = build(s, s.cities[1]!, "courthouse");
    expect(s.cities[1]!.buildings).toContain("courthouse");
    expect(corruptionPct(s, s.cities[1]!)).toBe(Math.round(before / 2));
  });

  it("moves the capital when a palace is built in another city", () => {
    let s = twoCities();
    expect(canBuildBuilding(s, s.cities[1]!, BUILDINGS.palace)).toBe(false);
    s.players[0]!.techs.push("masonry");
    expect(canBuildBuilding(s, s.cities[1]!, BUILDINGS.palace)).toBe(true);
    s = build(s, s.cities[1]!, "palace");
    expect(s.cities[0]!.buildings).not.toContain("palace");
    expect(s.cities[1]!.buildings).toContain("palace");
    expect(corruptionPct(s, s.cities[0]!)).toBe(8 * RULES.corruptionPerTile);
  });

  it("gives the oldest city a palace when loading a version 4 save", () => {
    const s = twoCities();
    for (const c of s.cities) c.buildings = [];
    const loaded = migrateState({ ...structuredClone(s), version: 4 } as unknown as Record<string, unknown>)!;
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.cities[0]!.buildings).toEqual(["palace"]);
    expect(loaded.cities[1]!.buildings).toEqual([]);
  });
});

describe("harbour", () => {
  it("can only be built next to the ocean", () => {
    let s = stateFromAscii(MAP);
    s.players[0]!.techs.push("mapMaking");
    const coast = addUnit(s, "settlers", 2, 1);
    s = apply(s, { type: "foundCity", unitId: coast.id });
    const inland = addUnit(s, "settlers", 8, 4);
    s = apply(s, { type: "foundCity", unitId: inland.id });
    expect(canBuildBuilding(s, s.cities[0]!, BUILDINGS.harbour)).toBe(true);
    expect(canBuildBuilding(s, s.cities[1]!, BUILDINGS.harbour)).toBe(false);
  });

  it("adds one food on every worked ocean tile", () => {
    let s = stateFromAscii(MAP);
    const settler = addUnit(s, "settlers", 2, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    const city = s.cities[0]!;
    city.size = 3;
    city.worked = [1, 2, 3];
    city.manualTiles = true;
    const before = cityReport(s, city).production.food;
    city.buildings.push("harbour");
    expect(cityReport(s, city).production.food).toBe(before + 3);
  });
});

describe("bank, factory and power plants", () => {
  it("needs a marketplace before a bank", () => {
    const s = twoCities();
    s.players[0]!.techs.push("banking");
    expect(canBuildBuilding(s, s.cities[0]!, BUILDINGS.bank)).toBe(false);
    s.cities[0]!.buildings.push("marketplace");
    expect(canBuildBuilding(s, s.cities[0]!, BUILDINGS.bank)).toBe(true);
  });

  it("adds the bank's gold on top of the marketplace", () => {
    const s = twoCities();
    s.cities[0]!.buildings.push("marketplace", "bank");
    expect(cityEffects(s, s.cities[0]!).goldPct).toBe(100);
  });

  it("lets a power plant work only together with a factory", () => {
    const s = twoCities();
    const city = s.cities[0]!;
    city.buildings.push("powerPlant");
    expect(cityEffects(s, city).shieldsPct).toBe(0);
    city.buildings.push("factory");
    expect(cityEffects(s, city).shieldsPct).toBe(75);
  });

  it("replaces an old power plant with a new one", () => {
    let s = twoCities();
    s.cities[0]!.buildings.push("factory", "powerPlant");
    s = build(s, s.cities[0]!, "hydroPlant");
    expect(s.cities[0]!.buildings).toContain("hydroPlant");
    expect(s.cities[0]!.buildings).not.toContain("powerPlant");
  });

  it("doubles production with factory and robotized factory", () => {
    const s = twoCities();
    s.cities[0]!.buildings.push("factory", "manufacturingPlant");
    expect(cityEffects(s, s.cities[0]!).shieldsPct).toBe(100);
  });
});

describe("pollution", () => {
  // A city in a forest: every worked tile gives two shields.
  const FOREST = ["fffffff", "fffffff", "fff.fff", "fffffff", "fffffff"];

  function industrialCity(): { s: GameState; city: City } {
    let s = stateFromAscii(FOREST);
    const settler = addUnit(s, "settlers", 3, 2);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    const city = s.cities[0]!;
    city.size = 8;
    city.worked = [0, 1, 2, 3, 4, 5, 6, 7];
    city.manualTiles = true;
    return { s, city };
  }

  it("leaves a small city's air clean", () => {
    let s = stateFromAscii(FOREST);
    const settler = addUnit(s, "settlers", 3, 2);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    expect(cityPollution(s, s.cities[0]!).unhappy).toBe(0);
  });

  it("makes citizens unhappy in a busy factory city", () => {
    const { s, city } = industrialCity();
    city.buildings.push("factory");
    const p = cityPollution(s, city);
    // 17 shields x 1.5 = 25, five over the limit.
    expect(p.industry).toBe(25);
    expect(p.unhappy).toBe(1);
    const calm = { ...city, buildings: ["palace" as const] };
    expect(cityHappiness(s, city).unhappy + cityHappiness(s, city).entertainers).toBeGreaterThan(
      cityHappiness(s, calm).unhappy + cityHappiness(s, calm).entertainers,
    );
  });

  it("adds pollution from citizens with industrial technologies, and mass transit removes it", () => {
    const { s, city } = industrialCity();
    s.players[0]!.techs.push(...RULES.pollutionTechs);
    expect(cityPollution(s, city).population).toBe(8);
    city.buildings.push("massTransit");
    expect(cityPollution(s, city).population).toBe(0);
  });

  it("cleans the air from industry with a hydro plant and a recycling center", () => {
    const { s, city } = industrialCity();
    city.buildings.push("factory", "hydroPlant");
    // 17 x 1.75 = 29, half of it stays.
    expect(cityPollution(s, city).industry).toBe(14);
    city.buildings.push("recyclingCenter");
    expect(cityPollution(s, city).industry).toBe(4);
  });

  it("refuses to build anything the city already has from the same group", () => {
    const { s, city } = industrialCity();
    s.players[0]!.techs.push("refining", "electronics");
    city.buildings.push("factory", "powerPlant");
    expect(canBuildBuilding(s, city, BUILDINGS.powerPlant)).toBe(false);
    expect(canBuildBuilding(s, city, BUILDINGS.hydroPlant)).toBe(true);
    expect(applyCommand(s, { type: "setProduction", cityId: city.id, item: { kind: "building", id: "hydroPlant" } }).ok).toBe(true);
  });
});
