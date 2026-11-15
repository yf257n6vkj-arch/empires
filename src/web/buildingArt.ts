/**
 * Painted buildings for the city view and the encyclopedia. Every building is
 * drawn around (0, 0) = middle of its front edge on the ground, in design
 * units, with the light coming from the upper left. Depth goes up and to the
 * right, like a three-quarter view.
 */
import type { BuildingId } from "../core";

// ---------- colour helpers ----------

function rgb(hex: string): [number, number, number] {
  const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(hex);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function tone(hex: string, k: number, alpha = 1): string {
  const [r, g, b] = rgb(hex).map((c) => Math.max(0, Math.min(255, Math.round(k >= 1 ? c + (255 - c) * (k - 1) : c * k))));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Ctx = CanvasRenderingContext2D;

const STONE = "#d9ccb0";
const LIMESTONE = "#e8e0cc";
const BRICK = "#a65a3e";
const ROOF_RED = "#b24a30";
const ROOF_SLATE = "#5d6772";
const ROOF_COPPER = "#5f9c88";
const GOLD = "#e8c25a";
const WINDOW = "#2c3440";
const OUTLINE = "rgba(35, 28, 22, 0.55)";

/** Depth direction of the three-quarter view. */
const DX = 0.62;
const DY = -0.42;

function poly(ctx: Ctx, pts: number[], fill: string, stroke = true): void {
  ctx.beginPath();
  ctx.moveTo(pts[0]!, pts[1]!);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i]!, pts[i + 1]!);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

/** A block: front face from x to x+w, bottom at y, height h, depth d. */
function block(ctx: Ctx, x: number, y: number, w: number, h: number, d: number, color: string): void {
  const dx = d * DX;
  const dy = d * DY;
  poly(ctx, [x + w, y, x + w + dx, y + dy, x + w + dx, y + dy - h, x + w, y - h], tone(color, 0.72));
  poly(ctx, [x, y - h, x + w, y - h, x + w + dx, y + dy - h, x + dx, y + dy - h], tone(color, 1.12));
  const g = ctx.createLinearGradient(x, y - h, x + w, y);
  g.addColorStop(0, tone(color, 1.06));
  g.addColorStop(1, tone(color, 0.92));
  poly(ctx, [x, y, x + w, y, x + w, y - h, x, y - h], g as unknown as string);
}

/** Roof with the ridge parallel to the front. Sits on a block with the same x, w, d whose top is at y. */
function gableRoof(ctx: Ctx, x: number, y: number, w: number, d: number, rise: number, color: string, wall: string): void {
  const dx = d * DX;
  const dy = d * DY;
  const o = 1.2;
  const rx = dx / 2;
  const ry = dy / 2 - rise;
  poly(ctx, [x + w, y, x + w + dx, y + dy, x + w + rx, y + ry], tone(wall, 0.7));
  poly(ctx, [x + rx - o, y + ry, x + w + rx + o, y + ry, x + w + dx + o, y + dy, x + dx - o, y + dy], tone(color, 0.78));
  const g = ctx.createLinearGradient(0, y + ry, 0, y);
  g.addColorStop(0, tone(color, 1.12));
  g.addColorStop(1, tone(color, 0.9));
  poly(ctx, [x - o, y + 0.6, x + w + o, y + 0.6, x + w + rx + o, y + ry, x + rx - o, y + ry], g as unknown as string);
  // Tiles.
  ctx.strokeStyle = tone(color, 0.7, 0.6);
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let k = 1; k < 4; k++) {
    const t = k / 4;
    ctx.moveTo(x - o + rx * t, y + 0.6 + (ry - 0.6) * t);
    ctx.lineTo(x + w + o + rx * t, y + 0.6 + (ry - 0.6) * t);
  }
  ctx.stroke();
}

/** Roof with the gable facing the viewer (temples, churches). */
function frontGable(ctx: Ctx, x: number, y: number, w: number, d: number, rise: number, color: string, wall: string): void {
  const dx = d * DX;
  const dy = d * DY;
  const o = 1;
  poly(ctx, [x + w / 2, y - rise, x + w + o, y + 0.5, x + w + dx + o, y + dy + 0.5, x + w / 2 + dx, y + dy - rise], tone(color, 0.85));
  poly(ctx, [x - o, y + 0.5, x + w + o, y + 0.5, x + w / 2, y - rise], tone(wall, 1.05));
  ctx.strokeStyle = tone(wall, 0.7);
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 1);
  ctx.lineTo(x + w - 2, y - 1);
  ctx.lineTo(x + w / 2, y - rise + 2);
  ctx.closePath();
  ctx.stroke();
}

function dome(ctx: Ctx, cx: number, y: number, r: number, color: string): void {
  const g = ctx.createRadialGradient(cx - r * 0.4, y - r * 0.7, r * 0.1, cx, y - r * 0.3, r * 1.1);
  g.addColorStop(0, tone(color, 1.35));
  g.addColorStop(0.6, color);
  g.addColorStop(1, tone(color, 0.6));
  ctx.beginPath();
  ctx.moveTo(cx - r, y);
  ctx.bezierCurveTo(cx - r, y - r * 1.35, cx + r, y - r * 1.35, cx + r, y);
  ctx.ellipse(cx, y, r, r * 0.28, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Ribs.
  ctx.strokeStyle = tone(color, 0.75, 0.6);
  ctx.lineWidth = 0.4;
  for (const k of [-0.5, 0, 0.5]) {
    ctx.beginPath();
    ctx.moveTo(cx + k * r, y + 0.25 * r * Math.sqrt(1 - k * k));
    ctx.quadraticCurveTo(cx + k * r * 0.9, y - r * 0.9, cx, y - r * 1.02);
    ctx.stroke();
  }
}

function windows(ctx: Ctx, x: number, y: number, w: number, rows: number[], ww: number, wh: number, count: number, arch = false, lit = false): void {
  const step = w / count;
  for (const ry of rows) {
    for (let k = 0; k < count; k++) {
      const wx = x + step * (k + 0.5) - ww / 2;
      ctx.fillStyle = lit && (k + ry) % 3 === 0 ? "#f3d27a" : WINDOW;
      ctx.beginPath();
      if (arch) {
        ctx.moveTo(wx, y + ry);
        ctx.lineTo(wx, y + ry - wh + ww / 2);
        ctx.arc(wx + ww / 2, y + ry - wh + ww / 2, ww / 2, Math.PI, 0);
        ctx.lineTo(wx + ww, y + ry);
      } else ctx.rect(wx, y + ry - wh, ww, wh);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.fillRect(wx, y + ry - wh, ww * 0.35, wh * 0.5);
    }
  }
}

function columns(ctx: Ctx, x: number, y: number, w: number, h: number, n: number, color: string): void {
  const step = w / (n - 1);
  for (let k = 0; k < n; k++) {
    const cx = x + k * step;
    const g = ctx.createLinearGradient(cx - 1.4, 0, cx + 1.4, 0);
    g.addColorStop(0, tone(color, 1.15));
    g.addColorStop(0.5, color);
    g.addColorStop(1, tone(color, 0.7));
    ctx.fillStyle = g;
    ctx.fillRect(cx - 1.3, y - h, 2.6, h);
    ctx.fillStyle = tone(color, 1.1);
    ctx.fillRect(cx - 1.9, y - h - 1, 3.8, 1.1);
    ctx.fillRect(cx - 1.9, y - 1, 3.8, 1);
  }
}

function flag(ctx: Ctx, x: number, y: number, pole: number, color: string): void {
  ctx.strokeStyle = "#3a2c22";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x, y - pole);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - pole);
  ctx.quadraticCurveTo(x + 3, y - pole - 1, x + 6, y - pole + 0.6);
  ctx.lineTo(x + 6, y - pole + 3.6);
  ctx.quadraticCurveTo(x + 3, y - pole + 2.4, x, y - pole + 3.2);
  ctx.closePath();
  ctx.fill();
}

function smoke(ctx: Ctx, x: number, y: number, k: number): void {
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(200, 200, 205, ${0.55 - i * 0.11})`;
    ctx.beginPath();
    ctx.arc(x + i * 3 * k, y - i * 4.5 * k, (2 + i * 1.3) * k, 0, Math.PI * 2);
    ctx.fill();
  }
}

// ---------- buildings ----------

/** A house of the city, `seed` picks the look. */
export function drawHouse(ctx: Ctx, seed: number): void {
  const walls = ["#efe3c6", "#e8d7b5", "#f2e9d8", "#dcc7a0"];
  const roofs = [ROOF_RED, "#9a5a35", ROOF_RED, "#7d6a58"];
  const w = 9 + (seed % 3) * 2;
  const h = 6 + ((seed >> 2) % 3) * 2;
  const wall = walls[seed % walls.length]!;
  block(ctx, -w / 2, 0, w, h, 7, wall);
  gableRoof(ctx, -w / 2, -h, w, 7, 4 + (seed % 2) * 1.5, roofs[(seed >> 1) % roofs.length]!, wall);
  ctx.fillStyle = "#5a3b25";
  ctx.fillRect(-w / 2 + 1.5, -4.2, 2.2, 4.2);
  windows(ctx, -w / 2 + 4, 0, w - 5, [-h + 4.5], 1.8, 2, Math.max(1, Math.floor((w - 5) / 4)));
}

function granary(ctx: Ctx): void {
  block(ctx, -15, 0, 30, 4, 14, "#b9ad97");
  block(ctx, -14, -4, 28, 12, 13, "#b98a55");
  ctx.strokeStyle = "rgba(70, 45, 25, 0.5)";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let x = -12; x < 14; x += 3) {
    ctx.moveTo(x, -4);
    ctx.lineTo(x, -16);
  }
  ctx.stroke();
  gableRoof(ctx, -14, -16, 28, 13, 8, "#c9a24e", "#b98a55");
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(-4, -13, 8, 9);
  ctx.strokeStyle = "#d8b47a";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-4, -13);
  ctx.lineTo(4, -4);
  ctx.moveTo(4, -13);
  ctx.lineTo(-4, -4);
  ctx.stroke();
  for (const [sx, sy] of [[-11, 0], [-8, 0], [-9.5, -2.6], [10, 0]] as const) {
    ctx.fillStyle = "#e3d2a8";
    ctx.beginPath();
    ctx.ellipse(sx, sy - 1.4, 1.8, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.stroke();
  }
}

function temple(ctx: Ctx): void {
  block(ctx, -16, 0, 32, 3, 16, LIMESTONE);
  block(ctx, -14, -3, 28, 1.5, 14, LIMESTONE);
  block(ctx, -11, -4.5, 22, 12, 11, tone(LIMESTONE, 0.88));
  columns(ctx, -12, -4.5, 24, 12, 6, LIMESTONE);
  block(ctx, -13, -16.5, 26, 2, 13, LIMESTONE);
  frontGable(ctx, -13, -18.5, 26, 13, 7, ROOF_RED, LIMESTONE);
}

function walls(ctx: Ctx): void {
  block(ctx, -22, 0, 44, 9, 5, STONE);
  ctx.fillStyle = tone(STONE, 1.08);
  for (let x = -22; x < 22; x += 4) {
    block(ctx, x, -9, 2.2, 2.2, 5, STONE);
  }
  for (const tx of [-24, 18]) {
    block(ctx, tx, 0, 7, 15, 7, tone(STONE, 0.97));
    for (let x = tx; x < tx + 7; x += 2.5) block(ctx, x, -15, 1.4, 2, 7, STONE);
  }
  ctx.fillStyle = "#3b2c20";
  ctx.beginPath();
  ctx.moveTo(-3.5, 0);
  ctx.lineTo(-3.5, -5);
  ctx.arc(0, -5, 3.5, Math.PI, 0);
  ctx.lineTo(3.5, 0);
  ctx.fill();
}

function barracks(ctx: Ctx, color: string): void {
  block(ctx, -18, 0, 36, 9, 12, "#cbb48c");
  gableRoof(ctx, -18, -9, 36, 12, 5, ROOF_SLATE, "#cbb48c");
  windows(ctx, -18, 0, 36, [-4], 2.2, 2.6, 6);
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(-2, -6, 4, 6);
  flag(ctx, 20, 0, 20, color);
  // Spear rack.
  ctx.strokeStyle = "#5a3b25";
  ctx.lineWidth = 0.6;
  for (let k = 0; k < 4; k++) {
    ctx.beginPath();
    ctx.moveTo(-22 + k * 1.2, 0);
    ctx.lineTo(-23 + k * 1.2, -12);
    ctx.stroke();
  }
}

function library(ctx: Ctx): void {
  block(ctx, -16, 0, 32, 3, 13, LIMESTONE);
  block(ctx, -15, -3, 30, 16, 12, "#e2d6bb");
  windows(ctx, -15, -3, 30, [-3, -10], 3, 5, 4, true);
  block(ctx, -16, -19, 32, 2, 13, LIMESTONE);
  dome(ctx, 3.5, -22, 8, ROOF_COPPER);
  ctx.fillStyle = "#4a3020";
  ctx.beginPath();
  ctx.moveTo(-2.5, -3);
  ctx.lineTo(-2.5, -8);
  ctx.arc(0, -8, 2.5, Math.PI, 0);
  ctx.lineTo(2.5, -3);
  ctx.fill();
  // Scroll above the door.
  ctx.fillStyle = "#f3e7c8";
  ctx.fillRect(-4, -14, 8, 2.2);
}

function marketplace(ctx: Ctx): void {
  const stalls: [number, string][] = [[-17, "#c2412f"], [-5, "#2f6fb2"], [7, "#d99b2b"]];
  for (const [x, c] of stalls) {
    block(ctx, x, 0, 10, 4, 7, "#9a6b3e");
    ctx.strokeStyle = "#5a3b25";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(x + 0.6, -4);
    ctx.lineTo(x + 0.6, -11);
    ctx.moveTo(x + 9.4, -4);
    ctx.lineTo(x + 9.4, -11);
    ctx.stroke();
    // Striped awning.
    for (let k = 0; k < 5; k++) {
      poly(ctx, [x - 0.8 + k * 2.3, -10, x + 1.5 + k * 2.3, -10, x + 1.5 + k * 2.3 + 4, -14, x - 0.8 + k * 2.3 + 4, -14], k % 2 ? "#f3ead2" : c, false);
    }
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 0.5;
    ctx.strokeRect(x - 0.8, -10.5, 11.6, 0.8);
    // Goods.
    const goods = ["#d9a43b", "#7aa83c", "#c8442e", "#e8dfc6"];
    for (let k = 0; k < 4; k++) {
      ctx.fillStyle = goods[(k + Math.round(x)) & 3]!;
      ctx.beginPath();
      ctx.arc(x + 2 + k * 2, -4.8, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function amphitheater(ctx: Ctx): void {
  const rx = 22;
  const ry = 9;
  const h = 14;
  ctx.fillStyle = tone(STONE, 0.75);
  ctx.beginPath();
  ctx.ellipse(0, -h - 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9b48a";
  ctx.beginPath();
  ctx.ellipse(0, -h - 1, rx * 0.62, ry * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
  // Outer wall (front half) with arches.
  const g = ctx.createLinearGradient(-rx, 0, rx, 0);
  g.addColorStop(0, tone(STONE, 1.08));
  g.addColorStop(1, tone(STONE, 0.78));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(0, -h - 2, rx, ry, 0, 0, Math.PI);
  ctx.lineTo(-rx, -2);
  ctx.ellipse(0, -2, rx, ry, 0, Math.PI, 0, true);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  for (const level of [0, 1]) {
    for (let k = -7; k <= 7; k++) {
      const a = Math.PI / 2 - (k / 8) * (Math.PI / 2) * 0.95;
      const ax = Math.cos(a) * rx * 0.97;
      const ay = Math.sin(a) * ry - 2 - level * 6.5;
      const s = Math.sin(a);
      ctx.fillStyle = WINDOW;
      ctx.beginPath();
      ctx.moveTo(ax - 1 * s, ay - 1);
      ctx.lineTo(ax - 1 * s, ay - 3.8);
      ctx.arc(ax, ay - 3.8, 1 * s, Math.PI, 0);
      ctx.lineTo(ax + 1 * s, ay - 1);
      ctx.fill();
    }
  }
}

function aqueduct(ctx: Ctx): void {
  const w = 52;
  block(ctx, -w / 2, -18, w, 4, 4, STONE);
  ctx.fillStyle = "#6fa7c9";
  ctx.fillRect(-w / 2 + 1, -22.4, w - 2, 1.2);
  for (let k = 0; k < 5; k++) {
    const x = -w / 2 + k * (w / 5);
    const aw = w / 5;
    ctx.fillStyle = tone(STONE, 0.98);
    ctx.beginPath();
    ctx.moveTo(x, -18);
    ctx.lineTo(x + aw, -18);
    ctx.lineTo(x + aw, 0);
    ctx.lineTo(x + aw - 1.8, 0);
    ctx.lineTo(x + aw - 1.8, -9);
    ctx.arc(x + aw / 2, -9, aw / 2 - 1.8, 0, Math.PI, true);
    ctx.lineTo(x + 1.8, 0);
    ctx.lineTo(x, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
  poly(ctx, [w / 2, -22, w / 2 + 4 * DX, -22 + 4 * DY, w / 2 + 4 * DX, 4 * DY, w / 2, 0], tone(STONE, 0.7));
}

function cathedral(ctx: Ctx): void {
  const wall = "#d6ccba";
  block(ctx, -9, 0, 18, 22, 22, wall);
  gableRoof(ctx, -9, -22, 18, 22, 0.01, ROOF_SLATE, wall);
  frontGable(ctx, -9, -22, 18, 22, 10, ROOF_SLATE, wall);
  for (const tx of [-17, 9]) {
    block(ctx, tx, 0, 8, 32, 8, wall);
    windows(ctx, tx, 0, 8, [-12, -22], 2.4, 6, 1, true);
    // Spire.
    poly(ctx, [tx - 0.5, -32, tx + 8.5, -32, tx + 4 + 2.5, -48], ROOF_SLATE);
    poly(ctx, [tx + 8.5, -32, tx + 8.5 + 8 * DX, -32 + 8 * DY, tx + 4 + 2.5, -48], tone(ROOF_SLATE, 0.7));
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(tx + 6.5, -48.5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Rose window.
  ctx.fillStyle = "#3e5f8f";
  ctx.beginPath();
  ctx.arc(0, -15, 4.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 0.4;
  for (let k = 0; k < 8; k++) {
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(Math.cos((k * Math.PI) / 4) * 4.2, -15 + Math.sin((k * Math.PI) / 4) * 4.2);
    ctx.stroke();
  }
  ctx.fillStyle = "#3a2a1e";
  ctx.beginPath();
  ctx.moveTo(-3, 0);
  ctx.lineTo(-3, -5);
  ctx.quadraticCurveTo(0, -10, 3, -5);
  ctx.lineTo(3, 0);
  ctx.fill();
}

function university(ctx: Ctx): void {
  block(ctx, -20, 0, 40, 14, 12, BRICK);
  gableRoof(ctx, -20, -14, 40, 12, 6, ROOF_SLATE, BRICK);
  windows(ctx, -20, 0, 40, [-3, -8.5], 2.2, 3.6, 8, true);
  block(ctx, -5, 0, 10, 28, 9, tone(BRICK, 1.05));
  windows(ctx, -5, 0, 10, [-17], 3, 4, 1, true);
  // Clock.
  ctx.fillStyle = "#f4ecd8";
  ctx.beginPath();
  ctx.arc(0, -23, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2b2118";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -23);
  ctx.lineTo(0, -25.2);
  ctx.moveTo(0, -23);
  ctx.lineTo(1.6, -22.4);
  ctx.stroke();
  poly(ctx, [-6, -28, 6, -28, 0, -37], ROOF_SLATE);
  poly(ctx, [6, -28, 6 + 9 * DX, -28 + 9 * DY, 0 + 4.5 * DX, -37 + 4.5 * DY], tone(ROOF_SLATE, 0.7));
  ctx.fillStyle = "#3a2a1e";
  ctx.fillRect(-2, -6, 4, 6);
}

function factory(ctx: Ctx): void {
  block(ctx, -24, 0, 48, 12, 14, "#9b5440");
  // Saw-tooth roof.
  for (let k = 0; k < 4; k++) {
    const x = -24 + k * 12;
    poly(ctx, [x, -12, x + 12, -12, x + 12 + 14 * DX, -12 + 14 * DY, x + 14 * DX, -12 + 14 * DY], "#6b6f73");
    poly(ctx, [x, -12, x + 14 * DX, -12 + 14 * DY, x + 14 * DX, -18 + 14 * DY, x, -18], "#a9c4d4");
    poly(ctx, [x, -18, x + 12, -12, x + 12 + 14 * DX, -12 + 14 * DY, x + 14 * DX, -18 + 14 * DY], "#7d8287");
  }
  windows(ctx, -24, 0, 48, [-3], 3.4, 4.5, 8, false, true);
  for (const [cx, h] of [[16, 34], [24, 40]] as const) {
    const g = ctx.createLinearGradient(cx - 2, 0, cx + 2, 0);
    g.addColorStop(0, "#b56a4f");
    g.addColorStop(1, "#6f3a2a");
    ctx.fillStyle = g;
    ctx.fillRect(cx - 2, -h, 4, h - 6);
    ctx.fillStyle = "#3b3b3b";
    ctx.fillRect(cx - 2.4, -h - 1, 4.8, 1.4);
    smoke(ctx, cx + 1, -h - 3, 1.2);
  }
}

function palace(ctx: Ctx, color: string): void {
  const wall = "#efe4cc";
  block(ctx, -28, 0, 56, 3, 16, STONE);
  // Wings.
  for (const x of [-28, 12]) {
    block(ctx, x, -3, 16, 15, 14, wall);
    windows(ctx, x, -3, 16, [-3, -9], 2.2, 3.6, 3, true);
    gableRoof(ctx, x, -18, 16, 14, 5, ROOF_COPPER, wall);
  }
  // Central part with a pediment and a dome.
  block(ctx, -12, -3, 24, 20, 15, tone(wall, 1.04));
  windows(ctx, -12, -3, 24, [-11], 2.4, 4.2, 4, true);
  columns(ctx, -10, -3, 20, 8, 5, LIMESTONE);
  block(ctx, -13, -23, 26, 2, 15, LIMESTONE);
  frontGable(ctx, -13, -25, 26, 15, 6, ROOF_COPPER, LIMESTONE);
  dome(ctx, 4.5, -29, 7, ROOF_COPPER);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(4.5, -39, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3020";
  ctx.beginPath();
  ctx.moveTo(-2.5, -3);
  ctx.lineTo(-2.5, -7);
  ctx.arc(0, -7, 2.5, Math.PI, 0);
  ctx.lineTo(2.5, -3);
  ctx.fill();
  flag(ctx, 4.5, -40, 9, color);
}

function courthouse(ctx: Ctx): void {
  block(ctx, -17, 0, 34, 2, 14, LIMESTONE);
  block(ctx, -16, -2, 32, 1.6, 13, LIMESTONE);
  block(ctx, -14, -3.6, 28, 15, 12, tone(LIMESTONE, 0.86));
  columns(ctx, -13, -3.6, 26, 15, 6, LIMESTONE);
  block(ctx, -15, -18.6, 30, 2.2, 13, LIMESTONE);
  frontGable(ctx, -15, -20.8, 30, 13, 7, LIMESTONE, LIMESTONE);
  // Scales of justice in the pediment.
  ctx.strokeStyle = "#8a6a2a";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(0, -26.5);
  ctx.lineTo(0, -22.5);
  ctx.moveTo(-3.5, -25.5);
  ctx.lineTo(3.5, -25.5);
  ctx.stroke();
  ctx.fillStyle = GOLD;
  for (const sx of [-3.5, 3.5]) {
    ctx.beginPath();
    ctx.ellipse(sx, -23.6, 1.6, 0.7, 0, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = "#3a2a1e";
  ctx.fillRect(-2, -10, 4, 6.4);
}

function harbour(ctx: Ctx): void {
  // Water in front.
  const sea = ctx.createLinearGradient(0, -6, 0, 6);
  sea.addColorStop(0, "#5f95bf");
  sea.addColorStop(1, "#3c6f9c");
  ctx.fillStyle = sea;
  ctx.beginPath();
  ctx.ellipse(4, 1, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 0.5;
  for (const [wx, wy] of [[-14, 2], [6, 4], [18, 0]] as const) {
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.quadraticCurveTo(wx + 2, wy - 1, wx + 4, wy);
    ctx.stroke();
  }
  // Warehouse on the quay.
  block(ctx, -26, -2, 20, 11, 12, "#b07a4c");
  gableRoof(ctx, -26, -13, 20, 12, 5, ROOF_RED, "#b07a4c");
  ctx.fillStyle = "#4a3020";
  ctx.fillRect(-19, -9, 6, 7);
  // Wooden pier with posts.
  poly(ctx, [-6, -2, 22, -2, 22 + 5 * DX, -2 + 5 * DY, -6 + 5 * DX, -2 + 5 * DY], "#a07a4e");
  ctx.strokeStyle = "#5a3b25";
  ctx.lineWidth = 0.8;
  for (let x = -4; x <= 22; x += 6) {
    ctx.beginPath();
    ctx.moveTo(x, -2);
    ctx.lineTo(x, 2);
    ctx.stroke();
  }
  // Crane.
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(14, -3);
  ctx.lineTo(14, -24);
  ctx.lineTo(26, -20);
  ctx.moveTo(14, -18);
  ctx.lineTo(20, -22);
  ctx.stroke();
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.moveTo(25, -20.3);
  ctx.lineTo(25, -10);
  ctx.stroke();
  block(ctx, 23.5, -7, 3, 3, 2, "#c9a24e");
  // A small sailing boat.
  poly(ctx, [-2, 3, 10, 3, 8, 6, 0, 6], "#7a4a2a");
  poly(ctx, [4, 2.6, 4, -10, 10, 2], "#f4efe2");
}

function bank(ctx: Ctx): void {
  block(ctx, -17, 0, 34, 3, 14, "#bfb6a4");
  block(ctx, -15, -3, 30, 18, 12, "#d8d0bf");
  ctx.strokeStyle = "rgba(90, 80, 60, 0.35)";
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let y = -6; y > -21; y -= 3) {
    ctx.moveTo(-15, y);
    ctx.lineTo(15, y);
  }
  ctx.stroke();
  columns(ctx, -12, -3, 24, 14, 4, "#ece6d6");
  block(ctx, -16, -21, 32, 3, 13, "#ece6d6");
  // Gold coin above the door.
  const g = ctx.createRadialGradient(-1, -25.5, 0.5, 0, -25, 3.4);
  g.addColorStop(0, "#fff0b0");
  g.addColorStop(1, "#c79a2c");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, -25, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6a1c";
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = "#3a3a3a";
  ctx.fillRect(-2.6, -10, 5.2, 7);
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(-2.6, -10, 5.2, 7);
}

function chimney(ctx: Ctx, cx: number, h: number, w: number, color: string, puff: number, dark: boolean): void {
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, tone(color, 1.15));
  g.addColorStop(1, tone(color, 0.6));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, 0);
  ctx.lineTo(cx - w / 2.6, -h);
  ctx.lineTo(cx + w / 2.6, -h);
  ctx.lineTo(cx + w / 2, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = dark ? `rgba(70, 68, 66, ${0.75 - i * 0.15})` : `rgba(240, 242, 245, ${0.85 - i * 0.17})`;
    ctx.beginPath();
    ctx.arc(cx + i * 3 * puff, -h - 3 - i * 4.5 * puff, (2.2 + i * 1.5) * puff, 0, Math.PI * 2);
    ctx.fill();
  }
}

function powerPlant(ctx: Ctx): void {
  block(ctx, -26, 0, 34, 16, 14, BRICK);
  gableRoof(ctx, -26, -16, 34, 14, 4, ROOF_SLATE, BRICK);
  windows(ctx, -26, 0, 34, [-4], 3, 7, 5, true, true);
  chimney(ctx, 18, 46, 6, "#8c4f3a", 1.5, true);
  // Coal heap.
  ctx.fillStyle = "#2b2b2e";
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(10, -9, 16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.arc(8, -4, 1.2, 0, Math.PI * 2);
  ctx.fill();
}

function hydroPlant(ctx: Ctx): void {
  // Lake behind the dam.
  ctx.fillStyle = "#4f86b4";
  poly(ctx, [-30, -22, 30, -22, 30 + 10 * DX, -22 + 10 * DY, -30 + 10 * DX, -22 + 10 * DY], "#4f86b4", false);
  // Dam wall.
  const g = ctx.createLinearGradient(0, -24, 0, 0);
  g.addColorStop(0, "#d8d6d0");
  g.addColorStop(1, "#9c9a94");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-30, -22);
  ctx.quadraticCurveTo(0, -26, 30, -22);
  ctx.lineTo(24, 0);
  ctx.quadraticCurveTo(0, -3, -24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Water rushing out of three gates.
  for (const x of [-10, 0, 10]) {
    ctx.fillStyle = "#2f4f6a";
    ctx.fillRect(x - 2, -12, 4, 3);
    const w = ctx.createLinearGradient(0, -9, 0, 2);
    w.addColorStop(0, "#e8f4fb");
    w.addColorStop(1, "#7fb3d6");
    ctx.fillStyle = w;
    ctx.beginPath();
    ctx.moveTo(x - 2, -9);
    ctx.lineTo(x + 2, -9);
    ctx.lineTo(x + 3, 2);
    ctx.lineTo(x - 3, 2);
    ctx.closePath();
    ctx.fill();
  }
  // Turbine hall at the foot.
  block(ctx, 14, 0, 14, 7, 8, "#c9c3b5");
  windows(ctx, 14, 0, 14, [-2], 1.8, 3, 3, false, true);
  ctx.fillStyle = "rgba(140, 190, 225, 0.7)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 20, 2.4, 0, 0, Math.PI * 2);
  ctx.fill();
}

function coolingTower(ctx: Ctx, cx: number, h: number, r: number): void {
  const g = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
  g.addColorStop(0, "#eef0f0");
  g.addColorStop(0.55, "#c9cccd");
  g.addColorStop(1, "#8f9395");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - r, 0);
  ctx.quadraticCurveTo(cx - r * 0.55, -h * 0.65, cx - r * 0.7, -h);
  ctx.lineTo(cx + r * 0.7, -h);
  ctx.quadraticCurveTo(cx + r * 0.55, -h * 0.65, cx + r, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  ctx.fillStyle = "#6f7477";
  ctx.beginPath();
  ctx.ellipse(cx, -h, r * 0.7, r * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = `rgba(250, 252, 255, ${0.85 - i * 0.18})`;
    ctx.beginPath();
    ctx.arc(cx + i * 2.5, -h - 4 - i * 4, 4 + i * 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function nuclearPlant(ctx: Ctx): void {
  coolingTower(ctx, -16, 34, 11);
  coolingTower(ctx, 4, 30, 10);
  block(ctx, 14, 0, 14, 10, 10, "#c8ccd0");
  // Reactor dome.
  dome(ctx, 21 + 5 * DX, -10 + 5 * DY, 6, "#e4e7ea");
  ctx.fillStyle = "#e0b43a";
  ctx.beginPath();
  ctx.arc(21, -5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2b2b2b";
  for (let k = 0; k < 3; k++) {
    ctx.beginPath();
    ctx.moveTo(21, -5);
    ctx.arc(21, -5, 1.7, (k * 2 * Math.PI) / 3 - 0.5, (k * 2 * Math.PI) / 3 + 0.5);
    ctx.closePath();
    ctx.fill();
  }
}

function manufacturingPlant(ctx: Ctx): void {
  block(ctx, -26, 0, 52, 14, 16, "#d4d9de");
  block(ctx, -26, -14, 52, 2, 16, "#8a96a2");
  // Big glass front with a robot arm inside.
  ctx.fillStyle = "#9fc3da";
  ctx.fillRect(-22, -12, 30, 9);
  ctx.strokeStyle = "#e2a02c";
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-14, -3.5);
  ctx.lineTo(-11, -9.5);
  ctx.lineTo(-5, -8);
  ctx.lineTo(-3.5, -5);
  ctx.stroke();
  ctx.lineCap = "butt";
  ctx.fillStyle = "#4b5560";
  ctx.fillRect(-16, -4, 5, 1);
  ctx.fillStyle = "#c2412f";
  ctx.fillRect(-4.5, -4.6, 3, 1.4);
  ctx.fillStyle = "#2f6fb2";
  ctx.fillRect(1, -4.6, 3, 1.4);
  ctx.strokeStyle = "#5b6670";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-22, -12, 30, 9);
  // Loading gate and a blue stripe.
  ctx.fillStyle = "#6c7680";
  ctx.fillRect(12, -9, 10, 9);
  ctx.fillStyle = "#2f6fb2";
  ctx.fillRect(-26, -2, 52, 1.2);
  // Solar panels on the roof.
  for (let k = 0; k < 4; k++) poly(ctx, [-20 + k * 11, -16, -12 + k * 11, -16, -12 + k * 11 + 6 * DX, -16 + 6 * DY, -20 + k * 11 + 6 * DX, -16 + 6 * DY], "#34507a");
}

function massTransit(ctx: Ctx): void {
  // Rails.
  ctx.strokeStyle = "#6b6b6b";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(-28, 0);
  ctx.lineTo(28, 0);
  ctx.moveTo(-28 + 4 * DX, 4 * DY);
  ctx.lineTo(28 + 4 * DX, 4 * DY);
  ctx.stroke();
  // Overhead wire on poles.
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  for (const x of [-26, 24]) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, -22);
  }
  ctx.moveTo(-26, -20);
  ctx.lineTo(24, -20);
  ctx.stroke();
  // The tram.
  block(ctx, -20, -1, 34, 11, 7, "#c8352c");
  block(ctx, -20, -8, 34, 3, 7, "#f2e6c8");
  windows(ctx, -20, -1, 34, [-5], 3.4, 3.2, 7);
  ctx.strokeStyle = "#3a3a3a";
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.lineTo(2, -20);
  ctx.stroke();
  ctx.fillStyle = "#2b2b2b";
  for (const wx of [-15, -9, 6, 12]) {
    ctx.beginPath();
    ctx.arc(wx, 0, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  // A stop with a roof.
  block(ctx, 18, 0, 8, 1, 5, "#9a9a9a");
  ctx.fillStyle = "#4a5d6e";
  ctx.fillRect(18.5, -9, 0.8, 9);
  poly(ctx, [17, -9, 27, -9, 27 + 5 * DX, -9 + 5 * DY, 17 + 5 * DX, -9 + 5 * DY], "#4a8a5a");
}

function recyclingCenter(ctx: Ctx): void {
  block(ctx, -24, 0, 30, 14, 14, "#7fae6a");
  gableRoof(ctx, -24, -14, 30, 14, 4, "#5d7d4c", "#7fae6a");
  ctx.fillStyle = "#3e5a32";
  ctx.fillRect(-13, -10, 8, 10);
  // Three-arrow sign.
  ctx.strokeStyle = "#f5f2e6";
  ctx.lineWidth = 1.1;
  for (let k = 0; k < 3; k++) {
    const a = (k * 2 * Math.PI) / 3 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(-18, -8, 3, a, a + 1.6);
    ctx.stroke();
    const ex = -18 + Math.cos(a + 1.6) * 3;
    const ey = -8 + Math.sin(a + 1.6) * 3;
    ctx.fillStyle = "#f5f2e6";
    ctx.beginPath();
    ctx.arc(ex, ey, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  // Coloured containers.
  const bins: [number, string][] = [[8, "#2f6fb2"], [14, "#e2b62c"], [20, "#3f8f4a"]];
  for (const [x, c] of bins) {
    block(ctx, x, 0, 5, 7, 5, c);
    block(ctx, x - 0.3, -7, 5.6, 1, 5, tone(c, 0.7));
  }
}

// ---------- wonders ----------

function stoneCircle(ctx: Ctx): void {
  ctx.fillStyle = "rgba(90, 120, 60, 0.45)";
  ctx.beginPath();
  ctx.ellipse(0, -6, 30, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const stones: [number, number][] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2;
    stones.push([Math.cos(a) * 24, -6 + Math.sin(a) * 7.5]);
  }
  stones.sort((a, b) => a[1] - b[1]);
  for (const [sx, sy] of stones) {
    block(ctx, sx - 2, sy, 4, 13, 2.6, "#a29a8c");
  }
  // Lintels on the back half.
  for (let k = 0; k < stones.length - 1; k += 2) {
    const [ax, ay] = stones[k]!;
    const [bx, by] = stones[k + 1]!;
    if (Math.abs(ax - bx) < 16 && ay < -6) block(ctx, Math.min(ax, bx) - 2, Math.min(ay, by) - 13, Math.abs(ax - bx) + 4, 2.4, 2.6, "#b0a898");
  }
  block(ctx, -6, -6, 4, 18, 3, "#9c9486");
  block(ctx, 2, -6, 4, 18, 3, "#9c9486");
  block(ctx, -7, -24, 14, 3, 3, "#b0a898");
}

function hallOfScholars(ctx: Ctx): void {
  block(ctx, -26, 0, 52, 4, 20, LIMESTONE);
  block(ctx, -23, -4, 46, 16, 17, tone(LIMESTONE, 0.86));
  columns(ctx, -24, -4, 48, 16, 10, LIMESTONE);
  block(ctx, -25, -20, 50, 3, 18, LIMESTONE);
  frontGable(ctx, -25, -23, 50, 18, 9, LIMESTONE, LIMESTONE);
  dome(ctx, 6, -30, 11, GOLD);
  ctx.fillStyle = GOLD;
  ctx.fillRect(5.4, -46, 1.2, 4);
}

function greatObservatory(ctx: Ctx): void {
  block(ctx, -18, 0, 36, 10, 14, STONE);
  windows(ctx, -18, 0, 36, [-4], 2.2, 3, 6, true);
  // Round tower.
  const g = ctx.createLinearGradient(-8, 0, 8, 0);
  g.addColorStop(0, tone(STONE, 1.1));
  g.addColorStop(1, tone(STONE, 0.7));
  ctx.fillStyle = g;
  ctx.fillRect(-7, -34, 14, 26);
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(-7, -34, 14, 26);
  windows(ctx, -7, -8, 14, [-8, -18], 2, 3.2, 1, true);
  dome(ctx, 0, -34, 9, "#d8dde2");
  // Telescope slit and tube.
  ctx.fillStyle = "#26303a";
  ctx.fillRect(-1, -45, 2, 10);
  ctx.save();
  ctx.translate(0, -42);
  ctx.rotate(-0.7);
  ctx.fillStyle = "#b08a3c";
  ctx.fillRect(-1.2, -9, 2.4, 9);
  ctx.restore();
}

function grandBazaar(ctx: Ctx): void {
  block(ctx, -28, 0, 56, 14, 16, "#e3cfa6");
  for (let k = 0; k < 7; k++) {
    const x = -28 + k * 8;
    ctx.fillStyle = WINDOW;
    ctx.beginPath();
    ctx.moveTo(x + 2, 0);
    ctx.lineTo(x + 2, -6);
    ctx.arc(x + 4, -6, 2, Math.PI, 0);
    ctx.lineTo(x + 6, 0);
    ctx.fill();
    ctx.fillStyle = ["#c2412f", "#2f6fb2", "#d99b2b"][k % 3]!;
    ctx.fillRect(x + 2, -9.5, 4, 1);
  }
  for (const [cx, r] of [[-16, 6], [0, 9], [16, 6]] as const) dome(ctx, cx + 5, -14 + 16 * DY * 0.5, r, "#4f8fb0");
  for (const tx of [-30, 26]) {
    block(ctx, tx, 0, 4, 30, 4, "#e3cfa6");
    poly(ctx, [tx - 0.5, -30, tx + 4.5, -30, tx + 2, -37], "#4f8fb0");
  }
}

function greatWork(ctx: Ctx): void {
  block(ctx, -22, 0, 44, 6, 22, "#cfd6dc");
  const g = ctx.createLinearGradient(-6, 0, 6, 0);
  g.addColorStop(0, "#f2f6f8");
  g.addColorStop(1, "#8e9aa4");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-8, -6);
  ctx.lineTo(-3, -50);
  ctx.lineTo(3, -50);
  ctx.lineTo(8, -6);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 0.5;
  ctx.stroke();
  // Glowing ring.
  for (const [w, c] of [[5, "rgba(192, 90, 216, 0.35)"], [2.2, "#e7a6ff"], [0.8, "#ffffff"]] as const) {
    ctx.strokeStyle = c;
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.ellipse(0, -36, 16, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  const glow = ctx.createRadialGradient(0, -54, 0, 0, -54, 9);
  glow.addColorStop(0, "#fff7d0");
  glow.addColorStop(0.5, "rgba(255, 200, 80, 0.8)");
  glow.addColorStop(1, "rgba(255, 160, 40, 0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, -54, 9, 0, Math.PI * 2);
  ctx.fill();
}

/** Width of each building's footprint in design units, for placing them in a row. */
export const BUILDING_WIDTH: Record<BuildingId, number> = {
  palace: 62,
  courthouse: 40,
  harbour: 60,
  bank: 40,
  powerPlant: 54,
  hydroPlant: 62,
  nuclearPlant: 56,
  manufacturingPlant: 62,
  massTransit: 62,
  recyclingCenter: 52,
  granary: 34,
  temple: 36,
  walls: 50,
  barracks: 46,
  library: 38,
  marketplace: 40,
  amphitheater: 48,
  aqueduct: 58,
  cathedral: 40,
  university: 46,
  factory: 56,
  stoneCircle: 62,
  hallOfScholars: 66,
  greatObservatory: 42,
  grandBazaar: 66,
  greatWork: 50,
};

/** Height above the ground in design units, so a portrait can fit the picture. */
export const BUILDING_HEIGHT: Record<BuildingId, number> = {
  palace: 50,
  courthouse: 30,
  harbour: 28,
  bank: 30,
  powerPlant: 74,
  hydroPlant: 28,
  nuclearPlant: 62,
  manufacturingPlant: 24,
  massTransit: 24,
  recyclingCenter: 24,
  granary: 28,
  temple: 30,
  walls: 20,
  barracks: 24,
  library: 34,
  marketplace: 16,
  amphitheater: 28,
  aqueduct: 26,
  cathedral: 50,
  university: 40,
  factory: 46,
  stoneCircle: 30,
  hallOfScholars: 48,
  greatObservatory: 50,
  grandBazaar: 40,
  greatWork: 64,
};

export function drawBuilding(ctx: Ctx, id: BuildingId, color: string): void {
  switch (id) {
    case "palace":
      return palace(ctx, color);
    case "courthouse":
      return courthouse(ctx);
    case "harbour":
      return harbour(ctx);
    case "bank":
      return bank(ctx);
    case "powerPlant":
      return powerPlant(ctx);
    case "hydroPlant":
      return hydroPlant(ctx);
    case "nuclearPlant":
      return nuclearPlant(ctx);
    case "manufacturingPlant":
      return manufacturingPlant(ctx);
    case "massTransit":
      return massTransit(ctx);
    case "recyclingCenter":
      return recyclingCenter(ctx);
    case "granary":
      return granary(ctx);
    case "temple":
      return temple(ctx);
    case "walls":
      return walls(ctx);
    case "barracks":
      return barracks(ctx, color);
    case "library":
      return library(ctx);
    case "marketplace":
      return marketplace(ctx);
    case "amphitheater":
      return amphitheater(ctx);
    case "aqueduct":
      return aqueduct(ctx);
    case "cathedral":
      return cathedral(ctx);
    case "university":
      return university(ctx);
    case "factory":
      return factory(ctx);
    case "stoneCircle":
      return stoneCircle(ctx);
    case "hallOfScholars":
      return hallOfScholars(ctx);
    case "greatObservatory":
      return greatObservatory(ctx);
    case "grandBazaar":
      return grandBazaar(ctx);
    case "greatWork":
      return greatWork(ctx);
  }
}

/** A building on a patch of grass in a small canvas, for lists and the encyclopedia. */
export function buildingPortraitCanvas(id: BuildingId, width: number, height: number, color = "#f4f1ea"): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.scale(dpr, dpr);
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, "#b9d6ea");
  sky.addColorStop(0.7, "#e6efe6");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#7da35a";
  ctx.beginPath();
  ctx.ellipse(width / 2, height - 6, width * 0.48, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  const k = Math.min((width * 0.86) / BUILDING_WIDTH[id], (height - 12) / (BUILDING_HEIGHT[id] + 6));
  ctx.translate(width / 2 - 3 * k, height - 7);
  ctx.scale(k, k);
  drawBuilding(ctx, id, color);
  return canvas;
}
