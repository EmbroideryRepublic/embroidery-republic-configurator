/**
 * POST /api/upload/teil – nimmt EIN Teil einer großen Logo-Datei an (höchstens 3 MB, siehe config/upload.ts).
 *
 * Kopfzeilen: `x-tag` (JJJJMMTT, UTC), `x-ticket` (UUID), `x-nr` (Teilnummer ab 0). Körper: die rohen Bytes.
 * Antwort: 204 bei Erfolg, 400/413/429 sonst – nie Inhalte oder Pfade.
 *
 * Die Teile liegen im Zwischenspeicher, bis die Bestellung sie über den Verweis (`staged:…`) übernimmt und prüft. Nichts hier ist
 * vertrauenswürdig: Die Datei wird erst beim Zusammensetzen vollständig geprüft (lib/upload/zwischenablage.ts).
 */
import { NextResponse, type NextRequest } from 'next/server';
import { pruefeRateLimit } from '@/lib/security/rateLimit';
import { speichereTeil } from '@/lib/upload/zwischenablage';
import { TEIL_MAX_BYTES } from '@/config/upload';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function fehler(status: number, text: string): NextResponse {
  return NextResponse.json({ error: text }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const grenze = await pruefeRateLimit('uploadTeil');
  if (!grenze.erlaubt) return fehler(429, grenze.meldung);

  // Billige Vorprüfung an der angegebenen Länge, bevor der Körper gelesen wird; maßgeblich ist danach die tatsächliche Länge.
  const angegeben = Number(req.headers.get('content-length') ?? '0');
  if (!Number.isFinite(angegeben) || angegeben > TEIL_MAX_BYTES) return fehler(413, 'Teil zu groß.');

  const nr = Number(req.headers.get('x-nr'));
  const daten = Buffer.from(await req.arrayBuffer());

  const ergebnis = await speichereTeil({
    tag: req.headers.get('x-tag') ?? '',
    ticket: req.headers.get('x-ticket') ?? '',
    nr,
    daten,
  });
  if (!ergebnis.ok) return fehler(ergebnis.status, ergebnis.grund);
  return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
}
