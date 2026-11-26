/**
 * Tests des Ablaufs der Auftragsänderung (orderEditService.ts) – ausschließlich
 * mit Attrappen. Es wird nichts gespeichert, nichts versendet, keine Datenbank
 * und kein Zahlungs-, Rechnungs- oder Lieferantendienst berührt.
 *
 * Geprüft wird vor allem die REIHENFOLGE und die Bedingungen, unter denen etwas
 * nach außen geht: keine Mail vor der Speicherung, keine Mail nach einer
 * gescheiterten Speicherung, keine Speicherung ohne Grund, Bestätigungen und
 * eine zur Vorschau passende Summe.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { gespeicherterStand, HOODIE, TSHIRT } from './auftragFixtures';
import {
  erstelleAenderungsVorschau,
  wendeAenderungAn,
  type AenderungsAbhaengigkeiten,
  type AenderungsAnfrage,
  type SpeicherErgebnis,
} from '../orderEditService';
import type { Aenderung, AenderungsStand, KundenmailDaten } from '../orderEdit';
import type { EmailVersandErgebnis } from '@/lib/email/orderEmails';
import type { ErsatzRechnungsErgebnis } from '../orderInvoiceReplacement';

interface Attrappe {
  deps: AenderungsAbhaengigkeiten;
  ablauf: string[];
  gespeichert: Array<{ orderId: string; nutzlast: Record<string, any> }>;
  mails: Array<{ orderId: string; empfaenger: string; daten: KundenmailDaten; rechnung?: { pdf: Buffer; rechnungsnummer: string } | null }>;
  protokolliert: PromiseSettledResult<EmailVersandErgebnis>[];
  /** Aufrufe von ersetzeRechnung (Ersatzrechnung nach der Änderung). */
  ersaetze: Array<{ orderId: string; alteNummer: string }>;
}

function attrappe(
  stand: AenderungsStand | null,
  optionen: {
    speichern?: SpeicherErgebnis;
    mail?: () => Promise<EmailVersandErgebnis>;
    lieferanten?: () => Promise<void>;
    laden?: () => Promise<AenderungsStand | null>;
    /** Kann das System eine Ersatzrechnung erzeugen (interner Anbieter)? Standard: nein – wie bisher. */
    ersatzMoeglich?: boolean;
    ersatz?: (alteNummer: string) => Promise<ErsatzRechnungsErgebnis>;
  } = {}
): Attrappe {
  const a: Attrappe = { deps: undefined as never, ablauf: [], gespeichert: [], mails: [], protokolliert: [], ersaetze: [] };
  a.deps = {
    async ladeStand() {
      a.ablauf.push('laden');
      return optionen.laden ? optionen.laden() : stand;
    },
    async speichere(orderId, nutzlast) {
      a.ablauf.push('speichern');
      a.gespeichert.push({ orderId, nutzlast });
      return optionen.speichern ?? { ok: true };
    },
    async sendeKundenmail(params) {
      a.ablauf.push('mail');
      a.mails.push(params);
      return optionen.mail ? optionen.mail() : { success: true, messageId: 'msg-1' };
    },
    async mailText(daten) {
      a.ablauf.push('mailtext');
      return `MAILTEXT ${daten.orderNumber} ${daten.neuGesamtCent}`;
    },
    async protokolliereMail(_orderId, ergebnis) {
      a.ablauf.push('mailprotokoll');
      a.protokolliert.push(ergebnis);
    },
    async gleicheLieferantenAn() {
      a.ablauf.push('lieferanten');
      if (optionen.lieferanten) await optionen.lieferanten();
    },
    bestellansichtUrl: () => 'https://www.ergermany.de/bestellung/abc',
    rechnungsErsatzMoeglich: () => optionen.ersatzMoeglich ?? false,
    async ersetzeRechnung(orderId, alteNummer) {
      a.ablauf.push('ersatzrechnung');
      a.ersaetze.push({ orderId, alteNummer });
      return optionen.ersatz ? optionen.ersatz(alteNummer) : ERSATZ_OK(alteNummer);
    },
  };
  return a;
}

/** Eine gelungene Ersatzrechnung (ohne echtes PDF-Rendering). */
const ERSATZ_OK = (alteNummer: string): ErsatzRechnungsErgebnis => ({
  ok: true,
  status: 'ersetzt',
  neueNummer: 'RE-2026-000099',
  neuesDatum: '2026-11-26',
  alteNummer,
  altesDatum: '2026-11-20',
  bestellnummer: 'ER-2026-ABC123',
  empfaenger: 'kunde@example.invalid',
  pdf: Buffer.from('%PDF-Attrappe'),
});

const EINE_VERRINGERUNG: Aenderung[] = [{ art: 'verringern', positionId: 'p1', neueMengen: { L: 1 } }];

async function standMitHoodies(ueberschreibungen: Parameters<typeof gespeicherterStand>[1] = {}, lieferanten: string[] = []) {
  return gespeicherterStand([{ id: 'p1', productId: HOODIE, sizeQuantities: { L: 2 } }], ueberschreibungen, lieferanten);
}

/** Eine Anfrage, die zur berechneten Vorschau passt. */
async function anfrageFuer(
  stand: AenderungsStand,
  teil: Partial<AenderungsAnfrage> = {},
  attrappenOptionen: Parameters<typeof attrappe>[1] = {}
): Promise<AenderungsAnfrage> {
  const a = attrappe(stand, attrappenOptionen);
  const vorschau = await erstelleAenderungsVorschau(stand.bestellung.id, EINE_VERRINGERUNG, a.deps);
  assert.equal(vorschau.ok, true);
  if (!vorschau.ok) throw new Error('unerreichbar');
  return {
    aenderungen: EINE_VERRINGERUNG,
    begruendung: 'Kunde hat per Mail um Korrektur gebeten',
    mailSenden: true,
    bestaetigungen: vorschau.vorschau.bestaetigungen,
    erwartet: { altCent: vorschau.vorschau.alt.gesamtCent, neuCent: vorschau.vorschau.neu.gesamtCent },
    ...teil,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Vorschau
// ═══════════════════════════════════════════════════════════════════════

test('Vorschau: alter/neuer Preis, Differenz und Mailtext – und es wird nichts gespeichert oder versendet', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand);
  const r = await erstelleAenderungsVorschau('order-1', EINE_VERRINGERUNG, a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;

  assert.equal(r.vorschau.alt.gesamtCent, Math.round(stand.bestellung.totalPrice * 100));
  assert.ok(r.vorschau.neu.gesamtCent < r.vorschau.alt.gesamtCent);
  assert.equal(r.vorschau.differenzCent, r.vorschau.alt.gesamtCent - r.vorschau.neu.gesamtCent);
  assert.equal(r.vorschau.kundenmail.empfaenger, 'kunde@example.invalid');
  assert.equal(r.vorschau.kundenmail.betreff, 'Dein Auftrag ER-2026-ABC123 wurde geändert');
  assert.match(r.vorschau.kundenmail.text, /^MAILTEXT ER-2026-ABC123 \d+$/);

  assert.deepEqual(a.ablauf, ['laden', 'mailtext'], 'weder gespeichert noch versendet');
  assert.equal(a.gespeichert.length, 0);
  assert.equal(a.mails.length, 0);
});

test('Vorschau: unzulässige Bestellung wird mit Grund abgelehnt', async () => {
  const a = attrappe(await standMitHoodies({ status: 'in_production' }));
  const r = await erstelleAenderungsVorschau('order-1', EINE_VERRINGERUNG, a.deps);
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.grund, 'in-produktion');
  assert.deepEqual(a.ablauf, ['laden']);
});

test('Vorschau: unbekannte Bestellung und Ladefehler', async () => {
  const nichtDa = await erstelleAenderungsVorschau('x', EINE_VERRINGERUNG, attrappe(null).deps);
  assert.equal(nichtDa.ok, false);
  if (!nichtDa.ok) assert.equal(nichtDa.grund, 'nicht-gefunden');

  const kaputt = await erstelleAenderungsVorschau(
    'x',
    EINE_VERRINGERUNG,
    attrappe(null, {
      laden: async () => {
        throw new Error('Datenbank nicht erreichbar');
      },
    }).deps
  );
  assert.equal(kaputt.ok, false);
  if (!kaputt.ok) assert.equal(kaputt.grund, 'fehler');
});

test('Vorschau: ein nicht renderbarer Mailtext verhindert die Vorschau nicht', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand);
  a.deps.mailText = async () => {
    throw new Error('Render kaputt');
  };
  const r = await erstelleAenderungsVorschau('order-1', EINE_VERRINGERUNG, a.deps);
  assert.equal(r.ok, true);
  if (r.ok) assert.match(r.vorschau.kundenmail.text, /Vorschau der Mail konnte nicht erzeugt werden/);
});

// ═══════════════════════════════════════════════════════════════════════
// Speichern + Mail
// ═══════════════════════════════════════════════════════════════════════

test('Regelfall: erst speichern, dann Mail, dann Protokoll, dann Lieferanten – in dieser Reihenfolge', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand);
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand), a.deps);

  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'gesendet');
  assert.deepEqual(r.probleme, []);
  assert.deepEqual(a.ablauf, ['laden', 'speichern', 'mail', 'mailprotokoll', 'lieferanten']);

  assert.equal(a.mails.length, 1);
  assert.equal(a.mails[0]!.empfaenger, 'kunde@example.invalid');
  assert.equal(a.mails[0]!.daten.neuGesamtCent, r.neu.gesamtCent, 'die Mail nennt die gespeicherte Summe');
  assert.equal(a.mails[0]!.daten.altGesamtCent, r.alt.gesamtCent);
  assert.deepEqual(a.mails[0]!.daten.rechnung, { art: 'entsteht' });
  assert.equal(a.mails[0]!.daten.bestellansichtUrl, 'https://www.ergermany.de/bestellung/abc');
});

test('Die Nutzlast an die Datenbank trägt Zustand, neue Werte und den Historien-Eintrag mit dem Grund', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand);
  await wendeAenderungAn('order-1', await anfrageFuer(stand, { begruendung: '  Kunde hat angerufen  ' }), a.deps);

  assert.equal(a.gespeichert.length, 1);
  const n = a.gespeichert[0]!.nutzlast;
  assert.equal(a.gespeichert[0]!.orderId, 'order-1');
  assert.equal(n.stand.status, 'new');
  assert.equal(n.stand.positionen.length, 1);
  assert.equal(n.aenderungen.length, 1);
  assert.match(n.ereignis.reason, /Auftrag durch den Betreiber geändert/);
  assert.match(n.ereignis.reason, /Grund: Kunde hat angerufen$/, 'Grund getrimmt');
  assert.equal(n.ereignis.detail.begruendung, 'Kunde hat angerufen');
  assert.equal(n.ereignis.detail.kundenmail, 'geplant');
  assert.equal(n.ereignis.detail.erstattungNoetigCent, 0);
});

test('Mail abgewählt: keine Mail, aber alles andere läuft; das Protokoll hält die Abwahl fest', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand);
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, { mailSenden: false }), a.deps);

  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'abgewaehlt');
  assert.deepEqual(a.ablauf, ['laden', 'speichern', 'lieferanten']);
  assert.equal(a.mails.length, 0);
  assert.equal(a.gespeichert[0]!.nutzlast.ereignis.detail.kundenmail, 'abgewaehlt');
});

test('ohne E-Mail-Adresse: keine Mail, Hinweis an den Betreiber', async () => {
  const stand = await standMitHoodies({ email: null });
  const a = attrappe(stand);
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand), a.deps);

  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'keine-adresse');
  assert.equal(a.mails.length, 0);
  assert.match(r.probleme.join(' '), /keine E-Mail-Adresse/);
  assert.equal(a.gespeichert[0]!.nutzlast.ereignis.detail.kundenmail, 'keine-adresse');
});

test('Mail scheitert: Änderung bleibt gespeichert, der Betreiber erfährt es, das Protokoll bekommt den Fehlschlag', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand, { mail: async () => ({ success: false, error: 'Domain nicht verifiziert' }) });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand), a.deps);

  assert.equal(r.ok, true, 'die gespeicherte Änderung wird durch einen Mailfehler nicht ungültig');
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'fehlgeschlagen');
  assert.match(r.probleme.join(' '), /NICHT|nicht versendet|nicht.*versendet werden/i);
  assert.deepEqual(a.ablauf, ['laden', 'speichern', 'mail', 'mailprotokoll', 'lieferanten']);
  assert.equal(a.protokolliert.length, 1);

  const wirftMail = attrappe(stand, {
    mail: async () => {
      throw new Error('Netz weg');
    },
  });
  const r2 = await wendeAenderungAn('order-1', await anfrageFuer(stand), wirftMail.deps);
  assert.equal(r2.ok, true);
  if (r2.ok) assert.equal(r2.kundenmail, 'fehlgeschlagen');
  assert.equal(wirftMail.protokolliert[0]!.status, 'rejected');
});

test('Lieferanten-Angleichung scheitert: Änderung und Mail bleiben, der Betreiber bekommt einen Hinweis', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand, {
    lieferanten: async () => {
      throw new Error('boom');
    },
  });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand), a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'gesendet');
  assert.match(r.probleme.join(' '), /Lieferantenaufträge/);
});

// ═══════════════════════════════════════════════════════════════════════
// Ablehnungen: dann ist NICHTS gespeichert und NICHTS versendet
// ═══════════════════════════════════════════════════════════════════════

async function nichtsPassiert(a: Attrappe) {
  assert.equal(a.gespeichert.length, 0, 'nichts gespeichert');
  assert.equal(a.mails.length, 0, 'nichts versendet');
  assert.ok(!a.ablauf.includes('lieferanten'), 'Lieferanten unberührt');
}

test('Speichern scheitert (Stand hat sich geändert): keine Mail, keine Lieferanten-Angleichung', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand, { speichern: { ok: false, grund: 'stand-geaendert', meldung: 'hat sich geändert' } });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand), a.deps);

  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.grund, 'stand-geaendert');
  assert.deepEqual(a.ablauf, ['laden', 'speichern'], 'nach dem Fehlschlag geschieht nichts mehr');
  assert.equal(a.mails.length, 0);
});

test('ohne Grund wird nichts gespeichert', async () => {
  const stand = await standMitHoodies();
  for (const begruendung of ['', '  ', 'ab']) {
    const a = attrappe(stand);
    const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, { begruendung }), a.deps);
    assert.equal(r.ok, false);
    if (!r.ok) assert.equal(r.grund, 'ungueltige-aenderung');
    assert.deepEqual(a.ablauf, [], 'nicht einmal geladen');
    await nichtsPassiert(a);
  }
  const zuLang = attrappe(stand);
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, { begruendung: 'x'.repeat(501) }), zuLang.deps);
  assert.equal(r.ok, false);
});

test('weicht die Summe von der Vorschau ab, wird nichts gespeichert', async () => {
  const stand = await standMitHoodies();
  const vorschau = await anfrageFuer(stand);
  for (const erwartet of [
    { altCent: vorschau.erwartet.altCent + 1, neuCent: vorschau.erwartet.neuCent },
    { altCent: vorschau.erwartet.altCent, neuCent: vorschau.erwartet.neuCent - 100 },
  ]) {
    const a = attrappe(stand);
    const r = await wendeAenderungAn('order-1', { ...vorschau, erwartet }, a.deps);
    assert.equal(r.ok, false);
    if (!r.ok) {
      assert.equal(r.grund, 'vorschau-veraltet');
      assert.match(r.meldung, /Vorschau neu berechnen/);
    }
    await nichtsPassiert(a);
  }
});

test('fehlende Bestätigungen: bezahlt + Rechnung + bestellte Ware verlangen alle drei', async () => {
  const stand = await standMitHoodies({ paymentStatus: 'paid', paymentMethod: 'card', invoiceNumber: 'RE-2026-000001' }, ['ordered']);
  const vorschau = await anfrageFuer(stand);
  assert.deepEqual([...vorschau.bestaetigungen].sort(), ['erstattung-manuell', 'rechnung-korrektur', 'ware-bereits-bestellt']);

  // Keine einzige.
  const a = attrappe(stand);
  const r = await wendeAenderungAn('order-1', { ...vorschau, bestaetigungen: [] }, a.deps);
  assert.equal(r.ok, false);
  if (!r.ok) {
    assert.equal(r.grund, 'bestaetigung-fehlt');
    assert.match(r.meldung, /Rechnungskorrektur/);
    assert.match(r.meldung, /Teilerstattung/);
    assert.match(r.meldung, /bereits bestellte Ware/);
  }
  await nichtsPassiert(a);

  // Zwei von drei genügen nicht.
  const b = attrappe(stand);
  const r2 = await wendeAenderungAn('order-1', { ...vorschau, bestaetigungen: ['rechnung-korrektur', 'erstattung-manuell'] }, b.deps);
  assert.equal(r2.ok, false);
  await nichtsPassiert(b);

  // Alle drei: gespeichert; die offene Erstattung steht im Ergebnis UND im Protokoll, erstattet wird nichts automatisch.
  const c = attrappe(stand);
  const r3 = await wendeAenderungAn('order-1', vorschau, c.deps);
  assert.equal(r3.ok, true);
  if (!r3.ok) return;
  assert.equal(r3.erstattungNoetigCent, r3.differenzCent);
  assert.ok(r3.erstattungNoetigCent > 0);
  assert.equal(r3.rechnungKorrekturNoetig, true);
  const detail = c.gespeichert[0]!.nutzlast.ereignis.detail;
  assert.equal(detail.erstattungNoetigCent, r3.differenzCent);
  assert.equal(detail.rechnungsnummer, 'RE-2026-000001');
  assert.deepEqual(c.mails[0]!.daten.rechnung, { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000001' });
  assert.equal(c.mails[0]!.daten.zahlung, 'bezahlt');
});

test('unzulässige Bestellungen kommen nie bis zum Speichern', async () => {
  const faelle: Parameters<typeof gespeicherterStand>[1][] = [
    { status: 'in_production' },
    { status: 'shipped' },
    { status: 'cancelled' },
    { paymentStatus: 'pending' },
    { paymentStatus: 'failed' },
    { orderType: 'inquiry' },
  ];
  for (const f of faelle) {
    const stand = await standMitHoodies(f);
    const vorlage = await standMitHoodies();
    const a = attrappe(stand);
    const r = await wendeAenderungAn(
      'order-1',
      { ...(await anfrageFuer(vorlage)), bestaetigungen: [] },
      a.deps
    );
    assert.equal(r.ok, false, JSON.stringify(f));
    await nichtsPassiert(a);
  }
});

test('unbekannte Bestellung und Ladefehler: nichts passiert', async () => {
  const a = attrappe(null);
  const r = await wendeAenderungAn(
    'x',
    { aenderungen: EINE_VERRINGERUNG, begruendung: 'Grund', mailSenden: true, bestaetigungen: [], erwartet: { altCent: 1, neuCent: 0 } },
    a.deps
  );
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.grund, 'nicht-gefunden');
  await nichtsPassiert(a);
});

// ═══════════════════════════════════════════════════════════════════════
// Wächter am Quelltext: was der Ablauf NICHT tun darf
// ═══════════════════════════════════════════════════════════════════════

const SERVICE = readFileSync(path.join(process.cwd(), 'src', 'lib', 'orders', 'orderEditService.ts'), 'utf8');
const ACTIONS = readFileSync(path.join(process.cwd(), 'src', 'lib', 'actions', 'orderEditActions.ts'), 'utf8');

/** Quelltext ohne Kommentare – geprüft wird Code, nicht die Erklärung, warum etwas NICHT geschieht. */
function ohneKommentare(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

test('Wächter: der Ablauf erstattet nichts, baut keine Rechnung selbst (nur über orderInvoiceReplacement) und fasst die Buchhaltungs-Markierung nicht an', () => {
  const code = ohneKommentare(SERVICE);
  for (const verboten of [
    /stelleErstattungSicher/,
    /refundService/,
    /\berstatte\s*\(/,
    /paymentService/,
    /erzeugeRechnung/,
    /waehleRechnungsAnbieter/,
    /lexware/i,
    /accounting_ready_at/,
    /invoice_pdf_url/,
    /removeProductionFiles/,
    /\.delete\(\)/,
  ]) {
    assert.doesNotMatch(code, verboten, `der Änderungsablauf darf „${verboten}“ nicht berühren`);
  }
});

test('Wächter: die Mail wird erst NACH dem Speichern angestoßen, nie davor', () => {
  const code = ohneKommentare(SERVICE);
  const speichern = code.indexOf('await deps.speichere(');
  const mail = code.indexOf('deps.sendeKundenmail(');
  assert.ok(speichern > 0 && mail > 0);
  assert.ok(speichern < mail, 'E-Mail darf erst nach der gespeicherten Änderung rausgehen');
  assert.match(code, /if \(!gespeichert\.ok\) \{\s*return/, 'bei einem Speicherfehler endet der Ablauf vor der Mail');
});

test('Wächter: der Ablauf schreibt nicht direkt in order_items/orders – nur über die atomare Datenbankfunktion', () => {
  const code = ohneKommentare(SERVICE);
  assert.match(code, /rpc\('aendere_bestellpositionen'/);
  for (const tabelle of ['orders', 'order_items', 'configuration_elements']) {
    assert.doesNotMatch(code, new RegExp(`from\\('${tabelle}'\\)[\\s\\S]{0,80}\\.(insert|update|delete|upsert)\\(`), `Direktschreibzugriff auf ${tabelle}`);
  }
});

test('Wächter: jede Server Action prüft zuerst die Admin-Berechtigung', () => {
  const funktionen = [...ACTIONS.matchAll(/export async function (\w+)\(/g)];
  assert.equal(
    funktionen.length,
    4,
    'berechneAuftragsaenderung, wendeAuftragsaenderungAn, erzeugeErsatzrechnungNeu, vermerkeErstattungVonHand'
  );
  const fachaufrufe = [
    'liesAenderungen(',
    'erstelleAenderungsVorschau(',
    'wendeAenderungAn(',
    'erzeugeErsatzrechnungNach(',
    'vermerkeManuelleErstattung(',
  ];
  for (const f of funktionen) {
    const ab = ACTIONS.slice(f.index!);
    const rumpf = ab.slice(0, ab.indexOf('\n}\n'));
    const admin = rumpf.indexOf('istAdmin()');
    assert.ok(admin > 0, `${f[1]}: ohne Berechtigungsprüfung`);
    const ersterFachaufruf = Math.min(...fachaufrufe.map((a) => rumpf.indexOf(a)).filter((i) => i >= 0));
    assert.ok(admin < ersterFachaufruf, `${f[1]}: die Berechtigung muss VOR jedem Fachaufruf geprüft werden`);
    assert.match(rumpf.slice(admin, admin + 80), /return \{ ok: false, meldung: 'Nicht angemeldet\.' \}/, `${f[1]}: ohne Anmeldung sofort abbrechen`);
  }
  assert.match(ACTIONS, /^'use server';/);
});

test('Wächter: Server Action liest die Browser-Eingabe als unvertrauenswürdig und verwirft unbekannte Bestätigungen', () => {
  assert.match(ACTIONS, /liesAenderungen\(/);
  assert.match(ACTIONS, /BESTAETIGUNGEN\.includes/);
  assert.match(ACTIONS, /UUID\.test\(orderId\)/);
});

test('Wächter: die Datenbankfunktion ist atomar, sperrt, schützt vor veralteter Vorschau und ist nicht öffentlich', () => {
  const sql = readFileSync(path.join(process.cwd(), 'supabase', 'migrations', '0038_bestellpositionen_aendern.sql'), 'utf8');
  const code = sql.replace(/^\s*--.*$/gm, '');
  assert.match(code, /create or replace function public\.aendere_bestellpositionen/);
  assert.match(code, /for update/i, 'Bestellung und Positionen werden gesperrt');
  assert.match(code, /aenderung_abgelehnt:stand-geaendert/);
  assert.match(code, /insert into public\.order_events/, 'Historie in derselben Transaktion');
  assert.match(code, /revoke all on function public\.aendere_bestellpositionen\(uuid, jsonb\) from public, anon, authenticated/);
  // Rechnung, Zahlung, Erstattung, Speicher und Buchhaltungs-Cursor liegen außerhalb dieser Funktion.
  for (const verboten of [/invoice_/, /refund_/, /accounting_ready_at/, /payment_status\s*=\s*'/, /storage\./, /delete from public\.orders/]) {
    // payment_status wird nur GELESEN/verglichen, nie gesetzt.
    assert.doesNotMatch(code.replace(/v_order\.payment_status is distinct from[^\n]*\n/g, '').replace(/invoice_number is distinct from[^\n]*\n/g, ''), verboten, `Migration berührt ${verboten}`);
  }
});

test('Wächter: die Detailseite bindet Bearbeitung und offene Erstattung ein und leitet beides serverseitig her', () => {
  const seite = readFileSync(path.join(process.cwd(), 'src', 'app', 'admin', 'bestellung', '[id]', 'page.tsx'), 'utf8');
  assert.match(seite, /<OrderEditControl/);
  assert.match(seite, /<OffeneErstattung/);
  assert.match(seite, /pruefeAenderbarkeit\(/);
  assert.match(seite, /berechneOffeneErstattungCent\(/);
  assert.match(seite, /offeneErstattungCent=\{offeneErstattungCent\}/, 'auch die Stornierung warnt vor der offenen Differenz');
});

// ═══════════════════════════════════════════════════════════════════════
// Ersatzrechnung (Migration 0039): neue Rechnung nach der Änderung
// ═══════════════════════════════════════════════════════════════════════

async function standMitRechnung(ueberschreibungen: Parameters<typeof gespeicherterStand>[1] = {}) {
  return standMitHoodies({ invoiceNumber: 'RE-2026-000007', invoiceDate: '2026-11-20', ...ueberschreibungen });
}

test('Ersatzrechnung: erst speichern, dann neue Rechnung, dann Mail MIT PDF-Anhang – in dieser Reihenfolge', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, { ersatzMoeglich: true });
  const anfrage = await anfrageFuer(stand, {}, { ersatzMoeglich: true });
  const r = await wendeAenderungAn('order-1', anfrage, a.deps);

  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(a.ablauf, ['laden', 'speichern', 'ersatzrechnung', 'mail', 'mailprotokoll', 'lieferanten']);
  assert.deepEqual(a.ersaetze, [{ orderId: 'order-1', alteNummer: 'RE-2026-000007' }]);
  assert.deepEqual(r.rechnung, { status: 'ersetzt', neueNummer: 'RE-2026-000099', alteNummer: 'RE-2026-000007' });

  // Die Mail nennt neue UND ersetzte Rechnung und trägt das PDF.
  assert.equal(a.mails.length, 1);
  assert.deepEqual(a.mails[0]!.daten.rechnung, {
    art: 'ersetzt',
    neueRechnungsnummer: 'RE-2026-000099',
    alteRechnungsnummer: 'RE-2026-000007',
    alteRechnungsdatum: '2026-11-20',
  });
  assert.equal(a.mails[0]!.rechnung?.rechnungsnummer, 'RE-2026-000099');
  assert.ok(a.mails[0]!.rechnung && a.mails[0]!.rechnung.pdf.length > 0);
  assert.deepEqual(r.probleme, []);
  assert.deepEqual(r.hinweise, []);
});

test('Ersatzrechnung: Die Änderung trägt den Auftrag dazu atomar im Ereignis (rechnungErsatz, alte Nummer)', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, { ersatzMoeglich: true });
  await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), a.deps);
  const detail = a.gespeichert[0]!.nutzlast.ereignis.detail;
  assert.equal(detail.rechnungErsatz, 'automatisch');
  assert.equal(detail.rechnungsnummer, 'RE-2026-000007');
  assert.equal(detail.kundenmail, 'geplant');
});

test('Ersatzrechnung: Mit der automatischen Rechnung entfällt die Bestätigung „Rechnungskorrektur“', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, { ersatzMoeglich: true });
  const v = await erstelleAenderungsVorschau('order-1', EINE_VERRINGERUNG, a.deps);
  assert.equal(v.ok, true);
  if (!v.ok) return;
  assert.equal(v.vorschau.rechnungErsatz, 'automatisch');
  assert.ok(!v.vorschau.bestaetigungen.includes('rechnung-korrektur'));
  assert.match(v.vorschau.hinweise.join(' '), /NEUE Rechnung/);
  assert.match(v.vorschau.hinweise.join(' '), /der Kundschaft mit der Mail geschickt/);
  assert.match(v.vorschau.hinweise.join(' '), /Buchhaltungs-App übernimmt die neue Rechnung nicht von selbst/);
  // Der Wortlaut der Vorschau-Mail kommt aus derselben Datenbasis: Rechnung hängt an.
  assert.match(v.vorschau.kundenmail.text, /MAILTEXT/);
});

test('Ersatzrechnung: Ohne vorhandene Rechnung wird nichts ersetzt – sie entsteht später mit den neuen Beträgen', async () => {
  const stand = await standMitHoodies();
  const a = attrappe(stand, { ersatzMoeglich: true });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.rechnung, { status: 'keine' });
  assert.equal(a.ersaetze.length, 0);
  assert.deepEqual(a.mails[0]!.daten.rechnung, { art: 'entsteht' });
  assert.equal(a.gespeichert[0]!.nutzlast.ereignis.detail.rechnungErsatz, 'keine');
});

test('Ersatzrechnung: Kann das System keine erzeugen (anderer Anbieter), bleibt es bei der manuellen Korrektur mit Bestätigung', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, { ersatzMoeglich: false });
  const anfrage = await anfrageFuer(stand, {}, { ersatzMoeglich: false });
  assert.deepEqual(anfrage.bestaetigungen, ['rechnung-korrektur']);
  const r = await wendeAenderungAn('order-1', anfrage, a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(r.rechnung, { status: 'manuell' });
  assert.equal(a.ersaetze.length, 0);
  assert.equal(a.gespeichert[0]!.nutzlast.ereignis.detail.rechnungErsatz, 'manuell');
  assert.deepEqual(a.mails[0]!.daten.rechnung, { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000007' });
});

test('Ersatzrechnung: Der manuelle Klärungsfall der ersten Rechnung verhindert den automatischen Ersatz', async () => {
  const stand = await standMitRechnung({ rechnungUnklarerZustand: true });
  const a = attrappe(stand, { ersatzMoeglich: true });
  const v = await erstelleAenderungsVorschau('order-1', EINE_VERRINGERUNG, a.deps);
  assert.equal(v.ok, true);
  if (v.ok) {
    assert.equal(v.vorschau.rechnungErsatz, 'manuell');
    assert.ok(v.vorschau.bestaetigungen.includes('rechnung-korrektur'));
  }
});

test('Ersatzrechnung scheitert: Änderung bleibt gespeichert, „neue Rechnung fehlt“ wird gemeldet, die Mail geht OHNE Anhang mit „folgt separat“', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, {
    ersatzMoeglich: true,
    ersatz: async () => ({ ok: false, grund: 'fehler', meldung: 'PDF-Rendering fehlgeschlagen.' }),
  });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), a.deps);

  assert.equal(r.ok, true, 'die gespeicherte Änderung wird durch den Rechnungsfehler nicht ungültig');
  if (!r.ok) return;
  assert.equal(r.rechnung.status, 'fehlgeschlagen');
  assert.match(r.probleme.join(' '), /NEUE RECHNUNG FEHLT/);
  assert.match(r.probleme.join(' '), /bitte unter „Ersatzrechnung“ erneut erzeugen/);
  assert.match(r.probleme.join(' '), /Rechnung RE-2026-000007 gilt bis dahin für den alten Stand/);
  assert.deepEqual(a.ablauf, ['laden', 'speichern', 'ersatzrechnung', 'mail', 'mailprotokoll', 'lieferanten']);
  assert.equal(a.mails[0]!.rechnung, null, 'ohne Rechnung kein Anhang');
  assert.deepEqual(a.mails[0]!.daten.rechnung, { art: 'folgt-separat', rechnungsnummer: 'RE-2026-000007' });
  assert.match(r.hinweise.join(' '), /ohne die neue Rechnung rausgegangen/);
});

test('Ersatzrechnung wirft: wie ein Fehlschlag behandelt, nichts bricht ab', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, {
    ersatzMoeglich: true,
    ersatz: async () => {
      throw new Error('Datenbank weg');
    },
  });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), a.deps);
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.rechnung.status, 'fehlgeschlagen');
    assert.equal(r.kundenmail, 'gesendet');
  }
});

test('Ersatzrechnung: Mail abgewählt → keine Mail, die Rechnung entsteht trotzdem und steht zum Download bereit', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, { ersatzMoeglich: true });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, { mailSenden: false }, { ersatzMoeglich: true }), a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.deepEqual(a.ablauf, ['laden', 'speichern', 'ersatzrechnung', 'lieferanten']);
  assert.equal(a.mails.length, 0);
  assert.equal(r.rechnung.status, 'ersetzt');
  assert.match(r.hinweise.join(' '), /NICHT an die Kundschaft gegangen/);
  assert.match(r.hinweise.join(' '), /RE-2026-000099/);
  assert.match(r.hinweise.join(' '), /Download/);
});

test('Ersatzrechnung: Ohne E-Mail-Adresse ebenfalls – Rechnung entsteht, Hinweis auf den Download', async () => {
  const stand = await standMitRechnung({ email: null });
  const a = attrappe(stand, { ersatzMoeglich: true });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.kundenmail, 'keine-adresse');
  assert.equal(r.rechnung.status, 'ersetzt');
  assert.match(r.hinweise.join(' '), /NICHT an die Kundschaft gegangen/);
});

test('Ersatzrechnung: Wird nicht gespeichert, wird auch keine Rechnung erzeugt', async () => {
  const stand = await standMitRechnung();
  const a = attrappe(stand, { ersatzMoeglich: true, speichern: { ok: false, grund: 'stand-geaendert', meldung: 'x' } });
  const r = await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), a.deps);
  assert.equal(r.ok, false);
  assert.equal(a.ersaetze.length, 0, 'keine Rechnung ohne gespeicherte Änderung');
  assert.deepEqual(a.ablauf, ['laden', 'speichern']);

  // Auch bei fehlendem Grund, veralteter Summe oder unzulässigem Zustand: nichts.
  for (const teil of [{ begruendung: '' }, { erwartet: { altCent: 1, neuCent: 2 } }]) {
    const b = attrappe(stand, { ersatzMoeglich: true });
    const anfrage = await anfrageFuer(stand, teil, { ersatzMoeglich: true });
    assert.equal((await wendeAenderungAn('order-1', anfrage, b.deps)).ok, false);
    assert.equal(b.ersaetze.length, 0);
  }
  const c = attrappe(await standMitRechnung({ status: 'in_production' }), { ersatzMoeglich: true });
  assert.equal((await wendeAenderungAn('order-1', await anfrageFuer(stand, {}, { ersatzMoeglich: true }), c.deps)).ok, false);
  assert.equal(c.ersaetze.length, 0);
});

test('Ersatzrechnung bei bezahlter Bestellung: neue Rechnung ja, Erstattung bleibt manuell (rote Differenz, Bestätigung)', async () => {
  const stand = await standMitRechnung({ paymentStatus: 'paid', paymentMethod: 'card' });
  const a = attrappe(stand, { ersatzMoeglich: true });
  const anfrage = await anfrageFuer(stand, {}, { ersatzMoeglich: true });
  assert.deepEqual(anfrage.bestaetigungen, ['erstattung-manuell'], 'nur die Erstattung ist noch zu bestätigen');

  const r = await wendeAenderungAn('order-1', anfrage, a.deps);
  assert.equal(r.ok, true);
  if (!r.ok) return;
  assert.equal(r.rechnung.status, 'ersetzt');
  assert.equal(a.ersaetze.length, 1);
  assert.ok(r.erstattungNoetigCent > 0);
  assert.equal(a.gespeichert[0]!.nutzlast.ereignis.detail.erstattungNoetigCent, r.differenzCent);
  assert.equal(a.mails[0]!.daten.zahlung, 'bezahlt');

  // Ohne die Erstattungs-Bestätigung wird weder gespeichert noch eine Rechnung erzeugt.
  const b = attrappe(stand, { ersatzMoeglich: true });
  const ohne = await wendeAenderungAn('order-1', { ...anfrage, bestaetigungen: [] }, b.deps);
  assert.equal(ohne.ok, false);
  assert.equal(b.ersaetze.length, 0);
});

test('Wächter: Die Ersatzrechnung wird erst nach dem Speichern und vor der Mail angestoßen', () => {
  const code = ohneKommentare(SERVICE);
  const speichern = code.indexOf('await deps.speichere(');
  const ersatz = code.indexOf('deps.ersetzeRechnung(');
  const mail = code.indexOf('deps.sendeKundenmail(');
  assert.ok(speichern > 0 && ersatz > speichern && mail > ersatz, 'Reihenfolge: speichern → Ersatzrechnung → Mail');
  assert.match(code, /rechnungAnhang/, 'das PDF fließt in die Mail');
});
