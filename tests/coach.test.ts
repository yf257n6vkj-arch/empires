import { describe, expect, it } from "vitest";
import { apply, BUILDINGS, coachPlan, currentStage, leaderboardRank, planProgress, playerView, RULES, TECHS, VICTORY_PATHS, type GameState } from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

function withCity(): GameState {
  let s = stateFromAscii([".......", ".......", "......."], 2);
  const settler = addUnit(s, "settlers", 1, 1);
  s = apply(s, { type: "foundCity", unitId: settler.id });
  return s;
}

describe("guide plans", () => {
  it("name real buildings and technologies and end by the last turn", () => {
    for (const path of VICTORY_PATHS) {
      const plan = coachPlan(path);
      expect(plan.length).toBeGreaterThanOrEqual(4);
      let last = 0;
      for (const stage of plan) {
        expect(stage.by).toBeGreaterThan(last);
        last = stage.by;
        for (const task of stage.tasks) {
          if ("building" in task) expect(BUILDINGS[task.building]).toBeDefined();
          if ("tech" in task) expect(TECHS[task.tech]).toBeDefined();
        }
      }
      expect(last).toBeLessThanOrEqual(RULES.maxTurns);
    }
  });

  it("tick off tasks the player has done and say when the plan is late", () => {
    const s = withCity();
    s.players[0]!.techs.push("bronze");
    let stage = currentStage(playerView(s, 0), "conquest");
    expect(stage.index).toBe(0);
    const tasks = stage.tasks;
    expect(tasks.find((t) => t.task.kind === "knows")!.done).toBe(true);
    expect(tasks.find((t) => t.task.kind === "cities")).toMatchObject({ have: 1, need: 4, done: false });
    expect(stage.pace).toBe("ok");
    s.turn = stage.stage.by + 1;
    expect(currentStage(playerView(s, 0), "conquest").pace).toBe("late");
    s.turn = stage.stage.by - 2;
    expect(currentStage(playerView(s, 0), "conquest").pace).toBe("tight");
    // Three more cities finish the first stage.
    for (const x of [3, 5]) {
      let t = s;
      const u = addUnit(t, "settlers", x, x === 3 ? 0 : 2);
      t = apply(t, { type: "foundCity", unitId: u.id });
      Object.assign(s, t);
    }
    expect(planProgress(playerView(s, 0), "conquest")[0]!.tasks[0]!.have).toBe(3);
    stage = currentStage(playerView(s, 0), "conquest");
    expect(stage.index).toBe(0);
  });

  it("asks for a library only in cities that have grown", () => {
    const s = withCity();
    const task = () => planProgress(playerView(s, 0), "space")[1]!.tasks.find((t) => t.task.kind === "everyBig")!;
    expect(task().done).toBe(false);
    s.cities[0]!.size = 3;
    expect(task()).toMatchObject({ have: 0, need: 1 });
    s.cities[0]!.buildings.push("library");
    expect(task().done).toBe(true);
  });

  it("ranks the player among the nations they know", () => {
    const s = withCity();
    const u = addUnit(s, "settlers", 5, 1, 1);
    s.currentPlayer = 1;
    const t = apply(s, { type: "foundCity", unitId: u.id });
    t.currentPlayer = 0;
    t.cities.find((c) => c.owner === 1)!.size = 8;
    expect(leaderboardRank(playerView(t, 0))).toBe(1);
    t.players[0]!.contacts = [1];
    expect(leaderboardRank(playerView(t, 0))).toBe(2);
  });
});
