/**
 * Keine falschen Leistungsversprechen: Solange die Stickerei pausiert ist (BETRIEBSSCHALTER in config/bestellweg.ts), darf
 * keine sichtbare Aussage auf FAQ, Über uns, Kontakt, im Manifest oder in der Veredelungs-Kachel des Konfigurators sie als
 * verfügbare Leistung nahelegen. Die Seiten lesen den Schalter beim Laden; der bisherige Wortlaut bleibt im Code erhalten
 * und kehrt zurück, sobald die Liste geleert wird (Quelltext-Prüfung unten).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BETRIEBSSCHALTER } from '@/config/bestellweg';
import FaqPage, { metadata as faqMeta } from '@/app/faq/page';
import AboutPage, { metadata as aboutMeta } from '@/app/ueber-uns/page';
import manifest from '@/app/manifest';
import { translate } from '@/stores/languageStore';

const VERBOTEN = /besticken|bestickt|Bestickung|Stickerei|gestickt|Stickdat|Garnfarb|Stichzahl|Digitalisierung/i;
const klartext = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/\s+/g, ' ');
const quelle = (pfad: string) => readFileSync(pfad, 'utf8');

test('Voraussetzung: Die Stickerei ist pausiert (sonst prüfen die folgenden Tests nichts)', () => {
  assert.deepEqual(BETRIEBSSCHALTER.pausierteVeredelungen, ['embroidery']);
});

test('FAQ: keine Stickerei-Aussage in Fragen, Antworten, Metadaten und JSON-LD', () => {
  const html = renderToStaticMarkup(createElement(FaqPage));
  assert.doesNotMatch(klartext(html), VERBOTEN);
  assert.doesNotMatch(html, VERBOTEN, 'auch nicht im strukturierten FAQ-Datenblock');
  assert.doesNotMatch(JSON.stringify(faqMeta), VERBOTEN);
  // Die Fragen, die ohne Stickerei sinnvoll bleiben, sind noch da.
  assert.match(klartext(html), /Für welche Motive eignet sich DTF-Transferdruck\?/);
  assert.match(klartext(html), /Es gibt keine Mindestbestellmenge/);
  assert.match(klartext(html), /Die reguläre Produktionszeit beträgt 3 bis 4 Werktage/);
});

test('Über uns: keine Stickerei-Aussage in Text, Aufzählung, Ablauf und Metadaten', () => {
  const html = renderToStaticMarkup(createElement(AboutPage));
  assert.doesNotMatch(klartext(html), VERBOTEN);
  assert.doesNotMatch(JSON.stringify(aboutMeta), VERBOTEN);
  assert.match(klartext(html), /DTF-Druck bestellst du direkt im Konfigurator\./);
});

test('Kontakt: der Hinweis „Das hilft uns weiter“ nennt ohne Stickerei keine zweite Veredelungsart (de und en)', () => {
  assert.doesNotMatch(translate('kontakt_helper_1_text_dtf', 'de'), VERBOTEN);
  assert.doesNotMatch(translate('kontakt_helper_1_text_dtf', 'en'), /embroider/i);
  const k = quelle('src/components/contact/KontaktInhalt.tsx');
  assert.match(k, /veredelungVerfuegbar\('embroidery'\) \? 'kontakt_helper_1_text' : 'kontakt_helper_1_text_dtf'/);
});

test('Manifest: Beschreibung ohne Stickerei', () => {
  assert.doesNotMatch(manifest().description ?? '', VERBOTEN);
});

test('Konfigurator: die pausierte Kachel zeigt keine Werbebeschreibung („ideal für Firmenlogos · nur auf Anfrage“)', () => {
  const q = quelle('src/components/configurator/MethodSwitcher.tsx');
  const start = q.indexOf('if (!veredelungVerfuegbar(method.id))');
  const block = q.slice(start, q.indexOf('return (', q.indexOf('</div>', start)));
  assert.ok(!block.includes('method.description'), 'die Beschreibung steht nur in der verfügbaren Kachel');
  assert.match(block, /t\('method_embroidery_paused'\)/, 'der Grund steht weiterhin darunter');
});

test('Wiederaufnahme: der bisherige Wortlaut bleibt im Code erhalten (hinter dem Schalter)', () => {
  const faq = quelle('src/app/faq/page.tsx');
  assert.match(faq, /const STICKEREI_AN = veredelungVerfuegbar\('embroidery'\)/);
  assert.match(faq, /Was ist der Unterschied zwischen DTF-Transferdruck und Stickerei\?/);
  assert.match(faq, /Stickerei gibt es ausschließlich auf Anfrage/);
  const ueber = quelle('src/app/ueber-uns/page.tsx');
  assert.match(ueber, /const STICKEREI_AN = veredelungVerfuegbar\('embroidery'\)/);
  assert.match(ueber, /Stickerei gibt es nur auf Anfrage/);
  assert.match(translate('kontakt_helper_1_text', 'de'), /Druck oder Stickerei/);
  assert.match(quelle('src/app/manifest.ts'), /DTF-Transferdruck und Stickerei, live im Konfigurator/);
});
