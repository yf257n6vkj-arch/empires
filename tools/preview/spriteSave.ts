// A small explored area with cities of three sizes and the units of the graphics trial, for side-by-side screenshots.
import { writeFileSync } from "node:fs";
import { apply, makeUnit, newGame, STATE_VERSION, type GameState, type UnitTypeId } from "../../src/core";
let s: GameState = newGame({ seed: process.argv[2] ?? "pohled-1", playerCount: 4, civ: "czechs" });
const w = s.map.width;
const h = s.map.height;
const p = s.players[0]!;
p.explored = p.explored.map(() => 1);
const settler = s.units.find((u) => u.owner === 0 && u.type === "settlers")!;
const land = (x: number, y: number) => x >= 1 && y >= 1 && x < w - 1 && y < h - 1 && s.map.terrain[y * w + x] !== "ocean";
const spots: { x: number; y: number }[] = [];
for (let r = 0; r < 12 && spots.length < 4; r++)
  for (let y = settler.y - r; y <= settler.y + r; y++)
    for (let x = settler.x - r; x <= settler.x + r; x++)
      if (land(x, y) && spots.every((q) => Math.max(Math.abs(q.x - x), Math.abs(q.y - y)) >= 4) && spots.length < 4) spots.push({ x, y });
const sizes = [2, 5, 9, 4];
spots.forEach((at, k) => {
  const owner = k === 3 ? 1 : 0;
  const u = makeUnit(s.nextId++, owner, "settlers", at, null);
  s.units.push(u);
  s.currentPlayer = owner;
  s = apply(s, { type: "foundCity", unitId: u.id });
  s.cities[s.cities.length - 1]!.size = sizes[k]!;
});
s.currentPlayer = 0;
s.units = s.units.filter((u) => u.owner !== 0 || u.type !== "settlers" || u.id !== settler.id);
const types: UnitTypeId[] = ["warriors", "knights", "musketeers", "tank", "settlers"];
let k = 0;
for (const c of s.cities.filter((c) => c.owner === 0)) {
  for (const [dx, dy] of [[1, 0], [0, 1], [-1, 1]] as const) {
    const x = c.x + dx;
    const y = c.y + dy;
    if (land(x, y) && k < types.length) s.units.push(makeUnit(s.nextId++, 0, types[k++]!, { x, y }, c.id));
  }
}
const sea = s.map.terrain.findIndex((t, i) => t === "ocean" && s.cities.some((c) => Math.max(Math.abs((i % w) - c.x), Math.abs(Math.floor(i / w) - c.y)) === 1));
if (sea >= 0) s.units.push(makeUnit(s.nextId++, 0, "trireme", { x: sea % w, y: Math.floor(sea / w) }, null));
writeFileSync(process.argv[3] ?? "/tmp/prev/sprites.json", JSON.stringify({ version: STATE_VERSION, state: s, log: [] }));
console.log("cities", s.cities.map((c) => `${c.name} ${c.size} @${c.x},${c.y}`).join(" | "), "units", s.units.length);
