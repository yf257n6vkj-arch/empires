# Empires

Browser turn-based strategy in the style of Civilization 1, built by Michal with Claude. The full brief lives in the claude.ai project "Empires"; AI design notes are in the project doc `claude/ai-poznamky-unciv-freeciv.md`. Decisions agreed with Michal are logged in `docs/rozhodnuti.md` (newest first); add every new one there.

## Commands

- `npm test` – vitest, must pass before every commit
- `npm run typecheck` – checks the whole repo and separately that `src/core` compiles without DOM types
- `npm run check-maps -- 500` – headless map statistics; run after any change to mapgen or start positions
- `npm run pace -- 300` – a scripted player plays 120 turns on many maps and reports the pace of research and growth; run after any change to economy numbers (it is a measuring tool, not the AI)
- `npm run ai-games -- 50` – headless games of computer players only; run after any change to the AI and judge it on dozens of games
- `npm run build` – production build into `dist/`
- `npm run dev` – local dev server

## Architecture rules (do not break)

1. Only add features the AI opponents can use as well.
2. The AI never receives `GameState`. It receives `PlayerView` from `src/core/view.ts`, which contains only what a human in that seat could see. New information for the AI goes through `playerView`, in the form a human sees it.
3. All randomness goes through `Rng` (`src/core/rng.ts`). Never call `Math.random` in `src/core`. The generator state is stored in `GameState.rng`.
4. `GameState` is a plain JSON-serialisable object. Turn functions are pure: they return a new state and never mutate the input.
5. Rule numbers live in `src/core/data/*.json`, not in code.
6. `src/core` has no dependency on the browser (enforced by `tsconfig.core.json`).
7. No names, graphics or texts from the original Civilization games. Graphics are drawn with code or painted for us by Gemini (encyclopedia pictures, unit and city sprites, buildings, houses and backdrops for the city view; three leader portraits Gemini refused come from Grok); terrain stays drawn with code.

## Conventions

- Code, identifiers and code comments in English. UI texts, README and documents for Michal in Czech.
- The game is bilingual (Czech and English). Every UI text is written in Czech inside `t("...")` or `tn("...|...|...", n)` from `src/web/i18n`; the Czech sentence is the key. Names of rule data go through `src/web/i18n/names.ts`, never `UNIT_TYPES[x].name` and friends. Each new key needs its English text in `src/web/i18n/en-strings.ts`; `npm run i18n -- en` lists what is missing and `tests/i18n.test.ts` fails until it is complete.
- Czech texts for Michal: plain spoken Czech, verbs rather than nouns, headings that contain a verb. Avoid "není X, ale Y" antitheses, dash punchlines, groups of exactly three parallel items and sentences about the document itself. Bold only where it really helps. Never use the word "páka" in any form.
- Every rule change gets a test. Map or AI changes are judged on hundreds of seeds, not single screenshots.
- Commit messages in English, imperative mood.
