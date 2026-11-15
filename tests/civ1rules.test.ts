import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  bestWorkerTask,
  BUILDINGS,
  cityHappiness,
  cityReport,
  cityTileYield,
  contentLimit,
  RULES,
  tileYield,
  type City,
  type GameEvent,
  type GameState,
  workableTiles,
} from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

const GRASS = Array.from({ length: 9 }, () => ".........");

function cityOn(rows: string[], x: number, y: number, players = 1): GameState {
  const s = stateFromAscii(rows, players);
  const settler = addUnit(s, "settlers", x, y);
  return apply(s, { type: "foundCity", unitId: settler.id });
}

/** Ends turns until it is player 0's turn again, collecting the events. */
function nextTurn(s: GameState, events: GameEvent[] = []): GameState {
  do {
    const r = applyCommand(s, { type: "endTurn" });
    if (!r.ok) throw new Error(r.error);
    events.push(...r.events);
    s = r.state;
  } while (s.currentPlayer !== 0);
  return s;
}

/** A city of the given size working tiles chosen by hand, so no entertainers appear on their own. */
function bigCity(size: number): { s: GameState; city: City } {
  const s = cityOn(GRASS, 4, 4);
  const city = s.cities[0]!;
  city.size = size;
  city.worked = workableTiles(s, city).slice(0, size);
  city.manualTiles = true;
  return { s, city };
}

describe("happy citizens and celebrations", () => {
  it("make content citizens happy once nobody is unhappy", () => {
    const s = cityOn(GRASS, 4, 4);
    s.map.road.fill(1);
    const city = s.cities[0]!;
    city.size = 3;
    city.worked = workableTiles(s, city).slice(0, 3);
    s.players[0]!.government = "monarchy";
    s.players[0]!.scienceRate = 0;
    s.players[0]!.luxuryRate = 70;
    const r = cityReport(s, city);
    expect(r.luxury).toBeGreaterThan(0);
    expect(r.happiness.happy).toBe(Math.min(3, Math.floor(r.luxury / RULES.luxuryPerContent)));
  });

  it("calm the unhappy before anyone gets happy", () => {
    const { s, city } = bigCity(6);
    s.players[0]!.luxuryRate = 0;
    const before = cityHappiness(s, city);
    expect(before.unhappy).toBe(2);
    expect(before.happy).toBe(0);
    s.map.road.fill(1);
    s.players[0]!.scienceRate = 0;
    s.players[0]!.luxuryRate = 60;
    const after = cityHappiness(s, city);
    expect(after.unhappy).toBeLessThan(2);
    if (after.happy > 0) expect(after.unhappy).toBe(0);
  });

  it("count disorder only when the unhappy outnumber the content and happy together", () => {
    const { s, city } = bigCity(8);
    expect(cityHappiness(s, city).disorder).toBe(false); // 4 content, 4 unhappy
    city.size = 9;
    city.worked.push(city.worked[city.worked.length - 1]! + 1);
    expect(cityHappiness(s, city).disorder).toBe(true); // 4 content, 5 unhappy
  });

  it("start a celebration that gives a monarchy more trade the next turn", () => {
    let s = cityOn(GRASS, 4, 4);
    s.map.road.fill(1);
    s.cities[0]!.size = 3;
    s.cities[0]!.worked = workableTiles(s, s.cities[0]!).slice(0, 3);
    s.players[0]!.government = "monarchy";
    // More than a monarchy allows, set directly to get enough luxuries from a small city.
    s.players[0]!.scienceRate = 0;
    s.players[0]!.luxuryRate = 100;
    expect(cityHappiness(s, s.cities[0]!).celebrate).toBe(true);
    const tile = 3 * 9 + 3;
    const plain = cityTileYield(s, s.cities[0]!, tile).trade;
    const events: GameEvent[] = [];
    s = nextTurn(s, events);
    expect(events.some((e) => e.type === "celebrationStarted")).toBe(true);
    expect(s.cities[0]!.celebrating).toBe(true);
    expect(cityTileYield(s, s.cities[0]!, tile).trade).toBe(plain + 1);
  });

  it("let a celebrating city under a republic grow every turn while it has food to spare", () => {
    let s = cityOn(GRASS, 4, 4);
    s.map.road.fill(1);
    s.map.irrigation.fill(1);
    const city = s.cities[0]!;
    city.size = 3;
    city.celebrating = true;
    s.players[0]!.government = "republic";
    s.players[0]!.scienceRate = 0;
    s.players[0]!.luxuryRate = 80;
    expect(cityReport(s, city).happiness.celebrate).toBe(true);
    s = nextTurn(s);
    expect(s.cities[0]!.size).toBe(4);
    expect(s.cities[0]!.food).toBe(0);
  });

  it("never happen in anarchy", () => {
    const s = cityOn(GRASS, 4, 4);
    s.map.road.fill(1);
    s.cities[0]!.size = 3;
    s.players[0]!.government = "anarchy";
    expect(cityHappiness(s, s.cities[0]!).celebrate).toBe(false);
  });
});

describe("specialists", () => {
  it("can collect taxes or do research once the city is big enough", () => {
    const { s, city } = bigCity(6);
    city.worked.pop();
    s.players[0]!.luxuryRate = 0;
    expect(applyCommand(s, { type: "setSpecialists", cityId: city.id, taxmen: 2, scientists: 0 })).toEqual({ ok: false, error: "tooManySpecialists" });
    const before = cityReport(s, city);
    expect(before.happiness.entertainers).toBe(1);
    const taxed = apply(s, { type: "setSpecialists", cityId: city.id, taxmen: 1, scientists: 0 });
    const r = cityReport(taxed, taxed.cities[0]!);
    expect(r.happiness.taxmen).toBe(1);
    expect(r.happiness.entertainers).toBe(0);
    expect(r.gold - before.gold).toBe(Math.floor(RULES.specialistYield * (100 + BUILDINGS.palace.effects.goldPct!) / 100) || RULES.specialistYield);
    const research = apply(s, { type: "setSpecialists", cityId: city.id, taxmen: 0, scientists: 1 });
    expect(cityReport(research, research.cities[0]!).science).toBeGreaterThan(before.science);
  });

  it("are only entertainers in a small city", () => {
    const { s, city } = bigCity(4);
    city.worked.pop();
    expect(applyCommand(s, { type: "setSpecialists", cityId: city.id, taxmen: 1, scientists: 0 })).toEqual({ ok: false, error: "cityTooSmall" });
  });

  it("entertain with luxuries of their own", () => {
    const { s, city } = bigCity(6);
    s.players[0]!.luxuryRate = 0;
    city.worked.pop();
    expect(cityReport(s, city).luxury).toBe(RULES.specialistYield);
  });
});

describe("a large empire", () => {
  it("has fewer content citizens in every city", () => {
    const s = stateFromAscii(["." .repeat(60)]);
    const city = (n: number) => ({ ...structuredClone(s.cities[0]), id: n, owner: 0 }) as City;
    s.cities = [];
    const add = (n: number) => {
      for (let i = 0; i < n; i++) s.cities.push(city(i) as City);
    };
    add(RULES.empireSizeBase);
    expect(contentLimit(s, 0)).toBe(RULES.contentBase);
    add(1);
    expect(contentLimit(s, 0)).toBe(RULES.contentBase - 1);
    add(RULES.empireSizeStep);
    expect(contentLimit(s, 0)).toBe(RULES.contentBase - 2);
  });
});

describe("settlers", () => {
  it("clear a forest into plains and drain a swamp into grassland without water", () => {
    let s = stateFromAscii(["fff", "fff", "fff"]);
    s.map.terrain[8] = "swamp";
    const a = addUnit(s, "settlers", 1, 1);
    const b = addUnit(s, "settlers", 2, 2);
    s = apply(s, { type: "buildImprovement", unitId: a.id, improvement: "irrigation" });
    s = apply(s, { type: "buildImprovement", unitId: b.id, improvement: "irrigation" });
    for (let t = 0; t < 15; t++) s = nextTurn(s);
    expect(s.map.terrain[4]).toBe("plains");
    expect(s.map.terrain[8]).toBe("grassland");
    expect(s.map.irrigation[4]).toBe(0);
  });

  it("plant a forest with a mine on grassland", () => {
    let s = stateFromAscii(["...", "...", "..."]);
    const a = addUnit(s, "settlers", 1, 1);
    s = apply(s, { type: "buildImprovement", unitId: a.id, improvement: "mine" });
    for (let t = 0; t < 10; t++) s = nextTurn(s);
    expect(s.map.terrain[4]).toBe("forest");
  });

  it("working on their own never turn food into forest", () => {
    const s = cityOn(GRASS, 4, 4);
    const settler = addUnit(s, "settlers", 4, 4);
    const task = bestWorkerTask(s, settler);
    expect(task?.improvement).not.toBe("mine");
  });

  it("can join a city and add a citizen", () => {
    let s = cityOn(GRASS, 4, 4);
    const settler = addUnit(s, "settlers", 4, 4);
    s = apply(s, { type: "joinCity", unitId: settler.id });
    expect(s.cities[0]!.size).toBe(2);
    expect(s.units.some((u) => u.id === settler.id)).toBe(false);
    s.cities[0]!.size = RULES.maxCitySize;
    const another = addUnit(s, "settlers", 4, 4);
    expect(applyCommand(s, { type: "joinCity", unitId: another.id })).toEqual({ ok: false, error: "cityTooBig" });
  });

  it("clean polluted land, and cities nearby clean it on their own", () => {
    let s = cityOn(GRASS, 4, 4);
    const i = 4 * 9 + 5;
    s.map.pollution[i] = 1;
    expect(tileYield(s.map, i, false).food).toBe(1);
    const auto = addUnit(s, "settlers", 4, 4);
    expect(bestWorkerTask(s, auto)?.improvement).toBe("clean");
    const settler = addUnit(s, "settlers", 5, 4);
    s = apply(s, { type: "cleanPollution", unitId: settler.id });
    for (let t = 0; t < RULES.pollutionCleanTurns; t++) s = nextTurn(s);
    expect(s.map.pollution[i]).toBe(0);
  });
});

describe("selling buildings", () => {
  it("pays the building's price, once per city and turn", () => {
    let s = cityOn(GRASS, 4, 4);
    const city = s.cities[0]!;
    city.buildings.push("temple", "granary", "pyramids");
    const gold = s.players[0]!.gold;
    s = apply(s, { type: "sellBuilding", cityId: city.id, building: "temple" });
    expect(s.players[0]!.gold).toBe(gold + BUILDINGS.temple.cost);
    expect(s.cities[0]!.buildings).not.toContain("temple");
    expect(applyCommand(s, { type: "sellBuilding", cityId: city.id, building: "granary" })).toEqual({ ok: false, error: "alreadySold" });
    expect(applyCommand(s, { type: "sellBuilding", cityId: city.id, building: "pyramids" })).toEqual({ ok: false, error: "cannotSell" });
    expect(applyCommand(s, { type: "sellBuilding", cityId: city.id, building: "palace" })).toEqual({ ok: false, error: "cannotSell" });
    s = nextTurn(s);
    expect(applyCommand(s, { type: "sellBuilding", cityId: city.id, building: "granary" }).ok).toBe(true);
  });
});

describe("democracy", () => {
  it("falls into anarchy when a city stays in disorder", () => {
    const { s: start, city } = bigCity(10);
    let s = start;
    city.buildings.push("aqueduct");
    s.players[0]!.government = "democracy";
    s.players[0]!.luxuryRate = 0;
    s.players[0]!.scienceRate = 60;
    expect(cityHappiness(s, city).disorder).toBe(true);
    const events: GameEvent[] = [];
    for (let t = 0; t < 12 && s.players[0]!.government === "democracy"; t++) s = nextTurn(s, events);
    expect(events.some((e) => e.type === "governmentCollapsed")).toBe(true);
    expect(s.players[0]!.revolution?.target).toBe("democracy");
  });
});

describe("pollution", () => {
  it("lands on a tile around a dirty city", () => {
    const { s: start, city } = bigCity(8);
    let s = start;
    city.buildings.push("factory", "powerPlant");
    s.map.mine.fill(1);
    s.map.terrain = s.map.terrain.map(() => "hills");
    expect(cityReport(s, city).pollution.chancePct).toBeGreaterThan(0);
    const events: GameEvent[] = [];
    for (let t = 0; t < 20 && !events.some((e) => e.type === "tilePolluted"); t++) {
      // Hills feed nobody, so the city is kept at its size by hand.
      s.cities[0]!.size = 8;
      s.cities[0]!.food = 0;
      s.players[0]!.gold = 1000;
      s = nextTurn(s, events);
    }
    expect(s.map.pollution.some((p) => p === 1)).toBe(true);
  });

  it("brings global warming that turns land into desert and swamp", () => {
    let s = cityOn(["~~~~~~~~~", ...GRASS.slice(1)], 4, 4);
    s.map.pollution.fill(1, 9, 30);
    s.warming = RULES.warmingLimit - 1;
    const events: GameEvent[] = [];
    s = nextTurn(s, events);
    expect(events.some((e) => e.type === "globalWarming")).toBe(true);
    expect(s.warming).toBe(0);
    expect(s.map.terrain.some((t) => t === "desert")).toBe(true);
    expect(s.map.terrain.some((t) => t === "swamp")).toBe(true);
  });

  it("melts a nuclear plant in a city in disorder, until fusion power", () => {
    const { s: start, city } = bigCity(10);
    let s = start;
    city.buildings.push("aqueduct", "factory", "nuclearPlant");
    const events: GameEvent[] = [];
    for (let t = 0; t < 12 && !events.some((e) => e.type === "nuclearMeltdown"); t++) {
      s.cities[0]!.size = 10;
      s.cities[0]!.manualTiles = true;
      s = nextTurn(s, events);
    }
    expect(events.some((e) => e.type === "nuclearMeltdown")).toBe(true);
    expect(s.map.pollution.some((p) => p === 1)).toBe(true);
  });
});

describe("disasters", () => {
  it("strike now and then, and the right buildings keep every one of them away", () => {
    let s = cityOn(["~~~~~~~~~", ...GRASS.slice(1)], 4, 1);
    s.turn = RULES.disasterStartTurn;
    s.cities[0]!.size = 5;
    s.cities[0]!.buildings.push("aqueduct", "walls", "granary", "barracks", "temple");
    const events: GameEvent[] = [];
    for (let t = 0; t < 250; t++) {
      s.players[0]!.gold = 1000;
      s = nextTurn(s, events);
    }
    const prevented = events.filter((e) => e.type === "disasterPrevented");
    expect(prevented.length).toBeGreaterThan(0);
    expect(events.filter((e) => e.type === "disaster")).toEqual([]);

    let bare = cityOn(["~~~~~~~~~", ...GRASS.slice(1)], 4, 1);
    bare.turn = RULES.disasterStartTurn;
    const hit: GameEvent[] = [];
    for (let t = 0; t < 250; t++) bare = nextTurn(bare, hit);
    expect(hit.some((e) => e.type === "disaster")).toBe(true);
  });
});
