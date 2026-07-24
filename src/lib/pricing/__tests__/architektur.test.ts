/**
 * ARCHITEKTURTESTS der Preispipeline.
 *
 * Diese Tests prüfen keine Beträge, sondern Grundsätze. Sie sind die
 * Absicherung dagegen, dass die Architektur mit der Zeit erodiert – genau
 * das passiert sonst still und fällt erst auf, wenn es teuer wird.
 *
 * Geprüft werden:
 *   1. REINHEIT – die Pipeline kennt keine Oberfläche, keinen Store, keine DB.
 *   2. NACHVOLLZIEHBARKEIT – jeder Posten lässt sich erklären.
 *   3. KEINE DOPPELTE LOGIK – die Mengenregel existiert genau einmal.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { getPricingRules } from '@/config/pricingRules';
import { calculatePipeline } from '../pipeline';
import { explainLine } from '../priceLine';
import { sumSizeQuantities } from '../quantity';
import type { ConfigElement } from '@/types';

const PRICING_DIR = path.join(process.cwd(), 'src', 'lib', 'pricing');

function alleQuelldateien(dir: string): string[] {
  return readdirSync(dir).flatMap((eintrag) => {
    const voll = path.join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      return eintrag === '__tests__' ? [] : alleQuelldateien(voll);
    }
    return voll.endsWith('.ts') ? [voll] : [];
  });
}

// ── 1. Reinheit ───────────────────────────────────────────────────────

test('Die Pipeline kennt keine Oberfläche, keinen Store und keine Datenbank', () => {
  // Erlaubt sind ausschließlich Typen und fachliche Konfiguration.
  const verbotenePfade = [
    '@/components',
    '@/stores',
    '@/app',
    'react',
    'next/',
    '@supabase',
    'zustand',
    'konva',
  ];

  const verstoesse: string[] = [];
  for (const datei of alleQuelldateien(PRICING_DIR)) {
    const inhalt = readFileSync(datei, 'utf8');
    for (const zeile of inhalt.split('\n')) {
      const treffer = /^\s*import .*from '([^']+)'/.exec(zeile);
      if (!treffer) continue;
      const quelle = treffer[1]!;
      if (verbotenePfade.some((v) => quelle === v || quelle.startsWith(v))) {
        verstoesse.push(`${path.relative(process.cwd(), datei)} importiert „${quelle}"`);
      }
    }
  }

  assert.deepEqual(
    verstoesse,
    [],
    'Die Preispipeline muss reine Geschäftslogik bleiben – nutzbar von Website, Admin und API'
  );
});

test('Die Pipeline importiert ausschließlich Typen, Konfiguration und die Geldformatierung', () => {
  // `@/lib/format/` ist bewusst zugelassen: Die Datei hat selbst KEINE
  // Importe und ist damit ebenso frei von Oberfläche, Store und Datenbank
  // wie die Pipeline. `explainLine()` erzeugt die Preisauskunft für Support
  // und Rechnung und muss dieselbe Schreibweise verwenden wie Shop, E-Mail
  // und Produktionsblatt – sonst entstünde erneut die Uneinheitlichkeit, die
  // die zentrale Formatierung gerade beseitigt hat.
  // Exakt '@/lib/format' – kein Präfix mit Schrägstrich, sonst wären auch
  // künftige Unterordner ungeprüft erlaubt.
  const erlaubteFremdimporte = ['@/types', '@/config/', '@/lib/format'];
  const auffaellig: string[] = [];

  for (const datei of alleQuelldateien(PRICING_DIR)) {
    const inhalt = readFileSync(datei, 'utf8');
    for (const zeile of inhalt.split('\n')) {
      const treffer = /^\s*import .*from '(@\/[^']+)'/.exec(zeile);
      if (!treffer) continue;
      const quelle = treffer[1]!;
      if (!erlaubteFremdimporte.some((e) => quelle === e || quelle.startsWith(e))) {
        auffaellig.push(`${path.relative(process.cwd(), datei)} → ${quelle}`);
      }
    }
  }

  assert.deepEqual(auffaellig, [], 'Nur @/types und @/config/* sind als Fremdimporte zulässig');
});

// ── 2. Nachvollziehbarkeit ────────────────────────────────────────────

async function beispielPosition() {
  const logo = {
    id: 'a', type: 'logo', view: 'front', xCm: 0, yCm: 0, widthCm: 20, heightCm: 15, rotation: 0,
    fileUrl: '', name: 'L', isOutOfBounds: false, locked: false, hidden: false,
    estimatedStitches: 12000, contentFillRatio: 0.85,
  } as unknown as ConfigElement;

  return {
    itemId: 'p1',
    productName: 'Testshirt',
    basePrice: 12.9,
    quantity: 10,
    elements: [logo],
    pricingRules: await getPricingRules('embroidery'),
  };
}

test('Jeder Posten lässt sich in einem Satz erklären', async () => {
  const r = calculatePipeline(
    { positions: [await beispielPosition()], shippingCountry: 'Deutschland' },
    { order: { paymentSurcharge: {}, expressSurcharge: 0, pricesIncludeTax: true } }
  );

  for (const line of r.lines) {
    const erklaerung = explainLine(line);
    assert.ok(erklaerung.includes(line.label), `Erklärung muss den Posten benennen: ${erklaerung}`);
    assert.ok(erklaerung.length > line.label.length, `Erklärung darf nicht nur der Name sein: ${erklaerung}`);
  }
});

test('Jeder Posten aus einer Preisregel nennt einen Grund', async () => {
  const r = calculatePipeline(
    { positions: [await beispielPosition()], shippingCountry: 'Deutschland' },
    { order: { paymentSurcharge: {}, expressSurcharge: 0, pricesIncludeTax: true } }
  );

  const ohneGrund = r.lines.filter((l) => !l.origin.reason);
  assert.deepEqual(
    ohneGrund.map((l) => l.id),
    [],
    'Ohne Grund lässt sich der Preis später weder im Support noch gegenüber dem Kunden erklären'
  );
});

test('Die Herkunft benennt immer eine Stufe', async () => {
  const r = calculatePipeline({ positions: [await beispielPosition()] });
  for (const line of r.lines) {
    assert.ok(['position', 'cart', 'order'].includes(line.origin.stage));
  }
});

// ── 3. Keine doppelte Logik ───────────────────────────────────────────

test('Die Mengenregel existiert genau einmal', () => {
  // Historie: dieselbe Summierung lag dreimal in der Oberfläche und einmal
  // serverseitig – mit unterschiedlicher Strenge. Die Oberfläche hätte damit
  // eine andere Menge angezeigt, als der Server berechnet.
  const wurzel = path.join(process.cwd(), 'src');
  const treffer: string[] = [];

  const durchsuchen = (dir: string) => {
    for (const eintrag of readdirSync(dir)) {
      const voll = path.join(dir, eintrag);
      if (statSync(voll).isDirectory()) {
        if (eintrag !== '__tests__' && eintrag !== 'node_modules') durchsuchen(voll);
        continue;
      }
      if (!/\.tsx?$/.test(voll)) continue;
      if (voll.endsWith(path.join('lib', 'pricing', 'quantity.ts'))) continue;
      const inhalt = readFileSync(voll, 'utf8');
      if (/Object\.values\(sizeQuantities\)/.test(inhalt)) {
        treffer.push(path.relative(process.cwd(), voll));
      }
    }
  };
  durchsuchen(wurzel);

  assert.deepEqual(treffer, [], 'sumSizeQuantities() ist die einzige gültige Mengenregel');
});

test('Die Mengenregel ignoriert ungültige Werte', () => {
  assert.equal(sumSizeQuantities({ S: 2, M: 3 }), 5);
  assert.equal(sumSizeQuantities({ S: -5, M: 3 }), 3);
  assert.equal(sumSizeQuantities({ S: 2.7, M: 1 }), 3);
  assert.equal(sumSizeQuantities(undefined), 0);
});
