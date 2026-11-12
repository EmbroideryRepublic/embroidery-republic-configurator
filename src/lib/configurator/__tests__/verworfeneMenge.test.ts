/**
 * Produktwechsel im Konfigurator: Stückzahlen, die in den Größen des neuen Produkts keine Entsprechung finden, gehen nicht still
 * verloren – `verworfeneMenge` benennt sie, die Größentabelle zeigt es an.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getProduct } from '@/config/products';
import { passendeGroessen, verworfeneMenge } from '../uebernahme';
import { useGroessenHinweisStore } from '@/stores/groessenHinweisStore';

const erwachsen = getProduct('fotl-valueweight-t')!;
const kind = getProduct('kinder-f140k')!;
const kindAlter = getProduct('kinder-bctk001')!;

test('Konfektionsgrößen → Kindergrößen: nichts passt, die ganze Menge ist „verworfen“', () => {
  const alt = { M: 2, L: 3 };
  const neu = passendeGroessen(kind, alt);
  assert.deepEqual(neu, {});
  assert.equal(verworfeneMenge(alt, neu), 5);
  assert.equal(verworfeneMenge(alt, passendeGroessen(kindAlter, alt)), 5);
});

test('gleiche Leiter (Erwachsene → Erwachsene): nichts geht verloren', () => {
  const alt = { M: 2, L: 3, XL: 1 };
  const neu = passendeGroessen(getProduct('gildan-heavy-t')!, alt);
  assert.equal(verworfeneMenge(alt, neu), 0);
  assert.ok(erwachsen);
});

test('Kinder → Kinder derselben Leiter (cm): Größen bleiben, nichts geht verloren', () => {
  const alt = { '104': 2, '128': 4 };
  const neu = passendeGroessen(getProduct('kinder-f240k')!, alt);
  assert.equal(verworfeneMenge(alt, neu), 0);
  assert.deepEqual(neu, alt);
});

test('verworfeneMenge ist nie negativ und ignoriert Nullen und Negatives', () => {
  assert.equal(verworfeneMenge({}, { M: 3 }), 0);
  assert.equal(verworfeneMenge({ M: 0, L: -2 }, {}), 0);
  assert.equal(verworfeneMenge({ M: 4 }, { M: 1 }), 3);
});

test('Hinweis-Speicher: setzt auf ganze, nichtnegative Zahlen', () => {
  const { setze } = useGroessenHinweisStore.getState();
  setze(5);
  assert.equal(useGroessenHinweisStore.getState().verworfen, 5);
  setze(-3);
  assert.equal(useGroessenHinweisStore.getState().verworfen, 0);
  setze(2.9);
  assert.equal(useGroessenHinweisStore.getState().verworfen, 2);
  setze(0);
});

test('Produktbrowser setzt den Hinweis beim Wechsel, die Größentabelle zeigt ihn nur ohne Stückzahlen und löscht ihn bei neuer Eingabe', () => {
  const browser = readFileSync('src/components/configurator/ProduktBrowser.tsx', 'utf8');
  assert.match(browser, /useGroessenHinweisStore\.getState\(\)\.setze\(verworfeneMenge\(sizeQuantities, uebernahme\.sizeQuantities\)\)/);
  const tabelle = readFileSync('src/components/configurator/SizeQuantityTable.tsx', 'utf8');
  assert.match(tabelle, /const hinweisSichtbar = verworfen > 0 && total === 0;/);
  assert.match(tabelle, /if \(total > 0 && verworfen > 0\) setzeVerworfen\(0\);/);
  assert.match(tabelle, /data-testid="groessen-hinweis"/);
});
