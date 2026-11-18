# Ablauf nach jedem Bildimport

Die Schritte hängen voneinander ab – wird einer ausgelassen, bricht ein Wächtertest
oder es bleibt eine Lücke im Shop. Reihenfolge einhalten:

```bash
# 0. Torwächter: On-Model-Aufnahmen VOR dem Ablegen aussortieren – PFLICHT.
#    Ein Mensch im Bild verdirbt nicht nur den Bildstil, er verdirbt die
#    Druckfläche (siehe unten). Nach dem Import ist das nur mühsam rückbaubar.
npx tsx --tsconfig tsconfig.scripts.json scripts/jobsOnModelFilter.mts scripts/import/<jobs>.json --schreiben

# 1. Bilder holen, normalisieren, ablegen
npx tsx scripts/ingestDirect.mts scripts/import/<jobs>.json

# 1b. Ärmelfotos: Seite prüfen, dann fehlende Gegenseite durch Spiegeln anlegen.
#     Viele Lieferanten fotografieren nur EINEN Ärmel; ohne Gegenseite bleibt "Ärmel rechts"
#     (bzw. links) im Konfigurator verborgen. Der Wächtertest aermelGegenseite.test.ts schlägt
#     sonst an. Erst Seite korrigieren, dann spiegeln (die Spiegelung erbt die Seite der Quelle):
node scripts/aermelSeiten.mjs korrigieren
node scripts/spiegleAermel.mjs anlegen

# 2. Manifest neu erzeugen (Wahrheit über Bildpfade je Farbe/Ansicht)
npx tsx scripts/generateAssetManifest.mts

# 3a. Neues Produkt MIT Ärmelfoto: Ärmelfläche ablesen (siehe docs/aermelflaechen.md):
#     Kontaktbogen mit Prozent-Gitter erzeugen, Kanten [x0, y0, x1, y1] (Prozent des Bildes)
#     des LINKEN Ärmels ablesen und in scripts/aermelBereiche.json eintragen. Der rechte
#     Ärmel wird vom Generator gespiegelt. Ohne Eintrag gilt nur die grobe Berechnung.

# 3. Druckflächen neu erzeugen – PFLICHT, nicht optional:
#    Neue Ärmel-/Rückbilder schalten Ansichten frei, die vorher keine
#    Druckfläche hatten. Ohne diesen Schritt zeigt der Konfigurator eine
#    Ansicht an, für die es keine Fläche gibt (Wächtertest schlägt fehl).
npx tsx --tsconfig tsconfig.scripts.json scripts/generatePrintAreaData.mts

# 3b. Farbdubletten neu bestimmen – PFLICHT:
#     Zwei Katalogfarben mit demselben Foto dahinter blendet der Shop aus;
#     zwei BENANNTE Farben mit demselben Foto sind dagegen eine Fehlzuordnung
#     und lassen den Wächtertest fehlschlagen, bis sie korrigiert sind.
npx tsx --tsconfig tsconfig.scripts.json scripts/generateFarbdubletten.mts

# 4. Prüfen
npx tsx scripts/ansichtenAudit.mts        # jede Ansicht eigene Datei, kein Front-Alias
npx tsx scripts/bilddublettenAudit.mts    # keine Fremdprodukt-Bilder
npx tsx scripts/onModelAudit.mts          # keine On-Model-Aufnahmen
npx tsx --tsconfig tsconfig.scripts.json scripts/quellenAudit.mts   # eine Fotoserie je Produkt
npx tsc --noEmit && npx eslint .
npx tsx --test "src/**/*.test.ts"         # 6 bekannte Umgebungs-Fails sind normal

# 5. Sichtprüfung im echten Shop (nicht nur Skripte!)
#    Dev-Server VORHER stoppen, wenn ein `next build` läuft – build und dev
#    teilen sich .next und zerschießen sich sonst gegenseitig.
npm run dev -- -p 3007
```

## On-Model-Aufnahmen sind nicht nur hässlich – sie zerstören die Druckfläche

`onModelAudit` nur laufen zu lassen genügt nicht, seine Befunde müssen aufgelöst
werden. Grund: `generatePrintAreaData` vermisst die KONTUR des Bildes. Zeigt das
Bild einen Menschen, ist die gemessene Kontur der Mensch – die Druckfläche landet
dann über Kopf und Schultern statt auf dem Stoff. Genau das ist beim Gildan Ultra
Cotton Longsleeve passiert, nachdem eine Charge Bilder von einem Händler geholt
hatte, der ausschließlich On-Model fotografiert.

Gegenprobe nach jedem Import:

```bash
npx tsx --tsconfig tsconfig.scripts.json scripts/druckflaechePruefung.mts --toleranz 3
```

Weiße Kleidungsstücke stehen dort systematisch oben (weiß auf weiß lässt sich
nicht sauber von der Stoffkante trennen) – das ist Messrauschen. Verdächtig ist
ein CLUSTER dunkler Farben desselben Produkts mit gleichem Überstand.

## Sichtprüfung im Browser

**Nicht gegen `next dev` laufen lassen.** Der Bildoptimierer verarbeitet dort
jede Variante beim ersten Aufruf einzeln; bei ~30 Farben × 3 Ansichten je Produkt
dauert ein Durchlauf über 154 Produkte Stunden. Gemessen: vier Produkte in
mehreren Minuten. Für die Sichtprüfung deshalb erst bauen und dann starten:

```bash
npx tsx --tsconfig tsconfig.scripts.json scripts/pruefIds.mts
cp scripts/pruef/farbdurchlauf.html public/_pruef/
NEXT_PUBLIC_SITE_URL="https://embroidery-republic.com" npx next build
npx next start -p 3007
```

Ebenfalls nicht parallel zu Quelltextänderungen laufen lassen: Fast Refresh lädt
die Harness-Seite neu und setzt den Durchlauf zurück.

Der verlässlichste Weg ist, den Konfigurator selbst zu steuern: `?produkt=<id>`
öffnet ein Produkt direkt. In einem iframe lassen sich so alle 154 Produkte
nacheinander durchfahren und Ansichtenleiste + Farbwechsel auslesen.

Wichtig: Next.js verpackt Bild-URLs in `/_next/image?url=…`. Wer auf den rohen
`src` prüft, übersieht Platzhalter. Immer dekodieren:

```js
const roh = s => { const u = new URL(s, location.href);
  return decodeURIComponent(u.searchParams.get('url') || u.pathname); };
```

## Kinderbekleidung (Produktart `kids`)

Kinderware läuft über eine EIGENE Strecke neben dem Erwachsenen-Import, weil `importiereProdukte.mts` die Katalogdatei
`importiert.generated.ts` jedes Mal komplett neu schreibt (ihre Rohdatei liegt nicht im Repository) – ein Lauf nur mit
Kinderprodukten würde den bestehenden Import löschen.

```bash
# 1. Rohdaten: öffentliche Produktseiten von textil-grosshandel.eu (kein Login) → scripts/import/kinder-raw.json
node scripts/import/scrapeKinder.mjs

# 2. Katalogdatei + Bild-Aufträge erzeugen (idempotent): src/config/products/kinder.generated.ts, scripts/import/kinder-jobs.json
npx tsx --tsconfig tsconfig.scripts.json scripts/importiereKinder.mts

# 3. Fotos holen (Vorder- und Rückseite je Farbe), dann weiter wie oben ab Schritt 2 (Manifest, Druckflächen, Dubletten, Audits)
npx tsx scripts/ingestDirect.mts scripts/import/kinder-jobs.json
```

Besonderheiten:

- **Größen:** Die Lieferanten bezeichnen Kindergrößen nicht einheitlich (cm, Doppelgrößen, Alter mit cm, Jugendgrößen, Jahre).
  Jedes Schema hat eine eigene Leiter in `config/products/groessen.ts` (`KINDER_LEITERN`), das Produkt nennt sie über
  `sizeScale`. Die Bezeichnungen stehen wortgleich wie beim Lieferanten – nichts wird umgerechnet. Ein neues Schema
  braucht eine neue Leiter (Ordnung in GROSSBUCHSTABEN), sonst bricht der Import mit „Keine Kindergrößen-Leiter“ ab.
- **Ansichten:** nur `front` und `back`. Für Kinderware gibt es keine verlässlichen Ärmelfotos.
- **Kleidungsart:** Tabelle `KLEIDUNG` in `importiereKinder.mts` (je Artikelnummer) – die einzige Zuordnung, die das
  Skript selbst trifft. Die Produktart ist für alle Kinderware `kids`, die Kleidungsart steht in
  `detailedDescription.productType`.
- **Nur Produkte mit Vorder- UND Rückfoto** im Flachbildstil. Der Scraper erkennt je Lieferant: `…-front…`/`…-back…`
  (Standard), Just Hoods Zoodie `…-torso-…`/`…-back-…`, Just Hoods Hoodie `…-0002…` (vorne) / `…-0001…` (hinten),
  Stedman `…-f-20xx-…` (vorne) / `…-back-…`. Modelle mit nur EINEM Foto je Farbe oder uneindeutigen Fotos bleiben draußen
  (Liste `PRODUKTE_GEPRUEFT_OHNE_RUECKSEITE` im Scraper mit Begründung; mit `node scripts/import/scrapeKinder.mjs <artnr>`
  gezielt neu prüfbar). Ein Schwung läuft so: Kandidaten mit `OUT=…/roh-x.json node scripts/import/scrapeKinder.mjs <artnr,…>`
  einlesen (mehrere Läufe parallel möglich), Rückseiten-Abdeckung je Modell prüfen (alle Farben mit Vorder- UND Rückbild),
  die Aufgenommenen in `kinder-raw.json` übernehmen (oder `MERGE=1`), dann Schritte 2–3 oben, nur mit den NEUEN Aufträgen
  (`kinder-jobs.json` auf die neuen `productId`s filtern, sonst werden alle Fotos erneut geholt).
- **Größenbezeichnungen, die wie Erwachsenengrößen aussehen** (nur „XS … XL“, „3XS … XL“ ohne Alter/cm) werden NICHT
  aufgenommen: Die Größenübernahme beim Produktwechsel arbeitet mit den Bezeichnungen und könnte Erwachsenen- und
  Kindermengen verwechseln (Stedman S140K, Gildan Softstyle G64000K/G65000K/G3000K).
- **Tippfehler in Lieferantentabellen:** Die Maße kommen unverändert aus der Quelle. Einzige Ausnahme ist die Tabelle
  `MASS_KORREKTUR` in `importiereKinder.mts` – nur mit Begründung aus einer zweiten Quelle (heute: Z265K, 116 (5/6), Länge
  59 → 49 cm, belegt durch das Schwesterprodukt Z266K).
- **Kapuze und Taschen:** Der Generator findet bei Kinder-Hoodies die Kapuze/Tasche nicht zuverlässig. Für jedes Kinder-
  Kapuzenprodukt stehen deshalb Ober-/Unterkante in `BEREICH_KORREKTUR` (`generatePrintAreaData.mts`): Vorderseite endet über
  der Tasche (≈ y58), Rückseite beginnt unter der Kapuzenspitze; Zip-Hoodies bekommen in `printAreas.ts` eine Sperrzone für
  den Reißverschluss. Werte am eigenen Foto mit Prozentraster ablesen (Prozent der Bildhöhe), nicht schätzen.

## Sportbekleidung (Produktart `sport`)

Sportware läuft wie die Kinderware über eine EIGENE Strecke neben dem Erwachsenen-Import (aus demselben Grund: `importiereProdukte.mts`
schreibt seine Katalogdatei komplett neu). Die Produktart `sport` gehört zur Navigationsachse „geschlecht“ (Herren/Damen/Unisex) mit den
Konfektionsgrößen – es gibt also keine eigene Achse und keine eigene Größenleiter.

```bash
# 1. Rohdaten: öffentliche Produktseiten von textil-grosshandel.eu (kein Login) → scripts/import/sport-raw.json
node scripts/import/scrapeSport.mjs
# 2. Katalogdatei + Bild-Aufträge (idempotent): src/config/products/sport.generated.ts, scripts/import/sport-jobs.json
npx tsx --tsconfig tsconfig.scripts.json scripts/importiereSport.mts
# 3. Torwächter (On-Model), Fotos holen (front, back, Seite), Ärmelseiten prüfen + Gegenseite spiegeln, Manifest, Ärmelflächen
#    ablesen (scripts/aermelBereiche.json), Druckflächen, Farbdubletten, Audits – genau wie oben ab Schritt 0.
npx tsx --tsconfig tsconfig.scripts.json scripts/jobsOnModelFilter.mts scripts/import/sport-jobs.json --schreiben
npx tsx scripts/ingestDirect.mts scripts/import/sport-jobs.json
```

Besonderheiten:

- **Nur Modelle mit Vorder- UND Rückfoto** im Flachbildstil (…-front/…-back). Die Sport-Marken des Lieferanten (PROACT, Roly Sport, TriDri,
  Spiro, Tee Jays, Stedman Sports, Henbury …) führen überwiegend nur EIN Foto je Farbe und bleiben draußen (Prüfung 2026-11-18: von 528
  Modellen der Lieferantenrubrik „Sportbekleidung“ in T-Shirts, Langarm, Polo, Sweat, Jacken, Tanktops und Trainingsanzügen haben 33 Vorder-
  und Rückfoto in der ersten Farbe; Schwung 1 nimmt davon 10 Erwachsenen-Modelle auf, Begründungen für den Rest: docs/sportbekleidung.md).
- **Vor jeder Aufnahme gegen den Bestand prüfen:** Gleiche Artikelnummer = gleiches Produkt, auch unter anderem Markennamen (Daiber = James+Nicholson).
  Das Bilddubletten-Audit findet es, aber erst nach dem Foto-Import.
- **Ausgeschlossene Farben** (unbrauchbares Foto, Foto einer Schwesterfarbe) stehen mit Begründung in `FARBEN_AUSSCHLUSS` im Import; der Farbpunkt folgt
  dem Foto, wenn der Lieferantenwert stark abweicht (`sport-farbmessung.json`).
- **Ärmelansichten** (sleeve_left/right) nur, wenn mindestens 80 % der Farben ein Seitenfoto haben; die übrigen Farben des Modells entfallen
  dann (damit keine Farbe eine Ansicht ohne Foto hat). Tanktops haben nie Ärmelansichten. Das Seitenfoto wird als `sleeve-left` abgelegt,
  danach `node scripts/aermelSeiten.mjs korrigieren` (Seite prüfen) und `node scripts/spiegleAermel.mjs anlegen` (rechte Seite).
- **Kleidungsart:** Tabelle `KLEIDUNG` in `importiereSport.mts` (je Artikelnummer, z. B. „Sport-T-Shirt“) → `detailedDescription.productType`.
- **Passform/Geschlecht:** Tabellen `PASSFORM_FACETTE` und `GESCHLECHT` im Import – nur Wörter, die der Lieferant selbst nennt; ein unbekannter
  Text bricht den Lauf ab, statt zu raten.
- **Einkaufspreis:** günstigste aufgenommene Farbe, Preis der Standardgrößen netto (nie der JSON-LD-Preis der Produktseite).
