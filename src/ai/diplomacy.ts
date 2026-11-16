/**
 * Peace. The AI keeps a mood towards every nation it is at war with, built
 * from named reasons like its war motivation (Unciv style): how long the war
 * has lasted, how it is going, its own nature, the other side's reputation
 * and wonders that make peace easier. A positive mood accepts an offer; a
 * clearly positive one makes an offer itself. The AI keeps the treaties it makes.
 */
import { CIVS, distance, RULES, UNIT_TYPES, type Command, type PlayerView, type RivalView } from "../core";
import { cityDefense, isAttacker, punch, total, type Reason } from "./war";

/** Turns of war before the AI thinks of peace at all. */
const MIN_WAR = 6;
/** Turns between two offers to the same nation. */
const OFFER_EVERY = 6;
/** Mood above which the AI offers peace itself. */
const OFFER_MOOD = 10;

/** Why the AI would or would not make peace with a rival; positive total means peace. */
export function peaceMood(view: PlayerView, rival: RivalView): Reason[] {
  const reasons: Reason[] = [];
  const add = (item: string, value: number) => reasons.push({ item, value });
  const nature = CIVS[view.civ].personality;
  add("nature", nature === "war" ? -15 : nature === "science" ? 15 : 0);
  const length = rival.warSince === null ? 0 : view.turn - rival.warSince;
  if (length < MIN_WAR) add("war just started", -40);
  else add("war weariness", Math.min(40, (length - MIN_WAR) * 2));

  // How the war goes: own striking power against the defence of their cities the AI knows.
  const power = view.units.filter(isAttacker).reduce((n, u) => n + punch(u), 0);
  const theirs = view.foreignCities.filter((c) => c.owner === rival.id);
  const weakest = theirs.length ? Math.min(...theirs.map((c) => cityDefense(view, c))) : 0;
  const ratio = theirs.length ? power / Math.max(1, weakest) : 1;
  add("how the war goes", ratio >= 2.5 ? -30 : ratio >= 1.5 ? -10 : ratio < 0.8 ? 20 : 5);

  // Their soldiers next to own cities make peace more welcome.
  const near = view.foreignUnits.filter((u) => u.owner === rival.id && UNIT_TYPES[u.type].attack > 0 && view.cities.some((c) => distance(c, u) <= 2)).length;
  if (near > 0) add("enemy at the gates", Math.min(30, near * 10));

  if (rival.treatiesBroken > 0) add("broke treaties", -15 * rival.treatiesBroken);
  if (rival.declaredOnUs > 0) add("declared war on us", -5 * rival.declaredOnUs);
  if (rival.peaceWonder) add("peace wonder", 35);
  return reasons;
}

/** Answers to peace offers and offers of the AI's own. */
export function peaceCommands(view: PlayerView): Command[] {
  const commands: Command[] = [];
  for (const rival of view.rivals) {
    if (rival.barbarian || rival.defeated || !rival.atWar) continue;
    const mood = total(peaceMood(view, rival));
    if (rival.offersPeace) {
      commands.push({ type: "answerPeace", player: rival.id, accept: mood >= 0 });
      continue;
    }
    const recently = rival.lastOfferTurn !== null && view.turn - rival.lastOfferTurn < OFFER_EVERY;
    if (!rival.peaceOffered && !recently && mood >= OFFER_MOOD) commands.push({ type: "offerPeace", player: rival.id });
  }
  return commands;
}

/** True while a peace treaty with the rival still binds the AI. */
export function underTreaty(view: PlayerView, rival: RivalView): boolean {
  return rival.peaceSince !== null && view.turn - rival.peaceSince < RULES.diplomacy.treatyTurns;
}
