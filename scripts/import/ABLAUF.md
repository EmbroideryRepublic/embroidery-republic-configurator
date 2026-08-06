# Ablauf nach jedem Bildimport

Die Schritte hängen voneinander ab – wird einer ausgelassen, bricht ein Wächtertest
oder es bleibt eine Lücke im Shop. Reihenfolge einhalten:

```bash
# 1. Bilder holen, normalisieren, ablegen
npx tsx scripts/ingestDirect.mts scripts/import/<jobs>.json

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

Der verlässlichste Weg ist, den Konfigurator selbst zu steuern: `?produkt=<id>`
öffnet ein Produkt direkt. In einem iframe lassen sich so alle 154 Produkte
nacheinander durchfahren und Ansichtenleiste + Farbwechsel auslesen.

Wichtig: Next.js verpackt Bild-URLs in `/_next/image?url=…`. Wer auf den rohen
`src` prüft, übersieht Platzhalter. Immer dekodieren:

```js
const roh = s => { const u = new URL(s, location.href);
  return decodeURIComponent(u.searchParams.get('url') || u.pathname); };
```
