import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  disbandShields,
  RULES,
  UNIT_TYPES,
  upgradeCost,
  upgradeTarget,
  type GameState,
  type TechId,
} from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

const LAND = [".....", ".....", ".....", "....."];
const COAST = ["...~~", "...~~", "...~~", "...~~"];

function withCity(rows = LAND, x = 1, y = 1): GameState {
  const s = stateFromAscii(rows, 2);
  const settler = addUnit(s, "settlers", x, y);
  return apply(s, { type: "foundCity", unitId: settler.id });
}

describe("disbanding a unit", () => {
  it("in its own city adds half of its cost to production", () => {
    let s = withCity();
    const knights = addUnit(s, "knights", 1, 1);
    const before = s.cities[0]!.shields;
    s = apply(s, { type: "disband", unitId: knights.id });
    expect(s.units.some((u) => u.id === knights.id)).toBe(false);
    expect(disbandShields("knights")).toBe(Math.floor((UNIT_TYPES.knights.cost * RULES.disbandShieldsPct) / 100));
    expect(s.cities[0]!.shields).toBe(before + disbandShields("knights"));
  });

  it("outside a city just removes it", () => {
    let s = withCity();
    const warriors = addUnit(s, "warriors", 4, 3);
    const before = s.cities[0]!.shields;
    s = apply(s, { type: "disband", unitId: warriors.id });
    expect(s.units.some((u) => u.id === warriors.id)).toBe(false);
    expect(s.cities[0]!.shields).toBe(before);
  });

  it("in a foreign city gives nothing to that city", () => {
    let s = withCity();
    const enemy = addUnit(s, "warriors", 1, 1, 1);
    s.currentPlayer = 1;
    const before = s.cities[0]!.shields;
    s = apply(s, { type: "disband", unitId: enemy.id });
    expect(s.cities[0]!.shields).toBe(before);
  });

  it("refuses a ship with units on board at sea", () => {
    const s = stateFromAscii(COAST, 1);
    const ship = addUnit(s, "trireme", 3, 1);
    const passenger = addUnit(s, "warriors", 3, 1);
    passenger.carriedBy = ship.id;
    const result = applyCommand(s, { type: "disband", unitId: ship.id });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("carriesUnits");
  });

  it("lets the passengers step off when a ship is disbanded in port", () => {
    let s = withCity(COAST, 2, 1);
    const ship = addUnit(s, "trireme", 2, 1);
    const passenger = addUnit(s, "warriors", 2, 1);
    passenger.carriedBy = ship.id;
    s = apply(s, { type: "disband", unitId: ship.id });
    const left = s.units.find((u) => u.id === passenger.id);
    expect(left?.carriedBy).toBeNull();
  });
});

describe("upgrading a unit", () => {
  const knows = (s: GameState, ...techs: TechId[]) => s.players[0]!.techs.push(...techs);

  it("follows the line of replacements as far as the technologies go", () => {
    expect(upgradeTarget({ techs: [] }, "warriors")).toBeNull();
    expect(upgradeTarget({ techs: ["bronze"] }, "warriors")).toBe("spearmen");
    expect(upgradeTarget({ techs: ["bronze", "gunpowder"] }, "warriors")).toBe("musketeers");
    // Skipping a step works: no bronze, but gunpowder is not reachable through spearmen.
    expect(upgradeTarget({ techs: ["gunpowder"] }, "warriors")).toBeNull();
    expect(upgradeTarget({ techs: ["automobile"] }, "knights")).toBe("tank");
    expect(upgradeTarget({ techs: ["robotics"] }, "settlers")).toBeNull();
  });

  it("costs gold, happens in an own city and ends the unit's turn", () => {
    let s = withCity();
    knows(s, "bronze", "gunpowder");
    s.players[0]!.gold = 100;
    const warriors = addUnit(s, "warriors", 1, 1);
    s = apply(s, { type: "upgrade", unitId: warriors.id });
    const u = s.units.find((x) => x.id === warriors.id)!;
    expect(u.type).toBe("musketeers");
    expect(u.movesLeft).toBe(0);
    const cost = RULES.upgradeGoldBase + RULES.upgradeGoldPerShield * (UNIT_TYPES.musketeers.cost - UNIT_TYPES.warriors.cost);
    expect(upgradeCost("warriors", "musketeers")).toBe(cost);
    expect(s.players[0]!.gold).toBe(100 - cost);
  });

  it("is refused outside a city, without gold or without a newer type", () => {
    let s = withCity();
    knows(s, "bronze");
    s.players[0]!.gold = 100;
    const outside = addUnit(s, "warriors", 4, 3);
    const err = (unitId: number) => {
      const r = applyCommand(s, { type: "upgrade", unitId });
      return r.ok ? null : r.error;
    };
    expect(err(outside.id)).toBe("notInCity");
    const settlers = addUnit(s, "settlers", 1, 1);
    expect(err(settlers.id)).toBe("nothingToUpgrade");
    const poor = addUnit(s, "warriors", 1, 1);
    s.players[0]!.gold = 0;
    expect(err(poor.id)).toBe("notEnoughGold");
  });
});
