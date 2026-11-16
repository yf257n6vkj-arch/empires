import { describe, expect, it } from "vitest";
import { apply, UNIT_TYPES } from "../src/core";
import { buildingGain, unitRole } from "../src/web/productionDetail";
import { addUnit, stateFromAscii } from "./helpers";

describe("production detail", () => {
  it("says what a building would add to the city now", () => {
    let s = stateFromAscii([".....", ".....", "....."]);
    const settler = addUnit(s, "settlers", 2, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.cities[0]!.size = 4;
    s.players[0]!.scienceRate = 100;
    // Roads bring trade, so there is science to multiply.
    s.map.road = s.map.road.map(() => 1);
    s.cities[0]!.worked = [0, 1, 3, 4];
    const gain = buildingGain(s, s.cities[0]!, "library");
    expect(gain.some((g) => g.includes("vědy"))).toBe(true);
    expect(buildingGain(s, s.cities[0]!, "walls")).toEqual([]);
  });

  it("tells defenders from attackers", () => {
    expect(unitRole(UNIT_TYPES.spearmen)).toContain("brání");
    expect(unitRole(UNIT_TYPES.catapult)).toContain("útok");
    expect(unitRole(UNIT_TYPES.settlers)).toContain("města");
  });
});
