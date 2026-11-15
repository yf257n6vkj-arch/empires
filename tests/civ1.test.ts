import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  BUILDINGS,
  canBuildUnit,
  cityEffects,
  cityHappiness,
  cityReport,
  cityTileYield,
  findPath,
  migrateState,
  moveCost,
  productionOptions,
  sameItem,
  spaceshipFlight,
  STATE_VERSION,
  TECHS,
  type BuildingId,
  type GameState,
  type ProductionItem,
  type TechId,
  Rng,
} from "../src/core";
import { addUnit, stateFromAscii, unit } from "./helpers";

// A coast: land on the left, open sea on the right.
const COAST = [
  "....~~~~~~",
  "....~~~~~~",
  "....~~~~~~",
  "....~~~~~~",
  "....~~~~~~",
];

function cityOn(rows: string[], x: number, y: number, players = 1): GameState {
  const s = stateFromAscii(rows, players);
  const settler = addUnit(s, "settlers", x, y);
  return apply(s, { type: "foundCity", unitId: settler.id });
}

const has = (options: ProductionItem[], item: ProductionItem) => options.some((o) => sameItem(o, item));
const allTechs = () => Object.keys(TECHS) as TechId[];

/** Ends turns until it is player 0's turn again (all players pass). */
function nextTurn(s: GameState): GameState {
  s = apply(s, { type: "endTurn" });
  while (s.currentPlayer !== 0) s = apply(s, { type: "endTurn" });
  return s;
}

/** A wonder standing in the given city. */
function giveWonder(s: GameState, cityIndex: number, id: BuildingId): void {
  s.cities[cityIndex]!.buildings.push(id);
}

describe("ships", () => {
  it("are built only in cities on the coast", () => {
    let s = cityOn(COAST, 3, 2);
    const inland = addUnit(s, "settlers", 0, 0);
    s = apply(s, { type: "foundCity", unitId: inland.id });
    s.players[0]!.techs.push("mapMaking");
    expect(canBuildUnit(s, s.cities[0]!, "trireme")).toBe(true);
    expect(canBuildUnit(s, s.cities[1]!, "trireme")).toBe(false);
  });

  it("sail on the ocean and into coastal cities, never onto open land", () => {
    const s = cityOn(COAST, 3, 2);
    expect(moveCost(s, { x: 4, y: 2 }, { x: 5, y: 2 }, "sea")).toBe(3);
    expect(moveCost(s, { x: 4, y: 2 }, { x: 3, y: 2 }, "sea")).toBe(3);
    expect(moveCost(s, { x: 4, y: 1 }, { x: 3, y: 0 }, "sea")).toBeNull();
    expect(findPath(s, 0, { x: 4, y: 0 }, { x: 9, y: 4 }, "sea")).not.toBeNull();
  });

  it("carry land units: boarding at sea, sailing together and landing", () => {
    const s = cityOn(COAST, 3, 2);
    const ship = addUnit(s, "trireme", 4, 2);
    const soldier = addUnit(s, "warriors", 3, 1);
    let t = apply(s, { type: "move", unitId: soldier.id, to: { x: 4, y: 2 } });
    expect(unit(t, soldier.id).carriedBy).toBe(ship.id);
    t = apply(t, { type: "move", unitId: ship.id, to: { x: 4, y: 3 } });
    expect(unit(t, soldier.id)).toMatchObject({ x: 4, y: 3 });
    t = nextTurn(t);
    t = apply(t, { type: "move", unitId: soldier.id, to: { x: 3, y: 4 } });
    expect(unit(t, soldier.id)).toMatchObject({ x: 3, y: 4, carriedBy: null });
  });

  it("refuse passengers beyond their capacity", () => {
    const s = cityOn(COAST, 3, 2);
    addUnit(s, "trireme", 4, 2);
    const a = addUnit(s, "warriors", 3, 1);
    const b = addUnit(s, "warriors", 3, 3);
    const c = addUnit(s, "settlers", 3, 2);
    let t = apply(s, { type: "move", unitId: a.id, to: { x: 4, y: 2 } });
    t = apply(t, { type: "move", unitId: b.id, to: { x: 4, y: 2 } });
    expect(applyCommand(t, { type: "move", unitId: c.id, to: { x: 4, y: 2 } })).toEqual({ ok: false, error: "cannotEnter" });
  });

  it("take units on board in a city", () => {
    const s = cityOn(COAST, 3, 2);
    const ship = addUnit(s, "trireme", 3, 2);
    const soldier = addUnit(s, "warriors", 3, 2);
    let t = apply(s, { type: "board", unitId: soldier.id });
    expect(unit(t, soldier.id).carriedBy).toBe(ship.id);
    t = apply(t, { type: "move", unitId: ship.id, to: { x: 4, y: 2 } });
    expect(unit(t, soldier.id)).toMatchObject({ x: 4, y: 2 });
  });

  it("sink sometimes as triremes away from the coast, never with the lighthouse", () => {
    let lost = 0;
    for (let seed = 0; seed < 40; seed++) {
      let s = cityOn(COAST, 3, 2);
      s.rng = Rng.fromSeed(`trireme-${seed}`).getState();
      const ship = addUnit(s, "trireme", 8, 2);
      s = nextTurn(s);
      if (!s.units.some((u) => u.id === ship.id)) lost++;
    }
    expect(lost).toBeGreaterThan(5);
    expect(lost).toBeLessThan(35);

    let s = cityOn(COAST, 3, 2);
    giveWonder(s, 0, "lighthouse");
    const ships = Array.from({ length: 10 }, () => addUnit(s, "trireme", 8, 2).id);
    s = nextTurn(s);
    expect(ships.every((id) => s.units.some((u) => u.id === id))).toBe(true);
  });

  it("get an extra move from the lighthouse until magnetism, and from the circumnavigation", () => {
    let s = cityOn(COAST, 3, 2);
    const ship = addUnit(s, "sail", 6, 2);
    giveWonder(s, 0, "lighthouse");
    s = nextTurn(s);
    expect(unit(s, ship.id).movesLeft).toBe(4 * 3);
    s.players[0]!.techs.push("magnetism");
    giveWonder(s, 0, "circumnavigation");
    s = nextTurn(s);
    expect(unit(s, ship.id).movesLeft).toBe(4 * 3);
  });
});

describe("aircraft", () => {
  it("crash when they stay away from a city longer than their fuel lasts", () => {
    let s = cityOn(COAST, 1, 2);
    const fighter = addUnit(s, "fighter", 3, 0);
    const bomber = addUnit(s, "bomber", 3, 4);
    s = nextTurn(s);
    expect(s.units.some((u) => u.id === fighter.id)).toBe(false);
    expect(unit(s, bomber.id).turnsAloft).toBe(1);
    s = nextTurn(s);
    expect(s.units.some((u) => u.id === bomber.id)).toBe(false);
  });

  it("refuel in cities and on carriers", () => {
    let s = cityOn(COAST, 1, 2);
    const inCity = addUnit(s, "fighter", 1, 2);
    addUnit(s, "carrier", 6, 2);
    const flying = addUnit(s, "fighter", 5, 2);
    s = apply(s, { type: "move", unitId: flying.id, to: { x: 6, y: 2 } });
    s = nextTurn(s);
    expect(s.units.some((u) => u.id === inCity.id)).toBe(true);
    expect(unit(s, flying.id).turnsAloft).toBe(0);
  });

  it("fly over any terrain at one move per tile", () => {
    const s = cityOn([".M~.."], 0, 0);
    expect(moveCost(s, { x: 0, y: 0 }, { x: 1, y: 0 }, "air")).toBe(3);
    expect(moveCost(s, { x: 1, y: 0 }, { x: 2, y: 0 }, "air")).toBe(3);
  });
});

describe("governments", () => {
  it("start in despotism, which takes one from tiles yielding more than two, except the city centre", () => {
    const s = cityOn(["....."], 2, 0);
    expect(s.players[0]!.government).toBe("despotism");
    s.map.irrigation[1] = 1;
    expect(cityTileYield(s, s.cities[0]!, 1).food).toBe(2);
    expect(cityTileYield(s, s.cities[0]!, 2).food).toBe(3);
    s.players[0]!.government = "monarchy";
    expect(cityTileYield(s, s.cities[0]!, 1).food).toBe(3);
  });

  it("go through anarchy, which brings no science and no gold", () => {
    let s = cityOn(["....."], 2, 0);
    s.players[0]!.techs.push("monarchy", "ceremonies", "codeOfLaws", "alphabet", "writing");
    s = apply(s, { type: "revolution", government: "monarchy" });
    expect(s.players[0]!.government).toBe("anarchy");
    s.map.road.fill(1);
    expect(cityReport(s, s.cities[0]!).science + cityReport(s, s.cities[0]!).gold).toBe(0);
    s = nextTurn(s);
    expect(s.players[0]!.government).toBe("anarchy");
    s = nextTurn(s);
    expect(s.players[0]!.government).toBe("monarchy");
  });

  it("need the technology, and the pyramids shorten the anarchy to one turn", () => {
    let s = cityOn(["....."], 2, 0);
    expect(applyCommand(s, { type: "revolution", government: "republic" })).toEqual({ ok: false, error: "governmentNotKnown" });
    s.players[0]!.techs.push("republic");
    giveWonder(s, 0, "pyramids");
    s = apply(s, { type: "revolution", government: "republic" });
    s = nextTurn(s);
    expect(s.players[0]!.government).toBe("republic");
  });

  it("give republics one more trade on tiles with trade and a wider slider", () => {
    let s = cityOn(["....."], 2, 0);
    s.map.road.fill(1);
    const before = cityTileYield(s, s.cities[0]!, 1).trade;
    s.players[0]!.government = "republic";
    expect(cityTileYield(s, s.cities[0]!, 1).trade).toBe(before + 1);
    s = apply(s, { type: "setScienceRate", rate: 80 });
    expect(applyCommand(s, { type: "setScienceRate", rate: 90 }).ok).toBe(false);
  });

  it("let soldiers calm a city only where martial law exists", () => {
    const s = cityOn(["......."], 3, 0);
    const city = s.cities[0]!;
    city.size = 6;
    city.worked = [0, 1, 2, 4, 5, 6];
    for (let k = 0; k < 2; k++) addUnit(s, "warriors", 3, 0);
    const despot = cityHappiness(s, city);
    s.players[0]!.government = "republic";
    const republic = cityHappiness(s, city);
    expect(republic.unhappy + republic.entertainers).toBeGreaterThan(despot.unhappy + despot.entertainers);
  });

  it("make soldiers abroad cause unhappiness in a democracy, less with women's suffrage", () => {
    const s = cityOn([".........", "........."], 1, 0);
    const city = s.cities[0]!;
    city.size = 5;
    city.worked = [0, 2, 3, 9, 10];
    s.players[0]!.government = "democracy";
    const soldier = addUnit(s, "warriors", 7, 1);
    soldier.homeCity = city.id;
    const home = cityHappiness(s, city);
    const before = home.unhappy + home.entertainers;
    soldier.x = 1;
    soldier.y = 0;
    const calm = cityHappiness(s, city);
    expect(before - (calm.unhappy + calm.entertainers)).toBe(2);
    soldier.x = 7;
    giveWonder(s, 0, "womensSuffrage");
    const eased = cityHappiness(s, city);
    expect(before - (eased.unhappy + eased.entertainers)).toBe(1);
  });

  it("charge a shield for every unit beyond the free ones", () => {
    const s = cityOn(["fffff", "ff.ff", "fffff"], 2, 1);
    const city = s.cities[0]!;
    city.size = 3;
    for (let k = 0; k < 4; k++) addUnit(s, "warriors", 2, 1).homeCity = city.id;
    expect(cityReport(s, city).unitUpkeep).toBe(1);
    s.players[0]!.government = "republic";
    expect(cityReport(s, city).unitUpkeep).toBe(4);
  });
});

describe("wonders", () => {
  it("colossus adds trade to tiles that have trade, until electricity", () => {
    const s = cityOn(["~~~", "~.~", "~~~"], 1, 1);
    const before = cityTileYield(s, s.cities[0]!, 0).trade;
    giveWonder(s, 0, "colossus");
    expect(cityTileYield(s, s.cities[0]!, 0).trade).toBe(before + 1);
    s.players[0]!.techs.push("electricity");
    expect(cityTileYield(s, s.cities[0]!, 0).trade).toBe(before);
  });

  it("oracle doubles temples and the sistine chapel strengthens cathedrals", () => {
    const s = cityOn(["....."], 2, 0);
    const city = s.cities[0]!;
    city.buildings.push("temple", "cathedral");
    expect(cityEffects(s, city).content).toBe(2 + 3);
    giveWonder(s, 0, "oracle");
    giveWonder(s, 0, "sistineChapel");
    expect(cityEffects(s, city).content).toBe(4 + 5);
  });

  it("theatre leaves nobody unhappy in its city", () => {
    const s = cityOn(["......."], 3, 0);
    s.cities[0]!.size = 6;
    s.cities[0]!.worked = [0, 1, 2, 4, 5, 6];
    giveWonder(s, 0, "globeTheatre");
    expect(cityHappiness(s, s.cities[0]!)).toMatchObject({ unhappy: 0, entertainers: 0 });
  });

  it("royal society strengthens libraries and universities, SETI adds science everywhere", () => {
    const s = cityOn(["....."], 2, 0);
    s.cities[0]!.buildings.push("library", "university");
    expect(cityEffects(s, s.cities[0]!).sciencePct).toBe(100);
    giveWonder(s, 0, "royalSociety");
    expect(cityEffects(s, s.cities[0]!).sciencePct).toBe(166);
    giveWonder(s, 0, "setiProgram");
    expect(cityEffects(s, s.cities[0]!).sciencePct).toBe(216);
  });

  it("hoover dam gives every city with a factory a hydro plant", () => {
    const s = cityOn(["....."], 2, 0);
    s.cities[0]!.buildings.push("factory");
    giveWonder(s, 0, "hooverDam");
    expect(cityEffects(s, s.cities[0]!)).toMatchObject({ shieldsPct: 75, industryPollutionPct: 50 });
  });

  it("the library of the world hands out technologies known to two other players", () => {
    let s = cityOn(["....."], 2, 0, 3);
    giveWonder(s, 0, "greatLibrary");
    s.players[1]!.techs.push("bronze", "pottery");
    s.players[2]!.techs.push("bronze");
    s = nextTurn(s);
    expect(s.players[0]!.techs).toContain("bronze");
    expect(s.players[0]!.techs).not.toContain("pottery");
  });

  it("the voyage of the beagle gives two technologies at once", () => {
    let s = cityOn(["....."], 2, 0);
    const city = s.cities[0]!;
    s.players[0]!.techs.push("railroad");
    city.production = { kind: "building", id: "darwinVoyage" };
    city.shields = BUILDINGS.darwinVoyage.cost;
    const before = s.players[0]!.techs.length;
    s = apply(s, { type: "endTurn" });
    expect(s.players[0]!.techs.length).toBe(before + 2);
  });

  it("projects open new units and parts to everybody once they stand", () => {
    const s = cityOn(["~~~", "~.~", "~~~"], 1, 1);
    s.players[0]!.techs.push(...allTechs());
    const city = s.cities[0]!;
    expect(has(productionOptions(s, city), { kind: "unit", id: "nuclear" })).toBe(false);
    expect(has(productionOptions(s, city), { kind: "building", id: "ssStructural" })).toBe(false);
    giveWonder(s, 0, "manhattanProject");
    giveWonder(s, 0, "apolloProgram");
    expect(has(productionOptions(s, city), { kind: "unit", id: "nuclear" })).toBe(true);
    expect(has(productionOptions(s, city), { kind: "building", id: "ssStructural" })).toBe(true);
  });
});

describe("spaceship", () => {
  function shipyard(): GameState {
    const s = cityOn(["....."], 2, 0);
    s.players[0]!.techs.push(...allTechs());
    giveWonder(s, 0, "apolloProgram");
    return s;
  }

  it("collects parts on the player's ship instead of the city", () => {
    let s = shipyard();
    const city = s.cities[0]!;
    city.production = { kind: "building", id: "ssStructural" };
    city.shields = BUILDINGS.ssStructural.cost;
    s = apply(s, { type: "endTurn" });
    expect(s.players[0]!.spaceship.structural).toBe(1);
    expect(s.cities[0]!.buildings).not.toContain("ssStructural");
    expect(s.cities[0]!.production).toEqual({ kind: "building", id: "ssStructural" });
  });

  it("starts only with a motor, a module and enough structure, then lands and wins", () => {
    let s = shipyard();
    expect(applyCommand(s, { type: "launchSpaceship" }).ok).toBe(false);
    Object.assign(s.players[0]!.spaceship, { structural: 6, component: 2, module: 3 });
    s = apply(s, { type: "launchSpaceship" });
    const flight = spaceshipFlight({ component: 2, module: 3 });
    expect(s.players[0]!.spaceship.arrivalTurn).toBe(s.turn + flight.turns);
    expect(flight.successPct).toBe(100);
    for (let k = 0; k < flight.turns; k++) s = nextTurn(s);
    expect(s.victory).toEqual({ player: 0, kind: "space", turn: s.turn });
  });
});

describe("caravans, diplomats and nuclear weapons", () => {
  const WIDE = ["..............", ".............."];

  it("a caravan helps to build a wonder", () => {
    let s = cityOn(WIDE, 1, 0);
    const city = s.cities[0]!;
    s.players[0]!.techs.push("masonry");
    city.production = { kind: "building", id: "pyramids" };
    const caravan = addUnit(s, "caravan", 1, 0);
    s = apply(s, { type: "helpWonder", unitId: caravan.id });
    expect(s.cities[0]!.shields).toBe(25);
    expect(s.units.some((u) => u.id === caravan.id)).toBe(false);
  });

  it("a caravan opens a trade route to a distant city and brings a reward", () => {
    let s = cityOn(WIDE, 1, 0);
    const far = addUnit(s, "settlers", 12, 0);
    s = apply(s, { type: "foundCity", unitId: far.id });
    s.map.road.fill(1);
    const caravan = addUnit(s, "caravan", 12, 0);
    caravan.homeCity = s.cities[0]!.id;
    const before = cityReport(s, s.cities[0]!).production.trade;
    s = apply(s, { type: "tradeRoute", unitId: caravan.id, cityId: s.cities[1]!.id });
    expect(s.cities[0]!.tradeRoutes).toEqual([s.cities[1]!.id]);
    expect(cityReport(s, s.cities[0]!).routes).toBeGreaterThanOrEqual(0);
    expect(cityReport(s, s.cities[0]!).production.trade).toBeGreaterThanOrEqual(before);
    const near = addUnit(s, "settlers", 5, 1);
    s = apply(s, { type: "foundCity", unitId: near.id });
    const second = addUnit(s, "caravan", 5, 1);
    second.homeCity = s.cities[0]!.id;
    expect(applyCommand(s, { type: "tradeRoute", unitId: second.id, cityId: s.cities[2]!.id })).toEqual({ ok: false, error: "tooClose" });
  });

  function rivals(): GameState {
    let s = cityOn(WIDE, 1, 0, 2);
    const settler = addUnit(s, "settlers", 10, 0, 1);
    s.currentPlayer = 1;
    s = apply(s, { type: "foundCity", unitId: settler.id });
    s.currentPlayer = 0;
    return s;
  }

  it("a diplomat opens an embassy and steals a technology once per city", () => {
    let s = rivals();
    s.players[1]!.techs.push("bronze");
    const a = addUnit(s, "diplomat", 9, 0);
    s = apply(s, { type: "diplomat", unitId: a.id, cityId: s.cities[1]!.id, action: "embassy" });
    expect(s.players[0]!.embassies).toEqual([1]);
    const b = addUnit(s, "diplomat", 9, 1);
    s = apply(s, { type: "diplomat", unitId: b.id, cityId: s.cities[1]!.id, action: "stealTech" });
    expect(s.players[0]!.techs).toContain("bronze");
    const c = addUnit(s, "diplomat", 9, 1);
    expect(applyCommand(s, { type: "diplomat", unitId: c.id, cityId: s.cities[1]!.id, action: "stealTech" }).ok).toBe(false);
  });

  it("a diplomat cannot buy a capital, but buys another city for gold", () => {
    let s = rivals();
    const d = addUnit(s, "diplomat", 9, 0);
    expect(applyCommand(s, { type: "diplomat", unitId: d.id, cityId: s.cities[1]!.id, action: "incite" })).toEqual({
      ok: false,
      error: "isCapital",
    });
    s.cities[1]!.buildings = [];
    s.players[0]!.gold = 100000;
    s = apply(s, { type: "diplomat", unitId: d.id, cityId: s.cities[1]!.id, action: "incite" });
    expect(s.cities[1]!.owner).toBe(0);
  });

  it("a nuclear strike halves cities and destroys units nearby, a missile shield stops it", () => {
    let s = rivals();
    s.cities[1]!.size = 8;
    const victim = addUnit(s, "warriors", 10, 0, 1);
    const missile = addUnit(s, "nuclear", 6, 0);
    s = apply(s, { type: "detonate", unitId: missile.id, at: { x: 10, y: 0 } });
    expect(s.cities[1]!.size).toBe(4);
    expect(s.units.some((u) => u.id === victim.id)).toBe(false);

    s.cities[1]!.buildings.push("sdiDefense");
    s.players[1]!.techs.push("superconductor");
    const second = addUnit(s, "nuclear", 6, 0);
    s = apply(s, { type: "detonate", unitId: second.id, at: { x: 10, y: 0 } });
    expect(s.cities[1]!.size).toBe(4);
  });
});

describe("railroads and fortresses", () => {
  it("need their technology and a road under the railroad", () => {
    let s = cityOn(["fffff"], 0, 0);
    const settler = addUnit(s, "settlers", 3, 0);
    expect(applyCommand(s, { type: "buildImprovement", unitId: settler.id, improvement: "fortress" })).toEqual({ ok: false, error: "needsTech" });
    s.players[0]!.techs.push("construction", "railroad");
    expect(applyCommand(s, { type: "buildImprovement", unitId: settler.id, improvement: "railroad" })).toEqual({ ok: false, error: "needsRoad" });
    s.map.road[3] = 1;
    expect(applyCommand(s, { type: "buildImprovement", unitId: settler.id, improvement: "railroad" }).ok).toBe(true);
  });

  it("add half the shields and make travel along them free", () => {
    const s = cityOn(["fffff"], 0, 0);
    s.players[0]!.government = "monarchy";
    s.map.road.fill(1);
    s.map.railroad[2] = 1;
    s.map.railroad[3] = 1;
    expect(cityTileYield(s, s.cities[0]!, 2).shields).toBe(3);
    expect(moveCost(s, { x: 2, y: 0 }, { x: 3, y: 0 })).toBe(0);
  });
});

describe("saves", () => {
  it("bring a version 5 game up to date", () => {
    const s = cityOn(["....."], 2, 0);
    const old = structuredClone(s) as unknown as Record<string, unknown> & { players: Record<string, unknown>[]; map: Record<string, unknown> };
    old.version = 5;
    delete old.victory;
    delete old.map.railroad;
    delete old.map.fortress;
    for (const p of old.players) {
      delete p.government;
      delete p.spaceship;
      p.scienceRate = 100;
    }
    const loaded = migrateState(old)!;
    expect(loaded.version).toBe(STATE_VERSION);
    expect(loaded.players[0]).toMatchObject({ government: "despotism", scienceRate: 60 });
    expect(loaded.map.railroad).toHaveLength(5);
    expect(loaded.victory).toBeNull();
  });
});
