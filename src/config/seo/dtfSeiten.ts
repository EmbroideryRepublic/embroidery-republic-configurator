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
 *   {gewichtSatz} {abPreis} {produktion} {versand} {hervorgehoben}
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
  /** Produkt-IDs, die {hervorgehoben} im Text einsetzt („Ultra Cotton T-Shirt (203 g/m²), …“) – Namen und Gewichte kommen aus dem Katalog. */
  hervorgehoben?: string[];
}

// ── Bausteine (wortgleich oder Auszug aus freigegebenen Texten) ─────────

/** Wortgleich: FAQ „Ab welcher Menge …" / Kategorieseiten. */
const A_EINZELSTUECK =
  'Ja. Es gibt keine Mindestbestellmenge – du kannst ab einem einzelnen Stück bestellen. Größen darfst du frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
/** Auszug (erste zwei Sätze) aus der freigegebenen Dateien-Antwort; der Stickerei-Satz entfällt. */
const A_DATEIEN =
  'SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren.';
/** Wie FAQ/Kategorieseiten; einzige Abweichung: „Druckdaten“ statt „Druck- bzw. Stickdaten“. */
const A_DAUER =
  'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druckdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren dich in diesem Fall.';
/** Auszug aus der freigegebenen Verfahren-Antwort und den DTF-Stichpunkten der Startseite. */
const A_DTF =
  'DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Der Griff bleibt flexibel und bewegt sich mit dem Stoff.';

/** Zweiter Einleitungsabsatz: DTF-Beschreibung der Kategorieseiten + Eckdaten (wie EINLEITUNG_ZWEI, ohne Stickerei). */
export const EINLEITUNG_DTF =
  'Bedruckt wird per DTF-Transferdruck: vollfarbig, auch mit Farbverläufen und Fotos, auf Brust und Rücken sowie – je nach Modell – am Ärmel. Es gibt keine Mindestbestellmenge, Größen lassen sich frei mischen, und vor der Produktion prüfen wir deine Datei kostenlos.';

/**
 * Ablauf: die freigegebenen Schritte, nur Schritt 3 ohne die Stickerei-Hälfte
 * („DTF-Druck bestellen Sie direkt, Stickerei gibt es nur auf Anfrage – …").
 */
export const DTF_ABLAUF_SCHRITTE: string[] = ABLAUF_SCHRITTE.map((schritt, i) =>
  i === 2 ? 'DTF-Druck bestellst du direkt im Konfigurator.' : schritt
);

// ── Fabriken: dieselbe Textform für jede Marke bzw. Produktart ──────────

/**
 * Gezielte Abweichungen von der Standardform (Stand 26.11.2026, Suchanfragen aus der Search Console): Titel, Beschreibung und ein
 * Einleitungsabsatz tragen die Wörter, mit denen tatsächlich gesucht wird; `zusatzFragen` beantworten Fragen, die nur diese Seite betreffen.
 * Alles bleibt DTF-only (Test: dtfSeiten.test.ts) und wortnah an bereits freigegebenen Aussagen.
 */
interface Abweichung {
  titel?: string;
  h1?: string;
  beschreibung?: string;
  /** Ersetzt den ERSTEN Einleitungsabsatz. */
  einleitung?: string;
  zusatzFragen?: KategorieFrage[];
  hervorgehoben?: string[];
}

function mit(seite: DtfSeite, a: Abweichung = {}): DtfSeite {
  return {
    ...seite,
    ...(a.titel ? { titel: a.titel } : {}),
    ...(a.h1 ? { h1: a.h1 } : {}),
    ...(a.beschreibung ? { beschreibung: a.beschreibung } : {}),
    ...(a.einleitung ? { einleitung: [a.einleitung, ...seite.einleitung.slice(1)] } : {}),
    ...(a.zusatzFragen ? { fragen: [...seite.fragen.slice(0, -1), ...a.zusatzFragen, ...seite.fragen.slice(-1)] } : {}),
    ...(a.hervorgehoben ? { hervorgehoben: a.hervorgehoben } : {}),
  };
}

function markenSeite(marke: string, slug: string, abweichung?: Abweichung): DtfSeite {
  return mit(markenSeiteStandard(marke, slug), abweichung);
}

function markenSeiteStandard(marke: string, slug: string): DtfSeite {
  return {
    slug,
    marke,
    titel: '{marke} bedrucken lassen – ab 1 Stück',
    h1: '{marke} bedrucken lassen',
    beschreibung:
      '{anzahl} Modelle von {marke} per DTF-Transferdruck mit Logo oder Motiv bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Wähle aus {anzahl} Modellen von {marke} – {arten} –, lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
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

function artSeite(art: ProductType, slug: string, abweichung?: Abweichung): DtfSeite {
  return mit(artSeiteStandard(art, slug), abweichung);
}

function artSeiteStandard(art: ProductType, slug: string): DtfSeite {
  return {
    slug,
    art,
    titel: '{artPlural} bedrucken lassen – ab 1 Stück',
    h1: '{artPlural} bedrucken lassen',
    beschreibung:
      '{anzahl} {artPlural} von {marken3} u. a. per DTF-Transferdruck mit Logo oder Motiv bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Es gibt {anzahl} {artPlural} von {markenAnzahl} Marken. Lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
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
      'Kinder-T-Shirts, Hoodies, Sweatshirts und mehr: {anzahl} Modelle von {markenAnzahl} Marken in Kindergrößen. Lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
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

/**
 * Sportbekleidung: eigene Textform statt `artSeite`, weil „Sportbekleidung“ ein Sammelbegriff ohne Mehrzahl ist („10 Sportbekleidung“
 * wäre falsch). Die Bausteine sind dieselben freigegebenen Antworten wie bei den anderen Seiten; neu sind nur Titel, Überschrift,
 * Beschreibung und der erste Einleitungsabsatz. Genannt werden nur Kleidungsstücke, die es im Katalog gibt (Test: sportSeite.test.ts).
 */
function sportSeite(slug: string): DtfSeite {
  return {
    slug,
    art: 'sport',
    titel: 'Sportbekleidung bedrucken lassen – ab 1 Stück',
    h1: 'Sportbekleidung bedrucken lassen',
    beschreibung:
      '{anzahl} Modelle Sportbekleidung von {marken3} u. a. per DTF-Transferdruck bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung: [
      'Sport-T-Shirts, Langarmshirts und Tanktops: {anzahl} Modelle von {markenAnzahl} Marken. Lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
      EINLEITUNG_DTF,
    ],
    fragen: [
      { q: 'Kann ich auch nur ein einzelnes Sportteil bedrucken lassen?', a: A_EINZELSTUECK },
      { q: 'Wofür eignet sich der DTF-Transferdruck?', a: A_DTF },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis meine Bestellung ankommt?', a: A_DAUER },
      {
        q: 'Welche Sportbekleidung gibt es und wie schwer ist sie?',
        a: 'Aktuell gibt es {anzahl} Modelle von {marken}. {gewichtSatz}Die Preise beginnen bei {abPreis} pro Stück zzgl. Veredelung. Material, Passform, Farben und Größen stehen auf der jeweiligen Produktseite.',
      },
    ],
  };
}

// ── Die Seiten ──────────────────────────────────────────────────────────

/** Auswahl nach Nachfrage (Search Console) und Sortimentsbreite (≥ 7 Modelle). */
export const DTF_SEITEN: DtfSeite[] = [
  markenSeite('Gildan', 'gildan-bedrucken', {
    // Gesucht wird „gildan t shirt bedrucken“, „gildan hoodie bedrucken“, „gildan ultra cotton“ (zusammen rund 250 Impressionen in 90 Tagen).
    titel: 'Gildan T-Shirts & Hoodies bedrucken lassen – ab 1 Stück',
    beschreibung:
      'Gildan Ultra Cotton, Heavy Cotton, Hoodies und mehr: {anzahl} Modelle per DTF-Transferdruck bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung:
      'Wähle aus {anzahl} Modellen von {marke} – {arten} –, lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit. Zum Einstieg: {hervorgehoben}.',
    hervorgehoben: ['gildan-ultra-cotton-t-shirt', 'gildan-heavy-t', 'gildan-heavy-blend-hooded-sweatshirt', 'gildan-ultra-cotton-long-sleeve-t-shirt'],
  }),
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
  // Seit 2026-11-18: Just Cool (mit den Sport-Shirts 8 Modelle).
  markenSeite('Just Cool', 'just-cool-bedrucken'),
  artSeite('longsleeve', 'longsleeves-bedrucken', {
    // Gesucht wird „longsleeve(s) bedrucken (lassen)“, „long sleeve bedrucken“, „longshirt bedrucken“ (zusammen rund 330 Impressionen, Position 30–63).
    titel: 'Longsleeve bedrucken lassen – ab 1 Stück, Langarmshirts',
    beschreibung:
      '{anzahl} Longsleeves (Langarmshirts) von {marken3} u. a. per DTF-Transferdruck bedrucken – je nach Modell auch am Ärmel, ab 1 Stück.',
    einleitung:
      'Longsleeve, Long Sleeve, Longshirt oder Langarmshirt – gemeint ist dasselbe: ein Shirt mit langen Ärmeln. Es gibt {anzahl} Modelle von {markenAnzahl} Marken. Lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
    zusatzFragen: [
      {
        q: 'Kann ich ein Longsleeve auch am Ärmel bedrucken lassen?',
        a: 'Je nach Modell stehen neben Brust und Rücken auch die Ärmel zur Verfügung. Zu jeder Position siehst du im Konfigurator die zulässige Veredelungsfläche samt Maßen in Zentimetern. Der Preis richtet sich nach der Anzahl der veredelten Positionen und der Menge.',
      },
    ],
  }),
  artSeite('jacket', 'jacken-bedrucken', {
    // Alle Jacken im Katalog sind Fleece-/Microfleece-Jacken (Test: dtfSeiten.test.ts hält das fest). Gesucht wird „jacken bedrucken (lassen)“, „jacken mit eigenem aufdruck“.
    titel: 'Jacken bedrucken lassen – Fleecejacken ab 1 Stück',
    beschreibung:
      '{anzahl} Fleecejacken von {marken3} u. a. per DTF-Transferdruck mit eigenem Aufdruck bedrucken – ab 1 Stück, Preis live im Konfigurator.',
    einleitung:
      'Das Jackensortiment besteht aus {anzahl} Fleece- und Microfleece-Jacken von {markenAnzahl} Marken, für Betrieb, Team und Verein. Lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
  }),
  artSeite('zip-hoodie', 'zip-hoodies-bedrucken', {
    // Sweatjacken mit Reißverschluss: Gesucht wird „sweatjacken bedrucken ab 1 stück“ (Position 34), „zip hoodie bedrucken lassen“.
    titel: 'Zip-Hoodies & Sweatjacken bedrucken lassen – ab 1 Stück',
    beschreibung:
      '{anzahl} Zip-Hoodies, Sweatjacken und Half-Zip-Sweats von {marken3} u. a. per DTF-Transferdruck bedrucken – ab 1 Stück, live im Konfigurator.',
    einleitung:
      'Zip-Hoodies, Sweatjacken und Half-Zip-Sweats: Es gibt {anzahl} Modelle von {markenAnzahl} Marken. Lade dein Logo oder Motiv hoch und sieh das Ergebnis direkt im Konfigurator, mit Preis in Echtzeit.',
  }),
  kinderSeite('kinderbekleidung-bedrucken'),
  sportSeite('sportbekleidung-bedrucken'),
];
