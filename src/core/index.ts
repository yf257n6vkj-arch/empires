/**
 * Public API of the game core. The core has no dependency on the browser,
 * so the same code runs in the page and in headless AI tournaments (Node).
 */
export * from "./geometry";
export * from "./game";
export * from "./mapgen";
export * from "./rng";
export * from "./rules";
export * from "./start";
export * from "./state";
export * from "./view";
