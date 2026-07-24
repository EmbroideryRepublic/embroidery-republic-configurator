/**
 * Tests der Betragsermittlung für Zahlungen.
 *
 * Kernaussage: Ein Zahlbetrag entsteht NUR, wenn die Neuberechnung aus der
 * Preispipeline und der gespeicherte Bestellbetrag übereinstimmen. Weichen
 * sie ab, wird keine Zahlung eröffnet – lieber gar nicht kassieren als einen
 * Betrag, den niemand bestätigt hat.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { euroZuCent, centZuEuro, pruefeZahlbetrag, TOLERANZ_CENT } from '../betrag';

// ── Umrechnung ───────────────────────────────────────────────────────────

test('euroZuCent rechnet exakt in ganze Cent', () => {
  assert.equal(euroZuCent(31.64), 3164);
  assert.equal(euroZuCent(0.01), 1);
  assert.equal(euroZuCent(1), 100);
  assert.equal(euroZuCent(1234.56), 123456);
});

test('euroZuCent ist für ALLE Beträge mit zwei Nachkommastellen exakt', () => {
  // Das ist die eigentliche Zusage: Die Preispipeline rundet über
  // roundCents auf zwei Stellen, und genau diese Werte kommen hier an.
  for (let cent = 0; cent <= 20_000; cent++) {
    const euro = cent / 100;
    assert.equal(euroZuCent(euro), cent, `${euro} € müsste ${cent} Cent ergeben`);
  }
});

test('euroZuCent folgt dem tatsächlichen Wert, nicht der getippten Schreibweise', () => {
  // 0,015 ist als Gleitkommazahl in Wahrheit 0,014999… – korrekt ist also
  // 1 Cent. Die naive Rechnung kommt hier auf 2. Das ist der einzige
  // Bereich, in dem sich die Verfahren unterscheiden: ab der dritten
  // Nachkommastelle.
  assert.equal(Math.round(0.015 * 100), 2, 'Ausgangslage: die naive Rechnung rundet auf');
  assert.equal(euroZuCent(0.015), 1, 'euroZuCent folgt dem tatsächlichen Wert');

  assert.equal(euroZuCent(0.045), 4);
  assert.equal(euroZuCent(0.615), 61);
  assert.equal(euroZuCent(1.005), 100);
});

test('euroZuCent weist unbrauchbare Beträge ab, statt 0 zu liefern', () => {
  // Ein stillschweigendes 0 wäre der schlechteste Standardwert für eine
  // Zahlung – lieber ein lauter Fehler.
  assert.throws(() => euroZuCent(Number.NaN));
  assert.throws(() => euroZuCent(Number.POSITIVE_INFINITY));
  assert.throws(() => euroZuCent(-5), /negativ/i);
});

test('centZuEuro ist die Umkehrung', () => {
  assert.equal(centZuEuro(3164), 31.64);
  assert.equal(centZuEuro(1), 0.01);
});

// ── Die eigentliche Regel ────────────────────────────────────────────────

test('übereinstimmende Beträge ergeben einen Zahlbetrag', () => {
  const ergebnis = pruefeZahlbetrag({ neuBerechnetEuro: 31.64, gespeichertEuro: 31.64 });
  assert.equal(ergebnis.ok, true);
  assert.equal(ergebnis.ok && ergebnis.betragCent, 3164);
});

test('maßgeblich ist der GESPEICHERTE Betrag – der wurde bestätigt', () => {
  // Innerhalb der Toleranz gilt der Betrag aus der Bestellbestätigung,
  // nicht die Neuberechnung.
  const ergebnis = pruefeZahlbetrag({ neuBerechnetEuro: 31.65, gespeichertEuro: 31.64 });
  assert.equal(ergebnis.ok, true);
  assert.equal(ergebnis.ok && ergebnis.betragCent, 3164);
});

test('eine Preisänderung während des Bezahlvorgangs verhindert die Zahlung', () => {
  const ergebnis = pruefeZahlbetrag({ neuBerechnetEuro: 35.0, gespeichertEuro: 31.64 });
  assert.equal(ergebnis.ok, false);
  assert.match(ergebnis.ok ? '' : ergebnis.grund, /weicht/i);
});

test('auch eine Abweichung NACH UNTEN blockiert', () => {
  // Der günstigere Betrag ist genauso wenig bestätigt wie der teurere.
  const ergebnis = pruefeZahlbetrag({ neuBerechnetEuro: 20.0, gespeichertEuro: 31.64 });
  assert.equal(ergebnis.ok, false);
});

test('ein Betrag von 0 ist immer ein Fehler', () => {
  const ergebnis = pruefeZahlbetrag({ neuBerechnetEuro: 0, gespeichertEuro: 0 });
  assert.equal(ergebnis.ok, false);
  assert.match(ergebnis.ok ? '' : ergebnis.grund, /0 Cent/);
});

test('unbrauchbare Eingaben blockieren, statt zu werfen', () => {
  // Der Aufrufer sitzt im Checkout – er braucht ein Ergebnis, keine Ausnahme.
  const ergebnis = pruefeZahlbetrag({ neuBerechnetEuro: Number.NaN, gespeichertEuro: 31.64 });
  assert.equal(ergebnis.ok, false);
});

test('die Toleranz deckt genau einen Cent ab, nicht mehr', () => {
  const gerade = pruefeZahlbetrag({ neuBerechnetEuro: 31.65, gespeichertEuro: 31.64 });
  assert.equal(gerade.ok, true, `${TOLERANZ_CENT} Cent Abweichung muss durchgehen`);

  const zuViel = pruefeZahlbetrag({ neuBerechnetEuro: 31.66, gespeichertEuro: 31.64 });
  assert.equal(zuViel.ok, false, '2 Cent Abweichung darf NICHT durchgehen');
});

test('jede Ablehnung nennt einen für Kundschaft verständlichen Satz', () => {
  const faelle = [
    { neuBerechnetEuro: 35.0, gespeichertEuro: 31.64 },
    { neuBerechnetEuro: 0, gespeichertEuro: 0 },
    { neuBerechnetEuro: Number.NaN, gespeichertEuro: 1 },
  ];
  for (const fall of faelle) {
    const ergebnis = pruefeZahlbetrag(fall);
    assert.equal(ergebnis.ok, false);
    if (ergebnis.ok) continue;
    assert.ok(ergebnis.meldung.length > 30, `zu knapp: ${ergebnis.meldung}`);
    assert.ok(!/Cent|NaN|undefined/.test(ergebnis.meldung), `technisch: ${ergebnis.meldung}`);
    // Der technische Grund gehört ins Protokoll – und muss Zahlen nennen.
    assert.ok(ergebnis.grund.length > 0);
  }
});
