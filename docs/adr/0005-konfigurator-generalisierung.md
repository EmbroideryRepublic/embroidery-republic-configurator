# ADR 0005 – Konfigurator-Generalisierung & Geometrie-Rezept-Registry (M4)

**Status:** in Arbeit (B1a + B1 umgesetzt & byte-verifiziert)
**Kontext:** ADR 0001 (offene View-IDs), ADR 0002 (Registry-Muster/Views), ADR 0003
(Merkmals-Registry), ADR 0004 (Asset-/Import-Pipeline). Ziel unverändert: jede
zukünftige Produktgruppe (Tasche, Schürze, Cap, Beanie, Handtuch, Decke, …) wird
**ausschließlich über Registrys, Resolver, Geometrie-Rezepte und Daten** integriert –
ohne Eingriff in die Kernlogik.

## Auditbefund (M4-Start)

Systematischer Audit des gesamten Konfigurators (Store, Canvas, Rendering, View-/
Navi-/Größen-Registries, Preis-Engine, Build-Skripte) auf **implizite Kleidungs-
annahmen** (Vorderseite/Rückseite/Ärmel/Torso/Druckflächen/klassische Textilien).

**Kernergebnis:** Der **Runtime**-Konfigurator ist bereits weitgehend datengetrieben
und verifiziert generisch – die Canvas-Geometrie rechnet über eine generische
`PrintArea` (Prozentbox + cm), Views/Navi/Größen laufen über offene IDs + Registries,
die Preis-Engine degradiert bei unbekannten Views sauber (0-Aufschlag statt Absturz).
Die Kleidungsannahmen **clustern**:

| Ort | Annahme | Mechanismus | Status |
|-----|---------|-------------|--------|
| `generatePrintAreaData.mts` `istAermel`-Fork + `VIEWS`-Literal | Rumpf + 2 Ärmel | Rezept-Dispatch nach `geometrieRezept`; `VIEWS` aus Katalog | ✅ **B1** |
| ebd. Bildquelle `colors[].images` | Produktdef trägt Pfade | Asset-Schicht (`bildFuerAnsicht`) | ✅ **B1a** |
| ebd. `PROZESSGRENZE` lokal dupliziert | — | `prozessgrenze` aus View-Registry lesen | ✅ **B2** |
| `ElementToolbar` Brust-Presets + `-front`-Sniff | Kleidungs-Presets | Presets ins View-Registry (`DECORATION_POSITIONS[view].presets`) | ✅ **C3** |
| Ruler-Fallback `size==='M'` | feste Referenzgröße | `groessenLeiterVon().referenz` aus Größenleiter-Registry | ✅ **C6** |
| `importiereProdukte.mts` `GEO_REP` | Views aus Kleidungs-Rep | `GEO_REP`-Eintrag je Gruppe (Daten) | ⏸️ **B3 – bewusst offen** |
| `SizeGuideModal` + `SizeGuide`-Typ | Shirt-Silhouette, 3-Feld-Maßmodell | Maß-Schema + Silhouette je Größenleiter/Gruppe | ⏸️ **C1/C2 – bewusst offen** |
| `repraesentativesBild` `front`-Präferenz | Vorderseite existiert | `primaryView` einfädeln | ⏸️ **C4 – bewusst offen** |
| Store-Init `activeView:'front'` | — | transienter Bootstrap, wird reconciled | ✅ **C5 – bereits generisch** |

### Dispositionen der bewusst offenen Punkte (kein Placebo)

- **C1/C2 (Größentabelle):** Der Modal ist bereits teilgenerisch – **Breite/Höhe** gelten
  für jede Gruppe (Tasche/Handtuch/Decke), die **Ärmelspalte** ist konditional (`hasAermel`).
  Die volle Generalisierung braucht (a) ein **flexibles Maßmodell** (beliebige Dimensionen
  statt fix breiteCm/hoeheCm/aermelCm – eine Tasche misst L×B×H, eine Cap den Kopfumfang) und
  (b) eine **gruppen­spezifische Silhouette**. Beides ist ohne ein reales Nicht-Kleidungs­produkt
  nur **spekulativ** (Schema mit ausschließlich Kleidungsdaten, Silhouetten ohne Vorbild) und
  zöge invasiv durch Typ → Generator → Canvas → Tests. **Bewusst offen bis zur ersten realen
  Nicht-Kleidungs-Produktgruppe**, dann kalibriert umgesetzt.
- **C4 (Repräsentativbild):** `primaryView` existiert im `PRODUCT_TYPES`-Register, wird aber in
  `repraesentativesBild` (lib/assets) noch nicht genutzt. Ein Einfädeln koppelt die Asset-Schicht
  an den Produktkatalog (Typ→primaryView) oder verlangt einen Parameter an allen Aufrufern.
  **Nutzen entsteht erst bei Nicht-`front`-Produkten** (die mit dem Bildimport kommen) → **bewusst
  offen, gebündelt mit dem Asset-/Medien-Meilenstein**. Byte-neutraler heutiger Effekt = null
  (alle Produkte haben `front`).
- **B3 (`GEO_REP` je Gruppe):** `GEO_REP` ist bereits ein offener `Record<ProductType,string>` –
  eine neue Gruppe ist additiv (Eintrag + repräsentatives Produkt). Heute Einträge für Nicht-
  Kleidung anzulegen wäre Placebo (kein reales Produkt). **Bewusst offen bis zur Gruppe.**

## Entscheidung: Geometrie-Rezept-Registry (B1) – rezept-getrieben, fail-loud, ohne Placebo

Der Druckflächen-Generator bestimmt die Geometrie-Behandlung einer Ansicht jetzt
**datengetrieben** über `DECORATION_POSITIONS[view].geometrieRezept` statt über
hartkodierte View-IDs (`view === 'sleeve_*'`). Das Vokabular existiert bereits
(`RezeptId = 'torso-zylinder' | 'oberarm-band' | 'flachteil' | 'wickelflaeche' |
(string & {})`, ADR 0002 §3).

**Bewusst KEINE Placebo-Geometrie:** Es werden nur die zwei **real genutzten**
Rezepte implementiert (`torso-zylinder` = Rumpf, `oberarm-band` = Ärmel); sie
reproduzieren die bisherige Behandlung **byte-identisch**. `flachteil`/`wickelflaeche`
sind **fail-loud** (klarer Fehler), bis ein reales Produkt sie führt – ihre Geometrie
würde ohne echte Kontur geraten. So landet eine neue Ansicht nie still im Torso-Pfad,
und die eigene Strategie wird **kalibriert mit dem ersten realen Produkt** ergänzt
(dann additiv, ohne Kernänderung). Die volle Extraktion je Rezept in eigene
Strategie-Funktionen folgt zu diesem Zeitpunkt (heute wäre sie unkalibrierbar +
riskant ohne Mehrwert).

`VIEWS` ist zusätzlich **aus dem Katalog abgeleitet** (`sortierePositionen` über die
Vereinigung der `product.views`) statt hartkodiert – neue Ansichten fließen damit
automatisch in die Generierung ein.

## Verifikationsmethode: Reproduktions-Experiment (byte-neutral gestaffelt)

Der Generator ist ein **Build-Skript**; sein Output `printAreaData.generated.ts` ist
eingefroren (die 111 bildlosen Produkte erben Geometrie per Klassen-Alias, nur 43
Echtfoto-Produkte werden vermessen). Jeder Schritt wird gegen den eingefrorenen Output
**byte-verifiziert**, ohne die Runtime-Datei anzufassen (`PRINTAREA_OUT` → Temp):

- **B1a** (Asset-Schicht-Anbindung): CR-normalisierter Inhalts-Hash **identisch**
  (`1eb0a41e…`). Rohdifferenz = nur CRLF↔LF des Header-Blocks (Editier-Artefakt; die
  Zeilenenden normalisieren sich beim nächsten echten Regenerate auf LF – kosmetisch).
- **B1** (Rezept-Dispatch + abgeleitete `VIEWS`): Inhalts-Hash **weiterhin identisch**.

Erst nach erbrachtem Nachweis wurde die Rezept-Logik eingeführt (Wunsch des
Auftraggebers: Nachweis **vor** Registry).

## Konsequenzen / Leitplanken

- **Runtime byte-neutral:** die eingefrorene `printAreaData.generated.ts` bleibt
  unberührt (`b1f7db…`); der Generator reproduziert sie inhaltlich exakt.
- **Fail-loud vor still-falsch:** unimplementierte Rezepte werfen – kein stilles
  Fehlvermessen einer neuen Produktgruppe.
- **Kein Placebo:** Strategien werden erst mit realem, kalibrierbarem Produkt ergänzt.
- **Gate-Lücke bekannt (ADR 0004):** `.mts`-Skripte sind nicht im tsc-Include; B1/B1a
  sind stattdessen über den Reproduktionslauf + die im Gate getesteten `src/`-Module
  abgesichert.

## Umgesetzt (byte-neutral, je Grün-Gate)

**B1a · B1 · B2** (Geometrie-Generator vollständig generalisiert) · **C3** (Positions-Presets
datengetrieben aus dem View-Registry) · **C6** (Ruler-Referenzgröße aus dem Größenleiter-Registry) ·
**C5** (Startansicht war bereits generisch).

## Bewusst offen (mit Begründung, siehe „Dispositionen")

**C1/C2** (Größentabelle-Maßmodell/Silhouette), **C4** (`primaryView`-Bild), **B3** (`GEO_REP`
je Gruppe) – jeweils erst mit der ersten realen Nicht-Kleidungs-Produktgruppe bzw. dem Asset-/
Medien-Meilenstein, um Placebo (unkalibrierte Schemata/Silhouetten/Einträge) zu vermeiden.
Ebenso: volle Strategie-Extraktion `flachteil`/`wickelflaeche` im Geometrie-Generator +
Geometrie-Regenerate aus echter Kontur (M4/M5).

## Abschlussbewertung M4 (nach 14-Agenten-Vollaudit, 36 verifizierte Befunde)

### Vollständig generisch (neue Gruppe = Daten/Registry, keine Kernänderung)
- **Geometrie/Druckflächen:** Generator rezept-/registry-/asset-getrieben (B1a/B1/B2),
  fail-loud für nicht implementierte Rezepte. Canvas rechnet über generische `PrintArea`
  (jetzt neutral benannt: `boxWidthCm/boxHeightCm`).
- **Ansichten & Positionen:** offene `PrintView`/`ProductType`, `DECORATION_POSITIONS`
  (inkl. Presets, Prozessgrenzen, Rezept je View), `ansichtenVon`-Resolver.
- **Größenleiter-Kern:** `GROESSEN_LEITERN` + `groessenLeiterVon` + `naechsteGroesse`
  (konfektion/kopfweite/einheit/mass) – als sauber bestätigt.
- **Navigation & Preis-Kern:** `naviAchsen`/`baueBaum`, Preis-Engine (unbekannte Views →
  0-Aufschlag statt Absturz), O(1)-Indizes (`PRODUCT_BY_ID`, `produkteVomTyp`).

### Bewusst offen — erst mit dem ersten realen Nicht-Kleidungsprodukt (Placebo-Vermeidung)
Diese Punkte sind **additiv** (keine Architekturänderung), aber ohne echtes Produkt nur
spekulativ kalibrierbar; sie MÜSSEN mit der ersten neuen Gruppe mitgezogen werden:
- **Größentabellen-Anzeige** (`SizeGuide`-Maßmodell fix `breite/höhe/ärmel`, Shirt-Silhouette,
  `fitRating`, Produktseiten-Duplikat) → flexibles Maß-Dimensions-Modell + Silhouette je Gruppe.
- **Facetten-Dimensionen** (`MENGEN_DIMENSIONEN`, „Stoffgewicht"-Facette) → Dimensions-Registry
  mit Gruppen-Geltung (analog `AKTIVE_ACHSEN`). Bis dahin zeigt eine neue Gruppe irrelevante
  Kleidungsfilter (harte Blockade = nein, UX-Degradation = ja).
- **Vorlagen** (`TemplateToolPanel` fix front/back) → Vorlagen-Registry (neue Gruppe = 0 Vorlagen,
  degradiert sauber). **C1/C2, C4, B3.**

### Bewusst nicht generalisiert (kein Nutzen im Scope)
- **Material-Textur/Blend** (`gewebeTextur`/`multiply`): korrekt für ALLE geplanten Gruppen
  (Tasche/Schürze/Cap/Beanie/Handtuch/Decke sind textil); nur nicht-textile Hartware bräuchte
  ein Material-Render-Rezept → verschoben bis solch ein Produkt existiert.

### Langfristige Risiken (dokumentiert)
- **Asset-Manifest im Client-Bundle** (765 KB, von `'use client'`-Konsumenten importiert; wächst mit
  Produkten×Farben): serverseitige Auflösung/Split nötig, an den Asset-Meilenstein gekoppelt (§7.2).
  Das größte reale Skalierungsleck – heute latent (85 % Platzhalter, gzip), langfristig ernst.
- **Preis-Engine:** `charges.perUnitVeredelung` wird nicht konsumiert → ein NEUER Veredelungs-
  Regeltyp fiele still aus dem Preis (heute grün, Fix-Mechanismus in Härtungsdoku §6.4).
- **`PrintMethod` bewusst geschlossen** – die methodenspezifische Kosten-Mathematik ist nicht
  daten-generalisierbar; die geschlossene Union ist die ehrliche Grenze (keine Schein-Öffnung). §7.2.
- **`ladeBeliebtheit`** aggregiert Bestellzeilen im Node-Speicher (gemildert: 90-Tage-Fenster + 1h-Cache;
  sauber wäre DB-`GROUP BY`). §7.4.
- **`.mts`-Skripte außerhalb des tsc-Gates** (ADR 0004) – über Reproduktionsläufe + Gate-Tests
  abgesichert, aber nicht compilergeprüft.
- Perf-Mikro-Optimierungen (Härtungsdoku §6.2/§7.3): konstante Faktoren, erst bei sehr großem Katalog.

### Urteil
Das **Fundament trägt.** Eine neue **textile** Produktgruppe (Tasche/Schürze/Cap/Beanie/
Handtuch/Decke) ist über Registrys/Resolver/Rezepte/Daten integrierbar – die Kernlogik
(Geometrie, Positionierung, Ansichten, Größenleiter, Navigation, Preis) bleibt unangetastet.
Die offenen Punkte sind **additive Anzeige-/Facetten-Generalisierungen**, bewusst an das erste
reale Produkt gekoppelt, um Schein-Abstraktionen zu vermeiden – KEINE fundamentalen Baustellen.
M4 ist damit funktional/architektonisch abgeschlossen; die Anzeige-Schicht wird beim ersten
Nicht-Kleidungsprodukt kalibriert nachgezogen.
