import { describe, expect, it } from "vitest";
import {
  apply,
  applyCommand,
  distance,
  findPath,
  isLand,
  minPairDistance,
  newGame,
  passComputerTurns,
  playerView,
  type GameState,
  type Point,
  tileYield,
} from "../src/core";

describe("newGame", () => {
  it("is fully reproducible from the seed", () => {
    expect(newGame({ seed: "repro", playerCount: 4 })).toEqual(newGame({ seed: "repro", playerCount: 4 }));
  });

  it("survives a JSON round trip unchanged", () => {
    const game = newGame({ seed: "save", playerCount: 4 });
    expect(JSON.parse(JSON.stringify(game))).toEqual(game);
  });

  it.each(Array.from({ length: 30 }, (_, i) => `start-${i}`))(
    "places four players on land, far apart (%s)",
    (seed) => {
      const game = newGame({ seed, playerCount: 4 });
      expect(game.players).toHaveLength(4);
      for (const p of game.players) {
        const terrain = game.map.terrain[p.start.y * game.map.width + p.start.x]!;
        expect(isLand(terrain)).toBe(true);
        expect(terrain).not.toBe("mountains");
        // A capital founded on the start tile feeds itself.
        expect(tileYield(game.map, p.start.y * game.map.width + p.start.x, true).food).toBeGreaterThanOrEqual(2);
      }
      expect(minPairDistance(game.players.map((p) => p.start))).toBeGreaterThanOrEqual(8);
    },
  );

  it("gives the human a settler and a warrior, computer players nothing yet", () => {
    const game = newGame({ seed: "units", playerCount: 4 });
    expect(game.units.map((u) => [u.owner, u.type])).toEqual([
      [0, "settlers"],
      [0, "warriors"],
    ]);
    expect(newGame({ seed: "units", playerCount: 4, opponentUnits: true }).units).toHaveLength(8);
  });
});

describe("turn order", () => {
  it("returns a new state and leaves the old one untouched", () => {
    const game = newGame({ seed: "turn", playerCount: 4 });
    const before = JSON.stringify(game);
    const next = passComputerTurns(apply(game, { type: "endTurn" })).state;
    expect(next.turn).toBe(2);
    expect(next.currentPlayer).toBe(0);
    expect(JSON.stringify(game)).toBe(before);
  });
});

describe("playerView", () => {
  it("hides tiles the player has not explored", () => {
    const game = newGame({ seed: "fog", playerCount: 4 });
    const view = playerView(game, 1);
    expect(view.terrain.filter((t) => t !== null)).toHaveLength(9);
  });

  it("does not reveal other players' start positions or units", () => {
    const game = newGame({ seed: "fog", playerCount: 4, opponentUnits: true });
    const view = playerView(game, 0);
    for (const other of game.players.slice(1)) {
      expect(view.terrain[other.start.y * view.width + other.start.x]).toBeNull();
    }
    expect(view.units.every((u) => u.owner === 0)).toBe(true);
  });
});

/**
 * A scripted opening played for 30 turns on many seeds: found the capital,
 * explore with the warrior, build a settler and found a second city. It checks
 * that whole games run without errors and stay consistent.
 */
describe("scripted 30-turn opening", () => {
  function play(seed: string): GameState {
    let s = newGame({ seed, playerCount: 4 });
    const settler = s.units.find((u) => u.type === "settlers")!;
    s = apply(s, { type: "foundCity", unitId: settler.id });
    const capital = s.cities[0]!;
    s = apply(s, { type: "setProduction", cityId: capital.id, item: { kind: "unit", id: "settlers" } });

    for (let t = 0; t < 30; t++) {
      for (const u of s.units.filter((x) => x.owner === 0 && x.movesLeft > 0 && !x.goto)) {
        if (u.type === "settlers") {
          // Found a city once at least 3 tiles from every city, otherwise head for such a tile.
          if (applyCommand(s, { type: "foundCity", unitId: u.id }).ok && s.cities.every((c) => distance(c, u) >= 3)) {
            s = apply(s, { type: "foundCity", unitId: u.id });
            continue;
          }
          const target = farthestKnownLand(s, u, (p) => s.cities.every((c) => distance(c, p) >= 3), 5);
          if (target) {
            const r = applyCommand(s, { type: "goto", unitId: u.id, to: target });
            if (r.ok) s = r.state;
          }
        } else {
          const target = farthestKnownLand(s, u, () => true, 8);
          const r = target ? applyCommand(s, { type: "goto", unitId: u.id, to: target }) : null;
          s = r && r.ok ? r.state : apply(s, { type: "fortify", unitId: u.id });
        }
      }
      s = passComputerTurns(apply(s, { type: "endTurn" })).state;
    }
    return s;
  }

  /** Nearest-first scan for an explored land tile within `maxDistance`, picking the farthest suitable one. */
  function farthestKnownLand(s: GameState, from: Point, ok: (p: Point) => boolean, maxDistance: number): Point | null {
    let best: Point | null = null;
    let bestD = 0;
    const explored = s.players[0]!.explored;
    s.map.terrain.forEach((t, i) => {
      if (!explored[i] || !isLand(t)) return;
      const p = { x: i % s.map.width, y: Math.floor(i / s.map.width) };
      const d = distance(from, p);
      if (d > bestD && d <= maxDistance && ok(p) && findPath(s, 0, from, p)) {
        best = p;
        bestD = d;
      }
    });
    return best;
  }

  it.each(Array.from({ length: 10 }, (_, i) => `opening-${i}`))("plays without errors (%s)", (seed) => {
    const s = play(seed);
    expect(s.turn).toBe(31);
    expect(s.cities.length).toBeGreaterThanOrEqual(2);
    for (const c of s.cities) {
      expect(c.size).toBeGreaterThanOrEqual(1);
      expect(c.worked.length).toBeLessThanOrEqual(c.size);
    }
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
