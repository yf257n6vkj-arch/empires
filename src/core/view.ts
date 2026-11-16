/**
 * What one player is allowed to know.
 *
 * The AI never receives GameState. It receives only PlayerView, built here,
 * which contains exactly what a human in the same seat could see on screen.
 * The screen for the human player is drawn from the same object, so both
 * sides play with the same information. New knowledge (enemy units, cities,
 * scores) must be added here, and only in the form a human could see it.
 */
import { tilesInRadius, type Point } from "./geometry";
import { scoreOf, type Score } from "./score";
import { builtWonders, researchCost, wonderFlag } from "./economy";
import { RULES, UNIT_TYPES, type BuildingId, type GovernmentId, type NationId, type TechId, type TerrainId } from "./rules";
import { isBarbarian, type City, type GameState, type PlayerId, type Spaceship, type Unit } from "./state";

/** What a player knows about another empire. */
export interface RivalView {
  id: PlayerId;
  /** Nation, so the AI and the screen know the leader, colour and nature. */
  civ: NationId;
  /** The barbarians: always at war, no treaties, not a rival for victory. */
  barbarian: boolean;
  name: string;
  /** The two empires have met. */
  contact: boolean;
  atWar: boolean;
  /** Details only an embassy reveals. */
  embassy: { techs: TechId[]; gold: number; government: GovernmentId } | null;
  /** Everybody hears about a launched spaceship and when it lands. */
  spaceshipArrival: number | null;
  /** Score, known once the two have met; the barbarians have none. */
  score: number | null;
  /** The nation has lost its last city; everybody hears of it. */
  defeated: boolean;
}

export interface PlayerView {
  playerId: PlayerId;
  civ: NationId;
  turn: number;
  isMyTurn: boolean;
  width: number;
  height: number;
  /** Terrain of explored tiles, null where the player has not been. */
  terrain: (TerrainId | null)[];
  /**
   * Improvements on explored tiles. For now they show the current state;
   * once opponents can change land the player cannot see, this becomes
   * "as last seen".
   */
  road: number[];
  irrigation: number[];
  mine: number[];
  railroad: number[];
  fortress: number[];
  /** Special resources on explored tiles. */
  special: number[];
  /** Polluted explored tiles. */
  pollution: number[];
  /** Ruins on explored tiles that nobody has entered yet. */
  ruins: number[];
  /** How close global warming is, 0 to 100 percent; the whole world sees it. */
  warmingPct: number;
  start: Point;
  /** Names of all players. Contact and diplomacy rules come later. */
  playerNames: string[];
  units: Unit[];
  /** Other players' units on tiles the player sees right now, passengers of ships hidden. */
  foreignUnits: Unit[];
  /** Tiles the player sees right now; elsewhere the map shows what was last seen. */
  visible: number[];
  cities: City[];
  /** Other players' cities the player has seen on explored land, or all of them with the space program. */
  foreignCities: City[];
  rivals: RivalView[];
  /** The player's own economy, as shown in the top bar. */
  economy: {
    techs: TechId[];
    researching: TechId | null;
    researchGoal: TechId | null;
    research: number;
    researchCost: number;
    gold: number;
    scienceRate: number;
    luxuryRate: number;
    government: GovernmentId;
    revolution: { target: GovernmentId; turnsLeft: number } | null;
    spaceship: Spaceship;
    embassies: PlayerId[];
    /** Enemy cities this player has taken or razed. */
    captured: number;
  };
  victory: GameState["victory"];
  /** The player's own score with its parts. */
  score: Score;
  /** Wonders already standing somewhere; every player hears when one is finished. */
  builtWonders: BuildingId[];
}

/** Tiles a player sees this moment: around own units by their sight and around own cities. */
export function visibleTiles(state: GameState, playerId: PlayerId): number[] {
  const seen = new Array<number>(state.map.width * state.map.height).fill(0);
  const mark = (center: Point, radius: number) => {
    for (const i of tilesInRadius(state.map, center, radius)) seen[i] = 1;
  };
  for (const u of state.units) if (u.owner === playerId) mark(u, UNIT_TYPES[u.type].sight ?? RULES.unitSight);
  for (const c of state.cities) if (c.owner === playerId) mark(c, RULES.citySight);
  return seen;
}

export function playerView(state: GameState, playerId: PlayerId): PlayerView {
  const player = state.players[playerId];
  if (!player) throw new Error(`playerView: unknown player ${playerId}`);
  const visible = visibleTiles(state, playerId);
  const known = (values: number[]) => values.map((v, i) => (player.explored[i] ? v : 0));
  const seesAll = wonderFlag(state, playerId, "seesAllCities");
  return {
    playerId,
    civ: player.civ,
    turn: state.turn,
    isMyTurn: state.currentPlayer === playerId,
    width: state.map.width,
    height: state.map.height,
    terrain: state.map.terrain.map((t, i) => (player.explored[i] ? t : null)),
    road: known(state.map.road),
    irrigation: known(state.map.irrigation),
    mine: known(state.map.mine),
    railroad: known(state.map.railroad),
    fortress: known(state.map.fortress),
    special: known(state.map.special),
    pollution: known(state.map.pollution),
    ruins: known(state.map.ruins),
    warmingPct: Math.min(100, Math.round((100 * state.warming) / RULES.warmingLimit)),
    start: { ...player.start },
    playerNames: state.players.map((p) => p.name),
    // Only own units and cities until other players can be met.
    units: state.units.filter((u) => u.owner === playerId).map((u) => ({ ...u })),
    foreignUnits: state.units
      .filter((u) => u.owner !== playerId && u.carriedBy === null && visible[u.y * state.map.width + u.x])
      .map((u) => ({ ...u, goto: null, orders: null, work: null, homeCity: null })),
    visible,
    cities: state.cities.filter((c) => c.owner === playerId).map((c) => ({ ...c })),
    foreignCities: state.cities
      .filter((c) => c.owner !== playerId && (seesAll || player.explored[c.y * state.map.width + c.x]))
      .map((c) => ({ ...c, worked: [], food: 0, shields: 0, queue: [], tradeRoutes: [], stolenBy: [], taxmen: 0, scientists: 0, disorderTurns: 0, soldTurn: null, governor: null })),
    rivals: state.players
      .filter((p) => p.id !== playerId)
      .map((p) => ({
        id: p.id,
        civ: p.civ,
        barbarian: isBarbarian(p),
        score: player.contacts.includes(p.id) && !isBarbarian(p) && !p.defeated ? scoreOf(state, p.id).total : null,
        defeated: p.defeated,
        name: p.name,
        contact: player.contacts.includes(p.id),
        atWar: player.atWar.includes(p.id),
        embassy: player.embassies.includes(p.id) ? { techs: [...p.techs], gold: p.gold, government: p.government } : null,
        spaceshipArrival: p.spaceship.arrivalTurn,
      })),
    economy: {
      techs: [...player.techs],
      researching: player.researching,
      researchGoal: player.researchGoal,
      research: player.research,
      researchCost: researchCost(player),
      gold: player.gold,
      scienceRate: player.scienceRate,
      luxuryRate: player.luxuryRate,
      government: player.government,
      revolution: player.revolution ? { ...player.revolution } : null,
      spaceship: { ...player.spaceship },
      embassies: [...player.embassies],
      captured: player.captured,
    },
    victory: state.victory ? { ...state.victory } : null,
    score: scoreOf(state, playerId),
    builtWonders: builtWonders(state),
  };
}
