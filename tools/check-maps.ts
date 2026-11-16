/**
 * Generates many maps headless and prints statistics, so changes to the
 * generator can be judged on hundreds of seeds instead of a few screenshots.
 *
 *   npm run check-maps -- 500
 *   npm run check-maps -- 20 svety    (every combination of extreme world settings, 20 maps each)
 */
import {
  DEFAULT_WORLD,
  formatGameCode,
  mainContinent,
  maxOpponents,
  minPairDistance,
  newGame,
  TERRAIN_IDS,
  WORLD_OPTIONS,
  type TerrainId,
  type WorldSettings,
} from "../src/core";

if (process.argv[3] === "svety" || process.argv[3] === "worlds") {
  checkWorlds(Number(process.argv[2] ?? 20));
  process.exit(0);
}

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

/**
 * Every combination of the extreme world settings, each with the most
 * opponents its size allows. Prints one line per size and shape.
 */
function checkWorlds(perCombo: number): void {
  type Row = { maps: number; failures: number; distances: number[]; islandTiles: number; land: number };
  const rows = new Map<string, Row>();
  const started = performance.now();
  let n = 0;
  for (const size of WORLD_OPTIONS.size)
    for (const shape of WORLD_OPTIONS.shape)
      for (const land of WORLD_OPTIONS.land)
        for (const temperature of ["cool", "warm"] as const)
          for (const rainfall of ["arid", "wet"] as const)
            for (const age of ["young", "old"] as const) {
              const world: WorldSettings = { ...DEFAULT_WORLD, size, shape, land, temperature, rainfall, age, opponents: maxOpponents(size) };
              const key = `${size.padEnd(6)} ${shape.padEnd(9)} ${land.padEnd(6)}`;
              const row = rows.get(key) ?? { maps: 0, failures: 0, distances: [], islandTiles: 0, land: 0 };
              rows.set(key, row);
              for (let s = 0; s < perCombo; s++) {
                row.maps++;
                n++;
                try {
                  const game = newGame({ seed: formatGameCode(`svet-${n}`, world), playerCount: world.opponents + 1, world });
                  const main = mainContinent(game.map);
                  const landTiles = game.map.terrain.filter((t) => t !== "ocean" && t !== "arctic").length;
                  row.land += landTiles / game.map.terrain.length;
                  row.islandTiles += landTiles - main.size;
                  row.distances.push(minPairDistance(game.players.map((p) => p.start)));
                } catch (e) {
                  row.failures++;
                  console.error(`svet-${n} ${key}:`, (e as Error).message);
                }
              }
            }
  console.log(`Světy: ${n} map, ${((performance.now() - started) / n).toFixed(1)} ms na mapu, nejvíc soupeřů pro každou velikost`);
  console.log("velikost tvar      pevnina  chyby  souše  ostrovy(políček)  vzdálenost startů min/medián  pod 6");
  for (const [key, r] of rows) {
    const sorted = [...r.distances].sort((a, b) => a - b);
    const ok = r.maps - r.failures;
    console.log(
      `${key}  ${String(r.failures).padStart(5)}  ${((r.land / ok) * 100).toFixed(1).padStart(5)} %  ${(r.islandTiles / ok).toFixed(1).padStart(8)}          ${String(sorted[0]).padStart(3)} / ${String(sorted[Math.floor(sorted.length / 2)]).padStart(3)}            ${sorted.filter((d) => d < 6).length}`,
    );
  }
}
