/**
 * Veredelungsverfahren (Startseite und Produktseite): Solange die Stickerei pausiert ist (Betreiberschalter in
 * config/bestellweg.ts), darf die Karte keine zwei gleichwertigen Verfahren versprechen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BETRIEBSSCHALTER } from '@/config/bestellweg';
import { HINWEIS_STICKEREI_PAUSIERT, KARTE_STICKEREI_PAUSIERT } from '@/config/seo/kategorieSeiten';
import { Veredelungsverfahren } from '../Veredelungsverfahren';

function mitSchalter<T>(pausiert: string[], fn: () => T): T {
  const vorher = [...BETRIEBSSCHALTER.pausierteVeredelungen];
  try {
    BETRIEBSSCHALTER.pausierteVeredelungen = pausiert as never;
    return fn();
  } finally {
    BETRIEBSSCHALTER.pausierteVeredelungen = vorher as never;
  }
}
const rendere = () => renderToStaticMarkup(createElement(Veredelungsverfahren));
/** HTML-Entitäten wie im sichtbaren Text, damit der Satz mit „–“ und „&“ vergleichbar ist. */
const sichtbar = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');

test('Stickerei pausiert: Hinweis, Karte „Derzeit nicht verfügbar“, DTF-Karte unverändert', () => {
  const html = mitSchalter(['embroidery'], rendere);
  assert.ok(sichtbar(html).includes(HINWEIS_STICKEREI_PAUSIERT), 'Hinweis fehlt');
  assert.ok(html.includes(KARTE_STICKEREI_PAUSIERT), 'Kartenlabel fehlt');
  assert.match(html, /DTF-Transferdruck/);
  // Abgeblendet wird nur das Symbol, nicht die ganze Karte: Eine durchscheinende Karte (opacity-70) drückte den Text unter das Kontrastverhältnis
  // 4,5 : 1 (Lighthouse 2026-11-24, 3,1 : 1) – gerade der Hinweis „Derzeit nicht verfügbar“ muss lesbar sein.
  assert.match(html, /bg-brand\/50/, 'das Symbol der Stickerei-Karte ist abgeblendet');
  assert.ok(!html.includes('opacity-70'), 'die Karte selbst ist nicht durchscheinend (Lesbarkeit)');
});

test('Stickerei verfügbar (Schalter leer): wie bisher, ohne Hinweis und ohne Label', () => {
  const html = mitSchalter([], rendere);
  assert.ok(!sichtbar(html).includes(HINWEIS_STICKEREI_PAUSIERT));
  assert.ok(!html.includes(KARTE_STICKEREI_PAUSIERT));
  assert.ok(!html.includes('opacity-70') && !html.includes('bg-brand/50'));
  assert.match(html, /Stickerei/);
});

test('Produktseite, Shop und Startseite lesen den Betreiberschalter für ihre Stickerei-Texte', () => {
  const produkt = readFileSync('src/app/produkt/[slug]/page.tsx', 'utf8');
  assert.match(produkt, /const stickereiVerfuegbar = veredelungVerfuegbar\('embroidery'\)/);
  assert.match(produkt, /'Veredelung per DTF-Transferdruck\.'/);
  const shop = readFileSync('src/app/produkt/page.tsx', 'utf8');
  assert.match(shop, /'Veredelt per DTF-Transferdruck · ohne Mindestbestellmenge'/);
  const start = readFileSync('src/app/page.tsx', 'utf8');
  // Startseite (Redesign 2026-11): Die Vorteilsleiste nennt kein Verfahren mehr; die Beschreibung der Seite liest den Schalter weiter.
  assert.match(start, /veredelungVerfuegbar\('embroidery'\)\s*\? 'Hochwertige Stickerei und DTF-Transferdruck/);
  assert.match(start, /: 'DTF-Transferdruck für Unternehmen, Vereine und Marken/);
  // Die übrigen Stickerei-Stellen der Startseite und die Fußzeile lesen den Schalter ebenfalls (Review 2026-11-24).
  assert.match(start, /veredelungVerfuegbar\('embroidery'\) \? 'Zwei Wege zu deinem Motiv\.'/, 'Abschnittsüberschrift');
  assert.match(start, /veredelungVerfuegbar\('embroidery'\)\s*\? 'Baue dein eigenes Label auf: dein Logo, gestickt oder gedruckt/, 'Marken-Karte');
  const fusszeile = readFileSync('src/components/layout/FooterText.tsx', 'utf8');
  assert.match(fusszeile, /veredelungVerfuegbar\('embroidery'\) \? 'footer_description' : 'footer_description_dtf'/, 'Fußzeilen-Beschreibung');
  assert.match(fusszeile, /veredelungVerfuegbar\('embroidery'\) \? 'footer_bottom_tagline' : 'footer_bottom_tagline_dtf'/, 'Fußzeilen-Zeile');
  const layout = readFileSync('src/app/layout.tsx', 'utf8');
  assert.match(layout, /default: STICKEREI_AN/, 'Standardtitel liest den Schalter');
});

test('Kategorie-Reiter scrollt den aktiven Reiter in die Mitte der Reihe (nicht die Seite)', () => {
  const quelle = readFileSync('src/components/shop/KategorieReiter.tsx', 'utf8');
  assert.match(quelle, /nav\.scrollTo\(\{ left:/);
  assert.match(quelle, /querySelector<HTMLElement>\('\[aria-current="page"\]'\)/);
  assert.ok(!/scrollIntoView/.test(quelle), 'scrollIntoView könnte die ganze Seite verschieben');
});

test('Kauf-Leiste zeigt den Mengen-Tipp vor den anderen Staffel-Hinweisen', () => {
  const quelle = readFileSync('src/components/configurator/SummaryPanel.tsx', 'utf8');
  const tipp = quelle.indexOf('data-testid="mengen-tipp"');
  const naechste = quelle.indexOf('Noch {nextDtfTier.minQuantity - quantity} Stück bis');
  assert.ok(tipp > 0 && naechste > tipp, 'Tipp muss vor dem „Noch X Stück bis …“-Hinweis stehen');
  assert.match(quelle, /quantity > 0 && mengenTipp/);
  const konfigurator = readFileSync('src/components/configurator/ConfiguratorPrototype.tsx', 'utf8');
  assert.match(konfigurator, /printMethod === 'embroidery' \|\| pricingRules\.length === 0\s*\n\s*\? null/);
});
