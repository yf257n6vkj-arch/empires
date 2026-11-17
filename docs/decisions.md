# Decisions

What we decided with Michal, so we don't have to go back over it. Newest first. Entries before version 1.0 were written in Czech and translated to English when the repository switched to English.

## 17 Nov 2026: Every window closes with the same cross

Five windows (technology tree, city overview, city, government and spaceship) had a "Close Esc" text button in the top right corner, the others a cross. Michal chose the cross everywhere, in the same place, with the tooltip "Close (Esc)". The Esc key works as before and stays described in the controls help. The small cross panels inside the city screen (city history, production detail) keep their own cross without the Esc tooltip, because Esc closes the whole city.

## 17 Nov 2026: Governments are compared in a table

The government window described each government in one long sentence of comma-separated rules, so choosing between monarchy and republic meant reading and comparing sentences in your head. Michal approved a comparison table: one row per government and columns for the highest rate, corruption (compared with despotism, or the same everywhere under communism), units each city supports for free, what soldiers do, what a celebrating city gains, and the remaining rules (tile penalty, trade bonus, settlers eating two food, collapse in long disorder), each on its own line. The column headings explain themselves on hover. The revolution button stays at the end of the row, the ruling government is highlighted and unknown ones are dimmed. The encyclopedia and the technology tree keep the one-line description.

## 17 Nov 2026: The controls help is split into four groups

The Controls window was one list of 17 points that mixed units, cities, the map and keys for the whole game, so finding for example how to zoom meant reading nearly everything. Michal approved splitting the same points into four headed groups, Units, Cities, Map and The whole game, in two columns: units on the left, the other three on the right. The window is wider and fits on a 900-pixel screen without scrolling; on narrow screens the columns stack. The texts of the points did not change.

## 17 Nov 2026: The in-game menu has two columns

Michal found the settings in the in-game menu hard to read. The menu was one column of ten equal buttons with the settings stuck underneath without a heading; the labels had different widths, "Map view" broke onto two lines, the sliders started elsewhere than the drop-downs, the map code hid in a paragraph and the language flags ran off the edge of the window, so German and French could not be picked there at all. Michal chose a two-column layout. The left column holds the commands for the game (resume, save, load, new game, main menu) with the map code under Save game, and below a line the smaller links Leaderboard and Controls. The right column is headed Settings and lines up every label with its control in a grid, with thin lines between the helper, the map view, sound and language; the flags wrap. City overview, Encyclopedia and Advisor left the menu because the top bar has them. On narrow screens the columns stack.

## 17 Nov 2026: The game is released free under GPL-3.0, pictures under CC0

Michal asked whether the game is worth selling. Analysts estimate that the median game on Steam earns roughly one to two thousand dollars over its lifetime. Steam charges 100 dollars per game and 30 % of sales, and a Mac app outside the App Store shows every buyer a warning unless it is notarised through the Apple Developer Program at 99 dollars a year. Selling also carries two specific risks. The nations and leaders follow the 1991 roster closely, and according to the Unciv README Steam declined to host that similar game. The AI pictures must be disclosed on Steam, and under the 2023 judgment of the Municipal Court in Prague (10 C 13/2023) and the US Thaler v. Perlmutter line they are not protected by copyright, so anyone could reuse them. Michal chose to release the game for free on itch.io with an optional contribution.

The code is licensed GPL-3.0-or-later: anyone may change and share it, and changed versions must stay under the same license; the authors keep the freedom to do anything with their own code, including selling it later. The AI-generated pictures are dedicated to the public domain under CC0 1.0, since claiming stricter rights in them would be doubtful. Code written mostly by Claude may also be only partly protected, so no license protects it fully. Electron (MIT) is compatible; the web build bundles no third-party libraries. The start screen says the game is free software under GPL-3.0 with no warranty, the Mac app carries both license files, and the repository stays private until Michal makes it public himself, which cannot be undone.

## 17 Nov 2026: Version 1.0 is called Empires Reloaded and speaks five languages

Michal wanted to finish the game as version 1. He first asked to rename it "Civilization reloaded". The word Civilization is a registered trademark of Take-Two and Firaxis, and the brief itself ruled the name out, so a release under it, especially a paid one, risks a demand to rename or a takedown. Michal chose "Empires Reloaded". The start screen, the window title and the Mac app carry the new name; the GitHub repository keeps its address. The Mac app keeps its old data folder, so games saved under the old name survive. A sentence in the nation window that named the original game now says "the classic game this one follows".

The game now speaks Slovak, German and French besides Czech and English. All interface texts, the names of units, buildings, technologies, nations and cities, and the How to play chapter are translated. German uses its usual exonyms (Prag, Rom, Athen), French its own (Prague, Londres, Pékin). The encyclopedia is not translated yet: German and French show the English encyclopedia with links to the English Wikipedia, Slovak the Czech one, which Slovak readers understand. A language definition now has a `fallback` for pages it lacks. Tests check every language for missing texts, placeholders and plural forms (Slovak has three forms like Czech, French counts 0 as singular).

The start screen has a short guide on how to start playing in five steps plus how to win. The debug switch that showed the whole map is gone. The start screen shows "version 1.0".

While checking the languages we found that the top bar was wider than a 1440-pixel window in every language, even in Czech, so the End turn button sat off screen. The controls now wrap onto a second row when they don't fit, and the turn counter and End turn stay at the right edge. A headless check measures this for all five languages at 1280 and 1440 pixels.

The repository is now in English: README, this decision log (translated from Czech, newest first as before) and the picture prompts in docs/tech-pictures.md.

## 17 Nov 2026: The game has sound effects and quiet music

The brief left sound out of the first version to keep the scope small. Fights are now replayed on the map, and without sound they missed half of their feedback, which is what children enjoy most according to research. Michal approved both sound effects and music.

Everything is made by code in the browser with Web Audio; there are no recordings. A fight opens with a short drum roll, then every blow sounds as the game rolled it. Swords clang, arrows whistle, muskets and rifles crack, cannons and aircraft boom and tanks roar. When a blow lands on the player's unit a dull thud is added, so you can tell by ear who is taking the hits. Victory plays a fanfare, defeat a falling motif, and a new veteran gets a chime. Founding a city, taking and losing a city, a discovery, a finished building, a new unit, a wonder and a declaration of war have sounds too. After a turn at most three sounds play, each kind once, the most important first. The sound of a captured city waits until the fight replay is over.

The music is medieval, in the Dorian mode on D, and a new piece is composed every time. It has a melody for flute or lute in AABA form, a bass, a drone on D and A and a frame drum. Each piece is played twice, then the game is silent for 25 to 60 seconds so the music doesn't wear on the player. In war the tempo is faster and the drum beats on every beat. Sound stops while the game window is hidden.

The menu has two sliders, Sounds and Music; all the way left turns them off. The game remembers them. A browser only lets a page play sound after the first click or key press, so the game is silent until then. Sound has no effect on the rules or the rivals.

## 17 Nov 2026: Rivals go to war sooner in the quick game

The quick game had fewer battles per minute of play than the normal game, and Michal wanted that fixed. The analysis showed what kept rivals from war. Most of them build no attacking units in peace, so when they decide to fight they first have to build an army, which doesn't fit into 60 turns. On top of that a peace lasted 15 turns, a quarter of a quick game.

Now in a quick game every rival keeps at least three attacking units in peace from turn 15 on and is a little keener on war. A peace lasts 8 turns, the same share of the game as 15 turns in a normal game, and this applies to the player too. The normal game is unchanged.

In 100 computer games a war started in every one, the first at a median of turn 27 instead of 34. A game has about 16 battles instead of 11, so per minute of play there are about as many battles as in the normal game. Of about 300 rivals, three were eliminated by the end of a quick game. Anyone who wants peace and quiet can choose the very easy level, where rivals never declare war.

## 17 Nov 2026: A quick game of 60 turns

The second proposal for Michal's son. An hour of screen time a day is not enough for a game that lasts a whole evening, and research showed that short games work. Polytopia has a 30-turn mode, and Sid Meier advised making a game smaller until the fun starts to go away. Michal approved a game length choice in the world settings.

A quick game ends after 60 turns and should take about 25 minutes. The world is small (34 × 24) with two rivals; both can be changed by hand. For everyone alike, surplus shields are multiplied by 2.2, research by 3.2 and food by 2. A food shortage is not multiplied. The numbers are in game.json under speeds, and the game remembers the choice. Games saved earlier load as normal games.

Everything written for a turn of the normal game moves to the same point of a quick game. Barbarians appear from turn 25 instead of 50, come out of ruins from turn 15, disasters start at turn 10 and the owl guide's stage deadlines are halved. Rivals also time the early peaceful phase and the move to the republic accordingly.

The pace was tuned with the measuring script on hundreds of maps. Slower multipliers (1.7 and 1.9) were not enough; the quick game ended roughly where a normal game stands at turn 62. With the new numbers it ends where a normal game stands around turn 80, in the late eras before tanks and the spaceship. More speed hardly helped, because founding cities and walking settlers across the map is what slows the game down. So the space race can hardly be won in a quick game, and conquest or score decides.

In 50 computer games none failed, there was a war in 47 of them and the first one started at a median of turn 34. A game has about 11 battles, a normal game 34. Per minute of play that is fewer battles than in a normal game, because the rivals still take long to build an army before they dare to attack. This stays open.

## 17 Nov 2026: Fights are replayed on the map

Michal wanted the game more fun for his son, who mostly enjoys games where armies fight. Research showed that the worst response of a game to a player's decision is nothing happening (Sid Meier at GDC 2012), and that children enjoy feedback and what they can see and hear (Malone 1981). Until now a fight ended with a line of text.

Every fight with one of the player's units is now replayed on the map. The attacker lunges at the defender, blows land round by round as the game really rolled them, sparks fly and both lose hit points on large bars. The loser falls and a banner says Victory, You held out or Defeat, with what happened and what the odds were. A new veteran gets a gold star above its head. Rivals' attacks on the player's units are replayed after their turn, once the moves have finished, and the map scrolls to the fight. A click or key skips the rest and does nothing else. Players with reduced motion in their system settings see only the result. The core therefore records for every fight where the attacker attacked from, the hit points at the start and the order of rounds. Nothing changes in the rules or the rivals.

## 17 Nov 2026: The panels moved to the corners and the bottom edge

Michal didn't like the left column of panels covering the map and thought he might drag them around. We looked at how similar games do it. Civilization VI has research as a small collapsible tracker at the top left and the unit panel at the bottom. Freeciv21 has the unit controls in a strip at the bottom centre and the minimap at the bottom right, and is the only one that lets you drag panels, which also needs a button to lock the interface. Freeciv developers advise keeping corner panels small because they cover the map, and Humankind players complain about exactly its huge unit panel.

Michal approved dissolving the column and not doing dragging. Research choice and the Advisor are now at the top left. The research choice appears only when something must be chosen. The Advisor folds into one line with the number of tips, and the game remembers that. A selected unit has a low strip at the bottom centre with a description on the left and action buttons in a row on the right. A city has three columns in the strip: growth and production, happiness and trade, and units in the city with buttons. When nothing is selected, only one line remains at the bottom with the number of units waiting. The map hangs from the top edge, so the free space is below the strip. The owl's bubble stays above the strip.

## 16 Nov 2026: The game runs as an app on the Mac

Michal chose a Mac app for the final version instead of a web address of his own or the page on claude.ai. The game is packed in Electron: a window with the Chromium browser running the same game as the web, only loaded from files inside the app, so it works offline and without signing in. The app has an icon with a medieval city, the standard Mac menu, and opens Wikipedia links in the normal browser. It is about 280 MB because it carries Chromium with it.

Claude builds the app with tools/build-mac-app.sh and puts the resulting Empires-mac.zip in Michal's folder. Michal installs it with instalace.sh, which unpacks it into Applications and signs it for this computer only, because without a paid Apple account macOS would not open it. The same steps serve every new version. Games in progress are saved inside the app, not in the browser, so a game from the claude.ai page has to be saved to a file and loaded in the app. The claude.ai page stays for quick trials of new features.

## 16 Nov 2026: Sixteen kinds of mountains, and each range has its own character

Michal wanted a more varied map, so Gemini painted ten more mountains: an alpine peak with a glacier, a jagged ridge, a double peak with a small lake, a granite dome, a red sandstone mesa, a mountain with forest on its slopes, limestone crags, a large three-peaked massif, low foothills and a dark rocky mountain.

So that a range doesn't look patchy, mountains have three characters: snowy peaks, brown and grey rock, and warm desert rock. The character changes by pieces of the map of about five by four tiles. Mountains by a desert get desert rock and mountains by glaciers and tundra get snow. Within one character each tile picks its own picture, so neighbouring mountains differ yet belong together.

## 16 Nov 2026: Gemini paints everything that stands on a single tile

Michal approved Gemini painting the ruins, all eleven special resources, the mine, the fortress and pollution too. Ruins have four forms: a Greek temple, a fallen tower, the remains of a small town and an overgrown pyramid. The prompts are in ruiny.tsv and veci.tsv, and Michal runs them with one script, veci.sh. The game uses the pictures in both views and draws these things in code until they exist.

The ground of the terrain, rivers, roads, railroads, irrigation, borders and the fog stay drawn in code, because they change shape with the neighbouring tiles and pictures would make a chessboard. Trees in forests and jungles stay drawn in code too, because there are thousands of them and painted clumps would repeat. We changed the rule in CLAUDE.md accordingly; it used to say all terrain is drawn by code, which Gemini's mountains and hills already broke.

Gemini painted everything and the pictures are in the game. This time it painted no block of soil underneath; only the fortress stands on an earth rampart, which belongs to it. Gemini painted the smoke of pollution translucent over the magenta background, and after cutting it turned purple. The script can now subtract the magenta from semi-transparent pixels and recolour the smoke brown.

## 16 Nov 2026: Roads and railroads look real

Michal wanted roads and railroads to look more realistic. Before, a straight line ran from each tile to its neighbours, and three tiles in an L made a triangle. Now a road bends smoothly on a tile it only passes through, a straight stretch wavers slightly, and the diagonal link is left out where two tiles meet through a common neighbour. The road is a packed sandy dirt track with a darker verge and two ruts from carts. The railroad has a ballast bed, wooden sleepers at regular intervals and two steel rails with a shine. Where a railroad runs, no road is drawn beside it, and the road branches off only to tiles without the railroad.

## 16 Nov 2026: The unexplored world is an old map and Gemini paints the mountains

Michal picked two ideas from how Civilization VI and Freeciv handle graphics. The unexplored world is no longer black. It looks like old parchment with stains, dashed meridians and parallels, a stronger equator and a compass rose in the corner. The paper is darker towards the edges. Explored land fades into the paper at its edge, with a brown rim on the paper behind it, as if someone had painted it into an old map. This holds in the tilted view and the top view, in the city window and on the minimap.

Mountains and hills on the tilted map are painted by Gemini: six pictures of mountains and four of hills on a magenta background, like units and cities. The prompts are in hory.tsv and Michal runs them with hory.sh. The background is cut out by tools/cut-sprites.py, which also fades the bottom of the picture into the ground. Each tile picks a picture by its position, so it doesn't change on every redraw. Until the pictures exist, the game draws mountains and hills in code as before.

Gemini painted the pictures. The mountains worked at once, but under the hills it painted a block of soil like a cut-out from a diorama. The script now cuts it off: it measures how thick the block is and cuts the picture along its lower outline shifted by that thickness. The foot of mountains and hills then fades into the ground.

## 16 Nov 2026: The map is seen at an angle and mountains, trees, cities and units stand on it

Michal wanted the game more 3D. We chose a tilted view rather than full 3D with WebGL, because drawing stays on Canvas and nothing in the existing game breaks. Full 3D would mean rewriting drawing and clicking and could slow down Safari on an older Mac. This took step six of phase 4, the map graphics, earlier than planned.

The map is now tilted like a board on a table. A tile on screen is a quarter lower than it is wide, and the front edge of the map has a brown rim. Mountains are rock massifs with two or three peaks, a lit western face, a shaded eastern one and snow on the higher peaks. The foot of a mountain dissolves into scree, so a range doesn't look like a row of tents. Hills are rolling mounds of different sizes. Ruins have a cracked temple floor, two columns with a piece of beam, broken columns and a fallen column drum. Trees, palms, reeds, cacti, animals on resources, ruins, cities, units and the flag at the end of a route stand upright instead of lying flat. City names and turn numbers on a route stay readable. A click on the upper part of a city or unit that reaches into the tile behind it selects it. When a unit is selected, a click sends it exactly to the tile under the mouse.

The menu can switch the view back to the plan from above, and the game remembers the choice. The city window still draws its surroundings from above. Ending a turn late in the game takes 110 to 250 milliseconds in the browser even with the tilted map.

## 16 Nov 2026: The owl leads step by step and shows where to click

Michal's son overlooked the owl and didn't find out how to build roads, irrigation and railroads. The owl now says in a bubble at the bottom of the screen only one thing the player should do right now. What to click blinks with a yellow ring on the map, and buttons in the panels light up. When the player does the step, the owl praises them and shows the next. It leads the whole game this way: found a city, choose research, select a unit, fortify a soldier, send an explorer, build a settler, walk to a good spot and found a city, build in the city what the chosen plan wants, and finally end the turn.

The owl first shows roads, irrigation, mines and railroads by hand and says what they are for. Only then does it teach the button for automatic work. It always sends only one soldier to explore and leads the others home to the cities. When a panel covers the tile to click, the map zooms in and moves the tile to the centre. When the player has chosen no plan, the owl leads by the builder's plan. Stories about discoveries, units and buildings no longer pop up by themselves; the owl offers them with a button in the bubble. The bubble can be hidden for one turn.

I tested it with a bot that for 30 turns clicked only where the owl pointed. It never got stuck, founded three cities, built a road and irrigation, and had research going by turn 30.

## 16 Nov 2026: Units walk straight and you can see where they go

Michal noticed that a unit on its way to a target rarely walks straight. Pathfinding had two faults. Among equally long paths it chose the one over tiles with the smallest numbers, that is up and to the left. And it counted a forest or hill as double cost even though a slow unit with one move enters them in one turn just like a meadow, so it made needless detours. Now a step never costs more than the unit's whole turn, and among equally long paths the one closest to a straight line wins. This applies to the player and the rivals.

Every own unit on its way has a faint blue dashed line to its target on the map, with a flag at the end. The selected unit's path is yellow as before, with dots where each turn ends. When units move, the player's or the rivals' after the end of the turn, they glide smoothly from tile to tile instead of jumping. Players with reduced motion in their system settings don't see the animation.

## 16 Nov 2026: Rivals found cities near food and workers irrigate hungry cities

When choosing a city site, a rival now counts how many tiles around could give two food if irrigated. For each one missing to six, it takes three points off the site. We also tried rating food higher on every tile, but then the rivals stopped settling islands because the mainland offered more weak sites. We dropped that.

An automatic settler now values food two and a half times more next to a city that has stopped growing. Such a city gets irrigation before a mine. This applies to the player's settlers on automatic work too. The pace according to the measuring script did not get worse; the player had 61 citizens at turn 120 instead of 59.

In 50 automatic games a rival had a median of 7 cities and 68 discoveries at turn 120. Its cities averaged 4.9 citizens instead of 3.8 before phase 4. A rival has about as many citizens as before, only in fewer, bigger cities, and researches faster. 3 players out of 200 got stuck with one city. A rival won by spaceship in 10 games out of 50.

## 16 Nov 2026: Phase 4, first steps: speed, Safari and rivals that grow

Speed is fine. At turn 100 the turns of three rivals take 60 to 90 milliseconds in Node. In the browser ending a turn including the redraw takes 100 to 190 milliseconds and scrolling the map runs at 60 frames per second. The game meets the two-second goal with a big margin, measured on a slower machine than a Mac M1.

Safari can't run here and WebKit could not be downloaded into the work environment. So I went through the code and added two things older Safari lacks: drawing rounded rectangles on canvas (Safari has it from version 16) and the blurred window background, which Safari before version 18 needs with a prefix. Michal has to try the game in Safari.

Looking for players stuck with one city showed that 35 % of starts lay on forest, swamp or jungle. A city on such a tile gets only one food from its centre and hardly grows. Starts now lie only where the city centre can feed the city. This applies to the player too. Rivals likewise don't found cities where the centre would give less than two food. Only a city with food to spare builds a settler, because a settler eats from its home city every turn. A worker needs spare food even after it is built; a founder may take the last of it because it leaves soon. Rivals also build wonders in their most productive city. Before, they built none except the Apollo Program; now about one wonder per game. Only the warlike rival builds the Manhattan Project.

In 50 automatic games rivals' cities averaged 4.6 citizens at turn 120 instead of 3.8. A rival had a median of 8 cities instead of 9 and 66 discoveries instead of 62. 5 players out of 200 got stuck with one city, as before. A rival won by spaceship in 15 games out of 50, before in about eight percent of games. Michal's game will show whether that is too many.

## 16 Nov 2026: Phase 4 finishes the first version

Michal approved the content of phase 4. It adds no new features; it should make the game an evening's play without hitches for Michal and his son. The steps go in this order:

1. Fix what Michal finds in a trial game on normal difficulty. That is also the last condition of the phase 3 gate and comes before everything else.
2. Measure and speed up the late game. Ending turn 100 should take at most two seconds on a Mac M1.
3. Check the game in Safari: saving, windows, mouse, trackpad and pictures.
4. Tune the rivals from automatic games and Michal's game: players stuck with one city, finding an enemy across the sea, the Manhattan Project and difficulty.
5. Give the game to Michal's son. He plays with the owl on very easy and picks a name for it. The names of units and wonders he invents become a nation of his own beside the real ones, so the encyclopedia doesn't have to be rewritten.
6. Polish the map graphics, which we wanted to return to after phase 0.

The phase passes when Michal and his son each finish a game without a game-stopping bug, Michal's game fits into 45 to 60 minutes, ending turn 100 takes under two seconds and hundreds of automatic games run without errors.

## 16 Nov 2026: Automatic games for the phase 3 gate

For the phase 3 gate the AI played 600 games without errors. In 300 games of the standard world a rival had a median of 9 cities at turn 120; the bottom tenth had 3 to 4 cities and the top tenth 15 to 16. Only 36 of 1200 players, 3 %, were left with one city after turn 60, and 15 players were eliminated. There was a war in 297 games, the first one at a median of turn 54. Rivals attacked cities in a group of at least three soldiers in two thirds of cases. A rival won by spaceship in 24 games; score decided the rest. Barbarians took 235 cities and rivals took back 103 of them.

In 100 games of the world with islands there were on average over two cities per game on islands, and a rival took a city across the sea only once. In 100 games on normal difficulty the seat that plays like a human won 23, which matches a fair share of one quarter. On hard it won 12 and had a median of 60 % of the best rival's score instead of 72 to 79 %. So on a larger sample the difference between normal and hard is clear; the earlier measurement on 20 games was just noise.

## 16 Nov 2026: Rivals use the nuclear missile freely

Claude proposed the missile only as retaliation; Michal wanted the AI to use it freely. At war a rival builds one missile in its most productive city as soon as someone completes the Manhattan Project and the rival knows rocketry. The missile waits in the city closest to the enemy. It is fired at the city the rival's army is heading for when defenders can be seen in it, or at an enemy city where the blast scores at least eight points: each citizen the city loses is a point and each destroyed soldier two. It never fires where the blast would hit its own city or units, at a nation it is at peace with, or at a city it knows a missile shield protects. It sees the shield only with an embassy, like the player. As soon as someone completes the Manhattan Project, a rival builds a shield in its two largest cities from size 6.

In automatic games nobody has fired a nuclear missile yet, because rivals don't build the Manhattan Project themselves. You will mostly see the missile when you build the project yourself.

## 16 Nov 2026: Rivals fly bombers and fighters

Michal approved aircraft without carriers. A rival builds bombers from its army budget, one instead of every fourth attacker, so the air force takes no shields from other builds. The first attempt with a separate budget for aircraft cost the rivals noticeably more spaceship wins. A bomber flies only at a target it can get back from to a city in the same turn: enemy units in the field the rival can see, and the defenders of the city its army is heading for. It attacks with a chance of at least 65 %. A rival builds fighters only once it sees an enemy aircraft. They wait in the city closest to the enemy and shoot down aircraft in range.

In 50 automatic games the rivals built 8 aircraft and attacked with them ten times. No aircraft fell for lack of fuel. Aircraft arrive only in the last thirty turns and rivals don't build many, because by then they are heading for the spaceship. In the same 50 games a rival won by spaceship five times, before diplomats, ships and aircraft nine times. The difference may be chance, but we will keep an eye on it.

## 16 Nov 2026: Rivals have warships and can land troops

Claude proposed warships without landings; Michal wanted landings too. At war a rival builds a few warships in coastal cities, at most three. A warship is a ship with attack that carries no troops, from the ironclad on. It attacks enemy ships and units by the coast when it has at least a 60 % chance of winning. It sails to the coastal city being fought over or to the nearest enemy ship, and bombards the city when it has at least a 50 % chance. A damaged ship returns to port and waits there in peace.

When a rival has no enemy city its army can reach on foot, it picks a coastal city across the sea. The army gathers in its own port with the shortest crossing, and that port builds a troop ship. As soon as there are enough soldiers, or they are clearly stronger than the city's defence, they board, the ship takes them to a free tile next to the target city and they disembark. From there they attack, and when the city is empty they walk in. A rival also considers a war across the sea on its own, just less eagerly than a war over land.

A test with two islands shows a rival taking an enemy city across the sea within three turns. In automatic games it hardly shows yet. On the standard world with one continent no landing is needed, and on the world with islands rivals mostly don't know enemy cities across the sea, so they have nowhere to send troops. They built only 3 to 5 warships in 20 games, because the rivals' coastal cities are small and mainly build defenders.

## 16 Nov 2026: The AI diplomat bribes and sabotages

Michal approved that the AI's diplomat can do what the player's can. A rival now bribes small cities up to size 4 of an enemy it is at war with, and of the barbarians. The city must lie at most eight tiles from one of its own, and a capital can't be bribed. It estimates the price with the game's own formula from what it knows: the owner's gold only with an embassy, the distance to the capital only if it has seen it, and the defenders only when it can see the city. It sees the exact price only when the diplomat stands next to the city, like the player on the diplomat's button. A rival saves up to 300 gold for a bribe and doesn't spend it on buildings. When the price turns out too high, the diplomat steals a discovery in the city or sabotages it. At war it goes to sabotage cities building a wonder or a spaceship, but it knows that only with an embassy, because without one not even the player sees what foreign cities produce.

In 20 automatic games the rivals bribed 5 cities, 3 of them barbarian, and the barbarians held 2 cities at the end instead of 7. Sabotage was rare, because a rival seldom knows that an enemy is building a wonder.

## 16 Nov 2026: Rivals take cities back from the barbarians

On the "few" setting the rivals took back only one city in thirteen from the barbarians. Analysis showed three faults in the army. Cannons and catapults stayed in cities as garrison, so the army was never together. The army waited for three units even against one barbarian. And a rival guessed a city's defence by its size even when it could see the garrison. Now defenders hold the cities first, siege units don't garrison at war, and a smaller group attacks when it is at least twice as strong as the defence. A city the rival can see is judged by the units really standing in it. A barbarian city within six tiles of one of its own cities is the army's first target, even when the rival is at war elsewhere.

In 50 automatic games the barbarians took 38 cities and the rivals took 18 of them back. The fix also improved the army in wars between nations. In 20 games the rivals took 32 cities before the fix and 67 after it. The stronger army and spaceships changed the difficulty measurement. The seat that plays like a human won 5 of 20 games on normal and had a median of 72 % of the best rival's score; on hard it won 3 games and had 70 %. The difference between levels now shows more in wins than in score, and we will measure it again once the AI has ships and aircraft.

## 16 Nov 2026: Rivals build the spaceship and sometimes win with it

No rival used to launch, because one city with a few shields built the Apollo Program while the rest of the empire did other things. Now rivals head for railroads, space flight, plastics and robotics along their discovery list. The most productive city builds Apollo and the other cities send it caravans, which the rival buys with gold. The five most productive cities build ship parts, each a different part, so the ship soon has an engine and a module. With gold the rival first buys the part the ship lacks most. When it knows all the discoveries for the ship, it lowers science to the minimum and pays for parts with taxes. It switches the cities of the space programme to a governor with the production goal.

The window of each own city shows how many shields it gives, and now the AI knows that too. Cities that can no longer grow because they lack an aqueduct work tiles with shields instead of tiles with surplus food that would go to waste. This applies to the player's cities without a manual choice too. According to the measuring script the player's pace did not change.

In 50 automatic games 48 ships launched and a rival won by spaceship in 9 games; score decided the other 41.

## 16 Nov 2026: The end screen rates the game

When someone wins or the player loses their last city, the end window opens. It shows who won and how, a chart of the score, cities and discoveries of all nations over the turns, and a table with the ranking. Below it rates the player's game. It gives a title by the score against the best rival, from tribal chief to a ruler the world will never forget, and a win is always at least a wise ruler. It says what the player did best and where they fell behind most, and adds a few numbers: cities founded and taken, the highest score and the turn the player first took the lead. From there you can keep playing or start a new game. For this the game records the score, cities and discoveries of all nations at the end of every turn. Older saved games have the chart only from the next turn.

The Leaderboard in the menu opens the same window during the game. It shows only the nations the player knows.

## 16 Nov 2026: Clicking a foreign city shows what you know about it

The foreign city window shows the nation and ruler, the city's size, whether it is the capital, its walls and other defences, wonders, and the defenders if you can see the city right now. With an embassy to that nation it also shows what the city builds and its other buildings. It has buttons for the city's history, the Nations window and sending the selected unit to the city. It opens with a click on a foreign city that is not next to the selected unit; a click on a neighbouring city still means an attack.

Because of this the AI gets as much information about foreign cities as the player. It used to see all their buildings and production; now without an embassy it sees only what is visible from outside.

## 16 Nov 2026: A war can end in a peace that lasts 15 turns

This finishes step 4 of phase 3. The Nations button at the top opens a window with all nations the player knows. For each it shows whether they are at war or at peace and since which turn, the rival's nature, its score and whether it wants peace. From there you can offer peace or declare war; war needs a second click to confirm. When a rival offers the player peace, the game asks at the start of the turn with a window showing the ruler's portrait, and the player accepts or refuses. An offer is valid until the end of the receiver's turn.

A peace lasts at least 15 turns. Whoever declares war sooner breaks the treaty, and the other nations remember it. The attack window warns the player before they confirm. No peace can be made with barbarians. The Great Wall and the United Nations now really work: rivals offer their owner peace more often and accept his offers more easily.

Rivals decide on peace by a mood built from individual reasons, much like Unciv. They want peace more the longer the war lasts, when they are weaker than the defence of enemy cities or when enemy soldiers stand near their cities. Scientists want peace more easily, warriors less. They want to go on when they have a clear advantage, when the enemy has already broken a treaty or has declared war on them more than once. They offer peace after six turns of war at the earliest and then at most once every six turns. In 40 automatic games there were 445 offers and 134 ended in peace. A war lasted a median of 18 turns and no rival broke a treaty.

Rivals also send caravans to help build wonders and open trade routes, and diplomats to open embassies and, at war, to steal discoveries.

## 16 Nov 2026: Rivals research faster and build the spaceship

Michal noticed the AI researched more slowly than it could. Analysis showed four causes. Rivals stayed in monarchy all game, left science at the default rate, were choked by the upkeep of old units in a republic, and never bought anything. Now rivals move from monarchy to a republic from turn 80, or earlier when they have no more room for cities. The warlike nature stays in monarchy at war. They set the science slider by their income and keep a reserve of 50 gold. They upgrade outdated defenders with gold and, when they can't afford it, disband those a city can do without. Gold above the reserve goes into buying buildings.

A rival had a median of 63 to 66 discoveries at turn 120 instead of 55. At the end of the game enough of the tree was left for the spaceship, so we made it cheaper. The Apollo Project costs 180 shields, a component 60, a module 90, and the base flight takes 12 turns. Rivals build Apollo in their largest city and then the ship in the order that first makes the smallest ship able to fly. They launch when the ship is finished or when it would otherwise not arrive in time. The rivals' production is still low, though, and in automatic games none has launched yet. We moved the owl's Scientist plan: schools by turn 60, science by 85, Apollo by 100 and launch by 110.

## 16 Nov 2026: Barbarians on "few" are weaker

Michal wrote that barbarians were strong even on "few". On "few" they now appear only from turn 50, there are at most 4 at a time and they come in pairs. They attack only with a chance of winning of at least 55 %. A city they take builds nothing, so it is easy to take back. Their units match the era at least half of the nations have reached; before, one most advanced nation was enough. Barbarians come out of ruins only from turn 30. The "many" setting stays as before.

In 40 automatic games barbarians took about 0.6 cities per game, before 1.5. Rivals still rarely take them back.

## 16 Nov 2026: The step between normal and hard is smaller

Michal wanted a smaller step between normal and hard. On hard the rivals' cities get 20 % more food and shields, on very hard 45 % more and an extra settler. With the new rules for research and barbarians the levels came out like this in 20 games (median score of the seat that plays like a human, as a percentage of the best rival's score): very easy 112, easy 112, normal 95, hard 72, very hard 59. Very easy and easy don't differ by score. On very easy the rivals mainly don't start wars, which the score doesn't show.

## 16 Nov 2026: Five difficulty levels

Michal wanted at least three levels. Claude proposed four, Michal chose five. Difficulty is chosen in the new game window next to the barbarians, and normal is the default. Following the brief, on the easier levels difficulty is set by how well the rivals decide, and on the harder levels the rivals get bonuses. The player and the barbarians never get bonuses. All numbers are in the rule data.

On very easy the rivals never start a war themselves, found at most 4 cities, attack only with a chance 25 percentage points higher than usual and keep half an army. On easy they rarely go to war, found at most 6 cities, want 15 points more to attack and have a 40 % smaller army. Normal is today's AI without bonuses. On hard the rivals' cities get 25 % more food and shields from tiles. On very hard they get 50 % more and every rival starts with an extra settler.

We measured the levels in automatic games where one seat is played by the AI with normal decisions and no bonuses, that is like a human. In 20 games per level this seat ended with this median percentage of the best rival's score: very easy 129, easy 114, normal 93, hard 57, very hard 41. It won 15, 12, 9, 1 and 0 games out of twenty.

## 16 Nov 2026: The owl guide for children, and victory by conquest and score

Michal wanted a guide for children that gives advice, tells about the nation, discoveries and units and above all helps to win. We decided three things. The guide is a character with cards that the player turns on in the menu instead of the advisor. It is a wise owl; Michal's son will name it, and until then it is called Owl. A plan for victory needed something to measure, so we brought the score and conquest victory forward from step 5.

The score gives a point for every citizen, another for every happy one, two points per discovery, twenty per wonder and a hundred for a spaceship that landed. The numbers are in the rule data. Whoever defeats all other nations wins by conquest; barbarians don't count. If nobody has won after turn 120, the nation with the highest score wins. The Leaderboard in the menu shows the score of the nations the player knows. In 10 automatic games all ended with a score victory. The end screen and the rating of the game stay in step 5.

The owl sits in the advisor's place. At the start of the game it introduces itself, tells something about the player's nation and ruler and asks how the child wants to win: as Conqueror, Scientist or Builder. Each path has a plan with five stages. Each stage has a target turn and two or three tasks, for example four cities and Bronze Working by turn 35. The plans are in the data and the owl reads only what the player sees on screen. Tasks are ticked off in its window and the owl watches the pace. When a stage falls behind, it says how many turns are left and what to do. It praises a finished stage and introduces the next. Below the plan it shows the advisor's two most important tips. It recommends research by the plan.

When something new appears in the game, the owl shows a card with the encyclopedia picture, two sentences of story and a fun fact. Below it explains what it means for the game. A card comes after every new discovery, for the first unit and first building of each kind, for your own wonder and when the player meets a new nation. For a neighbour the owl advises by its nature. A warning card comes when the player loses a city or barbarians appear near one. The menu can turn the storytelling down to the important things and rename the owl.

The owl has three portraits painted by Gemini, depending on whether it advises, praises or warns. The prompts are in tools/mac/sova.tsv and Michal ran them with bash sova.sh. If a picture is missing, code draws the owl.

## 16 Nov 2026: Ruins and barbarians in the classic sequel's style

Michal chose barbarians as in the 1996 sequel of the classic. In the new game window the player sets no, few or many barbarians; few is the default. Barbarians play as a special player at the end of the turn order and are at war with everyone from the start. They don't meet others and no peace can be made with them. On "few" they start appearing from turn 45, on "many" from turn 25. Every turn of theirs there is a chance they rise up in the wilds at least six tiles from cities, or land on a coast two to three tiles from a coastal city. A group has two to four units depending on the setting, and the units match the most advanced nation, from warriors and horsemen to tanks. There are at most 6 barbarians at a time, or 18 on "many". Barbarians march on the nearest city they can reach on foot and attack with a chance as low as 35 %. They keep a city they take, one unit stays in it and the city builds attackers. Rivals set out to take a barbarian city back when it lies within ten tiles of their cities, and send a smaller army than to a war.

Ruins lie on the map, one per 28 land tiles, at least three tiles from the starts and never on polar ice. The first land unit to enter ruins finds gold (25 to 100), a discovery, mercenaries, nomads who join as settlers, barbarians, or nothing. Barbarians come out of ruins only from turn 15, only in a game with barbarians and never closer than three tiles to a city. Nomads appear only until turn 60. Rivals send their explorer to ruins they know about, and the advisor points out nearby ruins to the player.

In 40 automatic games with barbarians on "few" the barbarians took 60 cities and rivals took 17 of them back; at the end of a game the barbarians held about one city per game. A rival had a median of 9 cities and 55 discoveries at turn 120, without barbarians 10 cities and 57 discoveries. Older saved games have no barbarians or ruins.

## 16 Nov 2026: A city governor, an advisor that explains, and building details

A city can switch on a governor with the goal of balance, growth, production, science, gold or defence. The governor works tiles by the goal. When the city finishes a build and nothing is planned, it chooses the next. It first makes sure of a defender, a temple when riots threaten, and then calculates what each building would add to the city and picks the one that brings the most per shield. It doesn't build buildings whose upkeep the treasury can't carry, and it leaves wonders to the player. When nothing is worth building, it builds a second defender and then earns gold. The city's plan and tiles chosen by hand take precedence. Rivals don't need governors; they run their cities with the same commands. The weights of the goals are in the rule data.

The advisor now says for every tip what to do and why. It newly advises which discovery to research and what it unlocks, warns of enemies near a city, points out an easy attack and an undefended enemy city, sends a wounded unit to heal, warns of a city that will riot after growing, recommends monarchy, exploration, nearby ruins and a wonder for the largest city. It shows the three most important tips, and a button shows all of them.

The question mark next to a unit or building in the production list opens a card right in the city with a picture, the start of the encyclopedia story and the numbers. For a unit it says what it is good for, for a building it calculates what it would add to this city right now. From the card you can order the build, add it to the plan or open the full encyclopedia page. The language choice in the menu and on the start screen has flags drawn in code.

## 16 Nov 2026: Phase 3, step 3: rivals declare war and attack in groups

Nations meet when their units or cities come into sight, and then live in peace. Attacking and taking cities is possible only at war, and only a nation that knows the other can declare war. When the player sends a unit at a nation they are at peace with, the game asks whether to declare war. The player learns about wars between rivals if they know both sides. The tooltip over a foreign unit shows the nation, whether the player is at war with it and the hit points of the units on the tile. Older saved games work; all nations in them start at peace and without contact.

The AI decides on war by named reasons, as Unciv does. Each reason adds or takes points, and it declares war when the sum is positive. The warlike nature is closer to war, the scientist far from it. Before turn 30 the AI declares war on nobody. It doesn't declare war when no foreign city is within reach or it has fewer than three attacking units. The balance of the two armies weighs most. Lack of room to expand adds points; distance and every war the AI already fights take points. While it fights one war it declares no other.

At war the AI picks the enemy city closest to its capital and builds an army for it by the number of its cities. The attacking units first gather on a tile in front of the target and set out when there are enough of them. It attacks only with at least a 60 % chance of winning, the warlike nature from 50 %. The chance is computed by the same function the player sees in the window before an attack, only from what the AI really sees. Wounded units return to the nearest city to heal. Defenders in a city sally to a neighbouring tile only with at least a 75 % chance and when a second defender stays in the city.

In 40 games of the standard world there was a war in 39, the first at a median of turn 64. 1102 fights took place and the attacker won 94 % of them, because the AI attacks only with good odds. Rivals took 54 cities, 19 were destroyed and two players were eliminated. In 8 games of the world with islands rivals fought in all of them and took 19 cities. Peace can't be made yet; a war lasts until the end of the game. Peace and peace offers come in the next step.

## 16 Nov 2026: Phase 3, step 2: rivals found cities, build and research

The AI lives in src/ai and sees only PlayerView, like a human in its place. It plays with the same commands as a human. Each turn goes in three passes so the next step sees the result of the previous one; a new city gets its production at once, for example.

The AI chooses city sites following the notes from Unciv and Freeciv. It adds up the value of the 21 tiles the city would work, weighted by distance from the centre. It adds points for a river, a hill and the coast, and counts unexplored tiles as the average of those it knows. It prefers to build four to five tiles from its own cities and avoids foreign cities. Sites another settler is already heading for are taken, and every tile of the journey lowers the value so settlers don't wander far. When room on its own landmass runs out, the AI builds a trireme that searches the coast for islands and carries settlers to them. The trireme sails only on water along the coast so it doesn't sink. Settlers with no site left improve the land with the same automation the player has.

Defence comes first in cities: one soldier, more in the capital, in large cities and in cities with an enemy nearby. At the start the capital sends one warrior to explore. Cities from size 2 build settlers, at most two at a time, three for the expanding nation, while there is room to build. There is one worker settler for every two cities. The AI picks buildings by value and price; the scientist prefers libraries and universities, the warlike nature walls and barracks. Only the largest city of an empire with at least four cities builds a wonder. Research follows an order of goals for each nature, and the AI adopts monarchy as soon as it knows it. It leaves the science and tax rate at the default, because an attempt at more science did worse in automatic games.

A new tool, npm run ai-games, plays games with computer players only. In 40 games of the standard world a rival has a median of 4 cities at turn 40, 8 at turn 80 and 10 cities and 55 technologies at turn 120. On the world with islands rivals founded 42 cities on islands in 8 games. About one player in 160 is left with one city after turn 60 because neighbours surround it. Rivals can't fight wars yet.

## 16 Nov 2026: Phase 3, step 1: combat, taking cities and rivals that defend

Combat follows the 1996 sequel of the classic. Units have its hit points and firepower, stored in the unit data. Defence is helped by terrain as in that game (hills +100 %, mountains +200 %, forest, jungle, swamp and river +25 %), by fortifying and by being in a city +50 %, a fortress +100 %, walls +200 % against land units and a coastal fortress +100 % against ships. A veteran is 50 % stronger, a winner becomes a veteran with a 50 % chance and barracks train veterans straight away. A unit with less than a full move attacks more weakly. A land unit attacks only on land and not from a ship, a ship at sea and on the coast, and only another aircraft can catch an aircraft in the air.

Before an attack a window shows the strength of both sides, what it is made of, and the chance of winning. One function computes the chance exactly, the AI uses the same one, and a test on thousands of fights checks that it holds. When a defender falls in open country, all units on the tile fall; in a city or fortress only the defender. A wounded unit that stood still all turn heals 10 % in the field, 25 % in a fortress, 33 % in its own city and fully in a city with barracks.

A military land unit can walk into a city without defenders and take it. The city loses one citizen, each building is lost with a 34 % chance, wonders stay and the palace is lost. The winner gets part of the gold by the city's size and one discovery of the loser. A city of size 1 is destroyed. When the capital falls, the government moves for free to the largest remaining city so the empire doesn't fall apart. Whoever loses their last city has lost, and their remaining units disappear.

Rivals now get starting units and play the first version of the AI. For now they only defend: they found a capital, keep two defenders in it and build walls and other buildings. They don't expand or attack; that comes in later steps. The player sees foreign units only where they can see right now. The event log shows only what concerns the player, so from the rivals' turns they learn of fights, taken cities, wonders and spaceships. Older saved games have rivals without units, so a new game is needed.

## 16 Nov 2026: Combat has hit points as in the 1996 sequel

Claude proposed round-based combat without lasting wounds; Michal chose hit points as in the 1996 sequel of the classic. A fight runs in rounds. In each round the attacker wins with probability attack / (attack + defence) and the loser loses as many hit points as the winner has firepower. The fight ends when one unit runs out of hit points. A stronger unit therefore wins far more surely than in the 1991 original; a tank against a fortified spearman in the hills wins about 96 % of the time. Hit points and firepower come from that game and live in the unit data. A wounded unit fights on with its remaining hit points and heals, slowly in the field, faster in a city and fully in a turn with barracks. The chance of winning before an attack is computed by one function that also knows the remaining hit points of both units, and the AI uses the same function. Because of this the AI has to learn to pull wounded units back to heal.

## 16 Nov 2026: Phase 3 brings combat straight against the rivals, the two-player game is dropped

The brief expected phase 3 to end with a game for two people at one computer, so the combat rules would be tried on people before the AI was built on them. Claude proposed it that way, but Michal decided to skip the two-player game and tune combat directly against the computer rivals.

Phase 3 therefore combines combat and AI. It includes combat with taking cities and the chance of winning shown before an attack, war and peace, diplomat and caravan against a rival, victory and score, rivals on the map and computer rivals following the notes from Unciv and Freeciv: founding cities, production, research, army, diplomacy and natures. The AI also has to learn to settle islands by ship. We check the combat rules without a human opponent through tests and automatic AI-versus-AI games. The phase passes when Michal finishes a game against three rivals on normal difficulty and hundreds of AI-versus-AI games show that the rivals expand, fight in groups and never get stuck.

## 16 Nov 2026: Choosing a nation lets you read about the nation and its ruler, and cities have their history

The new game window shows, next to the nations, the encyclopedia text about the chosen nation and its ruler with pictures. Links below the texts open the full encyclopedia pages.

All 240 cities of the nations got a short history of the real city based on Wikipedia, in Czech and English. In a city the City history button next to the name shows it, with a link to the Wikipedia article below. The link goes through search so it finds the article even when its title differs a little. Two cities with the same name, the Egyptian and Greek Thebes or the Aztec and Russian Tula, each have their own text, and the game picks the one for the nation the city belongs to. Invented city names have no history and the button doesn't appear for them.

## 16 Nov 2026: The player meets rivals by exploring, and a delta is a marshy fan

The opening message no longer lists the nations living on the continent. The player meets them by running into them. Michal wants the player to find that out while playing.

A river delta is drawn as a fan of marshy land the river pushes out into the sea. The river splits into three to five branches and each branch ends at a point of the fan, with the shore returning in bays between them. Sand lines the edge of the fan and the water around the mouths is muddier. The fan fades out at the shore, so it fits any terrain behind it.

City view pictures load in the background right after the game starts. Whoever opens a city before they are loaded sees an empty landscape with a note that the picture is loading, instead of the old drawn graphics.

## 16 Nov 2026: The player sets up the world when starting a game

Michal wanted to choose map parameters as in other games and approved a proposal modelled on the 1991 original and its sixth sequel. The new game window has a Set up world button. Whoever doesn't use it plays on the same map as before.

At the top you choose the world size and the number of rivals. A small world has 34 × 24 tiles and 2 rivals, a medium one 40 × 28 and 3 rivals, a large one 50 × 34 and 4 rivals. The number of rivals can be changed from 1 to 3 on a small world, to 4 on a medium and to 5 on a large one. The small world was meant to be 32 × 22, but with the most rivals and little land the starts were crowded four tiles apart, so we made it bigger. The world's shape is a continent, or a continent with islands. Islands get about a sixth of the land, lie in the sea around the continent and are separated from it by at least one sea tile. Everyone starts on the continent and reaches the islands only by ship.

More settings cover the amount of land (34, 42 or 50 % of the map), temperature, rainfall, the age of the world and resources. Temperature moves the edge of the tundra and changes the share of deserts and jungles. Rainfall changes the share of deserts and plains against forests, swamps and jungles, and the number of rivers. A young world has more mountains and an extra range, an old one more hills and one range fewer. Resources lie on 6, 10 or 15 % of tiles. Every choice can be left to chance, and the map code decides the chance. The map code carries the settings in eight digits after a slash, for example "hora-1234/25120220". The standard world keeps its code unchanged. The numbers are in world.json.

Michal wanted the continent with islands right away, although we suggested waiting until the AI could handle it. So in phase 3 the AI had to learn to bring a settler to an island by ship and found a city there. Until then islands gave the player an advantage. Two continents and archipelagos come once the AI can land an army. The scripted player's research pace is almost the same on all three sizes.

## 16 Nov 2026: Rivers fade out at the source and resources are drawn into the landscape

Michal wanted rivers to narrow to nothing at their source and left it to Claude how to draw special resources. The rules don't change.

A river's width grows with the square root of the water flowing through it and starts almost as a line at the source. The outer streams of the source fan and side tributaries narrow to a hair. Thin streams gradually fade and their dark bank narrows with them, so they vanish into the landscape at the end. A longer tributary gets one smaller tributary of its own on the way. Physical maps draw it this way too, with line width proportional to flow.

Resources are no longer badges in the corner of a tile. We drew them in code right into the landscape: a shoal of fish under the surface, grazing horses, a pheasant in a clearing, deer in the tundra, coal breaking out of a slope, a gold vein with nuggets in the rock, gems in the jungle, an oasis with a pool and palms, seals on the ice, cut peat and a lush meadow with flowers. Each tile varies the picture a little so neighbouring resources don't look like a stamp. If Michal wanted a more painted look, Gemini could paint the resources like the other pictures.

## 16 Nov 2026: The map follows nature and is drawn as a physical map

Michal approved the proposal for a more realistic map and wanted nicer rivers. The rules don't change. Tiles stay tiles of the 1991 original and each terrain has about the same share of land as before, which a check on 500 maps watches.

The generator first makes the heights. To the noise it adds two mountain ranges along gently curved lines across different parts of the continent. Mountains lie on the ridges and hills in the foothills. Then it works out the climate. Rain comes from the west and falls where the land rises, so it is dry behind the mountains. A dry belt lies between the tropics and the cold north and south. From that come deserts, jungles in warm wet lowlands, swamps in wet lowlands by the sea and forests where it rains. Rivers flow from the foothills down the slope to the sea, and tributaries join the main river. According to the scripted player a game runs as fast as before.

The map is drawn as a physical map. Terrains blend smoothly and the land has relief shaded from the northwest. Mountains and hills no longer have drawn mounds and peaks; you know them by the relief, and the highest ridges have snow. Slopes facing the northwest are light and those behind the ridge in shadow, so mountains look raised. A river is drawn as a whole river system. At its source it is a fan of small streams reaching into the nearest hills and mountains, side tributaries join it on the way, and a big river splits by the sea into a delta with several branches and sandbanks. A small river has a funnel-shaped mouth. The river widens from source to mouth. One shared smooth field of offsets makes the meanders, so a tributary always meets its river. Streams and tributaries are only a picture; for the rules only a river tile is a river. Zoomed in beyond 160 % a fine tile grid shows.

## 15 Nov 2026: We completed the economy following the 1991 original

We went through the rules of the 1991 original and added what was missing from the economy of a single empire. Combat, score and rivals stay in phase 3.

Citizens are happy, content or unhappy. Luxuries first calm the unhappy and then make the content happy. We count riots more gently than the original: they break out when there are more unhappy citizens than content and happy ones together. A city with at least three citizens where nobody is unhappy and there are at least as many happy as content citizens celebrates. Under despotism it then loses the tile penalty, under monarchy and communism it gets extra trade, and under a republic and democracy it grows every turn while it has food to spare. A celebration takes effect the turn after the conditions are met.

A citizen off the fields is a specialist. An entertainer gives 2 luxury points, a taxman 2 gold and a scientist 2 science points. Taxmen and scientists can be chosen from size 5 by clicking a specialist in the city. A large empire has fewer content citizens: above 6 cities every city has one content citizen fewer, and one fewer again for every further 6 cities. We estimated the numbers and will tune them once rivals play.

A settler can change terrain as in the original. Irrigation turns forest into plains and jungle and swamp into grassland; a mine turns grassland, plains, jungle and swamp into forest. An automatic settler changes terrain only when the tile then gives more food. A settler can join one of its own cities smaller than 10 citizens that can still grow.

A building can be sold in a city once per turn for as much gold as it cost in shields. Wonders and the palace can't be sold. Democracy can fall into anarchy when a city riots two turns in a row, each further turn with a 50 % chance. After anarchy, democracy returns. The pyramids now change the government at once without anarchy and allow any government.

Pollution no longer makes citizens unhappy. Every point above 20 gives a 2 % chance that the city pollutes a tile around it. A polluted tile gives half until a settler spends three turns cleaning it. When the world has more than 3 polluted tiles, the warming counter fills, and when it is full the land changes: swamps and jungles appear by the sea and desert inland. A nuclear plant in a rioting city can melt down until the player knows fusion power.

Disasters strike one of the player's cities with a 4 % chance each turn, from turn 20 at the earliest. They are earthquake, fire, flood, famine, pirates, plague and volcano, and a building protects against each as in the original, except the earthquake, against which nothing protects. The game also tells the player when a building protected them. In 120 automatic games the player is hit by a median of two disasters per game.

## 15 Nov 2026: Trade splits into science, luxuries and taxes, and the encyclopedia teaches how to play

Michal wanted to split money between science, taxes and luxuries. A second slider, Luxuries, was added at the top, and taxes get what is left. As in the original the government's limit applies to each of the three parts, so under despotism no more than 60 % can go to science, luxuries or taxes. Every 2 luxury points in a city turn one unhappy citizen content, and a marketplace increases luxuries. Under anarchy all trade goes to luxuries. After a revolution luxuries stay as the player set them, and if taxes would exceed the new government's limit, science is raised. Old saved games adjust their sliders the same way.

Spaceship parts can be put into a city's plan repeatedly. The order of the plan is changed with arrows by each item or by dragging with the mouse. The list of builds in a city stays where the player was after adding to the plan. Gold that cities earn instead of building now counts in the income at the top and in the cities overview.

When the player completes a wonder of the world, the game sets off fireworks and shows the wonder's picture, what it is and what it gives the player, with a button to the encyclopedia. The spaceship is drawn in code. It grows on the launch pad as parts are built, flies between Earth and the target star after launch and stands on a foreign planet with the player's flag after landing. A city's wall runs around a rectangle enclosing all the buildings, so it has no needless jags.

The encyclopedia has a new chapter, How to play, with twelve pages on growth, happiness, production, trade, research, governments, wonders, corruption and victory. It takes its numbers from the rules, so they stay true when the rules change. Every encyclopedia and technology page has a second paragraph and three fun facts the player can switch with the Another fact button. The first fact is chosen at random.

We went through the Czech and renamed a few things: masonry, construction (now concrete), the swordsman (now legionary), the ironclad, nuclear fission, and the technology Nuclear Power Plant became Nuclear Power so it isn't confused with the building. We also fixed the grammar in city messages.

## 15 Nov 2026: The game speaks Czech and English and has a cities overview

Michal wanted a bilingual game to which more languages can be added. We keep writing texts in Czech in the code, and the Czech sentence is the key to the translation. English has its own file with translations of sentences, the names of units, buildings, technologies, nations and cities, and the whole encyclopedia. A new language starts by copying the English files and translating the values; a test makes sure no interface text is missing. In a language without its own encyclopedia the encyclopedia shows in Czech.

The language is chosen on the start screen or in the menu, and the game remembers it. Czech is the default. After switching, the page reloads and the game in progress stays. Event log entries already in the game stay in the language they were written in. Keys are the same in both languages; the railroad stays on Z.

English texts use British spelling. Cities that already stand have Czech names in the saved game, and the English version translates them by the nation's list, so Praha becomes Prague. Links from the English encyclopedia go through search on the English Wikipedia, because we didn't verify article titles there. The sentence about the original game next to the nation choice doesn't use the game's name in English.

The cities overview opens with the O key, the Cities button at the top or the menu. For each city it shows size, food and growth, shields, trade, science, gold, mood and the number of buildings. In the Producing column you can change the build right away and buy the finished production next to it. A click on the name opens the whole city. The overview uses the same commands as the rest of the game.

## 15 Nov 2026: The city in detail always looks the same and code draws the wall

When Michal changed the height of the city picture, the game laid out the buildings anew each time and the city looked different. Now the layout is computed only from what stands in the city, and resizing only zooms the picture in or out. A different layout comes only when the city grows or builds something new.

We repeated the wall from Gemini's castle picture in every corner and it looked bad. Now code draws the wall: a stone wall with a walkway and battlements runs around the edge of the city, and round towers with red roofs stand only where the wall turns.

## 15 Nov 2026: The map has all the terrains of the 1991 original and special resources

Michal wanted all the terrains of the original. Tundra, glacier, jungle, swamp and river joined ocean, grassland, plains, forest, hills, mountains and desert. Yields and movement match the original. Michal sent a list where grassland had 2/1/0 and river 2/1/1, but in the original grassland has 2/0/0 and river 1/0/1, and the extra shield on grassland comes only from the special resource. We keep the original's values.

The river is a terrain of its own as in the original and flows from hills and mountains to the sea. A road or railroad across it can be built only with bridge building. Tundra lies towards the poles, jungle and swamp in wet lowlands, and polar ice at the top and bottom edges of the map. Jungle and swamp can't be irrigated or changed into another terrain yet.

Every terrain except the river has a special resource from the original, for example fish in the sea, horses on the plains, coal in the hills or gold in the mountains. They appear on about a tenth of tiles and two never touch. Fish lie only by the continent's coast. The game shows them with a small mark on the tile and counts them in the yield, so the AI sees them too.

A city can earn gold instead of building. Every shield then turns into one gold and stored shields wait for the next build. This choice can't go into the plan because it never ends.

## 15 Nov 2026: A city has a build plan, settlers work by themselves and the game has an advisor

Michal wanted a work queue in cities. A city can now plan up to eight more builds. When it finishes the current one, it takes the next from the plan and skips what can no longer be built. Without a plan it keeps producing the same unit, or after a finished building switches to a defender. The plan is an ordinary command, so the AI will use it too.

A settler can build a road or railroad along the whole route to a target. On every tile without a road it stops, builds it and goes on. Under a railroad it lays a road first. A settler can also work by itself: it picks a tile around its own cities where an improvement adds the most food, production and trade, and accounts for how far it has to walk. Tiles the city works come first. Two settlers don't pick the same tile. Orders are carried out at the start of every turn, and the AI will use them the same way.

The game has an advisor for Michal's son. At the top left it shows at most three tips by urgency, for example choose research, calm riots, don't let gold run out, or found another city. Each tip has a button that takes the player to the right place. The advisor reads only what the player sees about their cities and units. It can be turned off in the menu.

In the city detail the border between the picture and the panels can be dragged with the mouse, and the game remembers the height.

## 15 Nov 2026: The view into a city is an isometric board

The first attempt at the city detail failed. Gemini's buildings are drawn isometrically and the landscape behind them from the front, so the buildings looked stuck onto a photo and each stood on a different base. Michal approved redoing the view after the third sequel of the classic. The city now stands on an isometric board at the same angle as the building pictures. Streets run around blocks of two by two plots, each plot holds a building or a house, and a wonder takes a whole block. The game measures the base of every picture and aligns it to the plot, so the bases join up. The city grows from the centre block by block, and more citizens bring more houses. Harbour cities have the sea on the right, with harbour buildings on the shore. The wall runs around the edge of the city with towers in the corners. The painted landscape in the background is gone.

## 15 Nov 2026: Gemini draws the city detail and terrain has natural borders

Michal wanted the city detail to look good, with every building drawn by Gemini. Gemini draws each building and wonder as a separate picture from a slight elevation, plus three types of houses for each era and two background landscapes, one with the sea for harbour cities. The city detail places buildings in rows on a meadow, wonders get the best spots and houses fill the rest by the number of citizens. A wall with towers runs in front. A wide window extends the landscape at the sides with mirrored pieces of meadow. The building pictures also serve as icons in the city's lists.

The city detail now fits on the screen without scrolling. The view into the city with its citizens is at the top; the surroundings, production and city overview below. The menu of what to build is a list split into units, buildings and wonders.

Code still draws the terrain on the map. But the borders between terrains wave along smooth noise, so grassland, plains and forest meet in curves and the coast has no steps. The coast waves less, so a land tile always looks like land. Trees and grass grow according to the ground they happen to lie on. The rules don't change; each tile still has one terrain.

A unit can be sent into a city or to another unit with a right click or the G key. Before, a click on one's own city only selected it. A unit on its way has a blue arrow and the C key cancels its route.

## 15 Nov 2026: The game has a main menu and the map fills the whole window

Michal wanted an interface modelled on the third sequel of the classic. On launch a main menu appears with encyclopedia pictures slowly cross-fading. From it the player continues the game in progress, starts a new one, loads a saved one or opens the encyclopedia and the controls.

In the game the button at the top left or the Esc key, when no unit is selected, opens the menu. A game can be saved under a name. The browser has room for twelve saved games, because a browser has only a few megabytes for data. Whoever wants to move a game elsewhere or keep more saves it to a file. Autosaving after every step stays, and the main menu offers a Continue button from it.

The side panel is gone and the map fills the whole window under the top bar. The research choice and the unit or city panel float at the bottom left, the event log at the top right, and it can be folded. A minimap of the whole continent sits at the bottom right. A click on it moves the view to that spot and, when the map is zoomed out, zooms in at once.

## 15 Nov 2026: Gemini draws units and cities

Michal approved units and cities on the map being pictures by Gemini instead of figures drawn in code. Gemini draws each unit as a figure from a slight elevation on a magenta background and Claude cuts out the background. Cities look different by their owner's era (prehistory and antiquity, Middle Ages, industrial age, modern age), with a small and a large version for each era. The large version applies from six citizens.

In the pictures, clothing doesn't have the nation's colour, so the colour shows on the base under a unit and the ring around a city. What the pictures don't have, code still draws. Terrain stays drawn in code.

A fortified unit is now surrounded by a stone wall with battlements and has a badge with a tower above it. Before, you could only tell by noticing a low wall in front of the base.

## 15 Nov 2026: The encyclopedia has entries on the rulers

Every ruler has an encyclopedia entry with a portrait by Gemini. Michal wanted the texts to bring real facts from their lives besides a general description and not avoid the dark sides. For Caesar, Genghis Khan, Stalin, Mao and others the entry therefore says how many people died under their rule or in their wars, and for Charles IV it recalls the pogrom in Nuremberg. The numbers follow historians' estimates, and where estimates differ the text says so.

Gemini refused to draw Gandhi, Stalin and Mao, even from behind or without a name. Michal therefore had their portraits drawn by Grok in the same painterly style. All other pictures in the encyclopedia and on the map are still drawn by Gemini.

## 15 Nov 2026: You play the nations of the 1991 original and the Czechs

Michal wanted the nations of the original plus the Czechs. There are fifteen nations to choose from: Romans, Babylonians, Germans, Egyptians, Americans, Greeks, Indians, Russians, Zulus, French, Aztecs, Chinese, English, Mongols and the Czechs with Charles IV. The original brief expected Michal's son to invent the nations' names; this replaces that. He can still invent names of units and wonders.

The nations have no special bonuses, as in the original. They differ in name, ruler, colour, city names and the nature by which the computer plays them. The Mongols rely on their army, for example, and the Czechs bet on science. The nations are paired by colour as in the original, and two nations of the same colour never meet in one game. Each nation has sixteen real city names, after which the game takes generic Czech names.

The rulers are the same as in the original, including Stalin and Mao. Claude first replaced them with Peter the Great and the first Chinese emperor, because Michal's son would play too. Michal wanted the original, and the encyclopedia has an honest entry on the rulers that doesn't hide how many people died under their rule.

A new game starts with a window where the player chooses a nation. Rivals get random nations of other colours. Saved games got nations assigned automatically.

## 15 Nov 2026: Units can be disbanded and upgraded

Any unit can be disbanded. In one of your cities it gives half its cost to production; elsewhere it simply disappears. A ship with units on board can be disbanded only in a city, so nobody drowns.

A unit can be upgraded only in one of your cities, to the newest type in its line for which the player has the technology. The lines follow what replaced which unit in the original, for example warrior, spearman, musketeer and rifleman. Upgrading costs 10 gold plus 2 gold for each shield of difference in price and takes the rest of the unit's turn. A warrior to a musketeer thus costs 30 gold, while buying a musketeer in a city that has produced nothing yet costs over 80. Both actions are ordinary commands, so the computer can use them too.

## 15 Nov 2026: The encyclopedia describes everything in the game

Michal wanted every unit, building, wonder, government, terrain and land improvement to have a description and a picture. The encyclopedia has 98 entries and opens with a button in the top bar or the E key. You can also jump to an entry from the technology tree or by clicking a building in a city.

Each entry has a short text for children, a fun fact linked to Czechia where possible, and a link to an article on the Czech Wikipedia. Claude wrote the texts and checked them against downloaded articles. Below the text the game lists what the entry does by the rules and which technology unlocks it, so the description never drifts from the numbers in the data.

Gemini draws the pictures in a uniform painted style, and Michal generates them with a script on his Mac, because he keeps the Gemini key to himself. Claude scales them to 800 × 600 and crops a paper margin when a picture has one. If a picture were missing, the game would show a portrait of the unit or building drawn in code instead.

## 15 Nov 2026: The game has everything the technologies of the 1991 original unlock

Michal approved the research lab and then wanted to go through the original's tree and add what each technology unlocks. Claude recommended leaving out governments, the diplomat and the caravan, because the brief excluded them for the AI's sake. Michal chose absolutely everything, so the game now goes beyond the brief for the first version in these things.

There are 29 units. New are the war chariot, artillery, mechanised infantry, diplomat, caravan, nine ships from trireme to aircraft carrier, and the fighter, bomber and nuclear missile. Ships are built only in coastal cities, sail on the sea and carry land units. A unit boards by stepping onto a ship from the coast and leaves by stepping onto land. A trireme may sink on the open sea. Aircraft must land in a city or on a carrier within one or two turns. Combat in phase 3 uses the attack and defence of all units.

There are 27 buildings, including the research lab, coastal fortress, missile shield and three spaceship parts. There are 24 wonders: all 21 of the original plus our Hall of Scholars, Grand Bazaar and the Stone Circle, which moved to burial rites. Wonders carry real historical names, for example the Pyramids of Giza, the Library of Alexandria, the Sistine Chapel or the Apollo Program. Where the original only attached a name to a building, we chose a real place: St Vitus Cathedral replaced Bach's cathedral, the Royal Society replaced Newton's college and the Human Genome Project replaced the cure for cancer. A wonder stops working when its owner discovers the technology that cancels it in the original.

The path to victory is now the spaceship, which replaced the Great Work. The Apollo Program lets everyone build parts. The ship needs engines and modules with a structure for each; engines shorten the flight and modules raise the chance of landing. Whoever lands first has won.

There are six governments. Despotism takes one from tiles yielding more than 2 but spares the city centre, otherwise cities hardly grew in a 120-turn game. Monarchy and communism have martial law; a republic and democracy give more trade, but soldiers outside their own cities make people unhappy. Each government limits how much trade goes to science or gold. A revolution means two turns of anarchy, one with the pyramids. Units beyond the number a city supports for free cost a shield, and when a city can't pay the upkeep it disbands its newest unit.

A diplomat can open an embassy, steal a technology, sabotage and incite a city. A caravan helps build wonders and opens trade routes to distant cities. A nuclear missile shrinks cities and destroys units around its target; the missile shield stops it. A settler builds railroads, on which travel is free and which add shields, and fortresses.

The pace meter on 100 maps showed that the government matters. A scripted player that stays in monarchy has 10 cities at turn 120 and reaches the modern age around turn 92. When it moves to a republic it has only 7 cities, because its units cost shields, but reaches the modern age around turn 87 and the whole tree around turn 104.

What doesn't work yet: combat, and with it the defence of fortresses, coastal fortresses and walls, and diplomacy, and with it peace offers from the Great Wall and the UN and the republic's senate. They come in phase 3. The bridge across a river from bridge building is missing because the map has no rivers. A nuclear plant can't melt down. Twelve technologies unlock nothing, as in the original.

## 15 Nov 2026: The game has all buildings of the 1991 original that make sense without ships and nuclear weapons

Michal wanted at least all buildings of the original. Ten were added: palace, courthouse, harbour, bank, coal, hydro and nuclear power plant, robotic factory, mass transit and recycling centre. As with the other buildings, prices are about half the original's and upkeep stayed almost the same. The game now has 21 buildings and 5 wonders.

So that the palace and courthouse matter, we added corruption. Every city loses 3 % of its trade for every tile of distance from the palace, at most half. The player gets the palace free in the first city, and building it elsewhere moves the seat of government. The courthouse removes half the corruption. On the pace meter corruption took about 15 % of trade at turn 120 and research slowed down, so we made technologies cheaper at 6 + 0.45 × the number known. Classical antiquity then comes around turn 43, the modern age around 87, and the scripted player has the whole tree at a median of turn 106; in 43 % of games it doesn't finish it.

Mass transit, recycling and the difference between power plants depend on pollution in the original. The brief left pollution out of the first version, because with it the AI has to send settlers to clean tiles. So we introduced a simple form without dirty tiles. A city's production and citizens with industrial technologies make pollution points. Above 20 points every started 10 points make one citizen unhappy. Hydro and nuclear plants pollute half as much as a coal plant, recycling removes two thirds of the pollution from production and mass transit switches off pollution from citizens. The AI handles that without a new kind of decision; it sees only numbers in the city. The pace meter found pollution only late in the game and rarely.

Power plants need a factory, and a city has only one; a new one replaces the old. The nuclear plant could blow up in the original; we left that out. A harbour can be built only by the sea and adds food on the ocean. Map making unlocks it, because the harbour doesn't belong to pottery historically, where the original put it, and map making unlocked nothing else. A building missing its required building, such as a power plant after the factory is sold, has no effect.

We left out three things. The coastal fortress protects against ships and the missile shield against nuclear weapons, and neither is in the game. The last wonder, the Great Work, replaces the spaceship parts. If ships or nuclear weapons are ever added, we add these with them.

## 15 Nov 2026: We compared the technology texts with the Czech Wikipedia

Michal downloaded all 68 articles linked from the technology pages with the script `tools/mac/wiki.sh` on his Mac, and we compared the texts with them. We fixed what didn't match: the oldest pottery is over 17,000 years old, the Ljubljana wheel over 5,000 years, the Präsident was the first car made in today's Czechia, and the legend of eggs in the mortar of Charles Bridge was disproved in 2010 by chemists from the University of Chemistry and Technology in Prague. To maps we added the map carved into a mammoth tusk from Pavlov. Links go straight to the main articles without redirects, and construction links to the article on concrete, because no article on Roman concrete exists.

## 15 Nov 2026: We generate pictures for the technologies and take only texts from Wikipedia

Michal decided to generate the pictures for the technology pages instead of downloading photos from Wikimedia Commons. That removes the need to credit authors and licences. Each page has room for one picture in a 4 : 3 ratio, named after the technology's key and stored in `src/web/techs/`. The prompts for all 68 technologies are in `docs/tech-pictures.md` and share the style of a children's encyclopedia. Until a picture exists, the page shows a large icon. For the game itself the rule that graphics are drawn in code still applies.

## 15 Nov 2026: The technology tree has all 67 advances of the 1991 original plus archery

Michal wanted the whole tree as in the original, right away. The tree has 68 technologies in five eras: prehistory and the ancient world, classical antiquity, the Middle Ages and Renaissance, the modern era and the present day. It follows the original's poster and differs in two things. Writing comes before the alphabet, because people wrote in cuneiform and hieroglyphs long before the alphabet arose, so laws and mathematics follow writing. And archery was added so archers have a discovery of their own. Units, buildings and wonders were tied to the nearest technology of the original; the automobile unlocks the tank and masonry the aqueduct. Religion unlocks a new building, the cathedral, which calms three unhappy citizens.

So that the tree fits into 120 turns, research costs 6 + 0.55 × the number of known technologies. On 300 maps the scripted player reached classical antiquity around turn 44, the Middle Ages around 56, the modern era around 70 and the present day around 88. It had the whole tree at a median of turn 106 and didn't finish it in 29 % of games. A discovery now comes roughly every two turns, so a research goal was added. The player clicks a distant technology and the game researches towards it by itself; the AI can use the goal too.

Of the 68 technologies, 45 unlock nothing yet and only open the way on. The tree is poor in buildings and units, mainly from the modern era on. We will decide separately on filling them in.

## 15 Nov 2026: Every technology has a page for a curious child

Michal wanted his son to learn something from the game too. Every technology has a drawn icon, when it arose, a short story, a fun fact headed Did you know? and a link to an article on the Czech Wikipedia. Where possible the facts point to Czechia, for example Únětice, Charles Bridge, the píšťala and the pistol, the thaler and the dollar, Mendel or Čapek's robot. The technology tree is now a poster with icons and arrows showing what the player knows, what is being researched and which way leads to the goal.

Michal also wants photos and pictures from the internet on the pages, which changes the brief's rule that the first version has no outside pictures. The rule still holds for the game itself; photos would be only in the encyclopedia, with the author and licence given. They can't be downloaded yet, because the environment Claude works in doesn't have Wikimedia Commons among its allowed sites. Michal can allow it in Claude's settings under Settings > Capabilities. Later we decided to generate the pictures instead; see the entry above.

## 15 Nov 2026: A city has its own screen and citizens can be moved by hand

A double-click on a city or the Open city button shows a screen inspired by the original and its third sequel. At the top is a painted view of the city where every built building and wonder stands and houses multiply with size. Below are the citizens as figures (content, unhappy, entertainers), the city's surroundings with tile yields, food stores, production with pictures of everything that can be built, trade, buildings and units. A click on a tile sends a citizen to the field or calls one back, and a free citizen becomes an entertainer. A manual placement holds until the city grows or shrinks, then the city places citizens by itself. The AI will use automatic placement, but can use the manual choice with the same command.

## 15 Nov 2026: Figures are more realistic

Figures have joints, shading and equipment of their time: a warrior with a club and a fur, a hoplite with a bronze helmet and shield, an archer in a hood with a drawn bow, a legionary in plate armour with a shield, a musketeer with a hat and musket, a soldier with a helmet and a rifle with a bayonet. Riders sit on horses with manes and tails, and the knight's horse has a caparison in the player's colour. The catapult, cannon and tank are more detailed, and an ox with horns pulls the settler.

## 14 Nov 2026: The economy runs about twice as fast as in the 1991 original

The numbers taken from the original are built for a game of more than 500 turns. With 120 turns a player would discover only a few technologies by the end. The pace meter (`npm run pace`) showed it at once: a scripted player that only founds cities, builds buildings, roads and irrigation and researches had 4 technologies of 24 at turn 120. So we changed the numbers in the data: cities grow twice as fast, units and buildings cost half, and research costs 10 + 6 × the number of known technologies. On 300 maps the scripted player now reaches classical antiquity around turn 47, the Middle Ages around 70 and the modern era around 93. It has the whole tree at a median of turn 110, leaving about ten turns for the Great Work. A sensible human should be a bit faster. Once you play the phase, we will tune the numbers by feel.

## 14 Nov 2026: Phase 2 is the economy of one civilisation; combat comes in phase 3

In phase 2 we build technologies (about 24 in 4 eras), a slider between research and gold, building upkeep and rushing production with gold, about 10 buildings, 5 wonders, happiness and all of the roughly 12 unit types. Units will have attack and defence, but fighting starts only in phase 3, which adds the two-player game, war and peace, victory and score. We moved combat because without an opponent it couldn't be tried out. Phase 2 passes when one player plays to turn 120 and the technology tree can reasonably be completed in that time. We measure the pace with a simple scripted player on hundreds of maps. It doesn't replace the AI; it only serves to tune the numbers.

## 14 Nov 2026: Phase 1 is done

Michal closed phase 1. The game has exploration, founding and growing cities, production, building roads, mines and irrigation, zooming the map and autosaving, and the graphics are polished. We continue with phase 2.

## 14 Nov 2026: Terrain has its own colours, surfaces and soft transitions

Michal wanted terrain more realistic and the kinds easier to tell apart. Each terrain now has its own colour and shapes. Grassland is rich green with tufts of grass and flowers, plains golden with dry grass and bushes. Forest is dark and dense, hills olive-green rounded ridges. Mountains are grey rocky peaks with snow, desert light sand with dunes and the occasional cactus. Neighbouring tiles blend gently at edges and corners and the sea darkens smoothly away from the coast, so the map doesn't look like a chessboard. By the coast there are shallows, a beach and surf. A zoomed map draws its background with a margin around the view so scrolling stays smooth.

## 14 Nov 2026: The map can be zoomed up to three times

Michal wanted to zoom the map. On a trackpad you zoom by spreading fingers and scroll with two fingers; with a mouse with Ctrl and the wheel and by dragging. The buttons in the corner of the map and the + and − keys work too; zero shows the whole map. When the map is zoomed and the selected unit reaches the edge of the view, the map scrolls to it by itself. City labels grow more slowly than the map so they don't cover it when zoomed. This is only the view; the rules and the AI are not affected.

## 14 Nov 2026: Units are figures on a base, cities have houses and walls

Michal wanted units and cities to look more like the real thing. Units now stand as painted figures on an oval base in the player's colour. The warrior has a tunic in the player's colour, a club and a wooden shield; the settler is a covered wagon pulled by an ox. A fortified unit has a low stone wall in front of it, a working settler a golden arc of progress around the base. Cities have half-timbered houses with gabled roofs and grow in stages: up to size 2 three houses in a palisade, up to 5 a town hall is added, from 6 stone walls with a gate, a castle and towers, from 8 rear towers too. A unit in a city stands smaller in the left corner so it covers neither the city nor its label.

The look of the walls only reflects the city's size for now. Once the City Walls building is in the game, the building should show them, so the player can tell which city is fortified.

## 14 Nov 2026: Graphics stay flat and drawn in code, but with detail

Michal wanted a big leap in looks. Units are round tokens in the player's colour with a drawn figure (a warrior with a club, a settler with a wagon); cities are clusters of houses with a palisade that grow with size and have a tower from size 4. The city's size is in its label. Terrain has textures, the sea has depth, the coast a sandy edge and the fog a soft transition. The map scales with the window size. We didn't choose the pixel look of the old games.

## 14 Nov 2026: Borders are only shown; as a rule they come later

The map shows the reach of cities (21 tiles around each city) as a dashed border in the player's colour. The rules have no borders, as in the original: units may go anywhere, and a city can't be founded only right next to another. Real borders (no entry in peace, no cities on foreign land, borders spreading by culture) are an idea for a later version, once the base with the AI plays well, because they would add new decisions for the AI. When rivals arrive, we will show the reach of their cities the same way.

## 14 Nov 2026: Phase 1 ends with a playable first 30 turns without rivals

Phase 1 contains the start with a settler and a warrior, movement by terrain cost, lifting the fog of war, founding cities, city growth by food, a production queue (warrior, settler, granary), the settler as a worker (road, mine, irrigation), ending the turn and autosaving. Combat, technologies, trade, happiness and rivals come in later phases. Computer players have only a starting position and no units in phase 1. The phase closes with a playable version on which we polish the graphics.

## 14 Nov 2026: We polish the graphics at the end of phase 1

The map from phase 0 is right; the graphics need polishing. We do that on a playable map with units and cities, because terrain will then mostly be a background through which units and player colours must show. Until then we draw units and cities simply so they are easy to change, and terrain stays as it is.

## 14 Nov 2026: The settler has two jobs, as in the 1991 original

One unit founds cities and builds roads, mines and irrigation. The AI sets a settler's purpose (founder or worker) when it puts it into production and doesn't change it during its life. Production counts separately how many founders and how many workers it wants. AI tournaments watch whether one of the purposes stops being built. The player can use their settler for anything.
