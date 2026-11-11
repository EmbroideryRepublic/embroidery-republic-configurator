/**
 * Admin-Download der fertig digitalisierten STICKDATEI EINES Motivs (Text oder Logo) einer Bestellung.
 *
 *   …/stickdatei/<elementId>            Stickdatei im Format DST (für die Stickmaschine, ohne Nacharbeit lesbar)
 *   …/stickdatei/<elementId>?vorschau=1 Stickvorschau als PNG (Garnlinien in Garnfarbe, Sprünge rot gestrichelt)
 *   …/stickdatei/<elementId>?info=1     Kennzahlen und Hinweise als JSON (Größe, Stiche, Farben, Grenzen des Motivs)
 *
 * Die Datei entsteht auf Abruf aus den gespeicherten Bestelldaten (lib/admin/stickdatei.ts); es wird nichts gespeichert.
 *
 * Geschützt wie die übrigen Admin-Downloads: `istAdmin()` bei JEDEM Aufruf, kein Signed-URL.
 */
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';
import { erzeugeStickdatei } from '@/lib/admin/stickdatei';
import { istSicherePfadkomponente } from '@/lib/upload/pruefeUpload';

// Logos mit vielen Farben brauchen einige Sekunden.
export const maxDuration = 30;

export async function GET(request: Request, { params }: { params: { id: string; elementId: string } }): Promise<NextResponse> {
  if (!(await istAdmin())) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!istSicherePfadkomponente(params.id)) {
    return NextResponse.json({ fehler: 'Ungültige Bestellkennung.' }, { status: 400 });
  }
  if (!istSicherePfadkomponente(params.elementId)) {
    return NextResponse.json({ fehler: 'Ungültige Element-Kennung.' }, { status: 400 });
  }

  const abfrage = new URL(request.url).searchParams;
  let ergebnis;
  try {
    ergebnis = await erzeugeStickdatei(params.id, params.elementId);
  } catch (fehler) {
    console.error(`[admin] Stickdatei für Element ${params.elementId} fehlgeschlagen:`, fehler);
    return NextResponse.json({ fehler: 'Die Stickdatei konnte nicht erzeugt werden.' }, { status: 500 });
  }
  if (!ergebnis.ok) {
    return NextResponse.json({ fehler: ergebnis.grund }, { status: ergebnis.status });
  }

  const keinCache = { 'cache-control': 'private, no-store' };
  if (abfrage.get('info') === '1') {
    return NextResponse.json({ ...ergebnis.kennzahlen, dateiname: `${ergebnis.dateiname}.dst` }, { headers: keinCache });
  }
  if (abfrage.get('vorschau') === '1') {
    return new NextResponse(new Uint8Array(ergebnis.vorschauPng), {
      headers: { 'content-type': 'image/png', 'content-disposition': 'inline', ...keinCache },
    });
  }

  const dateiname = `${ergebnis.dateiname}.dst`;
  const asciiName = dateiname.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
  return new NextResponse(new Uint8Array(ergebnis.dst), {
    headers: {
      'content-type': 'application/octet-stream',
      'content-disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(dateiname)}`,
      ...keinCache,
    },
  });
}
