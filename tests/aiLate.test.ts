import { describe, expect, it } from "vitest";
import { apply, cityReport, playerView, type GameState } from "../src/core";
import { decide } from "../src/ai";
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
