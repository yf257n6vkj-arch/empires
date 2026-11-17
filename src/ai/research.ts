/**
 * Research and government. Each nature has its own order of goals, as the
 * brief asks: the expanding nation wants growth and ships, the warrior
 * weapons, the scientist books. Past the list the AI takes whatever is open.
 */
import { skill } from "./war";
import { CIVS, clampRate, RULES, TECHS, type Command, type GovernmentId, type PlayerView, type TechId } from "../core";

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

/**
 * After its own list every nature heads for the space race: the railroad for
 * production, then space flight, plastics and robotics, which open the
 * Apollo Program and every kind of spaceship part.
 */
const SPACE_GOALS: TechId[] = ["railroad", "spaceFlight", "plastics", "robotics"];

/** True once the AI knows every technology the spaceship needs. */
export function knowsSpaceTechs(view: PlayerView): boolean {
  return SPACE_GOALS.every((t) => knows(view, t));
}

export function researchCommands(view: PlayerView): Command[] {
  if (view.economy.researching !== null) return [];
  const goal = [...GOALS[nature(view)], ...SPACE_GOALS].find((t) => t in TECHS && !knows(view, t));
  if (goal) return [{ type: "setResearchGoal", tech: goal }];
  const open = (Object.keys(TECHS) as TechId[]).find((t) => !knows(view, t) && TECHS[t].requires.every((r) => knows(view, r)));
  return open ? [{ type: "setResearch", tech: open }] : [];
}

/**
 * Monarchy as soon as it is known: less waste than despotism and martial law
 * keeps cities calm. Then the republic, whose extra trade pays for science,
 * once the land is settled; a nation that lives for war waits for peace.
 */
export function governmentCommands(view: PlayerView, sitesLeft = 0): Command[] {
  if (view.economy.revolution) return [];
  const gov = view.economy.government;
  const atWar = view.rivals.some((r) => r.atWar && !r.barbarian);
  // The republic pays for science; only the nation that lives for war keeps its monarchy while it fights.
  // Settlers eat more under the republic and every unit costs a shield, so the AI first fills its land.
  // The expanding nation keeps settling islands with its monarchy's cheap settlers until late in the game.
  const settled = view.turn >= view.maxTurns * REPUBLIC_BY || (sitesLeft <= 1 && nature(view) !== "expansion");
  const republicOk = skill(view).republic && settled && (nature(view) !== "war" || !atWar);
  if (gov !== "republic" && knows(view, "republic") && republicOk) return [{ type: "revolution", government: "republic" }];
  if (gov === "despotism" && knows(view, "monarchy")) return [{ type: "revolution", government: "monarchy" as GovernmentId }];
  return [];
}

/** Share of the game after which the AI moves to the republic even with land left to settle. */
const REPUBLIC_BY = 2 / 3;

/** Gold the AI keeps in the treasury before it puts more into science. */
const RESERVE = 50;

/**
 * The science rate: as high as the treasury allows, the way a player moves the
 * slider while watching the income in the top bar. One step per pass.
 */
export function rateCommands(view: PlayerView): Command[] {
  if (!skill(view).manageRates) return [];
  const { scienceRate, income, gold, government } = view.economy;
  const step = RULES.rateStep;
  // Nothing left to research, or the spaceship is all that matters: taxes buy the parts.
  const nothingLeft = Object.keys(TECHS).every((t) => knows(view, t as TechId));
  const racing = knowsSpaceTechs(view) && view.builtWonders.includes("apolloProgram") && view.economy.spaceship.launchedTurn === null;
  if (nothingLeft || racing) {
    const low = clampRate(0, government);
    return low !== scienceRate ? [{ type: "setScienceRate", rate: low }] : [];
  }
  if (income < 0 && gold + income * 5 < RESERVE) {
    const down = clampRate(scienceRate - step, government);
    return down !== scienceRate ? [{ type: "setScienceRate", rate: down }] : [];
  }
  // Room to spare: one step more science when the income stays positive with a margin.
  const margin = Math.max(1, Math.ceil(view.cities.length / 3));
  if (income >= margin && gold >= RESERVE) {
    const up = clampRate(scienceRate + step, government);
    return up !== scienceRate ? [{ type: "setScienceRate", rate: up }] : [];
  }
  return [];
}
