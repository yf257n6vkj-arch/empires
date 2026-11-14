import { describe, expect, it } from "vitest";
import { Rng } from "../src/core";

describe("Rng", () => {
  it("gives the same sequence for the same seed", () => {
    const a = Rng.fromSeed("empires");
    const b = Rng.fromSeed("empires");
    const seqA = Array.from({ length: 50 }, () => a.nextUint32());
    const seqB = Array.from({ length: 50 }, () => b.nextUint32());
    expect(seqA).toEqual(seqB);
  });

  it("gives different sequences for different seeds", () => {
    expect(Rng.fromSeed("a").nextUint32()).not.toBe(Rng.fromSeed("b").nextUint32());
  });

  it("continues identically after saving and restoring its state", () => {
    const rng = Rng.fromSeed(42);
    for (let i = 0; i < 10; i++) rng.next();
    const restored = Rng.fromState(JSON.parse(JSON.stringify(rng.getState())));
    expect(Array.from({ length: 20 }, () => restored.next())).toEqual(
      Array.from({ length: 20 }, () => rng.next()),
    );
  });

  it("keeps int() within bounds and roughly uniform", () => {
    const rng = Rng.fromSeed("uniform");
    const counts = new Array(6).fill(0);
    for (let i = 0; i < 60000; i++) {
      const v = rng.int(6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
      counts[v]++;
    }
    for (const c of counts) expect(Math.abs(c - 10000)).toBeLessThan(500);
  });
});
