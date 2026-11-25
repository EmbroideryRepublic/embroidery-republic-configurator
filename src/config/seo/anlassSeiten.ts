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
 *   {anzahl} {arten} {produktion} {produktionszeit} {versand} {versandkosten} {frei} {dpiMin} {dpiOk} {dpiZiel} {abPreis_<art>}
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
import { KLEINAUFTRAG_MAX_STUECK, KLEINAUFTRAG_PAUSCHALE_EUR } from '@/config/pricingRules';

export interface AnlassAbschnitt {
  ueberschrift: string;
  absaetze?: string[];
  punkte?: string[];
  /**
   * Berechneter Baustein statt Fließtext: 'aufloesung' = Tabelle „Mindestbreite des Bildes in Pixeln“, 'rechner' = Auflösungsrechner, 'dateipruefung' = Datei prüfen + hochskalieren (Browser, nichts wird hochgeladen),
   * 'groessen:<art>' = Größentabelle dreier Modelle, 'gewicht:<art>' = Gewichtsklassen der Art, 'druck:<art>' = größtmögliche
   * DTF-Druckfläche je Größe (alle drei aus dem Katalog bzw. den erzeugten Flächendaten, lib/seo/katalogAuswertung.ts).
   */
  tabelle?:
    | 'aufloesung'
    | 'rechner'
    | 'dateipruefung'
    | 'groessen:tshirt'
    | 'groessen:hoodie'
    | 'groessen:polo'
    | 'gewicht:tshirt'
    | 'gewicht:hoodie'
    | 'gewicht:polo'
    | 'druck:tshirt'
    | 'druck:hoodie'
    | 'druck:polo'
    | 'geschaeftsanfrage';
}

export interface AnlassBeispiel {
  beschriftung: string;
  /** Beispielprodukt = das günstigste Erwachsenen-Modell dieser Art. */
  art: ProductType;
  menge: number;
  flaechen: { ansicht: 'front' | 'back'; breiteCm: number; hoeheCm: number }[];
  /** Erklärt, woraus sich der Preis dieser Zeile zusammensetzt, wenn er ohne Erklärung missverständlich wäre (steht unter der Zeile). */
  hinweis?: string;
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
  /** Ersetzt den Standardsatz über den Preisbeispielen („Mit steigender Menge sinkt der Stückpreis …“), wenn die Beispiele nicht in einer Reihe vergleichbar sind. */
  beispieleEinleitung?: string;
  fragen: KategorieFrage[];
  /** Ratgeber ohne Bestellbezug zeigen den Bestellablauf nicht. */
  ohneAblauf?: boolean;
  /** Adressen weiterer Seiten (Kategorie-, DTF- oder Anlassseiten) für die Verlinkung am Seitenende. */
  verwandt: string[];
}

// ── Bausteine (wortgleich oder Auszug aus freigegebenen Texten) ─────────

/** Wortgleich: FAQ „Ab welcher Menge …“ / Kategorie- und DTF-Seiten. */
export const A_EINZELSTUECK =
  'Ja. Es gibt keine Mindestbestellmenge – du kannst ab einem einzelnen Stück bestellen. Größen darfst du frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Wortgleich wie auf den DTF-Seiten. */
const A_DATEIEN =
  'SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren.';
/** Wortgleich wie auf den DTF-Seiten. */
export const A_DAUER =
  'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druckdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren dich in diesem Fall.';
/** Wortgleich: FAQ „Wie hoch sind die Versandkosten?“ (Beträge als Platzhalter, damit sie nie veralten). */
const A_VERSAND =
  'Wir liefern aktuell ausschließlich innerhalb Deutschlands. Die Versandkosten betragen {versandkosten} – ab einem Bestellwert von {frei} liefern wir versandkostenfrei.';
/** Wortgleich: FAQ „Welche Zahlungsmöglichkeiten gibt es?“, ohne den Stickerei-Satz. */
const A_ZAHLUNG =
  'Du kannst zwischen Kreditkarte, PayPal und Kauf auf Rechnung wählen. Bei Kreditkarte und PayPal wird der Betrag direkt im Bestellvorgang über den jeweiligen Anbieter abgebucht. Bei Kauf auf Rechnung wird im Bestellvorgang selbst nichts abgebucht; du erhältst die Rechnung separat im Zuge der Auftragsbearbeitung, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug.';
/** Wortnah aus den AGB (§ 4 Abs. 2 und 3): Endpreise, Kleinunternehmer, Versandkosten kommen hinzu. */
const A_STEUER =
  'Nein. Alle angegebenen Preise sind Endpreise. Wir sind Kleinunternehmer im Sinne von § 19 UStG und weisen daher keine Umsatzsteuer aus. Versandkosten kommen zum Warenwert hinzu; ab {frei} Bestellwert liefern wir versandkostenfrei.';
/** Aus A_EINZELSTUECK: Antwort auf „Können wir die Größen mischen?“. */
const A_GROESSEN =
  'Ja. Größen darfst du frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Wie A_EINZELSTUECK, als Antwort auf eine Frage, die nicht mit „Ja/Nein“ gestellt ist. */
const A_MENGE_STAFFEL =
  'Es gibt keine Mindestbestellmenge – du kannst ab einem einzelnen Stück bestellen. Größen darfst du frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Aus der FAQ („Sehe ich vor der Produktion eine Freigabe?“), ohne den Stickerei-Halbsatz. */
const A_FREIGABE = 'Vor Produktionsstart erhältst du eine finale Vorschau zur Freigabe.';

/** Zwei freigegebene Bausteine der Startseite: Positionen und Maße. */
const ABSATZ_POSITIONEN =
  'Auf Vorder- und Rückseite lässt sich je ein Motiv platzieren, bei vielen Modellen zusätzlich auf den Ärmeln. Im Konfigurator siehst du jede Fläche samt Maßen in Zentimetern.';
const ABSATZ_MEHRERE_PRODUKTE =
  'Konfiguriere ein Produkt, lege es in den Warenkorb und konfiguriere anschließend das nächste – zum Beispiel Hoodies und T-Shirts im selben Auftrag. Alle Positionen werden gemeinsam im Warenkorb zusammengefasst.';

/**
 * Erklärung für das Einzelstück-Beispiel: Der Stückpreis enthält die einmalige Einrichtung (Regel dtf-kleinauftrag).
 * Betrag und Stückzahl stammen aus der Regel selbst (config/pricingRules.ts), nicht von Hand.
 */
const HINWEIS_EINRICHTUNG = `Der Preis enthält die einmalige Einrichtung von ${KLEINAUFTRAG_PAUSCHALE_EUR} €. Die Einrichtung fällt nur bei bis zu ${KLEINAUFTRAG_MAX_STUECK} Stück an; ab ${KLEINAUFTRAG_MAX_STUECK + 1} Stück entfällt sie.`; // geschützte Leerzeichen: kein Umbruch zwischen Zahl und Einheit

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
      'Hoodies fürs Trainerteam, T-Shirts für die Mannschaft, Polos für den Vorstand: Es gibt {anzahl} Modelle ({arten}). Lade dein Vereinslogo hoch und sieh direkt im Konfigurator, wie es auf dem Textil sitzt – mit Preis in Echtzeit.',
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
          'Keine Mindestmenge: Du kannst ab einem einzelnen Stück bestellen.',
          'Größen frei mischen: Ein Motiv, beliebig viele Größen – zum Beispiel 2× M, 6× L und 2× XL in einem Auftrag.',
          'Staffelpreise: Mit größerer Menge sinkt der Stückpreis, die Staffel beginnt bei 5 Stück.',
        ],
      },
      {
        ueberschrift: 'Brust, Rücken, Ärmel: So platzierst du das Vereinslogo',
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
        a: `${A_DATEIEN} Vor der Produktion prüfen wir deine Datei kostenlos.`,
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
      'Polos für den Außendienst, Hoodies fürs Team, Jacken für draußen: Es gibt {anzahl} Modelle ({arten}). Lade dein Firmenlogo hoch, platziere es auf Brust, Rücken oder Ärmel und sieh den Preis in Echtzeit.',
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
          'Kauf auf Rechnung: Neben Kreditkarte und PayPal kannst du auf Rechnung bezahlen, zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug.',
          'Endpreise ohne Steuerausweis: Wir sind Kleinunternehmer im Sinne von § 19 UStG und weisen keine Umsatzsteuer aus.',
          'Dateiprüfung: Vor der Produktion prüfen wir dein Logo kostenlos.',
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
        a: `${A_DATEIEN} Vor der Produktion prüfen wir deine Datei kostenlos.`,
      },
      { q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER },
    ],
    verwandt: [
      'poloshirts-besticken-bedrucken',
      'hoodies-bedrucken-besticken',
      'jacken-bedrucken',
      'arbeitskleidung-bedrucken',
      'poloshirt-mit-logo-bedrucken',
      'vereinskleidung-bedrucken',
      'textildruck-preise',
      'druckdaten-vorbereiten',
    ],
  },

  // ── Ratgeber: Poloshirt mit Logo ───────────────────────────────────
  // Ergänzt die Kategorieseite /poloshirts-besticken-bedrucken (Modellliste) um die Frage „Worauf kommt es an?“.
  {
    slug: 'poloshirt-mit-logo-bedrucken',
    kurzname: 'Poloshirt mit Logo',
    titel: 'Poloshirt mit Logo: Worauf es ankommt – ab 1 Stück',
    h1: 'Poloshirts mit Logo bedrucken lassen: Worauf es ankommt',
    eyebrow: 'Ratgeber',
    beschreibung:
      'Welches Poloshirt eignet sich fürs Firmenlogo? Gewebe, Gewicht, Logo-Position und Druckfläche im Überblick – mit Preisbeispielen ab 1 Stück.',
    einleitung: [
      'Ein Poloshirt mit Logo ist für viele Teams die Standardausstattung: im Außendienst, am Empfang, im Service oder im Verein. Damit es gut aussieht und lange hält, kommt es auf drei Dinge an: das passende Modell, die richtige Position und eine Logo-Datei in ausreichender Qualität.',
      'Es gibt {anzahl} Poloshirts von mehreren Marken, Preise ab {abPreis_polo} pro Stück zzgl. Veredelung. Bedruckt wird per DTF-Transferdruck, ab einem einzelnen Stück.',
    ],
    kacheln: [{ art: 'polo', anzahl: 4 }],
    abschnitte: [
      {
        ueberschrift: 'Das passende Poloshirt finden',
        punkte: [
          'Gewebe: Piqué ist ein Strickgewebe mit feiner Wabenstruktur und der Klassiker bei Poloshirts. Daneben gibt es glattere Jersey-Qualitäten.',
          'Material: 100 % Baumwolle fühlt sich angenehm an. Mischgewebe aus Polyester und Baumwolle, zum Beispiel 65 % zu 35 %, knittern weniger und gelten als pflegeleichter. Es gibt auch Poloshirts aus Bio-Baumwolle; Zertifizierungen wie GOTS oder OEKO-TEX Standard 100 stehen bei den betreffenden Modellen auf der Produktseite.',
          'Gewicht: Die Poloshirts im Sortiment wiegen {gewichtMin_polo} bis {gewichtMax_polo} g/m². Leichtere Stoffe sind luftiger, schwerere fester.',
          'Schnitt: Es gibt Unisex-Modelle in normaler Passform und taillierte Damenmodelle mit Seitennähten. Die Größentabelle steht auf jeder Produktseite.',
        ],
      },
      { ueberschrift: 'Gewicht der Poloshirts im Überblick', tabelle: 'gewicht:polo' },
      {
        ueberschrift: 'Wo das Logo sitzt',
        absaetze: [
          ABSATZ_POSITIONEN,
          'Üblich ist ein kleines Logo auf der Brust (ca. 10 × 10 cm). Wer zusätzlich einen Firmennamen oder Slogan zeigen möchte, setzt ihn auf den Rücken (ca. 20 × 25 cm).',
          'Ein Poloshirt hat Kragen und Knopfleiste. Das Logo sollte deshalb weder zu hoch noch zu breit sitzen. Im Konfigurator siehst du die Fläche samt Maßen und kannst das Motiv direkt verschieben.',
        ],
      },
      { ueberschrift: 'Größtmögliche Druckfläche bei Poloshirts', tabelle: 'druck:polo' },
      {
        ueberschrift: 'Logo-Datei und Stoffstruktur',
        absaetze: [
          'Für Logos eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. Bei PNG oder JPG braucht das Bild genug Bildpunkte: Ab {dpiOk} dpi gilt die Qualität im Konfigurator als optimal. Der Auflösungsrechner zeigt, wie viele Pixel deine Druckbreite braucht.',
          'Auf strukturiertem Piqué wirken sehr feine Linien und sehr kleine Schrift weniger scharf als auf glattem Stoff. Ein klar gezeichnetes Logo ohne feinste Details gelingt zuverlässiger. Vor der Produktion prüfen wir deine Datei kostenlos.',
        ],
      },
      {
        ueberschrift: 'Menge und Preis',
        absaetze: [A_MENGE_STAFFEL],
      },
      {
        ueberschrift: 'Pflege',
        absaetze: [
          'Die Pflegehinweise des Herstellers stehen auf der Produktseite des jeweiligen Modells. Allgemeine Tipps zum Waschen bedruckter Textilien findest du in der Pflegeanleitung.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '1 Poloshirt · Logo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
        hinweis: HINWEIS_EINRICHTUNG,
      },
      {
        beschriftung: '10 Poloshirts · Logo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '25 Poloshirts · Logo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 25,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '25 Poloshirts · Logo auf der Brust (ca. 10 × 10 cm) und Firmenname auf dem Rücken (ca. 20 × 25 cm)',
        art: 'polo',
        menge: 25,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
        hinweis:
          'Das sind zwei bedruckte Positionen (Brust und Rücken). Der Rücken kommt je Stück zum Preis der Zeile darüber hinzu – deshalb liegt dieser Stückpreis über dem der 10-Stück-Zeile, obwohl die Menge größer ist.',
      },
    ],
    beispieleEinleitung:
      'Bei gleicher Konfiguration sinkt der Stückpreis mit der Menge – Staffelpreise gelten ab 5 Stück. Jede weitere bedruckte Position, zum Beispiel der Rücken, kommt je Stück hinzu.',
    fragen: [
      {
        q: 'Welches Poloshirt eignet sich für ein Firmenlogo?',
        a: 'Das hängt vom Einsatz. Für Büro und Außendienst sind Poloshirts aus Baumwolle üblich, für häufiges Waschen und wenig Knittern eher Mischgewebe aus Polyester und Baumwolle. Material, Gewicht, Schnitt und Pflegehinweise stehen auf jeder Produktseite.',
      },
      {
        q: 'Wie groß darf das Logo auf einem Poloshirt sein?',
        a: 'Das hängt von Modell und Größe ab. Die Tabelle auf dieser Seite zeigt die größtmögliche Fläche für drei Poloshirts; für jedes Modell siehst du die Fläche samt Maßen in Zentimetern im Konfigurator. Für ein Brustlogo sind etwa 10 × 10 cm üblich.',
      },
      { q: 'Kann ich ein einzelnes Poloshirt bedrucken lassen?', a: A_EINZELSTUECK },
      {
        q: 'Welche Dateien brauche ich für das Logo?',
        a: `${A_DATEIEN} Vor der Produktion prüfen wir deine Datei kostenlos.`,
      },
      { q: 'Wie lange dauert es, bis die Poloshirts ankommen?', a: A_DAUER },
    ],
    verwandt: [
      'poloshirts-besticken-bedrucken',
      'firmenkleidung-bedrucken',
      'arbeitskleidung-bedrucken',
      'druckgroesse-t-shirt-hoodie',
      'druckaufloesung-rechner',
      'bedruckte-textilien-pflege',
    ],
  },

  // ── Ratgeber: Arbeitskleidung mit Logo ─────────────────────────────
  // Einzige Suchbegriff-Lücke der Zielseiten-Zuordnung (seo-unterlagen/seo-zielseiten-content-gbp-links-2026-11-24.md).
  // Grenzt ehrlich ab: bedruckt werden Textilien aus dem Sortiment, keine Schutz- oder Warnschutzkleidung.
  {
    slug: 'arbeitskleidung-bedrucken',
    kurzname: 'Arbeitskleidung',
    titel: 'Arbeitskleidung mit Logo bedrucken lassen – ab 1 Stück',
    h1: 'Arbeitskleidung mit Logo bedrucken lassen',
    eyebrow: 'Für Handwerk, Service und Betrieb',
    beschreibung:
      'Polos, T-Shirts, Hoodies und Fleecejacken für den Arbeitsalltag mit Firmenlogo per DTF-Transferdruck bedrucken – ab 1 Stück, Kauf auf Rechnung.',
    einleitung: [
      'Ob Handwerksbetrieb, Reinigungsfirma, Praxis oder Gastronomie: Einheitliche Kleidung mit Logo macht ein Team erkennbar und wirkt vor Kunden professionell. Wir bedrucken dafür {arten} – auch einzelne Teile, etwa für neue Mitarbeitende.',
      'Wichtig vorab: Wir bedrucken Textilien aus unserem Sortiment. Schutz- und Warnschutzkleidung, zum Beispiel nach EN ISO 20471, gehört nicht dazu.',
    ],
    kacheln: [
      { art: 'polo', anzahl: 2 },
      { art: 'tshirt', anzahl: 2 },
      { art: 'zip-hoodie', anzahl: 2 },
      { art: 'jacket', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Welche Textilien sich für den Arbeitsalltag eignen',
        punkte: [
          'Poloshirts: der Klassiker für Außendienst, Service und Empfang, aus Baumwolle oder als Mischgewebe aus Polyester und Baumwolle.',
          'T-Shirts: robust und günstig, auch als Zweitteil unter Jacke oder Pullover. Mehrere Hersteller führen Modelle unter der Bezeichnung „Workwear“; sie gehören zu unserem Sortiment.',
          'Hoodies und Zip-Hoodies: für Lager, Werkstatt und kühle Tage.',
          'Fleecejacken: warme Jacken aus Polyester für draußen und für den Wechsel zwischen drinnen und draußen.',
        ],
      },
      {
        ueberschrift: 'Gewebe und Gewicht',
        absaetze: [
          'Baumwolle fühlt sich angenehm an. Mischgewebe mit Polyester, zum Beispiel 65 % Polyester zu 35 % Baumwolle, knittern weniger und gelten als pflegeleichter. Beides gibt es im Sortiment.',
          'Je höher das Gewicht in g/m², desto fester und schwerer ist der Stoff. Bei Poloshirts reicht es im Sortiment von {gewichtMin_polo} bis {gewichtMax_polo} g/m². Material und Gewicht stehen bei jedem Modell auf der Produktseite.',
        ],
      },
      {
        ueberschrift: 'Logo und Position',
        absaetze: [
          ABSATZ_POSITIONEN,
          'Häufig steht das Firmenlogo klein auf der Brust (ca. 10 × 10 cm), Firmenname oder Kontaktangaben stehen groß auf dem Rücken (ca. 20 × 25 cm). Für Logos eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren.',
        ],
      },
      {
        ueberschrift: 'Mehrere Mitarbeitende, mehrere Größen',
        punkte: [
          'Ein Motiv, beliebig viele Größen: zum Beispiel 2× M, 6× L und 2× XL in einem Auftrag.',
          'Auch einzelne Teile: Es gibt keine Mindestbestellmenge, zum Beispiel für neue Mitarbeitende.',
          'Staffelpreise: Mit größerer Menge sinkt der Stückpreis, die Staffel beginnt bei 5 Stück.',
          'Kauf auf Rechnung: zahlbar innerhalb von 14 Tagen ab Rechnungsdatum ohne Abzug.',
        ],
        absaetze: [ABSATZ_MEHRERE_PRODUKTE],
      },
      {
        ueberschrift: 'Pflege',
        absaetze: [
          'Es gelten die Pflegehinweise des Herstellers, die auf der Produktseite des jeweiligen Modells stehen. Allgemeine Tipps zum Waschen bedruckter Textilien findest du in der Pflegeanleitung.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '5 Poloshirts · Logo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 5,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 T-Shirts · Logo auf der Brust (ca. 10 × 10 cm) und Firmenname auf dem Rücken (ca. 20 × 25 cm)',
        art: 'tshirt',
        menge: 10,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
        hinweis: 'Das sind zwei bedruckte Positionen (Brust und Rücken); die zweite Position kommt je Stück hinzu.',
      },
      {
        beschriftung: '10 Hoodies · Logo auf der Brust (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
    ],
    beispieleEinleitung:
      'Die Beispiele zeigen unterschiedliche Textilien und eine bzw. zwei bedruckte Positionen und lassen sich deshalb nicht direkt miteinander vergleichen. Staffelpreise gelten ab 5 Stück.',
    fragen: [
      {
        q: 'Wird auch Schutz- oder Warnschutzkleidung bedruckt?',
        a: 'Nein. Wir bedrucken Textilien aus unserem Sortiment: T-Shirts, Poloshirts, Hoodies und Jacken. Schutz- und Warnschutzkleidung, zum Beispiel nach EN ISO 20471, bieten wir nicht an.',
      },
      {
        q: 'Welche Textilien eignen sich für Arbeitskleidung?',
        a: 'Das hängt vom Einsatz. Poloshirts und T-Shirts aus Baumwolle oder Mischgewebe sind verbreitet, Hoodies und Fleecejacken für kühlere Bereiche. Mehrere Hersteller führen Modelle unter der Bezeichnung „Workwear“. Material, Gewicht und Pflegehinweise stehen auf jeder Produktseite.',
      },
      { q: 'Können wir einzelne Teile bestellen, zum Beispiel für neue Mitarbeitende?', a: A_EINZELSTUECK },
      {
        q: 'Kann die Kleidung gewerblich gewaschen werden?',
        a: 'Das können wir nicht allgemein zusagen. Die zulässige Waschtemperatur nennt das Pflegeetikett des Textils. Wird die Kleidung gewerblich aufbereitet, frag uns bitte vor der Bestellung über das Kontaktformular.',
      },
      { q: 'Können Unternehmen auf Rechnung bezahlen?', a: `Ja. ${A_ZAHLUNG}` },
      { q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER },
    ],
    verwandt: [
      'firmenkleidung-bedrucken',
      'poloshirt-mit-logo-bedrucken',
      'poloshirts-besticken-bedrucken',
      'jacken-bedrucken',
      'geschaeftskunden',
      'bedruckte-textilien-pflege',
    ],
  },

  // ── Abschlussjahrgänge ─────────────────────────────────────────────
  {
    slug: 'abschluss-hoodies-bedrucken',
    kurzname: 'Abschluss-Hoodies',
    titel: 'Abi-Pullover & Abschluss-Hoodies bedrucken – ab 1 Stück',
    h1: 'Abschluss-Hoodies und Abi-Pullis bedrucken lassen',
    eyebrow: 'Für Jahrgänge und Klassen',
    beschreibung:
      'Abi-Pullover und Abschluss-Hoodies mit Jahrgang, Namen oder Motto per DTF-Transferdruck bedrucken – ab 1 Stück, Größen frei mischbar.',
    einleitung: [
      'Ein Hoodie für den ganzen Jahrgang: Wähle unter {anzahl} Modellen ({arten}), setze Jahrgang, Motto oder Namen als Text oder lade ein eigenes Motiv hoch. Der Konfigurator zeigt Vorder- und Rückseite mit Preis in Echtzeit.',
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
          'Die reguläre Produktionszeit beträgt {produktionszeit}, der anschließende Versand erfolgt innerhalb von {versand}. Eine Sammelbestellung gelingt am besten, wenn Größen und Mengen vor der Bestellung feststehen – und vor Produktionsstart erhältst du eine finale Vorschau zur Freigabe.',
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
        a: 'Ja. Es gibt keine Mindestbestellmenge – du kannst ab einem einzelnen Stück bestellen.',
      },
      { q: 'Können wir die Größen mischen?', a: A_GROESSEN },
      { q: 'Wie früh sollten wir bestellen?', a: A_DAUER },
      {
        q: 'Welche Dateien kann ich für das Motiv hochladen?',
        a: `${A_DATEIEN} Reicht ein Schriftzug, kannst du ihn auch direkt im Konfigurator als Text setzen.`,
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
    eyebrow: 'Für dein Lieblingsbild',
    beschreibung:
      'Eigenes Foto auf T-Shirt, Hoodie oder Longsleeve drucken lassen – vollfarbig per DTF-Transferdruck, ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Familienfoto, Haustier oder Urlaubsmotiv: Lade dein Foto hoch, platziere es auf Vorder- oder Rückseite und sieh das Ergebnis samt Preis direkt im Konfigurator. Es gibt {anzahl} Modelle ({arten}).',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'tshirt', anzahl: 4 },
      { art: 'hoodie', anzahl: 2 },
      { art: 'longsleeve', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'So wird aus deinem Foto ein scharfer Druck',
        punkte: [
          'Hochauflösende Datei: JPG und PNG werden unterstützt. Je mehr Bildpunkte das Foto hat, desto schärfer wird der Druck.',
          'Auflösungs-Ampel: Der Konfigurator bewertet dein Bild bei der gewählten Druckgröße – grün ab {dpiOk} dpi, gelb ab {dpiMin} dpi, darunter rot mit dem Hinweis, das Bild kleiner zu platzieren oder eine höher aufgelöste Datei zu verwenden.',
          'Weißer Hintergrund: Bei Bildern mit weißem Hintergrund kannst du diesen beim Hochladen automatisch entfernen lassen (einfache Freistellung).',
          'Freigabe: Vor der Produktion prüfen wir deine Datei kostenlos, und du erhältst eine finale Vorschau zur Freigabe.',
        ],
      },
      {
        ueberschrift: 'Wie groß darf das Foto sein?',
        absaetze: [
          'Der Konfigurator zeigt dein Motiv in Zentimetern; je Modell und Größe gilt eine maximale Druckfläche. Auf Vorder- und Rückseite lässt sich je ein Foto platzieren, bei vielen Modellen zusätzlich auf den Ärmeln.',
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
        a: 'Der Konfigurator zeigt dann eine Warnung: Die Auflösung ist zu niedrig für einen scharfen Druck (unter {dpiMin} dpi bei der gewählten Größe). Platziere das Bild kleiner, verwende ein SVG, lade eine höher aufgelöste Datei hoch oder nutze den Button „Hochskalieren“, der das Bild auf {dpiZiel} dpi hochrechnet, wenn das möglich ist. Zusätzliche Details entstehen dabei nicht.',
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
      'Die Beispiele auf dieser Seite werden mit derselben Preisberechnung ermittelt wie im Konfigurator. Deinen genauen Preis siehst du dort in Echtzeit, bevor du etwas in den Warenkorb legst.',
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
          'Die Staffelgrenzen gelten für die gesamte Bestellung. Liegt deine Menge knapp darunter, kann eine etwas größere Menge insgesamt günstiger sein – der Konfigurator weist dich darauf hin, wenn das der Fall ist.',
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
        a: 'Ja. Im Konfigurator siehst du Stück- und Gesamtpreis in Echtzeit, bevor du etwas in den Warenkorb legst. Der Preis ändert sich mit jeder Anpassung von Motiv, Fläche und Menge.',
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
      'Reicht die Auflösung deines Bildes? Bildbreite und Druckbreite eingeben, dpi berechnen und mit der Ampel des Konfigurators bewerten.',
    einleitung: [
      'Reicht die Auflösung deines Bildes für die gewünschte Druckgröße? Gib die Breite deines Bildes in Pixeln und die Breite des Drucks in Zentimetern ein – der Rechner zeigt die Auflösung in dpi und bewertet sie mit derselben Ampel wie der Konfigurator.',
    ],
    kacheln: [],
    abschnitte: [
      { ueberschrift: 'Auflösung berechnen', tabelle: 'rechner' },
      {
        ueberschrift: 'So liest du das Ergebnis',
        punkte: [
          'Grün ab {dpiOk} dpi: optimale Druckqualität bei dieser Größe.',
          'Gelb von {dpiMin} bis {dpiOk} dpi: akzeptabel, für sehr große Drucke aber eher knapp.',
          'Rot unter {dpiMin} dpi: zu unscharf. Platziere das Bild kleiner, verwende ein SVG oder lade eine höher aufgelöste Datei hoch.',
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
        a: 'dpi = Bildbreite in Pixeln ÷ (Druckbreite in cm ÷ 2,54). Der Rechner oben übernimmt das für dich.',
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
        a: 'Platziere das Bild kleiner, verwende ein SVG oder lade eine höher aufgelöste Datei hoch. Oder skaliere das Bild hoch: Das Werkzeug zum Prüfen der Druckdatei und der Button „Hochskalieren“ im Konfigurator rechnen auf {dpiZiel} dpi, wenn das möglich ist.',
      },
    ],
    ohneAblauf: true,
    verwandt: ['druckdaten-vorbereiten', 'druckdatei-pruefen', 'tshirt-mit-foto-bedrucken', 'textildruck-preise', 'vereinskleidung-bedrucken'],
  },

  // ── Geschäftskunden (Ziel des QR-Codes in den Anschreiben) ─────────
  {
    slug: 'geschaeftskunden',
    kurzname: 'Geschäftskunden',
    titel: 'Firmenkleidung bedrucken lassen – Angebot, ab 1 Stück',
    h1: 'Firmenkleidung für dein Unternehmen – Geschäftsanfrage in wenigen Minuten',
    eyebrow: 'Für Geschäftskunden',
    beschreibung:
      'Firmenkleidung mit Logo per DTF-Transferdruck: ab 1 Stück, Staffelpreise, Vorschau zur Freigabe, Kauf auf Rechnung. Jetzt Geschäftsanfrage stellen.',
    einleitung: [
      'Ob Praxis, Handwerksbetrieb, Hotel, Studio oder Verein: Wir bedrucken Poloshirts, T-Shirts, Hoodies und Jacken mit deinem Logo – für das ganze Team oder einzeln für neue Mitarbeitende. Fordere unten ein unverbindliches, individuelles Angebot an – wir melden uns persönlich.',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'polo', anzahl: 2 },
      { art: 'tshirt', anzahl: 2 },
      { art: 'hoodie', anzahl: 2 },
      { art: 'jacket', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Das spricht für uns als Partner für Firmenkleidung',
        punkte: [
          'Ab 1 Stück, keine Mindestbestellmenge: für die Erstausstattung ebenso wie für einzelne neue Mitarbeitende.',
          'Staffelpreise ab 5 Stück, Größen frei mischbar – ein Motiv, beliebig viele Größen in einem Auftrag.',
          'Vollfarbiger DTF-Transferdruck: Logos, Wappen und Farbverläufe in einem Druck.',
          'Vor der Produktion erhältst du eine finale Vorschau zur Freigabe.',
          'Kauf auf Rechnung ist möglich.',
          'Reguläre Produktionszeit {produktionszeit}, Versand innerhalb von {versand}.',
          'Persönliche Betreuung: Antwort meist innerhalb eines Werktags.',
        ],
      },
      {
        ueberschrift: 'Unverbindliches Angebot anfordern',
        absaetze: [
          'Wenige Angaben genügen: Branche, gewünschte Kleidung, ungefähre Stückzahl und deine Kontaktdaten. Ein fertiges Logo ist nicht nötig – auch eine Skizze oder ein Foto deines bisherigen Logos hilft. Wir melden uns persönlich mit einem Angebot, das für dich unverbindlich ist.',
        ],
        tabelle: 'geschaeftsanfrage',
      },
      {
        ueberschrift: 'Passende Kleidung für deine Branche',
        punkte: [
          'Praxen: Poloshirts und T-Shirts für das Team, dezent mit Praxislogo.',
          'Handwerk: schwere T-Shirts, Hoodies, Poloshirts und Jacken als Arbeitskleidung.',
          'Gastronomie und Hotel: Poloshirts, T-Shirts und Hoodies für Service und Küche.',
          'Fitness und Kampfsport: Sport-T-Shirts, Hoodies und Longsleeves.',
          'Vereine: Hoodies, T-Shirts und Sportshirts mit Wappen und Sponsorenlogo.',
          'Reinigung und Dienstleistung: Poloshirts, T-Shirts und Jacken für wachsende Teams.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '10 Polos · Firmenlogo auf der Brust (ca. 10 × 10 cm)',
        art: 'polo',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '25 T-Shirts · Firmenlogo auf der Brust (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 25,
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
      { q: 'Gibt es eine Mindestbestellmenge?', a: A_MENGE_STAFFEL },
      { q: 'Welche Dateien brauche ich für mein Logo?', a: `${A_DATEIEN} Vor der Produktion prüfen wir deine Datei kostenlos.` },
      { q: 'Kann ich auf Rechnung bezahlen?', a: `Ja. ${A_ZAHLUNG}` },
      { q: 'Wie lange dauert es bis zur Lieferung?', a: A_DAUER },
      { q: 'Wie hoch sind die Versandkosten?', a: A_VERSAND },
    ],
    verwandt: [
      'firmenkleidung-bedrucken',
      'vereinskleidung-bedrucken',
      'poloshirts-besticken-bedrucken',
      'hoodies-bedrucken-besticken',
      'textildruck-preise',
      'druckdaten-vorbereiten',
    ],
  },

  // ── Ratgeber: Größentabelle ────────────────────────────────────────
  {
    slug: 'groessentabelle-t-shirts-hoodies',
    kurzname: 'Größentabelle',
    titel: 'Größentabelle T-Shirt, Hoodie & Polo: Maße in cm',
    h1: 'Größentabelle für T-Shirts, Hoodies und Polos',
    eyebrow: 'Maße in Zentimetern',
    beschreibung:
      'Brustbreite und Länge je Größe in cm: Herstellermaße ausgewählter T-Shirts, Hoodies und Polos – plus Tipps, wie du richtig nachmisst.',
    einleitung: [
      'Welche Größe passt? Die Maße unterscheiden sich von Modell zu Modell. Diese Seite zeigt die Herstellermaße von je drei Modellen aus unserem Sortiment; die vollständige Größentabelle steht auf jeder Produktseite.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'So misst du richtig',
        punkte: [
          'Lege ein T-Shirt, einen Hoodie oder ein Polo, das gut passt, flach hin.',
          'Brustbreite: von Achselnaht zu Achselnaht gemessen. Der Brustumfang ist doppelt so groß.',
          'Länge: vom höchsten Punkt der Schulter bis zum Saum.',
          'Vergleiche deine Werte mit der Tabelle des Modells, das du bestellen möchtest.',
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
        a: 'Das hängt vom Modell ab. Die Passform steht auf der Produktseite unter „Technische Daten“, die Maße je Größe in der Größentabelle. Miss am besten ein Teil nach, das dir gut passt, und vergleiche.',
      },
      { q: 'Kann ich Größen in einer Bestellung mischen?', a: A_GROESSEN },
      {
        q: 'Wie lege ich die Größen für ein Team fest?',
        a: 'Lass jede Person ein passendes Teil nachmessen und die Maße mit der Größentabelle des Modells vergleichen. Im Konfigurator trägst du die Stückzahl je Größe ein – Größen darfst du frei mischen.',
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
      'druckgroesse-t-shirt-hoodie',
      'vereinskleidung-bedrucken',
      'kinderbekleidung-bedrucken',
    ],
  },

  // ── Ratgeber: Druckgröße ───────────────────────────────────────────
  {
    slug: 'druckgroesse-t-shirt-hoodie',
    kurzname: 'Druckgröße',
    titel: 'Druckgröße T-Shirt, Hoodie & Polo: Druckfläche in cm',
    h1: 'Wie groß darf der Druck auf T-Shirt, Hoodie und Polo sein?',
    eyebrow: 'Maße in Zentimetern',
    beschreibung:
      'Größtmögliche Druckfläche je Größe in cm: Vorder- und Rückseite von T-Shirts, Hoodies und Polos beim DTF-Druck, berechnet aus den Herstellermaßen.',
    einleitung: [
      'Wie groß ein Motiv werden darf, hängt vom Modell und von der Größe ab: Ein Hoodie in S bietet weniger Platz als ein Hoodie in XXL. Diese Seite zeigt für je drei Modelle aus unserem Sortiment die größtmögliche Druckfläche in Zentimetern, getrennt nach Vorder- und Rückseite. Die Flächen aller weiteren Modelle und Größen siehst du im Konfigurator.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'So entsteht die Druckfläche',
        absaetze: [
          'Die Breite folgt der Größentabelle des Herstellers: Sie reicht über die Brustbreite bis kurz vor die Seitennähte. Die Höhe hängt von der Form des Modells ab, zum Beispiel von Kragen und Saum.',
          'Ein Textil ist rund, ein breites Motiv wölbt sich beim Tragen deshalb leicht. Die Zahlen unten sind die flachen Maße – so, wie das Motiv auf die Folie gedruckt wird.',
        ],
      },
      {
        ueberschrift: 'Beispiele für Motivgrößen',
        punkte: [
          'Vereinslogo oder Wappen klein auf der Brust: ca. 10 × 10 cm.',
          'Motto, Name oder Jahrgang groß auf dem Rücken: ca. 20 × 25 cm.',
          'Ein Motiv über die ganze Fläche: bis zu den Maßen aus den Tabellen unten.',
        ],
        absaetze: [ABSATZ_POSITIONEN],
      },
      { ueberschrift: 'Druckfläche bei T-Shirts', tabelle: 'druck:tshirt' },
      { ueberschrift: 'Druckfläche bei Hoodies', tabelle: 'druck:hoodie' },
      { ueberschrift: 'Druckfläche bei Polos', tabelle: 'druck:polo' },
      {
        ueberschrift: 'Mehrere Größen in einem Auftrag',
        absaetze: [
          'Ein Motiv wird einmal platziert und auf jeder bestellten Größe gleich groß gedruckt. Deshalb gilt die Druckfläche der kleinsten Größe im Auftrag: Dort muss das Motiv noch passen.',
        ],
      },
      {
        ueberschrift: 'Passt die Datei zur Druckgröße?',
        absaetze: [
          'Je größer der Druck, desto mehr Pixel braucht das Bild, damit es scharf bleibt. Wie viele, rechnet der Auflösungsrechner vor; im Konfigurator zeigt eine Ampel die Qualität deiner Datei bei der gewählten Größe.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Wie groß darf ein Motiv auf einem T-Shirt höchstens sein?',
        a: 'Das hängt vom Modell und von der Größe ab. Die Tabelle auf dieser Seite zeigt die größtmögliche Fläche für drei T-Shirts in den Größen S bis XXL; für jedes Modell siehst du die Fläche samt Maßen in Zentimetern im Konfigurator.',
      },
      {
        q: 'Ist die Druckfläche in allen Größen gleich groß?',
        a: 'Nein. Sie wächst mit der Größe, weil die Brustbreite wächst. Die Tabellen zeigen die Fläche für S bis XXL.',
      },
      {
        q: 'Wie groß ist die Druckfläche, wenn ich mehrere Größen bestelle?',
        a: 'Es gilt die Fläche der kleinsten Größe im Auftrag, denn das Motiv wird auf jeder Größe gleich groß gedruckt.',
      },
      {
        q: 'Kann ich auch auf die Ärmel drucken?',
        a: 'Bei vielen Modellen gibt es zusätzlich Ärmelflächen. Im Konfigurator siehst du jede Fläche samt Maßen in Zentimetern.',
      },
      {
        q: 'Welche Dateien kann ich für ein großes Motiv hochladen?',
        a: `${A_DATEIEN} Prüfe mit dem Auflösungsrechner, wie viele Pixel dein Bild für die gewünschte Breite braucht.`,
      },
    ],
    verwandt: [
      'groessentabelle-t-shirts-hoodies',
      'druckaufloesung-rechner',
      'druckdaten-vorbereiten',
      't-shirts-bedrucken-besticken',
      'hoodies-bedrucken-besticken',
      'poloshirts-besticken-bedrucken',
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
      'Welche Dateiformate eignen sich, wie hoch muss die Auflösung sein, was tun bei weißem Hintergrund? So bereitest du dein Logo für den DTF-Druck vor.',
    einleitung: [
      'Ein scharfer Druck beginnt mit der richtigen Datei. Hier steht, welche Formate du hochladen kannst, wie viele Bildpunkte dein Motiv braucht und was der Konfigurator dir zur Qualität anzeigt.',
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
          'Bei Rasterbildern (PNG, JPG) zählt, wie viele Bildpunkte auf einen Zoll der gedruckten Breite fallen. Der Konfigurator bewertet das für deine gewählte Druckgröße: ab {dpiOk} dpi gilt die Qualität als optimal (grün), zwischen {dpiMin} und {dpiOk} dpi als akzeptabel (gelb), darunter als zu niedrig (rot). Vektordateien (SVG, PDF) bekommen nie eine Warnung.',
          'Die Tabelle zeigt, wie breit dein Bild mindestens sein sollte, wenn das Motiv in der jeweiligen Breite gedruckt wird.',
        ],
        tabelle: 'aufloesung',
      },
      {
        ueberschrift: 'Weißer Hintergrund und Freistellung',
        absaetze: [
          'Hat dein Bild einen weißen Hintergrund, der nicht mitgedruckt werden soll, kannst du ihn beim Hochladen automatisch entfernen lassen (einfache Freistellung). Am saubersten gelingt es mit einer Datei, die bereits transparent freigestellt ist.',
        ],
      },
      {
        ueberschrift: 'Ein Schriftzug ohne Datei',
        absaetze: ['Reicht ein Schriftzug, setze ihn direkt im Konfigurator als Text – dafür brauchst du keine Datei.'],
      },
      {
        ueberschrift: 'Wir prüfen deine Datei',
        absaetze: [`Vor der Produktion prüfen wir deine Datei kostenlos. ${A_FREIGABE}`],
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
        a: 'Der Konfigurator warnt, wenn die Auflösung bei der gewählten Größe zu niedrig ist (unter {dpiMin} dpi). Platziere das Bild dann kleiner, verwende ein SVG oder lade eine höher aufgelöste Datei hoch. Alternativ kannst du das Bild hochskalieren: Der Button „Hochskalieren“ rechnet es auf {dpiZiel} dpi hoch, wenn das möglich ist – Kanten werden dabei glatter, zusätzliche Details entstehen nicht.',
      },
      {
        q: 'Kann ich auch Fotos drucken lassen?',
        a: 'Ja. DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Lade das Foto als JPG oder PNG hoch; die Auflösungs-Ampel zeigt dir, ob es für die gewählte Größe scharf genug ist.',
      },
      {
        q: 'Kann ich einen Schriftzug drucken lassen, ohne eine Datei zu haben?',
        a: 'Ja. Im Konfigurator kannst du Text direkt setzen und platzieren – ohne Datei.',
      },
    ],
    ohneAblauf: true,
    verwandt: [
      'tshirt-mit-foto-bedrucken',
      'textildruck-preise',
      'vereinskleidung-bedrucken',
      'firmenkleidung-bedrucken',
      'druckdatei-pruefen',
    ],
  },

  // ── Werkzeug: Datei prüfen und hochskalieren ───────────────────────
  {
    slug: 'druckdatei-pruefen',
    kurzname: 'Druckdatei prüfen',
    titel: 'Druckdatei prüfen: dpi-Check & Hochskalieren kostenlos',
    h1: 'Druckdatei prüfen und für den Druck hochskalieren',
    eyebrow: 'Kostenloses Werkzeug',
    beschreibung:
      'Bild auswählen, Druckbreite eingeben, dpi prüfen und bei Bedarf auf ca. 300 dpi hochskalieren – kostenlos, direkt im Browser, ohne Upload.',
    einleitung: [
      'Reicht die Auflösung deines Bildes für die gewünschte Druckgröße? Wähle eine Datei aus und gib die Druckbreite ein – das Werkzeug zeigt die Auflösung in dpi und bewertet sie mit derselben Ampel wie der Konfigurator. Ist sie zu niedrig, kannst du das Bild hochskalieren und als PNG speichern.',
      'Alles geschieht in deinem Browser: Dein Bild wird nicht hochgeladen und nicht gespeichert.',
    ],
    kacheln: [],
    abschnitte: [
      { ueberschrift: 'Datei prüfen', tabelle: 'dateipruefung' },
      {
        ueberschrift: 'So liest du das Ergebnis',
        punkte: [
          'Grün ab {dpiOk} dpi: optimale Druckqualität bei dieser Größe.',
          'Gelb von {dpiMin} bis {dpiOk} dpi: akzeptabel, für sehr große Drucke aber eher knapp.',
          'Rot unter {dpiMin} dpi: zu unscharf. Platziere das Bild kleiner, skaliere es hoch, verwende ein SVG oder lade eine höher aufgelöste Datei hoch.',
        ],
        absaetze: ['Das Hochskalieren rechnet auf {dpiZiel} dpi, wenn das technisch möglich ist. Wo nicht, nennt das Werkzeug vorher den Wert, der erreicht wird.'],
      },
      {
        ueberschrift: 'Was Hochskalieren kann – und was nicht',
        absaetze: [
          'Beim Hochskalieren werden aus den vorhandenen Bildpunkten mehr Bildpunkte berechnet: Kanten werden glatter und klarer, Treppenstufen und Unschärfe nehmen ab. Zusätzliche Details entstehen dabei nicht – ein sehr kleines oder verwaschenes Bild bleibt ein kleines oder verwaschenes Bild, nur mit mehr Bildpunkten.',
          'Am deutlichsten wirkt es bei Logos, Schriftzügen und Grafiken. Wenn möglich, lade eine vektorbasierte Datei (SVG, PDF) oder ein höher aufgelöstes Original hoch – sie skalieren verlustfrei.',
        ],
      },
      {
        ueberschrift: 'Hochskalieren im Konfigurator',
        absaetze: [
          'Dieselbe Berechnung steckt im Konfigurator: Ist die Auflösung eines hochgeladenen Bildes bei der gewählten Größe niedrig, erscheint neben dem Hinweis ein Button „Hochskalieren“. Über „Original wiederherstellen“ kannst du das ursprüngliche Bild zurückholen.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Wie viele dpi braucht ein Bild für den Textildruck?',
        a: 'Der Konfigurator bewertet ab {dpiOk} dpi die Qualität als optimal (grün), zwischen {dpiMin} und {dpiOk} dpi als akzeptabel (gelb) und darunter als zu niedrig (rot). Das Hochskalieren rechnet auf {dpiZiel} dpi, wenn das technisch möglich ist.',
      },
      {
        q: 'Wird mein Bild hochgeladen?',
        a: 'Nein. Das Werkzeug rechnet vollständig in deinem Browser; das Bild verlässt deinen Rechner nicht.',
      },
      {
        q: 'Macht Hochskalieren ein unscharfes Foto scharf?',
        a: 'Nein. Es werden keine neuen Details erzeugt, sondern Kanten geglättet und nachgeschärft. Ein unscharfes Foto bleibt unscharf; bei Logos, Schriftzügen und Grafiken ist der Unterschied am deutlichsten.',
      },
      {
        q: 'Welche Dateiformate kann das Werkzeug lesen?',
        a: 'Rasterbilder im Format PNG, JPG/JPEG und WebP. Für den Druck selbst unterstützt der Konfigurator SVG, PNG, JPG/JPEG und PDF.',
      },
      {
        q: 'Wie speichere ich das hochskalierte Bild?',
        a: 'Nach dem Hochskalieren erscheint der Link „Als PNG speichern“. Die gespeicherte Datei kannst du anschließend im Konfigurator hochladen.',
      },
    ],
    ohneAblauf: true,
    verwandt: ['druckaufloesung-rechner', 'druckdaten-vorbereiten', 'tshirt-mit-foto-bedrucken', 'dtf-druck-erklaert', 'textildruck-preise'],
  },

  // ── Ratgeber: DTF-Druck erklärt ────────────────────────────────────
  {
    slug: 'dtf-druck-erklaert',
    kurzname: 'DTF-Druck erklärt',
    titel: 'Was ist DTF-Druck? Direct-to-Film einfach erklärt',
    h1: 'Was ist DTF-Druck?',
    eyebrow: 'Ratgeber',
    beschreibung:
      'DTF-Druck (Direct-to-Film) einfach erklärt: So entsteht der Transferdruck, wofür er sich eignet und worauf du bei der Datei achten solltest.',
    einleitung: [
      'DTF steht für „Direct-to-Film“: Das Motiv wird zuerst auf eine Folie gedruckt und danach mit Hitze und Druck auf das Textil übertragen. So entstehen vollfarbige Drucke – auch mit Farbverläufen und Fotos.',
      'Hier steht, wie ein DTF-Druck entsteht, wofür er sich eignet und was du bei der Datei beachten solltest. Bei uns bestellst du ihn ab einem einzelnen Stück.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'So entsteht ein DTF-Druck',
        punkte: [
          'Das Motiv wird spiegelverkehrt auf eine spezielle Transferfolie gedruckt.',
          'Auf die noch feuchte Farbe wird ein Klebepulver aufgetragen und angeschmolzen.',
          'Die Folie wird mit Hitze und Druck auf das Textil gepresst; dabei verbindet sich der Druck mit dem Stoff.',
          'Danach wird die Trägerfolie abgezogen – das Motiv bleibt auf dem Textil.',
        ],
      },
      {
        ueberschrift: 'Wofür sich DTF eignet',
        punkte: [
          'Vollfarbig: Fotorealistische Motive und weiche Farbverläufe lassen sich in einem Druck umsetzen.',
          'Flexibel: Der Griff bleibt flexibel und bewegt sich mit dem Stoff.',
          'Große Flächen: Auch großflächige Motive sind möglich.',
          'Kleine Mengen: Es gibt keine Mindestbestellmenge – ein einzelnes Stück genügt.',
        ],
      },
      {
        ueberschrift: 'Was bei der Datei zählt',
        absaetze: [
          'Für Logos und Schriftzüge eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. Rasterbilder (PNG, JPG) brauchen genug Bildpunkte für die gewünschte Druckgröße: Ab {dpiOk} dpi gilt die Qualität im Konfigurator als optimal.',
          'Wie hoch die Auflösung deines Bildes bei einer bestimmten Druckbreite ist, zeigt das Werkzeug zum Prüfen der Druckdatei. Vor der Produktion prüfen wir deine Datei kostenlos, und du erhältst eine finale Vorschau zur Freigabe.',
        ],
      },
      {
        ueberschrift: 'DTF bei uns',
        absaetze: [
          'Wir bedrucken T-Shirts, Hoodies, Polos, Jacken und Kinderbekleidung per DTF-Transferdruck. Im Konfigurator lädst du dein Motiv hoch, platzierst es auf Brust, Rücken oder Ärmel und siehst den Preis in Echtzeit.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Was bedeutet DTF?',
        a: 'DTF steht für „Direct-to-Film“: Das Motiv wird auf eine Folie gedruckt und anschließend mit Hitze und Druck auf das Textil übertragen.',
      },
      {
        q: 'Wofür eignet sich der DTF-Transferdruck?',
        a: 'DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Der Griff bleibt flexibel und bewegt sich mit dem Stoff.',
      },
      {
        q: 'Worin unterscheidet sich DTF vom Siebdruck?',
        a: 'Beim Siebdruck wird die Farbe durch ein Sieb auf das Textil gedrückt, und für jede Farbe gibt es ein eigenes Sieb. DTF druckt vollfarbig auf Folie und eignet sich auch für kleine Mengen. Mehr dazu im Vergleich von DTF-Druck und Siebdruck.',
      },
      { q: 'Kann ich auch nur ein einzelnes Teil bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Welche Dateien kann ich hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER },
    ],
    ohneAblauf: true,
    verwandt: ['dtf-druck-vs-siebdruck', 'bedruckte-textilien-pflege', 'druckdaten-vorbereiten', 'druckdatei-pruefen', 'textildruck-preise'],
  },

  // ── Ratgeber: DTF oder Siebdruck ───────────────────────────────────
  {
    slug: 'dtf-druck-vs-siebdruck',
    kurzname: 'DTF oder Siebdruck',
    titel: 'DTF-Druck oder Siebdruck? Unterschiede im Überblick',
    h1: 'DTF-Druck oder Siebdruck – was passt zu deinem Motiv?',
    eyebrow: 'Verfahren im Vergleich',
    beschreibung:
      'DTF-Druck und Siebdruck im Vergleich: Motive, Mengen, Farben und Kosten – damit du das passende Verfahren für dein Textil auswählst.',
    einleitung: [
      'Beide Verfahren bringen Motive auf Textil, arbeiten aber grundverschieden. Welches passt, hängt vor allem von Motiv und Stückzahl ab.',
      'Wir bieten DTF-Transferdruck an. Der Überblick erklärt die Unterschiede sachlich – auch dort, wo Siebdruck Vorteile hat.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'So funktioniert Siebdruck',
        absaetze: [
          'Beim Siebdruck wird die Farbe mit einer Rakel durch ein feinmaschiges Sieb auf das Textil gedrückt. Für jede Farbe wird ein eigenes Sieb vorbereitet.',
        ],
      },
      {
        ueberschrift: 'So funktioniert DTF-Transferdruck',
        absaetze: [
          'Beim DTF-Transferdruck wird das Motiv vollfarbig auf eine Folie gedruckt und anschließend mit Hitze und Druck auf das Textil übertragen.',
        ],
      },
      {
        ueberschrift: 'Die Unterschiede im Überblick',
        punkte: [
          'Farben: Siebdruck braucht je Farbe ein Sieb und eignet sich daher für Motive mit wenigen Farben. Beim DTF-Druck spielt die Zahl der Farben für den Aufwand keine Rolle – Farbverläufe und Fotos sind möglich.',
          'Menge: Die Siebe müssen für jede Bestellung vorbereitet werden, deshalb lohnt sich Siebdruck meist erst bei größeren Stückzahlen. DTF eignet sich auch für Einzelstücke – bei uns ab 1 Stück.',
          'Motiv: Fotorealistische Motive und weiche Verläufe sprechen für DTF; ein einfarbiges Motiv in hoher Stückzahl kann für Siebdruck sprechen.',
          'Griff: Beim DTF-Transferdruck bleibt der Griff flexibel und bewegt sich mit dem Stoff.',
        ],
      },
      {
        ueberschrift: 'Welches Verfahren passt?',
        absaetze: [
          'Für ein einzelnes Teil, eine kleine Gruppe oder ein vollfarbiges Motiv ist DTF die praktische Wahl. Für mehrere hundert Teile mit einem einfarbigen Motiv kann Siebdruck wirtschaftlicher sein – Siebdruck bieten wir nicht an.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Was ist der Unterschied zwischen DTF-Druck und Siebdruck?',
        a: 'Beim Siebdruck wird die Farbe durch ein Sieb gedrückt, für jede Farbe gibt es ein eigenes Sieb. Beim DTF-Transferdruck wird das Motiv vollfarbig auf eine Folie gedruckt und mit Hitze und Druck auf das Textil übertragen.',
      },
      {
        q: 'Ab wie vielen Stück lohnt sich Siebdruck?',
        a: 'Weil für jede Farbe Siebe vorbereitet werden, lohnt sich Siebdruck meist erst bei größeren Stückzahlen. Eine feste Grenze gibt es nicht; sie hängt von Motiv, Farbanzahl und Anbieter ab. Wir bieten Siebdruck nicht an.',
      },
      {
        q: 'Kann ich ein Foto drucken lassen?',
        a: 'Ja. DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive. Lade das Foto im Konfigurator hoch; die Auflösungs-Ampel zeigt, ob es für die gewählte Größe scharf genug ist.',
      },
      { q: 'Kann ich auch nur ein einzelnes Teil bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Welche Dateien brauche ich für den Druck?', a: A_DATEIEN },
    ],
    ohneAblauf: true,
    verwandt: ['dtf-druck-erklaert', 'textildruck-preise', 'druckdaten-vorbereiten', 'vereinskleidung-bedrucken', 'firmenkleidung-bedrucken'],
  },

  // ── Ratgeber: Pflege ───────────────────────────────────────────────
  {
    slug: 'bedruckte-textilien-pflege',
    kurzname: 'Pflege bedruckter Textilien',
    titel: 'Bedruckte Textilien waschen: Pflegetipps für DTF-Drucke',
    h1: 'Bedruckte Textilien richtig waschen und pflegen',
    eyebrow: 'Pflege',
    beschreibung:
      'So pflegst du bedruckte T-Shirts und Hoodies: von links waschen, schonende Temperatur, kein Weichspüler – allgemeine Tipps für DTF-Drucke.',
    einleitung: [
      'Mit der richtigen Pflege bleibt ein bedrucktes Textil länger schön. Die folgenden Hinweise sind allgemeine Empfehlungen für Textildruck. Verbindlich ist immer das Pflegeetikett des jeweiligen Textils.',
    ],
    kacheln: [],
    abschnitte: [
      {
        ueberschrift: 'Waschen',
        punkte: [
          'Wende das Teil vor dem Waschen auf links.',
          'Wasche schonend bei niedriger Temperatur – das Pflegeetikett nennt die zulässige Höchsttemperatur.',
          'Verwende mildes Waschmittel; verzichte auf Bleichmittel und Weichspüler.',
          'Wasche bedruckte Teile nicht zusammen mit Textilien, die Reißverschlüsse, Klettverschlüsse oder raue Oberflächen haben.',
        ],
      },
      {
        ueberschrift: 'Trocknen und Bügeln',
        punkte: [
          'Lufttrocknen schont das Textil am meisten. Im Wäschetrockner nur bei niedriger Temperatur und nur, wenn das Pflegeetikett es erlaubt.',
          'Bügle bei Bedarf von links und bei niedriger Temperatur – nicht direkt auf dem Druck.',
        ],
      },
      {
        ueberschrift: 'Pflegehinweise zu deinem Modell',
        absaetze: [
          'Jedes Modell hat auf seiner Produktseite einen Abschnitt „Pflegehinweise“ mit den Angaben des Herstellers. Bei Fragen zu deiner Bestellung erreichst du uns über das Kontaktformular.',
        ],
      },
    ],
    beispiele: [],
    fragen: [
      {
        q: 'Wie wasche ich ein bedrucktes T-Shirt richtig?',
        a: 'Auf links wenden, schonend bei niedriger Temperatur mit mildem Waschmittel waschen, kein Bleichmittel und kein Weichspüler. Verbindlich ist das Pflegeetikett des Textils.',
      },
      {
        q: 'Darf ein bedruckter Hoodie in den Trockner?',
        a: 'Schonender ist Lufttrocknen. Im Trockner nur bei niedriger Temperatur und nur, wenn das Pflegeetikett es erlaubt.',
      },
      {
        q: 'Kann ich über den Druck bügeln?',
        a: 'Besser nicht direkt: Bügle von links und bei niedriger Temperatur, oder lege ein Tuch zwischen Bügeleisen und Druck.',
      },
      {
        q: 'Welche Waschtemperatur ist für bedruckte Textilien geeignet?',
        a: 'Das Pflegeetikett nennt die zulässige Höchsttemperatur des Textils. Für bedruckte Teile ist eine niedrige Temperatur schonender.',
      },
      {
        q: 'Wo finde ich die Pflegehinweise zu einem Modell?',
        a: 'Auf der Produktseite des Modells im Abschnitt „Pflegehinweise“.',
      },
    ],
    ohneAblauf: true,
    verwandt: ['dtf-druck-erklaert', 't-shirts-bedrucken-besticken', 'hoodies-bedrucken-besticken', 'stoffgewicht-t-shirt-hoodie', 'textildruck-preise'],
  },

  // ── Saison: Weihnachtsgeschenke ────────────────────────────────────
  {
    slug: 'weihnachtsgeschenke-bedrucken',
    kurzname: 'Weihnachtsgeschenke',
    titel: 'Weihnachtsgeschenke bedrucken lassen – ab 1 Stück',
    h1: 'Personalisierte Weihnachtsgeschenke: Hoodie, T-Shirt & mehr',
    eyebrow: 'Geschenkideen',
    beschreibung:
      'Hoodies, T-Shirts und Longsleeves als persönliches Weihnachtsgeschenk bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Ein Hoodie mit Lieblingsmotiv, T-Shirts für die ganze Familie, ein Foto auf dem Longsleeve: Es gibt {anzahl} Modelle ({arten}). Du lädst dein Motiv hoch, siehst im Konfigurator, wie es auf dem Textil sitzt, und der Preis erscheint in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'hoodie', anzahl: 2 },
      { art: 'tshirt', anzahl: 2 },
      { art: 'longsleeve', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Ideen für persönliche Geschenke',
        punkte: [
          'Partner-Hoodies: zwei Teile mit demselben oder mit zwei verschiedenen Motiven.',
          'Familien-Shirts: ein Motiv, alle Größen – Größen lassen sich frei mischen.',
          'Foto-Geschenk: Lieblingsfoto, Haustier oder Kinderzeichnung auf T-Shirt oder Longsleeve.',
          'Teamgeschenk: Hoodies mit Firmen- oder Vereinslogo für Kolleginnen, Kollegen und Mitglieder.',
        ],
      },
      {
        ueberschrift: 'Rechtzeitig planen',
        absaetze: [
          'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druckdaten vollständig vorliegen, und dauert regulär {produktionszeit}; der Versand erfolgt anschließend innerhalb von {versand}. Dazu kommt die Laufzeit des Pakets. Je früher du bestellst, desto mehr Spielraum hast du.',
          A_FREIGABE,
        ],
      },
      {
        ueberschrift: 'Auch für Kinder',
        absaetze: [
          'Auch Kinderbekleidung lässt sich bedrucken. Die Größen führen wir so, wie die Hersteller sie angeben – die Größentabelle steht auf jeder Produktseite.',
        ],
      },
      {
        ueberschrift: 'Mehrere Geschenke in einer Bestellung',
        absaetze: [ABSATZ_MEHRERE_PRODUKTE],
      },
    ],
    beispiele: [
      {
        beschriftung: '1 Hoodie · Motiv auf der Brust (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '2 Hoodies · Motiv auf der Brust (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 2,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '5 T-Shirts · Foto auf der Brust (ca. 20 × 20 cm)',
        art: 'tshirt',
        menge: 5,
        flaechen: [{ ansicht: 'front', breiteCm: 20, hoeheCm: 20 }],
      },
    ],
    fragen: [
      { q: 'Kann ich ein einzelnes Geschenk bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Wie lange dauert es, bis das Geschenk ankommt?', a: A_DAUER },
      {
        q: 'Sehe ich das Ergebnis vor der Produktion?',
        a: `${A_FREIGABE} Im Konfigurator siehst du außerdem schon vor dem Bestellen, wie das Motiv auf dem Textil sitzt.`,
      },
      {
        q: 'Welche Dateien kann ich für Foto oder Motiv hochladen?',
        a: `${A_DATEIEN} Je höher die Auflösung des Fotos, desto schärfer wird der Druck.`,
      },
      { q: 'Können Familienmitglieder verschiedene Größen bekommen?', a: A_GROESSEN },
      { q: 'Wie hoch sind die Versandkosten?', a: A_VERSAND },
    ],
    verwandt: [
      'hoodies-bedrucken-besticken',
      't-shirts-bedrucken-besticken',
      'longsleeves-bedrucken',
      'tshirt-mit-foto-bedrucken',
      'kinderbekleidung-bedrucken',
      'textildruck-preise',
    ],
  },

  // ── Gruppen und Feiern ─────────────────────────────────────────────
  {
    slug: 'gruppen-shirts-bedrucken',
    kurzname: 'JGA & Gruppenshirts',
    titel: 'JGA-Shirts & Gruppenshirts bedrucken – ab 1 Stück',
    h1: 'JGA-Shirts und Gruppenshirts bedrucken lassen',
    eyebrow: 'Für Gruppen und Feiern',
    beschreibung:
      'T-Shirts und Hoodies für JGA, Geburtstag, Klassentreffen oder Familienfeier bedrucken – Größen frei mischbar, Preis live im Konfigurator.',
    einleitung: [
      'Gleiche Shirts für die ganze Gruppe: JGA, Geburtstag, Klassentreffen oder Familienfeier. Es gibt {anzahl} Modelle ({arten}); du lädst dein Motiv hoch und siehst im Konfigurator, wie es sitzt – mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'tshirt', anzahl: 3 },
      { art: 'hoodie', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Eine Bestellung, viele Größen',
        absaetze: [
          'Alle bekommen dasselbe Motiv, jede Person ihre Größe: Im Konfigurator trägst du die Stückzahl je Größe ein – Größen darfst du frei mischen, zum Beispiel 2× M, 6× L und 2× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.',
        ],
      },
      {
        ueberschrift: 'Motiv vorn, Spruch hinten',
        absaetze: [ABSATZ_POSITIONEN, 'Ein mögliches Layout: ein kleines Motiv auf der Brust, der Spruch oder der Name der Gruppe groß auf dem Rücken.'],
      },
      {
        ueberschrift: 'Unterschiedliche Motive in einer Bestellung',
        absaetze: [ABSATZ_MEHRERE_PRODUKTE],
      },
      {
        ueberschrift: 'Rechtzeitig planen',
        absaetze: [
          'Die Produktion dauert regulär {produktionszeit}, der anschließende Versand erfolgt innerhalb von {versand}. Plane bei Feiern mit festem Termin entsprechend Zeit ein. Vor Produktionsstart erhältst du eine finale Vorschau zur Freigabe.',
        ],
      },
    ],
    beispiele: [
      {
        beschriftung: '8 T-Shirts · Motiv auf der Brust (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 8,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '8 T-Shirts · Motiv auf der Brust (ca. 10 × 10 cm) und Spruch auf dem Rücken (ca. 25 × 10 cm)',
        art: 'tshirt',
        menge: 8,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 25, hoeheCm: 10 },
        ],
      },
      {
        beschriftung: '10 Hoodies · Motiv auf der Brust (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
    ],
    fragen: [
      { q: 'Ab wie vielen Teilen lohnt sich eine Gruppenbestellung?', a: A_MENGE_STAFFEL },
      { q: 'Können wir die Größen mischen?', a: A_GROESSEN },
      {
        q: 'Können wir unterschiedliche Motive oder Namen bestellen?',
        a: 'Jedes Motiv ist eine eigene Position: Konfiguriere ein Teil, lege es in den Warenkorb und konfiguriere anschließend das nächste. Alle Positionen werden gemeinsam im Warenkorb zusammengefasst.',
      },
      { q: 'Wie früh sollten wir bestellen?', a: A_DAUER },
      { q: 'Wie hoch sind die Versandkosten?', a: A_VERSAND },
    ],
    verwandt: [
      't-shirts-bedrucken-besticken',
      'hoodies-bedrucken-besticken',
      'tshirt-mit-foto-bedrucken',
      'abschluss-hoodies-bedrucken',
      'groessentabelle-t-shirts-hoodies',
      'textildruck-preise',
    ],
  },

  // ── Merch und eigene Marke ─────────────────────────────────────────
  {
    slug: 'eigene-marke-merch-bedrucken',
    kurzname: 'Merch & eigene Marke',
    titel: 'Merch & eigene Marke: Textilien ab 1 Stück bedrucken',
    h1: 'Merch und eigene Marke: Textilien bedrucken lassen',
    eyebrow: 'Für Creator, Bands und kleine Labels',
    beschreibung:
      'Eigenes Merch testen: Hoodies, T-Shirts und mehr ab 1 Stück bedrucken, Staffelpreise ab 5 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Du möchtest Merch für deine Community, deine Band oder dein kleines Label ausprobieren? Mit DTF-Transferdruck bestellst du ab einem einzelnen Stück – ohne Mindestmenge. Es gibt {anzahl} Modelle ({arten}).',
      EINLEITUNG_DTF,
    ],
    kacheln: [
      { art: 'hoodie', anzahl: 2 },
      { art: 'tshirt', anzahl: 2 },
      { art: 'zip-hoodie', anzahl: 2 },
    ],
    abschnitte: [
      {
        ueberschrift: 'Erst ein Muster, dann die Menge',
        absaetze: [
          'Bestelle zuerst ein einzelnes Teil, prüfe Sitz, Farbe und Druck in der Hand und erhöhe danach die Menge. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.',
        ],
      },
      {
        ueberschrift: 'Was du vorbereiten solltest',
        punkte: [
          'Dein Motiv als SVG, PDF oder PNG – vektorbasierte Dateien skalieren verlustfrei.',
          'Bei Rasterbildern genug Bildpunkte für die gewünschte Druckgröße: Ab {dpiOk} dpi gilt die Qualität im Konfigurator als optimal.',
          'Die gewünschten Positionen: Brust, Rücken und – je nach Modell – Ärmel.',
        ],
      },
      {
        ueberschrift: 'Mehrere Designs und Teile',
        absaetze: [ABSATZ_MEHRERE_PRODUKTE, A_FREIGABE],
      },
    ],
    beispiele: [
      {
        beschriftung: '1 Hoodie · Logo auf der Brust (ca. 10 × 10 cm)',
        art: 'hoodie',
        menge: 1,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '5 T-Shirts · Motiv auf der Brust (ca. 10 × 10 cm)',
        art: 'tshirt',
        menge: 5,
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Hoodies · Logo auf der Brust (ca. 10 × 10 cm) und Motiv auf dem Rücken (ca. 20 × 25 cm)',
        art: 'hoodie',
        menge: 10,
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 20, hoeheCm: 25 },
        ],
      },
    ],
    fragen: [
      { q: 'Kann ich einen einzelnen Prototyp bestellen?', a: A_EINZELSTUECK },
      { q: 'Welche Dateien brauche ich für mein Motiv?', a: A_DATEIEN },
      {
        q: 'Wie sehe ich den Preis für meine Merch-Bestellung?',
        a: 'Im Konfigurator siehst du Stück- und Gesamtpreis in Echtzeit, bevor du etwas in den Warenkorb legst. Der Preis ändert sich mit jeder Anpassung von Motiv, Fläche und Menge.',
      },
      { q: 'Wie lange dauert es, bis die Bestellung ankommt?', a: A_DAUER },
      { q: 'Welche Zahlungsmöglichkeiten gibt es?', a: A_ZAHLUNG },
    ],
    verwandt: [
      'hoodies-bedrucken-besticken',
      't-shirts-bedrucken-besticken',
      'zip-hoodies-bedrucken',
      'druckdaten-vorbereiten',
      'textildruck-preise',
      'vereinskleidung-bedrucken',
    ],
  },
];
