import { describe, expect, it } from "vitest";
import { apply, applyCommand, cityReport, growthThreshold, RULES, UNIT_TYPES, BUILDINGS } from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

const GRASS = [".......", ".......", ".......", ".......", "......."];

function foundAt(rows: string[], x = 3, y = 2) {
  const s = stateFromAscii(rows);
  const settler = addUnit(s, "settlers", x, y);
  return apply(s, { type: "foundCity", unitId: settler.id });
}

describe("founding cities", () => {
  it("turns the settler into a size 1 city with a name", () => {
    const s = foundAt(GRASS);
    expect(s.units).toHaveLength(0);
    expect(s.cities).toHaveLength(1);
    expect(s.cities[0]).toMatchObject({ size: 1, x: 3, y: 2, name: "Lipník" });
    expect(s.cities[0]!.worked).toHaveLength(1);
  });

  it("refuses a city right next to another one", () => {
    const s = foundAt(GRASS);
    const settler = addUnit(s, "settlers", 4, 2);
    expect(applyCommand(s, { type: "foundCity", unitId: settler.id })).toEqual({ ok: false, error: "cityTooClose" });
  });

  it("allows a city two tiles away", () => {
    const s = foundAt(GRASS);
    const settler = addUnit(s, "settlers", 5, 2);
    expect(applyCommand(s, { type: "foundCity", unitId: settler.id }).ok).toBe(true);
  });

  it("refuses warriors as city founders", () => {
    const s = stateFromAscii(GRASS);
    const w = addUnit(s, "warriors", 1, 1);
    expect(applyCommand(s, { type: "foundCity", unitId: w.id })).toEqual({ ok: false, error: "cannotFoundCity" });
  });
});

describe("city economy", () => {
  it("gives the centre a free road and irrigation", () => {
    const s = foundAt(GRASS);
    const report = cityReport(s, s.cities[0]!);
    // centre grassland 2+1 food (spared by despotism), min 1 shield, 1 trade; one worked grassland 2 food
    expect(report.production).toEqual({ food: 5, shields: 1, trade: 1 });
    expect(report.foodSurplus).toBe(5 - RULES.foodPerCitizen);
  });

  it("grows when the food box is full", () => {
    let s = foundAt(GRASS);
    const turns = Math.ceil(growthThreshold(1) / cityReport(s, s.cities[0]!).foodSurplus);
    for (let i = 0; i < turns; i++) s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.size).toBe(2);
    expect(s.cities[0]!.worked).toHaveLength(2);
  });

  it("starves and shrinks when food runs out", () => {
    let s = foundAt(["MMMMM", "MMMMM", "MM,MM", "MMMMM", "MMMMM"], 2, 2);
    s.cities[0]!.size = 3;
    s.cities[0]!.food = 0;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.size).toBe(2);
  });

  it("builds units and keeps building the same thing", () => {
    let s = foundAt(GRASS);
    s.cities[0]!.shields = UNIT_TYPES.warriors.cost - 1;
    s = apply(s, { type: "endTurn" });
    expect(s.units.filter((u) => u.type === "warriors")).toHaveLength(1);
    expect(s.units[0]!.homeCity).toBe(s.cities[0]!.id);
    expect(s.cities[0]!.production).toEqual({ kind: "unit", id: "warriors" });
  });

  it("makes the city smaller when it completes a settler", () => {
    let s = foundAt(GRASS);
    s = apply(s, { type: "setProduction", cityId: s.cities[0]!.id, item: { kind: "unit", id: "settlers" } });
    s.cities[0]!.size = 2;
    s.cities[0]!.shields = UNIT_TYPES.settlers.cost;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.size).toBe(1);
    expect(s.units.filter((u) => u.type === "settlers")).toHaveLength(1);
  });

  it("holds a finished settler until the city has two citizens", () => {
    let s = foundAt(GRASS);
    s = apply(s, { type: "setProduction", cityId: s.cities[0]!.id, item: { kind: "unit", id: "settlers" } });
    s.cities[0]!.shields = UNIT_TYPES.settlers.cost;
    s.cities[0]!.food = 0;
    const result = applyCommand(s, { type: "endTurn" });
    expect(result.ok && result.events.some((e) => e.type === "cityNeedsSize")).toBe(true);
    expect(result.ok && result.state.units).toHaveLength(0);
    expect(result.ok && result.state.cities[0]!.shields).toBe(UNIT_TYPES.settlers.cost);
  });

  it("charges food upkeep for settlers", () => {
    const s = foundAt(GRASS);
    const before = cityReport(s, s.cities[0]!).foodUpkeep;
    const settler = addUnit(s, "settlers", 0, 0);
    settler.homeCity = s.cities[0]!.id;
    expect(cityReport(s, s.cities[0]!).foodUpkeep).toBe(before + UNIT_TYPES.settlers.foodUpkeep);
  });

  it("keeps half the food after growth with a granary", () => {
    let s = foundAt(GRASS);
    const city = s.cities[0]!;
    city.buildings.push("granary");
    city.food = growthThreshold(1) - 1;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.size).toBe(2);
    expect(s.cities[0]!.food).toBe(Math.floor(growthThreshold(1) * BUILDINGS.granary.effects.keepFoodOnGrowth!));
  });

  it("switches to a defender after a building and refuses to build it twice", () => {
    let s = foundAt(GRASS);
    s.players[0]!.techs.push("pottery");
    s.players[0]!.gold = 100;
    const id = s.cities[0]!.id;
    s = apply(s, { type: "setProduction", cityId: id, item: { kind: "building", id: "granary" } });
    s.cities[0]!.shields = BUILDINGS.granary.cost;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.buildings).toEqual(["palace", "granary"]);
    expect(s.cities[0]!.production).toEqual({ kind: "unit", id: "warriors" });
    expect(applyCommand(s, { type: "setProduction", cityId: id, item: { kind: "building", id: "granary" } })).toEqual({
      ok: false,
      error: "invalidProduction",
    });
  });

  it("never lets two cities work the same tile", () => {
    let s = foundAt(GRASS, 1, 2);
    const settler = addUnit(s, "settlers", 4, 2);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    for (const c of s.cities) c.size = 6;
    for (let i = 0; i < 2; i++) s = apply(s, { type: "endTurn" });
    const all = s.cities.flatMap((c) => c.worked);
    expect(new Set(all).size).toBe(all.length);
  });
});
