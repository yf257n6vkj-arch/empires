import { describe, expect, it } from "vitest";
import {
  apply,
  barbarianTurnDraft,
  cityReport,
  gameTurn,
  maxTurns,
  migrateState,
  newGame,
  parseGameCode,
  playerView,
  QUICK_WORLD,
  RULES,
  WORLD_RULES,
  type GameState,
} from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

function oneCity(speed: GameState["speed"]): GameState {
  let s = stateFromAscii([".......", ".......", "......."]);
  s.speed = speed;
  const a = addUnit(s, "settlers", 3, 1);
  s = apply(s, { type: "foundCity", unitId: a.id });
  s.cities[0]!.size = 3;
  return s;
}

describe("game speed", () => {
  it("makes the quick game shorter", () => {
    expect(maxTurns(oneCity("normal"))).toBe(RULES.speeds.normal.maxTurns);
    expect(maxTurns(oneCity("quick"))).toBe(RULES.speeds.quick.maxTurns);
    expect(RULES.speeds.quick.maxTurns).toBeLessThan(RULES.speeds.normal.maxTurns);
    expect(playerView(oneCity("quick"), 0).maxTurns).toBe(RULES.speeds.quick.maxTurns);
  });

  it("grows surplus shields, food and science by the speed's percentages", () => {
    const normal = oneCity("normal");
    const quick = oneCity("quick");
    const n = cityReport(normal, normal.cities[0]!);
    const q = cityReport(quick, quick.cities[0]!);
    const pct = RULES.speeds.quick;
    expect(n.shieldSurplus).toBeGreaterThan(0);
    expect(q.shieldSurplus).toBe(Math.floor((n.shieldSurplus * pct.productionPct) / 100));
    expect(q.foodSurplus).toBe(n.foodSurplus > 0 ? Math.floor((n.foodSurplus * pct.foodPct) / 100) : n.foodSurplus);
    expect(q.science).toBe(n.science > 0 ? Math.floor((n.science * pct.sciencePct) / 100) : n.science);
  });

  it("leaves a shortage of food as it is", () => {
    const normal = oneCity("normal");
    const quick = oneCity("quick");
    normal.cities[0]!.size = 8;
    quick.cities[0]!.size = 8;
    const n = cityReport(normal, normal.cities[0]!);
    const q = cityReport(quick, quick.cities[0]!);
    expect(n.foodSurplus).toBeLessThan(0);
    expect(q.foodSurplus).toBe(n.foodSurplus);
  });

  it("gives the score victory after the last turn of the quick game", () => {
    let s = stateFromAscii([".......", ".......", "......."], 2);
    s.speed = "quick";
    const a = addUnit(s, "settlers", 1, 1);
    s = apply(s, { type: "foundCity", unitId: a.id });
    const b = addUnit(s, "settlers", 5, 1, 1);
    s.currentPlayer = 1;
    s = apply(s, { type: "foundCity", unitId: b.id });
    s.currentPlayer = 0;
    s.cities[1]!.size = 5;
    s.turn = RULES.speeds.quick.maxTurns;
    s = apply(s, { type: "endTurn" });
    expect(s.victory).toBeNull();
    s = apply(s, { type: "endTurn" });
    expect(s.victory).toMatchObject({ player: 1, kind: "score", turn: RULES.speeds.quick.maxTurns });
  });

  it("starts the quick world small with the opponents that size suggests", () => {
    const world = parseGameCode(`abc/${QUICK_WORLD}`).world!;
    expect(world.size).toBe("small");
    expect(world.opponents).toBe(WORLD_RULES.sizes.small.opponents);
    const s = newGame({ seed: `abc/${QUICK_WORLD}`, playerCount: world.opponents + 1, world, speed: "quick" });
    expect(s.speed).toBe("quick");
    expect(s.map.width).toBe(WORLD_RULES.sizes.small.width);
  });

  it("loads older saves as normal games", () => {
    const s = oneCity("quick") as unknown as Record<string, unknown>;
    delete s.speed;
    const loaded = migrateState({ ...structuredClone(s), version: 18 })!;
    expect(loaded.speed).toBe("normal");
  });
});

describe("game calendar", () => {
  it("moves turn thresholds to the same point of a quick game", () => {
    const normal = { speed: "normal" as const };
    const quick = { speed: "quick" as const };
    expect(gameTurn(normal, 50)).toBe(50);
    expect(gameTurn(quick, 50)).toBe(Math.round((50 * RULES.speeds.quick.maxTurns) / RULES.speeds.normal.maxTurns));
  });

  it("lets barbarians rise up earlier in a quick game", () => {
    const start = RULES.barbarians.levels.many.startTurn;
    const turn = gameTurn({ speed: "quick" }, start);
    expect(turn).toBeLessThan(start);
    let rose = 0;
    for (let k = 0; k < 40; k++) {
      const s = newGame({ seed: `barb-${k}/${QUICK_WORLD}`, playerCount: 3, speed: "quick", barbarians: "many" });
      s.turn = turn;
      const before = s.units.length;
      barbarianTurnDraft(s, []);
      if (s.units.length > before) rose++;
      const n = newGame({ seed: `barb-${k}/${QUICK_WORLD}`, playerCount: 3, barbarians: "many" });
      n.turn = turn;
      const units = n.units.length;
      barbarianTurnDraft(n, []);
      expect(n.units.length).toBe(units);
    }
    expect(rose).toBeGreaterThan(0);
  });
});
