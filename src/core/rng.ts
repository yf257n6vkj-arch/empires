/**
 * Deterministic random number generator.
 *
 * All randomness in the game must go through this class so that the same
 * seed always produces the same map, the same combat results and the same
 * AI decisions. The internal state is four 32-bit integers and can be stored
 * in the game state and restored later (save games, replays, bug reports).
 *
 * Algorithm: sfc32, seeded from a string or number via cyrb128.
 */

export type RngState = [number, number, number, number];

/** Hashes a string into four 32-bit seeds (cyrb128). */
function cyrb128(input: string): RngState {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < input.length; i++) {
    const k = input.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  h1 ^= h2 ^ h3 ^ h4;
  h2 ^= h1;
  h3 ^= h1;
  h4 ^= h1;
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

export class Rng {
  private a: number;
  private b: number;
  private c: number;
  private d: number;

  private constructor(state: RngState) {
    [this.a, this.b, this.c, this.d] = state;
  }

  static fromSeed(seed: string | number): Rng {
    const rng = new Rng(cyrb128(String(seed)));
    // Discard the first outputs, sfc32 recommends warming up.
    for (let i = 0; i < 15; i++) rng.nextUint32();
    return rng;
  }

  static fromState(state: RngState): Rng {
    return new Rng([...state] as RngState);
  }

  getState(): RngState {
    return [this.a, this.b, this.c, this.d];
  }

  /** Independent generator derived from this one, e.g. for a sub-system. */
  fork(label: string): Rng {
    return Rng.fromSeed(`${this.nextUint32()}:${label}`);
  }

  nextUint32(): number {
    this.a >>>= 0;
    this.b >>>= 0;
    this.c >>>= 0;
    this.d >>>= 0;
    let t = (this.a + this.b) | 0;
    this.a = this.b ^ (this.b >>> 9);
    this.b = (this.c + (this.c << 3)) | 0;
    this.c = (this.c << 21) | (this.c >>> 11);
    this.d = (this.d + 1) | 0;
    t = (t + this.d) | 0;
    this.c = (this.c + t) | 0;
    return t >>> 0;
  }

  /** Float in [0, 1). */
  next(): number {
    return this.nextUint32() / 4294967296;
  }

  /** Integer in [0, maxExclusive). */
  int(maxExclusive: number): number {
    if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
      throw new Error(`Rng.int: invalid bound ${maxExclusive}`);
    }
    return Math.floor(this.next() * maxExclusive);
  }

  /** Integer in [min, max], both inclusive. */
  range(min: number, max: number): number {
    return min + this.int(max - min + 1);
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error("Rng.pick: empty array");
    return items[this.int(items.length)] as T;
  }

  shuffle<T>(items: readonly T[]): T[] {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.int(i + 1);
      [result[i], result[j]] = [result[j] as T, result[i] as T];
    }
    return result;
  }
}
