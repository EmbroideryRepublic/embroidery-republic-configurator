# ADR 0006 – Mehrquellen-Bildpipeline (Hersteller-Vorrang, needen-Fallback)

**Status:** **Infrastruktur ABGESCHLOSSEN** (source-agnostischer Kern gebaut, getestet,
auf echten Bestandsdaten reproduziert – 623 Tests grün). **Offen ist ausschließlich der
eigentliche Herstellerimport** (Marken-Adapter + Remote-Verarbeiter + Bericht auf v2) –
bewusst NICHT spekulativ vorgebaut, er braucht die realen Herstellerquellen. Siehe
„Umsetzungsstand" (abgeschlossen/verbleibt) unten.
**Kontext:** ADR 0004 (Asset-/Import-Architektur, Produktdef ohne Bildwissen),
Nutzerziel: **keine Platzhalter, wo echte Bilder existieren** — farbgenau, mit
Rück-/Seiten-/Detailansichten, Provenienz je Bild, Vollständigkeitsbericht.

## Empirischer Quellenbefund (verifiziert)

| Quelle | Bilder pro Farbe | Ansicht gelabelt | curl-skriptbar |
|--------|------------------|------------------|----------------|
| textil-grosshandel.eu | **nein** (generische Galerie, identisch für alle Farben; 40 Farben / ~12 Bilder; `setColor()` schaltet nur CSS) | nein | ja, aber ohne Farbbilder wertlos |
| needen.de | per-Farbe-URL `…/c<colorId>-<slug>` existiert, aber **server-HTML zeigt das Default-Foto**; farbspezifische Bilder laden **client-seitig per JS** | nur `thumbnail front`/`main`; Rest unbeschriftet (`margin-bottom-5`) | **nein** für Farbfotos |
| Herstellerseiten (B&C, Gildan, FOTL, SOL'S, Russell, Stedman, J&N, Neutral, Just Hoods) | **ja (Referenz)** – i. d. R. vollständiger, mit Rück-/Seiten-/Detail-/Lifestyle | i. d. R. **ja** (PIM-Labels) | quellenabhängig, je Adapter zu klären |

**Folge:** Verlässliche per-Farbe/per-Ansicht-Bilder erfordern die **Herstellerquellen**.
needen bleibt **Fallback** (per Browser-Adapter für per-Farbe-Fronten, wo Hersteller
fehlen). TG scheidet als Bildquelle aus.

## Architektur

### 1. `ImageSource`-Adapter-Vertrag (die einzige Lieferanten-Naht für Bilder)
Ein Adapter übersetzt eine beliebige Quelle in **Bild-Referenzen**; er lädt/verarbeitet
NICHTS selbst (das ist zentral). Rückgabe je Produkt:
```
ImageRef {
  colorId: string            // gemappt auf die Produktfarbe (über Hex/Name-Mapping)
  view: string               // front | back | sleeve_left | sleeve_right | side | …
  viewConfidence: 'gelabelt' | 'inferiert'   // NUR 'gelabelt' darf als back/side gelten
  rolle: 'ansicht-flach' | 'freisteller' | 'detail' | 'mockup' | 'lifestyle' | 'video' | …
  url: string                // Original-Bildquelle (höchste verfügbare Auflösung)
  quelle: string             // Provenienz-Label (z. B. 'gildan.eu', 'needen.de')
  prioritaet: number         // Hersteller < needen (kleinere Zahl = Vorrang)
}
```
**Wächter-Regel:** Ein `back`/`side`-Asset mit `viewConfidence:'inferiert'` wird
**verworfen** (nie geraten). `front` darf inferiert sein (Default-/Hauptbild).

### 2. Zentrale Pipeline (identisch für ALLE Quellen, keine Sonderlogik)
`ImageRef[]` aller Quellen → **Merge** je `(productId,colorId,view,rolle)`:
1. **Priorität**: Hersteller vor needen; bei Gleichstand höhere Auflösung/Qualität.
2. **Dublettenerkennung**: gleicher Content-Hash ODER (Quelle,ID) → einmal.
3. **Verarbeitung** (zentral, für alle gleich): Download → Normalisierung
   (`normalizeProductImages`) → webp + png-Geschwister → Content-Hash/Version.
4. **Asset-Store**: `public/products/<storageKey>/<view>.{webp,png}`; Zusatzmedien
   (freisteller/detail/lifestyle/…) unter Rollen-Pfaden – nie in der Produktdef.
5. **Manifest v2** (`assetManifest.generated.ts`): je Bild zusätzlich
   `{ quelle, rolle, viewConfidence, version }` (Provenienz). Rückwärtskompatibel:
   `views` bleibt die flache Ansichts-Map für den Konfigurator.
6. **Geometrie-Regenerate** (`generatePrintAreaData.mts`, bereits asset-schicht-fähig
   seit M4-B1a) für Produkte mit neuen Fronten.
7. **Validierung + Vollständigkeitsbericht**: je Produkt/Farbe → welche Ansichten
   vorhanden, aus welcher Quelle, welche beim Hersteller nachweislich fehlen.

### 3. Qualitätsmaßstab: Herkunft `original` > `generiert` > `platzhalter`
Qualität vor Menge. Reihenfolge je `(Farbe, Ansicht, Rolle)`, erzwungen in
`mediaMerge` (`AssetHerkunft`, im Test-Gate abgesichert):
1. **`original`** – echtes Herstellerfoto. Immer bevorzugt; je Farbe werden ALLE
   verfügbaren Ansichten übernommen (front+back mindestens, dazu side/sleeve/detail/
   lifestyle/… als eigene Rollen). Beliebig viele Medientypen je Produkt (offene `AssetRolle`).
2. **`generiert`** – hochwertige Visualisierung als **LETZTER Fallback**, NUR wenn nach
   gründlicher Prüfung bei KEINER offiziellen Quelle ein Original existiert (z. B. eine
   fehlende Rückansicht). Regeln (Wächter): ersetzt NIE ein Original; ist intern eindeutig
   `herkunft:'generiert'` gekennzeichnet; wird **automatisch** durch ein echtes Foto ersetzt,
   sobald verfügbar (Content-Hash-Erkennung); wird in **externen Ausgaben** (SEO/JSON-LD/
   OpenGraph) wie ein Platzhalter **ausgefiltert** – nie als echtes Produktfoto veröffentlicht.
   Grundsatz des Auftraggebers: **lieber vorübergehend nur die echte Vorderansicht** als eine
   schlechte/offensichtlich künstliche Rückansicht.
3. **`platzhalter`** bleibt NUR, wo nachweislich kein Original existiert **und** selbst eine
   hochwertige Visualisierung nicht überzeugend wäre. Kein stiller Rückfall; ein echtes Bild
   ersetzt Platzhalter/Generiert automatisch.

**Ehrliche Grenze (Generierung):** Diese Pipeline erzeugt selbst KEINE Bilder – kein Bildmodell,
und das Fälschen/Improvisieren von Produktfotos ist ausgeschlossen. Die Stufe `generiert` ist die
**architektonische Vorkehrung** (Status, Filter, Auto-Ersatz) für ein *dazu bestimmtes* Verfahren/
Werkzeug, das der Auftraggeber bereitstellt; die Pipeline nimmt dessen Output nur auf und
kennzeichnet ihn. Ohne ein solches Verfahren ist der Default für eine fehlende Rückansicht
**nur-Vorderansicht** (kein erfundenes Bild).

### 4. Skalierung / neue Lieferanten
Neuer Lieferant = **ein `ImageSource`-Adapter + sein Farb-/Produkt-Mapping**. Die
zentrale Pipeline, das Manifest, der Konfigurator und die Produktdefinition bleiben
unverändert. Beliebig viele Quellen werden pro Produkt/Farbe automatisch nach
Vollständigkeit + Qualität zusammengeführt.

## Umsetzungsstand (Vorbereitung, quellenunabhängig)

Die **quellenagnostischen** Teile sind gebaut + im Test-Gate abgesichert – nicht
spekulativ, weil sie reine, testbare Logik sind bzw. auf echten Daten laufen:
- ✅ **Adapter-Vertrag** `src/lib/import/imageSource.ts`: `BildReferenz`
  (`colorId/view/viewKonfidenz/rolle/quellUrl/quelle/prioritaet`), `AssetRolle`
  (offene ID inkl. Zukunftsmedien), `ImageSource`-Interface. Ein neuer Hersteller
  erfüllt genau dieses Interface + sein Farb-/Produkt-Mapping.
- ✅ **Zentrale Merge-Logik** `src/lib/import/mediaMerge.ts` (+ 5 Wächter-Tests):
  Hersteller-Priorität, **Konfidenz-Wächter** (geratene Rück-/Seitenansicht wird
  verworfen – nie geraten), Dublette je `(Farbe, Ansicht, Rolle)`, plus
  `farbVollstaendigkeit` für den Bericht. **Keine quellenspezifische Sonderlogik.**
- ✅ **Qualitäts-/Vollständigkeitsbericht** `scripts/assetVollstaendigkeitsbericht.mts`
  → `docs/asset-vollstaendigkeitsbericht.md` (Ist-Basislinie: 43 vollständig, 111 nur
  Platzhalter, 329/2282 Farben mit echtem Bild). Wächst mit jedem Importlauf.
- ✅ **Datenhygiene** (vom Bericht aufgedeckt): Markennamen-Dubletten `SOL´S`→`SOL'S`,
  `Stedman®`→`Stedman` normalisiert (`markeNormalisieren`, Generator + Bestand; nur
  Markenstrings geändert, verifiziert).

- ✅ **Content-Hash-Versionierung** `src/lib/import/contentHash.ts` (+ Tests): `hashHex`/
  `kurzHash`/`assetGeaendert` – Version = Hash der Bytes; Re-Import erkennt genau geänderte Assets.
- ✅ **Manifest-v2-Kern** `src/lib/import/manifestV2.ts` (+ Tests): `AssetV2`/`ManifestEintragV2`/
  `baueManifestEintrag` – volle Provenienz je Asset (view/rolle/herkunft/quelle/version/pfad),
  **rückwärtskompatibel** (`views`+`status` erhalten → Konfigurator/Resolver unverändert),
  Zusatzmedien in `assets` (nicht in `views`), Status real/generiert/platzhalter.

- ✅ **`resolveAsset`** (Rollen-Resolver über Manifest v2, `manifestV2.ts`, Original vor Generiert).
- ✅ **Zentrale Pipeline-Orchestrierung** `src/lib/import/pipeline.ts` (+ Tests): Quellen → Merge →
  Verarbeiter (injiziert) → Manifest v2 je Farbe, jede Farbe vertreten, KEINE quellenspezifische Sonderlogik.
- ✅ **„Bestand"-`ImageSource`** `src/lib/import/sources/bestand.ts` (+ Test) + `ImageSource`-Registry
  `imageSourceRegistry.ts` (neuer Hersteller = ein Eintrag). **Reproduktions-Nachweis auf ECHTEN Daten**
  (`scripts/assetPipelineReproduktion.mts`): 154 Produkte, 329 Farben, **1 316 Assets content-gehasht,
  0 `views`-Abweichungen** – die Pipeline bildet den Bestand verlustfrei ab.
- ✅ **Eingangs-Validierung** `src/lib/import/validierung.ts` (+ Tests): RohProdukt-/BildReferenz-Invarianten
  fail-loud (leere colors/sizes, unbekannte Farbe, fehlende URL, ungültiger hex).

**Verbleibt (braucht ECHTE Herstellerdaten – bewusst NICHT spekulativ vorgebaut):**
- **Remote-`Verarbeiter`** (Download → Normalisierung → webp/png → Content-Hash → Store) für
  Hersteller-URLs – umhüllt die bestehenden Skripte (`normalizeProductImages`, `convertGarmentWebpToPng`);
  am realen Import exerziert. Der Bestand-`Verarbeiter` (Identität + Hash) ist gebaut + bewiesen.
- **Hersteller-Adapter** (je Marke, ein Registry-Eintrag) + ihr Farb-/View-Mapping.
- **Qualitätsbericht auf Manifest v2** (Rollen/Provenienz/Version) – sobald v2-Daten aus echtem Import vorliegen.

## Offen (Eingang erforderlich – blockiert NUR den eigentlichen Import)
Die konkreten **Herstellerquellen je Marke** (Links/Feed/Media-Library-Zugang). Ohne sie
ist die per-Farbe/Rückseiten-Bebilderung nicht korrekt (nur ratend) erreichbar. Die
Adapter-Anbindung + der Importlauf sind dann der EINZIGE verbleibende Schritt.
