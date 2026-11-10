/**
 * Druckqualität eines Logos (Ampel) – gemeinsame Regeln für Upload und Design-Bereich.
 * Stichprobentest 2026-11-10: Ein 48-Pixel-Bild auf 14,6 cm bekam nur 1,8 s eine Warnung, danach keine mehr.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { bewerteLogoQualitaet, berechneLogoDpi, stufeFuerDpi, istRasterDatei, logoQualitaetText, MIN_DPI, OK_DPI } from '../logoQualitaet';

test('Schwellen: unter 150 dpi rot, bis 220 gelb, darüber grün', () => {
  assert.equal(MIN_DPI, 150);
  assert.equal(OK_DPI, 220);
  assert.equal(stufeFuerDpi(149.9), 'red');
  assert.equal(stufeFuerDpi(150), 'yellow');
  assert.equal(stufeFuerDpi(219.9), 'yellow');
  assert.equal(stufeFuerDpi(220), 'green');
});

test('Das Testbild aus dem Seitentest: 48 Pixel auf 14,6 cm sind rot (≈ 8 dpi)', () => {
  const q = bewerteLogoQualitaet({ fileName: 'winzig-48px.png', originalWidthPx: 48, widthCm: 14.6 });
  assert.equal(q?.level, 'red');
  assert.equal(q?.dpi, 8);
});

test('Dasselbe Logo wird beim Größerziehen schlechter und beim Verkleinern besser – die Anzeige folgt', () => {
  const logo = { fileName: 'logo.png', originalWidthPx: 1200, widthCm: 10 };
  assert.equal(bewerteLogoQualitaet(logo)?.level, 'green'); // 305 dpi
  assert.equal(bewerteLogoQualitaet({ ...logo, widthCm: 15 })?.level, 'yellow'); // 203 dpi
  assert.equal(bewerteLogoQualitaet({ ...logo, widthCm: 25 })?.level, 'red'); // 122 dpi
});

test('Vektordateien (SVG, PDF) bekommen nie eine Bewertung, Rasterbilder immer', () => {
  assert.equal(bewerteLogoQualitaet({ fileName: 'Logo.SVG', originalWidthPx: 10, widthCm: 30 }), null);
  assert.equal(bewerteLogoQualitaet({ fileName: 'plan.pdf', originalWidthPx: 10, widthCm: 30 }), null);
  assert.equal(istRasterDatei('foto.JPG'), true);
  assert.equal(istRasterDatei('bild.jpeg'), true);
  assert.equal(istRasterDatei('bild.png'), true);
});

test('Unbrauchbare Maße ergeben keine Bewertung statt einer falschen', () => {
  assert.equal(berechneLogoDpi(100, 0), 0);
  assert.equal(berechneLogoDpi(0, 10), 0);
  assert.equal(bewerteLogoQualitaet({ fileName: 'a.png', originalWidthPx: 0, widthCm: 10 }), null);
  assert.equal(bewerteLogoQualitaet({ fileName: 'a.png', originalWidthPx: 100, widthCm: -3 }), null);
});

test('Die Texte bleiben wie bisher im Upload (Wortlaut unverändert)', () => {
  assert.equal(
    logoQualitaetText('red', 8.4),
    'Auflösung zu niedrig für scharfen Druck (≈ 8 dpi, empfohlen: 150+ dpi). Bitte kleiner platzieren, ein SVG verwenden oder eine höher aufgelöste Datei hochladen.'
  );
  assert.equal(logoQualitaetText('yellow', 203), 'Akzeptable Auflösung (≈ 203 dpi), für sehr große Drucke aber eher knapp.');
  assert.equal(logoQualitaetText('green', 305), 'Optimale Druckqualität bei dieser Größe.');
});

test('Upload und Design-Bereich nutzen dieselbe Berechnung (keine zweite Kopie der Schwellen)', () => {
  const upload = readFileSync(path.join(process.cwd(), 'src', 'components', 'configurator', 'LogoUploader.tsx'), 'utf8');
  const leiste = readFileSync(path.join(process.cwd(), 'src', 'components', 'configurator', 'ElementToolbar.tsx'), 'utf8');
  assert.match(upload, /from '@\/lib\/canvas\/logoQualitaet'/);
  assert.doesNotMatch(upload, /const MIN_DPI = 150/, 'die Schwelle steht nur noch im Helfer');
  assert.match(leiste, /bewerteLogoQualitaet\(/);
  assert.match(leiste, /logoQualitaetText\(/);
});
