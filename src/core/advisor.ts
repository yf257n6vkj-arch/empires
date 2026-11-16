/**
 * The advisor: short tips on what to do next, for a player who is still
 * learning the game. It reads only the player's own cities, units and
 * treasury, which the player sees anyway, and changes nothing.
 *
 * Tips come ordered by urgency. The screen turns the codes into words.
 */
import { cityReport, contentLimit } from "./city";
import { atWar, combatOdds, maxHp } from "./combat";
import { cityRadiusTiles, distance } from "./geometry";
import { idx } from "./world";
import { buildingUpkeep, canBuild, knowsTech, researchableTechs } from "./economy";
import { BUILDINGS, GOVERNMENTS, TECHS, UNIT_TYPES, type BuildingId, type GovernmentId, type TechId, type UnitTypeId } from "./rules";
import type { CityId, GameState, PlayerId, UnitId } from "./state";
import { visibleTiles } from "./view";

export type Advice =
  | { kind: "foundFirstCity"; unitId: UnitId }
  | { kind: "chooseResearch"; tech: TechId | null; leadsTo: TechId | null }
  | { kind: "enemyNearCity"; cityId: CityId; enemies: number; defenders: number; defender: UnitTypeId | null }
  | { kind: "captureCity"; unitId: UnitId; cityId: CityId }
  | { kind: "goodAttack"; unitId: UnitId; chancePct: number }
  | { kind: "woundedUnit"; unitId: UnitId }
  | { kind: "growthDisorder"; cityId: CityId; turns: number }
  | { kind: "revolution"; government: GovernmentId }
  | { kind: "explore"; unitId: UnitId }
  | { kind: "visitRuins"; unitId: UnitId; at: { x: number; y: number } }
  | { kind: "buildWonder"; cityId: CityId; building: BuildingId }
  | { kind: "cityInDisorder"; cityId: CityId }
  | { kind: "cityStarving"; cityId: CityId }
  | { kind: "cleanPollution"; cityId: CityId }
  | { kind: "goldRunningOut"; perTurn: number; turnsLeft: number }
  | { kind: "defendCity"; cityId: CityId }
  | { kind: "idleSettler"; unitId: UnitId }
  | { kind: "buildSettlers"; cityId: CityId }
  | { kind: "needsAqueduct"; cityId: CityId }
  | { kind: "buildBuilding"; cityId: CityId; building: BuildingId }
  | { kind: "spendGold"; cityId: CityId }
  | { kind: "unitsWaiting"; count: number; unitId: UnitId }
  | { kind: "allDone" };

/** Buildings worth suggesting, in the order a beginner should get them. */
const GOOD_BUILDINGS: BuildingId[] = ["granary", "temple", "library", "marketplace", "harbour", "aqueduct", "university", "bank"];
/** The advisor wants this many cities before it stops asking for settlers. */
const WANTED_CITIES = 6;
/** Gold the advisor thinks is too much to sit on. */
const PLENTY_OF_GOLD = 250;
/** Technologies a beginner gets the most out of, in order. */
const GOOD_TECHS: TechId[] = ["bronze", "alphabet", "ceremonies", "pottery", "writing", "codeOfLaws", "monarchy", "currency", "masonry", "mathematics", "trade", "philosophy", "literacy", "astronomy", "university", "banking", "navigation", "invention", "gunpowder"];
/** Governments the advisor suggests leaving despotism for, best first. */
const BETTER_GOVERNMENTS: GovernmentId[] = ["monarchy"];
/** Enemy units this close to a city are a threat. */
const THREAT_RANGE = 3;
/** The advisor suggests attacks with at least this chance. */
const GOOD_ODDS = 0.7;
/** Ruins this close to a free unit are worth the detour. */
const RUINS_RANGE = 6;
/** Until this turn the advisor reminds the player to explore. */
const EXPLORE_UNTIL = 40;

/** The next technology the advisor suggests, and the goal it leads to when it unlocks little itself. */
export function suggestTech(state: GameState, player: PlayerId): { tech: TechId | null; leadsTo: TechId | null } {
  const me = state.players[player];
  if (!me) return { tech: null, leadsTo: null };
  const open = researchableTechs(me);
  if (open.length === 0) return { tech: null, leadsTo: null };
  for (const goal of GOOD_TECHS) {
    if (!(goal in TECHS) || knowsTech(me, goal)) continue;
    if (open.includes(goal)) return { tech: goal, leadsTo: null };
    // The first missing step towards the goal.
    const path = (t: TechId): TechId | null => {
      if (open.includes(t)) return t;
      for (const r of TECHS[t].requires) if (!knowsTech(me, r)) return path(r);
      return null;
    };
    const step = path(goal);
    if (step) return { tech: step, leadsTo: goal };
  }
  return { tech: open[0]!, leadsTo: null };
}

function isMilitary(type: keyof typeof UNIT_TYPES): boolean {
  const rule = UNIT_TYPES[type];
  return rule.domain === "land" && rule.defense > 0 && !rule.buildsImprovements && !rule.special;
}

/** The strongest defender the player can build now, for the advice to defend a city. */
function defenderFor(state: GameState, player: PlayerId): UnitTypeId | null {
  const me = state.players[player]!;
  let best: UnitTypeId | null = null;
  for (const id of Object.keys(UNIT_TYPES) as UnitTypeId[]) {
    const u = UNIT_TYPES[id];
    if (!isMilitary(id) || !knowsTech(me, u.requires) || u.requiresWonder) continue;
    if (u.obsoleteBy && knowsTech(me, UNIT_TYPES[u.obsoleteBy].requires)) continue;
    if (!best || u.defense > UNIT_TYPES[best].defense || (u.defense === UNIT_TYPES[best].defense && u.cost < UNIT_TYPES[best].cost)) best = id;
  }
  return best;
}

/** All tips that apply now, most urgent first. */
export function advise(state: GameState, player: PlayerId): Advice[] {
  const me = state.players[player];
  if (!me) return [];
  const cities = state.cities.filter((c) => c.owner === player);
  const units = state.units.filter((u) => u.owner === player);
  const tips: Advice[] = [];

  const settlers = units.filter((u) => UNIT_TYPES[u.type].foundsCity);
  if (cities.length === 0 && settlers[0]) tips.push({ kind: "foundFirstCity", unitId: settlers[0].id });
  if (me.researching === null && researchableTechs(me).length > 0) tips.push({ kind: "chooseResearch", ...suggestTech(state, player) });

  // Danger first: enemies the player can see near their cities, and chances to strike back.
  const seen = visibleTiles(state, player);
  const enemies = state.units.filter((u) => u.owner !== player && atWar(state, player, u.owner) && seen[idx(state.map, u)] && UNIT_TYPES[u.type].attack > 0);
  const bestDefender = defenderFor(state, player);
  for (const c of cities) {
    const near = enemies.filter((e) => distance(e, c) <= THREAT_RANGE && UNIT_TYPES[e.type].domain !== "air").length;
    if (near === 0) continue;
    const defenders = units.filter((u) => u.x === c.x && u.y === c.y && isMilitary(u.type)).length;
    if (defenders < Math.min(3, near + 1)) tips.push({ kind: "enemyNearCity", cityId: c.id, enemies: near, defenders, defender: bestDefender });
  }
  const soldiers = units.filter((u) => isMilitary(u.type) || (UNIT_TYPES[u.type].attack > 0 && !UNIT_TYPES[u.type].special && !UNIT_TYPES[u.type].buildsImprovements));
  capture: for (const u of soldiers) {
    if (u.movesLeft <= 0 || UNIT_TYPES[u.type].domain !== "land") continue;
    for (const c of state.cities) {
      if (c.owner === player || !atWar(state, player, c.owner) || distance(u, c) !== 1 || !seen[idx(state.map, c)]) continue;
      if (state.units.some((e) => e.x === c.x && e.y === c.y)) continue;
      tips.push({ kind: "captureCity", unitId: u.id, cityId: c.id });
      break capture;
    }
  }
  let bestAttack: { unitId: UnitId; chance: number } | null = null;
  for (const u of soldiers) {
    if (u.movesLeft <= 0) continue;
    for (const e of enemies) {
      if (distance(u, e) !== 1) continue;
      const odds = combatOdds(state, u, e);
      if (odds && odds.winChance >= GOOD_ODDS && (!bestAttack || odds.winChance > bestAttack.chance)) bestAttack = { unitId: u.id, chance: odds.winChance };
    }
  }
  if (bestAttack) tips.push({ kind: "goodAttack", unitId: bestAttack.unitId, chancePct: Math.round(bestAttack.chance * 100) });

  const reports = new Map(cities.map((c) => [c.id, cityReport(state, c)]));
  for (const c of cities) if (reports.get(c.id)!.happiness.disorder) tips.push({ kind: "cityInDisorder", cityId: c.id });
  for (const c of cities) if (reports.get(c.id)!.foodSurplus < 0) tips.push({ kind: "cityStarving", cityId: c.id });
  // Pollution around a city that no settler is cleaning yet.
  const cleaning = new Set(units.filter((u) => u.work?.improvement === "clean").map((u) => idx(state.map, u)));
  for (const c of cities) {
    const dirty = cityRadiusTiles(state.map, c).some((i) => state.map.pollution[i] && !cleaning.has(i));
    if (dirty && !units.some((u) => u.orders?.kind === "auto")) tips.push({ kind: "cleanPollution", cityId: c.id });
  }

  const net = cities.reduce((n, c) => n + reports.get(c.id)!.gold, 0) - buildingUpkeep(state, player);
  if (net < 0 && me.gold + net * 5 < 0) tips.push({ kind: "goldRunningOut", perTurn: net, turnsLeft: Math.max(0, Math.floor(me.gold / -net)) });

  const inOwnCity = (p: { x: number; y: number }) => cities.some((c) => c.x === p.x && c.y === p.y);
  const wounded = soldiers.find((u) => u.hp < maxHp(u) / 2 && !inOwnCity(u) && !u.goto && u.carriedBy === null);
  if (wounded) tips.push({ kind: "woundedUnit", unitId: wounded.id });

  // A city that will grow into disorder soon.
  const limit = contentLimit(state, player);
  for (const c of cities) {
    const r = reports.get(c.id)!;
    const h = r.happiness;
    if (h.disorder || r.turnsToGrow === null || r.turnsToGrow > 3 || c.size >= r.maxSize) continue;
    if (c.size + 1 > limit && h.unhappy + 1 > h.happy) tips.push({ kind: "growthDisorder", cityId: c.id, turns: r.turnsToGrow });
  }

  if (me.government === "despotism" && !me.revolution && cities.length > 0) {
    const better = BETTER_GOVERNMENTS.find((g) => knowsTech(me, GOVERNMENTS[g].requires));
    if (better) tips.push({ kind: "revolution", government: better });
  }

  for (const c of cities) {
    const guarded = units.some((u) => u.x === c.x && u.y === c.y && isMilitary(u.type));
    const coming = c.production.kind === "unit" && isMilitary(c.production.id);
    if (!guarded && !coming) tips.push({ kind: "defendCity", cityId: c.id });
  }

  for (const u of settlers) {
    if (cities.length === 0) break;
    if (u.work || u.goto || u.orders || u.movesLeft <= 0) continue;
    tips.push({ kind: "idleSettler", unitId: u.id });
  }

  const makingSettlers = cities.some((c) => c.production.kind === "unit" && UNIT_TYPES[c.production.id].foundsCity);
  if (cities.length > 0 && cities.length < WANTED_CITIES && settlers.length === 0 && !makingSettlers) {
    const biggest = [...cities].sort((a, b) => b.size - a.size || a.id - b.id)[0]!;
    if (biggest.size >= 2) tips.push({ kind: "buildSettlers", cityId: biggest.id });
  }

  for (const c of cities) {
    const r = reports.get(c.id)!;
    if (c.size >= r.maxSize && r.foodSurplus > 0 && !c.buildings.includes("aqueduct")) tips.push({ kind: "needsAqueduct", cityId: c.id });
  }

  // One building idea: the first useful one some city could start.
  idea: for (const b of GOOD_BUILDINGS) {
    const needs = BUILDINGS[b].requires;
    if (needs && !knowsTech(me, needs)) continue;
    for (const c of cities) {
      if (c.size < 3 || c.buildings.includes(b)) continue;
      if (c.production.kind === "building") continue;
      if (canBuild(state, c, { kind: "building", id: b })) {
        tips.push({ kind: "buildBuilding", cityId: c.id, building: b });
        break idea;
      }
    }
  }

  // Early on: someone should look around.
  if (state.turn <= EXPLORE_UNTIL && cities.length > 0 && !soldiers.some((u) => !inOwnCity(u))) {
    const spare = cities
      .map((c) => units.filter((u) => u.x === c.x && u.y === c.y && isMilitary(u.type)))
      .find((here) => here.length >= 2);
    const scout = spare?.find((u) => u.movesLeft > 0);
    if (scout) tips.push({ kind: "explore", unitId: scout.id });
  }

  // Ruins the player knows of, close to a unit that could walk there.
  const ruins: { x: number; y: number }[] = [];
  for (let i = 0; i < state.map.ruins.length; i++) {
    if (state.map.ruins[i] && me.explored[i]) ruins.push({ x: i % state.map.width, y: Math.floor(i / state.map.width) });
  }
  let visit: { unitId: UnitId; at: { x: number; y: number }; d: number } | null = null;
  for (const u of soldiers) {
    if (u.movesLeft <= 0 || UNIT_TYPES[u.type].domain !== "land" || u.goto) continue;
    // A lone defender stays home.
    if (inOwnCity(u) && units.filter((x) => x.x === u.x && x.y === u.y && isMilitary(x.type)).length < 2) continue;
    for (const r of ruins) {
      const d = distance(u, r);
      if (d <= RUINS_RANGE && (!visit || d < visit.d)) visit = { unitId: u.id, at: r, d };
    }
  }
  if (visit) tips.push({ kind: "visitRuins", unitId: visit.unitId, at: visit.at });

  // A wonder for the biggest city that has nothing better to do.
  if (cities.length >= 3) {
    const biggest = [...cities].sort((a, b) => b.size - a.size || a.id - b.id)[0]!;
    const building = biggest.production.kind === "building" && BUILDINGS[biggest.production.id].wonder;
    if (biggest.size >= 5 && !building && !cities.some((c) => c.production.kind === "building" && BUILDINGS[c.production.id].wonder)) {
      const wonder = (Object.keys(BUILDINGS) as BuildingId[]).find((b) => BUILDINGS[b].wonder && !BUILDINGS[b].spaceship && canBuild(state, biggest, { kind: "building", id: b }));
      if (wonder) tips.push({ kind: "buildWonder", cityId: biggest.id, building: wonder });
    }
  }

  if (me.gold >= PLENTY_OF_GOLD) {
    const target = cities.find((c) => c.production.kind === "building" && c.shields < 0.6 * BUILDINGS[c.production.id].cost);
    if (target) tips.push({ kind: "spendGold", cityId: target.id });
  }

  const waiting = units.filter((u) => u.movesLeft > 0 && !u.goto && !u.fortified && !u.work && !u.orders && u.carriedBy === null);
  if (waiting.length > 0) tips.push({ kind: "unitsWaiting", count: waiting.length, unitId: waiting[0]!.id });

  if (tips.length === 0) tips.push({ kind: "allDone" });
  return tips;
}
