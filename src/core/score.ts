/**
 * Score and the two ways to win besides the spaceship: conquest, when only
 * one nation is left, and score, when the last turn ends. The weights are in
 * game.json under "score".
 */
import { cityHappiness } from "./city";
import type { GameEvent } from "./events";
import { BUILDINGS, RULES } from "./rules";
import { isBarbarian, type GameState, type PlayerId } from "./state";

export interface Score {
  /** Citizens in all cities. */
  citizens: number;
  /** Happy citizens, who count once more. */
  happy: number;
  techs: number;
  wonders: number;
  /** Points for a spaceship that landed. */
  spaceship: number;
  total: number;
}

export function scoreOf(state: GameState, player: PlayerId): Score {
  const p = state.players[player];
  const w = RULES.score;
  const cities = state.cities.filter((c) => c.owner === player);
  const citizens = cities.reduce((n, c) => n + c.size, 0);
  const happy = cities.reduce((n, c) => n + cityHappiness(state, c).happy, 0);
  const techs = p?.techs.length ?? 0;
  const wonders = cities.reduce((n, c) => n + c.buildings.filter((b) => BUILDINGS[b].wonder).length, 0);
  const landed = state.victory?.kind === "space" && state.victory.player === player;
  const parts = {
    citizens: citizens * w.citizen,
    happy: happy * w.happy,
    techs: techs * w.tech,
    wonders: wonders * w.wonder,
    spaceship: landed ? w.spaceship : 0,
  };
  return { ...parts, total: parts.citizens + parts.happy + parts.techs + parts.wonders + parts.spaceship };
}

/** Records where every player stands at the end of the turn (mutates the draft). */
export function recordTurnDraft(draft: GameState): void {
  draft.history.push({
    turn: draft.turn,
    score: draft.players.map((p) => (isBarbarian(p) ? 0 : scoreOf(draft, p.id).total)),
    cities: draft.players.map((p) => draft.cities.filter((c) => c.owner === p.id).length),
    techs: draft.players.map((p) => p.techs.length),
  });
}

/** Nations still in the game, barbarians aside. */
export function nationsAlive(state: GameState): PlayerId[] {
  return state.players.filter((p) => !p.defeated && !isBarbarian(p)).map((p) => p.id);
}

/** When only one nation is left, it has won by conquest (mutates the draft). */
export function conquestDraft(draft: GameState, events: GameEvent[]): void {
  if (draft.victory) return;
  const alive = nationsAlive(draft);
  const all = draft.players.filter((p) => !isBarbarian(p)).length;
  if (alive.length !== 1 || all < 2) return;
  draft.victory = { player: alive[0]!, kind: "conquest", turn: draft.turn };
  events.push({ type: "gameWon", player: alive[0]!, kind: "conquest" });
}

/** After the last turn the nation with the highest score wins (mutates the draft). */
export function scoreVictoryDraft(draft: GameState, events: GameEvent[]): void {
  if (draft.victory || draft.turn <= RULES.maxTurns) return;
  let best: { id: PlayerId; total: number } | null = null;
  for (const id of nationsAlive(draft)) {
    const total = scoreOf(draft, id).total;
    if (!best || total > best.total) best = { id, total };
  }
  if (!best) return;
  draft.victory = { player: best.id, kind: "score", turn: RULES.maxTurns };
  events.push({ type: "gameWon", player: best.id, kind: "score" });
}
