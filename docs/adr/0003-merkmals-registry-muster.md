# ADR 0003 — Merkmals-Registry-Muster (kanonisches Vorgehen zum Öffnen einer Produktdimension)

- **Status:** akzeptiert (Design + laufende Umsetzung)
- **Datum:** 2026-08-04
- **Kontext:** [ADR 0001](0001-generische-druckansichten.md), [ADR 0002](0002-generisches-produktmodell.md), [haertung-analyse.md](../haertung-analyse.md)
- **Grundlage:** Vier-Dimensionen-Design-Analyse (Farbe · Material · Veredelungsverfahren · Personalisierung/Constraints), unabhängig verifiziert.

## Kontext

Nach dem Öffnen von `PrintView` (ADR 0001) und `ProductType`, der Navigationsachse
und der Größenleiter (ADR 0002 / M3) zeichnet sich dasselbe Vorgehen mehrfach ab.
Eine Analyse über vier weitere Dimensionen bestätigt: es gibt **ein** wiederkehrendes
Muster – aber der häufigste Fehler wäre, daraus **eine geteilte Datenstruktur** zu
machen. Der Auftraggeber hat das ausdrücklich als Leitplanke gesetzt: *„Fachlich
unterschiedliche Konzepte sollen technisch getrennt bleiben; übertriebene
Generalisierung, die neue Kopplungen schafft, ist zu vermeiden."*

Dieses ADR hält das kanonische Vorgehen fest, damit jede künftige Dimensions-Öffnung
eine Checkliste hat und **nicht** Richtung Mega-Modell driftet.

## Entscheidung

### 1. Das Sechs-Zutaten-Rezept

Eine Produktdimension wird geöffnet, indem – und nur indem – diese sechs Zutaten
umgesetzt werden:

1. **Offene ID** statt geschlossener Union (`type X = string`, ggf. mit `(string & {})`-Autocomplete).
2. **Zentrale Registry** als Single Source (`Record<XId, XDef>` an einem Ort).
3. **Resolver-Funktion(en)** – der einzige Zugriffsweg; defensiv (Fallback oder Fail-Loud).
4. **Typ-/produktseitige Deklaration** (das Produkt/die Produktart nennt seinen Wert).
5. **Wächter-Tests statt Compiler-Vollständigkeit** (jede genutzte ID MUSS registriert sein).
6. **Default = heutiges Verhalten** (ohne Angabe gilt der Bestand → byte-identisch).

**Das Gemeinsame ist diese CHOREOGRAFIE, nicht eine geteilte Datenstruktur.** Jede
Dimension bekommt ihre **eigene** Registry/Resolver/Wächter. Es gibt bewusst **keine**
generische „Dimension"-Abstraktion.

### 2. Zwei entkoppelbare Hälften – wende nur die passenden an

- **Vokabular-Hälfte** (offene ID + Registry + Wächter): nur dort, wo eine
  **wachsende, aufzählbare ID-Menge** existiert (Material-Gruppen, Veredelungen,
  Personalisierungsarten, Produktarten, Views).
- **Auflösungs-Hälfte** (Resolver + produktseitige Deklaration + Default=heute):
  überall, wo eine **produktseitige Übersteuerung eines globalen Defaults** nötig ist.

Beispiel: **Constraints** bekommen NUR die Auflösungs-Hälfte (`effektiveConstraints`),
**kein** Register – es gibt keine aufzählbare ID-Menge, nur Produkt-Override über
globale Defaults. Ein „Constraint-Typ-Register" wäre Über-Generalisierung.

### 3. ID-als-Label vs. ID-als-Diskriminator

- Ist die ID ein **bloßes Label** (`PrintView`, `ProductType`, `MaterialGruppe`,
  `PrintMethod`) → volle Registry, Resolver liefert Metadaten.
- Ist die ID ein **Diskriminator divergenter Datenformen**
  (`ConfigElementType` → `LogoElement | TextElement`) → die Registry **orchestriert
  nur** (Preisregel-Schlüssel, Label, Produkt-Gate); sie verschmilzt Interfaces,
  Renderer und DB-Spalten **NICHT**. Ehrliche Grenze: ein neuer *label-artiger* Typ
  entsteht fast rein per Daten; ein neuer *formtragender* Typ braucht weiterhin eigenes
  Interface + Render-Zweig + DB-Migration.

### 4. Normative Anti-Kopplungs-Klauseln („MUSS getrennt bleiben")

Diese fachlich verschiedenen Konzepte dürfen **nie** in eine gemeinsame Struktur/einen
gemeinsamen Resolver gezogen werden:

- **„Nächste"-Metriken:** Farb-Nähe (euklidischer RGB-Abstand) vs. Größen-Nähe
  (ordinaler Leiter-Index). Getrennte Resolver.
- **Klassifikations-Strukturen:** Farbgruppe (ungeordnete Grundfamilien, bewusst
  geschlossen – das Farbspektrum wächst nicht) vs. Größenleitern (geordnet, typisiert).
- **Kategoriales vs. numerisches Material:** `MaterialGruppe` (disjunkte Klassen)
  gehört **nicht** in einen generischen `attributes`-Blob mit `weightGsm`.
- **Rechenmodelle der Veredelung:** DTF (Positionsstaffel, `first_position`/
  `additional_position`) vs. Stickerei (dieselbe Positionsstaffel PLUS Stichaufpreis
  `per_1000_stitches` mit Rabattdeckel, seit 2026-09-03) – getrennte Regel-Sets; die
  Registry hält nur einen **Zeiger** auf das jeweilige Regel-Set + einen Modell-Tag.
- **Kostenkern-Union vs. `PrintMethod`:** `selbstkosten.ts` (`'dtf'|'stick'`) und
  `PrintMethod` (`'dtf'|'embroidery'`) bleiben getrennt, gekoppelt **ausschließlich**
  über EINEN Resolver `veredelungZuKostenart()`, nie per gegenseitigem Import.
- **Registry vs. Produkt-Gate:** „welche Verfahren/Personalisierungen EXISTIEREN"
  (Registry) strikt getrennt von „welche erlaubt DIESES Produkt"
  (`supportedMethods`/`allowedPersonalizations`).
- **Element-Datenformen:** `LogoElement` (Raster/Upload) vs. `TextElement`
  (Typografie/Vektor) inkl. Renderer und DB-Spalten – kein Mega-Element-Modell.
- **Deckel vs. Boden:** Anti-Missbrauch-Grenzen (`GRENZEN`, Security, global) vs.
  geschäftliche Mindestmenge (`minOrderQuantity`) – verschiedene Konzepte; importierbare
  Produktdaten dürfen den Sicherheitsdeckel **nie** aufweichen.

### 5. Whitelist genuin geteilter Infrastruktur

„Geteilt" heißt hier **Muster-/Code-Wiederverwendung**, keine Laufzeitkopplung zwischen
Fachkonzepten. Echte gemeinsame Infrastruktur lohnt an **genau** diesen Stellen:

1. **Wächter-Test-Helfer** „jede von Produkt/Persistenz/Regel genutzte ID ist
   registriert" (heute dupliziert in `facetten.test.ts` + `productTypes.test.ts`).
2. **Fail-Loud-Resolver-Konvention** (`Record<string,Def>` + `get(id)` wirft bei
   Unbekanntem, wie `getColorMeta`); optional ein winziger `makeRegistry<Def>()`-Factory
   – spart nur Boilerplate, die Defs bleiben je Dimension verschieden.
3. **Numerische-Attribut-Registry** `NUM_ATTRIBUTE` (`weightGsm` = Instanz #1) – genuin
   generisch, weil Taschen-Volumen (Liter), Cap-Durchmesser (cm) dieselbe Form
   `key/label/einheit/number` haben.
4. **`quantityTierSet`-Register** (benannte Mengenstaffeln).
5. **`effektiveConstraints`-Merge** (Produkt-Override über globalen Default).

Bereits korrekt geteilt/neutral: der **`ruleEngine`** (kennt nur `PricingRule[]`, nicht
das Verfahren) und die **`SupplierVariant`**-Übersetzungsschicht (kanonischer Schlüssel →
Shop-Label mit Existenz-Whitelist – koppelt die Fachkonzepte nicht).

Alles Übrige = **getrennte Registries nach demselben Muster, KEINE geteilten Daten.**

## Dimensionsstatus & Fahrplan

| Dimension | Muster-Passung | Zustand / nächster Schritt | Wann |
|---|---|---|---|
| **Views** (ADR 0001) | ✅ offen | erledigt | — |
| **ProductType / naviAchse / Größenleiter** (ADR 0002, M3.1–M3.5) | ✅ offen | erledigt | — |
| **Farbe** | passt-direkt | **strukturell fertig** (COLOR_META + getColorMeta + farbgruppenVon + Wächter). Nur `realPhotoColorSet` views-getrieben nachziehen (= VIEW-Dimension) | jetzt-risikoarm |
| **Material (kategorial)** | passt-mit-Anpassung | `MATERIALIEN`-Duplikat auflösen (Prereq) → `MaterialGruppe` offene ID | jetzt / M3 |
| **Material (numerisch)** | gemeinsame Infra | `NUM_ATTRIBUTE`-Registry (`weightGsm` = #1) | M3+/M4 |
| **Veredelungsverfahren** | passt-mit-Anpassung | `veredelungZuKostenart()`-Resolver + Label-Dedup (Prereq) → `VEREDELUNGEN`-Registry + `PrintMethod` offen | jetzt / M3–M4 |
| **Constraints** | nur Auflösungs-Hälfte | `effektiveConstraints()`-Resolver → `quantityTierSet`-Register | jetzt / M4–M5 |
| **Personalisierung** | Registry orchestriert nur | tief querschneidend + DB-CHECK; `useDecorationNode`-Refactor vorgelagert; `ELEMENT_TYPES`-Register | langfristig |

### Reihenfolge folgt der Import-Relevanz
**Lieferantenattribute zuerst** (Material, Veredelung, Constraints – ein neuer Lieferant
bringt neue Materialfamilien/Verfahren/MOQs). **Farbe** ist reif und entkoppelt.
**Personalisierung** ist ein *Embroidery-Republic-Service*-Attribut (an Verfahren+Tooling
gekoppelt), **kein** Lieferantenattribut – der Import befüllt `ConfigElementType` nicht,
sondern berührt sie nur über das importierbare Produkt-Gate `allowedPersonalizations`.
**Kritische Vorbedingung:** die `'stick'`/`'embroidery'`-Namensdiskrepanz über den einen
Resolver auflösen, BEVOR der Kostenkern an lieferanten-/verfahrensgeschlüsselte Kostendaten
verdrahtet wird.

## Konsequenzen

- Dieses ADR **erweitert/ersetzt** die generische Skizze aus [ADR 0002 §5](0002-generisches-produktmodell.md).
  Jede Einzeldimension referenziert künftig ADR 0003 statt neu zu argumentieren.
### Umsetzungsstand der jetzt-risikoarmen Vorarbeiten (Block M3.x)

Bei der Umsetzung zeigte sich: nicht alle vom Analyse-Sketch als „jetzt-risikoarm"
gelisteten Punkte sind tatsächlich sauber byte-neutral. Ehrliche Aufteilung:

- ✅ **Umgesetzt (byte-identisch, verifiziert):**
  - **Facetten-Vokabular-Dedup** – `kriterien.ts` leitet `MATERIALIEN` **und**
    (gleiche Gelegenheit) `PASSFORMEN`/`GESCHLECHTER`/`FARBEN` aus der Single Source
    (`facetten.ts` Label-Records) ab statt vier Literallisten. `nurBekannte()` filtert
    per `.includes()` → reihenfolgeunabhängig, byte-identisch.
  - **Views-getriebene Bildlogik** – `realPhotoColorSet`/`realPhotoFrontBackColorSet`
    über einen gemeinsamen `realPhotoSet`-Builder + optionalen `views`-Parameter
    (Default = klassischer Kleidungssatz). Alle 43 Aufrufer unverändert → 642 KB
    Farbbild-Daten byte-identisch. Schiebt Bildwissen Richtung View-Dimension.
- 📄 **Reklassifiziert → dokumentiert (NICHT im byte-neutralen Block):**
  - **Veredelungs-Label-Dedup** – die 5 Stellen sind **nicht** identisch: 4 nutzen
    `'DTF-Transferdruck'`, die Admin-Seite `'DTF'`; zudem existiert bereits eine
    i18n-Single-Source (`method_dtf`/`method_embroidery`, von `KonfigUebersicht`
    genutzt). Saubere Zusammenführung ist ein kleiner Refactor mit Client/Server-
    i18n-Entscheidung, nicht byte-neutral → eigener Schritt (M3.6/M4).
  - **`effektiveConstraints()`** – **kein Konsument**: `MINIMUM_QUANTITY` ist
    vestigial (nur Migrations-Fallback; das Pricing hat bewusst *keine* Mindestmenge,
    calculatePrice.ts:180), `constraints` wird nirgends gelesen. Ein Resolver wäre ein
    Placebo. Echtes M4/M5-Thema, sobald der Import MOQ schreibt und der Checkout sie
    erzwingt – wobei der Sicherheits-Deckel `GRENZEN` **nie** von Produktdaten
    aufgeweicht werden darf (Deckel-vs-Boden-Klausel).
  - **`veredelungZuKostenart()`-Resolver** – da der Kostenkern (`selbstkosten.ts`)
    keinen Laufzeit-Caller hat, wäre der Resolver heute ungenutzt. Die Namensfalle
    ist in §4 dokumentiert; der Resolver entsteht mit dem ersten echten Kosten-Caller.
  - **Wächter-Test-Helfer extrahieren** – bewusst **nicht**: bei Wächter-Tests ist
    **Klarheit > DRY**; eine Test-Abstraktion verschlechterte die Lesbarkeit der
    vier bewusst expliziten „jede genutzte ID ist registriert"-Tests.
- **Größere Maßnahmen** (offene Unions, Registries, `NUM_ATTRIBUTE`, `ELEMENT_TYPES`)
  bleiben milestone-basiert mit je eigenem Grün-Gate.

### Bilder gehören zum Import, nicht zur Produktdefinition

Grundsatz (Auftraggeber): Produktbilder sind langfristig Bestandteil des **Import-
prozesses**, nicht der Produktdefinition. Klar zu trennen: **Lieferantendaten →
importierte Assets → Produktdefinition**. Jeder Lieferantenadapter bringt seine
Bildquellen mit; die Produktpipeline verarbeitet und ordnet sie zentral zu. Die
aktuell sichtbaren **Platzhalter sind temporär** (der Bildimport der 111 importierten
Produkte ist noch nicht vollständig) – **keine** Architekturentscheidung darf sie als
Endzustand behandeln (insb. **kein** dauerhaftes `noindex`; siehe B1). Keine erzeugten/
improvisierten Bilder. Die views-getriebene Bildlogik oben ist ein erster Schritt in
diese Richtung; die Asset-Pipeline (bestehende Ingest-Skripte + Lieferanten-Mapping-
Tabellen modularisieren) ist eine eigene, spätere Aufgabe (M4/M5).
