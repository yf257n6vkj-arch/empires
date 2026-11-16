/**
 * Computer players. The AI sees the world only through PlayerView, the same
 * information a human in its seat has, and acts only through commands, the
 * same ones the human uses (CLAUDE.md, rules 1 and 2).
 *
 * The AI expands: it settles new cities, carries settlers to islands, keeps
 * defenders at home, improves the land and builds and researches by its
 * nature. Armies, war and diplomacy come in the next steps of phase 3.
 */
import { applyCommand, BUILDINGS, buyCost, CIVS, distance, playerView, sameItem, UNIT_TYPES, type Command, type GameEvent, type GameState, type PlayerView } from "../core";
import { barbarianCommands } from "./barbarians";
import { chooseProduction } from "./build";
import { caravanCommands, diplomatCommands, isCaravan, isDiplomat } from "./agents";
import { peaceCommands, underTreaty } from "./diplomacy";
import { launchCommands, spaceBuilders } from "./space";
import { upkeepCommands } from "./upkeep";
import { isMilitary, isSettler, landmasses } from "./knowledge";
import { governmentCommands, rateCommands, researchCommands } from "./research";
import { averageKnownValue, roomToExpand } from "./settle";
import { skill, targetCity, total, warMotivation } from "./war";
import { exploring, makeContext, passengerCommands, settlerCommands, shipCommands, soldierCommands } from "./units";

/** Plays every computer player in a row until a human is on turn (or the game ends). */
export function playComputerTurns(state: GameState): { state: GameState; events: GameEvent[] } {
  let current = state;
  const events: GameEvent[] = [];
  let guard = current.players.length;
  while (!current.players[current.currentPlayer]?.isHuman && guard-- > 0) {
    const played = playTurn(current);
    current = played.state;
    events.push(...played.events);
  }
  return { state: current, events };
}

const PASSES = 3;
/** The army retakes a city the barbarians hold this close to an own city. */
const BARBARIAN_CITY_RANGE = 14;

/** One computer player's whole turn, ending with endTurn. */
export function playTurn(state: GameState): { state: GameState; events: GameEvent[] } {
  let current = state;
  const events: GameEvent[] = [];
  const me = current.currentPlayer;
  if (!current.players[me]?.defeated) {
    // Each pass sees what the one before changed: a new city wants production, a free settler a site.
    for (let pass = 0; pass < PASSES; pass++) {
      let changed = false;
      for (const command of decide(playerView(current, me))) {
        const result = applyCommand(current, command);
        // A command the rules refuse is skipped; the AI tries again later.
        if (!result.ok) continue;
        current = result.state;
        events.push(...result.events);
        changed = true;
      }
      if (!changed) break;
    }
  }
  const ended = applyCommand(current, { type: "endTurn" });
  if (ended.ok) {
    current = ended.state;
    events.push(...ended.events);
  }
  return { state: current, events };
}

export function decide(view: PlayerView): Command[] {
  if (view.civ === "barbarians") return barbarianCommands(view);
  const commands: Command[] = [...researchCommands(view), ...rateCommands(view), ...peaceCommands(view)];
  const land = landmasses(view);
  const threats = view.foreignUnits.filter((u) => UNIT_TYPES[u.type].attack > 0).map((u) => ({ x: u.x, y: u.y }));
  const ships = view.units.filter((u) => UNIT_TYPES[u.type].domain === "sea" && (UNIT_TYPES[u.type].capacity ?? 0) > 0).length;
  const average = averageKnownValue(view);
  const room = roomToExpand(view, land, average);

  // War: keep the ones running, declare a new one when the motivation is there.
  // Barbarians are always at war; the army goes for their cities only when they are close.
  const enemies = view.rivals.filter((r) => r.atWar && !r.barbarian).map((r) => r.id);
  for (const rival of view.rivals) {
    // The AI keeps its treaties: no new war while a peace is young.
    if (rival.barbarian || !rival.contact || rival.atWar || enemies.length > 0 || underTreaty(view, rival)) continue;
    if (total(warMotivation(view, rival, land, room)) + skill(view).warShift > 0) {
      commands.push({ type: "declareWar", player: rival.id });
      enemies.push(rival.id);
    }
  }
  const barbarians = view.rivals.find((r) => r.barbarian);
  const nearBarbarians =
    barbarians && view.foreignCities.some((c) => c.owner === barbarians.id && view.cities.some((own) => distance(own, c) <= BARBARIAN_CITY_RANGE));
  const targets = nearBarbarians ? [...enemies, barbarians.id] : enemies;
  const target = targets.length > 0 ? targetCity(view, land, targets) : null;
  const n = CIVS[view.civ].personality;
  const peaceArmy = n === "war" ? Math.max(2, Math.ceil(view.cities.length / 2)) : n === "expansion" && room === 0 ? 2 : 0;
  const ctx = makeContext(view, land, {
    room,
    ships,
    exploring: exploring(view, land),
    threats,
    spaceBuilders: spaceBuilders(view),
    land,
    // A barbarian camp needs a small force; a real war a large one.
    armyWanted: Math.round(((target ? (enemies.length === 0 ? Math.max(3, peaceArmy) : Math.max(4, view.cities.length + 2)) : peaceArmy) * skill(view).armyPct) / 100),
  });

  commands.push(...governmentCommands(view, ctx.plan.room + ctx.plan.islands));

  for (const u of view.units) {
    if (isSettler(u)) commands.push(...(u.carriedBy !== null ? passengerCommands(ctx, u) : settlerCommands(ctx, u)));
    else if (isCaravan(u)) commands.push(...caravanCommands(view, u, land));
    else if (isDiplomat(u)) commands.push(...diplomatCommands(view, u, land));
    else if (UNIT_TYPES[u.type].domain === "sea") commands.push(...shipCommands(ctx, u));
  }
  commands.push(...soldierCommands(ctx, view.units.filter(isMilitary), target));

  for (const city of view.cities) {
    const wanted = chooseProduction(view, city, ctx.plan);
    if (!sameItem(city.production, wanted)) commands.push({ type: "setProduction", cityId: city.id, item: wanted });
  }
  commands.push(...buyCommands(view), ...launchCommands(view), ...upkeepCommands(view, ctx.plan));
  return commands;
}

/** Gold kept for upkeep and emergencies before the AI buys buildings: a base and some per city. */
const BUY_RESERVE = 80;
const BUY_RESERVE_PER_CITY = 10;

/**
 * Spare gold goes into the cheapest building some city is already working on,
 * the way a player hurries a library instead of letting the treasury pile up.
 * A city in danger hurries its defender first.
 */
export function buyCommands(view: PlayerView): Command[] {
  const reserve = BUY_RESERVE + BUY_RESERVE_PER_CITY * view.cities.length;
  const spare = view.economy.gold - reserve;
  if (spare <= 0) return [];
  const options = view.cities
    .filter((c) => c.production.kind === "building" && !BUILDINGS[c.production.id].wonder && c.shields > 0)
    .map((c) => ({ c, cost: buyCost(c) }))
    .filter((o) => o.cost > 0 && o.cost <= spare)
    .sort((a, b) => a.cost - b.cost);
  return options[0] ? [{ type: "buy", cityId: options[0].c.id }] : [];
}
