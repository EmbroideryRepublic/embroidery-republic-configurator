import test from 'node:test';
import assert from 'node:assert/strict';
import { istHellesTextil, relativeHelligkeit } from '../garmentLuminance';

test('helle Textilien werden als hell erkannt (multiply sinnvoll)', () => {
  assert.equal(istHellesTextil('#ffffff'), true, 'Weiß');
  assert.equal(istHellesTextil('#f5f0e6'), true, 'Naturweiß');
  assert.equal(istHellesTextil('#b2b2b2'), true, 'helles Grau');
});

test('dunkle/kräftige Textilien werden NICHT als hell eingestuft', () => {
  // Genau die Fälle, die die frühere Foto-Messung fälschlich als hell einstufte.
  assert.equal(istHellesTextil('#000000'), false, 'Schwarz');
  assert.equal(istHellesTextil('#1a1a1a'), false, 'Fast-Schwarz');
  assert.equal(istHellesTextil('#263143'), false, 'Navy');
  assert.equal(istHellesTextil('#c0392b'), false, 'Rot');
  assert.equal(istHellesTextil('#1f4fa0'), false, 'Royalblau');
});

test('Kurzform und ungültige Hex-Werte sind robust', () => {
  assert.equal(istHellesTextil('#fff'), true, 'Kurzform Weiß');
  assert.equal(istHellesTextil('#000'), false, 'Kurzform Schwarz');
  // Ungültig → dunkel (sicher: kein multiply, Motiv bleibt sichtbar).
  assert.equal(istHellesTextil('kaputt'), false);
  assert.equal(relativeHelligkeit(''), 0);
});
