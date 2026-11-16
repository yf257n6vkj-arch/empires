import { describe, expect, it } from "vitest";
import { apply, applyCommand, playerView, RULES, scoreOf, type GameState } from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

/** Two nations at war, each with one city. */
function twoNations(): GameState {
  let s = stateFromAscii([".......", ".......", "......."], 2);
  const a = addUnit(s, "settlers", 1, 1);
  s = apply(s, { type: "foundCity", unitId: a.id });
  const b = addUnit(s, "settlers", 5, 1, 1);
  s.currentPlayer = 1;
  s = apply(s, { type: "foundCity", unitId: b.id });
  s.currentPlayer = 0;
  s.players[0]!.contacts = [1];
  s.players[1]!.contacts = [0];
  s.players[0]!.atWar = [1];
  s.players[1]!.atWar = [0];
  s.players[0]!.researching = "alphabet";
  return s;
}

describe("score", () => {
  it("counts citizens, happy citizens, technologies and wonders", () => {
    const s = twoNations();
    s.cities[0]!.size = 3;
    s.cities[0]!.buildings.push("pyramids");
    s.players[0]!.techs = ["alphabet", "bronze"];
    const score = scoreOf(s, 0);
    expect(score.citizens).toBe(3 * RULES.score.citizen);
    expect(score.techs).toBe(2 * RULES.score.tech);
    expect(score.wonders).toBe(RULES.score.wonder);
    expect(score.total).toBe(score.citizens + score.happy + score.techs + score.wonders);
  });

  it("is known for nations the player has met", () => {
    const s = twoNations();
    expect(playerView(s, 0).rivals[0]!.score).toBe(scoreOf(s, 1).total);
    s.players[0]!.contacts = [];
    expect(playerView(s, 0).rivals[0]!.score).toBeNull();
  });

  it("gives the win to the last nation standing", () => {
    let s = twoNations();
    const unit = addUnit(s, "horsemen", 4, 1);
    const r = applyCommand(s, { type: "move", unitId: unit.id, to: { x: 5, y: 1 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    s = r.state;
    expect(s.players[1]!.defeated).toBe(true);
    expect(s.players[0]!.captured).toBe(1);
    expect(s.victory).toMatchObject({ player: 0, kind: "conquest" });
    expect(r.events).toContainEqual({ type: "gameWon", player: 0, kind: "conquest" });
  });

  it("gives the win to the highest score after the last turn", () => {
    let s = twoNations();
    s.cities[1]!.size = 5;
    s.turn = RULES.maxTurns;
    s = apply(s, { type: "endTurn" });
    expect(s.victory).toBeNull();
    s = apply(s, { type: "endTurn" });
    expect(s.victory).toMatchObject({ player: 1, kind: "score", turn: RULES.maxTurns });
  });
});
