# Filterleiste – Architektur- und Umsetzungskonzept

Vollständige Umsetzungsgrundlage für die Produktfilterung im Shop. Erstellt am
**2026-07-23** während des Architektur-Freeze für v1.0 – **enthält bewusst keinen
Code**.

> ## ✅ UMGESETZT am 2026-07-23
>
> Der Auftraggeber hat den Architektur-Freeze **gezielt für die Filterleiste**
> aufgehoben; sie ist noch **vor dem Go-live** vollständig umgesetzt und
> verifiziert. Alles Übrige blieb eingefroren.
>
> | Baustein | Datei |
> |---|---|
> | Facetten-Vokabulare + Zuordnungstabellen | `src/config/products/facetten.ts` |
> | Verfügbarkeit (manuell + Lieferanten-Port) | `src/lib/catalog/verfuegbarkeit.ts` |
> | Kriterien + Adresszeile | `src/lib/catalog/kriterien.ts` |
> | Reine Filter-/Sortier-/Facettenlogik | `src/lib/catalog/filter.ts` |
> | Abfrage-Port + Speicher-Umsetzung | `src/lib/catalog/abfrage.ts` |
> | Beliebtheit aus `order_items` | `src/lib/catalog/beliebtheit.ts` |
> | Kategorie-Navigation (große Reiter, ohne Zähler) | `src/components/shop/KategorieReiter.tsx` |
> | Filtermenüs (rechts in der Sticky-Leiste, inkl. Preis) | `src/components/shop/FilterMenues.tsx` |
> | Seitenleiste (Preis-/Gewichtsregler, Marke/Farbe/Größe) | `src/components/shop/FilterSeitenleiste.tsx` |
> | Ergebniskopf (Chips, Trefferzahl, Sortierung, Ansicht) | `src/components/shop/Ergebniskopf.tsx` |
> | Gemeinsame Bausteine (Beschriftungen, Werteliste, Chip) | `src/components/shop/filterBausteine.tsx` |
> | Doppel-Schieberegler | `src/components/shop/Spannenregler.tsx` |
> | Panel (Mobil, zweistufig) | `src/components/shop/FilterPanel.tsx` |
> | Rahmen (angeheftete Leiste + Layout) | `src/components/shop/ShopFilter.tsx` |
> | Produktkachel (Farbpunkte, Badges) | `src/components/shop/Produktkachel.tsx` |
> | Shop-Seite | `src/app/produkt/page.tsx` |
> | Tests + Wächter | `src/lib/catalog/__tests__/` |
> | Visuelle + funktionale Prüfstrecke | `scripts/qaFilterleiste.mts` |
>
> **Gestaltung** nach Entwurf des Auftraggebers (2026-07-23, in zwei Runden
> verfeinert):
> - **Angeheftete Leiste** oben, bleibt beim Scrollen stehen.
> - **Kategorie als Navigation**, nicht als Filter: große Reiter mit Icon,
>   ohne Trefferzähler, aktiver Zustand als goldener Unterstrich. Die
>   Kategorie erscheint deshalb **nicht** zusätzlich als Klappmenü.
>   *Layout-Entscheidung:* Reiter bekommen die volle Breite und stehen in
>   einer eigenen Zeile – neun große Reiter und sieben Filterknöpfe passen
>   auf üblichen Bildschirmen nicht nebeneinander, die Reiter würden
>   abgeschnitten. Die Filter stehen rechtsbündig darunter, in derselben
>   angehefteten Leiste.
> - **Dauerhafte Seitenleiste** links (Preis, Stoffgewicht, Marke, Farbe,
>   Größe) mit Doppel-Schieberegler und „Mehr anzeigen".
> - **Drei Bänder** als sichtbare Hierarchie: (1) Kategorie-Navigation,
>   (2) Filterleiste, (3) Ergebniszeile – danach erst die Ware. Band 1 und 2
>   bleiben angeheftet, Band 3 scrollt mit (sonst wäre der feste Bereich halb
>   so hoch wie das Fenster).
> - **Ruhige Seitenleiste** ohne Rahmen und Kästen: Gliederung allein über
>   Abstand und Typografie (kleine gesperrte Überschriften, zurückgenommene
>   Zähler).
> - **Große Kacheln**, drei je Zeile (zwei auf dem Telefon): Bildfläche 3:4,
>   **weiß** – die Produktfotos haben selbst weißen Hintergrund und stünden auf
>   getönter Fläche als sichtbares Rechteck darin. Nur Marke, Name, Preis und
>   Farbpunkte; Material, Gewicht und Qualitätsstufe stehen auf der
>   Produktseite. Bestseller-Badge (aus echten Verkaufszahlen) und
>   Nachhaltigkeitszeichen (aus der Materialgruppe).
> - **Farbpunkte** mit Innenglanz und feinem Ring – wirken wie Stoff, nicht wie
>   Farbfelder aus einem Formular.
> - **Weiche Übergänge** durchgehend (200–600 ms), Bildzoom beim Überfahren.
> - **Mobil**: Panel von rechts, zweistufige Zeilenliste, Abschlussknopf mit
>   Vorschau-Trefferzahl.
>
> **Nachweis:** `tsc` 0 · `eslint` 0 · **484/484 Unit-Tests** (26 neue) ·
> `next build` erfolgreich · E2E 21/21 · 21/21 · 16/16 · 19/19 · Stripe 31/31 ·
> **`qaFilterleiste.mts` 25/25** (Desktop + Mobil, mit Screenshots in
> `qa-screenshots/filter/`). Geprüft u.a.: Filterkette 43 → 8 → 2 → 2 → 2,
> Preis-/Gewichtsgrenzen, Sortierungen monoton, Chip entfernen **ohne
> Neuladen** (Marker überlebt), Summe aller Kategorien = 43 (**kein Produkt
> verloren oder doppelt**), widersprüchliche Kombination → 0 Treffer,
> unbekannte Adressparameter unschädlich.
>
> **Roadmap-Platz (Festlegung 2026-07-23):** Das Next.js-15-Upgrade folgt als
> nächstes Vorhaben nach dem Go-live
> ([next-upgrade-entscheidung.md](next-upgrade-entscheidung.md)).
> Begründung: Die Filterleiste betrifft Shop, Datenmodell und Oberfläche und
> bringt unmittelbar geschäftlichen Nutzen; das Upgrade betrifft vor allem den
> Konfigurator und ist technisch anspruchsvoller – beides bleibt dadurch
> sauber getrennt.
>
> **Bewusst getragene Folge:** Die Filter-UI entsteht auf React 18 und muss beim
> späteren React-19-Umstieg **erneut validiert** werden. Der Aufwand ist
> überschaubar, weil die Teststrategie (Abschnitt 10) genau dafür E2E-Fälle und
> eine visuelle Prüfstrecke vorsieht – anders als beim Konfigurator, dessen
> Canvas-Bibliothek ausgetauscht wird.

Ziel: unmittelbar implementierbar, ohne erneute Planung.

---

## 1. Ist-Stand (gemessen am Bestand, nicht geschätzt)

| Größe | Wert |
|---|---|
| Produkte im Katalog | **43** |
| Farbvarianten gesamt | **329** |
| verschiedene Farbnamen | **50** |

**Der Katalog liegt im Code**, nicht in der Datenbank: maßgeblich ist
`PRODUCTS` aus `src/config/products/index.ts` (Typ `ProductConfig` in
`src/config/products/types.ts`). Die DB-Tabellen `products`, `brands`,
`categories`, `product_colors`, `product_sizes`, `print_areas`, `pricing_rules`
existieren, sind aber **leer** und werden zur Laufzeit **nicht gelesen**
(im Betriebsreview per Suche belegt).

> **Architekturentscheidung 1 – Quelle der Facetten:** Die Filter werden aus dem
> **Code-Katalog** abgeleitet, nicht aus der Datenbank. Die DB-Tabellen jetzt zu
> befüllen schüfe eine **zweite Quelle** für dieselbe Information – genau das,
> was die Geschäftsarchitektur verbietet. Die Anforderung „wächst automatisch
> mit, ohne Codeanpassung" wird dadurch vollständig erfüllt: Ein neues Produkt
> bringt seine Facettenwerte mit, die Filterleiste zeigt sie ohne weiteres Zutun.

---

## 2. Datenmodell: was reicht, was fehlt

### 2.1 Reicht unverändert

| Filter | Feld in `ProductConfig` | Werte im Bestand |
|---|---|---|
| Kategorie | `productType` (getypt, 8 Werte) | 7 belegt: tshirt 25, polo 5, zip-hoodie 5, longsleeve 3, hoodie 3, jacket 1, sweater 1 |
| Marke | `brand` | 9: Fruit of the Loom 18, Gildan 8, Just Hoods 5, Russell 3, SOL'S 2, Neutral 2, B&C 2, James+Nicholson 2, Stedman 1 |
| Qualität/Kollektion | `qualityTier` (getypt) | 3 belegt: basic 26, standard 12, premium 5 |
| Größe | `sizes: string[]` | 9: S–XXL bei allen 43, 3XL (9), 4XL (6), 5XL (6) |
| Stoffgewicht | `weightGsm: number` | numerischer Bereich |
| Preis | `basePrice: number` | numerischer Bereich |

### 2.2 Vorhanden, aber als Filter **unbrauchbar** (Freitext)

**Material – 27 verschiedene Strings bei 43 Produkten.** Beispiele:

```
100% Baumwolle
100% Baumwolle (meliert: 98% Baumwolle, 2% Polyester)
100% Baumwolle (meliert: 97-99% Baumwolle, 1-3% Polyester)
80% biologisch erzeugte Baumwolle, 20% recyceltes Polyester
```

**Passform – 22 verschiedene Strings.** Sie vermischen Passform mit Ausstattung:

```
Classic Fit, Unisex
Unisex, normale Passform, Kängurutasche
Damen, taillierter Lady-Fit mit Seitennähten
```

**Geschlecht – 4 Werte, aber Mischwert und optional:** `Unisex` (19),
`Unisex/Herren` (10), `Damen` (10), `Herren` (4) – und das Feld hängt an
`detailedDescription?`, ist also nicht garantiert vorhanden.

**Farbe – 50 Namen für faktisch ~12 Grundfarben:** „Grau", „Heather Grey",
„Graphite", „Dark Grey (Solid)" sind alle Grau. Eine Farbleiste mit 50 Einträgen
ist unbedienbar.

### 2.3 Fehlt vollständig

- **Verfügbarkeit** – kein Feld
- **Neuheiten** (Sortierung) – kein Datum
- **Beliebtheit** (Sortierung) – keine Kennzahl

### 2.4 Vorgeschlagene Ergänzungen am `ProductConfig`

Getypte **Facettenfelder** mit geschlossenem Vokabular, einmal gepflegt – **nicht**
zur Laufzeit aus Prosa geparst (Parsen wäre fragil und bräche bei jeder neuen
Formulierung).

| Neues Feld | Typ | Zweck |
|---|---|---|
| `materialGruppe` | `MaterialGruppe[]` | `baumwolle-100 \| bio-baumwolle \| mischgewebe \| polyester \| recycelt` – mehrwertig (ein Produkt kann bio **und** Mischgewebe sein) |
| `passform` | `Passform` | `regular \| slim \| oversized \| tailliert \| weit` – einwertig |
| `geschlechter` | `Geschlecht[]` | `damen \| herren \| unisex` – mehrwertig, löst „Unisex/Herren" sauber auf; **top-level**, nicht mehr unter `detailedDescription` |
| `verfuegbarkeit` | `Verfuegbarkeit` | `lieferbar \| voruebergehend_nicht_lieferbar \| ausgelaufen` |
| `aufgenommenAm` | `string` (ISO-Datum) | Sortierung „Neuheiten" |
| `colorGruppe` je `ProductColorConfig` | `Farbgruppe` | `schwarz \| weiss \| grau \| blau \| rot \| gruen \| gelb \| orange \| rosa \| lila \| braun \| beige` |

> **Architekturentscheidung 2 – Freitext bleibt, Facette kommt daneben:** Die
> bestehenden Felder `material` und `fit` bleiben unverändert; sie sind gute
> Prosa für die Produktseite. Die neuen Felder sind ein **getrenntes
> Klassifikationsmerkmal** für die Filterung. Das ist keine Doppellogik, sondern
> Trennung von *Anzeigetext* und *Filtermerkmal* – abgesichert durch einen
> Wächter-Test (Abschnitt 8), der Vollständigkeit und Konsistenz erzwingt
> (z.B.: enthält `material` „biologisch"/„Bio", muss `materialGruppe`
> `bio-baumwolle` enthalten).

**Beliebtheit** wird **kein** Produktfeld, sondern serverseitig aus
`order_items` aggregiert (echte Verkaufsdaten, wachsen von selbst; siehe 6.3).

**Farbgruppe:** Grundlage ist die bestehende `COLOR_META`-Registry
(`colorHelpers.ts`, Name + Hex). Die Zuordnung wird dort **einmal explizit**
ergänzt – nicht automatisch aus dem Hex-Wert geraten, weil Grenzfälle
(Petrol, Sage, Burgundy) sonst falsch landen.

---

## 3. Verfügbarkeit: heute manuell, später aus Lieferantendaten

Anforderung: manueller Status je Produkt, später **ohne Architekturänderung**
durch Lieferantendaten ersetzbar bzw. überschreibbar.

**Lösung – dieselbe Port-/Registry-Bauweise wie bei den Zahlungsanbietern:**

```
VerfuegbarkeitsQuelle (Port)
   ├── manuelleQuelle      → liest ProductConfig.verfuegbarkeit        (heute)
   └── lieferantenQuelle   → liest Lieferantenbestand                  (später)
                ↓
   ermittleVerfuegbarkeit(produkt)  – reine Auflösung mit Vorrangregel
```

**Vorrangregel (bewusst festgelegt):**

1. Steht der manuelle Status auf `ausgelaufen`, gewinnt er **immer** – ein
   ausgelistetes Produkt darf keine Lieferantenmeldung zurückholen.
2. Sonst gewinnt, sofern vorhanden, die **Lieferantenmeldung** (aktueller).
3. Ohne Lieferantendaten gilt der **manuelle Status**.
4. Ohne jede Angabe gilt `lieferbar` – aber ein Wächter-Test erzwingt, dass das
   Feld gesetzt ist, sodass dieser Fall nicht auftritt (fail-fast statt raten).

Später ist nur eine zweite Implementierung des Ports plus ein Registry-Eintrag
nötig. Weder UI noch Filterlogik ändern sich.

**Anzeigeverhalten:** Nicht lieferbare Produkte werden **standardmäßig
ausgeblendet**; der Filter „Verfügbarkeit" erlaubt, sie einzublenden. Ob
`ausgelaufen` überhaupt sichtbar sein soll, ist eine offene Geschäftsfrage
(Abschnitt 10).

---

## 4. Abfrage-Architektur

Konsequent dem Projektmuster folgend: **reine Logik, ein Port, austauschbare
Implementierung.**

```
UI (Server Component)
   │  liest searchParams
   ▼
FilterKriterien           reines Datenobjekt (aus URL geparst + validiert)
   │
   ▼
ProduktAbfrage (Port)     finde(kriterien) → { produkte, gesamt, facetten }
   ├── speicherAbfrage    filtert PRODUCTS im Speicher          (Start)
   └── datenbankAbfrage   SQL mit Indizes                       (bei Bedarf)
```

- **`lib/catalog/filter.ts`** – rein, ohne Next-/DB-Bezug, vollständig
  unit-testbar: `passtAufKriterien(produkt, kriterien)`, `sortiere(...)`,
  `berechneFacetten(...)`.
- **`lib/catalog/abfrage.ts`** – der Port plus Registry.
- Ein Architekturtest verhindert, dass die reine Schicht aus `config/products`
  **oder** aus Next importiert – dasselbe Vorgehen wie bei `lib/payments`.

---

## 5. Facetten: dynamisch, mit Zählern

**Ableitung:** `berechneFacetten()` läuft über den Bestand und liefert je
Dimension die **tatsächlich vorkommenden** Werte samt Trefferzahl. Es gibt
**keine** hartkodierte Optionsliste in der UI – gibt es nur drei Marken, stehen
dort drei Marken.

**Zählweise (wichtiges Detail, das die Bedienbarkeit entscheidet):** Die Zähler
einer Dimension werden gegen alle **anderen** aktiven Filter berechnet, aber
**ohne den eigenen**. Sonst zeigt der Markenfilter nach Wahl von „Gildan" für
jede andere Marke 0 an, und man könnte nie eine zweite Marke dazunehmen. Das ist
das Verhalten großer Fashion-Shops.

**Werte mit 0 Treffern** werden ausgegraut und ans Ende sortiert, nicht entfernt
– so bleibt die Leiste räumlich stabil (kein Springen beim Filtern).

**Sonderfälle:**
- *Preis* und *Stoffgewicht*: keine Werteliste, sondern Min/Max aus dem
  gefilterten Bestand → Schieberegler-Grenzen passen sich an.
- *Größe*: ein Produkt „hat" S–XXL; gefiltert wird auf „Produkt bietet diese
  Größe an".
- *Farbe*: gefiltert wird über `colorGruppe`; in der Trefferliste sollte das
  Produktbild möglichst in der gewählten Farbe erscheinen (Detail in 7.3).

---

## 6. Sortierung

| Option | Grundlage |
|---|---|
| Beliebtheit (Standard) | Aggregat aus `order_items` (6.3) |
| Preis aufsteigend / absteigend | `basePrice` |
| Neuheiten | `aufgenommenAm` absteigend |
| Name A–Z / Z–A | `name`, mit `localeCompare('de')` |

**6.3 Beliebtheit:** serverseitige Aggregation
`select product_id, sum(quantity) from order_items … group by product_id`,
begrenzt auf ein rollierendes Fenster (z.B. 90 Tage), **zwischengespeichert**
(stündlich). Kein Produktfeld, keine Pflege, wächst mit dem Geschäft. Solange
kaum Bestellungen vorliegen, fällt die Reihenfolge auf `qualityTier` +
`aufgenommenAm` zurück – dokumentiert, damit „Beliebtheit" am Anfang nicht
willkürlich wirkt.

---

## 7. URL, Rendering und SEO

### 7.1 Die URL ist die einzige Wahrheit

Kein doppelter Client-State. Die Server Component liest `searchParams`, filtert
und rendert. Ein Klick schreibt die URL fort – die Liste aktualisiert sich per
**Soft Navigation** ohne Seiten-Neuladen.

```
/shop?kategorie=hoodie,zip-hoodie&marke=just-hoods&groesse=L
     &farbe=schwarz,grau&material=bio-baumwolle&preisVon=20&preisBis=45
     &sortierung=preis-auf&seite=2
```

- Mehrfachwerte **kommasepariert** (kürzer und lesbarer als wiederholte Parameter).
- Werte sind **Slugs**, nicht Anzeigetexte – stabil gegenüber Umbenennungen.
- Unbekannte oder ungültige Werte werden **ignoriert**, nicht als Fehler
  behandelt: Eine geteilte URL soll auch nach einer Sortimentsänderung noch
  eine sinnvolle Seite zeigen.

### 7.2 Kein Neuladen, kein Springen

`useTransition` + `router.replace(url, { scroll: false })`. Während der
Server-Aktualisierung bleibt die alte Liste stehen und wird abgeblendet
(`isPending`) – statt eines Skeletts, das die Höhe ändert. Die Trefferzahl wird
über `aria-live="polite"` angesagt.

### 7.3 SEO

- Gefilterte Ansichten: `robots: noindex, follow` – die Kombinationsexplosion
  gehört nicht in den Index.
- `canonical` zeigt auf die ungefilterte Shop- bzw. Kategorieseite.
- **Kuratierte Landingpages** für hochwertige Kombinationen als *eigene*,
  indexierbare Routen (z.B. `/shop/hoodies/bio-baumwolle`) mit eigenem Titel und
  Beschreibungstext. Diese wenigen Seiten bringen den SEO-Nutzen, ohne den Index
  zu fluten.
- Die bestehenden Produktdetailseiten (`/produkt/[slug]`, 43 statisch
  vorgerendert) bleiben die eigentlichen SEO-Träger.

---

## 8. Performance und Skalierung

**Heute (43 Produkte):** lineares Filtern im Speicher ist unmessbar schnell.

**Bis ~2.000 Produkte:** vorberechnete **Indizes** je Facette
(`Map<Facettenwert, Set<ProduktId>>`), einmal beim Modulstart aufgebaut.
Filtern wird zum Mengenschnitt, Facettenzähler zu Mengengrößen – unabhängig von
der Trefferzahl.

**Darüber:** `datenbankAbfrage` als zweite Port-Implementierung – Katalog in die
DB, Indizes auf den Facettenspalten, Facettenzähler per `GROUP BY`,
Cursor-Paginierung. **Die UI ändert sich dabei nicht.**

**Umschaltkriterium (statt Bauchgefühl):** Wenn `finde()` im Median über 50 ms
liegt oder der Katalog 2.000 Produkte überschreitet.

**Weitere Maßnahmen:** Paginierung ab 48 Produkten je Seite; Bilder über
`next/image` mit `sizes`; die Facettenberechnung teilt sich den Durchlauf mit der
Filterung (ein Durchgang statt zwei).

---

## 9. Benutzeroberfläche

### 9.1 Desktop

- **Horizontale Chip-Leiste** direkt über der Produktliste, sticky beim Scrollen.
- Direkt sichtbar: *Sortierung · Kategorie · Marke · Größe · Farbe · Material ·
  Qualität · Preis*.
- Klick auf einen Chip öffnet ein **Popover** mit Optionen, Trefferzahlen und
  Suchfeld (bei Marke/Farbe).
- **„Mehr Filter"** öffnet ein Panel mit: Stoffgewicht, Passform, Geschlecht,
  Verfügbarkeit.
- Darunter: **aktive Filter als entfernbare Chips** (× je Chip) plus
  „Alle zurücksetzen".
- Trefferzahl dauerhaft sichtbar („**37 Produkte**").

### 9.2 Mobil

- Dieselbe Leiste, **horizontal scrollbar**, mit Zählerbadge je Chip.
- Klick öffnet ein **Bottom-Sheet über die volle Höhe**; im Sticky-Footer
  „Zurücksetzen" und „**37 Produkte anzeigen**".
- Filter werden im Sheet gesammelt und erst beim Bestätigen übernommen (spart
  Serverrunden auf Mobilfunk); auf Desktop wirken sie sofort.

### 9.3 Gestaltung und Barrierefreiheit

- Farbfilter als Farbpunkte aus `COLOR_META`-Hex, mit Textlabel (nicht nur Farbe
  als Bedeutungsträger).
- Dezente Übergänge (150–200 ms), Hover nur auf Zeigegeräten
  (`@media (hover: hover)`), `prefers-reduced-motion` respektiert.
- Vollständige Tastaturbedienung, Fokusfalle im Drawer, `aria-expanded`,
  `aria-live` für die Trefferzahl, Mindestziel 44 px auf Mobil.

---

## 10. Teststrategie

| Ebene | Inhalt |
|---|---|
| Unit (rein) | `passtAufKriterien`, `sortiere`, `berechneFacetten`: Kombinationen, leere Ergebnisse, Grenzwerte, Zähl-Logik „ohne eigenen Filter" |
| **Wächter** | jedes Produkt hat **alle** Facettenfelder gesetzt (neues Produkt ohne Facette ⇒ Test rot) |
| **Wächter** | `materialGruppe` konsistent zum Freitext (`bio`/`biologisch` ⇒ `bio-baumwolle`) |
| **Wächter** | keine hartkodierte Facettenliste in der UI (Quelltext-Scan wie bei den bestehenden Wächtern) |
| Unit | URL-Parser: unbekannte Werte werden ignoriert, nicht geworfen |
| E2E | Filter kombinieren · Chip entfernen · „Alle zurücksetzen" · Reload stellt Zustand wieder her · geteilte URL |
| Visuelle QA | Playwright-Screenshots Desktop + Mobil (Leiste, Popover, Drawer, aktive Chips) |

---

## 11. Umsetzungsreihenfolge

| Stufe | Inhalt | Ergebnis |
|---|---|---|
| 1 | Facettenfelder in `types.ts` ergänzen, **alle 43 Produkte** pflegen, Wächter-Tests | Datenmodell trägt die Filter |
| 2 | Reine Filterlogik + Facettenberechnung + Unit-Tests | Logik steht, ohne UI |
| 3 | `ProduktAbfrage`-Port + Speicher-Implementierung + Indizes | Abfrage steht, austauschbar |
| 4 | Shop-Seite als Server Component, URL-Parsing, Liste + Trefferzahl | funktioniert ohne Zierrat |
| 5 | Filterleiste Desktop (Chips, Popover, aktive Chips, Reset) | Desktop fertig |
| 6 | Mobil-Drawer + Feinschliff Barrierefreiheit/Animation | Mobil fertig |
| 7 | Sortierung inkl. Beliebtheits-Aggregat + Zwischenspeicher | Sortierung vollständig |
| 8 | SEO: `noindex`/`canonical`, kuratierte Landingpages | Suchmaschinen sauber |
| 9 | E2E + visuelle QA + vollständige Regression | abnahmefertig |

Stufen 1–4 liefern bereits einen benutzbaren, filterbaren Shop.

---

## 12. Offene Geschäftsentscheidungen (vor Stufe 1 zu klären)

1. **Vokabulare festlegen:** Welche Passform-Kategorien (Vorschlag: regular,
   slim, oversized, tailliert, weit) und welche Materialgruppen (Vorschlag:
   100 % Baumwolle, Bio-Baumwolle, Mischgewebe, Polyester, Recycelt)?
2. **`ausgelaufen`:** ganz ausblenden oder mit Hinweis zeigen?
3. **Standardsortierung**, solange kaum Bestellungen vorliegen (Vorschlag:
   Qualitätsstufe, dann Neuheit).
4. **Kuratierte Landingpages:** welche Kombinationen sind es wert?
5. **`aufgenommenAm` für den Bestand:** echtes Aufnahmedatum recherchieren oder
   einheitliches Startdatum setzen? (Betrifft „Neuheiten" nur anfangs.)
