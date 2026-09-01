/**
 * TEMPORÄRE Diagnose-Route für den DHL-401-Blocker (Go-Live-Audit, 2026-09-01).
 * Gibt AUSSCHLIESSLICH Vorhanden/Fehlt + Zeichenlängen zurück, NIEMALS die
 * eigentlichen Zugangsdatenwerte. Wird nach der Prüfung wieder entfernt
 * (gleiches Muster wie die früheren diag-paypal/diag-resend-Routen).
 */
import { NextResponse } from 'next/server';
import { istAdmin } from '@/lib/admin/auth';

const VARS = ['DHL_API_KEY', 'DHL_API_SECRET', 'DHL_USERNAME', 'DHL_PASSWORD', 'DHL_BILLING_NUMBER', 'DHL_ENV'] as const;

export async function GET(): Promise<NextResponse> {
  if (!(await istAdmin())) {
    return NextResponse.json({ fehler: 'nicht angemeldet' }, { status: 401 });
  }

  const stand: Record<string, { gesetzt: boolean; laenge: number; hatFuehrendesOderNachgestelltesLeerzeichen: boolean }> = {};
  for (const name of VARS) {
    const wert = process.env[name];
    stand[name] = {
      gesetzt: Boolean(wert),
      laenge: wert?.length ?? 0,
      hatFuehrendesOderNachgestelltesLeerzeichen: wert ? wert !== wert.trim() : false,
    };
  }

  const dhlEnvWert = process.env.DHL_ENV ?? null;
  const produktiv = dhlEnvWert === 'production';
  const authUrl = produktiv
    ? 'https://api-eu.dhl.com/parcel/de/account/auth/ropc/v1/token'
    : 'https://api-sandbox.dhl.com/parcel/de/account/auth/ropc/v1/token';

  return NextResponse.json({
    variablen: stand,
    dhlEnvWert,
    produktivUmgebungErkannt: produktiv,
    tatsaechlichAngesprocheneAuthUrl: authUrl,
  });
}
