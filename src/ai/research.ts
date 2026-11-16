/**
 * Research and government. Each nature has its own order of goals, as the
 * brief asks: the expanding nation wants growth and ships, the warrior
 * weapons, the scientist books. Past the list the AI takes whatever is open.
 */
import { CIVS, TECHS, type Command, type GovernmentId, type PlayerView, type TechId } from "../core";

type Nature = (typeof CIVS)[keyof typeof CIVS]["personality"];

const GOALS: Record<Nature, TechId[]> = {
  expansion: ["bronze", "pottery", "alphabet", "ceremonies", "monarchy", "mapMaking", "currency", "writing", "trade", "philosophy", "astronomy", "navigation", "banking", "university", "invention", "gunpowder"],
  war: ["bronze", "horseback", "alphabet", "iron", "monarchy", "mathematics", "wheel", "currency", "feudalism", "chivalry", "mapMaking", "construction", "gunpowder", "metallurgy", "conscription"],
  science: ["alphabet", "bronze", "writing", "ceremonies", "monarchy", "literacy", "currency", "mapMaking", "philosophy", "mathematics", "astronomy", "university", "banking", "theoryOfGravity", "invention", "gunpowder"],
};

export function nature(view: PlayerView): Nature {
  return CIVS[view.civ].personality;
}

function knows(view: PlayerView, tech: TechId): boolean {
  return view.economy.techs.includes(tech);
}

export function researchCommands(view: PlayerView): Command[] {
  if (view.economy.researching !== null) return [];
  const goal = GOALS[nature(view)].find((t) => t in TECHS && !knows(view, t));
  if (goal) return [{ type: "setResearchGoal", tech: goal }];
  const open = (Object.keys(TECHS) as TechId[]).find((t) => !knows(view, t) && TECHS[t].requires.every((r) => knows(view, r)));
  return open ? [{ type: "setResearch", tech: open }] : [];
}

/** Monarchy as soon as it is known: less waste than despotism and martial law keeps cities calm. */
export function governmentCommands(view: PlayerView): Command[] {
  const want: GovernmentId = "monarchy";
  if (view.economy.government !== "despotism" || view.economy.revolution) return [];
  return knows(view, "monarchy") ? [{ type: "revolution", government: want }] : [];
}
