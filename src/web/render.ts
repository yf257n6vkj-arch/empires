/**
 * Draws a PlayerView (or the full map) onto a canvas. Graphics are drawn
 * with code only: coloured tiles and simple symbols.
 */
import type { Point, TerrainId } from "../core";

export const TILE = 24;

export const TERRAIN_COLORS: Record<TerrainId, string> = {
  ocean: "#2f5f8a",
  grassland: "#6fa84a",
  plains: "#b8b05a",
  forest: "#3f7a3a",
  hills: "#9a8a55",
  mountains: "#8b8580",
  desert: "#d8c58a",
};

export const PLAYER_COLORS = ["#f2f2f2", "#e0533d", "#4aa3df", "#e3b23c"];

const UNKNOWN = "#121417";

export interface DrawUnit {
  id: number;
  owner: number;
  type: "settlers" | "warriors";
  x: number;
  y: number;
  fortified: boolean;
  working: boolean;
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

export function setupCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = width * TILE * ratio;
  canvas.height = height * TILE * ratio;
  canvas.style.width = `${width * TILE}px`;
  canvas.style.height = `${height * TILE}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is not available");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return ctx;
}

export function draw(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  ctx.clearRect(0, 0, width * TILE, height * TILE);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = terrain[y * width + x] ?? null;
      const px = x * TILE;
      const py = y * TILE;
      ctx.fillStyle = t ? TERRAIN_COLORS[t] : UNKNOWN;
      ctx.fillRect(px, py, TILE, TILE);
      if (t) drawSymbol(ctx, t, px, py, x, y);
    }
  }

  drawCoast(ctx, input);
  drawImprovements(ctx, input);

  // Faint grid so single tiles can be counted.
  ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < width; x++) {
    ctx.moveTo(x * TILE + 0.5, 0);
    ctx.lineTo(x * TILE + 0.5, height * TILE);
  }
  for (let y = 1; y < height; y++) {
    ctx.moveTo(0, y * TILE + 0.5);
    ctx.lineTo(width * TILE, y * TILE + 0.5);
  }
  ctx.stroke();

  if (input.territory) drawTerritory(ctx, input);

  for (const i of input.highlight ?? []) {
    const x = (i % width) * TILE;
    const y = Math.floor(i / width) * TILE;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, TILE - 4, TILE - 4);
  }

  if (input.path && input.path.length > 0) drawPath(ctx, input);
  if (input.target) drawTarget(ctx, input.target, width, height);
  for (const s of input.starts) drawStart(ctx, s.point, s.playerId);
  for (const c of input.cities) drawCity(ctx, c, c.id === input.selectedCityId);
  drawUnits(ctx, input);
  for (const c of input.cities) drawCityLabel(ctx, c, width);
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
        ctx.strokeStyle = "rgba(60, 140, 220, 0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (const off of [6, 12, 18]) {
          ctx.moveTo(px + 3, py + off);
          ctx.lineTo(px + TILE - 3, py + off);
        }
        ctx.stroke();
      }
      if (input.mine[i]) {
        ctx.fillStyle = "#2b2b2b";
        ctx.beginPath();
        ctx.moveTo(px + 12, py + 13);
        ctx.lineTo(px + 18, py + 21);
        ctx.lineTo(px + 6, py + 21);
        ctx.closePath();
        ctx.fill();
      }
      if (input.road[i] && !cityTiles.has(i)) {
        ctx.strokeStyle = "#7a5530";
        ctx.lineWidth = 2;
        ctx.beginPath();
        let connected = false;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if ((dx || dy) && roadAt(x + dx, y + dy)) {
              ctx.moveTo(px + TILE / 2, py + TILE / 2);
              ctx.lineTo(px + TILE / 2 + (dx * TILE) / 2, py + TILE / 2 + (dy * TILE) / 2);
              connected = true;
            }
          }
        }
        ctx.stroke();
        if (!connected) {
          ctx.fillStyle = "#7a5530";
          ctx.fillRect(px + TILE / 2 - 2, py + TILE / 2 - 2, 4, 4);
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
    const color = PLAYER_COLORS[owner % PLAYER_COLORS.length] ?? "#fff";
    ctx.fillStyle = hexToRgba(color, 0.08);
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
    // A dark line under the coloured one keeps the border readable on any terrain.
    ctx.strokeStyle = "rgba(10, 10, 10, 0.6)";
    ctx.lineWidth = 3.5;
    ctx.stroke(edges);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 3]);
    ctx.stroke(edges);
    ctx.setLineDash([]);
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function drawPath(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const unit = input.units.find((u) => u.id === input.selectedUnitId);
  if (!unit || !input.path) return;
  const center = (p: Point) => [p.x * TILE + TILE / 2, p.y * TILE + TILE / 2] as const;
  ctx.strokeStyle = "rgba(255, 230, 120, 0.95)";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(...center(unit));
  for (const p of input.path) ctx.lineTo(...center(p));
  ctx.stroke();
  ctx.setLineDash([]);

  // A dot where the unit stops at the end of each turn on the way.
  const turns = input.pathTurns ?? [];
  input.path.forEach((p, i) => {
    const turn = turns[i];
    const next = turns[i + 1];
    if (turn === undefined || next === undefined || next === turn) return;
    const [cx, cy] = center(p);
    ctx.fillStyle = "#ffe678";
    ctx.strokeStyle = "rgba(20, 20, 20, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
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
  ctx.fillStyle = reachable ? "rgba(255, 216, 74, 0.28)" : "rgba(220, 70, 60, 0.25)";
  ctx.fillRect(px, py, TILE, TILE);
  ctx.strokeStyle = reachable ? "#ffd84a" : "#e0533d";
  ctx.lineWidth = 2;
  ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);

  const label = reachable ? String(target.turns) : "×";
  ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
  const w = Math.max(16, ctx.measureText(label).width + 8);
  // Badge at the top right corner of the tile, kept inside the map.
  const bx = Math.min(px + TILE - 2, width * TILE - w / 2 - 1);
  const by = Math.max(py, 9);
  void height;
  ctx.fillStyle = reachable ? "#ffd84a" : "#e0533d";
  ctx.beginPath();
  ctx.roundRect(bx - w / 2, by - 8, w, 16, 8);
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, bx, by + 0.5);
}

function drawCity(ctx: CanvasRenderingContext2D, c: DrawCity, selected: boolean): void {
  const px = c.x * TILE;
  const py = c.y * TILE;
  ctx.fillStyle = PLAYER_COLORS[c.owner % PLAYER_COLORS.length] ?? "#fff";
  ctx.strokeStyle = selected ? "#ffd84a" : "#111";
  ctx.lineWidth = selected ? 3 : 2;
  ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
  ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
  // Simple wall battlements on top.
  ctx.fillStyle = "#111";
  for (const bx of [4, 10, 16]) ctx.fillRect(px + bx, py + 2, 4, 3);
  ctx.font = "bold 12px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(c.size), px + TILE / 2, py + TILE / 2 + 2);
}

function drawCityLabel(ctx: CanvasRenderingContext2D, c: DrawCity, width: number): void {
  ctx.font = "600 11px ui-sans-serif, system-ui, sans-serif";
  const text = c.name;
  const w = ctx.measureText(text).width + 8;
  let x = c.x * TILE + TILE / 2 - w / 2;
  x = Math.max(1, Math.min(x, width * TILE - w - 1));
  const y = c.y * TILE + TILE + 1;
  ctx.fillStyle = "rgba(15, 17, 20, 0.8)";
  ctx.fillRect(x, y, w, 14);
  ctx.fillStyle = "#f1eee8";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + 4, y + 7.5);
}

const UNIT_LETTER: Record<DrawUnit["type"], string> = { settlers: "O", warriors: "V" };

function drawUnits(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const byTile = new Map<number, DrawUnit[]>();
  for (const u of input.units) {
    const key = u.y * input.width + u.x;
    byTile.set(key, [...(byTile.get(key) ?? []), u]);
  }
  for (const [, units] of byTile) {
    // Show the selected unit on top of its stack, otherwise the first one.
    const top = units.find((u) => u.id === input.selectedUnitId) ?? units[0]!;
    const inCity = input.cities.some((c) => c.x === top.x && c.y === top.y);
    const size = inCity ? 13 : 17;
    const px = top.x * TILE + (inCity ? TILE - size - 1 : (TILE - size) / 2);
    const py = top.y * TILE + (inCity ? TILE - size - 1 : (TILE - size) / 2);
    const selected = top.id === input.selectedUnitId;

    ctx.fillStyle = PLAYER_COLORS[top.owner % PLAYER_COLORS.length] ?? "#fff";
    ctx.globalAlpha = top.hasMoves || selected ? 1 : 0.75;
    ctx.beginPath();
    ctx.roundRect(px, py, size, size, 3);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = selected ? "#ffd84a" : "#111";
    ctx.lineWidth = selected ? 2.5 : 1.5;
    ctx.stroke();

    ctx.fillStyle = "#111";
    ctx.font = `bold ${inCity ? 9 : 11}px ui-sans-serif, system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(UNIT_LETTER[top.type], px + size / 2, py + size / 2 + 0.5);

    if (top.fortified) {
      ctx.strokeStyle = "#111";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - 2, py - 2, size + 4, size + 4);
    }
    if (top.working) {
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(px + 2, py + size - 3, size - 4, 2);
    }
    if (units.length > 1) {
      ctx.fillStyle = "#111";
      ctx.beginPath();
      ctx.arc(px + size, py, 5.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 8px ui-sans-serif, system-ui, sans-serif";
      ctx.fillText(String(units.length), px + size, py + 0.5);
    }
  }
}

/** Small deterministic jitter so symbols do not look stamped. */
function jitter(x: number, y: number, k: number): number {
  const h = Math.sin(x * 12.9898 + y * 78.233 + k * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

function drawSymbol(ctx: CanvasRenderingContext2D, t: TerrainId, px: number, py: number, x: number, y: number): void {
  const c = TILE / 2;
  switch (t) {
    case "ocean": {
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      const oy = py + 8 + jitter(x, y, 1) * 8;
      const ox = px + 4 + jitter(x, y, 2) * 6;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.quadraticCurveTo(ox + 3, oy - 3, ox + 6, oy);
      ctx.quadraticCurveTo(ox + 9, oy + 3, ox + 12, oy);
      ctx.stroke();
      break;
    }
    case "forest": {
      ctx.fillStyle = "#24502a";
      for (const [dx, dy] of [[-5, 2], [4, -1], [0, 6]] as const) {
        const tx = px + c + dx + (jitter(x, y, dx) - 0.5) * 2;
        const ty = py + c + dy - 2;
        ctx.beginPath();
        ctx.moveTo(tx, ty - 6);
        ctx.lineTo(tx + 4, ty + 3);
        ctx.lineTo(tx - 4, ty + 3);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "hills": {
      ctx.strokeStyle = "#6e6239";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(px + 8, py + 16, 5, Math.PI, 0);
      ctx.moveTo(px + 21, py + 13);
      ctx.arc(px + 16, py + 13, 5, 0, Math.PI, true);
      ctx.stroke();
      break;
    }
    case "mountains": {
      ctx.fillStyle = "#5f5a56";
      ctx.beginPath();
      ctx.moveTo(px + 3, py + 20);
      ctx.lineTo(px + 10, py + 6);
      ctx.lineTo(px + 14, py + 12);
      ctx.lineTo(px + 17, py + 8);
      ctx.lineTo(px + 22, py + 20);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#e9e6e0";
      ctx.beginPath();
      ctx.moveTo(px + 10, py + 6);
      ctx.lineTo(px + 12.2, py + 10.4);
      ctx.lineTo(px + 7.8, py + 10.4);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "desert": {
      ctx.fillStyle = "rgba(150, 120, 60, 0.45)";
      for (let k = 0; k < 4; k++) {
        ctx.fillRect(px + 3 + jitter(x, y, k) * 17, py + 3 + jitter(x, y, k + 9) * 17, 2, 2);
      }
      break;
    }
    case "plains": {
      ctx.strokeStyle = "rgba(110, 100, 40, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let k = 0; k < 3; k++) {
        const sx = px + 5 + k * 6;
        const sy = py + 15 + jitter(x, y, k) * 3;
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + 2, sy - 5);
      }
      ctx.stroke();
      break;
    }
    case "grassland":
      break;
  }
}

/** Darker edge where land meets sea, so the coastline reads clearly. */
function drawCoast(ctx: CanvasRenderingContext2D, input: DrawInput): void {
  const { width, height, terrain } = input;
  ctx.strokeStyle = "rgba(20, 35, 50, 0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  const at = (x: number, y: number) => (x < 0 || y < 0 || x >= width || y >= height ? null : terrain[y * width + x] ?? null);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t = at(x, y);
      if (!t || t === "ocean") continue;
      const px = x * TILE;
      const py = y * TILE;
      if (at(x, y - 1) === "ocean") { ctx.moveTo(px, py + 1); ctx.lineTo(px + TILE, py + 1); }
      if (at(x, y + 1) === "ocean") { ctx.moveTo(px, py + TILE - 1); ctx.lineTo(px + TILE, py + TILE - 1); }
      if (at(x - 1, y) === "ocean") { ctx.moveTo(px + 1, py); ctx.lineTo(px + 1, py + TILE); }
      if (at(x + 1, y) === "ocean") { ctx.moveTo(px + TILE - 1, py); ctx.lineTo(px + TILE - 1, py + TILE); }
    }
  }
  ctx.stroke();
}

function drawStart(ctx: CanvasRenderingContext2D, p: Point, playerId: number): void {
  const cx = p.x * TILE + TILE / 2;
  const cy = p.y * TILE + TILE / 2;
  ctx.fillStyle = PLAYER_COLORS[playerId % PLAYER_COLORS.length] ?? "#fff";
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "bold 11px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(playerId + 1), cx, cy + 0.5);
}
