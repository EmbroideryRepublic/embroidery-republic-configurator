/**
 * Regressionstest zu einem real aufgetretenen Produktionsfehler.
 *
 * Symptom: Bestellungen mit EINER Größe scheiterten bei textil-grosshandel
 * reproduzierbar, Bestellungen mit mehreren Größen liefen durch. Ursache war
 * NICHT die Anzahl der Größen, sondern dass `page.fill()` den Feldwert setzt,
 * ohne Tastatur-Ereignisse auszulösen – der Shop schaltet „In den Warenkorb"
 * aber genau darauf frei. Bei mehreren Größen kaschierte die Folgeinteraktion
 * das Problem.
 *
 * Der Test hält deshalb fest, dass nach dem Befüllen eines Mengenfeldes ein
 * echter Tastendruck folgt. Fällt der weg, ist der Produktionsfehler zurück.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSizeQuantity } from '../selectionEngine';
import type { ControlSelectionPlan } from '../selectionEngine';
import type { AutomationPage } from '../../types';
import type { SupplierVariant } from '../../mapping/types';

const SIZE_PLAN: ControlSelectionPlan = {
  control: 'Größe',
  targets: {
    label: {
      kind: 'fill',
      template: 'tr:has(td.cell-size:text-is("{value}")) td.cell-amount input[name$="[am]"]',
    },
  },
};

const SIZE_L: SupplierVariant = { label: 'L', verified: true };

/** Minimale Seite, die nur mitschreibt, was aufgerufen wurde. */
function createRecordingPage(): { page: AutomationPage; calls: string[] } {
  const calls: string[] = [];
  const page = {
    goto: async () => undefined,
    click: async () => undefined,
    fill: async (selector: string, value: string) => {
      calls.push(`fill(${selector}, ${value})`);
    },
    check: async () => undefined,
    selectOption: async () => undefined,
    waitForSelector: async () => undefined,
    press: async (selector: string, key: string) => {
      calls.push(`press(${selector}, ${key})`);
    },
  } satisfies AutomationPage;
  return { page, calls };
}

test('setSizeQuantity bestätigt die Menge mit einem echten Tastendruck', async () => {
  const { page, calls } = createRecordingPage();

  await setSizeQuantity(page, SIZE_L, SIZE_PLAN, 5, () => {});

  assert.equal(calls.length, 2, 'erwartet genau fill + press');
  assert.match(calls[0]!, /^fill\(/);
  assert.match(calls[0]!, /= *5$|, 5\)$/);
  assert.match(calls[1]!, /^press\(/, 'nach dem Befüllen MUSS ein echter Tastendruck folgen');
  assert.match(calls[1]!, /End\)$/, 'der Tastendruck muss wertneutral sein (End)');

  const fillSelector = calls[0]!.slice('fill('.length).split(', ')[0];
  const pressSelector = calls[1]!.slice('press('.length).split(', ')[0];
  assert.equal(pressSelector, fillSelector, 'Tastendruck muss auf demselben Feld erfolgen');
});

test('setSizeQuantity bleibt lauffähig, wenn die Seite kein press() kann', async () => {
  const { page, calls } = createRecordingPage();
  const withoutPress = { ...page, press: undefined } as AutomationPage;

  // Test-Fakes ohne press() dürfen NICHT scheitern – die Bestätigung ist
  // eine Zusatzmaßnahme, kein Pflichtbestandteil der Schnittstelle.
  await setSizeQuantity(withoutPress, SIZE_L, SIZE_PLAN, 5, () => {});

  assert.equal(calls.length, 1, 'die Menge wird weiterhin gesetzt');
  assert.match(calls[0]!, /^fill\(/);
  assert.ok(!calls.some((c) => c.startsWith('press(')), 'ohne press()-Fähigkeit wird nichts gedrückt');
});
