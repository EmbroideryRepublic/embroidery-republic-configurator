/**
 * Tests der Fristberechnung. Der kritische Punkt sind die Ränder: eine
 * Sekunde entscheidet darüber, ob der Kunde noch stornieren darf und ob die
 * Bestellung im Adminbereich auftaucht. Beides muss exakt zusammenpassen –
 * es darf keinen Moment geben, in dem beides oder keines von beidem gilt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORNOFRIST_MS,
  stornofristEndet,
  stornofristLaeuftNoch,
  bearbeitungFreigegeben,
  verbleibendeStornozeitMs,
} from '../orderProcess';

const BESTELLT = new Date('2026-07-20T10:00:00.000Z');
const ENDE = new Date('2026-07-20T12:00:00.000Z');

test('Stornofrist endet exakt zwei Stunden nach Bestelleingang', () => {
  assert.equal(STORNOFRIST_MS, 2 * 60 * 60 * 1000);
  assert.equal(stornofristEndet(BESTELLT).toISOString(), ENDE.toISOString());
});

test('created_at wird auch als ISO-String akzeptiert', () => {
  assert.equal(stornofristEndet(BESTELLT.toISOString()).getTime(), ENDE.getTime());
});

test('eine Sekunde VOR Ablauf: Storno erlaubt, Bearbeitung gesperrt', () => {
  const kurzDavor = new Date(ENDE.getTime() - 1000);
  assert.equal(stornofristLaeuftNoch(BESTELLT, kurzDavor), true);
  assert.equal(bearbeitungFreigegeben(BESTELLT, kurzDavor), false);
});

test('exakt zum Ablaufzeitpunkt: Storno gesperrt, Bearbeitung frei', () => {
  // Der Grenzfall gehört eindeutig der Bearbeitung – sonst gäbe es eine
  // Millisekunde, in der beides zugleich möglich waere.
  assert.equal(stornofristLaeuftNoch(BESTELLT, ENDE), false);
  assert.equal(bearbeitungFreigegeben(BESTELLT, ENDE), true);
});

test('eine Sekunde NACH Ablauf: Storno gesperrt, Bearbeitung frei', () => {
  const kurzDanach = new Date(ENDE.getTime() + 1000);
  assert.equal(stornofristLaeuftNoch(BESTELLT, kurzDanach), false);
  assert.equal(bearbeitungFreigegeben(BESTELLT, kurzDanach), true);
});

test('die beiden Zustände schließen einander IMMER aus', () => {
  for (const versatz of [-3600_000, -1000, -1, 0, 1, 1000, 3600_000]) {
    const jetzt = new Date(ENDE.getTime() + versatz);
    assert.notEqual(
      stornofristLaeuftNoch(BESTELLT, jetzt),
      bearbeitungFreigegeben(BESTELLT, jetzt),
      `Widerspruch bei Versatz ${versatz} ms`
    );
  }
});

test('verbleibende Zeit wird korrekt gemeldet und nie negativ', () => {
  assert.equal(verbleibendeStornozeitMs(BESTELLT, BESTELLT), STORNOFRIST_MS);
  assert.equal(verbleibendeStornozeitMs(BESTELLT, new Date(ENDE.getTime() - 60_000)), 60_000);
  assert.equal(verbleibendeStornozeitMs(BESTELLT, ENDE), 0);
  assert.equal(verbleibendeStornozeitMs(BESTELLT, new Date(ENDE.getTime() + 99_999)), 0);
});
