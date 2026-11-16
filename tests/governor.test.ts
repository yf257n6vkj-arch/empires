import { describe, expect, it } from "vitest";
import { apply, applyCommand, cityTileYield, governorProduction, type GameState } from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

/** A city on a varied map, with a warrior inside and alphabet and writing known. */
function city(): GameState {
  let s = stateFromAscii(["~~~~~~~", "~ff.,h~", "~f...h~", "~,.,.d~", "~~~~~~~"]);
  const settler = addUnit(s, "settlers", 3, 2);
  s = apply(s, { type: "foundCity", unitId: settler.id });
  addUnit(s, "warriors", 3, 2);
  s.cities[0]!.size = 4;
  s.players[0]!.techs.push("alphabet", "writing", "bronze", "ceremonies", "pottery", "masonry");
  return s;
}

const tileSum = (s: GameState, key: "food" | "shields" | "trade") => s.cities[0]!.worked.reduce((n, i) => n + cityTileYield(s, s.cities[0]!, i)[key], 0);

describe("city governor", () => {
  it("places citizens for its goal", () => {
    const s = city();
    const production = apply(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "production" });
    const growth = apply(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "growth" });
    expect(tileSum(production, "shields")).toBeGreaterThan(tileSum(growth, "shields"));
    expect(tileSum(growth, "food")).toBeGreaterThan(tileSum(production, "food"));
    expect(production.cities[0]!.governor).toBe("production");
  });

  it("picks a building for its goal when nothing is planned", () => {
    const s = city();
    s.players[0]!.gold = 200;
    const science = apply(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "science" });
    expect(science.cities[0]!.production).toEqual({ kind: "building", id: "library" });
    const defense = apply(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "defense" });
    // Defense keeps two defenders first.
    expect(defense.cities[0]!.production.kind).toBe("unit");
  });

  it("builds a defender first in an empty city", () => {
    const s = city();
    s.units = s.units.filter((u) => u.type !== "warriors");
    expect(governorProduction(s, s.cities[0]!, "science").kind).toBe("unit");
  });

  it("skips buildings the treasury cannot keep up", () => {
    const s = city();
    s.players[0]!.gold = 0;
    s.players[0]!.scienceRate = 100;
    expect(governorProduction(s, s.cities[0]!, "science")).not.toEqual({ kind: "building", id: "library" });
  });

  it("leaves a planned queue alone and refuses unknown goals", () => {
    const s = city();
    s.cities[0]!.production = { kind: "unit", id: "warriors" };
    s.cities[0]!.queue = [{ kind: "building", id: "granary" }];
    const next = apply(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "gold" });
    expect(next.cities[0]!.production).toEqual({ kind: "unit", id: "warriors" });
    const bad = applyCommand(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "party" as never });
    expect(bad.ok).toBe(false);
  });

  it("chooses again after the city finishes something", () => {
    let s = city();
    s.players[0]!.gold = 200;
    s = apply(s, { type: "setGovernor", cityId: s.cities[0]!.id, goal: "science" });
    s.cities[0]!.production = { kind: "building", id: "temple" };
    s.cities[0]!.shields = 1000;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.buildings).toContain("temple");
    expect(s.cities[0]!.production).toEqual({ kind: "building", id: "library" });
  });
});
