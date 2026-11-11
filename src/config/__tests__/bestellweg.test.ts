/**
 * Tests der zentralen Regel „Stickerei nur auf Anfrage“ (config/bestellweg.ts).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  NUR_AUF_ANFRAGE,
  istNurAufAnfrage,
  warenkorbNurAlsAnfrage,
  MELDUNG_STICKEREI_NUR_AUF_ANFRAGE,
} from '../bestellweg';

test('Stickerei läuft nur auf Anfrage, DTF-Druck nicht', () => {
  assert.equal(istNurAufAnfrage('embroidery'), true);
  assert.equal(istNurAufAnfrage('dtf'), false);
});

test('ein Warenkorb ohne Stickerei bleibt ein normaler Warenkorb', () => {
  assert.equal(warenkorbNurAlsAnfrage([]), false);
  assert.equal(warenkorbNurAlsAnfrage([{ printMethod: 'dtf' }, { printMethod: 'dtf' }]), false);
});

test('schon EINE Stickerei-Position macht den ganzen Warenkorb zur Anfrage', () => {
  assert.equal(warenkorbNurAlsAnfrage([{ printMethod: 'embroidery' }]), true);
  assert.equal(warenkorbNurAlsAnfrage([{ printMethod: 'dtf' }, { printMethod: 'embroidery' }]), true);
});

test('die Liste umfasst nur gültige Veredelungsarten', () => {
  for (const art of NUR_AUF_ANFRAGE) assert.ok(art === 'dtf' || art === 'embroidery', art);
});

test('die Meldung ist ein ganzer, verständlicher Satz ohne technische Begriffe', () => {
  assert.match(MELDUNG_STICKEREI_NUR_AUF_ANFRAGE, /nur auf Anfrage/);
  assert.match(MELDUNG_STICKEREI_NUR_AUF_ANFRAGE, /[.!]$/);
  assert.doesNotMatch(MELDUNG_STICKEREI_NUR_AUF_ANFRAGE, /undefined|null|Error|\bcode\b/i);
});

// Wächter: Die Regel darf nicht an zwei Stellen leben. Weder Warenkorb noch
// Konfigurator dürfen eine eigene Liste führen – sie fragen config/bestellweg.ts.
test('Wächter: Warenkorb und Konfigurator fragen die zentrale Regel, statt die Veredelungsart selbst zu vergleichen', () => {
  for (const datei of ['components/layout/CartDrawer.tsx', 'components/configurator/SummaryPanel.tsx']) {
    const quelle = readFileSync(path.join(process.cwd(), 'src', datei), 'utf8');
    assert.match(quelle, /from '@\/config\/bestellweg'/, `${datei} muss config/bestellweg.ts nutzen`);
  }
});
