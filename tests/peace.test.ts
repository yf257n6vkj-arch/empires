import { describe, expect, it } from "vitest";
import { apply, applyCommand, playerView, RULES, treatyTurns, type GameState } from "../src/core";
import { decide } from "../src/ai";
import { peaceMood } from "../src/ai/diplomacy";
import { total } from "../src/ai/war";
import { caravanCommands, diplomatCommands } from "../src/ai/agents";
import { landmasses } from "../src/ai/knowledge";
import { addUnit, stateFromAscii } from "./helpers";

/** Two nations at war since turn 10, each with a city. */
function atWar(): GameState {
  let s = stateFromAscii([".............", ".............", "............."], 2);
  const a = addUnit(s, "settlers", 1, 1);
  s = apply(s, { type: "foundCity", unitId: a.id });
  const b = addUnit(s, "settlers", 11, 1, 1);
  s.currentPlayer = 1;
  s = apply(s, { type: "foundCity", unitId: b.id });
  s.currentPlayer = 0;
  s.turn = 10;
  s.players[1]!.isHuman = false;
  s.players[1]!.explored = s.players[1]!.explored.map(() => 1);
  s.players[0]!.contacts = [1];
  s.players[1]!.contacts = [0];
  s = apply(s, { type: "declareWar", player: 1 });
  s.players[0]!.researching = "alphabet";
  return s;
}

describe("peace", () => {
  it("is offered, answered on the other side's turn and ends the war", () => {
    let s = atWar();
    expect(s.players[1]!.warSince["0"]).toBe(10);
    s = apply(s, { type: "offerPeace", player: 1 });
    expect(s.players[1]!.peaceOffers).toEqual([0]);
    expect(applyCommand(s, { type: "offerPeace", player: 1 }).ok).toBe(false);
    s.currentPlayer = 1;
    s = apply(s, { type: "answerPeace", player: 0, accept: true });
    expect(s.players[0]!.atWar).toEqual([]);
    expect(s.players[1]!.atWar).toEqual([]);
    expect(s.players[0]!.peaceSince["1"]).toBe(10);
  });

  it("lets an unanswered offer lapse at the end of the receiver's turn", () => {
    let s = atWar();
    s = apply(s, { type: "offerPeace", player: 1 });
    s = apply(s, { type: "endTurn" });
    expect(s.currentPlayer).toBe(1);
    expect(s.players[1]!.peaceOffers).toEqual([0]);
    s = apply(s, { type: "endTurn" });
    expect(s.players[1]!.peaceOffers).toEqual([]);
  });

  it("counts a war declared too soon after peace as a broken treaty", () => {
    let s = atWar();
    s = apply(s, { type: "offerPeace", player: 1 });
    s.currentPlayer = 1;
    s = apply(s, { type: "answerPeace", player: 0, accept: true });
    s.currentPlayer = 0;
    s.turn += RULES.diplomacy.treatyTurns - 1;
    const r = applyCommand(s, { type: "declareWar", player: 1 });
    expect(r.ok && r.state.players[0]!.treatiesBroken).toBe(1);
    expect(r.ok && r.events).toContainEqual({ type: "warDeclared", by: 0, on: 1, brokeTreaty: true });
    s.turn += 1;
    const later = applyCommand(s, { type: "declareWar", player: 1 });
    expect(later.ok && later.state.players[0]!.treatiesBroken).toBe(0);
  });

  it("keeps a peace in a quick game for the same share of the game", () => {
    let s = atWar();
    s.speed = "quick";
    s = apply(s, { type: "offerPeace", player: 1 });
    s.currentPlayer = 1;
    s = apply(s, { type: "answerPeace", player: 0, accept: true });
    s.currentPlayer = 0;
    const turns = treatyTurns(s);
    expect(turns).toBe(Math.round((RULES.diplomacy.treatyTurns * RULES.speeds.quick.maxTurns) / RULES.speeds.normal.maxTurns));
    expect(turns).toBeLessThan(RULES.diplomacy.treatyTurns);
    s.turn += turns - 1;
    const soon = applyCommand(s, { type: "declareWar", player: 1 });
    expect(soon.ok && soon.state.players[0]!.treatiesBroken).toBe(1);
    s.turn += 1;
    const later = applyCommand(s, { type: "declareWar", player: 1 });
    expect(later.ok && later.state.players[0]!.treatiesBroken).toBe(0);
  });

  it("makes the computer keener on peace the longer and worse the war goes", () => {
    const s = atWar();
    s.currentPlayer = 1;
    const mood = () => total(peaceMood(playerView(s, 1), playerView(s, 1).rivals[0]!));
    s.turn = 12;
    const early = mood();
    s.turn = 40;
    const late = mood();
    expect(late).toBeGreaterThan(early);
    // An enemy army next to its city makes peace welcome.
    for (let k = 0; k < 3; k++) addUnit(s, "catapult", 10, 1);
    expect(mood()).toBeGreaterThan(late);
    // A nation that broke treaties is trusted less.
    s.players[0]!.treatiesBroken = 2;
    const distrust = mood();
    s.players[0]!.treatiesBroken = 0;
    expect(distrust).toBeLessThan(mood());
  });

  it("is answered by the computer and offered by it when the war drags on", () => {
    let s = atWar();
    s = apply(s, { type: "offerPeace", player: 1 });
    s.currentPlayer = 1;
    s.turn = 40;
    for (let k = 0; k < 3; k++) addUnit(s, "catapult", 10, 1);
    const answer = decide(playerView(s, 1)).find((c) => c.type === "answerPeace");
    expect(answer).toEqual({ type: "answerPeace", player: 0, accept: true });
    s.players[1]!.peaceOffers = [];
    expect(decide(playerView(s, 1))).toContainEqual({ type: "offerPeace", player: 0 });
  });

  it("refuses peace with barbarians", () => {
    const s = atWar();
    s.players[1]!.civ = "barbarians";
    expect(applyCommand(s, { type: "offerPeace", player: 1 })).toMatchObject({ ok: false, error: "noPeaceWithBarbarians" });
  });
});

describe("caravans and diplomats", () => {
  it("bring shields to a wonder and open embassies", () => {
    let s = atWar();
    s.players[0]!.atWar = [];
    s.players[1]!.atWar = [];
    s.players[0]!.techs.push("bronze", "trade", "writing");
    s.cities[0]!.production = { kind: "building", id: "colossus" };
    const caravan = addUnit(s, "caravan", 1, 1);
    caravan.homeCity = s.cities[0]!.id;
    const view = playerView(s, 0);
    expect(caravanCommands(view, view.units.find((u) => u.id === caravan.id)!, landmasses(view))).toEqual([{ type: "helpWonder", unitId: caravan.id }]);
    const diplomat = addUnit(s, "diplomat", 10, 1);
    const v2 = playerView(s, 0);
    expect(diplomatCommands(v2, v2.units.find((u) => u.id === diplomat.id)!, landmasses(v2))).toEqual([
      { type: "diplomat", unitId: diplomat.id, cityId: s.cities[1]!.id, action: "embassy" },
    ]);
  });
});

describe("foreign cities in the player view", () => {
  it("show only what is seen from outside until there is an embassy", () => {
    const s = atWar();
    const theirs = s.cities.find((c) => c.owner === 1)!;
    theirs.buildings.push("walls", "granary", "pyramids");
    theirs.production = { kind: "building", id: "temple" };
    s.players[0]!.explored = s.players[0]!.explored.map(() => 1);
    let seen = playerView(s, 0).foreignCities.find((c) => c.id === theirs.id)!;
    expect(seen.buildings).toEqual(expect.arrayContaining(["palace", "walls", "pyramids"]));
    expect(seen.buildings).not.toContain("granary");
    expect(seen.productionKnown).toBe(false);
    expect(seen.production).toEqual({ kind: "wealth" });
    s.players[0]!.embassies = [1];
    seen = playerView(s, 0).foreignCities.find((c) => c.id === theirs.id)!;
    expect(seen.buildings).toContain("granary");
    expect(seen.productionKnown).toBe(true);
    expect(seen.production).toEqual({ kind: "building", id: "temple" });
  });
});
