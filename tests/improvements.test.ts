import { describe, expect, it } from "vitest";
import { apply, applyCommand, IMPROVEMENTS, tileYield } from "../src/core";
import { addUnit, stateFromAscii, unit } from "./helpers";

describe("settler improvements", () => {
  it("builds a road in two turns on grassland and adds trade", () => {
    let s = stateFromAscii(["...", "..."]);
    const settler = addUnit(s, "settlers", 1, 0);
    s = apply(s, { type: "buildImprovement", unitId: settler.id, improvement: "road" });
    expect(unit(s, settler.id).movesLeft).toBe(0);
    s = apply(s, { type: "endTurn" });
    expect(s.map.road[1]).toBe(0);
    s = apply(s, { type: "endTurn" });
    expect(s.map.road[1]).toBe(1);
    expect(unit(s, settler.id).work).toBeNull();
    expect(tileYield(s.map, 1, false).trade).toBe(1);
  });

  it("needs water next to the tile for irrigation", () => {
    const s = stateFromAscii(["~..."]);
    const near = addUnit(s, "settlers", 1, 0);
    const far = addUnit(s, "settlers", 3, 0);
    expect(applyCommand(s, { type: "buildImprovement", unitId: near.id, improvement: "irrigation" }).ok).toBe(true);
    expect(applyCommand(s, { type: "buildImprovement", unitId: far.id, improvement: "irrigation" })).toEqual({
      ok: false,
      error: "needsWater",
    });
  });

  it("refuses improvements the terrain does not allow", () => {
    const s = stateFromAscii(["f."]);
    const settler = addUnit(s, "settlers", 0, 0);
    expect(applyCommand(s, { type: "buildImprovement", unitId: settler.id, improvement: "mine" })).toEqual({
      ok: false,
      error: "terrainNotSuitable",
    });
  });

  it("replaces irrigation with a mine on hills", () => {
    let s = stateFromAscii(["h"]);
    s.map.irrigation[0] = 1;
    const settler = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "buildImprovement", unitId: settler.id, improvement: "mine" });
    for (let i = 0; i < (IMPROVEMENTS.mine.turns.hills ?? 0); i++) s = apply(s, { type: "endTurn" });
    expect(s.map.mine[0]).toBe(1);
    expect(s.map.irrigation[0]).toBe(0);
    expect(tileYield(s.map, 0, false).shields).toBe(3);
  });

  it("stops working when the settler moves away", () => {
    let s = stateFromAscii(["..."]);
    const settler = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "buildImprovement", unitId: settler.id, improvement: "road" });
    s = apply(s, { type: "endTurn" });
    expect(unit(s, settler.id).work).not.toBeNull();
    s = apply(s, { type: "cancelOrders", unitId: settler.id });
    s.units[0]!.movesLeft = 3;
    s = apply(s, { type: "move", unitId: settler.id, to: { x: 1, y: 0 } });
    s = apply(s, { type: "endTurn" });
    expect(s.map.road[0]).toBe(0);
  });
});
