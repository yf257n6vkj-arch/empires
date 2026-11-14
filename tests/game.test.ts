import { describe, expect, it } from "vitest";
import { endTurn, isLand, minPairDistance, newGame, playerView } from "../src/core";

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
      }
      expect(minPairDistance(game.players.map((p) => p.start))).toBeGreaterThanOrEqual(8);
    },
  );

  it("makes only player 0 human", () => {
    const game = newGame({ seed: "humans", playerCount: 4 });
    expect(game.players.map((p) => p.isHuman)).toEqual([true, false, false, false]);
  });
});

describe("endTurn", () => {
  it("returns a new state and leaves the old one untouched", () => {
    const game = newGame({ seed: "turn", playerCount: 4 });
    const before = JSON.stringify(game);
    const next = endTurn(game);
    expect(next.turn).toBe(2);
    expect(JSON.stringify(game)).toBe(before);
  });
});

describe("playerView", () => {
  it("hides tiles the player has not explored", () => {
    const game = newGame({ seed: "fog", playerCount: 4 });
    const view = playerView(game, 1);
    const known = view.terrain.filter((t) => t !== null).length;
    expect(known).toBe(9);
    const { x, y } = game.players[1]!.start;
    expect(view.terrain[y * view.width + x]).toBe(game.map.terrain[y * game.map.width + x]);
  });

  it("does not reveal other players' start positions", () => {
    const game = newGame({ seed: "fog", playerCount: 4 });
    const view = playerView(game, 0);
    for (const other of game.players.slice(1)) {
      expect(view.terrain[other.start.y * view.width + other.start.x]).toBeNull();
    }
  });
});
