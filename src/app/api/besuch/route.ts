/**
 * Besucherzähler – nimmt die Meldung „Seite aufgerufen" entgegen.
 *
 * Antwortet IMMER mit 204 und ohne Inhalt: Die Zählung darf weder die Seite
 * verlangsamen noch einen Fehler sichtbar machen, und sie verrät dem Aufrufer
 * nicht, warum ein Besuch nicht gezählt wurde (Roboter, Do-Not-Track …).
 *
 * Was gezählt wird und was nicht, steht in lib/besuch/erfassen.ts; Datenschutz-
 * Überlegungen und Grenzen der Zahlen in docs/besucherzaehler.md.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { ermittleIp, pruefeRateLimit } from '@/lib/security/rateLimit';
import { basisUrl, kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { bereinigeQuelle, berlinTag, bildeKennung, ausschlussGrund, istZaehlHost, normalisierePfad } from '@/lib/besuch/erfassen';
import sitemap from '@/app/sitemap';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Größe der Meldung: ein Pfad und eine Quelle – mehr ist nie legitim. */
const MAX_BYTES = 2000;

/** Pfade aller öffentlichen Seiten = Positivliste (dieselbe Quelle wie die Sitemap). */
let oeffentlicheSeiten: ReadonlySet<string> | undefined;
function holeOeffentlicheSeiten(): ReadonlySet<string> {
  oeffentlicheSeiten ??= new Set(sitemap().map((eintrag) => new URL(eintrag.url).pathname));
  return oeffentlicheSeiten;
}

/** Hosts, auf denen gezählt wird: die echte Domain – weder lokal noch *.vercel.app. */
function zaehlHosts(): string[] {
  const hosts = [new URL(kanonischeBasisUrl()).host, new URL(basisUrl()).host];
  const zusaetzlich = (process.env.BESUCH_ZUSATZ_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  return [...new Set([...hosts, ...zusaetzlich])];
}

const OHNE_INHALT = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Entwicklung zählt nie – sie nutzt dieselbe Datenbank wie der Betrieb.
    if (process.env.NODE_ENV !== 'production') return OHNE_INHALT();

    const h = request.headers;
    const grund = ausschlussGrund({
      userAgent: h.get('user-agent'),
      gpc: h.get('sec-gpc'),
      dnt: h.get('dnt'),
      zweck: h.get('sec-purpose') ?? h.get('purpose'),
      adminCookie: request.cookies.has(ADMIN_COOKIE_NAME),
      zaehlHost: istZaehlHost(h.get('x-forwarded-host') ?? h.get('host'), zaehlHosts()),
    });
    if (grund) return OHNE_INHALT();

    // Das Geheimnis stammt aus dem Betrieb; ohne gültiges wird nicht gezählt
    // (lieber keine Zahl als eine Kennung, die sich erraten ließe).
    const geheimnis = process.env.ORDER_TOKEN_SECRET;
    if (!geheimnis || geheimnis.length < 16) return OHNE_INHALT();

    const roh = await request.text();
    if (roh.length === 0 || roh.length > MAX_BYTES) return OHNE_INHALT();
    const meldung = JSON.parse(roh) as { pfad?: unknown; quelle?: unknown };

    const pfad = normalisierePfad(meldung.pfad, holeOeffentlicheSeiten());
    if (!pfad) return OHNE_INHALT();

    const limit = await pruefeRateLimit('besuch');
    if (!limit.erlaubt) return OHNE_INHALT();

    const tag = berlinTag();
    const kennung = bildeKennung(ermittleIp(), h.get('user-agent') ?? '', tag, geheimnis);

    const { error } = await createAdminClient().rpc('erfasse_besuch', {
      p_tag: tag,
      p_pfad: pfad,
      p_kennung: kennung,
      p_quelle: bereinigeQuelle(meldung.quelle),
    });
    if (error) console.error('[besuch] Zählung fehlgeschlagen:', error.message);
  } catch (fehler) {
    // Ungültiges JSON, Datenbank nicht erreichbar … – nie nach außen sichtbar.
    console.error('[besuch] Zählung übersprungen:', fehler instanceof Error ? fehler.message : fehler);
  }
  return OHNE_INHALT();
}
