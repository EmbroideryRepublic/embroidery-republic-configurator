/**
 * ═══════════════════════════════════════════════════════════════════════
 * KATEGORIE-LANDINGPAGES (SEO) – alle Texte an EINER, prüfbaren Stelle
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Warum es diese Seiten gibt: Die Filteransicht `/produkt?kategorie=hoodie` ist
 * bewusst `noindex` (beliebig viele Filterkombinationen mit fast gleichem
 * Inhalt). Damit gab es für Suchanfragen wie „Hoodies bedrucken lassen" oder
 * „Poloshirts besticken lassen" KEINE indexierbare Seite – dabei sind genau
 * das die Anfragen, mit denen ein Shop gefunden wird. Jede Seite hier ist eine
 * eigene, dauerhaft stabile Adresse mit eigenem Titel, eigener Beschreibung,
 * Veredelungsberatung, Preisbeispielen und FAQ.
 *
 * ── Textfreigabe ──────────────────────────────────────────────────────
 * Alles in dieser Datei ist Kundentext. Änderungen gehen erst nach Freigabe des
 * VOLLSTÄNDIGEN Wortlauts durch den Betreiber live (siehe Arbeitsweise-Regel
 * „Textfreigabepflicht").
 *
 * ── Nur belegte Aussagen ──────────────────────────────────────────────
 * Jede Behauptung stammt aus bereits freigegebenen Seiten (FAQ, „Über uns",
 * Produktseite, Methodenwähler) oder wird aus dem Katalog bzw. der Preis-Engine
 * BERECHNET – niemals von Hand eingetragen, damit sie nicht veralten:
 *   {anzahl} {markenAnzahl} {marken} {marken3} {gewichtMin} {gewichtMax}
 *   {abPreis}  → aus dem Katalog (lib/seo/kategorieSeite.ts → kategorieFakten)
 *   Preisbeispiele → aus `priceCart()`, derselben Funktion wie im Checkout
 * Bewusst NICHT behauptet, weil nicht belegt: Standort der Produktion,
 * Kundenzahlen, Bewertungen, Auszeichnungen, Lieferzusagen über die FAQ hinaus.
 */
import type { ProductType } from '@/types';

export interface KategorieFrage {
  q: string;
  a: string;
}

/** Eine Beispielrechnung. Enthält KEINE Preise – die kommen aus der Preis-Engine. */
export interface KategorieBeispiel {
  /** Zeile in der Preistabelle, z.B. „10 Hoodies · Stickerei, Brustlogo". */
  beschriftung: string;
  produktId: string;
  methode: 'dtf' | 'embroidery';
  /** Größenverteilung, z.B. { M: 4, L: 4, XL: 2 } → 10 Stück. */
  groessen: Record<string, number>;
  /** Veredelungsflächen des Beispiels. `stiche` nur bei Stickerei. */
  flaechen: { ansicht: 'front' | 'back'; breiteCm: number; hoeheCm: number; stiche?: number }[];
}

export interface KategorieSeite {
  art: ProductType;
  /** Pfad ohne Schrägstrich, z.B. „hoodies-bedrucken-besticken". */
  slug: string;
  /** `<title>`, höchstens 60 Zeichen, bewusst OHNE Marken-Suffix (Google zeigt
   *  den Seitennamen aus WebSite-Daten ohnehin separat an). */
  titel: string;
  h1: string;
  /** Meta-Description-Vorlage (nach Befüllung höchstens 160 Zeichen). */
  beschreibung: string;
  /** Einleitungsabsätze (Vorlagen). */
  einleitung: string[];
  /** Veredelungsberatung speziell für diese Produktart. `zuerst` bestimmt, welche
   *  Karte vorn steht (Poloshirt: Stickerei, T-Shirt/Hoodie: DTF). */
  verfahren: { zuerst: 'dtf' | 'embroidery'; dtf: string; stickerei: string; hinweis: string };
  beispiele: KategorieBeispiel[];
  fragen: KategorieFrage[];
}

// ── Gemeinsame Bausteine ────────────────────────────────────────────────

/** Ablauf – Schritt 1–4 wortnah aus „Über uns" und FAQ; Schritt 5 wird mit
 *  den Zeiten aus config/company.ts befüllt ({produktion}, {versand}). */
export const ABLAUF_SCHRITTE: string[] = [
  'Modell, Farbe und Größen wählen – Größen lassen sich frei mischen.',
  'Logo hochladen oder Text gestalten und im Konfigurator platzieren. Der Preis ist dabei jederzeit sichtbar.',
  'Bestellen oder unverbindlich anfragen – ganz wie Sie möchten.',
  'Wir prüfen Ihr Design und legen Ihnen vor Produktionsstart eine finale Vorschau zur Freigabe vor.',
  'Produktion in {produktion}, anschließend Versand innerhalb von {versand}.',
];

/** Bausteine der FAQ-Antworten, wortgleich mit /faq (dort freigegeben). */
const A_EINZELSTUECK =
  'Ja. Es gibt keine Mindestbestellmenge – Sie können ab einem einzelnen Stück bestellen. Größen dürfen Sie frei mischen, zum Beispiel 2× M, 2× L und 1× XL. Mit größerer Menge sinkt der Stückpreis: Staffelpreise gelten ab 5 Stück.';
const A_DATEIEN =
  'SVG, PNG, JPG/JPEG und PDF werden unterstützt. Am besten eignen sich vektorbasierte Dateien (SVG, PDF), da sie verlustfrei skalieren. Für Stickerei digitalisiert unser Team Ihr Logo anschließend manuell in Garnfarben – die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild.';
const A_DAUER =
  'Die Produktion beginnt nach Bestellfreigabe, sobald alle Druck- bzw. Stickdaten vollständig vorliegen. Die reguläre Produktionszeit beträgt 3 bis 4 Werktage, der anschließende Versand erfolgt innerhalb von 1 bis 2 Werktagen. Bei größeren Bestellmengen oder besonders aufwendigen Produktionen kann sich die Produktionszeit verlängern – wir informieren Sie in diesem Fall.';
const A_VERFAHREN =
  'Das hängt vom Motiv ab. DTF-Transferdruck eignet sich für vollfarbige, auch fotorealistische Motive und große Flächen. Stickerei ist langlebiger und hochwertiger in der Haptik, arbeitet aber mit einer begrenzten Anzahl fester Garnfarben (keine Farbverläufe) und eignet sich vor allem für kompaktere Motive wie Brustlogos.';
const A_MODELLE =
  'Aktuell gibt es {anzahl} Modelle von {marken}. Die Stoffgewichte reichen von {gewichtMin} bis {gewichtMax} g/m². Die Preise beginnen bei {abPreis} pro Stück zzgl. Veredelung. Material, Passform, Farben und Größen stehen auf der jeweiligen Produktseite.';

const EINLEITUNG_ZWEI =
  'Veredelt wird wahlweise per DTF-Transferdruck oder Stickerei. Es gibt keine Mindestbestellmenge, Größen lassen sich frei mischen, und vor der Produktion prüfen wir Ihre Datei kostenlos.';

// ── Die Seiten ──────────────────────────────────────────────────────────

export const KATEGORIE_SEITEN: KategorieSeite[] = [
  {
    art: 'hoodie',
    slug: 'hoodies-bedrucken-besticken',
    titel: 'Hoodies bedrucken & besticken lassen – ab 1 Stück',
    h1: 'Hoodies bedrucken & besticken lassen',
    beschreibung:
      '{anzahl} Hoodies von {marken3} u. a. mit Logo oder Motiv veredeln: DTF-Transferdruck oder Stickerei, live im Konfigurator, ab 1 Stück.',
    einleitung: [
      'Ob einzelner Lieblings-Hoodie, Vereinskollektion oder Teamkleidung für den Betrieb: Wählen Sie aus {anzahl} Hoodie-Modellen von {markenAnzahl} Marken, laden Sie Ihr Logo oder Motiv hoch und sehen Sie das Ergebnis direkt im Konfigurator – mit Preis in Echtzeit.',
      EINLEITUNG_ZWEI,
    ],
    verfahren: {
      zuerst: 'dtf',
      dtf: 'Hoodies bieten große, ruhige Flächen – ideal für vollfarbige Motive auf Brust oder Rücken. Mit DTF-Transferdruck lassen sich auch Farbverläufe und fotorealistische Motive großflächig umsetzen; der Griff bleibt flexibel und bewegt sich mit dem Stoff.',
      stickerei:
        'Für Logos, Monogramme und Schriftzüge ist die Stickerei die hochwertige Wahl: Sie wirkt erhaben, besteht aus echtem Garn und ist besonders langlebig und waschbeständig. Sie arbeitet mit einer begrenzten Zahl fester Garnfarben und eignet sich vor allem für kompaktere Motive wie ein Brustlogo.',
      hinweis: 'Beide Verfahren nutzen dieselbe Veredelungsfläche – im Konfigurator können Sie zwischen ihnen wechseln.',
    },
    beispiele: [
      {
        beschriftung: '1 Hoodie · DTF-Transferdruck, Brustmotiv (ca. 10 × 10 cm)',
        produktId: 'gildan-heavy-blend-hooded-sweatshirt',
        methode: 'dtf',
        groessen: { M: 1 },
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 Hoodies · Stickerei, Brustlogo (ca. 8 × 6 cm, rund 4.000 Stiche)',
        produktId: 'gildan-heavy-blend-hooded-sweatshirt',
        methode: 'embroidery',
        groessen: { M: 4, L: 4, XL: 2 },
        flaechen: [{ ansicht: 'front', breiteCm: 8, hoeheCm: 6, stiche: 4000 }],
      },
    ],
    fragen: [
      { q: 'Kann ich auch nur einen einzelnen Hoodie bedrucken oder besticken lassen?', a: A_EINZELSTUECK },
      { q: 'Was ist besser für einen Hoodie: Druck oder Stickerei?', a: A_VERFAHREN },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis mein Hoodie ankommt?', a: A_DAUER },
      { q: 'Welche Hoodies gibt es und wie schwer sind sie?', a: A_MODELLE },
    ],
  },
  {
    art: 'tshirt',
    slug: 't-shirts-bedrucken-besticken',
    titel: 'T-Shirts bedrucken & besticken lassen – ab 1 Stück',
    h1: 'T-Shirts bedrucken & besticken lassen',
    beschreibung:
      '{anzahl} T-Shirts von {marken3} u. a. mit Logo oder Motiv veredeln: DTF-Transferdruck oder Stickerei, live im Konfigurator, ab 1 Stück.',
    einleitung: [
      'Vom Einzelstück bis zur Teamausstattung: Wählen Sie aus {anzahl} T-Shirt-Modellen von {markenAnzahl} Marken mit Stoffgewichten von {gewichtMin} bis {gewichtMax} g/m², gestalten Sie Ihr Motiv live im Konfigurator und sehen Sie den Preis in Echtzeit.',
      EINLEITUNG_ZWEI,
    ],
    verfahren: {
      zuerst: 'dtf',
      dtf: 'T-Shirts tragen oft größere, bunte Motive – dafür ist der DTF-Transferdruck gemacht: vollfarbig, auch mit Farbverläufen und Fotos, auf Brust und Rücken sowie – je nach Modell – am Ärmel. Der Griff bleibt flexibel und bewegt sich mit dem Stoff.',
      stickerei:
        'Ein dezentes Brustlogo oder ein Schriftzug wirkt gestickt besonders hochwertig: erhaben, aus echtem Garn, langlebig und waschbeständig. Stickerei arbeitet mit einer begrenzten Zahl fester Garnfarben ohne Farbverläufe und eignet sich für kompaktere Motive.',
      hinweis: 'Beide Verfahren nutzen dieselbe Veredelungsfläche – im Konfigurator können Sie zwischen ihnen wechseln.',
    },
    beispiele: [
      {
        beschriftung: '1 T-Shirt · DTF-Transferdruck, Brustmotiv (ca. 10 × 10 cm)',
        produktId: 'gildan-heavy-t',
        methode: 'dtf',
        groessen: { M: 1 },
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '10 T-Shirts · DTF-Transferdruck, Brustmotiv (ca. 10 × 10 cm)',
        produktId: 'gildan-heavy-t',
        methode: 'dtf',
        groessen: { M: 4, L: 4, XL: 2 },
        flaechen: [{ ansicht: 'front', breiteCm: 10, hoeheCm: 10 }],
      },
      {
        beschriftung: '25 T-Shirts · DTF-Transferdruck, Brustmotiv (ca. 10 × 10 cm) + Rückenmotiv (ca. 28 × 28 cm)',
        produktId: 'gildan-heavy-t',
        methode: 'dtf',
        groessen: { S: 5, M: 8, L: 8, XL: 4 },
        flaechen: [
          { ansicht: 'front', breiteCm: 10, hoeheCm: 10 },
          { ansicht: 'back', breiteCm: 28, hoeheCm: 28 },
        ],
      },
    ],
    fragen: [
      { q: 'Kann ich auch nur ein einzelnes T-Shirt bedrucken oder besticken lassen?', a: A_EINZELSTUECK },
      {
        q: 'Wo auf dem T-Shirt kann ich mein Motiv platzieren?',
        a: 'Im Konfigurator stehen Brust und Rücken sowie – je nach Modell – der Ärmel zur Verfügung. Zu jeder Position sehen Sie die zulässige Veredelungsfläche. Der Preis richtet sich nach der Anzahl der veredelten Positionen und der Menge und wird im Konfigurator live berechnet.',
      },
      { q: 'Was ist besser für ein T-Shirt: Druck oder Stickerei?', a: A_VERFAHREN },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis meine T-Shirts ankommen?', a: A_DAUER },
      { q: 'Welche T-Shirts gibt es und wie schwer sind sie?', a: A_MODELLE },
    ],
  },
  {
    art: 'polo',
    slug: 'poloshirts-besticken-bedrucken',
    titel: 'Poloshirts besticken & bedrucken lassen – ab 1 Stück',
    h1: 'Poloshirts besticken & bedrucken lassen',
    beschreibung:
      '{anzahl} Poloshirts von {marken3} u. a. mit Firmenlogo besticken oder bedrucken: live im Konfigurator gestalten, ab 1 Stück, ohne Mindestmenge.',
    einleitung: [
      'Das Poloshirt ist der klassische Auftritt für Betrieb, Verein und Team – mit gesticktem Logo auf der Brust wirkt es sofort einheitlich. Wählen Sie aus {anzahl} Polo-Modellen von {markenAnzahl} Marken, platzieren Sie Ihr Logo live im Konfigurator und sehen Sie den Preis in Echtzeit.',
      EINLEITUNG_ZWEI,
    ],
    verfahren: {
      zuerst: 'embroidery',
      dtf: 'Ist Ihr Motiv farbenreich, hat Verläufe oder ist ein Foto, ist der DTF-Transferdruck die bessere Wahl: vollfarbig, auch großflächig, mit flexiblem Griff, der sich mit dem Stoff bewegt.',
      stickerei:
        'Ein gesticktes Brustlogo ist der Klassiker auf dem Poloshirt: erhaben, aus echtem Garn, besonders langlebig und waschbeständig. Stickerei arbeitet mit einer begrenzten Zahl fester Garnfarben ohne Farbverläufe. Ihr Logo digitalisiert unser Team vor der Produktion in Garnfarben und legt es Ihnen zur Freigabe vor.',
      hinweis: 'Beide Verfahren nutzen dieselbe Veredelungsfläche – im Konfigurator können Sie zwischen ihnen wechseln.',
    },
    beispiele: [
      {
        beschriftung: '1 Poloshirt · Stickerei, Brustlogo (ca. 8 × 6 cm, rund 4.000 Stiche)',
        produktId: 'gildan-softstyle-polo',
        methode: 'embroidery',
        groessen: { M: 1 },
        flaechen: [{ ansicht: 'front', breiteCm: 8, hoeheCm: 6, stiche: 4000 }],
      },
      {
        beschriftung: '10 Poloshirts · Stickerei, Brustlogo (ca. 8 × 6 cm, rund 4.000 Stiche)',
        produktId: 'gildan-softstyle-polo',
        methode: 'embroidery',
        groessen: { M: 4, L: 4, XL: 2 },
        flaechen: [{ ansicht: 'front', breiteCm: 8, hoeheCm: 6, stiche: 4000 }],
      },
      {
        beschriftung: '25 Poloshirts · Stickerei, Brustlogo (ca. 8 × 6 cm, rund 4.000 Stiche)',
        produktId: 'gildan-softstyle-polo',
        methode: 'embroidery',
        groessen: { S: 5, M: 8, L: 8, XL: 4 },
        flaechen: [{ ansicht: 'front', breiteCm: 8, hoeheCm: 6, stiche: 4000 }],
      },
    ],
    fragen: [
      { q: 'Kann ich auch nur ein einzelnes Poloshirt besticken lassen?', a: A_EINZELSTUECK },
      { q: 'Was ist besser für ein Poloshirt: Stickerei oder Druck?', a: A_VERFAHREN },
      {
        q: 'Wie läuft die Digitalisierung meines Logos für die Stickerei ab?',
        a: 'Für Stickerei digitalisiert unser Team Ihr Logo manuell in Garnfarben. Vor Produktionsstart erhalten Sie eine finale Vorschau zur Freigabe. Die Vorschau im Konfigurator zeigt die Platzierung, nicht das finale Stickbild.',
      },
      { q: 'Welche Dateien kann ich für mein Logo hochladen?', a: A_DATEIEN },
      { q: 'Wie lange dauert es, bis meine Poloshirts ankommen?', a: A_DAUER },
      { q: 'Welche Poloshirts gibt es und wie schwer sind sie?', a: A_MODELLE },
    ],
  },
];
