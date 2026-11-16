import { describe, expect, it } from "vitest";
import { apply, cityReport, inciteCost, playerView, UNIT_TYPES, type GameState } from "../src/core";
import { bribeSavings, guessBribe } from "../src/ai/agents";
import { landmasses } from "../src/ai/knowledge";
import { decide, playTurn } from "../src/ai";
import { seaInvasion } from "../src/ai/navy";
import { barbarianCityNearby } from "../src/ai";
import { cityDefense } from "../src/ai/war";
import { spacePart } from "../src/ai/space";
import { addUnit, stateFromAscii } from "./helpers";

function found(s: GameState, x: number, y: number, owner = 0): GameState {
  const settler = addUnit(s, "settlers", x, y, owner);
  const turn = s.currentPlayer;
  s.currentPlayer = owner;
  const next = apply(s, { type: "foundCity", unitId: settler.id });
  next.currentPlayer = turn;
  return next;
}

describe("a city that cannot grow", () => {
  it("works shields instead of extra food", () => {
    let s = stateFromAscii([".......", ".......", ".......", ".......", ".fffff.", "......."]);
    s = found(s, 3, 3);
    // Irrigated grassland feeds the city with plenty to spare.
    s.map.irrigation = s.map.terrain.map((t) => (t === "grassland" ? 1 : 0));
    const city = s.cities[0]!;
    s.players[0]!.researching = "alphabet";
    // Despotism would take the third food from irrigated grassland.
    s.players[0]!.government = "monarchy";
    // Grown to the limit without an aqueduct: food above what it eats is wasted.
    const capped = { ...s, cities: [{ ...city, size: 8 }] };
    expect(cityReport(capped, capped.cities[0]!).maxSize).toBe(8);
    // The same city with an aqueduct can still grow and keeps food coming.
    const growing = { ...s, cities: [{ ...city, size: 8, buildings: [...city.buildings, "aqueduct" as const] }] };
    expect(cityReport(growing, growing.cities[0]!).maxSize).toBeGreaterThan(8);
    const free = apply(growing, { type: "autoAssignWorkers", cityId: city.id });
    const full = apply(capped, { type: "autoAssignWorkers", cityId: city.id });
    const forests = (st: GameState) => st.cities[0]!.worked.filter((i) => st.map.terrain[i] === "forest").length;
    expect(forests(full)).toBeGreaterThan(forests(free));
    expect(cityReport(full, full.cities[0]!).foodSurplus).toBeGreaterThanOrEqual(0);
  });
});

describe("the computer players late in the game", () => {
  it("send several space builders after different parts in the same turn", () => {
    let s = stateFromAscii([".........", ".........", "........."]);
    s = found(s, 1, 1);
    s = found(s, 4, 1);
    s = found(s, 7, 1);
    s.players[0]!.isHuman = false;
    s.players[0]!.techs.push("spaceFlight", "plastics", "robotics");
    s.cities[0]!.buildings.push("apolloProgram");
    s.players[0]!.spaceship.structural = 2;
    const view = playerView(s, 0);
    const claims = { structural: 0, component: 0, module: 0 };
    const picks = view.cities.map((c) => spacePart(view, c, claims));
    const ids = picks.map((p) => (p && p.kind === "building" ? p.id : null));
    expect(new Set(ids).size).toBe(3);
    expect(ids).toEqual(expect.arrayContaining(["ssComponent", "ssModule"]));
  });

  it("go for a weakly held barbarian city next to their land first", () => {
    let s = stateFromAscii([".........", ".........", "........."], 3);
    s = found(s, 1, 1);
    s = found(s, 6, 1, 2);
    s.players[2]!.civ = "barbarians";
    s.players[0]!.atWar = [2];
    s.players[2]!.atWar = [0];
    const view = playerView(s, 0);
    const near = barbarianCityNearby(view, new Int32Array(27), 2);
    expect(near?.owner).toBe(2);
  });

  it("trust the garrison they see instead of guessing", () => {
    let s = stateFromAscii([".........", ".........", "........."], 2);
    s = found(s, 1, 1);
    s = found(s, 4, 1, 1);
    s.players[0]!.techs.push("bronze", "feudalism");
    const theirs = s.cities.find((c) => c.owner === 1)!;
    theirs.size = 6;
    addUnit(s, "warriors", 4, 1, 1);
    // Out of sight the AI assumes as many defenders as a city of this size usually has.
    const guessed = cityDefense(playerView(s, 0), theirs);
    // A scout next to the city sees the lone warrior.
    addUnit(s, "warriors", 3, 1, 0);
    const seen = cityDefense(playerView(s, 0), theirs);
    expect(seen).toBeLessThan(guessed);
    expect(seen).toBeLessThan(3);
  });

  it("does not break the turn of a computer player in the space race", () => {
    let s = stateFromAscii([".........", ".........", "........."]);
    s = found(s, 1, 1);
    s.players[0]!.isHuman = false;
    s.players[0]!.techs.push("spaceFlight");
    expect(() => decide(playerView(s, 0))).not.toThrow();
  });
});

describe("the computer diplomat", () => {
  /** A computer player and a barbarian city three tiles from its own. */
  function nearBarbarians(): GameState {
    let s = stateFromAscii(["..........", "..........", ".........."], 2);
    s = found(s, 1, 1);
    s = found(s, 5, 1, 1);
    s.players[1]!.civ = "barbarians";
    s.players[0]!.isHuman = false;
    s.players[0]!.atWar = [1];
    s.players[1]!.atWar = [0];
    s.players[0]!.techs.push("writing");
    const theirs = s.cities.find((c) => c.owner === 1)!;
    theirs.size = 3;
    // A town the barbarians took: no palace, and they keep no gold.
    theirs.buildings = theirs.buildings.filter((b) => b !== "palace");
    s.players[1]!.gold = 0;
    addUnit(s, "warriors", 5, 1, 1);
    return s;
  }

  it("guesses the bribe the way the game prices it when it knows everything that counts", () => {
    const s = nearBarbarians();
    addUnit(s, "diplomat", 4, 1, 0);
    const view = playerView(s, 0);
    const theirs = s.cities.find((c) => c.owner === 1)!;
    expect(view.bribePrices[theirs.id]).toBe(inciteCost(s, theirs));
    expect(guessBribe(view, view.foreignCities.find((c) => c.id === theirs.id)!)).toBe(inciteCost(s, theirs));
  });

  it("bribes a small barbarian city next to it when the treasury allows", () => {
    const s = nearBarbarians();
    const d = addUnit(s, "diplomat", 4, 1, 0);
    s.players[0]!.gold = 500;
    const commands = decide(playerView(s, 0));
    expect(commands).toContainEqual(expect.objectContaining({ type: "diplomat", unitId: d.id, action: "incite" }));
  });

  it("keeps gold for a bribe instead of buying buildings", () => {
    const s = nearBarbarians();
    s.players[0]!.gold = 250;
    const city = s.cities.find((c) => c.owner === 0)!;
    city.production = { kind: "building", id: "barracks" };
    city.shields = 5;
    const view = playerView(s, 0);
    expect(bribeSavings(view, landmasses(view))).toBeGreaterThan(0);
  });
});

describe("a landing across the sea", () => {
  it("brings the army over on a ship and takes the enemy city", () => {
    let s = stateFromAscii([
      "~~~~~~~~~~~~~",
      "~....~~~~...~",
      "~....~~~~...~",
      "~~~~~~~~~~~~~",
    ], 2);
    s = found(s, 3, 1);
    s = found(s, 10, 1, 1);
    s.players[0]!.isHuman = false;
    s.players[1]!.isHuman = true;
    s.players[0]!.techs.push("bronze", "horseback", "alphabet", "mapMaking", "navigation", "astronomy");
    s.players[0]!.contacts = [1];
    s.players[1]!.contacts = [0];
    s.players[0]!.atWar = [1];
    s.players[1]!.atWar = [0];
    s.players[0]!.warSince = { "1": 1 };
    s.players[1]!.warSince = { "0": 1 };
    s.players[0]!.explored = s.players[0]!.explored.map(() => 1);
    for (let i = 0; i < 4; i++) addUnit(s, "horsemen", 3, 1, 0);
    addUnit(s, "spearmen", 3, 1, 0);
    addUnit(s, "sail", 3, 1, 0);
    addUnit(s, "warriors", 10, 1, 1);
    const view = playerView(s, 0);
    expect(seaInvasion(view, landmasses(view), [1])?.target.owner).toBe(1);
    const theirs = s.cities.find((c) => c.owner === 1)!.id;
    s.cities.find((c) => c.id === theirs)!.size = 3;
    for (let turn = 0; turn < 12 && s.cities.find((c) => c.id === theirs)!.owner === 1; turn++) {
      s = playTurn(s).state;
      s = apply(s, { type: "endTurn" });
    }
    expect(s.cities.find((c) => c.id === theirs)!.owner).toBe(0);
    expect(s.units.some((u) => u.owner === 0 && u.x >= 9 && UNIT_TYPES[u.type].domain === "land")).toBe(true);
  });
});
