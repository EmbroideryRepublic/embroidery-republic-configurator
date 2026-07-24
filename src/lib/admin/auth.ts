/**
 * ═══════════════════════════════════════════════════════════════════════
 * ADMIN-AUTHENTIFIZIERUNG – die einzige Stelle
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Jede Route, jede Server Action und jede Seite prüft über `istAdmin()`.
 * Es gibt keine Sonderlösung je Route; ein Wächter-Test schlägt an, sobald
 * irgendwo direkt mit `ADMIN_SECRET` verglichen wird.
 *
 * ── Das Secret verlässt den Server nie ────────────────────────────────
 * Bis zum 2026-07-22 war das Cookie wortgleich das `ADMIN_SECRET`. Jedes
 * Cookie-Leck – Proxy-Log, Browser-Erweiterung, Fehlerbericht, Screenshot –
 * gab damit nicht eine Sitzung preis, sondern das Betriebsgeheimnis selbst.
 * Und eine einzelne Sitzung ließ sich nicht beenden, ohne durch Ändern des
 * Secrets alle auszusperren.
 *
 * Jetzt wird das Secret bei der Anmeldung einmal zeitkonstant geprüft und
 * danach verworfen. Ins Cookie geht ein zufälliges Sitzungstoken; die
 * Datenbank kennt davon nur den SHA-256-Hash.
 *
 * ── Bei Zweifel: nicht hereinlassen ───────────────────────────────────
 * Ist die Datenbank nicht erreichbar, gilt der Zugriff als NICHT
 * angemeldet. Das unterscheidet sich bewusst vom Rate-Limit, wo ein Ausfall
 * durchlässt: Dort schützt die Sperre vor Missbrauch und darf den Shop
 * nicht lahmlegen; hier schützt sie Kundendaten.
 *
 * Vollständige Herleitung: docs/admin-authentifizierung.md
 */
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/server';

export const ADMIN_COOKIE_NAME = 'er_admin_session';

/** Lebensdauer einer Sitzung. Serverseitig maßgeblich, das Cookie folgt nur. */
export const SITZUNGSDAUER_STUNDEN = 12;

/** Mindestlänge des Secrets. Kürzer wird der Zugang gar nicht freigeschaltet. */
const MINDESTLAENGE_SECRET = 12;

/** Ist überhaupt ein Zugang eingerichtet? */
export function isAdminConfigured(): boolean {
  const secret = process.env.ADMIN_SECRET;
  return Boolean(secret && secret.length >= MINDESTLAENGE_SECRET);
}

/**
 * Vergleicht zwei Zeichenketten zeitkonstant.
 *
 * `===` bricht beim ersten unterschiedlichen Zeichen ab; die Laufzeit
 * verrät damit, wie viele Zeichen stimmten. Über ein Netzwerk kaum
 * ausnutzbar, aber es gibt keinen Grund, es falsch zu machen.
 *
 * Beide Seiten werden zuerst gehasht: Sonst verriete schon der Längenfehler
 * von `timingSafeEqual` die Länge des Secrets.
 */
function gleichZeitkonstant(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** SHA-256 als Hex. Gespeichert wird nur der Hash, nie der Token. */
function hashe(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Grobe Herkunft für die Sitzungsübersicht.
 *
 * Bewusst gekürzt: Eine vollständige IP-Adresse ist ein personenbezogenes
 * Datum. Für „von wo war das?" genügt der gekürzte Teil.
 */
function herkunft(): string {
  try {
    const h = headers();
    const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unbekannt';
    const teile = ip.split('.');
    return teile.length === 4 ? `${teile[0]}.${teile[1]}.${teile[2]}.x` : ip.slice(0, 24);
  } catch {
    return 'unbekannt';
  }
}

export interface AnmeldeErgebnis {
  ok: boolean;
  fehler?: string;
}

/**
 * Prüft das Secret und legt bei Erfolg eine Sitzung an.
 *
 * ── Session Fixation ──────────────────────────────────────────────────
 * Der Token entsteht ERST NACH erfolgreicher Prüfung, auf dem Server, aus
 * `crypto.randomBytes`. Ein Angreifer kann keinen Token vorgeben, den das
 * Opfer anschließend benutzt – die Voraussetzung für Session Fixation fehlt
 * damit strukturell. Ein bereits gesetztes Cookie wird überschrieben.
 */
export async function meldeAdminAn(eingabe: string): Promise<AnmeldeErgebnis> {
  if (!isAdminConfigured()) {
    return { ok: false, fehler: 'Der Zugang ist nicht eingerichtet.' };
  }
  if (!gleichZeitkonstant(eingabe, process.env.ADMIN_SECRET!)) {
    return { ok: false, fehler: 'Falscher Zugangsschlüssel.' };
  }

  // 32 Byte aus dem kryptografischen Zufallsgenerator – nicht erratbar.
  const token = randomBytes(32).toString('base64url');
  const laeuftAb = new Date(Date.now() + SITZUNGSDAUER_STUNDEN * 60 * 60 * 1000);

  try {
    const db = createAdminClient();
    const { error } = await db.from('admin_sitzungen').insert({
      token_hash: hashe(token),
      laeuft_ab_am: laeuftAb.toISOString(),
      herkunft: herkunft(),
    });
    if (error) {
      console.error('[admin] Sitzung konnte nicht angelegt werden:', error.message);
      return { ok: false, fehler: 'Die Anmeldung ist derzeit nicht möglich. Bitte später erneut versuchen.' };
    }
  } catch (fehler) {
    console.error('[admin] Sitzung konnte nicht angelegt werden:', fehler);
    return { ok: false, fehler: 'Die Anmeldung ist derzeit nicht möglich. Bitte später erneut versuchen.' };
  }

  cookies().set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true, // kein Zugriff aus JavaScript
    sameSite: 'lax', // schützt vor CSRF; 'strict' bräche Links aus E-Mails
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SITZUNGSDAUER_STUNDEN * 60 * 60,
  });

  return { ok: true };
}

/**
 * Ist der Aufrufer als Betreiber angemeldet?
 *
 * Aktualisiert nebenbei den Zeitpunkt des letzten Zugriffs, bewusst ohne
 * darauf zu warten: Die Anzeige „zuletzt aktiv" ist eine Annehmlichkeit und
 * darf keine Anfrage verzögern oder scheitern lassen.
 */
export async function istAdmin(): Promise<boolean> {
  if (!isAdminConfigured()) return false;

  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('admin_sitzungen')
      .select('id, laeuft_ab_am, widerrufen_am')
      .eq('token_hash', hashe(token))
      .maybeSingle();

    if (error) {
      console.error('[admin] Sitzungsprüfung fehlgeschlagen – Zugriff verweigert:', error.message);
      return false;
    }
    if (!data) {
      console.warn('[admin] Unbekanntes Sitzungstoken abgewiesen.');
      return false;
    }
    if (data.widerrufen_am) return false;
    if (new Date(data.laeuft_ab_am as string) <= new Date()) return false;

    void db
      .from('admin_sitzungen')
      .update({ letzter_zugriff: new Date().toISOString() })
      .eq('id', data.id as string)
      .then(() => undefined);

    return true;
  } catch (fehler) {
    console.error('[admin] Sitzungsprüfung fehlgeschlagen – Zugriff verweigert:', fehler);
    return false;
  }
}

/** Beendet genau diese Sitzung. Andere Zugänge bleiben bestehen. */
export async function meldeAdminAb(): Promise<void> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (token) {
    try {
      const db = createAdminClient();
      await db
        .from('admin_sitzungen')
        .update({ widerrufen_am: new Date().toISOString() })
        .eq('token_hash', hashe(token));
    } catch (fehler) {
      // Das Cookie wird trotzdem entfernt – der Zugang ist damit weg, auch
      // wenn der Vermerk in der Datenbank fehlschlug.
      console.error('[admin] Sitzung konnte nicht widerrufen werden:', fehler);
    }
  }
  cookies().delete(ADMIN_COOKIE_NAME);
}

/**
 * Beendet ALLE Sitzungen, ohne das Secret zu ändern.
 *
 * Genau das war vorher unmöglich: Ein vergessener Zugang auf einem fremden
 * Rechner ließ sich nur durch Ändern des Secrets beenden – womit auch alle
 * anderen ausgesperrt waren.
 */
export async function beendeAlleAdminSitzungen(): Promise<number> {
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('admin_sitzungen')
      .update({ widerrufen_am: new Date().toISOString() })
      .is('widerrufen_am', null)
      .select('id');

    if (error) {
      console.error('[admin] Sitzungen konnten nicht beendet werden:', error.message);
      return 0;
    }
    cookies().delete(ADMIN_COOKIE_NAME);
    return data?.length ?? 0;
  } catch (fehler) {
    console.error('[admin] Sitzungen konnten nicht beendet werden:', fehler);
    return 0;
  }
}

export interface SitzungsUebersicht {
  id: string;
  erstelltAm: string;
  laeuftAbAm: string;
  letzterZugriff: string;
  herkunft: string | null;
  /** Ist das die Sitzung, aus der gerade zugegriffen wird? */
  aktuelle: boolean;
}

/** Alle gültigen Sitzungen – für die Übersicht im Adminbereich. */
export async function aktiveSitzungen(): Promise<SitzungsUebersicht[]> {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  const eigenerHash = token ? hashe(token) : null;

  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('admin_sitzungen')
      .select('id, token_hash, erstellt_am, laeuft_ab_am, letzter_zugriff, herkunft')
      .is('widerrufen_am', null)
      .gt('laeuft_ab_am', new Date().toISOString())
      .order('letzter_zugriff', { ascending: false });

    if (error || !data) return [];
    return data.map((z) => ({
      id: z.id as string,
      erstelltAm: z.erstellt_am as string,
      laeuftAbAm: z.laeuft_ab_am as string,
      letzterZugriff: z.letzter_zugriff as string,
      herkunft: (z.herkunft as string | null) ?? null,
      aktuelle: z.token_hash === eigenerHash,
    }));
  } catch {
    return [];
  }
}

/** Beendet eine einzelne Sitzung anhand ihrer Kennung. */
export async function widerrufeSitzung(id: string): Promise<boolean> {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from('admin_sitzungen')
      .update({ widerrufen_am: new Date().toISOString() })
      .eq('id', id);
    return !error;
  } catch {
    return false;
  }
}
