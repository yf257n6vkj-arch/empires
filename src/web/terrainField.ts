/**
 * The terrain "field": the map's ground painted at several samples per tile,
 * with borders between terrains bent by smooth noise. Tiles still own their
 * terrain for the rules; this only decides which colour a point of the ground
 * shows, so that grassland, plains and forest meet along natural curves
 * instead of square edges.
 *
 * Land meets land along strongly bent lines. The coast bends much less, so a
 * land tile always looks like land and a sea tile like sea.
 */
import type { TerrainId } from "../core";

/** Samples per tile along each axis. */
export const FIELD_RES = 28;

const TERRAIN_INDEX: Record<TerrainId, number> = {
  ocean: 1,
  grassland: 2,
  plains: 3,
  forest: 4,
  hills: 5,
  mountains: 6,
  desert: 7,
};
const INDEX_TERRAIN: (TerrainId | null)[] = [null, "ocean", "grassland", "plains", "forest", "hills", "mountains", "desert"];

/** How far (in tiles) borders may move: between land terrains and at the coast. */
const LAND_WARP = 0.48;
const COAST_WARP = 0.2;

interface Warp {
  width: number;
  height: number;
  /** For each sample, the tile it takes its terrain from when land meets land. */
  land: Int32Array;
  /** For each sample, the tile that decides between land and sea. */
  coast: Int32Array;
  /** The tile each sample lies in, without any bending. */
  own: Int32Array;
  /** Gentle light and dark mottling, 0..1. */
  tone: Float32Array;
}

export interface Field {
  width: number;
  height: number;
  /** Terrain index (see INDEX_TERRAIN) per sample, 0 = unknown. */
  terrain: Uint8Array;
  canvas: HTMLCanvasElement;
}

// ---------- noise ----------

function ihash(x: number, y: number, k: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(k, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function valueNoise(x: number, y: number, k: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = ihash(x0, y0, k);
  const b = ihash(x0 + 1, y0, k);
  const c = ihash(x0, y0 + 1, k);
  const d = ihash(x0 + 1, y0 + 1, k);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** Smooth noise in -1..1 with two octaves. */
function noise(x: number, y: number, k: number): number {
  return (valueNoise(x * 0.8, y * 0.8, k) * 0.55 + valueNoise(x * 1.9, y * 1.9, k + 101) * 0.3 + valueNoise(x * 4.1, y * 4.1, k + 202) * 0.15) * 2 - 1;
}

// ---------- warp, computed once per map size ----------

let warp: Warp | null = null;

function getWarp(width: number, height: number): Warp {
  if (warp && warp.width === width && warp.height === height) return warp;
  const w = width * FIELD_RES;
  const h = height * FIELD_RES;
  const land = new Int32Array(w * h);
  const coast = new Int32Array(w * h);
  const tone = new Float32Array(w * h);
  const own = new Int32Array(w * h);
  const tileAt = (fx: number, fy: number) => {
    const tx = Math.min(width - 1, Math.max(0, Math.floor(fx)));
    const ty = Math.min(height - 1, Math.max(0, Math.floor(fy)));
    return ty * width + tx;
  };
  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const fx = (sx + 0.5) / FIELD_RES;
      const fy = (sy + 0.5) / FIELD_RES;
      // Value noise stays mostly near zero, so stretch it and clip at a full step.
      const nx = Math.max(-1, Math.min(1, noise(fx, fy, 11) * 2.4));
      const ny = Math.max(-1, Math.min(1, noise(fx, fy, 23) * 2.4));
      const i = sy * w + sx;
      land[i] = tileAt(fx + nx * LAND_WARP, fy + ny * LAND_WARP);
      coast[i] = tileAt(fx + nx * COAST_WARP, fy + ny * COAST_WARP);
      own[i] = Math.floor(sy / FIELD_RES) * width + Math.floor(sx / FIELD_RES);
      tone[i] = valueNoise(fx * 3.1, fy * 3.1, 37) * 0.6 + valueNoise(fx * 7.3, fy * 7.3, 41) * 0.4;
    }
  }
  warp = { width, height, land, coast, own, tone };
  return warp;
}

// ---------- colours ----------

function hexRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const SAND = hexRgb("#e8d7a4");
const SHALLOW = hexRgb("#7cc8cf");
const SURF = hexRgb("#e9f6f8");

/**
 * Distance (in samples, capped) from every sample to the nearest sample on
 * the other side of the coast. Two-pass chamfer transform.
 */
function coastDistance(isLand: Uint8Array, w: number, h: number, cap: number): Uint8Array {
  const d = new Uint8Array(w * h).fill(cap);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const me = isLand[i]!;
      if ((x > 0 && isLand[i - 1] !== me) || (y > 0 && isLand[i - w] !== me) || (x < w - 1 && isLand[i + 1] !== me) || (y < h - 1 && isLand[i + w] !== me)) d[i] = 1;
    }
  }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const me = isLand[i];
      let v = d[i]!;
      if (x > 0 && isLand[i - 1] === me && d[i - 1]! + 1 < v) v = d[i - 1]! + 1;
      if (y > 0 && isLand[i - w] === me && d[i - w]! + 1 < v) v = d[i - w]! + 1;
      d[i] = v;
    }
  for (let y = h - 1; y >= 0; y--)
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      const me = isLand[i];
      let v = d[i]!;
      if (x < w - 1 && isLand[i + 1] === me && d[i + 1]! + 1 < v) v = d[i + 1]! + 1;
      if (y < h - 1 && isLand[i + w] === me && d[i + w]! + 1 < v) v = d[i + w]! + 1;
      d[i] = v;
    }
  return d;
}

/**
 * A light 3 x 3 blur along borders and the coast inside a rectangle of
 * samples, so they do not show steps when zoomed in. Plain ground keeps its
 * texture.
 */
function softenEdges(
  px: Uint8ClampedArray,
  out: Uint8Array,
  w: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  distAt: (x: number, y: number) => number,
): void {
  const h = out.length / w;
  const bx0 = Math.max(1, x0 - 1);
  const by0 = Math.max(1, y0 - 1);
  const bx1 = Math.min(w - 1, x1 + 1);
  const by1 = Math.min(h - 1, y1 + 1);
  // Copy of the rectangle plus a one-sample border, read while blurring.
  const cw = bx1 - bx0 + 2;
  const src = new Uint8ClampedArray(cw * (by1 - by0 + 2) * 4);
  for (let y = by0 - 1; y <= by1; y++) {
    const from = (y * w + bx0 - 1) * 4;
    src.set(px.subarray(from, from + cw * 4), (y - by0 + 1) * cw * 4);
  }
  const at = (x: number, y: number) => ((y - by0 + 1) * cw + (x - bx0 + 1)) * 4;
  for (let y = Math.max(1, y0); y < Math.min(h - 1, y1); y++) {
    for (let x = Math.max(1, x0); x < Math.min(w - 1, x1); x++) {
      const i = y * w + x;
      const t = out[i]!;
      if (t === 0) continue;
      if (distAt(x, y) > 4 && out[i - 1] === t && out[i + 1] === t && out[i - w] === t && out[i + w] === t) continue;
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const q = at(x + dx, y + dy);
          if (src[q + 3] === 0) continue;
          const k = dx === 0 && dy === 0 ? 4 : dx === 0 || dy === 0 ? 2 : 1;
          r += src[q]! * k;
          g += src[q + 1]! * k;
          b += src[q + 2]! * k;
          n += k;
        }
      }
      const o = i * 4;
      px[o] = r / n;
      px[o + 1] = g / n;
      px[o + 2] = b / n;
    }
  }
}

interface FieldState {
  width: number;
  height: number;
  tiles: Uint8Array;
  depth: Float32Array;
  out: Uint8Array;
  img: ImageData;
  field: Field;
}

let current: FieldState | null = null;

const OCEAN = 1;
/** Tiles around a change that are painted again: the bend reaches under one tile, the coast bands under one more. */
const MARGIN = 2;

/**
 * Paints the field for the known terrain. `depth` holds each tile's distance
 * from land and `seaColor` turns a (smoothly interpolated) depth into a colour.
 * Only the part around changed tiles is painted again, so exploring stays fast.
 */
export function terrainField(
  width: number,
  height: number,
  terrain: (TerrainId | null)[],
  colors: Record<TerrainId, string>,
  depth: number[],
  seaColor: (depth: number) => [number, number, number],
): Field {
  const tiles = new Uint8Array(width * height);
  const tileDepth = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const t = terrain[i];
    tiles[i] = t ? TERRAIN_INDEX[t] : 0;
    tileDepth[i] = Math.min(6, depth[i] ?? 0);
  }
  const w = width * FIELD_RES;
  const h = height * FIELD_RES;
  let st = current;
  let rx0 = 0;
  let ry0 = 0;
  let rx1 = width - 1;
  let ry1 = height - 1;
  if (st && st.width === width && st.height === height) {
    rx0 = width;
    ry0 = height;
    rx1 = -1;
    ry1 = -1;
    for (let i = 0; i < width * height; i++) {
      if (st.tiles[i] === tiles[i] && st.depth[i] === tileDepth[i]) continue;
      const x = i % width;
      const y = Math.floor(i / width);
      if (x < rx0) rx0 = x;
      if (x > rx1) rx1 = x;
      if (y < ry0) ry0 = y;
      if (y > ry1) ry1 = y;
    }
    if (rx1 < 0) return st.field;
    rx0 = Math.max(0, rx0 - MARGIN);
    ry0 = Math.max(0, ry0 - MARGIN);
    rx1 = Math.min(width - 1, rx1 + MARGIN);
    ry1 = Math.min(height - 1, ry1 + MARGIN);
  } else {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const out = new Uint8Array(w * h);
    st = {
      width,
      height,
      tiles,
      depth: tileDepth,
      out,
      img: new ImageData(w, h),
      field: { width, height, terrain: out, canvas },
    };
  }
  st.tiles = tiles;
  st.depth = tileDepth;
  current = st;
  paintRegion(st, colors, seaColor, rx0, ry0, rx1, ry1);
  return st.field;
}

function paintRegion(
  st: FieldState,
  colors: Record<TerrainId, string>,
  seaColor: (depth: number) => [number, number, number],
  rx0: number,
  ry0: number,
  rx1: number,
  ry1: number,
): void {
  const { width, height, tiles, depth: tileDepth, out } = st;
  const wp = getWarp(width, height);
  const w = width * FIELD_RES;
  const { own, coast, land, tone } = wp;
  // The working area reaches one tile beyond the painted area, so coast
  // distances near its edge are right.
  const ax0 = Math.max(0, rx0 - 1) * FIELD_RES;
  const ay0 = Math.max(0, ry0 - 1) * FIELD_RES;
  const ax1 = (Math.min(width - 1, rx1 + 1) + 1) * FIELD_RES;
  const ay1 = (Math.min(height - 1, ry1 + 1) + 1) * FIELD_RES;
  const aw = ax1 - ax0;
  const ah = ay1 - ay0;
  const isLand = new Uint8Array(aw * ah);
  for (let y = ay0; y < ay1; y++) {
    for (let x = ax0; x < ax1; x++) {
      const i = y * w + x;
      const o = tiles[own[i]!]!;
      let v = 0;
      // Unknown tiles keep straight edges; the fog fade drawn later covers them.
      if (o !== 0) {
        const tc = tiles[coast[i]!] || o;
        if (tc === OCEAN) v = OCEAN;
        else {
          isLand[(y - ay0) * aw + (x - ax0)] = 1;
          const tl = tiles[land[i]!]!;
          v = tl > OCEAN ? tl : tc;
        }
      }
      out[i] = v;
    }
  }
  const dist = coastDistance(isLand, aw, ah, 12);

  const landRgb = INDEX_TERRAIN.map((t) => (t ? hexRgb(colors[t]) : [0, 0, 0]));
  const SEA_STEPS = 16;
  const seaLut: [number, number, number][] = [];
  for (let k = 0; k <= 6 * SEA_STEPS; k++) seaLut.push(seaColor(k / SEA_STEPS));

  const px = st.img.data;
  const beach = FIELD_RES * 0.09;
  const shallow = FIELD_RES * 0.5;
  const half = FIELD_RES / 2;
  const px0 = rx0 * FIELD_RES;
  const py0 = ry0 * FIELD_RES;
  const px1 = (rx1 + 1) * FIELD_RES;
  const py1 = (ry1 + 1) * FIELD_RES;
  for (let sy = py0; sy < py1; sy++) {
    // Depth between tile centres, so the sea darkens smoothly away from the coast.
    const fy = (sy + 0.5 - half) / FIELD_RES;
    const y0 = Math.max(0, Math.min(height - 1, Math.floor(fy)));
    const y1 = Math.min(height - 1, y0 + 1);
    const ay = Math.max(0, Math.min(1, fy - y0));
    for (let sx = px0; sx < px1; sx++) {
      const i = sy * w + sx;
      const o = i * 4;
      const ti = out[i]!;
      if (ti === 0) {
        px[o + 3] = 0;
        continue;
      }
      const tn = tone[i]!;
      const d = dist[(sy - ay0) * aw + (sx - ax0)]!;
      let r: number;
      let g: number;
      let b: number;
      if (ti === OCEAN) {
        const fx = (sx + 0.5 - half) / FIELD_RES;
        const x0 = Math.max(0, Math.min(width - 1, Math.floor(fx)));
        const x1 = Math.min(width - 1, x0 + 1);
        const ax = Math.max(0, Math.min(1, fx - x0));
        const top = tileDepth[y0 * width + x0]! * (1 - ax) + tileDepth[y0 * width + x1]! * ax;
        const bottom = tileDepth[y1 * width + x0]! * (1 - ax) + tileDepth[y1 * width + x1]! * ax;
        const c = seaLut[Math.round((top * (1 - ay) + bottom * ay) * SEA_STEPS)]!;
        const k = 0.97 + tn * 0.06;
        r = c[0] * k;
        g = c[1] * k;
        b = c[2] * k;
        if (d <= shallow) {
          const a = 0.55 * (1 - (d - 1) / shallow);
          r += (SHALLOW[0] - r) * a;
          g += (SHALLOW[1] - g) * a;
          b += (SHALLOW[2] - b) * a;
        }
        if (d === 2 || d === 3) {
          const a = d === 2 ? 0.55 : 0.25;
          r += (SURF[0] - r) * a;
          g += (SURF[1] - g) * a;
          b += (SURF[2] - b) * a;
        }
      } else {
        const c = landRgb[ti]!;
        const k = 0.92 + tn * 0.16;
        r = c[0]! * k;
        g = c[1]! * k;
        b = c[2]! * k;
        if (d <= beach + 1) {
          const a = d <= beach ? 0.9 : 0.45;
          r += (SAND[0] - r) * a;
          g += (SAND[1] - g) * a;
          b += (SAND[2] - b) * a;
        }
      }
      px[o] = r;
      px[o + 1] = g;
      px[o + 2] = b;
      px[o + 3] = 255;
    }
  }
  softenEdges(px, out, w, px0, py0, px1, py1, (x, y) => dist[(y - ay0) * aw + (x - ax0)]!);
  const ctx = st.field.canvas.getContext("2d")!;
  ctx.putImageData(st.img, 0, 0, px0, py0, px1 - px0, py1 - py0);
}

/** Terrain the field shows at a point given in tiles, or null when unknown. */
export function fieldTerrainAt(field: Field, fx: number, fy: number): TerrainId | null {
  const w = field.width * FIELD_RES;
  const sx = Math.min(w - 1, Math.max(0, Math.floor(fx * FIELD_RES)));
  const sy = Math.min(field.height * FIELD_RES - 1, Math.max(0, Math.floor(fy * FIELD_RES)));
  return INDEX_TERRAIN[field.terrain[sy * w + sx]!] ?? null;
}
