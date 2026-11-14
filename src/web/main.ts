import { newGame, playerView, TERRAIN_IDS, TERRAINS, type GameState, type TerrainId } from "../core";
import { draw, setupCanvas, TERRAIN_COLORS, TILE, type DrawInput } from "./render";

const PLAYER_COUNT = 4;

const canvas = document.querySelector<HTMLCanvasElement>("#map")!;
const tooltip = document.querySelector<HTMLDivElement>("#tooltip")!;
const seedInput = document.querySelector<HTMLInputElement>("#seed")!;
const viewSelect = document.querySelector<HTMLSelectElement>("#view")!;
const legend = document.querySelector<HTMLTableElement>("#legend")!;
const stats = document.querySelector<HTMLDListElement>("#stats")!;

let game: GameState;
let ctx: CanvasRenderingContext2D;
let current: DrawInput;

function randomSeed(): string {
  const words = ["sever", "jih", "řeka", "hora", "údolí", "les", "zátoka", "pláň", "ostrov", "mys"];
  const w = words[Math.floor(Math.random() * words.length)];
  return `${w}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

function buildDrawInput(): DrawInput {
  const choice = viewSelect.value;
  if (choice === "all") {
    return {
      width: game.map.width,
      height: game.map.height,
      terrain: game.map.terrain,
      starts: game.players.map((p) => ({ point: p.start, playerId: p.id })),
    };
  }
  const view = playerView(game, Number(choice));
  return {
    width: view.width,
    height: view.height,
    terrain: view.terrain,
    starts: [{ point: view.start, playerId: view.playerId }],
  };
}

function render(): void {
  tooltip.hidden = true;
  current = buildDrawInput();
  draw(ctx, current);
}

function startGame(seed: string): void {
  game = newGame({ seed, playerCount: PLAYER_COUNT });
  seedInput.value = seed;
  try {
    const url = new URL(window.location.href);
    url.hash = `seed=${encodeURIComponent(seed)}`;
    history.replaceState(null, "", url);
  } catch {
    // Some embedded viewers do not allow changing the address; the seed field is enough.
  }
  ctx = setupCanvas(canvas, game.map.width, game.map.height);
  render();
  fillLegend();
  fillStats();
}

function fillViewOptions(): void {
  viewSelect.innerHTML = "";
  const all = new Option("Celá mapa (ladění)", "all");
  viewSelect.add(all);
  for (let i = 0; i < PLAYER_COUNT; i++) {
    viewSelect.add(new Option(`Pohled: ${i === 0 ? "Hráč" : `Soupeř ${i}`} (${i + 1})`, String(i)));
  }
  viewSelect.value = "all";
}

function fillLegend(): void {
  const land = game.map.terrain.filter((t) => t !== "ocean").length;
  const counts = new Map<TerrainId, number>();
  for (const t of game.map.terrain) counts.set(t, (counts.get(t) ?? 0) + 1);
  legend.innerHTML = `<tr><td></td><td class="num" title="jídlo / štíty / obchod">J/Š/O</td><td class="num">souše</td></tr>`;
  for (const id of TERRAIN_IDS) {
    const t = TERRAINS[id];
    const share = id === "ocean" ? "" : `${Math.round(((counts.get(id) ?? 0) / land) * 100)} %`;
    legend.insertAdjacentHTML(
      "beforeend",
      `<tr><td><span class="swatch" style="background:${TERRAIN_COLORS[id]}"></span>${t.name}</td>` +
        `<td class="num">${t.food}/${t.shields}/${t.trade}</td><td class="num">${share}</td></tr>`,
    );
  }
}

function fillStats(): void {
  const land = game.map.terrain.filter((t) => t !== "ocean").length;
  const rows: [string, string][] = [
    ["Velikost", `${game.map.width} × ${game.map.height}`],
    ["Políček souše", `${land} (${Math.round((land / game.map.terrain.length) * 100)} %)`],
    ["Hráči", String(game.players.length)],
  ];
  stats.innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("");
}

canvas.addEventListener("mousemove", (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / TILE);
  const y = Math.floor((e.clientY - rect.top) / TILE);
  const t = current?.terrain[y * current.width + x];
  if (x < 0 || y < 0 || x >= current.width || y >= current.height) {
    tooltip.hidden = true;
    return;
  }
  if (!t) {
    tooltip.textContent = `[${x}, ${y}] neprozkoumáno`;
  } else {
    const r = TERRAINS[t];
    tooltip.innerHTML = `<b>${r.name}</b> [${x}, ${y}]<br>jídlo ${r.food} · štíty ${r.shields} · obchod ${r.trade}` +
      (r.land ? `<br>pohyb ${r.moveCost}${r.defenseBonus ? ` · obrana +${r.defenseBonus} %` : ""}` : "");
  }
  tooltip.hidden = false;
  const left = Math.min(e.clientX - rect.left + 14, rect.width - tooltip.offsetWidth - 4);
  const top = Math.min(e.clientY - rect.top + 14, rect.height - tooltip.offsetHeight - 4);
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
});
canvas.addEventListener("mouseleave", () => (tooltip.hidden = true));

document.querySelector("#generate")!.addEventListener("click", () => startGame(seedInput.value.trim() || randomSeed()));
document.querySelector("#random")!.addEventListener("click", () => startGame(randomSeed()));
seedInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startGame(seedInput.value.trim() || randomSeed());
});
viewSelect.addEventListener("change", render);

fillViewOptions();
const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("seed");
startGame(fromHash || randomSeed());
