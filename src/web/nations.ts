/**
 * The nations the player has met: who leads them, what they are like, war or
 * peace, score, and buttons to offer peace or declare war. Peace offers from
 * computer players come up here as a question at the start of the turn.
 */
import { CIVS, isBarbarian, playerView, RULES, treatyTurns, scoreOf, type CivId, type Command, type GameState, type PlayerView, type RivalView } from "../core";
import { peaceMood } from "../ai/diplomacy";
import { total } from "../ai/war";
import { pictureOf } from "./codex";
import { t, tn } from "./i18n";
import { civName, leaderName } from "./i18n/names";
import { escapeHtml } from "./texts";

export interface NationsHost {
  state(): GameState;
  player(): number;
  run(command: Command): boolean;
  openEntry(key: string): void;
}

/** How keen a computer player at war with us is on peace, in words. */
function keenness(state: GameState, rival: RivalView, me: number): string {
  const them: PlayerView = playerView(state, rival.id);
  const usFromThem = them.rivals.find((r) => r.id === me);
  if (!usFromThem) return "";
  const mood = total(peaceMood(them, usFromThem));
  return mood >= 10 ? t("chtějí mír") : mood >= 0 ? t("mír by přijali") : mood >= -20 ? t("o mír zatím nestojí") : t("chtějí bojovat dál");
}

function natureText(civ: CivId): string {
  const n = CIVS[civ].personality;
  return n === "expansion" ? t("rádi zakládají nová města") : n === "war" ? t("spoléhají na armádu") : t("sázejí na vědu");
}

export function createNations(dialog: HTMLDialogElement, offers: HTMLDialogElement, host: NationsHost) {
  /** Nation whose war declaration waits for a second click. */
  let confirmWar: number | null = null;

  function row(s: GameState, view: PlayerView, r: RivalView): string {
    const civ = r.civ as CivId;
    const pic = pictureOf(`lead-${civ}`);
    const relation = r.atWar
      ? `<b class="neg">${t("válka od tahu {turn}", { turn: r.warSince ?? s.turn })}</b>`
      : r.peaceSince !== null
        ? t("mír od tahu {turn}", { turn: r.peaceSince })
        : t("mír");
    const treaty = !r.atWar && r.peaceSince !== null && s.turn - r.peaceSince < treatyTurns(s);
    const human = s.players[r.id]?.isHuman;
    const mood = r.atWar && !human ? ` · ${keenness(s, r, view.playerId)}` : "";
    const broken = r.treatiesBroken ? ` · <span class="neg">${tn("porušili jednu smlouvu|porušili {n} smlouvy|porušili {n} smluv", r.treatiesBroken)}</span>` : "";
    let action = "";
    if (r.atWar) {
      action = r.peaceOffered
        ? `<button type="button" disabled>${t("Čeká se na odpověď")}</button>`
        : `<button type="button" data-peace="${r.id}">${t("Nabídnout mír")}</button>`;
    } else {
      action =
        confirmWar === r.id
          ? `<button type="button" class="danger" data-war="${r.id}">${treaty ? t("Opravdu porušit smlouvu?") : t("Opravdu vyhlásit válku?")}</button>`
          : `<button type="button" data-war="${r.id}">${t("Vyhlásit válku")}</button>`;
    }
    return `<div class="nt-row ${r.atWar ? "war" : ""}">
      <button type="button" class="nt-pic" data-entry="lead-${civ}" title="${t("O vládci v encyklopedii")}">${pic ? `<img src="${pic}" alt="">` : ""}</button>
      <div class="nt-text">
        <div><b>${escapeHtml(civName(civ))}</b> <span class="muted">· ${escapeHtml(leaderName(civ))}</span></div>
        <div class="small">${relation}${mood}${broken}</div>
        <div class="small muted">${escapeHtml(natureText(civ))} · ${t("skóre {score}", { score: r.score ?? 0 })}</div>
      </div>
      <div class="nt-act">${action}</div>
    </div>`;
  }

  function render(): void {
    const s = host.state();
    const view = playerView(s, host.player());
    const known = view.rivals.filter((r) => r.contact && !r.barbarian && !r.defeated);
    const unknown = view.rivals.filter((r) => !r.contact && !r.barbarian && !r.defeated).length;
    const out = view.rivals.filter((r) => r.defeated && !r.barbarian);
    const mine = scoreOf(s, host.player()).total;
    dialog.innerHTML = `
      <div class="dialog-head"><h2>${t("Národy")}</h2><span class="muted small">${t("tvoje skóre {score}", { score: mine })}</span><button type="button" class="tp-close" data-close aria-label="${t("Zavřít")}">×</button></div>
      ${known.length ? known.map((r) => row(s, view, r)).join("") : `<p>${t("Zatím jsi nepotkal žádný národ. Pošli jednotky na průzkum.")}</p>`}
      ${unknown ? `<p class="small muted">${tn("Jeden národ ještě neznáš.|Ještě neznáš {n} národy.|Ještě neznáš {n} národů.", unknown)}</p>` : ""}
      ${out.length ? `<p class="small muted">${t("Už prohráli: {list}", { list: escapeHtml(out.map((r) => civName(r.civ)).join(", ")) })}</p>` : ""}
      ${s.barbarians !== "none" ? `<p class="small muted">${t("S barbary se válčí pořád a mír s nimi uzavřít nejde.")}</p>` : ""}
      <p class="small muted">${t("Mír, který uzavřeš, platí aspoň {n} tahů. Kdo ho poruší dřív, tomu ostatní národy přestanou věřit.", { n: treatyTurns(s) })}</p>`;
    dialog.querySelector("[data-close]")?.addEventListener("click", () => dialog.close());
    dialog.querySelectorAll<HTMLButtonElement>("[data-entry]").forEach((b) => b.addEventListener("click", () => host.openEntry(b.dataset.entry!)));
    dialog.querySelectorAll<HTMLButtonElement>("[data-peace]").forEach((b) =>
      b.addEventListener("click", () => {
        host.run({ type: "offerPeace", player: Number(b.dataset.peace) });
        render();
      }),
    );
    dialog.querySelectorAll<HTMLButtonElement>("[data-war]").forEach((b) =>
      b.addEventListener("click", () => {
        const id = Number(b.dataset.war);
        if (confirmWar !== id) {
          confirmWar = id;
          render();
          return;
        }
        confirmWar = null;
        host.run({ type: "declareWar", player: id });
        render();
      }),
    );
  }

  function open(): void {
    confirmWar = null;
    render();
    if (!dialog.open) dialog.showModal();
  }

  /** Asks about peace offers waiting for the player; true when a question is shown. */
  function askOffers(): boolean {
    const s = host.state();
    const me = s.players[host.player()];
    const from = me?.peaceOffers.find((id) => !isBarbarian(s.players[id]));
    if (from === undefined) {
      if (offers.open) offers.close();
      return false;
    }
    const civ = s.players[from]!.civ as CivId;
    const pic = pictureOf(`lead-${civ}`);
    const since = me!.warSince[String(from)];
    offers.innerHTML = `
      <div class="at nt-offer">
        ${pic ? `<img src="${pic}" alt="">` : ""}
        <div>
          <h2>${t("{nation} nabízejí mír", { nation: escapeHtml(civName(civ)) })}</h2>
          <p>${tn("{leader} posílá posly: válka trvá už {n} tah a je čas ji ukončit.|{leader} posílá posly: válka trvá už {n} tahy a je čas ji ukončit.|{leader} posílá posly: válka trvá už {n} tahů a je čas ji ukončit.", since === undefined ? 0 : s.turn - since, { leader: escapeHtml(leaderName(civ)) })}</p>
          <p class="small muted">${t("Když mír přijmeš, nesmíš na ně {n} tahů zaútočit, jinak porušíš smlouvu. Když odmítneš, válka pokračuje.", { n: treatyTurns(s) })}</p>
          <div class="at-buttons">
            <button type="button" data-answer="no">${t("Odmítnout")}</button>
            <button type="button" class="primary" data-answer="yes">${t("Přijmout mír")}</button>
          </div>
        </div>
      </div>`;
    offers.querySelectorAll<HTMLButtonElement>("[data-answer]").forEach((b) =>
      b.addEventListener("click", () => {
        host.run({ type: "answerPeace", player: from, accept: b.dataset.answer === "yes" });
        if (!askOffers()) offers.close();
      }),
    );
    if (!offers.open) offers.showModal();
    return true;
  }

  return { open, askOffers, isOpen: () => dialog.open || offers.open };
}
