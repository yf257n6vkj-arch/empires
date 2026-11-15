import type { GuideKey, GuidePage } from "../guidePages";

/** English "How to play" pages, same keys and placeholders as GUIDE_PAGES. */
export const EN_GUIDE: Record<GuideKey, GuidePage> = {
  "how-start": {
    title: "How to start",
    icon: "🏕️",
    text: `You begin with a settler and a warrior. Find a good spot with the settler and found your capital there with the B key. A tile by a river or the sea works well, with plenty of grassland and plains around and a bit of forest or hills. Grassland and plains give food, forest and hills give shields for production.

Don't wait too long. Every turn without a city is a turn lost. Keep the warrior in the city to guard it, or explore the area with it for a few turns.

In your first city, build a warrior for defence first and then a settler. A settler takes one citizen from the city, but it founds a new city, and that soon pays back. More cities mean more food, production and science.

Choose what your scholars research right at the start. If you don't know, begin with Pottery, Bronze Working or Burial Rites, which unlocks the temple.`,
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
    text: `The first {contentBase} citizens of every city are content. Every one after that is unhappy. When a city has more unhappy than content citizens, riots break out and the city produces and earns nothing for the whole turn.

A temple calms {templeContent} unhappy citizens. An amphitheatre and a cathedral calm even more. Some wonders of the world calm citizens in all your cities.

Under despotism, monarchy and communism, every soldier in a city calms one unhappy citizen, at most {martialLawMax} soldiers per city. In a republic or a democracy that doesn't work. There, soldiers outside your own cities make people unhappy instead.

The Luxuries slider at the top sends part of your trade to luxuries. Every {luxuryPerContent} luxury points in a city turn one unhappy citizen content. A marketplace makes luxuries bigger. When many cities are close to riots at once, luxuries help fastest.

The last option is entertainers. Click a worked tile in the city and the citizen leaves the field to entertain the others. An entertainer produces nothing but keeps the city calm. The game adds entertainers by itself when riots threaten.`,
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

Science moves research forward. Taxes pay building upkeep and can be saved for buying. Luxuries make citizens content.

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
    text: `A settler founds cities and improves the land. A road speeds up movement and adds trade on plains, grassland and desert. Irrigation adds food. A mine adds shields on hills and mountains. A railroad adds more shields, and moving along it costs nothing.

Press A to let a settler work on his own. He will improve the tiles around your cities, first the ones your citizens work.

Press K and click a target, and the settler builds a road along the whole route. It is handy for linking cities.

Found new cities with a few free tiles between them. Cities must not touch, and each one wants enough fields around it.`,
  },
  "how-government": {
    title: "Which government to choose",
    icon: "🏛️",
    text: `The game starts in despotism. It takes away a shield, food or trade on tiles that give more than two. That is why it pays to discover monarchy as soon as you can.

Monarchy removes that penalty and lowers corruption. A republic and a democracy add trade and with it science, but soldiers outside your own cities make citizens unhappy. Communism has the same small corruption everywhere.

Changing government starts with a revolution. Then come {anarchyTurns} turns of anarchy, when no taxes are collected and no research happens. All trade goes to luxuries. With the pyramids, a revolution lasts just one turn.`,
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
    text: `The further a city is from the palace, the more trade it loses to corruption. Each tile of distance costs {corruptionPerTile} %, at most {corruptionMaxPct} %. A courthouse reduces corruption. The capital has none.

Large production and many citizens dirty the air. A city doesn't notice up to {pollutionFree} points of pollution. Above that limit, citizens become unhappy. Hydro and nuclear power plants, recycling centres and public transport reduce pollution.`,
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
