/**
 * Admin-Download EINER Original-Kundendatei (Logo, vor Hintergrundentfernung).
 *
 * ── Warum eine Route statt einer Supabase-Signed-URL ──────────────────
 * Eine Signed URL funktioniert für JEDEN, der sie kennt, bis sie abläuft –
 * unabhängig davon, ob die Person noch angemeldet ist. Diese Route prüft
 * stattdessen bei JEDEM Aufruf istAdmin() (dieselbe httpOnly-Sitzung wie der
 * Rest des Adminbereichs): kein separates Ablaufdatum zu pflegen, und der
 * Zugriff endet exakt dann, wenn die Admin-Sitzung selbst endet (12h,
 * lib/admin/auth.ts) oder widerrufen wird – "geschützt und zeitlich
 * begrenzt" im Sinne der Anforderung, ohne eine zweite, unabhängig
 * gültige URL in Umlauf zu bringen.
 *
 * ── Warum keine zusätzliche Prüfung "gehört diese Datei zur Bestellung" ──
 * Der Storage-Pfad wird AUSSCHLIESSLICH aus dem `id`-Segment dieser Route
 * gebaut (`orders/<id>/<dateiname>`) – ein Admin mit gültiger Sitzung darf
 * ohnehin jede Datei jeder Bestellung sehen (das ist der gesamte Zweck des
 * Adminbereichs), ein Cross-Order-Zugriff ist strukturell unmöglich: die
 * Bestellkennung eines FREMDEN Auftrags einzusetzen liefert nur dessen
 * EIGENE Dateien, nie die einer dritten Bestellung.
 */
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';
import { downloadProductionFile } from '@/lib/supabase/storage';
import { istSicherePfadkomponente, istSichererSpeicherpfad } from '@/lib/upload/pruefeUpload';

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

/** Entfernt Zeilenumbrüche/Anführungszeichen aus einem Header-Wert – ein roher
 *  Dateiname darf niemals ungeprüft in einen HTTP-Header wandern. */
function sichererHeaderName(roh: string | null, ersatz: string): string {
  const bereinigt = (roh ?? '').replace(/[\r\n"\\]/g, '').trim();
  return bereinigt.length > 0 && bereinigt.length <= 200 ? bereinigt : ersatz;
}

export async function GET(
  request: Request,
  { params }: { params: { id: string; dateiname: string } }
): Promise<NextResponse> {
  if (!(await istAdmin())) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }

  if (!istSicherePfadkomponente(params.id)) {
    return NextResponse.json({ fehler: 'Ungültige Bestellkennung.' }, { status: 400 });
  }

  const speicherPfad = `orders/${params.id}/${params.dateiname}`;
  if (!istSichererSpeicherpfad(speicherPfad)) {
    return NextResponse.json({ fehler: 'Ungültiger Dateiname.' }, { status: 400 });
  }

  let bytes: Buffer;
  try {
    bytes = await downloadProductionFile(speicherPfad);
  } catch {
    return NextResponse.json({ fehler: 'Datei nicht gefunden.' }, { status: 404 });
  }

  const endung = params.dateiname.split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[endung] ?? 'application/octet-stream';

  // Anzeigename kommt bewusst als Query-Parameter (?name=…), nicht aus der
  // Datenbank: Diese Route ist ein reiner, zustandsloser Datei-Streamer –
  // derselbe Aufbau wie /api/testablage. Der übergebene Wunschname ist nur
  // Kosmetik für den Download-Dialog, niemals Grundlage einer Entscheidung.
  const wunschName = new URL(request.url).searchParams.get('name');
  const anzeigeName = sichererHeaderName(wunschName, params.dateiname);
  const asciiFallback = anzeigeName.replace(/[^\x20-\x7E]/g, '_');

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(anzeigeName)}`,
      'cache-control': 'private, no-store',
    },
  });
}
