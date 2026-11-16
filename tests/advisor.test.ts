import { describe, expect, it } from "vitest";
import { advise, apply, suggestTech, type GameState } from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

const kinds = (s: GameState) => advise(s, 0).map((a) => a.kind);

function withCity(): GameState {
  let s = stateFromAscii([".....", ".....", "....."]);
  const settler = addUnit(s, "settlers", 2, 1);
  s = apply(s, { type: "foundCity", unitId: settler.id });
  return s;
}

describe("advisor", () => {
  it("first asks for a city", () => {
    const s = stateFromAscii(["....."]);
    addUnit(s, "settlers", 2, 0);
    expect(kinds(s)[0]).toBe("foundFirstCity");
  });

  it("asks to choose research when nothing is being researched", () => {
    const s = withCity();
    s.players[0]!.researching = null;
    expect(kinds(s)).toContain("chooseResearch");
  });

  it("wants a defender in an empty city unless one is on the way", () => {
    const s = withCity();
    s.cities[0]!.production = { kind: "unit", id: "settlers" };
    expect(kinds(s)).toContain("defendCity");
    s.cities[0]!.production = { kind: "unit", id: "warriors" };
    expect(kinds(s)).not.toContain("defendCity");
  });

  it("points to a settler without work once there is a city", () => {
    const s = withCity();
    addUnit(s, "settlers", 0, 0);
    expect(kinds(s)).toContain("idleSettler");
  });

  it("warns before the treasury runs dry", () => {
    const s = withCity();
    s.players[0]!.techs.push("ceremonies");
    s.cities[0]!.buildings.push("temple");
    s.players[0]!.gold = 0;
    s.players[0]!.scienceRate = 100;
    expect(kinds(s)).toContain("goldRunningOut");
  });

  it("says all is well when there is nothing to do", () => {
    const s = withCity();
    s.players[0]!.researching = "alphabet";
    s.cities[0]!.production = { kind: "unit", id: "warriors" };
    expect(kinds(s)).toEqual(["allDone"]);
  });

  it("suggests a technology and says what it leads to", () => {
    const s = withCity();
    s.players[0]!.researching = null;
    const tip = advise(s, 0).find((a) => a.kind === "chooseResearch");
    expect(tip && tip.kind === "chooseResearch" && tip.tech).toBe("bronze");
    s.players[0]!.techs.push("bronze", "alphabet", "ceremonies", "pottery");
    // Writing needs only the alphabet; code of laws comes next, monarchy needs both.
    expect(suggestTech(s, 0).tech).toBe("writing");
    s.players[0]!.techs.push("writing", "codeOfLaws");
    expect(suggestTech(s, 0)).toEqual({ tech: "monarchy", leadsTo: null });
  });

  it("warns about enemies near a city and points to easy attacks", () => {
    let s = stateFromAscii([".......", ".......", "......."], 2);
    const settler = addUnit(s, "settlers", 1, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.players[0]!.researching = "alphabet";
    const enemy = addUnit(s, "warriors", 3, 1, 1);
    expect(kinds(s)).not.toContain("enemyNearCity");
    s.players[0]!.contacts = [1];
    s.players[1]!.contacts = [0];
    s.players[0]!.atWar = [1];
    s.players[1]!.atWar = [0];
    expect(kinds(s)).toContain("enemyNearCity");
    addUnit(s, "swordsmen", 2, 1);
    const tips = advise(s, 0);
    const attack = tips.find((a) => a.kind === "goodAttack");
    expect(attack && attack.kind === "goodAttack" && attack.chancePct).toBeGreaterThanOrEqual(70);
    enemy.hp = 10;
    expect(kinds(s)).toContain("goodAttack");
  });

  it("suggests leaving despotism once monarchy is known", () => {
    const s = withCity();
    s.players[0]!.researching = "alphabet";
    expect(kinds(s)).not.toContain("revolution");
    s.players[0]!.techs.push("ceremonies", "alphabet", "codeOfLaws", "monarchy");
    expect(kinds(s)).toContain("revolution");
  });
});
