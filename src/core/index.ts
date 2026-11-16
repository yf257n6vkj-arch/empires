/**
 * Public API of the game core. The core has no dependency on the browser,
 * so the same code runs in the page and in headless AI tournaments (Node).
 */
export * from "./city";
export * from "./combat";
export * from "./commands";
export * from "./diplomacy";
export * from "./economy";
export * from "./events";
export * from "./game";
export * from "./geometry";
export * from "./mapgen";
export * from "./path";
export * from "./rng";
export * from "./rules";
export * from "./setup";
export * from "./start";
export * from "./state";
export { workTurns } from "./turn";
export * from "./units";
export * from "./view";
export * from "./world";
export * from "./workers";
export * from "./advisor";
