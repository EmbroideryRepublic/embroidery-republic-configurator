# Generische Produktarchitektur — Ist-Analyse, Zielmodell & Meilensteinplan

> **Status:** Meilenstein 0 (Analyse) abgeschlossen. Verbindliche Grundlage für die
> Generalisierung des Konfigurators von „nur Kleidungsstücke" zu „beliebige
> individualisierbare Produkte" (Taschen, Schürzen und langfristig Caps, Mützen,
> Handtücher, Beutel, Decken, Kissen, Westen, Softshell …).
>
> **Prinzipien (unverändert):** nur verifizierte Daten, keine erfundenen Inhalte,
> keine erzeugten/simulierten Produktbilder, testgetrieben, jederzeit grüner Build.
> Keine Sonderlösung für Tasche/Schürze — sondern ein datengetriebenes Modell,
> das jede künftige Produktgruppe ohne Architektur-Umbau andocken lässt.

---

## 1. Kernbefund

Die gesamte „welche Ansichten/Druckflächen hat ein Produkt"-Logik hängt an **einem
einzigen fest verdrahteten Typ**:

```ts
// src/types/index.ts:6
export type PrintView = 'front' | 'back' | 'sleeve_left' | 'sleeve_right';
```

Daraus folgen zwei tief verdrahtete Kleidungs-Annahmen:

1. **4-Ansichten-Welt.** Über `Record<PrintView, …>` erzwingen viele Strukturen genau
   diese vier Schlüssel. Der einzige „Ausweg" ist ein binärer Schalter
   `hasSleeves?: boolean` ([config/products/types.ts:44](../src/config/products/types.ts)),
   der nur „front/back/2 Ärmel" gegen „front/back" abgrenzen kann — Kapuze,
   Taschen-Seite/-Boden oder Schürzen-Brust/-Bauch sind damit **nicht ausdrückbar**.
2. **Erschöpfende Produktarten.** `ProductType` (8 Kleidungstypen) wird an mehreren
   Stellen **dreifach dupliziert** aufgezählt (Reihenfolge, Kacheln, Cross-Selling);
   die Facetten (Geschlecht, Passform, Konfektionsgrößen) und die Navigationsachse
   (Herren/Damen/Unisex) sind rein kleidungssemantisch.

**Gute Nachricht — der Rechenkern ist bereits datengetrieben.** Diese Teile kennen
_keine_ feste 4er-Menge und iterieren über die tatsächlich belegten Ansichten:

- `ConfiguratorCanvas` arbeitet mit **einer** `printArea` + `el.view === activeView`
  (vollständig ansichts-agnostisch — Referenzmuster).
- Regel-Engine (`ruleEngine.ts`), Preis-Akkumulation (`calculatePrice.ts:217`),
  Rendering (`renderPrintView`/`svgScene`/`mapOrderElements`), der PNG-Vorschau-Loop
  (`orderCompletion.ts`) und `kauffortschritt.belegteAnsichten` laufen elementgetrieben.
- `DECORATION_POSITIONS` ([config/decorationPositions.ts](../src/config/decorationPositions.ts))
  ist bereits die zentrale Positions-Registry (Labels/Reihenfolge/Gruppen).
- `PRINT_AREA_DATA` ist bereits ein **pro-Produkt** `Partial<Record<PrintView,…>>` —
  faktisch schon die Quelle „welche Views hat dieses Produkt".

Die harten Annahmen sitzen also an **wenigen, klar benennbaren Rändern** (Typ-Wurzel,
`hasSleeves`, ein paar literale UI-Listen, eine Server-Whitelist, der Geometrie-Generator
und die Katalog-Navigation) — nicht im Kern. Das macht die Generalisierung machbar.

---

## 2. Ist-Zustand: Annahmen-Landkarte

Kartiert aus einer Parallelanalyse über 6 Subsysteme (80 belegte Fundstellen). Hier die
strukturbildenden; die vollständige Liste steckt in den Meilenstein-Checklisten (§4).

### 2.1 Typ-Wurzel & Datenmodell
| Ort | Annahme |
|---|---|
| `types/index.ts:6` | `PrintView` = geschlossene 4er-Union — Wurzel aller Kopplungen |
| `types/index.ts:54-63` | `ProductColor` (Supabase-Spiegel): feste Felder `imageFront/imageBack/imageSleeveL?/imageSleeveR?` |
| `config/products/types.ts:8` | `ProductColorConfig.images: Record<PrintView,string>` — jede Farbe MUSS 4 Bilder liefern |
| `config/products/types.ts:44` | `hasSleeves?: boolean` — einziger Ansichts-Deskriptor eines Produkts |
| `colorHelpers.ts:130-218` | 3 Farbsatz-Builder verdrahten die 4 Bildschlüssel; `realPhotoFrontBackColorSet` füllt Ärmel mit `front.webp`-Attrappen |
| `config/printAreas.ts:145` | `SEAM_MARGIN_CM: Record<PrintView,number>` (4 Schlüssel, kein Fallback) |
| `pricing/calculatePrice.ts:216,280` | `areaPriceByView` fix mit `{front,back,sleeve_left,sleeve_right}` initialisiert/zurückgegeben |
| `pricingRules.ts:40-87` | je Veredelungsart 4 `per_position`-Regeln mit fixem `printView` |
| `actions/orderTypes.ts:88,112` | `previews?: Partial<Record<PrintView,Buffer>>`, `PRINT_VIEW_LABELS: Record<PrintView,string>` |

### 2.2 Konfigurator-UI (Navigations-Schicht)
| Ort | Annahme |
|---|---|
| `ViewSwitcher.tsx:11,30` | literale `VIEW_ORDER` + Ärmel-Filter via `hasSleeves` |
| `ProduktFarbwahl.tsx:18-34` | literales `ANSICHTEN`-Array + Ärmel-Filter |
| `LargePreviewModal.tsx:45-54` | `isSleeveView`, `availableViews`-Filter über `gruppe!=='aermel'` |
| `ConfiguratorPrototype.tsx:186,299,372,468` | `hasSleeves`-Reset, 4-Schlüssel-Fallback-Objekt, Flag-Durchreichung |
| `configuratorStore.ts:87,418` | `activeView='front'` als Default/Reset |
| `configurator/vorladen.ts:32-55` | Preloading greift hart `images.front/back/sleeve_left/sleeve_right` |

### 2.3 Server / Produktion / Preis
| Ort | Annahme |
|---|---|
| `orders/orderValidation.ts:61,264` | globale Whitelist `ERLAUBTE_ANSICHTEN` (produktUNabhängig) |
| `pricing/positionStage.ts:75-80` | dupliziertes `ansichtLabel`-Mapping |
| `products/productPage.ts:54-59` | dupliziertes `ANSICHT_LABELS`-Mapping |
| `rendering/renderPrintView.ts:44` | wirft bei fehlendem `color.images[view]` (kein sauberer Null-Pfad) |

### 2.4 Druckflächen-Generator
| Ort | Annahme |
|---|---|
| `scripts/generatePrintAreaData.mts:139` | Master-Loop über feste `VIEWS = [4]` |
| `…:486,593,649` | `istAermel`-Binärverzweigung → nur **zwei** Geometrie-Rezepte (Rumpf vs. Ärmel) |
| `…:107-116,90-96` | Prozessgrenzen/Abstände als feste 4-Schlüssel- bzw. hemd-anatomische Konstanten |

### 2.5 Katalog / Navigation
| Ort | Annahme |
|---|---|
| `produktbaum.ts:41-43` (ARTFOLGE), `page.tsx` (REIHENFOLGE), `KategorieReiter.tsx` | Produktarten-Reihenfolge **3× dupliziert** |
| `page.tsx:64-96` (KACHELFARBE/KATEGORIE_TEXT), `productPage.ts:29-38` (KOMPLEMENT) | `Partial<Record<ProductType,…>>` ohne Vollständigkeitszwang |
| `produktbaum.ts:32` | oberste Navigationsachse fest Herren/Damen/Unisex |
| `catalog/filter.ts:42-58`, `groessen.ts:9-11` | Facetten + Größenleiter kleidungsfixiert |
| `ProduktBrowser.tsx:44` | Repräsentativbild ausnahmslos `images.front` (Kachel/OG/JSON-LD) |

### 2.6 Wächter-Tests, die die Annahme mitkodieren (müssen mitwandern)
`printAreas.test.ts:16-43` (feste 4 Keys, „front/back Pflicht", „Ärmel genau dann…"),
`productPage.test.ts:53-66` (Pflicht front/back), `produktbaum.test.ts:51-61`
(„jede Hauptgruppe führt alle Produktarten").

---

## 3. Zielarchitektur: datengetriebenes View- & Produktgruppen-Modell

### 3.1 Ansichten werden zu Daten (View-Registry + pro-Produkt-Deklaration)

**Entscheidung (empfohlen):** `PrintView` von der geschlossenen Union zu einer **offenen
View-ID** öffnen und die Gültigkeit über eine **zentrale Registry + Wächter-Tests**
sichern — genau das Muster, das das Projekt bei den Facetten bereits erfolgreich nutzt
(„die Tabelle scheitert laut", `facetten.test.ts`). Das ist der einzige Weg, der ohne
Typ-Umbau je neuer Produktgruppe skaliert (= das ausdrückliche Projektziel).

```ts
// Neu: zentrale, erweiterbare View-Registry (Ausbau von decorationPositions.ts)
export type ViewId = string;            // offen; Gültigkeit via Registry + Test
export interface ViewDef {
  id: ViewId;                           // 'front' | 'hood' | 'pocket' | 'apron_chest' | 'cap_front' …
  labelKey: string;                     // i18n-Schlüssel (eine Quelle für ALLE Labels)
  gruppe: string;                       // offen: 'koerper' | 'aermel' | 'kapuze' | 'tasche' | 'kopf' …
  geometrieRezept: string;              // 'torso-zylinder' | 'oberarm-band' | 'flachteil' | 'wickelflaeche' …
  seamMarginCm?: number;                // Default je Rezept
  prozessgrenze?: { maxWidthCm: number; maxHeightCm: number };
  gespiegeltVon?: ViewId;               // generisch (nicht nur Ärmel)
  order: number;                        // fachliche Reihenfolge
}
export const VIEW_REGISTRY: Record<ViewId, ViewDef> = { /* front, back, sleeve_*, … */ };
```

**Jedes Produkt (bzw. seine Produktgruppe) deklariert seine Ansichten:**

```ts
// ProductConfig
views: ViewId[];                        // ersetzt hasSleeves; geordnete Liste der REAL vorhandenen Ansichten
// ProductColorConfig
images: Partial<Record<ViewId, string>>;// nur für die deklarierten Ansichten
```

Folgen:
- **`hasSleeves` entfällt** — „hat Ärmel" = `views` enthält Ärmel-Views. Der
  `realPhotoFrontBackColorSet`-Sonderfall und die `front.webp`-Attrappen entfallen ganz.
- Alle `Record<PrintView,…>` werden zu **offenen** Records/`Partial` über die deklarierten
  IDs: `images`, `areaPriceByView`, `SEAM_MARGIN_CM`, `PRINT_VIEW_LABELS`, `previews`,
  `PricingRule.printView`.
- Alle UI-Ansichtslisten kommen aus `product.views`; **keine leeren Buttons** mehr, weil
  nur real vorhandene Ansichten existieren.
- Server-Validierung prüft `element.view` gegen die **pro-Produkt** geladenen
  `druckflaechen` statt gegen eine globale Whitelist.
- Ein **Default** wird `product.views[0]` statt Literal `'front'` (Schürze ohne „front"
  funktioniert dann sauber).

**Warum offene ID statt „Union erweitern":** Beides wurde geprüft. Die Union zu erweitern
bliebe compilergeprüft, zwingt aber jede neue Produktgruppe erneut in die zentrale Typdatei
(+ jedes `Record<PrintView>` mitzupflegen) — das widerspricht „ohne Architektur-Umbau
andocken". Die offene ID + Registry + Wächter-Test verlagert die Sicherheit von der
Compile- in die Test-Zeit (projektkonform) und skaliert auf beliebig viele Gruppen.

### 3.2 Produktgruppen werden zu Daten (ein zentrales ProductType-Register)

Ein **exhaustiver** `Record<ProductType, ProductTypeDef>` löst die 3-fach-Duplikation und
die `Partial`-Records ab (Compiler erzwingt Vollständigkeit → neuer Typ ohne Eintrag = Build-Fehler):

```ts
export interface ProductTypeDef {
  labelSingular: string; labelPlural: string;   // löst naives '+s' (Weste→„Westes")
  order: number;                                 // eine Reihenfolge-Quelle (statt 3)
  defaultViews: ViewId[];                        // Standard-Ansichtensatz der Gruppe
  komplement: ProductType[];                     // Cross-Selling (Pflicht, ggf. leer)
  kachelText?: string; kachelFarbe?: string;     // Startseiten-Kacheln
  primaryView: ViewId;                           // Repräsentativbild (statt fix 'front')
  naviAchse: string;                             // 'geschlecht' | 'anlass' | 'einheitsgroesse' …
  groessenLeiter: string;                        // 'konfektion' | 'kopfweite' | 'einheit' | 'numerisch'
  facettenDimensionen: string[];                 // welche Filter für diese Gruppe sinnvoll sind
}
```

Damit werden ARTFOLGE/REIHENFOLGE/KategorieReiter/KACHELFARBE/KATEGORIE_TEXT/KOMPLEMENT
zu **einer** Quelle; Facetten/Größenleiter/Navigationsachse/Repräsentativbild werden
**pro Gruppe** datengetrieben. Neue Gruppen (bag, apron, cap, …) tragen sich hier ein.

### 3.3 Geometrie-Generator: Rezept-Registry statt `istAermel`-Binär

`generatePrintAreaData.mts` iteriert künftig über `product.views` und wählt je View ein
**Rezept** aus einer Strategie-Registry `{ rezept → (ctx) => Fläche }`
(`torso-zylinder`, `oberarm-band`, `flachteil` (Tasche/Schürze/Handtuch),
`wickelflaeche` (Cap), …). Jedes Rezept kapselt seine Konstanten (Abstände,
Prozessgrenzen, Startposition). Der Kern-Loop wird rezept-agnostisch; neue Produktgruppen
liefern ein neues Rezept, ohne den Generator umzubauen.

### 3.4 Bestand bleibt unverändert korrekt

Die 154 Bestandsprodukte bekommen ihre `views` **abgeleitet** aus dem heutigen Signal
(`PRINT_AREA_DATA[id]`-Keys bzw. `hasSleeves`): Kleidungsstücke → `['front','back',
'sleeve_left','sleeve_right']` bzw. ohne Ärmel `['front','back']`. Verhalten, Preise,
Produktionsdaten und Vorschau bleiben Byte-nah identisch (Regressionsschutz per Tests).

---

## 4. Meilensteinplan

> Nach **jedem** Meilenstein: `npm run typecheck && npm run lint && npm test && npm run build`
> (mit `NEXT_PUBLIC_SITE_URL`). Erst grün → nächster Schritt. Bestehende Funktionen
> (Browser, Suche, Filter, Kategorien, Favoriten, Produktseiten, Preis, Konfigurator)
> dürfen nicht verschlechtert werden.

### M0 — Ist-Analyse ✅ (dieses Dokument)

### M1 — Datenmodell generalisieren ✅ (abgeschlossen, grün)

**Umgesetzt:** `PrintView` → offene View-ID; `decorationPositions.ts` zur autoritativen
Registry ausgebaut (`istGueltigeView`/`viewDef`/`seamMarginCmVon`/`ALLE_VIEW_IDS`, offene
Gruppe, Nahtabstand zentral); `ProductConfig.views` + Resolver `ansichtenVon()` (einzige
Laufzeit-Quelle); Generator emittiert explizite `views` + view-scoped Platzhalter;
`areaPriceByView` dynamisch (O3 behoben); `vorladen`/`renderPrintView`/Bild-Zugriffe
generalisiert; 10 Wächter-Tests (`viewRegistry.test.ts`). ADR:
[adr/0001-generische-druckansichten.md](adr/0001-generische-druckansichten.md).

**Bewusste Scoping-Präzisierung (Empfehlung, nicht eigenmächtig geändert):** Das Feld
`hasSleeves` bleibt in M1 als `@deprecated` Kompatibilitäts-Shim erhalten, damit die noch
nicht umgestellte Konfigurator-/Produktseiten-UI unverändert kompiliert und M1 self-contained
grün bleibt. Die **vollständige Entfernung von `hasSleeves` inkl. UI-Umstellung auf
`ansichtenVon()`** wandert nach **M2** (Konfigurator). Ebenso: `colorHelpers`-Konsolidierung
zu EINEM Builder (Attrappen-Ärmel entfernen) und `orderValidation` gegen pro-Produkt-Flächen
sind M2. Grund: Der Typ-Wurzel-Wechsel rippelt bereits in UI-Dateien (Kompilierbarkeit); die
*semantische* Umstellung dort bündeln wir sauber in M2 statt sie über M1/M2 zu verteilen.

<details><summary>Ursprüngliche M1-Checkliste</summary>
- View-Registry (`ViewId`, `ViewDef`, Ausbau `decorationPositions.ts`) + Wächter-Test
  „jede Produkt-View existiert in der Registry & hat einen Druckbereich".
- `ProductConfig.views: ViewId[]` einführen; **`hasSleeves` entfernen** (abgeleitet).
- `images` → `Partial<Record<ViewId,string>>`; `colorHelpers` auf **einen** generischen
  Builder reduzieren (Sonderfall + Attrappen streichen).
- Offene Records: `areaPriceByView`, `SEAM_MARGIN_CM`, `PRINT_VIEW_LABELS`, `previews`,
  `PricingRule.printView`, `ProductColor`-Bildfelder.
- Zentrales **ProductType-Register** (§3.2) anlegen; Bestandswerte 1:1 übernehmen.
- Bestands-`views` ableiten; `printAreas.test.ts`/`productPage.test.ts` auf „deklarierte
  Views" umschreiben. **Grün-Gate.**
</details>

### M2 — Konfigurator generalisieren ✅ (abgeschlossen, grün)

**Umgesetzt:** Der komplette Konfigurator arbeitet ausschließlich über
`ansichtenVon()` / die zentrale View-Registry.
- **`hasSleeves` vollständig entfernt** (Typ, alle 4 Marken-Dateien, Generator,
  8 Build-/QA-Skripte, 2 Tests). Alle 154 Produkte deklarieren jetzt explizit
  `views`.
- UI datengetrieben: `ViewSwitcher`, `ProduktFarbwahl`, `LargePreviewModal`,
  `ConfiguratorPrototype` erhalten die Ansichtenliste aus `ansichtenVon(product)`;
  keine `VIEW_ORDER`/`ANSICHTEN`-Literale, kein Ärmel-/Gruppen-Filter. Es
  erscheinen nur real vorhandene Ansichten (keine leeren Buttons).
- **Validierung** (`orderValidation`) prüft `element.view` gegen die
  **pro-Produkt** geladenen Druckflächen statt gegen eine globale Whitelist –
  behebt zugleich, dass ein Motiv auf einer vom Produkt gar nicht geführten
  Ansicht früher akzeptiert wurde.
- **Store**: `activeView`-Startwert datengetrieben (erste geführte View);
  `version`-Bump 8→9 mit Migration, die Elemente mit ungültiger View entfernt.
- **Label-Dedup (O6):** `positionStage` + `productPage` nutzen `positionLabel()`
  aus der Registry (zwei duplizierte Label-Maps entfernt); Nahtabstand bereits
  seit M1 zentral.
- **Groundwork Taschen/Schürzen:** Registry um `chest`, `pocket`, `neckband`,
  `inside`, `bottom`, `side` erweitert (+ i18n de/en). Neue Produktgruppen
  entstehen damit rein über Daten (Registry-Eintrag + Produkt-`views` +
  Druckfläche); Kernlogik bleibt unberührt. Geometrie-Rezepte je Position folgen
  in M4/M5.

**Offene, dokumentierte Aufräum-Empfehlungen (bewusst NICHT in M2 erzwungen):**
- `ConfiguratorPrototype.tsx` (~470 Z.) in kleinere Einheiten zerlegen — verhaltens-
  neutral, aber nennenswertes Regressionsrisiko; als eigener, klar abgegrenzter
  Refactor-Schritt sinnvoll (nicht mit der Generalisierung vermischen).
- `colorHelpers`: `realPhotoFrontBackColorSet` (Ärmel-Attrappen) durch EINEN
  generischen, views-getriebenen Builder ersetzen; heute unschädlich, da die
  Attrappen-Ansichten nicht mehr in `views` liegen und nie gerendert werden.

<details><summary>Ursprüngliche M2-Checkliste</summary>
- `ViewSwitcher`, `ProduktFarbwahl`, `LargePreviewModal`, `ConfiguratorPrototype`,
  `vorladen` auf `product.views`; Default/Reset auf `views[0]`.
- `orderValidation` gegen pro-Produkt-`druckflaechen`; `positionStage`/`productPage`-Labels
  auf zentrale Registry; `renderPrintView` sauberer Null-Pfad bei fehlendem Bild.
- Persistenz: `configuratorStore` `version`-Bump + Migration (ungültige `activeView`/
  `element.view` auf `views[0]` heilen). **Grün-Gate.**
</details>

### M3 — Produktbrowser & Katalog generalisieren
- ARTFOLGE/REIHENFOLGE/KategorieReiter/KACHELFARBE/KATEGORIE_TEXT/KOMPLEMENT → ProductType-Register.
- `primaryView` statt fix `'front'`; `naviAchse`/`groessenLeiter`/`facettenDimensionen`
  pro Gruppe; Plural-Labels. **Grün-Gate.**

### M4 — Import-Pipeline modularisieren (§5)
- Stufen entkoppeln: Source-Adapter → Extraktion → Validierung (Schema→DTO) →
  Normalisierung → Dedup → Enrichment (Views/Geometrie) → Generierung (Daten statt String-Templating).
- Bestehenden textil-grosshandel-Import als ersten Source-Adapter kapseln. **Grün-Gate.**

### M5 — Neue Produktgruppen integrieren
- `bag` + `apron` als ProductTypes (View-Sets + Geometrie-Rezepte) registrieren.
- Taschen/Schürzen-Textdateien (und weitere gelieferte Dateien) über die neue Pipeline
  vollständig importieren; „Bild fehlt" wie gehabt. **Grün-Gate.**

### Laufend — Katalog-Ausbau
Weitere Textdateien werden mit derselben Disziplin verarbeitet (Dedup vor Import;
existiert → nur fehlende Farben/Größen/Varianten ergänzen; neu → vollständig verifiziert
integrieren). Fließt ab M4 durch die modulare Pipeline.

---

## 5. Modulare, mehrlieferantenfähige Import-Pipeline

**Ist:** `scripts/importiereProdukte.mts` ist ein ~350-Zeilen-Monolith, der ein
extern/manuell per Browser-DOM gewonnenes `products-raw.json` einliest und per
**String-Templating** drei `.ts`-Dateien erzeugt. Extraktion, Validierung, Normalisierung,
Preis, Geometrie-Alias und Generierung sind in einer Datei vermischt. Die bereits
vorhandene Lieferanten-Abstraktion (`src/lib/suppliers/adapters|mapping|registry`) wird
vom Import gar nicht genutzt (sie dient nur der Wieder-Bestellung).

**Ziel — getrennte, testbare Stufen (analog zur `SupplierAdapter`-Registry):**

```
ProductSource (je Lieferant)   fetchRaw(): AsyncIterable<RawSupplierProduct>
  → validate    (zod-Schema → kanonische CanonicalProduct-DTO; Ausschuss strukturiert)
  → normalize   (import/normalize/*: Farbe, Material, Typ, Geschlecht, Fit — je 1 test­bare Fn,
                 Vokabular aus facetten.ts wiederverwenden)
  → dedup       (deterministisch über Hersteller- + Händlernummer; nicht an Laufzeit-Katalog gekoppelt)
  → enrich      (Views/Geometrie: Klasse → View-Set + Geometrie-Vorlage; Fail-Fast bei Unbekanntem)
  → generate    (Emit als DATEN — JSON/DB-Zeilen — statt TS-String-Konkatenation)
```

Vorteile: neuer Lieferant = neuer Source-Adapter; jede Stufe einzeln testbar; Skalierung
Richtung JSON-/DB-Katalog (der Code antizipiert das bereits: `supplierRefs` „später 1:1 in
eine DB-Tabelle"). Details/Interfaces werden in M4 ausgearbeitet.

---

## 6. Optimierungs-Register (dokumentiert, NICHT ungefragt umgesetzt)

| # | Schwere | Befund | Vorschlag |
|---|---|---|---|
| O1 | hoch | `hasSleeves`-Sonderfall über ≥6 Stellen verstreut (Flag + Bild-Helfer + UI-Filter) | Durch `product.views` ersetzen (Teil von M1/M2) |
| O2 | hoch | Produktarten-Reihenfolge **3× dupliziert** + `Partial`-Records ohne Vollständigkeitszwang | Zentrales exhaustives ProductType-Register (M3) |
| O3 | hoch | `calculatePrice.ts:280` verwirft Preis jeder Nicht-4er-Ansicht **still** | Offenes `Record<string,number>` zurückgeben (M1) |
| O4 | hoch | `orderValidation` globale Whitelist statt pro-Produkt | Gegen `druckflaechen` prüfen (M2) |
| O5 | hoch | Produktgenerierung per **String-Templating** | Emit als Daten/Serializer (M4) |
| O6 | mittel | Ansicht→Label-Mapping **≥4× dupliziert** (`positionStage`, `productPage`, `orderTypes`, lokal) | Alles auf `decorationPositions`-Registry |
| O7 | mittel | `istAermel`-Binär durchzieht den Generator | Rezept-Registry (M4/§3.3) |
| O8 | mittel | Import-Inferenztabellen (Farbe/Material/Typ/…) im Skript, Vokabular teils dupliziert zu `facetten.ts` | `import/normalize/*`-Module, Vokabular teilen |
| O9 | mittel | Keine Schema-Validierung des Rohinputs (nackte Interfaces) | `zod`-Validierungsstufe → `CanonicalProduct` |
| O10 | mittel | `REFERENCE_HEIGHT_CM` (~45 Einträge) + Default in `printAreas.ts` werden berechnet, aber **nicht mehr verwendet** (toter Code seit Umstellung auf `boxHeightCm`) | Entfernen oder bewusst wieder anschließen |
| O11 | mittel | Prozessgrenzen **doppelt** definiert (Generator + Test) | Eine Quelle (je Rezept), beide lesen daraus |
| O12 | niedrig | Naives Plural `'{Label}s'` (`[slug]/page.tsx:351`) → „Westes"/„Jackes" | `labelPlural` im Register (M3) |
| O13 | niedrig | Startseite verdrahtet Hoodie als Bühnenmotiv fest | Datengetrieben (hero-Flag im Register) |
| O14 | niedrig | Freitext-Beschreibungen zählen Produkttypen fest auf (`strukturierteDaten.ts:134`) | Aus Bestand generieren |

---

## 7. Risiken & Migrationen

- **Persistenz/IndexedDB:** `configuratorStore` speichert `activeView` und `element.view`
  (`zustand/persist`, version 8). Öffnung der View-Menge braucht **version-Bump +
  Migration**, die ungültige/veraltete Views auf `views[0]` heilt (M2).
- **Supabase-Schema:** `PrintView`/`ProductColor`-Bildspalten spiegeln `0001_init.sql`.
  Offene View-ID ist DB-seitig unkritisch (Textspalten), aber die 4 festen Bildspalten
  sollten mittelfristig zu `product_color_images(colorId, viewId, url)` migrieren
  (nicht blockierend; heutige Config-Produkte laufen ohne DB).
- **`GEOMETRY_ALIAS`** kopiert das GESAMTE Ansichts-Record der Quelle — bei divergierenden
  View-Mengen (Alias-Ziel hat andere Ansichten) inkonsistent; Auflösung view-genau machen.
- **Wächter-Tests** (`printAreas.test.ts`, `productPage.test.ts`, `produktbaum.test.ts`)
  kodieren die 4er/Binär-Welt und müssen **vor** der jeweiligen Umstellung mitwandern —
  sonst blockieren sie (bewusst) den Fortschritt.
- **Compile- vs. Test-Sicherheit:** Beim Öffnen der Union entfällt die
  Compiler-Exhaustive-Prüfung; sie wird durch Wächter-Tests ersetzt (projektkonform,
  siehe `facetten.test.ts`). Jede neue View/Gruppe MUSS ihren Registry-/Test-Eintrag haben.

---

*Erstellt in M0. Fortschritt & Abweichungen werden hier fortgeschrieben.*
