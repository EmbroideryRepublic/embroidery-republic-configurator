/**
 * Schalter „Weißen Hintergrund entfernen“ (nur Logos): an = nur das Motiv wird gestickt, aus = das Original samt Hintergrund.
 *
 * Gesichert wird: Der Schalter ändert die Stickdateien wirklich (Farben, Größe, Stichzahl), der Standard bleibt „an“, Texte und
 * transparente Logos sind vom Schalter unberührt, die Links tragen die Wahl in alle Downloads, die Route prüft den Wert, der Lader
 * nimmt bei „aus“ das Original des Kunden und die Oberfläche zeigt den Schalter nur bei Logos.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { digitalisiereLogo } from '../digitalisiere';
import { hintergrundLaesstSichEntfernen, randIstDeckend, type Raster } from '../maske';
import { logoQuelle } from '@/lib/admin/stickdatei';
import { stickdateiHref, stickinfoHref, stickvorschauHref } from '@/lib/admin/stickdateiLink';
import { dstZuBefehlen, leseJef, lesePes } from './leser';

const PX = 10;

function raster(breiteMm: number, hoeheMm: number, fuellung: [number, number, number, number]): Raster {
  const breite = Math.round(breiteMm * PX);
  const hoehe = Math.round(hoeheMm * PX);
  const rgba = new Uint8Array(breite * hoehe * 4);
  for (let i = 0; i < breite * hoehe; i++) rgba.set(fuellung, i * 4);
  return { breite, hoehe, rgba };
}

function rechteck(r: Raster, x0: number, y0: number, x1: number, y1: number, farbe: [number, number, number]): void {
  for (let y = Math.round(y0 * PX); y < Math.round(y1 * PX); y++) {
    for (let x = Math.round(x0 * PX); x < Math.round(x1 * PX); x++) r.rgba.set([...farbe, 255], (y * r.breite + x) * 4);
  }
}

function kreis(r: Raster, mx: number, my: number, radius: number, farbe: [number, number, number]): void {
  for (let y = 0; y < r.hoehe; y++) {
    for (let x = 0; x < r.breite; x++) {
      if (Math.hypot((x + 0.5) / PX - mx, (y + 0.5) / PX - my) <= radius) r.rgba.set([...farbe, 255], (y * r.breite + x) * 4);
    }
  }
}

/** Logo (rotes Quadrat, blauer Kreis) auf deckend WEISSEM Grund, 40 × 20 mm. */
function logoAufWeiss(): Raster {
  const r = raster(40, 20, [255, 255, 255, 255]);
  rechteck(r, 3, 3, 17, 17, [200, 30, 30]);
  kreis(r, 29, 10, 7, [30, 60, 200]);
  return r;
}

function istWeissNah(hex: string): boolean {
  const v = parseInt(hex.slice(1), 16);
  return ((v >> 16) & 255) > 235 && ((v >> 8) & 255) > 235 && (v & 255) > 235;
}

test('Hintergrund AN (Standard): nur Rot und Blau werden gestickt, der weiße Grund bleibt weg', () => {
  const standard = digitalisiereLogo(logoAufWeiss(), 'AN');
  const an = digitalisiereLogo(logoAufWeiss(), 'AN', undefined, { hintergrundEntfernen: true });
  for (const e of [standard, an]) {
    assert.equal(e.ok, true);
    if (!e.ok) return;
    assert.equal(e.plan.bloecke.length, 2);
    assert.ok(!e.plan.bloecke.some((b) => istWeissNah(b.hex)), 'Weiß darf nicht gestickt werden');
    assert.ok(e.hinweise.some((h) => h.includes('Hintergrund')));
    assert.ok(e.plan.breiteMm < 38, `Breite ${e.plan.breiteMm} mm: nur das Motiv`);
  }
  assert.ok(standard.ok && an.ok && standard.dst.equals(an.dst), 'ohne Angabe gilt „an“');
});

test('Hintergrund AUS: der weiße Grund wird als eigene Garnfarbe mitgestickt, die Dateien ändern sich', () => {
  const an = digitalisiereLogo(logoAufWeiss(), 'AN');
  const aus = digitalisiereLogo(logoAufWeiss(), 'AUS', undefined, { hintergrundEntfernen: false });
  assert.ok(an.ok && aus.ok);
  if (!an.ok || !aus.ok) return;
  assert.equal(aus.plan.bloecke.length, 3, 'Weiß, Rot und Blau');
  assert.ok(aus.plan.bloecke.some((b) => istWeissNah(b.hex)), 'eine Garnfarbe ist Weiß');
  assert.ok(aus.plan.breiteMm > 39 && aus.plan.hoeheMm > 19, `das ganze Bild (40 × 20 mm) wird gestickt, nicht nur das Motiv: ${aus.plan.breiteMm} × ${aus.plan.hoeheMm}`);
  assert.ok(aus.plan.stichzahl > an.plan.stichzahl * 1.5, 'deutlich mehr Stiche');
  assert.ok(aus.hinweise.some((h) => h.includes('Hintergrundentfernung ist aus')), 'Hinweis auf den mitgestickten Hintergrund');
  assert.ok(!aus.hinweise.some((h) => h.includes('wurde nicht mitgestickt')));
  // Alle drei Formate folgen dem Schalter
  assert.ok(!an.dateien.dst.equals(aus.dateien.dst));
  assert.ok(!an.dateien.pes.equals(aus.dateien.pes));
  assert.ok(!an.dateien.jef.equals(aus.dateien.jef));
  assert.equal(lesePes(aus.dateien.pes).plaetze.length, 3);
  assert.equal(leseJef(aus.dateien.jef).farben, 3);
  assert.equal(dstZuBefehlen(aus.dateien.dst).filter((b) => b.art === 'farbwechsel').length, 2);
  assert.equal(dstZuBefehlen(an.dateien.dst).filter((b) => b.art === 'farbwechsel').length, 1);
});

test('ein transparentes Logo ist vom Schalter unberührt (nichts zu entfernen) und meldet den Hintergrund nicht', () => {
  const r = raster(20, 20, [0, 0, 0, 0]);
  kreis(r, 10, 10, 8, [20, 120, 60]);
  const an = digitalisiereLogo(r, 'T');
  const aus = digitalisiereLogo(r, 'T', undefined, { hintergrundEntfernen: false });
  assert.ok(an.ok && aus.ok);
  if (!an.ok || !aus.ok) return;
  assert.ok(an.dst.equals(aus.dst));
  assert.ok(!aus.hinweise.some((h) => h.includes('Hintergrund')));
  assert.equal(randIstDeckend(r), false);
});

test('die Quelle ist IMMER das Original des Kunden, auch wenn er im Konfigurator „Hintergrund entfernen“ an hatte', () => {
  const record = { logoStoragePath: 'orders/x/item-0-logo-1-original.png', logoDisplayStoragePath: 'orders/x/item-0-logo-1-display.png' };
  assert.equal(logoQuelle(record).logoDisplayStoragePath, record.logoStoragePath, 'Original statt Anzeigebild');
  assert.equal(logoQuelle({ logoDisplayStoragePath: 'd.png' }).logoDisplayStoragePath, 'd.png', 'ohne Original (sehr alte Bestellung) bleibt das Anzeigebild');
  assert.deepEqual(record, { logoStoragePath: 'orders/x/item-0-logo-1-original.png', logoDisplayStoragePath: 'orders/x/item-0-logo-1-display.png' }, 'Eingabe bleibt unverändert');
});

test('weißer Randhintergrund lässt sich entfernen, ein Foto-Hintergrund und transparente Bilder nicht (Prüfung ändert das Raster nicht)', () => {
  const weiss = logoAufWeiss();
  const vorher = weiss.rgba.slice();
  assert.equal(hintergrundLaesstSichEntfernen(weiss), true);
  assert.deepEqual(weiss.rgba, vorher, 'das Raster bleibt unverändert');

  // "Foto": jede Randzeile in einer anderen Farbe – es gibt keine dominante Hintergrundfarbe
  const foto = raster(40, 20, [255, 255, 255, 255]);
  for (let y = 0; y < foto.hoehe; y++) for (let x = 0; x < foto.breite; x++) foto.rgba.set([(x * 7) % 256, (y * 13) % 256, ((x + y) * 5) % 256, 255], (y * foto.breite + x) * 4);
  assert.equal(randIstDeckend(foto), true);
  assert.equal(hintergrundLaesstSichEntfernen(foto), false);

  const durchsichtig = raster(20, 20, [0, 0, 0, 0]);
  kreis(durchsichtig, 10, 10, 8, [20, 120, 60]);
  assert.equal(hintergrundLaesstSichEntfernen(durchsichtig), false, 'transparent: nichts zu entfernen');
});

test('Hintergrund AN, aber der Hintergrund ist nicht einfarbig: Hinweis statt stillem Mitsticken', () => {
  const foto = raster(30, 20, [255, 255, 255, 255]);
  for (let y = 0; y < foto.hoehe; y++) for (let x = 0; x < foto.breite; x++) foto.rgba.set([(x * 7) % 256, (y * 13) % 256, ((x + y) * 5) % 256, 255], (y * foto.breite + x) * 4);
  const e = digitalisiereLogo(foto, 'FOTO');
  assert.ok(e.ok || (!e.ok && /Stiche|Farb|detail/i.test(e.grund)));
  if (e.ok) assert.ok(e.hinweise.some((h) => h.includes('nicht einfarbig')), 'Hinweis fehlt');
});

test('die Links tragen die Wahl in jeden Download, Vorschau und die Prüfung', () => {
  assert.equal(stickdateiHref('o1', 'e1'), '/api/admin/bestellungen/o1/stickdatei/e1');
  assert.equal(stickdateiHref('o1', 'e1', 'dst', true), '/api/admin/bestellungen/o1/stickdatei/e1');
  assert.equal(stickdateiHref('o1', 'e1', 'dst', false), '/api/admin/bestellungen/o1/stickdatei/e1?hintergrund=aus');
  assert.equal(stickdateiHref('o1', 'e1', 'pes', false), '/api/admin/bestellungen/o1/stickdatei/e1?format=pes&hintergrund=aus');
  assert.equal(stickdateiHref('o1', 'e1', 'jef', true), '/api/admin/bestellungen/o1/stickdatei/e1?format=jef');
  assert.equal(stickvorschauHref('o1', 'e1'), '/api/admin/bestellungen/o1/stickdatei/e1?vorschau=1');
  assert.equal(stickvorschauHref('o1', 'e1', false), '/api/admin/bestellungen/o1/stickdatei/e1?vorschau=1&hintergrund=aus');
  assert.equal(stickinfoHref('o1', 'e1'), '/api/admin/bestellungen/o1/stickdatei/e1?info=1');
  assert.equal(stickinfoHref('o1', 'e1', false), '/api/admin/bestellungen/o1/stickdatei/e1?info=1&hintergrund=aus');
});

const WURZEL = path.resolve(__dirname, '../../../../..');
const lies = (...teile: string[]) => fs.readFileSync(path.join(WURZEL, ...teile), 'utf8');

test('die Route prüft den Wert von „hintergrund“ nach der Admin-Prüfung und reicht ihn an den Lader', () => {
  const route = lies('src/app/api/admin/bestellungen/[id]/stickdatei/[elementId]/route.ts');
  assert.ok(route.indexOf('await istAdmin()') < route.indexOf("abfrage.get('hintergrund')"));
  assert.ok(route.indexOf("abfrage.get('hintergrund')") < route.indexOf('erzeugeStickdatei('));
  assert.match(route, /hintergrundWunsch !== 'an' && hintergrundWunsch !== 'aus'/);
  assert.match(route, /status: 400/);
  assert.match(route, /hintergrundEntfernen: hintergrundWunsch !== 'aus'/);
});

test('der Lader nimmt in beiden Stellungen das Original, gibt die Option an den Digitalisierer und fällt nur bei nicht einfarbigem Hintergrund auf die Freistellung des Kunden zurück', () => {
  const lader = lies('src/lib/admin/stickdatei.ts');
  assert.match(lader, /toRenderableElement\(logoQuelle\(record\)\)/);
  assert.doesNotMatch(lader, /logoQuelle\(record, /);
  assert.match(lader, /digitalisiereLogo\(raster, kopfName, undefined, \{ hintergrundEntfernen \}\)/);
  assert.match(lader, /hintergrundEntfernen && randIstDeckend\(raster\) && !hintergrundLaesstSichEntfernen\(raster\)/);
  assert.match(lader, /freigestellte Fassung verwendet/);
});

test('die Oberfläche zeigt den Schalter nur bei Logos und gibt die Wahl an alle Links weiter', () => {
  const quelle = lies('src/components/admin/StickdateiKnoepfe.tsx');
  assert.match(quelle, /\{istLogo && \(\s*<label/);
  assert.match(quelle, /role="switch"/);
  assert.match(quelle, /Weißen Hintergrund entfernen: \{hintergrundEntfernen \? 'an' : 'aus'\}/);
  assert.match(quelle, /const entfernen = istLogo \? hintergrundEntfernen : true;/);
  assert.match(quelle, /stickdateiHref\(orderId, elementId, format, entfernen\)/);
  assert.match(quelle, /stickvorschauHref\(orderId, elementId, entfernen\)/);
  assert.match(quelle, /stickinfoHref\(orderId, elementId, wert\)/);
  assert.match(lies('src/components/admin/ProductionPreview.tsx'), /istLogo=\{element\.type === 'logo'\}/);
});
