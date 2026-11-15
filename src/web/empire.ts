/**
 * Dialogs about the whole empire: choosing a government and the spaceship.
 * They only read the state and send commands through the host, like the rest of the screen.
 */
import {
  canChooseGovernment,
  wonderFlag,
  GOVERNMENT_IDS,
  GOVERNMENTS,
  spaceshipFlight,
  spaceshipLaunchProblem,
  RULES,
  type Command,
  type GameState,
} from "../core";
import { buildingPortraitCanvas } from "./buildingArt";
import { playerColor } from "./render";
import { spaceshipCanvas, type SpaceshipPicture } from "./spaceshipArt";
import { describeGovernment, escapeHtml, realmName } from "./texts";
import { t, tn } from "./i18n";
import { governmentName, inSentence } from "./i18n/names";

export interface EmpireHost {
  state(): GameState;
  player(): number;
  run(command: Command): boolean;
  refresh(): void;
  openEntry(key: string): void;
}

export function createEmpireDialogs(dialog: HTMLDialogElement, host: EmpireHost) {
  let shownVictory = false;

  function close(): void {
    if (dialog.open) dialog.close();
  }

  function frame(title: string, body: string): void {
    dialog.innerHTML = `<div class="dialog-head"><h2>${escapeHtml(title)}</h2><span class="spacer"></span><button type="button" data-close>${t("Zavřít")} <kbd>Esc</kbd></button></div><div class="empire-body">${body}</div>`;
    dialog.querySelector("[data-close]")?.addEventListener("click", close);
    if (!dialog.open) dialog.showModal();
  }

  function openGovernment(): void {
    const s = host.state();
    const p = s.players[host.player()]!;
    const running = p.revolution
      ? `<p class="warn">${tn("Probíhá revoluce. Za jeden tah nastoupí {government}.|Probíhá revoluce. Za {n} tahy nastoupí {government}.|Probíhá revoluce. Za {n} tahů nastoupí {government}.", p.revolution.turnsLeft, { government: inSentence(governmentName(p.revolution.target)) })}</p>`
      : "";
    const pyramids = wonderFlag(s, p.id, "allGovernments");
    const rows = GOVERNMENT_IDS.filter((g) => g !== "anarchy")
      .map((g) => {
        const rule = GOVERNMENTS[g];
        const known = canChooseGovernment(p, g, pyramids);
        const current = p.government === g;
        const button = current
          ? `<span class="tag">${t("vládne teď")}</span>`
          : `<button type="button" data-gov="${g}" ${!known || p.revolution ? "disabled" : ""}>${known ? (wonderFlag(s, p.id, "noAnarchy") ? t("Změnit vládu") : t("Vyhlásit revoluci")) : t("Zatím neznáš")}</button>`;
        return `<div class="gov ${current ? "on" : ""} ${known ? "" : "locked"}"><div><button type="button" class="linklike" data-entry="gov-${g}"><b>${escapeHtml(governmentName(g))}</b></button><div class="muted small">${escapeHtml(describeGovernment(rule))}</div></div>${button}</div>`;
      })
      .join("");
    frame(
      t("Vláda: {now}", { now: governmentName(p.government) }),
      `${running}<p class="small">${
        wonderFlag(s, p.id, "noAnarchy")
          ? t("Máš pyramidy, a tak vládu změníš hned bez anarchie a vybrat můžeš kteroukoli.")
          : tn("Revoluce znamená jeden tah anarchie, kdy říše nevybírá daně a nezkoumá. S pyramidami se vláda změní hned.|Revoluce znamená {n} tahy anarchie, kdy říše nevybírá daně a nezkoumá. S pyramidami se vláda změní hned.|Revoluce znamená {n} tahů anarchie, kdy říše nevybírá daně a nezkoumá. S pyramidami se vláda změní hned.", RULES.anarchyTurns)
      }</p>${rows}`,
    );
    dialog.querySelectorAll<HTMLButtonElement>("[data-entry]").forEach((b) =>
      b.addEventListener("click", () => {
        close();
        host.openEntry(b.dataset.entry!);
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>("[data-gov]").forEach((b) =>
      b.addEventListener("click", () => {
        if (host.run({ type: "revolution", government: b.dataset.gov as never })) {
          host.refresh();
          openGovernment();
        }
      }),
    );
  }

  /** What the player's ship looks like now: on the pad, on its way, or landed. */
  function shipPicture(player: number): SpaceshipPicture {
    const s = host.state();
    const ship = s.players[player]!.spaceship;
    const base = { structural: ship.structural, component: ship.component, module: ship.module, color: playerColor(player) };
    if (s.victory?.player === player) return { ...base, scene: "landed" };
    if (ship.launchedTurn !== null && ship.arrivalTurn !== null) {
      const progress = (s.turn - ship.launchedTurn) / Math.max(1, ship.arrivalTurn - ship.launchedTurn);
      return { ...base, scene: "flight", progress };
    }
    return { ...base, scene: "pad" };
  }

  function openSpaceship(): void {
    const s = host.state();
    const p = s.players[host.player()]!;
    const ship = p.spaceship;
    const flight = spaceshipFlight(ship);
    const problem = spaceshipLaunchProblem(s, p.id);
    const r = RULES.spaceship;
    const part = (id: "ssStructural" | "ssComponent" | "ssModule", n: number, max: number, text: string) =>
      `<div class="ss-part" data-b="${id}"><span class="pic"></span><div><b>${t("{n} z {max}", { n, max })}</b><div class="muted small">${text}</div></div></div>`;
    const status =
      ship.launchedTurn !== null
        ? `<p>${t("Loď letí od tahu {from} a přistane v tahu {to}. Šance na přistání je {pct} %.", { from: ship.launchedTurn, to: ship.arrivalTurn, pct: ship.successPct })}</p>`
        : `<p>${tn("Kdyby loď odstartovala teď, letěla by {n} tah a přistála by se šancí {pct} %.|Kdyby loď odstartovala teď, letěla by {n} tahy a přistála by se šancí {pct} %.|Kdyby loď odstartovala teď, letěla by {n} tahů a přistála by se šancí {pct} %.", flight.turns, { pct: flight.successPct })}</p>`;
    const rivals = s.players
      .filter((x) => x.id !== p.id && x.spaceship.arrivalTurn !== null)
      .map((x) => `<p class="warn">${t("{realm} má loď ve vzduchu, přistane v tahu {turn}.", { realm: escapeHtml(realmName(host.state(), x.id)), turn: x.spaceship.arrivalTurn })}</p>`)
      .join("");
    frame(
      t("Vesmírná loď"),
      `<p class="small">${t("Kdo první přistane u cizí hvězdy, vyhraje. Díly se staví ve městech jako budovy. Nosné konstrukce nesou motory a moduly, každý motor zkrátí let o {turns} tahy a každý modul zvýší šanci na přistání o {pct} %.", { turns: r.turnsPerComponent, pct: r.successPerModule })}</p>
      <div class="ss-picture"></div>
      <div class="ss-parts">${part("ssStructural", ship.structural, r.maxStructural, t("nosné konstrukce"))}${part("ssComponent", ship.component, r.maxComponent, t("motory"))}${part("ssModule", ship.module, r.maxModule, t("moduly"))}</div>
      ${status}${rivals}
      ${ship.launchedTurn === null ? `<button type="button" class="primary" data-launch ${problem ? "disabled" : ""}>${t("Odstartovat")}</button>` : ""}`,
    );
    dialog.querySelector(".ss-picture")?.append(spaceshipCanvas(shipPicture(p.id), 592, 444));
    dialog.querySelectorAll<HTMLDivElement>(".ss-part").forEach((d) => d.querySelector(".pic")!.append(buildingPortraitCanvas(d.dataset.b as never, 70, 56)));
    dialog.querySelector("[data-launch]")?.addEventListener("click", () => {
      if (host.run({ type: "launchSpaceship" })) {
        host.refresh();
        openSpaceship();
      }
    });
  }

  /** Shows the result once, the first time somebody wins. */
  function checkVictory(): void {
    const v = host.state().victory;
    if (!v || shownVictory) return;
    shownVictory = true;
    const mine = v.player === host.player();
    frame(
      mine ? t("Vyhrál jsi!") : t("Konec závodu"),
      mine
        ? `<div class="ss-picture"></div><p>${t("Tvoje vesmírná loď přistála u cizí hvězdy v tahu {turn}. Lidé z tvé říše založili první osadu mimo Zemi.", { turn: v.turn })}</p><p class="small">${t("Můžeš hrát dál, výsledek už zůstane.")}</p>`
        : `<div class="ss-picture"></div><p>${t("{realm} přistála u cizí hvězdy v tahu {turn} a vyhrála.", { realm: escapeHtml(realmName(host.state(), v.player)), turn: v.turn })}</p>`,
    );
    dialog.querySelector(".ss-picture")?.append(spaceshipCanvas(shipPicture(v.player), 592, 444));
  }

  return { openGovernment, openSpaceship, checkVictory, isOpen: () => dialog.open, resetVictory: () => (shownVictory = false) };
}
