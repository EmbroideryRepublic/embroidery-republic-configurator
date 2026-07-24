/**
 * ═══════════════════════════════════════════════════════════════════════
 * RATE-LIMIT – die einzige Stelle, die Zugriffe begrenzt
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Jeder Endpunkt ruft `pruefeRateLimit()`. Es gibt keinen zweiten Zähler im
 * Projekt – ein Wächter-Test schlägt an, sobald einer entsteht.
 *
 * ── Zentral, nicht im Prozessspeicher ─────────────────────────────────
 * Der Zähler liegt in der Datenbank (Migration 0017). Auf einer serverlosen
 * Plattform bekommt praktisch jeder Aufruf eine eigene Instanz; ein Zähler
 * im Speicher zählt dann für sich allein und schützt nicht.
 *
 * ── Atomar ────────────────────────────────────────────────────────────
 * Gezählt und geprüft wird in EINER Datenbankanweisung. „Lesen, prüfen,
 * schreiben" aus dem Anwendungscode hätte eine Lücke: Zwei gleichzeitige
 * Anfragen lesen denselben Stand und lassen beide durch.
 *
 * ── Verfügbarkeit vor Sicherheit ──────────────────────────────────────
 * Ist die Datenbank nicht erreichbar, lässt die Prüfung DURCH statt
 * abzuweisen. Ein Ausfall des Zählers soll nicht den ganzen Shop
 * lahmlegen – der Vorfall wird protokolliert. Bewusste Abwägung, siehe
 * docs/rate-limiting.md.
 */
import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';
import { istTestmodus } from '@/config/testmodus';
import { istAdmin } from '@/lib/admin/auth';
import { RATE_LIMITS, type RateLimitName } from '@/config/rateLimits';

export interface RateLimitErgebnis {
  erlaubt: boolean;
  /** Sekunden bis zum nächsten Fenster. Nur gesetzt, wenn abgewiesen. */
  zuruecksetzenIn: number;
  /**
   * Meldung für die Kundschaft. Nennt die Wartezeit, aber weder das Limit
   * noch den Zählerstand – die Grenze soll sich nicht ausmessen lassen.
   */
  meldung: string;
}

const ERLAUBT: RateLimitErgebnis = { erlaubt: true, zuruecksetzenIn: 0, meldung: '' };

/**
 * Die Adresse des Aufrufers.
 *
 * `x-forwarded-for` ist grundsätzlich manipulierbar; auf Vercel setzt die
 * Plattform den Wert selbst und überschreibt eine mitgeschickte Kopfzeile.
 * Bei einem Betreiberwechsel wäre das erneut zu prüfen.
 */
export function ermittleIp(): string {
  const h = headers();
  const weitergeleitet = h.get('x-forwarded-for');
  return weitergeleitet?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unbekannt';
}

/**
 * Kürzt eine Adresse fürs Protokoll.
 *
 * Eine vollständige IP-Adresse ist ein personenbezogenes Datum und hat in
 * einem dauerhaften Protokoll nichts zu suchen. Für die Frage „kommt das
 * gehäuft aus einem Netz?" genügt der gekürzte Teil.
 */
export function kuerzeIp(ip: string): string {
  if (ip.includes(':')) return ip.split(':').slice(0, 3).join(':') + ':…';
  const teile = ip.split('.');
  return teile.length === 4 ? `${teile[0]}.${teile[1]}.${teile[2]}.x` : ip;
}

function meldungFuer(sekunden: number): string {
  const minuten = Math.max(1, Math.ceil(sekunden / 60));
  return `Zu viele Versuche. Bitte versuchen Sie es in ${minuten} ${minuten === 1 ? 'Minute' : 'Minuten'} erneut.`;
}

/**
 * Prüft und zählt einen Zugriff.
 *
 * `merkmal` ist das zweite Unterscheidungsmerkmal (E-Mail, Token) bei
 * Limits, die `ip_und_merkmal` verwenden. Ohne Angabe zählt allein die
 * Adresse.
 */
export async function pruefeRateLimit(name: RateLimitName, merkmal?: string): Promise<RateLimitErgebnis> {
  const limit = RATE_LIMITS[name];

  // ── Ausnahmen ─────────────────────────────────────────────────────
  // Der Testmodus zählt nicht mit: Ein E2E-Lauf würde sonst das Limit für
  // echte Anfragen aufbrauchen.
  if (istTestmodus()) return ERLAUBT;

  // Wer als Betreiber angemeldet ist, hat ohnehin vollen Zugriff. Ihn zu
  // begrenzen schützt niemanden und behindert die Arbeit.
  try {
    if (await istAdmin()) return ERLAUBT;
  } catch {
    // Kein Cookie-Kontext (z.B. Aufruf außerhalb einer Anfrage) – dann
    // gilt das Limit ganz normal.
  }

  const ip = ermittleIp();
  const schluessel =
    limit.merkmal === 'ip_und_merkmal' && merkmal
      ? `${limit.id}:ip:${ip}:m:${merkmal.toLowerCase().slice(0, 120)}`
      : `${limit.id}:ip:${ip}`;

  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc('pruefe_rate_limit', {
      p_schluessel: schluessel,
      p_fenster_sekunden: limit.fensterSekunden,
      p_max: limit.max,
    });

    if (error) {
      console.error(`[ratelimit] Zähler nicht erreichbar (${limit.id}) – Zugriff durchgelassen:`, error.message);
      return ERLAUBT;
    }

    const zeile = Array.isArray(data) ? data[0] : data;
    if (!zeile) {
      console.error(`[ratelimit] Zähler ohne Ergebnis (${limit.id}) – Zugriff durchgelassen.`);
      return ERLAUBT;
    }

    if (zeile.erlaubt) return ERLAUBT;

    // Auffälliges Verhalten festhalten – mit gekürzter Adresse.
    console.warn(
      `[ratelimit] ÜBERSCHRITTEN ${limit.id}: ${kuerzeIp(ip)} bei ${zeile.anzahl} Zugriffen ` +
        `(Grenze ${limit.max} je ${limit.fensterSekunden}s), frei in ${zeile.zuruecksetzen_in}s`
    );

    return {
      erlaubt: false,
      zuruecksetzenIn: zeile.zuruecksetzen_in as number,
      meldung: meldungFuer(zeile.zuruecksetzen_in as number),
    };
  } catch (fehler) {
    console.error(`[ratelimit] Prüfung fehlgeschlagen (${limit.id}) – Zugriff durchgelassen:`, fehler);
    return ERLAUBT;
  }
}
