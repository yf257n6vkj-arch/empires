# Empires Reloaded

A turn-based strategy game for the browser and the Mac, in the spirit of the empire-building classics of the early 1990s. You lead one of fifteen nations from the first village to a flight to the stars against computer rivals who play by the same rules as you and never cheat. A normal game lasts 120 turns, about one evening; a quick game lasts 60 turns, about 25 minutes.

The game is in Czech, Slovak, English, German and French. It was made by a dad and his son together with Claude (Anthropic).

## What is in version 1.0

- **Fifteen nations** (fourteen historical empires and the Czechs), each with a leader, colour and its own city names. No nation has special advantages.
- **Cities** that grow, build and trade, with happy, content and unhappy citizens, celebrations, specialists, corruption and pollution, 27 buildings and 24 wonders of the world. A city screen shows the city itself, and a governor can run a city towards a goal.
- **68 technologies in five eras**, each with an encyclopedia page that tells the real history behind it.
- **29 unit types** including ships and aircraft. Fights run round by round with hit points and firepower, the odds are shown before every attack, and every fight the player is in is replayed on the map with sound.
- **Six governments**, peace and war with rival nations, caravans and diplomats, ruins with treasure and barbarians.
- **Three ways to win:** conquest, a spaceship that lands at a distant star, or the highest score after the last turn.
- **A natural-looking map** with mountain ranges, rain shadows and rivers that flow from the mountains to the sea, drawn as a tilted relief map with fog of war like old parchment.
- **Five difficulty levels**, a world you can set up (size, rivals, islands, climate and more) and a map code that reproduces the same world.
- **Help for every player:** an advisor that explains why it suggests what it suggests, and for children an owl guide that tells stories about nations and discoveries and leads them along a plan to victory.
- **Sound effects and generated medieval music**, both synthesised in code.
- **Automatic saving** in the browser, plus named saves and saving to a file.

## How to play

The start screen has a short guide. In short:

1. Click **New game** and pick a nation. Below the nations you can set up the world, including a quick 60-turn game.
2. Find a good spot by a river or the sea with your settler and found your first city with **B**.
3. Click the city and choose what it builds. At the top left, choose what your scientists research.
4. Move units by clicking on the map. End the turn with **End turn** or the Enter key.

The encyclopedia has a whole "How to play" chapter, and **Controls** in the menu lists every key. The most useful ones: `B` found a city, `R` road, `I` irrigation, `M` mine, `F` fortify, space to wait, `N` next unit, `A` automatic work for a settler, `T` technology tree, `O` cities overview, `E` encyclopedia, `Esc` menu.

## Running it

You need Node.js 22 or newer.

```sh
git clone https://github.com/yf257n6vkj-arch/empires.git
cd empires
npm install
npm run dev
```

The last command prints an address, usually `http://localhost:5173`. Open it in a browser.

The Mac app is built with `bash tools/build-mac-app.sh`, which packs the game into an Electron app for Apple Silicon. The app is not signed with an Apple developer account; `tools/mac/instalace.sh` installs it and signs it for the local machine only.

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the game in the browser and reloads it after every change |
| `npm test` | Runs the automated tests |
| `npm run typecheck` | Checks types, and separately that the game core uses nothing from the browser |
| `npm run check-maps -- 500` | Generates 500 maps without a screen and prints statistics |
| `npm run pace -- 300` | A scripted player plays 120 turns on 300 maps and reports the pace of research and growth; add `--speed=quick` for the quick game |
| `npm run ai-games -- 50` | Plays 50 games of computer players only and reports cities, technologies, wars, battles and barbarians over time; takes `--speed=quick`, `--barbarians=none\|many` and `--difficulty=hard` |
| `npm run build` | Builds the finished page into `dist` |
| `npm run i18n -- de` | Lists texts a language is missing or no longer needs |

## How the code is organised

```
src/core/        the game itself, with no tie to the browser
  data/          rule numbers in JSON (terrain, units, buildings, governments, nations, world, constants)
  state.ts       the whole game state as one plain object
  commands.ts    everything a player or the AI may do, with the same checks for both
  turn.ts        end of a turn and start of the next
  view.ts        what one player can see; the only input of the AI
  mapgen.ts      the map generator
  ...            cities, units, combat, diplomacy, barbarians, score, advisor and more
src/ai/          the computer players: expansion, production, research, war, diplomacy
src/web/         drawing on canvas, the screens, sound and texts
  i18n/          translations (see below)
tests/           automated tests
tools/           scripts that run in Node without a browser
desktop/         the Electron wrapper for the Mac app
docs/            the decision log and the picture prompts
```

## Rules the code keeps

- Only features the AI rivals can use as well go into the game.
- The AI never gets the whole game state, only `playerView(state, player)`: what a human in its seat could see.
- All randomness goes through `Rng`. The same seed gives the same map, the same fights and the same AI decisions.
- The game state is a plain object that can be saved as JSON. A turn does not change the state, it returns a new one.
- Rule numbers live in `src/core/data`, not in code.
- `src/core` uses nothing from the browser, so AI tournaments run in Node.

## Languages

Texts are written in Czech in the code, wrapped in `t("...")`, and texts with a number in `tn("1|2 to 4|5 and more", n)`. The Czech sentence is the key. Each language in `src/web/i18n` maps those keys to its own texts and has its own names of units, buildings, technologies, nations and cities. English also translates the whole encyclopedia; German and French show the English encyclopedia and Slovak the Czech one until theirs are translated. `tests/i18n.test.ts` fails while any interface text is missing in any language.

## Pictures and sounds

Terrain, rivers, roads, borders and the fog are drawn in code. Unit and city sprites, buildings, encyclopedia pictures, mountains, ruins and resources were painted for the game with Google Gemini (three leader portraits with Grok) from prompts written for this project; the prompts are in `docs/` and `tools/`. Sound effects and music are synthesised by code with the Web Audio API.

## Not affiliated

Empires Reloaded is an independent fan project. It borrows game mechanics from the turn-based strategy games of the early 1990s, but no names, graphics, texts or code from them. It is not affiliated with or endorsed by the owners of any of those games.

## License

The code is free software under the GNU General Public License, version 3 or (at your option) any later version; see [LICENSE](LICENSE). The pictures in `src/web/sprites`, `src/web/techs`, `src/web/codex`, `src/web/cityview` and `src/web/guide` were generated with AI tools and are dedicated to the public domain under CC0 1.0; see [LICENSE-ASSETS.md](LICENSE-ASSETS.md). The sounds and music are produced by the code and fall under the code's license.

The game comes with no warranty.
