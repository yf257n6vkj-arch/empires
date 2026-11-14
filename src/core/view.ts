/**
 * What one player is allowed to know.
 *
 * The AI never receives GameState. It receives only PlayerView, built here,
 * which contains exactly what a human in the same seat could see on screen.
 * The screen for the human player is drawn from the same object, so both
 * sides play with the same information. New knowledge (enemy units, cities,
 * scores) must be added here, and only in the form a human could see it.
 */
import type { TerrainId } from "./rules";
import type { GameState, PlayerId } from "./state";
import type { Point } from "./geometry";

export interface PlayerView {
  playerId: PlayerId;
  turn: number;
  width: number;
  height: number;
  /** Terrain of explored tiles, null where the player has not been. */
  terrain: (TerrainId | null)[];
  start: Point;
  /** Names of all players. Contact and diplomacy rules come later. */
  playerNames: string[];
}

export function playerView(state: GameState, playerId: PlayerId): PlayerView {
  const player = state.players[playerId];
  if (!player) throw new Error(`playerView: unknown player ${playerId}`);
  return {
    playerId,
    turn: state.turn,
    width: state.map.width,
    height: state.map.height,
    terrain: state.map.terrain.map((t, i) => (player.explored[i] ? t : null)),
    start: { ...player.start },
    playerNames: state.players.map((p) => p.name),
  };
}
