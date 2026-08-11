/**
 * ARCHITEKTURTESTS der Versandschicht.
 *
 * Spiegel von lib/payments/__tests__/architektur.test.ts und
 * lib/invoicing/__tests__/architektur.test.ts – dieselbe eine Zusage:
 * **Der Rest des Systems darf nie erfahren, welcher Versandanbieter im
 * Einsatz ist.**
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const SHIPPING_DIR = path.join(SRC, 'lib', 'shipping');
const PROVIDERS_DIR = path.join(SHIPPING_DIR, 'providers');
const VERDRAHTUNG = path.join(SHIPPING_DIR, 'registry.ts');

function quelldateien(dir: string): string[] {
  return readdirSync(dir).flatMap((eintrag) => {
    const voll = path.join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      if (eintrag === '__tests__') return [];
      return quelldateien(voll);
    }
    return voll.endsWith('.ts') || voll.endsWith('.tsx') ? [voll] : [];
  });
}

function importe(datei: string): string[] {
  const gefunden: string[] = [];
  for (const zeile of readFileSync(datei, 'utf8').split('\n')) {
    const treffer = /^\s*import .*from '([^']+)'/.exec(zeile);
    if (treffer) gefunden.push(treffer[1]!);
  }
  return gefunden;
}

const kurz = (datei: string) => path.relative(process.cwd(), datei).replace(/\\/g, '/');

test('Die Versandlogik importiert kein Anbieter-spezifisches Paket', () => {
  const anbieterPakete = ['dhl-sdk', '@dhl/'];
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SHIPPING_DIR)) {
    if (datei.startsWith(PROVIDERS_DIR)) continue;
    for (const quelle of importe(datei)) {
      if (anbieterPakete.some((p) => quelle === p || quelle.startsWith(p))) {
        verstoesse.push(`${kurz(datei)} importiert „${quelle}"`);
      }
    }
  }

  assert.deepEqual(verstoesse, [], 'Anbieter-spezifische Pakete gehören ausschließlich unter lib/shipping/providers/');
});

test('Nur die Verdrahtung kennt konkrete Versandanbieter', () => {
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SHIPPING_DIR)) {
    if (datei.startsWith(PROVIDERS_DIR) || datei === VERDRAHTUNG) continue;
    for (const quelle of importe(datei)) {
      if (quelle.includes('providers/')) {
        verstoesse.push(`${kurz(datei)} → ${quelle}`);
      }
    }
  }

  assert.deepEqual(verstoesse, [], 'Nur registry.ts darf aus providers/ importieren');
});

test('Die Versandlogik kennt keine Oberfläche, keinen Store und keine Datenbank', () => {
  const verboten = ['@/components', '@/stores', '@/app', 'react', 'next/', '@supabase', 'zustand', 'konva'];
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SHIPPING_DIR)) {
    for (const quelle of importe(datei)) {
      if (verboten.some((v) => quelle === v || quelle.startsWith(v))) {
        verstoesse.push(`${kurz(datei)} importiert „${quelle}"`);
      }
    }
  }

  assert.deepEqual(verstoesse, [], 'Die Versandschicht muss unabhängig von Oberfläche/Store/DB nutzbar bleiben');
});

test('Außerhalb von lib/shipping importiert niemand einen Anbieter direkt', () => {
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SRC)) {
    if (datei.startsWith(SHIPPING_DIR)) continue;
    for (const quelle of importe(datei)) {
      if (quelle.includes('shipping/providers')) {
        verstoesse.push(`${kurz(datei)} → ${quelle}`);
      }
    }
  }

  assert.deepEqual(verstoesse, [], 'Die Bestelllogik spricht ausschließlich über den Port – nie mit einem Anbieter');
});

test('Der Port hat genau die Methode, die gebraucht wird', () => {
  const inhalt = readFileSync(path.join(SHIPPING_DIR, 'types.ts'), 'utf8');
  const block = inhalt.slice(inhalt.indexOf('export interface VersandAnbieter'));
  const methoden = [...block.matchAll(/^\s{2}(\w+)\(/gm)].map((m) => m[1]);

  assert.deepEqual(methoden.sort(), ['erstelleSendung'], 'Der Port wächst mit dem Bedarf, nicht auf Vorrat');
});
