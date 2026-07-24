/**
 * ═══════════════════════════════════════════════════════════════════════
 * LIEFERANTEN-REFERENZEN JE KATALOGPRODUKT (zentrale Pflege-Datei)
 * ═══════════════════════════════════════════════════════════════════════
 * Ordnet unseren Katalog-Produkt-IDs die Bezugsquelle für die
 * Lieferanten-Automatisierung zu: Lieferant, Artikelnummer und die
 * DIREKTE Produkt-Detail-URL (der Playwright-Worker öffnet sie ohne
 * Shop-Suche).
 *
 * Bewusst EINE zentrale Map statt Einträgen in den 9 Marken-Dateien:
 *  - alle Bezugsquellen auf einen Blick prüf-/änderbar,
 *  - später 1:1 in eine DB-Tabelle (oder Admin-UI) überführbar,
 *  - die Marken-Dateien bleiben reine Produktbeschreibung.
 * Angeheftet wird die Referenz beim Registrieren in index.ts.
 *
 * urlVerified: true = URL wurde per HTTP-Check bestätigt (Status 200,
 * Stand Juli 2026). Artikelnummern stammen aus den Produktlistungen von
 * textil-grosshandel.eu (dort je Produkt neben dem Namen ausgewiesen).
 *
 * OFFEN (bewusst nicht eingetragen, keine Daten erfunden): 13 Fruit-of-the-Loom-
 * Produkte aus den ZIP-Datenblättern haben noch keinen Lieferanten-Ref. Sie
 * erscheinen automatisch im Katalog-Integrationsstatus (`npm run
 * coverage:suppliers`) unter „ohne Lieferantenzuordnung" – die stehende
 * To-do-Liste.
 *
 * Recherche-Stand (2026-07, URLs im Shop bestätigt, Artikelnummern aus dem
 * JSON-LD/Listing extrahiert – vor dem Eintragen final gegenprüfen):
 *   fotl-heavy-t              → /fruit-of-the-loom-heavy-cotton-t.html      (F182)
 *   fotl-valueweight-t        → /fruit-of-the-loom-valueweight-t.html       (F140)
 *   fotl-original-t           → /fruit-of-the-loom-original-t.html          (F110)
 *   fotl-super-premium-t      → /fruit-of-the-loom-super-premium-t.html     (F181)
 *   fotl-ladies-valueweight-t → /fruit-of-the-loom-ladies-valueweight-t.html(F288N)
 *   fotl-valueweight-vneck    → /fruit-of-the-loom-valueweight-v-neck-t.html(F270)
 * Noch nicht am Shop verifiziert: fotl-pure-cotton-t, fotl-original-longsleeve,
 * fotl-ladies-original-t, fotl-ladies-valueweight-vneck, fotl-iconic195-t,
 * fotl-iconic195-longsleeve, fotl-ladies-iconic195-t.
 *
 * ── Zwei Nummernsysteme (recherchiert 2026-07-21, öffentliche Quellen) ─
 * Jedes Produkt trägt ZWEI Artikelnummern:
 *   Herstellernummer (Fruit of the Loom):  61-036-0
 *   Händlernummer (textil-grosshandel):    F140
 * In dieser Datei stehen die HÄNDLERnummern – nur mit ihnen findet der
 * Worker das Produkt im Shop. Die Herstellernummer hilft dagegen, dasselbe
 * Produkt bei einem ANDEREN Lieferanten wiederzufinden.
 *
 * Belegte Zuordnungen (vor Nutzung gegenprüfen):
 *   Valueweight T  61-036-0 = F140   ·   Original T  61-082-0 = F110
 *   Iconic 195 T   61-422-0
 *
 * VERWECHSLUNGSFALLEN – bei eigener Recherche beachten:
 *   61-430-0 ist die „Iconic 150", NICHT die „Iconic 195" (= 61-422-0).
 *     Anderes Flächengewicht, anderer Preis, fast gleicher Name.
 *   61-038-0 ist der „Valueweight Long Sleeve", NICHT der „Original Long
 *     Sleeve". Original und Valueweight sind verschiedene Produktreihen.
 *
 * WICHTIG vor dem Eintragen: diese Modelle nutzen FOTL-spezifische Farben
 * (heather-grey, sunflower, solar-yellow, azure, heather-charcoal …), die noch
 * NICHT in der TG-Mapping-Tabelle stehen. Erst diese Farbschlüssel (mit
 * verifizierten Hex) ergänzen, dann den Ref eintragen – sonst schlägt
 * catalogConsistency.test.ts an. Ausnahme (bereits gepflegt): fotl-original-vneck
 * (F272), fotl-baseball-t (F295), fotl-baseball-longsleeve (F296).
 */
import type { SupplierProductRef } from '@/lib/suppliers/types';

const TG = 'https://www.textil-grosshandel.eu';

export const SUPPLIER_REFS: Record<string, SupplierProductRef> = {
  // ── Fruit of the Loom ────────────────────────────────────────────────
  'fotl-original-vneck': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'F272',
    productUrl: `${TG}/fruit-of-the-loom-original-v-neck-t.html`,
    urlVerified: true,
  },
  'fotl-baseball-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'F295',
    productUrl: `${TG}/fruit-of-the-loom-valueweight-shortsleeve-baseball-t.html`,
    urlVerified: true,
  },
  'fotl-baseball-longsleeve': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'F296',
    productUrl: `${TG}/fruit-of-the-loom-valueweight-long-sleeve-baseball-t.html`,
    urlVerified: true,
  },
  'fotl-premium-polo': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'F511N',
    productUrl: `${TG}/fruit-of-the-loom-premium-polo.html`,
    urlVerified: true,
  },
  'fotl-ladies-premium-polo': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'F520',
    productUrl: `${TG}/fruit-of-the-loom-premium-polo-lady-fit.html`,
    urlVerified: true,
  },

  // ── SOL'S ────────────────────────────────────────────────────────────
  'sols-imperial-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'L190',
    productUrl: `${TG}/sols-imperial-t-shirt.html`,
    urlVerified: true,
  },
  'sols-north-fleece': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'L742',
    productUrl: `${TG}/sols-fleecejacket-north.html`,
    urlVerified: true,
  },

  // ── Gildan ───────────────────────────────────────────────────────────
  'gildan-heavy-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'G5000',
    productUrl: `${TG}/gildan-heavy-cotton-adult-t-shirt.html`,
    urlVerified: true,
  },
  'gildan-softstyle-polo': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'G64800',
    productUrl: `${TG}/gildan-softstyle-double-pique-polo.html`,
    urlVerified: true,
  },
  'gildan-vneck-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'G64V00',
    productUrl: `${TG}/gildan-softstyle-v-neck-t-shirt.html`,
    urlVerified: true,
  },
  'gildan-ladies-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'G64000L',
    productUrl: `${TG}/gildan-softstyle-ladies-t-shirt.html`,
    urlVerified: true,
  },
  // Erste Nicht-TG-Bezugsquelle: textil-grosshandel.eu führt das
  // Heavy-Cotton-Damenmodell nicht, needen.de (ebenfalls in der
  // Supplier-Engine angebunden) schon – EU-Artikelnummer GN182.
  'gildan-ladies-heavy-t': {
    supplierId: 'needen',
    articleNumber: 'GN182',
    productUrl: 'https://www.needen.de/gildan-gn182-t-shirt-mit-rundhalsausschnitt-180-fur-damen-411244',
    urlVerified: true,
  },
  'gildan-ladies-vneck-t': {
    supplierId: 'needen',
    articleNumber: 'GN647',
    productUrl: 'https://www.needen.de/gildan-gn647-damen-t-shirt-mit-v-ausschnitt-53901',
    urlVerified: true,
  },
  'gildan-ladies-polo': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'G64800L',
    productUrl: `${TG}/gildan-softstyle-ladies-double-pique-polo.html`,
    urlVerified: true,
  },
  'gildan-zip-hoodie': {
    supplierId: 'needen',
    articleNumber: 'GN960',
    productUrl: 'https://www.needen.de/gildan-gn960-kapuzensweatshirt-mit-durchgehendem-reissverschluss-54949',
    urlVerified: true,
  },

  // ── Russell ──────────────────────────────────────────────────────────
  'russell-authentic-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'Z108M',
    productUrl: `${TG}/russell-men-s-authentic-tee-pure-organic.html`,
    urlVerified: true,
  },
  'russell-workwear-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'Z010',
    productUrl: `${TG}/russell-workwear-t-shirt.html`,
    urlVerified: true,
  },
  'russell-ladies-authentic-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'Z108F',
    productUrl: `${TG}/russell-ladies-authentic-tee-pure-organic.html`,
    urlVerified: true,
  },

  // ── Neutral ──────────────────────────────────────────────────────────
  'neutral-classic-polo': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'NE20080',
    productUrl: `${TG}/neutral-men-s-classic-polo.html`,
    urlVerified: true,
  },
  'neutral-rollsleeve-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'NE60012',
    productUrl: `${TG}/neutral-men-s-roll-up-sleeve-t-shirt.html`,
    urlVerified: true,
  },

  // ── Just Hoods (AWDis) ───────────────────────────────────────────────
  'justhoods-college-hoodie': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JH001',
    productUrl: `${TG}/just-hoods-college-hoodie.html`,
    urlVerified: true,
  },
  'justhoods-zoodie': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JH050',
    productUrl: `${TG}/just-hoods-zoodie.html`,
    urlVerified: true,
  },
  'justhoods-awdis-sweat': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JH030',
    productUrl: `${TG}/just-hoods-awdis-sweat.html`,
    urlVerified: true,
  },
  'justhoods-contrast-hoodie': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JH003',
    productUrl: `${TG}/just-hoods-varsity-hoodie.html`,
    urlVerified: true,
  },
  'justhoods-quarterzip-sweat': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JH046',
    productUrl: `${TG}/just-hoods-sophomore-14-zip-sweat.html`,
    urlVerified: true,
  },

  // ── B&C ──────────────────────────────────────────────────────────────
  'bandc-inspire-hoodie': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'BCWU33B',
    productUrl: `${TG}/bundc-inspire-hooded-sweat.html`,
    urlVerified: true,
  },
  'bandc-inspire-zip-hood': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'BCWU35B',
    productUrl: `${TG}/bundc-inspire-zipped-hood-jacket.html`,
    urlVerified: true,
  },

  // ── Stedman ──────────────────────────────────────────────────────────
  'stedman-slimfit-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'S2010',
    productUrl: `${TG}/stedman-classic-t-fitted.html`,
    urlVerified: true,
  },

  // ── James+Nicholson ──────────────────────────────────────────────────
  'jn-active-t': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JN358',
    productUrl: `${TG}/jamesnicholson-men-s-active-t.html`,
    urlVerified: true,
  },
  'jn-halfzip-sweat': {
    supplierId: 'textil-grosshandel',
    articleNumber: 'JN831',
    productUrl: `${TG}/jamesnicholson-workwear-half-zip-sweat.html`,
    urlVerified: true,
  },
};
