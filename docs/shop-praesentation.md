# Shop-Präsentationsschicht

Die **kundenseitigen Seiten außerhalb des Konfigurators**: Startseite, Katalog,
Produktseiten, Checkout und Bestellansicht. Der Konfigurator selbst ist
eingefroren und in [konfigurator-logik.md](konfigurator-logik.md) beschrieben;
dieses Dokument behandelt alles Drumherum – die Schaufenster-, Informations- und
Abschlussflächen des Shops.

Ergänzt [architektur.md](architektur.md) (Schichten/Backend) um die
Darstellungsschicht. Gestaltungsgrundlagen: [designsystem.md](designsystem.md).

---

## 1. Seiten (Routen) und ihr Zweck

| Route | Datei | Zweck | Rendering |
|---|---|---|---|
| `/` | `app/page.tsx` | Startseite: Bühne, Serviceversprechen, Sortiment, Farbband, Veredelung, Konfigurator-CTA, Kennzahlen | statisch |
| `/produkt` | `app/produkt/page.tsx` | Katalogübersicht mit serverseitiger Filterung/Sortierung | `force-dynamic` |
| `/produkt/[slug]` | `app/produkt/[slug]/page.tsx` | Produktdetailseite (Slug = Produkt-ID) | statisch generiert |
| `/kontakt` | `app/kontakt/page.tsx` | Kontaktformular + Direktkontakt | statisch |
| `/faq` | `app/faq/page.tsx` | Häufige Fragen (+ FAQPage-Schema) | statisch |
| `/ueber-uns` | `app/ueber-uns/page.tsx` | Über das Unternehmen und die Verfahren | statisch |
| `/bestellung/[token]` | `app/bestellung/[token]/page.tsx` | Signierte Bestellansicht (Status, Storno) | `force-dynamic`, `noindex` |
| `/bestellung/zahlung/[orderId]` | `.../zahlung/[orderId]/page.tsx` | Rückleitung nach Bezahlvorgang (nur lesend) | `force-dynamic`, `noindex` |
| `/impressum`, `/datenschutz`, `/agb` | je `page.tsx` | Rechtstexte (Inhalt Sache des Betreibers) | statisch |

Kopf- und Fußzeile liegen global: [SiteHeader](../src/components/layout/SiteHeader.tsx)
(über [GlobaleKopfzeile](../src/components/layout/GlobaleKopfzeile.tsx), die sich
auf dem Konfigurator ausblendet) und [Footer](../src/components/layout/Footer.tsx).

## 2. Komponenten je Seite

- **Startseite** – rein aus `PRODUCTS`/`config` erzeugt (keine gepflegten
  Inhalte). Abschnitte: Bühne, `Versprechen` (Serviceleiste), Sortimentskacheln,
  Farbband, [`Veredelungsverfahren`](../src/components/shop/Veredelungsverfahren.tsx),
  dunkle Konfigurator-Sektion, Kennzahlen. Nur belegte Fakten (siehe Kopf­kommentar
  der Datei).
- **Katalog** – [`ShopFilter`](../src/components/shop/ShopFilter.tsx) (Rahmen mit
  Reitern, Chip-Menüs, Seitenleiste), [`Produktkachel`](../src/components/shop/Produktkachel.tsx)
  (Bild, Marke, Name, Ab-Preis, Farbpunkte, abgeleitete Badges „Bestseller“/
  Nachhaltigkeit), Ergebniskopf mit Sortierung, serverseitige Seitennavigation.
- **Produktdetail** – [`ProduktFarbwahl`](../src/components/produkt/ProduktFarbwahl.tsx)
  (Bild + Ansichts-/Farbwechsel, einziger Client-Teil), Preis-/Lieferbox,
  Größen, `Veredelungsverfahren`, Technische Daten, Veredelungsflächen,
  Eigenschaften, Pflege/Zertifikate/Nachhaltigkeit, Größentabelle, „Weitere …“
  und „Passt dazu“.
- **Checkout** – [`CartDrawer`](../src/components/layout/CartDrawer.tsx) mit den
  Zuständen `cart → checkout → confirmed` bzw. `inquiry → inquiry-sent`. Enthält
  das Bestell- und das Anfrageformular sowie die geteilte Feldkomponente `Feld`.
- **Bestellansicht** – [`Bestellfortschritt`](../src/components/orders/Bestellfortschritt.tsx),
  [`CancelOrderButton`](../src/components/orders/CancelOrderButton.tsx).

## 3. Datenflüsse

### Katalog
`app/produkt/page.tsx` liest die Kriterien aus der Adresszeile
([`leseKriterien`](../src/lib/catalog/kriterien.ts)), holt die Beliebtheit aus
echten Verkaufszahlen ([`ladeBeliebtheit`](../src/lib/catalog/beliebtheit.ts))
und fragt [`produktAbfrage().finde(...)`](../src/lib/catalog/abfrage.ts) ab
(Filter, Sortierung, Facetten, Seiten). Alles serverseitig – Filter schreiben nur
die URL fort, daher sind geteilte Links und Neuladen korrekt. Gefilterte
Ansichten sind `noindex, follow` (Vermeidung von Dünn-Inhalten).

### Produktseite
[`ladeProduktseite(slug)`](../src/lib/products/productPage.ts) ist eine reine
Leseansicht und liefert: das Produkt, Labels, `veredelungsflaechen` (aus dem
hybriden Flächenmodell), `aehnliche` (gleiche Produktart) und `empfehlungen`
(**Cross-Selling** über die feste `KOMPLEMENT`-Zuordnung – je komplementärer Art
der günstigste Vertreter). Neue Produkte bekommen ihre Seite ohne Zusatzpflege.

### Preisanzeige vs. verbindlicher Preis
Die Kachel/Detailseite zeigen den **Ab-Preis** (`basePrice`). Im Checkout wird
der Versand nur zur **Anzeige** aus [`calculateShipping`](../src/config/shipping.ts)
berechnet; verbindlich ist ausschließlich die serverseitige Neuberechnung beim
Absenden ([architektur.md](architektur.md) §4a). Der vom Client gemeldete Preis
wird nie übernommen.

### Bestellung / Anfrage
`CartDrawer` ruft die Server Actions [`submitOrder` / `submitInquiry`](../src/lib/actions/orders.ts)
über den Absende-Schutz [`useSubmitGuard`](../src/lib/hooks/useSubmitGuard.ts)
(verhindert Doppelabsendung, Timeout, Offline). Der weitere Weg der Bestellung:
[bestellablauf.md](bestellablauf.md), [bestellprozess-konsistenz.md](bestellprozess-konsistenz.md).

## 4. Gestaltungssprache

- **Warme Palette** statt neutralem Grau: `brand` (Dunkelbraun) mit
  Opazitätsstufen für Text, `gold`/`gold-dark` als Akzent, `cream`/`brand-light`
  als Flächen. Kundenseitige Shop-Flächen verwenden durchgehend diese Töne;
  neutrales `gray-*` ist dort abgelöst. (Konfigurator-Interna und der interne
  Adminbereich sind bewusst ausgenommen.) Tokens: [designsystem.md](designsystem.md).
- **Typografie**: Serif (`font-serif`, Playfair) für Überschriften, Sans (Inter)
  für Fließtext. Überschriften der Shop-Seiten sind serif.
- **Geteilte Komponente**: Die zwei Veredelungsverfahren erscheinen auf Start-
  und Produktseite über **eine** Quelle
  ([`Veredelungsverfahren`](../src/components/shop/Veredelungsverfahren.tsx));
  die Kurzbeschreibung ist wortgleich mit dem Methodenwähler des Konfigurators
  (i18n `method_*`).
- **Motion/Fokus/Reduced-Motion**: [animationen-und-ux.md](animationen-und-ux.md).

## 5. SEO

- Strukturierte Daten über [`JsonLd`](../src/components/seo/JsonLd.tsx) und die
  reinen Bauer in [`strukturierteDaten.ts`](../src/lib/seo/strukturierteDaten.ts):
  `Product` (AggregateOffer/lowPrice, **keine** erfundenen Bewertungen),
  `BreadcrumbList`, `Organization` (bewusst ohne Kontaktdaten – die stehen im
  Impressum, per Wächter-Test festgehalten) und `FAQPage` auf `/faq`.
- Metadaten je Seite inkl. `alternates.canonical`; `metadataBase` und die
  Basis-URL kommen aus [`basisUrl()`](../src/lib/seo/basisUrl.ts) (fail-fast in
  Produktion). Sitemap und robots: [`sitemap.ts`](../src/app/sitemap.ts),
  [`robots.ts`](../src/app/robots.ts).

## 6. Erweitern

Neues Produkt/Kategorie → [erweitern.md](erweitern.md). Für Cross-Selling einer
**neuen Kategorie** einen Eintrag in `KOMPLEMENT` (in `lib/products/productPage.ts`)
ergänzen; fehlt er, entfällt lediglich die „Passt dazu“-Reihe (kein Fehler).
