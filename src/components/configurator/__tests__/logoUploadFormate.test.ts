/**
 * Regressionstest für den JPEG-Upload-Fund vom 2026-09-03: PDF wurde bereits
 * zuverlässig zu PNG konvertiert (siehe fileToImage.ts::renderPdfFirstPage
 * und analyzeLogoContent.ts::cropImageToContent, deren Kopfkommentar
 * ausdrücklich festhält, dass die Serverseite ausschließlich PNG akzeptiert,
 * geprüft per Signatur statt deklariertem MIME-Typ – siehe pruefeUpload.ts).
 * JPEG lief bis dahin in KEINEM der beiden Dateien mit, obwohl derselbe
 * Konvertierungspfad (canvas.toDataURL('image/png')) es genauso sicher zu
 * PNG re-encodiert wie SVG und PDF – JPEG erreicht den Server also NIE als
 * JPEG, exakt wie bei PDF/SVG bereits der Fall.
 *
 * Dieser Test verhindert, dass LogoUploader.tsx (Dateiauswahl-Filter +
 * Validierung) und fileToImage.ts (tatsächliche Verarbeitung) bei einer
 * künftigen Änderung wieder auseinanderlaufen – z.B. wenn jemand nur die
 * eine Stelle anpasst und die andere vergisst, was JPEG-Uploads mit einer
 * irreführenden Fehlermeldung scheitern ließe, obwohl der Dateiauswahl-
 * Dialog die Datei bereits akzeptiert hatte.
 *
 * Gleiche Teststrategie wie die übrigen Guard-Tests dieses Projekts
 * (Quelltext-Prüfung): LogoUploader.tsx ist eine Client-Komponente
 * (FileReader/Canvas/Image), die sich in node:test ohne vollständige
 * Browser-Umgebung nicht sinnvoll ausführen lässt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const LOGO_UPLOADER = path.join(process.cwd(), 'src', 'components', 'configurator', 'LogoUploader.tsx');
const FILE_TO_IMAGE = path.join(process.cwd(), 'src', 'lib', 'upload', 'fileToImage.ts');
const TRANSLATIONS = path.join(process.cwd(), 'src', 'lib', 'i18n', 'translations.ts');

test('LogoUploader.tsx akzeptiert JPEG in ACCEPTED_TYPES, im accept-Attribut UND fileToImage.ts verarbeitet es', () => {
  const uploaderQuelltext = readFileSync(LOGO_UPLOADER, 'utf8');
  const fileToImageQuelltext = readFileSync(FILE_TO_IMAGE, 'utf8');

  const acceptedTypesZeile = uploaderQuelltext.match(/const ACCEPTED_TYPES = \[([^\]]+)\];/)?.[1] ?? '';
  assert.match(acceptedTypesZeile, /'image\/jpeg'/, 'ACCEPTED_TYPES muss image/jpeg enthalten');

  const acceptAttributZeile = uploaderQuelltext.match(/accept="([^"]+)"/)?.[1] ?? '';
  assert.match(acceptAttributZeile, /image\/jpeg/, 'das accept-Attribut des Datei-Inputs muss image/jpeg enthalten');
  assert.match(acceptAttributZeile, /\.jpe?g/, 'das accept-Attribut muss .jpg/.jpeg enthalten (native Dateiauswahl-Filterung)');

  assert.match(
    fileToImageQuelltext,
    /file\.type === 'image\/jpeg'/,
    'fileToImage() muss image/jpeg verarbeiten, sonst würde eine vom Dateiauswahl-Dialog akzeptierte JPEG-Datei ' +
      'mit "Nicht unterstütztes Dateiformat" scheitern'
  );
});

test('die Fehlermeldungen in beiden Dateien nennen JPEG konsistent (keine veraltete "SVG, PNG, PDF"-Meldung mehr)', () => {
  const uploaderQuelltext = readFileSync(LOGO_UPLOADER, 'utf8');
  const fileToImageQuelltext = readFileSync(FILE_TO_IMAGE, 'utf8');

  assert.doesNotMatch(
    uploaderQuelltext,
    /Nur SVG, PNG oder PDF sind erlaubt/,
    'die alte, JPEG nicht erwähnende Fehlermeldung darf nicht mehr vorkommen'
  );
  assert.doesNotMatch(
    fileToImageQuelltext,
    /Erlaubt sind SVG, PNG und PDF\./,
    'die alte, JPEG nicht erwähnende Fehlermeldung darf nicht mehr vorkommen'
  );
});

test('logo_upload_label nennt JPEG in beiden Sprachen (DE und EN)', () => {
  const quelltext = readFileSync(TRANSLATIONS, 'utf8');
  const treffer = [...quelltext.matchAll(/logo_upload_label:\s*'([^']+)'/g)];
  assert.ok(treffer.length >= 2, 'muss mindestens eine DE- und eine EN-Fassung finden');
  for (const t of treffer) {
    assert.match(t[1]!, /JPEG/, `logo_upload_label "${t[1]}" muss JPEG nennen`);
  }
});
