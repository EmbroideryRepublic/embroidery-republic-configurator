/**
 * Besucherzähler – nimmt die Meldung „Schritt des Bestellwegs erreicht“ entgegen (Migration 0040).
 *
 * Antwortet IMMER mit 204 und ohne Inhalt, genau wie /api/besuch: Die Messung darf weder die Seite verlangsamen noch einen Fehler
 * sichtbar machen, und sie verrät dem Aufrufer nicht, warum etwas nicht gezählt wurde. Robots, „Do Not Track“, Global Privacy Control,
 * Vorab-Laden, der Betreiber selbst, fremde Hosts und Entwicklung fallen heraus – dieselben Regeln wie beim Besucherzähler.
 *
 * Gespeichert wird nur: Tag, Ereignisname (feste Liste), Quelle (feste Liste) und eine Zahl. Die Tageskennung ist derselbe nicht umkehrbare
 * Hash wie beim Besucherzähler (täglich wechselnder Schlüssel, nie die IP-Adresse) und wird nach Tagesende gelöscht.
 * Diese Route berührt weder Bestellungen noch Zahlung; sie liest und schreibt ausschließlich die Zähler-Tabellen.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME } from '@/lib/admin/auth';
import { EREIGNIS_MESSUNG_AKTIV, QUELLE_OHNE_KENNZEICHNUNG } from '@/config/besuch';
import { createAdminClient } from '@/lib/supabase/server';
import { ermittleIp, pruefeRateLimit } from '@/lib/security/rateLimit';
import { basisUrl, kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { ausschlussGrund, bereinigeEreignis, berlinTag, bildeKennung, istZaehlHost } from '@/lib/besuch/erfassen';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Größe der Meldung: ein Name – mehr ist nie legitim. */
const MAX_BYTES = 500;

/** Hosts, auf denen gezählt wird: die echte Domain – weder lokal noch *.vercel.app. */
function zaehlHosts(): string[] {
  const hosts = [new URL(kanonischeBasisUrl()).host, new URL(basisUrl()).host];
  const zusaetzlich = (process.env.BESUCH_ZUSATZ_HOSTS ?? '').split(',').map((h) => h.trim()).filter(Boolean);
  return [...new Set([...hosts, ...zusaetzlich])];
}

const OHNE_INHALT = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    if (!EREIGNIS_MESSUNG_AKTIV) return OHNE_INHALT();
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

    const geheimnis = process.env.ORDER_TOKEN_SECRET;
    if (!geheimnis || geheimnis.length < 16) return OHNE_INHALT();

    const roh = await request.text();
    if (roh.length === 0 || roh.length > MAX_BYTES) return OHNE_INHALT();
    const ereignis = bereinigeEreignis((JSON.parse(roh) as { ereignis?: unknown }).ereignis);
    if (!ereignis) return OHNE_INHALT();

    const limit = await pruefeRateLimit('besuch');
    if (!limit.erlaubt) return OHNE_INHALT();

    const tag = berlinTag();
    const kennung = bildeKennung(await ermittleIp(), h.get('user-agent') ?? '', tag, geheimnis);

    // Die Quelle des Besuchers steht schon im Besucherzähler (erster Aufruf des Tages); die Datenbankfunktion liest sie dort nach.
    const { error } = await createAdminClient().rpc('erfasse_besuchs_ereignis', {
      p_tag: tag,
      p_ereignis: ereignis,
      p_kennung: kennung,
      p_quelle: QUELLE_OHNE_KENNZEICHNUNG,
    });
    if (error) console.error('[besuch] Ereignis nicht gezählt:', error.message);
  } catch (fehler) {
    console.error('[besuch] Ereignis übersprungen:', fehler instanceof Error ? fehler.message : fehler);
  }
  return OHNE_INHALT();
}
