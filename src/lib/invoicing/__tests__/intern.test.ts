/**
 * Test des internen Rechnungsanbieters (Lexware-Unabhängigkeit, 2026-08-18).
 *
 * Bewusst OHNE Aufruf von erstelle() bis zum PDF-Rendering: tsconfig.json
 * setzt "jsx": "preserve" (für den Next.js-Build gedacht) – führt `tsx` (der
 * Testrunner dieses Projekts, siehe package.json "test"-Skript) eine .tsx-
 * Datei direkt aus, fehlt der automatische JSX-Runtime-Transform und
 * @react-pdf/renderer scheitert mit "React is not defined". Dasselbe
 * Problem träfe jede andere PDF-Komponente dieses Repos – konsistent dazu
 * hat auch lib/production/buildProductionSheet.tsx keinen eigenen Test.
 * Geprüft wird deshalb nur, was ohne den JSX-Renderpfad verifizierbar ist.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { internerRechnungsAnbieter } from '../providers/intern';

test('id ist "intern"', () => {
  assert.equal(internerRechnungsAnbieter.id, 'intern');
});
