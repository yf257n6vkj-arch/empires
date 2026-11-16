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

/** Diplomats the AI keeps: one while some known nation has no embassy or an enemy has techs to steal, two while a city is worth a bribe. */
function diplomatsWanted(view: PlayerView, land: Int32Array): number {
  const capital = view.cities.find((c) => c.buildings.includes("palace")) ?? view.cities[0];
  const bribes = capital ? bribeCandidates(view, land, capital).length : 0;
  const work = bribes > 0 || view.rivals.some((r) => r.contact && !r.barbarian && !r.defeated && (r.embassy === null || r.atWar));
  return work ? (bribes > 0 ? 2 : 1) : 0;
}

/**
 * What a city might build for these agents: caravans for a wonder elsewhere or
 * for a trade route, a diplomat when there is diplomatic work. Null otherwise.
 */
export function agentProduction(view: PlayerView, city: City, land: Int32Array): ProductionItem | null {
  if (city.size < 3) return null;
  const caravanOk = knows(view, UNIT_TYPES.caravan.requires);
  const building = view.cities.find((c) => isWonder(c));
  // Caravans help a wonder another city is building: two at a time, or one from every
  // city for the Apollo Program, which opens the space race.
  const helpers = building && building.production.kind === "building" && building.production.id === "apolloProgram" ? Math.max(2, view.cities.length - 1) : 2;
  if (caravanOk && building && building.id !== city.id && land[at(view, building)] === land[at(view, city)] && agents(view, isCaravan) < helpers) return { kind: "unit", id: "caravan" };
  // A trade route from a city that has none yet, one caravan at a time.
  if (caravanOk && city.tradeRoutes.length === 0 && agents(view, isCaravan) === 0 && routeTargets(view, city, land).length > 0) return { kind: "unit", id: "caravan" };
  if (knows(view, UNIT_TYPES.diplomat.requires) && agents(view, isDiplomat) < diplomatsWanted(view, land) && city.buildings.includes("palace")) return { kind: "unit", id: "diplomat" };
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

/** Gold the AI keeps after paying a bribe. */
const BRIBE_RESERVE = 60;
/** Cities farther than this from the AI's own are not worth a bribe. */
const BRIBE_RANGE = 8;
/** Largest city the AI tries to bribe. */
const BRIBE_SIZE = 4;

/** True when the city is building something that a sabotage would hurt most: a wonder or the spaceship. */
function bigProject(c: City & { productionKnown?: boolean }): boolean {
  if (!c.productionKnown || c.production.kind !== "building") return false;
  const b = BUILDINGS[c.production.id];
  return b.wonder || b.spaceship !== undefined;
}

/**
 * What a bribe will probably cost, worked out the way the game prices it from
 * what the AI knows: the owner's gold from an embassy (a guess otherwise, the
 * barbarians have none), the distance to their capital if the AI has seen it,
 * and the defenders in sight.
 */
export function guessBribe(view: PlayerView, c: City): number {
  const rival = view.rivals.find((r) => r.id === c.owner);
  const gold = rival?.barbarian ? 0 : (rival?.embassy?.gold ?? 300);
  const capital = view.foreignCities.find((x) => x.owner === c.owner && x.buildings.includes("palace"));
  const far = capital ? distance(c, capital) : rival?.barbarian ? 32 : 12;
  const inSight = view.visible[at(view, c)] === 1;
  const units = inSight ? view.foreignUnits.filter((u) => u.x === c.x && u.y === c.y).length : 1 + Math.floor(c.size / 3);
  return Math.round(((gold + 1000) * c.size) / (far + 3) + units * 20);
}

/**
 * Small cities of enemies and barbarians near the AI's own land that a
 * diplomat might bribe. The capital cannot be bribed, and the AI only goes
 * when it holds a fair amount of gold; the real price shows once the diplomat
 * stands next to the city.
 */
export function bribeTargets(view: PlayerView, land: Int32Array, from: Point): City[] {
  return bribeCandidates(view, land, from).filter((c) => view.economy.gold >= BRIBE_RESERVE + guessBribe(view, c));
}

/** Cities worth a bribe whatever the treasury holds now; the AI saves up for the cheapest. */
export function bribeCandidates(view: PlayerView, land: Int32Array, from: Point): City[] {
  const hostile = new Set(view.rivals.filter((r) => r.atWar).map((r) => r.id));
  return view.foreignCities.filter(
    (c) =>
      hostile.has(c.owner) &&
      c.size <= BRIBE_SIZE &&
      !c.buildings.includes("palace") &&
      land[at(view, c)] === land[at(view, from)] &&
      guessBribe(view, c) <= BRIBE_MAX &&
      view.cities.some((own) => distance(own, c) <= BRIBE_RANGE),
  );
}

/** Gold the AI is ready to save up for one bribe. */
const BRIBE_MAX = 300;

/** Gold to keep for the cheapest bribe within reach, or 0 when there is none. */
export function bribeSavings(view: PlayerView, land: Int32Array): number {
  const capital = view.cities.find((c) => c.buildings.includes("palace")) ?? view.cities[0];
  if (!capital) return 0;
  const prices = bribeCandidates(view, land, capital).map((c) => guessBribe(view, c));
  return prices.length ? BRIBE_RESERVE + Math.min(...prices) : 0;
}

export function diplomatCommands(view: PlayerView, u: Unit, land: Int32Array): Command[] {
  if (u.movesLeft <= 0) return [];
  const reachable = view.foreignCities.filter((c) => land[at(view, c)] === land[at(view, u)]);
  const enemies = new Set(view.rivals.filter((r) => r.atWar && !r.barbarian).map((r) => r.id));
  const noEmbassy = new Set(view.rivals.filter((r) => r.contact && !r.barbarian && r.embassy === null).map((r) => r.id));

  // Next to a city: bribe it if the price is right, otherwise do the best thing possible there.
  for (const c of reachable.filter((x) => distance(u, x) <= 1)) {
    const price = view.bribePrices[c.id];
    const hostile = enemies.has(c.owner) || view.rivals.some((r) => r.id === c.owner && r.barbarian);
    if (hostile && price !== undefined && !c.buildings.includes("palace") && view.economy.gold - price >= BRIBE_RESERVE && c.size <= BRIBE_SIZE) {
      return [{ type: "diplomat", unitId: u.id, cityId: c.id, action: "incite" }];
    }
  }

  // Where to go: a city to bribe, an enemy wonder or spaceship to sabotage, a technology to steal, an embassy.
  const bribe = bribeTargets(view, land, u);
  const sabotage = reachable.filter((c) => enemies.has(c.owner) && bigProject(c));
  const steal = reachable.filter((c) => enemies.has(c.owner) && !c.stolenBy.includes(view.playerId));
  const embassy = reachable.filter((c) => noEmbassy.has(c.owner));
  const pick = (list: City[]) => [...list].sort((a, b) => distance(u, a) - distance(u, b))[0];
  const target = pick(bribe) ?? pick(sabotage) ?? pick(steal) ?? pick(embassy);
  if (!target) return [{ type: "fortify", unitId: u.id }];
  if (distance(u, target) <= 1) {
    // The bribe turned out too dear: the diplomat does what else it can here.
    const action = enemies.has(target.owner)
      ? bigProject(target)
        ? "sabotage"
        : !target.stolenBy.includes(view.playerId)
          ? "stealTech"
          : "sabotage"
      : noEmbassy.has(target.owner)
        ? "embassy"
        : null;
    if (action) return [{ type: "diplomat", unitId: u.id, cityId: target.id, action }];
    return [{ type: "fortify", unitId: u.id }];
  }
  const spot = nextTo(view, u, target);
  return spot ? goto(u, spot) : [];
}

export { isCaravan, isDiplomat };
