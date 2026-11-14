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

export interface DrawInput {
  width: number;
  height: number;
  /** null = not explored by the viewer */
  terrain: (TerrainId | null)[];
  starts: { point: Point; playerId: number }[];
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

  for (const s of input.starts) drawStart(ctx, s.point, s.playerId);
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
