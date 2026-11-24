/**
 * Namen der Kundendatei-Downloads: Die Endung folgt dem gespeicherten Format (PNG), nicht der hochgeladenen Datei.
 * Anlass (2026-11-24): Ein hochgeladenes „logo.svg“ wurde als PNG gespeichert, aber unter dem Namen „logo.svg“ heruntergeladen.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { downloadNameFuerInhalt, hochgeladenAls, jpgName, speicherEndung } from '../kundendateiName';

const KEY = 'orders/abc/item-0-logo-123-original.png';

test('ein hochgeladenes SVG wird als PNG benannt – der Inhalt ist ein PNG', () => {
  assert.equal(downloadNameFuerInhalt('logo.svg', KEY), 'logo.png');
  assert.equal(downloadNameFuerInhalt('Vereins Wappen.SVG', KEY), 'Vereins Wappen.png');
  assert.equal(downloadNameFuerInhalt('foto.jpeg', KEY), 'foto.png');
  assert.equal(downloadNameFuerInhalt('plan.pdf', KEY), 'plan.png');
});

test('Punkte im Namen bleiben, nur die letzte Endung wird ersetzt', () => {
  assert.equal(downloadNameFuerInhalt('logo.final.v2.svg', KEY), 'logo.final.v2.png');
});

test('ohne Namen oder ohne Endung gibt es einen sinnvollen Namen', () => {
  assert.equal(downloadNameFuerInhalt(null, KEY), 'logo.png');
  assert.equal(downloadNameFuerInhalt('   ', KEY), 'logo.png');
  assert.equal(downloadNameFuerInhalt('wappen', KEY), 'wappen.png');
  assert.equal(downloadNameFuerInhalt('.svg', KEY), '.svg.png', 'ein Name, der nur aus der Endung besteht, bleibt als Name erhalten');
});

test('die Endung folgt dem Speicherpfad: ältere Bestellungen mit JPG/WebP/PDF behalten ihr Format', () => {
  assert.equal(speicherEndung('orders/a/x.jpg'), 'jpg');
  assert.equal(speicherEndung('orders/a/x.jpeg'), 'jpg');
  assert.equal(speicherEndung('orders/a/x.WEBP'), 'webp');
  assert.equal(speicherEndung('orders/a/x.pdf'), 'pdf');
  assert.equal(speicherEndung('orders/a/ohne-endung'), 'png');
  assert.equal(speicherEndung('orders/a/x.exe'), 'png', 'unbekannte Endungen werden nicht übernommen');
  assert.equal(speicherEndung(null), 'png');
  assert.equal(downloadNameFuerInhalt('logo.svg', 'orders/a/x.jpg'), 'logo.jpg');
});

test('JPG-Name: Name der Kundschaft mit Endung .jpg', () => {
  assert.equal(jpgName('logo.svg'), 'logo.jpg');
  assert.equal(jpgName('Team Logo.png'), 'Team Logo.jpg');
  assert.equal(jpgName(null), 'logo.jpg');
});

test('„hochgeladen als …“ nur, wenn das hochgeladene Format vom gespeicherten abweicht', () => {
  assert.equal(hochgeladenAls('logo.svg', KEY), 'SVG');
  assert.equal(hochgeladenAls('foto.jpeg', KEY), 'JPG');
  assert.equal(hochgeladenAls('foto.JPG', KEY), 'JPG');
  assert.equal(hochgeladenAls('plan.pdf', KEY), 'PDF');
  assert.equal(hochgeladenAls('logo.png', KEY), null);
  assert.equal(hochgeladenAls('logo.PNG', KEY), null);
  assert.equal(hochgeladenAls('logo', KEY), null);
  assert.equal(hochgeladenAls(null, KEY), null);
  assert.equal(hochgeladenAls('foto.jpg', 'orders/a/x.jpg'), null);
  assert.equal(hochgeladenAls('foto.jpeg', 'orders/a/x.jpg'), null);
});
