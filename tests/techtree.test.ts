import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  BUILDINGS,
  canResearch,
  cityReport,
  migrateState,
  nextStepToGoal,
  pathToTech,
  STATE_VERSION,
  TECH_IDS,
  TECHS,
  UNIT_TYPES,
  workableTiles,
  type GameState,
  type TechId,
} from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

const GRASS = [".......", ".......", ".......", ".......", "......."];

function cityState(): GameState {
  const s = stateFromAscii(GRASS);
  const settler = addUnit(s, "settlers", 3, 2);
  return apply(s, { type: "foundCity", unitId: settler.id });
}

describe("technology tree", () => {
  it("has the 67 advances of the original chart plus archery", () => {
    expect(TECH_IDS.length).toBe(68);
  });

  it("lists every prerequisite before the technology that needs it, so the tree has no cycle", () => {
    const seen = new Set<TechId>();
    for (const id of TECH_IDS) {
      for (const r of TECHS[id].requires) expect(seen.has(r), `${id} needs ${r}`).toBe(true);
      seen.add(id);
    }
  });

  it("never asks for an earlier era to depend on a later one", () => {
    for (const t of Object.values(TECHS)) {
      for (const r of t.requires) expect(TECHS[r].era, `${t.id} <- ${r}`).toBeLessThanOrEqual(t.era);
    }
  });

  it("puts writing before the alphabet, as in history", () => {
    expect(TECHS.alphabet.requires).toContain("writing");
    expect(TECHS.writing.requires).not.toContain("alphabet");
  });

  it("leads every technology somewhere except the last one", () => {
    const needed = new Set(Object.values(TECHS).flatMap((t) => t.requires));
    const leaves = TECH_IDS.filter((t) => !needed.has(t));
    const unlocking = new Set<string>([
      ...Object.values(UNIT_TYPES).map((u) => u.requires ?? ""),
      ...Object.values(BUILDINGS).map((b) => b.requires ?? ""),
    ]);
    // A dead end is fine only when it unlocks something or is a modern side branch.
    for (const t of leaves) {
      expect(unlocking.has(t) || TECHS[t].era === 5, `${t} is a dead end`).toBe(true);
    }
  });

  it("puts the spaceship behind the late technologies", () => {
    const parts = Object.values(BUILDINGS).filter((b) => b.spaceship);
    expect(parts.map((b) => b.requires).sort()).toEqual(["plastics", "robotics", "spaceFlight"]);
    expect(pathToTech({ techs: [] } as never, "fusionPower").length).toBe(
      new Set(pathToTech({ techs: [] } as never, "fusionPower")).size,
    );
  });
});

describe("research goal", () => {
  it("finds the missing prerequisites in an order that can be researched", () => {
    const s = cityState();
    const p = s.players[0]!;
    const path = pathToTech(p, "literacy");
    expect(path).toEqual(["pottery", "writing", "alphabet", "codeOfLaws", "literacy"]);
    expect(nextStepToGoal(p, "literacy")).toBe("pottery");
    p.techs.push("pottery", "writing");
    expect(nextStepToGoal(p, "literacy")).toBe("alphabet");
  });

  it("starts on the first step and keeps researching towards the goal without asking", () => {
    let s = cityState();
    s = apply(s, { type: "setResearchGoal", tech: "alphabet" });
    expect(s.players[0]).toMatchObject({ researching: "pottery", researchGoal: "alphabet" });

    s.players[0]!.research = 1000;
    const r = applyCommand(s, { type: "endTurn" });
    if (!r.ok) throw new Error(r.error);
    expect(r.state.players[0]).toMatchObject({ techs: ["pottery"], researching: "writing", researchGoal: "alphabet" });
    expect(r.events.some((e) => e.type === "researchNeeded" && e.player === 0)).toBe(false);
  });

  it("asks for a new choice once the goal is reached", () => {
    let s = cityState();
    s.players[0]!.techs.push("pottery");
    s = apply(s, { type: "setResearchGoal", tech: "alphabet" });
    s.players[0]!.techs.push("writing");
    s.players[0]!.researching = "alphabet";
    s.players[0]!.research = 1000;
    const r = applyCommand(s, { type: "endTurn" });
    if (!r.ok) throw new Error(r.error);
    expect(r.state.players[0]).toMatchObject({ researching: null, researchGoal: null });
    expect(r.events.some((e) => e.type === "researchNeeded" && e.player === 0)).toBe(true);
  });

  it("treats a goal that can be researched right away as plain research", () => {
    const s = apply(cityState(), { type: "setResearchGoal", tech: "pottery" });
    expect(s.players[0]).toMatchObject({ researching: "pottery", researchGoal: null });
  });

  it("drops the goal when the player picks research by hand", () => {
    let s = apply(cityState(), { type: "setResearchGoal", tech: "literacy" });
    s = apply(s, { type: "setResearch", tech: "bronze" });
    expect(s.players[0]).toMatchObject({ researching: "bronze", researchGoal: null });
  });

  it("refuses a goal the player already knows", () => {
    const s = cityState();
    s.players[0]!.techs.push("pottery");
    expect(applyCommand(s, { type: "setResearchGoal", tech: "pottery" })).toEqual({ ok: false, error: "alreadyKnown" });
  });
});

describe("tiles chosen by hand", () => {
  it("keeps the chosen tiles through the end of a turn", () => {
    let s = cityState();
    const city = s.cities[0]!;
    city.size = 2;
    const tiles = workableTiles(s, city).slice(-2);
    s = apply(s, { type: "setWorkedTiles", cityId: city.id, tiles });
    expect(s.cities[0]).toMatchObject({ worked: [...tiles].sort((a, b) => a - b), manualTiles: true });
    s = apply(s, { type: "endTurn" });
    while (s.currentPlayer !== 0) s = apply(s, { type: "endTurn" });
    if (s.cities[0]!.size === 2) expect(s.cities[0]!.worked).toEqual([...tiles].sort((a, b) => a - b));
  });

  it("lets a citizen leave the fields and become an entertainer", () => {
    let s = cityState();
    const city = s.cities[0]!;
    city.size = 2;
    s = apply(s, { type: "setWorkedTiles", cityId: city.id, tiles: [workableTiles(s, city)[0]!] });
    expect(cityReport(s, s.cities[0]!).happiness.entertainers).toBe(1);
  });

  it("refuses more tiles than citizens and tiles outside the city", () => {
    const s = cityState();
    const city = s.cities[0]!;
    const free = workableTiles(s, city);
    expect(applyCommand(s, { type: "setWorkedTiles", cityId: city.id, tiles: free.slice(0, 2) })).toEqual({
      ok: false,
      error: "tooManyWorkers",
    });
    const centre = city.y * s.map.width + city.x;
    expect(applyCommand(s, { type: "setWorkedTiles", cityId: city.id, tiles: [centre] })).toEqual({
      ok: false,
      error: "tileNotWorkable",
    });
  });

  it("goes back to automatic placement on request and when the city grows", () => {
    let s = cityState();
    const city = s.cities[0]!;
    s = apply(s, { type: "setWorkedTiles", cityId: city.id, tiles: [] });
    expect(s.cities[0]!.worked).toEqual([]);
    const auto = apply(s, { type: "autoAssignWorkers", cityId: city.id });
    expect(auto.cities[0]).toMatchObject({ manualTiles: false });
    expect(auto.cities[0]!.worked.length).toBe(1);

    s.cities[0]!.food = 1000;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.size).toBe(2);
    expect(s.cities[0]!.manualTiles).toBe(false);
    expect(s.cities[0]!.worked.length).toBeGreaterThan(0);
  });
});

describe("saves from phase 2", () => {
  it("moves renamed technologies over and drops ones that are gone", () => {
    const s = cityState();
    const old = JSON.parse(JSON.stringify(s)) as Record<string, unknown> & GameState;
    old.version = 3;
    const p = old.players[0] as unknown as Record<string, unknown>;
    p.techs = ["pottery", "scholarship", "industry", "modernScience"];
    p.researching = "modernScience";
    delete p.researchGoal;
    delete (old.cities[0] as unknown as Record<string, unknown>).manualTiles;
    const migrated = migrateState(old)!;
    expect(migrated.version).toBe(STATE_VERSION);
    expect(migrated.players[0]).toMatchObject({
      techs: ["pottery", "university", "industrialization"],
      researching: null,
      researchGoal: null,
    });
    expect(migrated.cities[0]!.manualTiles).toBe(false);
    expect(canResearch(migrated.players[0]!, "writing")).toBe(true);
  });
});
