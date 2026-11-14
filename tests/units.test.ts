import { describe, expect, it } from "vitest";
import { applyCommand, apply, findPath, RULES } from "../src/core";
import { addUnit, stateFromAscii, unit } from "./helpers";

const F = RULES.movesFraction;

describe("moving units", () => {
  it("spends the terrain cost and reveals tiles around", () => {
    const s = stateFromAscii(["....", "....", "...."]);
    s.players[0]!.explored.fill(0);
    const w = addUnit(s, "warriors", 0, 0);
    const next = apply(s, { type: "move", unitId: w.id, to: { x: 1, y: 1 } });
    expect(unit(next, w.id)).toMatchObject({ x: 1, y: 1, movesLeft: 0 });
    expect(next.players[0]!.explored.slice(0, 3)).toEqual([1, 1, 1]);
    expect(next.players[0]!.explored[3]).toBe(0);
  });

  it("refuses moves into the sea and non-adjacent tiles", () => {
    const s = stateFromAscii(["..~", "..."]);
    const w = addUnit(s, "warriors", 1, 0);
    expect(applyCommand(s, { type: "move", unitId: w.id, to: { x: 2, y: 0 } })).toEqual({ ok: false, error: "cannotEnter" });
    expect(applyCommand(s, { type: "move", unitId: w.id, to: { x: 1, y: 2 } })).toMatchObject({ ok: false });
    expect(applyCommand(s, { type: "move", unitId: w.id, to: { x: 0, y: 0 } }).ok).toBe(true);
  });

  it("lets a unit with full movement enter mountains, ending its move", () => {
    const s = stateFromAscii([".M"]);
    const w = addUnit(s, "warriors", 0, 0);
    const next = apply(s, { type: "move", unitId: w.id, to: { x: 1, y: 0 } });
    expect(unit(next, w.id)).toMatchObject({ x: 1, movesLeft: 0 });
  });

  it("moves three tiles per turn along a road", () => {
    const s = stateFromAscii(["....."]);
    s.map.road.fill(1);
    const w = addUnit(s, "warriors", 0, 0);
    let next = s;
    for (let x = 1; x <= 3; x++) next = apply(next, { type: "move", unitId: w.id, to: { x, y: 0 } });
    expect(unit(next, w.id).movesLeft).toBe(0);
    expect(applyCommand(next, { type: "move", unitId: w.id, to: { x: 4, y: 0 } })).toEqual({ ok: false, error: "noMovesLeft" });
  });

  it("does not let a unit with partial movement climb into forest", () => {
    const s = stateFromAscii(["..f"]);
    s.map.road[0] = 1;
    s.map.road[1] = 1;
    const w = addUnit(s, "warriors", 0, 0);
    const next = apply(s, { type: "move", unitId: w.id, to: { x: 1, y: 0 } });
    expect(unit(next, w.id).movesLeft).toBe(F - RULES.roadMoveCost);
    expect(applyCommand(next, { type: "move", unitId: w.id, to: { x: 2, y: 0 } })).toEqual({ ok: false, error: "notEnoughMoves" });
  });

  it("refuses to move another player's unit", () => {
    const s = stateFromAscii(["..."], 2);
    const w = addUnit(s, "warriors", 0, 0, 1);
    expect(applyCommand(s, { type: "move", unitId: w.id, to: { x: 1, y: 0 } })).toEqual({ ok: false, error: "notYourUnit" });
  });

  it("restores movement at the start of the next turn", () => {
    const s = stateFromAscii(["..."]);
    const w = addUnit(s, "warriors", 0, 0);
    const moved = apply(s, { type: "move", unitId: w.id, to: { x: 1, y: 0 } });
    const next = apply(moved, { type: "endTurn" });
    expect(next.turn).toBe(2);
    expect(unit(next, w.id).movesLeft).toBe(F);
  });
});

describe("path finding and goto", () => {
  it("goes around the sea", () => {
    const s = stateFromAscii([".~.", ".~.", "..."]);
    const path = findPath(s, 0, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path).not.toBeNull();
    expect(path!.at(-1)).toEqual({ x: 2, y: 0 });
    expect(path!.some((p) => p.x === 1 && p.y < 2)).toBe(false);
  });

  it("plans into unexplored land without peeking at its terrain", () => {
    const s = stateFromAscii(["..~.."]);
    s.players[0]!.explored = [1, 1, 0, 1, 1];
    // Tile 2 is really sea, but the player does not know it yet.
    expect(findPath(s, 0, { x: 0, y: 0 }, { x: 4, y: 0 })).toEqual([
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 },
    ]);
  });

  it("stops a goto when the unknown tile turns out to be sea", () => {
    const s = stateFromAscii(["..~.."]);
    s.players[0]!.explored = [1, 1, 0, 1, 1];
    const w = addUnit(s, "warriors", 0, 0);
    let next = apply(s, { type: "goto", unitId: w.id, to: { x: 4, y: 0 } });
    expect(unit(next, w.id)).toMatchObject({ x: 1, goto: { x: 4, y: 0 } });
    expect(next.players[0]!.explored[2]).toBe(1);
    const result = applyCommand(next, { type: "endTurn" });
    expect(result.ok && result.events.some((e) => e.type === "gotoBlocked")).toBe(true);
    next = result.ok ? result.state : next;
    expect(unit(next, w.id)).toMatchObject({ x: 1, goto: null });
  });

  it("prefers roads", () => {
    const s = stateFromAscii([".....", "....."]);
    for (const i of [0, 4, 5, 6, 7, 8, 9]) s.map.road[i] = 1;
    const path = findPath(s, 0, { x: 0, y: 0 }, { x: 4, y: 0 })!;
    expect(path.map((p) => p.y)).toEqual([1, 1, 1, 0]);
  });

  it("continues a goto order over several turns", () => {
    const s = stateFromAscii(["......"]);
    const w = addUnit(s, "warriors", 0, 0);
    let next = apply(s, { type: "goto", unitId: w.id, to: { x: 4, y: 0 } });
    expect(unit(next, w.id)).toMatchObject({ x: 1, goto: { x: 4, y: 0 } });
    for (let i = 0; i < 3; i++) next = apply(next, { type: "endTurn" });
    expect(unit(next, w.id)).toMatchObject({ x: 4, goto: null });
  });
});
