/**
 * Stickerei ist vorübergehend abgeschaltet (Wunsch des Betreibers 2026-11-11, Wartungs- und Umbauarbeiten).
 *
 * Der Schalter liegt an EINER Stelle: BETRIEBSSCHALTER in config/bestellweg.ts. Diese Tests halten fest, was „pausiert“
 * bedeutet – im Server (nichts wird angenommen, weder Bestellung noch Anfrage), im gespeicherten Konfigurator-Stand
 * (fällt auf DTF zurück) und in der Oberfläche (Kachel ausgegraut mit Hinweis, Warenkorb gesperrt) – und dass sich
 * DTF dabei nicht ändert. Wird Stickerei wieder eingeschaltet (Liste leeren), gilt wieder „Stickerei nur auf Anfrage“;
 * auch das ist unten abgesichert.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import {
  BETRIEBSSCHALTER,
  MELDUNG_STICKEREI_PAUSIERT,
  erlaubteVeredelung,
  veredelungVerfuegbar,
} from '../bestellweg';
import { validateSubmission } from '@/lib/orders/orderValidation';
import { PRODUCTS } from '@/config/products';
import { translations } from '@/lib/i18n/translations';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import type { CartItem } from '@/types';

const ORIGINAL = [...BETRIEBSSCHALTER.pausierteVeredelungen];
beforeEach(() => {
  BETRIEBSSCHALTER.pausierteVeredelungen = [...ORIGINAL];
});
afterEach(() => {
  BETRIEBSSCHALTER.pausierteVeredelungen = [...ORIGINAL];
});

const produkt = PRODUCTS.find((p) => p.views?.includes('front')) ?? PRODUCTS[0]!;
function position(printMethod: 'dtf' | 'embroidery', id = 'pos-1'): CartItem {
  return {
    id,
    productId: produkt.id,
    colorId: produkt.colors[0]!.id,
    printMethod,
    sizeQuantities: { [produkt.sizes[0]!]: 3 },
    quantity: 3,
    elements: [
      {
        id: `el-${id}`, type: 'logo', view: 'front', xCm: 5, yCm: 5, widthCm: 10, heightCm: 10, rotationDeg: 0,
        isOutOfBounds: false, extraPrice: 0, estimatedStitches: 6400, fileUrl: 'data:image/png;base64,x',
        originalFileUrl: 'data:image/png;base64,x', fileName: 'logo.png',
      },
    ],
    unitPrice: 0,
    totalPrice: 0,
    addedAt: 0,
  } as unknown as CartItem;
}
const bestellung = {
  orderType: 'order' as const,
  email: 'kundin@example.de',
  customerName: 'Alex Beispiel',
  shipping: { street: 'Musterweg 1', zip: '12345', city: 'Musterstadt', country: 'Deutschland' },
  acceptedTerms: true,
};
const anfrage = { orderType: 'inquiry' as const, email: 'kundin@example.de', customerName: 'Alex Beispiel' };

// ── Schalter ────────────────────────────────────────────────────────────

test('Ausgeliefert ist Stickerei pausiert, DTF nicht', () => {
  assert.deepEqual(ORIGINAL, ['embroidery']);
  assert.equal(veredelungVerfuegbar('embroidery'), false);
  assert.equal(veredelungVerfuegbar('dtf'), true);
});

test('Eine pausierte Veredelungsart fällt auf DTF zurück, eine verfügbare bleibt', () => {
  assert.equal(erlaubteVeredelung('embroidery'), 'dtf');
  assert.equal(erlaubteVeredelung('dtf'), 'dtf');
  BETRIEBSSCHALTER.pausierteVeredelungen = [];
  assert.equal(erlaubteVeredelung('embroidery'), 'embroidery');
});

test('Programmcode ändert den Schalter nie – nur Tests dürfen ihn umlegen', () => {
  const befunde: string[] = [];
  const durchsuche = (ordner: string) => {
    for (const name of readdirSync(ordner)) {
      const pfad = path.join(ordner, name);
      if (statSync(pfad).isDirectory()) {
        if (name === 'node_modules' || name === '__tests__') continue;
        durchsuche(pfad);
      } else if (/\.(ts|tsx)$/.test(name) && !/\.test\.ts$/.test(name)) {
        if (/BETRIEBSSCHALTER\.pausierteVeredelungen\s*=[^=]/.test(readFileSync(pfad, 'utf8'))) befunde.push(pfad);
      }
    }
  };
  durchsuche(path.join(process.cwd(), 'src'));
  assert.deepEqual(befunde, []);
});

// ── Server ──────────────────────────────────────────────────────────────

test('Eine Stickerei-ANFRAGE wird nicht angenommen – mit der Meldung zur Wartung', async () => {
  const r = await validateSubmission({ ...anfrage, items: [position('embroidery')] });
  assert.equal(r.valid, false);
  assert.deepEqual(r.issues.map((i) => i.code), ['veredelung_pausiert']);
  assert.equal(r.customerMessage, MELDUNG_STICKEREI_PAUSIERT);
  assert.match(r.customerMessage!, /Wartungs- und Umbauarbeiten/);
});

test('Eine Stickerei-BESTELLUNG wird nicht angenommen – genau EIN Befund, kein zweiter „nur auf Anfrage“', async () => {
  const r = await validateSubmission({ ...bestellung, items: [position('embroidery')] });
  assert.equal(r.valid, false);
  assert.deepEqual(r.issues.map((i) => i.code), ['veredelung_pausiert']);
});

test('Ein gemischter Warenkorb nennt die bestickte Position; DTF allein bleibt unverändert gültig', async () => {
  const gemischt = await validateSubmission({ ...bestellung, items: [position('dtf', 'druck'), position('embroidery', 'stick')] });
  assert.equal(gemischt.valid, false);
  assert.equal(gemischt.issues.find((i) => i.code === 'veredelung_pausiert')?.itemId, 'stick');
  assert.equal((await validateSubmission({ ...bestellung, items: [position('dtf')] })).valid, true, 'DTF-Bestellung unverändert');
  assert.equal((await validateSubmission({ ...anfrage, items: [position('dtf')] })).valid, true, 'DTF-Anfrage unverändert');
});

test('Wird Stickerei wieder eingeschaltet, gilt wieder „nur auf Anfrage“: Anfrage ja, Bestellung nein', async () => {
  BETRIEBSSCHALTER.pausierteVeredelungen = [];
  assert.equal((await validateSubmission({ ...anfrage, items: [position('embroidery')] })).valid, true);
  const r = await validateSubmission({ ...bestellung, items: [position('embroidery')] });
  assert.deepEqual(r.issues.map((i) => i.code), ['nur_auf_anfrage']);
});

// ── Gespeicherter Konfigurator-Stand ────────────────────────────────────

test('Der Konfigurator wählt bei Pause keine Stickerei – weder per Klick noch aus einem gespeicherten Stand', () => {
  useConfiguratorStore.getState().setPrintMethod('embroidery');
  assert.equal(useConfiguratorStore.getState().printMethod, 'dtf');

  const merge = useConfiguratorStore.persist.getOptions().merge!;
  const aktuell = useConfiguratorStore.getState();
  const wiederhergestellt = merge({ printMethod: 'embroidery', productId: produkt.id }, aktuell) as { printMethod: string; productId: string };
  assert.equal(wiederhergestellt.printMethod, 'dtf', 'ein vor der Pause gespeicherter Stickerei-Stand landet bei DTF');
  assert.equal(wiederhergestellt.productId, produkt.id, 'der Rest des gespeicherten Standes bleibt erhalten');

  useConfiguratorStore.getState().loadCartItemForEditing(position('embroidery') as never);
  assert.equal(useConfiguratorStore.getState().printMethod, 'dtf', 'auch beim Bearbeiten einer alten Warenkorbposition');

  BETRIEBSSCHALTER.pausierteVeredelungen = [];
  useConfiguratorStore.getState().setPrintMethod('embroidery');
  assert.equal(useConfiguratorStore.getState().printMethod, 'embroidery', 'nach dem Wiedereinschalten wieder wählbar');
  useConfiguratorStore.getState().setPrintMethod('dtf');
});

// ── Oberfläche ──────────────────────────────────────────────────────────

test('Kachel: ausgegraut (leicht durchsichtig), nicht klickbar, Hinweis darunter nicht ausgegraut', () => {
  const q = readFileSync(path.join(process.cwd(), 'src/components/configurator/MethodSwitcher.tsx'), 'utf8');
  assert.match(q, /veredelungVerfuegbar\(method\.id\)/);
  const start = q.indexOf('if (!veredelungVerfuegbar(method.id))');
  const block = q.slice(start, q.indexOf('return (', q.indexOf('</div>', start)));
  assert.match(block, /\bdisabled\b/, 'die Kachel ist ein deaktivierter Knopf');
  assert.match(block, /opacity-50/, 'leicht durchsichtig');
  assert.match(block, /cursor-not-allowed/);
  assert.match(block, /aria-describedby=\{hinweisId\}/, 'Screenreader hören den Grund');
  assert.match(block, /t\('method_embroidery_paused'\)/);
  // Der Hinweis steht AUSSERHALB des Knopfes und trägt kein opacity-Klasse (bleibt lesbar).
  const hinweisZeile = q.split('\n').find((z) => z.includes('id={hinweisId}'))!;
  assert.doesNotMatch(hinweisZeile, /opacity/);
});

test('Warenkorb: Positionen mit pausierter Veredelung sperren Bestellen und Anfragen und tragen einen Hinweis', () => {
  const q = readFileSync(path.join(process.cwd(), 'src/components/layout/CartDrawer.tsx'), 'utf8');
  assert.match(q, /const pausierteVorhanden = items\.some\(\(item\) => !veredelungVerfuegbar\(item\.printMethod\)\)/);
  assert.match(q, /disabled=\{pausierteVorhanden\}/);
  assert.match(q, /t\('cart_embroidery_paused'\)/);
  assert.match(q, /t\('cart_item_paused'\)/);
});

test('Die Hinweistexte stehen auf Deutsch und Englisch und nennen den Grund', () => {
  for (const sprache of ['de', 'en'] as const) {
    for (const schluessel of ['method_embroidery_paused', 'cart_embroidery_paused', 'cart_item_paused'] as const) {
      assert.ok(translations[sprache][schluessel].length > 10, `${sprache}.${schluessel}`);
    }
  }
  assert.match(translations.de.method_embroidery_paused, /Wartungs- und Umbauarbeiten/);
  assert.match(translations.de.cart_embroidery_paused, /DTF-Transferdruck können Sie weiterhin bestellen/);
  assert.match(translations.en.method_embroidery_paused, /maintenance and renovation work/);
});
