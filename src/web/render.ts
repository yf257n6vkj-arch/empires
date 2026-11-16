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
import { TERRAINS, type Point, type TerrainId, type UnitTypeId } from "../core";
import { drawUnitArt, WIDE_UNITS } from "./unitArt";
import { DEFAULT_CAMERA, type Camera } from "./camera";
import { FIELD_RES, fieldTerrainAt, terrainField, type Field } from "./terrainField";

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
  tundra: "#a9ad8c",
  arctic: "#e8eff2",
  jungle: "#2f6f2c",
  swamp: "#6c7a4e",
  river: "#76ae4a",
};

/** Colours by player id until a game sets its nations' colours. */
const DEFAULT_COLORS = ["#f4f1ea", "#d9483b", "#3f8fd6", "#e2ac2f"];
let colors: string[] = DEFAULT_COLORS;

/**
 * Painted sprites that replace the drawn figures, keyed "unit-<type>" or
 * "city-<stage>". Empty unless the page loads them (the graphics trial).
 */
const sprites = new Map<string, HTMLImageElement>();
export function setSprites(next: Map<string, HTMLImageElement>): void {
  sprites.clear();
  for (const [k, v] of next) sprites.set(k, v);
}

/** Draws a sprite standing with its bottom centre at (x, y), `h` tall. */
function drawSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, h: number): void {
  const w = (img.naturalWidth / img.naturalHeight) * h;
  ctx.drawImage(img, x - w / 2, y - h, w, h);
}

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
  /** The unit follows a route over several turns. */
  onRoute?: boolean;
  /** The settler improves the land on its own. */
  automated?: boolean;
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
  /** Era of the owner's most advanced technology, 0 to 5; picks the look of the city. */
  era?: number;
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
  /** Special resources, 1 where the tile has one. */
  special?: number[];
  /** Polluted tiles. */
  pollution?: number[];
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
  for (const t of input.terrain) mix(t ? t.charCodeAt(0) * 31 + t.charCodeAt(1) : 0);
  for (const arr of [input.road, input.irrigation, input.mine, input.railroad ?? [], input.fortress ?? [], input.special ?? [], input.pollution ?? []]) for (const v of arr) mix(v);
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

  // A faint grid when zoomed in, so the squares of the rules stay readable on the painted land.
  if (camera.zoom >= 1.6) {
    ctx.save();
    ctx.strokeStyle = "rgba(20, 16, 10, 0.12)";
    ctx.lineWidth = 0.6 / camera.zoom + 0.25;
    ctx.beginPath();
    for (let x = Math.floor(camera.x); x <= Math.ceil(camera.x + viewW); x++) {
      ctx.moveTo(x * TILE, camera.y * TILE);
      ctx.lineTo(x * TILE, (camera.y + viewH) * TILE);
    }
    for (let y = Math.floor(camera.y); y <= Math.ceil(camera.y + viewH); y++) {
      ctx.moveTo(camera.x * TILE, y * TILE);
      ctx.lineTo((camera.x + viewW) * TILE, y * TILE);
    }
    ctx.stroke();
    ctx.restore();
  }

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
  const field = terrainField(width, height, terrain, TERRAIN_COLORS, depth, seaRgb);
  // Only the part in view, with a tile of slack, scaled up smoothly.
  const r = FIELD_RES;
  const fx0 = view.x0;
  const fy0 = view.y0;
  const fw = view.x1 - view.x0 + 1;
  const fh = view.y1 - view.y0 + 1;
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(field.canvas, fx0 * r, fy0 * r, fw * r, fh * r, fx0 * TILE, fy0 * TILE, fw * TILE, fh * TILE);
  ctx.restore();
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      if (terrain[y * width + x]) drawSpeckles(ctx, field, x, y);
    }
  }
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      const t = terrain[y * width + x] ?? null;
      if (t) drawTerrainDetail(ctx, field, t, x, y, depth[y * width + x] ?? 0);
    }
  }
  drawRivers(ctx, input);
  drawImprovements(ctx, input);
  drawSpecials(ctx, input);
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
  tundra: { light: "#c4c7a8", dark: "#7f8467", n: 16 },
  arctic: { light: "#ffffff", dark: "#bfd3dc", n: 12 },
  jungle: { light: "#4f9a3d", dark: "#1d4a1d", n: 14 },
  swamp: { light: "#8a9a62", dark: "#4a5636", n: 16 },
  river: { light: "#8dc45a", dark: "#558f34", n: 16 },
};

/** Small light and dark flecks in the colours of the ground they lie on. */
function drawSpeckles(ctx: CanvasRenderingContext2D, field: Field, x: number, y: number): void {
  const px = x * TILE;
  const py = y * TILE;
  const groups = new Map<string, Path2D>();
  for (let k = 0; k < 18; k++) {
    const sx = px + hash(x, y, 40 + k) * TILE;
    const sy = py + hash(x, y, 80 + k) * TILE;
    const t = fieldTerrainAt(field, sx / TILE, sy / TILE);
    if (!t || t === "ocean") continue;
    const sp = SPECKLE[t];
    if (k >= sp.n) continue;
    const color = k % 2 === 0 ? shade(sp.light, 1, 0.55) : shade(sp.dark, 1, 0.45);
    let path = groups.get(color);
    if (!path) groups.set(color, (path = new Path2D()));
    const w = 0.8 + hash(x, y, 120 + k) * 1.6;
    path.rect(sx - w / 2, sy - 0.4, w, 0.8 + hash(x, y, 160 + k) * 0.6);
  }
  for (const [color, path] of groups) {
    ctx.fillStyle = color;
    ctx.fill(path);
  }
}

/** Sea colour for a depth that may fall between whole tiles. */
function seaRgb(d: number): [number, number, number] {
  const c = Math.max(0, Math.min(SEA_BY_DEPTH.length - 1, d - 1));
  const i = Math.floor(c);
  const a = rgb(SEA_BY_DEPTH[i]!);
  const b = rgb(SEA_BY_DEPTH[Math.min(SEA_BY_DEPTH.length - 1, i + 1)]!);
  const f = c - i;
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

/** Base colour of a tile, with the sea shaded by its distance from land. */
function groundColor(t: TerrainId, depth: number): string {
  if (t !== "ocean") return TERRAIN_COLORS[t];
  return SEA_BY_DEPTH[Math.min(depth, SEA_BY_DEPTH.length) - 1] ?? SEA_BY_DEPTH[SEA_BY_DEPTH.length - 1]!;
}

/**
 * Details on a tile. Hills, mountains and dunes belong to the tile. Small
 * things (grass, flowers, trees, pebbles) sit on a jittered grid and follow
 * the ground they land on, so a forest that reaches into the next tile
 * brings its trees along.
 */
function drawTerrainDetail(ctx: CanvasRenderingContext2D, field: Field, t: TerrainId, x: number, y: number, depth: number): void {
  const px = x * TILE;
  const py = y * TILE;
  const r = (k: number) => hash(x, y, k);
  const ground = (gx: number, gy: number) => fieldTerrainAt(field, gx / TILE, gy / TILE);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (t === "ocean") {
    // Small wave crests; fewer and fainter far from the coast.
    const count = depth <= 2 ? 3 : 2;
    ctx.strokeStyle = `rgba(255, 255, 255, ${depth <= 1 ? 0.28 : 0.16})`;
    ctx.lineWidth = 0.7;
    for (let k = 0; k < count; k++) {
      const wx = px + 2 + r(k + 3) * 15;
      const wy = py + 5 + k * 7 + r(k + 5) * 3;
      if (ground(wx, wy) !== "ocean" || ground(wx + 8, wy) !== "ocean") continue;
      ctx.beginPath();
      ctx.moveTo(wx, wy + 1);
      ctx.quadraticCurveTo(wx + 2, wy - 1, wx + 4, wy + 0.6);
      ctx.quadraticCurveTo(wx + 6, wy - 1, wx + 8, wy + 1);
      ctx.stroke();
    }
    return;
  }

  // Small things on a 3 x 3 jittered grid, drawn top to bottom.
  for (let k = 0; k < 9; k++) {
    const gx = px + ((k % 3) + 0.5) * 8 + (r(200 + k) - 0.5) * 5;
    const gy = py + (Math.floor(k / 3) + 0.5) * 8 + (r(220 + k) - 0.5) * 5;
    const here = ground(gx, gy);
    const roll = r(240 + k);
    switch (here) {
      case "grassland":
        if (roll < 0.6) drawGrassTuft(ctx, gx, gy, 2 + r(260 + k), "#3f7a28", "#7fbd4f");
        else if (roll < 0.78) {
          ctx.fillStyle = r(280 + k) > 0.5 ? "#f4d44c" : "#f6f1e6";
          ctx.beginPath();
          ctx.arc(gx, gy, 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "plains":
        if (roll < 0.66) drawGrassTuft(ctx, gx, gy, 3 + r(260 + k) * 1.2, "#8a7a2e", "#dccd7c");
        else if (roll > 0.94) drawShrub(ctx, gx, gy);
        break;
      case "forest":
        if (r(300 + k) > 0.45) drawConifer(ctx, gx, gy, 0.85 + r(320 + k) * 0.15);
        else drawLeafTree(ctx, gx, gy, 0.85 + r(320 + k) * 0.15);
        break;
      case "desert":
        if (roll < 0.45) {
          ctx.fillStyle = "rgba(140, 110, 60, 0.55)";
          ctx.beginPath();
          ctx.ellipse(gx, gy, 0.7, 0.45, 0, 0, Math.PI * 2);
          ctx.fill();
        } else if (roll > 0.97) drawCactus(ctx, gx, gy);
        break;
      case "hills":
        if (t !== "hills" && roll < 0.4) drawGrassTuft(ctx, gx, gy, 2.2, "#5c6a2c", "#a7ae66");
        break;
      case "river":
        if (roll < 0.45) drawGrassTuft(ctx, gx, gy, 2 + r(260 + k), "#3f7a28", "#7fbd4f");
        break;
      case "tundra":
        if (roll < 0.35) drawGrassTuft(ctx, gx, gy, 1.6, "#6b7058", "#c9cbb0");
        else if (roll < 0.6) {
          ctx.fillStyle = r(280 + k) > 0.5 ? "rgba(120, 128, 96, 0.8)" : "rgba(200, 196, 170, 0.8)";
          ctx.beginPath();
          ctx.ellipse(gx, gy, 1.3, 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case "arctic":
        if (roll < 0.35) {
          ctx.strokeStyle = "rgba(140, 175, 195, 0.7)";
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(gx - 2.5, gy - 0.5);
          ctx.lineTo(gx - 0.5, gy + 0.4);
          ctx.lineTo(gx + 2, gy - 0.3);
          ctx.stroke();
        }
        break;
      case "jungle":
        if (r(300 + k) > 0.35) drawJungleTree(ctx, gx, gy, 0.9 + r(320 + k) * 0.2);
        else drawPalm(ctx, gx, gy, 0.9);
        break;
      case "swamp":
        if (roll < 0.4) {
          ctx.fillStyle = "rgba(70, 110, 120, 0.75)";
          ctx.beginPath();
          ctx.ellipse(gx, gy, 2.6, 1.1, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "rgba(200, 225, 230, 0.5)";
          ctx.lineWidth = 0.35;
          ctx.beginPath();
          ctx.ellipse(gx - 0.4, gy - 0.2, 1.4, 0.5, 0, Math.PI, Math.PI * 2);
          ctx.stroke();
        } else if (roll < 0.8) drawReeds(ctx, gx, gy);
        break;
      default:
        break;
    }
  }

  switch (t) {
    // Hills and mountains need no pictures: the relief of the ground shows them.
    case "desert": {
      drawDune(ctx, px + 2 + r(1) * 3, py + 9 + r(2) * 2, 13);
      drawDune(ctx, px + 8 + r(3) * 3, py + 18 + r(4) * 2, 14);
      break;
    }
    default:
      break;
  }
}

/** A low bush on the plains. */
function drawShrub(ctx: CanvasRenderingContext2D, bx: number, by: number): void {
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

/** A broad, dark tropical tree. */
function drawJungleTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 3.6 * s, 3.8 * s, 1.2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3320";
  ctx.fillRect(x - 0.5 * s, y + 0.6 * s, 1 * s, 3 * s);
  ctx.fillStyle = "#1f4f22";
  ctx.beginPath();
  ctx.ellipse(x, y - 0.6 * s, 4 * s, 2.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#33803a";
  ctx.beginPath();
  ctx.ellipse(x - 1 * s, y - 1.4 * s, 2.4 * s, 1.4 * s, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#58a84e";
  ctx.beginPath();
  ctx.ellipse(x - 1.4 * s, y - 2 * s, 1 * s, 0.6 * s, -0.2, 0, Math.PI * 2);
  ctx.fill();
}

/** A palm with a few fronds. */
function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.strokeStyle = "#6b4a2a";
  ctx.lineWidth = 0.9 * s;
  ctx.beginPath();
  ctx.moveTo(x, y + 3.5 * s);
  ctx.quadraticCurveTo(x + 0.8 * s, y, x + 0.3 * s, y - 2.5 * s);
  ctx.stroke();
  ctx.strokeStyle = "#2f7a32";
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  for (const a of [-2.6, -1.9, -1.2, -0.5, 0.2]) {
    ctx.moveTo(x + 0.3 * s, y - 2.5 * s);
    ctx.quadraticCurveTo(x + 0.3 * s + Math.cos(a) * 2 * s, y - 2.5 * s + Math.sin(a) * 2 * s - 0.6 * s, x + 0.3 * s + Math.cos(a) * 3.2 * s, y - 2.5 * s + Math.sin(a) * 1.4 * s + 1.2 * s);
  }
  ctx.stroke();
}

/** A clump of reeds in the swamp. */
function drawReeds(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.strokeStyle = "#4e5a2a";
  ctx.lineWidth = 0.45;
  ctx.beginPath();
  for (const dx of [-1, -0.3, 0.4, 1.1]) {
    ctx.moveTo(x + dx, y);
    ctx.lineTo(x + dx * 1.4, y - 3.2 - Math.abs(dx));
  }
  ctx.stroke();
  ctx.fillStyle = "#6b4a2a";
  ctx.fillRect(x - 0.6, y - 3.6, 0.6, 1.2);
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

/** Smooth value noise in 0..1 for drawing, from the tile hash. */
function drawNoise(x: number, y: number, k: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0, k);
  const b = hash(x0 + 1, y0, k);
  const c = hash(x0, y0 + 1, k);
  const d = hash(x0 + 1, y0 + 1, k);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

/** One drawn stream: points with the width of the water at each. */
interface Stream {
  pts: { x: number; y: number; w: number }[];
}

/**
 * Rivers drawn as real river systems. Each river tile knows which way the
 * water flows, towards the tile where the river meets the sea. The main
 * course is a smooth curve; at the spring it splits into a fan of small
 * streams that climb into the hills and mountains, side creeks join it
 * along the way, and a big river spreads into a delta of channels at the
 * coast. Everything is drawn first on straight lines and then bent by one
 * smooth noise field, so the rivers meander and every creek still meets
 * its river. Only the river tiles count for the rules; the creeks are
 * just a picture.
 */
function drawRivers(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  const n = width * height;
  const isRiver = (i: number) => terrain[i] === "river";
  const near4 = (i: number): number[] => {
    const x = i % width;
    const y = Math.floor(i / width);
    const out: number[] = [];
    if (y > 0) out.push(i - width);
    if (x < width - 1) out.push(i + 1);
    if (y < height - 1) out.push(i + width);
    if (x > 0) out.push(i - 1);
    return out;
  };
  const tileAtPoint = (x: number, y: number): number => {
    const tx = Math.floor(x / TILE);
    const ty = Math.floor(y / TILE);
    return tx < 0 || ty < 0 || tx >= width || ty >= height ? -1 : ty * width + tx;
  };
  /** Dry land a creek may run over: known, not the sea. */
  const dryLand = (x: number, y: number) => {
    const i = tileAtPoint(x, y);
    const t = i < 0 ? null : (terrain[i] ?? null);
    return t !== null && t !== "ocean";
  };

  // Where the water of each river tile goes: the next river tile, or the sea at the mouth.
  const down = new Int32Array(n).fill(-1);
  const order: number[] = [];
  const seen = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (!isRiver(i)) continue;
    const sea = near4(i).find((j) => terrain[j] === "ocean");
    if (sea === undefined) continue;
    down[i] = sea;
    seen[i] = 1;
    order.push(i);
  }
  for (let q = 0; q < order.length; q++) {
    for (const j of near4(order[q]!)) {
      if (seen[j] || !isRiver(j)) continue;
      seen[j] = 1;
      down[j] = order[q]!;
      order.push(j);
    }
  }
  // Water collected from upstream, for the width.
  const flow = new Float32Array(n);
  for (let q = order.length - 1; q >= 0; q--) {
    const i = order[q]!;
    flow[i] = flow[i]! + 1;
    const d = down[i]!;
    if (d >= 0 && isRiver(d)) flow[d] = flow[d]! + flow[i]!;
  }
  const upstream = new Uint8Array(n);
  for (const i of order) if (isRiver(down[i]!)) upstream[down[i]!] = 1;

  const centre = (i: number): [number, number] => [((i % width) + 0.5) * TILE, (Math.floor(i / width) + 0.5) * TILE];
  // Width grows with the square root of the water flowing through, from a thin line at the source.
  const widthAt = (f: number) => Math.min(4.6, 0.35 + Math.sqrt(f) * 0.8);
  const streams: Stream[] = [];
  const deltas: { x: number; y: number; ux: number; uy: number; reach: number; spread: number }[] = [];
  /** Where each river tile's course was drawn, so later courses join it there. */
  const drawnAt = new Map<number, [number, number]>();

  /**
   * A small stream that starts at (x, y) and runs away from it at `angle`,
   * wandering a little, `len` long, `w0` wide at the start and `w1` at the
   * end. It stops at the sea, at unknown land, or where `stop` says so.
   */
  const creek = (x: number, y: number, angle: number, len: number, w0: number, w1: number, seed: number, stop?: (x: number, y: number) => boolean) => {
    const pts: Stream["pts"] = [{ x, y, w: w0 }];
    const step = 1.4;
    const count = Math.max(2, Math.round(len / step));
    let a = angle;
    let px = x;
    let py = y;
    for (let k = 1; k <= count; k++) {
      a += (hash(seed, k, 131) - 0.5) * 0.7;
      const nx = px + Math.cos(a) * step;
      const ny = py + Math.sin(a) * step;
      if (!dryLand(nx, ny) || (stop && stop(nx, ny))) break;
      px = nx;
      py = ny;
      pts.push({ x: px, y: py, w: w0 + (w1 - w0) * (k / count) });
    }
    if (pts.length >= 3) streams.push({ pts });
    return pts;
  };

  /** A fan of small streams that join into one, like the springs of a river. */
  const springs = (x: number, y: number, angle: number, len: number, w: number, depth: number, seed: number) => {
    // The last streams of the fan thin out to nothing, the others hand their width to two smaller ones.
    const pts = creek(x, y, angle, len, w, depth <= 0 ? w * 0.08 : w * 0.75, seed);
    if (depth <= 0 || pts.length < 3) return;
    const tip = pts[pts.length - 1]!;
    const mid = pts[Math.floor(pts.length * 0.5)]!;
    const spread = 0.45 + hash(seed, 7, 133) * 0.35;
    springs(tip.x, tip.y, angle - spread, len * 0.7, w * 0.7, depth - 1, seed * 3 + 1);
    springs(tip.x, tip.y, angle + spread, len * 0.7, w * 0.7, depth - 1, seed * 3 + 2);
    // Now and then one more little stream joins halfway.
    if (hash(seed, 9, 137) > 0.45) {
      const side = hash(seed, 11, 139) > 0.5 ? 1 : -1;
      creek(mid.x, mid.y, angle + side * (0.9 + hash(seed, 13, 141) * 0.4), len * 0.55, w * 0.6, w * 0.06, seed * 7 + 5);
    }
  };

  for (const source of order) {
    if (upstream[source]) continue;
    // The main course from the spring down to the sea or to the river it joins.
    const tiles: number[] = [];
    let i = source;
    let mouth = -1;
    for (let guard = 0; guard < 200; guard++) {
      tiles.push(i);
      const d = down[i]!;
      if (d < 0) break;
      if (!isRiver(d)) {
        mouth = d;
        break;
      }
      if (tiles.includes(d)) break;
      i = d;
    }
    // Stop where this course reaches a river already drawn from another spring.
    const pts: [number, number][] = [];
    const widths: number[] = [];
    const ptTiles: number[] = [];
    let joined = false;
    for (const t of tiles) {
      pts.push(centre(t));
      ptTiles.push(t);
      widths.push(widthAt(flow[t]!));
      if (seen[t] === 2) {
        joined = true;
        break;
      }
      seen[t] = 2;
    }
    const big = mouth >= 0 && flow[tiles[tiles.length - 1]!]! >= 6;
    if (mouth >= 0 && !joined) {
      const [ax, ay] = centre(tiles[tiles.length - 1]!);
      const [sx, sy] = centre(mouth);
      const ux = (sx - ax) / TILE;
      const uy = (sy - ay) / TILE;
      if (big) {
        // The river ends near the coast and splits into a delta there.
        const start = { x: ax + ux * TILE * 0.3, y: ay + uy * TILE * 0.3 };
        pts.push([start.x, start.y]);
        widths.push(widthAt(flow[tiles[tiles.length - 1]!]!));
        deltas.push({ x: start.x, y: start.y, ux, uy, reach: TILE * 0.9, spread: 0.75 });
      } else {
        // A small river opens into a funnel-shaped mouth.
        pts.push([ax + ux * TILE * 0.85, ay + uy * TILE * 0.85]);
        widths.push(widthAt(flow[tiles[tiles.length - 1]!]!) * 1.8);
      }
    }
    if (pts.length < 2) continue;
    // Average each tile centre with its neighbours, so the square steps between tiles become bends.
    const soft = pts.map((p0, k): [number, number] => {
      if (k === 0 || k >= pts.length - 2) return p0;
      let ax = 0;
      let ay = 0;
      let aw = 0;
      for (let j = Math.max(0, k - 2); j <= Math.min(pts.length - 2, k + 2); j++) {
        const wgt = j === k ? 2 : Math.abs(j - k) === 1 ? 1.5 : 0.7;
        ax += pts[j]![0] * wgt;
        ay += pts[j]![1] * wgt;
        aw += wgt;
      }
      return [ax / aw, ay / aw];
    });
    pts.splice(0, pts.length, ...soft);
    // A course that runs into a river drawn before ends exactly where that river passes.
    ptTiles.forEach((t, k) => {
      const there = drawnAt.get(t);
      if (there) pts[k] = there;
      else drawnAt.set(t, pts[k]!);
    });

    // A smooth curve through the tile centres, sampled densely.
    const line: Stream["pts"] = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const a = pts[Math.max(0, k - 1)]!;
      const b = pts[k]!;
      const e = pts[k + 1]!;
      const f = pts[Math.min(pts.length - 1, k + 2)]!;
      const c1 = [b[0] + (e[0] - a[0]) / 6, b[1] + (e[1] - a[1]) / 6] as const;
      const c2 = [e[0] - (f[0] - b[0]) / 6, e[1] - (f[1] - b[1]) / 6] as const;
      for (let s2 = 0; s2 < 16; s2++) {
        const t = s2 / 16;
        const u = 1 - t;
        line.push({
          x: u * u * u * b[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * e[0],
          y: u * u * u * b[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * e[1],
          w: widths[k]! * u + widths[k + 1]! * t,
        });
      }
    }
    const last = pts[pts.length - 1]!;
    line.push({ x: last[0], y: last[1], w: widths[widths.length - 1]! });
    streams.push({ pts: line });

    // Springs: the river is born from a fan of small streams up in the hills.
    const head = line[0]!;
    const next = line[Math.min(line.length - 1, 8)]!;
    let back = Math.atan2(head.y - next.y, head.x - next.x);
    const sx = source % width;
    const sy = Math.floor(source / width);
    // The springs reach towards the nearest hills or mountains.
    let best = Infinity;
    for (let dy = -3; dy <= 3; dy++) {
      for (let dx = -3; dx <= 3; dx++) {
        const x = sx + dx;
        const y = sy + dy;
        if (x < 0 || y < 0 || x >= width || y >= height || (dx === 0 && dy === 0)) continue;
        const t = terrain[y * width + x];
        if (t !== "hills" && t !== "mountains") continue;
        const d2 = dx * dx + dy * dy - (t === "mountains" ? 0.5 : 0);
        if (d2 < best) {
          best = d2;
          const toward = Math.atan2(dy, dx);
          // Blend with the way the river came, so the springs never point downstream.
          const diff = Math.atan2(Math.sin(toward - back), Math.cos(toward - back));
          back += Math.max(-1.2, Math.min(1.2, diff));
        }
      }
    }
    springs(head.x, head.y, back, TILE * 0.75, head.w * 0.85, 2, sx * 97 + sy * 13 + 1);

    // Side creeks along the way, joining at a sharp angle from upstream.
    const sideStart = 12;
    for (let k = sideStart; k < line.length - 20; k += 10) {
      const p = line[k]!;
      const tile = tileAtPoint(p.x, p.y);
      if (hash(k, tile, 151) > 0.42) continue;
      const q = line[Math.max(0, k - 4)]!;
      const along = Math.atan2(q.y - p.y, q.x - p.x);
      const side = hash(k, tile, 153) > 0.5 ? 1 : -1;
      const angle = along + side * (0.75 + hash(k, tile, 155) * 0.5);
      const w0 = Math.min(1.3, p.w * 0.45);
      const len = TILE * (0.8 + hash(k, tile, 157) * 0.8);
      const pts2 = creek(p.x, p.y, angle, len, w0, 0.05, tile * 17 + k, (x, y) => {
        const j = tileAtPoint(x, y);
        return j !== tile && j >= 0 && isRiver(j);
      });
      // The longer creeks take in a smaller one of their own on the way up.
      if (pts2.length > 10) {
        const at = pts2[Math.floor(pts2.length * 0.55)]!;
        const turn = hash(k, tile, 159) > 0.5 ? 0.6 : -0.6;
        creek(at.x, at.y, angle + turn, TILE * 0.45, at.w * 0.75, 0.04, tile * 19 + k);
      }
    }
  }

  // Deltas: a fan of channels and sandbanks where a big river meets the sea.
  const deltaLand: { x: number; y: number }[][] = [];
  for (const d of deltas) {
    const base = Math.atan2(d.uy, d.ux);
    const arms = 4;
    const fan: { x: number; y: number }[] = [{ x: d.x - d.ux * 2, y: d.y - d.uy * 2 }];
    for (let k = 0; k <= 12; k++) {
      const a = base - d.spread + (2 * d.spread * k) / 12;
      const r = d.reach * (1.05 + (hash(k, Math.round(d.x), 161) - 0.5) * 0.2);
      fan.push({ x: d.x + Math.cos(a) * r, y: d.y + Math.sin(a) * r });
    }
    deltaLand.push(fan);
    for (let k = 0; k < arms; k++) {
      const a = base - d.spread * 0.8 + (1.6 * d.spread * k) / (arms - 1);
      const pts: Stream["pts"] = [];
      const steps = 8;
      let px = d.x;
      let py = d.y;
      let ang = base;
      for (let j = 0; j <= steps; j++) {
        // Each channel bends from the river's direction out to its own.
        const t = j / steps;
        ang = base + (a - base) * Math.min(1, t * 1.6) + (hash(k, j, 163) - 0.5) * 0.3;
        pts.push({ x: px, y: py, w: 2.2 - 1.4 * t });
        px += Math.cos(ang) * ((d.reach * 1.1) / steps);
        py += Math.sin(ang) * ((d.reach * 1.1) / steps);
      }
      streams.push({ pts });
    }
  }

  // Meanders: the same smooth field moves every point of every stream, so junctions stay joined.
  const AMP = TILE * 0.18;
  const bend = (p: { x: number; y: number }) => {
    const fx = p.x / TILE;
    const fy = p.y / TILE;
    p.x += ((drawNoise(fx * 1.6, fy * 1.6, 91) - 0.5) * 2 + (drawNoise(fx * 3.7, fy * 3.7, 93) - 0.5) * 0.8) * AMP;
    p.y += ((drawNoise(fx * 1.6, fy * 1.6, 92) - 0.5) * 2 + (drawNoise(fx * 3.7, fy * 3.7, 94) - 0.5) * 0.8) * AMP;
  };
  for (const st of streams) for (const p of st.pts) bend(p);
  for (const fan of deltaLand) for (const p of fan) bend(p);

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  // Sandy, reedy land of the deltas.
  for (const fan of deltaLand) {
    ctx.fillStyle = "rgba(170, 182, 112, 0.9)";
    ctx.beginPath();
    fan.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "rgba(240, 228, 180, 0.8)";
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  // Thin streams are measured finely, so they can taper all the way down to a hairline.
  const step = (w: number) => (w < 1 ? Math.max(0.04, Math.round(w * 20) / 20) : Math.round(w * 4) / 4);
  const stroke = (color: string, grow: number, scale: number, minWidth = 0) => {
    ctx.strokeStyle = color;
    for (const st of streams) {
      const line = st.pts;
      // Pieces of about the same width share one path.
      let k = 0;
      while (k < line.length - 1) {
        const w = step(line[k]!.w);
        let j = k + 1;
        if (w >= minWidth) {
          // The bank and the dark edge shrink with the stream, and the thinnest water fades out.
          ctx.lineWidth = w * scale + grow * Math.min(1, w / 1.4);
          ctx.globalAlpha = w < 0.9 ? 0.3 + 0.7 * (w / 0.9) : 1;
          ctx.beginPath();
          ctx.moveTo(line[k]!.x, line[k]!.y);
          for (; j < line.length; j++) {
            ctx.lineTo(line[j]!.x, line[j]!.y);
            if (step(line[j]!.w) !== w) break;
          }
          ctx.stroke();
        }
        k = Math.max(k + 1, j);
      }
    }
    ctx.globalAlpha = 1;
  };
  // Green banks, a dark edge, the water and a light sheen on the wider streams.
  stroke("rgba(52, 96, 40, 0.28)", 2, 1);
  stroke("#2c6188", 0.9, 1);
  stroke("#4a92c2", 0, 1);
  stroke("rgba(196, 230, 246, 0.5)", 0, 0.28, 1.8);
  ctx.restore();
}

/**
 * Special resources are painted into the landscape of the tile: a shoal of
 * fish in the sea, horses grazing on the plains, a gold vein in the rock.
 * Each tile varies the picture a little, so neighbouring specials don't look
 * stamped.
 */
function drawSpecials(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, terrain } = input;
  const special = input.special;
  if (!special) return;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (let y = view.y0; y <= view.y1; y++) {
    for (let x = view.x0; x <= view.x1; x++) {
      const i = y * width + x;
      const t = terrain[i];
      if (!t || !special[i]) continue;
      const id = TERRAINS[t].special?.id;
      if (id) drawSpecial(ctx, id, x * TILE, y * TILE, x, y);
    }
  }
  ctx.restore();
}

function drawSpecial(ctx: CanvasRenderingContext2D, id: string, ox: number, oy: number, tx: number, ty: number): void {
  const r = (k: number) => hash(tx, ty, 300 + k);
  const flip = r(0) > 0.5 ? 1 : -1;
  ctx.lineWidth = 0.6;
  switch (id) {
    case "fish": {
      // A shoal: small dark backs just under the surface and a ripple around them.
      const cx = ox + TILE * (0.45 + r(1) * 0.1);
      const cy = oy + TILE * (0.5 + r(2) * 0.1);
      ctx.strokeStyle = "rgba(220, 240, 250, 0.45)";
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.ellipse(cx, cy, TILE * 0.36, TILE * 0.22, -0.2, 0, Math.PI * 2);
      ctx.stroke();
      const dir = r(3) * Math.PI * 2;
      for (let k = 0; k < 4; k++) {
        const fx = cx + (r(10 + k) - 0.5) * TILE * 0.46;
        const fy = cy + (r(20 + k) - 0.5) * TILE * 0.26;
        fish(ctx, fx, fy, dir + (r(30 + k) - 0.5) * 0.6, 0.8 + r(40 + k) * 0.4);
      }
      break;
    }
    case "horses": {
      horse(ctx, ox + TILE * 0.34, oy + TILE * 0.58, flip, "#6b3f1f", 1.2);
      horse(ctx, ox + TILE * 0.64, oy + TILE * 0.42, -flip, r(5) > 0.5 ? "#2e2620" : "#a8743e", 1);
      break;
    }
    case "pheasant": {
      pheasant(ctx, ox + TILE * (0.4 + r(1) * 0.15), oy + TILE * 0.62, flip);
      break;
    }
    case "game": {
      deer(ctx, ox + TILE * 0.38, oy + TILE * 0.6, flip, 1);
      deer(ctx, ox + TILE * 0.66, oy + TILE * 0.44, flip, 0.8);
      break;
    }
    case "coal": {
      // Dark coal breaking out of the hillside as angular blocks, with loose lumps below.
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.6;
      rock(ctx, cx - 3.2 * flip, cy - 0.6, 3.6, "#1b1a19", "#4a4846", r(1));
      rock(ctx, cx + 2.4 * flip, cy - 1.8, 2.8, "#232120", "#55524f", r(2));
      rock(ctx, cx + 1 * flip, cy + 2.2, 2.2, "#1b1a19", "#4a4846", r(3));
      ctx.fillStyle = "#262422";
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        ctx.arc(cx + (r(50 + k) - 0.5) * 11, cy + 3.6 + r(60 + k) * 1.4, 0.6 + r(70 + k) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "gold": {
      // A brown rock face cut by a golden vein, with nuggets that catch the light.
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.6;
      rock(ctx, cx, cy, 5.2, "#5b4a3a", "#8a7560", r(1));
      ctx.strokeStyle = "#f2c53a";
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx - 3.6 * flip, cy + 1.8);
      ctx.lineTo(cx - 1.2 * flip, cy + 0.4);
      ctx.lineTo(cx - 0.2 * flip, cy + 1.2);
      ctx.lineTo(cx + 2.6 * flip, cy - 1.6);
      ctx.moveTo(cx - 0.2 * flip, cy + 1.2);
      ctx.lineTo(cx + 1.2 * flip, cy + 3);
      ctx.stroke();
      for (const [dx, dy, sz] of [
        [-4.6, 4.4, 1.2],
        [-2.4, 5, 0.9],
        [3.8, 4.2, 1],
      ] as const) {
        ctx.fillStyle = "#c8921c";
        ctx.beginPath();
        ctx.ellipse(cx + dx * flip, cy + dy, sz * 1.2, sz * 0.85, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffe27a";
        ctx.beginPath();
        ctx.ellipse(cx + dx * flip - sz * 0.3, cy + dy - sz * 0.3, sz * 0.5, sz * 0.35, 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      sparkle(ctx, cx + 2.6 * flip, cy - 1.8, 2.2, "#fff6c8");
      sparkle(ctx, cx - 4.6 * flip, cy + 3.8, 1.5, "#fff6c8");
      break;
    }
    case "gems": {
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.6;
      gem(ctx, cx - 3.2, cy + 0.8, 2.2, "#d0378f");
      gem(ctx, cx + 2.6, cy + 1.2, 1.8, "#2fb6c8");
      gem(ctx, cx + 0.2, cy - 2.4, 1.6, "#5fd05a");
      sparkle(ctx, cx - 2.4, cy - 0.6, 1.8, "#ffffff");
      break;
    }
    case "oasis": {
      // A pond with a ring of green and two palms leaning over it.
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.62;
      ctx.fillStyle = "rgba(92, 150, 60, 0.85)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 7.5, 3.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3f8fc0";
      ctx.beginPath();
      ctx.ellipse(cx + 0.5, cy + 0.4, 5, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(210, 238, 250, 0.7)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(cx - 2, cy);
      ctx.lineTo(cx + 2, cy);
      ctx.stroke();
      palm(ctx, cx - 4.5, cy - 0.5, -0.25, 9);
      palm(ctx, cx + 4, cy - 1, 0.3, 7.5);
      break;
    }
    case "seals": {
      // Seals lying on the ice next to a breathing hole.
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.58;
      ctx.fillStyle = "#3d6f8e";
      ctx.beginPath();
      ctx.ellipse(cx + flip * 4.5, cy + 2.5, 3, 1.4, 0, 0, Math.PI * 2);
      ctx.fill();
      seal(ctx, cx - flip * 2, cy, flip, 1);
      seal(ctx, cx + flip * 1.5, cy - 3.5, -flip, 0.75);
      break;
    }
    case "peat": {
      // Rows of cut peat drying on the bog, with the dark cut face behind.
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.6;
      ctx.fillStyle = "#2e1d10";
      ctx.fillRect(cx - 7, cy - 4.5, 14, 2);
      for (let row = 0; row < 2; row++) {
        for (let k = 0; k < 4; k++) {
          const bx = cx - 6.5 + k * 3.4 + row * 1.6;
          const by = cy - 0.5 + row * 3;
          ctx.fillStyle = (k + row) % 2 ? "#5e3d22" : "#4d311b";
          ctx.fillRect(bx, by, 2.6, 1.8);
          ctx.fillStyle = "rgba(160, 120, 80, 0.6)";
          ctx.fillRect(bx, by, 2.6, 0.5);
        }
      }
      break;
    }
    case "resources": {
      // Rich, lush ground: darker tufts of grass and flowers.
      const cx = ox + TILE * 0.5;
      const cy = oy + TILE * 0.56;
      ctx.fillStyle = "rgba(40, 96, 30, 0.55)";
      ctx.beginPath();
      ctx.ellipse(cx, cy, 8, 4.5, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#2f6e22";
      ctx.lineWidth = 0.7;
      for (let k = 0; k < 7; k++) {
        const gx = cx + (r(80 + k) - 0.5) * 13;
        const gy = cy + (r(90 + k) - 0.5) * 6 + 1.5;
        ctx.beginPath();
        ctx.moveTo(gx - 1.2, gy - 2);
        ctx.lineTo(gx, gy);
        ctx.lineTo(gx + 1.2, gy - 2);
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx, gy - 2.6);
        ctx.stroke();
      }
      const colours = ["#f4d33c", "#ffffff", "#e8603c", "#f4d33c", "#b07ae0"];
      for (let k = 0; k < 6; k++) {
        ctx.fillStyle = colours[k % colours.length]!;
        ctx.beginPath();
        ctx.arc(cx + (r(100 + k) - 0.5) * 12, cy + (r(110 + k) - 0.5) * 6, 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    default:
      break;
  }
}

function fish(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(size, size);
  ctx.fillStyle = "rgba(28, 58, 84, 0.75)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.3, 0.85, 0, 0, Math.PI * 2);
  ctx.moveTo(-1.8, 0);
  ctx.lineTo(-3.4, -1);
  ctx.lineTo(-3.4, 1);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(200, 230, 245, 0.55)";
  ctx.beginPath();
  ctx.ellipse(0.4, -0.35, 1.2, 0.25, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function horse(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, colour: string, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * size, size);
  // A grazing horse: the head goes down to the grass.
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(0, 3.4, 3.6, 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(-2, 0.5);
  ctx.lineTo(-2.3, 3.3);
  ctx.moveTo(-1.1, 0.7);
  ctx.lineTo(-1, 3.3);
  ctx.moveTo(1.4, 0.7);
  ctx.lineTo(1.6, 3.3);
  ctx.moveTo(2.2, 0.5);
  ctx.lineTo(2.6, 3.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -0.2, 3, 1.35, 0, 0, Math.PI * 2);
  ctx.fill();
  // Neck down to the head.
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(2.4, -0.6);
  ctx.quadraticCurveTo(4.2, -0.4, 4.4, 2.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(4.5, 2.5, 0.75, 1.05, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Tail.
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-2.9, -0.6);
  ctx.quadraticCurveTo(-4, 0, -3.8, 1.8);
  ctx.stroke();
  ctx.restore();
}

function pheasant(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);
  // A light clearing, so the bird stands out against the trees.
  ctx.fillStyle = "rgba(190, 170, 110, 0.55)";
  ctx.beginPath();
  ctx.ellipse(0.5, 1.6, 5.5, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Long barred tail.
  ctx.strokeStyle = "#7a4a20";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-1.5, -0.2);
  ctx.lineTo(-6.5, -2.8);
  ctx.stroke();
  ctx.fillStyle = "#b8562a";
  ctx.beginPath();
  ctx.ellipse(0, 0, 2.6, 1.6, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e4b064";
  ctx.beginPath();
  ctx.ellipse(-0.4, -0.3, 1.2, 0.6, -0.2, 0, Math.PI * 2);
  ctx.fill();
  // Green head with the white ring and the red face.
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(1.6, -0.8);
  ctx.lineTo(2.3, -1.1);
  ctx.stroke();
  ctx.fillStyle = "#1f5a3a";
  ctx.beginPath();
  ctx.arc(2.6, -1.9, 0.95, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d62a1e";
  ctx.beginPath();
  ctx.arc(2.9, -1.9, 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#5a3a1c";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(-0.3, 1.3);
  ctx.lineTo(-0.3, 2.6);
  ctx.moveTo(0.7, 1.3);
  ctx.lineTo(0.9, 2.6);
  ctx.stroke();
  ctx.restore();
}

function deer(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * size, size);
  ctx.fillStyle = "rgba(0, 0, 0, 0.16)";
  ctx.beginPath();
  ctx.ellipse(0, 3.4, 3.2, 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  const c = "#7a5a3a";
  ctx.strokeStyle = c;
  ctx.fillStyle = c;
  ctx.lineWidth = 0.65;
  ctx.beginPath();
  ctx.moveTo(-1.8, 0.4);
  ctx.lineTo(-1.9, 3.3);
  ctx.moveTo(-0.9, 0.6);
  ctx.lineTo(-0.8, 3.3);
  ctx.moveTo(1.2, 0.6);
  ctx.lineTo(1.3, 3.3);
  ctx.moveTo(1.9, 0.4);
  ctx.lineTo(2.2, 3.3);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -0.2, 2.6, 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8e0d0";
  ctx.beginPath();
  ctx.ellipse(-2.3, -0.3, 0.6, 0.7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head held up, with antlers.
  ctx.fillStyle = c;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(2, -0.6);
  ctx.lineTo(3, -2.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(3.5, -2.9, 1, 0.65, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#d8c8a8";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(3, -3.3);
  ctx.lineTo(2.2, -5.4);
  ctx.moveTo(2.6, -4.3);
  ctx.lineTo(1.6, -4.6);
  ctx.moveTo(3.4, -3.4);
  ctx.lineTo(4, -5.6);
  ctx.moveTo(3.7, -4.5);
  ctx.lineTo(4.7, -4.9);
  ctx.stroke();
  ctx.restore();
}

function seal(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, size: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir * size, size);
  ctx.fillStyle = "rgba(60, 80, 100, 0.25)";
  ctx.beginPath();
  ctx.ellipse(0, 1.6, 4, 0.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5d6a73";
  ctx.beginPath();
  ctx.moveTo(-4, 1);
  ctx.quadraticCurveTo(-1, -1.8, 2.2, -1.2);
  ctx.quadraticCurveTo(3.8, -1, 3.6, 0.4);
  ctx.quadraticCurveTo(1, 1.8, -4, 1);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3.8, 1);
  ctx.lineTo(-5, 0);
  ctx.lineTo(-4.8, 1.6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(220, 230, 236, 0.5)";
  ctx.beginPath();
  ctx.ellipse(0, -0.6, 2, 0.4, -0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(2.8, -0.6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function vein(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number): void {
  ctx.beginPath();
  ctx.moveTo(x - dir * 6, y + 3.5);
  ctx.lineTo(x - dir * 2.5, y + 1);
  ctx.lineTo(x - dir * 1.5, y + 2.2);
  ctx.lineTo(x + dir * 2.5, y - 1.5);
  ctx.lineTo(x + dir * 5.5, y - 2.5);
  ctx.moveTo(x - dir * 1.5, y + 2.2);
  ctx.lineTo(x + dir * 1, y + 3.8);
  ctx.stroke();
}

function sparkle(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, colour: string): void {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.22, y - size * 0.22);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x + size * 0.22, y + size * 0.22);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.22, y + size * 0.22);
  ctx.lineTo(x - size, y);
  ctx.lineTo(x - size * 0.22, y - size * 0.22);
  ctx.closePath();
  ctx.fill();
}

/** An angular block of rock: a lit top, a dark face and a soft shadow. */
function rock(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, body: string, top: string, seed: number): void {
  const pts: [number, number][] = [];
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + seed;
    const rr = size * (0.75 + hash(k, seed * 100, 401) * 0.35);
    pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.7]);
  }
  ctx.fillStyle = "rgba(0, 0, 0, 0.22)";
  ctx.beginPath();
  ctx.ellipse(x + size * 0.15, y + size * 0.65, size * 1.05, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  pts.forEach(([px, py], k) => (k ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fill();
  // The upper left facet faces the light, which comes from the north-west.
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.15, y - size * 0.1);
  for (const [px, py] of pts) if (py < y + size * 0.05 && px < x + size * 0.6) ctx.lineTo(px, py);
  ctx.closePath();
  ctx.fill();
}

function gem(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, colour: string): void {
  // A cut stone seen from the side: a flat table on top and a point below.
  ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x, y + size * 1.3, size * 1.1, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colour;
  ctx.strokeStyle = "rgba(20, 10, 20, 0.7)";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(x - size * 0.55, y - size * 0.7);
  ctx.lineTo(x + size * 0.55, y - size * 0.7);
  ctx.lineTo(x + size, y - size * 0.15);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y - size * 0.15);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.beginPath();
  ctx.moveTo(x - size * 0.55, y - size * 0.7);
  ctx.lineTo(x, y - size * 0.7);
  ctx.lineTo(x - size * 0.3, y - size * 0.15);
  ctx.lineTo(x - size, y - size * 0.15);
  ctx.closePath();
  ctx.fill();
}

function palm(ctx: CanvasRenderingContext2D, x: number, y: number, lean: number, height: number): void {
  const topX = x + Math.sin(lean) * height;
  const topY = y - Math.cos(lean) * height;
  ctx.strokeStyle = "#7a5a30";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + Math.sin(lean) * height * 0.2, y - height * 0.6, topX, topY);
  ctx.stroke();
  ctx.strokeStyle = "#2f7a2c";
  ctx.lineWidth = 0.9;
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI * 0.95 + k * (Math.PI * 0.9 / 4) + lean * 0.5;
    const ex = topX + Math.cos(a) * 3.6;
    const ey = topY + Math.sin(a) * 1.8 + 1.4;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo((topX + ex) / 2, topY + Math.sin(a) * 2.6 - 0.6, ex, ey);
    ctx.stroke();
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
      if (input.pollution?.[i]) drawPollution(ctx, px, py);
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

/** Grey smog with a few dark blots of soot over a polluted tile. */
function drawPollution(ctx: CanvasRenderingContext2D, px: number, py: number): void {
  ctx.save();
  ctx.fillStyle = "rgba(55, 52, 46, 0.45)";
  ctx.fillRect(px, py, TILE, TILE);
  const puffs: [number, number, number][] = [
    [0.3, 0.38, 0.2],
    [0.55, 0.3, 0.24],
    [0.72, 0.5, 0.18],
    [0.42, 0.6, 0.22],
  ];
  for (const [fx, fy, fr] of puffs) {
    const g = ctx.createRadialGradient(px + fx * TILE, py + fy * TILE, 0, px + fx * TILE, py + fy * TILE, fr * TILE);
    g.addColorStop(0, "rgba(30, 27, 24, 0.85)");
    g.addColorStop(1, "rgba(38, 34, 30, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(px + fx * TILE, py + fy * TILE, fr * TILE, 0, Math.PI * 2);
    ctx.fill();
  }
  // A small warning mark: a yellow triangle.
  ctx.fillStyle = "#e0c341";
  ctx.strokeStyle = "#3a2f10";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(px + TILE * 0.78, py + TILE * 0.12);
  ctx.lineTo(px + TILE * 0.94, py + TILE * 0.38);
  ctx.lineTo(px + TILE * 0.62, py + TILE * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3a2f10";
  ctx.fillRect(px + TILE * 0.775, py + TILE * 0.2, TILE * 0.03, TILE * 0.1);
  ctx.restore();
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

  const stage = (c.era ?? 0) >= 5 ? "modern" : (c.era ?? 0) >= 4 ? "industrial" : (c.era ?? 0) >= 2 ? "medieval" : "ancient";
  const big = c.size >= 6;
  const citySprite =
    sprites.get(`city-${stage}-${big ? "large" : "small"}`) ?? sprites.get(`city-${stage}-${big ? "small" : "large"}`);
  if (citySprite) {
    // The owner's colour as a ring around the city, since the painting has none.
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, cy + 1, rx + 1.5, ry + 2.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    drawSprite(ctx, citySprite, 0, cy + ry + 2, TILE * 1.15);
    ctx.restore();
    return;
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

  if (u.fortified) drawRampart(ctx, bcx, fy, brx, bry, s, "back");
  const unitSprite = sprites.get(`unit-${u.type}`);
  if (unitSprite) {
    drawSprite(ctx, unitSprite, fx, fy + bry * 0.4, 21 * s);
  } else {
    ctx.save();
    ctx.translate(fx, fy);
    ctx.scale(s, s);
    drawUnitFigure(ctx, u, color);
    ctx.restore();
  }

  if (u.fortified) {
    drawRampart(ctx, bcx, fy, brx, bry, s, "front");
    drawFortifiedBadge(ctx, bcx + brx + 0.5 * s, fy - 15 * s, s);
  } else if (u.onRoute) {
    drawRouteBadge(ctx, bcx + brx + 0.5 * s, fy - 15 * s, s);
  } else if (u.automated) {
    drawAutoBadge(ctx, bcx + brx + 0.5 * s, fy - 15 * s, s);
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

/**
 * A ring of stone wall with battlements around a fortified unit's base.
 * The back half is drawn before the unit, the front half after it.
 */
function drawRampart(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number, s: number, half: "back" | "front"): void {
  const wallRx = rx + 2.4 * s;
  const wallRy = ry + 1.8 * s;
  const h = (half === "front" ? 3 : 2.2) * s;
  const [from, to] = half === "front" ? [0, Math.PI] : [Math.PI, Math.PI * 2];
  const at = (a: number, lift: number) => ({ x: cx + Math.cos(a) * wallRx, y: cy + Math.sin(a) * wallRy - lift });
  const n = 24;
  ctx.save();
  ctx.lineJoin = "round";
  // The wall as one band: bottom edge along the ellipse, top edge lifted by its height.
  ctx.beginPath();
  for (let k = 0; k <= n; k++) {
    const p = at(from + ((to - from) * k) / n, 0);
    if (k === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  for (let k = n; k >= 0; k--) {
    const p = at(from + ((to - from) * k) / n, h);
    ctx.lineTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = half === "front" ? "#a9a08a" : "#7d7666";
  ctx.fill();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = INK;
  ctx.stroke();
  // Battlements on top.
  const merlons = half === "front" ? 7 : 5;
  ctx.fillStyle = half === "front" ? "#c9c1aa" : "#958d7b";
  for (let k = 0; k < merlons; k++) {
    const a = from + ((to - from) * (k + 0.5)) / merlons;
    const p = at(a, h);
    const w = 1.6 * s;
    ctx.beginPath();
    ctx.rect(p.x - w / 2, p.y - 1.3 * s, w, 1.3 * s);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** A round badge with an arrow for a unit that is on its way somewhere. */
function drawRouteBadge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const r = 2.9 * s;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#2d6cdf";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#f3efe6";
  ctx.stroke();
  ctx.fillStyle = "#f3efe6";
  ctx.beginPath();
  ctx.moveTo(x - r * 0.55, y - r * 0.18);
  ctx.lineTo(x + r * 0.05, y - r * 0.18);
  ctx.lineTo(x + r * 0.05, y - r * 0.5);
  ctx.lineTo(x + r * 0.62, y);
  ctx.lineTo(x + r * 0.05, y + r * 0.5);
  ctx.lineTo(x + r * 0.05, y + r * 0.18);
  ctx.lineTo(x - r * 0.55, y + r * 0.18);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** A round green badge with a letter A for a settler that works on its own. */
function drawAutoBadge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const r = 2.9 * s;
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = "#2f8f4e";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#f3efe6";
  ctx.stroke();
  ctx.fillStyle = "#f3efe6";
  ctx.font = `700 ${(r * 1.3).toFixed(2)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("A", x, y + r * 0.08);
  ctx.restore();
}

/** A small shield badge that marks a fortified unit at a glance. */
function drawFortifiedBadge(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const w = 5 * s;
  const h = 6 * s;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y - h / 2);
  ctx.lineTo(x + w / 2, y + h * 0.05);
  ctx.quadraticCurveTo(x + w / 2, y + h * 0.4, x, y + h / 2);
  ctx.quadraticCurveTo(x - w / 2, y + h * 0.4, x - w / 2, y + h * 0.05);
  ctx.closePath();
  ctx.fillStyle = "#2f3b4a";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#f3efe6";
  ctx.stroke();
  // A white tower with battlements on the shield.
  ctx.fillStyle = "#f3efe6";
  const tw = w * 0.46;
  const th = h * 0.38;
  const top = y - th / 2 + 0.3 * s;
  ctx.fillRect(x - tw / 2, top, tw, th);
  const m = tw / 5;
  for (const k of [0, 2, 4]) ctx.fillRect(x - tw / 2 + k * m, top - 0.9 * s, m, 0.9 * s);
  ctx.fillStyle = "#2f3b4a";
  ctx.fillRect(x - m / 2, top + th - 1.2 * s, m, 1.2 * s);
  ctx.restore();
}

/** Warrior in a tunic of the player's colour, with a club and a wooden shield. Origin at the feet. */
/** Units drawn on a wide base: wagons, riders and machines. */

function drawUnitFigure(ctx: CanvasRenderingContext2D, u: DrawUnit, color: string): void {
  drawUnitArt(ctx, u.type, color, u.working);
}
