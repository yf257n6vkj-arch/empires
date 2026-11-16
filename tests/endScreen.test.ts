import { describe, expect, it } from "vitest";
import { firstLead, rulerTitle } from "../src/web/endScreen";

describe("end of the game", () => {
  it("finds the first turn the player led alone", () => {
    const history = [
      { turn: 1, score: [0, 0], cities: [], techs: [] },
      { turn: 2, score: [3, 3], cities: [], techs: [] },
      { turn: 3, score: [5, 4], cities: [], techs: [] },
    ];
    expect(firstLead(history, 0, [1])).toBe(3);
    expect(firstLead(history, 1, [0])).toBeNull();
  });

  it("gives a better title for a better game and at least a wise ruler for a win", () => {
    const order = [0.3, 0.6, 0.8, 1, 1.2, 1.6].map((share) => rulerTitle(false, false, share));
    expect(new Set(order).size).toBe(6);
    expect(rulerTitle(true, false, 0.4)).toBe(rulerTitle(false, false, 1));
    expect(rulerTitle(false, true, 2)).not.toBe(rulerTitle(false, false, 2));
  });
});
