/**
 * The plan of the children's guide: for the way to win the player chose,
 * stages with tasks and a target turn (data/coach.json). It reads only the
 * player's view, so it knows exactly what the player could see on screen.
 */
import coachData from "./data/coach.json";
import { BUILDINGS, gameTurn, UNIT_TYPES, type BuildingId, type TechId } from "./rules";
import type { PlayerView } from "./view";

export const VICTORY_PATHS = ["conquest", "space", "score"] as const;
export type VictoryPath = (typeof VICTORY_PATHS)[number];

export type CoachTask =
  | { kind: "cities" | "techs" | "attackers" | "captured" | "defeated" | "wonders" | "citizens"; n: number }
  | { kind: "rank"; n: number }
  | { kind: "knows"; tech: TechId }
  | { kind: "building"; building: BuildingId; n: number }
  | { kind: "everyBig"; building: BuildingId; minSize: number }
  | { kind: "government" | "apollo" | "launched" | "conquest" };

export interface CoachStage {
  id: string;
  /** Turn by which the stage should be done. */
  by: number;
  tasks: CoachTask[];
}

const DATA = coachData as unknown as { paths: Record<VictoryPath, CoachStage[]>; tightTurns: number };

export function coachPlan(path: VictoryPath): CoachStage[] {
  return DATA.paths[path];
}

export interface TaskProgress {
  task: CoachTask;
  /** How far the player is, and how far the task asks; 1 of 1 for yes-or-no tasks. */
  have: number;
  need: number;
  done: boolean;
}

export interface StageProgress {
  stage: CoachStage;
  index: number;
  tasks: TaskProgress[];
  done: boolean;
  /** "ok" while there is time, "tight" in the last turns before the target, "late" after it. */
  pace: "ok" | "tight" | "late";
}

/** Place of the player on the leaderboard among the nations they know (1 = first). */
export function leaderboardRank(view: PlayerView): number {
  const mine = view.score.total;
  return 1 + view.rivals.filter((r) => r.score !== null && r.score > mine).length;
}

function isAttacker(type: keyof typeof UNIT_TYPES): boolean {
  const u = UNIT_TYPES[type];
  return u.domain === "land" && u.attack >= 2 && u.attack >= u.defense && !u.special;
}

export function taskProgress(view: PlayerView, task: CoachTask): TaskProgress {
  const count = (have: number, need: number): TaskProgress => ({ task, have: Math.min(have, need), need, done: have >= need });
  const yes = (ok: boolean): TaskProgress => ({ task, have: ok ? 1 : 0, need: 1, done: ok });
  switch (task.kind) {
    case "cities":
      return count(view.cities.length, task.n);
    case "techs":
      return count(view.economy.techs.length, task.n);
    case "citizens":
      return count(
        view.cities.reduce((n, c) => n + c.size, 0),
        task.n,
      );
    case "attackers":
      return count(view.units.filter((u) => isAttacker(u.type)).length, task.n);
    case "captured":
      return count(view.economy.captured, task.n);
    case "defeated":
      return count(view.rivals.filter((r) => r.defeated && !r.barbarian).length, task.n);
    case "wonders":
      return count(view.cities.reduce((n, c) => n + c.buildings.filter((b) => BUILDINGS[b].wonder).length, 0), task.n);
    case "rank": {
      const rank = leaderboardRank(view);
      return { task, have: rank, need: task.n, done: rank <= task.n };
    }
    case "knows":
      return yes(view.economy.techs.includes(task.tech));
    case "building":
      return count(view.cities.filter((c) => c.buildings.includes(task.building)).length, task.n);
    case "everyBig": {
      const big = view.cities.filter((c) => c.size >= task.minSize);
      const with_ = big.filter((c) => c.buildings.includes(task.building)).length;
      // With no big city yet there is nothing to do; the task waits until one grows.
      return { task, have: with_, need: big.length, done: big.length > 0 && with_ === big.length };
    }
    case "government":
      return yes(view.economy.government !== "despotism" && view.economy.government !== "anarchy");
    case "apollo":
      return yes(view.builtWonders.includes("apolloProgram"));
    case "launched":
      return yes(view.economy.spaceship.launchedTurn !== null);
    case "conquest":
      return yes(view.victory?.kind === "conquest" && view.victory.player === view.playerId);
  }
}

/** Every stage of the plan with its progress. */
export function planProgress(view: PlayerView, path: VictoryPath): StageProgress[] {
  // The target turns are written for the normal game; a quick game moves them to the same point.
  return coachPlan(path).map((planned, index) => {
    const stage = { ...planned, by: gameTurn(view, planned.by) };
    const tasks = stage.tasks.map((t) => taskProgress(view, t));
    const done = tasks.every((t) => t.done);
    const pace = done || view.turn < stage.by - gameTurn(view, DATA.tightTurns) ? "ok" : view.turn <= stage.by ? "tight" : "late";
    return { stage, index, tasks, done, pace };
  });
}

/** The stage the player works on now: the first one not done, or the last one when all are done. */
export function currentStage(view: PlayerView, path: VictoryPath): StageProgress {
  const all = planProgress(view, path);
  return all.find((s) => !s.done) ?? all[all.length - 1]!;
}
