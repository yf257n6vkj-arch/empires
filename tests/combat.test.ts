import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  attackDraft,
  canAttack,
  cloneState,
  combatOdds,
  fightChance,
  healAmount,
  playerView,
  Rng,
  RULES,
  UNIT_TYPES,
  type GameState,
  type UnitTypeId,
} from "../src/core";
import { addUnit, stateFromAscii as asciiState, unit } from "./helpers";

/** A map where players 0 and 1 have met and are at war. */
function stateFromAscii(rows: string[], players = 1): GameState {
  const s = asciiState(rows, players);
  if (players >= 2) {
    s.players[0]!.contacts = [1];
    s.players[1]!.contacts = [0];
    s.players[0]!.atWar = [1];
    s.players[1]!.atWar = [0];
  }
  return s;
}

const FIELD = [
  "......",
  "..h...",
  "......",
  "......",
];

/** A city of `owner` founded by a settler at (x, y). */
function foundCity(s: GameState, x: number, y: number, owner: number): GameState {
  const settler = addUnit(s, "settlers", x, y, owner);
  const before = s.currentPlayer;
  s.currentPlayer = owner;
  const next = apply(s, { type: "foundCity", unitId: settler.id });
  next.currentPlayer = before;
  return next;
}

describe("chance of winning", () => {
  it("adds up rounds exactly", () => {
    expect(fightChance(0.5, 1, 1)).toBeCloseTo(0.5);
    // First to two wins at even odds is still even.
    expect(fightChance(0.5, 2, 2)).toBeCloseTo(0.5);
    // A stronger side wins long fights more surely than single rounds.
    expect(fightChance(0.69, 10, 10)).toBeGreaterThan(0.95);
    expect(fightChance(0.33, 10, 10)).toBeLessThan(0.07);
  });

  it("matches thousands of fought battles", () => {
    const cases: [UnitTypeId, UnitTypeId, boolean][] = [
      ["swordsmen", "spearmen", true],
      ["tank", "spearmen", true],
      ["catapult", "musketeers", false],
      ["warriors", "warriors", false],
    ];
    for (const [att, def, onHill] of cases) {
      const s = stateFromAscii(FIELD, 2);
      const a = addUnit(s, att, 1, 1);
      const d = addUnit(s, def, onHill ? 2 : 2, onHill ? 1 : 2, 1);
      if (onHill) d.fortified = true;
      const odds = combatOdds(s, a, d)!;
      let wins = 0;
      const n = 3000;
      for (let k = 0; k < n; k++) {
        const draft = cloneState(s);
        const rng = Rng.fromSeed(`fight-${att}-${k}`);
        const events: Parameters<typeof attackDraft>[4] = [];
        attackDraft(draft, unit(draft, a.id), d, rng, events);
        const e = events.find((x) => x.type === "combat");
        if (e && e.type === "combat" && e.attackerWon) wins++;
      }
      expect(Math.abs(wins / n - odds.winChance), `${att} vs ${def}`).toBeLessThan(0.03);
    }
  });
});

describe("defence", () => {
  it("doubles on hills and adds half when fortified", () => {
    const s = stateFromAscii(FIELD, 2);
    const a = addUnit(s, "swordsmen", 1, 1);
    const d = addUnit(s, "spearmen", 2, 1, 1);
    d.fortified = true;
    const odds = combatOdds(s, a, d)!;
    expect(odds.defense.value).toBeCloseTo(2 * 2 * 1.5);
    expect(odds.defense.factors.map((f) => f.kind)).toEqual(["terrain", "fortified"]);
  });

  it("triples behind walls against land units only", () => {
    let s = stateFromAscii(["~~....", "~~....", "~~...."], 2);
    s = foundCity(s, 2, 1, 1);
    s.cities[0]!.buildings.push("walls");
    const d = addUnit(s, "spearmen", 2, 1, 1);
    const soldier = addUnit(s, "swordsmen", 3, 1);
    const ship = addUnit(s, "frigate", 1, 1);
    expect(combatOdds(s, soldier, d)!.defense.factors.map((f) => f.kind)).toEqual(["fortified", "walls"]);
    expect(combatOdds(s, soldier, d)!.defense.value).toBeCloseTo(2 * 1.5 * 3);
    expect(combatOdds(s, ship, d)!.defense.factors.map((f) => f.kind)).toEqual(["fortified"]);
    void d;
  });

  it("makes veterans stronger", () => {
    const s = stateFromAscii(FIELD, 2);
    const a = addUnit(s, "swordsmen", 0, 3);
    a.veteran = true;
    const d = addUnit(s, "spearmen", 1, 3, 1);
    expect(combatOdds(s, a, d)!.attack.value).toBeCloseTo(4 * 1.5);
  });

  it("weakens an attacker with less than a full move left", () => {
    const s = stateFromAscii(FIELD, 2);
    const a = addUnit(s, "swordsmen", 0, 3);
    a.movesLeft = 1;
    const d = addUnit(s, "spearmen", 1, 3, 1);
    expect(combatOdds(s, a, d)!.attack.value).toBeCloseTo(4 / RULES.movesFraction);
  });
});

describe("attack", () => {
  it("keeps the attacker in place and costs a move", () => {
    const s = stateFromAscii(FIELD, 2);
    const a = addUnit(s, "tank", 0, 3);
    addUnit(s, "warriors", 1, 3, 1);
    const r = applyCommand(s, { type: "attack", unitId: a.id, to: { x: 1, y: 3 } });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const after = r.state.units.find((u) => u.id === a.id);
    if (after) {
      expect(after.x).toBe(0);
      expect(after.movesLeft).toBe(UNIT_TYPES.tank.moves * RULES.movesFraction - RULES.movesFraction);
    }
  });

  it("wipes out a beaten stack in the open but not in a fortress", () => {
    for (const fortress of [false, true]) {
      let won = 0;
      for (let k = 0; k < 40 && won === 0; k++) {
        const s = stateFromAscii(FIELD, 2);
        s.rng = Rng.fromSeed(`stack-${k}`).getState();
        const a = addUnit(s, "tank", 0, 3);
        addUnit(s, "warriors", 1, 3, 1);
        addUnit(s, "settlers", 1, 3, 1);
        if (fortress) s.map.fortress[3 * s.map.width + 1] = 1;
        const r = applyCommand(s, { type: "attack", unitId: a.id, to: { x: 1, y: 3 } });
        if (!r.ok) throw new Error(r.error);
        const e = r.events.find((x) => x.type === "combat");
        if (!e || e.type !== "combat" || !e.attackerWon) continue;
        won++;
        const left = r.state.units.filter((u) => u.owner === 1).length;
        expect(left).toBe(fortress ? 1 : 0);
      }
      expect(won).toBe(1);
    }
  });

  it("refuses attacks a unit cannot make", () => {
    const s = stateFromAscii(["..~~", "..~~"], 2);
    const settler = addUnit(s, "settlers", 0, 0);
    addUnit(s, "warriors", 1, 0, 1);
    expect(canAttack(s, settler, { x: 1, y: 0 })).toBe("cannotAttack");
    const soldier = addUnit(s, "swordsmen", 1, 1);
    addUnit(s, "trireme", 2, 1, 1);
    expect(canAttack(s, soldier, { x: 2, y: 1 })).toBe("cannotAttack");
    expect(canAttack(s, soldier, { x: 0, y: 1 })).toBe("nothingToAttack");
  });

  it("lets a winner become a veteran now and then", () => {
    let promoted = 0;
    for (let k = 0; k < 60; k++) {
      const s = stateFromAscii(FIELD, 2);
      s.rng = Rng.fromSeed(`vet-${k}`).getState();
      const a = addUnit(s, "tank", 0, 3);
      addUnit(s, "warriors", 1, 3, 1);
      const r = apply(s, { type: "attack", unitId: a.id, to: { x: 1, y: 3 } });
      if (r.units.find((u) => u.id === a.id)?.veteran) promoted++;
    }
    expect(promoted).toBeGreaterThan(15);
    expect(promoted).toBeLessThan(45);
  });
});

describe("taking cities", () => {
  it("captures an empty city, shrinks it and takes gold and a technology", () => {
    let s = stateFromAscii(FIELD, 2);
    s = foundCity(s, 2, 2, 1);
    s = foundCity(s, 5, 0, 1);
    const city = s.cities.find((c) => c.x === 2)!;
    city.size = 4;
    city.buildings.push("temple", "granary", "hangingGardens");
    s.players[1]!.gold = 100;
    s.players[1]!.techs.push("bronze");
    const a = addUnit(s, "swordsmen", 1, 2);
    const r = applyCommand(s, { type: "move", unitId: a.id, to: { x: 2, y: 2 } });
    if (!r.ok) throw new Error(r.error);
    const taken = r.state.cities.find((c) => c.id === city.id)!;
    expect(taken.owner).toBe(0);
    expect(taken.size).toBe(3);
    expect(taken.buildings).not.toContain("palace");
    expect(taken.buildings).toContain("hangingGardens");
    expect(r.state.players[0]!.gold).toBeGreaterThan(s.players[0]!.gold);
    expect(r.state.players[0]!.techs).toContain("bronze");
    // The capital moved to the other city.
    expect(r.state.cities.find((c) => c.x === 5)!.buildings).toContain("palace");
    expect(r.events.some((e) => e.type === "palaceMoved")).toBe(true);
  });

  it("destroys a city of size one and puts a player without cities out of the game", () => {
    let s = stateFromAscii(FIELD, 2);
    s = foundCity(s, 2, 2, 1);
    addUnit(s, "settlers", 5, 3, 1);
    const a = addUnit(s, "swordsmen", 1, 2);
    const r = applyCommand(s, { type: "move", unitId: a.id, to: { x: 2, y: 2 } });
    if (!r.ok) throw new Error(r.error);
    expect(r.state.cities).toHaveLength(0);
    expect(r.state.players[1]!.defeated).toBe(true);
    expect(r.state.units.filter((u) => u.owner === 1)).toHaveLength(0);
    expect(r.events.map((e) => e.type)).toEqual(expect.arrayContaining(["cityDestroyed", "civDestroyed"]));
  });

  it("does not let settlers or ships take a city", () => {
    let s = stateFromAscii(["~~....", "~~...."], 2);
    s = foundCity(s, 2, 0, 1);
    const settler = addUnit(s, "settlers", 3, 0);
    expect(applyCommand(s, { type: "move", unitId: settler.id, to: { x: 2, y: 0 } }).ok).toBe(false);
    const ship = addUnit(s, "frigate", 1, 0);
    expect(applyCommand(s, { type: "move", unitId: ship.id, to: { x: 2, y: 0 } }).ok).toBe(false);
  });
});

describe("hit points", () => {
  it("heals wounded units that rest, fastest in a city with barracks", () => {
    let s = stateFromAscii(FIELD, 1);
    s = foundCity(s, 2, 2, 0);
    const field = addUnit(s, "musketeers", 5, 3);
    field.hp = 5;
    const town = addUnit(s, "musketeers", 2, 2);
    town.hp = 5;
    expect(healAmount(s, field)).toBe(Math.ceil((20 * RULES.combat.healFieldPct) / 100));
    expect(healAmount(s, town)).toBe(Math.ceil((20 * RULES.combat.healCityPct) / 100));
    s.cities[0]!.buildings.push("barracks");
    expect(healAmount(s, town)).toBe(15);
    const next = apply(s, { type: "endTurn" });
    expect(next.units.find((u) => u.id === town.id)!.hp).toBe(20);
  });

  it("trains veterans in a city with barracks", () => {
    let s = stateFromAscii(FIELD, 1);
    s = foundCity(s, 2, 2, 0);
    const city = s.cities[0]!;
    city.buildings.push("barracks");
    city.production = { kind: "unit", id: "warriors" };
    city.shields = 100;
    const next = apply(s, { type: "endTurn" });
    const built = next.units.find((u) => u.type === "warriors");
    expect(built?.veteran).toBe(true);
  });

  it("starts every unit healthy", () => {
    const s = stateFromAscii(FIELD, 1);
    const t = addUnit(s, "tank", 0, 0);
    expect(t.hp).toBe(UNIT_TYPES.tank.hp);
  });
});

describe("war", () => {
  it("allows attacks and conquest only at war", () => {
    let s = stateFromAscii(FIELD, 2);
    s.players[0]!.atWar = [];
    s.players[1]!.atWar = [];
    s = foundCity(s, 2, 2, 1);
    const a = addUnit(s, "swordsmen", 1, 2);
    addUnit(s, "warriors", 3, 3, 1);
    const b = addUnit(s, "swordsmen", 2, 3);
    expect(canAttack(s, b, { x: 3, y: 3 })).toBe("notAtWar");
    expect(applyCommand(s, { type: "move", unitId: a.id, to: { x: 2, y: 2 } }).ok).toBe(false);
    const r = applyCommand(s, { type: "declareWar", player: 1 });
    if (!r.ok) throw new Error(r.error);
    expect(r.state.players[1]!.atWar).toEqual([0]);
    expect(applyCommand(r.state, { type: "move", unitId: a.id, to: { x: 2, y: 2 } }).ok).toBe(true);
  });

  it("needs contact before war", () => {
    const s = asciiState(FIELD, 2);
    expect(applyCommand(s, { type: "declareWar", player: 1 })).toEqual({ ok: false, error: "noContact" });
  });

  it("lets empires meet when they see each other", () => {
    const s = asciiState(["............"], 2);
    const u = addUnit(s, "warriors", 1, 0);
    addUnit(s, "warriors", 3, 0, 1);
    expect(s.players[0]!.contacts).toEqual([]);
    const r = applyCommand(s, { type: "move", unitId: u.id, to: { x: 2, y: 0 } });
    if (!r.ok) throw new Error(r.error);
    expect(r.state.players[0]!.contacts).toEqual([1]);
    expect(r.events.some((e) => e.type === "contactMade")).toBe(true);
  });
});

describe("what a player sees", () => {
  it("shows enemy units only where the player sees right now", () => {
    const s = stateFromAscii(["............"], 2);
    addUnit(s, "warriors", 0, 0);
    addUnit(s, "warriors", 1, 0, 1);
    addUnit(s, "warriors", 9, 0, 1);
    const view = playerView(s, 0);
    expect(view.foreignUnits.map((u) => u.x)).toEqual([1]);
  });
});
