/**
 * The attack window: before a unit attacks, the player sees both sides'
 * strength, what makes it up and the chance of winning, and confirms.
 */
import { combatOdds, RULES, treatyTurns, UNIT_TYPES, type GameState, type Point, type Strength, type StrengthFactor, type Unit } from "../core";
import { t, tn } from "./i18n";
import { civName, unitName } from "./i18n/names";
import { unitPortraitCanvas } from "./render";
import { escapeHtml } from "./texts";

export interface AttackHost {
  state(): GameState;
  /** Carries out the attack. */
  attack(unitId: number, to: Point): void;
  /** Declares war; returns false when the rules refused. */
  declareWar(player: number): boolean;
}

function factorText(f: StrengthFactor): string {
  const pct = `${f.pct > 0 ? "+" : "−"}${Math.abs(Math.round(f.pct))} %`;
  const label: Record<StrengthFactor["kind"], string> = {
    veteran: t("veterán"),
    terrain: t("terén"),
    fortified: t("opevnění"),
    fortress: t("pevnost"),
    walls: t("hradby"),
    coastalFortress: t("pobřežní pevnost"),
    tired: t("málo pohybu"),
  };
  return `${label[f.kind]} ${pct}`;
}

function strengthText(s: Strength): string {
  const value = Math.round(s.value * 10) / 10;
  if (s.factors.length === 0) return `<b>${value}</b>`;
  return `<b>${value}</b> <span class="muted small">(${s.base}, ${s.factors.map(factorText).join(", ")})</span>`;
}

/** Short line about the chance, for the map tooltip. */
export function attackHint(state: GameState, unit: Unit, to: Point): string | null {
  const odds = combatOdds(state, unit, to);
  if (!odds) return null;
  return t("Útok: šance na výhru {pct} %", { pct: Math.round(odds.winChance * 100) });
}

export function createAttackDialog(dialog: HTMLDialogElement, host: AttackHost) {
  function open(unit: Unit, to: Point): boolean {
    const state = host.state();
    const odds = combatOdds(state, unit, to);
    if (!odds) return false;
    const pct = Math.round(odds.winChance * 100);
    const side = (u: Unit, strength: Strength, label: string, owner: string, attacking: boolean) => `
      <div class="at-side">
        <div class="at-pic" data-unit="${u.id}"></div>
        <div>
          <div class="muted small">${label}</div>
          <b>${escapeHtml(unitName(u.type))}</b> <span class="muted small">${escapeHtml(owner)}</span>
          <div class="small">${t("životy {hp} z {max}", { hp: u.hp, max: UNIT_TYPES[u.type].hp })} · ${t("palebná síla {fp}", { fp: UNIT_TYPES[u.type].firepower })}</div>
          <div class="small">${attacking ? t("útok") : t("obrana")} ${strengthText(strength)}</div>
        </div>
      </div>`;
    const tone = pct >= 70 ? "good" : pct >= 40 ? "even" : "bad";
    dialog.innerHTML = `
      <div class="at">
        <h2>${t("Útok")}</h2>
        <div class="at-sides">
          ${side(odds.attacker, odds.attack, t("Útočí"), civName(state.players[odds.attacker.owner]!.civ), true)}
          <div class="at-vs">×</div>
          ${side(odds.defender, odds.defense, t("Brání"), civName(state.players[odds.defender.owner]!.civ), false)}
        </div>
        <div class="at-chance ${tone}">${t("Šance na výhru {pct} %", { pct })}</div>
        <p class="muted small">${t("Boj běží v kolech. V každém kole vyhraješ se šancí {round} % a poražený přijde o tolik životů, kolik má vítěz palebné síly. Kdo první přijde o všechny životy, padne. Když obránce padne mimo město a pevnost, padnou s ním všechny jednotky na políčku.", { round: Math.round(odds.roundChance * 100) })}</p>
        <div class="at-buttons">
          <button type="button" data-act="cancel">${t("Zrušit")} <kbd>Esc</kbd></button>
          <button type="button" class="primary" data-act="attack">${t("Zaútočit")} <kbd>Enter</kbd></button>
        </div>
      </div>`;
    const pics = dialog.querySelectorAll<HTMLDivElement>(".at-pic");
    pics[0]?.append(unitPortraitCanvas(odds.attacker.type, odds.attacker.owner, 64, 56));
    pics[1]?.append(unitPortraitCanvas(odds.defender.type, odds.defender.owner, 64, 56));
    dialog.querySelector('[data-act="cancel"]')!.addEventListener("click", () => dialog.close());
    dialog.querySelector('[data-act="attack"]')!.addEventListener("click", () => {
      dialog.close();
      host.attack(unit.id, to);
    });
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-act="attack"]')?.focus();
    return true;
  }
  /** Before an attack on a nation at peace: ask whether to declare war first. */
  function openWar(unit: Unit, to: Point): boolean {
    const state = host.state();
    const enemy = state.units.find((u) => u.x === to.x && u.y === to.y && u.owner !== unit.owner);
    if (!enemy) return false;
    const nation = civName(state.players[enemy.owner]!.civ);
    const since = state.players[unit.owner]!.peaceSince[String(enemy.owner)];
    const young = since !== undefined && state.turn - since < treatyTurns(state);
    dialog.innerHTML = `
      <div class="at">
        <h2>${t("Vyhlásit válku?")}</h2>
        <p>${t("S národem {nation} žiješ v míru. Když zaútočíš, vyhlásíš mu válku. Jeho jednotky a města pak budou bojovat proti tobě, dokud spolu neuzavřete mír.", { nation: escapeHtml(nation) })}</p>
        ${young ? `<p class="neg">${tn("Mír jste uzavřeli teprve před jedním tahem. Porušíš smlouvu a všechny národy ti pak budou méně věřit.|Mír jste uzavřeli teprve před {n} tahy. Porušíš smlouvu a všechny národy ti pak budou méně věřit.|Mír jste uzavřeli teprve před {n} tahy. Porušíš smlouvu a všechny národy ti pak budou méně věřit.", state.turn - since!)}</p>` : ""}
        <div class="at-buttons">
          <button type="button" data-act="cancel">${t("Zrušit")} <kbd>Esc</kbd></button>
          <button type="button" class="primary danger" data-act="war">${t("Vyhlásit válku")}</button>
        </div>
      </div>`;
    dialog.querySelector('[data-act="cancel"]')!.addEventListener("click", () => dialog.close());
    dialog.querySelector('[data-act="war"]')!.addEventListener("click", () => {
      dialog.close();
      if (host.declareWar(enemy.owner)) open(unit, to);
    });
    dialog.showModal();
    dialog.querySelector<HTMLButtonElement>('[data-act="cancel"]')?.focus();
    return true;
  }

  /** A message the player has to notice, such as a declaration of war. */
  function notice(title: string, text: string): void {
    dialog.innerHTML = `
      <div class="at">
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
        <div class="at-buttons"><button type="button" class="primary" data-act="ok">${t("Rozumím")}</button></div>
      </div>`;
    dialog.querySelector('[data-act="ok"]')!.addEventListener("click", () => dialog.close());
    dialog.showModal();
  }

  return { open, openWar, notice, isOpen: () => dialog.open };
}
