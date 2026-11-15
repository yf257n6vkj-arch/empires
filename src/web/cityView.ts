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

export function drawCityView(ctx: CanvasRenderingContext2D, w: number, h: number, input: CityViewInput): Hit[] {
  const hits: Hit[] = [];
  const entryOf = (b: BuildingId) => ({ entry: `${BUILDINGS[b].wonder ? "wdr" : "bld"}-${b}`, name: BUILDINGS[b].name });
  const rand = seeded(input.cityId * 7919 + 13);
  const own = input.buildings.filter((b) => !b.startsWith("ss") && b !== "walls");
  const shore = input.coastal ? own.filter((b) => AT_SEA.includes(b)) : [];
  const land = own.filter((b) => !shore.includes(b));
  const wonders = land.filter((b) => BUILDINGS[b].wonder);
  const plain = land.filter((b) => !BUILDINGS[b].wonder);
  const houses = 1 + Math.round(input.size * 0.9);
  // Plots needed: a wonder takes a whole block (four plots).
  const plots = plain.length + houses + wonders.length * 4;
  const blocks = Math.max(2, Math.ceil((plots * 1.15) / 4));

  // Tile size: the town's blocks together should cover about half of the view.
  // A block of BLOCK x BLOCK tiles covers BLOCK² × tw × th / 2 pixels.
  const tw = Math.max(h * 0.16, Math.min(h * 0.32, Math.sqrt((0.5 * w * h) / (blocks * BLOCK * BLOCK * ISO * 0.5))));
  const board: Board = { tw, th: tw * ISO, ox: 0, oy: 0 };
  board.ox = w * (input.coastal ? 0.42 : 0.5);
  board.oy = h * 0.52 - board.th / 2;

  // Tiles that cover the canvas.
  const reach = Math.ceil(w / tw + h / board.th) + 2;
  const seaFrom = w * 0.74;
  const isSea = (i: number, j: number) => {
    if (!input.coastal) return false;
    const [x, y] = corner(board, i, j);
    // A gently curving shore.
    return x > seaFrom + Math.sin(y / (h * 0.25) + input.cityId) * w * 0.03;
  };

  // Blocks of the town around the centre, nearest first. Block (a, b) has plots
  // (a*BLOCK+1 .. a*BLOCK+2, b*BLOCK+1 .. b*BLOCK+2).
  const half = Math.ceil((w / tw + h / board.th) / BLOCK) + 1;
  const allBlocks: { a: number; b: number; d: number }[] = [];
  for (let a = -half; a <= half; a++) {
    for (let bb = -half; bb <= half; bb++) {
      const [x, y] = corner(board, a * BLOCK + 1, bb * BLOCK + 1);
      // Blocks must be on land and inside the view.
      if (isSea(a * BLOCK + 2, bb * BLOCK + 2) || isSea(a * BLOCK + 1, bb * BLOCK + 2) || isSea(a * BLOCK + 2, bb * BLOCK + 1)) continue;
      if (y < h * 0.16 || y + board.th * 2 > h * 0.97 || x - tw < 0 || x + tw > w) continue;
      // Distance in the view, squeezed sideways, so the town spreads along the wide view.
      const [cx, cy] = corner(board, a * BLOCK + 2, bb * BLOCK + 2);
      const d = Math.hypot((cx - board.ox) / w, ((cy - board.oy) / h) * 1.6) + rand() * 0.02;
      allBlocks.push({ a, b: bb, d });
    }
  }
  // Grow the town block by block from the middle, always next to a block it already has.
  allBlocks.sort((p, q) => p.d - q.d);
  const used: typeof allBlocks = allBlocks.length ? [allBlocks[0]!] : [];
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
      const [cx, cy] = corner(board, i, j);
      free.push({ i, j, d: Math.hypot((cx - board.ox) / w, ((cy - board.oy) / h) * 1.6) + rand() * 0.04 });
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

  // Ground: streets around the town's blocks, sea and sand on the coast, grass elsewhere.
  const roads = new Set<string>();
  for (const blk of used) {
    for (let d = 0; d <= BLOCK; d++) {
      roads.add(`${blk.a * BLOCK + d},${blk.b * BLOCK}`);
      roads.add(`${blk.a * BLOCK + d},${blk.b * BLOCK + BLOCK}`);
      roads.add(`${blk.a * BLOCK},${blk.b * BLOCK + d}`);
      roads.add(`${blk.a * BLOCK + BLOCK},${blk.b * BLOCK + d}`);
    }
  }
  ctx.fillStyle = GRASS[0]!;
  ctx.fillRect(0, 0, w, h);
  for (let s = -reach; s <= reach; s++) {
    // Rows of equal i + j, from the back to the front.
    for (let i = -reach; i <= reach; i++) {
      const j = s - i;
      const [x, y] = corner(board, i, j);
      if (x < -tw || x > w + tw || y < -board.th * 2 || y > h + board.th) continue;
      let g: Ground = roads.has(`${i},${j}`) ? "road" : "grass";
      if (isSea(i, j)) g = "water";
      else if (input.coastal && (isSea(i + 1, j) || isSea(i, j - 1) || isSea(i + 1, j - 1))) g = g === "road" ? "road" : "sand";
      paintTile(ctx, board, i, j, g, input.era);
    }
  }

  // Shore structures stand in the shallow water along the coast.
  const shoreSpots: { i: number; j: number; y: number }[] = [];
  for (let s = -reach; s <= reach; s++) {
    for (let i = -reach; i <= reach; i++) {
      const j = s - i;
      const [x, y] = corner(board, i, j);
      if (y < h * 0.12 || y + board.th > h * 0.95 || x > w - tw * 0.4) continue;
      if (isSea(i, j) && !isSea(i - 1, j) && !isSea(i, j + 1)) shoreSpots.push({ i, j, y });
    }
  }
  shoreSpots.sort((p, q) => Math.abs(p.y - h * 0.55) - Math.abs(q.y - h * 0.55));
  shore.forEach((b, n) => {
    const a = art.get(`bld-${b}`);
    // Spread them out along the shore.
    const spot = shoreSpots[n * 3];
    if (a && spot) lots.push({ ...entryOf(b), i: spot.i, j: spot.j, cells: 1, art: a, scale: BUILDINGS[b].wonder ? 1.35 : 1.15 });
  });

  const tower = input.buildings.includes("walls") ? art.get("bld-walls") : undefined;
  const walls = tower ? townWalls(used) : null;
  if (walls) for (const seg of walls.back) drawWall(ctx, board, seg);
  if (tower && walls) for (const [i, j] of walls.towers) lots.push({ ...entryOf("walls"), i: i - 0.5, j: j - 0.5, cells: 1, art: tower, scale: TOWER });

  // Pictures from the back to the front: by the row of their lowest corner.
  lots.sort((p, q) => p.i + p.j + p.cells * 2 - (q.i + q.j + q.cells * 2) || p.i - q.i);
  for (const lot of lots) {
    if (lot.art !== tower) shadow(ctx, board, lot);
    const rect = stand(ctx, board, lot.art, lot.i, lot.j, lot.cells, lot.scale);
    if (lot.entry) hits.push({ entry: lot.entry, name: lot.name ?? "", rect, art: lot.art });
  }

  if (tower && walls) {
    for (const seg of walls.front) drawWall(ctx, board, seg);
    // Towers on the front walls stand over them.
    for (const [i, j] of walls.frontTowers) {
      const rect = stand(ctx, board, tower, i - 0.5, j - 0.5, 1, TOWER);
      hits.push({ ...entryOf("walls"), rect, art: tower });
    }
  }
  return hits;
}

type Segment = [number, number, number, number];
/** Size of a wall tower against a plot. */
const TOWER = 0.62;

/**
 * The wall around the town follows the outer edge of its blocks, just outside
 * the streets. Sides facing away from the viewer are drawn behind the
 * buildings, the others in front. Towers stand where wall segments end.
 */
function townWalls(used: { a: number; b: number }[]): { back: Segment[]; front: Segment[]; towers: [number, number][]; frontTowers: [number, number][] } {
  const has = new Set(used.map((u) => `${u.a},${u.b}`));
  const back: Segment[] = [];
  const front: Segment[] = [];
  for (const { a, b } of used) {
    const i0 = a * BLOCK;
    const i1 = a * BLOCK + BLOCK + 1;
    const j0 = b * BLOCK;
    const j1 = b * BLOCK + BLOCK + 1;
    if (!has.has(`${a - 1},${b}`)) back.push([i0, j0, i0, j1]);
    if (!has.has(`${a},${b - 1}`)) back.push([i0, j0, i1, j0]);
    if (!has.has(`${a + 1},${b}`)) front.push([i1, j0, i1, j1]);
    if (!has.has(`${a},${b + 1}`)) front.push([i0, j1, i1, j1]);
  }
  // Towers stand only where the wall turns: a point where a wall along i meets a wall along j.
  const dirs = new Map<string, { p: [number, number]; alongI: boolean; alongJ: boolean }>();
  for (const [ai, aj, bi, bj] of [...back, ...front]) {
    for (const p of [
      [ai, aj],
      [bi, bj],
    ] as [number, number][]) {
      const key = `${p[0]},${p[1]}`;
      const d = dirs.get(key) ?? { p, alongI: false, alongJ: false };
      if (ai === bi) d.alongJ = true;
      else d.alongI = true;
      dirs.set(key, d);
    }
  }
  const corners = new Map([...dirs].filter(([, d]) => d.alongI && d.alongJ).map(([k, d]) => [k, d.p] as const));
  const frontKeys = new Set(front.flatMap(([ai, aj, bi, bj]) => [`${ai},${aj}`, `${bi},${bj}`]));
  const all = corners;
  const frontEnds = new Map([...corners].filter(([k]) => frontKeys.has(k)));
  return {
    back,
    front,
    towers: [...all.entries()].filter(([k]) => !frontEnds.has(k)).map(([, p]) => p),
    frontTowers: [...frontEnds.values()],
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

/** One straight piece of the town wall between two tile corners. */
function drawWall(ctx: CanvasRenderingContext2D, b: Board, [ai, aj, bi, bj]: Segment): void {
  const height = b.th * 0.55;
  const [x1, y1] = corner(b, ai, aj);
  const [x2, y2] = corner(b, bi, bj);
  // The wall face as a band raised from the ground line.
  const g = ctx.createLinearGradient(0, Math.min(y1, y2) - height, 0, Math.max(y1, y2));
  g.addColorStop(0, "#cfc6b0");
  g.addColorStop(1, "#8e8574");
  ctx.fillStyle = g;
  ctx.strokeStyle = "rgba(45, 38, 30, 0.85)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineTo(x2, y2 - height);
  ctx.lineTo(x1, y1 - height);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  // Battlements along the top.
  const len = Math.hypot(x2 - x1, y2 - y1);
  const steps = Math.max(2, Math.floor(len / (b.tw * 0.18)));
  ctx.fillStyle = "#d8d0bb";
  for (let k = 0; k < steps; k += 2) {
    const t0 = k / steps;
    const t1 = (k + 1) / steps;
    const ax = x1 + (x2 - x1) * t0;
    const ay = y1 + (y2 - y1) * t0 - height;
    const bx = x1 + (x2 - x1) * t1;
    const by = y1 + (y2 - y1) * t1 - height;
    const m = height * 0.35;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(bx, by - m);
    ctx.lineTo(ax, ay - m);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}
