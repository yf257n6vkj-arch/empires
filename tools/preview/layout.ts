import { TECHS, TECH_IDS } from "../../src/core";
import { techLayoutForTests } from "../../src/web/techTree";
const l = techLayoutForTests();
const grid: string[][] = [];
for (const t of TECH_IDS) { const p = l.pos[t]; const r = Math.round((p.y - 50) / 78); const c = p.col; (grid[r] ??= [])[c] = TECHS[t].name.slice(0, 9).padEnd(9); }
for (const row of grid) console.log((row ?? []).map((x) => x ?? " ".repeat(9)).join("|"));
console.log(l.width, l.height);
