/**
 * TEMPORÄRE Diagnose-Route für den Go-Live-Abnahmetest (2026-09-01) – wird
 * nach der Prüfung wieder entfernt, kein dauerhafter Bestandteil der App.
 *
 * Fragt den ECHTEN Zustellstatus einer bereits gesendeten E-Mail direkt bei
 * Resend ab (GET /emails/{id}), damit sich unabhängig von unserem eigenen
 * "email_sent"-Ereignis (das nur bestätigt, dass Resend die Anfrage
 * ANGENOMMEN hat, nicht, dass sie im Postfach ankam) klären lässt, was
 * tatsächlich zugestellt wurde. Nutzt RESEND_API_KEY, bereits produktiv
 * hinterlegt – gibt ausschließlich strukturelle Statusfelder zurück, nie
 * den API-Schlüssel selbst.
 *
 * istAdmin()-geschützt wie jede andere Admin-Route. Nimmt die Resend-
 * Message-ID als Query-Parameter (?id=...), keine Bestell-ID nötig – die
 * IDs kommen bereits aus orders.order_confirmation-Ereignissen, die der
 * Admin ohnehin einsehen kann.
 */
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await istAdmin())) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }

  const messageId = new URL(request.url).searchParams.get('id');
  if (!messageId || !/^[a-f0-9-]{36}$/i.test(messageId)) {
    return NextResponse.json({ fehler: 'Ungültige oder fehlende Message-ID (?id=...).' }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ fehler: 'RESEND_API_KEY nicht gesetzt.' }, { status: 500 });
  }

  const res = await fetch(`https://api.resend.com/emails/${messageId}`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  const daten = await res.json();

  if (!res.ok) {
    return NextResponse.json({ fehler: `Resend-Abfrage fehlgeschlagen (${res.status}).`, resendAntwort: daten }, { status: 502 });
  }

  return NextResponse.json({
    id: daten.id,
    from: daten.from,
    to: daten.to,
    subject: daten.subject,
    created_at: daten.created_at,
    last_event: daten.last_event,
    attachmentsCount: Array.isArray(daten.attachments) ? daten.attachments.length : null,
  });
}
