/**
 * The city screen: a painted view of the city, its citizens, the land it
 * works, food and production stores, trade, happiness, buildings and units.
 */
import {
  BUILDINGS,
  buyCost,
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
  UNIT_TYPES,
  workableTiles,
  type BuildingId,
  type City,
  type Command,
  type GameState,
  type ProductionItem,
  type UnitId,
} from "../core";
import { BUILDING_WIDTH, buildingPortraitCanvas, drawBuilding, drawHouse, tone } from "./buildingArt";
import { drawTerrainPatch, drawUnitPortrait, PLAYER_COLORS, unitPortraitCanvas, type DrawInput } from "./render";
import { describeBuilding, describeUnit, escapeHtml } from "./texts";

export interface CityHost {
  state(): GameState;
  run(command: Command): boolean;
  /** Redraws the main screen after a change. */
  refresh(): void;
  selectUnit(id: UnitId): void;
  /** Background input for drawing the land around the city. */
  drawInput(): DrawInput;
  say(text: string): void;
}

function plural(n: number, one: string, few: string, many: string): string {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}

function turns(n: number): string {
  return `${n} ${plural(n, "tah", "tahy", "tahů")}`;
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
  const color = PLAYER_COLORS[city.owner % PLAYER_COLORS.length]!;
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

type CitizenKind = "content" | "unhappy" | "entertainer";

function drawCitizen(ctx: CanvasRenderingContext2D, x: number, y: number, kind: CitizenKind, k: number): void {
  const tunic = kind === "content" ? "#4f8a4a" : kind === "unhappy" ? "#a83a2c" : "#7a4fa8";
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
  else ctx.arc(0, -30.6, 2, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();
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

export function createCityScreen(host: CityHost) {
  const dialog = document.querySelector<HTMLDialogElement>("#city-dialog")!;
  let cityId: number | null = null;
  const TILE_PX = 54;

  function city(): City | undefined {
    return host.state().cities.find((c) => c.id === cityId);
  }

  function ownCities(): City[] {
    const s = host.state();
    return s.cities.filter((c) => c.owner === s.currentPlayer).sort((a, b) => a.id - b.id);
  }

  function open(id: number): void {
    cityId = id;
    if (!dialog.open) dialog.showModal();
    render();
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
      host.say("Obyvatel odešel z pole a baví ostatní ve městě.");
      return;
    }
    if (!free.has(i)) {
      host.say("Tohle políčko město obdělávat nemůže.");
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

  function render(): void {
    const c = city();
    if (!c) {
      if (dialog.open) dialog.close();
      return;
    }
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
        ? `dál neroste, na víc než ${r.maxSize} obyvatel potřebuje akvadukt`
        : r.turnsToGrow
          ? `vyroste za ${turns(r.turnsToGrow)}`
          : r.foodSurplus === 0
            ? "neroste"
            : "hladoví, zmenší se";
    const done = r.waitingForSize
      ? "čeká na druhého obyvatele"
      : c.shields >= cost
        ? "hotovo na konci tahu"
        : r.turnsToComplete
          ? `hotovo za ${turns(r.turnsToComplete)}`
          : "nevyrábí";
    const crowd = Math.max(0, c.size - RULES.contentBase);
    const unhappyBase = Math.min(c.size, crowd + r.pollution.unhappy);
    const calmedByBuildings = Math.min(unhappyBase, effects.content);
    const calmedBySoldiers = Math.min(unhappyBase - calmedByBuildings, martialLaw(s, c));
    const unitsHere = s.units.filter((u) => u.x === c.x && u.y === c.y && u.owner === c.owner);
    const supported = s.units.filter((u) => u.homeCity === c.id);
    const options = productionOptions(s, c);

    const optionCards = options
      .map((o, n) => {
        const t = r.shieldSurplus > 0 ? Math.max(1, Math.ceil((productionCost(o) - c.shields) / r.shieldSurplus)) : null;
        const wonder = o.kind === "building" && BUILDINGS[o.id].wonder;
        return `<button type="button" class="cs-opt ${sameItem(o, c.production) ? "on" : ""} ${wonder ? "wonder" : ""}" data-opt="${n}" title="${escapeHtml(
          o.kind === "building" ? describeBuilding(BUILDINGS[o.id]) : describeUnit(UNIT_TYPES[o.id]),
        )}"><span class="cs-opt-pic"></span><span class="cs-opt-name">${wonder ? "Div: " : ""}${escapeHtml(productionName(o))}</span><span class="cs-opt-cost">${productionCost(o)} ${yieldIcon("shields", 11)}${t ? ` · ${turns(t)}` : ""}</span></button>`;
      })
      .join("");

    dialog.innerHTML = `
      <div class="cs">
        <div class="cs-head">
          <button type="button" class="cs-nav" data-nav="-1" ${cities.length < 2 ? "disabled" : ""} title="Předchozí město">‹</button>
          <h2>${escapeHtml(c.name)}</h2>
          <button type="button" class="cs-nav" data-nav="1" ${cities.length < 2 ? "disabled" : ""} title="Další město">›</button>
          <span class="cs-sub">velikost ${c.size} · založeno v tahu ${c.foundedTurn} · ${index + 1}. město z ${cities.length}</span>
          <span class="spacer"></span>
          <button type="button" class="cs-close" data-close>Zavřít <kbd>Esc</kbd></button>
        </div>
        <div class="cs-view"></div>
        <div class="cs-citizens">
          <div class="cs-people"></div>
          <div class="cs-mood">
            ${h.disorder ? `<b class="neg">Nepokoje! Město tento tah nic nevyrobí.</b><br>` : ""}
            <span>Spokojení ${h.content}</span> · <span class="${h.unhappy ? "neg" : ""}">nespokojení ${h.unhappy}</span>${h.entertainers ? ` · baviči ${h.entertainers}` : ""}
            <div class="muted small">Bez pomoci je spokojených ${RULES.contentBase} obyvatel.${r.pollution.unhappy ? ` Znečištěný vzduch rozladí ${r.pollution.unhappy} ${r.pollution.unhappy === 1 ? "dalšího" : "další"}.` : ""}${unhappyBase ? ` Z ${unhappyBase} nespokojených uklidní budovy ${calmedByBuildings} a vojáci ve městě ${calmedBySoldiers}.` : ""}</div>
          </div>
        </div>
        <div class="cs-grid">
          <div class="cs-box cs-land">
            <h3>Okolí města</h3>
            <div class="cs-map"></div>
            <div class="cs-sum">${yieldIcon("food")} ${r.production.food} &nbsp; ${yieldIcon("shields")} ${r.production.shields} &nbsp; ${yieldIcon("trade")} ${r.production.trade}</div>
            <p class="muted small">Klikni na políčko a pošli na něj obyvatele, nebo ho z pole odvolej. ${c.manualTiles ? "Rozmístění jsi zvolil sám a platí, dokud město nevyroste nebo se nezmenší." : "Město teď rozmisťuje obyvatele samo."}</p>
            ${c.manualTiles ? `<button type="button" class="wide" data-auto>Rozmístit obyvatele automaticky</button>` : ""}
          </div>
          <div class="cs-box cs-stores">
            <h3>Zásoby jídla</h3>
            <div class="cs-food">${Array.from({ length: r.growthThreshold }, (_, k) => `<i class="${k < c.food ? "full" : ""}"></i>`).join("")}</div>
            <p class="small">${c.food} z ${r.growthThreshold} · ${signed(r.foodSurplus)} za tah · ${growth}${effects.keepFoodOnGrowth ? `<br><span class="muted">Sýpka po růstu ponechá ${Math.round(effects.keepFoodOnGrowth * 100)} % jídla.</span>` : ""}</p>
            <h3>Výroba</h3>
            <div class="cs-prod">
              <div class="cs-prod-pic"></div>
              <div>
                <b>${escapeHtml(productionName(c.production))}</b>
                <div class="cs-bar"><div style="width:${Math.min(100, (c.shields / cost) * 100)}%"></div></div>
                <div class="small">${Math.min(c.shields, cost)} z ${cost} ${yieldIcon("shields", 12)} · ${signed(r.shieldSurplus)} za tah · ${done}</div>
                ${r.unitUpkeep ? `<div class="muted small">Údržba jednotek z města stojí ${r.unitUpkeep} ${yieldIcon("shields", 11)} za tah.</div>` : ""}
                ${price > 0 ? `<button type="button" data-buy ${gold < price ? `disabled title="Máš jen ${gold} zlata."` : ""}>Koupit hned za ${price} zlata</button>` : ""}
              </div>
            </div>
            <h3>Co stavět dál</h3>
            <div class="cs-opts">${optionCards}</div>
          </div>
          <div class="cs-box cs-info">
            <h3>Obchod</h3>
            <div class="cs-trade">
              <div>${yieldIcon("trade")} obchod <b>${r.production.trade}</b>${r.routes ? ` <span class="muted">(z toho obchodní cesty ${r.routes})</span>` : ""}</div>
              ${r.corruption ? `<div>korupce <b class="neg">−${r.corruption}</b> <span class="muted">(${corruptionPct(s, c, effects)} % ${effects.corruptionCutPct ? "i se soudním dvorem" : "kvůli vzdálenosti od paláce"})</span></div>` : effects.capital ? `<div class="muted small">Tady sídlí vláda, korupce tu není.</div>` : ""}
              <div>věda <b>${r.science}</b>${effects.sciencePct ? ` <span class="muted">(+${effects.sciencePct} % z budov)</span>` : ""}</div>
              <div>zlato <b>${r.gold}</b>${effects.goldPct ? ` <span class="muted">(+${effects.goldPct} % z budov)</span>` : ""}</div>
            </div>
            ${r.pollution.industry + r.pollution.population > 0 ? `<p class="small">Znečištění ${r.pollution.industry + r.pollution.population}, bez potíží město snese ${RULES.pollutionFree} <span class="muted">(z výroby ${r.pollution.industry}, od obyvatel ${r.pollution.population})</span></p>` : ""}
            ${c.tradeRoutes.length ? `<p class="small">Obchodní cesty do: ${c.tradeRoutes.map((id) => escapeHtml(s.cities.find((x) => x.id === id)?.name ?? "?")).join(", ")}</p>` : ""}
            <h3>Budovy</h3>
            <div class="cs-buildings">${
              c.buildings.length
                ? c.buildings
                    .map(
                      (b) =>
                        `<div class="cs-building" data-b="${b}" title="${escapeHtml(describeBuilding(BUILDINGS[b]))}"><span class="pic"></span><span>${escapeHtml(BUILDINGS[b].name)}</span><span class="muted">${BUILDINGS[b].upkeep ? `${BUILDINGS[b].upkeep} zl.` : ""}</span></div>`,
                    )
                    .join("")
                : `<span class="muted small">Zatím tu nestojí žádná budova.</span>`
            }</div>
            <h3>Jednotky ve městě</h3>
            <div class="cs-units">${
              unitsHere.length
                ? unitsHere
                    .map(
                      (u) =>
                        `<button type="button" class="cs-unit" data-unit="${u.id}" title="Vybrat jednotku"><span class="pic" data-type="${u.type}"></span>${escapeHtml(UNIT_TYPES[u.type].name)}${u.fortified ? " (opevněná)" : ""}</button>`,
                    )
                    .join("")
                : `<span class="muted small">Město nikdo nebrání.</span>`
            }</div>
            ${supported.some((u) => UNIT_TYPES[u.type].foodUpkeep) ? `<p class="muted small">Osadníci z tohoto města spotřebují ${supported.reduce((n, u) => n + UNIT_TYPES[u.type].foodUpkeep, 0)} jídla za tah.</p>` : ""}
          </div>
        </div>
      </div>`;

    // Panorama.
    const view = dialog.querySelector<HTMLDivElement>(".cs-view")!;
    const vw = Math.max(600, Math.min(1200, Math.floor(view.clientWidth) || 1120));
    const [pc, pctx, dpr] = hiDpiCanvas(vw, 250);
    pctx.scale(dpr, dpr);
    drawPanorama(pctx, vw, 250, s, c);
    view.append(pc);

    // Citizens.
    const people = dialog.querySelector<HTMLDivElement>(".cs-people")!;
    const kinds: CitizenKind[] = [
      ...Array<CitizenKind>(h.content).fill("content"),
      ...Array<CitizenKind>(h.unhappy).fill("unhappy"),
      ...Array<CitizenKind>(h.entertainers).fill("entertainer"),
    ];
    const [cc, cctx, cdpr] = hiDpiCanvas(Math.max(40, kinds.length * 26 + 8), 48);
    cctx.scale(cdpr, cdpr);
    kinds.forEach((k, n) => drawCitizen(cctx, 16 + n * 26, 46, k, n + c.id));
    people.append(cc);

    // Land around the city.
    renderMap(dialog.querySelector<HTMLDivElement>(".cs-map")!, s, c);

    // Pictures.
    const pp = dialog.querySelector<HTMLDivElement>(".cs-prod-pic")!;
    pp.append(pictureOf(c.production, 110, 84, c.owner));
    dialog.querySelectorAll<HTMLButtonElement>(".cs-opt").forEach((b) => {
      const o = options[Number(b.dataset.opt)]!;
      b.querySelector(".cs-opt-pic")!.append(pictureOf(o, 52, 40, c.owner));
      b.addEventListener("click", () => act({ type: "setProduction", cityId: c.id, item: o }));
    });
    dialog.querySelectorAll<HTMLDivElement>(".cs-building").forEach((d) =>
      d.querySelector(".pic")!.append(buildingPortraitCanvas(d.dataset.b as BuildingId, 44, 34)),
    );
    dialog.querySelectorAll<HTMLButtonElement>(".cs-unit").forEach((b) => {
      const pic = b.querySelector<HTMLSpanElement>(".pic")!;
      pic.append(unitPortraitCanvas(pic.dataset.type as never, c.owner, 40, 34));
      b.addEventListener("click", () => {
        close();
        host.selectUnit(Number(b.dataset.unit));
      });
    });
    dialog.querySelector("[data-close]")?.addEventListener("click", close);
    dialog.querySelector("[data-buy]")?.addEventListener("click", () => act({ type: "buy", cityId: c.id }));
    dialog.querySelector("[data-auto]")?.addEventListener("click", () => act({ type: "autoAssignWorkers", cityId: c.id }));
    dialog.querySelectorAll<HTMLButtonElement>("[data-nav]").forEach((b) =>
      b.addEventListener("click", () => {
        const next = cities[(index + Number(b.dataset.nav) + cities.length) % cities.length];
        if (next) open(next.id);
      }),
    );
  }

  function pictureOf(item: ProductionItem, w: number, h: number, owner: number): HTMLCanvasElement {
    return item.kind === "unit" ? unitPortraitCanvas(item.id, owner, w, h) : buildingPortraitCanvas(item.id, w, h);
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
      const t = s.map.terrain[i];
      canvas.title = t && explored[i] ? `${TERRAINS[t].name}${s.map.road[i] ? ", cesta" : ""}${s.map.irrigation[i] ? ", zavlažování" : ""}${s.map.mine[i] ? ", důl" : ""}` : "";
    });
    holder.append(canvas);
  }

  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) close();
  });

  return {
    open,
    isOpen: () => dialog.open,
    refresh(): void {
      if (dialog.open) render();
    },
  };
}
