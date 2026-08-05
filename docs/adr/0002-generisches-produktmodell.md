# ADR 0002 — Generisches, datengetriebenes Produktmodell (Registries statt Kern-Kleidungslogik)

- **Status:** akzeptiert (Design; Umsetzung ab M3, Groundwork in M2.5)
- **Datum:** 2026-08-04
- **Kontext:** [haertung-analyse.md](../haertung-analyse.md), [ADR 0001](0001-generische-druckansichten.md)

## Kontext

M1/M2 haben die **Ansichten** vollständig datengetrieben gemacht (offene `PrintView`,
zentrale View-Registry, `ansichtenVon()`). Die Härtungs-Analyse zeigt: das übrige
kleidungsspezifische Wissen sitzt an wenigen Wurzeln (`ProductType`, `PrintMethod`,
`ConfigElementType`, Konfektionsgrößen, textile Attribute, 2-Rezept-Geometrie) — es
steckt im CODE, nicht in den Produktdefinitionen. Ziel: **jede** künftige Produktgruppe
rein über Konfiguration/Registry/Daten aufnehmbar, Kernlogik unberührt, Bestand
byte-identisch.

## Entscheidung

Das bereits bewährte Muster aus ADR 0001 (**offene ID + zentrale Registry + Resolver +
Wächter-Tests + produktseitige Deklaration**) wird auf alle verbleibenden Wurzeln
angewandt. Alle neuen Produktfelder sind **additiv und optional**; ohne Angabe gilt das
heutige Verhalten (Default = „Kleidung/konfektion/alle/global").

### 1. Zentrales `PRODUCT_TYPES`-Register (M3) — löst die meisten Rest-Befunde gemeinsam
```ts
export interface ProductTypeDef {
  labelSingular: string; labelPlural: string;   // ersetzt naives '{Label}s'
  order: number;                                 // EINE Reihenfolge (statt 3× ARTFOLGE/REIHENFOLGE)
  defaultViews: ViewId[];                        // Standard-Ansichtensatz der Gruppe
  primaryView: ViewId;                           // Repräsentativbild (statt fix images.front)
  naviAchse: 'geschlecht' | 'anlass' | 'einheit' | (string & {}); // steuert baueBaum (löst H1)
  groessenLeiter: string;                        // Verweis auf GROESSEN_LEITERN (löst H2)
  facettenDimensionen: string[];                 // welche Filter je Gruppe sinnvoll
  komplement: ProductType[];                     // Cross-Selling (Pflicht, ggf. leer)
  kachelText?: string; kachelFarbe?: string; hero?: boolean;
}
export const PRODUCT_TYPES: Record<ProductType, ProductTypeDef> = { /* Bestand: alle 'geschlecht'/'konfektion'/primaryView 'front' */ };
```
`ProductType` wird — wie `PrintView` — von der geschlossenen Union auf eine **offene ID**
umgestellt; ein Wächter-Test erzwingt für jede genutzte Gruppe einen Register-Eintrag
(Compile-Vollständigkeit → Test-Vollständigkeit, projektkonform).

### 2. Gruppenspezifische Größenleiter (M3)
```ts
type GroessenSkalaTyp = 'konfektion' | 'kopfweite' | 'einheit' | 'mass';
interface GroessenLeiter { id: string; typ: GroessenSkalaTyp; ordnung: readonly string[];
  referenz?: string; vokabular: { singular: string; plural: string }; metrik?: (label: string) => number; }
export const GROESSEN_LEITERN: Record<string, GroessenLeiter> = { 'konfektion-eu': { typ:'konfektion', ordnung: KONFEKTIONSGROESSEN, referenz:'M', vokabular:{singular:'Größe',plural:'Größen'} }, /* … */ };
// ProductConfig.sizeScale?: string  (Default 'konfektion-eu')
// groessenRang / naechsteGroesse strategisch je leiter.typ
```

### 3. Geometrie-Rezept-Registry (M4) — ersetzt die `istAermel`-Binärverzweigung
`ViewDef` trägt künftig die Geometrie-Semantik (additiv, ab M2.5 als optionale Felder):
```ts
type RezeptId = 'torso-zylinder' | 'oberarm-band' | 'flachteil' | 'wickelflaeche' | (string & {});
interface DecorationPositionDefinition { /* … */ geometrieRezept?: RezeptId;
  prozessgrenze?: { maxWidthCm: number; maxHeightCm: number }; abstaende?: { naht?: number; kopf?: number; saum?: number }; }
```
Der Generator wird rezept-agnostisch: `GEOMETRIE_REZEPTE: Record<RezeptId,(ctx)=>GeneratedArea>`;
der Kern-Loop iteriert über `product.views` und wählt das Rezept aus `viewDef(view).geometrieRezept`.
Jedes Rezept kapselt seine Konstanten (Flachteil ohne Kragen/Zylinderprojektion).

### 4. Produktseitige Fähigkeiten & Regeln (Felder ab M2.5, Durchsetzung M3+)
```ts
interface ProductConfig {
  supportedMethods?: PrintMethod[];              // ohne Angabe = alle (kein Verhaltenswechsel)
  allowedPersonalizations?: ConfigElementType[]; // ohne Angabe = alle
  constraints?: { minOrderQuantity?: number; maxElementsPerView?: number };
  quantityTierSet?: string;                      // benannte Mengenstaffel (Default = Standard)
}
```
Langfristig: **Verfahrens-Registry** (`PrintMethod` offen) und **Element-Typ-Registry**
(`ConfigElementType` offen, mit Preis-/Render-/Werkzeug-Metadaten je Typ) — neue Verfahren
und Personalisierungsarten (Sublimation, Name/Nummer/Monogramm/Patch) rein per Daten.

### 5. Generisches Maß-/Attribut-Modell (M3+)
`SizeGuide` → `MassSchema` (benannte Achsen key/label/einheit statt fix breite/höhe/ärmel);
textile Top-Level-Felder (`weightGsm`, `fit`) langfristig als Spezialfall eines generischen
`attributes: Record<string, AttributWert>`; numerische Facetten konfigurierbar (nicht fix „Stoffgewicht").

> **Weitergeführt in [ADR 0003 — Merkmals-Registry-Muster](0003-merkmals-registry-muster.md).**
> Eine Vier-Dimensionen-Analyse (Farbe/Material/Veredelung/Personalisierung+Constraints)
> hat das kanonische Sechs-Zutaten-Rezept, die Zwei-Hälften-Regel (Vokabular vs.
> Auflösung), die Orchestrierung-statt-Verschmelzung-Regel und eine normative
> Anti-Kopplungs-Liste festgeschrieben. Kernbefund: das Gemeinsame ist die
> **Choreografie**, nicht eine geteilte Datenstruktur – jede Dimension erhält ihre
> eigene Registry. `weightGsm` wird dort als erste Instanz einer generischen
> `NUM_ATTRIBUTE`-Registry eingeordnet.

## Begründung

- **Eine Wurzel, viele Befunde:** Das `PRODUCT_TYPES`-Register löst Navigation (H1),
  Größen (H2), Reihenfolge-Duplikation, Cross-Selling, Kacheln, Plural und
  Facetten-Auswahl **gemeinsam** — sie hängen alle an `ProductType`.
- **Konsistenz:** Dasselbe Muster wie bei den Views ist im Projekt bereits erprobt und
  getestet (Facetten-/View-Wächter).
- **Byte-Identität des Bestands:** Alle Defaults bilden das heutige Kleidungsverhalten ab.

## Konsequenzen / Migrationsreihenfolge
- **M2.5 (Groundwork, verhaltensneutral):** additive optionale Felder (`ViewDef`-Geometrie,
  `supportedMethods`/`allowedPersonalizations`/`constraints`), Registry-Positionen mit
  `flachteil`, Performance/Dedup-Quick-Wins. ✅ abgeschlossen (Batches A–C).
- **M3:** `PRODUCT_TYPES`-Register + offene `ProductType`-ID + Größenleiter + naviAchse
  + Facetten je Gruppe (löst H1/H2). Konfigurator-Refactorings. **In Umsetzung:**
  - ✅ **M3.1** Register angelegt (`config/products/productTypes.ts`); `PRODUCT_TYPE_ORDER`
    + Label-Resolver daraus abgeleitet; Wächter-Test. Byte-identisch.
  - ✅ **M3.2** `komplement`/`kachelFarbe`/`kachelText`/`hero`(+`heroBild`/`heroAlt`) ins
    Register überführt; die vier verstreuten Startseiten-/Produktseiten-Tabellen entfernt.
  - ✅ **M3.3** `ProductType` von geschlossener Union auf **offene ID** (`= string`, wie
    `PrintView`); Compiler-Vollständigkeit durch 12 Register-Wächter ersetzt; die rohe
    `PRODUCT_TYPE_LABELS`-Map durch den einzigen Resolver `produktTypLabel()` abgelöst.
  - ✅ **M3.4** Navigationsachsen-Registry (`config/products/naviAchsen.ts`);
    `baueBaum` iteriert `AKTIVE_ACHSEN` × Gruppen statt fest Herren/Damen/Unisex –
    **H1 gelöst**. `Hauptgruppe`/`gehoertZu`/`HAUPTGRUPPEN` (Gender-Hardcode) entfernt;
    Wächter: jede genutzte Achse registriert + JEDES Produkt in ≥1 Gruppe. Byte-identisch
    (baueBaum-Snapshot leer/Suche/Filter unverändert). **Offen für beliebige Achsen**
    (Einsatzgebiet, Saison, Zielgruppe, Hersteller …) rein per Registry-Eintrag.
    *Forward-Design:* Koexistieren später mehrere Achsen (Kleidung nach Geschlecht,
    Taschen nach Einsatzgebiet), erscheinen deren Gruppen heute flach nebeneinander;
    eine Achsen-Gruppierung/-Umschaltung in der UI (Feld `NaviAchsenDef.label` ist dafür
    schon da) ist eine bewusste M5-UX-Entscheidung, keine Architekturänderung.
  - ✅ **M3.5** Größenleiter-Registry `GROESSEN_LEITERN` (typisiert: konfektion/
    kopfweite/einheit/mass) in `config/products/groessen.ts`; `naechsteGroesse` wählt
    die Strategie nach Leiter-Typ, `groessenLeiterVon(p)` löst Produkt→Leiter auf
    (`sizeScale`-Override → Typ-Leiter → Konfektion). **H2 gelöst:** Einheitsgrößen
    verlieren beim Wechsel keine Menge mehr. `ProductConfig.sizeScale?` ergänzt.
    Wächter: jede deklarierte Leiter registriert + explizite Einheits-/Maß-Strategie-
    Tests. Byte-identisch (uebernehmeAuswahl über 144 Produktpaare unverändert).
  - ✅ **M3.6a** `labelPlural` konsumiert: `produktTypLabelPlural()`-Resolver ersetzt das
    naive `'{Label}s'` – bewusste Korrektur „Jackes"→„Jacken", „Westes"→„Westen" (per
    Test belegt). Merkmals-Vorarbeiten (Block M3.x): Facetten-Vokabular-Dedup +
    views-getriebene Bildlogik byte-neutral umgesetzt (siehe ADR 0003).
  - 📄 **M3.6b — analysiert, bewusst zu M5 verschoben (Design dokumentiert).**
    `facettenDimensionen` je Gruppe, `primaryView` und die generische numerische
    Facette (`NUM_ATTRIBUTE`, ersetzt die feste „Stoffgewicht"-Dimension) haben für
    den **durchgängig textilen** Bestand **keine sichtbare Wirkung** (alle Dimensionen
    relevant, alle Produkte `primaryView:'front'`). Eine Verdrahtung jetzt wäre
    byte-identisch, aber wirkungslos (Placebo). **Design:** die Filterleiste
    (`FilterSeitenleiste`/`filter.ts`) zeigt je gewählter Gruppe nur deren
    `facettenDimensionen` (Union über die Treffer); `repraesentativesBild` bevorzugt
    `PRODUCT_TYPES[type].primaryView`; die numerischen Facetten kommen aus
    `NUM_ATTRIBUTE`. Feld + Verdrahtung + Wächter-Test landen **gemeinsam mit der
    ersten Nicht-Kleidungsgruppe (M5)** – dann mit echter Wirkung. Siehe ADR 0003.
  - ✅ **M3.7** Cleanup (tote Exporte `groessenIndex`/`naviAchsenDef` entfernt) + volles
    Grün-Gate + ehrliche Gesamtbewertung: **[m3-abschlussbewertung.md](../m3-abschlussbewertung.md)**.
    **M3 abgeschlossen** (M3.6b bewusst zu M5 verschoben, Design dokumentiert).
- **M4:** Geometrie-Rezept-Registry + modulare Import-Pipeline. Dort auch **Laufzeit-
  Validierung** der Produktdaten (productType ∈ Register) beim Import – heute fängt das
  der Wächter-Test, weil Produkte noch Code-definiert sind; bei Lieferanten-Import muss die
  Prüfung an die Import-Grenze wandern (fail-fast statt still).
- **M5:** Erste Nicht-Kleidungsgruppen (bag/apron) rein über Daten.
- **Wächter-Tests** sichern jede Öffnung ab (Registry-Vollständigkeit, gültige Referenzen).
