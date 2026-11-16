import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  barbarianId,
  barbarianTurnDraft,
  cloneState,
  distance,
  isBarbarian,
  migrateState,
  newGame,
  playerView,
  RULES,
  Rng,
  TERRAINS,
  type GameEvent,
  type GameState,
} from "../src/core";
import { decide } from "../src/ai";
import { addUnit, stateFromAscii } from "./helpers";

/** A small map where player 1 is the barbarians. */
function withBarbarians(rows: string[]): GameState {
  const s = stateFromAscii(rows, 2);
  s.barbarians = "few";
  s.players[1]!.civ = "barbarians";
  s.players[1]!.isHuman = false;
  s.players[1]!.explored = s.players[1]!.explored.map(() => 1);
  s.players[0]!.atWar = [1];
  s.players[1]!.atWar = [0];
  return s;
}

describe("ruins", () => {
  it("lie on land away from the starts", () => {
    const s = newGame({ seed: "ruins-1", playerCount: 4, opponentUnits: true });
    const ruins = s.map.ruins.flatMap((v, i) => (v ? [i] : []));
    const land = s.map.terrain.filter((t) => TERRAINS[t].land).length;
    expect(ruins.length).toBe(Math.floor(land / RULES.ruins.perLandTiles));
    for (const i of ruins) {
      expect(TERRAINS[s.map.terrain[i]!].land).toBe(true);
      const p = { x: i % s.map.width, y: Math.floor(i / s.map.width) };
      for (const pl of s.players) expect(distance(pl.start, p)).toBeGreaterThanOrEqual(RULES.ruins.minStartDistance);
    }
  });

  it("give something to the first land unit and then disappear", () => {
    const outcomes = new Set<string>();
    for (let k = 0; k < 60; k++) {
      let s = stateFromAscii([".....", ".....", "....."]);
      s.rng = Rng.fromSeed(`r${k}`).getState();
      s.players[0]!.researching = "alphabet";
      s.map.ruins[2] = 1;
      const unit = addUnit(s, "warriors", 1, 0);
      const gold = s.players[0]!.gold;
      const r = applyCommand(s, { type: "move", unitId: unit.id, to: { x: 2, y: 0 } });
      expect(r.ok).toBe(true);
      if (!r.ok) continue;
      s = r.state;
      expect(s.map.ruins[2]).toBe(0);
      const e = r.events.find((x) => x.type === "ruinsExplored");
      expect(e).toBeDefined();
      if (e?.type !== "ruinsExplored") continue;
      outcomes.add(e.outcome);
      if (e.outcome === "gold") expect(s.players[0]!.gold).toBe(gold + e.gold!);
      if (e.outcome === "tech") expect(s.players[0]!.techs).toContain("alphabet");
      // Without barbarians in the game, none come out.
      expect(e.outcome).not.toBe("barbarians");
    }
    expect(outcomes.has("gold")).toBe(true);
    expect(outcomes.has("tech")).toBe(true);
    expect(outcomes.has("mercenaries")).toBe(true);
  });

  it("can release barbarians in a game that has them, but not next to a city", () => {
    let freed = 0;
    for (let k = 0; k < 80; k++) {
      const s = withBarbarians([".......", ".......", "......."]);
      s.turn = RULES.ruins.barbariansFromTurn;
      s.rng = Rng.fromSeed(`b${k}`).getState();
      s.map.ruins[3] = 1;
      const unit = addUnit(s, "warriors", 2, 0);
      const r = applyCommand(s, { type: "move", unitId: unit.id, to: { x: 3, y: 0 } });
      if (!r.ok) continue;
      if (r.events.some((e) => e.type === "barbariansAppeared")) {
        freed++;
        expect(r.state.units.some((u) => u.owner === 1)).toBe(true);
      }
    }
    expect(freed).toBeGreaterThan(0);
    // With a city two tiles away the ruins stay quiet.
    for (let k = 0; k < 40; k++) {
      let s = withBarbarians([".......", ".......", "......."]);
      s.turn = RULES.ruins.barbariansFromTurn;
      s.rng = Rng.fromSeed(`c${k}`).getState();
      const settler = addUnit(s, "settlers", 5, 1);
      s = apply(s, { type: "foundCity", unitId: settler.id });
      s.map.ruins[3] = 1;
      const unit = addUnit(s, "warriors", 2, 0);
      const r = applyCommand(s, { type: "move", unitId: unit.id, to: { x: 3, y: 0 } });
      if (r.ok) expect(r.events.some((e) => e.type === "barbariansAppeared")).toBe(false);
    }
  });
});

describe("barbarians", () => {
  it("join a new game as the last player, at war with everybody", () => {
    const none = newGame({ seed: "barb-1", playerCount: 4, opponentUnits: true });
    expect(barbarianId(none)).toBeNull();
    const s = newGame({ seed: "barb-1", playerCount: 4, opponentUnits: true, barbarians: "many" });
    expect(s.players).toHaveLength(5);
    const b = s.players[4]!;
    expect(isBarbarian(b)).toBe(true);
    expect(b.atWar).toEqual([0, 1, 2, 3]);
    for (const p of s.players.slice(0, 4)) expect(p.atWar).toEqual([4]);
    expect(s.units.some((u) => u.owner === 4)).toBe(false);
    // Rivals see the barbarians as such.
    expect(playerView(s, 0).rivals.find((r) => r.id === 4)?.barbarian).toBe(true);
  });

  it("rise up after their start turn, up to a limit", () => {
    const s = withBarbarians(Array.from({ length: 20 }, () => "...................."));
    s.turn = RULES.barbarians.levels.few.startTurn;
    let draft = cloneState(s);
    const events: GameEvent[] = [];
    for (let k = 0; k < 400; k++) barbarianTurnDraft(draft, events);
    const count = draft.units.filter((u) => u.owner === 1).length;
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(RULES.barbarians.levels.few.maxUnits + RULES.barbarians.levels.few.groupMax);
    expect(events.some((e) => e.type === "barbariansAppeared" && e.reason === "uprising")).toBe(true);
    // Before the start turn nothing happens.
    draft = cloneState(s);
    draft.turn = 1;
    for (let k = 0; k < 100; k++) barbarianTurnDraft(draft, []);
    expect(draft.units.some((u) => u.owner === 1)).toBe(false);
  });

  it("walk into an empty city next to them and make no contact", () => {
    let s = withBarbarians([".......", ".......", "......."]);
    const settler = addUnit(s, "settlers", 1, 1);
    s = apply(s, { type: "foundCity", unitId: settler.id });
    // A city of one would be razed; this one is taken.
    s.cities[0]!.size = 2;
    addUnit(s, "horsemen", 2, 1, 1);
    s.currentPlayer = 1;
    const commands = decide(playerView(s, 1));
    expect(commands).toContainEqual(expect.objectContaining({ type: "move", to: { x: 1, y: 1 } }));
    for (const c of commands) {
      const r = applyCommand(s, c);
      if (r.ok) s = r.state;
    }
    expect(s.cities[0]!.owner).toBe(1);
    expect(s.players[0]!.contacts).not.toContain(1);
  });

  it("are absent from games saved before them", () => {
    const s = newGame({ seed: "old-1", playerCount: 2, opponentUnits: true });
    const old = JSON.parse(JSON.stringify(s)) as Record<string, unknown> & { map: Record<string, unknown>; cities: Record<string, unknown>[] };
    old.version = 13;
    delete old.barbarians;
    delete old.map.ruins;
    const migrated = migrateState(old)!;
    expect(migrated.barbarians).toBe("none");
    expect(migrated.map.ruins.every((v) => v === 0)).toBe(true);
    expect(migrated.map.ruins).toHaveLength(s.map.width * s.map.height);
  });
});
