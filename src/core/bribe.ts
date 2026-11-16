/**
 * The price of bribing a foreign city with a diplomat. A player sees it on
 * the diplomat's button next to the city, and the AI gets the same number
 * through its view.
 */
import { cityReport } from "./city";
import { capitalOf } from "./economy";
import { distance } from "./geometry";
import type { City, GameState } from "./state";
import { getPlayer } from "./world";

export function inciteCost(state: GameState, city: City): number {
  const owner = getPlayer(state, city.owner);
  const capital = capitalOf(state, city.owner);
  const far = capital ? distance(city, capital) : 32;
  const units = state.units.filter((u) => u.x === city.x && u.y === city.y).length;
  const base = ((owner.gold + 1000) * city.size) / (far + 3) + units * 20;
  return Math.round(cityReport(state, city).happiness.disorder ? base / 2 : base);
}
