/**
 * The view into a city, built like a small isometric board in the same angle
 * as the Gemini pictures: grass tiles, streets around blocks of two by two
 * plots, a building or a house on every plot, a wonder on a whole block, and
 * walls around the town. Coastal cities get the sea on the right with the
 * harbour and other structures on the shore.
 *
 * Each picture stands on its own little plinth. The plinth is measured once
 * and scaled to the width of a plot, so plinths line up into blocks.
 * Positions come from the city id, so a city looks the same every time and
 * only changes when it builds something or grows.
 */
import { BUILDINGS, type BuildingId } from "../core";
import { buildingName } from "./i18n/names";

interface Art {
  img: HTMLImageElement;
  /** Opaque pixels at half resolution, for clicks on the picture. */
  mask: Uint8Array;
  /** The plinth in picture pixels: horizontal extent and the lowest row. */
  left: number;
  right: number;
  bottom: number;
}

const art = new Map<string, Art>();
let loading: Promise<void> | null = null;

/** Finds the plinth: the widest part of the picture just above its lowest point. */
function measure(img: HTMLImageElement): Art {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height).data;
  const span = (y: number): [number, number] | null => {
    let l = -1;
    let r = -1;
    for (let x = 0; x < c.width; x++) {
      if (data[(y * c.width + x) * 4 + 3]! > 128) {
        if (l < 0) l = x;
        r = x;
      }
    }
    return l < 0 ? null : [l, r];
  };
  const mw = Math.ceil(c.width / 2);
  const mask = new Uint8Array(mw * Math.ceil(c.height / 2));
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) mask[(y / 2) * mw + x / 2] = data[(y * c.width + x) * 4 + 3]! > 100 ? 1 : 0;
  let bottom = c.height - 1;
  while (bottom > 0 && !span(bottom)) bottom--;
  const widths: [number, number][] = [];
  for (let k = 0; k < Math.min(c.height, bottom); k++) widths.push(span(bottom - k) ?? [0, 0]);
  const w = (k: number) => (widths[k] ? widths[k]![1] - widths[k]![0] : 0);
  for (let k = 4; k + 6 < widths.length; k++) {
    if (w(k + 6) - w(k) < 3 && w(k) > c.width * 0.3) return { img, mask, left: widths[k]![0], right: widths[k]![1], bottom };
  }
  return { img, mask, left: 0, right: c.width - 1, bottom };
}

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
              art.set(path.split("/").pop()!.replace(/\.webp$/, ""), measure(img));
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

/** True when there are pictures to build a city from. */
export function hasCityArt(): boolean {
  return art.has("bld-palace") && art.has("house-ancient-1");
}

/** A building picture on a small canvas, or null when the pictures are not loaded. */
export function buildingArtCanvas(id: BuildingId, w: number, h: number): HTMLCanvasElement | null {
  const a = art.get(`bld-${id}`);
  if (!a) return null;
  const img = a.img;
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

const ERAS = ["ancient", "ancient", "medieval", "medieval", "industrial", "modern", "modern"];
/** Structures that stand on the shore when the city lies on the coast. */
const AT_SEA: BuildingId[] = ["harbour", "coastalFortress", "colossus", "lighthouse", "darwinVoyage"];
/** Height of a tile as a share of its width, measured on the Gemini plinths. */
const ISO = 0.54;
/** Streets run along every third row and column; the plots between form blocks of two by two. */
const BLOCK = 3;

export interface CityViewInput {
  cityId: number;
  size: number;
  buildings: BuildingId[];
  /** Highest era the owner has reached, 0 = ancient. */
  era: number;
  coastal: boolean;
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

/** Pseudo-random 0..1 for a tile, stable between paints. */
function tileNoise(i: number, j: number, k: number): number {
  const h = Math.sin(i * 12.9898 + j * 78.233 + k * 37.719) * 43758.5453;
  return h - Math.floor(h);
}

type Ground = "grass" | "road" | "water" | "sand";

interface Board {
  tw: number;
  th: number;
  /** Screen position of the top corner of tile (0, 0). */
  ox: number;
  oy: number;
}

/** Top corner of tile (i, j) on screen. */
function corner(b: Board, i: number, j: number): [number, number] {
  return [b.ox + ((i - j) * b.tw) / 2, b.oy + ((i + j) * b.th) / 2];
}

function diamond(ctx: CanvasRenderingContext2D, b: Board, i: number, j: number, w = 1): void {
  const [x, y] = corner(b, i, j);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + (b.tw * w) / 2, y + (b.th * w) / 2);
  ctx.lineTo(x, y + b.th * w);
  ctx.lineTo(x - (b.tw * w) / 2, y + (b.th * w) / 2);
  ctx.closePath();
}

const GRASS = ["#7fae4a", "#86b44f", "#78a646", "#8cb955"];
const ROAD_BY_ERA = ["#b49a6e", "#b49a6e", "#a8a191", "#a8a191", "#8f8a80", "#77767a", "#77767a"];

function paintTile(ctx: CanvasRenderingContext2D, b: Board, i: number, j: number, ground: Ground, era: number): void {
  const n = tileNoise(i, j, 1);
  diamond(ctx, b, i, j);
  if (ground === "grass") ctx.fillStyle = GRASS[Math.floor(n * GRASS.length)]!;
  else if (ground === "road") ctx.fillStyle = ROAD_BY_ERA[Math.min(era, ROAD_BY_ERA.length - 1)]!;
  else if (ground === "sand") ctx.fillStyle = "#e3cf98";
  else ctx.fillStyle = n > 0.5 ? "#3f8fc0" : "#4596c6";
  ctx.fill();
  // A faint edge so the board reads as tiles, as in the pictures' plinths.
  ctx.strokeStyle = ground === "water" ? "rgba(255, 255, 255, 0.08)" : "rgba(40, 50, 20, 0.12)";
  ctx.lineWidth = 1;
  ctx.stroke();
  const [x, y] = corner(b, i, j);
  if (ground === "grass" && n > 0.55) {
    // Tufts of grass.
    ctx.strokeStyle = "rgba(50, 90, 30, 0.45)";
    ctx.beginPath();
    for (let k = 0; k < 3; k++) {
      const gx = x + (tileNoise(i, j, 10 + k) - 0.5) * b.tw * 0.6;
      const gy = y + b.th * (0.35 + tileNoise(i, j, 20 + k) * 0.4);
      ctx.moveTo(gx - 2, gy - 3);
      ctx.lineTo(gx, gy);
      ctx.lineTo(gx + 2, gy - 3);
    }
    ctx.stroke();
  } else if (ground === "road" && era >= 2) {
    // Paving stones or road markings.
    ctx.strokeStyle = era >= 4 ? "rgba(240, 230, 200, 0.35)" : "rgba(70, 60, 50, 0.25)";
    ctx.beginPath();
    ctx.moveTo(x - b.tw * 0.18, y + b.th * 0.41);
    ctx.lineTo(x + b.tw * 0.18, y + b.th * 0.59);
    ctx.stroke();
  } else if (ground === "water" && n > 0.6) {
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(x - b.tw * 0.15, y + b.th * 0.5);
    ctx.quadraticCurveTo(x, y + b.th * 0.38, x + b.tw * 0.15, y + b.th * 0.5);
    ctx.stroke();
  }
}

/** Where `stand` would draw the picture, without drawing it. */
function standRect(b: Board, a: Art, i: number, j: number, cells: number, scale = 1): Hit["rect"] {
  const [x, y] = corner(b, i, j);
  const plinth = a.right - a.left + 1;
  const k = ((b.tw * cells) / plinth) * scale;
  const centreX = (a.left + a.right) / 2;
  return { x: x - centreX * k, y: y + b.th * cells - a.bottom * k - (b.th * cells * (1 - scale)) / 2, w: a.img.width * k, h: a.img.height * k };
}

/**
 * Stands a picture on the tile whose top corner is (i, j); `cells` tiles wide
 * (1 for a plot, 2 for a block). The plinth is scaled to the tiles' width.
 */
function stand(ctx: CanvasRenderingContext2D, b: Board, a: Art, i: number, j: number, cells: number, scale = 1): Hit["rect"] {
  const [x, y] = corner(b, i, j);
  const plinth = a.right - a.left + 1;
  const k = ((b.tw * cells) / plinth) * scale;
  const bottomY = y + b.th * cells;
  const centreX = (a.left + a.right) / 2;
  // The picture's plinth centre goes over the tile's centre, its lowest point onto the tile's lowest corner.
  const dx = x - centreX * k;
  const dy = bottomY - a.bottom * k - (b.th * cells * (1 - scale)) / 2;
  ctx.drawImage(a.img, dx, dy, a.img.width * k, a.img.height * k);
  return { x: dx, y: dy, w: a.img.width * k, h: a.img.height * k };
}

/** Something drawn in the view that the player can click. */
export interface Hit {
  /** Encyclopedia entry, e.g. "bld-temple". */
  entry: string;
  /** Name shown when the mouse is over it. */
  name: string;
  rect: { x: number; y: number; w: number; h: number };
  art: Art;
}

/** The topmost picture under a point of the view, if any. */
export function hitAt(hits: Hit[], x: number, y: number): Hit | null {
  for (let k = hits.length - 1; k >= 0; k--) {
    const h = hits[k]!;
    const { rect, art } = h;
    if (x < rect.x || y < rect.y || x >= rect.x + rect.w || y >= rect.y + rect.h) continue;
    const px = Math.floor((((x - rect.x) / rect.w) * art.img.width) / 2);
    const py = Math.floor((((y - rect.y) / rect.h) * art.img.height) / 2);
    if (art.mask[py * Math.ceil(art.img.width / 2) + px]) return h;
  }
  return null;
}

interface Lot {
  /** Encyclopedia entry and name; houses have none. */
  entry?: string;
  name?: string;
  i: number;
  j: number;
  /** 1 for a plot, 2 for a whole block. */
  cells: number;
  art: Art;
  scale: number;
}

/** Everything about the town's layout, in tiles; it depends only on the city, never on the view's size. */
interface Plan {
  lots: Lot[];
  used: { a: number; b: number }[];
  roads: Set<string>;
  /** On the coast: tiles right of this x (in half-tile units of the board) are sea. */
  seaX: number | null;
  walls: ReturnType<typeof townWalls> | null;
  era: number;
  cityId: number;
}

/** Screen x and y of a tile corner on a board with tiles one unit wide. */
function unitCorner(i: number, j: number): [number, number] {
  return [(i - j) / 2, ((i + j) * ISO) / 2];
}

function planCity(input: CityViewInput): Plan {
  const rand = seeded(input.cityId * 7919 + 13);
  const entryOf = (b: BuildingId) => ({ entry: `${BUILDINGS[b].wonder ? "wdr" : "bld"}-${b}`, name: buildingName(b) });
  const own = input.buildings.filter((b) => !b.startsWith("ss") && b !== "walls");
  const shore = input.coastal ? own.filter((b) => AT_SEA.includes(b)) : [];
  const land = own.filter((b) => !shore.includes(b));
  const wonders = land.filter((b) => BUILDINGS[b].wonder);
  const plain = land.filter((b) => !BUILDINGS[b].wonder);
  const houses = 1 + Math.round(input.size * 0.9);
  // Plots needed: a wonder takes a whole block (four plots).
  const plots = plain.length + houses + wonders.length * 4;
  const blocks = Math.max(2, Math.ceil((plots * 1.15) / 4));

  // Blocks around the centre, nearest first, the town spreading more sideways than in depth.
  const reachBlocks = Math.ceil(Math.sqrt(blocks)) + 3;
  const distance = (x: number, y: number) => Math.hypot(x / 2.4, y);
  const allBlocks: { a: number; b: number; d: number }[] = [];
  for (let a = -reachBlocks; a <= reachBlocks; a++) {
    for (let b = -reachBlocks; b <= reachBlocks; b++) {
      const [x, y] = unitCorner(a * BLOCK + 2, b * BLOCK + 2);
      allBlocks.push({ a, b, d: distance(x, y) + rand() * 0.05 });
    }
  }
  // Grow the town block by block from the middle, always next to a block it already has.
  allBlocks.sort((p, q) => p.d - q.d);
  const used: typeof allBlocks = [allBlocks[0]!];
  const touches = (p: { a: number; b: number }) => used.some((u) => Math.abs(u.a - p.a) + Math.abs(u.b - p.b) === 1);
  while (used.length < blocks) {
    const nextBlock = allBlocks.find((p) => !used.includes(p) && touches(p));
    if (!nextBlock) break;
    used.push(nextBlock);
  }

  const lots: Lot[] = [];
  const free: { i: number; j: number; d: number }[] = [];
  let next = 0;
  for (const b of wonders) {
    const a = art.get(`bld-${b}`);
    const blk = used[next];
    if (!a || !blk) continue;
    next++;
    lots.push({ ...entryOf(b), i: blk.a * BLOCK + 1, j: blk.b * BLOCK + 1, cells: 2, art: a, scale: 0.96 });
  }
  for (const blk of used.slice(next)) {
    for (const [di, dj] of [
      [1, 1],
      [2, 1],
      [1, 2],
      [2, 2],
    ] as const) {
      const i = blk.a * BLOCK + di;
      const j = blk.b * BLOCK + dj;
      const [x, y] = unitCorner(i, j);
      free.push({ i, j, d: distance(x, y) + rand() * 0.08 });
    }
  }
  free.sort((p, q) => p.d - q.d);
  const take = () => free.shift();
  const order = ["palace", ...plain.filter((x) => x !== "palace")] as BuildingId[];
  for (const b of order) {
    if (!input.buildings.includes(b)) continue;
    const a = art.get(`bld-${b}`);
    const spot = take();
    if (a && spot) lots.push({ ...entryOf(b), i: spot.i, j: spot.j, cells: 1, art: a, scale: 0.94 });
  }
  const era = ERAS[Math.min(input.era, ERAS.length - 1)]!;
  const homes = [1, 2, 3].map((n) => art.get(`house-${era}-${n}`)).filter((x): x is Art => !!x);
  for (let k = 0; k < houses && homes.length; k++) {
    const spot = take();
    if (!spot) break;
    lots.push({ i: spot.i, j: spot.j, cells: 1, art: homes[Math.floor(rand() * homes.length)]!, scale: 0.86 + rand() * 0.08 });
  }

  const roads = new Set<string>();
  for (const blk of used) {
    for (let d = 0; d <= BLOCK; d++) {
      roads.add(`${blk.a * BLOCK + d},${blk.b * BLOCK}`);
      roads.add(`${blk.a * BLOCK + d},${blk.b * BLOCK + BLOCK}`);
      roads.add(`${blk.a * BLOCK},${blk.b * BLOCK + d}`);
      roads.add(`${blk.a * BLOCK + BLOCK},${blk.b * BLOCK + d}`);
    }
  }

  // The sea begins a little right of the town, with shore structures in its shallows.
  let seaX: number | null = null;
  if (input.coastal) {
    seaX = Math.max(...used.map((u) => unitCorner(u.a * BLOCK + BLOCK + 1, u.b * BLOCK)[0])) + 0.9;
    const plan = { seaX, cityId: input.cityId } as Plan;
    const spots: { i: number; j: number; y: number }[] = [];
    const [, cy] = unitCorner(1, 1);
    for (let i = -40; i <= 40; i++) {
      for (let j = -40; j <= 40; j++) {
        if (isSea(plan, i, j) && !isSea(plan, i - 1, j) && !isSea(plan, i, j + 1)) spots.push({ i, j, y: unitCorner(i, j)[1] });
      }
    }
    spots.sort((p, q) => Math.abs(p.y - cy) - Math.abs(q.y - cy) || p.i - q.i);
    shore.forEach((b, n) => {
      const a = art.get(`bld-${b}`);
      const spot = spots[n * 3];
      if (a && spot) lots.push({ ...entryOf(b), i: spot.i, j: spot.j, cells: 1, art: a, scale: BUILDINGS[b].wonder ? 1.35 : 1.15 });
    });
  }

  // Pictures from the back to the front: by the row of their lowest corner.
  lots.sort((p, q) => p.i + p.j + p.cells * 2 - (q.i + q.j + q.cells * 2) || p.i - q.i);
  return { lots, used, roads, seaX, walls: input.buildings.includes("walls") ? townWalls(used) : null, era: input.era, cityId: input.cityId };
}

function isSea(plan: Pick<Plan, "seaX" | "cityId">, i: number, j: number): boolean {
  if (plan.seaX === null) return false;
  const [x, y] = unitCorner(i, j);
  // A gently curving shore.
  return x > plan.seaX + Math.sin(y * 2.2 + plan.cityId) * 0.45;
}

let cachedPlan: { key: string; plan: Plan } | null = null;

export function drawCityView(ctx: CanvasRenderingContext2D, w: number, h: number, input: CityViewInput): Hit[] {
  const key = JSON.stringify(input);
  if (cachedPlan?.key !== key) cachedPlan = { key, plan: planCity(input) };
  const plan = cachedPlan.plan;

  // Fit the town into the view: the layout stays, only the scale changes.
  const unit: Board = { tw: 1, th: ISO, ox: 0, oy: 0 };
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const grow = (r: { x: number; y: number; w: number; h: number }) => {
    x0 = Math.min(x0, r.x);
    y0 = Math.min(y0, r.y);
    x1 = Math.max(x1, r.x + r.w);
    y1 = Math.max(y1, r.y + r.h);
  };
  for (const lot of plan.lots) grow(standRect(unit, lot.art, lot.i, lot.j, lot.cells, lot.scale));
  for (const u of plan.used) {
    const [lx] = unitCorner(u.a * BLOCK, u.b * BLOCK + BLOCK + 1);
    const [rx] = unitCorner(u.a * BLOCK + BLOCK + 1, u.b * BLOCK);
    const [, ty] = unitCorner(u.a * BLOCK, u.b * BLOCK);
    const [, by] = unitCorner(u.a * BLOCK + BLOCK + 1, u.b * BLOCK + BLOCK + 1);
    grow({ x: lx, y: ty - ISO, w: rx - lx, h: by - ty + ISO });
  }
  if (plan.seaX !== null) x1 = Math.max(x1, plan.seaX + 1.6);
  const tw = Math.min((w * 0.94) / (x1 - x0), (h * 0.9) / (y1 - y0), h * 0.3);
  const board: Board = { tw, th: tw * ISO, ox: 0, oy: 0 };
  board.ox = w / 2 - ((x0 + x1) / 2) * tw;
  board.oy = h / 2 - ((y0 + y1) / 2) * tw;

  // Ground over the whole view.
  ctx.fillStyle = GRASS[0]!;
  ctx.fillRect(0, 0, w, h);
  const reach = Math.ceil(w / tw + h / board.th) + 4;
  // The tile at the middle of the view.
  const mx = (w / 2 - board.ox) / (tw / 2);
  const my = (h / 2 - board.oy) / (board.th / 2);
  const ci = Math.round((mx + my) / 2);
  const cj = Math.round((my - mx) / 2);
  for (let s = ci + cj - reach; s <= ci + cj + reach; s++) {
    // Rows of equal i + j, from the back to the front.
    for (let i = ci - reach; i <= ci + reach; i++) {
      const j = s - i;
      const [x, y] = corner(board, i, j);
      if (x < -tw || x > w + tw || y < -board.th * 2 || y > h + board.th) continue;
      let g: Ground = plan.roads.has(`${i},${j}`) ? "road" : "grass";
      if (isSea(plan, i, j)) g = "water";
      else if (plan.seaX !== null && (isSea(plan, i + 1, j) || isSea(plan, i, j - 1) || isSea(plan, i + 1, j - 1))) g = g === "road" ? "road" : "sand";
      paintTile(ctx, board, i, j, g, plan.era);
    }
  }

  const hits: Hit[] = [];
  const wallEntry = { entry: "bld-walls", name: buildingName("walls") };
  if (plan.walls) for (const seg of plan.walls.back) drawWall(ctx, board, seg, "back");
  if (plan.walls) for (const [i, j] of plan.walls.towers) drawTower(ctx, board, i, j);
  for (const lot of plan.lots) {
    shadow(ctx, board, lot);
    const rect = stand(ctx, board, lot.art, lot.i, lot.j, lot.cells, lot.scale);
    if (lot.entry) hits.push({ entry: lot.entry, name: lot.name ?? "", rect, art: lot.art });
  }
  if (plan.walls) {
    for (const seg of plan.walls.front) drawWall(ctx, board, seg, "front");
    for (const [i, j] of plan.walls.frontTowers) drawTower(ctx, board, i, j);
    const tower = art.get("bld-walls");
    // The wall itself has no picture to click; its corner towers stand for it.
    if (tower) {
      for (const [i, j] of [...plan.walls.towers, ...plan.walls.frontTowers]) {
        const [x, y] = corner(board, i, j);
        hits.push({ ...wallEntry, rect: { x: x - tw * 0.2, y: y - board.th * 1.6, w: tw * 0.4, h: board.th * 1.8 }, art: solidArt(tower) });
      }
    }
  }
  return hits;
}

/** The picture of a tower stood in for by a fully opaque mask, so its whole box is clickable. */
function solidArt(a: Art): Art {
  return { ...a, mask: new Uint8Array(a.mask.length).fill(1) };
}

type Segment = [number, number, number, number];

/**
 * The wall around the town is one rectangle around all its blocks, just
 * outside the streets, with a round tower in each corner. The two sides
 * facing away from the viewer are drawn behind the buildings, the other two
 * in front of them.
 */
function townWalls(used: { a: number; b: number }[]): { back: Segment[]; front: Segment[]; towers: [number, number][]; frontTowers: [number, number][] } {
  const as = used.map((u) => u.a);
  const bs = used.map((u) => u.b);
  const i0 = Math.min(...as) * BLOCK;
  const i1 = Math.max(...as) * BLOCK + BLOCK + 1;
  const j0 = Math.min(...bs) * BLOCK;
  const j1 = Math.max(...bs) * BLOCK + BLOCK + 1;
  return {
    back: [
      [i0, j0, i0, j1],
      [i0, j0, i1, j0],
    ],
    front: [
      [i1, j0, i1, j1],
      [i0, j1, i1, j1],
    ],
    towers: [[i0, j0]],
    frontTowers: [
      [i0, j1],
      [i1, j0],
      [i1, j1],
    ],
  };
}

/** A soft shadow on the ground behind and right of a picture; light comes from the upper left. */
function shadow(ctx: CanvasRenderingContext2D, b: Board, lot: Lot): void {
  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = "#1d2a10";
  diamond(ctx, b, lot.i + 0.15, lot.j - 0.05, lot.cells);
  ctx.fill();
  ctx.restore();
}

const STONE_LIGHT = "#d9d0bb";
const STONE = "#b8ae97";
const STONE_DARK = "#8c836f";
const MORTAR = "rgba(70, 60, 48, 0.35)";
const OUTLINE = "rgba(45, 38, 30, 0.9)";

/**
 * One straight piece of the town wall between two tile corners, drawn as a
 * stone wall with a walkway on top and battlements on its outer edge.
 */
function drawWall(ctx: CanvasRenderingContext2D, b: Board, [ai, aj, bi, bj]: Segment, side: "back" | "front"): void {
  const height = b.th * 0.62;
  const [x1, y1] = corner(b, ai, aj);
  const [x2, y2] = corner(b, bi, bj);
  // The wall is a little thick: its top runs a short step towards the inside of the town.
  const alongI = aj === bj;
  const inward = side === "back" ? 1 : -1;
  const tx = (alongI ? -b.tw : b.tw) * 0.07 * inward;
  const ty = b.th * 0.07 * inward;
  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE;
  // Face towards the viewer.
  const face = ctx.createLinearGradient(0, Math.min(y1, y2) - height, 0, Math.max(y1, y2));
  face.addColorStop(0, STONE);
  face.addColorStop(1, STONE_DARK);
  ctx.fillStyle = face;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 - height);
  ctx.lineTo(x1, y1 - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Courses of stone.
  ctx.strokeStyle = MORTAR;
  ctx.lineWidth = 0.8;
  const rows = 4;
  const len = Math.hypot(x2 - x1, y2 - y1);
  const blocks = Math.max(2, Math.round(len / (b.tw * 0.16)));
  ctx.beginPath();
  for (let r = 1; r < rows; r++) {
    const h = (height * r) / rows;
    ctx.moveTo(x1, y1 - h);
    ctx.lineTo(x2, y2 - h);
  }
  for (let r = 0; r < rows; r++) {
    for (let k = r % 2 ? 0.5 : 1; k < blocks; k++) {
      const t = k / blocks;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      ctx.moveTo(x, y - (height * r) / rows);
      ctx.lineTo(x, y - (height * (r + 1)) / rows);
    }
  }
  ctx.stroke();
  // Walkway on top.
  ctx.fillStyle = STONE_LIGHT;
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x1, y1 - height);
  ctx.lineTo(x2, y2 - height);
  ctx.lineTo(x2 + tx, y2 - height + ty);
  ctx.lineTo(x1 + tx, y1 - height + ty);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Battlements along the outer edge.
  const merlons = Math.max(3, Math.round(len / (b.tw * 0.11)));
  const mh = height * 0.32;
  for (let k = 0; k < merlons; k += 2) {
    const t0 = k / merlons;
    const t1 = (k + 1) / merlons;
    const ax = x1 + (x2 - x1) * t0;
    const ay = y1 + (y2 - y1) * t0 - height;
    const bx = x1 + (x2 - x1) * t1;
    const by = y1 + (y2 - y1) * t1 - height;
    ctx.fillStyle = STONE;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by - mh);
    ctx.lineTo(ax, ay - mh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = STONE_LIGHT;
    ctx.beginPath();
    ctx.moveTo(ax, ay - mh);
    ctx.lineTo(bx, by - mh);
    ctx.lineTo(bx + tx * 0.6, by - mh + ty * 0.6);
    ctx.lineTo(ax + tx * 0.6, ay - mh + ty * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

/** A round stone tower with battlements and a pointed roof where the wall turns. */
function drawTower(ctx: CanvasRenderingContext2D, b: Board, i: number, j: number): void {
  const [x, y] = corner(b, i, j);
  const rx = b.tw * 0.17;
  const ry = rx * ISO;
  const height = b.th * 1.15;
  const top = y - height;
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE;
  // Shadow on the ground.
  ctx.fillStyle = "rgba(29, 42, 16, 0.25)";
  ctx.beginPath();
  ctx.ellipse(x + rx * 0.5, y + ry * 0.3, rx * 1.3, ry * 1.2, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  const body = ctx.createLinearGradient(x - rx, 0, x + rx, 0);
  body.addColorStop(0, STONE_LIGHT);
  body.addColorStop(0.55, STONE);
  body.addColorStop(1, STONE_DARK);
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - rx, top);
  ctx.lineTo(x - rx, y);
  ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(x + rx, top);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Courses of stone and a window slit.
  ctx.strokeStyle = MORTAR;
  ctx.beginPath();
  for (let k = 1; k < 5; k++) ctx.ellipse(x, top + ((y - top) * k) / 5, rx, ry, 0, 0, Math.PI);
  ctx.stroke();
  ctx.fillStyle = "#2b241c";
  ctx.fillRect(x - rx * 0.12, top + height * 0.35, rx * 0.24, height * 0.16);
  // Battlements.
  ctx.strokeStyle = OUTLINE;
  const crown = rx * 1.12;
  ctx.fillStyle = STONE_LIGHT;
  ctx.beginPath();
  ctx.ellipse(x, top, crown, crown * ISO, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  for (let k = 0; k < 5; k++) {
    const a = Math.PI * (0.1 + (k * 0.8) / 4);
    const mx = x + Math.cos(a) * crown * 0.92;
    const my = top + Math.sin(a) * crown * ISO * 0.92;
    ctx.fillStyle = STONE;
    ctx.fillRect(mx - rx * 0.16, my - ry * 1.3, rx * 0.32, ry * 1.3);
    ctx.strokeRect(mx - rx * 0.16, my - ry * 1.3, rx * 0.32, ry * 1.3);
  }
  // Pointed roof.
  ctx.fillStyle = "#9c3b2c";
  ctx.beginPath();
  ctx.moveTo(x - crown * 0.85, top - ry * 0.4);
  ctx.lineTo(x, top - height * 0.75);
  ctx.lineTo(x + crown * 0.85, top - ry * 0.4);
  ctx.ellipse(x, top - ry * 0.4, crown * 0.85, crown * 0.85 * ISO, 0, 0, Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
