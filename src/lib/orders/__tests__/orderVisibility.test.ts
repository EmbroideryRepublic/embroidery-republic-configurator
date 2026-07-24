/**
 * Tests der Admin-Sichtbarkeitsregel.
 *
 * Zwei Fehler wären hier teuer: Eine Bestellung erscheint zu früh (der
 * Betreiber bestellt Ware, die der Kunde Minuten später storniert), oder
 * eine stornierte Bestellung taucht auf (Ware wird umsonst beschafft).
 * Beides wird hier abgesichert.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { imAdminSichtbar, bearbeitungsGrenze, BEARBEITBARE_ZAHLUNGSZUSTAENDE } from '../orderVisibility';
import { STORNOFRIST_MS } from '@/config/orderProcess';

const BESTELLT = '2026-07-20T10:00:00.000Z';
const ENDE = new Date('2026-07-20T12:00:00.000Z');

/**
 * Standardfall ist der RECHNUNGSKAUF (`not_required`) – so verhalten sich
 * alle bisherigen Bestellungen. Die Tests darunter belegen damit zugleich,
 * dass die Zahlungsprüfung am bestehenden Verhalten nichts ändert.
 */
const bestellung = (status = 'new', orderType = 'order', paymentStatus = 'not_required') => ({
  createdAt: BESTELLT,
  status,
  orderType,
  paymentStatus,
});

test('während der Stornofrist ist eine Bestellung NICHT sichtbar', () => {
  assert.equal(imAdminSichtbar(bestellung(), new Date(ENDE.getTime() - 1000)), false);
});

test('nach Ablauf der Stornofrist wird sie sichtbar', () => {
  assert.equal(imAdminSichtbar(bestellung(), ENDE), true);
  assert.equal(imAdminSichtbar(bestellung(), new Date(ENDE.getTime() + 1000)), true);
});

test('stornierte Bestellungen erscheinen NIEMALS – auch nicht nach Fristablauf', () => {
  assert.equal(imAdminSichtbar(bestellung('cancelled'), new Date(ENDE.getTime() + 86_400_000)), false);
  // Auch während der Frist nicht.
  assert.equal(imAdminSichtbar(bestellung('cancelled'), new Date(ENDE.getTime() - 1000)), false);
});

test('Anfragen sind von der Frist ausgenommen und sofort sichtbar', () => {
  const anfrage = bestellung('new', 'inquiry');
  assert.equal(imAdminSichtbar(anfrage, new Date(BESTELLT)), true);
  assert.equal(imAdminSichtbar(anfrage, new Date(ENDE.getTime() - 1000)), true);
});

test('stornierte Anfragen erscheinen ebenfalls nicht', () => {
  assert.equal(imAdminSichtbar(bestellung('cancelled', 'inquiry'), ENDE), false);
});

test('Sichtbarkeit und Selbststornierung schließen einander aus', () => {
  // Es darf keinen Moment geben, in dem der Kunde noch stornieren kann UND
  // der Betreiber die Bestellung schon bearbeitet.
  for (const versatz of [-3600_000, -1000, -1, 0, 1, 1000, 3600_000]) {
    const jetzt = new Date(ENDE.getTime() + versatz);
    const sichtbar = imAdminSichtbar(bestellung(), jetzt);
    const nochStornierbar = jetzt.getTime() < ENDE.getTime();
    assert.notEqual(sichtbar, nochStornierbar, `Widerspruch bei Versatz ${versatz} ms`);
  }
});

test('die Datenbank-Zeitgrenze liegt genau eine Stornofrist in der Vergangenheit', () => {
  const jetzt = new Date('2026-07-20T15:00:00.000Z');
  const grenze = new Date(bearbeitungsGrenze(jetzt));
  assert.equal(jetzt.getTime() - grenze.getTime(), STORNOFRIST_MS);
});

// ── Zahlungszustand (S4) ─────────────────────────────────────────────────
//
// Der teuerste Fehler dieser Datei wäre: Eine unbezahlte Bestellung
// erscheint nach Ablauf der Stornofrist im Adminbereich, und beim ersten
// Öffnen der Detailseite entsteht der Lieferantenauftrag. Dann ist Ware für
// einen abgebrochenen Bezahlvorgang beschafft.

const LANGE_DANACH = new Date(ENDE.getTime() + 86_400_000);

test('Rechnungskauf verhält sich unverändert', () => {
  // Der wichtigste Test dieser Gruppe: Solange Stripe nicht aktiv ist,
  // trägt JEDE Bestellung 'not_required' – es darf sich nichts ändern.
  assert.equal(imAdminSichtbar(bestellung('new', 'order', 'not_required'), ENDE), true);
  assert.equal(
    imAdminSichtbar(bestellung('new', 'order', 'not_required'), new Date(ENDE.getTime() - 1000)),
    false,
    'die Stornofrist gilt weiterhin'
  );
});

test('eine bezahlte Bestellung wird nach Fristablauf sichtbar', () => {
  assert.equal(imAdminSichtbar(bestellung('new', 'order', 'paid'), ENDE), true);
});

test('eine Bestellung mit laufender Zahlung erscheint NICHT – auch lange nach der Frist', () => {
  assert.equal(imAdminSichtbar(bestellung('new', 'order', 'pending'), LANGE_DANACH), false);
});

test('eine fehlgeschlagene Zahlung erscheint NICHT', () => {
  // Die Kundschaft kann den Vorgang wieder aufnehmen; bis dahin gibt es
  // nichts zu bearbeiten.
  assert.equal(imAdminSichtbar(bestellung('new', 'order', 'failed'), LANGE_DANACH), false);
});

test('der Zahlungszustand überstimmt die abgelaufene Frist, nicht umgekehrt', () => {
  // Beide Bedingungen müssen erfüllt sein – eine allein genügt nie.
  const fristVorbeiAberUnbezahlt = imAdminSichtbar(bestellung('new', 'order', 'pending'), LANGE_DANACH);
  const bezahltAberFristLaeuft = imAdminSichtbar(
    bestellung('new', 'order', 'paid'),
    new Date(ENDE.getTime() - 1000)
  );
  assert.equal(fristVorbeiAberUnbezahlt, false);
  assert.equal(bezahltAberFristLaeuft, false, 'auch eine bezahlte Bestellung ist während der Stornofrist tabu');
});

test('Anfragen bleiben vom Zahlungszustand unberührt', () => {
  // Eine Anfrage ist keine Bestellung – sie hat nichts zu bezahlen.
  assert.equal(imAdminSichtbar(bestellung('new', 'inquiry', 'not_required'), new Date(BESTELLT)), true);
});

test('die Liste der bearbeitbaren Zahlungszustände deckt sich mit der Regel', () => {
  // Der Datenbankfilter in lib/admin/data.ts nutzt diese Liste. Liefen die
  // beiden auseinander, wäre eine Bestellung in der Liste sichtbar, über die
  // Detailseite aber nicht erreichbar – oder schlimmer: umgekehrt.
  for (const zustand of BEARBEITBARE_ZAHLUNGSZUSTAENDE) {
    assert.equal(
      imAdminSichtbar(bestellung('new', 'order', zustand), ENDE),
      true,
      `„${zustand}" gilt als bearbeitbar, wird von der Regel aber ausgeschlossen`
    );
  }
  for (const zustand of ['pending', 'failed']) {
    assert.equal(
      imAdminSichtbar(bestellung('new', 'order', zustand), ENDE),
      false,
      `„${zustand}" darf nicht bearbeitbar sein`
    );
  }
});
