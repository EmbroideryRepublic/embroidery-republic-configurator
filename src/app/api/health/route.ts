/**
 * ═══════════════════════════════════════════════════════════════════════
 * HEALTH CHECK
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Beantwortet die erste der fünf Betriebsfragen: **Läuft das System?**
 *
 * Aufruf:
 *   GET /api/health          knappe Antwort, öffentlich
 *   GET /api/health?detail=1 ausführlich, nur für angemeldete Betreiber
 *
 * ── Warum die öffentliche Antwort so wortkarg ist ─────────────────────
 * Ein Health-Check, der Verbindungszeichenfolgen, Schlüsselpräfixe,
 * Bibliotheksversionen oder Fehlermeldungen ausgibt, ist selbst ein Leck.
 * Er sagt einer Angreiferin, was eingesetzt wird und wo es hakt.
 *
 * Öffentlich gibt es deshalb nur Zustände: welcher Baustein `ok`,
 * `beeintraechtigt` oder `kritisch` ist. Die Fehlermeldungen sieht nur, wer
 * angemeldet ist.
 *
 * ── HTTP-Status ───────────────────────────────────────────────────────
 * 200 bei `ok` und `beeintraechtigt`, 503 bei `kritisch`. So kann eine
 * Überwachung außerhalb des Systems reagieren, ohne den Rumpf zu lesen.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isAdminConfigured, istAdmin } from '@/lib/admin/auth';
import { mitAnfrageKontext } from '@/lib/observability/kontext';
import { log } from '@/lib/observability/log';

export const dynamic = 'force-dynamic';

type Zustand = 'ok' | 'beeintraechtigt' | 'kritisch';

interface Pruefung {
  name: string;
  zustand: Zustand;
  /** Nur in der ausführlichen Fassung. */
  detail?: string;
  dauerMs: number;
}

/** Bricht eine Prüfung ab, statt die ganze Antwort hängen zu lassen. */
async function mitZeitlimit<T>(versprechen: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    versprechen,
    new Promise<T>((_, ablehnen) => setTimeout(() => ablehnen(new Error(`Zeitlimit von ${ms} ms überschritten`)), ms)),
  ]);
}

async function pruefeDatenbank(): Promise<Pruefung> {
  const beginn = Date.now();
  try {
    const db = createAdminClient();
    // Bewusst leichtgewichtig: nur zählen, keine Daten lesen.
    const { error } = await mitZeitlimit(
      Promise.resolve(db.from('orders').select('id', { count: 'exact', head: true })),
      3000
    );
    if (error) throw new Error(error.message);
    return { name: 'datenbank', zustand: 'ok', dauerMs: Date.now() - beginn };
  } catch (fehler) {
    return {
      name: 'datenbank',
      zustand: 'kritisch',
      detail: fehler instanceof Error ? fehler.message : String(fehler),
      dauerMs: Date.now() - beginn,
    };
  }
}

async function pruefeSpeicher(): Promise<Pruefung> {
  const beginn = Date.now();
  try {
    const db = createAdminClient();
    const { error } = await mitZeitlimit(
      Promise.resolve(db.storage.from('production-files').list('', { limit: 1 })),
      3000
    );
    if (error) throw new Error(error.message);
    return { name: 'speicher', zustand: 'ok', dauerMs: Date.now() - beginn };
  } catch (fehler) {
    return {
      name: 'speicher',
      zustand: 'kritisch',
      detail: fehler instanceof Error ? fehler.message : String(fehler),
      dauerMs: Date.now() - beginn,
    };
  }
}

/**
 * Prüft, ob die Pflichtvariablen gesetzt sind.
 *
 * Nur „vorhanden/fehlt" – niemals der Wert, auch nicht gekürzt. Ein
 * Schlüsselpräfix verrät bereits, welcher Dienst und welcher Modus.
 */
function pruefeUmgebung(): Pruefung {
  const beginn = Date.now();
  const pflicht = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SECRET_KEY', 'ORDER_TOKEN_SECRET'];
  const fehlend = pflicht.filter((n) => !process.env[n]);

  // Das Admin-Secret wird hier NICHT selbst gelesen – dafür gibt es
  // `isAdminConfigured()`. Ein Wächter-Test aus H1 sichert ab, dass nur
  // lib/admin/auth.ts es anfasst; jede weitere Stelle wäre eine neue
  // Gelegenheit, es versehentlich auszugeben.
  if (!isAdminConfigured()) fehlend.push('ADMIN_SECRET (fehlt oder unter 12 Zeichen)');

  if (fehlend.length > 0) {
    return {
      name: 'umgebung',
      zustand: 'kritisch',
      detail: `Nicht gesetzt: ${fehlend.join(', ')}`,
      dauerMs: Date.now() - beginn,
    };
  }
  return { name: 'umgebung', zustand: 'ok', dauerMs: Date.now() - beginn };
}

/** E-Mail und Zahlung: fehlend beeinträchtigt, sperrt aber nicht. */
function pruefeDienste(): Pruefung[] {
  const beginn = Date.now();
  const email: Pruefung = process.env.RESEND_API_KEY
    ? { name: 'email', zustand: 'ok', dauerMs: Date.now() - beginn }
    : {
        name: 'email',
        zustand: 'beeintraechtigt',
        detail: 'RESEND_API_KEY fehlt – es werden keine Bestätigungen versandt.',
        dauerMs: Date.now() - beginn,
      };

  const zahlung: Pruefung = process.env.STRIPE_SECRET_KEY || process.env.PAYPAL_CLIENT_ID
    ? { name: 'zahlung', zustand: 'ok', dauerMs: 0 }
    : {
        name: 'zahlung',
        zustand: 'beeintraechtigt',
        detail: 'Kein Zahlungsanbieter eingerichtet – nur Rechnungskauf möglich.',
        dauerMs: 0,
      };

  const rechnung: Pruefung = process.env.LEXWARE_API_KEY
    ? { name: 'rechnung', zustand: 'ok', dauerMs: 0 }
    : {
        name: 'rechnung',
        zustand: 'beeintraechtigt',
        detail: 'LEXWARE_API_KEY fehlt – Rechnungen entstehen nicht automatisch.',
        dauerMs: 0,
      };

  const versand: Pruefung = process.env.DHL_API_KEY
    ? { name: 'versand', zustand: 'ok', dauerMs: 0 }
    : {
        name: 'versand',
        zustand: 'beeintraechtigt',
        detail: 'DHL_API_KEY fehlt – Versandlabel können nicht erstellt werden.',
        dauerMs: 0,
      };

  return [email, zahlung, rechnung, versand];
}

function gesamtzustand(pruefungen: Pruefung[]): Zustand {
  if (pruefungen.some((p) => p.zustand === 'kritisch')) return 'kritisch';
  if (pruefungen.some((p) => p.zustand === 'beeintraechtigt')) return 'beeintraechtigt';
  return 'ok';
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  return mitAnfrageKontext(async () => {
    const ausfuehrlich = req.nextUrl.searchParams.get('detail') === '1' && (await istAdmin());

    const [datenbank, speicher] = await Promise.all([pruefeDatenbank(), pruefeSpeicher()]);
    const pruefungen = [datenbank, speicher, pruefeUmgebung(), ...pruefeDienste()];
    const zustand = gesamtzustand(pruefungen);

    if (zustand === 'kritisch') {
      log({
        schwere: 'CRITICAL',
        kategorie: 'SYSTEM',
        ereignis: 'health_kritisch',
        meldung: pruefungen
          .filter((p) => p.zustand === 'kritisch')
          .map((p) => p.name)
          .join(', '),
      });
    }

    return NextResponse.json(
      {
        zustand,
        zeit: new Date().toISOString(),
        pruefungen: pruefungen.map((p) => ({
          name: p.name,
          zustand: p.zustand,
          // Details ausschließlich für angemeldete Betreiber.
          ...(ausfuehrlich ? { detail: p.detail, dauerMs: p.dauerMs } : {}),
        })),
      },
      { status: zustand === 'kritisch' ? 503 : 200 }
    );
  });
}
