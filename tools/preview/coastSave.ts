// A late-game coastal city with every Civilization 1 building, for screenshots of the city screen.
import { writeFileSync } from "node:fs";
import { apply, BUILDING_IDS, BUILDINGS, isCoastal, newGame, STATE_VERSION, TECH_IDS, workableTiles, type GameState } from "../../src/core";
let s: GameState = newGame({ seed: process.argv[2] ?? "pohled-1", playerCount: 4 });
const settler = s.units.find((u) => u.owner === 0 && u.type === "settlers")!;
const w = s.map.width;
// Move the settler to the coastal land tile nearest to the start.
let best = -1;
let bestD = Infinity;
s.map.terrain.forEach((t, i) => {
  if (t !== "grassland" && t !== "plains") return;
  const x = i % w;
  const y = Math.floor(i / w);
  if (x < 3 || y < 3 || x > w - 4 || y > s.map.height - 4) return;
  const probe = { x, y } as never;
  if (!isCoastal(s, probe)) return;
  const d = Math.max(Math.abs(x - settler.x), Math.abs(y - settler.y));
  if (d < bestD) {
    bestD = d;
    best = i;
  }
});
settler.x = best % w;
settler.y = Math.floor(best / w);
s = apply(s, { type: "foundCity", unitId: settler.id });
const c = s.cities[0]!;
const p = s.players[0]!;
for (let y = c.y - 3; y <= c.y + 3; y++) for (let x = c.x - 3; x <= c.x + 3; x++) if (x >= 0 && y >= 0 && x < w && y < s.map.height) p.explored[y * w + x] = 1;
p.techs = [...TECH_IDS].filter((t) => t !== "fusionPower");
p.researching = "fusionPower";
p.gold = 400;
c.size = Number(process.argv[3] ?? 14);
const skip = new Set(["powerPlant", "hydroPlant", "greatWork", "stoneCircle", "hallOfScholars", "greatObservatory", "grandBazaar"]);
c.buildings = BUILDING_IDS.filter((b) => !skip.has(b) && !BUILDINGS[b].wonder) as never;
for (const i of workableTiles(s, c)) if (s.map.terrain[i] === "grassland" || s.map.terrain[i] === "plains") s.map.irrigation[i] = 1;
for (const t of ["riflemen", "tank"] as const) s.units.push({ id: s.nextId++, owner: 0, type: t, x: c.x, y: c.y, movesLeft: 3, homeCity: c.id, fortified: false, work: null, goto: null });
s = apply(s, { type: "autoAssignWorkers", cityId: c.id });
writeFileSync(process.argv[4] ?? "/tmp/prev/coast.json", JSON.stringify({ version: STATE_VERSION, state: s, log: [] }));
console.log("city at", c.x, c.y);
