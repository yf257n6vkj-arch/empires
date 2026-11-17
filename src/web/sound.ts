/**
 * Sound effects and background music, all made by code with the Web Audio
 * API: no recordings. The browser lets a page play sound only after the
 * player has touched it, so nothing sounds before the first click or key.
 * Music plays a generated piece, then rests for a while, then a new piece.
 */
import { composePiece, type Cue, type Note, type Piece, type Strike } from "./soundCues";

const SETTINGS_KEY = "empires.sound";

export interface SoundSettings {
  /** Loudness of effects, 0–100; 0 turns them off. */
  effects: number;
  /** Loudness of music, 0–100; 0 turns it off. */
  music: number;
}

const DEFAULTS: SoundSettings = { effects: 70, music: 40 };

function loadSettings(): SoundSettings {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? "null") as Partial<SoundSettings> | null;
    const clamp = (v: unknown, d: number) => (typeof v === "number" && v >= 0 && v <= 100 ? v : d);
    return { effects: clamp(saved?.effects, DEFAULTS.effects), music: clamp(saved?.music, DEFAULTS.music) };
  } catch {
    return { ...DEFAULTS };
  }
}

const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/**
 * The instruments: effects and music notes drawn on any audio context, the live one
 * of the game or an offline one that renders a sample to a file.
 */
export function createSynth(c: BaseAudioContext, fxBus: AudioNode, musicBus: AudioNode) {
  const noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

  // ---------- building blocks ----------

  function tone(
    c: BaseAudioContext,
    bus: AudioNode,
    at: number,
    opts: { type?: OscillatorType; freq: number; to?: number; length: number; gain: number; attack?: number; filter?: number; vibrato?: number },
  ): void {
    const osc = c.createOscillator();
    osc.type = opts.type ?? "sine";
    osc.frequency.setValueAtTime(opts.freq, at);
    if (opts.to) osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), at + opts.length);
    if (opts.vibrato) {
      const lfo = c.createOscillator();
      const depth = c.createGain();
      lfo.frequency.value = 5;
      depth.gain.setValueAtTime(0, at);
      depth.gain.linearRampToValueAtTime(opts.freq * opts.vibrato, at + Math.min(0.4, opts.length));
      lfo.connect(depth).connect(osc.frequency);
      lfo.start(at);
      lfo.stop(at + opts.length + 0.1);
    }
    const env = c.createGain();
    const attack = opts.attack ?? 0.005;
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(opts.gain, at + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, at + opts.length);
    let out: AudioNode = env;
    if (opts.filter) {
      const f = c.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = opts.filter;
      env.connect(f);
      out = f;
    }
    osc.connect(env);
    out.connect(bus);
    osc.start(at);
    osc.stop(at + opts.length + 0.05);
  }

  function burst(c: BaseAudioContext, bus: AudioNode, at: number, opts: { length: number; gain: number; type: BiquadFilterType; freq: number; to?: number; q?: number }): void {
    const src = c.createBufferSource();
    src.buffer = noise;
    const f = c.createBiquadFilter();
    f.type = opts.type;
    f.frequency.setValueAtTime(opts.freq, at);
    if (opts.to) f.frequency.exponentialRampToValueAtTime(opts.to, at + opts.length);
    f.Q.value = opts.q ?? 1;
    const env = c.createGain();
    env.gain.setValueAtTime(opts.gain, at);
    env.gain.exponentialRampToValueAtTime(0.0001, at + opts.length);
    src.connect(f).connect(env).connect(bus);
    src.start(at, Math.random() * 0.5);
    src.stop(at + opts.length + 0.05);
  }

  function bell(c: BaseAudioContext, bus: AudioNode, at: number, midi: number, gain: number, length = 1.6): void {
    const f = midiHz(midi);
    for (const [ratio, g] of [[1, 1], [2, 0.5], [2.76, 0.35], [5.4, 0.15]] as const) tone(c, bus, at, { freq: f * ratio, length: length / ratio ** 0.3, gain: gain * g, attack: 0.003 });
  }

  function brass(c: BaseAudioContext, bus: AudioNode, at: number, midi: number, length: number, gain: number): void {
    tone(c, bus, at, { type: "sawtooth", freq: midiHz(midi), length, gain, attack: 0.04, filter: 1800, vibrato: 0.006 });
    tone(c, bus, at, { type: "square", freq: midiHz(midi) * 1.003, length, gain: gain * 0.3, attack: 0.05, filter: 1200 });
  }

  function drum(c: BaseAudioContext, bus: AudioNode, at: number, gain: number, pitch = 140): void {
    tone(c, bus, at, { freq: pitch, to: pitch * 0.45, length: 0.28, gain });
    burst(c, bus, at, { length: 0.05, gain: gain * 0.4, type: "bandpass", freq: 1800 });
  }

  // ---------- effects ----------

  /** A blow in a fight: `mine` when it lands on the player's unit. */
  function hit(at: number, strike: Strike, mine: boolean): void {
    const bus = fxBus;
    switch (strike) {
      case "blade":
        tone(c, bus, at, { type: "triangle", freq: 1250 + Math.random() * 200, length: 0.22, gain: 0.25 });
        tone(c, bus, at, { type: "square", freq: 1810 + Math.random() * 150, length: 0.12, gain: 0.07, filter: 5000 });
        burst(c, bus, at, { length: 0.05, gain: 0.35, type: "highpass", freq: 2500 });
        break;
      case "arrow":
        burst(c, bus, at, { length: 0.14, gain: 0.25, type: "bandpass", freq: 3500, to: 900, q: 3 });
        tone(c, bus, at + 0.12, { freq: 220, to: 70, length: 0.09, gain: 0.35 });
        break;
      case "siege":
        tone(c, bus, at, { freq: 110, to: 45, length: 0.35, gain: 0.5 });
        burst(c, bus, at, { length: 0.3, gain: 0.3, type: "lowpass", freq: 900 });
        break;
      case "gun":
        burst(c, bus, at, { length: 0.16, gain: 0.55, type: "lowpass", freq: 2200, to: 400 });
        tone(c, bus, at, { freq: 130, to: 45, length: 0.12, gain: 0.4 });
        break;
      case "cannon":
      case "air":
        burst(c, bus, at, { length: 0.7, gain: 0.6, type: "lowpass", freq: 600, to: 120 });
        tone(c, bus, at, { freq: 75, to: 28, length: 0.6, gain: 0.6 });
        break;
      case "engine":
        burst(c, bus, at, { length: 0.6, gain: 0.55, type: "lowpass", freq: 700, to: 150 });
        tone(c, bus, at, { freq: 80, to: 30, length: 0.5, gain: 0.55 });
        tone(c, bus, at + 0.02, { type: "triangle", freq: 620, length: 0.25, gain: 0.08 });
        break;
    }
    // The player's own unit taking a blow gets a dull thud too, so it is told apart by ear.
    if (mine) tone(c, bus, at + 0.01, { freq: 95, to: 50, length: 0.16, gain: 0.35 });
  }

  function cue(at: number, name: Cue): void {
    const bus = fxBus;
    switch (name) {
      case "charge":
        for (let k = 0; k < 3; k++) drum(c, bus, at + k * 0.075, 0.35 + k * 0.08, 150 - k * 15);
        break;
      case "victory":
        [62, 66, 69].forEach((m, k) => brass(c, bus, at + k * 0.12, m, 0.18, 0.14));
        [62, 66, 69, 74].forEach((m) => brass(c, bus, at + 0.38, m, 0.9, 0.09));
        drum(c, bus, at + 0.38, 0.4, 110);
        break;
      case "defeat":
        [64, 62, 58].forEach((m, k) => tone(c, bus, at + k * 0.32, { type: "triangle", freq: midiHz(m), length: 0.5, gain: 0.22, attack: 0.03 }));
        tone(c, bus, at + 0.96, { type: "triangle", freq: midiHz(57), length: 1.1, gain: 0.2, attack: 0.03 });
        tone(c, bus, at + 0.96, { freq: midiHz(45), length: 1.2, gain: 0.2, attack: 0.03 });
        break;
      case "promote":
        [79, 83, 86].forEach((m, k) => bell(c, bus, at + k * 0.09, m, 0.08, 0.7));
        break;
      case "found":
        bell(c, bus, at, 67, 0.18);
        bell(c, bus, at + 0.35, 74, 0.16);
        break;
      case "conquer":
        for (let k = 0; k < 4; k++) drum(c, bus, at + k * 0.11, 0.4, 120);
        [62, 69, 74].forEach((m, k) => brass(c, bus, at + 0.45 + k * 0.15, m, k === 2 ? 0.8 : 0.16, 0.13));
        break;
      case "lose":
        bell(c, bus, at, 45, 0.45, 2.4);
        tone(c, bus, at + 0.3, { type: "triangle", freq: midiHz(57), to: midiHz(53), length: 1.4, gain: 0.15, attack: 0.05 });
        break;
      case "tech":
        [74, 76, 81, 86].forEach((m, k) => bell(c, bus, at + k * 0.11, m, 0.1, 1));
        break;
      case "build":
        for (let k = 0; k < 2; k++) {
          burst(c, bus, at + k * 0.16, { length: 0.04, gain: 0.4, type: "bandpass", freq: 1500, q: 2 });
          tone(c, bus, at + k * 0.16, { type: "triangle", freq: 420, to: 300, length: 0.09, gain: 0.25 });
        }
        bell(c, bus, at + 0.38, 81, 0.09, 0.8);
        break;
      case "unit":
        drum(c, bus, at, 0.35, 130);
        drum(c, bus, at + 0.14, 0.3, 130);
        break;
      case "wonder":
        [62, 66, 69, 74].forEach((m, k) => brass(c, bus, at + k * 0.16, m, 0.2, 0.12));
        [62, 66, 69, 74, 78].forEach((m) => brass(c, bus, at + 0.7, m, 1.6, 0.08));
        bell(c, bus, at + 0.7, 86, 0.1, 2);
        drum(c, bus, at + 0.7, 0.45, 100);
        break;
      case "war":
        tone(c, bus, at, { type: "sawtooth", freq: midiHz(45), length: 1.3, gain: 0.35, attack: 0.25, filter: 700, vibrato: 0.004 });
        tone(c, bus, at + 0.5, { type: "sawtooth", freq: midiHz(52), length: 1.0, gain: 0.28, attack: 0.2, filter: 700 });
        for (let k = 0; k < 3; k++) drum(c, bus, at + 1.1 + k * 0.2, 0.4, 100);
        break;
    }
  }

  // ---------- music ----------

  function playNote(at: number, n: Note, piece: Piece): void {
    const bus = musicBus;
    switch (n.voice) {
      case "melody":
        if (piece.instrument === "flute") {
          tone(c, bus, at, { freq: midiHz(n.pitch), length: n.length, gain: 0.12 * n.gain, attack: 0.06, vibrato: 0.005 });
          tone(c, bus, at, { freq: midiHz(n.pitch) * 2, length: n.length * 0.8, gain: 0.015 * n.gain, attack: 0.08 });
        } else {
          tone(c, bus, at, { type: "triangle", freq: midiHz(n.pitch), length: Math.min(1.4, n.length + 0.5), gain: 0.16 * n.gain, attack: 0.004, filter: 2400 });
          tone(c, bus, at, { type: "sawtooth", freq: midiHz(n.pitch), length: 0.25, gain: 0.03 * n.gain, attack: 0.003, filter: 1600 });
        }
        break;
      case "bass":
        tone(c, bus, at, { type: "triangle", freq: midiHz(n.pitch), length: Math.min(2, n.length), gain: 0.16 * n.gain, attack: 0.005, filter: 700 });
        break;
      case "drone":
        tone(c, bus, at, { type: "sawtooth", freq: midiHz(n.pitch), length: n.length, gain: 0.05 * n.gain, attack: 2, filter: 380 });
        break;
      case "drum":
        tone(c, bus, at, { freq: 95, to: 55, length: 0.3, gain: 0.25 * n.gain });
        burst(c, bus, at, { length: 0.04, gain: 0.05 * n.gain, type: "bandpass", freq: 1200 });
        break;
    }
  }

  return { hit, cue, playNote };
}

export function createSound() {
  let settings = loadSettings();
  let ctx: AudioContext | null = null;
  let fxBus: GainNode | null = null;
  let musicBus: GainNode | null = null;
  let synth: ReturnType<typeof createSynth> | null = null;
  let mood: "peace" | "war" = "peace";
  let musicTimer = 0;
  let nextPieceAt = 0;
  let scheduled: { piece: Piece; start: number; next: number } | null = null;
  let pieceSeed = Math.floor(Math.random() * 1e9);

  function unlock(): void {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
      fxBus = ctx.createGain();
      musicBus = ctx.createGain();
      const comp = ctx.createDynamicsCompressor();
      fxBus.connect(comp);
      musicBus.connect(comp);
      comp.connect(ctx.destination);
      synth = createSynth(ctx, fxBus, musicBus);
      applyVolumes();
      // The first piece starts a little after the game opens.
      nextPieceAt = ctx.currentTime + 2;
      musicTimer = window.setInterval(tickMusic, 120);
    }
    if (ctx.state === "suspended" && !document.hidden) void ctx.resume();
  }
  for (const ev of ["pointerdown", "keydown"]) window.addEventListener(ev, unlock, { capture: true });
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else void ctx.resume();
  });

  function applyVolumes(): void {
    if (!ctx || !fxBus || !musicBus) return;
    // Loudness grows roughly as people hear it.
    const curve = (v: number) => (v / 100) ** 2;
    fxBus.gain.setTargetAtTime(curve(settings.effects) * 0.9, ctx.currentTime, 0.05);
    musicBus.gain.setTargetAtTime(curve(settings.music) * 4, ctx.currentTime, 0.3);
  }

  function ready(): AudioContext | null {
    return ctx && ctx.state === "running" && settings.effects > 0 ? ctx : null;
  }

  function tickMusic(): void {
    if (!ctx || !musicBus || ctx.state !== "running") return;
    const now = ctx.currentTime;
    if (settings.music === 0) {
      scheduled = null;
      return;
    }
    if (!scheduled) {
      if (now < nextPieceAt) return;
      const piece = composePiece(pieceSeed++, mood);
      // A short tune is played twice so it can be remembered.
      const twice: Piece = { ...piece, notes: [...piece.notes, ...piece.notes.map((n) => ({ ...n, at: n.at + piece.length }))], length: piece.length * 2 };
      scheduled = { piece: twice, start: now + 0.2, next: 0 };
    }
    const s = scheduled;
    const horizon = now + 0.6;
    while (s.next < s.piece.notes.length && s.start + s.piece.notes[s.next]!.at < horizon) {
      const n = s.piece.notes[s.next++]!;
      synth?.playNote(Math.max(now, s.start + n.at), n, s.piece);
    }
    if (now > s.start + s.piece.length) {
      scheduled = null;
      // Silence between pieces keeps the music from wearing on the player.
      nextPieceAt = now + 25 + Math.random() * 35;
    }
  }

  return {
    settings: (): SoundSettings => ({ ...settings }),
    set(next: Partial<SoundSettings>): void {
      settings = { ...settings, ...next };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // Not remembered without storage.
      }
      applyVolumes();
    },
    /** Peace or war: the next piece is calmer or has a marching drum. */
    setMood(next: "peace" | "war"): void {
      mood = next;
    },
    hit(strike: Strike, mine: boolean): void {
      const c = ready();
      if (c && synth) synth.hit(c.currentTime + 0.01, strike, mine);
    },
    cue(name: Cue, delay = 0): void {
      const c = ready();
      if (c && synth) synth.cue(c.currentTime + 0.02 + delay, name);
    },
    /** Plays a few cues one after another. */
    cues(names: Cue[]): void {
      const c = ready();
      if (c && synth) names.forEach((n, k) => synth!.cue(c.currentTime + 0.02 + k * 0.7, n));
    },
    /** Stops the music timer; for tests and teardown. */
    dispose(): void {
      window.clearInterval(musicTimer);
      void ctx?.close();
    },
  };
}

export type Sound = ReturnType<typeof createSound>;
