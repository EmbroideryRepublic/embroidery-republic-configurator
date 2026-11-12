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
- **Nur Produkte mit Vorder- UND Rückfoto** im Flachbildstil (Dateinamen `…-front…`/`…-back…`). Modelle mit nur einem Foto
  oder Fotos ohne klare Vorder-/Rückseite (z. B. Just Hoods Kids' Hoodie JH001K, Neutral NE30001, B&C Kids ID.333/ID.332,
  Stedman Kids) sind bewusst noch nicht importiert.
