/**
 * Tests der Admin-Statuseinordnung (berechneAdminStatus) und der
 * Produktionsfreigabe (produktionsfreigabeErlaubt).
 *
 * Seit der Trennung von Sichtbarkeit und Bearbeitungsstatus (2026-08-25,
 * siehe Kopfkommentar orderVisibility.ts) gibt es keine Sichtbarkeitsregel
 * mehr zu testen – jede Bestellung ist immer sichtbar. Der teure Fehler, den
 * diese Tests weiterhin verhindern müssen: `produktionsfreigabeErlaubt()`
 * liefert `true`, obwohl der Kunde noch stornieren kann oder nie bezahlt hat
 * – dann bestellt der Betreiber Ware für einen Vorgang, der storniert oder
 * nie zustande gekommen ist.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { berechneAdminStatus, produktionsfreigabeErlaubt } from '../orderVisibility';
import { STORNOFRIST_MS } from '@/config/orderProcess';

const BESTELLT = '2026-07-20T10:00:00.000Z';
const ENDE = new Date('2026-07-20T12:00:00.000Z'); // BESTELLT + STORNOFRIST_MS

/**
 * Standardfall ist der RECHNUNGSKAUF (`not_required`), nie erstattungspflichtig
 * (`not_applicable`) – so verhalten sich die meisten Bestellungen.
 */
const bestellung = (
  status = 'new',
  orderType = 'order',
  paymentStatus = 'not_required',
  refundStatus = 'not_applicable'
) => ({
  createdAt: BESTELLT,
  status,
  orderType,
  paymentStatus,
  refundStatus,
});

test('während der Stornofrist gilt eine Bestellung als stornierbar (rot), nicht produktionsbereit', () => {
  const jetzt = new Date(ENDE.getTime() - 1000);
  assert.equal(berechneAdminStatus(bestellung(), jetzt).code, 'stornierbar');
  assert.equal(berechneAdminStatus(bestellung(), jetzt).farbe, 'rot');
  assert.equal(produktionsfreigabeErlaubt(bestellung(), jetzt), false);
});

test('nach Ablauf der Stornofrist gilt eine bezahlte/rechnungspflichtige Bestellung als produktionsbereit (grün)', () => {
  assert.equal(berechneAdminStatus(bestellung(), ENDE).code, 'produktionsbereit');
  assert.equal(berechneAdminStatus(bestellung(), ENDE).farbe, 'gruen');
  assert.equal(produktionsfreigabeErlaubt(bestellung(), ENDE), true);
});

test('stornierbar nennt exakt den Zeitpunkt, an dem die Stornofrist endet', () => {
  const status = berechneAdminStatus(bestellung(), new Date(ENDE.getTime() - 1000));
  assert.equal(status.stornofristEndeIso, ENDE.toISOString());
});

test('produktionsbereit trägt keinen Stornofrist-Zeitpunkt mehr', () => {
  const status = berechneAdminStatus(bestellung(), ENDE);
  assert.equal(status.stornofristEndeIso, undefined);
});

test('stornierte Bestellungen ohne offene Rückerstattung sind grau, nie grün – auch nicht nach Fristablauf', () => {
  // refundStatus bleibt beim Default 'not_applicable' – der Regelfall.
  const spaeter = new Date(ENDE.getTime() + 86_400_000);
  assert.equal(berechneAdminStatus(bestellung('cancelled'), spaeter).code, 'storniert');
  assert.equal(berechneAdminStatus(bestellung('cancelled'), spaeter).farbe, 'grau');
  assert.equal(produktionsfreigabeErlaubt(bestellung('cancelled'), spaeter), false);
});

test('Anfragen sind von der Frist ausgenommen und sofort produktionsfrei-neutral (blau, "anfrage")', () => {
  const anfrage = bestellung('new', 'inquiry');
  assert.equal(berechneAdminStatus(anfrage, new Date(BESTELLT)).code, 'anfrage');
  assert.equal(berechneAdminStatus(anfrage, new Date(BESTELLT)).farbe, 'blau');
  // Anfragen lösen nie eine Lieferanten-Einreihung aus (das prüft der
  // Aufrufer separat über order_type === 'order'), aber auch hier gilt:
  // 'anfrage' ist niemals 'produktionsbereit'.
  assert.equal(produktionsfreigabeErlaubt(anfrage, new Date(BESTELLT)), false);
});

test('stornierte Anfragen gelten ebenfalls nicht als produktionsbereit', () => {
  assert.notEqual(berechneAdminStatus(bestellung('cancelled', 'inquiry'), ENDE).code, 'produktionsbereit');
});

test('Produktionsfreigabe und Selbststornierbarkeit schließen einander aus', () => {
  // Es darf keinen Moment geben, in dem der Kunde noch stornieren kann UND
  // der Betreiber die Bestellung schon als produktionsbereit sieht.
  for (const versatz of [-3600_000, -1000, -1, 0, 1, 1000, 3600_000]) {
    const jetzt = new Date(ENDE.getTime() + versatz);
    const freigegeben = produktionsfreigabeErlaubt(bestellung(), jetzt);
    const nochStornierbar = jetzt.getTime() < ENDE.getTime();
    assert.notEqual(freigegeben, nochStornierbar, `Widerspruch bei Versatz ${versatz} ms`);
  }
});

test('die Stornofrist beträgt weiterhin STORNOFRIST_MS ab Bestelleingang', () => {
  const status = berechneAdminStatus(bestellung(), new Date(BESTELLT));
  assert.equal(
    new Date(status.stornofristEndeIso!).getTime() - new Date(BESTELLT).getTime(),
    STORNOFRIST_MS
  );
});

// ── Zahlungszustand ────────────────────────────────────────────────────────
//
// Der teuerste Fehler dieser Gruppe: Eine unbezahlte Bestellung gilt nach
// Ablauf der Stornofrist als produktionsbereit. Dann ist Ware für einen
// abgebrochenen Bezahlvorgang beschafft.

const LANGE_DANACH = new Date(ENDE.getTime() + 86_400_000);

test('Rechnungskauf verhält sich unverändert', () => {
  assert.equal(produktionsfreigabeErlaubt(bestellung('new', 'order', 'not_required'), ENDE), true);
  assert.equal(
    produktionsfreigabeErlaubt(bestellung('new', 'order', 'not_required'), new Date(ENDE.getTime() - 1000)),
    false,
    'die Stornofrist gilt weiterhin'
  );
});

test('eine bezahlte Bestellung wird nach Fristablauf produktionsbereit', () => {
  assert.equal(produktionsfreigabeErlaubt(bestellung('new', 'order', 'paid'), ENDE), true);
});

test('eine Bestellung mit laufender Zahlung ist NIE produktionsbereit – auch lange nach der Frist', () => {
  const status = berechneAdminStatus(bestellung('new', 'order', 'pending'), LANGE_DANACH);
  assert.equal(status.code, 'zahlung_ausstehend');
  assert.equal(status.farbe, 'amber');
  assert.equal(produktionsfreigabeErlaubt(bestellung('new', 'order', 'pending'), LANGE_DANACH), false);
});

test('eine fehlgeschlagene Zahlung ist NIE produktionsbereit', () => {
  const status = berechneAdminStatus(bestellung('new', 'order', 'failed'), LANGE_DANACH);
  assert.equal(status.code, 'zahlung_fehlgeschlagen');
  assert.equal(status.farbe, 'amber');
  assert.equal(produktionsfreigabeErlaubt(bestellung('new', 'order', 'failed'), LANGE_DANACH), false);
});

test('der Zahlungszustand übersteuert die abgelaufene Frist, nicht umgekehrt', () => {
  const fristVorbeiAberUnbezahlt = produktionsfreigabeErlaubt(bestellung('new', 'order', 'pending'), LANGE_DANACH);
  const bezahltAberFristLaeuft = produktionsfreigabeErlaubt(
    bestellung('new', 'order', 'paid'),
    new Date(ENDE.getTime() - 1000)
  );
  assert.equal(fristVorbeiAberUnbezahlt, false);
  assert.equal(bezahltAberFristLaeuft, false, 'auch eine bezahlte Bestellung ist während der Stornofrist tabu');
});

test('Anfragen bleiben vom Zahlungszustand unberührt', () => {
  assert.equal(berechneAdminStatus(bestellung('new', 'inquiry', 'not_required'), new Date(BESTELLT)).code, 'anfrage');
});

// ── Rückerstattung ───────────────────────────────────────────────────────
//
// Der teuerste Fehler hier wäre das GEGENTEIL des Zahlungs-Risikos oben:
// Eine stornierte, bereits bezahlte Bestellung mit noch offener
// Rückerstattung wird fälschlich als "erledigt" (grau) statt als "noch zu
// klären" markiert, und niemand bemerkt, dass Geld noch beim Betreiber liegt.

test('eine stornierte, bezahlte Bestellung mit offener Rückerstattung ist amber, nie grau oder grün', () => {
  for (const refundStatus of ['required', 'processing', 'failed']) {
    const spaeter = berechneAdminStatus(bestellung('cancelled', 'order', 'paid', refundStatus), LANGE_DANACH);
    assert.equal(spaeter.code, 'storniert_erstattung_offen', `refund_status „${refundStatus}"`);
    assert.equal(spaeter.farbe, 'amber');

    const waehrendFrist = berechneAdminStatus(
      bestellung('cancelled', 'order', 'paid', refundStatus),
      new Date(ENDE.getTime() - 1000)
    );
    assert.equal(waehrendFrist.code, 'storniert_erstattung_offen');

    // In BEIDEN Fällen niemals produktionsbereit.
    assert.equal(produktionsfreigabeErlaubt(bestellung('cancelled', 'order', 'paid', refundStatus), LANGE_DANACH), false);
  }
});

test('eine abgeschlossene Rückerstattung macht die stornierte Bestellung wieder grau ("storniert")', () => {
  const status = berechneAdminStatus(bestellung('cancelled', 'order', 'paid', 'refunded'), LANGE_DANACH);
  assert.equal(status.code, 'storniert', 'refund_status "refunded" heißt: nichts mehr zu tun');
  assert.equal(status.farbe, 'grau');
});
