/**
 * Absicherung der Verbesserungen aus dem Stichprobentest vom 2026-11-10 (Seitentest der Live-Seite).
 *
 * Das sind Prüfungen am Quelltext: Sie halten fest, WAS entschieden wurde, damit eine spätere Änderung es nicht
 * unbemerkt rückgängig macht. Das Verhalten selbst (Berechnungen) ist in den jeweiligen Fachtests geprüft:
 * lib/canvas/__tests__/textfarbe.test.ts, logoQualitaet.test.ts.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { translations } from '@/lib/i18n/translations';

function quelltext(...teile: string[]): string {
  return readFileSync(path.join(process.cwd(), ...teile), 'utf8').replace(/\r\n/g, '\n');
}

function alleQuelldateien(ordner: string, treffer: string[] = []): string[] {
  for (const eintrag of readdirSync(ordner, { withFileTypes: true })) {
    const pfad = path.join(ordner, eintrag.name);
    if (eintrag.isDirectory()) {
      if (eintrag.name !== '__tests__') alleQuelldateien(pfad, treffer);
    } else if (/\.tsx$/.test(eintrag.name)) {
      treffer.push(pfad);
    }
  }
  return treffer;
}

// ── Kontrast ─────────────────────────────────────────────────────────────

test('Kontrast: Keine hellen Text-Deckkräfte (text-brand/30 … /60) mehr, außer bei bewusst gedimmten, nicht wählbaren Optionen', () => {
  const verstoesse: string[] = [];
  for (const datei of alleQuelldateien(path.join(process.cwd(), 'src'))) {
    quelltext(path.relative(process.cwd(), datei))
      .split('\n')
      .forEach((zeile, i) => {
        if (/(^|[\s"'`{])text-brand\/(30|35|40|45|50|55|60)\b/.test(zeile) && !/cursor-not-allowed/.test(zeile)) {
          verstoesse.push(`${path.relative(process.cwd(), datei)}:${i + 1}`);
        }
      });
  }
  assert.deepEqual(verstoesse, [], 'Textfarben unter 70 % Deckkraft erreichen 4,5:1 nicht (siehe tailwind.config.ts)');
});

test('Kontrast: Weiße Schrift steht auf bg-gold-btn (5,0:1), nicht auf dem helleren bg-gold (3,4:1)', () => {
  const verstoesse: string[] = [];
  for (const datei of alleQuelldateien(path.join(process.cwd(), 'src'))) {
    quelltext(path.relative(process.cwd(), datei))
      .split('\n')
      .forEach((zeile, i) => {
        if (/text-white/.test(zeile) && /(^|[\s"'`{])bg-gold([\s"'`}]|$)/.test(zeile)) verstoesse.push(`${path.relative(process.cwd(), datei)}:${i + 1}`);
      });
  }
  assert.deepEqual(verstoesse, []);
});

test('Kontrast: Die Goldtöne in der Konfiguration sind die geprüften Werte', () => {
  const konfig = quelltext('tailwind.config.ts');
  assert.match(konfig, /DEFAULT: '#aa864e'/, 'große Goldschrift: 3,0–3,4:1');
  assert.match(konfig, /dark: '#7d6035'/, 'kleine Goldschrift: 5,2–5,8:1');
  assert.match(konfig, /btn: '#8a6a3a'/, 'Knopfhintergrund für weiße Schrift: 5,0:1');
});

// ── Handy ────────────────────────────────────────────────────────────────

test('Handy-Konfigurator: Produktliste einklappbar, Vorschau klebt oben und die Mitte zerlegt sich ab lg nicht', () => {
  const k = quelltext('src', 'components', 'configurator', 'ConfiguratorPrototype.tsx');
  assert.match(k, /aria-expanded=\{browserOffenMobil\}/);
  assert.match(k, /className=\{browserOffenMobil \? 'mt-3 lg:mt-0' : 'hidden lg:block'\}/, 'ab lg immer sichtbar');
  assert.match(k, /sticky top-\[96px\] z-20/, 'Vorschau klebt unter Kopfzeile und Schrittleiste');
  assert.match(k, /lg:static/, 'ab lg wie bisher');
  assert.match(k, /contents lg:flex lg:min-w-0 lg:flex-1/, 'Mitte ohne eigenen Kasten, damit sticky über die ganze Zeile greift');
  assert.match(k, /max-w-\[210px\] sm:max-w-\[260px\] lg:max-w-\[820px\]/, 'Vorschau am Handy klein, am Desktop unverändert groß');
  assert.match(k, /setBrowserOffenMobil\(false\);\s*\}, \[product\.id\]\)/, 'nach der Produktwahl wieder eingeklappt');
});

test('Handy-Startseite: Überschrift und Knopf stehen vor dem Bild', () => {
  const s = quelltext('src', 'app', 'page.tsx');
  assert.match(s, /<div className="relative z-10 order-1">\s*<HeroText \/>/);
  assert.match(s, /className="relative order-2 flex items-center justify-center py-6 lg:py-0"/);
});

test('Handy: Tippflächen im Footer und in der Werkzeugleiste sind höher, ab lg wie bisher kompakt', () => {
  assert.match(quelltext('src', 'components', 'layout', 'FooterText.tsx'), /const LINK_KLASSE = 'py-3 text-xs [^']*lg:py-0'/);
  assert.match(quelltext('src', 'components', 'configurator', 'CanvasToolbar.tsx'), /rounded-md p-2\.5 [^"]*lg:p-1\.5/);
});

// ── Währung ──────────────────────────────────────────────────────────────

test('Währung: Die Kasse zeigt immer Euro (abgerechnet wird in EUR) und erklärt es bei CHF-Anzeige', () => {
  const k = quelltext('src', 'components', 'layout', 'CartDrawer.tsx');
  assert.match(k, /formatPrice=\{\(amount: number\) => formatPriceWithCurrency\(amount, 'EUR'\)\}/);
  assert.match(k, /waehrungHinweis=\{currency !== 'EUR' \? t\('currency_note_checkout'\) : null\}/);
  assert.match(k, /currency !== 'EUR' && \(\s*<p className="mb-2 text-xs text-brand\/70">\{t\('currency_note_cart'/);
  const knopf = k.slice(k.indexOf("t('checkout_submit')} · "));
  assert.match(knopf.slice(0, 80), /formatPrice\(grandTotal\)/, 'der Betrag am Knopf kommt aus dem (Euro-)formatPrice der Kasse');
});

// ── Hinweise statt stummer Sperren ───────────────────────────────────────

test('Gesperrte Knöpfe sagen, was fehlt (Kasse, Anfrage, Kontaktformular)', () => {
  const warenkorb = quelltext('src', 'components', 'layout', 'CartDrawer.tsx');
  assert.equal((warenkorb.match(/t\('form_missing_hint', \{ fields: fehlendeAngaben\.join\(', '\) \}\)/g) ?? []).length, 2, 'Kasse und Anfrage');
  assert.match(warenkorb, /!acceptedTerms && t\('checkout_missing_terms'\)/);
  const kontakt = quelltext('src', 'components', 'contact', 'ContactForm.tsx');
  assert.match(kontakt, /t\('form_missing_hint', \{ fields: fehlendeAngaben\.join\(', '\) \}\)/);
  for (const sprache of ['de', 'en'] as const) {
    for (const schluessel of ['form_missing_hint', 'checkout_missing_terms', 'currency_note_cart', 'currency_note_checkout', 'cart_item_removed', 'cart_undo', 'browser_mobile_toggle', 'element_text_low_contrast'] as const) {
      assert.ok(translations[sprache][schluessel], `${schluessel} fehlt in ${sprache}`);
    }
  }
  assert.match(translations.de.form_missing_hint, /\{fields\}/);
});

// ── Warenkorb ────────────────────────────────────────────────────────────

test('Warenkorb: Entfernen lässt sich acht Sekunden lang rückgängig machen, und die Position zeigt ihre Motive', () => {
  const k = quelltext('src', 'components', 'layout', 'CartDrawer.tsx');
  assert.match(k, /onClick=\{\(\) => entfernePosition\(item\)\}/);
  assert.match(k, /window\.setTimeout\(\(\) => setEntfernt\(null\), 8000\)/);
  assert.match(k, /neu\.splice\(Math\.min\(entfernt\.index, neu\.length\), 0, entfernt\.item\)/, 'an die alte Stelle zurück');
  assert.match(k, /<MotivVorschau elements=\{item\.elements\} \/>/);
  assert.match(k, /aria-label=\{step === 'checkout' \? t\('cart_checkout_title'\) : t\('cart_title'\)\}/);
});

// ── Konfigurator-Details ─────────────────────────────────────────────────

test('Konfigurator: Standardtextfarbe nach Textil, Hinweis bei kaum sichtbarem Text, dauerhafte Logo-Warnung', () => {
  assert.match(quelltext('src', 'components', 'configurator', 'TextToolPanel.tsx'), /color: standardTextfarbe\(textilHex\)/);
  assert.match(quelltext('src', 'components', 'configurator', 'TemplateToolPanel.tsx'), /color: standardTextfarbe\(textilHex\)/);
  const leiste = quelltext('src', 'components', 'configurator', 'ElementToolbar.tsx');
  assert.match(leiste, /textKaumSichtbar\(\(selected as TextElement\)\.color, textilHex\)/);
  assert.match(leiste, /printMethod === 'dtf' && \(\s*<LogoQualitaetHinweis/, 'nur für DTF');
});

test('Beschriftungen: Textfeld, Produktsuche und Hauptnavigation haben einen Namen für Screenreader', () => {
  assert.match(quelltext('src', 'components', 'configurator', 'TextToolPanel.tsx'), /aria-label=\{t\('text_tool_placeholder'\)\}/);
  assert.match(quelltext('src', 'components', 'configurator', 'ProduktBrowser.tsx'), /aria-label="Suche nach Produkten, Marken…"/);
  assert.match(quelltext('src', 'components', 'layout', 'SiteHeader.tsx'), /<nav aria-label="Hauptnavigation" className="hidden/);
  const fuss = quelltext('src', 'components', 'layout', 'FooterText.tsx');
  assert.equal((fuss.match(/<nav aria-label=/g) ?? []).length, 2, 'beide Fußnavigationen benannt');
});

// ── Produktübersicht, Konto ──────────────────────────────────────────────

test('Produktübersicht zeigt die Trefferzahl; Konto-Passwortfelder lassen sich einblenden', () => {
  assert.match(quelltext('src', 'app', 'produkt', 'page.tsx'), /gesamt=\{ergebnis\.gesamt\}/);
  assert.match(quelltext('src', 'components', 'shop', 'Ergebniskopf.tsx'), /\{gesamt\} \{gesamt === 1 \? 'Produkt' : 'Produkte'\}/);
  const feld = quelltext('src', 'components', 'konto', 'KontoFeld.tsx');
  assert.match(feld, /aria-label=\{klartext \? 'Passwort verbergen' : 'Passwort anzeigen'\}/);
  assert.match(feld, /type=\{istPasswort && klartext \? 'text' : type\}/);
});
