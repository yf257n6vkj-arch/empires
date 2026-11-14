/**
 * The whole game state as one plain, JSON-serialisable object.
 * A turn is a function from the old state and commands to a new state.
 */
import type { Point } from "./geometry";
import type { TerrainId } from "./rules";
import type { RngState } from "./rng";

export const STATE_VERSION = 1;

export interface GameMap {
  width: number;
  height: number;
  /** Terrain per tile, index = y * width + x. */
  terrain: TerrainId[];
}

export type PlayerId = number;

export interface Player {
  id: PlayerId;
  name: string;
  isHuman: boolean;
  /** Where the player starts. Units arrive in phase 1. */
  start: Point;
  /** 1 = the player has seen this tile at least once. */
  explored: number[];
}

export interface GameState {
  version: number;
  seed: string;
  /** Generator state after the last random draw, so saves continue identically. */
  rng: RngState;
  turn: number;
  map: GameMap;
  players: Player[];
}
