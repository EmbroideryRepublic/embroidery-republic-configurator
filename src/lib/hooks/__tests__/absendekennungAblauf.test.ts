/**
 * Verhaltenstest (keine reine Quelltext-Prüfung) für den beim Go-Live-
 * Abnahmetest vom 2026-09-01 live reproduzierten Fund: Die im PayPal/Karte-
 * Zweig absichtlich NICHT verworfene Absendekennung (siehe Kopfkommentar
 * useSubmitGuard.ts) hatte keine zeitliche Grenze. Eine Kundschaft, die
 * einen PayPal-Vorgang abbrach und später (in derselben Browser-Sitzung,
 * ohne Neuladen) einen inhaltlich GANZ ANDEREN Einkauf startete, wurde vom
 * Server als Wiederholung der ALTEN Bestellung erkannt – der neue
 * Warenkorb und die neue Zahlungsart gingen dabei verloren.
 *
 * Live reproduziert: Bestellung f5e7385d-84cf-4ab1-9606-816dee0bd76b (PayPal,
 * `pending`) wurde ~4,5 Stunden nach ihrer Anlage erneut getroffen, obwohl
 * zwischenzeitlich ein völlig anderer Warenkorb (anderes Produkt, Zahlungsart
 * "Kauf auf Rechnung") abgeschickt wurde.
 *
 * Ein simples localStorage-Double genügt hier – reine, ungebundene
 * Funktionen ohne React-Zustand.
 */
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { holeOderErzeuge, verwirfGespeicherteKennung, ABSENDEKENNUNG_GUELTIG_MS } from '../useSubmitGuard';

const SCHLUESSEL = 'test-absendekennung';

class SpeicherDouble {
  private daten = new Map<string, string>();
  getItem(k: string): string | null {
    return this.daten.has(k) ? this.daten.get(k)! : null;
  }
  setItem(k: string, v: string): void {
    this.daten.set(k, v);
  }
  removeItem(k: string): void {
    this.daten.delete(k);
  }
}

let echtesFensterObjekt: unknown;
let echteZeit: typeof Date.now;
let jetzt = 1_000_000_000_000; // fester Ausgangspunkt, per jetzt++ vorgespult

beforeEach(() => {
  echtesFensterObjekt = (globalThis as { window?: unknown }).window;
  (globalThis as { window?: unknown }).window = { localStorage: new SpeicherDouble() };
  echteZeit = Date.now;
  jetzt = 1_000_000_000_000;
  Date.now = () => jetzt;
});

afterEach(() => {
  (globalThis as { window?: unknown }).window = echtesFensterObjekt;
  Date.now = echteZeit;
  verwirfGespeicherteKennung(SCHLUESSEL);
});

test('eine frisch erzeugte Kennung wird beim nächsten Aufruf unverändert wiederverwendet', () => {
  const erste = holeOderErzeuge(SCHLUESSEL);
  jetzt += 1000; // eine Sekunde später, weit innerhalb der Gültigkeit
  const zweite = holeOderErzeuge(SCHLUESSEL);
  assert.equal(zweite, erste, 'ein kurz danach erneut auftretender Absendevorgang muss dieselbe Kennung treffen');
});

test('kurz vor Ablauf der Gültigkeitsfrist wird die Kennung noch wiederverwendet', () => {
  const erste = holeOderErzeuge(SCHLUESSEL);
  jetzt += ABSENDEKENNUNG_GUELTIG_MS - 1;
  const zweite = holeOderErzeuge(SCHLUESSEL);
  assert.equal(zweite, erste, 'die Frist muss bis zur letzten Millisekunde gelten, kein verfrühtes Verwerfen');
});

test('nach Ablauf der Gültigkeitsfrist wird eine NEUE Kennung erzeugt (der eigentliche Fix)', () => {
  const erste = holeOderErzeuge(SCHLUESSEL);
  jetzt += ABSENDEKENNUNG_GUELTIG_MS + 1;
  const zweite = holeOderErzeuge(SCHLUESSEL);
  assert.notEqual(
    zweite,
    erste,
    'nach Ablauf muss eine frische Kennung entstehen – sonst würde ein Stunden später inhaltlich neuer ' +
      'Bestellversuch weiterhin als Wiederholung der alten, abgebrochenen Bestellung erkannt (Fund vom 2026-09-01)'
  );
});

test('live reproduzierter Zeitabstand (~4,5 Stunden) liegt sicher jenseits der Gültigkeitsfrist', () => {
  // Kein Kausalzusammenhang zur eigentlichen Logik, sondern eine Leitplanke:
  // ABSENDEKENNUNG_GUELTIG_MS darf nie versehentlich so großzügig konfiguriert
  // werden, dass der real beobachtete Fall wieder durchrutschen würde.
  const beobachteterAbstandMs = 4.5 * 60 * 60_000;
  assert.ok(
    ABSENDEKENNUNG_GUELTIG_MS < beobachteterAbstandMs,
    'die Gültigkeitsfrist muss deutlich unter dem real reproduzierten ~4,5-Stunden-Abstand liegen'
  );
});

test('nach dem Ablauf-Neuaufbau bleibt die neue Kennung ihrerseits stabil wiederverwendbar', () => {
  const erste = holeOderErzeuge(SCHLUESSEL);
  jetzt += ABSENDEKENNUNG_GUELTIG_MS + 1;
  const zweite = holeOderErzeuge(SCHLUESSEL);
  jetzt += 1000;
  const dritte = holeOderErzeuge(SCHLUESSEL);
  assert.equal(dritte, zweite, 'die neu erzeugte Kennung muss ihrerseits normal wiederverwendet werden, kein Dauer-Neuerzeugen');
});
