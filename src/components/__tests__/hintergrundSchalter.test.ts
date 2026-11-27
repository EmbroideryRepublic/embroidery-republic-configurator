/**
 * Betreiberwunsch 2026-11-27: Kundschaft sieht im Konfigurator keine Hintergrund-Freistellung
 * (config/upload.ts, HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR = false). Der Test hält fest, dass beide Bedienelemente – der Schalter am
 * ausgewählten Logo und das Häkchen beim Hochladen – hinter dem Schalter stehen und die Funktion selbst erhalten bleibt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR } from '@/config/upload';

const lies = (p: string) => readFileSync(p, 'utf8');

test('Hintergrund-Freistellung ist für die Kundschaft aus', () => {
  assert.equal(HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR, false);
});

test('Schalter am Logo und Häkchen beim Hochladen stehen hinter dem Betreiberschalter', () => {
  const leiste = lies('src/components/configurator/ElementToolbar.tsx');
  assert.match(leiste, /HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR && \(\s*<>\s*<div className="flex items-start gap-3">/, 'Schalter am Logo nicht hinter dem Schalter');
  // Auch der Rahmen um die Logo-Einstellungen entfällt, wenn beide Betreiberschalter aus sind (sonst bliebe eine leere Linie).
  assert.match(leiste, /selected\.type === 'logo' && \(HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR \|\| AUFLOESUNGSHINWEISE_IM_KONFIGURATOR\)/);
  const upload = lies('src/components/configurator/LogoUploader.tsx');
  assert.match(upload, /HINTERGRUND_ENTFERNEN_IM_KONFIGURATOR && \(\s*<label/, 'Häkchen beim Hochladen nicht hinter dem Schalter');
});

test('Die Freistellung selbst bleibt erhalten (Rückkehr durch Umlegen des Schalters)', () => {
  assert.match(lies('src/components/configurator/ElementToolbar.tsx'), /removeSimpleBackground\(/);
  assert.match(lies('src/components/configurator/LogoUploader.tsx'), /removeSimpleBackground\(/);
});
