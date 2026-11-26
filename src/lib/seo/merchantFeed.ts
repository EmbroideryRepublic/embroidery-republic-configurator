/**
 * Produktfeed für Google Merchant Center (kostenlose Shopping-Einträge) – reine Logik.
 *
 * Eine Zeile je Variante (Produkt × wählbare Farbe × Größe), weil Google bei Bekleidung für jede Größe einen eigenen
 * Eintrag mit gemeinsamer `item_group_id` verlangt. Alle Angaben stammen aus dem Katalog; es gibt keine neuen Texte:
 * Titel = Marke + Name + Farbe + Größe, Beschreibung = die vorhandene Produktbeschreibung der Seite.
 *
 * Bewusst NICHT im Feed: Versand, Steuern und Rückgabe (die stellt der Betreiber im Merchant Center ein), GTIN
 * (Lieferantenware ohne eigene Barcodes → `identifier_exists = no`), Bewertungen.
 *
 * Preis = Katalog-Ab-Preis (`basePrice`), derselbe Wert wie „ab … €" auf der Produktseite.
 */
import { createHash } from 'node:crypto';
import type { ProductConfig } from '@/config/products/types';
import { geschlechterVon } from '@/config/products/facetten';
import { bildFuerAnsicht, PLATZHALTER_BILD } from '@/lib/assets';
import { waehlbareFarben, formatiereFarbname } from '@/lib/products/farben';
import { supplierRefVon } from '@/lib/suppliers/supplierRefs';
import { ermittleVerfuegbarkeit } from '@/lib/catalog/verfuegbarkeit';

export interface FeedEintrag {
  id: string;
  gruppe: string;
  titel: string;
  beschreibung: string;
  link: string;
  bild: string;
  weitereBilder: string[];
  preis: string;
  marke: string;
  farbe: string;
  groesse: string;
  kategorie: string;
  geschlecht: 'male' | 'female' | 'unisex';
  alter: 'adult' | 'kids';
  material: string;
  mpn?: string;
}

export const MAX_ID = 50;
export const MAX_TITEL = 150;
export const MAX_BESCHREIBUNG = 5000;

const STANDARD_KATEGORIE = 'Apparel & Accessories > Clothing > Shirts & Tops';
const KATEGORIE: Record<string, string> = {
  tshirt: 'Apparel & Accessories > Clothing > Shirts & Tops',
  longsleeve: 'Apparel & Accessories > Clothing > Shirts & Tops',
  polo: 'Apparel & Accessories > Clothing > Shirts & Tops',
  hoodie: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts & Hoodies',
  'zip-hoodie': 'Apparel & Accessories > Clothing > Activewear > Sweatshirts & Hoodies',
  sweater: 'Apparel & Accessories > Clothing > Activewear > Sweatshirts & Hoodies',
  jacket: 'Apparel & Accessories > Clothing > Outerwear > Coats & Jackets',
  kids: 'Apparel & Accessories > Clothing > Shirts & Tops',
  sport: 'Apparel & Accessories > Clothing > Activewear',
};

/** Stabile, kurze ID: ändert sich nur, wenn sich Produkt, Farbe oder Größe ändern. */
export function feedId(produktId: string, farbeId: string, groesse: string): string {
  return 'er-' + createHash('sha1').update(`${produktId}|${farbeId}|${groesse}`).digest('hex').slice(0, 16);
}

function kuerze(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + '…';
}

function geschlechtVon(p: ProductConfig): FeedEintrag['geschlecht'] {
  const g = geschlechterVon(p);
  if (g.includes('damen') && !g.includes('herren') && !g.includes('unisex')) return 'female';
  if (g.includes('herren') && !g.includes('damen') && !g.includes('unisex')) return 'male';
  return 'unisex';
}

export function feedEintraege(produkt: ProductConfig, basis: string): FeedEintrag[] {
  if (ermittleVerfuegbarkeit(produkt) !== 'lieferbar') return []; // ausgelaufene/pausierte Ware nicht bewerben
  const aufBild = (pfad: string | undefined) => (pfad && pfad !== PLATZHALTER_BILD && pfad.startsWith('/products/') ? `${basis}${pfad}` : undefined);
  const mpn = supplierRefVon(produkt.id)?.articleNumber;
  const eintraege: FeedEintrag[] = [];
  for (const farbe of waehlbareFarben(produkt.id, produkt.colors)) {
    const bild = aufBild(bildFuerAnsicht(produkt.id, farbe.id, 'front'));
    if (!bild) continue; // ohne echtes Foto kein Eintrag
    const weitere = ['back', 'sleeve_left', 'sleeve_right'].map((v) => aufBild(bildFuerAnsicht(produkt.id, farbe.id, v))).filter((b): b is string => !!b);
    const farbName = formatiereFarbname(farbe.name);
    for (const groesse of produkt.sizes) {
      eintraege.push({
        id: feedId(produkt.id, farbe.id, groesse),
        gruppe: produkt.id,
        titel: kuerze(`${produkt.brand} ${produkt.name} in ${farbName}, Größe ${groesse}`, MAX_TITEL),
        beschreibung: kuerze(produkt.description, MAX_BESCHREIBUNG),
        link: `${basis}/produkt/${produkt.id}`,
        bild,
        weitereBilder: weitere,
        preis: `${produkt.basePrice.toFixed(2)} EUR`,
        marke: produkt.brand,
        farbe: farbName,
        groesse,
        kategorie: KATEGORIE[produkt.productType] ?? STANDARD_KATEGORIE,
        geschlecht: produkt.productType === 'kids' ? 'unisex' : geschlechtVon(produkt),
        alter: produkt.productType === 'kids' ? 'kids' : 'adult',
        material: produkt.material,
        ...(mpn ? { mpn } : {}),
      });
    }
  }
  return eintraege;
}

/** XML-Zeichen maskieren; Steuerzeichen, die XML verbietet, entfernen. */
export function xmlText(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const KOPF = (basis: string): string =>
  '<?xml version="1.0" encoding="UTF-8"?>' +
  '<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0"><channel>' +
  '<title>Embroidery Republic Germany</title>' +
  `<link>${xmlText(basis)}</link>` +
  '<description>Textilien individuell bedrucken lassen</description>';
const FUSS = '</channel></rss>';

function itemXml(e: FeedEintrag): string {
  return [
    '<item>',
    `<g:id>${e.id}</g:id>`,
    `<g:item_group_id>${xmlText(e.gruppe)}</g:item_group_id>`,
    `<title>${xmlText(e.titel)}</title>`,
    `<description>${xmlText(e.beschreibung)}</description>`,
    `<link>${xmlText(e.link)}</link>`,
    `<g:image_link>${xmlText(e.bild)}</g:image_link>`,
    ...e.weitereBilder.slice(0, 10).map((b) => `<g:additional_image_link>${xmlText(b)}</g:additional_image_link>`),
    '<g:availability>in_stock</g:availability>',
    `<g:price>${e.preis}</g:price>`,
    '<g:condition>new</g:condition>',
    `<g:brand>${xmlText(e.marke)}</g:brand>`,
    ...(e.mpn ? [`<g:mpn>${xmlText(e.mpn)}</g:mpn>`] : []),
    '<g:identifier_exists>no</g:identifier_exists>',
    `<g:google_product_category>${xmlText(e.kategorie)}</g:google_product_category>`,
    `<g:gender>${e.geschlecht}</g:gender>`,
    `<g:age_group>${e.alter}</g:age_group>`,
    `<g:color>${xmlText(e.farbe)}</g:color>`,
    `<g:size>${xmlText(e.groesse)}</g:size>`,
    ...(e.material ? [`<g:material>${xmlText(kuerze(e.material, 200))}</g:material>`] : []),
    '</item>',
  ].join('');
}

/**
 * Der Feed als Stück-für-Stück-Folge (Kopf, je Produkt ein Block, Fuß). Der gesamte Feed ist mit ca. 18.000 Einträgen
 * rund 25 MB groß – als Antwort in einem Stück würde er die 4,5-MB-Grenze von Vercel-Funktionen sprengen; als Stream
 * (siehe app/feeds/google-merchant.xml/route.ts) gibt es diese Grenze nicht.
 */
export function* feedStrom(produkte: readonly ProductConfig[], basis: string): Generator<string> {
  yield KOPF(basis);
  for (const p of produkte) {
    const block = feedEintraege(p, basis).map(itemXml).join('');
    if (block) yield block;
  }
  yield FUSS;
}

export function feedXml(produkte: readonly ProductConfig[], basis: string): { xml: string; anzahl: number } {
  const xml = [...feedStrom(produkte, basis)].join('');
  return { xml, anzahl: (xml.match(/<item>/g) ?? []).length };
}
