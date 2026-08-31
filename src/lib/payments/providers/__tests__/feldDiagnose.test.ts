/**
 * Test der Strukturdiagnose (Fund vom 2026-08-31: PayPal/Stripe zeigten sich
 * im Checkout beide als nicht einsatzbereit, obwohl `vercel env ls` alle
 * Variablen als gesetzt auswies) – beweist, dass diagnostiziereFeld() die
 * typischen Copy-Paste-Fehler (Anführungszeichen, Leerzeichen, falsches
 * Präfix) erkennt, OHNE den Wert selbst zurückzugeben.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diagnostiziereFeld } from '../feldDiagnose';

const VAR = 'FELD_DIAGNOSE_TEST_VARIABLE';

function mitWert<T>(wert: string | undefined, fn: () => T): T {
  const vorher = process.env[VAR];
  if (wert === undefined) delete process.env[VAR];
  else process.env[VAR] = wert;
  try {
    return fn();
  } finally {
    if (vorher === undefined) delete process.env[VAR];
    else process.env[VAR] = vorher;
  }
}

test('fehlende Variable: vorhanden=false, laenge=null', () => {
  mitWert(undefined, () => {
    const d = diagnostiziereFeld(VAR);
    assert.equal(d.vorhanden, false);
    assert.equal(d.laenge, null);
    assert.equal(d.hatFuehrendesOderNachgestelltesLeerzeichen, false);
    assert.equal(d.inAnfuehrungszeichenEingeschlossen, false);
  });
});

test('leere Variable: vorhanden=false, laenge=0', () => {
  mitWert('', () => {
    const d = diagnostiziereFeld(VAR);
    assert.equal(d.vorhanden, false);
    assert.equal(d.laenge, 0);
  });
});

test('gültiger Wert ohne Auffälligkeiten', () => {
  mitWert('sk_live_abc123', () => {
    const d = diagnostiziereFeld(VAR, ['sk_test_', 'sk_live_']);
    assert.equal(d.vorhanden, true);
    assert.equal(d.laenge, 14);
    assert.equal(d.hatFuehrendesOderNachgestelltesLeerzeichen, false);
    assert.equal(d.inAnfuehrungszeichenEingeschlossen, false);
    assert.deepEqual(d.beginntMitErwartetemPraefix, { sk_test_: false, sk_live_: true });
  });
});

test('versehentlich MIT Anführungszeichen kopierter Wert wird erkannt', () => {
  mitWert('"sk_live_abc123"', () => {
    const d = diagnostiziereFeld(VAR, ['sk_live_']);
    assert.equal(d.inAnfuehrungszeichenEingeschlossen, true);
    // Das führende Anführungszeichen verhindert den Präfix-Treffer –
    // genau DAS ist der Bug, den diese Diagnose sichtbar machen soll.
    assert.equal(d.beginntMitErwartetemPraefix['sk_live_'], false);
  });
});

test('Wert mit einfachen Anführungszeichen wird ebenfalls erkannt', () => {
  mitWert("'live'", () => {
    const d = diagnostiziereFeld(VAR);
    assert.equal(d.inAnfuehrungszeichenEingeschlossen, true);
  });
});

test('führendes/nachgestelltes Leerzeichen wird erkannt', () => {
  mitWert(' live ', () => {
    const d = diagnostiziereFeld(VAR);
    assert.equal(d.vorhanden, true);
    assert.equal(d.hatFuehrendesOderNachgestelltesLeerzeichen, true);
    assert.equal(d.laenge, 6, 'die ROHE Länge inkl. Leerzeichen, damit die Auffälligkeit sichtbar bleibt');
  });
});

test('falsches Präfix wird korrekt als false gemeldet (kein falscher Treffer)', () => {
  mitWert('pk_live_abc123', () => {
    const d = diagnostiziereFeld(VAR, ['sk_test_', 'sk_live_']);
    assert.deepEqual(d.beginntMitErwartetemPraefix, { sk_test_: false, sk_live_: false });
  });
});

test('ein einzelnes Anführungszeichen allein zählt NICHT als eingeschlossen', () => {
  mitWert('sk_live_abc"123', () => {
    const d = diagnostiziereFeld(VAR);
    assert.equal(d.inAnfuehrungszeichenEingeschlossen, false);
  });
});

test('der Wert selbst taucht nirgends im Rückgabeobjekt auf', () => {
  mitWert('sk_live_super_geheim_12345', () => {
    const d = diagnostiziereFeld(VAR, ['sk_live_']);
    const alsText = JSON.stringify(d);
    assert.doesNotMatch(alsText, /super_geheim/);
  });
});
