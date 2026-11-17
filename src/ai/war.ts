/**
 * War: when the AI declares it and how its army fights.
 *
 * The decision follows Unciv's MotivationToAttackAutomation: a list of named
 * items that add up to a motivation, so tuning can print why the AI went to
 * war. It only reads what the PlayerView shows: the rival's known cities and
 * the units the AI can see around them.
 *
 * The army follows Unciv's HeadTowardsEnemyCityAutomation: every soldier the
 * cities do not need marches on one enemy city, the one nearest to the own
 * capital. They wait in the own city closest to it until there are enough of
 * them, then go in together. Each attack is weighed by the same chance of
 * winning the screen shows a human.
 */
import {
  BUILDINGS,
  CIVS,
  combatOddsInView,
  distance,
  neighbors8,
  RULES,
  TERRAINS,
  UNIT_TYPES,
  type City,
  type Command,
  type PlayerView,
  type Point,
  type RivalView,
  type Unit,
  type UnitTypeId,
} from "../core";
import { isTransport, seaInvasion, type Invasion } from "./navy";
import { bestDefender } from "./build";
import { at, isLand, isMilitary, pointOf } from "./knowledge";

export interface Reason {
  item: string;
  value: number;
}

/** Strength a unit brings to an attack: attack × share of health, veterans more. */
export function punch(u: Unit): number {
  const rule = UNIT_TYPES[u.type];
  return rule.attack * (u.hp / rule.hp) * (u.veteran ? 1.5 : 1);
}

/** Units that are better at attacking than defending, or strong enough to lead an attack. */
export function isAttacker(u: Pick<Unit, "type">): boolean {
  const rule = UNIT_TYPES[u.type];
  return isMilitary(u) && rule.attack >= 2 && rule.attack >= rule.defense;
}

/**
 * How hard a known enemy city is to take: the defenders the AI sees there
 * when the city is in sight, otherwise at least as many as a city of that
 * size usually has, of the best kind the AI itself can build; walls triple it.
 */
export function cityDefense(view: PlayerView, city: City): number {
  const seen = view.foreignUnits.filter((u) => u.x === city.x && u.y === city.y && UNIT_TYPES[u.type].defense > 0);
  const walls = city.buildings.some((b) => (BUILDINGS[b].effects.defenseVsLandPct ?? 0) > 0) ? 3 : 1;
  const terrain = view.terrain[at(view, city)];
  const ground = terrain ? 1 + TERRAINS[terrain].defenseBonus / 100 : 1;
  const visible = seen.reduce((n, u) => n + UNIT_TYPES[u.type].defense * (u.hp / UNIT_TYPES[u.type].hp), 0);
  const guessed = (1 + Math.floor(city.size / 3)) * UNIT_TYPES[bestDefender(view)].defense;
  // A city in sight shows its whole garrison; only one out of sight needs a guess.
  const inSight = view.visible[at(view, city)] === 1;
  return (inSight ? visible : Math.max(visible, guessed)) * 1.5 * ground * walls;
}

/** The enemy city the army goes for: the nearest to the capital that can be reached on foot. */
export function targetCity(view: PlayerView, land: Int32Array, enemies: number[]): City | null {
  const capital = view.cities.find((c) => c.buildings.includes("palace")) ?? view.cities[0];
  if (!capital) return null;
  const home = land[at(view, capital)];
  let best: City | null = null;
  for (const c of view.foreignCities) {
    if (!enemies.includes(c.owner) || land[at(view, c)] !== home) continue;
    if (!best || distance(c, capital) < distance(best, capital)) best = c;
  }
  return best;
}

/** Why the AI would or would not go to war with a rival; positive total means war. */
export function warMotivation(view: PlayerView, rival: RivalView, land: Int32Array, room: number): Reason[] {
  const reasons: Reason[] = [];
  const add = (item: string, value: number) => reasons.push({ item, value });
  const nature = CIVS[view.civ].personality;
  add("nature", nature === "war" ? 10 : nature === "expansion" ? -10 : -25);
  if (view.turn < view.maxTurns / 4) add("early game", -100);
  const footTarget = targetCity(view, land, [rival.id]);
  // A city across the sea can be fought for too, with a landing, but that is harder.
  const sea = footTarget ? null : seaInvasion(view, land, [rival.id]);
  const target = footTarget ?? sea?.target ?? null;
  if (!target) {
    add("no city in reach", -100);
    return reasons;
  }
  if (sea) add("across the sea", -15);
  const army = view.units.filter(isAttacker);
  const power = army.reduce((n, u) => n + punch(u), 0);
  const ratio = power / Math.max(1, cityDefense(view, target));
  add("strength", ratio >= 3 ? 25 : ratio >= 2 ? 15 : ratio >= 1.2 ? 5 : ratio < 0.8 ? -30 : -10);
  if (army.length < 3) add("small army", -40);
  // Barbarians are always at war and do not count as a war of choice.
  const wars = view.rivals.filter((r) => r.atWar && !r.barbarian).length;
  if (wars > 0) add("already at war", -20 * wars);
  const capital = view.cities.find((c) => c.buildings.includes("palace")) ?? view.cities[0]!;
  const d = distance(capital, target);
  add("distance", d <= 8 ? 5 : d > 15 ? -(d - 15) * 2 : 0);
  if (room === 0) add("no room to grow", nature === "expansion" ? 15 : 10);
  return reasons;
}

export function total(reasons: Reason[]): number {
  return reasons.reduce((n, r) => n + r.value, 0);
}

/** The best attacking unit the player can build: most attack, then the cheaper. */
export function bestAttacker(view: PlayerView): UnitTypeId {
  let best: UnitTypeId = "warriors";
  for (const id of Object.keys(UNIT_TYPES) as UnitTypeId[]) {
    const rule = UNIT_TYPES[id];
    if (rule.domain !== "land" || rule.attack <= 0 || rule.special) continue;
    if (rule.requires && !view.economy.techs.includes(rule.requires)) continue;
    if (rule.requiresWonder && !view.builtWonders.includes(rule.requiresWonder)) continue;
    const current = UNIT_TYPES[best];
    const score = rule.attack * (rule.moves > 1 ? 1.15 : 1);
    const currentScore = current.attack * (current.moves > 1 ? 1.15 : 1);
    if (score > currentScore || (score === currentScore && rule.cost < current.cost)) best = id;
  }
  return best;
}

/** The lowest chance of winning the AI accepts for an attack. */
/** How well this computer player decides, by the difficulty of the game. */
export function skill(view: PlayerView) {
  return RULES.difficulty.levels[view.isHuman ? "normal" : view.difficulty].ai;
}

function boldness(view: PlayerView): number {
  return (CIVS[view.civ].personality === "war" ? 0.5 : 0.6) + skill(view).attackOddsAdd;
}

/** Attacks on neighbouring enemies that are worth it, best chance first. */
export function attackNow(view: PlayerView, u: Unit, min = boldness(view)): Command | null {
  if (u.movesLeft <= 0) return null;
  let best: { to: Point; chance: number } | null = null;
  for (const n of neighbors8(view, at(view, u))) {
    const p = pointOf(view, n);
    const enemies = view.foreignUnits.filter((f) => f.x === p.x && f.y === p.y);
    if (enemies.length === 0) continue;
    if (!view.rivals.some((r) => r.id === enemies[0]!.owner && r.atWar)) continue;
    const odds = combatOddsInView(view, u, p);
    if (!odds || odds.winChance < min) continue;
    if (!best || odds.winChance > best.chance) best = { to: p, chance: odds.winChance };
  }
  return best ? { type: "attack", unitId: u.id, to: best.to } : null;
}

const same = (a: Point | null | undefined, b: Point) => !!a && a.x === b.x && a.y === b.y;

/** Orders for the army marching on a target city. */
export function armyCommands(view: PlayerView, army: Unit[], target: City, invasion: Invasion | null = null, land: Int32Array | null = null): Command[] {
  const commands: Command[] = [];
  // Across the sea the army gathers in the port and sails; soldiers already ashore fight on.
  if (invasion && land && invasion.target.id === target.id) {
    const ashore = army.filter((u) => land[at(view, u)] === land[at(view, target)]);
    commands.push(...landedCommands(view, ashore, target));
    commands.push(...boardingCommands(view, army.filter((u) => !ashore.includes(u)), target, invasion));
    return commands;
  }
  // Wait in the own city nearest the target; it may be the target's neighbour if one exists.
  const staging = [...view.cities].sort((a, b) => distance(a, target) - distance(b, target))[0];
  const defenders = view.foreignUnits.filter((u) => u.x === target.x && u.y === target.y).length;
  const needed = Math.max(3, defenders * 2 + 1);
  const close = army.filter((u) => distance(u, target) <= 2).length;
  const gathered = army.filter((u) => distance(u, target) <= 2 || (staging && distance(u, staging) <= 1));
  // Enough units, or fewer that are clearly stronger than the defence (a lone barbarian garrison, say).
  const strongEnough = gathered.reduce((n, u) => n + punch(u), 0) >= 2 * cityDefense(view, target);
  const ready = gathered.length >= needed || close >= needed - 1 || strongEnough;

  // Free land tiles next to the target, the best ground for defence first.
  const around = neighbors8(view, at(view, target))
    .filter((i) => isLand(view, i))
    .map((i) => pointOf(view, i))
    .filter((p) => !view.foreignUnits.some((f) => f.x === p.x && f.y === p.y))
    .sort((a, b) => TERRAINS[view.terrain[at(view, b)]!].defenseBonus - TERRAINS[view.terrain[at(view, a)]!].defenseBonus);

  for (const u of army) {
    if (u.movesLeft <= 0) continue;
    if (u.hp < UNIT_TYPES[u.type].hp * 0.4) {
      const home = [...view.cities].sort((a, b) => distance(u, a) - distance(u, b))[0];
      if (home && !(home.x === u.x && home.y === u.y)) commands.push({ type: "goto", unitId: u.id, to: { x: home.x, y: home.y } });
      continue;
    }
    const strike = attackNow(view, u, distance(u, target) <= 1 && ready ? Math.min(boldness(view), 0.45) : boldness(view));
    if (strike) {
      commands.push(strike);
      continue;
    }
    // An empty enemy city next door: walk in.
    if (distance(u, target) === 1 && !view.foreignUnits.some((f) => f.x === target.x && f.y === target.y)) {
      commands.push({ type: "move", unitId: u.id, to: { x: target.x, y: target.y } });
      continue;
    }
    if (ready) {
      if (distance(u, target) === 1) continue;
      const spot = around.find((p) => !army.some((o) => o !== u && same(o.goto, p))) ?? around[0];
      if (spot && !same(u.goto, spot)) commands.push({ type: "goto", unitId: u.id, to: spot });
      continue;
    }
    if (staging && !(staging.x === u.x && staging.y === u.y) && !same(u.goto, staging)) commands.push({ type: "goto", unitId: u.id, to: { x: staging.x, y: staging.y } });
  }
  return commands;
}

/** Soldiers who landed next to the enemy city: strike when the odds allow, walk into an empty city, otherwise hold the shore. */
function landedCommands(view: PlayerView, ashore: Unit[], target: City): Command[] {
  const commands: Command[] = [];
  const empty = !view.foreignUnits.some((f) => f.x === target.x && f.y === target.y);
  for (const u of ashore) {
    if (u.movesLeft <= 0) continue;
    const strike = attackNow(view, u, Math.min(boldness(view), 0.45));
    if (strike) {
      commands.push(strike);
      continue;
    }
    if (distance(u, target) === 1 && empty) {
      commands.push({ type: "move", unitId: u.id, to: { x: target.x, y: target.y } });
      continue;
    }
    if (distance(u, target) > 1) commands.push({ type: "goto", unitId: u.id, to: { x: target.x, y: target.y } });
    else if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
  }
  return commands;
}

/**
 * Soldiers on the home coast: they gather in the port, and once there are
 * enough of them, or they are clearly stronger than the city's defence, and a
 * ship with room waits there, they go aboard.
 */
function boardingCommands(view: PlayerView, army: Unit[], target: City, invasion: Invasion): Command[] {
  const commands: Command[] = [];
  const port = invasion.port;
  const inPort = army.filter((u) => u.x === port.x && u.y === port.y);
  const defenders = view.foreignUnits.filter((u) => u.x === target.x && u.y === target.y).length;
  const needed = Math.max(3, defenders * 2 + 1);
  const strong = inPort.reduce((n, u) => n + punch(u), 0) >= 2 * cityDefense(view, target);
  const ship = view.units.find((s) => s.x === port.x && s.y === port.y && isTransport(s));
  const room = ship ? (UNIT_TYPES[ship.type].capacity ?? 0) - view.units.filter((c) => c.carriedBy === ship.id).length : 0;
  const ready = ship && room > 0 && (inPort.length >= Math.min(needed, room) || strong);
  let boarded = 0;
  for (const u of army) {
    if (u.movesLeft <= 0 || u.hp < UNIT_TYPES[u.type].hp * 0.6) continue;
    if (u.x === port.x && u.y === port.y) {
      if (ready && boarded < room) {
        commands.push({ type: "board", unitId: u.id });
        boarded++;
      } else if (!u.fortified) commands.push({ type: "fortify", unitId: u.id });
      continue;
    }
    if (!same(u.goto, port)) commands.push({ type: "goto", unitId: u.id, to: { x: port.x, y: port.y } });
  }
  return commands;
}
