/**
 * What the player hears, decided without touching audio: which short sounds
 * a batch of game events calls for, what a blow in a fight sounds like, and
 * the notes of a piece of background music. Kept free of the Web Audio API so
 * it can be tested in Node; sound.ts plays what this decides.
 */
import type { GameEvent, PlayerId, UnitTypeId } from "../core";

export type Cue = "found" | "conquer" | "lose" | "tech" | "build" | "unit" | "wonder" | "war" | "victory" | "defeat" | "promote" | "charge";

/** Sounds after a batch of events: the most important first, each kind once, at most MAX_CUES. */
export function cuesFor(events: GameEvent[], me: PlayerId, ownerOfCity: (cityId: number) => PlayerId | undefined): Cue[] {
  const found = new Set<Cue>();
  for (const e of events) {
    switch (e.type) {
      case "cityFounded":
        if (e.owner === me) found.add("found");
        break;
      case "cityCaptured":
        if (e.to === me) found.add("conquer");
        else if (e.from === me) found.add("lose");
        break;
      case "cityDestroyed":
        if (e.by === me) found.add("conquer");
        else if (e.owner === me) found.add("lose");
        break;
      case "cityIncited":
        if (e.to === me) found.add("conquer");
        else if (e.from !== me && ownerOfCity(e.cityId) !== me) break;
        else found.add("lose");
        break;
      case "techLearned":
        if (e.player === me) found.add("tech");
        break;
      case "wonderBuilt":
        if (e.owner === me) found.add("wonder");
        break;
      case "buildingBuilt":
      case "spaceshipPartBuilt":
        if (ownerOfCity(e.cityId) === me) found.add("build");
        break;
      case "unitBuilt":
        if (ownerOfCity(e.cityId) === me) found.add("unit");
        break;
      case "warDeclared":
        if (e.on === me) found.add("war");
        break;
      case "gameWon":
        found.add(e.player === me ? "victory" : "defeat");
        break;
      case "civDestroyed":
        if (e.player === me) found.add("defeat");
        break;
    }
  }
  return CUE_ORDER.filter((c) => found.has(c)).slice(0, MAX_CUES);
}

const CUE_ORDER: Cue[] = ["victory", "defeat", "war", "lose", "conquer", "wonder", "found", "tech", "build", "unit", "promote", "charge"];
export const MAX_CUES = 3;

/** How a unit's blow sounds. */
export type Strike = "blade" | "arrow" | "siege" | "gun" | "cannon" | "engine" | "air";

const STRIKES: Partial<Record<UnitTypeId, Strike>> = {
  archers: "arrow",
  catapult: "siege",
  musketeers: "gun",
  riflemen: "gun",
  mechInf: "gun",
  cannon: "cannon",
  artillery: "cannon",
  frigate: "cannon",
  ironclad: "cannon",
  cruiser: "cannon",
  battleship: "cannon",
  submarine: "cannon",
  tank: "engine",
  fighter: "air",
  bomber: "air",
  nuclear: "air",
};

export function strikeOf(type: UnitTypeId): Strike {
  return STRIKES[type] ?? "blade";
}

// ---------- background music ----------

/** One note of a piece: when it starts and how long it lasts in seconds, MIDI pitch, loudness 0–1. */
export interface Note {
  at: number;
  length: number;
  pitch: number;
  gain: number;
  voice: "melody" | "bass" | "drone" | "drum";
}

export interface Piece {
  notes: Note[];
  /** Length of the piece in seconds. */
  length: number;
  /** The melody's instrument for the whole piece. */
  instrument: "flute" | "lute";
  beatsPerBar: number;
  tempo: number;
}

/** A small seeded generator, so a piece can be heard again and tested. */
export function seeded(seed: number): () => number {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** D Dorian, the mode of many medieval tunes: D E F G A B C. */
export const SCALE = [0, 2, 3, 5, 7, 9, 10];
const TONIC = 62; // D4

/** Chords as scale degrees of their root (0 = D minor, 6 = C major, 2 = F major, 3 = G major, 4 = A minor). */
const PROGRESSIONS = [
  [0, 6, 0, 4],
  [0, 2, 6, 0],
  [0, 3, 0, 6],
  [4, 3, 2, 3],
];

const RHYTHMS: Record<number, number[][]> = {
  3: [[1, 1, 1], [2, 1], [1.5, 0.5, 1], [0.5, 0.5, 1, 1], [1, 2]],
  4: [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [1.5, 0.5, 2], [0.5, 0.5, 1, 2], [1, 0.5, 0.5, 2]],
};

/** MIDI pitch of a scale step counted from D4; negative steps go down. */
export function pitchOf(step: number): number {
  const octave = Math.floor(step / 7);
  const degree = ((step % 7) + 7) % 7;
  return TONIC + 12 * octave + SCALE[degree]!;
}

function chordSteps(root: number): number[] {
  return [root, root + 2, root + 4];
}

/**
 * A tune in the form A A B A: four phrases of four bars over a repeating
 * chord progression, a plucked bass on the bar's first beat, a quiet drone on
 * D and A and a frame drum. In war the drum plays every beat. Ends on D.
 */
export function composePiece(seed: number, mood: "peace" | "war" = "peace"): Piece {
  const rnd = seeded(seed);
  const pick = <T>(list: T[]): T => list[Math.floor(rnd() * list.length)]!;
  const beatsPerBar = rnd() < 0.5 ? 3 : 4;
  const tempo = mood === "war" ? 84 + Math.floor(rnd() * 12) : 66 + Math.floor(rnd() * 14);
  const beat = 60 / tempo;
  const progression = pick(PROGRESSIONS);
  const instrument = rnd() < 0.5 ? "flute" : "lute";

  /** Four bars of melody as [step, beats] pairs, ending on a chord tone. */
  const phrase = (ending: number | null): [number, number][] => {
    const out: [number, number][] = [];
    let step = pick([0, 2, 4]);
    for (let bar = 0; bar < 4; bar++) {
      const rhythm = pick(RHYTHMS[beatsPerBar]!);
      const chord = chordSteps(progression[bar]!);
      rhythm.forEach((len, k) => {
        const last = bar === 3 && k === rhythm.length - 1;
        if (last && ending !== null) step = ending;
        else if (k === 0) {
          // Strong beat: the chord tone nearest to where the tune is.
          const tones = chord.flatMap((c) => [c - 7, c, c + 7]).filter((s) => s >= -2 && s <= 9);
          step = tones.reduce((a, b) => (Math.abs(b - step) < Math.abs(a - step) ? b : a));
        } else {
          step = Math.max(-2, Math.min(9, step + pick([-2, -1, -1, 1, 1, 2])));
        }
        out.push([step, len]);
      });
    }
    return out;
  };

  const a = phrase(4);
  const b = phrase(4);
  const tunes = [a, a, b, phrase(0)];
  const notes: Note[] = [];
  let t = 0;
  for (const tune of tunes) {
    const start = t;
    tune.forEach(([step, len], k) => {
      // A rest now and then lets the tune breathe; a phrase always ends on a note.
      if (k === tune.length - 1 || rnd() > 0.08) notes.push({ at: t, length: len * beat * 0.95, pitch: pitchOf(step), gain: 0.55 + rnd() * 0.15, voice: "melody" });
      t += len * beat;
    });
    for (let bar = 0; bar < 4; bar++) {
      const barAt = start + bar * beatsPerBar * beat;
      const root = progression[bar]!;
      notes.push({ at: barAt, length: beatsPerBar * beat, pitch: pitchOf(root) - 24, gain: 0.5, voice: "bass" });
      for (let k = 0; k < beatsPerBar; k++) {
        const strong = k === 0;
        if (mood === "war" || strong || (beatsPerBar === 4 && k === 2)) {
          notes.push({ at: barAt + k * beat, length: beat * 0.5, pitch: 0, gain: strong ? 0.6 : mood === "war" ? 0.4 : 0.3, voice: "drum" });
        }
      }
    }
  }
  const length = t + beat;
  notes.push({ at: 0, length, pitch: TONIC - 24, gain: 0.25, voice: "drone" });
  notes.push({ at: 0, length, pitch: TONIC - 17, gain: 0.18, voice: "drone" });
  return { notes: notes.sort((x, y) => x.at - y.at), length, instrument, beatsPerBar, tempo };
}
