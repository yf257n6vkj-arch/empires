import type { GuideKey, GuidePage } from "../guidePages";

/** English "How to play" pages, same keys and placeholders as GUIDE_PAGES. */
export const EN_GUIDE: Record<GuideKey, GuidePage> = {
  "how-start": {
    title: "How to start",
    icon: "🏕️",
    text: `You begin with a settler and a warrior. Find a good spot with the settler and found your capital there with the B key. A tile by a river or the sea works well, with plenty of grassland and plains around and a bit of forest or hills. Grassland and plains give food, forest and hills give shields for production.

Don't wait too long. Every turn without a city is a turn lost. Keep the warrior in the city to guard it, or explore the area with it for a few turns.

In your first city, build a warrior for defence first and then a settler. A settler takes one citizen from the city, but it founds a new city, and that soon pays back. More cities mean more food, production and science.

Choose what your scholars research right at the start. If you don't know, begin with Pottery, Bronze Working or Burial Rites, which unlocks the temple.

Before you start a new game, you can set up the world in the nation window. You choose its size, the number of rivals and whether islands lie around the continent. Under more settings you can change the amount of land, the temperature, rainfall, the age of the world and the resources. The map code carries the world settings too, so anyone who enters the same code gets the same world.`,
  },
  "how-growth": {
    title: "How to make cities grow",
    icon: "🌾",
    text: `Every citizen eats {foodPerCitizen} food a turn. What is left goes into the city's food box. When the box is full, the city grows by one citizen. A small city needs little food; each next step of the box holds {growthFoodBase} more food.

Food comes mainly from grassland, plains, rivers and the sea. A settler can irrigate a tile so it gives more food. You can only irrigate next to water: next to a river, the sea, another irrigated tile or a city. Special resources such as fish or fertile soil add extra food.

A city without an aqueduct grows to at most {maxCitySize} citizens. An aqueduct lets it grow up to {aqueductSize}. A granary keeps half of the food after the city grows, so the next growth comes sooner. A harbour adds food on sea tiles.

When a city starves, its food box empties and the city shrinks. Open it and move citizens onto tiles with food. Settlers also eat food from their home city.`,
  },
  "how-happy": {
    title: "How to keep citizens happy",
    icon: "😊",
    text: `Citizens are happy, content or unhappy. The first {contentBase} citizens of every city are content and every one after that is unhappy. When a city has more unhappy citizens than content and happy ones together, riots break out and the city produces and earns nothing for the whole turn.

A large empire is harder to hold. With more than {empireSizeBase} cities every city has one content citizen fewer, and one fewer again for every further {empireSizeStep} cities.

A temple calms {templeContent} unhappy citizens. An amphitheatre and a cathedral calm even more. Some wonders of the world calm citizens in all your cities. Under despotism, monarchy and communism every soldier in a city calms one unhappy citizen, at most {martialLawMax} soldiers per city. In a republic or a democracy that doesn't work, and soldiers outside your own cities make people unhappy instead.

The Luxuries slider at the top sends part of your trade to luxuries. Every {luxuryPerContent} luxury points in a city first calm one unhappy citizen. Once nobody is unhappy, they make a content citizen happy. A marketplace makes luxuries bigger.

When a city with at least {celebrationMinSize} citizens has nobody unhappy and at least as many happy as content citizens, it celebrates. Under despotism its tiles then lose their penalty, under monarchy and communism tiles with trade give extra trade, and under a republic or democracy the city grows by one citizen every turn while it has food to spare. Celebrations under a republic are the fastest way to big cities.

A citizen you call off the fields becomes a specialist. An entertainer gives {specialistYield} luxury points. In a city with at least {specialistMinSize} citizens you can click a specialist and make them a taxman, who brings {specialistYield} gold, or a scientist, who brings {specialistYield} science points. The game adds entertainers by itself when riots threaten.`,
  },
  "how-production": {
    title: "How to produce more",
    icon: "⚒️",
    text: `Shields from the city's tiles go into production. Forests, hills and mountains give the most shields. A mine on a hill adds more. Coal, horses or gold on a tile give even more.

A city can plan up to {queueLength} items one after another. Use + next to an item to add it to the plan, and the arrows or dragging to change the order. When the city finishes one thing, it starts the next by itself.

Gold buys production at once. Buying is most expensive when the city has produced nothing yet; topping up the rest is cheaper. Wonders of the world cost double.

A factory adds half of the shields and a power plant another quarter. Every unit beyond the number the city supports for free costs a shield a turn. When there is nothing to build, choose Earn gold and the shields turn into gold.`,
  },
  "how-trade": {
    title: "How to split trade into science, taxes and luxuries",
    icon: "⚖️",
    text: `Trade comes from rivers, seas, oceans and roads on plains, grassland and desert. Each city's trade is split into three parts: science, taxes and luxuries. The Science and Luxuries sliders at the top set how much goes to science and to luxuries. Taxes get what is left.

Science moves research forward. Taxes pay building upkeep and can be saved for buying. Luxuries make citizens content and happy.

Your government sets the most you may put into one part. Under despotism it is {despotismMax} %, under democracy up to {democracyMax} %. The sliders move in steps of {rateStep} %.

Libraries, universities and research centres add science. Marketplaces and banks add taxes and luxuries. A caravan can open a trade route to a distant city, at least {tradeRouteMinDistance} tiles away, which then brings trade every turn.`,
  },
  "how-research": {
    title: "How to research fast",
    icon: "🔬",
    text: `Every discovery costs more than the one before. Science from all your cities adds up, so more cities research faster.

In the technology tree, click a distant technology and set it as your goal. The game then picks the discoveries that lead to it by itself.

Build libraries in cities with a lot of trade. Cities by rivers and the sea have the most. A republic and a democracy give more trade on every tile that already has some.

The Hall of Scholars adds science in all your cities, and the Great Observatory doubles science in its own city. The Library of Alexandria gives you every technology that at least two other empires know. At the end of the tree waits the spaceship.`,
  },
  "how-settlers": {
    title: "How settlers work",
    icon: "⛏️",
    text: `Settlers found cities and improve the land. A road speeds up movement and adds trade on plains, grassland and desert. Irrigation adds food. A mine adds shields on hills and mountains. A railroad adds more shields and moving along it costs nothing.

Settlers can change the terrain too. Irrigation clears a forest into plains and drains jungle or swamp into grassland. A mine does the opposite and plants a forest on grassland, plains, jungle or swamp. Changing the terrain needs no water, but it takes longer than ordinary work.

Press A to let a settler work on its own. It improves the tiles around your cities, the worked ones first, and cleans up pollution too. Press K and click a target to have the settler build a road along the whole way. It's handy for linking cities.

When a settler stands in one of your cities, press B to have it join the city, which grows by one citizen. It works for cities smaller than {joinCityMaxSize} citizens that can still grow. It's useful when you have more settlers than you need.

A polluted tile gives half. A settler cleans it with V in {pollutionCleanTurns} turns.

Found new cities a few tiles apart. Cities must not touch, and each wants plenty of fields around it.`,
  },
  "how-government": {
    title: "Which government to choose",
    icon: "🏛️",
    text: `The game starts in despotism. It takes a shield, food or trade away from tiles that give more than two. That's why it pays to discover monarchy as soon as you can.

Monarchy removes that penalty and lowers corruption. A republic and a democracy add trade and so science, but soldiers outside your own cities make citizens unhappy there. Communism has the same small corruption everywhere. Each government gives celebrating cities a different reward.

Democracy cannot stand long riots. When a city has been rioting two turns running, the government may fall and the empire drops into anarchy.

Changing government starts with a revolution. Then come {anarchyTurns} turns of anarchy, when no taxes are collected and no research happens. All trade goes to luxuries. With the pyramids the government changes at once and you can pick any one, even one you have not discovered yet.`,
  },
  "how-wonders": {
    title: "How to build wonders of the world",
    icon: "🏆",
    text: `Only one empire can have each wonder. Whoever finishes it first owns it, and the others lose their shields or move them to another build.

Wonders are expensive, but their effect is often strong. Some work only in their own city, others in all your cities. Some stop working once you discover a certain technology.

Build wonders in cities with high production. Caravans from other cities can add shields to a wonder. Buying a wonder costs double compared to an ordinary build.`,
  },
  "how-corruption": {
    title: "How to fight corruption and pollution",
    icon: "🏭",
    text: `The farther a city is from the palace, the more trade it loses to corruption. It's {corruptionPerTile} % for every tile of distance, at most {corruptionMaxPct} %. A courthouse cuts corruption. The capital has none.

Big industry and many citizens dirty the land around. Up to {pollutionFree} points of pollution nothing happens. Every point above that adds {pollutionPctPerPoint} % chance that the city pollutes one tile around it this turn. A polluted tile gives half its food, shields and trade until a settler cleans it.

When too much pollution stays in the world, the global warming counter at the top fills up. When it reaches 100 %, the land changes. Swamps and jungles appear by the sea, and inland grassland, plains and forests turn into desert.

Hydro and nuclear plants, recycling centres and mass transit reduce pollution. A nuclear plant in a rioting city can melt down, though, kill half the citizens and pollute the land around. That danger lasts until you discover fusion power.`,
  },
  "how-combat": {
    title: "How to fight",
    icon: "⚔️",
    text: `To attack an enemy, send a military unit at it from a neighbouring tile. Before the fight the game shows the strength of both units and the chance of winning, and you decide whether to attack. An attack costs one move and the attacker stays on its tile.

A fight runs in rounds. In each round the attacker wins with a chance of attack divided by the sum of attack and defence. The loser loses as many hit points as the winner has firepower. Whoever loses all hit points first falls. That is why a stronger unit wins far more surely than a single roll of the dice would suggest.

Terrain helps the defender. Hills double the defence, mountains triple it, and forest, jungle, swamp and river add a quarter. A fortified unit and a unit in a city defend {fortifiedPct}% better, in a fortress {fortressPct}% better. Walls add {wallsPct}% against land units, and a coastal fortress doubles the defence against ships.

When a defender falls in the open, every unit on its tile falls with it. In a city or a fortress only the defender falls. The winner becomes a veteran with a {veteranChancePct}% chance and then attacks and defends {veteranPct}% better. Units from a city with barracks are veterans straight away.

A wounded unit fights with the hit points it has left. When it stands still for a whole turn, it heals by {healFieldPct}% in the field, by {healCityPct}% in its own city and completely in a city with barracks.

Your military unit can walk into a city without defenders and take it. The city loses one citizen, each building is lost with a {captureBuildingLossPct}% chance, and wonders stay. You get part of the defeated empire's gold and one of its technologies. A city with a single citizen is destroyed when taken. Whoever loses their last city is out of the game.`,
  },
  "how-disasters": {
    title: "How to protect cities from disasters",
    icon: "🌋",
    text: `From turn {disasterStart}, every turn there is a small chance that a disaster strikes one of your cities. The right building prevents it, and the game tells you it protected the city.

A fire destroys a building and a plague kills some of the citizens. An aqueduct protects against both, and the discovery of medicine against plague too. A famine empties the granary and takes citizens; a granary protects against it.

Cities by a river are threatened by floods, which city walls stop. Coastal cities are raided by pirates, who take the stores and the production in progress; barracks drive them off. Cities by mountains are threatened by volcanoes and a temple protects them.

An earthquake in cities by hills knocks down a building and nothing helps against it. Disasters never destroy wonders or the palace.`,
  },
  "how-space": {
    title: "How to win",
    icon: "🚀",
    text: `The game lasts {maxTurns} turns. For now you win when your spaceship lands at a distant star first. Conquering rivals and winning on score will come with combat in phase 3.

Spaceship parts are built in cities like buildings, but only after the Apollo Programme. Structures, at most {maxStructural}, hold the engines and modules. Engines shorten the flight, and each module adds {successPerModule} % to the chance of a safe landing. The ship launches from your capital.

Build parts in several cities at once and send the ship off when it has at least three modules. Then landing is almost certain.`,
  },
  "how-tips": {
    title: "Tips for growing fast",
    icon: "💡",
    text: `Found many cities early. Five cities after twenty turns give more than one big city.

Build settlers in cities with plenty of food, and soldiers and wonders in cities with plenty of shields.

Improve the land around your cities. Irrigated grassland and roads around a city turn a small city into a big one.

Discover monarchy early and a republic later. Libraries and marketplaces pay off in cities with a lot of trade.

Watch the mood. Before a city grows beyond {contentBase} citizens, give it a temple or a soldier.

When you have plenty of gold, buy settlers and libraries. Gold in the treasury brings nothing by itself.

The advisor in the top left tells you what matters most right now.`,
  },
};
