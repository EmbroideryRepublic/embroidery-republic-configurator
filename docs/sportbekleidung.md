# Sportbekleidung (Stand 2026-11-18)

Auftrag des Betreibers: *„Außerdem möchte ich, dass du Sportkleidung mit auf die Seite integrierst.“*

## Was es jetzt gibt

Eine neue Produktart **`sport`** („Sportbekleidung“) mit **10 Modellen und 149 Farben** (Schwung 1), eigener Reiter im Shop und im
Konfigurator, gegliedert wie die übrige Erwachsenenware nach **Herren / Damen / Unisex** (gleiche Navigationsachse, gleiche
Konfektionsgrößen). Sportware ist **kein Teil der Kinderbekleidung** und mischt sich nicht mit T-Shirts, Longsleeves usw.: Wer „T-Shirts“
wählt, sieht weiter nur die klassischen T-Shirts; wer „Sportbekleidung“ wählt, sieht nur die Sport-Shirts.

| Marke | Modell (Artikelnummer) | Art | Farben | Ansichten |
| --- | --- | --- | ---: | --- |
| Just Cool | Cool T (JC001) | Sport-T-Shirt, Herren | 52 | vorne, hinten, Ärmel |
| Just Cool | Women´s Cool T (JC005) | Sport-T-Shirt, Damen | 25 | vorne, hinten, Ärmel |
| Just Cool | Women´s Long Sleeve Cool T (JC012) | Sport-Langarmshirt, Damen | 4 | vorne, hinten, Ärmel |
| Just Cool | Long Sleeve Active T (JC023) | Sport-Langarmshirt, Herren | 4 (von 5) | vorne, hinten, Ärmel |
| Just Cool | Lightweight Active 1/4 Zip (JC230) | Sport-Langarmshirt mit Viertelreißverschluss, Herren | 2 | vorne, hinten, Ärmel |
| Just Cool | Cool Vest (JC007) | Tanktop, Herren | 13 | vorne, hinten |
| SOL'S | Men´s Raglan Sleeves T Sporty (L198) | Sport-T-Shirt, Herren | 18 (von 19) | vorne, hinten |
| SOL'S | Women´s Raglan Sleeves T Sporty (L200) | Sport-T-Shirt, Damen | 15 (von 16) | vorne, hinten |
| SOL'S | Men´s Long Sleeve Sports T-Shirt Sporty (L02071) | Sport-Langarmshirt, Herren | 8 | vorne, hinten, Ärmel |
| B&C | Active T (BCTG003) | Sport-T-Shirt, Unisex/Herren | 8 | vorne, hinten, Ärmel |

Alle Angaben (Material, Gewicht, Größen, Maße je Größe, Passform, Farben, Preise) stammen aus den öffentlichen Produktseiten von
textil-grosshandel.eu; nichts ist geschätzt. Der Verkaufspreis folgt wie überall aus `computeBasePrice(Einkaufspreis)` – die
Preislogik wurde nicht angefasst.

## Aufnahmeregeln (wie bei der Kinderware)

1. **Vorder- UND Rückfoto je Farbe** im Flachbildstil. Die Sport-Marken des Lieferanten (PROACT, Roly Sport, TriDri, Spiro, Tee Jays,
   Stedman Sports, Henbury, Finden+Hales, CONA SPORTS, Tombo …) führen überwiegend nur EIN Foto je Farbe und bleiben draußen. Geprüft
   wurden 528 Modelle der Lieferantenrubrik „Sportbekleidung“ (T-Shirts, Langarmshirts, Poloshirts, Sweatshirts, Jacken, Tanktops,
   Trainingsanzüge); nur 33 haben Vorder- und Rückfoto, davon 17 neue Erwachsenen-Modelle ohne Jacken (ohne das schon vorhandene JC002).
   Davon sind 10 aufgenommen; Gründe für die übrigen 7 stehen unten.
2. **Maßtabelle je Größe** (Länge und Breite): ohne sie lässt sich die Druckfläche nicht maßstäblich berechnen. Deshalb fehlen die drei
   Starworld-Sport-T-Shirts SW300 / SW403 / SW375 (nur allgemeine „Internationale Größentabelle“, keine Maße je Größe).
3. **Ärmelansichten** nur, wenn mindestens 80 % der Farben ein Seitenfoto haben. SOL'S L198 (11 von 19 Farben) und L200 (1 von 16)
   haben deshalb nur Vorder- und Rückseite; bei JC023 entfällt eine Farbe ohne Seitenfoto („Charcoal (Solid)“).
4. **Keine Dubletten zum Bestand:** Daiber Men´s Active-T (JN358) und Ladies´ Active-T (JN357) tragen dieselben Artikelnummern wie die schon
   vorhandenen James+Nicholson-Modelle „Men's Active-T“ und „Ladies´ Active-T“ – eine zweite Aufnahme wäre eine Dublette (aufgefallen im
   Bilddubletten-Audit, danach wieder entfernt).
5. **Farben mit unbrauchbarem Foto entfallen:** SOL'S L200 „Black“ (das Lieferantenfoto zeigt ein helles Grau statt Schwarz), SOL'S L198 „Neon Orange“
   (dasselbe Foto wie „Orange“), Just Cool JC023 „Charcoal (Solid)“ (kein Seitenfoto, Ärmelansichten des Modells).
6. **Farbpunkt am Foto:** Weicht der Farbwert des Lieferanten stark vom Ton des Fotos ab (Neon-, Melange-, Pastelltöne; Abstand ≥ 85), zeigt der
   Farbpunkt den am Foto gemessenen Ton (10 Farben; festgeschrieben in `scripts/import/sport-farbmessung.json`).
7. **Keine Hosen, Shorts, Socken, Taschen, Handtücher:** sie haben keine bedruckbare Vorder-/Rückfläche im Sinn des Konfigurators.
8. **Keine Funktions- oder Leistungsversprechen** in den Kundentexten („atmungsaktiv“, „schnelltrocknend“ …): Die Beschreibung nennt nur
   Material, Gewicht und Größen. Das hält `sport.test.ts` fest.

## Bewusst nicht in Schwung 1 (mögliche Tranche 2)

- **Softshell-/Regen-/Trainingsjacken** mit Vorder- und Rückfoto (SOL'S L837/L838 „Race“, Daiber JN1129/JN1130/JN1000, Promodoro
  E7850/E7855, Result RT121/RT230M/RT230F, Russell Athletic Z510): Sie gehören eher in die Rubrik „Jacken“ und brauchen
  Reißverschluss-/Taschen-Sperrzonen je Modell.
- **Kinder-Sportshirts** (B&C Kids Active T BCTK004, SOL'S Kids Raglan L198K, Daiber Junior Active-T JN358K, Result Core Junior RT224J; JN358K ist wie
  JN358 ein James+Nicholson-Artikel, vorher prüfen):
  eine Frage der Kinderbekleidung (eigene Größenleitern).
- **Zu wenige Farben:** Starworld Sport-Langarm SW300LS (2 Farben), Running Vest SW301 (3 Farben).
- **Keine Maßtabelle je Größe:** Starworld SW300 / SW403 / SW375 (siehe Aufnahmeregel 2).
- **Bereits im Katalog, aber nicht unter „Sportbekleidung“:** Neutral Unisex Performance T-Shirt, Neutral Recycled Performance
  Long Sleeve, James+Nicholson Men's Active-T (JN358) und Ladies´ Active-T (JN357), Just Cool Long Sleeve Cool T (JC002), Kids´ Cool T (JC001J). Sie bleiben in ihren bisherigen
  Kategorien (Adressen und Zähler unverändert); ein späteres Umhängen wäre ein eigener, bewusster Schritt.

## Bekannte Grenzen

- **Gleiche Fotos bei Cool T und Kids´ Cool T:** Der Lieferant nutzt für Just Cool Cool T (JC001) und Kids´ Cool T (JC001J) dieselben Freisteller
  (42 Farbpaare pixelgleich). Beide Produkte zeigen deshalb dasselbe Foto; die Druckflächen werden je Produkt aus der eigenen Maßtabelle gerechnet.
  Der Audit-Befund ist in `scripts/import/dubletten-ok.json` begründet.
- **Farbpunkte:** Zehn Farbpunkte zeigen den am Foto gemessenen Ton, nicht den Farbwert des Lieferanten (siehe Aufnahmeregel 6); alle übrigen
  den Farbwert des Lieferanten wie beim restlichen Katalog.
- **SOL'S-Raglan-T-Shirts** (L198/L200) haben nur Vorder- und Rückseite: Der Lieferant führt Seitenfotos nur für 11 von 19 bzw. 1 von 16 Farben.

## Technik

- Register: `productTypes.ts` → `sport` (`naviAchse: 'geschlecht'`, `groessenLeiter: 'konfektion-eu'`, `sammelbegriff: true`).
  `sammelbegriff` sorgt dafür, dass Sätze wie „gehört zu den schwereren Modellen der Sportbekleidung“ grammatisch bleiben
  (`lib/seo/produktFakten.ts`). `kids` rückt dafür von Reihenfolge 9 auf 10 (nur die Position im Reiter).
- Import: `scripts/import/scrapeSport.mjs` → `sport-raw.json` → `scripts/importiereSport.mts` → `src/config/products/sport.generated.ts`
  und `sport-jobs.json` (Fotos über `ingestDirect`). Ablauf: `scripts/import/ABLAUF.md`, Abschnitt „Sportbekleidung“.
- Druckflächen: Ärmel am Foto abgelesen (`scripts/aermelBereiche.json`), Vorder-/Rückseite aus Foto und Maßen wie überall
  (Prozessgrenze 30 × 47 cm unverändert).
- Seiten: eigene Landingpage `/sportbekleidung-bedrucken` und Markenseite `/just-cool-bedrucken` (Just Cool hat jetzt 8 Modelle: 6 Sportmodelle, das
  vorhandene Long Sleeve Cool T und Kids´ Cool T);
  Sitemap, Fußzeile und `llms.txt` laufen aus der Registry. Die Preisbeispiele nennen das Kleidungsstück („1 Sport-T-Shirt“).
- Wächtertests: `src/config/products/__tests__/sport.test.ts`, `src/lib/seo/__tests__/sportSeite.test.ts`.
