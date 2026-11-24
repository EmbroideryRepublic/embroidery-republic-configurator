# Redesign ergermany.de – Design- und Umsetzungsvorschlag

Stand: 24.11.2026 · Grundlage: Designreferenz des Betreibers (Startseite), bestehende Website, Tailwind-Konfiguration, Komponentenbestand.
Ziel: ein einheitlicher, hochwertiger, verkaufsorientierter Auftritt – warmes Off-White, kräftige schwarze Typografie, Orange als Akzent – ohne die Shop-Funktionen anzufassen.

## 1. Was die Referenz zeigt (und wie sie übersetzt wird)

| Element der Referenz | Übersetzung |
|---|---|
| Warmes Off-White als Seitenhintergrund, hellsandfarbene Flächen für Hero und Bänder | Token `paper` (#FAF7F2) und `sand` (#F0EBE3), ersetzt Creme/Beige |
| Schwarze, sehr kräftige Grotesk-Überschriften, Großbuchstaben im Hero, orange Unterstreichung | Eine Schriftfamilie (Inter, Gewichte 800/900), Überschriften eng gesetzt; Playfair Display entfällt (spart eine Schriftdatei) |
| Orange als einziger Akzent (Knöpfe, Links, Abzeichen, Warenkorb-Zähler) | Token `orange` in drei Rollen (siehe 2) |
| Schlanke Kopfzeile: Logo links, Navigation mittig, Such-/Konto-/Warenkorb-Symbole rechts | `SiteHeader` neu aufgebaut, alle bisherigen Ziele bleiben erreichbar |
| Vorteilsleiste mit vier Symbolen unter dem Hero | bleibt als belegte Fakten (Menge, Produktionstage, Verfahren, Versandgrenze aus der Konfiguration) |
| „Finde dein Teil“: vier Kategoriekacheln mit Bild | T-Shirts, Hoodies, Poloshirts, Jacken – verlinkt auf die bestehenden Kategorieseiten |
| „Beliebte Produkte“: Kacheln mit „Bestseller“-Abzeichen, Marke, „ab …“-Preis, Herz | bestehende `Produktkachel`, neu gestaltet; Herz = vorhandene Favoritenfunktion |
| Dunkles Band „Dein Motiv. Perfekt platziert.“ mit Knopf zum Konfigurator | großes Band zu DTF-Druck und Konfigurator, bewusst als Beispiel gekennzeichnet |

**Nicht übernommen:** Die Fotos der Referenz (Models, Stoffaufnahme) sind keine Bilder, die wir besitzen oder die belegbar echt sind. Preise und Texte der Referenz sind Platzhalter; auf der Seite stehen immer die echten Werte aus Katalog und Preisengine.

## 2. Designsystem

### Farben (alle Kontraste nach WCAG-Formel gerechnet)

| Token | Wert | Rolle | Kontrast |
|---|---|---|---|
| `brand` (Text) | #141210 | Überschriften, Fließtext, dunkle Flächen | 17,5 : 1 auf `paper` |
| `brand/70` (Nebentext) | Tinte mit 70 % Deckkraft | Beschriftungen, Fließtext zweiter Ordnung | ca. 7 : 1 |
| `paper` / `brand-light` | #FAF7F2 | Seitenhintergrund | – |
| `cream` / `sand` | #F0EBE3 / #EAE3D8 | Bänder, Hero, Karten-Hintergrund | – |
| `gold` (Orange, nur große Flächen und Grafiken) | #E8590C | Unterstreichung, Abzeichen, Symbole ab 24 px | 3,35 : 1 auf `paper` (Grafik ≥ 3 : 1 erfüllt) |
| `gold-btn` (Orange für Knöpfe mit weißer Schrift) | #C2410C | Primärknöpfe | 5,18 : 1 (weiße Schrift) |
| `gold-dark` (Orange für kleinen Text und Links) | #B93A0A | Links, Preise, Kennzeichnungen | 5,35 : 1 auf `paper` |
| `gold-light` | #FDE6D6 | helle Akzentfläche (Auswahl, Hinweise) | – |

Die bisherige Rollenaufteilung des Projekts (`gold` für Große, `gold-dark` für Kleintext, `gold-btn` für Knöpfe mit weißer Schrift) bleibt erhalten und wird nur umgefärbt. Damit färbt sich der gesamte Shop in einem Schritt um und bleibt konsistent; 200+ Stellen müssen nicht einzeln angefasst werden. Für Status (Fehler rot, Erfolg grün, Warnung gelb) bleiben die vorhandenen semantischen Farben.

### Typografie
- Überschriften: Inter 800 (Hero 900), Großbuchstaben nur im Hero und in kurzen Aufmachern, Laufweite −0,02 em, Zeilenhöhe 1,0–1,1.
- Fließtext: Inter 400/500, 16 px, Zeilenhöhe 1,6, Zeilenlänge höchstens 70 Zeichen.
- Kleintext/Labels: Inter 600, 12–13 px, leicht gesperrt.
- Eine Schriftfamilie statt zwei: weniger Daten, schnellere Darstellung.

### Form und Tiefe
- Karten: Radius 16 px, 1 px Rand `brand/10`, kaum Schatten (der „elegante“ Goldschatten entfällt).
- Knöpfe: Primär voll orange (`gold-btn`) mit weißer Schrift, sekundär mit schwarzem Rand, Radius 999 px (wie Referenz), Höhe mindestens 44 px.
- Eingabefelder: weiß auf `paper`, 1 px Rand, orange Fokusring (sichtbar, 2 px).
- Bewegung: nur Hover/Fokus; keine Einblendungen beim Scrollen. Bewegungen respektieren `prefers-reduced-motion`.

### Bilder
- Keine KI-Bilder, keine Stockfotos. Produktbilder = die vorhandenen Lieferantenfotos (Freisteller auf warmem Grund), Kategoriekacheln aus diesen Fotos.
- Das Hero-Bild bleibt das vorhandene Freisteller-Foto (`public/buehne/hoodie.png`); für die Kategorien werden Kachelmotive aus dem Katalog gewählt.
- **Lifestyle-Fotos mit Personen kann ich nicht liefern, ohne sie zu erfinden.** Sobald Sie eigene Fotos haben (Mannschaft, Team, fertige Bestellungen), tauschen wir sie in die Kacheln und den Hero ein; die Layouts sind darauf ausgelegt (Bildfläche mit festem Seitenverhältnis, `next/image`).
- Das große Band „Dein Motiv. Perfekt platziert.“ zeigt ein selbst gezeichnetes Beispielmotiv (Vektorgrafik) auf einem Produktfoto, gekennzeichnet als Beispiel – kein vorgetäuschter Kundenauftrag.

## 3. Seiten und Bausteine

| Bereich | Änderung | Funktion bleibt |
|---|---|---|
| **Kopfzeile** | Logo links, Hauptnavigation (Shop mit Auswahlmenü, T-Shirts, Hoodies, Polos, Firmenkleidung, So funktioniert’s), rechts Suche, Konto, Warenkorb mit orangem Zähler; Mobil: Menü-Schublade; Konfigurator-Knopf immer sichtbar | Warenkorb öffnet die Schublade; Währungswahl wandert ins Menü; alle bisherigen Ziele (Konfigurator, Produkte, Über uns, FAQ, Kontakt, Konto) bleiben erreichbar |
| **Startseite** | Hero (Aufmacher, Konfigurator-Knopf, Produktfreisteller), Vorteilsleiste, Kategoriekacheln, Beliebte Produkte, Band DTF-Druck und Konfigurator, Marken- und Ratgeber-Verweise (SEO-Links bleiben), Kundenstimmen nur, wenn echte vorliegen | Daten wie bisher (Bestseller aus Verkaufszahlen) |
| **Produktliste und Kategorien** | Kachelraster, Filter als ruhige Leiste, Abzeichen, Preis „ab …“ | Filter, Sortierung, Seitenwechsel, Währungsanzeige |
| **Kategorie-/Anlass-/Ratgeberseiten** | gleiche Schrift und Karten, größere Überschriften, orange Auszeichnungen | Texte, Tabellen, strukturierte Daten, Canonicals |
| **Produktseite** | größeres Bild, ruhige Kaufleiste, Preisstaffel als Tabelle, Abschnitte als Karten | Farbwahl, Preise, Staffelpreise, JSON-LD, Größentabellen |
| **Konfigurator** | nur Gestaltung: Farben, Tabs, Knöpfe, Preisfeld, Kopfzeile; **Layout und Leinwand bleiben unverändert** (eingefrorenes v1.0, Konva) | alles |
| **Warenkorb und Kasse** | Schublade und Formular im neuen Stil, Zahlungsarten, Preiszeilen und Hinweise unverändert | alles |
| **Fußzeile** | dunkle Fußzeile (brand), Spalten: Shop, Ratgeber, Unternehmen, Rechtliches; Zahlungsarten und Kontakt wie bisher | Impressum, Datenschutz, AGB, Verlinkung |

## 4. Wortlaut (Freigabe nötig)

Neue sichtbare Texte stehen hier zur Prüfung, bevor sie live gehen. Die Hero-Zeilen stammen aus Ihrer Referenz; alle Zahlen kommen aus der Konfiguration, nicht aus der Referenz.

- Hero-Überschrift: „DEIN DESIGN. DEIN TEXTIL. DEIN STATEMENT.“
- Hero-Unterzeile: „Hochwertige Textilien individuell bedrucken lassen – ab 1 Stück, direkt online gestaltet.“
- Knöpfe: „Jetzt gestalten“, „Produkte entdecken“
- Vorteilsleiste (Werte aus der Konfiguration): „Ab 1 Stück“ · „Live-Konfigurator“ · „3–4 Werktage Produktion“ · „Versandkostenfrei ab 75 €“ (75 € = `SHIPPING_RATES.DE.freeFrom`)
- Abschnitt Kategorien: „Finde dein Teil.“ – Kacheln „T-Shirts“, „Hoodies“, „Poloshirts“, „Jacken“
- Abschnitt Beliebte Produkte: „Beliebte Produkte.“ – „Weitere Bestseller“
- Band: „Dein Motiv. Perfekt platziert.“ / „Gestalte dein Textil direkt online – mit unserem intuitiven Konfigurator für hochwertigen DTF-Druck.“ / „Konfigurator öffnen“
- Navigation: „Shop“, „T-Shirts“, „Hoodies“, „Polos“, „Firmenkleidung“, „So funktioniert’s“

Anmerkung zum Ton: Die Referenz duzt („Dein Design“), der übrige Shop siezt („Ihr Logo“). Vorschlag: Aufmacher und Navigation duzen, wie in der Referenz; die Fachseiten (Rechtliches, Kasse, Ratgeber) bleiben beim Sie. Alternativ durchgängig Sie. Bitte entscheiden.

## 5. Schutz von Ladezeit, SEO und Funktion

- **Ladezeit:** eine Schrift statt zwei, keine zusätzliche JavaScript-Bibliothek, Bilder weiter über `next/image` (Größen, `priority` nur für das Hero-Bild), keine Scroll-Animationen. Messung vorher/nachher live mit demselben Verfahren (5 Läufe mobil).
- **SEO:** Texte, Überschriftenstruktur, Canonicals, strukturierte Daten, Titel und interne Links bleiben unverändert; die Navigation führt zusätzlich direkt zu den Kategorieseiten (mehr interne Links, kein Verlust).
- **Funktion:** Es werden nur Darstellung (Tailwind-Klassen, Token, Markup der Kopf-/Fußzeile und Startseite) geändert. Keine Änderung an Preisengine, Katalogdaten, Warenkorb-Speicher, Konfigurator-Leinwand, Server-Aktionen, Zahlungsabwicklung, DHL, Rechnungen, E-Mail-Vorlagen.

## 6. Umsetzungsplan (Etappen, jede mit Prüfung)

| Etappe | Inhalt | Prüfung |
|---|---|---|
| 1 | Designsystem: Farben, Schrift, Knöpfe, Karten, Eingaben (Token + Basisklassen) | Typprüfung, Lint, 1.711 Tests; Sichtprüfung Startseite, Liste, Produkt, Konfigurator, Warenkorb, Kasse (Desktop 1280, Mobil 375) |
| 2 | Kopfzeile und Fußzeile | alle Ziele erreichbar, Menü mobil, Warenkorb-Zähler, Tastaturbedienung |
| 3 | Startseite nach Referenz | Desktop/Mobil, Lighthouse, Konsolenfehler, Bildformate |
| 4 | Produktliste, Kategorie-, Anlass-, Ratgeber- und Produktseiten | Stichprobe je Seitentyp, strukturierte Daten unverändert (Test), Canonicals |
| 5 | Konfigurator, Warenkorb, Kasse (nur Gestaltung) | kompletter Durchlauf: Produkt wählen, Text/Logo platzieren, Menge, Warenkorb, Kasse bis zum Formular |
| 6 | Gesamtprüfung | Tests, Build, Lighthouse live vorher/nachher, Barrierefreiheit (Kontraste, Fokus), SEO-Crawl der 228 URLs |

Die Auslieferung erfolgt etappenweise nach bestandener Prüfung (Push auf `main` über den Branch `arbeit-redesign`), damit jede Stufe einzeln rückholbar bleibt.

## 7. Risiken und offene Entscheidungen

1. **Fotos:** Ohne eigene Lifestyle-Fotos wirkt der Hero produktorientiert statt personenbezogen wie in der Referenz. Ich ersetze nichts durch erfundene Bilder.
2. **Orange und Lesbarkeit:** Das Orange der Referenz (#E8590C) erreicht mit weißer Schrift nur 3,6 : 1. Darum Knöpfe in #C2410C (5,2 : 1) und Kleintext in #B93A0A. Optisch kaum sichtbar, aber barrierefrei.
3. **Ton (Du/Sie):** siehe Abschnitt 4.
4. **Schriftwechsel:** Fehlt Playfair, ändert sich der Gesamteindruck bewusst von „klassisch-edel“ zu „modern-kräftig“; das ist der Kern der Referenz.
5. **Konfigurator:** nur Farben und Knöpfe; das Layout bleibt, weil die Leinwand an feste Maße gekoppelt ist.
