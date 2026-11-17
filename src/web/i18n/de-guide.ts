import type { GuideKey, GuidePage } from "../guidePages";

/** German "How to play" pages, same keys and placeholders as GUIDE_PAGES. */
export const DE_GUIDE: Record<GuideKey, GuidePage> = {
  "how-start": {
    title: "So fängst du an",
    icon: "🏕️",
    text: `Du beginnst mit einem Siedler und einem Krieger. Suche mit dem Siedler einen guten Platz und gründe dort mit der Taste B deine Hauptstadt. Gut eignet sich ein Feld an einem Fluss oder am Meer, mit vielen Wiesen und Ebenen ringsum und etwas Wald oder Hügeln. Wiesen und Ebenen geben Nahrung, Wald und Hügel Schilde für die Produktion.

Warte nicht zu lange. Jede Runde ohne Stadt ist eine verlorene Runde. Lass den Krieger als Wache in der Stadt oder erkunde mit ihm ein paar Runden lang die Umgebung.

Baue in deiner ersten Stadt zuerst einen Krieger zur Verteidigung und dann einen Siedler. Ein Siedler nimmt der Stadt einen Bewohner, gründet aber eine neue Stadt, und das zahlt sich bald aus. Mehr Städte bedeuten mehr Nahrung, Produktion und Wissenschaft.

Wähle gleich zu Beginn, was deine Gelehrten erforschen. Wenn du es nicht weißt, fang mit Töpferei, Bronzeverarbeitung oder Bestattungsriten an, die den Tempel freischalten.

Vor einem neuen Spiel kannst du im Fenster mit den Völkern die Welt einstellen. Du wählst ihre Größe, die Zahl der Gegner und ob Inseln um den Kontinent liegen. Unter weiteren Einstellungen änderst du die Menge an Land, die Temperatur, den Niederschlag, das Alter der Welt und die Ressourcen. Auch der Kartencode trägt die Welteinstellungen, sodass jeder, der denselben Code eingibt, dieselbe Welt bekommt.`,
  },
  "how-growth": {
    title: "So lässt du Städte wachsen",
    icon: "🌾",
    text: `Jeder Bewohner isst {foodPerCitizen} Nahrung pro Runde. Was übrig bleibt, kommt in den Nahrungsspeicher der Stadt. Ist der Speicher voll, wächst die Stadt um einen Bewohner. Eine kleine Stadt braucht wenig Nahrung, jede weitere Stufe des Speichers fasst {growthFoodBase} Nahrung mehr.

Nahrung kommt vor allem von Wiesen, Ebenen, Flüssen und dem Meer. Ein Siedler kann ein Feld bewässern, damit es mehr Nahrung gibt. Bewässern kannst du nur neben Wasser: neben einem Fluss, dem Meer, einem anderen bewässerten Feld oder einer Stadt. Sonderressourcen wie Fische oder fruchtbarer Boden bringen zusätzliche Nahrung.

Eine Stadt ohne Aquädukt wächst höchstens auf {maxCitySize} Bewohner. Mit einem Aquädukt kann sie bis {aqueductSize} wachsen. Ein Kornspeicher behält nach dem Wachstum die Hälfte der Nahrung, so kommt das nächste Wachstum früher. Ein Hafen bringt Nahrung auf Meeresfeldern.

Wenn eine Stadt hungert, leert sich ihr Speicher und sie schrumpft. Öffne sie und setze Bewohner auf Felder mit Nahrung. Auch Siedler essen Nahrung aus ihrer Heimatstadt.`,
  },
  "how-happy": {
    title: "So hältst du die Bewohner zufrieden",
    icon: "😊",
    text: `Bewohner sind glücklich, zufrieden oder unzufrieden. Die ersten {contentBase} Bewohner jeder Stadt sind zufrieden, jeder weitere ist unzufrieden. Hat eine Stadt mehr Unzufriedene als Zufriedene und Glückliche zusammen, brechen Unruhen aus, und die Stadt stellt eine ganze Runde lang nichts her und verdient nichts.

Ein großes Reich ist schwerer zu halten. Bei mehr als {empireSizeBase} Städten hat jede Stadt einen Zufriedenen weniger, und noch einen weniger für je {empireSizeStep} weitere Städte.

Ein Tempel beruhigt {templeContent} Unzufriedene. Ein Amphitheater und eine Kathedrale beruhigen noch mehr. Manche Weltwunder beruhigen die Bewohner in all deinen Städten. Unter Despotismus, Monarchie und Kommunismus beruhigt jeder Soldat in einer Stadt einen Unzufriedenen, höchstens {martialLawMax} Soldaten pro Stadt. In einer Republik oder Demokratie geht das nicht, und Soldaten außerhalb der eigenen Städte machen die Leute stattdessen unzufrieden.

Der Luxus-Regler oben schickt einen Teil deines Handels in den Luxus. Je {luxuryPerContent} Luxuspunkte in einer Stadt beruhigen zuerst einen Unzufriedenen. Wenn niemand mehr unzufrieden ist, machen sie einen Zufriedenen glücklich. Ein Marktplatz vergrößert den Luxus.

Hat eine Stadt mit mindestens {celebrationMinSize} Bewohnern keinen Unzufriedenen und mindestens so viele Glückliche wie Zufriedene, feiert sie. Unter Despotismus verlieren ihre Felder dann den Abzug, unter Monarchie und Kommunismus bringen Felder mit Handel zusätzlichen Handel, und in einer Republik oder Demokratie wächst die Stadt jede Runde um einen Bewohner, solange sie Nahrung übrig hat. Feiern in einer Republik sind der schnellste Weg zu großen Städten.

Ein Bewohner, den du vom Feld abziehst, wird Spezialist. Ein Unterhalter gibt {specialistYield} Luxuspunkte. In einer Stadt mit mindestens {specialistMinSize} Bewohnern kannst du einen Spezialisten anklicken und ihn zum Steuereintreiber machen, der {specialistYield} Gold bringt, oder zum Wissenschaftler, der {specialistYield} Wissenschaftspunkte bringt. Unterhalter setzt das Spiel selbst ein, wenn Unruhen drohen.`,
  },
  "how-production": {
    title: "So stellst du mehr her",
    icon: "⚒️",
    text: `Die Schilde von den Feldern der Stadt gehen in die Produktion. Die meisten Schilde geben Wälder, Hügel und Berge. Eine Mine auf einem Hügel bringt weitere. Kohle, Pferde oder Gold auf einem Feld geben noch mehr.

Eine Stadt kann bis zu {queueLength} Bauvorhaben hintereinander planen. Mit + neben einem Bauvorhaben nimmst du es in den Plan, mit den Pfeilen oder durch Ziehen änderst du die Reihenfolge. Wenn die Stadt eine Sache fertig hat, beginnt sie von selbst mit der nächsten.

Mit Gold kaufst du Produktion sofort. Am teuersten ist der Kauf, wenn die Stadt noch nichts hergestellt hat, den Rest aufzustocken ist billiger. Weltwunder kosten das Doppelte.

Eine Fabrik bringt die Hälfte mehr Schilde und ein Kraftwerk ein weiteres Viertel. Jede Einheit über der Zahl, die die Stadt kostenlos unterhält, kostet einen Schild pro Runde. Wenn es nichts zu bauen gibt, wähle Gold verdienen, und die Schilde werden zu Gold.`,
  },
  "how-trade": {
    title: "So teilst du den Handel auf Wissenschaft, Steuern und Luxus auf",
    icon: "⚖️",
    text: `Handel kommt von Flüssen, Meeren, Ozeanen und Straßen auf Ebenen, Wiesen und Wüste. Der Handel jeder Stadt teilt sich in drei Teile: Wissenschaft, Steuern und Luxus. Die Regler Wissenschaft und Luxus oben bestimmen, wie viel in die Wissenschaft und in den Luxus geht. Die Steuern bekommen den Rest.

Wissenschaft bringt die Forschung voran. Steuern bezahlen den Unterhalt der Gebäude und lassen sich für Käufe sparen. Luxus macht die Bewohner zufrieden und glücklich.

Deine Regierung bestimmt, wie viel du höchstens in einen Teil stecken darfst. Unter Despotismus sind es {despotismMax} %, unter Demokratie bis zu {democracyMax} %. Die Regler bewegen sich in Schritten von {rateStep} %.

Bibliotheken, Universitäten und Forschungszentren bringen Wissenschaft. Marktplätze und Banken bringen Steuern und Luxus. Eine Karawane kann einen Handelsweg zu einer entfernten Stadt eröffnen, mindestens {tradeRouteMinDistance} Felder weit, der dann jede Runde Handel bringt.`,
  },
  "how-research": {
    title: "So forschst du schnell",
    icon: "🔬",
    text: `Jede Entdeckung kostet mehr als die vorige. Die Wissenschaft aller deiner Städte addiert sich, also forschen mehr Städte schneller.

Klicke im Technologiebaum auf eine ferne Technologie und setze sie als Ziel. Das Spiel wählt dann selbst die Entdeckungen, die dorthin führen.

Baue Bibliotheken in Städten mit viel Handel. Am meisten haben Städte an Flüssen und am Meer. Republik und Demokratie bringen mehr Handel auf jedem Feld, das schon welchen hat.

Die Halle der Gelehrten bringt Wissenschaft in all deinen Städten, und die Große Sternwarte verdoppelt die Wissenschaft in ihrer eigenen Stadt. Die Bibliothek von Alexandria gibt dir jede Technologie, die mindestens zwei andere Reiche kennen. Am Ende des Baums wartet das Raumschiff.`,
  },
  "how-settlers": {
    title: "So arbeiten Siedler",
    icon: "⛏️",
    text: `Siedler gründen Städte und verbessern das Land. Eine Straße beschleunigt die Bewegung und bringt auf Ebenen, Wiesen und Wüste Handel. Bewässerung bringt Nahrung. Eine Mine bringt Schilde auf Hügeln und Bergen. Eine Eisenbahn bringt weitere Schilde, und die Bewegung darauf kostet nichts.

Siedler können auch das Gelände verändern. Bewässerung rodet einen Wald zu einer Ebene und legt Dschungel oder Sumpf zu einer Wiese trocken. Eine Mine macht das Gegenteil und pflanzt Wald auf Wiese, Ebene, Dschungel oder Sumpf. Für eine Geländeänderung braucht man kein Wasser, sie dauert aber länger als gewöhnliche Arbeit.

Mit A lässt du einen Siedler selbstständig arbeiten. Er verbessert die Felder um deine Städte, zuerst die bewirtschafteten, und beseitigt auch Verschmutzung. Mit K und einem Klick auf ein Ziel baut der Siedler eine Straße entlang der ganzen Strecke. Das ist praktisch, um Städte zu verbinden.

Steht ein Siedler in einer deiner Städte, schließt er sich mit B der Stadt an, und sie wächst um einen Bewohner. Das geht bei Städten mit weniger als {joinCityMaxSize} Bewohnern, die noch wachsen können. Es hilft, wenn du mehr Siedler hast, als du brauchst.

Ein verschmutztes Feld bringt die Hälfte. Ein Siedler säubert es mit V in {pollutionCleanTurns} Runden.

Gründe neue Städte ein paar Felder voneinander entfernt. Städte dürfen sich nicht berühren, und jede braucht genug Felder ringsum.`,
  },
  "how-government": {
    title: "Welche Regierung du wählen solltest",
    icon: "🏛️",
    text: `Das Spiel beginnt im Despotismus. Er nimmt Feldern, die mehr als zwei geben, einen Schild, eine Nahrung oder einen Handel weg. Darum lohnt es sich, die Monarchie so früh wie möglich zu entdecken.

Die Monarchie hebt diesen Abzug auf und senkt die Korruption. Republik und Demokratie bringen mehr Handel und damit Wissenschaft, aber Soldaten außerhalb der eigenen Städte machen die Bewohner dort unzufrieden. Der Kommunismus hat überall die gleiche geringe Korruption. Jede Regierung belohnt feiernde Städte anders.

Die Demokratie verträgt keine langen Unruhen. Wenn sich eine Stadt zwei Runden hintereinander auflehnt, kann die Regierung stürzen, und das Reich fällt in Anarchie.

Ein Regierungswechsel beginnt mit einer Revolution. Dann folgen {anarchyTurns} Runden Anarchie, in denen keine Steuern eingenommen werden und nicht geforscht wird. Aller Handel geht in den Luxus. Mit den Pyramiden wechselt die Regierung sofort, und du kannst jede wählen, auch eine, die du noch nicht entdeckt hast.`,
  },
  "how-wonders": {
    title: "So baust du Weltwunder",
    icon: "🏆",
    text: `Jedes Weltwunder kann nur ein Reich haben. Wer es zuerst fertigstellt, besitzt es, und die anderen verlieren ihre Schilde oder verschieben sie auf ein anderes Bauvorhaben.

Weltwunder sind teuer, ihre Wirkung ist aber oft stark. Manche wirken nur in ihrer eigenen Stadt, andere in all deinen Städten. Manche wirken nicht mehr, sobald du eine bestimmte Technologie entdeckst.

Baue Weltwunder in Städten mit hoher Produktion. Karawanen aus anderen Städten können Schilde zu einem Weltwunder beitragen. Ein Weltwunder zu kaufen kostet das Doppelte eines gewöhnlichen Bauvorhabens.`,
  },
  "how-corruption": {
    title: "So bekämpfst du Korruption und Verschmutzung",
    icon: "🏭",
    text: `Je weiter eine Stadt vom Palast entfernt ist, desto mehr Handel verliert sie an die Korruption. Es sind {corruptionPerTile} % pro Feld Entfernung, höchstens {corruptionMaxPct} %. Ein Gericht senkt die Korruption. Die Hauptstadt hat keine.

Große Industrie und viele Bewohner verschmutzen die Umgebung. Bis {pollutionFree} Verschmutzungspunkte passiert nichts. Jeder Punkt darüber bringt {pollutionPctPerPoint} % Chance, dass die Stadt in dieser Runde ein Feld in der Umgebung verschmutzt. Ein verschmutztes Feld gibt die Hälfte an Nahrung, Schilden und Handel, bis ein Siedler es säubert.

Wenn zu viel Verschmutzung in der Welt bleibt, füllt sich oben der Zähler der Erderwärmung. Erreicht er 100 %, verändert sich das Land. Am Meer entstehen Sümpfe und Dschungel, und im Landesinneren werden Wiesen, Ebenen und Wälder zu Wüste.

Wasser- und Atomkraftwerke, Recyclingzentren und öffentlicher Nahverkehr senken die Verschmutzung. Ein Atomkraftwerk in einer Stadt mit Unruhen kann aber schmelzen, die Hälfte der Bewohner töten und die Umgebung verschmutzen. Diese Gefahr besteht, bis du die Kernfusion entdeckst.`,
  },
  "how-combat": {
    title: "So kämpfst du",
    icon: "⚔️",
    text: `Um einen Feind anzugreifen, schickst du eine militärische Einheit von einem Nachbarfeld aus auf ihn. Vor dem Kampf zeigt das Spiel die Stärke beider Einheiten und die Siegchance, und du entscheidest, ob du angreifst. Ein Angriff kostet eine Bewegung, und der Angreifer bleibt auf seinem Feld.

Ein Kampf läuft in Runden. In jeder Runde gewinnt der Angreifer mit einer Chance von Angriff geteilt durch die Summe aus Angriff und Verteidigung. Der Verlierer verliert so viele Lebenspunkte, wie der Sieger Feuerkraft hat. Wer zuerst alle Lebenspunkte verliert, fällt. Darum gewinnt eine stärkere Einheit viel sicherer, als ein einzelner Würfelwurf vermuten ließe.

Das Gelände hilft dem Verteidiger. Hügel verdoppeln die Verteidigung, Berge verdreifachen sie, und Wald, Dschungel, Sumpf und Fluss bringen ein Viertel dazu. Eine befestigte Einheit und eine Einheit in einer Stadt verteidigen sich um {fortifiedPct} % besser, in einer Festung um {fortressPct} % besser. Mauern bringen {wallsPct} % gegen Landeinheiten, und eine Küstenfestung verdoppelt die Verteidigung gegen Schiffe.

Fällt ein Verteidiger im offenen Gelände, fallen alle Einheiten auf seinem Feld mit ihm. In einer Stadt oder Festung fällt nur der Verteidiger. Der Sieger wird mit {veteranChancePct} % Chance Veteran und greift dann um {veteranPct} % besser an und verteidigt sich besser. Einheiten aus einer Stadt mit Kaserne sind sofort Veteranen.

Eine verwundete Einheit kämpft mit den Lebenspunkten, die ihr bleiben. Steht sie eine ganze Runde still, heilt sie im Feld um {healFieldPct} %, in der eigenen Stadt um {healCityPct} % und in einer Stadt mit Kaserne vollständig.

Deine militärische Einheit kann in eine Stadt ohne Verteidiger einmarschieren und sie erobern. Die Stadt verliert einen Bewohner, jedes Gebäude geht mit {captureBuildingLossPct} % Chance verloren, und Weltwunder bleiben. Du bekommst einen Teil des Goldes des besiegten Reiches und eine seiner Technologien. Eine Stadt mit nur einem Bewohner wird bei der Eroberung zerstört. Wer seine letzte Stadt verliert, scheidet aus dem Spiel aus.

Völker lernen sich kennen, wenn ihre Einheiten oder Städte einander sehen, und leben zuerst in Frieden. Angreifen kannst du nur ein Volk, mit dem du im Krieg bist. Schickst du eine Einheit auf ein Volk, mit dem du in Frieden lebst, fragt das Spiel, ob du ihm den Krieg erklären willst. Gegner erklären von selbst den Krieg, wenn ihre Armee stärker ist, und ziehen dann als Gruppe auf die nächste Stadt. Frieden bietest du im Fenster Völker an, und der Gegner antwortet in seinem Zug. Gegner bieten selbst Frieden an, wenn der Krieg sie ermüdet oder schlecht läuft. Ein geschlossener Frieden gilt mindestens {treatyTurns} Runden, und wer ihn früher bricht, dem trauen die anderen Völker nicht mehr.

Auf der Karte liegen Ruinen alter Städte. Betritt eine deiner Landeinheiten sie, findet sie Gold, eine alte Entdeckung, Söldner oder Nomaden, die sich dir anschließen. Manchmal sind die Ruinen leer, und manchmal stürmen Barbaren heraus. Barbaren sind mit allen im Krieg. Sie tauchen in der Wildnis fern von Städten auf oder landen an einer Küste und ziehen auf die nächste Stadt. Bei wenigen Barbaren kommen sie ungefähr ab Runde 45, bei vielen schon ab Runde 25. Eine eroberte Stadt behalten sie und bauen darin weitere Barbaren, bis jemand sie zurückerobert. Wie viele es gibt, stellst du im Fenster für ein neues Spiel ein.`,
  },
  "how-disasters": {
    title: "So schützt du Städte vor Katastrophen",
    icon: "🌋",
    text: `Ab Runde {disasterStart} besteht jede Runde eine kleine Chance, dass eine Katastrophe eine deiner Städte trifft. Das richtige Gebäude verhindert sie, und das Spiel sagt dir, dass es die Stadt geschützt hat.

Ein Feuer zerstört ein Gebäude, und die Pest tötet einen Teil der Bewohner. Vor beidem schützt ein Aquädukt, vor der Pest auch die Entdeckung der Medizin. Eine Hungersnot leert den Kornspeicher und nimmt Bewohner, ein Kornspeicher schützt davor.

Städten an einem Fluss drohen Fluten, die Stadtmauern aufhalten. Küstenstädte werden von Piraten überfallen, die die Vorräte und die begonnene Produktion mitnehmen, eine Kaserne vertreibt sie. Städten an Bergen drohen Vulkane, und ein Tempel schützt sie.

Ein Erdbeben in Städten an Hügeln reißt ein Gebäude ein, und dagegen hilft nichts. Weltwunder und den Palast zerstören Katastrophen nie.`,
  },
  "how-space": {
    title: "So gewinnst du",
    icon: "🚀",
    text: `Das Spiel dauert {maxTurns} Runden, und es gibt drei Wege zum Sieg. Besiegst du alle Gegner, gewinnst du durch Eroberung. Landet dein Raumschiff als erstes bei einem fernen Stern, gewinnst du das Weltraumrennen. Und wenn nach der letzten Runde niemand gewonnen hat, gewinnt das Reich mit den meisten Punkten. Punkte gibt es für jeden Bewohner, einen weiteren für jeden glücklichen, {scoreTech} für jede Entdeckung und {scoreWonder} für jedes Weltwunder. Wie du gegenüber den Völkern stehst, die du kennst, zeigt die Rangliste im Menü.

Raumschiffteile werden in Städten wie Gebäude gebaut, aber erst nach dem Apollo-Programm. Tragwerke, höchstens {maxStructural}, tragen die Triebwerke und Module. Triebwerke verkürzen den Flug, und jedes Modul erhöht die Chance auf eine sichere Landung um {successPerModule} %. Das Schiff startet von deiner Hauptstadt.

Baue Teile in mehreren Städten gleichzeitig und schicke das Schiff los, wenn es mindestens drei Module hat. Dann ist die Landung fast sicher.`,
  },
  "how-tips": {
    title: "Tipps für schnelles Wachstum",
    icon: "💡",
    text: `Gründe früh viele Städte. Fünf Städte nach zwanzig Runden bringen mehr als eine große Stadt.

Baue Siedler in Städten mit viel Nahrung, Soldaten und Weltwunder in Städten mit vielen Schilden.

Verbessere das Land um deine Städte. Bewässerte Wiesen und Straßen rund um eine Stadt machen aus einer kleinen Stadt eine große.

Entdecke früh die Monarchie und später die Republik. Bibliotheken und Marktplätze lohnen sich in Städten mit viel Handel.

Achte auf die Stimmung. Bevor eine Stadt über {contentBase} Bewohner wächst, gib ihr einen Tempel oder einen Soldaten.

Wenn du viel Gold hast, kaufe Siedler und Bibliotheken. Gold in der Schatzkammer bringt von selbst nichts.

Der Berater oben links sagt dir, was gerade am wichtigsten ist.`,
  },
};
