'use server';

/**
 * Server Actions für die nachträgliche Auftragsänderung im Adminbereich
 * (Position entfernen / Stückzahl verringern).
 *
 * Reine Vermittlung, exakt wie orderStatusActions.ts/refundActions.ts: Die
 * Berechtigung wird HIER geprüft (`istAdmin()` – jede Action einzeln, nie
 * „die Seite hat es ja schon geprüft“), die Eingabe aus dem Browser wird als
 * unvertrauenswürdiges JSON gelesen, die Fachlogik liegt vollständig in
 * lib/orders/orderEdit.ts (rein) und orderEditService.ts (Ablauf).
 *
 * Es gibt drei Actions:
 *  • `berechneAuftragsaenderung`  – Vorschau, schreibt und versendet NICHTS.
 *  • `wendeAuftragsaenderungAn`   – speichert atomar, danach Mail (wählbar).
 *  • `vermerkeErstattungVonHand`  – hält eine vom Betreiber selbst ausgelöste
 *                                   Teilerstattung fest (bewegt kein Geld).
 */
import { revalidatePath } from 'next/cache';
import { istAdmin } from '@/lib/admin/auth';
import { liesAenderungen, type AenderungsVorschau, type BestaetigungsCode } from '@/lib/orders/orderEdit';
import {
  erstelleAenderungsVorschau,
  vermerkeManuelleErstattung,
  wendeAenderungAn,
  type AenderungsAusgang,
} from '@/lib/orders/orderEditService';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BESTAETIGUNGEN: readonly BestaetigungsCode[] = ['rechnung-korrektur', 'erstattung-manuell', 'ware-bereits-bestellt'];

export type VorschauAntwort = { ok: true; vorschau: AenderungsVorschau } | { ok: false; meldung: string; details?: string[] };

export type AenderungsAntwort =
  | {
      ok: true;
      meldung: string;
      ausgang: Extract<AenderungsAusgang, { ok: true }>;
    }
  | { ok: false; meldung: string; details?: string[] };

export interface ErstattungsVermerkAntwort {
  ok: boolean;
  meldung: string;
}

export async function berechneAuftragsaenderung(orderId: string, roheAenderungen: unknown): Promise<VorschauAntwort> {
  if (!(await istAdmin())) return { ok: false, meldung: 'Nicht angemeldet.' };
  if (typeof orderId !== 'string' || !UUID.test(orderId)) return { ok: false, meldung: 'Ungültige Bestellung.' };

  const gelesen = liesAenderungen(roheAenderungen);
  if (!gelesen.ok) return { ok: false, meldung: gelesen.meldung };

  const ergebnis = await erstelleAenderungsVorschau(orderId, gelesen.aenderungen);
  if (!ergebnis.ok) return { ok: false, meldung: ergebnis.meldung, details: ergebnis.details };
  return { ok: true, vorschau: ergebnis.vorschau };
}

export async function wendeAuftragsaenderungAn(
  orderId: string,
  roheAenderungen: unknown,
  optionen: {
    begruendung: string;
    mailSenden: boolean;
    bestaetigungen: string[];
    erwartet: { altCent: number; neuCent: number };
  }
): Promise<AenderungsAntwort> {
  if (!(await istAdmin())) return { ok: false, meldung: 'Nicht angemeldet.' };
  if (typeof orderId !== 'string' || !UUID.test(orderId)) return { ok: false, meldung: 'Ungültige Bestellung.' };

  const gelesen = liesAenderungen(roheAenderungen);
  if (!gelesen.ok) return { ok: false, meldung: gelesen.meldung };

  const o = optionen as Partial<typeof optionen> | null | undefined;
  const erwartet = o?.erwartet;
  if (
    typeof o?.begruendung !== 'string' ||
    typeof o.mailSenden !== 'boolean' ||
    !Array.isArray(o.bestaetigungen) ||
    !erwartet ||
    !Number.isInteger(erwartet.altCent) ||
    !Number.isInteger(erwartet.neuCent)
  ) {
    return { ok: false, meldung: 'Ungültige Angaben.' };
  }
  // Unbekannte Bestätigungen werden verworfen, nicht durchgereicht: Es zählt nur, was der Server selbst verlangt.
  const bestaetigungen = o.bestaetigungen.filter((b): b is BestaetigungsCode => BESTAETIGUNGEN.includes(b as BestaetigungsCode));

  const ausgang = await wendeAenderungAn(orderId, {
    aenderungen: gelesen.aenderungen,
    begruendung: o.begruendung,
    mailSenden: o.mailSenden,
    bestaetigungen,
    erwartet: { altCent: erwartet.altCent, neuCent: erwartet.neuCent },
  });

  if (!ausgang.ok) return { ok: false, meldung: ausgang.meldung, details: ausgang.details };

  revalidatePath(`/admin/bestellung/${orderId}`);
  revalidatePath('/admin');

  const mailText: Record<typeof ausgang.kundenmail, string> = {
    gesendet: 'Die Kundschaft wurde per Mail informiert.',
    fehlgeschlagen: 'Die Mail an die Kundschaft ist NICHT rausgegangen.',
    abgewaehlt: 'Es wurde keine Mail an die Kundschaft versendet (abgewählt).',
    'keine-adresse': 'Es wurde keine Mail versendet (keine Adresse hinterlegt).',
  };
  return { ok: true, meldung: `Auftrag geändert. ${mailText[ausgang.kundenmail]}`, ausgang };
}

export async function vermerkeErstattungVonHand(orderId: string, betragCent: number, notiz: string): Promise<ErstattungsVermerkAntwort> {
  if (!(await istAdmin())) return { ok: false, meldung: 'Nicht angemeldet.' };
  if (typeof orderId !== 'string' || !UUID.test(orderId)) return { ok: false, meldung: 'Ungültige Bestellung.' };
  if (typeof betragCent !== 'number' || typeof notiz !== 'string') return { ok: false, meldung: 'Ungültige Angaben.' };

  const ergebnis = await vermerkeManuelleErstattung(orderId, betragCent, notiz);
  if (!ergebnis.ok) return { ok: false, meldung: ergebnis.meldung };

  revalidatePath(`/admin/bestellung/${orderId}`);
  return { ok: true, meldung: 'Vermerkt. Das System hat dabei nichts erstattet – nur festgehalten, dass du es selbst getan hast.' };
}
