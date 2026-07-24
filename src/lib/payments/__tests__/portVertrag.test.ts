/**
 * DER PORT-VERTRAG.
 *
 * Diese Tests prüfen nicht den Testanbieter, sondern die Zusagen, die JEDER
 * Anbieter einhalten muss. Wenn Stripe dazukommt, wird `anbieterUnterTest`
 * um ihn erweitert – dieselben Prüfungen laufen dann gegen beide.
 *
 * Das ist der Sinn eines Ports: Der Bestellprozess verlässt sich auf
 * Verhalten, nicht auf eine bestimmte Umsetzung. Was er sich zusichern
 * lassen darf, steht hier.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { testAnbieter, TEST_SIGNATUR, _testAnbieterZuruecksetzen } from '../providers/testAnbieter';
import type { ZahlungsAnbieter, Zahlungsauftrag } from '../types';

/** Alle Anbieter, die den Vertrag erfüllen müssen. Stripe folgt in S5. */
const anbieterUnterTest: ZahlungsAnbieter[] = [testAnbieter];

function auftrag(ueberschreibungen: Partial<Zahlungsauftrag> = {}): Zahlungsauftrag {
  return {
    bestellId: '11111111-2222-3333-4444-555555555555',
    bestellnummer: 'ER-2026-TEST01',
    betragCent: 3164,
    waehrung: 'EUR',
    beschreibung: 'Bestellung ER-2026-TEST01',
    rueckkehrUrl: 'https://example.invalid/bestellung/abc',
    abbruchUrl: 'https://example.invalid/warenkorb',
    idempotenzSchluessel: 'schluessel-1',
    ...ueberschreibungen,
  };
}

for (const anbieter of anbieterUnterTest) {
  const name = `[${anbieter.id}]`;

  test(`${name} eröffnet einen Vorgang mit Referenz und Weiterleitung`, async () => {
    _testAnbieterZuruecksetzen();
    const ergebnis = await anbieter.eroeffne(auftrag());
    assert.ok(ergebnis.referenz.length > 0, 'ohne Referenz lässt sich der Vorgang nie wiederfinden');
    assert.ok(/^https?:\/\//.test(ergebnis.weiterleitungUrl), 'die Weiterleitung muss eine echte URL sein');
  });

  test(`${name} liefert bei gleichem Idempotenzschlüssel DENSELBEN Vorgang`, async () => {
    _testAnbieterZuruecksetzen();
    const erste = await anbieter.eroeffne(auftrag({ idempotenzSchluessel: 'gleich' }));
    const zweite = await anbieter.eroeffne(auftrag({ idempotenzSchluessel: 'gleich' }));
    assert.equal(
      zweite.referenz,
      erste.referenz,
      'sonst entstehen zwei Bezahlvorgänge für eine Bestellung – die Kundschaft könnte doppelt zahlen'
    );
  });

  test(`${name} liefert bei unterschiedlichem Schlüssel unterschiedliche Vorgänge`, async () => {
    _testAnbieterZuruecksetzen();
    const erste = await anbieter.eroeffne(auftrag({ idempotenzSchluessel: 'a' }));
    const zweite = await anbieter.eroeffne(auftrag({ idempotenzSchluessel: 'b' }));
    assert.notEqual(zweite.referenz, erste.referenz, 'eine Wiederaufnahme braucht einen eigenen Vorgang');
  });

  test(`${name} weist ein Ereignis mit falscher Signatur ab`, () => {
    const echt = JSON.stringify({ art: 'bestaetigt', bestellId: 'x', referenz: 'y', betragCent: 100 });
    assert.equal(anbieter.leseEreignis(echt, 'falsch'), null, 'ohne Echtheitsprüfung könnte jeder „bezahlt" melden');
    assert.equal(anbieter.leseEreignis(echt, null), null);
  });

  test(`${name} weist unbrauchbare Meldungen ab, statt zu werfen`, () => {
    // Der Aufrufer ist ein Webhook-Endpunkt. Er muss antworten können, auch
    // wenn Unsinn ankommt – eine Ausnahme wäre dort der schlechtere Ausgang.
    assert.equal(anbieter.leseEreignis('kein json', TEST_SIGNATUR), null);
    assert.equal(anbieter.leseEreignis('{}', TEST_SIGNATUR), null);
    assert.equal(
      anbieter.leseEreignis(JSON.stringify({ art: 'erfunden', bestellId: 'x', referenz: 'y' }), TEST_SIGNATUR),
      null,
      'eine unbekannte Ereignisart darf nicht stillschweigend durchgehen'
    );
  });

  test(`${name} übersetzt ein gültiges Ereignis in unsere Begriffe`, () => {
    const ereignis = anbieter.leseEreignis(
      JSON.stringify({
        ereignisId: 'evt_1',
        art: 'bestaetigt',
        bestellId: 'bestellung-1',
        referenz: 'vorgang-1',
        betragCent: 3164,
        waehrung: 'EUR',
        transaktionId: 'buchung-1',
      }),
      TEST_SIGNATUR
    );
    assert.ok(ereignis);
    assert.equal(ereignis.art, 'bestaetigt');
    assert.equal(ereignis.bestellId, 'bestellung-1');
    assert.equal(ereignis.betragCent, 3164);
    assert.equal(ereignis.transaktionId, 'buchung-1');
  });

  test(`${name} verwirft auch einen unbekannten Vorgang ohne Fehler`, async () => {
    // Zugesagt im Port: Verwerfen wirft nicht. Ein bereits abgelaufener
    // Vorgang ist der Normalfall, nicht die Ausnahme.
    await anbieter.verwerfe('gibt-es-nicht');
  });

  test(`${name} lässt einen verworfenen Vorgang nicht wieder auferstehen`, async () => {
    _testAnbieterZuruecksetzen();
    const eroeffnet = await anbieter.eroeffne(auftrag({ idempotenzSchluessel: 'zu-verwerfen' }));
    await anbieter.verwerfe(eroeffnet.referenz);
    const neu = await anbieter.eroeffne(auftrag({ idempotenzSchluessel: 'zu-verwerfen' }));
    assert.notEqual(
      neu.referenz,
      eroeffnet.referenz,
      'nach dem Verwerfen muss ein neuer Vorgang entstehen – sonst führte die Wiederaufnahme in einen toten Vorgang'
    );
  });
}
