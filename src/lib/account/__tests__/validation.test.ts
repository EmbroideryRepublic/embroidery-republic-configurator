import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pruefeAdresse, pruefeEmail, pruefePasswort, pruefeRegistrierung } from '../validation';

test('pruefeEmail: leer und ungültig werden abgewiesen', () => {
  assert.equal(pruefeEmail('').length, 1);
  assert.equal(pruefeEmail('keine-email').length, 1);
  assert.equal(pruefeEmail('ok@beispiel.de').length, 0);
});

test('pruefePasswort: alle drei Regeln greifen unabhängig voneinander', () => {
  // "kurz1": 5 Zeichen (zu kurz), hat Buchstabe UND Ziffer -> nur ein Befund (Länge).
  assert.equal(pruefePasswort('kurz1').length, 1, 'nur der Längenfehler greift');
  assert.equal(pruefePasswort('nurbuchstaben').length, 1, 'lang genug, Buchstabe ja, aber keine Ziffer');
  assert.equal(pruefePasswort('12345678').length, 1, 'lang genug, Ziffer ja, aber kein Buchstabe');
  assert.equal(pruefePasswort('gueltig123').length, 0);
});

test('pruefeRegistrierung: Passwort-Mismatch und fehlende Einwilligung werden erkannt', () => {
  const befunde = pruefeRegistrierung({
    email: 'ok@beispiel.de',
    passwort: 'gueltig123',
    passwortWiederholung: 'anders123',
    einwilligungAgb: false,
  });
  assert.ok(befunde.some((b) => b.feld === 'passwortWiederholung'));
  assert.ok(befunde.some((b) => b.feld === 'einwilligungAgb'));
});

test('pruefeRegistrierung: vollständig gültige Eingabe hat keine Befunde', () => {
  const befunde = pruefeRegistrierung({
    email: 'ok@beispiel.de',
    passwort: 'gueltig123',
    passwortWiederholung: 'gueltig123',
    einwilligungAgb: true,
  });
  assert.deepEqual(befunde, []);
});

test('pruefeAdresse: alle Pflichtfelder werden geprüft, optionale nicht', () => {
  const leer = pruefeAdresse({
    firstName: '',
    lastName: '',
    company: null,
    street: '',
    zip: '',
    city: '',
    country: '',
    phone: null,
  });
  assert.equal(leer.length, 6, 'sechs Pflichtfelder fehlen');

  const vollstaendig = pruefeAdresse({
    firstName: 'Anna',
    lastName: 'Muster',
    company: null,
    street: 'Musterstraße 1',
    zip: '12345',
    city: 'Musterstadt',
    country: 'Deutschland',
    phone: null,
  });
  assert.deepEqual(vollstaendig, []);
});
