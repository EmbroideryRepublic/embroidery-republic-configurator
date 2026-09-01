/**
 * TEMPORÄRE Diagnose-Route für den Go-Live-Abnahmetest (2026-09-01) – wird
 * nach der Prüfung wieder entfernt, kein dauerhafter Bestandteil der App.
 *
 * Fragt den ECHTEN Status einer PayPal-Order direkt bei PayPal ab (GET
 * /v2/checkout/orders/{id}), damit sich unabhängig vom eigenen Webhook
 * klären lässt, ob PayPal die Zahlung als abgeschlossen führt. Nutzt
 * dieselben, bereits produktiv hinterlegten Zugangsdaten wie paypal.ts –
 * diese Route gibt AUSSCHLIESSLICH strukturelle Status-Felder zurück,
 * niemals client_id/client_secret oder sonstige Zugangsdaten.
 *
 * istAdmin()-geschützt wie jede andere Admin-Route.
 */
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';
import { createAdminClient } from '@/lib/supabase/server';
import { istSicherePfadkomponente } from '@/lib/upload/pruefeUpload';
import { leseClientZugangsdaten, paypalBasisUrl } from '@/lib/payments/providers/paypalKonfiguration';

export async function GET(_request: Request, { params }: { params: { id: string } }): Promise<NextResponse> {
  if (!(await istAdmin())) {
    return NextResponse.json({ fehler: 'Nicht angemeldet.' }, { status: 401 });
  }
  if (!istSicherePfadkomponente(params.id)) {
    return NextResponse.json({ fehler: 'Ungültige Bestellkennung.' }, { status: 400 });
  }

  const db = createAdminClient();
  const { data: order, error } = await db
    .from('orders')
    .select('id, payment_reference, payment_provider, payment_status')
    .eq('id', params.id)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ fehler: 'Bestellung nicht gefunden.' }, { status: 404 });
  }
  if (order.payment_provider !== 'paypal' || !order.payment_reference) {
    return NextResponse.json({ fehler: 'Keine PayPal-Referenz an dieser Bestellung.' }, { status: 400 });
  }

  const { clientId, clientSecret } = leseClientZugangsdaten();
  const tokenRes = await fetch(`${paypalBasisUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!tokenRes.ok) {
    return NextResponse.json({ fehler: `OAuth-Token nicht erhalten (${tokenRes.status}).` }, { status: 502 });
  }
  const { access_token } = (await tokenRes.json()) as { access_token: string };

  const orderRes = await fetch(`${paypalBasisUrl()}/v2/checkout/orders/${order.payment_reference}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  const paypalOrder = await orderRes.json();

  if (!orderRes.ok) {
    return NextResponse.json(
      { fehler: `PayPal-Abfrage fehlgeschlagen (${orderRes.status}).`, paypalAntwort: paypalOrder },
      { status: 502 }
    );
  }

  const captures =
    paypalOrder.purchase_units?.flatMap(
      (pu: { payments?: { captures?: { id: string; status: string; create_time: string; amount?: { value: string; currency_code: string } }[] } }) =>
        pu.payments?.captures ?? []
    ) ?? [];

  return NextResponse.json({
    unsereBestellung: { id: order.id, payment_reference: order.payment_reference, payment_status_bei_uns: order.payment_status },
    paypal: {
      orderId: paypalOrder.id,
      status: paypalOrder.status,
      create_time: paypalOrder.create_time,
      update_time: paypalOrder.update_time,
      intent: paypalOrder.intent,
      captures: captures.map((c: { id: string; status: string; create_time: string; amount?: { value: string; currency_code: string } }) => ({
        id: c.id,
        status: c.status,
        create_time: c.create_time,
        amount: c.amount,
      })),
      payerEmail: paypalOrder.payer?.email_address ?? null,
      custom_id: paypalOrder.purchase_units?.[0]?.custom_id ?? null,
    },
  });
}
