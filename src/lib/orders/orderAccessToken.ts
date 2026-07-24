/**
 * Signierter Zugriffstoken für die öffentliche Bestellansicht.
 *
 * Der Kunde erhält in der Bestellbestätigung einen Link auf seine
 * Bestellung. Da es (noch) kein Kundenkonto gibt, ersetzt die Signatur die
 * Anmeldung: Nur wer den Link aus der E-Mail hat, sieht die Bestellung.
 *
 * ── Aufbau ────────────────────────────────────────────────────────────
 *   <orderId>.<ablaufZeitstempel>.<HMAC-SHA256 über beides>
 * Base64url-kodiert, damit der Token URL-sicher ist.
 *
 * ── Was der Token NICHT entscheidet ───────────────────────────────────
 * Der Token beweist ausschließlich, dass der Aufrufer den Link kennt. Ob
 * eine STORNIERUNG zulässig ist, entscheidet allein die serverseitige
 * Prüfung von `created_at` gegen die Stornofrist (siehe config/orderProcess).
 * Ein gültiger Token erlaubt daher nie mehr, als die Bestellung anzusehen.
 *
 * ── Warum kein Datenbank-Token ────────────────────────────────────────
 * Eine Tabelle mit Einmal-Tokens bräuchte Aufräumlogik und wäre ein
 * zusätzlicher Zustand, der schiefgehen kann. Die Signatur ist
 * zustandsfrei: Sie gilt, solange das Secret gilt.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { BESTELLANSICHT_TOKEN_GUELTIGKEIT_MS } from '@/config/orderProcess';

/** Fehlerursachen – die Aufrufer unterscheiden sie in der Anzeige. */
export type TokenPruefung =
  | { gueltig: true; orderId: string }
  | { gueltig: false; grund: 'format' | 'signatur' | 'abgelaufen' | 'kein-secret' };

function base64url(input: Buffer): string {
  return input.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function signiere(nutzlast: string, secret: string): string {
  return base64url(createHmac('sha256', secret).update(nutzlast).digest());
}

/** Liest das Secret. Fehlt es, wird bewusst KEIN Fallback erzeugt – ein
 *  geratenes Secret wäre schlimmer als eine klare Fehlfunktion. */
function secret(): string | null {
  const s = process.env.ORDER_TOKEN_SECRET;
  return s && s.length >= 32 ? s : null;
}

/**
 * Erzeugt den Token für eine Bestellung.
 * Gibt null zurück, wenn kein taugliches Secret konfiguriert ist – der
 * Aufrufer verzichtet dann auf den Link, statt einen kaputten zu versenden.
 */
export function erzeugeBestellToken(
  orderId: string,
  jetzt: Date = new Date(),
  gueltigkeitMs: number = BESTELLANSICHT_TOKEN_GUELTIGKEIT_MS
): string | null {
  const s = secret();
  if (!s) return null;
  const ablauf = jetzt.getTime() + gueltigkeitMs;
  const nutzlast = `${orderId}.${ablauf}`;
  return `${base64url(Buffer.from(nutzlast, 'utf8'))}.${signiere(nutzlast, s)}`;
}

/**
 * Prüft einen Token und liefert die Bestell-ID zurück.
 *
 * Die Signatur wird mit `timingSafeEqual` verglichen, damit sich der
 * korrekte Wert nicht über Laufzeitunterschiede erraten lässt.
 */
export function pruefeBestellToken(token: string, jetzt: Date = new Date()): TokenPruefung {
  const s = secret();
  if (!s) return { gueltig: false, grund: 'kein-secret' };

  const teile = token.split('.');
  if (teile.length !== 2) return { gueltig: false, grund: 'format' };

  let nutzlast: string;
  try {
    nutzlast = Buffer.from(teile[0]!.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  } catch {
    return { gueltig: false, grund: 'format' };
  }

  const [orderId, ablaufText] = nutzlast.split('.');
  const ablauf = Number(ablaufText);
  if (!orderId || !Number.isFinite(ablauf)) return { gueltig: false, grund: 'format' };

  const erwartet = Buffer.from(signiere(nutzlast, s));
  const geliefert = Buffer.from(teile[1]!);
  if (erwartet.length !== geliefert.length || !timingSafeEqual(erwartet, geliefert)) {
    return { gueltig: false, grund: 'signatur' };
  }

  // Signatur zuerst prüfen, dann Ablauf: Sonst verriete die Fehlermeldung
  // bei manipulierter Ablaufzeit, dass die Signatur egal war.
  if (jetzt.getTime() >= ablauf) return { gueltig: false, grund: 'abgelaufen' };

  return { gueltig: true, orderId };
}
