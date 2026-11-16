import { describe, expect, it } from "vitest";
import { apply, newGame, UNIT_TYPES } from "../src/core";
import { playComputerTurns } from "../src/ai";

describe("computer players", () => {
  it("found a capital and keep defenders in it", () => {
    for (const seed of ["ai-1", "ai-2", "ai-3"]) {
      let s = newGame({ seed, playerCount: 4, opponentUnits: true });
      for (let turn = 0; turn < 30; turn++) {
        s = apply(s, { type: "endTurn" });
        s = playComputerTurns(s).state;
      }
      for (const p of s.players.slice(1)) {
        const cities = s.cities.filter((c) => c.owner === p.id);
        expect(cities.length, `${seed} player ${p.id}`).toBeGreaterThanOrEqual(1);
        const city = cities[0]!;
        const defenders = s.units.filter((u) => u.owner === p.id && u.x === city.x && u.y === city.y && UNIT_TYPES[u.type].attack > 0);
        expect(defenders.length, `${seed} player ${p.id}`).toBeGreaterThanOrEqual(2);
        expect(p.researching ?? p.techs.length).toBeTruthy();
      }
    }
  });
});
