/**
 * Regressionstest für den Fund vom 2026-09-04: docs/betriebsbeobachtung.md
 * Abschnitt 3 ("Was in die Tabelle geht") verspricht acht kritische
 * Ereignistypen in system_ereignisse. Tatsächlich erreichten nur "Bestellung
 * fehlgeschlagen" und "Upload abgewiesen" (orders.ts/orderService.ts) die
 * Tabelle – die übrigen sechs liefen ausschließlich über console.* oder
 * protokoll.* (nur das flüchtige Plattformprotokoll) oder gar keine
 * Protokollierung.
 *
 * Gleiche Teststrategie wie bestellnummerArchitektur.test.ts: Quelltext-
 * Prüfung statt Mocking des Supabase-Clients – diese Dateien sind reine
 * DB-/Netzwerk-Geschäftslogik, kein sinnvoller Ort für Unit-Tests mit echten
 * Rückgabewerten.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { RANG, PERSISTENZ_AB, bereinige } from '../log';

function lies(...teile: string[]): string {
  return readFileSync(path.join(process.cwd(), ...teile), 'utf8');
}

// ── Zahlung fehlgeschlagen (PAYMENT) ─────────────────────────────────────

test('paymentService.ts importiert meldeEreignis und meldet alle neun echten Zahlungsfehlschlagsstellen', () => {
  const quelltext = lies('src', 'lib', 'orders', 'paymentService.ts');
  assert.match(quelltext, /import \{ meldeEreignis \} from '@\/lib\/observability\/ereignis';/);

  const erwarteteEreignisse = [
    'zahlbetrag_abgelehnt',
    'zahlungsanbieter_auswahl_fehlgeschlagen',
    'alter_zahlungsvorgang_nicht_verworfen',
    'zahlungsvorgang_nicht_eroeffnet',
    'zahlungszustand_nicht_gespeichert',
    'zahlungsereignis_bestellung_nicht_ladbar',
    'zahlungsbetrag_abweichung',
    'zahlungsbestaetigung_nicht_gespeichert',
    'zahlungsfehlschlag_nicht_gespeichert',
  ];
  for (const ereignis of erwarteteEreignisse) {
    assert.match(
      quelltext,
      new RegExp(`ereignis: '${ereignis}'`),
      `meldeEreignis-Aufruf für '${ereignis}' fehlt in paymentService.ts`
    );
  }

  // Die beiden mit tatsächlicher Geldbetroffenheit (Zahlung beim Anbieter
  // bereits erfolgt/abweichend, DB-Verbuchung schlägt fehl) müssen CRITICAL
  // sein, nicht nur ERROR – sonst geht die Häufungsauswertung im Adminbereich
  // von der falschen Dringlichkeit aus.
  for (const kritisch of ['zahlungszustand_nicht_gespeichert', 'zahlungsbetrag_abweichung', 'zahlungsbestaetigung_nicht_gespeichert']) {
    const index = quelltext.indexOf(`ereignis: '${kritisch}'`);
    assert.ok(index > 0, `${kritisch} nicht gefunden`);
    const block = quelltext.slice(Math.max(0, index - 200), index);
    assert.match(block, /schwere: 'CRITICAL'/, `${kritisch} muss CRITICAL sein (Geldbetroffenheit)`);
  }

  // Reine Idempotenz-/Ablauf-Meldungen (console.info) bleiben bewusst
  // unverändert – sie sind kein Fehlschlag und gehören nicht in die Tabelle.
  assert.match(quelltext, /console\.info\(`\[zahlung\] Ereignis \$\{ereignis\.ereignisId\} bereits verarbeitet/);
});

/**
 * Verhaltensbasierte Ergänzung zur Quelltext-Prüfung oben (Fund aus der
 * Arbeitsstand-Konsolidierung vom 2026-09-04): Ob meldeEreignis() im ECHTEN
 * Fehlerpfad (z.B. ein tatsächlich scheiterndes Supabase-UPDATE nach
 * bestätigter Zahlung) tatsächlich AUSGELÖST wird, ließe sich nur gegen die
 * echte Datenbank oder mit einem Mock des Supabase-Clients prüfen – beides
 * widerspricht der etablierten Teststrategie dieses Projekts (kein Mocking
 * von Supabase, siehe Kopfkommentar; echte DB-Läufe sind laut
 * docs/betriebsbeobachtung.md Abschnitt 5 bewusst ein manueller Schritt vor
 * jeder Auslieferung, kein Teil von `npm test`). Eine neue Testkategorie nur
 * dafür aufzubauen wäre unverhältnismäßig.
 *
 * Was sich OHNE neue Infrastruktur und OHNE Mocking echt (nicht nur als
 * Zeichenkettenvergleich) prüfen lässt, und was die beiden Tests unten
 * abdecken:
 *  1. Die tatsächliche Schweregrad-Rangfolge aus log.ts (RANG/PERSISTENZ_AB,
 *     dieselben Exporte, die meldeEreignis() selbst zur Persistenzentscheidung
 *     nutzt) bestätigt, dass CRITICAL/ERROR/WARNING – die drei in
 *     paymentService.ts verwendeten Stufen – JETZT tatsächlich über die
 *     Persistenzschwelle liegen. Verschöbe eine künftige Änderung an
 *     PERSISTENZ_AB diese Schwelle nach oben, schlägt dieser Test an, statt
 *     dass die neun Aufrufe stillschweigend aus system_ereignisse fielen.
 *  2. Die echte Bereinigungsfunktion bereinige() (keine Kopie, kein Mock)
 *     würde eine versehentlich hineingeratene E-Mail-Adresse tatsächlich
 *     schwärzen – UND die neun Aufrufstellen selbst übergeben strukturell
 *     nichts, das eine E-Mail-Adresse enthalten könnte (nur UUIDs,
 *     Anbieter-Referenzen und Centbeträge, nie `email`/`kunde`-Felder).
 */
test('Schweregrade CRITICAL/ERROR/WARNING aus paymentService.ts liegen laut der echten log.ts-Rangfolge tatsächlich über der Persistenzschwelle', () => {
  for (const schwere of ['CRITICAL', 'ERROR', 'WARNING'] as const) {
    assert.ok(
      RANG[schwere] >= RANG[PERSISTENZ_AB],
      `${schwere} (Rang ${RANG[schwere]}) müsste ab PERSISTENZ_AB ('${PERSISTENZ_AB}', Rang ${RANG[PERSISTENZ_AB]}) tatsächlich in system_ereignisse persistiert werden`
    );
  }
});

test('die neun meldeEreignis-Aufrufe in paymentService.ts übergeben strukturell keine E-Mail-Adresse, und die echte Bereinigung würde eine versehentliche ohnehin schwärzen', () => {
  const quelltext = lies('src', 'lib', 'orders', 'paymentService.ts');
  const meldeEreignisBloecke = quelltext.match(/await meldeEreignis\(\{[\s\S]*?\n\s*\}\);/g) ?? [];
  assert.equal(meldeEreignisBloecke.length, 9, `erwarte genau neun meldeEreignis-Aufrufe, gefunden: ${meldeEreignisBloecke.length}`);
  for (const block of meldeEreignisBloecke) {
    assert.doesNotMatch(block, /\b(email|kunde|customer)\b/i, `meldeEreignis-Aufruf verweist auf ein potenziell personenbezogenes Feld: ${block}`);
  }

  // Die echte, in log.ts implementierte Bereinigung – nicht nachgebaut, nicht
  // gemockt – schwärzt eine E-Mail-Adresse tatsächlich, bevor sie irgendwohin
  // geschrieben wird. Selbst falls sich die Annahme oben (keine E-Mail
  // erreicht meldeEreignis) je als falsch herausstellt, greift diese zweite,
  // unabhängige Schutzschicht nachweislich.
  assert.equal(
    bereinige('Zahlung für kunde@example.de fehlgeschlagen, Betrag 4999 Cent'),
    'Zahlung für [email] fehlgeschlagen, Betrag 4999 Cent'
  );
});

// ── Cron fehlgeschlagen (CRON) ────────────────────────────────────────────

test('process-supplier-orders/route.ts meldet jeden Fehlschlagspfad (Hauptlauf, vier Retry-Schritte, Wartung) über meldeEreignis', () => {
  const quelltext = lies('src', 'app', 'api', 'cron', 'process-supplier-orders', 'route.ts');
  assert.match(quelltext, /import \{ meldeEreignis \} from '@\/lib\/observability\/ereignis';/);

  const erwarteteEreignisse = [
    'lieferantenverarbeitung_fehlgeschlagen', // Hauptlauf, vorher komplett ungefangen
    'abschluss_retry_fehlgeschlagen',
    'rechnungs_retry_fehlgeschlagen',
    'erstattungs_retry_fehlgeschlagen',
    'bestaetigungs_retry_fehlgeschlagen',
    'aufraeumen_fehlgeschlagen',
  ];
  for (const ereignis of erwarteteEreignisse) {
    assert.match(
      quelltext,
      new RegExp(`kategorie: 'CRON',\\s*ereignis: '${ereignis}'`),
      `meldeEreignis-Aufruf für '${ereignis}' fehlt`
    );
  }
  // 'aufraeumen_fehlgeschlagen' tritt an ZWEI Stellen auf (RPC-Fehler und
  // Catch-Block von raeumeAuf) – beide müssen jetzt melden.
  const aufraeumenTreffer = quelltext.match(/kategorie: 'CRON',\s*ereignis: 'aufraeumen_fehlgeschlagen'/g) ?? [];
  assert.equal(aufraeumenTreffer.length, 2, 'aufraeumen_fehlgeschlagen muss an beiden Fehlerpfaden von raeumeAuf() melden');
});

// ── E-Mail nicht versandt (EMAIL) ─────────────────────────────────────────

test('sendEmail.ts meldet fehlenden API-Key, Versandfehler und Renderfehler über meldeEreignis', () => {
  const quelltext = lies('src', 'lib', 'email', 'sendEmail.ts');
  assert.match(quelltext, /import \{ meldeEreignis \} from '@\/lib\/observability\/ereignis';/);
  assert.match(quelltext, /kategorie: 'EMAIL',\s*\n\s*ereignis: 'versand_fehlgeschlagen',\s*\n\s*meldung: 'RESEND_API_KEY fehlt'/);
  const versandFehlgeschlagenTreffer = quelltext.match(/ereignis: 'versand_fehlgeschlagen'/g) ?? [];
  assert.equal(
    versandFehlgeschlagenTreffer.length,
    3,
    'versand_fehlgeschlagen muss an drei Stellen gemeldet werden: fehlender API-Key, Resend-Fehlerantwort, Catch-Block'
  );
  // Testmodus-Interception (istTestmodus()) bleibt unverändert – kein
  // Fehlschlag, gehört nicht in die Tabelle.
  assert.match(quelltext, /if \(istTestmodus\(\)\) \{/);
});

// ── Rate-Limit ausgelöst (RATE_LIMIT) ─────────────────────────────────────

test('rateLimit.ts meldet nur den tatsächlichen Limit-Treffer, nicht den Fail-open-Fall bei Zähler-Ausfall', () => {
  const quelltext = lies('src', 'lib', 'security', 'rateLimit.ts');
  assert.match(quelltext, /import \{ meldeEreignis \} from '@\/lib\/observability\/ereignis';/);
  const index = quelltext.indexOf("ereignis: 'rate_limit_ausgeloest'");
  assert.ok(index > 0, 'rate_limit_ausgeloest fehlt');
  const block = quelltext.slice(Math.max(0, index - 200), index);
  assert.match(block, /schwere: 'WARNING'/);
  // Die drei Fail-open-Stellen (Zähler nicht erreichbar) melden bewusst
  // NICHT über meldeEreignis – sie sind das Gegenteil eines ausgelösten
  // Limits (Zugriff wird durchgelassen, nicht verweigert).
  const meldeEreignisAufrufe = quelltext.match(/await meldeEreignis\(/g) ?? [];
  assert.equal(meldeEreignisAufrufe.length, 1, 'genau ein meldeEreignis-Aufruf erwartet (nur der echte Limit-Treffer)');
});

// ── Anmeldung fehlgeschlagen (AUTH) ───────────────────────────────────────

test('konto.ts meldet einen fehlgeschlagenen Anmeldeversuch als WARNING, ohne die E-Mail-Adresse zu übergeben', () => {
  const quelltext = lies('src', 'lib', 'actions', 'konto.ts');
  assert.match(quelltext, /import \{ meldeEreignis \} from '@\/lib\/observability\/ereignis';/);
  const start = quelltext.indexOf('export async function anmeldenAction');
  const ende = quelltext.indexOf('\nexport async function abmeldenAction');
  assert.ok(start > 0 && ende > start, 'anmeldenAction nicht gefunden');
  const rumpf = quelltext.slice(start, ende);
  assert.match(
    rumpf,
    /await meldeEreignis\(\{ schwere: 'WARNING', kategorie: 'AUTH', ereignis: 'anmeldung_fehlgeschlagen' \}\);/
  );
  // Kein Identifikator (E-Mail o.ä.) als Argument – anders als das
  // Plattformprotokoll, das sich auf die automatische Bereinigung verlässt,
  // soll hier von vornherein nichts Identifizierendes entstehen.
  assert.doesNotMatch(rumpf, /meldeEreignis\([^)]*email/i);
});

// ── Lieferantenlauf fehlgeschlagen (SUPPLIER) ─────────────────────────────

test('orchestrator.ts meldet Batch-Auswahlfehler, Lock-Reaktivierungsfehler und unerwartete Laufabbrüche', () => {
  const quelltext = lies('src', 'lib', 'suppliers', 'lifecycle', 'orchestrator.ts');
  assert.match(quelltext, /import \{ meldeEreignis \} from '@\/lib\/observability\/ereignis';/);
  const erwarteteEreignisse = [
    'verwaiste_sperren_reaktivierung_fehlgeschlagen',
    'lieferantenlauf_auswahl_fehlgeschlagen',
    'lieferantenlauf_unerwarteter_fehler',
  ];
  for (const ereignis of erwarteteEreignisse) {
    assert.match(quelltext, new RegExp(`ereignis: '${ereignis}'`), `meldeEreignis-Aufruf für '${ereignis}' fehlt`);
  }
  // Der reguläre, retrybare Positions-Fehlschlag (run.outcome==='failed' mit
  // verbleibenden Versuchen) bleibt bewusst NUR in supplier_order_events –
  // sonst würde jeder erwartbare erste Fehlversuch schon die Tabelle füllen.
  const meldeEreignisAufrufe = quelltext.match(/await meldeEreignis\(/g) ?? [];
  assert.equal(meldeEreignisAufrufe.length, 3, 'genau drei meldeEreignis-Aufrufe erwartet (Batch-Ebene + unerwarteter Fehler)');
});
