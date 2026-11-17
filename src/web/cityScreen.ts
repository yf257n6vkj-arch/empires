/**
 * The city screen: a painted view of the city, its citizens, the land it
 * works, food and production stores, trade, happiness, buildings and units.
 */
import {
  BUILDINGS,
  buyCost,
  calmedByLuxury,
  canSellBuilding,
  contentLimit,
  GOVERNMENTS,
  militaryUnhappiness,
  cityEffects,
  cityRadiusTiles,
  cityReport,
  martialLaw,
  productionCost,
  productionName,
  productionOptions,
  RULES,
  sameItem,
  TERRAINS,
  cityTileYield,
  corruptionPct,
  currentEra,
  isCoastal,
  UNIT_TYPES,
  workableTiles,
  GOVERNOR_GOALS,
  type GovernorGoal,
  type BuildingId,
  type City,
  type Command,
  type GameState,
  type ProductionItem,
  type UnitId,
} from "../core";
import { BUILDING_WIDTH, buildingPortraitCanvas, drawBuilding, drawHouse, tone } from "./buildingArt";
import { drawTerrainPatch, drawUnitPortrait, playerColor, unitPortraitCanvas, type DrawInput } from "./render";
import { describeBuilding, describeUnit, escapeHtml, moodLine } from "./texts";
import { buildingArtCanvas, cityArtSettled, drawCityView, hasCityArt, hitAt, loadCityArt } from "./cityView";
import { t, tn } from "./i18n";
import { buildingName, cityLabel, productionLabel, terrainName, unitName } from "./i18n/names";
import { cityPage } from "./cityPages";
import { detailHtml, type DetailItem } from "./productionDetail";

export interface CityHost {
  state(): GameState;
  run(command: Command): boolean;
  /** Redraws the main screen after a change. */
  refresh(): void;
  selectUnit(id: UnitId): void;
  /** Background input for drawing the land around the city. */
  drawInput(): DrawInput;
  say(text: string): void;
  /** Opens the encyclopedia at an entry. */
  openEntry(key: string): void;
}

/** Name of a governor goal for the picker. */
export function governorLabel(goal: GovernorGoal | null): string {
  switch (goal) {
    case null:
      return t("bez správce");
    case "balanced":
      return t("rovnováha");
    case "growth":
      return t("růst");
    case "production":
      return t("výroba");
    case "science":
      return t("věda");
    case "gold":
      return t("zlato");
    case "defense":
      return t("obrana");
  }
}

/** What the governor does with a goal. */
function governorText(goal: GovernorGoal | null): string {
  const note = t(" Novou stavbu vybere, až město dostaví tu současnou a v plánu nic nebude.");
  switch (goal) {
    case null:
      return t("Město řídíš sám. Správce za tebe obsadí políčka a vybírá stavby podle cíle, který mu dáš.");
    case "balanced":
      return t("Dbá na všechno stejně a staví to, co městu nejvíc pomůže.") + note;
    case "growth":
      return t("Obsadí políčka s jídlem a staví budovy, se kterými město roste rychleji, třeba sýpku nebo přístav.") + note;
    case "production":
      return t("Obsadí lesy a kopce s doly a staví budovy, které přidají štíty.") + note;
    case "science":
      return t("Dává přednost políčkům s obchodem a staví knihovny a univerzity.") + note;
    case "gold":
      return t("Dává přednost políčkům s obchodem a staví tržiště a banky.") + note;
    case "defense":
      return t("Drží ve městě dva obránce a staví hradby a kasárna.") + note;
  }
}

function turns(n: number): string {
  return tn("{n} tah|{n} tahy|{n} tahů", n);
}

function hiDpiCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D, number] {
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.width = `${w}px`;
  canvas.style.height = `${h}px`;
  return [canvas, canvas.getContext("2d")!, dpr];
}

/** Small deterministic random numbers for placing houses. */
function seeded(seed: number): () => number {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

// ---------- panorama ----------

/** Industry stands on the edge of town, further away. */
const FAR_ROW: BuildingId[] = ["hydroPlant", "nuclearPlant", "powerPlant"];
const BACK_ROW: BuildingId[] = [
  "apolloProgram",
  "unitedNations",
  "stVitus",
  "palace",
  "cathedral",
  "university",
  "hallOfScholars",
  "greatObservatory",
  "factory",
  "temple",
  "library",
  "grandBazaar",
  "stoneCircle",
  "courthouse",
  "bank",
  "researchLab",
  "sdiDefense",
  "pyramids",
  "colossus",
  "hangingGardens",
  "oracle",
  "greatLibrary",
  "sistineChapel",
  "globeTheatre",
  "royalSociety",
  "womensSuffrage",
  "manhattanProject",
  "setiProgram",
  "genomeProject",
];
/** Wonders that stand out of town: by the sea or in the hills. */
const EDGE_ROW: BuildingId[] = ["lighthouse", "greatWall", "circumnavigation", "darwinVoyage", "hooverDam", "coastalFortress"];
const FRONT_ROW: BuildingId[] = ["marketplace", "granary", "barracks", "amphitheater", "manufacturingPlant", "recyclingCenter", "massTransit"];

function drawPanorama(ctx: CanvasRenderingContext2D, w: number, h: number, state: GameState, city: City): void {
  const tiles = cityRadiusTiles(state.map, city);
  const terrainAt = (i: number) => state.map.terrain[i];
  const centerTerrain = terrainAt(city.y * state.map.width + city.x) ?? "grassland";
  const count = (t: string) => tiles.filter((i) => terrainAt(i) === t).length;
  const sea = tiles.filter((i) => terrainAt(i) === "ocean");
  const seaSide = sea.length ? Math.sign(sea.reduce((s, i) => s + (i % state.map.width) - city.x, 0)) || 1 : 0;

  // Sky.
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.62);
  sky.addColorStop(0, "#7fb2d8");
  sky.addColorStop(1, "#e9eedf");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const sun = ctx.createRadialGradient(w * 0.82, h * 0.16, 2, w * 0.82, h * 0.16, 60);
  sun.addColorStop(0, "rgba(255, 248, 220, 1)");
  sun.addColorStop(0.25, "rgba(255, 236, 170, 0.7)");
  sun.addColorStop(1, "rgba(255, 236, 170, 0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);
  const rand = seeded(city.id * 31 + 7);
  for (let k = 0; k < 4; k++) {
    const cx = rand() * w;
    const cy = 20 + rand() * h * 0.2;
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (let j = 0; j < 4; j++) {
      ctx.beginPath();
      ctx.ellipse(cx + j * 14 - 20, cy + (j % 2) * 3, 16 + j * 2, 7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const horizon = h * 0.5;
  // Mountains and hills in the distance when the city has them nearby.
  const ridge = (color: string, base: number, amp: number, step: number, seedK: number) => {
    const r = seeded(city.id * 17 + seedK);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, base);
    for (let x = 0; x <= w + step; x += step) ctx.lineTo(x, base - amp * (0.4 + r() * 0.6));
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
  };
  if (count("mountains") > 0) ridge("#9a9ea8", horizon - 6, 60, 70, 1);
  if (count("hills") + count("mountains") > 0) ridge("#8fa071", horizon + 4, 26, 50, 2);
  if (count("forest") > 0) {
    const r = seeded(city.id + 5);
    for (let k = 0; k < 40; k++) {
      const x = r() * w;
      const y = horizon + 4 + r() * 10;
      ctx.fillStyle = k % 2 ? "#3f6a3a" : "#4d7b42";
      ctx.beginPath();
      ctx.moveTo(x, y - 14);
      ctx.lineTo(x + 6, y);
      ctx.lineTo(x - 6, y);
      ctx.fill();
    }
  }
  // Ground.
  const groundColor =
    centerTerrain === "desert" ? "#d9c58f" : centerTerrain === "plains" ? "#a9ab5f" : centerTerrain === "hills" ? "#8e9a5a" : "#7fa756";
  const ground = ctx.createLinearGradient(0, horizon, 0, h);
  ground.addColorStop(0, tone(groundColor, 0.92));
  ground.addColorStop(1, tone(groundColor, 1.08));
  ctx.fillStyle = ground;
  ctx.fillRect(0, horizon + 8, w, h);
  if (seaSide !== 0) {
    const sx = seaSide > 0 ? w * 0.62 : 0;
    const sw = w * 0.38;
    const g = ctx.createLinearGradient(0, horizon, 0, horizon + 40);
    g.addColorStop(0, "#5f95b9");
    g.addColorStop(1, "#3c7aa3");
    ctx.fillStyle = g;
    ctx.beginPath();
    if (seaSide > 0) {
      ctx.moveTo(sx, horizon + 8);
      ctx.lineTo(w, horizon + 8);
      ctx.lineTo(w, horizon + 50);
      ctx.quadraticCurveTo(sx + sw * 0.3, horizon + 40, sx, horizon + 8);
    } else {
      ctx.moveTo(0, horizon + 8);
      ctx.lineTo(sw, horizon + 8);
      ctx.quadraticCurveTo(sw * 0.7, horizon + 40, 0, horizon + 50);
    }
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) {
      const x = sx + rand() * sw * 0.8;
      const y = horizon + 14 + rand() * 20;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 8, y);
      ctx.stroke();
    }
  }
  // Fields around the city.
  const fr = seeded(city.id * 3);
  for (let k = 0; k < 7; k++) {
    const x = fr() * w;
    const y = horizon + 12 + fr() * 14;
    ctx.fillStyle = k % 2 ? "rgba(214, 190, 90, 0.55)" : "rgba(120, 160, 70, 0.5)";
    ctx.beginPath();
    ctx.ellipse(x, y, 40 + fr() * 30, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Everything that stands in the city, drawn from the back to the front.
  type Item = { y: number; draw: () => void };
  const items: Item[] = [];
  const color = playerColor(city.owner);
  const scale = Math.min(2.1, h / 120);
  const placeRow = (ids: BuildingId[], y: number, s: number) => {
    if (!ids.length) return;
    const widths = ids.map((id) => BUILDING_WIDTH[id] * s);
    const total = widths.reduce((a, b) => a + b, 0);
    const k = Math.min(1, (w * 0.86) / total);
    const gap = (w - total * k) / (ids.length + 1);
    let x = gap;
    ids.forEach((id, n) => {
      const bw = widths[n]! * k;
      const cx = x + bw / 2;
      const yy = y + (n % 2) * 4;
      items.push({
        y: yy,
        draw: () => {
          ctx.save();
          ctx.translate(cx, yy);
          ctx.scale(s * k, s * k);
          drawBuilding(ctx, id, color);
          ctx.restore();
        },
      });
      x += bw + gap;
    });
  };
  const has = (id: BuildingId) => city.buildings.includes(id);
  if (has("aqueduct")) {
    items.push({
      y: horizon + 10,
      draw: () => {
        for (const x of [w * 0.12, w * 0.12 + BUILDING_WIDTH.aqueduct * scale * 0.8]) {
          ctx.save();
          ctx.translate(x, horizon + 10);
          ctx.scale(scale * 0.8, scale * 0.8);
          drawBuilding(ctx, "aqueduct", color);
          ctx.restore();
        }
      },
    });
  }
  // A power plant stands off to the side, where the tall buildings in the middle do not hide it.
  FAR_ROW.filter(has).forEach((id) => {
    const px = w * 0.29;
    items.push({
      y: horizon + 14,
      draw: () => {
        ctx.save();
        ctx.translate(px, horizon + 14);
        ctx.scale(scale * 0.7, scale * 0.7);
        drawBuilding(ctx, id, color);
        ctx.restore();
      },
    });
  });
  placeRow(EDGE_ROW.filter(has), horizon + 20, scale * 0.6);
  placeRow(BACK_ROW.filter(has), horizon + 34, scale);
  if (has("harbour")) {
    // The harbour sits by the sea, or in front when the panorama shows no sea.
    const hx = seaSide > 0 ? w * 0.86 : seaSide < 0 ? w * 0.13 : w * 0.5;
    const hy = seaSide !== 0 ? horizon + 58 : h - 30;
    items.push({
      y: hy,
      draw: () => {
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(scale * 0.8, scale * 0.8);
        drawBuilding(ctx, "harbour", color);
        ctx.restore();
      },
    });
  }
  placeRow(FRONT_ROW.filter(has), h - 26, scale * 0.95);
  // Houses grow with the city.
  const hr = seeded(city.id * 101 + 13);
  const houses = Math.min(34, 4 + city.size * 3);
  for (let k = 0; k < houses; k++) {
    const x = 20 + hr() * (w - 40);
    const y = horizon + 30 + hr() * (h - horizon - 48);
    const seed = Math.floor(hr() * 1000);
    const s = scale * (0.85 + (y - horizon) / (h - horizon) * 0.35);
    items.push({
      y,
      draw: () => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(s, s);
        drawHouse(ctx, seed);
        ctx.restore();
      },
    });
  }
  // Soldiers stand in front of the gate.
  const soldiers = state.units.filter((u) => u.x === city.x && u.y === city.y && u.owner === city.owner);
  soldiers.slice(0, 6).forEach((u, n) => {
    const x = w / 2 + (n - (Math.min(6, soldiers.length) - 1) / 2) * 34;
    items.push({ y: h - 6, draw: () => drawUnitPortrait(ctx, u.type, u.owner, x, h - 8, scale * 1.15) });
  });
  items.sort((a, b) => a.y - b.y);
  for (const it of items) it.draw();

  if (has("walls")) {
    const s = scale * 0.9;
    const y = h - 2;
    const seg = 48 * s;
    for (let x = -10; x < w + seg; x += seg) {
      if (Math.abs(x + seg / 2 - w / 2) < seg * 0.6) continue;
      ctx.save();
      ctx.translate(x + seg / 2, y);
      ctx.scale(s, s * 0.8);
      drawBuilding(ctx, "walls", color);
      ctx.restore();
    }
  }
  // Soft vignette.
  const v = ctx.createLinearGradient(0, h - 30, 0, h);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.18)");
  ctx.fillStyle = v;
  ctx.fillRect(0, h - 30, w, 30);
}

// ---------- citizens ----------

type CitizenKind = "happy" | "content" | "unhappy" | "entertainer" | "taxman" | "scientist";

const TUNIC: Record<CitizenKind, string> = {
  happy: "#d9a72e",
  content: "#4f8a4a",
  unhappy: "#a83a2c",
  entertainer: "#7a4fa8",
  taxman: "#3d6a9e",
  scientist: "#e8e4da",
};

function drawCitizen(ctx: CanvasRenderingContext2D, x: number, y: number, kind: CitizenKind, k: number): void {
  const tunic = TUNIC[kind];
  const skin = ["#e2b48c", "#c98f62", "#f0c9a4", "#a8744e"][k % 4]!;
  ctx.save();
  ctx.translate(x, y);
  // Legs.
  ctx.fillStyle = "#4a3a2c";
  ctx.fillRect(-4, -12, 3, 12);
  ctx.fillRect(1, -12, 3, 12);
  ctx.fillStyle = "#2a1f16";
  ctx.fillRect(-5, -2, 4, 2);
  ctx.fillRect(1, -2, 4, 2);
  // Body.
  const g = ctx.createLinearGradient(-7, 0, 7, 0);
  g.addColorStop(0, tone(tunic, 1.15));
  g.addColorStop(1, tone(tunic, 0.7));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(-6, -27);
  ctx.quadraticCurveTo(0, -30, 6, -27);
  ctx.lineTo(7, -11);
  ctx.lineTo(-7, -11);
  ctx.closePath();
  ctx.fill();
  // Arms.
  ctx.strokeStyle = tone(tunic, 0.85);
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  if (kind === "unhappy") {
    ctx.moveTo(-6, -24);
    ctx.lineTo(3, -19);
    ctx.moveTo(6, -24);
    ctx.lineTo(-3, -19);
  } else if (kind === "entertainer") {
    ctx.moveTo(-6, -25);
    ctx.lineTo(-9, -18);
    ctx.moveTo(6, -25);
    ctx.lineTo(4, -17);
  } else if (kind === "happy") {
    // Both arms up in joy.
    ctx.moveTo(-6, -25);
    ctx.lineTo(-10, -34);
    ctx.moveTo(6, -25);
    ctx.lineTo(10, -34);
  } else if (kind === "taxman" || kind === "scientist") {
    ctx.moveTo(-6, -25);
    ctx.lineTo(-8, -14);
    ctx.moveTo(6, -25);
    ctx.lineTo(7, -17);
  } else {
    ctx.moveTo(-6, -25);
    ctx.lineTo(-8, -14);
    ctx.moveTo(6, -25);
    ctx.lineTo(9, -31);
  }
  ctx.stroke();
  if (kind === "entertainer") {
    // Lute.
    ctx.fillStyle = "#b07a3a";
    ctx.beginPath();
    ctx.ellipse(1, -17, 5, 3.6, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#5a3b25";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(4, -19);
    ctx.lineTo(11, -25);
    ctx.stroke();
  }
  if (kind === "taxman") {
    // A bag of coins.
    ctx.fillStyle = "#c9a227";
    ctx.beginPath();
    ctx.arc(8, -14, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#8a6a14";
    ctx.fillRect(7, -19, 2, 2);
  }
  if (kind === "scientist") {
    // A flask with something green.
    ctx.fillStyle = "rgba(200, 230, 255, 0.9)";
    ctx.beginPath();
    ctx.moveTo(6, -21);
    ctx.lineTo(10, -21);
    ctx.lineTo(12, -13);
    ctx.lineTo(4, -13);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#59c25a";
    ctx.fillRect(5, -16, 6, 3);
  }
  if (kind === "content") {
    // Raised hand holds a sickle of wheat.
    ctx.strokeStyle = "#d9b44a";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(9, -31);
    ctx.lineTo(10, -37);
    ctx.stroke();
  }
  // Head.
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(0, -32, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3b2a1d";
  ctx.beginPath();
  ctx.arc(0, -33, 5.1, Math.PI * 1.05, Math.PI * 1.95);
  ctx.fill();
  if (kind === "entertainer") {
    ctx.fillStyle = "#d9a441";
    ctx.beginPath();
    ctx.moveTo(-6, -35);
    ctx.lineTo(-9, -42);
    ctx.lineTo(0, -37);
    ctx.lineTo(9, -42);
    ctx.lineTo(6, -35);
    ctx.fill();
  }
  // Face.
  ctx.fillStyle = "#2a1d14";
  ctx.fillRect(-2.4, -32.6, 1.2, 1.2);
  ctx.fillRect(1.2, -32.6, 1.2, 1.2);
  ctx.strokeStyle = "#5a2a1a";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  if (kind === "unhappy") ctx.arc(0, -27.6, 2, Math.PI * 1.15, Math.PI * 1.85);
  else ctx.arc(0, -30.6, kind === "happy" ? 2.6 : 2, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
  if (kind === "scientist") {
    // Spectacles.
    ctx.strokeStyle = "#2a1d14";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(-1.8, -32, 1.6, 0, Math.PI * 2);
    ctx.arc(1.8, -32, 1.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ---------- yield icons ----------

function drawYieldIcon(ctx: CanvasRenderingContext2D, kind: "food" | "shields" | "trade", x: number, y: number, r: number): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "rgba(20, 15, 10, 0.75)";
  ctx.lineWidth = r * 0.22;
  if (kind === "food") {
    ctx.fillStyle = "#9fd24c";
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.62, r, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#4f7a1f";
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.6);
    ctx.lineTo(r * 0.4, -r * 0.6);
    ctx.stroke();
  } else if (kind === "shields") {
    ctx.fillStyle = "#9db4c8";
    ctx.beginPath();
    ctx.moveTo(-r * 0.8, -r * 0.8);
    ctx.lineTo(r * 0.8, -r * 0.8);
    ctx.lineTo(r * 0.8, 0);
    ctx.quadraticCurveTo(r * 0.6, r * 0.7, 0, r);
    ctx.quadraticCurveTo(-r * 0.6, r * 0.7, -r * 0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#4b5d6e";
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.6);
    ctx.lineTo(0, r * 0.6);
    ctx.stroke();
  } else {
    ctx.fillStyle = "#f2c94c";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#a07a1a";
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

const iconCache = new Map<string, string>();

function yieldIcon(kind: "food" | "shields" | "trade", size = 14): string {
  const key = `${kind}:${size}`;
  let url = iconCache.get(key);
  if (!url) {
    const [c, ctx, dpr] = hiDpiCanvas(size, size);
    ctx.scale(dpr, dpr);
    drawYieldIcon(ctx, kind, size / 2, size / 2, size * 0.42);
    url = c.toDataURL();
    iconCache.set(key, url);
  }
  return `<img src="${url}" width="${size}" height="${size}" alt="" class="yi">`;
}

// ---------- the screen ----------

/** A small pile of gold coins: the picture for earning gold instead of building. */
function coinsCanvas(w: number, h: number): HTMLCanvasElement {
  const [canvas, ctx, dpr] = hiDpiCanvas(w, h);
  ctx.scale(dpr, dpr);
  const r = Math.min(w, h) * 0.2;
  const coin = (x: number, y: number) => {
    ctx.fillStyle = "#a8771c";
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.18, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f2c94c";
    ctx.strokeStyle = "#7a5512";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(x, y, r, r * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };
  const cx = w / 2;
  const base = h * 0.72;
  for (let k = 0; k < 4; k++) coin(cx - r * 0.7, base - k * r * 0.28);
  for (let k = 0; k < 6; k++) coin(cx + r * 0.6, base - k * r * 0.28);
  coin(cx - r * 0.05, base + r * 0.35);
  return canvas;
}

export function createCityScreen(host: CityHost) {
  const dialog = document.querySelector<HTMLDialogElement>("#city-dialog")!;
  let cityId: number | null = null;
  const TILE_PX = 50;
  const PANEL_KEY = "empires.cityPanel";
  /** Height of the panels below the picture chosen by dragging, null for the default. */
  let panelHeight: number | null = null;
  /** Whether the history of the city is shown over the picture; stays open while flipping through cities. */
  let aboutOpen = false;
  /** Production item whose detail card is shown over the picture. */
  let detail: DetailItem | null = null;
  /** "cityId:building" waiting for a second click to be sold. */
  let sellConfirm: string | null = null;
  try {
    const stored = Number(localStorage.getItem(PANEL_KEY));
    if (stored > 0) panelHeight = stored;
  } catch {
    // No storage: the default height.
  }

  function city(): City | undefined {
    return host.state().cities.find((c) => c.id === cityId);
  }

  function ownCities(): City[] {
    const s = host.state();
    return s.cities.filter((c) => c.owner === s.currentPlayer).sort((a, b) => a.id - b.id);
  }

  function open(id: number): void {
    if (cityId !== id) detail = null;
    cityId = id;
    if (!dialog.open) dialog.showModal();
    render();
    // The city pictures load on first use; paint again once they are here.
    if (!hasCityArt()) void loadCityArt().then(() => hasCityArt() && dialog.open && render());
  }

  function close(): void {
    dialog.close();
  }

  function act(command: Command): void {
    if (host.run(command)) host.refresh();
    else render();
  }

  function clickTile(i: number): void {
    const c = city();
    if (!c) return;
    const s = host.state();
    const free = new Set(workableTiles(s, c));
    if (c.worked.includes(i)) {
      act({ type: "setWorkedTiles", cityId: c.id, tiles: c.worked.filter((t) => t !== i) });
      host.say(t("Obyvatel odešel z pole a baví ostatní ve městě."));
      return;
    }
    if (!free.has(i)) {
      host.say(t("Tohle políčko město obdělávat nemůže."));
      render();
      return;
    }
    let tiles = [...c.worked, i];
    if (tiles.length > c.size) {
      // Move the citizen from the weakest field to the new one.
      const value = (t: number) => {
        const y = cityTileYield(s, c, t);
        return y.food * 3 + y.shields * 2 + y.trade;
      };
      const weakest = [...c.worked].sort((a, b) => value(a) - value(b))[0]!;
      tiles = tiles.filter((t) => t !== weakest);
    }
    act({ type: "setWorkedTiles", cityId: c.id, tiles });
  }

  /** Scrolled panels keep their place when the same city is drawn again, e.g. after adding to the plan. */
  const SCROLLERS = [".cs-opts", ".cs-info", ".cs-land", ".cs-make", ".cs-bottom"];
  let renderedCity: number | null = null;

  function render(): void {
    const c = city();
    if (!c) {
      if (dialog.open) dialog.close();
      return;
    }
    const scrolled = renderedCity === c.id ? SCROLLERS.map((sel) => dialog.querySelector<HTMLElement>(sel)?.scrollTop ?? 0) : null;
    renderedCity = c.id;
    try {
      renderCity(c);
    } finally {
      if (scrolled) {
        SCROLLERS.forEach((sel, k) => {
          const el = dialog.querySelector<HTMLElement>(sel);
          if (el) el.scrollTop = scrolled[k]!;
        });
      }
    }
  }

  function renderCity(c: City): void {
    const s = host.state();
    const r = cityReport(s, c);
    const effects = cityEffects(s, c);
    const h = r.happiness;
    const cost = productionCost(c.production);
    const cities = ownCities();
    const index = cities.findIndex((x) => x.id === c.id);
    const gold = s.players[c.owner]?.gold ?? 0;
    const price = buyCost(c);
    const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
    const growth =
      c.size >= r.maxSize && r.foodSurplus > 0
        ? t("dál neroste, na víc než {maxSize} obyvatel potřebuje akvadukt", { maxSize: r.maxSize })
        : r.turnsToGrow
          ? t("vyroste za {turns}", { turns: turns(r.turnsToGrow) })
          : r.foodSurplus === 0
            ? t("neroste")
            : t("hladoví, zmenší se");
    const done = r.waitingForSize
      ? t("čeká na druhého obyvatele")
      : c.shields >= cost
        ? t("hotovo na konci tahu")
        : r.turnsToComplete
          ? t("hotovo za {turns}", { turns: turns(r.turnsToComplete) })
          : t("nevyrábí");
    const limit = contentLimit(s, c.owner);
    const crowd = Math.max(0, c.size - limit);
    const unhappyBase = Math.min(c.size, crowd + militaryUnhappiness(s, c, effects));
    const calmedByBuildings = Math.min(unhappyBase, effects.content);
    const calmedBySoldiers = Math.min(unhappyBase - calmedByBuildings, martialLaw(s, c));
    const calmed = calmedByLuxury(s, c, effects);
    const idle = c.size - c.worked.length;
    const party = GOVERNMENTS[s.players[c.owner]!.government].celebration;
    const partyGain =
      party === "noTilePenalty"
        ? t("Políčka nemají postih despocie.")
        : party === "tradeBonus"
          ? t("Políčka s obchodem dají o jeden obchod víc.")
          : party === "rapture"
            ? t("Město roste každý tah, dokud má přebytek jídla.")
            : "";
    const unitsHere = s.units.filter((u) => u.x === c.x && u.y === c.y && u.owner === c.owner);
    const supported = s.units.filter((u) => u.homeCity === c.id);
    const options = productionOptions(s, c);

    const goldPerTurn = r.shieldSurplus * RULES.wealthGoldPerShield;
    const benefit = (o: ProductionItem) =>
      o.kind === "wealth"
        ? t("město nic nestaví, každý štít se změní na zlato: +{goldPerTurn} zlata za tah", { goldPerTurn })
        : o.kind === "building"
          ? describeBuilding(BUILDINGS[o.id], false)
          : describeUnit(UNIT_TYPES[o.id], false);
    const optionRow = (o: ProductionItem, n: number) => {
      const left = r.shieldSurplus > 0 ? Math.max(1, Math.ceil((productionCost(o) - c.shields) / r.shieldSurplus)) : null;
      const wonder = o.kind === "building" && BUILDINGS[o.id].wonder;
      const planned = o.kind === "building" && !BUILDINGS[o.id].spaceship && [c.production, ...c.queue].some((x) => sameItem(x, o));
      const full = c.queue.length >= RULES.queueLength;
      const cost = o.kind === "wealth" ? t("+{gold} zl.", { gold: goldPerTurn }) : `${productionCost(o)} ${yieldIcon("shields", 11)}`;
      const time = o.kind === "wealth" ? t("každý tah") : left ? turns(left) : "—";
      const entry = o.kind === "wealth" ? "" : o.kind === "unit" ? `unit-${o.id}` : `${wonder ? "wdr" : "bld"}-${o.id}`;
      return `<div class="cs-opt ${sameItem(o, c.production) ? "on" : ""} ${wonder ? "wonder" : ""}"><button type="button" class="cs-opt-main" data-opt="${n}" data-item="${o.kind === "wealth" ? "wealth" : `${o.kind}:${o.id}`}"><span class="cs-opt-pic"></span><span class="cs-opt-text"><span class="cs-opt-name">${escapeHtml(productionLabel(o))}</span><span class="cs-opt-desc">${escapeHtml(benefit(o))}</span></span><span class="cs-opt-cost">${cost}</span><span class="cs-opt-turns">${time}</span></button>${entry ? `<button type="button" class="cs-opt-info ${detail && sameItem(detail, o) ? "on" : ""}" data-detail="${n}" title="${t("Podrobnosti")}">?</button>` : ""}${o.kind === "wealth" ? "" : `<button type="button" class="cs-opt-add" data-add="${n}" ${planned || full ? "disabled" : ""} title="${planned ? t("Už je v plánu.") : full ? t("Plán je plný.") : t("Přidat do plánu, město to postaví potom")}">+</button>`}</div>`;
    };
    const group = (title: string, pick: (o: ProductionItem) => boolean) => {
      const rows = options.map((o, n) => (pick(o) ? optionRow(o, n) : "")).join("");
      return rows ? `<div class="cs-group">${title}</div>${rows}` : "";
    };
    const optionList =
      group(t("Jednotky"), (o) => o.kind === "unit") +
      group(t("Budovy"), (o) => o.kind === "building" && !BUILDINGS[o.id].wonder) +
      group(t("Divy světa"), (o) => o.kind === "building" && BUILDINGS[o.id].wonder) +
      group(t("Bez stavby"), (o) => o.kind === "wealth");
    const foodPct = Math.min(100, (c.food / r.growthThreshold) * 100);

    const history = cityPage(c.name, s.players[c.owner]!.civ);
    const aboutBox =
      history && aboutOpen
        ? `<div class="cs-about">
            <div class="cs-about-head"><b>${escapeHtml(cityLabel(c.name))}</b><span class="muted small">${escapeHtml(history.page.when)}</span><button type="button" class="tp-close" data-about aria-label="${t("Zavřít")}">×</button></div>
            <p>${escapeHtml(history.page.text)}</p>
            <a href="${history.url}" target="_blank" rel="noopener">${t("Přečti si víc na Wikipedii: {title}", { title: escapeHtml(history.page.wiki) })} ↗</a>
          </div>`
        : "";
    if (detail && !options.some((o) => sameItem(o, detail!))) detail = null;
    const shown = detail;
    const detailBox = shown
      ? detailHtml(s, c, shown, {
          turnsLeft: r.shieldSurplus > 0 ? Math.max(1, Math.ceil((productionCost(shown) - c.shields) / r.shieldSurplus)) : null,
          planned: shown.kind === "building" && [c.production, ...c.queue].some((x) => sameItem(x, shown)),
          full: c.queue.length >= RULES.queueLength,
          current: sameItem(shown, c.production),
        })
      : "";
    dialog.innerHTML = `
      <div class="cs">
        <div class="cs-head">
          <button type="button" class="cs-nav" data-nav="-1" ${cities.length < 2 ? "disabled" : ""} title="${t("Předchozí město")}">‹</button>
          <h2>${escapeHtml(cityLabel(c.name))}</h2>
          <button type="button" class="cs-nav" data-nav="1" ${cities.length < 2 ? "disabled" : ""} title="${t("Další město")}">›</button>
          <span class="cs-sub">${t("velikost {size} · založeno v tahu {turn} · {n}. město z {all}", { size: c.size, turn: c.foundedTurn, n: index + 1, all: cities.length })}</span>
          ${history ? `<button type="button" class="cs-about-btn ${aboutOpen ? "on" : ""}" data-about title="${t("Co víme o skutečném městě tohoto jména")}">${t("Historie města")}</button>` : ""}
          <span class="spacer"></span>
          <button type="button" class="tp-close" data-close aria-label="${t("Zavřít")}" title="${t("Zavřít (Esc)")}">×</button>
        </div>
        <div class="cs-top">
          <div class="cs-view"></div>
          ${detailBox || aboutBox}
          <div class="cs-citizens">
            <div class="cs-people"></div>
            <div class="cs-mood">
              ${h.disorder ? `<b class="neg">${t("Nepokoje! Město tento tah nic nevyrobí.")}</b><br>` : ""}
              ${c.celebrating && h.celebrate ? `<b class="pos">${t("Město slaví!")}</b> <span class="small">${partyGain}</span><br>` : h.celebrate ? `<b class="pos">${t("Obyvatelé se chystají slavit, oslava začne příští tah.")}</b><br>` : ""}
              <span>${moodLine(h)}</span>
              <div class="small">${t("Bez pomoci je spokojených {n} obyvatel.", { n: limit })}${limit < RULES.contentBase ? tn(" Tvoje říše je velká, proto o jednoho méně než obvykle.| Tvoje říše je velká, proto o {n} méně než obvykle.| Tvoje říše je velká, proto o {n} méně než obvykle.", RULES.contentBase - limit) : ""}${unhappyBase ? t(" Z {unhappyBase} nespokojených uklidní budovy {calmedByBuildings} a vojáci ve městě {calmedBySoldiers}.", { unhappyBase, calmedByBuildings, calmedBySoldiers }) : ""}${calmed ? t(" Zábava uklidní {n}.", { n: calmed }) : ""}${h.happy ? tn(" Zábava udělá šťastným jednoho.| Zábava udělá šťastnými {n}.| Zábava udělá šťastnými {n}.", h.happy) : ""}${!h.celebrate && !h.disorder && party !== "none" && c.size >= RULES.celebrationMinSize ? t(" Město bude slavit, až v něm nikdo nebude nespokojený a šťastných bude aspoň tolik co spokojených.") : ""}${idle > 0 ? (c.size >= RULES.specialistMinSize ? t(" Klikni na obyvatele mimo pole a změň ho na výběrčího daní nebo vědce.") : t(" Výběrčí daní a vědce může mít město od {n} obyvatel.", { n: RULES.specialistMinSize })) : ""}</div>
            </div>
          </div>
        </div>
        <div class="cs-split" data-split title="${t("Táhni nahoru nebo dolů. Dvojklik vrátí původní velikost.")}"><span></span></div>
        <div class="cs-bottom" ${panelHeight ? `style="height:${panelHeight}px"` : ""}>
          <section class="cs-box cs-land">
            <h3>${t("Okolí města")}</h3>
            <div class="cs-map"></div>
            <div class="cs-sum">${yieldIcon("food")} ${r.production.food} &nbsp; ${yieldIcon("shields")} ${r.production.shields} &nbsp; ${yieldIcon("trade")} ${r.production.trade}</div>
            <p class="muted small">${t("Klikni na políčko a pošli na něj obyvatele, nebo ho z pole odvolej.")} ${c.manualTiles ? t("Rozmístění jsi zvolil sám a platí, dokud město nevyroste nebo se nezmenší.") : t("Město teď rozmisťuje obyvatele samo.")}</p>
            ${c.manualTiles ? `<button type="button" class="wide" data-auto>${t("Rozmístit obyvatele automaticky")}</button>` : ""}
          </section>
          <section class="cs-box cs-make">
            <div class="cs-prod">
              <div class="cs-prod-pic"></div>
              <div class="cs-prod-text">
                <h3>${t("Teď vyrábí")}</h3>
                <b class="cs-prod-name">${escapeHtml(productionLabel(c.production))}</b>
                ${
                  c.production.kind === "wealth"
                    ? `<div class="small">${t("Město nic nestaví. {shields} {icon} za tah se mění na {gold} zlata", { shields: r.shieldSurplus, icon: yieldIcon("shields", 12), gold: r.shieldSurplus * RULES.wealthGoldPerShield })}${c.shields ? t(", uložených {shields} štítů počká na další stavbu", { shields: c.shields }) : ""}.</div>`
                    : `<div class="cs-bar"><div style="width:${Math.min(100, (c.shields / cost) * 100)}%"></div></div>
                <div class="small">${t("{done} z {cost} {icon} · {change} za tah · {state}", { done: Math.min(c.shields, cost), cost, icon: yieldIcon("shields", 12), change: signed(r.shieldSurplus), state: done })}</div>`
                }
                ${r.unitUpkeep ? `<div class="muted small">${t("Údržba jednotek z města stojí {n} {icon} za tah.", { n: r.unitUpkeep, icon: yieldIcon("shields", 11) })}</div>` : ""}
              </div>
              ${price > 0 ? `<button type="button" class="cs-buy" data-buy ${gold < price ? `disabled title="${t("Máš jen {gold} zlata.", { gold })}"` : ""}>${t("Koupit za {price} zlata", { price })}</button>` : ""}
            </div>
            <div class="cs-plan">
              <span class="cs-plan-label">${t("Potom:")}</span>
              ${
                c.queue.length
                  ? c.queue
                      .map(
                        (q, n) =>
                          `<span class="cs-chip" draggable="true" data-q="${n}" title="${t("Přetáhni a změň pořadí")}">${n > 0 ? `<button type="button" data-move="${n}" data-to="${n - 1}" title="${t("Postavit dřív")}">‹</button>` : ""}<span class="cs-chip-name">${n + 1}. ${escapeHtml(productionLabel(q))}</span>${n < c.queue.length - 1 ? `<button type="button" data-move="${n}" data-to="${n + 1}" title="${t("Postavit později")}">›</button>` : ""}<button type="button" data-unq="${n}" title="${t("Vyřadit z plánu")}">×</button></span>`,
                      )
                      .join("")
                  : `<span class="muted small">${t("nic dalšího. Tlačítkem + u stavby ji přidáš do plánu.")}</span>`
              }
            </div>
            ${governorRow(c)}
            <h3>${t("Co stavět dál")} <span class="muted">${t("· klik vybere, + naplánuje")}</span></h3>
            <div class="cs-opts">${optionList}</div>
          </section>
          <section class="cs-box cs-info">
            <h3>${t("Růst")}</h3>
            <div class="cs-bar food"><div style="width:${foodPct}%"></div></div>
            <p class="small">${t("Jídlo {food} z {need} · {change} za tah · {growth}", { food: c.food, need: r.growthThreshold, change: signed(r.foodSurplus), growth })}${effects.keepFoodOnGrowth ? `. <span class="muted">${t("Sýpka po růstu ponechá {pct} % jídla.", { pct: Math.round(effects.keepFoodOnGrowth * 100) })}</span>` : ""}</p>
            <h3>${t("Obchod")}</h3>
            <div class="cs-trade">
              <div>${yieldIcon("trade")} ${t("obchod <b>{n}</b>", { n: r.production.trade })}${r.routes ? ` <span class="muted">${t("(z toho obchodní cesty {n})", { n: r.routes })}</span>` : ""}</div>
              ${r.corruption ? `<div>${t("korupce")} <b class="neg">−${r.corruption}</b> <span class="muted">(${corruptionPct(s, c, effects)} % ${effects.corruptionCutPct ? t("i se soudním dvorem") : t("kvůli vzdálenosti od paláce")})</span></div>` : effects.capital ? `<div class="muted small">${t("Tady sídlí vláda, korupce tu není.")}</div>` : ""}
              <div>${t("věda <b>{n}</b>", { n: r.science })}${effects.sciencePct ? ` <span class="muted">${t("(+{pct} % z budov)", { pct: effects.sciencePct })}</span>` : ""} · ${t("zlato <b>{n}</b>", { n: r.gold + r.wealthGold })}${effects.goldPct ? ` <span class="muted">(+${effects.goldPct} %)</span>` : ""}${r.luxury ? ` · ${t("zábava <b>{n}</b>", { n: r.luxury })} <span class="muted">${t("(uklidní nebo rozveselí {calm})", { calm: Math.floor(r.luxury / RULES.luxuryPerContent) })}</span>` : ""}</div>
            </div>
            ${r.pollution.industry + r.pollution.population > 0 ? `<p class="small">${t("Znečištění {n}, bez potíží město snese {free}", { n: r.pollution.industry + r.pollution.population, free: RULES.pollutionFree })} <span class="muted">${t("(z výroby {industry}, od obyvatel {people})", { industry: r.pollution.industry, people: r.pollution.population })}</span></p>` : ""}
            ${c.tradeRoutes.length ? `<p class="small">${t("Obchodní cesty do: {list}", { list: c.tradeRoutes.map((id) => escapeHtml(cityLabel(s.cities.find((x) => x.id === id)?.name ?? "?"))).join(", ") })}</p>` : ""}
            <h3>${t("Budovy")} <span class="muted">${c.buildings.length ? t("· údržba {upkeep} zlata za tah", { upkeep: c.buildings.reduce((n, b) => n + BUILDINGS[b].upkeep, 0) }) : ""}</span></h3>
            <div class="cs-buildings">${
              c.buildings.length
                ? c.buildings
                    .map(
                      (b) => {
                        const sellError = canSellBuilding(s, c, b);
                        const confirming = sellConfirm === `${c.id}:${b}`;
                        const sell =
                          BUILDINGS[b].wonder || BUILDINGS[b].onePerPlayer
                            ? ""
                            : `<button type="button" class="cs-sell ${confirming ? "confirm" : ""}" data-sell="${b}" ${sellError ? `disabled title="${escapeHtml(t("V tomhle tahu už jsi tu jednu budovu prodal."))}"` : `title="${escapeHtml(t("Prodat za {gold} zlata", { gold: BUILDINGS[b].cost }))}"`}>${confirming ? t("Prodat za {gold}?", { gold: BUILDINGS[b].cost }) : t("Prodat")}</button>`;
                        return `<span class="cs-building-wrap"><button type="button" class="cs-building ${BUILDINGS[b].wonder ? "wonder" : ""}" data-b="${b}" title="${escapeHtml(describeBuilding(BUILDINGS[b]))}"><span class="pic"></span><span class="name">${escapeHtml(buildingName(b))}</span>${BUILDINGS[b].upkeep ? `<span class="muted">${t("{gold} zl.", { gold: BUILDINGS[b].upkeep })}</span>` : ""}</button>${sell}</span>`;
                      },
                    )
                    .join("")
                : `<span class="muted small">${t("Zatím tu nestojí žádná budova.")}</span>`
            }</div>
            <h3>${t("Jednotky ve městě")}</h3>
            <div class="cs-units">${
              unitsHere.length
                ? unitsHere
                    .map(
                      (u) =>
                        `<span class="cs-unit-wrap"><button type="button" class="cs-unit" data-unit="${u.id}" title="${t("Vybrat jednotku a zavřít město")}"><span class="pic" data-type="${u.type}"></span>${escapeHtml(unitName(u.type))}${u.fortified ? t(" (opevněná)") : ""}</button><button type="button" class="cs-unit-info" data-entry="unit-${u.type}" title="${t("Otevřít v encyklopedii")}">?</button></span>`,
                    )
                    .join("")
                : `<span class="muted small">${t("Město nikdo nebrání.")}</span>`
            }</div>
            ${supported.some((u) => UNIT_TYPES[u.type].foodUpkeep) ? `<p class="muted small">${t("Osadníci z tohoto města spotřebují {n} jídla za tah.", { n: supported.reduce((n, u) => n + UNIT_TYPES[u.type].foodUpkeep, 0) })}</p>` : ""}
          </section>
        </div>
      </div>`;

    // The view into the city fills the space above the panels.
    const view = dialog.querySelector<HTMLDivElement>(".cs-view")!;
    const vw = Math.max(480, Math.floor(view.clientWidth) || 1120);
    const vh = Math.max(200, Math.floor(view.clientHeight) || 300);
    const [pc, pctx, dpr] = hiDpiCanvas(vw, vh);
    pctx.scale(dpr, dpr);
    if (hasCityArt()) {
      const hits = drawCityView(pctx, vw, vh, {
        cityId: c.id,
        size: c.size,
        buildings: c.buildings,
        era: currentEra(s.players[c.owner]!),
        coastal: isCoastal(s, c),
      });
      // Buildings in the picture open their encyclopedia page.
      const at = (e: MouseEvent) => {
        const box = pc.getBoundingClientRect();
        return hitAt(hits, ((e.clientX - box.left) / box.width) * vw, ((e.clientY - box.top) / box.height) * vh);
      };
      pc.addEventListener("mousemove", (e) => {
        const hit = at(e);
        pc.style.cursor = hit ? "pointer" : "";
        pc.title = hit ? t("{hit} · klikni a přečti si o ní v encyklopedii", { hit: hit.name }) : "";
      });
      pc.addEventListener("click", (e) => {
        const hit = at(e);
        if (hit) host.openEntry(hit.entry);
      });
    } else if (cityArtSettled()) {
      // The pictures could not be loaded: fall back to the drawn panorama.
      drawPanorama(pctx, vw, vh, s, c);
    } else {
      // The pictures are still on their way; a quiet sky beats a flash of the old drawing.
      const sky = pctx.createLinearGradient(0, 0, 0, vh);
      sky.addColorStop(0, "#9cc4dc");
      sky.addColorStop(1, "#7fa86a");
      pctx.fillStyle = sky;
      pctx.fillRect(0, 0, vw, vh);
      pctx.fillStyle = "rgba(20, 30, 20, 0.55)";
      pctx.font = "14px system-ui, sans-serif";
      pctx.textAlign = "center";
      pctx.fillText(t("Načítám obrázek města…"), vw / 2, vh / 2);
    }
    view.append(pc);

    // Citizens.
    const people = dialog.querySelector<HTMLDivElement>(".cs-people")!;
    const kinds: CitizenKind[] = [
      ...Array<CitizenKind>(h.happy).fill("happy"),
      ...Array<CitizenKind>(h.content).fill("content"),
      ...Array<CitizenKind>(h.unhappy).fill("unhappy"),
      ...Array<CitizenKind>(h.entertainers).fill("entertainer"),
      ...Array<CitizenKind>(h.taxmen).fill("taxman"),
      ...Array<CitizenKind>(h.scientists).fill("scientist"),
    ];
    const [cc, cctx, cdpr] = hiDpiCanvas(Math.max(40, kinds.length * 26 + 8), 48);
    cctx.scale(cdpr, cdpr);
    kinds.forEach((k, n) => drawCitizen(cctx, 16 + n * 26, 46, k, n + c.id));
    people.append(cc);
    // A click on a specialist turns an entertainer into a taxman, a taxman into a scientist and back.
    const NAMES: Record<CitizenKind, string> = {
      happy: t("šťastný obyvatel"),
      content: t("spokojený obyvatel"),
      unhappy: t("nespokojený obyvatel"),
      entertainer: t("bavič: +{n} zábavy", { n: RULES.specialistYield }),
      taxman: t("výběrčí daní: +{n} zlata", { n: RULES.specialistYield }),
      scientist: t("vědec: +{n} vědy", { n: RULES.specialistYield }),
    };
    const kindAt = (e: MouseEvent): CitizenKind | null => {
      const box = cc.getBoundingClientRect();
      const n = Math.floor(((e.clientX - box.left) / box.width) * (cc.width / cdpr) / 26 - 3 / 26);
      return kinds[Math.max(0, Math.min(kinds.length - 1, n))] ?? null;
    };
    cc.addEventListener("mousemove", (e) => {
      const k = kindAt(e);
      const special = k === "entertainer" || k === "taxman" || k === "scientist";
      cc.title = k ? NAMES[k] + (special && c.size >= RULES.specialistMinSize ? t(" · klikni a změň ho") : "") : "";
      cc.style.cursor = special && c.size >= RULES.specialistMinSize ? "pointer" : "";
    });
    cc.addEventListener("click", (e) => {
      const k = kindAt(e);
      if (c.size < RULES.specialistMinSize) return;
      if (k === "entertainer") act({ type: "setSpecialists", cityId: c.id, taxmen: h.taxmen + 1, scientists: h.scientists });
      else if (k === "taxman") act({ type: "setSpecialists", cityId: c.id, taxmen: h.taxmen - 1, scientists: h.scientists + 1 });
      else if (k === "scientist") act({ type: "setSpecialists", cityId: c.id, taxmen: h.taxmen, scientists: h.scientists - 1 });
    });

    // Land around the city.
    renderMap(dialog.querySelector<HTMLDivElement>(".cs-map")!, s, c);

    // Pictures.
    const pp = dialog.querySelector<HTMLDivElement>(".cs-prod-pic")!;
    pp.append(pictureOf(c.production, 104, 80, c.owner));
    dialog.querySelectorAll<HTMLButtonElement>(".cs-opt-main").forEach((b) => {
      const o = options[Number(b.dataset.opt)]!;
      b.querySelector(".cs-opt-pic")!.append(pictureOf(o, 40, 30, c.owner));
      b.addEventListener("click", () => act({ type: "setProduction", cityId: c.id, item: o }));
    });
    dialog.querySelectorAll<HTMLButtonElement>(".cs-opt-add").forEach((b) => {
      const o = options[Number(b.dataset.add)]!;
      b.addEventListener("click", () => act({ type: "setQueue", cityId: c.id, queue: [...c.queue, o] }));
    });
    dialog.querySelectorAll<HTMLButtonElement>("[data-unq]").forEach((b) =>
      b.addEventListener("click", () => act({ type: "setQueue", cityId: c.id, queue: c.queue.filter((_, k) => k !== Number(b.dataset.unq)) })),
    );
    // The plan can be reordered with the arrows or by dragging a chip onto another.
    const move = (from: number, to: number) => {
      if (from === to || from < 0 || to < 0 || from >= c.queue.length || to >= c.queue.length) return;
      const q = [...c.queue];
      const [item] = q.splice(from, 1);
      q.splice(to, 0, item!);
      act({ type: "setQueue", cityId: c.id, queue: q });
    };
    dialog.querySelectorAll<HTMLButtonElement>("[data-move]").forEach((b) =>
      b.addEventListener("click", () => move(Number(b.dataset.move), Number(b.dataset.to))),
    );
    dialog.querySelectorAll<HTMLElement>(".cs-chip[data-q]").forEach((chip) => {
      chip.addEventListener("dragstart", (e) => {
        e.dataTransfer?.setData("text/plain", chip.dataset.q!);
        chip.classList.add("dragging");
      });
      chip.addEventListener("dragend", () => chip.classList.remove("dragging"));
      chip.addEventListener("dragover", (e) => {
        e.preventDefault();
        chip.classList.add("drop");
      });
      chip.addEventListener("dragleave", () => chip.classList.remove("drop"));
      chip.addEventListener("drop", (e) => {
        e.preventDefault();
        const from = Number(e.dataTransfer?.getData("text/plain"));
        if (Number.isInteger(from)) move(from, Number(chip.dataset.q));
      });
    });
    setUpSplit();
    dialog.querySelectorAll<HTMLButtonElement>("[data-sell]").forEach((b) =>
      b.addEventListener("click", () => {
        const key = `${c.id}:${b.dataset.sell}`;
        // Selling cannot be undone, so the first click only asks.
        if (sellConfirm !== key) {
          sellConfirm = key;
          render();
          return;
        }
        sellConfirm = null;
        act({ type: "sellBuilding", cityId: c.id, building: b.dataset.sell as BuildingId });
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>(".cs-building").forEach((d) => {
      const id = d.dataset.b as BuildingId;
      d.querySelector(".pic")!.append(buildingArtCanvas(id, 36, 28) ?? buildingPortraitCanvas(id, 36, 28));
      d.addEventListener("click", () => host.openEntry(`${BUILDINGS[d.dataset.b as BuildingId].wonder ? "wdr" : "bld"}-${d.dataset.b}`));
    });
    dialog.querySelectorAll<HTMLButtonElement>(".cs-unit").forEach((b) => {
      const pic = b.querySelector<HTMLSpanElement>(".pic")!;
      pic.append(unitPortraitCanvas(pic.dataset.type as never, c.owner, 40, 34));
      b.addEventListener("click", () => {
        close();
        host.selectUnit(Number(b.dataset.unit));
      });
    });
    dialog.querySelectorAll<HTMLButtonElement>("[data-entry]").forEach((b) => b.addEventListener("click", () => host.openEntry(b.dataset.entry!)));
    dialog.querySelectorAll<HTMLButtonElement>("[data-detail]").forEach((b) =>
      b.addEventListener("click", () => {
        const o = options[Number(b.dataset.detail)]!;
        detail = o.kind === "wealth" || (detail && sameItem(detail, o)) ? null : o;
        render();
      }),
    );
    const card = dialog.querySelector<HTMLDivElement>(".cs-detail");
    if (card && shown) {
      card.querySelector("[data-pd-close]")?.addEventListener("click", () => {
        detail = null;
        render();
      });
      card.querySelector("[data-pd-build]")?.addEventListener("click", () => act({ type: "setProduction", cityId: c.id, item: shown }));
      card.querySelector("[data-pd-add]")?.addEventListener("click", () => act({ type: "setQueue", cityId: c.id, queue: [...c.queue, shown] }));
      card.querySelector<HTMLButtonElement>("[data-pd-entry]")?.addEventListener("click", (e) => host.openEntry((e.currentTarget as HTMLButtonElement).dataset.pdEntry!));
      const pic = card.querySelector<HTMLDivElement>(".pd-pic")!;
      if (!pic.querySelector("img")) pic.append(pictureOf(shown, 150, 112, c.owner));
    }
    dialog.querySelector("[data-close]")?.addEventListener("click", close);
    dialog.querySelectorAll("[data-about]").forEach((b) =>
      b.addEventListener("click", () => {
        aboutOpen = !aboutOpen;
        render();
      }),
    );
    dialog.querySelector("[data-buy]")?.addEventListener("click", () => act({ type: "buy", cityId: c.id }));
    dialog.querySelector<HTMLSelectElement>("[data-governor]")?.addEventListener("change", (e) => {
      const value = (e.currentTarget as HTMLSelectElement).value;
      act({ type: "setGovernor", cityId: c.id, goal: value ? (value as GovernorGoal) : null });
    });
    dialog.querySelector("[data-auto]")?.addEventListener("click", () => act({ type: "autoAssignWorkers", cityId: c.id }));
    dialog.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((b) =>
      b.addEventListener("click", () => {
        const next = cities[(index + Number(b.dataset.nav) + cities.length) % cities.length];
        if (next) open(next.id);
      }),
    );
  }

  /** Lets the player drag the border between the city picture and the panels. */
  function setUpSplit(): void {
    const split = dialog.querySelector<HTMLDivElement>("[data-split]");
    const bottom = dialog.querySelector<HTMLDivElement>(".cs-bottom");
    if (!split || !bottom) return;
    let start: { y: number; h: number } | null = null;
    split.addEventListener("pointerdown", (e) => {
      start = { y: e.clientY, h: bottom.getBoundingClientRect().height };
      split.setPointerCapture(e.pointerId);
      split.classList.add("dragging");
    });
    split.addEventListener("pointermove", (e) => {
      if (!start) return;
      const max = dialog.clientHeight - 200;
      const h = Math.max(220, Math.min(max, start.h - (e.clientY - start.y)));
      bottom.style.height = `${h}px`;
    });
    const end = () => {
      if (!start) return;
      start = null;
      split.classList.remove("dragging");
      panelHeight = Math.round(bottom.getBoundingClientRect().height);
      try {
        localStorage.setItem(PANEL_KEY, String(panelHeight));
      } catch {
        // The height holds until the page reloads.
      }
      render();
    };
    split.addEventListener("pointerup", end);
    split.addEventListener("pointercancel", end);
    split.addEventListener("dblclick", () => {
      panelHeight = null;
      try {
        localStorage.removeItem(PANEL_KEY);
      } catch {
        // Nothing stored, nothing to remove.
      }
      render();
    });
  }

  /** The governor picker under the plan. */
  function governorRow(c: City): string {
    const goal = c.governor;
    const options = [null, ...GOVERNOR_GOALS]
      .map((g) => `<option value="${g ?? ""}" ${g === goal ? "selected" : ""}>${escapeHtml(governorLabel(g))}</option>`)
      .join("");
    return `<div class="cs-gov ${goal ? "on" : ""}">
      <label><span class="cs-plan-label">${t("Správce:")}</span> <select data-governor>${options}</select></label>
      <span class="small ${goal ? "" : "muted"}">${escapeHtml(governorText(goal))}</span>
    </div>`;
  }

  function pictureOf(item: ProductionItem, w: number, h: number, owner: number): HTMLCanvasElement {
    if (item.kind === "wealth") return coinsCanvas(w, h);
    if (item.kind === "unit") return unitPortraitCanvas(item.id, owner, w, h);
    return buildingArtCanvas(item.id, w, h) ?? buildingPortraitCanvas(item.id, w, h);
  }

  function renderMap(holder: HTMLDivElement, s: GameState, c: City): void {
    const size = 5 * TILE_PX;
    const [canvas, ctx, dpr] = hiDpiCanvas(size, size);
    const x0 = c.x - 2;
    const y0 = c.y - 2;
    drawTerrainPatch(ctx, host.drawInput(), x0, y0, 5, 5, TILE_PX * dpr);
    ctx.scale(dpr, dpr);
    const radius = new Set(cityRadiusTiles(s.map, c));
    const free = new Set(workableTiles(s, c));
    const explored = s.players[c.owner]?.explored ?? [];
    const center = c.y * s.map.width + c.x;
    for (let dy = 0; dy < 5; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        const mx = x0 + dx;
        const my = y0 + dy;
        const px = dx * TILE_PX;
        const py = dy * TILE_PX;
        if (mx < 0 || my < 0 || mx >= s.map.width || my >= s.map.height) {
          ctx.fillStyle = "#111";
          ctx.fillRect(px, py, TILE_PX, TILE_PX);
          continue;
        }
        const i = my * s.map.width + mx;
        if (!radius.has(i) || !explored[i]) {
          ctx.fillStyle = "rgba(10, 10, 12, 0.72)";
          ctx.fillRect(px, py, TILE_PX, TILE_PX);
          continue;
        }
        const worked = c.worked.includes(i) || i === center;
        if (!worked) {
          ctx.fillStyle = free.has(i) ? "rgba(0, 0, 0, 0.22)" : "rgba(0, 0, 0, 0.55)";
          ctx.fillRect(px, py, TILE_PX, TILE_PX);
        }
        if (worked || free.has(i)) {
          const y = cityTileYield(s, c, i);
          const icons: ("food" | "shields" | "trade")[] = [
            ...Array<"food">(y.food).fill("food"),
            ...Array<"shields">(y.shields).fill("shields"),
            ...Array<"trade">(y.trade).fill("trade"),
          ];
          const per = Math.min(icons.length, 4);
          const rowsN = Math.ceil(icons.length / 4);
          icons.forEach((kind, n) => {
            const row = Math.floor(n / 4);
            const col = n % 4;
            const inRow = row === rowsN - 1 ? icons.length - row * 4 : per;
            const ix = px + TILE_PX / 2 + (col - (inRow - 1) / 2) * 11;
            const iy = py + TILE_PX - 9 - (rowsN - 1 - row) * 11;
            ctx.globalAlpha = worked ? 1 : 0.55;
            drawYieldIcon(ctx, kind, ix, iy, 4.6);
          });
          ctx.globalAlpha = 1;
        }
        if (c.worked.includes(i)) {
          ctx.strokeStyle = "rgba(255, 246, 214, 0.95)";
          ctx.lineWidth = 2;
          ctx.strokeRect(px + 2, py + 2, TILE_PX - 4, TILE_PX - 4);
          drawCitizen(ctx, px + 10, py + 26, "content", i);
        }
      }
    }
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.lineWidth = 1;
    for (let k = 1; k < 5; k++) {
      ctx.beginPath();
      ctx.moveTo(k * TILE_PX, 0);
      ctx.lineTo(k * TILE_PX, size);
      ctx.moveTo(0, k * TILE_PX);
      ctx.lineTo(size, k * TILE_PX);
      ctx.stroke();
    }
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const dx = Math.floor(((e.clientX - rect.left) / rect.width) * 5);
      const dy = Math.floor(((e.clientY - rect.top) / rect.height) * 5);
      const mx = x0 + dx;
      const my = y0 + dy;
      if (mx < 0 || my < 0 || mx >= s.map.width || my >= s.map.height) return;
      const i = my * s.map.width + mx;
      if (i === center) return;
      clickTile(i);
    });
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const dx = Math.floor(((e.clientX - rect.left) / rect.width) * 5);
      const dy = Math.floor(((e.clientY - rect.top) / rect.height) * 5);
      const mx = x0 + dx;
      const my = y0 + dy;
      const i = my * s.map.width + mx;
      const ter = s.map.terrain[i];
      canvas.title = ter && explored[i] ? `${terrainName(ter)}${s.map.road[i] ? t(", cesta") : ""}${s.map.irrigation[i] ? t(", zavlažování") : ""}${s.map.mine[i] ? t(", důl") : ""}` : "";
    });
    holder.append(canvas);
  }

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  return {
    open,
    isOpen: () => dialog.open,
    /** The city whose screen is open, or null. */
    openCityId: () => (dialog.open ? cityId : null),
    refresh(): void {
      if (dialog.open) render();
    },
  };
}
