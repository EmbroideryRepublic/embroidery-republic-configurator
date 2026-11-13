/**
 * ═══════════════════════════════════════════════════════════════════════
 * DTF-LANDINGPAGES (SEO): Marken und weitere Produktarten
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Warum es diese Seiten gibt (Search Console, 14.10.–10.11.2026): Suchende geben
 * Marken und Produktnamen ein („gildan bedrucken", „just hoods", „gildan ultra
 * cotton") – dafür gab es nur Produktseiten auf Position 20–75. Am besten rankt die
 * Seite bei Formulierungen mit „ab 1 Stück" (Position 3–34, sonst 60–90). Jede Seite
 * hier bündelt alle Modelle einer Marke bzw. einer Produktart, trägt „ab 1 Stück" im
 * Titel und hat eigene Preisbeispiele und FAQ.
 *
 * ── Warum NUR DTF-Transferdruck ────────────────────────────────────────
 * Die Stickerei ist seit 2026-11-11 vorübergehend abgeschaltet (Wartung/Umbau,
 * `BETRIEBSSCHALTER` in config/bestellweg.ts). Neue Seiten versprechen sie deshalb
 * nicht; ein Test (`dtfSeiten.test.ts`) hält fest, dass hier kein „besticken/Stickerei"
 * steht, solange die Stickerei pausiert ist. Wird sie wieder angeboten, entscheidet
 * der Betreiber über die Textänderung (Textfreigabe) – die Seiten bleiben dann
 * unverändert richtig, nur unvollständig.
 *
 * ── Textfreigabe ──────────────────────────────────────────────────────
 * Alles in dieser Datei ist Kundentext und geht erst nach Freigabe des VOLLSTÄNDIGEN
 * Wortlauts durch den Betreiber live. Die Bausteine sind, wo möglich, wortgleich oder
 * ein Auszug aus bereits freigegebenen Texten (FAQ, Kategorieseiten, Startseite).
 *
 * ── Nur belegte Aussagen ──────────────────────────────────────────────
 * Zahlen, Gewichte und Preise werden aus Katalog und Preis-Engine BERECHNET
 * (lib/seo/dtfSeite.ts), nie von Hand eingetragen. Über die Marken selbst steht hier
 * bewusst nichts (Gründungsjahr, Herkunft, Qualitätsurteil): Es gibt keine belegte
 * Quelle im Projekt, und Produktseiten nennen Material und Zertifikate je Modell.
 *
 * Platzhalter (lib/seo/dtfSeite.ts → fuelleDtf):
 *   {marke} {anzahl} {arten} {artPlural} {markenAnzahl} {marken} {marken3}
 *   {gewichtSatz} {abPreis} {produktion} {versand}
 */
import type { ProductType } from '@/types';
import { ABLAUF_SCHRITTE, type KategorieFrage } from '@/config/seo/kategorieSeiten';

export interface DtfSeite {
  /** Pfad ohne Schrägstrich, z.B. „gildan-bedrucken". */
  slug: string;
  /** Genau eines von beiden: Marke (Schreibweise wie im Katalog) ODER Produktart. */
  marke?: string;
  art?: ProductType;
  /** `<title>`, höchstens 60 Zeichen, ohne Marken-Suffix. */
  titel: string;
  h1: string;
  /** Meta-Description-Vorlage (befüllt 70–160 Zeichen). */
  beschreibung: string;
  einleitung: string[];
  fragen: KategorieFrage[];
}

// ── Bausteine (wortgleich oder Auszug aus freigegebenen Texten) ─────────

/** Wortgleich: FAQ „Ab welcher Menge …" / Kategorieseiten. */
const A_EINZELSTUECK =
  'Ja. Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen. Größen dürfen Sie frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Auszug (erste zwei Sätze) aus der freigegebenen Dateien-Antwort; der Stickerei-Satz entfällt. */
const A_DATEIEN =
  'SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren.';
/** Wie FAQ/Kategorieseiten; einzige Abweichung: „Druckdaten“ statt „Druck- bzw. Stickdaten“. */
const A_DAUER =
  'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druckdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren Sie in diesem Fall.';
/** Auszug aus der freigegebenen Verfahren-Antwort und den DTF-Stichpunkten der Startseite. */
const A_DTF =
  'DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Der Griff bleibt flexibel und bewegt sich mit dem Stoff.';

/** Zweiter Einleitungsabsatz: DTF-Beschreibung der Kategorieseiten + Eckdaten (wie EINLEITUNG_ZWEI, ohne Stickerei). */
export const EINLEITUNG_DTF =
  'Bedruckt wird per DTF-Transferdruck: vollfarbig, auch mit Farbverläufen und Fotos, auf Brust und Rücken sowie – je nach Modell – am Ärmel. Es gibt keine Mindestbestellmenge, Größen lassen sich frei mischen, und vor der Produktion prüfen wir Ihre Datei kostenlos.';

/**
 * Ablauf: die freigegebenen Schritte, nur Schritt 3 ohne die Stickerei-Hälfte
 * („DTF-Druck bestellen Sie direkt, Stickerei gibt es nur auf Anfrage – …").
 */
export const DTF_ABLAUF_SCHRITTE: string[] = ABLAUF_SCHRITTE.map((schritt, i) =>
  i === 2 ? 'DTF-Druck bestellen Sie direkt im Konfigurator.' : schritt
);

// ── Fabriken: dieselbe Textform für jede Marke bzw. Produktart ──────────

function markenSeite(marke: string, slug: string): DtfSeite {
  return {
    slug,
    marke,
    titel: '{marke} bedrucken lassen – ab 1 Stück',
    h1: '{marke} bedrucken lassen',
    beschreibung:
      '{anzahl} Modelle von {marke} per DTF-Transferdruck mit Logo oder Motiv bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Wählen Sie aus {anzahl} Modellen von {marke} – {arten} –, laden Sie Ihr Logo oder Motiv hoch und sehen Sie das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    fragen: [
      { q: 'Kann ich auch nur ein einzelnes Teil von {marke} bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Wofür eignet sich der DTF-Transferdruck?', a: A_DTF },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis meine Bestellung ankommt?', a: A_DAUER },
      {
        q: 'Welche Modelle von {marke} gibt es und wie schwer sind sie?',
        a: 'Aktuell gibt es {anzahl} Modelle von {marke}. {gewichtSatz}Die Preise beginnen bei {abPreis} pro Stück zzgl. Veredelung. Material, Passform, Farben und Größen stehen auf der jeweiligen Produktseite.',
      },
    ],
  };
}

function artSeite(art: ProductType, slug: string): DtfSeite {
  return {
    slug,
    art,
    titel: '{artPlural} bedrucken lassen – ab 1 Stück',
    h1: '{artPlural} bedrucken lassen',
    beschreibung:
      '{anzahl} {artPlural} von {marken3} u. a. per DTF-Transferdruck mit Logo oder Motiv bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Es gibt {anzahl} {artPlural} von {markenAnzahl} Marken. Laden Sie Ihr Logo oder Motiv hoch und sehen Sie das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    fragen: [
      { q: 'Kann ich auch nur ein einzelnes Teil bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Wofür eignet sich der DTF-Transferdruck?', a: A_DTF },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis meine Bestellung ankommt?', a: A_DAUER },
      {
        q: 'Welche {artPlural} gibt es und wie schwer sind sie?',
        a: 'Aktuell gibt es {anzahl} Modelle von {marken}. {gewichtSatz}Die Preise beginnen bei {abPreis} pro Stück zzgl. Veredelung. Material, Passform, Farben und Größen stehen auf der jeweiligen Produktseite.',
      },
    ],
  };
}

/**
 * Kinderbekleidung: eigene Textform statt `artSeite`, weil „Kinderbekleidung“ kein zählbares Wort ist („10 Kinderbekleidung“ wäre
 * falsch). Aussagen stammen aus dem Katalog: die Größen kommen je Hersteller als Körpergröße in cm, als Alter oder als Jugendgrößen
 * (config/products/groessen.ts → KINDER_LEITERN) und stehen wortgleich auf der Produktseite.
 */
function kinderSeite(slug: string): DtfSeite {
  return {
    slug,
    art: 'kids',
    titel: 'Kinderbekleidung bedrucken lassen – ab 1 Stück',
    h1: 'Kinderbekleidung bedrucken lassen',
    beschreibung:
      '{anzahl} Modelle Kinderbekleidung von {marken3} u. a. per DTF-Transferdruck bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Kinder-T-Shirts, Hoodies, Sweatshirts und mehr: {anzahl} Modelle von {markenAnzahl} Marken in Kindergrößen. Laden Sie Ihr Logo oder Motiv hoch und sehen Sie das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    fragen: [
      {
        q: 'Kann ich auch nur ein einzelnes Kinderteil bedrucken lassen?',
        // Wie A_EINZELSTUECK (freigegeben), nur mit einem Größenbeispiel, das bei Kinderware vorkommt.
        a: A_EINZELSTUECK.replace('zum Beispiel 2× M, 2× L und 1× XL', 'bei Kindergrößen zum Beispiel 2× 104, 2× 116 und 1× 128'),
      },
      { q: 'Wofür eignet sich der DTF-Transferdruck?', a: A_DTF },
      {
        q: 'Welche Größen gibt es bei Kinderbekleidung?',
        a: 'Die Hersteller geben Kindergrößen unterschiedlich an – als Körpergröße in cm (zum Beispiel 92 bis 164), als Alter (zum Beispiel 3/4 Jahre) oder in Jugendgrößen. Wir übernehmen die Angaben so, wie der Hersteller sie führt; die Größentabelle mit allen Maßen steht auf jeder Produktseite.',
      },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis meine Bestellung ankommt?', a: A_DAUER },
      {
        q: 'Welche Kinderbekleidung gibt es und wie schwer ist sie?',
        a: 'Aktuell gibt es {anzahl} Modelle von {marken}. {gewichtSatz}Die Preise beginnen bei {abPreis} pro Stück zzgl. Veredelung. Material, Passform, Farben und Größen stehen auf der jeweiligen Produktseite.',
      },
    ],
  };
}

// ── Die Seiten ──────────────────────────────────────────────────────────

/** Auswahl nach Nachfrage (Search Console) und Sortimentsbreite (≥ 7 Modelle). */
export const DTF_SEITEN: DtfSeite[] = [
  markenSeite('Gildan', 'gildan-bedrucken'),
  markenSeite('Just Hoods', 'just-hoods-bedrucken'),
  markenSeite('Fruit of the Loom', 'fruit-of-the-loom-bedrucken'),
  markenSeite('Stedman', 'stedman-bedrucken'),
  markenSeite('B&C', 'bc-bedrucken'),
  markenSeite('Russell', 'russell-bedrucken'),
  // Seit 2026-11-14: die übrigen Marken mit ≥ 9 Modellen (Neutral 12, SOL'S 11, James+Nicholson 16, EarthPositive 9).
  markenSeite('James+Nicholson', 'james-nicholson-bedrucken'),
  markenSeite('Neutral', 'neutral-bedrucken'),
  markenSeite("SOL'S", 'sols-bedrucken'),
  markenSeite('EarthPositive', 'earthpositive-bedrucken'),
  artSeite('longsleeve', 'longsleeves-bedrucken'),
  artSeite('jacket', 'jacken-bedrucken'),
  artSeite('zip-hoodie', 'zip-hoodies-bedrucken'),
  kinderSeite('kinderbekleidung-bedrucken'),
];
