/**
 * The barbarians' moves. They see the world through PlayerView like every
 * other player; they know the land from the start but see units only around
 * their own. They head for the nearest city they know of, take it when it
 * stands empty and attack whatever they can beat with at least
 * RULES.barbarians.attackChance. A captured city keeps one barbarian inside
 * and builds attackers.
 */
import { distance, neighbors8, RULES, sameItem, UNIT_TYPES, type City, type Command, type PlayerView, type Point, type ProductionItem, type Unit } from "../core";
import { at, isLand, landmasses, pointOf } from "./knowledge";
import { attackNow, bestAttacker } from "./war";

const same = (a: Point | null | undefined, b: Point) => !!a && a.x === b.x && a.y === b.y;

function nearest<T extends Point>(from: Point, items: T[]): T | undefined {
  let best: T | undefined;
  for (const it of items) if (!best || distance(from, it) < distance(from, best)) best = it;
  return best;
}

/** An empty foreign city next to the unit, which it can just walk into. */
function emptyCityNext(view: PlayerView, u: Unit): City | undefined {
  if (UNIT_TYPES[u.type].domain !== "land") return undefined;
  return view.foreignCities.find(
    (c) => distance(c, u) === 1 && !view.foreignUnits.some((f) => f.x === c.x && f.y === c.y),
  );
}

export function barbarianCommands(view: PlayerView): Command[] {
  const commands: Command[] = [];
  const keepers = new Set<number>();
  // Each city the barbarians hold keeps its first unit at home.
  for (const city of view.cities) {
    const guard = view.units.find((u) => u.x === city.x && u.y === city.y && UNIT_TYPES[u.type].domain === "land");
    if (guard) keepers.add(guard.id);
    // With few barbarians a taken city lies idle; with many it builds attackers.
    const builds = view.barbarians !== "none" && RULES.barbarians.levels[view.barbarians].cityBuilds;
    const make: ProductionItem = builds ? { kind: "unit", id: bestAttacker(view) } : { kind: "wealth" };
    if (!sameItem(city.production, make)) commands.push({ type: "setProduction", cityId: city.id, item: make });
  }
  const land = landmasses(view);
  for (const u of view.units) {
    if (u.movesLeft <= 0 || UNIT_TYPES[u.type].domain !== "land") continue;
    // Barbarians have no ships: they go only for what they can walk to.
    const home = land[at(view, u)];
    const reachable = <T extends Point>(list: T[]) => list.filter((p) => land[at(view, p)] === home);
    const strike = attackNow(view, u, view.barbarians === "none" ? 1 : RULES.barbarians.levels[view.barbarians].attackChance);
    if (keepers.has(u.id)) {
      if (strike && view.units.filter((x) => x.x === u.x && x.y === u.y).length > 1) commands.push(strike);
      else if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
      continue;
    }
    const empty = emptyCityNext(view, u);
    if (empty) {
      commands.push({ type: "move", unitId: u.id, to: { x: empty.x, y: empty.y } });
      continue;
    }
    if (strike) {
      commands.push(strike);
      continue;
    }
    const goal = nearest(u, reachable(view.foreignCities)) ?? nearest(u, reachable(view.foreignUnits));
    if (!goal) {
      if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
      continue;
    }
    // Stop next to a defended city and wait for a chance; otherwise march on.
    if (distance(u, goal) <= 1) {
      if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
      continue;
    }
    const step = approach(view, u, goal);
    if (step && !same(u.goto, step)) commands.push({ type: "goto", unitId: u.id, to: step });
  }
  return commands;
}

/** The land tile next to the goal closest to the unit, to walk up to a city without stepping into it. */
function approach(view: PlayerView, u: Unit, goal: Point): Point | null {
  const around = neighbors8(view, at(view, goal))
    .filter((i) => isLand(view, i))
    .map((i) => pointOf(view, i))
    .filter((p) => !view.foreignUnits.some((f) => f.x === p.x && f.y === p.y));
  return nearest(u, around) ?? null;
}
