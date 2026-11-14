/**
 * Generates many maps headless and prints statistics, so changes to the
 * generator can be judged on hundreds of seeds instead of a few screenshots.
 *
 *   npm run check-maps -- 500
 */
import { minPairDistance, newGame, TERRAIN_IDS, type TerrainId } from "../src/core";

const count = Number(process.argv[2] ?? 200);
const totals = Object.fromEntries(TERRAIN_IDS.map((t) => [t, 0])) as Record<TerrainId, number>;
const landShares: number[] = [];
const minDistances: number[] = [];
let failures = 0;
const started = performance.now();

for (let s = 1; s <= count; s++) {
  try {
    const game = newGame({ seed: `check-${s}`, playerCount: 4 });
    const land = game.map.terrain.filter((t) => t !== "ocean").length;
    landShares.push(land / game.map.terrain.length);
    for (const t of game.map.terrain) totals[t]++;
    minDistances.push(minPairDistance(game.players.map((p) => p.start)));
  } catch (e) {
    failures++;
    console.error(`seed check-${s}:`, (e as Error).message);
  }
}

const ms = performance.now() - started;
const pct = (n: number) => `${(n * 100).toFixed(1)} %`;
const landTotal = TERRAIN_IDS.filter((t) => t !== "ocean").reduce((n, t) => n + totals[t], 0);
const sorted = [...minDistances].sort((a, b) => a - b);

console.log(`Map: ${count}, chyby: ${failures}, ${(ms / count).toFixed(1)} ms na mapu`);
console.log(`Podíl souše: min ${pct(Math.min(...landShares))}, průměr ${pct(landShares.reduce((a, b) => a + b, 0) / landShares.length)}, max ${pct(Math.max(...landShares))}`);
console.log("Terén (podíl ze souše):");
for (const t of TERRAIN_IDS) if (t !== "ocean") console.log(`  ${t.padEnd(10)} ${pct(totals[t] / landTotal)}`);
console.log(`Nejmenší vzdálenost mezi starty: min ${sorted[0]}, medián ${sorted[Math.floor(sorted.length / 2)]}, max ${sorted[sorted.length - 1]}`);
console.log(`  map se vzdáleností pod 8: ${sorted.filter((d) => d < 8).length}`);
