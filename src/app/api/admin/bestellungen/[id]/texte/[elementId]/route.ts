/**
 * Admin-Download EINES Textes einer Bestellung als Bilddatei.
 *
 *   …/texte/<elementId>               JPG (weißer Hintergrund)
 *   …/texte/<elementId>?format=png    PNG mit TRANSPARENTEM Hintergrund – die Datei für
 *                                     die DTF-Bestellung: Ein JPG-Hintergrund würde mitgedruckt.
 *   …&ansicht=1                       im Browser anzeigen statt herunterladen
 *   …?vorschau=1                      kleines JPG-Vorschaubild (72 dpi) für die Kundendateien-Zeile
 *
 * Der Text entsteht auf Abruf aus den gespeicherten Bestelldaten (Schrift,
 * Größe, Farbe, Zeilenumbrüche …) – siehe lib/rendering/renderTextJpg.ts, beide
 * Formate in Druckgröße mit 300 dpi. Es wird nichts gespeichert; ein späterer
 * Abruf liefert dasselbe Ergebnis.
 *
 * Geschützt wie die Kundendateien-Downloads (kundendateien/[dateiname]/route.ts):
 * `istAdmin()` bei JEDEM Aufruf statt einer Signed URL, der Zugriff endet mit
 * der Admin-Sitzung.
 */
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';
import { ladeTextFuerJpg } from '@/lib/admin/textDateien';
import { renderTextAlsJpg, renderTextAlsPng } from '@/lib/rendering/renderTextJpg';
import { istSicherePfadkomponente } from '@/lib/upload/pruefeUpload';

// Text mit Schatten braucht beim Rastern in Druckgröße einige Sekunden.
export const maxDuration = 30;

/** Auflösung des Vorschaubilds (kleinster Wert, den der Renderer zulässt). */
const VORSCHAU_DPI = 72;

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

  const geladen = await ladeTextFuerJpg(params.id, params.elementId);
  if (!geladen) {
    return NextResponse.json({ fehler: 'Dieser Text gehört nicht zu der Bestellung oder existiert nicht (mehr).' }, { status: 404 });
  }

  const abfrage = new URL(request.url).searchParams;
  // Vorschaubild für die Zeile in den Kundendateien: klein (72 dpi, schnell) und nur zur Anzeige.
  const nurVorschau = abfrage.get('vorschau') === '1';
  const alsPng = !nurVorschau && abfrage.get('format') === 'png';
  const anzeigen = nurVorschau || abfrage.get('ansicht') === '1';

  let bytes: Buffer;
  try {
    const eingabe = nurVorschau ? { ...geladen.eingabe, dpi: VORSCHAU_DPI } : geladen.eingabe;
    const ergebnis = alsPng ? await renderTextAlsPng(eingabe) : await renderTextAlsJpg(eingabe);
    if (!ergebnis.ok) {
      return NextResponse.json({ fehler: ergebnis.grund }, { status: 422 });
    }
    bytes = 'png' in ergebnis ? ergebnis.png : ergebnis.jpg;
  } catch (fehler) {
    console.error(`[admin] Text-Bild für Element ${params.elementId} fehlgeschlagen:`, fehler);
    return NextResponse.json({ fehler: 'Die Bilddatei konnte nicht erzeugt werden.' }, { status: 500 });
  }

  // Der Loader schlägt einen .jpg-Namen vor; die Endung folgt dem Format.
  const dateiname = geladen.dateiname.replace(/\.jpg$/i, '') + (alsPng ? '.png' : '.jpg');
  const asciiName = dateiname.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '');
  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'content-type': alsPng ? 'image/png' : 'image/jpeg',
      'content-disposition': `${anzeigen ? 'inline' : 'attachment'}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(dateiname)}`,
      // Die Dateien selbst nie zwischenspeichern; das kleine Vorschaubild darf der Browser kurz behalten,
      // damit die Seite beim Neuladen nicht jedes Mal neu rendert (nur privat, nie in einem gemeinsamen Cache).
      'cache-control': nurVorschau ? 'private, max-age=300' : 'private, no-store',
    },
  });
}
