import { describe, expect, it } from "vitest";
import type { GameEvent } from "../src/core";
import { composePiece, cuesFor, MAX_CUES, pitchOf, SCALE, strikeOf } from "../src/web/soundCues";

const owners: Record<number, number> = { 1: 0, 2: 1 };
const ownerOf = (id: number) => owners[id];

describe("sound cues", () => {
  it("sounds only what concerns the player", () => {
    const events: GameEvent[] = [
      { type: "cityFounded", cityId: 2, owner: 1 },
      { type: "techLearned", player: 1, tech: "alphabet" },
      { type: "buildingBuilt", cityId: 2, building: "granary" },
    ];
    expect(cuesFor(events, 0, ownerOf)).toEqual([]);
    expect(cuesFor([{ type: "buildingBuilt", cityId: 1, building: "granary" }], 0, ownerOf)).toEqual(["build"]);
  });

  it("tells a captured city from a lost one", () => {
    const won: GameEvent = { type: "cityCaptured", cityId: 2, from: 1, to: 0, gold: 0, tech: null, lostBuildings: [] };
    const lost: GameEvent = { type: "cityCaptured", cityId: 1, from: 0, to: 1, gold: 0, tech: null, lostBuildings: [] };
    expect(cuesFor([won], 0, ownerOf)).toEqual(["conquer"]);
    expect(cuesFor([lost], 0, ownerOf)).toEqual(["lose"]);
  });

  it("plays each kind once, the most important first, and only a few", () => {
    const events: GameEvent[] = [
      { type: "unitBuilt", cityId: 1, unitId: 5, unitType: "warriors" },
      { type: "buildingBuilt", cityId: 1, building: "granary" },
      { type: "buildingBuilt", cityId: 1, building: "temple" },
      { type: "techLearned", player: 0, tech: "alphabet" },
      { type: "warDeclared", by: 1, on: 0 },
    ];
    const cues = cuesFor(events, 0, ownerOf);
    expect(cues[0]).toBe("war");
    expect(cues.length).toBe(MAX_CUES);
    expect(new Set(cues).size).toBe(cues.length);
  });

  it("gives guns and cannons their own blow", () => {
    expect(strikeOf("warriors")).toBe("blade");
    expect(strikeOf("musketeers")).toBe("gun");
    expect(strikeOf("artillery")).toBe("cannon");
  });
});

describe("music", () => {
  it("composes the same piece from the same seed", () => {
    expect(composePiece(7)).toEqual(composePiece(7));
    expect(composePiece(7)).not.toEqual(composePiece(8));
  });

  it("keeps the tune in its mode and range and ends it on D", () => {
    const pitches = new Set(SCALE.map((s) => s % 12));
    for (let seed = 1; seed < 60; seed++) {
      const piece = composePiece(seed);
      const melody = piece.notes.filter((n) => n.voice === "melody");
      expect(melody.length).toBeGreaterThan(20);
      for (const n of melody) {
        expect(pitches.has((((n.pitch - 62) % 12) + 12) % 12)).toBe(true);
        expect(n.pitch).toBeGreaterThanOrEqual(pitchOf(-2));
        expect(n.pitch).toBeLessThanOrEqual(pitchOf(9));
        expect(n.at + n.length).toBeLessThanOrEqual(piece.length);
      }
      const last = melody.at(-1)!;
      expect(last.pitch % 12).toBe(62 % 12);
      expect(piece.length).toBeGreaterThan(25);
      expect(piece.length).toBeLessThan(80);
    }
  });

  it("drums every beat in war", () => {
    const drums = (mood: "peace" | "war") => composePiece(3, mood).notes.filter((n) => n.voice === "drum").length;
    expect(drums("war")).toBeGreaterThan(drums("peace"));
  });
});
