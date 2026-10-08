#!/usr/bin/env node
/**
 * Erzeugt druckfertige QR-Codes für gekennzeichnete Links (utm_source), damit der
 * Besucherzähler zeigt, welcher gedruckte Kanal Besucher bringt.
 *
 *   npm run marketing:qr                         → https://www.ergermany.de
 *   npm run marketing:qr -- https://andere.adresse
 *
 * Ausgabe: docs/marketing/qr/qr-<kanal>.png (zum Ansehen/Einfügen) und .svg
 * (verlustfrei skalierbar – das gehört an Druckereien).
 *
 * ── Warum die Startseite und nicht der Konfigurator ──────────────────────
 * Ein gedruckter Code lebt Jahre. Die Startseite ist die einzige Adresse, die
 * sicher stabil bleibt; ein Konfigurator-Pfad könnte sich ändern, der Aufdruck
 * wäre dann tot. Von der Startseite sind es zwei Klicks.
 *
 * ── Vor dem Druck ────────────────────────────────────────────────────────
 *   • Mit mindestens zwei Handys (iPhone und Android) scannen, in der Größe,
 *     in der gedruckt wird – nicht nur am Bildschirm.
 *   • Mindestens 2,5 × 2,5 cm; Hell auf Dunkel bzw. farbige Flächen vermeiden;
 *     die weiße Ruhezone um den Code (4 Module) nicht beschneiden.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import QRCode from 'qrcode';

const basis = (process.argv[2] ?? 'https://www.ergermany.de').replace(/\/$/, '');

/** Kanäle = Einträge aus BESUCH_QUELLEN (src/config/besuch.ts); andere zählen als „sonstige". */
const KANAELE = [
  { quelle: 'flyer', zweck: 'Flyer und Prospekte' },
  { quelle: 'visitenkarte', zweck: 'Rückseite der Visitenkarte' },
  { quelle: 'qr', zweck: 'Schaufenster, Fahrzeug, Plakat, Aufsteller' },
  { quelle: 'paketbeilage', zweck: 'Karte im Paket (Nachbestellung, Weiterempfehlung)' },
  { quelle: 'messe', zweck: 'Messestand und Veranstaltungen' },
];

const ziel = join('docs', 'marketing', 'qr');
mkdirSync(ziel, { recursive: true });

for (const { quelle, zweck } of KANAELE) {
  const url = `${basis}/?utm_source=${quelle}`;
  const optionen = { errorCorrectionLevel: 'M', margin: 4 };
  await QRCode.toFile(join(ziel, `qr-${quelle}.png`), url, { ...optionen, type: 'png', width: 1024 });
  writeFileSync(join(ziel, `qr-${quelle}.svg`), await QRCode.toString(url, { ...optionen, type: 'svg' }));
  console.log(`✔ qr-${quelle}.png / .svg  →  ${url}   (${zweck})`);
}
console.log(`\nAbgelegt in ${ziel}. Vor dem Druck mit mindestens zwei Handys in Originalgröße scannen.`);
