# Architektur-Härtung: Befund-Register & priorisierter Fahrplan

> **Phase M2.5** (vor M3). Grundlage: parallele Architektur-Analyse über 7 Achsen
> (78 belegte Befunde). Ziel: das Fundament so absichern, dass künftige
> Produktgruppen (Taschen, Schürzen, Caps, Beanies, Rucksäcke, Sporttaschen,
> Westen, Handtücher, Decken, Kissen, Werbeartikel) **ausschließlich über
> Konfiguration/Registry/Daten** aufnehmbar sind — ohne Eingriff in Kernlogik.
> Verhalten des Bestands bleibt dabei überall **byte-identisch**.
>
> Design-Entscheidungen für die Zielarchitektur: [ADR 0002](adr/0002-generisches-produktmodell.md).
> Kontext: [architektur-generische-produkte.md](architektur-generische-produkte.md),
> [ADR 0001](adr/0001-generische-druckansichten.md).

## 1. Kernbefund

Nach M1/M2 ist die **Ansichten-Achse** vorbildlich datengetrieben (offene
`PrintView`, zentrale Registry, `ansichtenVon()`). Die verbleibende Kleidungs-
Kopplung sitzt an **wenigen, klar benennbaren Wurzeln**:

1. **`ProductType`** ist eine geschlossene 8-Kleidungstypen-Union und Pflichtfeld —
   die gemeinsame Wurzel der meisten Rest-Befunde (Navigation, Reihenfolge,
   Facetten, Größen, Cross-Selling, Kacheln).
2. **`PrintMethod`** und **`ConfigElementType`** blieben — anders als `PrintView` —
   geschlossene Unions; produktseitig ist nicht deklarierbar, welche Verfahren/
   Personalisierungsarten ein Produkt erlaubt.
3. **Größen/Material/Maße** sind rein textil (Konfektionsleiter, g/m², Passform,
   Breite/Höhe/Ärmel).
4. **Geometrie-Generator** kennt nur zwei Rezepte (Rumpf/Ärmel, `istAermel`-Binär).

### Zwei harte Funktionsbrüche für Nicht-Kleidung — ✅ BEIDE GELÖST (M3.4 / M3.5)
- **H1 — Navigationsachse** — ✅ **GELÖST in M3.4.** Der Browser gruppierte jedes
  Produkt fest über Herren/Damen/Unisex; ein Produkt ohne Geschlecht verschwand still.
  Ersetzt durch die Navigationsachsen-Registry (`config/products/naviAchsen.ts`);
  `baueBaum` ist achsengetrieben, der Gender-Hardcode ist entfernt. Wächter-Test
  „jedes Produkt in ≥1 Gruppe" verhindert den stillen Totalausfall künftig.
- **H2 — Größenübernahme** — ✅ **GELÖST in M3.5.** `naechsteGroesse` arbeitete nur
  auf der Konfektionsleiter; Einheits-/Maßgrößen lieferten `undefined` → Mengenverlust
  beim Wechsel. Ersetzt durch die typisierte Größenleiter-Registry (`GROESSEN_LEITERN`)
  mit Strategie je Leiter-Typ; Einheitsgröße mappt auf ihre einzige Größe (Menge bleibt).
  Wächter „jede deklarierte Leiter registriert" + explizite Strategie-Tests.

## 2. Befund-Register (nach Achse)

Legende Risiko: keins < niedrig < mittel < hoch. „Sofort" = verhaltensneutral, ohne
erhöhtes Regressionsrisiko jetzt umsetzbar.

### 2.1 Restliche Kleidungs-Annahmen (Wurzel: ProductType)
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| produktbaum.ts:32-57 | **H1** Navigationsachse Herren/Damen/Unisex → Nicht-Kleidung verschwindet aus dem Browser | hoch | M3 |
| types/index.ts:15 | `ProductType` geschlossene 8er-Union, Pflicht → Nicht-Kleidung nicht typisierbar | hoch | M3 |
| produktbaum.ts:41 · page.tsx:51 · KategorieReiter.tsx | Produktarten-Reihenfolge **3× dupliziert** | niedrig | M3 (Register) |
| productPage.ts:30 · page.tsx:64-96 | KOMPLEMENT/KACHELFARBE/KATEGORIE_TEXT: `Partial<Record<ProductType>>` ohne Vollständigkeitszwang | mittel | M3 |
| groessen.ts:9 · uebernahme.ts:64 · filter.ts:187 | **H2** Konfektionsleiter als einzige Größenordnung | mittel | M3 |
| facetten.ts:41-43 · filter.ts:42-58 · kriterien.ts:67 | Filter-Dimensionen fest (inkl. Pflicht `geschlecht`/`passform`) | mittel | M3 |
| types.ts:36,39 | `fit`/`careInstructions` Pflicht — für Nicht-Kleidung bedeutungslos | mittel | M3 |
| [slug]/page.tsx:352 | Naives Plural `'{Label}s'` → „Taschens" | niedrig | M3 (labelPlural) |
| strukturierteDaten.ts:43 · page.tsx:70 · ProduktBrowser.tsx:44,484 | `images.front` als impliziter Primärview (JSON-LD/SEO, Kacheln, Browser-Artbild) | niedrig | **Sofort** (Batch B) |
| [slug]/page.tsx:44 | Größen-Spanne `sizes[0]–sizes[letzte]` → „One Size–One Size" | niedrig | **Sofort** (Batch B) |
| page.tsx:32 · strukturierteDaten.ts | Freitexte zählen Kleidung fest auf / setzen 4 Ansichten voraus | keins | Sofort/redaktionell |
| page.tsx:121-123 | Startseiten-Bühne fest auf Hoodie verdrahtet | niedrig | M3 (hero-Flag) |
| types/index.ts:54-63 | Supabase-Spiegel `ProductColor` mit 4 festen Bildspalten | mittel | langfristig (DB-Migration) |

### 2.2 Flexibles View-/Druckflächen-Modell (Design)
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| decorationPositions.ts:55-73 | `ViewDef` trägt keine Geometrie-Semantik (Rezeptwahl hart im Generator) | niedrig | **Sofort** (Felder, Batch B) |
| generatePrintAreaData.mts:139,595 | Generator kennt nur 2 Rezepte (`istAermel`-Binär); Flachteil/Wickelfläche nicht ausdrückbar | mittel | M4 (Rezept-Registry) |
| generatePrintAreaData.mts:90-116 | Kleidungs-Anatomie-Konstanten (Kragen/Saum/Oberarm/Zylinder) global | mittel | M4 (je Rezept) |
| printAreas.ts:36-81 | `REFERENCE_HEIGHT_CM` (~45 Einträge) toter Code seit `boxHeightCm` (O10) | niedrig | **Sofort** (Batch A) |
| decorationPositions.ts:78-111 | Groundwork-Positionen (bag/apron) ohne `geometrieRezept` | niedrig | **Sofort** (Batch B) |
| types.ts:8 | `images: Record<PrintView>` → als `Partial<Record<ViewId>>` klarstellen | keins | verschoben (kosmetisch; Record ist via `PrintView=string` bereits offen) |

### 2.3 Veredelung / Personalisierung / produktspezifische Regeln
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| types/index.ts:9 | `PrintMethod` geschlossene 2er-Union (neues Verfahren = Typänderung überall) | mittel | langfristig (Registry) |
| MethodSwitcher.tsx:15 · ConfiguratorPrototype.tsx:452 | Verfahren hart im Component; Switcher immer für jedes Produkt | niedrig | Sofort (Feld+Filter, Batch B/C) |
| pricingRules.ts:101 · printAreas.ts:226 · store:86 | Verfahrens-Auflösung binär `emb?EMB:DTF`, Default fix `dtf` | mittel | mittelfristig |
| orderValidation.ts:61 | `ERLAUBTE_VEREDELUNGEN` globale Whitelist statt produktbezogen | niedrig | mittelfristig |
| selbstkosten.ts:71 | **Zweite** Verfahrens-Union `'dtf'\|'stick'` (Namensdiskrepanz zu `'embroidery'`) | niedrig | mittelfristig (vereinheitlichen, Kostenkern — sorgfältig) |
| types/index.ts:210 | `ConfigElementType='logo'\|'text'` geschlossen | mittel | langfristig (Element-Registry) |
| calculatePrice/ruleEngine/production/email/validation | `el.type==='logo'\|'text'` **querschneidend** hart verzweigt | hoch | langfristig (Element-Registry) |
| ToolPanelTabs.tsx:14 | Werkzeug-Tabs fest verdrahtet | mittel | mittelfristig |
| calculatePrice.ts:132 | `MINIMUM_QUANTITY=1` global (keine produktseitige MOQ) | niedrig | mittelfristig (constraints) |
| calculatePrice.ts:95 | `QUANTITY_TIERS` eine globale Staffel für alle | mittel | mittelfristig (quantityTierSet) |
| pricingRules.ts:38 | Setup-/Rüstkosten global, nicht produkt-/gruppen-scopebar | mittel | mittelfristig (Regel-Scope) |
| pricingRules.ts:40-43 | `per_position`-Zuschläge nur für die 4 klassischen Views | niedrig | mit neuen Gruppen |

### 2.4 Größen / Farben / Material
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| groessen.ts:9 · uebernahme.ts:64 | siehe **H2** (Konfektionsleiter global) | mittel | M3 |
| types.ts:103-108 | `SizeGuide` fest textil (breite/höhe/ärmel + fitRating) | mittel | M3+ (Maßschema) |
| SizeGuideModal.tsx:79-119 | Fest gezeichnete Shirt-Silhouette + „klein–normal–groß"-Skala | niedrig | M3+ (diagrammKey) |
| types.ts:30-39 | Flache Textilfelder `material/weightGsm/fit/careInstructions` | mittel | M3+ (`attributes`) |
| FilterSeitenleiste.tsx:50 | Einziger numerischer Filter fest „Stoffgewicht (g/m²)" | mittel | M3+ (numerische Facetten) |
| facetten.ts:34-39 | `MaterialGruppe`-Vokabular rein textil | mittel | M3+ (je Domäne) |
| colorHelpers.ts:156-228 | `realPhotoColorSet`/`realPhotoFrontBackColorSet` bauen fest 4 Ansichten | niedrig | **Sofort** (views-getrieben, Batch B/C) |
| colorHelpers.ts:76-86 | Zweifarb-IDs mit Attrappen-Semantik in globalen IDs | niedrig | mittelfristig (Akzent-Attribut) |
| ConfiguratorCanvas.tsx:234-243 | Live-Lineal-Fallback fest auf Größe `'M'` | niedrig | M3 (leiter.referenz) |
| **Positivbefund**: Farb-Grundmodell (COLOR_META/FARBGRUPPEN) ist produktübergreifend generisch | — | — | — |

### 2.5 Konfigurator-Architektur & Dedup
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| ConfiguratorCanvas.tsx:1-1150 | **1150 Zeilen**: Hauptkomponente + LogoNode + TextNode + 4 Geometrie-Helfer + Scale-Effekt | niedrig (mechanischer Split) | mittelfristig (dediziert) |
| lib/i18n (fehlt) + 20 Dateien | `t`-Muster **24× dupliziert** | keins | verschoben → M3 (Blast-Radius 20+ Dateien, mit i18n-Touch) |
| ConfiguratorCanvas.tsx:641-713 | `clampDragPosition`/`…Centered` nahezu identisch | mittel | mittelfristig (dragClamp.ts) |
| ConfiguratorCanvas.tsx:738-1149 | LogoNode/TextNode teilen fast die ganze Interaktionslogik | mittel | mittelfristig (useDecorationNode) |
| TextToolPanel/TemplateToolPanel/ElementToolbar/store | Text-Erzeugung + „auf Fläche schrumpfen" **4× dupliziert** | niedrig | mittelfristig (textElement.ts) |
| ConfiguratorPrototype.tsx:82-219 | Mehrere verwobene useEffects in Orchestrierung | mittel | mittelfristig (Hooks) |
| ConfiguratorPrototype.tsx:224-289 | Tastenkürzel-Effekt (~65 Z.) inkl. eigener Clamp-Rechnung | niedrig | mittelfristig (Hook) |
| store:285-368 | `syncElementsToPrintAreas` mischt Store-CRUD mit Geometrie/Text-Metrik | mittel | mittelfristig (reflow.ts) |
| ElementToolbar.tsx:594 (+2) | `bewegungsGrenzen`-Literal 3× dupliziert | keins | verschoben → mittelfristig (mit `dragClamp.ts`) |
| ConfiguratorCanvas.tsx:433-484 | Sperrzonen-Prozent→Pixel doppelt (JSX + computeExclusionZonesPx) | niedrig | mittelfristig |

### 2.6 Performance (Skalierung auf tausende Produkte)
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| index.ts:62 | `getProduct` = `PRODUCTS.find` O(N) je Aufruf (Render-Pfade) | niedrig | **Sofort** (Map-Index, Batch A) |
| printAreas.ts:217-228 | `getPrintAreas` = `.filter` O(N) je Produkt-/Methodenwechsel | niedrig | **Sofort** (Map-Index, Batch A) |
| ansichten.ts:20 | `ansichtenVon` liefert je Render neues Array (Sort+Spread) | niedrig | **Sofort** (WeakMap-Memo, Batch A) |
| produkt/page.tsx:90 | `PRODUCTS.map(merkmaleVon)` je Request neu (Doppelberechnung zu abfrage.ts) | niedrig | **Sofort** (Batch A) |
| ProduktBrowser.tsx:426 | Modellkarte ohne `React.memo` (Inline-Callbacks an der Aufrufstelle machen ein Memo bis dahin wirkungslos → Placebo vermieden) | niedrig | verschoben → mittelfristig (nach `useCallback`-Stabilisierung) |
| ProduktBrowser.tsx:42-45 | Katalogweite Ableitungen per `useMemo([])` je Mount statt Modul-Ebene | keins | **Sofort** (Batch A) |
| ProduktBrowser.tsx:127 | `baueBaum` je Tastendruck ungebremst über ganzen Katalog | mittel | mittelfristig (Debounce+Einpass) |
| filter.ts:168-193 | `berechneFacetten` ≈ O(8×N×8) je Request | mittel | mittelfristig (ab ~2.000 Produkten) |

### 2.7 Import-Pipeline (Vorarbeiten M4)
| Ort | Befund | Risiko | Wann |
|---|---|---|---|
| importiereProdukte.mts:82-176 | Inferenz/Normalisierung (Farbe/Material/Typ/Geschlecht/Fit) inline im Skript | niedrig | **Sofort** (extract normalize/*, Batch D/M4) |
| importiereProdukte.mts:193 | Keine Schema-Validierung des Rohinputs (nacktes `JSON.parse`) | niedrig | M4 (zod validate) |
| importiereProdukte.mts:35 | `fetchRaw`/Source-Stufe existiert nicht (products-raw.json extern/manuell) | mittel | M4 (ProductSource-Adapter) |
| importiereProdukte.mts:59-64 | Dedup an Laufzeit-Katalog gekoppelt (PRODUCTS-Import) | niedrig | M4 (reine Fn) |
| importiereProdukte.mts:257-340 | Generierung per String-Templating | mittel | M4 (Emit als Daten) |
| importiereProdukte.mts:177-190 | `GEO_REP`/`TYP_LABEL` fixe Tabellen; views kopiert ganzes Rep-Record | mittel | M4 (geometry/recipes, view-genau) |
| importiereProdukte.mts (gesamt) | Keine Tests der Inferenzfunktionen; kein npm-Script | keins | M4 (Unit-Tests + `import:tg`) |

## 3. Priorisierter Fahrplan

### 🟢 Quick Wins (verhaltensneutral) — **umgesetzt** in M2.5 (Batches A & B)
Grün-Gate nach jedem Batch: `tsc` 0, ESLint 0, Tests 554 pass (6 vorbestehende
Umgebungsfehler: Playwright-Chromium fehlt ×5, pdfjs-Worker-Hash ×1), Build
175/175 Seiten. Verhalten des Bestands byte-identisch.

- **Performance (Batch A):** `getProduct`/`getPrintAreas` als O(1)-Map-Index
  (statt `find`/`filter` je Aufruf); `ansichtenVon` WeakMap-Memo (stabile Array-
  Referenz statt Neubau je Render); `ProduktBrowser` katalogweite Ableitungen
  (Marken/Materialien/Preisstufen) auf **Modul-Ebene** statt `useMemo([])` je
  Mount; `produkt/page.tsx` nutzt vorberechnete `ALLE_MERKMALE` aus `abfrage.ts`
  statt `PRODUCTS.map(merkmaleVon)` je Request.
- **Dead Code (Batch A):** `REFERENCE_HEIGHT_CM` (~45 Einträge) + Ableitungen
  entfernt (seit `boxHeightCm`/`seamMarginCmVon` toter Code, O10).
- **Kleidungs-Restbestände (Batch B):** `images.front` → `repraesentativesBild()`
  an allen vier impliziten-Primärview-Stellen (JSON-LD/SEO `strukturierteDaten.ts`,
  Startseiten-`findeBild`, `ProduktBrowser` Artbild + Modellkarte); Größen-Spanne
  in `generateMetadata` defensiv (leer/Einheitsgröße → „Größe X" bzw. keine Angabe
  statt „One Size–One Size").
- **Groundwork additiv (Batch B):** `ViewDef.geometrieRezept` (offene `RezeptId`)
  + `prozessgrenze` (optional); **alle** Positionen mit Rezept versehen
  (`torso-zylinder`/`oberarm-band`/`flachteil`); produktseitige Optionalfelder
  `supportedMethods`/`allowedPersonalizations`/`constraints` (+`ProductConstraints`).
  Rein additiv, kein Laufzeit-Konsument — Default = heutiges Verhalten.

### 🟢 Quick-Win-Kandidaten — **bewusst verschoben** (mit Grund)
- **`useTranslate()`-Hook (24×-Dedup):** mechanisch einfach, aber Blast-Radius über
  20+ Dateien → kein „risikoarm jetzt". Gebündelt mit dem i18n-Touch in M3.
- **`Modellkarte` `React.memo`:** wirkungslos, solange die Aufrufstelle Inline-
  Callbacks (`onWaehlen={() => waehleModell(p)}` u.a.) je Render neu erzeugt — ein
  Memo ohne `useCallback`-Stabilisierung wäre Placebo. Zusammen mit der Callback-
  Stabilisierung mittelfristig.
- **`bewegungsGrenzenVon()`-Helfer:** zusammen mit `dragClamp.ts`/ElementToolbar-
  Refactor (mittelfristig), nicht isoliert.
- **`images: Partial<Record<ViewId,string>>`:** rein kosmetisch — `PrintView=string`
  macht den Record ohnehin offen; eine `Partial`-Umstellung zöge eine Signaturkette
  (`repraesentativesBild` u.a.) nach sich, ohne funktionalen Gewinn.
- **`ViewDef.abstaende`:** vorerst nicht ergänzt; `prozessgrenze` deckt den nächsten
  M4-Bedarf. Feld folgt, wenn der Geometrie-Generator es liest (M4).

### 🟡 Mittelfristig — M3 (Produktbrowser & Katalog) + gezielte Refactorings
- **Zentrales, exhaustives `PRODUCT_TYPES`-Register** (löst H1, H2, Reihenfolge-Dedup,
  KOMPLEMENT/KACHEL, Plural, `naviAchse`, `groessenLeiter`, `facettenDimensionen`,
  `primaryView`). `ProductType` auf offene ID + Wächter-Test.
- **Gruppenspezifische Größenleiter** (`konfektion/kopfweite/einheit/mass`) +
  `naechsteGroesse`/Facetten-Sortierung leiterabhängig.
- **Konfigurator-Refactoring** (verhaltensneutral): `textElement.ts` (Text-Erzeugung/
  Refit), `dragClamp.ts`, `useConfiguratorKeyboardShortcuts`, `reflow.ts`.
- **Performance:** `baueBaum` Debounce + Einpass; `berechneFacetten` Einpass ab Bedarf.
- **Verfahren/Personalisierung produktseitig durchsetzen** (MethodSwitcher-Filter,
  Validierung, MOQ/constraints).

### 🔵 Langfristig — M4/M5 & darüber
- **Geometrie-Rezept-Registry** (ersetzt `istAermel`; `flachteil`/`wickelflaeche`).
- **Modulare Multi-Lieferanten-Import-Pipeline** (ProductSource-Adapter → validate →
  normalize → dedup → image → geometry → generate).
- **Verfahrens-Registry** (`PrintMethod` offen) + **Element-Typ-Registry**
  (`ConfigElementType` offen — neue Personalisierungsarten rein per Daten).
  → Vorgehen, Reihenfolge und Anti-Kopplungs-Regeln für alle Merkmalsdimensionen
  (Farbe/Material/Veredelung/Personalisierung/Constraints) jetzt konsolidiert in
  **[ADR 0003 — Merkmals-Registry-Muster](adr/0003-merkmals-registry-muster.md)**
  (inkl. der jetzt-risikoarmen Vorarbeiten: `MATERIALIEN`-Dedup,
  `veredelungZuKostenart`, `realPhotoColorSet` views-getrieben, `effektiveConstraints`).
- **`ConfiguratorCanvas`** in `canvas/{LogoNode,TextNode,PrintAreaOverlay,Rulers}` +
  `useDecorationNode`.
- **Generisches Maß-/Attribut-Modell** (`SizeGuide` → `MassSchema`,
  `attributes: Record<string,…>`), numerische Facetten konfigurierbar.
- **Supabase**: `product_color_images(colorId, viewId, url)` statt 4 Bildspalten.

## 4. Pre-M3-Audit (M2.5 Batch C)

Zweites, bewusst ANDERS geschnittenes Audit (4 unabhängige Blickwinkel: Diff-
Korrektheit / Wächter-Lücken / M3-Readiness / frische Risikoarm-Suche →
adversariale Einzel-Verifikation jedes Umsetzungs-Kandidaten → Synthese). 25
Befunde, 9 real verifiziert. Ziel: Fundament vor M3 absichern und ehrlich
prüfen, ob der als „M2.5" geführte Working Tree wirklich verhaltensneutral ist.

### 4.1 Umgesetzt (verhaltensneutral, Grün-Gate bestanden: tsc/eslint/560 Tests/Build 175 Seiten)
- **Wächter (`printAreas.test.ts`):** Klassen-Alias-Merge – kein Alias-Schlüssel
  darf eine gemessene Produkt-ID überschreiben; jedes Alias-Ziel muss eine
  gemessene Fläche sein. Sichert die Import-Groundwork gegen fehlerhaften
  Generatorlauf (0 Kollisionen heute).
- **Wächter (`config/products/__tests__/index.test.ts`, neu):** katalogweite
  Produkt-ID-Eindeutigkeit + `getProduct`-Referenz-Round-Trip. Schützt den
  M2.5-`PRODUCT_BY_ID`-Vertrag gegen den stillen Map-Silent-Drop bei doppelter
  ID (bisher nur inzident über den Slug-Test gedeckt).
- **Wächter (`viewRegistry.test.ts`):** gesetzter `seamMarginCm` je Position ist
  positiv (aktiv konsumiert). `prozessgrenze` bewusst ausgeklammert (vakuum → M4).
- **Dedup (`PRODUCT_TYPE_ORDER`):** die 3× byte-identische Produktart-Reihenfolge
  (produktbaum `ARTFOLGE`, Startseite, `KategorieReiter`) zu EINER `readonly`-
  Konstante in `config/products/types.ts` zusammengeführt – zentraler Landeplatz
  für das spätere `PRODUCT_TYPES[type].order` (M3).

### 4.2 Zwei nicht-neutrale Working-Tree-Änderungen — Entscheidung angefragt
Kernergebnis des Audits: „M2.5 = byte-identisch" gilt nur JE Bestandsprodukt,
NICHT für den Working Tree als Ganzes. Zwei bewusste, aber falsch als „neutral"
etikettierte Änderungen liegen im uncommitteten Stand. Rückfrage an den Nutzer
gestellt; Handhabung unten (nicht-destruktiv bzw. offen).
- **B1 — 111 importierte Produkte sind live + SEO-Platzhalter-Leak.**
  `index.ts:53` verdrahtet `IMPORTIERTE_PRODUCTS` (111 Stück, alle
  `bildStatus:'fehlt'`) in `PRODUCTS` → 43→154. Katalogweite Aggregate ändern
  sich (Startseiten-Zähler, günstigster Preis/Facettenspannen, „Alle Produkte",
  Sitemap/StaticParams +111 Seiten). `repraesentativesBild` liefert nie falsy →
  `/_platzhalter/platzhalter.webp` landet in JSON-LD (`strukturierteDaten.ts:44`)
  und OpenGraph (`[slug]/page.tsx:66`) – Google-sichtbar, nach Indexierung nicht
  sauber reversibel.
  **Stand: OFFEN, aber neu gerahmt.** Die Platzhalter sind **temporär** – die echten
  Lieferantenbilder sind vorhanden, nur noch nicht vollständig importiert. Der
  eigentliche Fix ist daher der **Bildimport** (echte Lieferantenbilder über die
  Pipeline), **nicht** ein dauerhaftes `noindex`. `noindex bis bebildert` ist
  höchstens eine temporäre Brücke, falls vor dem vollständigen Bildimport live
  gegangen wird. Die Seite ist nicht deployt, der Leak also latent. Kein
  einseitiger außenwirksamer Eingriff; M3 hängt nicht daran. Siehe ADR 0003
  („Bilder gehören zum Import, nicht zur Produktdefinition").
- **B2 — ProduktBrowser-UX-Umstellung im Working Tree.**
  `ProduktBrowser.tsx` + `src/stores/browserStore.ts` (beide `M`) tragen über den
  gelisteten Perf-Hoist HINAUS eine nicht-neutrale, aber durchdachte UX-Änderung
  (Akkordeon „nur EIN Pfad offen" → Mehrfach-Aufklappen `offeneGruppe`→
  `offeneGruppen[]`, Geschwister-Filter entfällt, einheitliche Pfeillogik).
  **Stand: BEHALTEN** (Rückbau wäre die destruktive Option) und hiermit als
  eigenständiges Feature ausgewiesen – NICHT als „neutral". Die Persist-Migration
  ist verifiziert **sicher**: `zustand/persist` merged flach, `offeneGruppen`
  startet sauber als `[]` (kein Crash), der alte `offeneGruppe`-Schlüssel wird
  ignoriert (so auch im Store-Kopfkommentar dokumentiert). Beim V1-Commit als
  eigener Feature-Commit führen, getrennt vom neutralen M2.5-Anteil.

### 4.3 Weitere Audit-Befunde (dokumentiert, terminiert)
| Befund | Wann | Warum nicht jetzt |
|---|---|---|
| Naiver Plural `'{Label}s'` → „Jackes"/„Westen" ([slug]/page.tsx:362) | M3 | heute nie ausgelöst (vest 0, jacket 1); Zwischen-Record wäre Wegwerf-Schuld → direkt als `PRODUCT_TYPES.labelPlural` lösen |
| `geometrieRezept`-Vollständigkeits-Wächter | M4 | Presence-Guard jetzt nähme den bewusst offenen Freiheitsgrad wieder; kein Konsument liest das Feld |
| Capability-Wertebereich-Guard (`supportedMethods`/…/`constraints`) | M3 | 0 Produkte setzen, 0 lesen → heute vakuum-grün; nagelt offene M3-Semantik (`[]`) verfrüht fest |
| `prozessgrenze`-Positiv-Guard | M4 | keine Position setzt es → leere Iteration = Placebo |
| `useTranslate()`-Hook (t-Muster >20×, teils inkonsistent) | mittelfristig | rein mechanisch, aber Blast-Radius; als eigener PR terminieren, nicht unbegrenzt |
| `ansichtenVon`-Memo `Object.freeze` (in-place-sort-Schutz) | mittelfristig/M3 | kleiner Typ-Ripple (`readonly PrintView[]` an ViewSwitcher/LargePreviewModal) → nicht „jetzt" |
| **Präzisierung H1:** `baueBaum` verzweigt über ZWEI verdrahtete Achsen (Geschlecht **und** feste `ARTFOLGE`-Allowlist) – ein `productType` außerhalb `ARTFOLGE` fällt aus jedem Artknoten, wird aber in `gruppe.anzahl` mitgezählt | M3 | Teil des `PRODUCT_TYPES`-Registers |
| **Register-Vollständigkeits-Wächter** nach `ProductType`-Öffnung (dann `string\|undefined`-Lookups) | M3 | existiert erst nach der Öffnung → erster M3-Wächter |

**Bestätigt:** H1/H2 sind die VOLLSTÄNDIGE Menge stiller Datenverlust-Brüche für
Nicht-Kleidung; alle übrigen Kandidaten (Preis `per_position`/`per_cm2`, PDF/
E-Mail über `DECORATION_POSITION_ORDER`, `KOMPLEMENT` `Partial<Record>`, optionale
Facetten) degradieren sauber. Kein dritter Fatalbruch.

### 4.4 M3-Readiness-Urteil
Das architektonische Groundwork für M3 sitzt **vollständig und verifiziert**:
Ansichten end-to-end datengetrieben (`ansichtenVon` als einzige Laufzeitquelle),
Geometrie-/Capability-Felder additiv in der Registry, Preis-Engine und Shop-
Facetten registry-getrieben. Die einzige noch fehlende Kernstruktur ist das
zentrale `PRODUCT_TYPES`-Register + die `ProductType`-Öffnung – **genau der von
ADR 0002 §1 vorgesehene erste M3-Schritt**, kein unerwartetes Fundament. Startet
M3 mit dem Register (nicht mit dem `baueBaum`-UI-Umbau), droht kein
Mittendrin-Refactor. **Stand der zwei Working-Tree-Punkte (§4.2):** B2 behalten +
als Feature ausgewiesen (kein M3-Bezug); B1 bleibt bewusste, offene Go-live-
Entscheidung (kein M3-Bezug). M3 startet damit auf klarer, architektonisch
vollständiger Grundlage.

## 5. Asset-Block-Abschluss (Trennung Produktdef / Asset / Lieferant)

Vollständig umgesetzt + je Abschnitt grün-gegatet (tsc Haupt+Skripte, eslint,
601 Tests, Build 175 Seiten). Details in **ADR 0004**.

**Umgesetzt:**
- **Asset-Schicht** (`src/lib/assets`): Choke-Point + Manifest als einzige
  Bildpfad-Wahrheit; `images` aus `ProductColorConfig` entfernt → Produktdef trägt
  nur noch Farb-Identität (id/name/hex). Lieferant vom Produkt gelöst
  (`supplierRefs` in die Lieferantenschicht, Resolver `supplierRefVon`).
- **`SupplierId` geöffnet** (Registry-Muster): offene ID + fail-loud Resolver +
  Wächter-Test → neuer Lieferant rein additiv (Adapter + Tabelle + Registry-Zeile +
  Config), keine Kernlogik-Änderung.
- **Import-Pipeline entkoppelt:** Vertrag `RohProdukt`/`ImportQuelle`
  (`src/lib/import/rohProdukt.ts`) als einzige Lieferanten-Naht; zentrale Inferenz
  (`src/lib/import/produktInferenz.ts`, 11 Gate-Wächter) identisch für jede Quelle;
  `importiereProdukte.mts` = dünner Orchestrator über `IMPORT_QUELLEN`, **keine
  Sonderlogik**, datengetriebene Provenienz, `IMPORT_OUT_DIR` für Trocken-/
  Paritätsläufe. **Byte-Parität** per SHA-256 gegen den unveränderten Generator bewiesen.
- **SEO-Platzhalter-Filter (löst B1):** Platzhalter erscheinen in **keiner**
  externen Ausgabe – JSON-LD (`produktSchema`) + OpenGraph (`[slug]` + Twitter erbt)
  gefiltert, Sitemap ohne Bilder, `layout.tsx`-OG textbasiert; Wächter-Test gegen
  Platzhalter-Leaks. Interne UI (Kacheln/Farbwahl) zeigt weiter Platzhalter (zulässig).

**Neue Befunde dieser Sitzung (ehrlich dokumentiert, bewusst nicht erzwungen):**
- **Selbst-Referenz des Import-Generators:** er liest sein eigenes
  `facettenGeneriert.generated.ts` als Hand-Basis → **nicht idempotent** gegen den
  eigenen Facetten-Output; on-disk-Dateien sind eingefrorene Wahrheit. Auflösung
  (reine Hand-Basis) ist nicht byte-neutral → M4/M5.
- **`generatePrintAreaData.mts` stale:** liest das entfernte `colors[].images`
  (Zeile 411 f.) → kann nicht re-laufen; Angleichung an die Asset-Schicht +
  `rasterPfad`-Vereinheitlichung gehört zu **M4-Geometrie** (Regenerate aus Kontur).
- **tsc-Gate-Lücke:** Include `**/*.ts` matcht keine **`.mts`**-Skripte → Generatoren/
  E2E entgehen der Typprüfung. Import-Pipeline ist stattdessen über die extrahierten
  `.ts`-Module + Gate-Tests + Paritätslauf abgesichert. Globales `**/*.mts` erst nach
  Sanierung der stale-Skripte grün (M4/M5).
- **`bildStatus` ist load-bearing:** kein App-Leser, aber der Generator nutzt es als
  Idempotenz-Marke (Dedup) → bewusst behalten (früherer „write-only"-Vermerk korrigiert).

## 6. M4-Vollaudit — 36 adversarial verifizierte Befunde (7 Dimensionen)

Erschöpfender Multi-Agent-Audit (Größen, Canvas, Rendering, Store, Views, Preis,
Navigation/Performance), jeder Fund am echten Code gegengeprüft. **Kernurteil:**
Der Geometrie-/Positionierungs-/Größenleiter-**Kern ist generisch** (B1a/B1/B2 + die
`GROESSEN_LEITERN`-Registry, als sauber bestätigt). Die Restannahmen sitzen in
**Anzeige-/Schema-Schicht, Facetten und ein paar Skalierungs-/Wartungsstellen**.

### 6.1 Umgesetzt (byte-neutral, je Grün-Gate)
- **C3** Positions-Presets → View-Registry · **C6** Ruler-Referenz → Größenleiter.
- **Dead-Code + Kleidungsannahmen entfernt** (`types/index.ts`): toter Supabase-Mirror
  `Brand/Category/Product/ProductColor/ProductSize` (letzterer mit `imageFront/Back/SleeveL/R`),
  totes Einzelgrößen-`OrderSubmission`, totes Preisfeld `sizeThresholdCm2`; irreführenden
  Kopf-Kommentar („spiegeln Supabase") korrigiert.
- **`PrintArea`-Rename** `referenceGarmentHeightCm`/`movementWidthCm` → `boxHeightCm`/`boxWidthCm`
  (14 Dateien, tsc-verifiziert; Kleidungsvokabular aus dem Kern-Vertrag; Generator lieferte die
  neutralen Namen bereits, `printAreas.ts`-Mapping wird zur Identität).
- **`productsByType`-Index** (`produkteVomTyp`, Muster `PRODUCT_BY_ID`) → similar/recommendations
  ohne Vollscan · **`SummaryPanel`-Tooltip** generisch (kein Brust/Rücken/Ärmel) · **Katalog-
  Beschreibung** selbst-aktualisierend aus `PRODUCT_TYPES` (statt veraltender Kleidungsliste).

### 6.2 Byte-neutrale Optimierungen — dokumentiert, bei Katalogwachstum (kein Produktgruppen-Blocker)
Bewusst NICHT erzwungen: der Bestand ist sauber (O(1)-Indizes vorhanden), der Nutzen ist ein
konstanter Faktor bei sehr großem Katalog; teils Verhaltens-Nuancen (Objekt-Identität).
| Fund | Ort | Mechanismus |
|------|-----|-------------|
| Facetten-Skelett/Baum-Buckets vorberechnen | filter.ts:173, produktbaum.ts:113 | einmal je Prozess seeden (Muster `SPANNEN`/`ARTBILD`) |
| DTF/EMBROIDERY-Flächen einmal bauen | printAreas.ts:172 | Methode erst in `getPrintAreas` an die id hängen (Objekt-Identität ändert sich) |
| `materialKurz()` String-Sniffing → `MATERIAL_GRUPPEN` | produktbaum.ts:150 | Dedup; Badge-Text erst byte-verifizieren |
| Kategorie-Zeile im Mobil-Filter | FilterPanel.tsx:88 | mit Facetten-Dimensions-Registry (§6.5) lösen |

### 6.3 Material-Render-Rezept (mittel, Default = heutiges Textilverhalten)
`gewebeTextur()` (Leinwandbindung über jedem Logo) und `multiply`-Blend
(`istHellesTextil`) sind bedingungslose **Textil-Annahmen** (ConfiguratorCanvas.tsx:107/777,
fabricTexture.ts, garmentLuminance.ts). Fix: `materialTextur`/`blendPolicy` als
optionales Produkt-/Gruppenfeld (Default „gewebe"/„multiply-auf-hell" = bytegleich
für Textil, „keine"/„normal" für künftige Hartware). **Rein visuell, blockiert nichts.**

### 6.4 Preis-Engine (mittel, latente Korrektheit)
`calculatePrice` berechnet `per_position`/`per_logo`/`per_text` **doppelt** (manuell +
Engine) und isoliert Zuschläge per Subtraktion; `charges.perUnitVeredelung` wird NIE
konsumiert → ein NEUER Veredelungs-Regeltyp fiele **still aus dem Preis** (der Kommentar
„neuer Regeltyp wirkt automatisch" gilt dafür nicht). Heute grün (alle Regeln haben
`printView`), aber echter Fragilitäts-/Skalierungs-Hazard. Fix: `evaluateRules` gibt
Beträge je Topf zurück, `calculatePrice` konsumiert sie statt neu zu rechnen.

### 6.5 Bewusst offen bis zur ersten Nicht-Kleidungs-Produktgruppe (Placebo-Vermeidung)
**Wurzel-Cluster Maß/Größe:** `SizeGuide.measurements` fix `breiteCm/hoeheCm/aermelCm`
(types.ts:134) + Shirt-Silhouette-SVG + `fitRating` Pflichtfeld + i18n-Anatomietexte +
Produktseiten-Größentabelle (Duplikat, ohne i18n) + `RohGroessenmass` + printAreas.test-
Invariante (`maxWidthCm < Brustbreite`) + Größen-Facetten-Sortierung ohne Leiter +
`vokabular`-Konsument. → **Wurzel-Fix zuerst** (generisches Maß-Dimensions-Modell
`{size; werte: Record<dimId,number>}` + gruppenspezifische Silhouette + gemeinsame
Tabellenkomponente), aber erst mit realem Nicht-Kleidungsprodukt kalibrierbar.
**Facetten-Cluster:** `MENGEN_DIMENSIONEN` (kriterien.ts) + „Stoffgewicht"-Facette +
`FilterMenues`-Literallisten → Facetten-Dimensions-Registry je Gruppe (analog
`AKTIVE_ACHSEN`). **`TemplateToolPanel`** fixe front/back-Vorlagen → Vorlagen-Registry.
**C1/C2, C4, B3** (ADR 0005-Dispositionen).

## 7. Gesamtsystem-Audit (2. Runde, 6 Dimensionen, 26 verifizierte Befunde)

Zweiter Multi-Agent-Audit über das GANZE System (Datenmodell, Asset, Import, Supplier,
Rendering/SEO, Cross-Cutting). Die `dimensionsUebersicht` bestätigte die Kern-Registries
breit als sauber generisch (Typen/Views/Größenleiter/Navi/Asset-Auflösung/Supplier-
Onboarding/SEO-Kern). Die Funde sind Hygiene/Duplikate/stale Docs + zwei Architektur-Punkte.

### 7.1 Umgesetzt (byte-neutral, Grün-Gate)
- **Coverage-Skript-Bug:** `checkSupplierMappingCoverage.mts` las das ENTFERNTE `p.supplier?`
  (7. übersehener Konsument) → jedes Produkt galt als lieferantenlos; jetzt `supplierRefVon(p.id)`.
- **`CompareModal`** nutzt `getProduct()` (O(1)) statt `PRODUCTS.find`; **`OrderItemRecord.printMethod`**
  → `PrintMethod` (statt inline-Union); **`produktSchema`** zeichnet kein leeres `size:[]` mehr aus
  (Einheitsgrößen-defensiv); **CollectionPage-JSON-LD** generisch (kein Kleidungs-Listen-Literal).
- **2 stale Kommentare korrigiert:** `decorationPositions.ts` (behauptete feste `PrintView`-Aufzählung
  + Compiler-Vollständigkeit – falsch seit ADR 0001), `SupplierOrderPosition.colorName` (Adapter-
  Übersetzung – gilt seit dem Mapping-Refactor nicht mehr).
- **Generator-Reproduzierbarkeit:** committeter Sitzungs-GUID-`RAW_PATH` → repo-relativ
  (`scripts/import/products-raw.json`, Rohdaten mit-committed); Byte-Parität erneut bestätigt.
- **`bildpfad()`** als reservierte ADR-0006-Ablage-Konvention gekennzeichnet (kein toter Code).

### 7.2 Architektur-Befunde
- **`PrintMethod` bleibt bewusst eine geschlossene Union** (`'dtf'|'embroidery'`), obwohl alle anderen
  Achsen offen sind. Begründung (gegen Schein-Generalisierung): Die methodenspezifische **Kosten-
  Mathematik** (Flächenbelegung vs. Stichzahl: `selbstkosten.ts`, `pricingRules.ts`) ist NICHT
  daten-generalisierbar – eine 3. Methode braucht ohnehin ein eigenes Kostenmodell. Die geschlossene
  Union dokumentiert damit ehrlich die zwei realen Verfahren. **Offen/dokumentiert:** die Anzeige-
  Label sind als Ternär in ~5 Dateien dupliziert (bereits driftend: `DTF` vs `DTF-Transferdruck`) +
  brechen i18n (hartkodiertes Deutsch) → ein `methodLabel()`-Resolver (+ i18n-Vereinheitlichung) ist
  der saubere Dedup-Fix; verhaltensändernd (Copy/i18n), daher als eigener Abschnitt terminiert.
- **Asset-Manifest im Client-Bundle** (`assetManifest.generated.ts`, 765 KB): von `'use client'`-
  Konsumenten statisch importiert → landet im Client-JS (wie der ohnehin client-importierte Katalog).
  Heute latent (85 % identischer Platzhalter-String, gzip-stark), aber bei tausenden Produkten×Farben
  echtes Skalierungsleck. Fix: serverseitige Auflösung (RSC/Prop-Durchreichung) oder Manifest-Split/
  Lazy-Load. Größer/architektonisch → dokumentiert, an den Asset-/Bildimport-Meilenstein gekoppelt.

### 7.3 Terminiert (byte-neutral/klein, nicht Produktgruppen-blockierend)
`TYP_LABEL`-Dedup (Generator → `produktTypLabel`; mit nächstem Re-Import) · SEO-Platzhalter-Filter-
Helfer (2 Oberflächen, DRY) · `sitemap` `new Date()` → `aufgenommenAm` · Firmen-Tagline-Konstante ·
`generatePrintAreaData` Mehrfach-Dekodierung + `ladeProduktseite` Doppellauf (`cache()`) = Perf-Mikro
(Build-Zeit, dokumentierte Klasse) · `RohProdukt[]`-Laufzeitvalidierung im Import.

### 7.4 DB-/Skalierung (mittel, gemildert)
`ladeBeliebtheit()` aggregiert Roh-Bestellzeilen im Node-Speicher (90-Tage-Fenster, 1h-Cache) → wächst
mit dem Verkaufsvolumen; sauber wäre DB-seitiges `GROUP BY SUM` (RPC/View). Port bleibt gleich.

### 7.5 Bewusst offen — braucht reales Nicht-Kleidungsprodukt (Placebo-Vermeidung)
`CompareModal` textile Zeilen (Grammatur/Passform → Merkmals-Registry) · `[slug]` textiler Flächen-Text
(„Nähte/Kragen/Saum abgezogen") + Zwei-Verfahren-Copy (`supportedMethods`, nach M3) · `garmentImageInfo`
JPEG-Zweig (an den WebP-standardisierten Import gekoppelt). **Getrennt real, aber ohne echtes Produkt
nur spekulativ.** `CompareModal`-i18n der Label ist der einzige HEUTE (nicht-produktabhängig) fixbare
Teil davon → terminiert.

---

*Erstellt in M2.5. Quick Wins: Abschnitt 3. Asset-Block: Abschnitt 5 + ADR 0004.
M4-Konfigurator-Generalisierung: Abschnitt 6 + ADR 0005. Gesamtsystem-Audit: Abschnitt 7.
Bildpipeline: ADR 0006. Kontext: architektur-generische-produkte.md.*
