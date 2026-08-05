# ADR 0004 — Asset-/Import-Pipeline: Trennung von Produktdefinition, Lieferantendaten und Assets

- **Status:** akzeptiert (Design; Umsetzung byte-neutral gestaffelt ab sofort, Vollausbau M4/M5)
- **Datum:** 2026-08-05
- **Kontext:** [ADR 0001](0001-generische-druckansichten.md), [ADR 0002](0002-generisches-produktmodell.md), [ADR 0003](0003-merkmals-registry-muster.md), [haertung-analyse.md](../haertung-analyse.md)
- **Grundlage:** Vollständige Ist-Kartierung der Import-/Asset-/Supplier-Pipeline (4 Blickwinkel, unabhängig verifiziert, Datei:Zeile-belegt).

## Kontext

Produktbilder sind heute in die **Produktdefinition eingebrannt**: `ProductColorConfig.images`
(`config/products/types.ts:8`) hält konkrete Pfad-Strings wie `/products/<ordner>/front.webp`;
`colorHelpers.ts` baut diese Pfade aus einem `folder`-String, der (verifiziert) **exakt die
Produkt-ID** ist. Die Ordner-/Datei-/Format-Konvention (`front/back/sleeve-left/sleeve-right`,
`.webp`/`.png`-Geschwister, Anker-Ordner vs. `${id}-${colorId}`, `view_→view-`) liegt **~7-fach
dupliziert** (colorHelpers, ingestFotlImages, ingestSpreadshirtProduct, convertGarmentWebpToPng,
garmentImageInfo, generatePrintAreaData, normalizeProductImages, measureSwatchHexes, checkDuplicateImages).
Der Swatch-Hex wird aus den Foto-**Pixeln** gemessen (`measureSwatchHexes`), `bildStatus:'fehlt'`
lebt auf der Produktdef, ein Bildaustausch erzwingt das Umschreiben der Produktdefinition.

Das widerspricht dem Ziel: **Produktdefinition, Lieferantendaten und Assets sollen vollständig
getrennt sein.** Die Produktdefinition darf **nie** wissen, woher ein Bild stammt; ein Asset muss
austauschbar/neu-importierbar sein, ohne die Produktdefinition anzufassen; ein neuer Lieferant soll
nur Adapter + Mapping brauchen. Die aktuell sichtbaren **Platzhalter sind temporär** (der Bildimport
der 111 importierten Produkte ist offen) und dürfen **nie** als Endzustand verankert werden.

## Entscheidung — drei Schichten, je EIN Vertrag an der Grenze

### 1. Produktdefinition (`src/config/products/**`)
Führt ausschließlich **kanonische Identität + Sachdaten**: `productId`, `colorId` (+ Name, kanonischer
Hex), `views`, Preis, Material, Maße. **Keine** Bildpfade, **kein** Format, **kein** Store, **keine**
Bezugsquelle. Aufzulösen: `ProductColorConfig.images` (types.ts:8), `supplier?` am Produkt (types.ts:64),
`detailedDescription.supplierBrand` (types.ts:146). Die Produktdef nennt nur **`(productId, colorId, view)`**.

### 2. Asset-Schicht (neu: `src/lib/assets/**`)
Der **EINZIGE** Ort, der Ablage-Layout, Dateiname, `webp`/`png`-Geschwister, Platzhalter, Maße,
Provenienz und Version kennt. Bündelt, was heute verstreut liegt (`ansichtDatei`, `PLATZHALTER_BILD`,
`repraesentativesBild`, die `webp→png`-Ableitung in `garmentImageInfo.ts:69-80` **und**
`generatePrintAreaData.mts:346-348`). Kern:

```ts
// src/lib/assets
export interface AssetRef { productId: string; colorId: string; view: PrintView }
export interface AssetProvenance { supplierId: string; sourceUrl?: string; appearanceId?: string; importRun: string; importedAt: string }
export interface ResolvedAsset {
  url: string;         // Browser-URL (heute .webp)
  rasterUrl: string;   // Server-Render-Geschwister (heute .png) – kapselt garmentImageInfo
  status: 'real' | 'placeholder';
  version: string;     // contentHash bzw. Import-Lauf-ID
  source?: AssetProvenance; // NUR intern/Audit – der Produktdef nie exponiert
}
export function resolveAsset(ref: AssetRef): ResolvedAsset;
export function resolveColorImages(productId: string, colorId: string, views: PrintView[]): Record<PrintView, ResolvedAsset>;
export function assetVerfuegbarkeit(productId: string, colorId?: string): 'vorhanden' | 'fehlt';
```

**Alle** Leser gehen hier durch — UI (`ConfiguratorPrototype`, `ViewSwitcher`, `ProduktFarbwahl`,
`Produktkachel`, `CompareModal`), Server-Render (`renderPrintView.ts:44`), SEO (`strukturierteDaten.ts`,
`page.tsx`) und der M4-Geometrie-Generator (`generatePrintAreaData.mts:338-352`). Niemand baut Pfade selbst.

Gespeist wird der Resolver aus einem **generierten Asset-Manifest** (nicht handgepflegt), das je
`(productId, colorId, view)` `storageKey` + `contentHash` + Maße + Provenienz + `version` hält. Der
`storageKey` (z.B. `fotl-heavy-t-black`, inkl. Sonderfälle wie `fotl-ladies-vneck`) ist **resolver-privat**
und ersetzt die Ordner-Konvention aus `colorHelpers.ts`. **Der Platzhalter ist eine Resolver-Antwort**
(`status:'placeholder'`), kein eingebrannter Pfad: fehlt ein Manifest-Eintrag, liefert `resolveAsset()`
den neutralen Platzhalter — so kippen die 111 später von `placeholder` auf `real`, **ohne** dass
`importiert.generated.ts` angefasst wird.

### 3. Import-/Lieferanten-Schicht (`src/lib/suppliers/**` + `scripts/` + neu `ImportAdapter`/`ImageSource`)
Zwei **getrennte, parallele** Verträge:
- **Bestell-Adapter** (`SupplierAdapter.ts:43-83`) — Auswahlpläne/Selektoren, **bereits bildfrei**, bleibt so.
- **Beschaffung** — `ImportAdapter` (Rohquelle → kanonische Produktdef) + `SupplierImageSource`
  (Rohbild-Locator je `productId/colorId/view`):

```ts
export interface SupplierImageSource {
  readonly supplierId: SupplierId;
  locate(ref: AssetRef): Promise<RawImageLocator | null>; // NUR Ort, keine Verarbeitung
}
export type RawImageLocator =
  | { kind: 'remote';   url: string;  provenance: Record<string,string> }  // z.B. Spreadshirt-Fernabruf
  | { kind: 'incoming'; path: string; provenance: Record<string,string> }; // z.B. FOTL manuelle Ablage
```

Ein **EINZIGER geteilter Ingest-Prozessor** konsumiert den Locator (fetch/trim/resize auf **ein**
kanonisches Maß/Format, `webp`+`png`, Hash) und schreibt Asset-Store + Manifest. Damit werden
Spreadshirts hartkodiertes `JOBS`-Array und FOTLs manueller Handgriff je zu **Adapter + Daten über
einen Prozessor**; das kanonische Zielmaß löst die heutige Divergenz (620×720 vs. 700×840 vs. manuell) auf.

**Bild-Provenienz** (z.B. `spreadshirtmedia.net`) und **Bestell-Lieferant** (`textil-grosshandel`) sind
ausdrücklich **verschiedene Achsen** und liegen beide in Schicht 3, **nie** am Produkt.

### 4. Versionierung & Austauschbarkeit
Version lebt **im Manifest**, nicht im Dateinamen der Produktdef. Jeder Eintrag trägt `version` +
`contentHash` je `(productId,colorId,view)`. Austausch/Neuimport schreibt eine **neue** Version; der
Resolver zeigt danach darauf — die Produktdef wird nie berührt. Bausteine: content-hash-adressierte
Auslieferung (atomarer Austausch + Cache-Busting, kein In-place-Überschreiben), **getrennter Roh-Store**
(`raw/incoming`) bewahrt die **originalen Lieferantenbytes** (heute überschreiben `normalize`/`flip`/`trim`
die ausgelieferten Dateien → Rohbytes verloren), Provenienz je Version, **Rolle je Ansicht** (front-primär/
Detail/freigestellt) statt fixer 1:1-Spalten. `checkDuplicateImages` bleibt als quellenübergreifender
Provenienz-Wächter (sha256), künftig gegen das Manifest.

### 5. Offene Supplier-Registry (Voraussetzung für echte Additivität)
`SupplierId` ist heute eine **geschlossene Union** (`lib/suppliers/types.ts:22`), beide Registries sind
`Record<SupplierId,…>` — ein neuer Lieferant editiert 4 bestehende Dateien (typsicher, aber **nicht** rein
additiv). Um „neuer Lieferant = nur Adapter + Mapping" wörtlich zu erfüllen, wird die Union nach dem
Muster **ADR 0001/0002** (offene ID + Wächter-Test) zu einem geführten Register geöffnet. Bewusste
ADR-0004-Entscheidung, terminiert (nicht byte-relevant).

## 6. Zukunftssichere Asset-Typen (Medien, Rollen, Auflösungen, Varianten)

Die Architektur muss für **zehntausende Produkte, beliebig viele Lieferanten und
unterschiedliche Medien** tragen, ohne dass Produktdefinition oder Konfigurator je
umgebaut werden. Künftig sollen ergänzbar sein: mehrere Bildquellen, unterschiedliche
Auflösungen/Formate, Freisteller, Detailaufnahmen, Mockups, Stickvorschauen,
Druckvorschauen, Lifestylebilder, Videos und weitere Medien. Das leistet die
Asset-Schicht über **drei orthogonale Dimensionen** — die Produktdefinition kennt
KEINE davon:

- **Rolle** (offene ID, wie `PrintView`/`ProductType`): `ansicht-flach` (heutiges
  Produktfoto je Ansicht) · `freisteller` · `detail` · `mockup` · `stickvorschau` ·
  `druckvorschau` · `lifestyle` · `video` · … Neue Rolle = Registereintrag + Manifest-
  Feld, kein Kern-Eingriff.
- **Scope** (aus dem `AssetRef` abgeleitet): produktweit (Lifestyle, Video) · farbbezogen
  (Swatch) · ansichtsbezogen (Produktfoto). Bestimmt durch die gesetzten Felder.
- **Rendition** (Auslieferungsvariante): Auflösung/Format/`srcset`, vom Resolver für
  responsive Auslieferung gewählt — nicht von der Produktdefinition.

Erweiterter (rückwärtskompatibler) Vertrag:

```ts
export type AssetRolle = 'ansicht-flach' | 'freisteller' | 'detail' | 'mockup'
  | 'stickvorschau' | 'druckvorschau' | 'lifestyle' | 'video' | (string & {});
export interface AssetRef {
  productId: string;
  colorId?: string;      // fehlt bei produktweiten Medien (Lifestyle/Video)
  view?: PrintView;      // fehlt bei rollen ohne Ansichtsbezug
  rolle?: AssetRolle;    // Default 'ansicht-flach' (heutiges Verhalten)
  rendition?: string;    // Default 'full'
}
export interface ResolvedAsset {
  url: string; rasterUrl?: string;   // rasterUrl nur für rasterisierbare Bildrollen
  kind: 'image' | 'video';
  status: 'real' | 'placeholder';
  version: string;
  renditions?: Record<string, { url: string; width?: number; height?: number }>;
  source?: AssetProvenance;
}
```

Heute ist ausschließlich `rolle:'ansicht-flach'`, Scope ansichtsbezogen, `rendition:'full'`
belegt; alle anderen Rollen/Renditionen sind **reserviert und leer** — sie werden rein
über Manifest-Daten + Lieferant-`ImageSource` gefüllt, ohne Produktdef/Konfigurator
anzufassen. Der Konfigurator liest z.B. später `resolveAsset({productId,colorId,view,rolle:'druckvorschau'})`,
ohne zu wissen, woher die Vorschau stammt. **Kein** Mega-Datensatz am Produkt (Leitplanke
ADR 0003): Medien bleiben in der Asset-Schicht, indexiert über `(productId,[colorId],[view],rolle,rendition)`.

## Migrationspfad (bewusst byte-neutral gestaffelt)

**Jetzt-risikoarm, byte-neutral** (bereitet den späteren Bildimport vor, ohne Verhalten zu ändern):
1. ✅ **UMGESETZT — `lib/assets` als Choke-Point** (`src/lib/assets/index.ts`): `bildpfad` (Konvention),
   `PLATZHALTER_BILD`, `repraesentativesBild`, `rasterPfad` (`webp→png`) leben jetzt hier; `colorHelpers`
   delegiert + re-exportiert, `garmentImageInfo` nutzt `rasterPfad`. Byte-identisch verifiziert (Pfad-
   Spot-Check + Grün-Gate). **`generatePrintAreaData.mts` — ✅ auf die Asset-Schicht umgestellt (M4-B1a):**
   der Generator bezog seine Bild-Bytes bisher aus dem seit Schritt 4 ENTFERNTEN `colors[].images` (stale,
   nicht mehr lauffähig). Jetzt liefert **ausschließlich** die Asset-Schicht die Pfade
   (`bildFuerAnsicht(productId,colorId,view)`); ein Helfer `urlZuDateipfad` übernimmt das Existenz-Probing
   (png/webp) und **überspringt Platzhalter**, sodass bildlose Produkte keine Geometrie erhalten (sie erben
   sie per Klassen-Alias). `PRINTAREA_OUT` erlaubt Trocken-/Reproduktionsläufe ohne `src/`-Schreibzugriff.
   **Reproduktionsnachweis:** Re-Run gegen die 43 Echtfoto-Produkte → CR-normalisierter Inhalts-Hash
   **byte-identisch** zum eingefrorenen `printAreaData.generated.ts` (Rohdifferenz = nur CRLF↔LF des
   Header-Blocks, ein Editier-Artefakt; die Geometrie ist unverändert). Der eigene `bildPfad`-Existenz-Probe
   bleibt bewusst (reicher als der reine `rasterPfad`-Transform, weil er die real vorliegende Datei sucht).
   Die eigentliche **Rezept-Registry (B1)** ersetzt als Nächstes den `istAermel`-Fork. **Gate-Lücke (Härtung):** der
   tsc-Include `**/*.ts` matcht **keine `.mts`-Dateien** – alle `.mts`-Skripte (Generatoren, E2E) entgehen der
   Typprüfung; die Import-Pipeline ist stattdessen über die extrahierten `.ts`-Module (`src/lib/import/*` +
   Gate-Tests) und den Paritätslauf abgesichert. Ein globales `**/*.mts` im Include ist erst nach Sanierung
   der stale-Skripte grün möglich (M4/M5).
2. ✅ **UMGESETZT — Resolver-Naht** (`resolveColorImages`/`bildFuerAnsicht`/`repraesentativBildVon`):
   ALLE ~10 Bild-Konsumenten + 2 Tests gehen jetzt über die Asset-Schicht (productId, colorId, view);
   das lokale `repraesentativBild`-Duplikat in `vorladen.ts` entfernt.
3. ✅ **UMGESETZT — Asset-Manifest** (`src/lib/assets/assetManifest.generated.ts`, generiert von
   `scripts/generateAssetManifest.mts`): 154 Produkte, 2282 Farben, je `(colorId → {views, status})`.
   Die einzige Wahrheit über Bildpfade; von der Asset-Schicht gelesen.
4. ✅ **UMGESETZT — `images` aus `ProductColorConfig` ENTFERNT.** Die Produktdefinition trägt nur noch
   Farb-Identität (id/name/hex); die Helfer (`realPhotoColorSet`/`FrontBack`/`platzhalterFarbSet`)
   erzeugen keine Pfade mehr. 43 reproduzieren identische URLs (Spot-Check byte-identisch), die 111
   liefern Platzhalter als **Resolver-Antwort** (`status:'placeholder'`).
5. ⏳ **Teilweise:** `hasRealPhotos` (tot) ✅ entfernt; `assetVerfuegbarkeit()` ✅ ersetzt das
   App-Status-Wissen. `bildStatus:'fehlt'` bleibt – **Korrektur des früheren „write-only"-Vermerks:**
   der App-Runtime liest es nicht, **der Generator schon** (Idempotenz-Marke: er überspringt eigene
   Vorlauf-Ausgaben beim Dedup, sonst leert der 2. Lauf die eigene Datei). `bildStatus` ist damit
   **load-bearing** für die Pipeline und wird bewusst behalten; ein Ersatz (Manifest-`status`) koppelt
   Generator↔Manifest und gehört zu M4/M5.
6. ✅ **UMGESETZT — Import-Generator entkoppelt (gemeinsame Pipeline).** Der Vertrag `RohProdukt`/`ImportQuelle`
   (`src/lib/import/rohProdukt.ts`) ist die **einzige Lieferanten-Naht**: ein Adapter übersetzt sein
   beliebiges Quellformat (DOM/CSV/API/PIM) in `RohProdukt[]`, mehr nicht. Die **zentrale Inferenz**
   (`src/lib/import/produktInferenz.ts`: `idAusUrl`/`normSize`/`produktTyp`/`farbgruppeVon`/`materialGruppenVon`/
   `geschlechtVon`/`fitVon`/`passformVon`/`GEO_REP`/`TYP_LABEL`) läuft **identisch für jede Quelle** – im
   Test-Gate abgesichert (`__tests__/produktInferenz.test.ts`, 11 Wächter inkl. „jeder ProductType hat GEO_REP").
   `importiereProdukte.mts` ist jetzt ein dünner Orchestrator über eine **Quellen-Liste** (`IMPORT_QUELLEN`):
   **keine lieferantenspezifische Verzweigung**; Provenienz **datengetrieben** aus `quelle` (nicht mehr
   hartkodiert); `IMPORT_OUT_DIR` erlaubt Trocken-/Paritätsläufe ohne Schreibzugriff auf `src/`. **Paritäts-
   nachweis:** refaktorierter Generator erzeugt gegen dieselben Rohdaten byte-identische Ausgaben wie der
   unveränderte (SHA-256-Vergleich der 3 Dateien). *Nebenbei entfernt:* der seit ADR-Schritt 8 inerte
   Artikelnummern-Dedup (Produktdefinition trägt keine Artikelnummer mehr) und der ungenutzte `handGenders`.
   **Bekannte Kopplung (bewusst dokumentiert, nicht erzwungen):** der Generator liest sein eigenes
   `facettenGeneriert.generated.ts` als Hand-Basis (merged minus Delta) → er ist **nicht idempotent gegen
   den eigenen Facetten-Output**; die on-disk-Dateien sind die eingefrorene Wahrheit. Auflösung (reine
   Hand-Basis in `facetten.ts` ohne Delta) ist nicht byte-neutral und gehört zu M4/M5.
7. ⏳ **Offen —** `ingestSpreadshirtProduct` idempotent + `--dry` + Provenienz-Sidecar beim Ingest.
8. ✅ **UMGESETZT — Lieferant vom Produkt gelöst.** `supplier?` aus `ProductConfig` ENTFERNT; `supplierRefs.ts`
   per `git mv` in die Lieferantenschicht (`lib/suppliers/`) verschoben + Resolver `supplierRefVon(productId)`.
   Die 6 Konsumenten (Produktseite, SEO, Admin, `buildSupplierPositions`, 2 Tests) gehen darüber – die
   Produktdefinition kennt den Bezugslieferanten nicht mehr. Byte-neutral (Grün-Gate). *Bewusst behalten:*
   `detailedDescription.supplierBrand` (Herstellermarke „B&C"/„Gildan") = **fachliche** Produkteigenschaft
   (Anzeige „Artikelbeschreibung (…)"), keine Beschaffungsbeziehung.
9. ✅ **UMGESETZT — `SupplierId`-Union geöffnet** (Registry-Muster, ADR 0001/0002): `SupplierId = string`
   (`lib/suppliers/types.ts`); beide Registries bleiben `Record<SupplierId,…>` (=`Record<string,…>`),
   `getSupplierDescriptor`/`getVariantMap` sind jetzt **fail-loud** (klare Meldung statt stiller `undefined`),
   `coverage.ts` überspringt fehlende Maps defensiv. Ein neuer **Wächter** (`lib/suppliers/__tests__/registry.test.ts`)
   ersetzt die Compiler-Vollständigkeit: (a) Adapter- und Mapping-Registry decken exakt dieselben Lieferanten ab,
   (b) `descriptor.id===key`, (c) jede von einem Produkt genutzte `supplierId` ist registriert. Ein neuer
   Lieferant ist damit rein additiv (Adapter + Mapping-Tabelle + je 1 Registry-Zeile + Config), **keine**
   bestehende Typ-/Kernlogik-Datei wird geändert. Byte-neutral (Grün-Gate).

**Jetzt-risikoarm, NICHT byte-neutral** (bewusste, gewünschte Korrektur):
8. ✅ **UMGESETZT — SEO/JSON-LD/OpenGraph mit Platzhalter-Filter.** `produktSchema` (`strukturierteDaten.ts`)
   filtert Platzhalter-URLs aus dem `image`-Array; ein reines Platzhalter-Produkt zeichnet **gar kein** Bild
   aus (statt ein Platzhalterbild als Produktfoto zu behaupten). `generateMetadata` (`[slug]/page.tsx`) liefert
   kein Platzhalter-OpenGraph-Bild. Neuer **Wächter** (`strukturierteDaten.test.ts`): Platzhalter tauchen in
   **keinem** Produkt-JSON-LD auf. Die Sitemap emittiert keine Bilder (nur Seiten-URLs → Produktseiten bleiben
   indexierbar). Löst **B1** endgültig — kein `noindex`-Dauerzustand, sondern saubere Trennung „Seite indexierbar,
   Platzhalterbild nicht veröffentlicht". Der Zustand kippt automatisch auf `real`, sobald der Bildimport läuft.

**M4:** `SupplierImageSource` + geteilter Ingest-Prozessor · Bulk-Bildimport der 111 (= nur Einspeisen ins
Manifest) · **M4-Geometrie der 111 aus echter Kontur** neu erzeugen (heute Klassen-Übernahme `GEO_REP`) und
`version` mit der Print-Area-Version koppeln.

**M5:** DB-Ziel — eigene `assets`-Tabelle (`productId,colorId,view,role,version,storageKey,source,status`) +
**offene** `print_areas.view` (CHECK entfernen) statt der 4 festen Bildspalten (`0001_init.sql:44-47`,
`types/index.ts:76-79`) und der 4-View-CHECK-Beschränkung (`0001_init.sql:63`). Der inaktive 4-Spalten-Spiegel
bleibt inaktiv bis zur Migration.

## Lieferanten-Skalierbarkeit (Audit-Ergebnis)

Vollständiger Sweep von `src/lib/suppliers/**` + aller Konsumenten. **Für einen
browserbasierten Lieferanten ist die Schicht wirklich additiv** – keine
geschlossene Union, kein `switch`/`case` über Lieferanten-IDs, kein ID-Branching
in Kern- oder Konsumentencode; offene `SupplierId` überall geehrt, beide
Registries fail-loud + Wächter-Test. Sofort behoben (risikoarm): irreführende
„Compile-Vollständigkeit"-Kommentare beider Registries (jetzt auf den Wächter-Test
verweisend), 3 stale Pfad-Kommentare auf das verschobene `supplierRefs`.

**Zwei designte Erweiterungspunkte** greifen erst bei einem Lieferanten mit
**anderem Mechanismus** (nicht nur anderen Daten) – bewusst dokumentiert, nicht
vorab erzwungen (Netto-Neucode, nicht byte-neutral; umzusetzen beim Onboarding des
ersten solchen Lieferanten):
1. **Auth-Strategie statt uniformem User/Passwort.** Heute sind
   `SupplierCredentials {username,password}`, `credentialsEnv {username,password}`
   und `getSupplierCredentials` (registry.ts) auf Basic-Auth fixiert. Ein API-Key-/
   OAuth-/zertifikats-/auth-loser Lieferant braucht eine **getaggte Union**
   (`{kind:'basic'|…}`), pro Descriptor aufgelöst – die Auth-Art wandert damit in
   den (ohnehin pro-Lieferant existierenden) Registry-Eintrag.
2. **Submission-Strategie statt DOM-only.** `SupplierAdapter` + `AutomationPage` +
   `supplierWorker` kodieren einen festen Browser-Flow (`login→…→checkout`,
   `SupplierJobMode='prepare-cart'|'checkout'`). Ein REST/GraphQL/CSV/EDI-Lieferant
   passt nicht in `selectColor`/`addToCart`. Fix: „wie wird bestellt" hinter eine
   grobe Strategie (`submitVia:'browser'|'api'`) legen, die der Worker aus dem
   Descriptor wählt; der heutige DOM-Motor wird die `'browser'`-Strategie. Löst
   zugleich die implizite „gleicher Cart/Checkout-Flow"-Annahme.

Report-only/kosmetisch, kein Blocker: globales `AMBIGUOUS_COLOR_IDS`
(dependency-injectable, ggf. später pro `SupplierVariantMap`), `lieferant`-Freitext
in `einkaufspreise.ts` (optional als `SupplierId` typisieren + Test gegen `SUPPLIERS`).

## Überschneidung mit M4 (Geometrie) — erzwungene Reihenfolge

Die Druckflächen-Geometrie wird aus den **Bild-Pixeln** abgeleitet (`generatePrintAreaData.mts:338-352`
liest `colors[].images[view]`, misst die Kontur). Damit hängt jede Print-Area an einer **Asset-Version** —
keine aufzulösende, sondern eine **explizit zu machende** Kopplung: der `contentHash`/`version` im Manifest
ist das Signal „Geometrie gegen Asset-Version X berechnet → Asset jetzt Y → neu rechnen". Die 111 haben
heute **keine** echte Geometrie (Klassen-Übernahme `GEO_REP`); ihr Bildimport ist für M4 **nicht rein
additiv** — „Einspeisen" = Bild ins Manifest **UND** Geometrie-Regenerate. Reihenfolge: **Resolver-Naht
(jetzt) VOR** Bildimport; Ingest-Prozessor + `SupplierImageSource` (M4) speisen Asset-Store+Manifest; dann
M4-Geometrie der 111 aus echter Kontur; DB-`assets`- und `print_areas`-Tabellen (offene Views) **gemeinsam**
in M5.

## Konsequenzen / Leitplanken

- **Byte-Neutralität ist Pflicht** für jeden Vorbereitungsschritt (außer der bewussten SEO-Korrektur #8).
- **Keine erzeugten/improvisierten Bilder**, keine neuen Platzhalter als Dauerlösung.
- **Nicht anfassen:** die 43 Bild-Ordner + ihre Bytes (Architektur-Freeze), `public/buehne/`, der bereits
  saubere PNG/WebP-Split; den inaktiven 4-Spalten-DB-Spiegel **nicht** aktivieren (das zementierte die
  aufzulösende Kopplung).
- **Leitplanke ADR 0003:** Produktdefinition, Lieferant und Asset bleiben getrennt — kein Gott-Datensatz,
  keine Über-Kopplung.
