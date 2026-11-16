import { describe, expect, it } from "vitest";
import { apply, mainContinent, newGame, playerView, UNIT_TYPES, type GameState } from "../src/core";
import { decide, playComputerTurns, playTurn } from "../src/ai";
import { isLand, landmasses } from "../src/ai/knowledge";
import { averageKnownValue, bestSite, siteValue } from "../src/ai/settle";
import { total, warMotivation } from "../src/ai/war";

/** A game where every seat is played by the AI, run until the given turn. */
function aiGame(seed: string, turns: number): GameState {
  let s = newGame({ seed, playerCount: 4, opponentUnits: true });
  s.players[0]!.isHuman = false;
  while (s.turn <= turns) s = playTurn(s).state;
  return s;
}

describe("computer players", () => {
  it("found a capital and keep defenders in it", () => {
    let s = newGame({ seed: "ai-1", playerCount: 4, opponentUnits: true });
    for (let turn = 0; turn < 20; turn++) {
      s = apply(s, { type: "endTurn" });
      s = playComputerTurns(s).state;
    }
    for (const p of s.players.slice(1)) {
      const capital = s.cities.find((c) => c.owner === p.id && c.buildings.includes("palace"));
      expect(capital, `player ${p.id}`).toBeDefined();
      const defenders = s.units.filter((u) => u.owner === p.id && u.x === capital!.x && u.y === capital!.y && UNIT_TYPES[u.type].attack > 0);
      expect(defenders.length, `player ${p.id}`).toBeGreaterThanOrEqual(1);
    }
  });

  it("spread out over the continent and keep researching", { timeout: 30000 }, () => {
    for (const seed of ["spread-1", "spread-2"]) {
      const s = aiGame(seed, 60);
      for (const p of s.players) {
        const cities = s.cities.filter((c) => c.owner === p.id).length;
        expect(cities, `${seed} player ${p.id}`).toBeGreaterThanOrEqual(2);
        expect(p.techs.length, `${seed} player ${p.id}`).toBeGreaterThanOrEqual(3);
      }
      const total = s.cities.length;
      expect(total, seed).toBeGreaterThanOrEqual(16);
    }
  });

  it("carries settlers to islands once the continent is full", { timeout: 60000 }, () => {
    let islandCities = 0;
    for (const seed of ["isle-1/13111111", "isle-2/13111111", "isle-3/13111111"]) {
      const s = aiGame(seed, 110);
      const main = mainContinent(s.map);
      islandCities += s.cities.filter((c) => !main.has(c.y * s.map.width + c.x)).length;
    }
    expect(islandCities).toBeGreaterThan(0);
  });

  it("decides from the player's view alone", () => {
    const s = newGame({ seed: "view", playerCount: 4, opponentUnits: true });
    const view = playerView(s, 1);
    // The settler founds the capital on its first turn when the spot is fine.
    const commands = decide(view);
    expect(commands.some((c) => c.type === "foundCity" || c.type === "goto")).toBe(true);
  });
});

describe("war", () => {
  it("goes to war with a stronger army and attacks only with a good chance", { timeout: 120000 }, () => {
    let wars = 0;
    let captured = 0;
    const chances: number[] = [];
    for (const seed of ["war-1", "war-2", "war-3", "war-4"]) {
      let s = newGame({ seed, playerCount: 4, opponentUnits: true });
      s.players[0]!.isHuman = false;
      while (s.turn <= 110) {
        const played = playTurn(s);
        for (const e of played.events) {
          if (e.type === "warDeclared") {
            wars++;
            // Nobody rushes into war in the first turns.
            expect(s.turn).toBeGreaterThanOrEqual(30);
          }
          if (e.type === "cityCaptured" || e.type === "cityDestroyed") captured++;
          if (e.type === "combat") chances.push(e.winChance);
        }
        s = played.state;
      }
    }
    expect(wars).toBeGreaterThan(0);
    expect(captured).toBeGreaterThan(0);
    expect(Math.min(...chances)).toBeGreaterThanOrEqual(0.44);
  });

  it("does not think of war early in the game", () => {
    const s = newGame({ seed: "calm", playerCount: 4, opponentUnits: true });
    const view = playerView(s, 1);
    const reasons = warMotivation(view, view.rivals[0]!, landmasses(view), 3);
    expect(total(reasons)).toBeLessThan(0);
    expect(reasons.map((r) => r.item)).toContain("early game");
  });
});

describe("city sites", () => {
  it("never picks a tile next to a city or a tile it has not seen", () => {
    const s = aiGame("sites", 30);
    const view = playerView(s, 1);
    const land = landmasses(view);
    const average = averageKnownValue(view);
    for (const c of view.cities) {
      expect(siteValue(view, c.y * view.width + c.x + 1, [], average)).toBe(-Infinity);
    }
    const settler = view.units.find((u) => u.type === "settlers");
    if (settler) {
      const best = bestSite(view, settler, land, average);
      if (best) expect(isLand(view, best.i)).toBe(true);
    }
  });
});
