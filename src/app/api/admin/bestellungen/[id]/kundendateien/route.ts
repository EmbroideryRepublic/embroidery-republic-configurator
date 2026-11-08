/**
 * Admin-Sammel-Download ALLER Original-Kundendateien einer Bestellung als
 * ZIP – siehe [dateiname]/route.ts für den Einzel-Download und dessen
 * Sicherheitsbegründung (istAdmin() bei jedem Aufruf statt einer
 * Signed URL). Diese Route teilt dieselbe Absicherung.
 *
 * Fehlende Einzeldateien (z.B. DSGVO-Altdatei-Löschung,
 * scripts/dsgvoAltdateien.mts) lassen den Download NICHT scheitern: sie
 * werden ausgelassen und stattdessen in einer Textdatei im ZIP benannt –
 * still nichts einzupacken wäre die Sorte stiller Lücke, die dieses Projekt
 * an anderer Stelle bewusst vermeidet (siehe stripeKonfiguration.ts,
 * "keine stillen Ausweichwege").
 *
 * ── Texte im ZIP ───────────────────────────────────────────────────────
 * Die Texte der Bestellung stehen in der Liste der Kundendateien wie die
 * Logos – deshalb liegen sie auch im ZIP: je Text ein PNG mit transparentem
 * Hintergrund in Druckgröße (die Datei für die DTF-Bestellung, siehe
 * lib/admin/textDateien.ts). Ein Text, der sich nicht erzeugen lässt, steht
 * wie eine fehlende Logo-Datei in FEHLENDE_DATEIEN.txt.
 */
import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';
import { istSicherePfadkomponente } from '@/lib/upload/pruefeUpload';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import { createAdminClient } from '@/lib/supabase/server';
import { ladeKundendateienFuerZip, ladeKundendateiBytes, MAX_DATEIEN_IM_ZIP } from '@/lib/admin/kundendateien';
import { ladeTexteFuerZip, ladeTextBytesFuerZip } from '@/lib/admin/textDateien';

// Mehrere Texte werden beim Zusammenstellen in Druckgröße gerastert.
export const maxDuration = 30;

function sichererHeaderName(roh: string, ersatz: string): string {
  const bereinigt = roh.replace(/[\r\n"\\]/g, '').trim();
  return bereinigt.length > 0 && bereinigt.length <= 200 ? bereinigt : ersatz;
}

export async function GET(_request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  if (!(await istAdmin())) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!istSicherePfadkomponente(params.id)) {
    return NextResponse.json({ fehler: 'Ungültige Bestellkennung.' }, { status: 400 });
  }

  const eintraege = await ladeKundendateienFuerZip(params.id);
  const texteintraege = await ladeTexteFuerZip(params.id);
  const gesamt = eintraege.length + texteintraege.length;
  if (gesamt === 0) {
    return NextResponse.json({ fehler: 'Diese Bestellung hat keine Kundendateien (keine Logos und keine Texte).' }, { status: 404 });
  }
  if (gesamt > MAX_DATEIEN_IM_ZIP) {
    return NextResponse.json(
      {
        fehler:
          `Diese Bestellung hat ${gesamt} Dateien (Logos und Texte) – mehr als das Limit von ${MAX_DATEIEN_IM_ZIP} für den ` +
          `ZIP-Sammel-Download. Bitte die Dateien einzeln herunterladen.`,
      },
      { status: 413 }
    );
  }

  let geladen: Awaited<ReturnType<typeof ladeKundendateiBytes>>['geladen'];
  let fehlgeschlagen: Awaited<ReturnType<typeof ladeKundendateiBytes>>['fehlgeschlagen'];
  try {
    ({ geladen, fehlgeschlagen } = await ladeKundendateiBytes(eintraege));
  } catch (fehler) {
    // Einzige Fehlerquelle hier: MAX_DATEIEN_IM_ZIP überschritten (siehe
    // kundendateien.ts) – eine erwartbare, dem Admin klar zu erklärende
    // Grenze, kein unerwarteter Serverfehler.
    return NextResponse.json(
      { fehler: fehler instanceof Error ? fehler.message : 'ZIP konnte nicht erstellt werden.' },
      { status: 413 }
    );
  }

  // Texte: erst nach den Logos und nacheinander gerastert (siehe textDateien.ts).
  const texte = await ladeTextBytesFuerZip(params.id, texteintraege);
  geladen.push(...texte.geladen);
  fehlgeschlagen.push(...texte.fehlgeschlagen);

  const zip = new JSZip();
  for (const datei of geladen) {
    zip.file(datei.zipEintragsname, datei.bytes);
  }
  if (fehlgeschlagen.length > 0) {
    const hinweis =
      `${fehlgeschlagen.length} von ${gesamt} Datei(en) konnten nicht eingepackt werden ` +
      `(Logos: vermutlich im Storage gelöscht, siehe DSGVO-Löschroutine, oder ohne hinterlegten Original-Pfad; ` +
      `Texte: Bilddatei konnte nicht erzeugt werden):\n\n` +
      fehlgeschlagen.map((f) => `- ${f.zipEintragsname}: ${f.grund}`).join('\n');
    zip.file('FEHLENDE_DATEIEN.txt', hinweis);
  }

  const inhalt = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  // Migration 0036 (Bestellnummer-Jahreswechsel-Fix): gespeicherter Wert
  // bevorzugt, buildOrderNumber(params.id) nur als Rückfall.
  const { data: orderRow } = await createAdminClient().from('orders').select('order_number').eq('id', params.id).maybeSingle();
  const orderNumber = (orderRow?.order_number as string | null) ?? buildOrderNumber(params.id);
  const dateiname = sichererHeaderName(`Bestellung-${orderNumber}-Kundendateien.zip`, 'Kundendateien.zip');

  return new NextResponse(new Uint8Array(inhalt), {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${dateiname}"`,
      'cache-control': 'private, no-store',
    },
  });
}
