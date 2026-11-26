# SEO-Umsetzung 26.11.2026 (Wachstumsplan)

Grundlage: Wachstumsplan vom 26.11.2026 (`E:\Embroidery Republic\seo-unterlagen\wachstumsplan-2026-11-26.html`), Freigabe des Betreibers, risikoarme SEO-, Sichtbarkeits- und Conversion-Maßnahmen selbstständig umzusetzen. Nicht angefasst: Preise und Preisberechnung, Zahlung, DHL, Rechnungen, bestehende Bestellprozesse. Stickerei bleibt pausiert (kein Text bewirbt sie).

## 1. Pilot Produktseiten (12) – „Im Vergleich“ und „Druckfläche je Größe“
- `config/seo/produktPilot.ts` (Liste), `lib/seo/produktVergleich.ts` (Berechnung), `components/produkt/ProduktVergleichBlock.tsx`.
- Aus Katalogdaten: die drei nächsten Modelle derselben Art (Gewichtsnähe, verschiedene Marken, gleicher Schnitt), Unterschiede nur als messbare Fakten (Gewicht, Textilpreis ab, Farben, Größen, Zertifikate, Piqué), nie „ohne …“-Aussagen. Tabelle der größten DTF-Fläche je Größe (vorne/hinten) neben der Breite des Teils.
- Auswahl: die 8 Seiten, die Google gelesen und nicht aufgenommen hat, plus die 4 Produktseiten mit den meisten Impressionen. Messung ab 24.12.2026 (Indexierung, Impressionen, Ø Position gegen gleichwertige Seiten ohne Baustein).
- Tests: `produktVergleich.test.ts`.

## 2. „Welches Modell passt?“ (Kategorie- und Produktart-Seiten)
- `lib/seo/auswahlhilfe.ts`, `components/seo/Auswahlhilfe.tsx`: günstigster Einstieg, leichtestes/schwerstes Modell, größte Farbauswahl, meiste Größen – berechnet, je Art anders. Nicht auf Marken- und Sammelbegriff-Seiten (Kinder, Sport).

## 3. Gezielte Texte der Seiten mit Ranking-Potenzial
Wortlaut (Titel / Beschreibung) – alle ≤ 60 bzw. ≤ 160 Zeichen, Tests grün:
- `/longsleeves-bedrucken`: „Longsleeve bedrucken lassen – ab 1 Stück, Langarmshirts“; Einleitung nennt Longsleeve/Long Sleeve/Longshirt/Langarmshirt; neue Frage zum Ärmeldruck.
- `/gildan-bedrucken`: „Gildan T-Shirts & Hoodies bedrucken lassen – ab 1 Stück“; Einleitung mit vier Einstiegsmodellen samt Gewicht aus dem Katalog.
- `/jacken-bedrucken`: „Jacken bedrucken lassen – Fleecejacken ab 1 Stück“ (Test: jede Jacke im Katalog ist eine Fleecejacke).
- `/zip-hoodies-bedrucken`: „Zip-Hoodies & Sweatjacken bedrucken lassen – ab 1 Stück“.
- `/poloshirts-besticken-bedrucken` (Pause-Wortlaut): Polohemd-Synonym, Frage „Kann ich ein Poloshirt ab 1 Stück bedrucken lassen?“, Frage Poloshirt/Polohemd.
- `/hoodies-bedrucken-besticken` (Pause-Wortlaut): Frage „Was kostet es, einen Hoodie bedrucken zu lassen?“ (Grundpreis aus dem Katalog).
- Produktseite Gildan Ultra Cotton Long Sleeve: Pilot-Baustein (Punkt 1).

## 4. Firmenkleidung gegen Geschäftskunden
- `/firmenkleidung-bedrucken` = Selbstgestaltung im Konfigurator („Firmenlogo selbst gestalten …“), verweist auf Geschäftskunden.
- `/geschaeftskunden` = Angebot („Geschäftskunden: Angebot für Firmenkleidung, ab 1 Stück“, H1 „Angebot für Firmenkleidung – Geschäftsanfrage in wenigen Minuten“).
- Beide Seiten verlinken sich gegenseitig (`verwandt`).

## 5. Weiteres
- Alt-Texte der Produktkacheln und Mini-Karten: Marke + Name.
- Strukturierte Daten: Flächengewicht als `additionalProperty` im Product.
- Sitemap: `lastmod` nur bei bewusst überarbeiteten Seiten (`config/seo/aenderungen.ts`, getestet), sonst keines.
- Über uns: „Unser Sitz ist in Köln …“ (aus `COMPANY`, kein Abholhinweis, keine Öffnungszeiten, kein Termin).
- Messung „Weg zur Bestellung“: vorbereitet, **abgeschaltet** – siehe `docs/besucherzaehler.md` Abschnitt 9.

## Messpunkte der nächsten Wochen
Montagsbericht: Impressionen, Ø Position, indexierte Seiten, Klicks (ohne Startseite), Besucher je Kanal, Bestellungen. Pilot-Vergleich ab 24.12.2026.
