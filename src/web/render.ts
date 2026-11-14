/**
 * Draws a PlayerView (or the full map) onto a canvas. All graphics are drawn
 * with code: no images. Everything is drawn in "design units" where one tile
 * is 24 units wide; the canvas transform scales that to the real tile size.
 *
 * The map background (terrain, coast, improvements, borders, fog edge) changes
 * rarely, so it is drawn into an offscreen canvas and reused while the mouse
 * moves; only units, cities and overlays are drawn every frame.
 */
import type { Point, TerrainId } from "../core";

/** Tile size in design units. */
export const TILE = 24;

export const TERRAIN_COLORS: Record<TerrainId, string> = {
  ocean: "#2b5f86",
  grassland: "#7ba75c",
  plains: "#c2b16b",
  forest: "#5f8c4a",
  hills: "#a5945f",
  mountains: "#958e80",
  desert: "#ddc994",
};

export const PLAYER_COLORS = ["#f4f1ea", "#d9483b", "#3f8fd6", "#e2ac2f"];

const UNKNOWN = "#101215";
const INK = "#1c1a17";

export interface DrawUnit {
  id: number;
  owner: number;
  type: "settlers" | "warriors";
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
}

export interface DrawInput {
  width: number;
  height: number;
  /** null = not explored by the viewer */
  terrain: (TerrainId | null)[];
  road: number[];
  irrigation: number[];
  mine: number[];
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
}

// ---------- canvas setup ----------

let tilePixels = TILE;
let pixelRatio = 1;
let background: HTMLCanvasElement | null = null;
let backgroundKey = "";

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

function applyScale(ctx: CanvasRenderingContext2D): void {
  const s = (pixelRatio * tilePixels) / TILE;
  ctx.setTransform(s, 0, 0, s, 0, 0);
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

function playerColor(owner: number): string {
  return PLAYER_COLORS[owner % PLAYER_COLORS.length] ?? "#ffffff";
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
  for (const arr of [input.road, input.irrigation, input.mine]) for (const v of arr) mix(v);
  for (const c of input.cities) mix(c.x * 1000 + c.y);
  for (const [owner, tiles] of input.territory ?? []) {
    mix(owner + 7);
    for (const i of tiles) mix(i);
  }
  return `${h >>> 0}:${input.width}x${input.height}:${tilePixels}:${pixelRatio}`;
}

// ---------- main entry ----------

export function draw(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height } = input;
  const key = inputKey(input);
  if (!background || key !== backgroundKey) {
    background ??= document.createElement("canvas");
    background.width = ctx.canvas.width;
    background.height = ctx.canvas.height;
    const bg = background.getContext("2d")!;
    applyScale(bg);
    drawBackground(bg, input);
    backgroundKey = key;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.drawImage(background, 0, 0);
  ctx.restore();

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

// ---------- background ----------

function drawBackground(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  ctx.fillStyle = UNKNOWN;
  ctx.fillRect(0, 0, width * TILE, height * TILE);

  const depth = seaDepth(input);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = terrain[y * width + x] ?? null;
      if (t) drawTerrainBase(ctx, t, x, y, depth[y * width + x] ?? 0);
    }
  }
  drawCoast(ctx, input);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = terrain[y * width + x] ?? null;
      if (t) drawTerrainDetail(ctx, t, x, y);
    }
  }
  drawImprovements(ctx, input);
  if (input.territory) drawTerritory(ctx, input);
  drawFogEdge(ctx, input);
}

/** Distance of every known sea tile from the nearest known land, for darker deep water. */
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
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
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

function drawTerrainBase(ctx: CanvasRenderingContext2D, t: TerrainId, x: number, y: number, depth: number): void {
  const px = x * TILE;
  const py = y * TILE;
  if (t === "ocean") {
    const d = Math.min(depth, 4);
    const base = ["#4b93b8", "#3c7fa8", "#326f99", "#2b628b", "#265780"][d] ?? "#265780";
    ctx.fillStyle = shade(base, 0.97 + hash(x, y, 1) * 0.06);
    ctx.fillRect(px, py, TILE, TILE);
    return;
  }
  // Slight brightness variation per tile so large areas do not look flat.
  ctx.fillStyle = shade(TERRAIN_COLORS[t], 0.94 + hash(x, y, 2) * 0.1);
  ctx.fillRect(px, py, TILE, TILE);
  const glow = ctx.createLinearGradient(px, py, px + TILE, py + TILE);
  glow.addColorStop(0, "rgba(255, 255, 240, 0.07)");
  glow.addColorStop(1, "rgba(0, 0, 0, 0.06)");
  ctx.fillStyle = glow;
  ctx.fillRect(px, py, TILE, TILE);
}

function drawTerrainDetail(ctx: CanvasRenderingContext2D, t: TerrainId, x: number, y: number): void {
  const px = x * TILE;
  const py = y * TILE;
  const r = (k: number) => hash(x, y, k);
  switch (t) {
    case "ocean": {
      ctx.strokeStyle = "rgba(255, 255, 255, 0.16)";
      ctx.lineWidth = 0.8;
      ctx.lineCap = "round";
      for (let k = 0; k < 2; k++) {
        const wx = px + 3 + r(k + 3) * 12;
        const wy = py + 6 + k * 9 + r(k + 5) * 4;
        ctx.beginPath();
        ctx.moveTo(wx, wy);
        ctx.quadraticCurveTo(wx + 2.5, wy - 2, wx + 5, wy);
        ctx.quadraticCurveTo(wx + 7.5, wy + 2, wx + 10, wy);
        ctx.stroke();
      }
      break;
    }
    case "grassland": {
      ctx.strokeStyle = "rgba(52, 96, 40, 0.3)";
      ctx.lineWidth = 0.7;
      ctx.lineCap = "round";
      for (let k = 0; k < 3; k++) {
        const gx = px + 3 + r(k) * 17;
        const gy = py + 5 + r(k + 9) * 15;
        ctx.beginPath();
        ctx.moveTo(gx - 1, gy - 1.8);
        ctx.lineTo(gx, gy);
        ctx.lineTo(gx + 1, gy - 1.8);
        ctx.stroke();
      }
      break;
    }
    case "plains": {
      ctx.strokeStyle = "rgba(140, 112, 42, 0.55)";
      ctx.lineWidth = 0.9;
      ctx.lineCap = "round";
      for (let row = 0; row < 3; row++) {
        const sy = py + 7 + row * 6 + r(row) * 1.5;
        for (let k = 0; k < 4; k++) {
          const sx = px + 3 + k * 5 + r(row * 4 + k) * 2;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx + 1.2, sy - 3.5);
          ctx.stroke();
        }
      }
      break;
    }
    case "forest": {
      const trees: [number, number, number][] = [
        [6, 9, 0.9], [15, 7, 1], [10, 15, 1.05], [19, 15, 0.95], [5, 19, 0.85],
      ];
      for (const [tx, ty, s] of trees) {
        const ox = px + tx + (r(tx) - 0.5) * 2;
        const oy = py + ty + (r(ty) - 0.5) * 2;
        if (r(tx + ty) > 0.5) drawConifer(ctx, ox, oy, s);
        else drawLeafTree(ctx, ox, oy, s);
      }
      break;
    }
    case "hills": {
      drawHill(ctx, px + 7.5, py + 17, 7, 6);
      drawHill(ctx, px + 16.5, py + 13, 7.5, 7);
      break;
    }
    case "mountains": {
      drawPeak(ctx, px + 15, py + 21, 8, 15);
      drawPeak(ctx, px + 8, py + 22, 6.5, 11);
      break;
    }
    case "desert": {
      ctx.strokeStyle = "rgba(170, 135, 70, 0.55)";
      ctx.lineWidth = 1;
      ctx.lineCap = "round";
      for (let k = 0; k < 2; k++) {
        const dx = px + 3 + r(k) * 6;
        const dy = py + 9 + k * 8;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.quadraticCurveTo(dx + 6, dy - 4, dx + 13, dy);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(160, 125, 65, 0.45)";
      for (let k = 0; k < 3; k++) ctx.fillRect(px + 3 + r(k + 7) * 17, py + 3 + r(k + 11) * 17, 1.2, 1.2);
      break;
    }
  }
}

function drawConifer(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + 0.8, y + 4.2 * s, 3 * s, 1.1 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5b3a22";
  ctx.fillRect(x - 0.6 * s, y + 1.5 * s, 1.2 * s, 2.6 * s);
  for (const [dy, w] of [[1.5, 3.6], [-1.2, 2.9], [-3.8, 2.1]] as const) {
    ctx.fillStyle = "#2c5a33";
    ctx.beginPath();
    ctx.moveTo(x, y + (dy - 3.4) * s);
    ctx.lineTo(x + w * s, y + dy * s);
    ctx.lineTo(x - w * s, y + dy * s);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#3e7543";
    ctx.beginPath();
    ctx.moveTo(x, y + (dy - 3.4) * s);
    ctx.lineTo(x - w * s, y + dy * s);
    ctx.lineTo(x - 0.3 * s, y + dy * s);
    ctx.closePath();
    ctx.fill();
  }
}

function drawLeafTree(ctx: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.beginPath();
  ctx.ellipse(x + 0.8, y + 4.2 * s, 3.2 * s, 1.1 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5b3a22";
  ctx.fillRect(x - 0.6 * s, y + 0.5 * s, 1.2 * s, 3.5 * s);
  ctx.fillStyle = "#33683a";
  ctx.beginPath();
  ctx.arc(x, y - 1 * s, 3.6 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4b8a48";
  ctx.beginPath();
  ctx.arc(x - 1 * s, y - 2 * s, 2.2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawHill(ctx: CanvasRenderingContext2D, cx: number, by: number, rx: number, h: number): void {
  const g = ctx.createLinearGradient(cx - rx, by - h, cx + rx, by);
  g.addColorStop(0, "#c2b17a");
  g.addColorStop(1, "#7f6f43");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - rx, by);
  ctx.quadraticCurveTo(cx - rx * 0.4, by - h * 1.3, cx, by - h);
  ctx.quadraticCurveTo(cx + rx * 0.5, by - h * 0.8, cx + rx, by);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(70, 58, 30, 0.5)";
  ctx.lineWidth = 0.8;
  ctx.stroke();
}

function drawPeak(ctx: CanvasRenderingContext2D, cx: number, by: number, half: number, h: number): void {
  const top = by - h;
  ctx.fillStyle = "#c7c0b2";
  ctx.beginPath();
  ctx.moveTo(cx - half, by);
  ctx.lineTo(cx, top);
  ctx.lineTo(cx + 0.5, by);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#6d675d";
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx + half, by);
  ctx.lineTo(cx + 0.5, by);
  ctx.closePath();
  ctx.fill();
  // Snow cap.
  ctx.fillStyle = "#f7f5ef";
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx + half * 0.32, top + h * 0.32);
  ctx.lineTo(cx + half * 0.08, top + h * 0.26);
  ctx.lineTo(cx - half * 0.12, top + h * 0.36);
  ctx.lineTo(cx - half * 0.32, top + h * 0.32);
  ctx.closePath();
  ctx.fill();
}

/** Sandy shore on land tiles that touch the sea, and a line of surf on the water. */
function drawCoast(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  const at = (x: number, y: number) =>
    x < 0 || y < 0 || x >= width || y >= height ? null : terrain[y * width + x] ?? null;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = at(x, y);
      if (!t || t === "ocean") continue;
      const px = x * TILE;
      const py = y * TILE;
      const sides: [boolean, number, number, number, number][] = [
        [at(x, y - 1) === "ocean", px, py, TILE, 3],
        [at(x, y + 1) === "ocean", px, py + TILE - 3, TILE, 3],
        [at(x - 1, y) === "ocean", px, py, 3, TILE],
        [at(x + 1, y) === "ocean", px + TILE - 3, py, 3, TILE],
      ];
      for (const [isSea, sx, sy, sw, sh] of sides) {
        if (!isSea) continue;
        ctx.fillStyle = "rgba(232, 214, 160, 0.9)";
        ctx.fillRect(sx, sy, sw, sh);
      }
      ctx.strokeStyle = "rgba(240, 250, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (sides[0]![0]) { ctx.moveTo(px, py - 1); ctx.lineTo(px + TILE, py - 1); }
      if (sides[1]![0]) { ctx.moveTo(px, py + TILE + 1); ctx.lineTo(px + TILE, py + TILE + 1); }
      if (sides[2]![0]) { ctx.moveTo(px - 1, py); ctx.lineTo(px - 1, py + TILE); }
      if (sides[3]![0]) { ctx.moveTo(px + TILE + 1, py); ctx.lineTo(px + TILE + 1, py + TILE); }
      ctx.stroke();
    }
  }
}

function drawImprovements(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height } = input;
  const cityTiles = new Set(input.cities.map((c) => c.y * width + c.x));
  const roadAt = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < width && y < height && (input.road[y * width + x] === 1 || cityTiles.has(y * width + x));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
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
    for (const i of tiles) ctx.fillRect((i % width) * TILE, Math.floor(i / width) * TILE, TILE, TILE);

    const edges = new Path2D();
    for (const i of tiles) {
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
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
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
  const layout = cityLayout(c.size);
  const rx = c.size >= 6 ? 15 : c.size >= 3 ? 14 : 11;
  const ry = c.size >= 6 ? 7 : 6;
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
  ctx.font = "600 8.5px ui-sans-serif, system-ui, sans-serif";
  const nameW = ctx.measureText(c.name).width;
  const w = nameW + 18;
  let x = c.x * TILE + TILE / 2 - w / 2;
  x = Math.max(1, Math.min(x, width * TILE - w - 1));
  const y = c.y * TILE + TILE + 0.5;
  ctx.fillStyle = "rgba(18, 18, 20, 0.85)";
  ctx.beginPath();
  ctx.roundRect(x, y, w, 11, 5.5);
  ctx.fill();
  const color = playerColor(c.owner);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + 5.5, y + 5.5, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = contrastInk(color);
  ctx.font = "700 7px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(c.size), x + 5.5, y + 5.8);
  ctx.fillStyle = "#f3efe6";
  ctx.font = "600 8.5px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(c.name, x + 12.5, y + 6);
}

// ---------- units ----------

const SKIN = "#d9a77c";
const HAIR = "#3b2a1d";
const WOOD = "#7a5230";
const WOOD_DARK = "#4f3420";

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
  const wide = u.type === "settlers";
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
  if (u.type === "warriors") drawWarriorFigure(ctx, color);
  else drawSettlerFigure(ctx, color, u.working);
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
function drawWarriorFigure(ctx: CanvasRenderingContext2D, color: string): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const outline = "rgba(25, 20, 15, 0.85)";

  // Legs and sandals.
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(-1.3, -6);
  ctx.lineTo(-1.8, -0.6);
  ctx.moveTo(1.3, -6);
  ctx.lineTo(1.9, -0.6);
  ctx.stroke();
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(-2.9, -1, 2, 1);
  ctx.fillRect(1, -1, 2, 1);

  // Right arm raising the club (behind the body).
  ctx.strokeStyle = outline;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2.2, -12);
  ctx.lineTo(4.4, -14.2);
  ctx.stroke();
  ctx.strokeStyle = SKIN;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  // Club.
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(3.6, -13.2);
  ctx.lineTo(6.2, -19.4);
  ctx.stroke();
  ctx.fillStyle = WOOD;
  ctx.beginPath();
  ctx.ellipse(6.4, -19.8, 1.5, 2.1, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Tunic.
  const tunic = ctx.createLinearGradient(-3.5, 0, 3.5, 0);
  tunic.addColorStop(0, shade(color, 1.05));
  tunic.addColorStop(1, shade(color, 0.72));
  ctx.fillStyle = tunic;
  ctx.beginPath();
  ctx.moveTo(-2.8, -13);
  ctx.lineTo(2.8, -13);
  ctx.lineTo(3.8, -5.2);
  ctx.lineTo(-3.8, -5.2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.55;
  ctx.stroke();
  // Belt.
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(-3.2, -8.6);
  ctx.lineTo(3.2, -8.6);
  ctx.stroke();

  // Head with hair and a headband.
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0, -15.4, 2.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = HAIR;
  ctx.beginPath();
  ctx.arc(0, -15.6, 2.35, Math.PI * 1.05, Math.PI * 1.95);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = shade(color, 0.85);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-2.2, -16.1);
  ctx.lineTo(2.2, -16.1);
  ctx.stroke();
  ctx.fillStyle = "#2a1d14";
  ctx.fillRect(-1.1, -15.3, 0.5, 0.5);
  ctx.fillRect(0.6, -15.3, 0.5, 0.5);

  // Round wooden shield held in front, rimmed with the player's colour.
  const shield = ctx.createRadialGradient(-4.4, -10.2, 0.5, -3.8, -9.4, 3.6);
  shield.addColorStop(0, "#a8743f");
  shield.addColorStop(1, "#6b4526");
  ctx.fillStyle = shield;
  ctx.beginPath();
  ctx.arc(-3.8, -9.4, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.9;
  ctx.stroke();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(-3.8, -9.4, 3.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#c9c3b4";
  ctx.beginPath();
  ctx.arc(-3.8, -9.4, 0.9, 0, Math.PI * 2);
  ctx.fill();
}

/** Settlers: a covered wagon pulled by an ox, with a pennant in the player's colour. Origin at the base centre. */
function drawSettlerFigure(ctx: CanvasRenderingContext2D, color: string, working: boolean): void {
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const outline = "rgba(25, 20, 15, 0.85)";

  // Ox legs, body, head and horns (facing left).
  ctx.strokeStyle = "#4a3020";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (const lx of [-10, -8.6, -5.6, -4.2]) {
    ctx.moveTo(lx, -3.5);
    ctx.lineTo(lx + (lx < -7 ? -0.3 : 0.3), -0.4);
  }
  ctx.stroke();
  ctx.fillStyle = "#86593a";
  ctx.beginPath();
  ctx.ellipse(-7, -5, 4.1, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.45;
  ctx.stroke();
  ctx.fillStyle = "#a57656";
  ctx.beginPath();
  ctx.ellipse(-7.5, -5.8, 2.6, 1.1, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a5034";
  ctx.beginPath();
  ctx.ellipse(-11.4, -5.6, 1.7, 1.3, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.stroke();
  ctx.strokeStyle = "#efe6cf";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-11.2, -6.7);
  ctx.quadraticCurveTo(-11.8, -8.2, -10.6, -8.4);
  ctx.moveTo(-11.6, -6.6);
  ctx.quadraticCurveTo(-13, -7.6, -12.8, -8.6);
  ctx.stroke();

  // Shaft from the yoke to the wagon.
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(-4, -4.2);
  ctx.lineTo(-0.5, -3.6);
  ctx.stroke();

  // Wagon bed.
  ctx.fillStyle = WOOD;
  ctx.fillRect(-0.8, -5.6, 10, 3);
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 0.45;
  ctx.strokeRect(-0.8, -5.6, 10, 3);
  ctx.beginPath();
  ctx.moveTo(-0.8, -4.1);
  ctx.lineTo(9.2, -4.1);
  ctx.stroke();

  // Canvas cover with ribs.
  const cover = ctx.createLinearGradient(0, -13, 0, -5.6);
  cover.addColorStop(0, "#fbf4e2");
  cover.addColorStop(1, "#d9ccad");
  ctx.fillStyle = cover;
  ctx.beginPath();
  ctx.moveTo(-0.3, -5.6);
  ctx.bezierCurveTo(-0.6, -14.2, 9, -14.2, 8.7, -5.6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.strokeStyle = "rgba(120, 100, 70, 0.55)";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (const rx of [2.4, 4.2, 6]) {
    ctx.moveTo(rx, -5.6);
    ctx.lineTo(rx, -11.7);
  }
  ctx.stroke();

  // Spoked wheels.
  for (const wx of [1.6, 7]) {
    ctx.fillStyle = WOOD_DARK;
    ctx.beginPath();
    ctx.arc(wx, -1.9, 2.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#a07a4a";
    ctx.beginPath();
    ctx.arc(wx, -1.9, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 4;
      ctx.moveTo(wx - Math.cos(a) * 1.6, -1.9 - Math.sin(a) * 1.6);
      ctx.lineTo(wx + Math.cos(a) * 1.6, -1.9 + Math.sin(a) * 1.6);
    }
    ctx.stroke();
  }

  // Pennant in the player's colour on a pole at the back.
  ctx.strokeStyle = WOOD_DARK;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(8.6, -6);
  ctx.lineTo(8.6, -16.5);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(8.6, -16.5);
  ctx.lineTo(13, -15.2);
  ctx.lineTo(8.6, -13.8);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.4;
  ctx.stroke();

  if (working) {
    // A shovel stuck in the ground next to the wagon.
    ctx.strokeStyle = WOOD_DARK;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-2.4, -1);
    ctx.lineTo(-3.6, -8);
    ctx.stroke();
    ctx.fillStyle = "#9aa0a6";
    ctx.beginPath();
    ctx.moveTo(-2.9, -1.4);
    ctx.lineTo(-1.5, -1.6);
    ctx.lineTo(-1.8, 0.4);
    ctx.lineTo(-2.6, 0.6);
    ctx.closePath();
    ctx.fill();
  }
}
