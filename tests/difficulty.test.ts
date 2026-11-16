import { describe, expect, it } from "vitest";
import { apply, cityReport, migrateState, newGame, playerView, RULES, type GameState } from "../src/core";
import { decide } from "../src/ai";
import { addUnit, stateFromAscii } from "./helpers";

/** Player 0 is a person, player 1 a computer player; each has a city on the same land. */
function twoCities(difficulty: GameState["difficulty"]): GameState {
  let s = stateFromAscii(["fffffff", ".......", "fffffff"], 2);
  s.difficulty = difficulty;
  s.players[1]!.isHuman = false;
  const a = addUnit(s, "settlers", 1, 1);
  s = apply(s, { type: "foundCity", unitId: a.id });
  const b = addUnit(s, "settlers", 5, 1, 1);
  s.currentPlayer = 1;
  s = apply(s, { type: "foundCity", unitId: b.id });
  s.currentPlayer = 0;
  for (const c of s.cities) c.size = 3;
  s = apply(s, { type: "autoAssignWorkers", cityId: s.cities[0]!.id });
  s.currentPlayer = 1;
  s = apply(s, { type: "autoAssignWorkers", cityId: s.cities[1]!.id });
  s.currentPlayer = 0;
  return s;
}

describe("difficulty", () => {
  it("gives computer players more food and shields on the hard levels only", () => {
    const normal = twoCities("normal");
    const hard = twoCities("veryHard");
    const yieldOf = (s: GameState, k: number) => cityReport(s, s.cities[k]!).production;
    // The person's city is the same on every level.
    expect(yieldOf(hard, 0)).toEqual(yieldOf(normal, 0));
    const pct = RULES.difficulty.levels.veryHard;
    expect(yieldOf(hard, 1).food).toBe(Math.floor((yieldOf(normal, 1).food * (100 + pct.foodPct)) / 100));
    expect(yieldOf(hard, 1).shields).toBe(Math.floor((yieldOf(normal, 1).shields * (100 + pct.shieldsPct)) / 100));
  });

  it("gives computer players extra starting units on the hardest level", () => {
    const normal = newGame({ seed: "d-1", playerCount: 3, opponentUnits: true });
    const hard = newGame({ seed: "d-1", playerCount: 3, opponentUnits: true, difficulty: "veryHard" });
    const count = (s: GameState, p: number) => s.units.filter((u) => u.owner === p).length;
    expect(count(hard, 0)).toBe(count(normal, 0));
    expect(count(hard, 1)).toBe(count(normal, 1) + RULES.difficulty.levels.veryHard.extraUnits.length);
    expect(hard.difficulty).toBe("veryHard");
  });

  it("keeps computer players from starting wars on the easiest level", () => {
    const s = twoCities("normal");
    s.turn = 80;
    s.players[0]!.contacts = [1];
    s.players[1]!.contacts = [0];
    s.players[1]!.explored = s.players[1]!.explored.map(() => 1);
    // A big army next door makes a war of choice tempting.
    for (let k = 0; k < 6; k++) addUnit(s, "catapult", 5, 1, 1);
    s.currentPlayer = 1;
    const wants = (level: GameState["difficulty"]) => decide(playerView({ ...s, difficulty: level }, 1)).some((c) => c.type === "declareWar");
    expect(wants("normal")).toBe(true);
    expect(wants("veryEasy")).toBe(false);
  });

  it("treats older games as normal", () => {
    const s = newGame({ seed: "d-2", playerCount: 2, opponentUnits: true });
    const old = JSON.parse(JSON.stringify(s)) as Record<string, unknown>;
    old.version = 15;
    delete old.difficulty;
    expect(migrateState(old)!.difficulty).toBe("normal");
  });
});
