/**
 * Contact between empires: two players meet when a unit or city of one comes
 * into sight of the other. Only players who have met can go to war.
 */
import type { GameEvent } from "./events";
import type { GameState } from "./state";
import { visibleTiles } from "./view";

/** Records new contacts after something moved (mutates the draft). */
export function meetDraft(draft: GameState, events: GameEvent[]): void {
  const alive = draft.players.filter((p) => !p.defeated);
  if (alive.length < 2) return;
  const sight = new Map(alive.map((p) => [p.id, visibleTiles(draft, p.id)]));
  const w = draft.map.width;
  for (const a of alive) {
    const seen = sight.get(a.id)!;
    for (const b of alive) {
      if (a.id >= b.id || a.contacts.includes(b.id)) continue;
      const seesB = (x: number, y: number) => seen[y * w + x] === 1;
      const bSeen = sight.get(b.id)!;
      const seesA = (x: number, y: number) => bSeen[y * w + x] === 1;
      const met =
        draft.units.some((u) => (u.owner === b.id && seesB(u.x, u.y)) || (u.owner === a.id && seesA(u.x, u.y))) ||
        draft.cities.some((c) => (c.owner === b.id && seesB(c.x, c.y)) || (c.owner === a.id && seesA(c.x, c.y)));
      if (!met) continue;
      a.contacts.push(b.id);
      b.contacts.push(a.id);
      events.push({ type: "contactMade", a: a.id, b: b.id });
    }
  }
}
