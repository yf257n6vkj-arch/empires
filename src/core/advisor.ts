/**
 * The advisor: short tips on what to do next, for a player who is still
 * learning the game. It reads only the player's own cities, units and
 * treasury, which the player sees anyway, and changes nothing.
 *
 * Tips come ordered by urgency. The screen turns the codes into words.
 */
import { cityReport } from "./city";
import { buildingUpkeep, canBuild, knowsTech, researchableTechs } from "./economy";
import { BUILDINGS, UNIT_TYPES, type BuildingId } from "./rules";
import type { CityId, GameState, PlayerId, UnitId } from "./state";

export type Advice =
  | { kind: "foundFirstCity"; unitId: UnitId }
  | { kind: "chooseResearch" }
  | { kind: "cityInDisorder"; cityId: CityId }
  | { kind: "cityStarving"; cityId: CityId }
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

function isMilitary(type: keyof typeof UNIT_TYPES): boolean {
  const rule = UNIT_TYPES[type];
  return rule.domain === "land" && rule.defense > 0 && !rule.buildsImprovements && !rule.special;
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
  if (me.researching === null && researchableTechs(me).length > 0) tips.push({ kind: "chooseResearch" });

  const reports = new Map(cities.map((c) => [c.id, cityReport(state, c)]));
  for (const c of cities) if (reports.get(c.id)!.happiness.disorder) tips.push({ kind: "cityInDisorder", cityId: c.id });
  for (const c of cities) if (reports.get(c.id)!.foodSurplus < 0) tips.push({ kind: "cityStarving", cityId: c.id });

  const net = cities.reduce((n, c) => n + reports.get(c.id)!.gold, 0) - buildingUpkeep(state, player);
  if (net < 0 && me.gold + net * 5 < 0) tips.push({ kind: "goldRunningOut", perTurn: net, turnsLeft: Math.max(0, Math.floor(me.gold / -net)) });

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

  if (me.gold >= PLENTY_OF_GOLD) {
    const target = cities.find((c) => c.production.kind === "building" && c.shields < 0.6 * BUILDINGS[c.production.id].cost);
    if (target) tips.push({ kind: "spendGold", cityId: target.id });
  }

  const waiting = units.filter((u) => u.movesLeft > 0 && !u.goto && !u.fortified && !u.work && !u.orders && u.carriedBy === null);
  if (waiting.length > 0) tips.push({ kind: "unitsWaiting", count: waiting.length, unitId: waiting[0]!.id });

  if (tips.length === 0) tips.push({ kind: "allDone" });
  return tips;
}
