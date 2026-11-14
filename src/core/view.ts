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
import type { TerrainId } from "./rules";
import type { City, GameState, PlayerId, Unit } from "./state";

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
  start: Point;
  /** Names of all players. Contact and diplomacy rules come later. */
  playerNames: string[];
  units: Unit[];
  cities: City[];
}

export function playerView(state: GameState, playerId: PlayerId): PlayerView {
  const player = state.players[playerId];
  if (!player) throw new Error(`playerView: unknown player ${playerId}`);
  const known = (values: number[]) => values.map((v, i) => (player.explored[i] ? v : 0));
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
    start: { ...player.start },
    playerNames: state.players.map((p) => p.name),
    // Only own units and cities until other players can be met.
    units: state.units.filter((u) => u.owner === playerId).map((u) => ({ ...u })),
    cities: state.cities.filter((c) => c.owner === playerId).map((c) => ({ ...c })),
  };
}
