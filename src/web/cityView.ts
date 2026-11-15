/**
 * The view into a city painted from Gemini pictures: a landscape behind, the
 * city's buildings and wonders standing on the meadow in rows, houses filling
 * the gaps and the walls in front. The pictures live in ./cityview; without
 * them the city screen keeps its drawn panorama.
 *
 * Positions come from the city id, so a city looks the same every time and
 * only changes when it builds something or grows.
 */
import { BUILDINGS, type BuildingId } from "../core";

const art = new Map<string, HTMLImageElement>();
let loading: Promise<void> | null = null;

/** Loads the pictures once; resolves when they are ready (or there are none). */
export function loadCityArt(): Promise<void> {
  loading ??= (async () => {
    const files = import.meta.glob<string>("./cityview/*.webp", { eager: true, query: "?url", import: "default" });
    await Promise.all(
      Object.entries(files).map(
        ([path, url]) =>
          new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              art.set(path.split("/").pop()!.replace(/\.webp$/, ""), img);
              resolve();
            };
            img.onerror = () => resolve();
            img.src = url;
          }),
      ),
    );
  })();
  return loading;
}

/** A building picture on a small canvas, or null when the pictures are not loaded. */
export function buildingArtCanvas(id: BuildingId, w: number, h: number): HTMLCanvasElement | null {
  const img = art.get(`bld-${id}`);
  if (!img) return null;
  const dpr = window.devicePixelRatio || 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(dpr, dpr);
  const k = Math.min((w * 0.94) / img.width, (h * 0.94) / img.height);
  ctx.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) / 2, img.width * k, img.height * k);
  return canvas;
}

/** True when the landscape and at least the palace are there to paint a city. */
export function hasCityArt(): boolean {
  return art.has("view-land") && art.has("bld-palace");
}

const ERAS = ["ancient", "ancient", "medieval", "medieval", "industrial", "modern", "modern"];
/** Structures that stand in the water when the city lies on the coast. */
const AT_SEA: BuildingId[] = ["harbour", "coastalFortress", "colossus", "lighthouse", "darwinVoyage"];

export interface CityViewInput {
  cityId: number;
  size: number;
  buildings: BuildingId[];
  /** Highest era the owner has reached, 0 = ancient. */
  era: number;
  coastal: boolean;
}

interface Slot {
  x: number;
  /** Ground line the picture stands on. */
  y: number;
  /** Size of an ordinary building in this row, in pixels. */
  size: number;
  row: number;
  used: boolean;
}

interface Placed {
  img: HTMLImageElement;
  x: number;
  y: number;
  size: number;
}

function seeded(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

/** Draws `img` scaled into a size x size box whose bottom centre is (x, y). */
function stand(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number): void {
  const k = size / Math.max(img.width, img.height);
  const w = img.width * k;
  const h = img.height * k;
  ctx.fillStyle = "rgba(30, 40, 20, 0.28)";
  ctx.beginPath();
  ctx.ellipse(x, y - h * 0.03, w * 0.46, Math.max(3, h * 0.07), 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.drawImage(img, x - w / 2, y - h, w, h);
}

/**
 * Paints the landscape at the full height of the canvas. A wide canvas is
 * filled on the sides with mirrored copies of the meadow (for the coast only
 * its land part, the sea stays on the right edge). Returns a function that
 * turns a point of the picture (shares 0..1) into canvas pixels.
 */
function paintLandscape(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  w: number,
  h: number,
  coast: boolean,
): (fx: number, fy: number) => [number, number] {
  const k = Math.max(h / img.height, coast ? 0 : w / img.width / 3);
  const dw = img.width * k;
  const dh = img.height * k;
  const oy = h - dh;
  const ox = coast ? w - dw : (w - dw) / 2;
  ctx.drawImage(img, ox, oy, dw, dh);
  // The part that may be repeated: all of it, or the meadow left of the shore.
  const part = coast ? SHORE : 1;
  const sw = img.width * part;
  const pw = dw * part;
  const mirrored = (x: number, flip: boolean) => {
    ctx.save();
    if (flip) {
      ctx.translate(x + pw, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(img, 0, 0, sw, img.height, 0, oy, pw, dh);
    } else {
      ctx.drawImage(img, 0, 0, sw, img.height, x, oy, pw, dh);
    }
    ctx.restore();
  };
  let flip = true;
  for (let x = ox - pw; x + pw > 0; x -= pw, flip = !flip) mirrored(x, flip);
  if (!coast) {
    flip = true;
    for (let x = ox + dw; x < w; x += pw, flip = !flip) mirrored(x, flip);
  }
  return (fx, fy) => [ox + fx * dw, oy + fy * dh];
}

/** Where the meadow meets the hills in both landscapes, as a share of the picture's height. */
const HORIZON = 0.31;
/** The coast landscape has sea right of this share of its width. */
const SHORE = 0.62;
/** Spots in the bay of the coast landscape (shares of the picture) for harbours and the like. */
const BAY: [number, number][] = [
  [0.8, 0.55],
  [0.93, 0.5],
  [0.88, 0.76],
  [0.74, 0.66],
  [0.97, 0.7],
];

export function drawCityView(ctx: CanvasRenderingContext2D, w: number, h: number, input: CityViewInput): void {
  const rand = seeded(input.cityId * 7919 + 13);
  const coast = input.coastal && art.get("view-coast");
  const at = paintLandscape(ctx, coast || art.get("view-land")!, w, h, !!coast);

  // Rows of places on the meadow, from the back to the front.
  const landRight = coast ? Math.min(w, at(SHORE, 0)[0]) : w;
  const horizon = Math.max(h * 0.12, at(0, HORIZON)[1] + h * 0.03);
  const rows = 4;
  // A young city with a few buildings gets them bigger, so the picture is not empty.
  const items = input.buildings.length + 1 + input.size;
  const grow = items < 10 ? 1.35 : items < 24 ? 1.15 : 1;
  const slots: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    const y = horizon + (h - horizon) * (0.2 + r * 0.22);
    const size = h * 0.34 * (0.6 + r * 0.14) * grow;
    const step = size * 0.82;
    const count = Math.max(2, Math.floor((landRight - size * 0.4) / step));
    const start = (landRight - (count - 1) * step) / 2 + (r % 2 ? step * 0.25 : -step * 0.25);
    for (let k = 0; k < count; k++) {
      slots.push({ x: start + k * step + (rand() - 0.5) * step * 0.25, y: y + (rand() - 0.5) * size * 0.06, size, row: r, used: false });
    }
  }
  const centre = landRight / 2;
  const byPrestige = (a: Slot, b: Slot) => Math.abs(a.x - centre) + Math.abs(a.row - 1.5) * 90 - (Math.abs(b.x - centre) + Math.abs(b.row - 1.5) * 90);

  const placed: Placed[] = [];
  const take = (img: HTMLImageElement, scale: number, pick: Slot | undefined) => {
    if (!pick) return;
    pick.used = true;
    // A wonder is wide: it also takes the place beside it.
    if (scale > 1.1) {
      const near = slots.find((s) => !s.used && s.row === pick.row && Math.abs(s.x - pick.x) < pick.size);
      if (near) near.used = true;
    }
    placed.push({ img, x: pick.x, y: pick.y, size: pick.size * scale });
  };

  const own = input.buildings.filter((b) => !b.startsWith("ss") && b !== "walls");
  const sea = input.coastal ? own.filter((b) => AT_SEA.includes(b)) : [];
  const land = own.filter((b) => !sea.includes(b));
  const wonders = land.filter((b) => BUILDINGS[b].wonder);
  const plain = land.filter((b) => !BUILDINGS[b].wonder);

  // Wonders get the best places, the palace the very best of the rest.
  for (const b of wonders) {
    const img = art.get(`bld-${b}`);
    if (img) take(img, 1.35, slots.filter((s) => !s.used && s.row <= 2).sort(byPrestige)[0]);
  }
  for (const b of ["palace", ...plain.filter((x) => x !== "palace")] as BuildingId[]) {
    if (!input.buildings.includes(b)) continue;
    const img = art.get(`bld-${b}`);
    if (!img) continue;
    const free = slots.filter((s) => !s.used);
    take(img, 1, b === "palace" ? free.sort(byPrestige)[0] : free[Math.floor(rand() * free.length)]);
  }

  // Houses: more people, more houses, picked from the owner's era.
  const era = ERAS[Math.min(input.era, ERAS.length - 1)]!;
  const houses = [1, 2, 3].map((n) => art.get(`house-${era}-${n}`)).filter((x): x is HTMLImageElement => !!x);
  if (houses.length) {
    let want = Math.min(slots.filter((s) => !s.used).length, 1 + Math.round(input.size * 0.9));
    const free = slots.filter((s) => !s.used).sort(byPrestige);
    for (const s of free) {
      if (want-- <= 0) break;
      take(houses[Math.floor(rand() * houses.length)]!, 0.66, s);
    }
  }

  // Structures in the bay.
  sea.forEach((b, n) => {
    const img = art.get(`bld-${b}`);
    const spot = BAY[n % BAY.length]!;
    if (!img) return;
    const [x, y] = at(spot[0], spot[1]);
    const size = h * 0.3 * (BUILDINGS[b].wonder ? 1.15 : 0.9);
    placed.push({ img, x: Math.min(w - size * 0.3, x), y: Math.min(h * 0.97, y + size * 0.35), size });
  });

  placed.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const p of placed) stand(ctx, p.img, p.x, p.y, p.size);

  // Walls along the front edge: a stone band with battlements and a few towers.
  const tower = input.buildings.includes("walls") ? art.get("bld-walls") : undefined;
  if (tower) drawWalls(ctx, tower, landRight, h);
}

function drawWalls(ctx: CanvasRenderingContext2D, tower: HTMLImageElement, right: number, h: number): void {
  const top = h * 0.94;
  const band = h - top;
  const g = ctx.createLinearGradient(0, top, 0, h);
  g.addColorStop(0, "#c2bba9");
  g.addColorStop(1, "#8a8372");
  ctx.fillStyle = g;
  ctx.fillRect(0, top, right, band);
  // Rows of stones.
  ctx.strokeStyle = "rgba(60, 52, 42, 0.45)";
  ctx.lineWidth = 1;
  const row = band / 2;
  for (let r = 0; r < 2; r++) {
    const y = top + r * row;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(right, y);
    for (let x = (r % 2) * row; x < right; x += row * 2) {
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + row);
    }
    ctx.stroke();
  }
  // Battlements.
  const merlon = band * 0.55;
  ctx.fillStyle = "#cfc8b6";
  ctx.strokeStyle = "rgba(40, 34, 28, 0.8)";
  for (let x = 3; x < right - merlon; x += merlon * 2) {
    ctx.fillRect(x, top - merlon * 0.75, merlon, merlon * 0.75);
    ctx.strokeRect(x, top - merlon * 0.75, merlon, merlon * 0.75);
  }
  ctx.beginPath();
  ctx.moveTo(0, top);
  ctx.lineTo(right, top);
  ctx.stroke();
  // Towers at both ends and in between.
  const size = h * 0.2;
  const count = Math.max(2, Math.round(right / (h * 0.8)) + 1);
  for (let k = 0; k < count; k++) {
    const x = size * 0.35 + ((right - size * 0.7) * k) / (count - 1);
    stand(ctx, tower, x, h + size * 0.06, size);
  }
}
