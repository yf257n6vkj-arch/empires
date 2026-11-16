import { describe, expect, it } from "vitest";
import { coachPlan, VICTORY_PATHS } from "../src/core";
import { pathName, stageName, taskHint, taskLabel } from "../src/web/guide";

describe("children's guide", () => {
  it("has words for every task of every plan", () => {
    for (const path of VICTORY_PATHS) {
      expect(pathName(path)).not.toBe("");
      for (const stage of coachPlan(path)) {
        expect(stageName(path, stage.id)).not.toContain(stage.id);
        for (const task of stage.tasks) {
          expect(taskLabel(task).length).toBeGreaterThan(5);
          expect(taskHint(task).length).toBeGreaterThan(20);
          expect(taskLabel(task)).not.toContain("{");
        }
      }
    }
  });
});
