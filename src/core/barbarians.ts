/**
 * Barbarians and ruins.
 *
 * Barbarians are one extra player at the end of the turn order, at war with
 * everybody. From a start turn on they rise up in the wilds far from cities
 * or land on a coast near a city; they also come out of some ruins. Their
 * moves are played by src/ai/barbarians.ts. Ruins lie scattered over the map
 * and give the first land unit that enters gold, a technology, units or
 * trouble. All numbers are in game.json under "ruins" and "barbarians".
 */
import { distance, neighbors8, type Point } from "./geometry";
import type { GameEvent } from "./events";
import { canBuildUnitType, freeTechChoice, knowsTech, learnTechDraft } from "./economy";
import { Rng } from "./rng";
import { gameTurn, RULES, TERRAINS, UNIT_TYPES, type RuinOutcome, type UnitTypeId } from "./rules";
import { barbarianId, isBarbarian, type GameState, type Unit } from "./state";
import { idx, makeUnit, reveal } from "./world";

/**
 * Unit types barbarians use now: the row of the most advanced technology that
 * at least half of the nations know, so one fast nation does not arm them with tanks.
 */
export function barbarianUnitTypes(state: GameState): UnitTypeId[] {
  const rows = RULES.barbarians.units;
  const nations = state.players.filter((p) => !isBarbarian(p) && !p.defeated);
  let types = rows[0]!.units;
  for (const row of rows) {
    const knowing = nations.filter((p) => knowsTech(p, row.tech)).length;
    if (row.tech === null || knowing * 2 >= nations.length) types = row.units;
  }
  return types;
}

function isFreeLand(state: GameState, i: number): boolean {
  if (!TERRAINS[state.map.terrain[i]!].land) return false;
  const x = i % state.map.width;
  const y = Math.floor(i / state.map.width);
  if (state.cities.some((c) => c.x === x && c.y === y)) return false;
  return !state.units.some((u) => u.x === x && u.y === y && !isBarbarian(state.players[u.owner]));
}

/**
 * Puts a group of barbarians on `at` and the free land around it (mutates the draft).
 * Returns how many came; none when the game has no barbarians.
 */
export function spawnBarbariansDraft(draft: GameState, at: Point, count: number, reason: "uprising" | "landing" | "ruins", rng: Rng, events: GameEvent[]): number {
  const owner = barbarianId(draft);
  if (owner === null) return 0;
  const types = barbarianUnitTypes(draft);
  const start = idx(draft.map, at);
  const spots = [start, ...rng.shuffle(neighbors8(draft.map, start))].filter((i) => isFreeLand(draft, i));
  let placed = 0;
  for (let n = 0; n < count && spots.length > 0; n++) {
    const i = spots[n % spots.length]!;
    const p = { x: i % draft.map.width, y: Math.floor(i / draft.map.width) };
    const unit = makeUnit(draft.nextId++, owner, rng.pick(types), p, null);
    draft.units.push(unit);
    reveal(draft, owner, p, RULES.unitSight);
    placed++;
  }
  if (placed > 0) events.push({ type: "barbariansAppeared", at: { x: at.x, y: at.y }, count: placed, reason });
  return placed;
}

/** Barbarian units on the map. */
function barbarianUnits(state: GameState): Unit[] {
  const owner = barbarianId(state);
  return owner === null ? [] : state.units.filter((u) => u.owner === owner);
}

/** A random land tile far from every city and unit, or null after a few tries. */
function wildTile(state: GameState, rng: Rng): Point | null {
  const far = RULES.barbarians.uprisingCityDistance;
  for (let tries = 0; tries < 40; tries++) {
    const i = rng.int(state.map.terrain.length);
    if (!isFreeLand(state, i) || state.map.terrain[i] === "arctic") continue;
    const p = { x: i % state.map.width, y: Math.floor(i / state.map.width) };
    if (state.cities.some((c) => distance(c, p) < far)) continue;
    if (state.units.some((u) => !isBarbarian(state.players[u.owner]) && distance(u, p) < 3)) continue;
    return p;
  }
  return null;
}

/** A free coastal land tile a little way from a random coastal city, or null. */
function landingTile(state: GameState, rng: Rng): Point | null {
  const [near, far] = RULES.barbarians.landingCityDistance as [number, number];
  const coastal = (i: number) => neighbors8(state.map, i).some((n) => !TERRAINS[state.map.terrain[n]!].land);
  const cities = rng.shuffle(state.cities.filter((c) => !isBarbarian(state.players[c.owner]) && coastal(idx(state.map, c))));
  for (const city of cities.slice(0, 4)) {
    const spots: Point[] = [];
    for (let dy = -far; dy <= far; dy++) {
      for (let dx = -far; dx <= far; dx++) {
        const p = { x: city.x + dx, y: city.y + dy };
        if (p.x < 0 || p.y < 0 || p.x >= state.map.width || p.y >= state.map.height) continue;
        const d = distance(city, p);
        const i = idx(state.map, p);
        if (d < near || d > far || !isFreeLand(state, i) || !coastal(i)) continue;
        spots.push(p);
      }
    }
    if (spots.length > 0) return rng.pick(spots);
  }
  return null;
}

/** At the end of the barbarians' own turn new groups may rise up or land (mutates the draft). */
export function barbarianTurnDraft(draft: GameState, events: GameEvent[]): void {
  if (draft.barbarians === "none") return;
  const level = RULES.barbarians.levels[draft.barbarians];
  if (draft.turn < gameTurn(draft, level.startTurn)) return;
  const rng = Rng.fromState(draft.rng);
  const size = () => level.groupMin + rng.int(level.groupMax - level.groupMin + 1);
  if (barbarianUnits(draft).length < level.maxUnits && rng.int(100) < level.uprisingPct) {
    const at = wildTile(draft, rng);
    if (at) spawnBarbariansDraft(draft, at, size(), "uprising", rng, events);
  }
  if (barbarianUnits(draft).length < level.maxUnits && rng.int(100) < level.landingPct) {
    const at = landingTile(draft, rng);
    if (at) spawnBarbariansDraft(draft, at, size(), "landing", rng, events);
  }
  draft.rng = rng.getState();
}

/** Outcomes a ruin may have for this unit now. */
function ruinOutcomes(draft: GameState, unit: Unit): RuinOutcome[] {
  const r = RULES.ruins;
  const player = draft.players[unit.owner]!;
  const out: RuinOutcome[] = ["gold", "mercenaries", "empty"];
  if (freeTechChoice(player)) out.push("tech");
  if (draft.turn < gameTurn(draft, r.settlersBeforeTurn)) out.push("settlers");
  const lonely = !draft.cities.some((c) => distance(c, unit) <= r.barbarianCityDistance);
  if (draft.barbarians !== "none" && draft.turn >= gameTurn(draft, r.barbariansFromTurn) && lonely) out.push("barbarians");
  return out;
}

/** A land unit steps into ruins and finds what is left there (mutates the draft). */
export function exploreRuinsDraft(draft: GameState, unit: Unit, events: GameEvent[]): void {
  const i = idx(draft.map, unit);
  if (!draft.map.ruins[i]) return;
  if (UNIT_TYPES[unit.type].domain !== "land" || isBarbarian(draft.players[unit.owner])) return;
  draft.map.ruins[i] = 0;
  const rng = Rng.fromState(draft.rng);
  const options = ruinOutcomes(draft, unit);
  const weights = options.map((o) => RULES.ruins.outcomes[o]);
  let roll = rng.int(weights.reduce((a, b) => a + b, 0));
  let outcome = options[options.length - 1]!;
  for (let k = 0; k < options.length; k++) {
    roll -= weights[k]!;
    if (roll < 0) {
      outcome = options[k]!;
      break;
    }
  }
  const player = draft.players[unit.owner]!;
  const at = { x: unit.x, y: unit.y };
  const base = { type: "ruinsExplored" as const, owner: unit.owner, unitId: unit.id, at };
  if (outcome === "gold") {
    const gold = rng.pick(RULES.ruins.gold);
    player.gold += gold;
    events.push({ ...base, outcome, gold });
  } else if (outcome === "tech") {
    const tech = freeTechChoice(player)!;
    events.push({ ...base, outcome, tech });
    learnTechDraft(draft, unit.owner, tech, events);
  } else if (outcome === "mercenaries" || outcome === "settlers") {
    const list = RULES.ruins.mercenaries;
    const type: UnitTypeId =
      outcome === "settlers"
        ? "settlers"
        : ([...list].filter((t) => canBuildUnitType(player, t)).sort((a, b) => UNIT_TYPES[b].attack - UNIT_TYPES[a].attack)[0] ?? list[0]!);
    const u = makeUnit(draft.nextId++, unit.owner, type, at, null);
    draft.units.push(u);
    events.push({ ...base, outcome, unitType: type });
  } else if (outcome === "barbarians") {
    const level = RULES.barbarians.levels[draft.barbarians as "few" | "many"];
    events.push({ ...base, outcome });
    // They come out around the ruin, not on the unit itself.
    const around = neighbors8(draft.map, i).find((n) => isFreeLand(draft, n));
    const spot = around === undefined ? at : { x: around % draft.map.width, y: Math.floor(around / draft.map.width) };
    spawnBarbariansDraft(draft, spot, level.groupMin, "ruins", rng, events);
  } else {
    events.push({ ...base, outcome: "empty" });
  }
  draft.rng = rng.getState();
}
