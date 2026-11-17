import type { GuideKey, GuidePage } from "../guidePages";

/** French "How to play" pages, same keys and placeholders as GUIDE_PAGES. */
export const FR_GUIDE: Record<GuideKey, GuidePage> = {
  "how-start": {
    title: "Pour commencer",
    icon: "🏕️",
    text: `Tu commences avec un colon et un guerrier. Trouve un bon endroit avec le colon et fondes-y ta capitale avec la touche B. Une case près d'une rivière ou de la mer convient bien, avec beaucoup de prairies et de plaines autour et un peu de forêt ou de collines. Les prairies et les plaines donnent de la nourriture, la forêt et les collines des boucliers pour la production.

N'attends pas trop. Chaque tour sans ville est un tour perdu. Garde le guerrier dans la ville pour la protéger, ou explore les environs avec lui pendant quelques tours.

Dans ta première ville, construis d'abord un guerrier pour la défense, puis un colon. Un colon retire un habitant à la ville, mais il fonde une nouvelle ville, et cela rapporte vite. Plus de villes, c'est plus de nourriture, de production et de science.

Choisis tout de suite ce que tes érudits vont rechercher. Si tu ne sais pas, commence par la Poterie, le Travail du bronze ou les Rites funéraires, qui débloquent le temple.

Avant une nouvelle partie, tu peux régler le monde dans la fenêtre des peuples. Tu choisis sa taille, le nombre de rivaux et si des îles entourent le continent. Dans les autres réglages, tu changes la quantité de terres, la température, les précipitations, l'âge du monde et les ressources. Le code de carte porte aussi les réglages du monde, donc quiconque saisit le même code obtient le même monde.`,
  },
  "how-growth": {
    title: "Pour faire grandir les villes",
    icon: "🌾",
    text: `Chaque habitant mange {foodPerCitizen} nourriture par tour. Ce qui reste va dans la réserve de la ville. Quand la réserve est pleine, la ville gagne un habitant. Une petite ville a besoin de peu de nourriture, chaque palier suivant de la réserve contient {growthFoodBase} nourriture de plus.

La nourriture vient surtout des prairies, des plaines, des rivières et de la mer. Un colon peut irriguer une case pour qu'elle donne plus de nourriture. On ne peut irriguer qu'à côté de l'eau : près d'une rivière, de la mer, d'une autre case irriguée ou d'une ville. Des ressources spéciales comme les poissons ou la terre fertile ajoutent de la nourriture.

Une ville sans aqueduc grandit jusqu'à {maxCitySize} habitants au plus. Un aqueduc lui permet de grandir jusqu'à {aqueductSize}. Un grenier garde la moitié de la nourriture après la croissance, ainsi la croissance suivante arrive plus tôt. Un port ajoute de la nourriture sur les cases de mer.

Quand une ville a faim, sa réserve se vide et la ville rétrécit. Ouvre-la et place les habitants sur des cases avec de la nourriture. Les colons mangent aussi la nourriture de leur ville d'origine.`,
  },
  "how-happy": {
    title: "Pour garder les habitants contents",
    icon: "😊",
    text: `Les habitants sont heureux, contents ou mécontents. Les {contentBase} premiers habitants de chaque ville sont contents et chacun des suivants est mécontent. Quand une ville a plus de mécontents que de contents et d'heureux réunis, des émeutes éclatent et la ville ne produit ni ne gagne rien pendant tout le tour.

Un grand empire est plus difficile à tenir. Au-delà de {empireSizeBase} villes, chaque ville a un content de moins, et encore un de moins pour chaque tranche de {empireSizeStep} villes supplémentaires.

Un temple calme {templeContent} mécontents. Un amphithéâtre et une cathédrale en calment encore plus. Certaines merveilles du monde calment les habitants de toutes tes villes. Sous le despotisme, la monarchie et le communisme, chaque soldat dans une ville calme un mécontent, au plus {martialLawMax} soldats par ville. En république ou en démocratie, cela ne marche pas, et les soldats hors de tes villes rendent au contraire les gens mécontents.

Le curseur Luxe en haut envoie une partie de ton commerce au luxe. Chaque fois {luxuryPerContent} points de luxe dans une ville calment d'abord un mécontent. Quand il n'y a plus de mécontents, ils rendent un content heureux. Un marché augmente le luxe.

Quand une ville d'au moins {celebrationMinSize} habitants n'a aucun mécontent et au moins autant d'heureux que de contents, elle fait la fête. Sous le despotisme, ses cases perdent alors leur pénalité, sous la monarchie et le communisme les cases avec du commerce en donnent davantage, et en république ou en démocratie la ville gagne un habitant à chaque tour tant qu'elle a de la nourriture en trop. Les fêtes en république sont le chemin le plus rapide vers de grandes villes.

Un habitant que tu retires des champs devient un spécialiste. Un artiste donne {specialistYield} points de luxe. Dans une ville d'au moins {specialistMinSize} habitants, tu peux cliquer sur un spécialiste pour en faire un percepteur, qui apporte {specialistYield} or, ou un savant, qui apporte {specialistYield} points de science. Le jeu ajoute lui-même des artistes quand des émeutes menacent.`,
  },
  "how-production": {
    title: "Pour produire davantage",
    icon: "⚒️",
    text: `Les boucliers des cases de la ville vont à la production. Les forêts, les collines et les montagnes donnent le plus de boucliers. Une mine sur une colline en ajoute. Du charbon, des chevaux ou de l'or sur une case en donnent encore plus.

Une ville peut prévoir jusqu'à {queueLength} constructions à la suite. Le bouton + à côté d'une construction l'ajoute au plan, les flèches ou le glisser-déposer changent l'ordre. Quand la ville a fini une chose, elle commence la suivante d'elle-même.

L'or achète la production tout de suite. L'achat coûte le plus cher quand la ville n'a encore rien produit, compléter le reste est moins cher. Les merveilles du monde coûtent le double.

Une usine ajoute la moitié des boucliers et une centrale un quart de plus. Chaque unité au-delà de celles que la ville entretient gratuitement coûte un bouclier par tour. Quand il n'y a rien à construire, choisis Gagner de l'or et les boucliers se changent en or.`,
  },
  "how-trade": {
    title: "Pour partager le commerce entre science, impôts et luxe",
    icon: "⚖️",
    text: `Le commerce vient des rivières, des mers, des océans et des routes sur les plaines, les prairies et le désert. Le commerce de chaque ville se divise en trois parts : science, impôts et luxe. Les curseurs Science et Luxe en haut fixent ce qui va à la science et au luxe. Les impôts reçoivent le reste.

La science fait avancer la recherche. Les impôts paient l'entretien des bâtiments et peuvent être épargnés pour des achats. Le luxe rend les habitants contents et heureux.

Ton gouvernement fixe le maximum que tu peux mettre dans une part. Sous le despotisme, c'est {despotismMax} %, en démocratie jusqu'à {democracyMax} %. Les curseurs avancent par pas de {rateStep} %.

Les bibliothèques, les universités et les centres de recherche ajoutent de la science. Les marchés et les banques ajoutent des impôts et du luxe. Une caravane peut ouvrir une route commerciale vers une ville éloignée, à au moins {tradeRouteMinDistance} cases, qui rapporte ensuite du commerce à chaque tour.`,
  },
  "how-research": {
    title: "Pour chercher vite",
    icon: "🔬",
    text: `Chaque découverte coûte plus que la précédente. La science de toutes tes villes s'additionne, donc plus de villes cherchent plus vite.

Dans l'arbre des technologies, clique sur une technologie lointaine et choisis-la comme objectif. Le jeu choisit alors lui-même les découvertes qui y mènent.

Construis des bibliothèques dans les villes qui ont beaucoup de commerce. Les villes près des rivières et de la mer en ont le plus. La république et la démocratie donnent plus de commerce sur chaque case qui en a déjà.

La Salle des savants ajoute de la science dans toutes tes villes, et le Grand observatoire double la science dans sa propre ville. La Bibliothèque d'Alexandrie te donne chaque technologie qu'au moins deux autres empires connaissent. Au bout de l'arbre attend le vaisseau spatial.`,
  },
  "how-settlers": {
    title: "Comment travaillent les colons",
    icon: "⛏️",
    text: `Les colons fondent des villes et aménagent les terres. Une route accélère les déplacements et ajoute du commerce sur les plaines, les prairies et le désert. L'irrigation ajoute de la nourriture. Une mine ajoute des boucliers sur les collines et les montagnes. Un chemin de fer ajoute encore des boucliers et s'y déplacer ne coûte rien.

Les colons peuvent aussi changer le terrain. L'irrigation défriche une forêt en plaine et assèche une jungle ou un marais en prairie. Une mine fait l'inverse et plante une forêt sur une prairie, une plaine, une jungle ou un marais. Changer le terrain ne demande pas d'eau, mais prend plus de temps qu'un travail ordinaire.

Appuie sur A pour laisser un colon travailler seul. Il aménage les cases autour de tes villes, d'abord celles qui sont exploitées, et nettoie aussi la pollution. Appuie sur K et clique sur une cible pour que le colon construise une route sur tout le trajet. C'est pratique pour relier les villes.

Quand un colon se trouve dans une de tes villes, appuie sur B pour qu'il rejoigne la ville, qui gagne un habitant. Cela marche pour les villes de moins de {joinCityMaxSize} habitants qui peuvent encore grandir. C'est utile quand tu as plus de colons que nécessaire.

Une case polluée donne la moitié. Un colon la nettoie avec V en {pollutionCleanTurns} tours.

Fonde les nouvelles villes à quelques cases les unes des autres. Les villes ne doivent pas se toucher, et chacune veut assez de champs autour d'elle.`,
  },
  "how-government": {
    title: "Quel gouvernement choisir",
    icon: "🏛️",
    text: `La partie commence sous le despotisme. Il retire un bouclier, une nourriture ou un commerce aux cases qui en donnent plus de deux. C'est pourquoi il vaut la peine de découvrir la monarchie dès que possible.

La monarchie supprime cette pénalité et réduit la corruption. La république et la démocratie ajoutent du commerce et donc de la science, mais les soldats hors de tes villes y rendent les habitants mécontents. Le communisme a partout la même faible corruption. Chaque gouvernement récompense différemment les villes en fête.

La démocratie ne supporte pas les longues émeutes. Quand une ville se révolte deux tours de suite, le gouvernement peut tomber et l'empire sombre dans l'anarchie.

Changer de gouvernement commence par une révolution. Viennent ensuite {anarchyTurns} tours d'anarchie, pendant lesquels on ne perçoit pas d'impôts et on ne fait pas de recherche. Tout le commerce va au luxe. Avec les pyramides, le gouvernement change tout de suite et tu peux choisir n'importe lequel, même un que tu n'as pas encore découvert.`,
  },
  "how-wonders": {
    title: "Pour construire des merveilles du monde",
    icon: "🏆",
    text: `Chaque merveille ne peut appartenir qu'à un seul empire. Celui qui la termine le premier la possède, et les autres perdent leurs boucliers ou les reportent sur une autre construction.

Les merveilles sont chères, mais leur effet est souvent fort. Certaines n'agissent que dans leur propre ville, d'autres dans toutes tes villes. Certaines cessent d'agir quand tu découvres une technologie donnée.

Construis les merveilles dans les villes à forte production. Des caravanes venues d'autres villes peuvent ajouter des boucliers à une merveille. Acheter une merveille coûte le double d'une construction ordinaire.`,
  },
  "how-corruption": {
    title: "Pour lutter contre la corruption et la pollution",
    icon: "🏭",
    text: `Plus une ville est loin du palais, plus elle perd de commerce à cause de la corruption. C'est {corruptionPerTile} % par case de distance, au plus {corruptionMaxPct} %. Un tribunal réduit la corruption. La capitale n'en a pas.

La grande industrie et beaucoup d'habitants salissent les alentours. Jusqu'à {pollutionFree} points de pollution, il ne se passe rien. Chaque point au-dessus ajoute {pollutionPctPerPoint} % de risque que la ville pollue une case voisine ce tour-ci. Une case polluée donne la moitié de sa nourriture, de ses boucliers et de son commerce jusqu'à ce qu'un colon la nettoie.

Quand trop de pollution reste dans le monde, le compteur du réchauffement climatique se remplit en haut. Quand il atteint 100 %, le paysage change. Des marais et des jungles apparaissent près de la mer, et à l'intérieur des terres les prairies, les plaines et les forêts deviennent du désert.

Les centrales hydroélectriques et nucléaires, les centres de recyclage et les transports publics réduisent la pollution. Mais une centrale nucléaire dans une ville en émeute peut fondre, tuer la moitié des habitants et polluer les alentours. Ce danger dure jusqu'à ce que tu découvres la fusion nucléaire.`,
  },
  "how-combat": {
    title: "Pour combattre",
    icon: "⚔️",
    text: `Pour attaquer un ennemi, envoie sur lui une unité militaire depuis une case voisine. Avant le combat, le jeu montre la force des deux unités et les chances de gagner, et tu décides si tu attaques. Une attaque coûte un mouvement et l'attaquant reste sur sa case.

Un combat se déroule en manches. À chaque manche, l'attaquant gagne avec une chance égale à l'attaque divisée par la somme de l'attaque et de la défense. Le perdant perd autant de points de vie que le vainqueur a de puissance de feu. Le premier qui perd tous ses points de vie tombe. C'est pourquoi une unité plus forte gagne bien plus sûrement qu'un seul lancer de dé ne le laisserait penser.

Le terrain aide le défenseur. Les collines doublent la défense, les montagnes la triplent, et la forêt, la jungle, le marais et la rivière ajoutent un quart. Une unité fortifiée et une unité en ville se défendent {fortifiedPct} % mieux, dans une forteresse {fortressPct} % mieux. Les remparts ajoutent {wallsPct} % contre les unités terrestres, et une forteresse côtière double la défense contre les navires.

Quand un défenseur tombe en terrain découvert, toutes les unités de sa case tombent avec lui. Dans une ville ou une forteresse, seul le défenseur tombe. Le vainqueur devient vétéran avec {veteranChancePct} % de chances et attaque et se défend alors {veteranPct} % mieux. Les unités d'une ville avec une caserne sont vétérans tout de suite.

Une unité blessée combat avec les points de vie qui lui restent. Quand elle reste immobile tout un tour, elle guérit de {healFieldPct} % en campagne, de {healCityPct} % dans ta ville et entièrement dans une ville avec une caserne.

Ton unité militaire peut entrer dans une ville sans défenseurs et la prendre. La ville perd un habitant, chaque bâtiment est perdu avec {captureBuildingLossPct} % de chances et les merveilles restent. Tu reçois une partie de l'or de l'empire vaincu et une de ses technologies. Une ville d'un seul habitant est détruite quand on la prend. Celui qui perd sa dernière ville est éliminé.

Les peuples se rencontrent quand leurs unités ou leurs villes se voient, et vivent d'abord en paix. Tu ne peux attaquer qu'un peuple avec lequel tu es en guerre. Quand tu envoies une unité sur un peuple avec lequel tu vis en paix, le jeu te demande si tu veux lui déclarer la guerre. Les rivaux déclarent la guerre d'eux-mêmes quand leur armée est plus forte, puis marchent en groupe sur la ville la plus proche. Tu proposes la paix dans la fenêtre Peuples et le rival répond pendant son tour. Les rivaux proposent eux-mêmes la paix quand la guerre les épuise ou tourne mal. Une paix signée dure au moins {treatyTurns} tours, et celui qui la rompt plus tôt perd la confiance des autres peuples.

Des ruines d'anciennes villes parsèment la carte. Quand une de tes unités terrestres y entre, elle trouve de l'or, une ancienne découverte, des mercenaires ou des nomades qui te rejoignent. Parfois les ruines sont vides, et parfois des barbares en surgissent. Les barbares sont en guerre contre tout le monde. Ils apparaissent dans les terres sauvages loin des villes ou débarquent sur une côte et marchent sur la ville la plus proche. Avec peu de barbares, ils arrivent vers le tour 45, avec beaucoup dès le tour 25. Ils gardent une ville qu'ils prennent et y construisent d'autres barbares jusqu'à ce que quelqu'un la reprenne. Tu règles leur nombre dans la fenêtre de nouvelle partie.`,
  },
  "how-disasters": {
    title: "Pour protéger les villes des catastrophes",
    icon: "🌋",
    text: `À partir du tour {disasterStart}, il y a à chaque tour une petite chance qu'une catastrophe frappe une de tes villes. Le bon bâtiment l'empêche, et le jeu te dit qu'il a protégé la ville.

Un incendie détruit un bâtiment et la peste tue une partie des habitants. Un aqueduc protège des deux, et la découverte de la médecine protège aussi de la peste. Une famine vide le grenier et emporte des habitants, un grenier en protège.

Les villes au bord d'une rivière sont menacées d'inondations, que les remparts arrêtent. Les villes côtières sont attaquées par des pirates, qui emportent les réserves et la production en cours, une caserne les repousse. Les villes près des montagnes sont menacées par les volcans, et un temple les protège.

Un tremblement de terre dans les villes près des collines abat un bâtiment, et rien n'y fait. Les catastrophes ne détruisent jamais les merveilles ni le palais.`,
  },
  "how-space": {
    title: "Pour gagner",
    icon: "🚀",
    text: `La partie dure {maxTurns} tours et il y a trois façons de gagner. Si tu bats tous tes rivaux, tu gagnes par la conquête. Si ton vaisseau spatial se pose le premier près d'une étoile lointaine, tu gagnes la course à l'espace. Et si personne n'a gagné après le dernier tour, l'empire au meilleur score l'emporte. Le score donne un point par habitant, un autre par habitant heureux, {scoreTech} points par découverte et {scoreWonder} par merveille. Le classement dans le menu montre où tu en es face aux peuples que tu connais.

Les pièces du vaisseau spatial se construisent dans les villes comme des bâtiments, mais seulement après le programme Apollo. Les structures, au plus {maxStructural}, portent les moteurs et les modules. Les moteurs raccourcissent le vol, et chaque module ajoute {successPerModule} % aux chances d'un atterrissage réussi. Le vaisseau décolle de ta capitale.

Construis les pièces dans plusieurs villes à la fois et lance le vaisseau quand il a au moins trois modules. L'atterrissage est alors presque certain.`,
  },
  "how-tips": {
    title: "Astuces pour grandir vite",
    icon: "💡",
    text: `Fonde beaucoup de villes tôt. Cinq villes après vingt tours rapportent plus qu'une seule grande ville.

Construis les colons dans les villes riches en nourriture, les soldats et les merveilles dans les villes riches en boucliers.

Aménage les terres autour de tes villes. Des prairies irriguées et des routes autour d'une ville font d'une petite ville une grande.

Découvre tôt la monarchie et plus tard la république. Les bibliothèques et les marchés rapportent dans les villes avec beaucoup de commerce.

Surveille l'humeur. Avant qu'une ville dépasse {contentBase} habitants, donne-lui un temple ou un soldat.

Quand tu as beaucoup d'or, achète des colons et des bibliothèques. L'or dans le trésor ne rapporte rien tout seul.

Le conseiller en haut à gauche te dit ce qui compte le plus en ce moment.`,
  },
};
