/**
 * End of the game: who won and how, a chart of how the nations went turn by
 * turn, the final table and an evaluation of the player's game. During the
 * game the same window works as the leaderboard and shows only the nations
 * the player knows.
 */
import { BUILDINGS, isBarbarian, RULES, scoreOf, type CivId, type GameState, type TurnRecord } from "../core";
import { t, tn } from "./i18n";
import { civName, leaderName } from "./i18n/names";
import { difficultyLabel } from "./newGame";
import { playerColor } from "./render";
import { spaceshipCanvas } from "./spaceshipArt";
import { escapeHtml, realmName } from "./texts";

export interface EndScreenHost {
  state(): GameState;
  player(): number;
  newGame(): void;
}

type Metric = "score" | "cities" | "techs";

interface Row {
  id: number;
  civ: CivId;
  score: number;
  cities: number;
  citizens: number;
  techs: number;
  wonders: number;
  defeated: boolean;
}

/** Where the player stands in one area: 1 is first. Ties share the better place. */
function rankIn(rows: Row[], me: number, value: (r: Row) => number): number {
  const mine = value(rows.find((r) => r.id === me)!);
  return 1 + rows.filter((r) => value(r) > mine).length;
}

function ordinal(n: number): string {
  const words = [t("první"), t("druhý"), t("třetí"), t("čtvrtý"), t("pátý"), t("šestý"), t("sedmý"), t("osmý")];
  return words[n - 1] ?? `${n}.`;
}

/** A title for the player's game, from the result and the score against the best rival. */
export function rulerTitle(won: boolean, defeated: boolean, share: number): string {
  if (defeated) return t("Poražený vládce");
  // A win is worth at least a wise ruler, even when the score lagged behind.
  if (won) share = Math.max(share, 0.95);
  if (share >= 1.5) return t("Vládce, na kterého se nezapomene");
  if (share >= 1.15) return t("Velký vládce");
  if (share >= 0.95) return t("Moudrý vládce");
  if (share >= 0.75) return t("Schopný vládce");
  if (share >= 0.5) return t("Vládce malé říše");
  return t("Náčelník kmene");
}

/** First turn the player led the score table alone, or null. */
export function firstLead(history: TurnRecord[], me: number, others: number[]): number | null {
  for (const r of history) {
    const mine = r.score[me] ?? 0;
    if (mine > 0 && others.every((o) => (r.score[o] ?? 0) < mine)) return r.turn;
  }
  return null;
}

/** Line chart of one value for the given players, as SVG. */
function chart(history: TurnRecord[], players: number[], me: number, metric: Metric): string {
  const W = 640;
  const H = 240;
  const L = 40;
  const B = 24;
  const top = 10;
  const lastTurn = Math.max(RULES.maxTurns, history.at(-1)?.turn ?? 1);
  const max = Math.max(1, ...history.flatMap((r) => players.map((p) => r[metric][p] ?? 0)));
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((s) => max / s <= 5) ?? 2000;
  const yMax = Math.ceil(max / step) * step;
  const x = (turn: number) => L + ((W - L - 8) * (turn - 1)) / Math.max(1, lastTurn - 1);
  const y = (v: number) => top + (H - top - B) * (1 - v / yMax);
  const grid: string[] = [];
  for (let v = 0; v <= yMax; v += step) {
    grid.push(`<line x1="${L}" x2="${W - 8}" y1="${y(v)}" y2="${y(v)}" class="ec-grid"/><text x="${L - 6}" y="${y(v) + 4}" class="ec-label" text-anchor="end">${v}</text>`);
  }
  for (let turn = 0; turn <= lastTurn; turn += 30) {
    const at = Math.max(1, turn);
    grid.push(`<text x="${x(at)}" y="${H - 6}" class="ec-label" text-anchor="middle">${at}</text>`);
  }
  const lines = players
    .slice()
    .sort((a, b) => (a === me ? 1 : b === me ? -1 : 0))
    .map((p) => {
      const pts = history.map((r) => `${x(r.turn).toFixed(1)},${y(r[metric][p] ?? 0).toFixed(1)}`).join(" ");
      return `<polyline points="${pts}" fill="none" stroke="${playerColor(p)}" stroke-width="${p === me ? 3.2 : 1.8}" stroke-linejoin="round"/>`;
    });
  return `<svg class="ec-chart" viewBox="0 0 ${W} ${H}" role="img">${grid.join("")}${lines.join("")}</svg>`;
}

export function createEndScreen(dialog: HTMLDialogElement, host: EndScreenHost) {
  let shown = false;
  let metric: Metric = "score";

  function rowsOf(s: GameState, ids: number[]): Row[] {
    return ids.map((id) => {
      const p = s.players[id]!;
      const sc = scoreOf(s, id);
      const cities = s.cities.filter((c) => c.owner === id);
      return {
        id,
        civ: p.civ as CivId,
        score: sc.total,
        cities: cities.length,
        citizens: cities.reduce((n, c) => n + c.size, 0),
        techs: p.techs.length,
        wonders: cities.reduce((n, c) => n + c.buildings.filter((b) => BUILDINGS[b].wonder).length, 0),
        defeated: p.defeated,
      };
    });
  }

  function headline(s: GameState, me: number): { title: string; text: string } {
    const v = s.victory;
    const realm = v ? escapeHtml(realmName(s, v.player)) : "";
    if (v) {
      const mine = v.player === me;
      const text =
        v.kind === "space"
          ? mine
            ? t("Tvoje vesmírná loď přistála u cizí hvězdy v tahu {turn}. Lidé z tvé říše založili první osadu mimo Zemi.", { turn: v.turn })
            : t("{realm} přistála u cizí hvězdy v tahu {turn} a vyhrála.", { realm, turn: v.turn })
          : v.kind === "conquest"
            ? mine
              ? t("V tahu {turn} padl poslední soupeř. Celý svět teď patří tvé říši.", { turn: v.turn })
              : t("{realm} v tahu {turn} porazila všechny soupeře a ovládla svět.", { realm, turn: v.turn })
            : mine
              ? t("Po {turn} tazích má tvoje říše nejvyšší skóre: {score} bodů.", { turn: v.turn, score: scoreOf(s, v.player).total })
              : t("Po {turn} tazích má nejvyšší skóre {realm}.", { realm, turn: v.turn });
      return { title: mine ? t("Vyhrál jsi!") : v.kind === "space" ? t("Konec závodu") : t("Konec hry"), text };
    }
    if (s.players[me]!.defeated) return { title: t("Prohrál jsi"), text: t("Padlo tvoje poslední město a tvoje říše zanikla.") };
    return {
      title: t("Žebříček"),
      text: t("Tah {turn} z {max}. Graf a tabulka ukazují národy, které znáš. Po posledním tahu vyhraje ten, kdo má nejvyšší skóre.", { turn: s.turn, max: RULES.maxTurns }),
    };
  }

  function evaluation(s: GameState, me: number, rows: Row[], over: boolean): string {
    const mine = rows.find((r) => r.id === me)!;
    const others = rows.filter((r) => r.id !== me);
    const best = Math.max(0, ...others.map((r) => r.score));
    const share = best === 0 ? 2 : mine.score / best;
    const won = s.victory?.player === me;
    const title = rulerTitle(won, s.players[me]!.defeated, share);

    const areas: { name: string; value: (r: Row) => number }[] = [
      { name: t("v počtu měst"), value: (r) => r.cities },
      { name: t("v počtu obyvatel"), value: (r) => r.citizens },
      { name: t("ve vědě"), value: (r) => r.techs },
      { name: t("v divech světa"), value: (r) => r.wonders },
    ];
    const ranked = areas.map((a) => ({ ...a, rank: rankIn(rows, me, a.value) }));
    const strongest = ranked.reduce((a, b) => (b.rank < a.rank ? b : a));
    const weakest = ranked.reduce((a, b) => (b.rank > a.rank ? b : a));
    const sentences: string[] = [];
    if (rows.length > 1) {
      sentences.push(t("Ve skóre jsi {place}.", { place: ordinal(rankIn(rows, me, (r) => r.score)) }));
      sentences.push(t("Nejlíp ti to jde {area}, tam jsi {place}.", { area: strongest.name, place: ordinal(strongest.rank) }));
      if (weakest.rank > strongest.rank) sentences.push(t("Nejvíc ztrácíš {area}, tam jsi {place}.", { area: weakest.name, place: ordinal(weakest.rank) }));
    }

    const p = s.players[me]!;
    const peak = s.history.reduce<TurnRecord | null>((a, r) => ((r.score[me] ?? 0) > (a?.score[me] ?? -1) ? r : a), null);
    const lead = firstLead(s.history, me, others.map((r) => r.id));
    const facts: [string, string][] = [
      [t("odehrané tahy"), String(Math.min(s.turn, RULES.maxTurns))],
      [t("obtížnost"), difficultyLabel(s.difficulty)],
      [t("založená města"), String(p.citiesFounded)],
      [t("dobytá města"), String(p.captured)],
      [t("objevy"), String(mine.techs)],
      [t("divy světa"), String(mine.wonders)],
    ];
    if (peak && (peak.score[me] ?? 0) > 0) facts.push([t("nejvyšší skóre"), t("{score} v tahu {turn}", { score: peak.score[me] ?? 0, turn: peak.turn })]);
    if (rows.length > 1) facts.push([t("poprvé v čele"), lead === null ? t("nikdy") : t("v tahu {turn}", { turn: lead })]);

    return `
      <h3>${over ? t("Jak jsi hrál") : t("Jak si zatím vedeš")}</h3>
      <p class="ec-title">${escapeHtml(title)}</p>
      <p>${sentences.join(" ")}</p>
      <div class="gs-parts ec-facts">${facts.map(([k, v]) => `<span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b>`).join("")}</div>`;
  }

  function render(): void {
    const s = host.state();
    const me = host.player();
    const over = s.victory !== null || s.players[me]!.defeated;
    const known = new Set(s.players[me]!.contacts);
    const ids = s.players.filter((p) => !isBarbarian(p) && (over || p.id === me || known.has(p.id))).map((p) => p.id);
    const rows = rowsOf(s, ids).sort((a, b) => b.score - a.score);
    const head = headline(s, me);

    const tab = (m: Metric, label: string) => `<button type="button" class="${metric === m ? "on" : ""}" data-metric="${m}">${label}</button>`;
    const history = s.history.length
      ? `<div class="ec-tabs">${tab("score", t("skóre"))}${tab("cities", t("města"))}${tab("techs", t("objevy"))}</div>${chart(s.history, ids, me, metric)}`
      : `<p class="small muted">${t("Průběh hry se začal zapisovat až v nové verzi hry, graf se ukáže po dalším tahu.")}</p>`;
    const table = `<table class="ec-table">
      <thead><tr><th></th><th>${t("národ")}</th><th>${t("skóre")}</th><th>${t("města")}</th><th>${t("obyvatelé")}</th><th>${t("objevy")}</th><th>${t("divy")}</th></tr></thead>
      <tbody>${rows
        .map(
          (r, i) => `<tr class="${r.id === me ? "me" : ""} ${r.defeated ? "out" : ""}">
            <td>${i + 1}.</td>
            <td><span class="ec-swatch" style="background:${playerColor(r.id)}"></span>${escapeHtml(civName(r.civ))} <span class="muted small">${escapeHtml(leaderName(r.civ))}</span>${r.defeated ? ` <span class="muted small">${t("poraženi")}</span>` : ""}</td>
            <td><b>${r.score}</b></td><td>${r.cities}</td><td>${r.citizens}</td><td>${r.techs}</td><td>${r.wonders}</td>
          </tr>`,
        )
        .join("")}</tbody></table>`;
    const unknown = over ? 0 : s.players.filter((p) => !isBarbarian(p) && p.id !== me && !known.has(p.id)).length;
    const buttons = over
      ? `<button type="button" data-new>${t("Nová hra")}</button>${s.players[me]!.defeated ? "" : `<button type="button" class="primary" data-close>${t("Hrát dál")}</button>`}`
      : `<button type="button" data-close>${t("Zavřít")}</button>`;

    dialog.innerHTML = `
      <div class="dialog-head"><h2>${escapeHtml(head.title)}</h2><button type="button" class="tp-close" data-close aria-label="${t("Zavřít")}">×</button></div>
      ${s.victory?.kind === "space" ? `<div class="ec-ship"></div>` : ""}
      <p>${head.text}</p>
      ${history}
      ${table}
      ${unknown ? `<p class="small muted">${tn("Jeden národ ještě neznáš.|Ještě neznáš {n} národy.|Ještě neznáš {n} národů.", unknown)}</p>` : ""}
      ${evaluation(s, me, rows, over)}
      ${over && s.victory && !s.players[me]!.defeated ? `<p class="small muted">${t("Můžeš hrát dál, výsledek už zůstane.")}</p>` : ""}
      <div class="fc-buttons">${buttons}</div>`;
    if (s.victory?.kind === "space") {
      const ship = s.players[s.victory.player]!.spaceship;
      dialog.querySelector(".ec-ship")?.append(
        spaceshipCanvas({ structural: ship.structural, component: ship.component, module: ship.module, scene: "landed", color: playerColor(s.victory.player) }, 480, 300),
      );
    }
    dialog.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", () => dialog.close()));
    dialog.querySelector("[data-new]")?.addEventListener("click", () => {
      dialog.close();
      host.newGame();
    });
    dialog.querySelectorAll<HTMLButtonElement>("[data-metric]").forEach((b) =>
      b.addEventListener("click", () => {
        metric = b.dataset.metric as Metric;
        render();
      }),
    );
  }

  function open(): void {
    render();
    if (!dialog.open) dialog.showModal();
  }

  return {
    open,
    /** Opens the window once when the game ends: somebody won or the player lost the last city. */
    check(): void {
      const s = host.state();
      const over = s.victory !== null || s.players[host.player()]!.defeated;
      if (!over || shown) return;
      shown = true;
      metric = "score";
      open();
    },
    reset(): void {
      shown = false;
    },
    isOpen: () => dialog.open,
  };
}
