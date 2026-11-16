/**
 * Ending a player's turn and starting the next one. Players move one after
 * another; when the last player ends, a new game turn begins.
 */
import { scoreVictoryDraft } from "./score";
import { barbarianTurnDraft } from "./barbarians";
import { assignWorkersDraft, processCityDraft, removeUnitDraft } from "./city";
import {
  buildingUpkeep,
  workingBuildings,
  fitRates,
  learnTechDraft,
  nextStepToGoal,
  researchCost,
  sellBuildingsForUpkeepDraft,
  wonderFlag,
  wonderOwner,
} from "./economy";
import { aircraftSafe, continueGotoDraft, turnMoves } from "./units";
import { healAmount } from "./combat";
import type { GameEvent } from "./events";
import { BUILDINGS, GOVERNMENTS, IMPROVEMENTS, RULES, TECH_IDS, UNIT_TYPES, type BuildingId, type ImprovementId, type TerrainId } from "./rules";
import { Rng } from "./rng";
import { isBarbarian, type City, type GameState, type PlayerId, type Unit, type WorkKind } from "./state";
import { workerStepDraft } from "./workers";
import { cityAt, idx, touchesLand } from "./world";

/** Ends the current player's turn and starts the next player's (mutates the draft). */
export function endTurnDraft(draft: GameState, events: GameEvent[]): void {
  const player = draft.currentPlayer;

  let science = 0;
  let gold = 0;
  for (const city of draft.cities.filter((c) => c.owner === player)) {
    const out = processCityDraft(draft, city, events);
    science += out.science;
    gold += out.gold;
  }
  economyDraft(draft, player, science, gold, events);
  for (const unit of draft.units.filter((u) => u.owner === player && u.work)) {
    progressWorkDraft(draft, unit, events);
  }
  healDraft(draft, player);
  perilsDraft(draft, player, events);
  collapseDraft(draft, player, events);
  disasterDraft(draft, player, events);
  if (isBarbarian(draft.players[player])) barbarianTurnDraft(draft, events);

  const next = (player + 1) % draft.players.length;
  if (next === 0) {
    draft.turn += 1;
    spaceshipsDraft(draft, events);
    warmingDraft(draft, events);
    scoreVictoryDraft(draft, events);
  }
  draft.currentPlayer = next;
  startTurnDraft(draft, next, events);
}

/** Wounded units that spent the turn without moving get some hit points back (mutates the draft). */
function healDraft(draft: GameState, player: PlayerId): void {
  for (const unit of draft.units.filter((u) => u.owner === player)) {
    const rested = unit.fortified || unit.work !== null || unit.movesLeft >= turnMoves(draft, unit);
    if (rested) unit.hp += healAmount(draft, unit);
  }
}

/**
 * Dangers at the end of a turn: aircraft away from a city or carrier burn
 * fuel and crash when it runs out, triremes away from the coast may sink.
 */
function perilsDraft(draft: GameState, player: PlayerId, events: GameEvent[]): void {
  const rng = Rng.fromState(draft.rng);
  const safeTriremes = wonderFlag(draft, player, "safeTriremes");
  for (const unit of draft.units.filter((u) => u.owner === player)) {
    if (!draft.units.includes(unit)) continue;
    const rule = UNIT_TYPES[unit.type];
    if (rule.domain === "air") {
      if (aircraftSafe(draft, unit)) {
        unit.turnsAloft = 0;
        continue;
      }
      unit.turnsAloft += 1;
      if (unit.turnsAloft >= (rule.fuel ?? 1)) {
        removeUnitDraft(draft, unit.id);
        events.push({ type: "unitLost", unitId: unit.id, unitType: unit.type, owner: player, reason: "fuel" });
      }
    } else if (rule.coastal && !safeTriremes && !cityAt(draft, unit)) {
      const nearCoast = touchesLand(draft, unit);
      if (!nearCoast && rng.chance(RULES.triremeLossPct / 100)) {
        removeUnitDraft(draft, unit.id);
        events.push({ type: "unitLost", unitId: unit.id, unitType: unit.type, owner: player, reason: "sea" });
      }
    }
  }
  draft.rng = rng.getState();
}

/** Spaceships that reach their destination this turn land, or are lost. */
function spaceshipsDraft(draft: GameState, events: GameEvent[]): void {
  const rng = Rng.fromState(draft.rng);
  for (const p of draft.players) {
    const ship = p.spaceship;
    if (ship.arrivalTurn === null || draft.turn < ship.arrivalTurn) continue;
    const success = rng.int(100) < ship.successPct;
    events.push({ type: "spaceshipArrived", player: p.id, success });
    if (success && !draft.victory) draft.victory = { player: p.id, kind: "space", turn: draft.turn };
    if (!success) Object.assign(ship, { structural: 0, component: 0, module: 0, launchedTurn: null, arrivalTurn: null, successPct: 0 });
    else ship.arrivalTurn = null;
  }
  draft.rng = rng.getState();
}

/** Pays upkeep, adds gold and science, and finishes research (mutates the draft). */
function economyDraft(draft: GameState, playerId: PlayerId, science: number, gold: number, events: GameEvent[]): void {
  const player = draft.players[playerId];
  if (!player) return;
  player.gold += gold - buildingUpkeep(draft, playerId);
  sellBuildingsForUpkeepDraft(draft, playerId, events);

  // Science collects even with nothing chosen, so no turn of research is lost.
  player.research += science;
  const tech = player.researching;
  if (tech !== null && player.research >= researchCost(player)) {
    player.research -= researchCost(player);
    player.techs.push(tech);
    player.researching = null;
    events.push({ type: "techLearned", player: playerId, tech });
    if (player.researchGoal !== null) player.researching = nextStepToGoal(player, player.researchGoal);
    if (player.researching === null) {
      player.researchGoal = null;
      events.push({ type: "researchNeeded", player: playerId });
    }
  }
}

/** A library of the world: the owner learns every technology that enough other players know. */
function libraryDraft(draft: GameState, playerId: PlayerId, events: GameEvent[]): void {
  for (const id of Object.keys(BUILDINGS) as (keyof typeof BUILDINGS)[]) {
    const need = BUILDINGS[id].effects.techsFromOthers;
    if (!need || wonderOwner(draft, id) !== playerId) continue;
    const me = draft.players[playerId]!;
    for (const tech of TECH_IDS) {
      if (me.techs.includes(tech)) continue;
      const knownBy = draft.players.filter((p) => p.id !== playerId && p.techs.includes(tech)).length;
      if (knownBy >= need) learnTechDraft(draft, playerId, tech, events);
    }
  }
}

function startTurnDraft(draft: GameState, player: PlayerId, events: GameEvent[]): void {
  const p = draft.players[player];
  if (p?.revolution) {
    p.revolution.turnsLeft -= 1;
    if (p.revolution.turnsLeft <= 0) {
      p.government = p.revolution.target;
      p.revolution = null;
      // Luxuries stay as the player set them; science takes up what taxes may no longer carry.
      const fitted = fitRates(p.scienceRate, p.luxuryRate, p.government, "luxury");
      p.scienceRate = fitted.science;
      p.luxuryRate = fitted.luxury;
      events.push({ type: "governmentChanged", player, government: p.government });
    }
  }
  libraryDraft(draft, player, events);
  for (const unit of draft.units.filter((u) => u.owner === player)) {
    unit.movesLeft = unit.work || unit.fortified ? 0 : turnMoves(draft, unit);
  }
  for (const unit of draft.units.filter((u) => u.owner === player && u.goto)) {
    continueGotoDraft(draft, unit, events);
  }
  for (const unit of draft.units.filter((u) => u.owner === player && u.orders && !u.work)) {
    workerStepDraft(draft, unit, events);
  }
  events.push({ type: "turnStarted", turn: draft.turn, player });
}

/** Turns of work the settler needs on its tile, undefined when the work cannot be done there. */
export function workTurns(map: GameState["map"], i: number, work: WorkKind): number | undefined {
  if (work === "clean") return map.pollution[i] ? RULES.pollutionCleanTurns : undefined;
  const terrain = map.terrain[i];
  return terrain ? IMPROVEMENTS[work].turns[terrain] : undefined;
}

function progressWorkDraft(draft: GameState, unit: Unit, events: GameEvent[]): void {
  const work = unit.work;
  if (!work) return;
  const i = idx(draft.map, unit);
  // Several settlers on one tile work together.
  const needed = workTurns(draft.map, i, work.improvement);
  if (needed === undefined) {
    unit.work = null;
    return;
  }
  work.progress += 1;
  if (work.progress < needed) return;
  unit.work = null;
  if (work.improvement === "clean") {
    draft.map.pollution[i] = 0;
    events.push({ type: "pollutionCleaned", unitId: unit.id, at: { x: unit.x, y: unit.y } });
    return;
  }
  finishImprovement(draft, i, work.improvement);
  events.push({ type: "improvementDone", unitId: unit.id, at: { x: unit.x, y: unit.y }, improvement: work.improvement });
}

function finishImprovement(draft: GameState, i: number, improvement: ImprovementId): void {
  const terrain = draft.map.terrain[i]!;
  const into = IMPROVEMENTS[improvement].transform?.[terrain];
  if (into) {
    // Clearing a forest or draining a swamp changes the land; old irrigation or a mine go with it.
    draft.map.terrain[i] = into;
    draft.map.irrigation[i] = 0;
    draft.map.mine[i] = 0;
    return;
  }
  draft.map[improvement][i] = 1;
  // A mine and irrigation cannot share a tile; the newer one replaces the older.
  if (improvement === "mine") draft.map.irrigation[i] = 0;
  if (improvement === "irrigation") draft.map.mine[i] = 0;
}

/**
 * A government that cannot stand disorder (democracy) may fall when some
 * city has been in disorder for two turns running (mutates the draft).
 */
function collapseDraft(draft: GameState, playerId: PlayerId, events: GameEvent[]): void {
  const p = draft.players[playerId];
  if (!p || p.revolution || !GOVERNMENTS[p.government].collapsesInDisorder) return;
  if (!draft.cities.some((c) => c.owner === playerId && c.disorderTurns >= 2)) return;
  const rng = Rng.fromState(draft.rng);
  const falls = rng.int(100) < RULES.collapseChancePct;
  draft.rng = rng.getState();
  if (!falls) return;
  events.push({ type: "governmentCollapsed", player: playerId, government: p.government });
  // After the anarchy the people want the same government back.
  p.revolution = { target: p.government, turnsLeft: RULES.anarchyTurns };
  p.government = "anarchy";
}

/** Does the city stand on this terrain or next to it? */
function cityNear(draft: GameState, city: City, terrain: TerrainId): boolean {
  const map = draft.map;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const x = city.x + dx;
      const y = city.y + dy;
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
      if (map.terrain[y * map.width + x] === terrain) return true;
    }
  }
  return false;
}

/**
 * Now and then a disaster strikes one of the player's cities. The right
 * building or technology keeps it away, and the player hears that it did.
 */
function disasterDraft(draft: GameState, playerId: PlayerId, events: GameEvent[]): void {
  if (draft.turn < RULES.disasterStartTurn) return;
  const cities = draft.cities.filter((c) => c.owner === playerId);
  if (cities.length === 0) return;
  const rng = Rng.fromState(draft.rng);
  if (rng.int(100) >= RULES.disasterPct) {
    draft.rng = rng.getState();
    return;
  }
  const city = cities[rng.int(cities.length)]!;
  const possible = RULES.disasters.filter((d) => d.near === null || cityNear(draft, city, d.near));
  const disaster = possible[rng.int(possible.length)]!;
  const player = draft.players[playerId]!;
  const building = disaster.preventBuilding && workingBuildings(draft, city).includes(disaster.preventBuilding) ? disaster.preventBuilding : null;
  const tech = disaster.preventTech && player.techs.includes(disaster.preventTech) ? disaster.preventTech : null;
  if (building || tech) {
    draft.rng = rng.getState();
    events.push({ type: "disasterPrevented", cityId: city.id, disaster: disaster.id, building, tech });
    return;
  }
  let lost: BuildingId | null = null;
  if (disaster.hit === "building") {
    const burnable = city.buildings.filter((b) => !BUILDINGS[b].wonder && !BUILDINGS[b].onePerPlayer);
    lost = burnable.length ? burnable[rng.int(burnable.length)]! : null;
    if (lost) city.buildings = city.buildings.filter((b) => b !== lost);
  } else if (disaster.hit === "population") {
    city.size = Math.max(1, city.size - Math.max(1, Math.floor((city.size * RULES.populationLossPct) / 100)));
  } else if (disaster.hit === "famine") {
    city.food = 0;
    city.size = Math.max(1, city.size - 1);
  } else {
    city.food = 0;
    city.shields = 0;
  }
  draft.rng = rng.getState();
  city.manualTiles = false;
  assignWorkersDraft(draft, city);
  events.push({ type: "disaster", cityId: city.id, disaster: disaster.id, building: lost, size: city.size });
}

/**
 * Global warming: every turn the counter grows by the polluted tiles above
 * a safe number. When it is full, land all over the world changes: by the
 * sea it turns into swamp and jungle, inland into desert (mutates the draft).
 */
function warmingDraft(draft: GameState, events: GameEvent[]): void {
  const map = draft.map;
  const polluted = map.pollution.reduce((n, x) => n + x, 0);
  draft.warming = Math.max(0, draft.warming + polluted - RULES.warmingSafeTiles);
  if (draft.warming < RULES.warmingLimit) return;
  draft.warming = 0;
  const rng = Rng.fromState(draft.rng);
  const cityTiles = new Set(draft.cities.map((c) => idx(map, c)));
  let changed = 0;
  for (let i = 0; i < map.terrain.length; i++) {
    const t = map.terrain[i]!;
    if (cityTiles.has(i) || !["grassland", "plains", "desert", "forest"].includes(t)) continue;
    if (rng.int(100) >= RULES.warmingTilePct) continue;
    const coast = touchesOcean(map, i);
    const into: TerrainId | null = coast ? (t === "forest" ? "jungle" : "swamp") : t === "desert" ? null : "desert";
    if (!into) continue;
    map.terrain[i] = into;
    map.irrigation[i] = 0;
    map.mine[i] = 0;
    changed++;
  }
  draft.rng = rng.getState();
  events.push({ type: "globalWarming", tiles: changed });
}

function touchesOcean(map: GameState["map"], i: number): boolean {
  const x = i % map.width;
  const y = Math.floor(i / map.width);
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
      if (map.terrain[ny * map.width + nx] === "ocean") return true;
    }
  }
  return false;
}
