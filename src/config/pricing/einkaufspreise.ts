/**
 * ═══════════════════════════════════════════════════════════════════════
 * EINKAUFSPREISE – HERKUNFT UND BELASTBARKEIT
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Diese Datei beantwortet für jedes Produkt zwei Fragen: Woher stammt der
 * Einkaufspreis – und wie belastbar ist er?
 *
 * ── Warum es sie gibt ─────────────────────────────────────────────────
 * Im Katalog standen drei Sorten von Einkaufspreisen nebeneinander: einige
 * mit Quellenhinweis im Kommentar, vierzehn ausdrücklich als „PLATZHALTER"
 * markiert, achtzehn ohne jede Angabe. Die dritte Gruppe war die
 * gefährlichste – ein Zahlenwert ohne Herkunft sieht aus wie ein Faktum.
 *
 * Da der Verkaufspreis über `computeBasePrice()` unmittelbar aus dem
 * Einkaufspreis folgt, wirkt jeder falsche Wert direkt auf die Marge.
 *
 * ── Die drei Stufen ───────────────────────────────────────────────────
 *
 *   verifiziert  Unmittelbar aus dem Lieferantenkonto oder einer aktuellen
 *                Preisliste. Belastbar – taugt als Kalkulationsgrundlage.
 *
 *   bekannt      Aus der Praxis bekannt oder bereits so bezahlt, aber noch
 *                nicht gegen eine aktuelle Lieferantenquelle geprüft.
 *                Wertvolles Wissen, das nicht verloren gehen darf – aber
 *                mit sichtbarem Prüfvorbehalt.
 *
 *   platzhalter  Entwicklungswert, geschätzt oder Herkunft ungeklärt.
 *                **Darf niemals Grundlage der Verkaufskalkulation sein.**
 *
 * ── Zuordnungsregel (bewusst konservativ) ─────────────────────────────
 * Im Zweifel die NIEDRIGERE Stufe. Ein zu hoch eingestufter Preis führt zu
 * einer Kalkulation, die belastbar aussieht und es nicht ist.
 *
 * Deshalb stehen auch die elf Werte mit „ab-Preis"-Hinweis vorerst auf
 * `platzhalter`: Ein öffentlicher Listenpreis aus einer Produktlistung ist
 * nicht die tatsächliche Einkaufskondition – die hängt an Kundenkonto und
 * Abnahmemenge. Der Hinweis bleibt in `notiz` erhalten; sobald bestätigt
 * ist, dass diese Preise der Praxis entsprechen, gehören sie auf `bekannt`.
 *
 * ── Zwei Preisfelder, mit Absicht ─────────────────────────────────────
 *   `preis`          Der nachgewiesene bzw. bekannte Einkaufspreis.
 *   `preisImKatalog` Der Wert, mit dem die Anwendung derzeit RECHNET.
 *
 * Laufen sie auseinander, ist das die wichtigste Meldung dieser Datei: Die
 * Kalkulation stützt sich auf einen anderen Wert als den, den wir kennen.
 * `npm run ek:pruefen` weist die Differenz aus.
 *
 * ── Pflege ────────────────────────────────────────────────────────────
 * Eine zentrale Datei statt Einträgen in den neun Marken-Dateien – dasselbe
 * Muster wie `supplierRefs.ts`: alle Quellen auf einen Blick prüfbar und
 * später ohne Umbau in eine Tabelle oder Adminmaske überführbar.
 */

export type EinkaufspreisStufe =
  /** Aus Lieferantenkonto oder aktueller Preisliste – belastbar. */
  | 'verifiziert'
  /** Aus der Praxis bekannt/bezahlt, Aktualität noch ungeprüft. */
  | 'bekannt'
  /** Entwicklungswert – nie Grundlage der Verkaufskalkulation. */
  | 'platzhalter';

export interface EinkaufspreisNachweis {
  stufe: EinkaufspreisStufe;
  /** Der nachgewiesene bzw. bekannte Einkaufspreis (netto, je Stück). */
  preis: number;
  /**
   * Der Wert, mit dem die Anwendung derzeit rechnet (`purchasePrice` in der
   * Marken-Datei). Weicht er von `preis` ab, kalkuliert der Shop mit einer
   * anderen Zahl als der, die wir kennen.
   */
  preisImKatalog: number;
  lieferant?: string;
  artikelnummer?: string;
  /** Woher die Angabe stammt, z.B. „Preisliste needen.de, Kundenkonto". */
  quelle?: string;
  /** Datum der Preisauskunft (ISO), z.B. '2026-07-22'. */
  stand?: string;
  /** Abnahmemenge, für die der Preis gilt, z.B. „ab 10 Stück". */
  staffel?: string;
  notiz?: string;
}

/** Nachweis je Katalog-Produkt-ID. Stand der Erhebung: 2026-07-21. */
export const EINKAUFSPREIS_NACHWEISE: Record<string, EinkaufspreisNachweis> = {
  // B&C · Inspire Hooded Sweat
  'bandc-inspire-hoodie': {
    stufe: 'bekannt',
    preis: 17.43,
    preisImKatalog: 17.43,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'BCWU33B',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // B&C · Inspire Zipped Hood Jacket
  'bandc-inspire-zip-hood': {
    stufe: 'bekannt',
    preis: 23.63,
    preisImKatalog: 23.63,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'BCWU35B',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Baseball Longsleeve
  'fotl-baseball-longsleeve': {
    stufe: 'bekannt',
    preis: 5.51,
    preisImKatalog: 5.51,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F296',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 7,20 €",
  },
  // Fruit of the Loom · Baseball T-Shirt
  'fotl-baseball-t': {
    stufe: 'bekannt',
    preis: 4.84,
    preisImKatalog: 4.84,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F295',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 6,38 €",
  },
  // Fruit of the Loom · Heavy T
  'fotl-heavy-t': {
    stufe: 'bekannt',
    preis: 3.56,
    preisImKatalog: 4.2,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F182',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 4,63 €",
  },
  // Fruit of the Loom · Iconic 195 Ringspun Premium Long Sleeve T
  'fotl-iconic195-longsleeve': {
    stufe: 'bekannt',
    preis: 5.93,
    preisImKatalog: 6.8,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F195',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL-5XL 8,25 €",
  },
  // Fruit of the Loom · Iconic 195 Ringspun Premium T
  'fotl-iconic195-t': {
    stufe: 'platzhalter',
    preis: 5.4,
    preisImKatalog: 5.4,
    notiz:
      'Weiterhin unbelegt. Der am 2026-07-22 gelieferte Screenshot zeigt den Long Sleeve (F195), ' +
      'nicht dieses kurzärmelige Herrenmodell.',
  },
  // Fruit of the Loom · Ladies Iconic 195 Ringspun Premium T
  'fotl-ladies-iconic195-t': {
    stufe: 'bekannt',
    preis: 3.27,
    preisImKatalog: 5.3,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F186',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Ladies Original T
  'fotl-ladies-original-t': {
    stufe: 'bekannt',
    preis: 3.01,
    preisImKatalog: 3.6,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F111',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Ladies Valueweight T
  'fotl-ladies-valueweight-t': {
    stufe: 'bekannt',
    preis: 3.24,
    preisImKatalog: 2.5,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F288N',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Ladies Valueweight V-Neck T
  'fotl-ladies-valueweight-vneck': {
    stufe: 'bekannt',
    preis: 4.09,
    preisImKatalog: 2.6,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F271N',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Original Long Sleeve T
  'fotl-original-longsleeve': {
    stufe: 'bekannt',
    preis: 4.07,
    preisImKatalog: 5.8,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F243',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 4,79 €",
  },
  // Fruit of the Loom · Original T
  'fotl-original-t': {
    stufe: 'bekannt',
    preis: 2.84,
    preisImKatalog: 3.2,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F110',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 4,02 €",
  },
  // Fruit of the Loom · Original V-Neck T
  'fotl-original-vneck': {
    stufe: 'bekannt',
    preis: 2.94,
    preisImKatalog: 3.8,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F272',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Premium Polo
  'fotl-premium-polo': {
    stufe: 'bekannt',
    preis: 7.62,
    preisImKatalog: 7.62,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F511N',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 9,52 €",
  },
  // Fruit of the Loom · Premium Polo Lady-Fit
  'fotl-ladies-premium-polo': {
    stufe: 'bekannt',
    preis: 7.8,
    preisImKatalog: 7.8,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F520',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Fruit of the Loom · Pure Cotton T
  'fotl-pure-cotton-t': {
    stufe: 'bekannt',
    preis: 3.91,
    preisImKatalog: 3.4,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F362',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 5,19 €",
  },
  // Fruit of the Loom · Super Premium T
  'fotl-super-premium-t': {
    stufe: 'bekannt',
    preis: 4.28,
    preisImKatalog: 5.4,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F181',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "4XL/5XL 5,58 €",
  },
  // Fruit of the Loom · Valueweight T
  'fotl-valueweight-t': {
    stufe: 'bekannt',
    preis: 3.24,
    preisImKatalog: 2.5,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F140',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 4,48 €",
  },
  // Fruit of the Loom · Valueweight V-Neck T
  'fotl-valueweight-vneck': {
    stufe: 'bekannt',
    preis: 4.09,
    preisImKatalog: 2.6,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'F270',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 5,38 €",
  },
  // Gildan · Heavy Blend Full-Zip Hoodie
  'gildan-zip-hoodie': {
    stufe: 'bekannt',
    preis: 22.04,
    preisImKatalog: 22.98,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G18600',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "Shop-Nr. weicht von GN960 (needen) ab",
  },
  // Gildan · Heavy Cotton Ladies T-Shirt
  'gildan-ladies-heavy-t': {
    stufe: 'bekannt',
    preis: 3.74,
    preisImKatalog: 3.29,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G5000L',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 4,71 €; Shop-Nr. weicht von GN182 (needen) ab",
  },
  // Gildan · Heavy Cotton T-Shirt
  'gildan-heavy-t': {
    stufe: 'bekannt',
    preis: 3.74,
    preisImKatalog: 2.97,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G5000',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 5,28 €",
  },
  // Gildan · Softstyle Double Piqué Polo
  'gildan-softstyle-polo': {
    stufe: 'bekannt',
    preis: 7.4,
    preisImKatalog: 6.25,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G64800',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL/4XL 10,49 €",
  },
  // Gildan · Softstyle Ladies Double Piqué Polo
  'gildan-ladies-polo': {
    stufe: 'bekannt',
    preis: 7.4,
    preisImKatalog: 6.25,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G64800L',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Gildan · Softstyle Ladies T-Shirt
  'gildan-ladies-t': {
    stufe: 'bekannt',
    preis: 3.51,
    preisImKatalog: 2.69,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G64000L',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Gildan · Softstyle Ladies V-Neck T-Shirt
  'gildan-ladies-vneck-t': {
    stufe: 'bekannt',
    preis: 4.88,
    preisImKatalog: 3.99,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G64V00L',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "Shop-Nr. weicht von GN647 (needen) ab",
  },
  // Gildan · Softstyle V-Neck T-Shirt
  'gildan-vneck-t': {
    stufe: 'bekannt',
    preis: 4.78,
    preisImKatalog: 3.76,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'G64V00',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 6,33 €",
  },
  // James+Nicholson · Men's Active-T
  'jn-active-t': {
    stufe: 'bekannt',
    preis: 6.18,
    preisImKatalog: 6.18,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JN358',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // James+Nicholson · Workwear Half Zip Sweat
  'jn-halfzip-sweat': {
    stufe: 'bekannt',
    preis: 29.78,
    preisImKatalog: 29.78,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JN831',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "4XL-6XL 32,58 €",
  },
  // Just Hoods · 1/4 Zip Sweat
  'justhoods-quarterzip-sweat': {
    stufe: 'bekannt',
    preis: 17.5,
    preisImKatalog: 17.5,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JH046',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "im Shop \"Sophomore 1/4 Zip Sweat\"",
  },
  // Just Hoods · AWDis Sweat
  'justhoods-awdis-sweat': {
    stufe: 'bekannt',
    preis: 11.51,
    preisImKatalog: 10.74,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JH030',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Just Hoods · College Hoodie
  'justhoods-college-hoodie': {
    stufe: 'bekannt',
    preis: 14.68,
    preisImKatalog: 14.4,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JH001',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 17,23 €",
  },
  // Just Hoods · Kontrast-Hoodie
  'justhoods-contrast-hoodie': {
    stufe: 'bekannt',
    preis: 16.5,
    preisImKatalog: 16.5,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JH003',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "im Shop \"Varsity Hoodie\"",
  },
  // Just Hoods · Zoodie
  'justhoods-zoodie': {
    stufe: 'bekannt',
    preis: 18.95,
    preisImKatalog: 18.95,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'JH050',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Neutral · Men's Classic Polo
  'neutral-classic-polo': {
    stufe: 'bekannt',
    preis: 19.69,
    preisImKatalog: 19.69,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'NE20080',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "4XL/5XL 23,65 €",
  },
  // Neutral · Men's Roll Up Sleeve T-Shirt
  'neutral-rollsleeve-t': {
    stufe: 'bekannt',
    preis: 9.92,
    preisImKatalog: 9.92,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'NE60012',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Russell · Authentic Tee Pure Organic
  'russell-authentic-t': {
    stufe: 'bekannt',
    preis: 5.48,
    preisImKatalog: 5.48,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'Z108M',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Russell · Ladies Authentic Tee Pure Organic
  'russell-ladies-authentic-t': {
    stufe: 'bekannt',
    preis: 5.48,
    preisImKatalog: 5.48,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'Z108F',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
  // Russell · Workwear T-Shirt
  'russell-workwear-t': {
    stufe: 'bekannt',
    preis: 9.77,
    preisImKatalog: 9.77,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'Z010',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL/4XL 11,71 €",
  },
  // SOL'S · Fleecejacket North
  'sols-north-fleece': {
    stufe: 'bekannt',
    preis: 15.06,
    preisImKatalog: 15.06,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'L742',
    quelle: 'textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)',
    stand: '2026-07-22',
    notiz: '3XL 18,37 € · 4XL/5XL 22,26 €. Der Katalogwert stimmte bereits exakt – er war nur nie belegt.',
  },
  // SOL'S · Imperial T-Shirt
  'sols-imperial-t': {
    stufe: 'bekannt',
    preis: 3.86,
    preisImKatalog: 3.09,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'L190',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
    notiz: "3XL 4,73 €",
  },
  // Stedman · Classic-T Fitted
  'stedman-slimfit-t': {
    stufe: 'bekannt',
    preis: 3.92,
    preisImKatalog: 3.22,
    lieferant: 'textil-grosshandel',
    artikelnummer: 'S2010',
    quelle: "textil-grosshandel.eu – Produktseite, Stückpreis Standardgrößen (netto, ausgewiesen als zzgl. Umsatzsteuer)",
    stand: '2026-07-21',
  },
};

/** Nachweis zu einem Produkt, oder undefined wenn keiner gepflegt ist. */
export function einkaufspreisNachweis(produktId: string): EinkaufspreisNachweis | undefined {
  return EINKAUFSPREIS_NACHWEISE[produktId];
}

/**
 * Taugt der Einkaufspreis als Grundlage der Verkaufskalkulation?
 *
 * Nur `verifiziert` und `bekannt`. Ein FEHLENDER Nachweis zählt wie
 * `platzhalter` – ein neu aufgenommenes Produkt ohne Eintrag darf nicht
 * stillschweigend als belastbar durchgehen.
 */
export function taugtZurKalkulation(produktId: string): boolean {
  const stufe = EINKAUFSPREIS_NACHWEISE[produktId]?.stufe;
  return stufe === 'verifiziert' || stufe === 'bekannt';
}

/** true, solange der Preis nicht gegen eine aktuelle Quelle geprüft ist. */
export function istEinkaufspreisUngeprueft(produktId: string): boolean {
  return EINKAUFSPREIS_NACHWEISE[produktId]?.stufe !== 'verifiziert';
}

/**
 * Weicht der Wert, mit dem gerechnet wird, vom bekannten Preis ab?
 * Toleranz ein halber Cent gegen Rundungsartefakte.
 */
export function weichtVomKatalogAb(produktId: string): boolean {
  const n = EINKAUFSPREIS_NACHWEISE[produktId];
  return Boolean(n) && Math.abs(n!.preis - n!.preisImKatalog) > 0.005;
}
