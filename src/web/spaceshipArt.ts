/**
 * The spaceship drawn with code: on the launch pad it grows part by part
 * (parts not built yet show as a pale blueprint), after the launch it flies
 * between the Earth and a distant star, and after a safe landing it stands
 * on a strange planet. Everything is drawn in a 400 × 300 scene and scaled.
 */
import { RULES } from "../core";

export type SpaceshipScene = "pad" | "flight" | "landed" | "lost";

export interface SpaceshipPicture {
  structural: number;
  component: number;
  module: number;
  scene: SpaceshipScene;
  /** 0 to 1: how far the ship got on its way. */
  progress?: number;
  /** Colour of the owner, used for the flag and stripes. */
  color?: string;
}

const W = 400;
const H = 300;
const CELL = 20;
const COLS = 3;

/** Small deterministic random numbers so the stars stay put between frames. */
function random(seed: number): () => number {
  let x = seed >>> 0 || 1;
  return () => {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    return ((x >>> 0) % 10000) / 10000;
  };
}

function ghost(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = "rgba(150, 205, 255, 0.55)";
  ctx.fillStyle = "rgba(120, 180, 255, 0.07)";
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1;
}

function solid(ctx: CanvasRenderingContext2D): void {
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(25, 28, 36, 0.9)";
}

function metal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): CanvasGradient {
  const g = ctx.createLinearGradient(x, y, x + w, y);
  g.addColorStop(0, "#8d97a6");
  g.addColorStop(0.35, "#e6ebf2");
  g.addColorStop(0.6, "#b7c0cc");
  g.addColorStop(1, "#6d7684");
  return g;
}

/** One truss cell of the frame. */
function trussCell(ctx: CanvasRenderingContext2D, x: number, y: number, built: boolean): void {
  if (!built) {
    ghost(ctx);
    ctx.fillRect(x, y, CELL, CELL);
    ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
    return;
  }
  solid(ctx);
  ctx.fillStyle = metal(ctx, x, y, CELL);
  ctx.fillRect(x, y, CELL, 3);
  ctx.fillRect(x, y + CELL - 3, CELL, 3);
  ctx.fillRect(x, y, 3, CELL);
  ctx.fillRect(x + CELL - 3, y, 3, CELL);
  ctx.strokeStyle = "#9aa4b2";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(x + 3, y + 3);
  ctx.lineTo(x + CELL - 3, y + CELL - 3);
  ctx.moveTo(x + CELL - 3, y + 3);
  ctx.lineTo(x + 3, y + CELL - 3);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(25, 28, 36, 0.8)";
  ctx.strokeRect(x + 0.5, y + 0.5, CELL - 1, CELL - 1);
}

/** A rocket engine bell under the frame, with a flame when the ship flies. */
function engine(ctx: CanvasRenderingContext2D, cx: number, top: number, built: boolean, flame: number): void {
  const w = 9;
  const h = 14;
  if (!built) {
    ghost(ctx);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.35, top);
    ctx.lineTo(cx + w * 0.35, top);
    ctx.lineTo(cx + w / 2, top + h);
    ctx.lineTo(cx - w / 2, top + h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (flame > 0) {
    const g = ctx.createLinearGradient(cx, top + h, cx, top + h + 34 * flame);
    g.addColorStop(0, "rgba(255, 250, 220, 0.95)");
    g.addColorStop(0.3, "rgba(255, 190, 70, 0.85)");
    g.addColorStop(1, "rgba(255, 90, 30, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2 + 1, top + h);
    ctx.quadraticCurveTo(cx, top + h + 44 * flame, cx + w / 2 - 1, top + h);
    ctx.fill();
  }
  solid(ctx);
  const g = ctx.createLinearGradient(cx - w / 2, 0, cx + w / 2, 0);
  g.addColorStop(0, "#4a4f58");
  g.addColorStop(0.45, "#9aa1ad");
  g.addColorStop(1, "#3a3e46");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.3, top);
  ctx.lineTo(cx + w * 0.3, top);
  ctx.lineTo(cx + w / 2, top + h);
  ctx.lineTo(cx - w / 2, top + h);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = flame > 0 ? "#ffcf6a" : "#2a2224";
  ctx.beginPath();
  ctx.ellipse(cx, top + h, w / 2 - 1, 1.6, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A module on top of the frame: living quarters, a laboratory with solar wings, the command capsule. */
function moduleShape(ctx: CanvasRenderingContext2D, kind: number, cx: number, bottom: number, built: boolean, color: string): number {
  const w = kind === 2 ? 44 : 54;
  const h = kind === 2 ? 30 : 24;
  const x = cx - w / 2;
  const y = bottom - h;
  if (!built) {
    ghost(ctx);
    ctx.beginPath();
    if (kind === 2) {
      ctx.moveTo(x, bottom);
      ctx.lineTo(cx, y - 8);
      ctx.lineTo(x + w, bottom);
      ctx.closePath();
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.fill();
    ctx.stroke();
    if (kind === 1) {
      ctx.strokeRect(x - 46, y + 6, 40, 12);
      ctx.strokeRect(x + w + 6, y + 6, 40, 12);
    }
    return y;
  }
  solid(ctx);
  if (kind === 1) {
    // Solar wings.
    for (const side of [-1, 1]) {
      const px = side < 0 ? x - 46 : x + w + 6;
      ctx.fillStyle = "#9aa4b2";
      ctx.fillRect(side < 0 ? px + 40 : x + w, y + 11, 6, 2);
      const pg = ctx.createLinearGradient(px, y + 6, px, y + 18);
      pg.addColorStop(0, "#2c4f9e");
      pg.addColorStop(1, "#16285a");
      ctx.fillStyle = pg;
      ctx.fillRect(px, y + 6, 40, 12);
      ctx.strokeStyle = "rgba(160, 200, 255, 0.55)";
      ctx.beginPath();
      for (let k = 1; k < 5; k++) {
        ctx.moveTo(px + k * 8, y + 6);
        ctx.lineTo(px + k * 8, y + 18);
      }
      ctx.moveTo(px, y + 12);
      ctx.lineTo(px + 40, y + 12);
      ctx.stroke();
      solid(ctx);
      ctx.strokeRect(px + 0.5, y + 6.5, 39, 11);
    }
  }
  if (kind === 2) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#aab3c0");
    g.addColorStop(0.4, "#ffffff");
    g.addColorStop(1, "#8892a0");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.quadraticCurveTo(x + 4, y + 2, cx, y - 8);
    ctx.quadraticCurveTo(x + w - 4, y + 2, x + w, bottom);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.fillRect(x + 6, bottom - 7, w - 12, 3);
    ctx.fillStyle = "#1d3a66";
    ctx.beginPath();
    ctx.ellipse(cx, y + 8, 5, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(200, 230, 255, 0.8)";
    ctx.beginPath();
    ctx.ellipse(cx - 1.5, y + 6.8, 1.6, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    return y - 8;
  }
  ctx.fillStyle = kind === 0 ? metal(ctx, x, y, w) : "#d9b356";
  if (kind === 1) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    g.addColorStop(0, "#9c7a2c");
    g.addColorStop(0.4, "#f3d684");
    g.addColorStop(1, "#8a6a22");
    ctx.fillStyle = g;
  }
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 4);
  ctx.fill();
  ctx.stroke();
  if (kind === 0) {
    ctx.fillStyle = "#1d3a66";
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(x + 10 + k * 11.3, y + h / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = color;
    ctx.fillRect(x, y + h - 5, w, 3);
  } else {
    ctx.strokeStyle = "rgba(90, 64, 18, 0.6)";
    ctx.beginPath();
    for (let k = 1; k < 4; k++) {
      ctx.moveTo(x + (k * w) / 4, y + 2);
      ctx.lineTo(x + (k * w) / 4 + 2, y + h - 2);
    }
    ctx.stroke();
  }
  return y;
}

/**
 * The ship standing upright with its frame bottom at (cx, base). Returns the
 * height it takes. `flame` 0 to 1 draws exhaust under built engines.
 */
function drawShip(ctx: CanvasRenderingContext2D, p: SpaceshipPicture, cx: number, base: number, flame: number, legs: boolean): void {
  const r = RULES.spaceship;
  // Away from the pad only the parts that exist are drawn.
  const plan = p.scene === "pad";
  const rows = Math.ceil(r.maxStructural / COLS);
  const left = cx - (COLS * CELL) / 2;
  const top = base - rows * CELL;
  // Engines first, under the frame.
  const engines = r.maxComponent;
  for (let k = 0; k < engines; k++) {
    const ex = left + ((k + 0.5) * COLS * CELL) / engines;
    if (plan || k < p.component) engine(ctx, ex, base, k < p.component, flame);
  }
  if (legs) {
    solid(ctx);
    ctx.strokeStyle = "#6d7684";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(left + 2, base - 6);
    ctx.lineTo(left - 14, base + 18);
    ctx.moveTo(left + COLS * CELL - 2, base - 6);
    ctx.lineTo(left + COLS * CELL + 14, base + 18);
    ctx.stroke();
    ctx.fillStyle = "#6d7684";
    ctx.fillRect(left - 19, base + 17, 10, 3);
    ctx.fillRect(left + COLS * CELL + 9, base + 17, 10, 3);
  }
  // The frame, filled from the bottom row up.
  for (let k = 0; k < rows * COLS; k++) {
    const row = Math.floor(k / COLS);
    const col = k % COLS;
    if (plan || k < p.structural) trussCell(ctx, left + col * CELL, base - (row + 1) * CELL, k < p.structural);
  }
  let bottom = top;
  for (let k = 0; k < r.maxModule; k++) {
    if (!plan && k >= p.module) break;
    bottom = moduleShape(ctx, Math.min(k, 2), cx, bottom, k < p.module, p.color ?? "#c23b30");
  }
  ctx.setLineDash([]);
}

function stars(ctx: CanvasRenderingContext2D, seed: number, count: number, maxY = H): void {
  const rnd = random(seed);
  for (let k = 0; k < count; k++) {
    const x = rnd() * W;
    const y = rnd() * maxY;
    const s = rnd();
    ctx.fillStyle = `rgba(255, 255, ${200 + Math.floor(s * 55)}, ${0.35 + s * 0.6})`;
    ctx.fillRect(x, y, s > 0.9 ? 2 : 1, s > 0.9 ? 2 : 1);
  }
}

function padScene(ctx: CanvasRenderingContext2D, p: SpaceshipPicture): void {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#0d1530");
  sky.addColorStop(0.55, "#2c3d6e");
  sky.addColorStop(0.85, "#c97a52");
  sky.addColorStop(1, "#e8a462");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, 7, 70, H * 0.45);
  // Distant hills and the pad.
  ctx.fillStyle = "#3a3348";
  ctx.beginPath();
  ctx.moveTo(0, 252);
  for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 244 - Math.sin(x * 0.03) * 8);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  ctx.fillStyle = "#4b4c55";
  ctx.fillRect(0, 262, W, 38);
  ctx.fillStyle = "#6b6c76";
  ctx.fillRect(130, 258, 140, 8);
  // Gantry tower on the left.
  ctx.strokeStyle = "#b8442f";
  ctx.lineWidth = 2;
  const gx = 112;
  ctx.strokeRect(gx, 40, 16, 218);
  ctx.beginPath();
  for (let y = 40; y < 258; y += 16) {
    ctx.moveTo(gx, y);
    ctx.lineTo(gx + 16, y + 16);
    ctx.moveTo(gx + 16, y);
    ctx.lineTo(gx, y + 16);
  }
  ctx.stroke();
  ctx.fillStyle = "#ffdf7a";
  ctx.beginPath();
  ctx.arc(gx + 8, 36, 2.5, 0, Math.PI * 2);
  ctx.fill();
  // Floodlights on the pad.
  for (const lx of [150, 250]) {
    const light = ctx.createRadialGradient(lx, 258, 2, lx, 200, 90);
    light.addColorStop(0, "rgba(255, 240, 200, 0.28)");
    light.addColorStop(1, "rgba(255, 240, 200, 0)");
    ctx.fillStyle = light;
    ctx.fillRect(lx - 90, 110, 180, 150);
  }
  ctx.save();
  ctx.translate(200, 244);
  ctx.scale(1.12, 1.12);
  drawShip(ctx, p, 0, 0, 0, false);
  ctx.restore();
  ctx.lineWidth = 1;
}

function flightScene(ctx: CanvasRenderingContext2D, p: SpaceshipPicture): void {
  ctx.fillStyle = "#04060f";
  ctx.fillRect(0, 0, W, H);
  stars(ctx, 11, 220);
  // A faint band of the galaxy.
  const band = ctx.createLinearGradient(0, 60, W, 240);
  band.addColorStop(0, "rgba(120, 110, 200, 0)");
  band.addColorStop(0.5, "rgba(150, 140, 220, 0.12)");
  band.addColorStop(1, "rgba(120, 110, 200, 0)");
  ctx.fillStyle = band;
  ctx.fillRect(0, 0, W, H);
  // The Earth behind, the target star ahead.
  const earth = ctx.createRadialGradient(28, 262, 4, 40, 270, 56);
  earth.addColorStop(0, "#7fc4ff");
  earth.addColorStop(0.6, "#2a6fc0");
  earth.addColorStop(1, "#0b2a55");
  ctx.fillStyle = earth;
  ctx.beginPath();
  ctx.arc(40, 270, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(90, 170, 90, 0.75)";
  ctx.beginPath();
  ctx.ellipse(30, 250, 16, 9, -0.4, 0, Math.PI * 2);
  ctx.ellipse(60, 268, 10, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();
  const glow = ctx.createRadialGradient(366, 46, 2, 366, 46, 40);
  glow.addColorStop(0, "rgba(255, 250, 220, 1)");
  glow.addColorStop(0.2, "rgba(255, 220, 150, 0.7)");
  glow.addColorStop(1, "rgba(255, 200, 120, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(320, 0, 80, 100);
  // The course and the ship on it.
  const t = Math.max(0, Math.min(1, p.progress ?? 0.5));
  const at = (k: number): [number, number] => [70 + k * 280, 230 - k * 170 - Math.sin(k * Math.PI) * 30];
  ctx.strokeStyle = "rgba(160, 200, 255, 0.35)";
  ctx.setLineDash([4, 5]);
  ctx.beginPath();
  for (let k = 0; k <= 1.0001; k += 0.05) {
    const [x, y] = at(k);
    if (k === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);
  const [x, y] = at(t);
  const [nx, ny] = at(Math.min(1, t + 0.01));
  const angle = Math.atan2(ny - y, nx - x) + Math.PI / 2;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(0.55, 0.55);
  drawShip(ctx, p, 0, 60, p.scene === "lost" ? 0 : 1, false);
  ctx.restore();
}

function landedScene(ctx: CanvasRenderingContext2D, p: SpaceshipPicture): void {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#1a0f33");
  sky.addColorStop(0.6, "#5a2f6e");
  sky.addColorStop(1, "#d77b8a");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
  stars(ctx, 23, 60, 140);
  // A ringed giant and two moons in the sky.
  const giant = ctx.createRadialGradient(300, 70, 6, 310, 80, 50);
  giant.addColorStop(0, "#f6d7a0");
  giant.addColorStop(1, "#b5683e");
  ctx.fillStyle = giant;
  ctx.beginPath();
  ctx.arc(310, 80, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(240, 220, 190, 0.7)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(310, 80, 78, 14, -0.25, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = "#e6e2ff";
  ctx.beginPath();
  ctx.arc(70, 50, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a9f0e0";
  ctx.beginPath();
  ctx.arc(110, 86, 6, 0, Math.PI * 2);
  ctx.fill();
  // Teal ground with rocks.
  ctx.fillStyle = "#2f6b6a";
  ctx.beginPath();
  ctx.moveTo(0, 236);
  for (let x = 0; x <= W; x += 25) ctx.lineTo(x, 230 + Math.sin(x * 0.05) * 6);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.fill();
  ctx.fillStyle = "#245553";
  ctx.fillRect(0, 262, W, 38);
  const rnd = random(5);
  for (let k = 0; k < 14; k++) {
    ctx.fillStyle = k % 2 ? "#1d4644" : "#3c8580";
    ctx.beginPath();
    ctx.ellipse(rnd() * W, 248 + rnd() * 48, 4 + rnd() * 8, 2 + rnd() * 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Domes of the first settlement, and the flag.
  for (const [dx, r] of [
    [292, 22],
    [336, 14],
    [76, 16],
  ] as const) {
    const g = ctx.createRadialGradient(dx - r / 3, 254 - r / 2, 2, dx, 254, r);
    g.addColorStop(0, "rgba(230, 250, 255, 0.95)");
    g.addColorStop(1, "rgba(130, 190, 220, 0.6)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(dx, 256, r, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = "rgba(40, 60, 80, 0.7)";
    ctx.stroke();
  }
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(250, 262);
  ctx.lineTo(250, 214);
  ctx.stroke();
  ctx.fillStyle = p.color ?? "#c23b30";
  ctx.fillRect(250, 214, 22, 13);
  ctx.lineWidth = 1;
  ctx.save();
  ctx.translate(165, 250);
  ctx.scale(0.75, 0.75);
  drawShip(ctx, p, 0, 0, 0, true);
  ctx.restore();
}

/** Draws the picture into a canvas of any size, keeping the 4:3 scene centred. */
export function drawSpaceshipPicture(canvas: HTMLCanvasElement, picture: SpaceshipPicture): void {
  const ctx = canvas.getContext("2d")!;
  const k = Math.min(canvas.width / W, canvas.height / H);
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate((canvas.width - W * k) / 2, (canvas.height - H * k) / 2);
  ctx.scale(k, k);
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 10);
  ctx.clip();
  if (picture.scene === "pad") padScene(ctx, picture);
  else if (picture.scene === "landed") landedScene(ctx, picture);
  else flightScene(ctx, picture);
  ctx.restore();
}

/** A ready canvas with the picture, sharp on high-density screens. */
export function spaceshipCanvas(picture: SpaceshipPicture, width: number, height: number): HTMLCanvasElement {
  const dpr = typeof window === "undefined" ? 1 : window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  drawSpaceshipPicture(canvas, picture);
  return canvas;
}
