/**
 * What the AI's cities build. Defence comes first and has its own floor, as
 * in Freeciv. Settlers have their own rules, as in Unciv: only from cities
 * of size 2 and more, a few at a time, while there is land to settle. The
 * rest is buildings, picked by value against cost.
 */
import { BUILDINGS, RULES, UNIT_TYPES, type BuildingId, type City, type PlayerView, type ProductionItem, type UnitTypeId } from "../core";
import { coastal, isMilitary, isSettler } from "./knowledge";
import { nature } from "./research";
import { bestAttacker, isAttacker } from "./war";

export interface Plan {
  /** Good free sites on own land. */
  room: number;
  /** Good sites on islands. */
  islands: number;
  /** Own units that carry settlers over the sea. */
  ships: number;
  /** A military unit is out exploring, or nothing is left to explore. */
  exploring: boolean;
  /** Tiles of foreign military units the AI sees. */
  threats: { x: number; y: number }[];
  /** Attacking units the AI wants to have. */
  armyWanted: number;
}

function knows(view: PlayerView, tech: string | null): boolean {
  return tech === null || view.economy.techs.includes(tech as never);
}

function unitAvailable(view: PlayerView, id: UnitTypeId): boolean {
  const rule = UNIT_TYPES[id];
  if (!knows(view, rule.requires)) return false;
  if (rule.requiresWonder && !view.builtWonders.includes(rule.requiresWonder)) return false;
  return true;
}

/** The strongest defender the player can build on land, the cheaper one on a tie. */
export function bestDefender(view: PlayerView): UnitTypeId {
  let best: UnitTypeId = "warriors";
  for (const id of Object.keys(UNIT_TYPES) as UnitTypeId[]) {
    const rule = UNIT_TYPES[id];
    if (rule.domain !== "land" || rule.attack <= 0 || rule.special || !unitAvailable(view, id)) continue;
    const current = UNIT_TYPES[best];
    if (rule.defense > current.defense || (rule.defense === current.defense && rule.cost < current.cost)) best = id;
  }
  return best;
}

/** The cheapest ship that carries a settler. */
function transportShip(view: PlayerView): UnitTypeId | null {
  const ships = (Object.keys(UNIT_TYPES) as UnitTypeId[]).filter((id) => {
    const r = UNIT_TYPES[id];
    return r.domain === "sea" && (r.capacity ?? 0) > 0 && (r.carries ?? "land") === "land" && unitAvailable(view, id);
  });
  ships.sort((a, b) => UNIT_TYPES[a].cost - UNIT_TYPES[b].cost);
  return ships[0] ?? null;
}

export function canBuild(view: PlayerView, city: City, b: BuildingId): boolean {
  const rule = BUILDINGS[b];
  if (rule.spaceship || city.buildings.includes(b) || !knows(view, rule.requires)) return false;
  if (rule.requiresBuilding !== null && !city.buildings.includes(rule.requiresBuilding)) return false;
  if (rule.coastal && !coastal(view, city)) return false;
  if (rule.wonder && view.builtWonders.includes(b)) return false;
  if (rule.requiresWonder && !view.builtWonders.includes(rule.requiresWonder)) return false;
  if (rule.onePerPlayer) return false;
  return true;
}

/** Defenders standing in the city or on their way there. */
export function garrison(view: PlayerView, city: { x: number; y: number }): number {
  return view.units.filter(
    (u) => isMilitary(u) && ((u.x === city.x && u.y === city.y) || (u.goto?.x === city.x && u.goto?.y === city.y)),
  ).length;
}

/** Defenders the city wants: one, two in the capital, big cities and cities near enemies. */
export function garrisonNeed(view: PlayerView, city: City, plan: Plan): number {
  let need = city.buildings.includes("palace") || city.size >= 5 ? 2 : 1;
  if (plan.threats.some((t) => Math.max(Math.abs(t.x - city.x), Math.abs(t.y - city.y)) <= 3)) need += 1;
  if (nature(view) === "war") need += 0;
  return need;
}

/** How much a building is worth to this city now, before its cost. */
function buildingValue(view: PlayerView, city: City, b: BuildingId, plan: Plan): number {
  const n = nature(view);
  const threatened = plan.threats.some((t) => Math.max(Math.abs(t.x - city.x), Math.abs(t.y - city.y)) <= 4);
  const rule = BUILDINGS[b];
  if (rule.wonder) {
    // Wonders only in the biggest city of an empire that has some cities to spare.
    const biggest = view.cities.every((c) => c.size <= city.size);
    if (!biggest || view.cities.length < 4) return 0;
    const fits = n === "science" ? (rule.effects.sciencePct ?? 0) > 0 || rule.effects.techsFromOthers : (rule.effects.content ?? 0) > 0;
    return fits ? 30 : 12;
  }
  const big = city.size;
  switch (b) {
    case "granary":
      return big >= 3 ? 26 : 8;
    case "temple":
      return big >= RULES.contentBase - 1 ? 34 + 8 * (big - RULES.contentBase + 1) : 10;
    case "walls":
      return threatened ? 90 : n === "war" ? 18 : 10;
    case "barracks":
      return n === "war" ? 12 : 2;
    case "library":
      return (n === "science" ? 40 : 26) + big * 2;
    case "marketplace":
      return 22 + big * 3;
    case "harbour":
      return 26 + big * 2;
    case "courthouse":
      return city.buildings.includes("palace") ? 0 : 14;
    case "aqueduct":
      return big >= RULES.maxCitySize - 1 ? 90 : 0;
    case "amphitheater":
      return big >= 6 ? 34 : 4;
    case "cathedral":
      return big >= 8 ? 36 : 3;
    case "university":
      return (n === "science" ? 40 : 24) + big * 2;
    case "bank":
      return 18 + big * 2;
    case "factory":
      return big >= 7 ? 30 : 6;
    case "coastalFortress":
    case "sdiDefense":
      return 0;
    default:
      return 10;
  }
}

/** Settlers alive or in production. */
function settlersUnderway(view: PlayerView): number {
  const inField = view.units.filter((u) => isSettler(u) && !(u.orders?.kind === "auto")).length;
  const building = view.cities.filter((c) => c.production.kind === "unit" && UNIT_TYPES[c.production.id].foundsCity).length;
  return inField + building;
}

/** What the city should build now. */
export function chooseProduction(view: PlayerView, city: City, plan: Plan): ProductionItem {
  const defender = bestDefender(view);
  const cityCount = view.cities.length;
  const workers = view.units.filter((u) => isSettler(u) && u.orders?.kind === "auto").length;
  const n = nature(view);

  if (garrison(view, city) < garrisonNeed(view, city, plan)) return { kind: "unit", id: defender };

  // An explorer from the capital early on.
  if (!plan.exploring && city.buildings.includes("palace") && view.turn < 60) return { kind: "unit", id: "warriors" };

  const maxSettlers = n === "expansion" ? 3 : 2;
  const underway = settlersUnderway(view);
  const building = city.production.kind === "unit" && UNIT_TYPES[city.production.id].foundsCity;
  const wantsCities = plan.room + plan.islands > underway - (building ? 1 : 0);
  if (city.size >= 2 && wantsCities && (building || underway < maxSettlers) && cityCount < 16) return { kind: "unit", id: "settlers" };

  // A ship once the own land is nearly full: it looks for islands and carries settlers there.
  const ship = transportShip(view);
  if (plan.room <= 1 && plan.ships === 0 && ship && coastal(view, city) && city.size >= 2 && cityCount >= 3) {
    const otherBuilding = view.cities.some((c) => c.id !== city.id && c.production.kind === "unit" && c.production.id === ship);
    if (!otherBuilding) return { kind: "unit", id: ship };
  }

  // Settlers who improve the land: about one for every two cities.
  if (city.size >= 3 && workers + (building ? 1 : 0) < Math.ceil(cityCount / 2) && underway === 0) return { kind: "unit", id: "settlers" };

  // An army for the war, from cities big enough to spare the shields.
  const army = view.units.filter(isAttacker).length + view.cities.filter((c) => c.production.kind === "unit" && isAttacker({ type: c.production.id }) && c.id !== city.id).length;
  if (army < plan.armyWanted && city.size >= 3) return { kind: "unit", id: bestAttacker(view) };

  let best: { item: ProductionItem; priority: number } | null = null;
  for (const b of Object.keys(BUILDINGS) as BuildingId[]) {
    if (!canBuild(view, city, b)) continue;
    // Somebody else of ours is already building this wonder.
    if (BUILDINGS[b].wonder && view.cities.some((c) => c.id !== city.id && c.production.kind === "building" && c.production.id === b)) continue;
    const value = buildingValue(view, city, b, plan);
    if (value <= 0) continue;
    const priority = value / Math.sqrt(BUILDINGS[b].cost);
    if (!best || priority > best.priority) best = { item: { kind: "building", id: b }, priority };
  }
  if (best && best.priority > 1) return best.item;
  if (garrison(view, city) < garrisonNeed(view, city, plan) + 1) return { kind: "unit", id: defender };
  return best?.item ?? { kind: "wealth" };
}
