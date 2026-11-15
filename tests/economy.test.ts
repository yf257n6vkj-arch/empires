import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  BUILDINGS,
  buyCost,
  canResearch,
  cityEffects,
  cityHappiness,
  cityReport,
  growthThreshold,
  migrateState,
  playerView,
  productionOptions,
  researchCost,
  RULES,
  sameItem,
  STATE_VERSION,
  TECHS,
  UNIT_TYPES,
  type GameState,
  type ProductionItem,
} from "../src/core";
import { addUnit, stateFromAscii } from "./helpers";

const GRASS = [".......", ".......", ".......", ".......", "......."];

function cityState(rows = GRASS, x = 3, y = 2): GameState {
  const s = stateFromAscii(rows);
  const settler = addUnit(s, "settlers", x, y);
  return apply(s, { type: "foundCity", unitId: settler.id });
}

const has = (options: ProductionItem[], item: ProductionItem) => options.some((o) => sameItem(o, item));

describe("technologies", () => {
  it("only allows research whose prerequisites are known", () => {
    const s = cityState();
    const p = s.players[0]!;
    expect(canResearch(p, "bronze")).toBe(true);
    expect(canResearch(p, "iron")).toBe(false);
    expect(applyCommand(s, { type: "setResearch", tech: "iron" })).toEqual({ ok: false, error: "cannotResearch" });
    p.techs.push("bronze");
    expect(canResearch(p, "iron")).toBe(true);
    expect(canResearch(p, "bronze")).toBe(false);
  });

  it("every technology can be reached from the start", () => {
    const known: string[] = [];
    let progress = true;
    while (progress) {
      progress = false;
      for (const t of Object.values(TECHS)) {
        if (!known.includes(t.id) && t.requires.every((r) => known.includes(r))) {
          known.push(t.id);
          progress = true;
        }
      }
    }
    expect(known).toHaveLength(Object.keys(TECHS).length);
  });

  it("learns the chosen technology once enough science is collected", () => {
    let s = cityState();
    s = apply(s, { type: "setResearch", tech: "bronze" });
    s.players[0]!.research = researchCost(s.players[0]!) - 1;
    s.players[0]!.scienceRate = 100;
    const result = applyCommand(s, { type: "endTurn" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const p = result.state.players[0]!;
    expect(p.techs).toEqual(["bronze"]);
    expect(p.researching).toBeNull();
    expect(result.events.some((e) => e.type === "techLearned" && e.tech === "bronze")).toBe(true);
  });

  it("keeps science collected while nothing is being researched", () => {
    let s = cityState();
    s = apply(s, { type: "setScienceRate", rate: 100 });
    const science = cityReport(s, s.cities[0]!).science;
    expect(science).toBeGreaterThan(0);
    s = apply(s, { type: "endTurn" });
    expect(s.players[0]!.research).toBe(science);
  });

  it("makes technologies more expensive the more the player knows", () => {
    const s = cityState();
    const p = s.players[0]!;
    const first = researchCost(p);
    expect(first).toBe(Math.round(RULES.researchCostBase));
    p.techs.push(...(Object.keys(TECHS) as (keyof typeof TECHS)[]).slice(0, 10));
    expect(researchCost(p)).toBe(Math.round(RULES.researchCostBase + 10 * RULES.researchCostPerTech));
    expect(researchCost(p)).toBeGreaterThan(first);
  });

  it("unlocks units and hides those that are obsolete", () => {
    const s = cityState();
    const city = s.cities[0]!;
    expect(has(productionOptions(s, city), { kind: "unit", id: "spearmen" })).toBe(false);
    expect(has(productionOptions(s, city), { kind: "unit", id: "warriors" })).toBe(true);
    s.players[0]!.techs.push("bronze");
    expect(has(productionOptions(s, city), { kind: "unit", id: "spearmen" })).toBe(true);
    expect(has(productionOptions(s, city), { kind: "unit", id: "warriors" })).toBe(false);
    expect(applyCommand(s, { type: "setProduction", cityId: city.id, item: { kind: "unit", id: "tank" } })).toEqual({
      ok: false,
      error: "invalidProduction",
    });
  });

  it("needs a library before a university", () => {
    const s = cityState();
    const city = s.cities[0]!;
    s.players[0]!.techs.push(...(Object.keys(TECHS) as (keyof typeof TECHS)[]));
    expect(has(productionOptions(s, city), { kind: "building", id: "university" })).toBe(false);
    city.buildings.push("library");
    expect(has(productionOptions(s, city), { kind: "building", id: "university" })).toBe(true);
  });
});

describe("trade, science and gold", () => {
  it("splits trade by the slider and refuses odd rates", () => {
    let s = cityState();
    s.map.road.fill(1);
    s = apply(s, { type: "setScienceRate", rate: 100 });
    const all = cityReport(s, s.cities[0]!);
    expect(all.gold).toBe(0);
    s = apply(s, { type: "setScienceRate", rate: 0 });
    const none = cityReport(s, s.cities[0]!);
    expect(none.science).toBe(0);
    expect(none.gold).toBe(all.science);
    expect(applyCommand(s, { type: "setScienceRate", rate: 55 })).toEqual({ ok: false, error: "invalidRate" });
    expect(applyCommand(s, { type: "setScienceRate", rate: 110 })).toEqual({ ok: false, error: "invalidRate" });
  });

  it("adds the library bonus to science", () => {
    let s = cityState();
    s.map.road.fill(1);
    s.cities[0]!.size = 3;
    s = apply(s, { type: "setScienceRate", rate: 100 });
    s = apply(s, { type: "endTurn" });
    const before = cityReport(s, s.cities[0]!).science;
    s.cities[0]!.buildings.push("library");
    expect(cityReport(s, s.cities[0]!).science).toBe(Math.floor(before * 1.5));
  });

  it("pays building upkeep and sells a building when gold runs out", () => {
    let s = cityState();
    s = apply(s, { type: "setScienceRate", rate: 100 });
    s.cities[0]!.buildings.push("temple", "amphitheater");
    s.players[0]!.gold = 0;
    const result = applyCommand(s, { type: "endTurn" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.cities[0]!.buildings).toEqual(["palace", "temple"]);
    expect(result.events.some((e) => e.type === "buildingSold" && e.building === "amphitheater")).toBe(true);
    expect(result.state.players[0]!.gold).toBeGreaterThanOrEqual(0);
  });

  it("charges more to buy from nothing and lets the city finish next turn", () => {
    let s = cityState();
    const city = s.cities[0]!;
    const fromNothing = buyCost(city);
    city.shields = 1;
    const started = buyCost(city);
    expect(fromNothing).toBeGreaterThan(started * 1.5);
    s.players[0]!.gold = 5;
    expect(applyCommand(s, { type: "buy", cityId: city.id })).toEqual({ ok: false, error: "notEnoughGold" });
    s.players[0]!.gold = 1000;
    s = apply(s, { type: "buy", cityId: city.id });
    expect(s.players[0]!.gold).toBe(1000 - started);
    expect(applyCommand(s, { type: "buy", cityId: city.id })).toEqual({ ok: false, error: "alreadyComplete" });
    s = apply(s, { type: "endTurn" });
    expect(s.units.some((u) => u.type === "warriors")).toBe(true);
  });
});

describe("happiness", () => {
  it("keeps the first citizens content and the rest unhappy", () => {
    const s = cityState();
    const city = s.cities[0]!;
    city.size = RULES.contentBase + 2;
    city.worked = Array.from({ length: city.size }, (_, i) => i);
    const h = cityHappiness(s, city);
    expect(h.unhappy).toBe(2);
    expect(h.disorder).toBe(false);
  });

  it("uses entertainers to avoid disorder and a temple makes them unnecessary", () => {
    let s = cityState();
    const city = s.cities[0]!;
    city.size = RULES.contentBase + 5;
    s.players[0]!.gold = 100;
    s = apply(s, { type: "endTurn" });
    const busy = s.cities[0]!;
    const h = cityHappiness(s, busy);
    expect(h.disorder).toBe(false);
    expect(h.entertainers).toBeGreaterThan(0);
    busy.buildings.push("temple");
    s = apply(s, { type: "endTurn" });
    expect(cityHappiness(s, s.cities[0]!).entertainers).toBe(0);
  });

  it("produces nothing in disorder", () => {
    const s = cityState();
    const city = s.cities[0]!;
    city.size = 12;
    city.worked = s.map.terrain.map((_, i) => i).filter((i) => i !== 17).slice(0, 12);
    const report = cityReport(s, city);
    expect(report.happiness.disorder).toBe(true);
    expect(report.shieldSurplus).toBe(0);
    expect(report.science + report.gold).toBe(0);
  });

  it("lets soldiers in the city calm unhappy citizens", () => {
    const s = cityState();
    const city = s.cities[0]!;
    city.size = RULES.contentBase + 2;
    city.worked = Array.from({ length: city.size }, (_, i) => i);
    addUnit(s, "warriors", city.x, city.y);
    expect(cityHappiness(s, city).unhappy).toBe(1);
  });
});

describe("buildings and wonders", () => {
  it("stops growth at the size limit until there is an aqueduct", () => {
    let s = cityState();
    const city = s.cities[0]!;
    city.size = RULES.maxCitySize;
    city.food = growthThreshold(city.size) - 1;
    city.buildings.push("temple", "amphitheater");
    s.players[0]!.gold = 100;
    let result = applyCommand(s, { type: "endTurn" });
    expect(result.ok && result.state.cities[0]!.size).toBe(RULES.maxCitySize);
    expect(result.ok && result.events.some((e) => e.type === "cityAtMaxSize")).toBe(true);
    s.cities[0]!.buildings.push("aqueduct");
    result = applyCommand(s, { type: "endTurn" });
    expect(result.ok && result.state.cities[0]!.size).toBe(RULES.maxCitySize + 1);
  });

  it("lets a wonder be built only once and spreads an empire-wide effect", () => {
    let s = cityState(["...........", "...........", "..........."], 2, 1);
    const second = addUnit(s, "settlers", 7, 1);
    s = apply(s, { type: "foundCity", unitId: second.id });
    s.players[0]!.techs.push("ceremonies", "writing", "mysticism");
    const [a, b] = s.cities;
    s = apply(s, { type: "setProduction", cityId: a!.id, item: { kind: "building", id: "stoneCircle" } });
    s = apply(s, { type: "setProduction", cityId: b!.id, item: { kind: "building", id: "stoneCircle" } });
    s.cities[0]!.shields = BUILDINGS.stoneCircle.cost;
    s = apply(s, { type: "endTurn" });
    expect(s.cities[0]!.buildings).toContain("stoneCircle");
    expect(cityEffects(s, s.cities[1]!).content).toBe(1);
    expect(has(productionOptions(s, s.cities[1]!), { kind: "building", id: "stoneCircle" })).toBe(false);
    s = apply(s, { type: "endTurn" });
    expect(s.cities[1]!.production.kind).toBe("unit");
  });

  it("shows the player's economy and built wonders in the player view", () => {
    const s = cityState();
    s.cities[0]!.buildings.push("stoneCircle");
    s.players[0]!.gold = 42;
    const view = playerView(s, 0);
    expect(view.economy.gold).toBe(42);
    expect(view.economy.researchCost).toBe(researchCost(s.players[0]!));
    expect(view.builtWonders).toEqual(["stoneCircle"]);
  });

  it("factory adds half of the shields", () => {
    let s = cityState(["hhhhhhh", "hhhhhhh", "hhh.hhh", "hhhhhhh", "hhhhhhh"]);
    s.map.mine.fill(1);
    s.cities[0]!.size = 3;
    s = apply(s, { type: "endTurn" });
    const before = cityReport(s, s.cities[0]!).shieldSurplus;
    s.cities[0]!.buildings.push("factory");
    expect(cityReport(s, s.cities[0]!).shieldSurplus).toBe(Math.floor(before * 1.5));
  });
});

describe("saved games", () => {
  it("upgrades a version 2 save with an empty economy", () => {
    const s = cityState();
    const old = JSON.parse(JSON.stringify(s));
    old.version = 2;
    for (const p of old.players) {
      delete p.techs;
      delete p.researching;
      delete p.research;
      delete p.gold;
      delete p.scienceRate;
    }
    const migrated = migrateState(old)!;
    expect(migrated.version).toBe(STATE_VERSION);
    expect(migrated.players[0]).toMatchObject({ techs: [], researching: null, gold: RULES.startingGold });
    expect(migrateState({ version: 1 })).toBeNull();
  });

  it("every unit type has a technology or is known from the start", () => {
    for (const u of Object.values(UNIT_TYPES)) expect(u.requires === null || u.requires in TECHS).toBe(true);
  });
});
