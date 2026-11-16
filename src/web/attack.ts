/**
 * The attack window: before a unit attacks, the player sees both sides'
 * strength, what makes it up and the chance of winning, and confirms.
 */
import { combatOdds, UNIT_TYPES, type GameState, type Point, type Strength, type StrengthFactor, type Unit } from "../core";
import { t } from "./i18n";
import { civName, unitName } from "./i18n/names";
import { unitPortraitCanvas } from "./render";
import { escapeHtml } from "./texts";

export interface AttackHost {
  state(): GameState;
  /** Carries out the attack. */
  attack(unitId: number, to: Point): void;
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
  return { open, isOpen: () => dialog.open };
}
