/**
 * Liefert Dateien aus der lokalen Testablage (.testablage/production-files)
 * über eine echte HTTP-URL aus – AUSSCHLIESSLICH im Testmodus.
 *
 * ── Fund vom 2026-08-31 (Real-User-Flow-Test) ─────────────────────────
 * `getProductionFileSignedUrl()` (lib/supabase/storage.ts) gab im Testmodus
 * bisher `file://<lokaler-pfad>` zurück – bewusst so gewählt, damit
 * Aufrufer wie die interne Benachrichtigungs-Mail denselben Zweig wie
 * produktiv durchlaufen (nicht die "kein Link"-Abzweigung). Für die
 * Admin-Produktionsvorschau (ProductionPreview.tsx, `next/image`) ist ein
 * `file://`-Pfad aber KEIN gültiger `src`: Next.js lehnt ihn mit „Invalid
 * src prop … hostname \"\" is not configured" ab – die gesamte
 * Admin-Bestelldetailseite stürzte dadurch im Testmodus auf jeder
 * Bestellung mit Personalisierung ab (500, globales error.tsx). Browser
 * blockieren `file://`-Abrufe von einer http(s)-Seite ohnehin, ein reines
 * `<img>` hätte also auch nicht geholfen.
 *
 * Diese Route schließt die Lücke, ohne den ursprünglichen Zweck des
 * `file://`-Verweises zu verändern: `getProductionFileSignedUrl()` liefert
 * jetzt im Testmodus eine echte, absolute URL auf DIESE Route – exakt der
 * Fall, für den Next.js/Browser gebaut sind, und identisch zum
 * produktiven Signed-URL-Pfad aus Sicht jedes Aufrufers.
 *
 * Sicherheit: Außerhalb des Testmodus (jede reale Produktivumgebung) immer
 * 404 – die Testablage existiert dort ohnehin nicht. Der Pfad wird mit
 * derselben Prüfung wie beim Schreiben/Lesen des echten Storage-Buckets
 * abgesichert (istSichererSpeicherpfad – keine `..`, keine absoluten
 * Pfade, keine Backslashes).
 */
import { readFile } from 'node:fs/promises';
import nodePath from 'node:path';
import { NextResponse } from 'next/server';
import { istTestmodus } from '@/config/testmodus';
import { istSichererSpeicherpfad } from '@/lib/upload/pruefeUpload';

const TESTABLAGE = nodePath.join(process.cwd(), '.testablage', 'production-files');

const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  pdf: 'application/pdf',
};

export async function GET(_request: Request, { params }: { params: { path: string[] } }) {
  if (!istTestmodus()) {
    return new NextResponse(null, { status: 404 });
  }

  const speicherPfad = params.path.join('/');
  if (!istSichererSpeicherpfad(speicherPfad)) {
    return new NextResponse(null, { status: 404 });
  }

  const dateiPfad = nodePath.join(TESTABLAGE, ...speicherPfad.split('/'));
  const endung = speicherPfad.split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[endung] ?? 'application/octet-stream';

  try {
    const inhalt = await readFile(dateiPfad);
    return new NextResponse(new Uint8Array(inhalt), {
      headers: { 'content-type': contentType, 'cache-control': 'private, max-age=60' },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
