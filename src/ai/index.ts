/**
 * Computer players. The AI sees the world only through PlayerView, the same
 * information a human in its seat has, and acts only through commands, the
 * same ones the human uses (CLAUDE.md, rules 1 and 2).
 *
 * The AI expands: it settles new cities, carries settlers to islands, keeps
 * defenders at home, improves the land and builds and researches by its
 * nature. Armies, war and diplomacy come in the next steps of phase 3.
 */
import { applyCommand, CIVS, playerView, sameItem, UNIT_TYPES, type Command, type GameEvent, type GameState, type PlayerView } from "../core";
import { chooseProduction } from "./build";
import { isMilitary, isSettler, landmasses } from "./knowledge";
import { governmentCommands, researchCommands } from "./research";
import { averageKnownValue, roomToExpand } from "./settle";
import { targetCity, total, warMotivation } from "./war";
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
  const commands: Command[] = [...researchCommands(view), ...governmentCommands(view)];
  const land = landmasses(view);
  const threats = view.foreignUnits.filter((u) => UNIT_TYPES[u.type].attack > 0).map((u) => ({ x: u.x, y: u.y }));
  const ships = view.units.filter((u) => UNIT_TYPES[u.type].domain === "sea" && (UNIT_TYPES[u.type].capacity ?? 0) > 0).length;
  const average = averageKnownValue(view);
  const room = roomToExpand(view, land, average);

  // War: keep the ones running, declare a new one when the motivation is there.
  const enemies = view.rivals.filter((r) => r.atWar).map((r) => r.id);
  for (const rival of view.rivals) {
    if (!rival.contact || rival.atWar || enemies.length > 0) continue;
    if (total(warMotivation(view, rival, land, room)) > 0) {
      commands.push({ type: "declareWar", player: rival.id });
      enemies.push(rival.id);
    }
  }
  const target = enemies.length > 0 ? targetCity(view, land, enemies) : null;
  const n = CIVS[view.civ].personality;
  const peaceArmy = n === "war" ? Math.max(2, Math.ceil(view.cities.length / 2)) : n === "expansion" && room === 0 ? 2 : 0;
  const ctx = makeContext(view, land, {
    room,
    ships,
    exploring: exploring(view, land),
    threats,
    armyWanted: target ? Math.max(4, view.cities.length + 2) : peaceArmy,
  });

  for (const u of view.units) {
    if (isSettler(u)) commands.push(...(u.carriedBy !== null ? passengerCommands(ctx, u) : settlerCommands(ctx, u)));
    else if (UNIT_TYPES[u.type].domain === "sea") commands.push(...shipCommands(ctx, u));
  }
  commands.push(...soldierCommands(ctx, view.units.filter(isMilitary), target));

  for (const city of view.cities) {
    const wanted = chooseProduction(view, city, ctx.plan);
    if (!sameItem(city.production, wanted)) commands.push({ type: "setProduction", cityId: city.id, item: wanted });
  }
  return commands;
}
