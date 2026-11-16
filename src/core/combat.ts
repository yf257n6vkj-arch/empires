/**
 * Combat with hit points, as in Civilization 2.
 *
 * A fight runs in rounds. In each round the attacker wins with probability
 * attack / (attack + defence), and the loser loses as many hit points as the
 * winner has firepower. The fight ends when one side has no hit points left.
 *
 * `combatOdds` gives the exact chance of winning before an attack. The screen
 * shows it and the AI decides by it, so both see the same number.
 */
import { assignWorkersDraft, removeUnitDraft } from "./city";
import type { CommandError } from "./commands";
import { capitalOf, cityEffects, fallbackProduction, learnTechDraft } from "./economy";
import type { GameEvent } from "./events";
import { distance, type Point } from "./geometry";
import { BUILDINGS, RULES, TERRAINS, UNIT_TYPES, type BuildingId, type TechId } from "./rules";
import type { Rng } from "./rng";
import type { City, GameState, PlayerId, Unit } from "./state";
import { cityAt, domainOf, idx, reveal, unitsAt } from "./world";

/** One reason a strength differs from the unit's base value, in percent. */
export interface StrengthFactor {
  kind: "veteran" | "terrain" | "fortified" | "fortress" | "walls" | "coastalFortress" | "tired";
  pct: number;
}

export interface Strength {
  base: number;
  value: number;
  factors: StrengthFactor[];
}

export interface CombatOdds {
  attacker: Unit;
  defender: Unit;
  attack: Strength;
  defense: Strength;
  /** Chance that the attacker wins one round, 0..1. */
  roundChance: number;
  /** Chance that the attacker wins the whole fight, 0..1. */
  winChance: number;
}

export function maxHp(unit: Pick<Unit, "type">): number {
  return UNIT_TYPES[unit.type].hp;
}

function apply(base: number, factors: StrengthFactor[]): Strength {
  const value = factors.reduce((v, f) => (v * (100 + f.pct)) / 100, base);
  return { base, value, factors };
}

/** How hard the unit hits: veterans harder, a unit with less than one move left weaker. */
export function attackStrength(attacker: Unit): Strength {
  const factors: StrengthFactor[] = [];
  if (attacker.veteran) factors.push({ kind: "veteran", pct: RULES.combat.veteranPct });
  if (attacker.movesLeft > 0 && attacker.movesLeft < RULES.movesFraction) {
    factors.push({ kind: "tired", pct: (100 * attacker.movesLeft) / RULES.movesFraction - 100 });
  }
  return apply(UNIT_TYPES[attacker.type].attack, factors);
}

/** How well the unit holds against this attacker on its tile. */
export function defenseStrength(state: GameState, defender: Unit, attacker: Unit): Strength {
  const factors: StrengthFactor[] = [];
  if (defender.veteran) factors.push({ kind: "veteran", pct: RULES.combat.veteranPct });
  const i = idx(state.map, defender);
  const terrain = state.map.terrain[i];
  const land = terrain !== undefined && TERRAINS[terrain].land;
  if (land && domainOf(defender) === "land") {
    const bonus = TERRAINS[terrain].defenseBonus;
    if (bonus) factors.push({ kind: "terrain", pct: bonus });
    const city = cityAt(state, defender);
    if (!city && state.map.fortress[i]) factors.push({ kind: "fortress", pct: RULES.combat.fortressPct });
    else if (defender.fortified || city) factors.push({ kind: "fortified", pct: RULES.combat.fortifiedPct });
  }
  const city = cityAt(state, defender);
  if (city && city.owner === defender.owner) {
    const effects = cityEffects(state, city);
    const by = domainOf(attacker);
    if (by === "land" && effects.defenseVsLandPct) factors.push({ kind: "walls", pct: effects.defenseVsLandPct });
    if (by === "sea" && effects.defenseVsSeaPct) factors.push({ kind: "coastalFortress", pct: effects.defenseVsSeaPct });
  }
  return apply(UNIT_TYPES[defender.type].defense, factors);
}

/**
 * Exact chance that a side winning each round with `p` takes `needed` rounds
 * before the other side takes `allowed` rounds: a negative binomial sum.
 */
export function fightChance(p: number, needed: number, allowed: number): number {
  if (needed <= 0) return 1;
  if (allowed <= 0) return 0;
  if (p >= 1) return 1;
  if (p <= 0) return 0;
  const q = 1 - p;
  let sum = 0;
  // Probability that the last of `needed` wins comes after exactly k losses.
  let term = p ** needed;
  for (let k = 0; k < allowed; k++) {
    sum += term;
    term = (term * (needed + k) * q) / (k + 1);
  }
  return Math.min(1, sum);
}

function roundsToKill(hp: number, firepower: number): number {
  return Math.ceil(Math.max(0, hp) / Math.max(1, firepower));
}

function oddsAgainst(state: GameState, attacker: Unit, defender: Unit): CombatOdds {
  const attack = attackStrength(attacker);
  const defense = defenseStrength(state, defender, attacker);
  const total = attack.value + defense.value;
  const roundChance = total > 0 ? attack.value / total : 0;
  const needed = roundsToKill(defender.hp, UNIT_TYPES[attacker.type].firepower);
  const allowed = roundsToKill(attacker.hp, UNIT_TYPES[defender.type].firepower);
  return { attacker, defender, attack, defense, roundChance, winChance: fightChance(roundChance, needed, allowed) };
}

/** Enemy units the attacker would face on the tile: everyone but passengers of a ship. */
function defendersAt(state: GameState, attacker: Unit, at: Point): Unit[] {
  const all = unitsAt(state, at).filter((u) => u.owner !== attacker.owner);
  const free = all.filter((u) => u.carriedBy === null);
  return free.length > 0 ? free : all;
}

/** The unit that defends the tile: the one the attacker is least likely to beat. */
export function bestDefender(state: GameState, attacker: Unit, at: Point): Unit | undefined {
  let best: { unit: Unit; chance: number } | undefined;
  for (const unit of defendersAt(state, attacker, at)) {
    const chance = oddsAgainst(state, attacker, unit).winChance;
    if (!best || chance < best.chance || (chance === best.chance && unit.hp > best.unit.hp)) best = { unit, chance };
  }
  return best?.unit;
}

/** Why the unit cannot attack the tile, or null when it can. */
export function canAttack(state: GameState, unit: Unit, to: Point): CommandError | null {
  const rule = UNIT_TYPES[unit.type];
  if (rule.attack <= 0 || rule.special === "nuclear") return "cannotAttack";
  if (unit.movesLeft <= 0) return "noMovesLeft";
  if (distance(unit, to) !== 1) return "notAdjacent";
  const defenders = defendersAt(state, unit, to);
  if (defenders.length === 0) return "nothingToAttack";
  const domain = domainOf(unit);
  const terrain = state.map.terrain[idx(state.map, to)];
  const landTarget = terrain !== undefined && TERRAINS[terrain].land;
  // Soldiers fight on land and not from the deck of a ship; ships fight at sea and shell the coast.
  if (domain === "land" && (!landTarget || unit.carriedBy !== null)) return "cannotAttack";
  // Aircraft in the open sky can only be caught by other aircraft.
  if (domain !== "air" && !cityAt(state, to) && defenders.every((d) => domainOf(d) === "air")) return "cannotAttack";
  return null;
}

/** The chance of the attack on the tile, or null when the unit cannot attack it. */
export function combatOdds(state: GameState, attacker: Unit, to: Point): CombatOdds | null {
  if (canAttack(state, attacker, to) !== null) return null;
  const defender = bestDefender(state, attacker, to);
  return defender ? oddsAgainst(state, attacker, defender) : null;
}

/** True when a lost defence costs only the defender: in a city or a fortress. */
function protectedTile(state: GameState, at: Point): boolean {
  return cityAt(state, at) !== undefined || state.map.fortress[idx(state.map, at)] === 1;
}

/**
 * Fights the attack out (mutates the draft; the attack must already be
 * checked). The attacker stays where it is. When the defender loses outside
 * a city or fortress, every unit on its tile is lost with it.
 */
export function attackDraft(draft: GameState, attacker: Unit, to: Point, rng: Rng, events: GameEvent[]): void {
  const odds = combatOdds(draft, attacker, to)!;
  const defender = odds.defender;
  const attackerFp = UNIT_TYPES[attacker.type].firepower;
  const defenderFp = UNIT_TYPES[defender.type].firepower;
  while (attacker.hp > 0 && defender.hp > 0) {
    if (rng.next() < odds.roundChance) defender.hp = Math.max(0, defender.hp - attackerFp);
    else attacker.hp = Math.max(0, attacker.hp - defenderFp);
  }
  attacker.movesLeft = Math.max(0, attacker.movesLeft - RULES.movesFraction);
  attacker.fortified = false;
  attacker.goto = null;
  const attackerWon = defender.hp > 0 ? false : true;
  const winner = attackerWon ? attacker : defender;
  const loser = attackerWon ? defender : attacker;
  let alsoLost = 0;
  if (attackerWon && !protectedTile(draft, to)) {
    const stack = draft.units.filter((u) => u.x === to.x && u.y === to.y && u.owner === defender.owner && u.id !== defender.id);
    alsoLost = stack.length;
    for (const u of stack) removeUnitDraft(draft, u.id);
  }
  removeUnitDraft(draft, loser.id);
  const promoted = !winner.veteran && rng.chance(RULES.combat.veteranChancePct / 100);
  if (promoted) winner.veteran = true;
  reveal(draft, defender.owner, attacker, 1);
  reveal(draft, attacker.owner, to, 1);
  events.push({
    type: "combat",
    attacker: { id: attacker.id, owner: attacker.owner, unitType: attacker.type },
    defender: { id: defender.id, owner: defender.owner, unitType: defender.type },
    at: { x: to.x, y: to.y },
    attackerWon,
    winnerHp: winner.hp,
    alsoLost,
    promoted,
    winChance: odds.winChance,
  });
}

/** Can this unit take a city by walking in? Only land units that can fight. */
export function canCapture(unit: Unit): boolean {
  const rule = UNIT_TYPES[unit.type];
  return domainOf(unit) === "land" && rule.attack > 0 && !rule.special;
}

/**
 * A unit walks into an undefended enemy city (mutates the draft). A city of
 * size one is destroyed; a larger one changes hands, shrinks by one and loses
 * some buildings. The winner takes a share of the loser's gold and one of
 * their technologies.
 */
export function captureCityDraft(draft: GameState, city: City, unit: Unit, rng: Rng, events: GameEvent[]): void {
  const loserId = city.owner;
  const winnerId = unit.owner;
  const loser = draft.players[loserId]!;
  const winner = draft.players[winnerId]!;

  const ownSize = draft.cities.filter((c) => c.owner === loserId).reduce((n, c) => n + c.size, 0);
  const gold = ownSize > 0 ? Math.floor((loser.gold * city.size) / ownSize) : 0;
  loser.gold -= gold;
  winner.gold += gold;

  const options = loser.techs.filter((t) => !winner.techs.includes(t));
  const tech: TechId | null = options.length > 0 ? options[rng.int(options.length)]! : null;
  if (tech) learnTechDraft(draft, winnerId, tech, events);

  const hadPalace = city.buildings.includes("palace");
  // Units the city supported are lost with it.
  for (const u of draft.units.filter((x) => x.homeCity === city.id && x.owner === loserId)) removeUnitDraft(draft, u.id);
  for (const other of draft.cities) other.tradeRoutes = other.tradeRoutes.filter((id) => id !== city.id);

  if (city.size <= 1) {
    draft.cities = draft.cities.filter((c) => c.id !== city.id);
    events.push({ type: "cityDestroyed", cityId: city.id, name: city.name, owner: loserId, by: winnerId, gold, tech });
  } else {
    const lost: BuildingId[] = [];
    city.buildings = city.buildings.filter((b) => {
      if (b === "palace") return false;
      if (BUILDINGS[b].wonder) return true;
      if (rng.chance(RULES.combat.captureBuildingLossPct / 100)) {
        lost.push(b);
        return false;
      }
      return true;
    });
    city.owner = winnerId;
    city.size -= 1;
    city.food = 0;
    city.shields = 0;
    city.queue = [];
    city.tradeRoutes = [];
    city.stolenBy = [];
    city.manualTiles = false;
    city.worked = [];
    city.taxmen = 0;
    city.scientists = 0;
    city.celebrating = false;
    city.disorderTurns = 0;
    city.soldTurn = null;
    city.production = fallbackProduction(draft, winnerId);
    reveal(draft, winnerId, city, RULES.citySight);
    assignWorkersDraft(draft, city);
    events.push({ type: "cityCaptured", cityId: city.id, from: loserId, to: winnerId, gold, tech, lostBuildings: lost });
  }

  const remaining = draft.cities.filter((c) => c.owner === loserId);
  if (hadPalace && remaining.length > 0 && !capitalOf(draft, loserId)) {
    // The government moves to the largest city left, so the empire does not fall apart.
    const seat = remaining.reduce((a, b) => (b.size > a.size || (b.size === a.size && b.id < a.id) ? b : a));
    seat.buildings.unshift("palace");
    events.push({ type: "palaceMoved", player: loserId, cityId: seat.id });
  }
  if (remaining.length === 0 && loser.citiesFounded > 0) defeatDraft(draft, loserId, winnerId, events);
}

/** A player without cities is out of the game; the rest of the army scatters (mutates the draft). */
export function defeatDraft(draft: GameState, playerId: PlayerId, by: PlayerId | null, events: GameEvent[]): void {
  const player = draft.players[playerId];
  if (!player || player.defeated) return;
  player.defeated = true;
  for (const u of draft.units.filter((x) => x.owner === playerId)) removeUnitDraft(draft, u.id);
  events.push({ type: "civDestroyed", player: playerId, by });
}

/** Hit points the unit gets back at the end of a turn it spent without moving. */
export function healAmount(state: GameState, unit: Unit): number {
  const max = maxHp(unit);
  if (unit.hp >= max) return 0;
  const city = cityAt(state, unit);
  let pct = RULES.combat.healFieldPct;
  if (city && city.owner === unit.owner) {
    if (domainOf(unit) === "land" && cityEffects(state, city).veteranUnits) return max - unit.hp;
    pct = RULES.combat.healCityPct;
  } else if (state.map.fortress[idx(state.map, unit)]) {
    pct = RULES.combat.healFortressPct;
  }
  return Math.min(max - unit.hp, Math.max(1, Math.ceil((max * pct) / 100)));
}
