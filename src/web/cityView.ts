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

/** Paints the landscape so it covers the whole canvas, keeping the bottom edge. */
function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number): void {
  const k = Math.max(w / img.width, h / img.height);
  const dw = img.width * k;
  const dh = img.height * k;
  ctx.drawImage(img, (w - dw) / 2, h - dh, dw, dh);
}

export function drawCityView(ctx: CanvasRenderingContext2D, w: number, h: number, input: CityViewInput): void {
  const rand = seeded(input.cityId * 7919 + 13);
  const backdrop = (input.coastal && art.get("view-coast")) || art.get("view-land")!;
  cover(ctx, backdrop, w, h);

  // Rows of places on the meadow, from the back to the front.
  const landRight = input.coastal ? w * 0.72 : w;
  const horizon = h * 0.42;
  const rows = 4;
  const slots: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    const y = horizon + (h - horizon) * (0.2 + r * 0.22);
    const size = h * 0.34 * (0.6 + r * 0.14);
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
    let want = Math.min(slots.filter((s) => !s.used).length, 2 + Math.round(input.size * 1.4));
    const free = slots.filter((s) => !s.used).sort(byPrestige);
    for (const s of free) {
      if (want-- <= 0) break;
      take(houses[Math.floor(rand() * houses.length)]!, 0.66, s);
    }
  }

  // Structures in the bay.
  sea.forEach((b, n) => {
    const img = art.get(`bld-${b}`);
    if (!img) return;
    const size = h * 0.34 * (BUILDINGS[b].wonder ? 1.05 : 0.85);
    placed.push({ img, x: w * (0.8 + (n % 2) * 0.12), y: horizon + (h - horizon) * (0.45 + Math.floor(n / 2) * 0.3), size });
  });

  placed.sort((a, b) => a.y - b.y || a.x - b.x);
  for (const p of placed) stand(ctx, p.img, p.x, p.y, p.size);

  // Walls along the front edge.
  const walls = input.buildings.includes("walls") ? art.get("bld-walls") : undefined;
  if (walls) {
    const wh = h * 0.2;
    const ww = (wh * walls.width) / walls.height;
    const step = ww * 0.94;
    for (let x = -step * 0.3; x < landRight + step * 0.2; x += step) ctx.drawImage(walls, x, h - wh * 0.9, ww, wh);
  }
}
