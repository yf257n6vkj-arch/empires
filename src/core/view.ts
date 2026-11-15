/**
 * What one player is allowed to know.
 *
 * The AI never receives GameState. It receives only PlayerView, built here,
 * which contains exactly what a human in the same seat could see on screen.
 * The screen for the human player is drawn from the same object, so both
 * sides play with the same information. New knowledge (enemy units, cities,
 * scores) must be added here, and only in the form a human could see it.
 */
import type { Point } from "./geometry";
import { builtWonders, researchCost, wonderFlag } from "./economy";
import type { BuildingId, GovernmentId, TechId, TerrainId } from "./rules";
import type { City, GameState, PlayerId, Spaceship, Unit } from "./state";

/** What a player knows about another empire. */
export interface RivalView {
  id: PlayerId;
  name: string;
  /** Details only an embassy reveals. */
  embassy: { techs: TechId[]; gold: number; government: GovernmentId } | null;
  /** Everybody hears about a launched spaceship and when it lands. */
  spaceshipArrival: number | null;
}

export interface PlayerView {
  playerId: PlayerId;
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
  start: Point;
  /** Names of all players. Contact and diplomacy rules come later. */
  playerNames: string[];
  units: Unit[];
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
    government: GovernmentId;
    revolution: { target: GovernmentId; turnsLeft: number } | null;
    spaceship: Spaceship;
    embassies: PlayerId[];
  };
  victory: GameState["victory"];
  /** Wonders already standing somewhere; every player hears when one is finished. */
  builtWonders: BuildingId[];
}

export function playerView(state: GameState, playerId: PlayerId): PlayerView {
  const player = state.players[playerId];
  if (!player) throw new Error(`playerView: unknown player ${playerId}`);
  const known = (values: number[]) => values.map((v, i) => (player.explored[i] ? v : 0));
  const seesAll = wonderFlag(state, playerId, "seesAllCities");
  return {
    playerId,
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
    start: { ...player.start },
    playerNames: state.players.map((p) => p.name),
    // Only own units and cities until other players can be met.
    units: state.units.filter((u) => u.owner === playerId).map((u) => ({ ...u })),
    cities: state.cities.filter((c) => c.owner === playerId).map((c) => ({ ...c })),
    foreignCities: state.cities
      .filter((c) => c.owner !== playerId && (seesAll || player.explored[c.y * state.map.width + c.x]))
      .map((c) => ({ ...c, worked: [], food: 0, shields: 0, tradeRoutes: [], stolenBy: [] })),
    rivals: state.players
      .filter((p) => p.id !== playerId)
      .map((p) => ({
        id: p.id,
        name: p.name,
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
      government: player.government,
      revolution: player.revolution ? { ...player.revolution } : null,
      spaceship: { ...player.spaceship },
      embassies: [...player.embassies],
    },
    victory: state.victory ? { ...state.victory } : null,
    builtWonders: builtWonders(state),
  };
}
