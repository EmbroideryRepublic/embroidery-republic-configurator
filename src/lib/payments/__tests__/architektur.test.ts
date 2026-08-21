/**
 * ARCHITEKTURTESTS der Zahlungsschicht.
 *
 * Sie prüfen keine Beträge, sondern die eine Zusage, die diese Schicht
 * überhaupt rechtfertigt: **Der Rest des Systems darf nie erfahren, welcher
 * Zahlungsanbieter im Einsatz ist.**
 *
 * Erodiert das, merkt es niemand – bis ein Anbieterwechsel ansteht und sich
 * herausstellt, dass Stripe-Begriffe quer durch den Bestellprozess liegen.
 * Nach demselben Muster wie die Architekturtests der Preispipeline.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'src');
const PAYMENTS_DIR = path.join(SRC, 'lib', 'payments');
const PROVIDERS_DIR = path.join(PAYMENTS_DIR, 'providers');

/**
 * Die einzige Datei der Zahlungsschicht, die konkrete Anbieter kennen darf.
 * Irgendwo muss die Verdrahtung stattfinden – aber nur dort.
 */
const VERDRAHTUNG = path.join(PAYMENTS_DIR, 'registry.ts');

function quelldateien(dir: string, mitUnterordnern = true): string[] {
  return readdirSync(dir).flatMap((eintrag) => {
    const voll = path.join(dir, eintrag);
    if (statSync(voll).isDirectory()) {
      if (eintrag === '__tests__' || !mitUnterordnern) return [];
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

// ── 1. Die Zahlungslogik kennt keinen Anbieter ───────────────────────────

test('Die Zahlungslogik importiert kein Anbieter-SDK', () => {
  // Namen künftiger Anbieter bewusst mit aufgeführt: Der Test soll den
  // Verstoß melden, sobald jemand sie einführt – nicht erst danach.
  const anbieterPakete = ['stripe', '@stripe/', 'paypal', '@paypal/', 'braintree', 'mollie', 'adyen'];
  const verstoesse: string[] = [];

  for (const datei of quelldateien(PAYMENTS_DIR)) {
    if (datei.startsWith(PROVIDERS_DIR)) continue; // Adapter dürfen das
    for (const quelle of importe(datei)) {
      if (anbieterPakete.some((p) => quelle === p || quelle.startsWith(p))) {
        verstoesse.push(`${kurz(datei)} importiert „${quelle}"`);
      }
    }
  }

  assert.deepEqual(verstoesse, [], 'Anbieter-SDKs gehören ausschließlich unter lib/payments/providers/');
});

test('Nur die Verdrahtung kennt konkrete Anbieter', () => {
  const verstoesse: string[] = [];

  for (const datei of quelldateien(PAYMENTS_DIR)) {
    if (datei.startsWith(PROVIDERS_DIR) || datei === VERDRAHTUNG) continue;
    for (const quelle of importe(datei)) {
      if (quelle.includes('providers/')) {
        verstoesse.push(`${kurz(datei)} → ${quelle}`);
      }
    }
  }

  assert.deepEqual(verstoesse, [], 'Nur registry.ts darf aus providers/ importieren');
});

test('Die Zahlungslogik kennt keine Oberfläche, keinen Store und keine Datenbank', () => {
  const verboten = ['@/components', '@/stores', '@/app', 'react', 'next/', '@supabase', 'zustand', 'konva'];
  const verstoesse: string[] = [];

  for (const datei of quelldateien(PAYMENTS_DIR)) {
    for (const quelle of importe(datei)) {
      if (verboten.some((v) => quelle === v || quelle.startsWith(v))) {
        verstoesse.push(`${kurz(datei)} importiert „${quelle}"`);
      }
    }
  }

  assert.deepEqual(
    verstoesse,
    [],
    'Die Zahlungsschicht muss von Website, Admin, API und Hintergrundjob gleichermaßen nutzbar bleiben'
  );
});

// ── 2. Kein Anbieter sickert ins übrige System ───────────────────────────

test('Außerhalb von lib/payments importiert niemand einen Anbieter direkt', () => {
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SRC)) {
    if (datei.startsWith(PAYMENTS_DIR)) continue;
    for (const quelle of importe(datei)) {
      if (quelle.includes('payments/providers')) {
        verstoesse.push(`${kurz(datei)} → ${quelle}`);
      }
    }
  }

  assert.deepEqual(
    verstoesse,
    [],
    'Der Bestellprozess spricht ausschließlich über den Port – nie mit einem Anbieter'
  );
});

test('Anbieternamen tauchen außerhalb der Zahlungsschicht nicht als Bezeichner auf', () => {
  // Gesucht wird nach Bezeichnern wie stripeSession oder paypalOrderId –
  // genau so beginnt das Durchsickern. Kommentare und Dokumentation sind
  // ausdrücklich erlaubt: Über Stripe zu SCHREIBEN ist in Ordnung, mit ihm
  // zu RECHNEN nicht.
  const muster = /\b(stripe|paypal)[A-Z]\w*/;
  const verstoesse: string[] = [];

  for (const datei of quelldateien(SRC)) {
    if (datei.startsWith(PAYMENTS_DIR)) continue;
    const zeilen = readFileSync(datei, 'utf8').split('\n');
    zeilen.forEach((zeile, i) => {
      const ohneKommentar = zeile.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
      if (/^\s*\*/.test(zeile)) return; // Block-Kommentarzeile
      const treffer = muster.exec(ohneKommentar);
      if (treffer) verstoesse.push(`${kurz(datei)}:${i + 1} → ${treffer[0]}`);
    });
  }

  assert.deepEqual(verstoesse, [], 'Anbieterbegriffe gehören hinter den Port');
});

// ── 3. Der Port bleibt schlank ───────────────────────────────────────────

test('Der Port hat genau die Methoden, die gebraucht werden', () => {
  const inhalt = readFileSync(path.join(PAYMENTS_DIR, 'types.ts'), 'utf8');
  const block = inhalt.slice(inhalt.indexOf('export interface ZahlungsAnbieter'));
  const methoden = [...block.matchAll(/^\s{2}(\w+)\(/gm)].map((m) => m[1]);

  assert.deepEqual(
    methoden.sort(),
    ['eroeffne', 'erstatte', 'leseEreignis', 'verwerfe'],
    'Der Port wächst mit dem Bedarf, nicht auf Vorrat – siehe docs/zahlungsarchitektur.md'
  );
});
