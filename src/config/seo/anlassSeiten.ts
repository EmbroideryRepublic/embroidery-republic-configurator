/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANLASS- UND RATGEBERSEITEN (SEO)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Warum es diese Seiten gibt: Marken- und Kategorieseiten (dtfSeiten.ts, kategorieSeiten.ts) bedienen Suchen nach
 * Produkt oder Marke. Viele Suchende beginnen aber mit dem ANLASS („Vereinskleidung bedrucken“, „T-Shirt mit Foto“,
 * „Abi-Hoodie“) oder mit einer FRAGE („Was kostet Textildruck?“, „Welche Datei brauche ich?“). Für diese Suchen gab es keine Seite.
 *
 * ── Nur belegte Aussagen ──────────────────────────────────────────────
 * Jede Aussage stammt aus bereits freigegebenen Texten (FAQ, Kategorie- und DTF-Seiten, Startseite) oder aus dem Code
 * (Auflösungs-Ampel, Versandsätze, Produktions- und Versandzeiten, Preis-Engine). Zahlen werden NICHT von Hand eingetragen,
 * sondern über Platzhalter aus Katalog und Konfiguration eingesetzt (lib/seo/anlassSeite.ts → fuelleAnlass):
 *   {anzahl} {arten} {produktion} {produktionszeit} {versand} {versandkosten} {frei} {dpiMin} {dpiOk} {abPreis_<art>}
 *   {gewichtMin_<art>} {gewichtMax_<art>}   (nur tshirt, hoodie, polo)   (<art> z. B. tshirt, hoodie, polo, zip_hoodie)
 * Preisbeispiele rechnet die Preis-Engine (berechneBeispiele) – dieselbe Funktion wie im Checkout.
 *
 * ── Warum NUR DTF-Transferdruck ────────────────────────────────────────
 * Die Stickerei ist vorübergehend abgeschaltet (BETRIEBSSCHALTER in config/bestellweg.ts). Diese Seiten versprechen sie
 * nicht; ein Test (anlassSeiten.test.ts) hält fest, dass kein „besticken/Stickerei“ darin steht, solange sie pausiert ist.
 *
 * ── Textfreigabe ──────────────────────────────────────────────────────
 * Alles in dieser Datei ist Kundentext und geht erst nach Freigabe des VOLLSTÄNDIGEN Wortlauts durch den Betreiber live.
 * Wortlaut zum Nachlesen: docs/seo/anlass-seiten-wortlaut.md.
 */
import type { ProductType } from '@/types';
import type { KategorieFrage } from '@/config/seo/kategorieSeiten';
import { EINLEITUNG_DTF } from '@/config/seo/dtfSeiten';

export interface AnlassAbschnitt {
  ueberschrift: string;
  absaetze?: string[];
  punkte?: string[];
  /**
   * Berechneter Baustein statt Fließtext: 'aufloesung' = Tabelle „Mindestbreite des Bildes in Pixeln“, 'rechner' = Auflösungsrechner,
   * 'groessen:<art>' = Größentabelle dreier Modelle, 'gewicht:<art>' = Gewichtsklassen der Art (beide aus dem Katalog,
   * lib/seo/katalogAuswertung.ts).
   */
  tabelle?:
    | 'aufloesung'
    | 'rechner'
    | 'groessen:tshirt'
    | 'groessen:hoodie'
    | 'groessen:polo'
    | 'gewicht:tshirt'
    | 'gewicht:hoodie'
    | 'gewicht:polo';
}

export interface AnlassBeispiel {
  beschriftung: string;
  /** Beispielprodukt = das günstigste Erwachsenen-Modell dieser Art. */
  art: ProductType;
  menge: number;
  flaechen: { ansicht: 'front' | 'back'; breiteCm: number; hoeheCm: number }[];
}

export interface AnlassSeite {
  /** Pfad ohne Schrägstrich. */
  slug: string;
  /** Kurzer Name für Links und Brotkrumen. */
  kurzname: string;
  /** `<title>`, höchstens 60 Zeichen, ohne Marken-Suffix. */
  titel: string;
  h1: string;
  eyebrow: string;
  /** Meta-Description-Vorlage (befüllt 70–160 Zeichen). */
  beschreibung: string;
  einleitung: string[];
  /** Gezeigte Modelle: je Art die ersten `anzahl` Treffer der Katalog-Sortierung. Leer = keine Kacheln (Ratgeber). */
  kacheln: { art: ProductType; anzahl: number }[];
  abschnitte: AnlassAbschnitt[];
  beispiele: AnlassBeispiel[];
  fragen: KategorieFrage[];
  /** Ratgeber ohne Bestellbezug zeigen den Bestellablauf nicht. */
  ohneAblauf?: boolean;
  /** Adressen weiterer Seiten (Kategorie-, DTF- oder Anlassseiten) für die Verlinkung am Seitenende. */
  verwandt: string[];
}

// ── Bausteine (wortgleich oder Auszug aus freigegebenen Texten) ─────────

/** Wortgleich: FAQ „Ab welcher Menge …“ / Kategorie- und DTF-Seiten. */
const A_EINZELSTUECK =
  'Ja. Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen. Größen dürfen Sie frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Wortgleich wie auf den DTF-Seiten. */
const A_DATEIEN =
  'SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren.';
/** Wortgleich wie auf den DTF-Seiten. */
const A_DAUER =
  'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druckdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren Sie in diesem Fall.';
/** Wortgleich: FAQ „Wie hoch sind die Versandkosten?“ (Beträge als Platzhalter, damit sie nie veralten). */
const A_VERSAND =
  'Wir liefern aktuell ausschließlich innerhalb Deutschlands. Die Versandkosten betragen {versandkosten} – ab einem Bestellwert von {frei} liefern wir versandkostenfrei.';
/** Wortgleich: FAQ „Welche Zahlungsmöglichkeiten gibt es?“, ohne den Stickerei-Satz. */
const A_ZAHLUNG =
  'Sie können zwischen Kreditkarte, PayPal und Kauf auf Rechnung wählen. Bei Kreditkarte und PayPal wird der Betrag direkt im Bestellvorgang über den jeweiligen Anbieter abgebucht. Bei Kauf auf Rechnung wird im Bestellvorgang selbst nichts abgebucht; Sie erhalten die Rechnung separat im Zuge der Auftragsbearbeitung, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug.';
/** Wortnah aus den AGB (§ 4 Abs. 2 und 3): Endpreise, Kleinunternehmer, Versandkosten kommen hinzu. */
const A_STEUER =
  'Nein. Alle angegebenen Preise sind Endpreise. Wir sind Kleinunternehmer im Sinne von § 19 UStG und weisen daher keine Umsatzsteuer aus. Versandkosten kommen zum Warenwert hinzu; ab {frei} Bestellwert liefern wir versandkostenfrei.';
/** Aus A_EINZELSTUECK: Antwort auf „Können wir die Größen mischen?“. */
const A_GROESSEN =
  'Ja. Größen dürfen Sie frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Wie A_EINZELSTUECK, als Antwort auf eine Frage, die nicht mit „Ja/Nein“ gestellt ist. */
const A_MENGE_STAFFEL =
  'Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen. Größen dürfen Sie frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Aus der FAQ („Sehe ich vor der Produktion eine Freigabe?“), ohne den Stickerei-Halbsatz. */
const A_FREIGABE = 'Vor Produktionsstart erhalten Sie eine finale Vorschau zur Freigabe.';

/** Zwei freigegebene Bausteine der Startseite: Positionen und Maße. */
const ABSATZ_POSITIONEN =
  'Auf Vorder- und Rückseite lässt sich je ein Motiv platzieren, bei vielen Modellen zusätzlich auf den Ärmeln. Im Konfigurator sehen Sie jede Fläche samt Maßen in Zentimetern.';
const ABSATZ_MEHRERE_PRODUKTE =
  'Konfigurieren Sie ein Produkt, legen Sie es in den Warenkorb und konfigurieren Sie anschließend das nächste – zum Beispiel Hoodies und T-Shirts im selben Auftrag. Alle Positionen werden gemeinsam im Warenkorb zusammengefasst.';

// ── Die Seiten ──────────────────────────────────────────────────────────

export const ANLASS_SEITEN: AnlassSeite[] = [
  // ── Vereine und Teams ──────────────────────────────────────────────
  {
    slug: 'vereinskleidung-bedrucken',
    kurzname: 'Vereinskleidung',
    titel: 'Vereinskleidung bedrucken lassen – ab 1 Stück',
    h1: 'Vereinskleidung bedrucken lassen',
    eyebrow: 'Für Vereine und Teams',
    beschreibung:
      'Hoodies, T-Shirts und Polos mit Vereinslogo per DTF-Transferdruck bedrucken – ab 1 Stück, Größen frei mischbar, Preis live im Konfigurator.',
    einleitung: [
      'Hoodies fürs Trainerteam, T-Shirts für die Mannschaft, Polos für den Vorstand: Es gibt {anzahl} Modelle ({arten}). Laden Sie Ihr Vereinslogo hoch und sehen Sie direkt im Konfigurator, wie es auf dem Textil sitzt – mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'tshirt', anzahl: 2 },
      { art: 'hoodie', anzahl: 2 },
      { art: 'polo', anzahl: 2 },
      { art: 'zip-hoodie', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Warum sich DTF-Transferdruck für Vereine eignet',
        punkte: [
          'Vollfarbig: Vereinsfarben, Wappen und Farbverläufe lassen sich in einem Druck umsetzen.',
          'Keine Mindestmenge: Sie können ab einem einzelnen Stück bestellen.',
          'Größen frei mischen: Ein Motiv, beliebig viele Größen – zum Beispiel 2× M, 6× L und 2× XL in einem Auftrag.',
          'Staffelpreise: Mit größerer Menge sinkt der Stückpreis, die Staffel beginnt bei 5 Stück.',
        ],
      },
      {
        ueberschrift: 'Brust, Rücken, Ärmel: So platzieren Sie das Vereinslogo',
        absaetze: [
          ABSATZ_POSITIONEN,
          'Ein klassisches Layout: das Wappen klein auf der Brust, der Vereinsname groß auf dem Rücken.',
        ],
      },
      {
        ueberschrift: 'Bestellen für die ganze Mannschaft',
        absaetze: [ABSATZ_MEHRERE_PRODUKTE, A_FREIGABE],
      },
    ],
    beispiele: [
      {
        beschriftung: '10 T-Shirts · Vereinslogo auf der Brust (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Hoodies · Logo auf der Brust (ca. 10 × 10 cm) und Vereinsname auf dem Rücken (ca. 20 × 25 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
      },
      {
        beschriftung: '20 Polos · Vereinslogo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 20,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
    ],
    fragen: [
      { q: 'Ab wie vielen Teilen lohnt sich eine Vereinsbestellung?', a: A_MENGE_STAFFEL },
      {
        q: 'Welche Dateien brauchen wir für das Vereinslogo?',
        a: `${A_DATEIEN} Vor der Produktion prüfen wir Ihre Datei kostenlos.`,
      },
      { q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER },
      { q: 'Können Vereine auf Rechnung bezahlen?', a: `Ja. ${A_ZAHLUNG}` },
      { q: 'Wie hoch sind die Versandkosten?', a: A_VERSAND },
    ],
    verwandt: [
      'hoodies-bedrucken-besticken',
      't-shirts-bedrucken-besticken',
      'poloshirts-besticken-bedrucken',
      'firmenkleidung-bedrucken',
      'textildruck-preise',
      'druckdaten-vorbereiten',
    ],
  },

  // ── Unternehmen ────────────────────────────────────────────────────
  {
    slug: 'firmenkleidung-bedrucken',
    kurzname: 'Firmenkleidung',
    titel: 'Firmenkleidung bedrucken lassen – ab 1 Stück',
    h1: 'Firmenkleidung bedrucken lassen',
    eyebrow: 'Für Unternehmen',
    beschreibung:
      'Polos, Hoodies und Jacken mit Firmenlogo per DTF-Transferdruck bedrucken – ab 1 Stück, Kauf auf Rechnung, Preis live im Konfigurator.',
    einleitung: [
      'Polos für den Außendienst, Hoodies fürs Team, Jacken für draußen: Es gibt {anzahl} Modelle ({arten}). Laden Sie Ihr Firmenlogo hoch, platzieren Sie es auf Brust, Rücken oder Ärmel und sehen Sie den Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'polo', anzahl: 2 },
      { art: 'hoodie', anzahl: 2 },
      { art: 'jacket', anzahl: 2 },
      { art: 'tshirt', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Was für Unternehmen wichtig ist',
        punkte: [
          'Auch einzelne Teile: Es gibt keine Mindestbestellmenge – zum Beispiel für neue Mitarbeitende oder einen ersten Probedruck.',
          'Kauf auf Rechnung: Neben Kreditkarte und PayPal können Sie auf Rechnung bezahlen, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug.',
          'Endpreise ohne Steuerausweis: Wir sind Kleinunternehmer im Sinne von § 19 UStG und weisen keine Umsatzsteuer aus.',
          'Dateiprüfung: Vor der Produktion prüfen wir Ihr Logo kostenlos.',
        ],
      },
      {
        ueberschrift: 'Das Firmenlogo richtig platzieren',
        absaetze: [
          ABSATZ_POSITIONEN,
          'Für Logos eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren.',
        ],
      },
      {
        ueberschrift: 'Bestellung für das ganze Unternehmen',
        absaetze: [ABSATZ_MEHRERE_PRODUKTE, A_FREIGABE],
      },
    ],
    beispiele: [
      {
        beschriftung: '1 Polo · Firmenlogo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Polos · Firmenlogo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Hoodies · Logo auf der Brust (ca. 10 × 10 cm) und Firmenname auf dem Rücken (ca. 20 × 25 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
      },
    ],
    fragen: [
      { q: 'Können wir auch einzelne Teile bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Können Unternehmen auf Rechnung bezahlen?', a: `Ja. ${A_ZAHLUNG}` },
      { q: 'Wird die Umsatzsteuer ausgewiesen?', a: A_STEUER },
      {
        q: 'Welche Dateien brauchen wir für das Firmenlogo?',
        a: `${A_DATEIEN} Vor der Produktion prüfen wir Ihre Datei kostenlos.`,
      },
      { q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER },
    ],
    verwandt: [
      'poloshirts-besticken-bedrucken',
      'hoodies-bedrucken-besticken',
      'jacken-bedrucken',
      'vereinskleidung-bedrucken',
      'textildruck-preise',
      'druckdaten-vorbereiten',
    ],
  },

  // ── Abschlussjahrgänge ─────────────────────────────────────────────
  {
    slug: 'abschluss-hoodies-bedrucken',
    kurzname: 'Abschluss-Hoodies',
    titel: 'Abschluss-Hoodies bedrucken lassen – ab 1 Stück',
    h1: 'Abschluss-Hoodies und Abi-Pullis bedrucken lassen',
    eyebrow: 'Für Jahrgänge und Klassen',
    beschreibung:
      'Abi- und Abschluss-Hoodies mit Jahrgang, Namen oder Motto per DTF-Transferdruck bedrucken – ab 1 Stück, Größen frei mischbar, Preis live.',
    einleitung: [
      'Ein Hoodie für den ganzen Jahrgang: Wählen Sie unter {anzahl} Modellen ({arten}), setzen Sie Jahrgang, Motto oder Namen als Text oder laden Sie ein eigenes Motiv hoch. Der Konfigurator zeigt Vorder- und Rückseite mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'hoodie', anzahl: 6 },
      { art: 'zip-hoodie', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Ein Motiv, alle Größen',
        absaetze: [
          'Größen lassen sich frei mischen: Ein Auftrag mit 2× S, 8× M, 10× L und 4× XL ist ein Auftrag mit einem Motiv. Mit größerer Menge sinkt der Stückpreis, die Staffel beginnt bei 5 Stück.',
        ],
      },
      {
        ueberschrift: 'Ideen für das Layout',
        punkte: [
          'Brust: Schullogo oder kurzer Schriftzug, klein platziert.',
          'Rücken: Jahrgang und Motto groß.',
          'Ärmel: Jahreszahl oder Kürzel – bei Modellen mit Ärmelfläche.',
        ],
        absaetze: [ABSATZ_POSITIONEN],
      },
      {
        ueberschrift: 'Rechtzeitig planen',
        absaetze: [
          'Die reguläre Produktionszeit beträgt {produktionszeit}, der anschließende Versand erfolgt innerhalb von {versand}. Eine Sammelbestellung gelingt am besten, wenn Größen und Mengen vor der Bestellung feststehen – und vor Produktionsstart erhalten Sie eine finale Vorschau zur Freigabe.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '10 Hoodies · Motiv auf dem Rücken (ca. 20 × 25 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [{ ansicht: 'back', breiteCm: 20, hoeheCm: 25 }],
      },
      {
        beschriftung: '25 Hoodies · Logo auf der Brust (ca. 10 × 10 cm) und Motto auf dem Rücken (ca. 20 × 25 cm)',
        art: 'hoodie',
        menge: 25,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
      },
    ],
    fragen: [
      {
        q: 'Können wir erst einen Hoodie als Muster bestellen?',
        a: 'Ja. Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen.',
      },
      { q: 'Können wir die Größen mischen?', a: A_GROESSEN },
      { q: 'Wie früh sollten wir bestellen?', a: A_DAUER },
      {
        q: 'Welche Dateien kann ich für das Motiv hochladen?',
        a: `${A_DATEIEN} Reicht ein Schriftzug, können Sie ihn auch direkt im Konfigurator als Text setzen.`,
      },
      { q: 'Wie hoch sind die Versandkosten?', a: A_VERSAND },
    ],
    verwandt: [
      'hoodies-bedrucken-besticken',
      'zip-hoodies-bedrucken',
      'vereinskleidung-bedrucken',
      'textildruck-preise',
      'druckdaten-vorbereiten',
    ],
  },

  // ── Eigenes Foto ───────────────────────────────────────────────────
  {
    slug: 'tshirt-mit-foto-bedrucken',
    kurzname: 'T-Shirt mit Foto',
    titel: 'T-Shirt mit eigenem Foto bedrucken – ab 1 Stück',
    h1: 'T-Shirt mit eigenem Foto bedrucken lassen',
    eyebrow: 'Für Ihr Lieblingsbild',
    beschreibung:
      'Eigenes Foto auf T-Shirt, Hoodie oder Longsleeve drucken lassen – vollfarbig per DTF-Transferdruck, ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Familienfoto, Haustier oder Urlaubsmotiv: Laden Sie Ihr Foto hoch, platzieren Sie es auf Vorder- oder Rückseite und sehen Sie das Ergebnis samt Preis direkt im Konfigurator. Es gibt {anzahl} Modelle ({arten}).',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'tshirt', anzahl: 4 },
      { art: 'hoodie', anzahl: 2 },
      { art: 'longsleeve', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'So wird aus Ihrem Foto ein scharfer Druck',
        punkte: [
          'Hochauflösende Datei: JPG und PNG werden unterstützt. Je mehr Bildpunkte das Foto hat, desto schärfer wird der Druck.',
          'Auflösungs-Ampel: Der Konfigurator bewertet Ihr Bild bei der gewählten Druckgröße – grün ab {dpiOk} dpi, gelb ab {dpiMin} dpi, darunter rot mit dem Hinweis, das Bild kleiner zu platzieren oder eine höher aufgelöste Datei zu verwenden.',
          'Weißer Hintergrund: Bei Bildern mit weißem Hintergrund können Sie diesen beim Hochladen automatisch entfernen lassen (einfache Freistellung).',
          'Freigabe: Vor der Produktion prüfen wir Ihre Datei kostenlos, und Sie erhalten eine finale Vorschau zur Freigabe.',
        ],
      },
      {
        ueberschrift: 'Wie groß darf das Foto sein?',
        absaetze: [
          'Der Konfigurator zeigt Ihr Motiv in Zentimetern; je Modell und Größe gilt eine maximale Druckfläche. Auf Vorder- und Rückseite lässt sich je ein Foto platzieren, bei vielen Modellen zusätzlich auf den Ärmeln.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '1 T-Shirt · Foto auf der Brust (ca. 20 × 20 cm)',
        art: 'tshirt',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 20, hoeheCm: 20 }],
      },
      {
        beschriftung: '1 Hoodie · Foto auf der Brust (ca. 20 × 20 cm)',
        art: 'hoodie',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 20, hoeheCm: 20 }],
      },
      {
        beschriftung: '5 T-Shirts · Foto auf der Brust (ca. 20 × 20 cm)',
        art: 'tshirt',
        menge: 5,
        flaechen: [{ ansicht: 'front', breiteCm: 20, hoeheCm: 20 }],
      },
    ],
    fragen: [
      { q: 'Kann ich nur ein einzelnes T-Shirt mit Foto bestellen?', a: A_EINZELSTUECK },
      {
        q: 'Welche Dateiformate kann ich für das Foto hochladen?',
        a: 'Für Fotos eignen sich JPG/JPEG und PNG; unterstützt werden außerdem SVG und PDF. Je höher die Auflösung des Fotos, desto schärfer wird der Druck.',
      },
      {
        q: 'Was passiert bei einem Foto mit zu niedriger Auflösung?',
        a: 'Der Konfigurator zeigt dann eine Warnung: Die Auflösung ist zu niedrig für einen scharfen Druck (unter {dpiMin} dpi bei der gewählten Größe). Platzieren Sie das Bild kleiner, verwenden Sie ein SVG oder laden Sie eine höher aufgelöste Datei hoch.',
      },
      {
        q: 'Kann ich das Foto auf Vorder- und Rückseite drucken?',
        a: 'Ja. Auf der Vorder- und Rückseite lässt sich je ein Motiv platzieren, bei vielen Modellen zusätzlich auf den Ärmeln. Der Preis hängt davon ab, wie viele Flächen bedruckt werden – er wird im Konfigurator live berechnet.',
      },
      { q: 'Wie lange dauert es, bis das Shirt ankommt?', a: A_DAUER },
    ],
    verwandt: [
      't-shirts-bedrucken-besticken',
      'hoodies-bedrucken-besticken',
      'longsleeves-bedrucken',
      'druckdaten-vorbereiten',
      'textildruck-preise',
    ],
  },

  // ── Ratgeber: Preise ───────────────────────────────────────────────
  {
    slug: 'textildruck-preise',
    kurzname: 'Textildruck-Preise',
    titel: 'Was kostet Textildruck? Preisbeispiele ab 1 Stück',
    h1: 'Was kostet Textildruck?',
    eyebrow: 'Preise und Beispiele',
    beschreibung:
      'Preisbeispiele für DTF-Transferdruck auf T-Shirt, Hoodie und Polo: ein Einzelstück oder 10 bis 50 Stück – berechnet wie im Konfigurator, ab 1 Stück.',
    einleitung: [
      'Der Preis setzt sich aus dem Textil und der Veredelung zusammen. Das Textil beginnt bei {abPreis_tshirt} (T-Shirt), {abPreis_hoodie} (Hoodie) bzw. {abPreis_polo} (Polo) pro Stück. Hinzu kommt der Druck je bedruckter Fläche, und mit größerer Menge sinkt der Stückpreis.',
      'Die Beispiele auf dieser Seite werden mit derselben Preisberechnung ermittelt wie im Konfigurator. Ihren genauen Preis sehen Sie dort in Echtzeit, bevor Sie etwas in den Warenkorb legen.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'Woraus sich der Preis zusammensetzt',
        punkte: [
          'Textil: Jedes Modell hat einen eigenen Grundpreis, er steht auf der Produktseite.',
          'Veredelung: Beim DTF-Transferdruck bestimmt die Zahl der bedruckten Flächen den Preis (zum Beispiel Brust und Rücken), nicht die Größe des Motivs.',
          'Menge: Staffelpreise gelten ab 5 Stück. Je größer die Menge, desto günstiger wird der Stückpreis.',
          'Versand: {versandkosten} innerhalb Deutschlands, ab {frei} Bestellwert versandkostenfrei.',
          'Steuer: Alle Preise sind Endpreise – wir sind Kleinunternehmer im Sinne von § 19 UStG und weisen keine Umsatzsteuer aus.',
        ],
      },
      {
        ueberschrift: 'Bei größeren Mengen lohnt ein Blick auf die Staffeln',
        absaetze: [
          'Die Staffelgrenzen gelten für die gesamte Bestellung. Liegt Ihre Menge knapp darunter, kann eine etwas größere Menge insgesamt günstiger sein – der Konfigurator weist Sie darauf hin, wenn das der Fall ist.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '1 T-Shirt · Brustmotiv (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 T-Shirts · Brustmotiv (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '50 T-Shirts · Brustmotiv (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 50,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '1 Hoodie · Brustmotiv (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Hoodies · Brustmotiv (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Hoodies · Brustmotiv (ca. 10 × 10 cm) und Rückenmotiv (ca. 20 × 25 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
      },
      {
        beschriftung: '1 Polo · Brustmotiv (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Polos · Brustmotiv (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
    ],
    fragen: [
      {
        q: 'Wovon hängt der Preis für bedruckte Textilien ab?',
        a: 'Vom Textil (jedes Modell hat einen eigenen Grundpreis), von der Zahl der bedruckten Flächen und von der Menge. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.',
      },
      { q: 'Gibt es eine Mindestbestellmenge?', a: A_MENGE_STAFFEL.replace('Es gibt keine Mindestbestellmenge', 'Nein, es gibt keine Mindestbestellmenge') },
      { q: 'Wie hoch sind die Versandkosten?', a: A_VERSAND },
      { q: 'Wird auf die angezeigten Preise noch Umsatzsteuer aufgeschlagen?', a: A_STEUER },
      {
        q: 'Kann ich den Preis vorab sehen, ohne zu bestellen?',
        a: 'Ja. Im Konfigurator sehen Sie Stück- und Gesamtpreis in Echtzeit, bevor Sie etwas in den Warenkorb legen. Der Preis ändert sich mit jeder Anpassung von Motiv, Fläche und Menge.',
      },
    ],
    verwandt: [
      't-shirts-bedrucken-besticken',
      'hoodies-bedrucken-besticken',
      'poloshirts-besticken-bedrucken',
      'vereinskleidung-bedrucken',
      'firmenkleidung-bedrucken',
      'druckdaten-vorbereiten',
    ],
  },

  // ── Ratgeber: Auflösungsrechner ────────────────────────────────────
  {
    slug: 'druckaufloesung-rechner',
    kurzname: 'Auflösungsrechner',
    titel: 'Druckauflösung berechnen: dpi-Rechner für Textildruck',
    h1: 'Druckauflösung berechnen',
    eyebrow: 'Kostenloser Rechner',
    beschreibung:
      'Reicht die Auflösung Ihres Bildes? Bildbreite und Druckbreite eingeben, dpi berechnen und mit der Ampel des Konfigurators bewerten.',
    einleitung: [
      'Reicht die Auflösung Ihres Bildes für die gewünschte Druckgröße? Geben Sie die Breite Ihres Bildes in Pixeln und die Breite des Drucks in Zentimetern ein – der Rechner zeigt die Auflösung in dpi und bewertet sie mit derselben Ampel wie der Konfigurator.',
    ],
    kacheln: [],
    abschnitte: [
      { ueberschrift: 'Auflösung berechnen', tabelle: 'rechner' },
      {
        ueberschrift: 'So lesen Sie das Ergebnis',
        punkte: [
          'Grün ab {dpiOk} dpi: optimale Druckqualität bei dieser Größe.',
          'Gelb von {dpiMin} bis {dpiOk} dpi: akzeptabel, für sehr große Drucke aber eher knapp.',
          'Rot unter {dpiMin} dpi: zu unscharf. Platzieren Sie das Bild kleiner, verwenden Sie ein SVG oder laden Sie eine höher aufgelöste Datei hoch.',
        ],
        absaetze: ['Der Konfigurator bewertet die Auflösung nur bei Rasterbildern (PNG, JPG); SVG und PDF bekommen keine Auflösungswarnung.'],
      },
      {
        ueberschrift: 'So wird gerechnet',
        absaetze: [
          'Die Auflösung ergibt sich aus den Bildpunkten pro Zoll (1 Zoll = 2,54 cm): dpi = Bildbreite in Pixeln ÷ (Druckbreite in cm ÷ 2,54). Ein Bild mit 2.000 Pixeln Breite hat bei 20 cm Druckbreite rund 254 dpi.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Was bedeutet dpi?',
        a: 'dpi steht für „dots per inch“, also Bildpunkte pro Zoll (1 Zoll = 2,54 cm). Je mehr Bildpunkte auf einen Zoll der gedruckten Breite fallen, desto schärfer wirkt der Druck.',
      },
      {
        q: 'Wie berechne ich die Auflösung meines Bildes?',
        a: 'dpi = Bildbreite in Pixeln ÷ (Druckbreite in cm ÷ 2,54). Der Rechner oben übernimmt das für Sie.',
      },
      {
        q: 'Ab wie vielen dpi ist ein Motiv scharf genug?',
        a: 'Der Konfigurator bewertet ab {dpiOk} dpi die Qualität als optimal (grün), zwischen {dpiMin} und {dpiOk} dpi als akzeptabel (gelb) und darunter als zu niedrig (rot).',
      },
      {
        q: 'Brauchen SVG- und PDF-Dateien eine Mindestauflösung?',
        a: 'Der Konfigurator bewertet die Auflösung nur bei Rasterbildern (PNG, JPG). SVG und PDF bekommen keine Auflösungswarnung; vektorbasierte Dateien skalieren verlustfrei.',
      },
      {
        q: 'Was kann ich tun, wenn die Auflösung zu niedrig ist?',
        a: 'Platzieren Sie das Bild kleiner, verwenden Sie ein SVG oder laden Sie eine höher aufgelöste Datei hoch.',
      },
    ],
    ohneAblauf: true,
    verwandt: ['druckdaten-vorbereiten', 'tshirt-mit-foto-bedrucken', 'textildruck-preise', 'vereinskleidung-bedrucken'],
  },

  // ── Ratgeber: Größentabelle ────────────────────────────────────────
  {
    slug: 'groessentabelle-t-shirts-hoodies',
    kurzname: 'Größentabelle',
    titel: 'Größentabelle T-Shirt, Hoodie & Polo: Maße in cm',
    h1: 'Größentabelle für T-Shirts, Hoodies und Polos',
    eyebrow: 'Maße in Zentimetern',
    beschreibung:
      'Brustbreite und Länge je Größe in cm: Herstellermaße ausgewählter T-Shirts, Hoodies und Polos – plus Tipps, wie Sie richtig nachmessen.',
    einleitung: [
      'Welche Größe passt? Die Maße unterscheiden sich von Modell zu Modell. Diese Seite zeigt die Herstellermaße von je drei Modellen aus unserem Sortiment; die vollständige Größentabelle steht auf jeder Produktseite.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'So messen Sie richtig',
        punkte: [
          'Legen Sie ein T-Shirt, einen Hoodie oder ein Polo, das gut passt, flach hin.',
          'Brustbreite: von Achselnaht zu Achselnaht gemessen. Der Brustumfang ist doppelt so groß.',
          'Länge: vom höchsten Punkt der Schulter bis zum Saum.',
          'Vergleichen Sie Ihre Werte mit der Tabelle des Modells, das Sie bestellen möchten.',
        ],
      },
      { ueberschrift: 'T-Shirts', tabelle: 'groessen:tshirt' },
      { ueberschrift: 'Hoodies', tabelle: 'groessen:hoodie' },
      { ueberschrift: 'Polos', tabelle: 'groessen:polo' },
      {
        ueberschrift: 'Kindergrößen',
        absaetze: [
          'Kinderbekleidung führt je Hersteller eigene Größenangaben – als Körpergröße in cm, als Alter oder in Jugendgrößen. Wir übernehmen sie so, wie der Hersteller sie angibt; die Maße je Größe stehen auf der Produktseite.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Wo finde ich die Größentabelle des Modells, das ich bestellen möchte?',
        a: 'Auf der Produktseite des Modells unter „Größentabelle“. Dort stehen die Herstellermaße aller Größen.',
      },
      {
        q: 'Fallen die Modelle groß oder klein aus?',
        a: 'Das hängt vom Modell ab. Die Passform steht auf der Produktseite unter „Technische Daten“, die Maße je Größe in der Größentabelle. Messen Sie am besten ein Teil nach, das Ihnen gut passt, und vergleichen Sie.',
      },
      { q: 'Kann ich Größen in einer Bestellung mischen?', a: A_GROESSEN },
      {
        q: 'Wie lege ich die Größen für ein Team fest?',
        a: 'Lassen Sie jede Person ein passendes Teil nachmessen und die Maße mit der Größentabelle des Modells vergleichen. Im Konfigurator tragen Sie die Stückzahl je Größe ein – Größen dürfen Sie frei mischen.',
      },
      {
        q: 'Sind die Maße exakt?',
        a: 'Es sind Herstellerangaben; kleine Abweichungen durch Fertigung und Material sind möglich.',
      },
    ],
    ohneAblauf: true,
    verwandt: [
      't-shirts-bedrucken-besticken',
      'hoodies-bedrucken-besticken',
      'poloshirts-besticken-bedrucken',
      'vereinskleidung-bedrucken',
      'kinderbekleidung-bedrucken',
    ],
  },

  // ── Ratgeber: Stoffgewicht ─────────────────────────────────────────
  {
    slug: 'stoffgewicht-t-shirt-hoodie',
    kurzname: 'Stoffgewicht',
    titel: 'Stoffgewicht erklärt: g/m² bei T-Shirt, Hoodie & Polo',
    h1: 'Stoffgewicht erklärt: Was bedeuten g/m²?',
    eyebrow: 'Material verstehen',
    beschreibung:
      'Was sagt das Stoffgewicht in g/m² aus? Gewichtsklassen von T-Shirts, Hoodies und Polos mit Beispielmodellen aus unserem Sortiment.',
    einleitung: [
      'Das Stoffgewicht, auch Flächengewicht genannt, gibt an, wie viel ein Quadratmeter Stoff wiegt. Ein höheres Gewicht bedeutet in der Regel einen dickeren, festeren Stoff. Hier steht, wie sich unser Sortiment auf die Gewichtsklassen verteilt.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'Was die Zahl bedeutet',
        punkte: [
          'Leichte Stoffe fühlen sich dünner und luftiger an.',
          'Schwere Stoffe fühlen sich dicker, fester und wärmer an.',
          'Das Stoffgewicht allein sagt nichts über Passform oder Verarbeitung aus.',
        ],
      },
      { ueberschrift: 'T-Shirts nach Stoffgewicht', tabelle: 'gewicht:tshirt' },
      { ueberschrift: 'Hoodies nach Stoffgewicht', tabelle: 'gewicht:hoodie' },
      { ueberschrift: 'Polos nach Stoffgewicht', tabelle: 'gewicht:polo' },
      {
        ueberschrift: 'Stoffgewicht und Bedrucken',
        absaetze: [
          'Bedruckt wird per DTF-Transferdruck: vollfarbig, mit einem flexiblen Griff, der sich mit dem Stoff bewegt. Material und Stoffgewicht jedes Modells stehen auf der Produktseite.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      { q: 'Was bedeutet g/m²?', a: 'Gramm pro Quadratmeter: Die Angabe zeigt, wie viel ein Quadratmeter des Stoffes wiegt (Flächengewicht).' },
      {
        q: 'Welches Stoffgewicht haben die T-Shirts im Sortiment?',
        a: 'Die T-Shirts haben Stoffgewichte von {gewichtMin_tshirt} bis {gewichtMax_tshirt} g/m². Das genaue Gewicht steht auf jeder Produktseite.',
      },
      {
        q: 'Wie unterscheiden sich Hoodies im Stoffgewicht?',
        a: 'Die Hoodies haben Stoffgewichte von {gewichtMin_hoodie} bis {gewichtMax_hoodie} g/m². Das genaue Gewicht steht auf jeder Produktseite.',
      },
      {
        q: 'Wo finde ich das Stoffgewicht eines Modells?',
        a: 'Auf der Produktseite unter „Technische Daten“ als „Flächengewicht“ in g/m².',
      },
      {
        q: 'Welches Stoffgewicht haben die Polos?',
        a: 'Die Polos haben Stoffgewichte von {gewichtMin_polo} bis {gewichtMax_polo} g/m². Material, Passform und Gewicht stehen auf jeder Produktseite.',
      },
    ],
    ohneAblauf: true,
    verwandt: [
      't-shirts-bedrucken-besticken',
      'hoodies-bedrucken-besticken',
      'poloshirts-besticken-bedrucken',
      'groessentabelle-t-shirts-hoodies',
      'textildruck-preise',
    ],
  },

  // ── Ratgeber: Druckdaten ───────────────────────────────────────────
  {
    slug: 'druckdaten-vorbereiten',
    kurzname: 'Logo vorbereiten',
    titel: 'Logo für den Textildruck vorbereiten: Dateien & Auflösung',
    h1: 'Logo für den Textildruck vorbereiten',
    eyebrow: 'Ratgeber',
    beschreibung:
      'Welche Dateiformate eignen sich, wie hoch muss die Auflösung sein, was tun bei weißem Hintergrund? So bereiten Sie Ihr Logo für den DTF-Druck vor.',
    einleitung: [
      'Ein scharfer Druck beginnt mit der richtigen Datei. Hier steht, welche Formate Sie hochladen können, wie viele Bildpunkte Ihr Motiv braucht und was der Konfigurator Ihnen zur Qualität anzeigt.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'Welche Dateiformate werden unterstützt?',
        punkte: [
          'SVG und PDF (Vektor): skalieren verlustfrei und eignen sich am besten für Logos und Schriftzüge.',
          'PNG: für Rastergrafiken, auch mit transparentem Hintergrund.',
          'JPG/JPEG: für Fotos. JPG kennt keinen transparenten Hintergrund.',
        ],
      },
      {
        ueberschrift: 'Wie hoch muss die Auflösung sein?',
        absaetze: [
          'Bei Rasterbildern (PNG, JPG) zählt, wie viele Bildpunkte auf einen Zoll der gedruckten Breite fallen. Der Konfigurator bewertet das für Ihre gewählte Druckgröße: ab {dpiOk} dpi gilt die Qualität als optimal (grün), zwischen {dpiMin} und {dpiOk} dpi als akzeptabel (gelb), darunter als zu niedrig (rot). Vektordateien (SVG, PDF) bekommen nie eine Warnung.',
          'Die Tabelle zeigt, wie breit Ihr Bild mindestens sein sollte, wenn das Motiv in der jeweiligen Breite gedruckt wird.',
        ],
        tabelle: 'aufloesung',
      },
      {
        ueberschrift: 'Weißer Hintergrund und Freistellung',
        absaetze: [
          'Hat Ihr Bild einen weißen Hintergrund, der nicht mitgedruckt werden soll, können Sie ihn beim Hochladen automatisch entfernen lassen (einfache Freistellung). Am saubersten gelingt es mit einer Datei, die bereits transparent freigestellt ist.',
        ],
      },
      {
        ueberschrift: 'Ein Schriftzug ohne Datei',
        absaetze: ['Reicht ein Schriftzug, setzen Sie ihn direkt im Konfigurator als Text – dafür brauchen Sie keine Datei.'],
      },
      {
        ueberschrift: 'Wir prüfen Ihre Datei',
        absaetze: [`Vor der Produktion prüfen wir Ihre Datei kostenlos. ${A_FREIGABE}`],
      },
    ],
    beispiele: [],
    fragen: [
      { q: 'Welche Dateiformate kann ich für mein Logo hochladen?', a: A_DATEIEN },
      {
        q: 'Was ist der Unterschied zwischen Vektor- und Rasterdateien?',
        a: 'Vektordateien (SVG, PDF) bestehen aus Linien und Flächen und lassen sich beliebig vergrößern, ohne unscharf zu werden. Rasterdateien (PNG, JPG) bestehen aus Bildpunkten und werden beim Vergrößern unschärfer.',
      },
      {
        q: 'Mein Bild ist zu klein – was kann ich tun?',
        a: 'Der Konfigurator warnt, wenn die Auflösung bei der gewählten Größe zu niedrig ist (unter {dpiMin} dpi). Platzieren Sie das Bild dann kleiner, verwenden Sie ein SVG oder laden Sie eine höher aufgelöste Datei hoch.',
      },
      {
        q: 'Kann ich auch Fotos drucken lassen?',
        a: 'Ja. DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Laden Sie das Foto als JPG oder PNG hoch; die Auflösungs-Ampel zeigt Ihnen, ob es für die gewählte Größe scharf genug ist.',
      },
      {
        q: 'Kann ich einen Schriftzug drucken lassen, ohne eine Datei zu haben?',
        a: 'Ja. Im Konfigurator können Sie Text direkt setzen und platzieren – ohne Datei.',
      },
    ],
    ohneAblauf: true,
    verwandt: [
      'tshirt-mit-foto-bedrucken',
      'textildruck-preise',
      'vereinskleidung-bedrucken',
      'firmenkleidung-bedrucken',
    ],
  },
];
