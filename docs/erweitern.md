# Erweitern: Produkte, Kategorien, Druckverfahren, Lieferanten

Wie man den Katalog und die Fähigkeiten des Shops erweitert. Grundregel:
**Typsicher UND zentral** – eine feste Aufzählung sorgt dafür, dass der Compiler
jede Stelle zeigt, die mitgepflegt werden muss.

> Der **Konfigurator ist eingefroren (v1.0)**. Neue Produkte/Kategorien/
> Lieferanten sind Katalogpflege und weiterhin erlaubt. Ein neues
> **Druckverfahren** greift dagegen in die Konfigurator-Mechanik ein und ist
> daher eine bewusste, abgestimmte Erweiterung – kein Nebenbei-Feature.

## Neues Produkt / neue Marke

Der maßgebliche Ablauf steht als Kommentar in
[src/config/products/index.ts](../src/config/products/index.ts). Kurzfassung:

1. `src/config/products/<marke>.ts` anlegen und `PRODUCTS: ProductConfig[]`
   exportieren (Farbhelfer aus `colorHelpers.ts` wiederverwenden).
2. Echte Fotos unter `public/products/<marke>-<modell>[-<farbe>]/…` ablegen
   (`front`/`back`/`sleeve-left`/`sleeve-right`). **Keine erzeugten Bilder.**
3. Druckflächen in [src/config/printAreas.ts](../src/config/printAreas.ts)
   ergänzen – **Pflicht**: ohne MEASURED-Eintrag bekommt das Produkt keine
   Druckfläche.
4. Import- und Spread-Zeile in `index.ts` ergänzen.
5. Bezugsquelle in `supplierRefs.ts` (Artikelnummer/URL) und – falls neue
   Farben/Größen – Mapping ergänzen. `npm run coverage:suppliers` und
   `catalogConsistency.test.ts` melden Offenes.
6. `npm run typecheck && npm run lint && npm test && npm run build`, dann
   visueller Check im Konfigurator.

Ein neues Produkt fließt **automatisch** in Filter, Produktbrowser, Mapping und
Coverage-Report (alles iteriert über `PRODUCTS`). Siehe auch
[produktkatalog-vollstaendig.md](produktkatalog-vollstaendig.md),
[sortimentsstrategie.md](sortimentsstrategie.md).

## Neue Kategorie (ProductType)

Kategorien sind die feste Aufzählung `ProductType` in
[src/types/index.ts](../src/types/index.ts) (aktuell: `tshirt`, `longsleeve`,
`polo`, `hoodie`, `zip-hoodie`, `sweater`, `vest`, `jacket`). Eine neue Kategorie
ergänzen:

1. Wert in `ProductType` aufnehmen.
2. Den Compiler-Fehlern folgen – die exhaustiven Tabellen/Listen erzwingen die
   Pflege:
   - `PRODUCT_TYPE_LABELS` in [config/products/types.ts](../src/config/products/types.ts)
     (Anzeigename),
   - `ARTFOLGE` in [lib/configurator/produktbaum.ts](../src/lib/configurator/produktbaum.ts)
     (Reihenfolge im Produktbrowser),
   - `REIHENFOLGE` in [src/app/page.tsx](../src/app/page.tsx) (Kachelreihenfolge
     der Startseite).
3. Produkte mit `productType: '<neu>'` versehen. Filterleiste
   ([lib/catalog/filter.ts](../src/lib/catalog/filter.ts)) und Kategorie-Reiter
   ([components/shop/KategorieReiter.tsx](../src/components/shop/KategorieReiter.tsx))
   greifen automatisch.
4. Optional für Cross-Selling: einen Eintrag in `KOMPLEMENT`
   ([lib/products/productPage.ts](../src/lib/products/productPage.ts)) ergänzen,
   damit die neue Kategorie in der „Passt dazu“-Reihe auftaucht bzw. selbst
   passende Vorschläge zeigt. Fehlt der Eintrag, entfällt nur diese Reihe – kein
   Fehler. Hintergrund: [shop-praesentation.md](shop-praesentation.md).

## Neues Druckverfahren (PrintMethod)

Verfahren sind `PrintMethod` in [src/types/index.ts](../src/types/index.ts)
(aktuell `dtf`, `embroidery`). Ein neues Verfahren berührt mehrere Stellen:

1. Wert in `PrintMethod` aufnehmen.
2. Preisregeln: [config/pricingRules.ts](../src/config/pricingRules.ts) –
   `getPricingRules(printMethod)` muss für das neue Verfahren Regeln liefern
   (Flächen- vs. Stichpreis, Rüstkosten). Siehe
   [kalkulationsmodell.md](kalkulationsmodell.md).
3. Druckflächen: [config/printAreas.ts](../src/config/printAreas.ts) –
   `getPrintAreas(productId, printMethod)` ggf. verfahrensabhängige Flächen.
4. Oberfläche: [MethodSwitcher.tsx](../src/components/configurator/MethodSwitcher.tsx)
   und die i18n-Schlüssel (`method_*`).
5. Voller Verifikationszyklus inkl. `test:e2e`.

> Ein neues Verfahren ist eine echte Funktionserweiterung des eingefrorenen
> Konfigurators – vorher abstimmen.

## Neue Veredelungsposition (PrintView)

Positionen (Vorderseite/Rückseite/Ärmel) sind `PrintView`. Der Ablauf zum
Ergänzen (z. B. Kapuze) steht als Kommentar in
[config/decorationPositions.ts](../src/config/decorationPositions.ts): Wert in
`PrintView`, Eintrag in `DECORATION_POSITIONS`, i18n-Schlüssel, dann den
Compiler-Fehlern folgen (Druckfläche, Bild, Renderer). Hintergrund:
[platzierung-veredelung.md](platzierung-veredelung.md).

## Neuer Lieferant

Eigene, ausführliche Anleitung:
[lieferanten-adapter-leitfaden.md](lieferanten-adapter-leitfaden.md). Überblick
über die Architektur: [lieferanten-architektur.md](lieferanten-architektur.md),
Mapping: [lieferanten-mapping.md](lieferanten-mapping.md). Der aktuelle
Regelweg ist der **manuelle** Lieferantenprozess
([manueller-lieferantenprozess.md](manueller-lieferantenprozess.md)).
