/**
 * Dialogs about the whole empire: choosing a government and the spaceship.
 * They only read the state and send commands through the host, like the rest of the screen.
 */
import {
  canChooseGovernment,
  GOVERNMENT_IDS,
  GOVERNMENTS,
  spaceshipFlight,
  spaceshipLaunchProblem,
  RULES,
  type Command,
  type GameState,
} from "../core";
import { buildingPortraitCanvas } from "./buildingArt";
import { describeGovernment, escapeHtml } from "./texts";

export interface EmpireHost {
  state(): GameState;
  player(): number;
  run(command: Command): boolean;
  refresh(): void;
}

export function createEmpireDialogs(dialog: HTMLDialogElement, host: EmpireHost) {
  let shownVictory = false;

  function close(): void {
    if (dialog.open) dialog.close();
  }

  function frame(title: string, body: string): void {
    dialog.innerHTML = `<div class="dialog-head"><h2>${escapeHtml(title)}</h2><span class="spacer"></span><button type="button" data-close>Zavřít <kbd>Esc</kbd></button></div><div class="empire-body">${body}</div>`;
    dialog.querySelector("[data-close]")?.addEventListener("click", close);
    if (!dialog.open) dialog.showModal();
  }

  function openGovernment(): void {
    const s = host.state();
    const p = s.players[host.player()]!;
    const now = GOVERNMENTS[p.government];
    const running = p.revolution
      ? `<p class="warn">Probíhá revoluce. Za ${p.revolution.turnsLeft === 1 ? "jeden tah" : `${p.revolution.turnsLeft} tahy`} nastoupí ${GOVERNMENTS[p.revolution.target].name.toLowerCase()}.</p>`
      : "";
    const rows = GOVERNMENT_IDS.filter((g) => g !== "anarchy")
      .map((g) => {
        const rule = GOVERNMENTS[g];
        const known = canChooseGovernment(p, g);
        const current = p.government === g;
        const button = current
          ? `<span class="tag">vládne teď</span>`
          : `<button type="button" data-gov="${g}" ${!known || p.revolution ? "disabled" : ""}>${known ? "Vyhlásit revoluci" : "Zatím neznáš"}</button>`;
        return `<div class="gov ${current ? "on" : ""} ${known ? "" : "locked"}"><div><b>${escapeHtml(rule.name)}</b><div class="muted small">${escapeHtml(describeGovernment(rule))}</div></div>${button}</div>`;
      })
      .join("");
    frame(
      `Vláda: ${now.name}`,
      `${running}<p class="small">Revoluce znamená ${RULES.anarchyTurns} tahy anarchie, kdy říše nevybírá daně a nezkoumá. S pyramidami trvá jen jeden tah.</p>${rows}`,
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

  function openSpaceship(): void {
    const s = host.state();
    const p = s.players[host.player()]!;
    const ship = p.spaceship;
    const flight = spaceshipFlight(ship);
    const problem = spaceshipLaunchProblem(s, p.id);
    const r = RULES.spaceship;
    const part = (id: "ssStructural" | "ssComponent" | "ssModule", n: number, max: number, text: string) =>
      `<div class="ss-part" data-b="${id}"><span class="pic"></span><div><b>${n} z ${max}</b><div class="muted small">${text}</div></div></div>`;
    const status =
      ship.launchedTurn !== null
        ? `<p>Loď letí od tahu ${ship.launchedTurn} a přistane v tahu ${ship.arrivalTurn}. Šance na přistání je ${ship.successPct} %.</p>`
        : `<p>Kdyby loď odstartovala teď, letěla by ${flight.turns} tahů a přistála by se šancí ${flight.successPct} %.</p>`;
    const rivals = s.players
      .filter((x) => x.id !== p.id && x.spaceship.arrivalTurn !== null)
      .map((x) => `<p class="warn">${escapeHtml(x.name)} má loď ve vzduchu, přistane v tahu ${x.spaceship.arrivalTurn}.</p>`)
      .join("");
    frame(
      "Vesmírná loď",
      `<p class="small">Kdo první přistane u cizí hvězdy, vyhraje. Díly se staví ve městech jako budovy. Nosné konstrukce nesou motory a moduly, každý motor zkrátí let o ${r.turnsPerComponent} tahy a každý modul zvýší šanci na přistání o ${r.successPerModule} %.</p>
      <div class="ss-parts">${part("ssStructural", ship.structural, r.maxStructural, "nosné konstrukce")}${part("ssComponent", ship.component, r.maxComponent, "motory")}${part("ssModule", ship.module, r.maxModule, "moduly")}</div>
      ${status}${rivals}
      ${ship.launchedTurn === null ? `<button type="button" class="primary" data-launch ${problem ? "disabled" : ""}>Odstartovat</button>` : ""}`,
    );
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
      mine ? "Vyhrál jsi!" : "Konec závodu",
      mine
        ? `<p>Tvoje vesmírná loď přistála u cizí hvězdy v tahu ${v.turn}. Lidé z tvé říše založili první osadu mimo Zemi.</p><p class="small">Můžeš hrát dál, výsledek už zůstane.</p>`
        : `<p>${escapeHtml(host.state().players[v.player]?.name ?? "Jiná říše")} přistála u cizí hvězdy v tahu ${v.turn} a vyhrála.</p>`,
    );
  }

  return { openGovernment, openSpaceship, checkVictory, isOpen: () => dialog.open, resetVictory: () => (shownVictory = false) };
}
