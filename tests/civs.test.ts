import { describe, expect, it } from "vitest";
import { chooseCivs, CIV_IDS, CIVS, cityName, migrateState, newGame, playerView, Rng, STATE_VERSION } from "../src/core";
import { stateFromAscii } from "./helpers";

describe("nations", () => {
  it("are the fourteen of Civilization 1 and the Czechs, each with its own cities", () => {
    expect(CIV_IDS).toHaveLength(15);
    expect(CIVS.czechs).toMatchObject({ name: "Češi", leader: "Karel IV." });
    expect(CIVS.czechs.cities[0]).toBe("Praha");
    for (const id of CIV_IDS) expect(CIVS[id].cities.length).toBeGreaterThanOrEqual(16);
  });

  it("never put two nations of the same colour into one game", () => {
    for (let seed = 0; seed < 200; seed++) {
      const civs = chooseCivs(seed % 2 ? "czechs" : undefined, 4, Rng.fromSeed(`civs-${seed}`));
      expect(civs).toHaveLength(4);
      if (seed % 2) expect(civs[0]).toBe("czechs");
      expect(new Set(civs.map((c) => CIVS[c].colorGroup)).size).toBe(4);
    }
  });

  it("give the human the chosen nation and name cities from its list", () => {
    const s = newGame({ seed: "civ", playerCount: 4, civ: "aztecs" });
    expect(s.players[0]).toMatchObject({ civ: "aztecs", name: "Aztékové" });
    expect(new Set(s.players.map((p) => p.civ)).size).toBe(4);
    expect(cityName(s.players[0]!, 0, [])).toBe("Tenochtitlán");
    expect(playerView(s, 1).rivals.map((r) => r.civ)).toContain("aztecs");
  });

  it("run out of their own names into the shared list", () => {
    const s = stateFromAscii(["."], 1);
    const p = s.players[0]!;
    expect(cityName(p, CIVS[p.civ].cities.length, ["Lhota"])).toBe("Lhota");
  });

  it("are added to games saved before they existed", () => {
    const s = newGame({ seed: "old", playerCount: 3 });
    const old = JSON.parse(JSON.stringify(s)) as Record<string, unknown> & { players: Record<string, unknown>[] };
    old.version = 6;
    for (const p of old.players) delete p.civ;
    const migrated = migrateState(old)!;
    expect(migrated.version).toBe(STATE_VERSION);
    expect(migrated.players.map((p) => p.civ)).toEqual(["czechs", "romans", "germans"]);
    expect(migrated.players[0]!.name).toBe("Češi");
  });
});
