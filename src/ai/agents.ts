/**
 * Caravans and diplomats, the AI's peaceful agents.
 *
 * Caravans carry shields to the city that builds a wonder, or open trade
 * routes to cities far enough away. Diplomats open embassies with nations
 * the AI knows, and at war they steal technologies from enemy cities.
 */
import { BUILDINGS, distance, neighbors8, RULES, UNIT_TYPES, type City, type Command, type PlayerView, type Point, type ProductionItem, type Unit } from "../core";
import { at, isLand, pointOf } from "./knowledge";

const same = (a: Point | null | undefined, b: Point) => !!a && a.x === b.x && a.y === b.y;

function knows(view: PlayerView, tech: string | null): boolean {
  return tech === null || view.economy.techs.includes(tech as never);
}

function isCaravan(u: Pick<Unit, "type">): boolean {
  return UNIT_TYPES[u.type].special === "caravan";
}

function isDiplomat(u: Pick<Unit, "type">): boolean {
  return UNIT_TYPES[u.type].special === "diplomat";
}

function isWonder(c: City): boolean {
  return c.production.kind === "building" && BUILDINGS[c.production.id].wonder;
}

/** Cities a caravan from `home` can open a trade route to: own ones and those of nations at peace. */
function routeTargets(view: PlayerView, home: City, land: Int32Array): City[] {
  if (home.tradeRoutes.length >= RULES.tradeRoutesPerCity) return [];
  const peaceful = new Set(view.rivals.filter((r) => !r.atWar && r.contact).map((r) => r.id));
  return [...view.cities, ...view.foreignCities.filter((c) => peaceful.has(c.owner))].filter(
    (c) =>
      c.id !== home.id &&
      distance(home, c) >= RULES.tradeRouteMinDistance &&
      !home.tradeRoutes.includes(c.id) &&
      land[at(view, c)] === land[at(view, home)],
  );
}

/** Caravans and diplomats on their way or being built. */
function agents(view: PlayerView, test: (u: Pick<Unit, "type">) => boolean): number {
  return view.units.filter(test).length + view.cities.filter((c) => c.production.kind === "unit" && test({ type: c.production.id })).length;
}

/** Diplomats the AI keeps: one while some known nation has no embassy or an enemy has techs to steal. */
function diplomatsWanted(view: PlayerView): number {
  const work = view.rivals.some((r) => r.contact && !r.barbarian && !r.defeated && (r.embassy === null || r.atWar));
  return work ? 1 : 0;
}

/**
 * What a city might build for these agents: caravans for a wonder elsewhere or
 * for a trade route, a diplomat when there is diplomatic work. Null otherwise.
 */
export function agentProduction(view: PlayerView, city: City, land: Int32Array): ProductionItem | null {
  if (city.size < 3) return null;
  const caravanOk = knows(view, UNIT_TYPES.caravan.requires);
  const building = view.cities.find((c) => isWonder(c));
  // Up to two caravans help a wonder another city is building.
  if (caravanOk && building && building.id !== city.id && land[at(view, building)] === land[at(view, city)] && agents(view, isCaravan) < 2) return { kind: "unit", id: "caravan" };
  // A trade route from a city that has none yet, one caravan at a time.
  if (caravanOk && city.tradeRoutes.length === 0 && agents(view, isCaravan) === 0 && routeTargets(view, city, land).length > 0) return { kind: "unit", id: "caravan" };
  if (knows(view, UNIT_TYPES.diplomat.requires) && agents(view, isDiplomat) < diplomatsWanted(view) && city.buildings.includes("palace")) return { kind: "unit", id: "diplomat" };
  return null;
}

/** A free land tile next to a city, nearest the unit. */
function nextTo(view: PlayerView, u: Unit, c: City): Point | null {
  let best: Point | null = null;
  for (const i of neighbors8(view, at(view, c))) {
    if (!isLand(view, i)) continue;
    const p = pointOf(view, i);
    if (view.foreignUnits.some((f) => f.x === p.x && f.y === p.y)) continue;
    if (!best || distance(u, p) < distance(u, best)) best = p;
  }
  return best;
}

function goto(u: Unit, to: Point): Command[] {
  if (same(u.goto, to) || (u.x === to.x && u.y === to.y)) return [];
  return [{ type: "goto", unitId: u.id, to }];
}

export function caravanCommands(view: PlayerView, u: Unit, land: Int32Array): Command[] {
  if (u.movesLeft <= 0) return [];
  const wonder = view.cities.find((c) => isWonder(c) && land[at(view, c)] === land[at(view, u)]);
  if (wonder) {
    if (wonder.x === u.x && wonder.y === u.y) return [{ type: "helpWonder", unitId: u.id }];
    return goto(u, wonder);
  }
  const home = view.cities.find((c) => c.id === u.homeCity);
  const targets = home ? routeTargets(view, home, land) : [];
  // The farthest city brings the most; foreign ones count a little more.
  const target = targets.sort((a, b) => distance(home!, b) + (b.owner !== view.playerId ? 3 : 0) - (distance(home!, a) + (a.owner !== view.playerId ? 3 : 0)))[0];
  if (!target) return [{ type: "fortify", unitId: u.id }];
  if (distance(u, target) <= 1) return [{ type: "tradeRoute", unitId: u.id, cityId: target.id }];
  const spot = target.owner === view.playerId ? { x: target.x, y: target.y } : nextTo(view, u, target);
  return spot ? goto(u, spot) : [];
}

export function diplomatCommands(view: PlayerView, u: Unit, land: Int32Array): Command[] {
  if (u.movesLeft <= 0) return [];
  const reachable = view.foreignCities.filter((c) => land[at(view, c)] === land[at(view, u)]);
  const enemies = new Set(view.rivals.filter((r) => r.atWar && !r.barbarian).map((r) => r.id));
  const noEmbassy = new Set(view.rivals.filter((r) => r.contact && !r.barbarian && r.embassy === null).map((r) => r.id));
  // Stealing from an enemy city not robbed yet, else an embassy where there is none.
  const steal = reachable.filter((c) => enemies.has(c.owner) && !c.stolenBy.includes(view.playerId));
  const embassy = reachable.filter((c) => noEmbassy.has(c.owner));
  const pick = (list: City[]) => [...list].sort((a, b) => distance(u, a) - distance(u, b))[0];
  const target = pick(steal) ?? pick(embassy);
  if (!target) return [{ type: "fortify", unitId: u.id }];
  if (distance(u, target) <= 1) {
    const action = enemies.has(target.owner) && !target.stolenBy.includes(view.playerId) ? "stealTech" : "embassy";
    return [{ type: "diplomat", unitId: u.id, cityId: target.id, action }];
  }
  const spot = nextTo(view, u, target);
  return spot ? goto(u, spot) : [];
}

export { isCaravan, isDiplomat };
