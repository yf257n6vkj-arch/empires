import { describe, expect, it } from "vitest";
import { apply, applyCommand, cityReport, productionOptions, RULES, type GameState } from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

function withCity(): GameState {
  let s = stateFromAscii(["hhhhh", "hh.hh", "hhhhh"]);
  const settler = addUnit(s, "settlers", 2, 1);
  s = apply(s, { type: "foundCity", unitId: settler.id });
  return s;
}

describe("earning gold instead of building", () => {
  it("is always on offer", () => {
    const s = withCity();
    expect(productionOptions(s, s.cities[0]!)).toContainEqual({ kind: "wealth" });
  });

  it("turns the city's shields into gold and keeps stored shields", () => {
    let s = withCity();
    s.cities[0]!.shields = 4;
    s = apply(s, { type: "setProduction", cityId: s.cities[0]!.id, item: { kind: "wealth" } });
    const r = cityReport(s, s.cities[0]!);
    expect(r.shieldSurplus).toBeGreaterThan(0);
    const before = s.players[0]!.gold;
    s = apply(s, { type: "endTurn" });
    expect(s.players[0]!.gold).toBe(before + r.gold + r.shieldSurplus * RULES.wealthGoldPerShield);
    expect(s.cities[0]!.shields).toBe(4);
    expect(s.cities[0]!.production).toEqual({ kind: "wealth" });
  });

  it("cannot be bought or planned, because it never ends", () => {
    let s = withCity();
    s = apply(s, { type: "setProduction", cityId: s.cities[0]!.id, item: { kind: "wealth" } });
    s.players[0]!.gold = 1000;
    expect(applyCommand(s, { type: "buy", cityId: s.cities[0]!.id })).toEqual({ ok: false, error: "alreadyComplete" });
    expect(applyCommand(s, { type: "setQueue", cityId: s.cities[0]!.id, queue: [{ kind: "wealth" }] })).toEqual({
      ok: false,
      error: "invalidProduction",
    });
  });
});
