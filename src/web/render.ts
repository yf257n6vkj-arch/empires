/**
 * Draws a PlayerView (or the full map) onto a canvas. All graphics are drawn
 * with code: no images. Everything is drawn in "design units" where one tile
 * is 24 units wide; the canvas transform scales that to the real tile size.
 *
 * The map background (terrain, coast, improvements, borders, fog edge) changes
 * rarely, so it is drawn into an offscreen canvas and reused while the mouse
 * moves; only units, cities and overlays are drawn every frame.
 *
 * The camera (see camera.ts) zooms and moves the view. Only the tiles in view
 * are drawn into the background, so moving a zoomed map stays fast.
 */
import type { Point, TerrainId, UnitTypeId } from "../core";
import { drawUnitArt, WIDE_UNITS } from "./unitArt";
import { DEFAULT_CAMERA, type Camera } from "./camera";

/** Tile size in design units. */
export const TILE = 24;

export const TERRAIN_COLORS: Record<TerrainId, string> = {
  ocean: "#2f749d",
  grassland: "#6fab45",
  plains: "#bcb062",
  forest: "#40693a",
  hills: "#8a9450",
  mountains: "#857d72",
  desert: "#e6d29c",
};

/** Colours by player id until a game sets its nations' colours. */
const DEFAULT_COLORS = ["#f4f1ea", "#d9483b", "#3f8fd6", "#e2ac2f"];
let colors: string[] = DEFAULT_COLORS;

/** Every player draws in the colour of their nation. */
export function setPlayerColors(next: string[]): void {
  colors = next.length > 0 ? next : DEFAULT_COLORS;
}

const UNKNOWN = "#101215";
const INK = "#1c1a17";

export interface DrawUnit {
  id: number;
  owner: number;
  type: UnitTypeId;
  x: number;
  y: number;
  fortified: boolean;
  working: boolean;
  /** Share of the current work done, 0..1. */
  workProgress?: number;
  hasMoves: boolean;
}

export interface DrawCity {
  id: number;
  owner: number;
  name: string;
  x: number;
  y: number;
  size: number;
  /** The city has built its walls. */
  walls: boolean;
}

export interface DrawInput {
  width: number;
  height: number;
  /** null = not explored by the viewer */
  terrain: (TerrainId | null)[];
  road: number[];
  irrigation: number[];
  mine: number[];
  railroad?: number[];
  fortress?: number[];
  units: DrawUnit[];
  cities: DrawCity[];
  /** Start markers, only used by the map preview. */
  starts: { point: Point; playerId: number }[];
  selectedUnitId?: number | null;
  selectedCityId?: number | null;
  /** Tiles within reach of each player's cities, keyed by player id. */
  territory?: Map<number, Set<number>>;
  /** Tiles to outline, e.g. tiles worked by the selected city. */
  highlight?: number[];
  /** Planned route of the selected unit. */
  path?: Point[];
  /** For each step of `path`, the turn in which the unit makes it (1 = this turn). */
  pathTurns?: number[];
  /** Tile under the mouse or goto target; turns = null when the unit cannot get there. */
  target?: { point: Point; turns: number | null } | null;
  /** Visible part of the map; the whole map when omitted. */
  camera?: Camera;
}

// ---------- canvas setup ----------

let tilePixels = TILE;
let pixelRatio = 1;
let background: HTMLCanvasElement | null = null;
let backgroundKey = "";
let camera: Camera = DEFAULT_CAMERA;
/** Tiles drawn into the background (inclusive), with one tile of slack for details that overflow. */
let view = { x0: 0, y0: 0, x1: 0, y1: 0 };
/** Part of the map (in tiles) held in the background cache. */
let bgRegion = { x: 0, y: 0, w: 0, h: 0 };

function inView(x: number, y: number): boolean {
  return x >= view.x0 && x <= view.x1 && y >= view.y0 && y <= view.y1;
}

/** Real size of one tile on screen, in CSS pixels. */
export function tileSize(): number {
  return tilePixels;
}

export function setupCanvas(
  canvas: HTMLCanvasElement,
  width: number,
  height: number,
  tile = TILE,
): CanvasRenderingContext2D {
  tilePixels = tile;
  pixelRatio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * tile * pixelRatio);
  canvas.height = Math.round(height * tile * pixelRatio);
  canvas.style.width = `${width * tile}px`;
  canvas.style.height = `${height * tile}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  applyScale(ctx);
  backgroundKey = "";
  return ctx;
}

/** Scales design units to device pixels; (ox, oy) is the map tile shown at the canvas corner. */
function applyScale(ctx: CanvasRenderingContext2D, ox = camera.x, oy = camera.y): void {
  const s = (pixelRatio * tilePixels * camera.zoom) / TILE;
  ctx.setTransform(s, 0, 0, s, -ox * TILE * s, -oy * TILE * s);
}

// ---------- small helpers ----------

/** Deterministic pseudo-random number in [0, 1) for a tile, so details do not flicker. */
function hash(x: number, y: number, k: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Lighter (factor > 1) or darker (factor < 1) version of a colour. */
function shade(hex: string, factor: number, alpha = 1): string {
  const [r, g, b] = rgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(c * factor))));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function playerColor(owner: number): string {
  return colors[owner % colors.length] ?? "#ffffff";
}

/** Colour of the player's figures: dark ink on light player colours, white on dark ones. */
function contrastInk(hex: string): string {
  const [r, g, b] = rgb(hex);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? INK : "#fbf7ee";
}

function inputKey(input: DrawInput): string {
  // FNV-1a over everything the background depends on.
  let h = 2166136261;
  const mix = (v: number) => {
    h ^= v;
    h = Math.imul(h, 16777619);
  };
  for (const t of input.terrain) mix(t ? t.charCodeAt(0) + t.length : 0);
  for (const arr of [input.road, input.irrigation, input.mine, input.railroad ?? [], input.fortress ?? []]) for (const v of arr) mix(v);
  for (const c of input.cities) mix(c.x * 1000 + c.y);
  for (const [owner, tiles] of input.territory ?? []) {
    mix(owner + 7);
    for (const i of tiles) mix(i);
  }
  return `${h >>> 0}:${input.width}x${input.height}:${tilePixels}:${pixelRatio}:${camera.zoom}`;
}

// ---------- main entry ----------

export function draw(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height } = input;
  camera = input.camera ?? DEFAULT_CAMERA;
  const viewW = width / camera.zoom;
  const viewH = height / camera.zoom;
  const key = inputKey(input);
  const r = bgRegion;
  const covered =
    camera.x >= r.x - 1e-6 &&
    camera.y >= r.y - 1e-6 &&
    camera.x + viewW <= r.x + r.w + 1e-6 &&
    camera.y + viewH <= r.y + r.h + 1e-6;
  if (!background || key !== backgroundKey || !covered) {
    // When zoomed in, draw a margin around the view so that moving the map
    // only shifts the cached image instead of drawing all the terrain again.
    const margin = camera.zoom > 1 ? 0.35 : 0;
    const x0 = Math.max(0, camera.x - viewW * margin);
    const y0 = Math.max(0, camera.y - viewH * margin);
    const x1 = Math.min(width, camera.x + viewW * (1 + margin));
    const y1 = Math.min(height, camera.y + viewH * (1 + margin));
    bgRegion = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    view = {
      x0: Math.max(0, Math.floor(x0) - 1),
      y0: Math.max(0, Math.floor(y0) - 1),
      x1: Math.min(width - 1, Math.ceil(x1) + 1),
      y1: Math.min(height - 1, Math.ceil(y1) + 1),
    };
    const px = tilePixels * camera.zoom * pixelRatio;
    background ??= document.createElement("canvas");
    background.width = Math.max(ctx.canvas.width, Math.ceil(bgRegion.w * px));
    background.height = Math.max(ctx.canvas.height, Math.ceil(bgRegion.h * px));
    const bg = background.getContext("2d")!;
    applyScale(bg, bgRegion.x, bgRegion.y);
    drawBackground(bg, input);
    backgroundKey = key;
  }
  const px = tilePixels * camera.zoom * pixelRatio;
  const sx = Math.max(0, Math.min(background.width - ctx.canvas.width, Math.round((camera.x - bgRegion.x) * px)));
  const sy = Math.max(0, Math.min(background.height - ctx.canvas.height, Math.round((camera.y - bgRegion.y) * px)));
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(background, sx, sy, ctx.canvas.width, ctx.canvas.height, 0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
  applyScale(ctx);

  for (const i of input.highlight ?? []) {
    const x = (i % width) * TILE;
    const y = Math.floor(i / width) * TILE;
    ctx.strokeStyle = "rgba(255, 250, 235, 0.9)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, TILE - 4, TILE - 4, 4);
    ctx.stroke();
  }

  if (input.path && input.path.length > 0) drawPath(ctx, input);
  if (input.target) drawTarget(ctx, input.target, width, height);
  for (const s of input.starts) drawStart(ctx, s.point, s.playerId);
  const cities = [...input.cities].sort((a, b) => a.y - b.y || a.x - b.x);
  for (const c of cities) drawCity(ctx, c, c.id === input.selectedCityId);
  drawUnits(ctx, input);
  for (const c of input.cities) drawCityLabel(ctx, c, width);
}

/**
 * Draws terrain, improvements and cities of a rectangle of tiles into a separate
 * canvas, for the city screen. (x0, y0) is the tile at the canvas corner and
 * `pixelsPerTile` the size of a tile in device pixels.
 */
export function drawTerrainPatch(
  ctx: CanvasRenderingContext2D,
  input: DrawInput,
  x0: number,
  y0: number,
  tilesW: number,
  tilesH: number,
  pixelsPerTile: number,
): void {
  const saved = view;
  view = {
    x0: Math.max(0, x0 - 1),
    y0: Math.max(0, y0 - 1),
    x1: Math.min(input.width - 1, x0 + tilesW),
    y1: Math.min(input.height - 1, y0 + tilesH),
  };
  const s = pixelsPerTile / TILE;
  ctx.save();
  ctx.setTransform(s, 0, 0, s, -x0 * TILE * s, -y0 * TILE * s);
  drawBackground(ctx, { ...input, territory: undefined });
  for (const c of input.cities) {
    if (c.x >= view.x0 && c.x <= view.x1 && c.y >= view.y0 && c.y <= view.y1) drawCity(ctx, c, false);
  }
  ctx.restore();
  view = saved;
}

// ---------- background ----------

function drawBackground(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  ctx.fillStyle = UNKNOWN;
  ctx.fillRect(0, 0, width * TILE, height * TILE);

  const depth = seaDepth(input);
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      const t = terrain[y * width + x] ?? null;
      if (t) drawTerrainBase(ctx, t, x, y, depth[y * width + x] ?? 0);
    }
  }
  drawTerrainBlend(ctx, input, depth);
  drawCoast(ctx, input);
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      const t = terrain[y * width + x] ?? null;
      if (t) drawTerrainDetail(ctx, t, x, y, depth[y * width + x] ?? 0);
    }
  }
  drawImprovements(ctx, input);
  if (input.territory) drawTerritory(ctx, input);
  drawFogEdge(ctx, input);
}

function seaDepth(input: DrawInput): number[] {
  const { width, height, terrain } = input;
  const depth = new Array<number>(width * height).fill(99);
  const queue: number[] = [];
  terrain.forEach((t, i) => {
    if (t && t !== "ocean") {
      depth[i] = 0;
      queue.push(i);
    }
  });
  for (let q = 0; q < queue.length; q++) {
    const i = queue[q]!;
    const x = i % width;
    const y = Math.floor(i / width);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
      const n = ny * width + nx;
      if (terrain[n] === "ocean" && depth[n]! > depth[i]! + 1) {
        depth[n] = depth[i]! + 1;
        queue.push(n);
      }
    }
  }
  return depth;
}

const SEA_BY_DEPTH = ["#4f9fc0", "#3a86ad", "#2f749d", "#28658e", "#225a82"];

/** Light and dark specks that give each terrain a surface texture. */
const SPECKLE: Record<Exclude<TerrainId, "ocean">, { light: string; dark: string; n: number }> = {
  grassland: { light: "#8dc45a", dark: "#558f34", n: 16 },
  plains: { light: "#d2c477", dark: "#9a8d44", n: 16 },
  forest: { light: "#5e8f45", dark: "#2f5428", n: 14 },
  hills: { light: "#a7ae66", dark: "#6c733a", n: 14 },
  mountains: { light: "#aaa398", dark: "#665f56", n: 18 },
  desert: { light: "#f2e4ba", dark: "#c9b077", n: 16 },
};

/**
 * Base fills reach slightly under the next tile, so no hairline seams appear
 * when tile edges fall between device pixels.
 */
const BLEED = 0.5;

function drawTerrainBase(ctx: CanvasRenderingContext2D, t: TerrainId, x: number, y: number, depth: number): void {
  const px = x * TILE;
  const py = y * TILE;
  if (t === "ocean") {
    const base = groundColor(t, depth);
    ctx.fillStyle = shade(base, 0.99 + hash(x, y, 1) * 0.02);
    ctx.fillRect(px, py, TILE + BLEED, TILE + BLEED);
    return;
  }
  ctx.fillStyle = shade(TERRAIN_COLORS[t], 0.985 + hash(x, y, 2) * 0.03);
  ctx.fillRect(px, py, TILE + BLEED, TILE + BLEED);
  const sp = SPECKLE[t];
  const light = new Path2D();
  const dark = new Path2D();
  for (let k = 0; k < sp.n; k++) {
    const sx = px + hash(x, y, 40 + k) * TILE;
    const sy = py + hash(x, y, 80 + k) * TILE;
    const w = 0.8 + hash(x, y, 120 + k) * 1.6;
    (k % 2 === 0 ? light : dark).rect(sx - w / 2, sy - 0.4, w, 0.8 + hash(x, y, 160 + k) * 0.6);
  }
  ctx.fillStyle = shade(sp.light, 1, 0.55);
  ctx.fill(light);
  ctx.fillStyle = shade(sp.dark, 1, 0.45);
  ctx.fill(dark);
}

/** Base colour of a tile, with the sea shaded by its distance from land. */
function groundColor(t: TerrainId, depth: number): string {
  if (t !== "ocean") return TERRAIN_COLORS[t];
  return SEA_BY_DEPTH[Math.min(depth, SEA_BY_DEPTH.length) - 1] ?? SEA_BY_DEPTH[SEA_BY_DEPTH.length - 1]!;
}

/**
 * Soft transitions: every tile takes a little of each different neighbour's
 * colour along the shared edge and corner, so borders are not hard squares.
 * The sea also blends between depths, and water next to land gets a lighter
 * shallow band.
 */
function drawTerrainBlend(ctx: CanvasRenderingContext2D, input: DrawInput, depth: number[]): void {
  const { width, height, terrain } = input;
  const inMap = (x: number, y: number) => x >= 0 && y >= 0 && x < width && y < height;
  const at = (x: number, y: number) => (inMap(x, y) ? (terrain[y * width + x] ?? null) : null);
  const colorAt = (x: number, y: number): string | null => {
    const t = at(x, y);
    return t ? groundColor(t, depth[y * width + x] ?? 0) : null;
  };
  /** Colour that the tile (x, y) should borrow from its neighbour, or null. */
  const borrow = (x: number, y: number, nx: number, ny: number): { color: string; alpha: number; reach: number } | null => {
    const t = at(x, y);
    const n = at(nx, ny);
    if (!t || !n) return null;
    if (t === "ocean" && n !== "ocean") return { color: "#7cc8cf", alpha: 0.5, reach: 9 };
    if (t !== "ocean" && n === "ocean") return null;
    const own = colorAt(x, y);
    const other = colorAt(nx, ny);
    if (!other || other === own) return null;
    return t === "ocean" ? { color: other, alpha: 0.5, reach: 12 } : { color: other, alpha: 0.6, reach: 7 };
  };
  const sides = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ] as const;
  const corners = [
    [-1, -1],
    [1, -1],
    [-1, 1],
    [1, 1],
  ] as const;
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      if (!at(x, y)) continue;
      const px = x * TILE;
      const py = y * TILE;
      for (const [dx, dy] of sides) {
        const b = borrow(x, y, x + dx, y + dy);
        if (!b) continue;
        // Gradient from the shared edge into this tile.
        const ex = dx === 1 ? px + TILE : px;
        const ey = dy === 1 ? py + TILE : py;
        const g =
          dx !== 0
            ? ctx.createLinearGradient(ex, 0, ex - dx * b.reach, 0)
            : ctx.createLinearGradient(0, ey, 0, ey - dy * b.reach);
        g.addColorStop(0, shade(b.color, 1, b.alpha));
        g.addColorStop(1, shade(b.color, 1, 0));
        ctx.fillStyle = g;
        if (dx !== 0) ctx.fillRect(dx === 1 ? px + TILE - b.reach : px, py, b.reach, TILE);
        else ctx.fillRect(px, dy === 1 ? py + TILE - b.reach : py, TILE, b.reach);
      }
      // Corners where only the diagonal neighbour differs.
      for (const [dx, dy] of corners) {
        if (borrow(x, y, x + dx, y) || borrow(x, y, x, y + dy)) continue;
        const b = borrow(x, y, x + dx, y + dy);
        if (!b) continue;
        const cx = dx === 1 ? px + TILE : px;
        const cy = dy === 1 ? py + TILE : py;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.reach);
        g.addColorStop(0, shade(b.color, 1, b.alpha));
        g.addColorStop(1, shade(b.color, 1, 0));
        ctx.fillStyle = g;
        ctx.fillRect(dx === 1 ? px + TILE - b.reach : px, dy === 1 ? py + TILE - b.reach : py, b.reach, b.reach);
      }
    }
  }
}

function drawTerrainDetail(ctx: CanvasRenderingContext2D, t: TerrainId, x: number, y: number, depth: number): void {
  const px = x * TILE;
  const py = y * TILE;
  const r = (k: number) => hash(x, y, k);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (t) {
    case "ocean": {
      // Small wave crests; fewer and fainter far from the coast.
      const count = depth <= 2 ? 3 : 2;
      ctx.strokeStyle = `rgba(255, 255, 255, ${depth <= 1 ? 0.28 : 0.16})`;
      ctx.lineWidth = 0.7;
      for (let k = 0; k < count; k++) {
        const wx = px + 2 + r(k + 3) * 15;
        const wy = py + 5 + k * 7 + r(k + 5) * 3;
        ctx.beginPath();
        ctx.moveTo(wx, wy + 1);
        ctx.quadraticCurveTo(wx + 2, wy - 1, wx + 4, wy + 0.6);
        ctx.quadraticCurveTo(wx + 6, wy - 1, wx + 8, wy + 1);
        ctx.stroke();
      }
      break;
    }
    case "grassland": {
      for (let k = 0; k < 5; k++) {
        drawGrassTuft(ctx, px + 3 + r(k) * 18, py + 5 + r(k + 9) * 16, 2 + r(k + 20), "#3f7a28", "#7fbd4f");
      }
      // A few wild flowers.
      const flowers = r(30) > 0.45 ? 2 + Math.floor(r(31) * 3) : 0;
      for (let k = 0; k < flowers; k++) {
        ctx.fillStyle = r(40 + k) > 0.5 ? "#f4d44c" : "#f6f1e6";
        ctx.beginPath();
        ctx.arc(px + 3 + r(50 + k) * 18, py + 3 + r(60 + k) * 18, 0.65, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "plains": {
      // Dry, golden grassland with tall tufts and the odd shrub.
      for (let k = 0; k < 6; k++) {
        drawGrassTuft(ctx, px + 3 + r(k) * 18, py + 6 + r(k + 9) * 16, 3 + r(k + 20) * 1.2, "#8a7a2e", "#dccd7c");
      }
      if (r(33) > 0.4) {
        const bx = px + 5 + r(34) * 14;
        const by = py + 8 + r(35) * 12;
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.beginPath();
        ctx.ellipse(bx + 0.6, by + 1.6, 2.6, 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#6f7d35";
        ctx.beginPath();
        ctx.arc(bx - 0.8, by, 1.7, 0, Math.PI * 2);
        ctx.arc(bx + 1, by - 0.3, 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#93a24a";
        ctx.beginPath();
        ctx.arc(bx - 0.2, by - 1, 1.1, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "forest": {
      const spots: [number, number, number][] = [
        [5, 7, 0.85],
        [13, 5, 0.9],
        [20, 8, 0.85],
        [9, 13, 1],
        [17, 14, 0.95],
        [4, 19, 0.9],
        [12, 21, 1],
        [20, 20, 0.9],
      ];
      for (const [k, [tx, ty, s]] of spots.entries()) {
        const ox = px + tx + (r(k) - 0.5) * 2.4;
        const oy = py + ty + (r(k + 10) - 0.5) * 2;
        if (r(k + 20) > 0.45) drawConifer(ctx, ox, oy, s);
        else drawLeafTree(ctx, ox, oy, s);
      }
      break;
    }
    case "hills": {
      drawHill(ctx, px + 7, py + 19, 7.5, 7, r(1));
      drawHill(ctx, px + 16.5, py + 14, 8, 8, r(2));
      if (r(3) > 0.5) drawHill(ctx, px + 18, py + 22, 5, 4, r(4));
      break;
    }
    case "mountains": {
      drawPeak(ctx, px + 7, py + 15, 6, 9, r(1));
      drawPeak(ctx, px + 15.5, py + 21, 9, 17, r(2));
      drawPeak(ctx, px + 6.5, py + 23, 6.5, 10, r(3));
      break;
    }
    case "desert": {
      drawDune(ctx, px + 2 + r(1) * 3, py + 9 + r(2) * 2, 13);
      drawDune(ctx, px + 8 + r(3) * 3, py + 18 + r(4) * 2, 14);
      ctx.fillStyle = "rgba(140, 110, 60, 0.55)";
      for (let k = 0; k < 4; k++) {
        ctx.beginPath();
        ctx.ellipse(px + 2 + r(k + 7) * 20, py + 2 + r(k + 11) * 20, 0.7, 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      if (r(20) > 0.72) drawCactus(ctx, px + 5 + r(21) * 14, py + 8 + r(22) * 12);
      break;
    }
  }
}

/** A tuft of grass blades growing from (x, y). */
function drawGrassTuft(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  dark: string,
  light: string,
): void {
  ctx.lineWidth = 0.55;
  ctx.strokeStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x - 1.2, y - h * 0.75);
  ctx.quadraticCurveTo(x - 0.6, y - h * 0.3, x - 0.2, y);
  ctx.moveTo(x, y - h);
  ctx.lineTo(x, y);
  ctx.moveTo(x + 1.2, y - h * 0.7);
  ctx.quadraticCurveTo(x + 0.6, y - h * 0.3, x + 0.2, y);
  ctx.stroke();
  ctx.strokeStyle = light;
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  ctx.moveTo(x + 0.25, y - h * 0.95);
  ctx.lineTo(x + 0.25, y - h * 0.4);
  ctx.stroke();
}

function drawConifer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 4.4 * s, 3.2 * s, 1.1 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4e321e";
  ctx.fillRect(x - 0.55 * s, y + 2 * s, 1.1 * s, 2.4 * s);
  for (const [dy, w] of [
    [2.2, 3.4],
    [-0.6, 2.8],
    [-3.2, 2.1],
  ] as const) {
    const top = y + (dy - 3.6) * s;
    const base = y + dy * s;
    ctx.fillStyle = "#1f4a2a";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x + w * s, base);
    ctx.lineTo(x - w * s, base);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#2f6a3a";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x - w * s, base);
    ctx.lineTo(x - 0.2 * s, base - 0.4 * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLeafTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 4.4 * s, 3.4 * s, 1.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#57391f";
  ctx.fillRect(x - 0.55 * s, y + 0.8 * s, 1.1 * s, 3.4 * s);
  ctx.fillStyle = "#2c5e2c";
  ctx.beginPath();
  ctx.arc(x - 1.5 * s, y - 0.2 * s, 2.4 * s, 0, Math.PI * 2);
  ctx.arc(x + 1.5 * s, y - 0.1 * s, 2.4 * s, 0, Math.PI * 2);
  ctx.arc(x, y - 2 * s, 2.7 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a8a3e";
  ctx.beginPath();
  ctx.arc(x - 1.2 * s, y - 2.4 * s, 1.5 * s, 0, Math.PI * 2);
  ctx.arc(x - 2 * s, y - 0.6 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#6aa652";
  ctx.beginPath();
  ctx.arc(x - 1.5 * s, y - 2.9 * s, 0.7 * s, 0, Math.PI * 2);
  ctx.fill();
}

/** A rounded, grassy hill lit from the top left. */
function drawHill(ctx: CanvasRenderingContext2D, cx: number, by: number, rx: number, h: number, v: number): void {
  ctx.fillStyle = "rgba(40, 35, 10, 0.22)";
  ctx.beginPath();
  ctx.ellipse(cx + 1.2, by + 0.6, rx * 1.02, 1.4, 0, 0, Math.PI * 2);
  ctx.fill();
  const g = ctx.createLinearGradient(cx - rx * 0.6, by - h, cx + rx * 0.7, by);
  g.addColorStop(0, "#b9bd72");
  g.addColorStop(0.45, "#929a50");
  g.addColorStop(1, "#5d6430");
  ctx.fillStyle = g;
  const peak = cx - rx * (0.1 + v * 0.15);
  ctx.beginPath();
  ctx.moveTo(cx - rx, by);
  ctx.bezierCurveTo(cx - rx * 0.75, by - h * 0.7, peak - rx * 0.35, by - h, peak, by - h);
  ctx.bezierCurveTo(peak + rx * 0.45, by - h, cx + rx * 0.75, by - h * 0.6, cx + rx, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(55, 60, 25, 0.55)";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Contour line and grass on the lit side.
  ctx.strokeStyle = "rgba(220, 225, 160, 0.45)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(peak - rx * 0.55, by - h * 0.62);
  ctx.quadraticCurveTo(peak - rx * 0.2, by - h * 0.92, peak + rx * 0.15, by - h * 0.93);
  ctx.stroke();
  ctx.strokeStyle = "rgba(60, 70, 25, 0.5)";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(peak + rx * 0.35, by - h * 0.55);
  ctx.quadraticCurveTo(peak + rx * 0.55, by - h * 0.3, peak + rx * 0.5, by - 0.5);
  ctx.stroke();
}

/** A rocky peak with a lit and a shaded face and a snow cap. */
function drawPeak(ctx: CanvasRenderingContext2D, cx: number, by: number, half: number, h: number, v: number): void {
  const top = by - h;
  const tx = cx + (v - 0.5) * half * 0.3;
  ctx.fillStyle = "rgba(30, 25, 20, 0.25)";
  ctx.beginPath();
  ctx.ellipse(cx + 1.5, by + 0.4, half * 1.05, 1.3, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lit face.
  const lit = ctx.createLinearGradient(cx - half, top, cx, by);
  lit.addColorStop(0, "#d3ccc0");
  lit.addColorStop(1, "#9a9286");
  ctx.fillStyle = lit;
  ctx.beginPath();
  ctx.moveTo(cx - half, by);
  ctx.lineTo(cx - half * 0.45, top + h * 0.45);
  ctx.lineTo(tx, top);
  ctx.lineTo(tx + 0.4, by);
  ctx.closePath();
  ctx.fill();
  // Shaded face.
  ctx.fillStyle = "#635c53";
  ctx.beginPath();
  ctx.moveTo(tx, top);
  ctx.lineTo(cx + half * 0.5, top + h * 0.5);
  ctx.lineTo(cx + half, by);
  ctx.lineTo(tx + 0.4, by);
  ctx.closePath();
  ctx.fill();
  // Rock cracks.
  ctx.strokeStyle = "rgba(70, 64, 56, 0.6)";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(tx - half * 0.2, top + h * 0.45);
  ctx.lineTo(tx - half * 0.35, top + h * 0.7);
  ctx.lineTo(tx - half * 0.25, by - 0.5);
  ctx.moveTo(tx + half * 0.25, top + h * 0.55);
  ctx.lineTo(tx + half * 0.4, by - 1);
  ctx.stroke();
  // Snow cap on taller peaks.
  if (h >= 9) {
    const sh = h * 0.3;
    ctx.fillStyle = "#f7f8f6";
    ctx.beginPath();
    ctx.moveTo(tx, top);
    ctx.lineTo(tx - half * 0.34, top + sh);
    ctx.lineTo(tx - half * 0.15, top + sh * 0.8);
    ctx.lineTo(tx, top + sh * 1.05);
    ctx.lineTo(tx + 0.4, top + sh * 0.85);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#c9d3dc";
    ctx.beginPath();
    ctx.moveTo(tx, top);
    ctx.lineTo(tx + 0.4, top + sh * 0.85);
    ctx.lineTo(tx + half * 0.18, top + sh * 0.75);
    ctx.lineTo(tx + half * 0.3, top + sh * 0.95);
    ctx.lineTo(tx + half * 0.33, top + sh * 0.6);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = "rgba(50, 45, 40, 0.55)";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(cx - half, by);
  ctx.lineTo(cx - half * 0.45, top + h * 0.45);
  ctx.lineTo(tx, top);
  ctx.lineTo(cx + half * 0.5, top + h * 0.5);
  ctx.lineTo(cx + half, by);
  ctx.stroke();
}

/** A sand dune: a lit windward slope, a sharp crest and a shaded lee side. */
function drawDune(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  const crestX = x + w * 0.6;
  const crestY = y - 3.2;
  // Lit windward slope.
  ctx.fillStyle = "rgba(252, 240, 205, 0.85)";
  ctx.beginPath();
  ctx.moveTo(x, y + 2.5);
  ctx.quadraticCurveTo(x + w * 0.3, y - 1.2, crestX, crestY);
  ctx.quadraticCurveTo(x + w * 0.45, y + 1.6, x, y + 2.5);
  ctx.fill();
  // Shaded lee side.
  const g = ctx.createLinearGradient(crestX, crestY, crestX + 1.5, y + 3);
  g.addColorStop(0, "rgba(176, 134, 72, 0.75)");
  g.addColorStop(1, "rgba(200, 165, 100, 0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(crestX, crestY);
  ctx.quadraticCurveTo(x + w * 0.85, y - 1.2, x + w, y + 2.6);
  ctx.quadraticCurveTo(x + w * 0.7, y + 3.4, x + w * 0.45, y + 2.4);
  ctx.quadraticCurveTo(x + w * 0.55, y, crestX, crestY);
  ctx.fill();
  // Crest line.
  ctx.strokeStyle = "rgba(160, 120, 62, 0.55)";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y + 1.2);
  ctx.quadraticCurveTo(x + w * 0.35, y - 1.2, crestX, crestY);
  ctx.quadraticCurveTo(x + w * 0.85, y - 1.2, x + w, y + 2.6);
  ctx.stroke();
}

function drawCactus(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 0.4, 2, 0.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#4f7a35";
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - 5);
  ctx.moveTo(x, y - 2.2);
  ctx.lineTo(x - 1.6, y - 2.2);
  ctx.lineTo(x - 1.6, y - 3.8);
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x + 1.5, y - 3);
  ctx.lineTo(x + 1.5, y - 4.4);
  ctx.stroke();
  ctx.strokeStyle = "#78a752";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x - 0.3, y - 0.3);
  ctx.lineTo(x - 0.3, y - 4.8);
  ctx.stroke();
}

/** Sandy beaches and a line of surf where land meets the sea. */
function drawCoast(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? null : (terrain[y * width + x] ?? null);
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      const t = at(x, y);
      if (!t || t === "ocean") continue;
      const px = x * TILE;
      const py = y * TILE;
      const sides = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ] as const;
      for (const [dx, dy] of sides) {
        if (at(x + dx, y + dy) !== "ocean") continue;
        const ex = dx === 1 ? px + TILE : px;
        const ey = dy === 1 ? py + TILE : py;
        const reach = 4.5;
        const g =
          dx !== 0
            ? ctx.createLinearGradient(ex, 0, ex - dx * reach, 0)
            : ctx.createLinearGradient(0, ey, 0, ey - dy * reach);
        g.addColorStop(0, "rgba(236, 220, 170, 1)");
        g.addColorStop(0.55, "rgba(230, 212, 160, 0.85)");
        g.addColorStop(1, "rgba(230, 212, 160, 0)");
        ctx.fillStyle = g;
        if (dx !== 0) ctx.fillRect(dx === 1 ? px + TILE - reach : px, py, reach, TILE);
        else ctx.fillRect(px, dy === 1 ? py + TILE - reach : py, TILE, reach);
        // Surf just off the beach.
        ctx.strokeStyle = "rgba(245, 252, 255, 0.6)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        if (dx === 0) {
          const sy = ey + dy * 1;
          ctx.moveTo(px, sy);
          for (let k = 1; k <= 4; k++) ctx.lineTo(px + (k * TILE) / 4, sy + (k % 2 ? 0.5 : -0.3) * dy);
        } else {
          const sx = ex + dx * 1;
          ctx.moveTo(sx, py);
          for (let k = 1; k <= 4; k++) ctx.lineTo(sx + (k % 2 ? 0.5 : -0.3) * dx, py + (k * TILE) / 4);
        }
        ctx.stroke();
      }
    }
  }
}

function drawImprovements(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height } = input;
  const cityTiles = new Set(input.cities.map((c) => c.y * width + c.x));
  const roadAt = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && (input.road[y * width + x] === 1 || cityTiles.has(y * width + x));

  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      const i = y * width + x;
      const px = x * TILE;
      const py = y * TILE;
      if (input.irrigation[i]) {
        // Field strips with water channels between them.
        ctx.fillStyle = "rgba(170, 200, 90, 0.35)";
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
        ctx.strokeStyle = "#4f9cd0";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (const off of [7, 12, 17]) {
          ctx.moveTo(px + 3, py + off);
          ctx.lineTo(px + TILE - 3, py + off);
        }
        ctx.stroke();
      }
      if (input.mine[i]) {
        ctx.fillStyle = "#3b2f25";
        ctx.beginPath();
        ctx.moveTo(px + 7, py + 21);
        ctx.lineTo(px + 7, py + 15);
        ctx.arc(px + 12, py + 15, 5, Math.PI, 0);
        ctx.lineTo(px + 17, py + 21);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "#a07a4a";
        ctx.lineWidth = 1.4;
        ctx.stroke();
        ctx.fillStyle = "#0d0b09";
        ctx.fillRect(px + 9.5, py + 15, 5, 6);
      }
      if (input.road[i] && !cityTiles.has(i)) {
        const c = TILE / 2;
        const ends: [number, number][] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((dx || dy) && roadAt(x + dx, y + dy)) ends.push([px + c + (dx * TILE) / 2, py + c + (dy * TILE) / 2]);
          }
        }
        ctx.lineCap = "round";
        for (const [color, w] of [["#5e4129", 3.6], ["#b89466", 2.2]] as const) {
          ctx.strokeStyle = color;
          ctx.lineWidth = w;
          ctx.beginPath();
          if (ends.length === 0) {
            ctx.moveTo(px + c - 3, py + c);
            ctx.lineTo(px + c + 3, py + c);
          }
          for (const [ex, ey] of ends) {
            ctx.moveTo(px + c, py + c);
            ctx.lineTo(ex, ey);
          }
          ctx.stroke();
        }
      }
      if (input.railroad?.[i]) {
        // Two steel rails with sleepers, joined to neighbouring railroads and cities.
        const c = TILE / 2;
        const railAt = (nx: number, ny: number) =>
          nx >= 0 && ny >= 0 && nx < width && ny < height && (input.railroad?.[ny * width + nx] === 1 || cityTiles.has(ny * width + nx));
        const ends: [number, number][] = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((dx || dy) && railAt(x + dx, y + dy)) ends.push([dx, dy]);
          }
        }
        if (ends.length === 0) ends.push([1, 0], [-1, 0]);
        for (const [dx, dy] of ends) {
          const len = Math.hypot(dx, dy);
          const nx = (-dy / len) * 1.6;
          const ny = (dx / len) * 1.6;
          ctx.strokeStyle = "#6b5a48";
          ctx.lineWidth = 1;
          for (let k = 1; k <= 3; k++) {
            const t = k / 3.5;
            const mx = px + c + (dx * TILE * t) / 2;
            const my = py + c + (dy * TILE * t) / 2;
            ctx.beginPath();
            ctx.moveTo(mx - nx * 1.6, my - ny * 1.6);
            ctx.lineTo(mx + nx * 1.6, my + ny * 1.6);
            ctx.stroke();
          }
          ctx.strokeStyle = "#2f3236";
          ctx.lineWidth = 0.9;
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.moveTo(px + c + nx * side, py + c + ny * side);
            ctx.lineTo(px + c + (dx * TILE) / 2 + nx * side, py + c + (dy * TILE) / 2 + ny * side);
            ctx.stroke();
          }
        }
      }
      if (input.fortress?.[i]) {
        ctx.strokeStyle = "#8a7f6a";
        ctx.lineWidth = 2.2;
        ctx.strokeRect(px + 3, py + 3, TILE - 6, TILE - 6);
        ctx.fillStyle = "#b5aa92";
        for (const [fx, fy] of [[3, 3], [TILE - 3, 3], [3, TILE - 3], [TILE - 3, TILE - 3]] as const) {
          ctx.fillRect(px + fx - 2.2, py + fy - 2.2, 4.4, 4.4);
        }
      }
    }
  }
}

/**
 * Outlines the land each player's cities can work (the 21-tile city radius),
 * with a light tint inside. Purely visual; the rules have no borders.
 */
function drawTerritory(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width } = input;
  for (const [owner, tiles] of input.territory ?? []) {
    const color = playerColor(owner);
    ctx.fillStyle = shade(color, 1, 0.07);
    const shown = [...tiles].filter((i) => inView(i % width, Math.floor(i / width)));
    for (const i of shown) ctx.fillRect((i % width) * TILE, Math.floor(i / width) * TILE, TILE, TILE);

    const edges = new Path2D();
    for (const i of shown) {
      const x = i % width;
      const y = Math.floor(i / width);
      const px = x * TILE;
      const py = y * TILE;
      const has = (dx: number, dy: number) => {
        const nx = x + dx;
        const ny = y + dy;
        return nx >= 0 && ny >= 0 && nx < width && ny < input.height && tiles.has(ny * width + nx);
      };
      if (!has(0, -1)) { edges.moveTo(px, py + 1); edges.lineTo(px + TILE, py + 1); }
      if (!has(0, 1)) { edges.moveTo(px, py + TILE - 1); edges.lineTo(px + TILE, py + TILE - 1); }
      if (!has(-1, 0)) { edges.moveTo(px + 1, py); edges.lineTo(px + 1, py + TILE); }
      if (!has(1, 0)) { edges.moveTo(px + TILE - 1, py); edges.lineTo(px + TILE - 1, py + TILE); }
    }
    ctx.lineCap = "butt";
    ctx.strokeStyle = "rgba(10, 10, 10, 0.25)";
    ctx.lineWidth = 2.4;
    ctx.stroke(edges);
    ctx.strokeStyle = shade(color, 1, 0.8);
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 3]);
    ctx.stroke(edges);
    ctx.setLineDash([]);
  }
}

/** Soft shadow on explored tiles where they meet unexplored ones. */
function drawFogEdge(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  const known = (x: number, y: number) => x < 0 || y < 0 || x >= width || y >= height || terrain[y * width + x] !== null;
  const depth = 9;
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      if (!terrain[y * width + x]) continue;
      const px = x * TILE;
      const py = y * TILE;
      const fade = (x0: number, y0: number, x1: number, y1: number, rx: number, ry: number, rw: number, rh: number) => {
        const g = ctx.createLinearGradient(x0, y0, x1, y1);
        g.addColorStop(0, "rgba(16, 18, 21, 0.92)");
        g.addColorStop(1, "rgba(16, 18, 21, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(rx, ry, rw, rh);
      };
      if (!known(x, y - 1)) fade(px, py, px, py + depth, px, py, TILE, depth);
      if (!known(x, y + 1)) fade(px, py + TILE, px, py + TILE - depth, px, py + TILE - depth, TILE, depth);
      if (!known(x - 1, y)) fade(px, py, px + depth, py, px, py, depth, TILE);
      if (!known(x + 1, y)) fade(px + TILE, py, px + TILE - depth, py, px + TILE - depth, py, depth, TILE);
    }
  }
}

// ---------- overlays ----------

function drawPath(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const unit = input.units.find((u) => u.id === input.selectedUnitId);
  if (!unit || !input.path) return;
  const center = (p: Point) => [p.x * TILE + TILE / 2, p.y * TILE + TILE / 2] as const;
  ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(20, 20, 20, 0.45)";
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(...center(unit));
  for (const p of input.path) ctx.lineTo(...center(p));
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 228, 120, 0.95)";
  ctx.lineWidth = 1.8;
  ctx.setLineDash([4, 3.5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // A dot where the unit stops at the end of each turn on the way.
  const turns = input.pathTurns ?? [];
  input.path.forEach((p, i) => {
    const turn = turns[i];
    const next = turns[i + 1];
    if (turn === undefined || next === undefined || next === turn) return;
    const [cx, cy] = center(p);
    ctx.fillStyle = "#ffe478";
    ctx.strokeStyle = "rgba(20, 20, 20, 0.85)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
}

function drawTarget(
  ctx: CanvasRenderingContext2D,
  target: { point: Point; turns: number | null },
  width: number,
  height: number,
): void {
  const px = target.point.x * TILE;
  const py = target.point.y * TILE;
  const reachable = target.turns !== null;
  const color = reachable ? "#ffd84a" : "#e0533d";
  ctx.fillStyle = reachable ? "rgba(255, 216, 74, 0.22)" : "rgba(220, 70, 60, 0.22)";
  ctx.beginPath();
  ctx.roundRect(px + 1, py + 1, TILE - 2, TILE - 2, 4);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.8;
  ctx.stroke();

  const label = reachable ? String(target.turns) : "×";
  ctx.font = "700 10px ui-sans-serif, system-ui, sans-serif";
  const w = Math.max(14, ctx.measureText(label).width + 7);
  // Badge at the top right corner of the tile, kept inside the map.
  const bx = Math.min(px + TILE - 2, width * TILE - w / 2 - 1);
  const by = Math.max(py, 8);
  void height;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(bx - w / 2, by - 7, w, 14, 7);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx, by + 0.5);
}

function drawStart(ctx: CanvasRenderingContext2D, p: Point, playerId: number): void {
  const cx = p.x * TILE + TILE / 2;
  const cy = p.y * TILE + TILE / 2;
  ctx.fillStyle = playerColor(playerId);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = contrastInk(playerColor(playerId));
  ctx.font = "700 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(playerId + 1), cx, cy + 0.5);
}

// ---------- cities ----------

/*
 * Cities are drawn as small 3D-looking settlements, a bit larger than a tile.
 * Coordinates below are relative to the bottom centre of the tile, in design
 * units; negative y goes up. Buildings are listed back to front.
 */

type Building =
  | { kind: "house"; x: number; y: number; w: number; h: number; roof: string }
  | { kind: "hall"; x: number; y: number; w: number; h: number }
  | { kind: "keep"; x: number; y: number; w: number; h: number }
  | { kind: "tower"; x: number; y: number; r: number; h: number };

interface CityLayout {
  wall: "palisade" | "stone";
  buildings: Building[];
  /** Towers on the front wall, drawn after it. */
  frontTowers: { x: number; y: number; r: number; h: number }[];
}

const ROOF_RED = "#b0533a";
const ROOF_BROWN = "#8a5a36";
const ROOF_SLATE = "#5d6772";

function cityLayout(size: number): CityLayout {
  if (size <= 2) {
    return {
      wall: "palisade",
      buildings: [
        { kind: "house", x: -6, y: -9, w: 6, h: 4, roof: ROOF_BROWN },
        { kind: "house", x: 1.5, y: -8, w: 7, h: 4.5, roof: ROOF_RED },
        { kind: "house", x: -3, y: -4, w: 6, h: 4, roof: ROOF_RED },
      ],
      frontTowers: [],
    };
  }
  if (size <= 5) {
    return {
      wall: "palisade",
      buildings: [
        { kind: "house", x: -9, y: -10, w: 6, h: 4, roof: ROOF_BROWN },
        { kind: "hall", x: -2.5, y: -10.5, w: 8, h: 6 },
        { kind: "house", x: 6, y: -9, w: 6, h: 4, roof: ROOF_RED },
        { kind: "house", x: -10, y: -4.5, w: 6.5, h: 4, roof: ROOF_RED },
        { kind: "house", x: -2, y: -3.5, w: 6, h: 4, roof: ROOF_BROWN },
        { kind: "house", x: 5, y: -4, w: 6.5, h: 4.5, roof: ROOF_RED },
      ],
      frontTowers: [],
    };
  }
  if (size <= 7) {
    return {
      wall: "stone",
      buildings: [
        { kind: "house", x: -10, y: -12, w: 6, h: 4, roof: ROOF_RED },
        { kind: "keep", x: -3, y: -12, w: 7, h: 11 },
        { kind: "house", x: 6, y: -11, w: 6, h: 4.5, roof: ROOF_BROWN },
        { kind: "house", x: -11, y: -6.5, w: 6.5, h: 4.5, roof: ROOF_BROWN },
        { kind: "house", x: -3.5, y: -6, w: 6, h: 4, roof: ROOF_RED },
        { kind: "house", x: 4.5, y: -6.5, w: 7, h: 4.5, roof: ROOF_RED },
      ],
      frontTowers: [
        { x: -13, y: -1.5, r: 2.6, h: 9 },
        { x: 13, y: -1.5, r: 2.6, h: 9 },
      ],
    };
  }
  return {
    wall: "stone",
    buildings: [
      { kind: "tower", x: -12, y: -14, r: 2.4, h: 10 },
      { kind: "tower", x: 12, y: -14, r: 2.4, h: 10 },
      { kind: "house", x: -9, y: -13, w: 6, h: 4.5, roof: ROOF_BROWN },
      { kind: "keep", x: -3.5, y: -12.5, w: 8, h: 14 },
      { kind: "house", x: 6.5, y: -12.5, w: 6, h: 5, roof: ROOF_RED },
      { kind: "house", x: -12, y: -7, w: 6, h: 4.5, roof: ROOF_RED },
      { kind: "hall", x: -5, y: -6.5, w: 7, h: 5.5 },
      { kind: "house", x: 3.5, y: -7, w: 6, h: 4.5, roof: ROOF_BROWN },
      { kind: "house", x: 9.5, y: -6, w: 5, h: 4, roof: ROOF_RED },
    ],
    frontTowers: [
      { x: -13.5, y: -1.5, r: 2.8, h: 10 },
      { x: 13.5, y: -1.5, r: 2.8, h: 10 },
    ],
  };
}

/** Depth offset of the side faces, so buildings look seen from the front right. */
const DEPTH = 2.2;

function drawCity(ctx: CanvasRenderingContext2D, c: DrawCity, selected: boolean): void {
  const ox = c.x * TILE + TILE / 2;
  const oy = c.y * TILE + TILE - 2;
  const color = playerColor(c.owner);
  const rx = c.size >= 6 ? 15 : c.size >= 3 ? 14 : 11;
  const ry = c.size >= 6 ? 7 : 6;
  // Stone walls with towers only when the city has built them, otherwise a palisade.
  const base = cityLayout(c.size);
  const layout: CityLayout = c.walls
    ? {
        ...base,
        wall: "stone",
        frontTowers: base.frontTowers.length
          ? base.frontTowers
          : [
              { x: -rx - 0.5, y: -1.5, r: 2.4, h: 8 },
              { x: rx + 0.5, y: -1.5, r: 2.4, h: 8 },
            ],
      }
    : { ...base, wall: "palisade", frontTowers: [], buildings: base.buildings.filter((b) => b.kind !== "tower") };
  const cy = oy - ry - 1;

  ctx.save();
  ctx.translate(ox, 0);

  // Ground: a trodden earth plaza with a soft shadow.
  ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
  ctx.beginPath();
  ctx.ellipse(1, cy + 2, rx + 1.5, ry + 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#bba57a";
  ctx.beginPath();
  ctx.ellipse(0, cy, rx, ry + 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (selected) {
    ctx.strokeStyle = "#ffd84a";
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, cy, rx + 3, ry + 4.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Back half of the wall, then buildings, then the front half and its towers.
  drawWallArc(ctx, layout.wall, 0, cy, rx, ry, Math.PI, Math.PI * 2, color);
  for (const b of layout.buildings) drawBuilding(ctx, b, oy, color);
  drawWallArc(ctx, layout.wall, 0, cy, rx, ry, 0, Math.PI, color);
  if (layout.wall === "stone") drawGate(ctx, 0, cy + ry);
  for (const t of layout.frontTowers) drawRoundTower(ctx, t.x, oy + t.y, t.r, t.h, color);

  ctx.restore();
}

function drawBuilding(ctx: CanvasRenderingContext2D, b: Building, oy: number, color: string): void {
  switch (b.kind) {
    case "house":
      drawHouse(ctx, b.x, oy + b.y, b.w, b.h, b.roof);
      break;
    case "hall":
      drawHall(ctx, b.x, oy + b.y, b.w, b.h, color);
      break;
    case "keep":
      drawKeep(ctx, b.x, oy + b.y, b.w, b.h, color);
      break;
    case "tower":
      drawRoundTower(ctx, b.x, oy + b.y, b.r, b.h, color);
      break;
  }
}

/** A gabled, half-timbered house; (x, y) is the bottom left corner of the front face. */
function drawHouse(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, roof: string): void {
  const d = DEPTH;
  const rh = w * 0.55;
  const top = y - h;
  // Side wall (darker), seen to the right.
  ctx.fillStyle = "#cbb894";
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + d, y - d * 0.6);
  ctx.lineTo(x + w + d, top - d * 0.6);
  ctx.lineTo(x + w, top);
  ctx.closePath();
  ctx.fill();
  // Front wall.
  ctx.fillStyle = "#efe3c6";
  ctx.fillRect(x, top, w, h);
  // Back roof slope.
  ctx.fillStyle = shade(roof, 0.75);
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w / 2, top - rh);
  ctx.lineTo(x + w / 2 + d, top - rh - d * 0.6);
  ctx.lineTo(x + d, top - d * 0.6);
  ctx.closePath();
  ctx.fill();
  // Gable.
  ctx.fillStyle = "#e6d6b2";
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w / 2, top - rh);
  ctx.lineTo(x + w, top);
  ctx.closePath();
  ctx.fill();
  // Timber frame on the gable and wall.
  ctx.strokeStyle = "#6b4a2e";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + w, top);
  ctx.moveTo(x + w / 2, top - rh);
  ctx.lineTo(x + w / 2, top);
  ctx.moveTo(x + w * 0.25, top - rh * 0.5);
  ctx.lineTo(x + w * 0.75, top - rh * 0.5);
  ctx.stroke();
  // Front roof slope over the side.
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, top - rh);
  ctx.lineTo(x + w / 2 + d, top - rh - d * 0.6);
  ctx.lineTo(x + w + d + 0.5, top - d * 0.6 + 0.3);
  ctx.lineTo(x + w + 0.5, top + 0.3);
  ctx.closePath();
  ctx.fill();
  // Roof edge over the gable.
  ctx.strokeStyle = shade(roof, 0.6);
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(x - 0.4, top + 0.3);
  ctx.lineTo(x + w / 2, top - rh);
  ctx.lineTo(x + w + 0.4, top + 0.3);
  ctx.stroke();
  // Door and window.
  ctx.fillStyle = "#4a3324";
  ctx.fillRect(x + w * 0.2, y - h * 0.62, w * 0.2, h * 0.62);
  ctx.fillStyle = "#3b4a57";
  ctx.fillRect(x + w * 0.58, y - h * 0.72, w * 0.22, h * 0.28);
  ctx.strokeStyle = "rgba(50, 35, 20, 0.6)";
  ctx.lineWidth = 0.4;
  ctx.strokeRect(x, top, w, h);
}

/** A larger hall with a hipped roof and a banner. */
function drawHall(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  const d = DEPTH * 1.2;
  const top = y - h;
  ctx.fillStyle = "#b9a37a";
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + d, y - d * 0.6);
  ctx.lineTo(x + w + d, top - d * 0.6);
  ctx.lineTo(x + w, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e3d2ac";
  ctx.fillRect(x, top, w, h);
  ctx.fillStyle = ROOF_RED;
  ctx.beginPath();
  ctx.moveTo(x - 0.6, top + 0.2);
  ctx.lineTo(x + w * 0.25, top - 3.5);
  ctx.lineTo(x + w * 0.75 + d, top - 3.5 - d * 0.6);
  ctx.lineTo(x + w + d + 0.6, top - d * 0.6 + 0.2);
  ctx.lineTo(x + w + 0.6, top + 0.2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(ROOF_RED, 0.75);
  ctx.beginPath();
  ctx.moveTo(x - 0.6, top + 0.2);
  ctx.lineTo(x + w * 0.25, top - 3.5);
  ctx.lineTo(x + w * 0.75, top - 3.5);
  ctx.lineTo(x + w + 0.6, top + 0.2);
  ctx.closePath();
  ctx.fill();
  // Arched door and two windows.
  ctx.fillStyle = "#4a3324";
  ctx.beginPath();
  ctx.moveTo(x + w * 0.4, y);
  ctx.lineTo(x + w * 0.4, y - h * 0.45);
  ctx.arc(x + w * 0.5, y - h * 0.45, w * 0.1, Math.PI, 0);
  ctx.lineTo(x + w * 0.6, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#3b4a57";
  ctx.fillRect(x + w * 0.12, y - h * 0.72, w * 0.14, h * 0.25);
  ctx.fillRect(x + w * 0.74, y - h * 0.72, w * 0.14, h * 0.25);
  ctx.strokeStyle = "rgba(50, 35, 20, 0.6)";
  ctx.lineWidth = 0.4;
  ctx.strokeRect(x, top, w, h);
  drawBanner(ctx, x + w * 0.25, top - 3.5, color, 4.5);
}

/** A square stone keep with battlements. */
function drawKeep(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  const d = DEPTH * 1.3;
  const top = y - h;
  ctx.fillStyle = "#8d8a80";
  ctx.beginPath();
  ctx.moveTo(x + w, y);
  ctx.lineTo(x + w + d, y - d * 0.6);
  ctx.lineTo(x + w + d, top - d * 0.6);
  ctx.lineTo(x + w, top);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#bdb8aa";
  ctx.fillRect(x, top, w, h);
  // Stone courses.
  ctx.strokeStyle = "rgba(90, 85, 75, 0.45)";
  ctx.lineWidth = 0.35;
  ctx.beginPath();
  for (let sy = top + 2; sy < y; sy += 2) {
    ctx.moveTo(x, sy);
    ctx.lineTo(x + w, sy);
  }
  ctx.stroke();
  // Battlements.
  ctx.fillStyle = "#bdb8aa";
  for (let bx = x; bx < x + w - 0.5; bx += 2) ctx.fillRect(bx, top - 1.3, 1.1, 1.3);
  ctx.fillStyle = "#a6a294";
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x + d, top - d * 0.6);
  ctx.lineTo(x + w + d, top - d * 0.6);
  ctx.lineTo(x + w, top);
  ctx.closePath();
  ctx.fill();
  // Arrow slits and gate.
  ctx.fillStyle = "#2e2a26";
  ctx.fillRect(x + w * 0.25, top + h * 0.2, 0.7, 2);
  ctx.fillRect(x + w * 0.7, top + h * 0.2, 0.7, 2);
  ctx.beginPath();
  ctx.moveTo(x + w * 0.35, y);
  ctx.lineTo(x + w * 0.35, y - h * 0.22);
  ctx.arc(x + w * 0.5, y - h * 0.22, w * 0.15, Math.PI, 0);
  ctx.lineTo(x + w * 0.65, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(50, 45, 40, 0.7)";
  ctx.lineWidth = 0.45;
  ctx.strokeRect(x, top, w, h);
  drawBanner(ctx, x + w / 2 + d / 2, top - d * 0.6 - 0.5, color, 6);
}

/** A round tower with a conical roof; (x, y) is the centre of its base. */
function drawRoundTower(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, h: number, color: string): void {
  const g = ctx.createLinearGradient(x - r, 0, x + r, 0);
  g.addColorStop(0, "#d2cdbf");
  g.addColorStop(0.55, "#aaa598");
  g.addColorStop(1, "#7d796e");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x - r, y - h);
  ctx.lineTo(x - r, y);
  ctx.ellipse(x, y, r, r * 0.4, 0, Math.PI, 0, true);
  ctx.lineTo(x + r, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(60, 55, 48, 0.7)";
  ctx.lineWidth = 0.45;
  ctx.stroke();
  ctx.fillStyle = "#2e2a26";
  ctx.fillRect(x - 0.35, y - h * 0.6, 0.7, 1.8);
  // Conical roof.
  ctx.fillStyle = ROOF_SLATE;
  ctx.beginPath();
  ctx.moveTo(x - r - 0.6, y - h);
  ctx.lineTo(x, y - h - r * 2.2);
  ctx.lineTo(x + r + 0.6, y - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade(ROOF_SLATE, 0.7);
  ctx.beginPath();
  ctx.moveTo(x, y - h - r * 2.2);
  ctx.lineTo(x + r + 0.6, y - h);
  ctx.lineTo(x + 0.3, y - h);
  ctx.closePath();
  ctx.fill();
  drawBanner(ctx, x, y - h - r * 2.2, color, 4);
}

function drawBanner(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, pole: number): void {
  ctx.strokeStyle = "#3a2c22";
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - pole);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - pole);
  ctx.quadraticCurveTo(x + 2.2, y - pole - 0.6, x + 4.2, y - pole + 0.5);
  ctx.lineTo(x + 3.4, y - pole + 1.6);
  ctx.lineTo(x + 4.2, y - pole + 2.6);
  ctx.quadraticCurveTo(x + 2.2, y - pole + 1.6, x, y - pole + 2.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.4;
  ctx.stroke();
}

/** Half of the city wall along an ellipse, from angle a0 to a1 (0 = right, PI/2 = front). */
function drawWallArc(
  ctx: CanvasRenderingContext2D,
  kind: "palisade" | "stone",
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  a0: number,
  a1: number,
  color: string,
): void {
  if (kind === "palisade") {
    const steps = 22;
    for (let k = 0; k <= steps; k++) {
      const a = a0 + ((a1 - a0) * k) / steps;
      const px = cx + Math.cos(a) * rx;
      const py = cy + Math.sin(a) * (ry + 1.5);
      const h = 3.4 + (k % 2) * 0.5;
      ctx.fillStyle = k % 3 === 0 ? "#7a5232" : "#8f6340";
      ctx.beginPath();
      ctx.moveTo(px - 0.65, py);
      ctx.lineTo(px - 0.65, py - h);
      ctx.lineTo(px, py - h - 0.9);
      ctx.lineTo(px + 0.65, py - h);
      ctx.lineTo(px + 0.65, py);
      ctx.closePath();
      ctx.fill();
    }
    // A band in the player's colour binding the stakes.
    ctx.strokeStyle = shade(color, 0.95, 0.9);
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1.8, rx, ry + 1.5, 0, a0, a1);
    ctx.stroke();
    return;
  }
  // Stone wall: a thick band with battlements on top.
  const h = 3.6;
  ctx.lineCap = "butt";
  ctx.strokeStyle = "#8f8a7e";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.ellipse(cx, cy - h / 2, rx, ry + 1.5, 0, a0, a1);
  ctx.stroke();
  const steps = 26;
  for (let k = 0; k <= steps; k++) {
    const a = a0 + ((a1 - a0) * k) / steps;
    const px = cx + Math.cos(a) * rx;
    const py = cy + Math.sin(a) * (ry + 1.5);
    const front = Math.sin(a) > 0;
    ctx.fillStyle = front ? "#c4bfb1" : "#a19c8f";
    ctx.fillRect(px - 0.9, py - h, 1.8, h);
    if (k % 2 === 0) ctx.fillRect(px - 0.6, py - h - 1.1, 1.2, 1.1);
  }
  ctx.strokeStyle = "rgba(70, 65, 58, 0.55)";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry + 1.5, 0, a0, a1);
  ctx.stroke();
}

function drawGate(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#b3ae9f";
  ctx.fillRect(x - 3, y - 6, 6, 6);
  ctx.fillStyle = "#c4bfb1";
  for (const bx of [-3, -0.6, 1.8]) ctx.fillRect(x + bx, y - 7.2, 1.2, 1.2);
  ctx.fillStyle = "#3a2c22";
  ctx.beginPath();
  ctx.moveTo(x - 1.5, y);
  ctx.lineTo(x - 1.5, y - 2.8);
  ctx.arc(x, y - 2.8, 1.5, Math.PI, 0);
  ctx.lineTo(x + 1.5, y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(60, 55, 48, 0.7)";
  ctx.lineWidth = 0.4;
  ctx.strokeRect(x - 3, y - 6, 6, 6);
}

/** Name plate under the city with its size in a disc of the player's colour. */
function drawCityLabel(ctx: CanvasRenderingContext2D, c: DrawCity, width: number): void {
  // Labels grow more slowly than the map when zoomed in, so they do not cover it.
  const k = 1 / Math.sqrt(camera.zoom);
  ctx.font = "600 8.5px ui-sans-serif, system-ui, sans-serif";
  const nameW = ctx.measureText(c.name).width;
  const w = nameW + 18;
  let x = c.x * TILE + TILE / 2 - (w * k) / 2;
  x = Math.max(1, Math.min(x, width * TILE - w * k - 1));
  const y = c.y * TILE + TILE + 0.5;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(k, k);
  ctx.fillStyle = "rgba(18, 18, 20, 0.85)";
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 11, 5.5);
  ctx.fill();
  const color = playerColor(c.owner);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(5.5, 5.5, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = contrastInk(color);
  ctx.font = "700 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(c.size), 5.5, 5.8);
  ctx.fillStyle = "#f3efe6";
  ctx.font = "600 8.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(c.name, 12.5, 6);
  ctx.restore();
}

// ---------- units ----------

function drawUnits(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const byTile = new Map<number, DrawUnit[]>();
  for (const u of input.units) {
    const key = u.y * input.width + u.x;
    byTile.set(key, [...(byTile.get(key) ?? []), u]);
  }
  // Draw from the top of the map down so figures in front overlap those behind.
  const stacks = [...byTile.values()].sort((a, b) => a[0]!.y - b[0]!.y || a[0]!.x - b[0]!.x);
  for (const units of stacks) {
    // Show the selected unit on top of its stack, otherwise one that still waits for orders.
    const top =
      units.find((u) => u.id === input.selectedUnitId) ?? units.find((u) => u.hasMoves) ?? units[0]!;
    const inCity = input.cities.some((c) => c.x === top.x && c.y === top.y);
    // In a city the figure stands small in the front left corner so the city stays visible.
    const scale = inCity ? 0.6 : 1;
    const fx = top.x * TILE + (inCity ? 3.5 : TILE / 2);
    const fy = top.y * TILE + (inCity ? 19.5 : 21);
    drawMiniature(ctx, top, fx, fy, scale, top.id === input.selectedUnitId, units.length);
  }
}

/** A unit figure on its base for panels and the encyclopedia; (fx, fy) is the base centre in canvas pixels. */
export function drawUnitPortrait(
  ctx: CanvasRenderingContext2D,
  type: UnitTypeId,
  owner: number,
  fx: number,
  fy: number,
  scale: number,
): void {
  const unit: DrawUnit = { id: -1, owner, type, x: 0, y: 0, fortified: false, working: false, hasMoves: true };
  drawMiniature(ctx, unit, fx, fy, scale, false, 1);
}

/** Small canvas with a unit portrait, sized in CSS pixels. */
export function unitPortraitCanvas(type: UnitTypeId, owner: number, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.scale(dpr, dpr);
    const s = height / 26;
    drawUnitPortrait(ctx, type, owner, width / 2 + 1.2 * s, height - 4 * s, s);
  }
  return canvas;
}

/** A unit as a painted miniature on a base in the player's colour; (fx, fy) is the base centre. */
function drawMiniature(
  ctx: CanvasRenderingContext2D,
  u: DrawUnit,
  fx: number,
  fy: number,
  s: number,
  selected: boolean,
  stack: number,
): void {
  const color = playerColor(u.owner);
  const wide = WIDE_UNITS.includes(u.type);
  const brx = (wide ? 10.5 : 7.2) * s;
  const bry = (wide ? 3 : 2.6) * s;
  const bcx = fx + (wide ? -1.2 * s : 0);

  ctx.save();
  ctx.globalAlpha = u.hasMoves || selected ? 1 : 0.82;

  // Shadow and base.
  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.beginPath();
  ctx.ellipse(bcx + 0.8 * s, fy + 1 * s, brx + 0.6 * s, bry + 0.7 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  if (selected) {
    ctx.strokeStyle = "rgba(255, 216, 74, 0.5)";
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.ellipse(bcx, fy, brx + 2, bry + 1.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = shade(color, 0.7);
  ctx.beginPath();
  ctx.ellipse(bcx, fy + 0.8 * s, brx, bry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(bcx, fy, brx, bry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = selected ? "#ffd84a" : INK;
  ctx.lineWidth = selected ? 1.3 : 0.8;
  ctx.stroke();

  if (u.working) {
    const done = Math.max(0.04, Math.min(1, u.workProgress ?? 0));
    ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(bcx, fy, brx + 1.6, bry + 1.2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#ffd84a";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(bcx, fy, brx + 1.6, bry + 1.2, 0, -Math.PI / 2, -Math.PI / 2 + done * Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(fx, fy);
  ctx.scale(s, s);
  drawUnitFigure(ctx, u, color);
  ctx.restore();

  if (u.fortified) {
    // A low stone wall in front of the base.
    ctx.fillStyle = "#9b9485";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 0.5;
    for (let k = -3; k <= 3; k++) {
      const wx = bcx + k * 2.4 * s;
      const wy = fy + bry * 0.9 + Math.abs(k) * -0.35 * s;
      ctx.beginPath();
      ctx.rect(wx - 1.2 * s, wy - 2.6 * s, 2.4 * s, 2.6 * s);
      ctx.fill();
      ctx.stroke();
    }
  }

  if (stack > 1) {
    const bx = fx + 7 * s;
    const by = fy - 17 * s;
    ctx.fillStyle = INK;
    ctx.beginPath();
    ctx.arc(bx, by, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#f3efe6";
    ctx.lineWidth = 0.7;
    ctx.stroke();
    ctx.fillStyle = "#f3efe6";
    ctx.font = "700 5.5px ui-sans-serif, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(stack), bx, by + 0.3);
  }
  ctx.restore();
}

/** Warrior in a tunic of the player's colour, with a club and a wooden shield. Origin at the feet. */
/** Units drawn on a wide base: wagons, riders and machines. */

function drawUnitFigure(ctx: CanvasRenderingContext2D, u: DrawUnit, color: string): void {
  drawUnitArt(ctx, u.type, color, u.working);
}
