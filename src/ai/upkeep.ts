/**
 * Keeping the army affordable. Under a republic every unit costs its home
 * city a shield, so the AI lets go of old defenders it no longer needs, or
 * upgrades them when the treasury has gold to spare, as a player would.
 */
import { GOVERNMENTS, UNIT_TYPES, upgradeCost, upgradeTarget, type Command, type PlayerView } from "../core";
import { bestDefender, garrisonNeed, type Plan } from "./build";
import { isMilitary } from "./knowledge";
import { isAttacker } from "./war";

/** Gold the AI keeps before it pays for upgrades. */
const UPGRADE_RESERVE = 120;

export function upkeepCommands(view: PlayerView, plan: Plan): Command[] {
  const commands: Command[] = [];
  const free = GOVERNMENTS[view.economy.government].freeUnits;
  const best = UNIT_TYPES[bestDefender(view)];
  let gold = view.economy.gold;
  for (const city of view.cities) {
    const here = view.units.filter((u) => u.x === city.x && u.y === city.y && isMilitary(u) && UNIT_TYPES[u.type].domain === "land" && u.carriedBy === null);
    const outdated = here
      .filter((u) => !isAttacker(u) && UNIT_TYPES[u.type].defense < best.defense)
      .sort((a, b) => UNIT_TYPES[a.type].defense - UNIT_TYPES[b.type].defense || a.id - b.id);
    const supported = view.units.filter((u) => u.homeCity === city.id).length;
    let extra = supported - free;
    let left = here.length;
    for (const u of outdated) {
      // An old defender gets new weapons when the treasury allows.
      const target = upgradeTarget({ techs: view.economy.techs }, u.type);
      const cost = target ? upgradeCost(u.type, target) : null;
      if (cost !== null && u.movesLeft > 0 && gold - cost >= UPGRADE_RESERVE) {
        commands.push({ type: "upgrade", unitId: u.id });
        gold -= cost;
        continue;
      }
      // Otherwise it goes home when it costs a shield and the city keeps enough defenders without it.
      if (extra > 0 && u.homeCity === city.id && left - 1 >= garrisonNeed(view, city, plan)) {
        commands.push({ type: "disband", unitId: u.id });
        extra--;
        left--;
      }
    }
  }
  return commands;
}
