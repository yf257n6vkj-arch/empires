import { describe, expect, it } from "vitest";
import { apply, applyCommand, bestWorkerTask, cityReport, migrateState, STATE_VERSION, type GameState } from "../src/core";
import { addUnit, stateFromAscii, unit } from "./helpers";

function endTurns(s: GameState, n: number): GameState {
  for (let k = 0; k < n; k++) s = apply(s, { type: "endTurn" });
  return s;
}

function withCity(rows: string[], x: number, y: number): GameState {
  let s = stateFromAscii(rows);
  const settler = addUnit(s, "settlers", x, y);
  s = apply(s, { type: "foundCity", unitId: settler.id });
  return s;
}

describe("road along a route", () => {
  it("builds a road on every tile of the way and then stops", () => {
    let s = stateFromAscii([".....", "....."]);
    const settler = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "buildRoute", unitId: settler.id, to: { x: 4, y: 0 }, improvement: "road" });
    expect(unit(s, settler.id).work?.improvement).toBe("road");
    for (let k = 0; k < 40 && unit(s, settler.id).orders; k++) s = apply(s, { type: "endTurn" });
    expect(unit(s, settler.id).orders).toBeNull();
    expect(s.map.road.slice(0, 5)).toEqual([1, 1, 1, 1, 1]);
    expect(unit(s, settler.id)).toMatchObject({ x: 4, y: 0 });
  });

  it("leaves out tiles that already have a road", () => {
    let s = stateFromAscii(["...."]);
    s.map.road[1] = 1;
    s.map.road[2] = 1;
    const settler = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "buildRoute", unitId: settler.id, to: { x: 3, y: 0 }, improvement: "road" });
    // Two turns for the first tile, then it walks over the old road without stopping.
    s = endTurns(s, 2);
    expect(unit(s, settler.id)).toMatchObject({ x: 2, y: 0, work: null });
    s = endTurns(s, 1);
    expect(unit(s, settler.id)).toMatchObject({ x: 3, y: 0 });
    // Stepping off the road used up its moves, so it starts building next turn.
    s = endTurns(s, 1);
    expect(unit(s, settler.id).work?.improvement).toBe("road");
  });

  it("needs the technology for a railroad", () => {
    const s = stateFromAscii(["...."]);
    const settler = addUnit(s, "settlers", 0, 0);
    expect(applyCommand(s, { type: "buildRoute", unitId: settler.id, to: { x: 3, y: 0 }, improvement: "railroad" })).toEqual({
      ok: false,
      error: "needsTech",
    });
  });

  it("lays a road first where a railroad has none to stand on", () => {
    let s = stateFromAscii(["..."]);
    s.players[0]!.techs.push("railroad");
    const settler = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "buildRoute", unitId: settler.id, to: { x: 2, y: 0 }, improvement: "railroad" });
    expect(unit(s, settler.id).work?.improvement).toBe("road");
  });

  it("is only for units that build improvements", () => {
    const s = stateFromAscii(["...."]);
    const warrior = addUnit(s, "warriors", 0, 0);
    expect(applyCommand(s, { type: "buildRoute", unitId: warrior.id, to: { x: 3, y: 0 }, improvement: "road" }).ok).toBe(false);
    expect(applyCommand(s, { type: "automate", unitId: warrior.id }).ok).toBe(false);
  });

  it("ends when the player gives another order", () => {
    let s = stateFromAscii(["....."]);
    const settler = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "buildRoute", unitId: settler.id, to: { x: 4, y: 0 }, improvement: "road" });
    s = apply(s, { type: "cancelOrders", unitId: settler.id });
    expect(unit(s, settler.id)).toMatchObject({ orders: null, work: null });
  });
});

describe("automatic work around cities", () => {
  it("improves the land of the owner's city", () => {
    let s = withCity(["~....", ".....", "....."], 2, 1);
    const settler = addUnit(s, "settlers", 2, 1);
    s = apply(s, { type: "automate", unitId: settler.id });
    s = endTurns(s, 12);
    const improved = s.map.irrigation.reduce((n, v) => n + v, 0) + s.map.road.reduce((n, v) => n + v, 0) + s.map.mine.reduce((n, v) => n + v, 0);
    expect(improved).toBeGreaterThan(0);
    expect(unit(s, settler.id).orders?.kind).toBe("auto");
  });

  it("prefers the tiles the city works", () => {
    const s = withCity([".....", ".....", "....."], 2, 1);
    const settler = addUnit(s, "settlers", 2, 1);
    const task = bestWorkerTask(s, settler)!;
    expect(s.cities[0]!.worked).toContain(task.at.y * s.map.width + task.at.x);
  });

  it("sends two settlers to different tiles", () => {
    let s = withCity(["~....", ".....", "....."], 2, 1);
    const a = addUnit(s, "settlers", 2, 1);
    const b = addUnit(s, "settlers", 2, 1);
    s = apply(s, { type: "automate", unitId: a.id });
    s = apply(s, { type: "automate", unitId: b.id });
    const at = (id: number) => {
      const u = unit(s, id);
      return u.orders?.kind === "auto" ? `${u.orders.target?.x},${u.orders.target?.y}` : "";
    };
    expect(at(a.id)).not.toBe("");
    expect(at(a.id)).not.toBe(at(b.id));
  });

  it("does nothing without own cities", () => {
    const s = stateFromAscii(["....."]);
    const settler = addUnit(s, "settlers", 2, 0);
    expect(bestWorkerTask(s, settler)).toBeNull();
  });
});

describe("production queue", () => {
  it("moves on to the planned item when the current one is done", () => {
    let s = withCity([".....", ".....", "....."], 2, 1);
    const city = s.cities[0]!;
    s = apply(s, { type: "setQueue", cityId: city.id, queue: [{ kind: "unit", id: "settlers" }] });
    s.cities[0]!.shields = 100;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.production).toEqual({ kind: "unit", id: "settlers" });
    expect(s.cities[0]!.queue).toEqual([]);
  });

  it("keeps making the same unit when nothing is planned", () => {
    let s = withCity([".....", ".....", "....."], 2, 1);
    const before = s.cities[0]!.production;
    s.cities[0]!.shields = 100;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.production).toEqual(before);
  });

  it("refuses to plan a building twice or more items than fit", () => {
    const s = withCity([".....", ".....", "....."], 2, 1);
    s.players[0]!.techs.push("pottery");
    const city = s.cities[0]!;
    const granary = { kind: "building", id: "granary" } as const;
    expect(applyCommand(s, { type: "setQueue", cityId: city.id, queue: [granary, granary] })).toEqual({ ok: false, error: "invalidProduction" });
    const many = Array.from({ length: 9 }, () => ({ kind: "unit", id: "warriors" }) as const);
    expect(applyCommand(s, { type: "setQueue", cityId: city.id, queue: many })).toEqual({ ok: false, error: "queueFull" });
  });

  it("skips planned items the city can no longer build", () => {
    let s = withCity([".....", ".....", "....."], 2, 1);
    s.players[0]!.techs.push("pottery");
    s = apply(s, {
      type: "setQueue",
      cityId: s.cities[0]!.id,
      queue: [
        { kind: "building", id: "granary" },
        { kind: "unit", id: "settlers" },
      ],
    });
    // The granary appears some other way before its turn comes.
    s.cities[0]!.buildings.push("granary");
    s.cities[0]!.shields = 100;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.production).toEqual({ kind: "unit", id: "settlers" });
  });
});

describe("saves from version 7", () => {
  it("get empty queues and no standing orders", () => {
    const s = withCity([".....", "....."], 2, 1);
    addUnit(s, "settlers", 0, 0);
    const old = structuredClone(s) as unknown as Record<string, unknown> & { units: Record<string, unknown>[]; cities: Record<string, unknown>[] };
    old.version = 7;
    for (const u of old.units) delete u.orders;
    for (const c of old.cities) delete c.queue;
    const loaded = migrateState(old)!;
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.units.every((u) => u.orders === null)).toBe(true);
    expect(loaded.cities.every((c) => Array.isArray(c.queue) && c.queue.length === 0)).toBe(true);
  });
});

describe("automatic workers and hungry cities", () => {
  it("irrigate first around a city that has stopped growing", () => {
    let s = stateFromAscii(["~~~~~~~", "~,,h,,~", "~,,,,h~", "~,h,h,~", "~~~~~~~"]);
    const settler = addUnit(s, "settlers", 3, 2, 0);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.players[0]!.researching = "alphabet";
    const city = s.cities[0]!;
    const task = (size: number) => {
      const t = apply({ ...s, cities: [{ ...city, size }] }, { type: "autoAssignWorkers", cityId: city.id });
      return { food: cityReport(t, t.cities[0]!).foodSurplus, work: bestWorkerTask(t, addUnit(t, "settlers", 3, 2, 0))?.improvement };
    };
    expect(task(1)).toEqual({ food: 1, work: "mine" });
    expect(task(3).food).toBeLessThanOrEqual(0);
    expect(task(3).work).toBe("irrigation");
  });
});
