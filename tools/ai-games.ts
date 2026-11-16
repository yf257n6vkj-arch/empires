/**
 * Headless games of computer players only, to judge the AI on many maps
 * instead of single screenshots (CLAUDE.md).
 *
 *   npm run ai-games -- 50            50 games of 120 turns on the standard world
 *   npm run ai-games -- 20 13111211   the same in a world from eight map-code digits
 *   npm run ai-games -- 50 --barbarians=many   with many barbarians (none, few or many; few by default)
 *   npm run ai-games -- 50 --difficulty=hard   at a difficulty (veryEasy, easy, normal, hard, veryHard); seat 0
 *                                              then plays as a person would be helped: normal skill, no bonus
 *
 * Prints how many cities and technologies the players have over time, how
 * often someone gets stuck with one city, and how many cities stand on islands.
 */
import { isBarbarian, mainContinent, scoreOf, newGame, parseGameCode, type BarbarianLevel, type Difficulty, type GameState } from "../src/core";
import { playTurn } from "../src/ai";

const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const level = (process.argv.find((a) => a.startsWith("--barbarians="))?.split("=")[1] ?? "few") as BarbarianLevel;
const difficultyArg = process.argv.find((a) => a.startsWith("--difficulty="))?.split("=")[1] as Difficulty | undefined;
const difficulty: Difficulty = difficultyArg ?? "normal";
const seatWins = { reference: 0, others: 0 };
const seatCities = { reference: [] as number[], others: [] as number[] };
/** Score of seat 0 in percent of the best rival's score at the end. */
const scoreShare: number[] = [];
const games = Number(args[0] ?? 20);
const digits = args[1];
const CHECKS = [20, 40, 60, 80, 100, 120];

type Row = { cities: number[]; techs: number[]; units: number[] };
const rows = new Map<number, Row>(CHECKS.map((t) => [t, { cities: [], techs: [], units: [] }]));
let stuck = 0;
let islandCities = 0;
let failures = 0;
let defeated = 0;
const firstWar: number[] = [];
let wars = 0;
let captured = 0;
let destroyed = 0;
let battles = 0;
let attackerWins = 0;
let ruins = 0;
let peaces = 0;
let routes = 0;
let helped = 0;
let embassies = 0;
let stolen = 0;
let incited = 0;
let incitedBarbarian = 0;
let sabotaged = 0;
let launches = 0;
let offers = 0;
let rejected = 0;
let broken = 0;
const warLengths: number[] = [];
let barbarianGroups = 0;
let barbarianUnits = 0;
let takenByBarbarians = 0;
let retaken = 0;
const wins: Record<string, number> = {};
let barbarianCities = 0;
const started = performance.now();

for (let g = 0; g < games; g++) {
  const seed = digits ? `ai-${g}/${digits}` : `ai-${g}`;
  try {
    const world = parseGameCode(seed).world;
    let s: GameState = newGame({ seed, playerCount: (world?.opponents ?? 3) + 1, opponentUnits: true, barbarians: level, difficulty });
    // With a difficulty set, seat 0 stands in for the person: normal skill and no bonus.
    s.players[0]!.isHuman = difficultyArg !== undefined;
    for (const p of s.players) {
      for (const u of s.units) if (u.owner === p.id) u.movesLeft = u.movesLeft;
    }
    // The human seat has no starting units until now; give it the same as the others.
    let warTurn: number | null = null;
    while (s.turn <= 121 && !s.victory) {
      const played = playTurn(s);
      for (const e of played.events) {
        if (e.type === "tradeRouteOpened") routes++;
        else if (e.type === "wonderHelped") helped++;
        else if (e.type === "embassyOpened") embassies++;
        else if (e.type === "techStolen") stolen++;
        else if (e.type === "cityIncited") {
          incited++;
          if (isBarbarian(s.players[e.from])) incitedBarbarian++;
        } else if (e.type === "citySabotaged") sabotaged++;
        else if (e.type === "spaceshipLaunched") launches++;
        if (e.type === "peaceOffered") offers++;
        else if (e.type === "peaceRejected") rejected++;
        else if (e.type === "peaceMade") {
          peaces++;
          const since = s.players[e.a]?.warSince[String(e.b)];
          if (since !== undefined) warLengths.push(s.turn - since);
        }
        if (e.type === "warDeclared" && e.brokeTreaty) broken++;
        if (e.type === "warDeclared") {
          wars++;
          warTurn ??= s.turn;
        } else if (e.type === "cityCaptured") {
          captured++;
          if (isBarbarian(s.players[e.to])) takenByBarbarians++;
          if (isBarbarian(s.players[e.from])) retaken++;
        } else if (e.type === "ruinsExplored") ruins++;
        else if (e.type === "barbariansAppeared") {
          barbarianGroups++;
          barbarianUnits += e.count;
        }
        else if (e.type === "cityDestroyed") destroyed++;
        else if (e.type === "combat") {
          battles++;
          if (e.attackerWon) attackerWins++;
        }
      }
      if (warTurn !== null && !firstWar.includes(-g - 1)) {
        firstWar.push(warTurn);
        firstWar.push(-g - 1);
      }
      s = played.state;
      if (s.currentPlayer === 0 && rows.has(s.turn - 1)) {
        const row = rows.get(s.turn - 1)!;
        for (const p of s.players) {
          if (p.defeated || isBarbarian(p)) continue;
          row.cities.push(s.cities.filter((c) => c.owner === p.id).length);
          row.techs.push(p.techs.length);
          row.units.push(s.units.filter((u) => u.owner === p.id).length);
        }
      }
    }
    if (s.victory) {
      if (s.victory.player === 0) seatWins.reference++;
      else seatWins.others++;
    }
    seatCities.reference.push(s.cities.filter((c) => c.owner === 0).length);
    const best = Math.max(1, ...s.players.slice(1).filter((p) => !isBarbarian(p)).map((p) => scoreOf(s, p.id).total));
    scoreShare.push(Math.round((100 * scoreOf(s, 0).total) / best));
    for (const p of s.players.slice(1)) if (!isBarbarian(p)) seatCities.others.push(s.cities.filter((c) => c.owner === p.id).length);
    const kind = s.victory?.kind ?? "none";
    wins[kind] = (wins[kind] ?? 0) + 1;
    const main = mainContinent(s.map);
    islandCities += s.cities.filter((c) => !main.has(c.y * s.map.width + c.x)).length;
    barbarianCities += s.cities.filter((c) => isBarbarian(s.players[c.owner])).length;
    for (const p of s.players) {
      if (isBarbarian(p)) continue;
      if (p.defeated) defeated++;
      else if (s.turn >= 60 && s.cities.filter((c) => c.owner === p.id).length <= 1) stuck++;
    }
  } catch (e) {
    failures++;
    console.error(`${seed}:`, (e as Error).stack);
  }
}

const med = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : 0;
};
const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : 0;
};
console.log(`${games} partií, ${((performance.now() - started) / 1000 / Math.max(1, games)).toFixed(1)} s na partii, chyby: ${failures}`);
for (const [turn, r] of rows) {
  console.log(`tah ${String(turn).padStart(3)}: města medián ${med(r.cities)} (10 % ${pct(r.cities, 0.1)}, 90 % ${pct(r.cities, 0.9)}) · technologie medián ${med(r.techs)} · jednotky medián ${med(r.units)}`);
}
console.log(`hráčů s jedním městem po 60. tahu: ${stuck} · poražených: ${defeated} · měst na ostrovech: ${islandCities}`);
const warTurns = firstWar.filter((t) => t >= 0);
console.log(`válek: ${wars} · partií s válkou: ${warTurns.length} z ${games} · první válka medián v tahu ${med(warTurns)} · bitev: ${battles} (útočník vyhrál ${battles ? Math.round((100 * attackerWins) / battles) : 0} %) · dobytých měst: ${captured} · zničených měst: ${destroyed}`);
console.log(`barbaři (${level}): skupin ${barbarianGroups}, jednotek ${barbarianUnits} · dobyli měst: ${takenByBarbarians}, vzato zpět: ${retaken} · drží na konci měst: ${barbarianCities} · prozkoumaných ruin: ${ruins}`);
console.log(`výhry: ${Object.entries(wins).map(([k, n]) => `${k} ${n}`).join(" · ")}`);
if (difficultyArg) {
  console.log(`obtížnost ${difficulty}: hráč na místě člověka vyhrál ${seatWins.reference}×, soupeři ${seatWins.others}× · města na konci: hráč medián ${med(seatCities.reference)}, soupeři medián ${med(seatCities.others)} · skóre hráče v % nejlepšího soupeře: medián ${med(scoreShare)}`);
}
console.log(`mír: nabídek ${offers}, odmítnutých ${rejected}, uzavřených mírů ${peaces} · válka do míru trvala medián ${med(warLengths)} tahů · porušených smluv ${broken}`);
console.log(`karavany: obchodních cest ${routes}, pomoc s divy ${helped}× · diplomati: velvyslanectví ${embassies}, ukradených objevů ${stolen}, podplacených měst ${incited} (barbarských ${incitedBarbarian}), sabotáží ${sabotaged} · vypuštěných lodí ${launches}`);
