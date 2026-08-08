/**
 * Datenzugriff des Kundenkontos – ausschließlich über den Admin-Client
 * (Service-Role), exakt wie überall sonst im Projekt (docs/architektur.md
 * §5). RLS auf customer_profiles/customer_addresses ist Verteidigung in der
 * Tiefe, nicht der Zugriffsweg der Anwendung.
 *
 * Jede Funktion hier bekommt die Kunden-ID bereits GEPRÜFT übergeben (siehe
 * lib/actions/konto.ts, das sie über den SSR-Client aus der Sitzung liest) –
 * dieses Modul vertraut der übergebenen ID, prüft aber bei Adressen
 * zusätzlich per WHERE, dass die Zeile wirklich diesem Kunden gehört
 * (Verteidigung in der Tiefe gegen eine versehentlich falsche ID).
 */
import { createAdminClient } from '@/lib/supabase/server';
import { buildOrderNumber } from '@/lib/actions/orderTypes';
import type { KundenAdresse, KundenAdresseEingabe, KundenBestellungZeile, KundenProfil } from './types';

export async function ladeProfil(kundenId: string, email: string): Promise<KundenProfil | null> {
  const db = createAdminClient();
  const { data, error } = await db.from('customer_profiles').select('*').eq('id', kundenId).maybeSingle();
  if (error) {
    console.error('[konto] Profil konnte nicht geladen werden:', error.message);
    return null;
  }
  // Der Datenbank-Trigger (Migration 0023) legt das Profil beim Erstellen
  // des Kontos automatisch an – ein fehlendes Profil ist also ein
  // unerwarteter Zustand, kein Normalfall. Trotzdem robust: leeres Profil
  // statt Absturz, damit die Seite nutzbar bleibt.
  if (!data) {
    return { id: kundenId, email, displayName: null, phone: null, company: null, vatId: null, avatarUrl: null, newsletterOptIn: false, createdAt: new Date().toISOString() };
  }
  return {
    id: data.id as string,
    email,
    displayName: (data.display_name as string | null) ?? null,
    phone: (data.phone as string | null) ?? null,
    company: (data.company as string | null) ?? null,
    vatId: (data.vat_id as string | null) ?? null,
    avatarUrl: (data.avatar_url as string | null) ?? null,
    newsletterOptIn: Boolean(data.newsletter_opt_in),
    createdAt: data.created_at as string,
  };
}

export interface ProfilAenderung {
  displayName?: string | null;
  phone?: string | null;
  company?: string | null;
  vatId?: string | null;
  avatarUrl?: string | null;
  newsletterOptIn?: boolean;
}

export async function aktualisiereProfil(kundenId: string, aenderung: ProfilAenderung): Promise<boolean> {
  const db = createAdminClient();
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (aenderung.displayName !== undefined) payload.display_name = aenderung.displayName;
  if (aenderung.phone !== undefined) payload.phone = aenderung.phone;
  if (aenderung.company !== undefined) payload.company = aenderung.company;
  if (aenderung.vatId !== undefined) payload.vat_id = aenderung.vatId;
  if (aenderung.avatarUrl !== undefined) payload.avatar_url = aenderung.avatarUrl;
  if (aenderung.newsletterOptIn !== undefined) {
    payload.newsletter_opt_in = aenderung.newsletterOptIn;
    payload.newsletter_opt_in_at = aenderung.newsletterOptIn ? new Date().toISOString() : null;
  }
  const { error } = await db.from('customer_profiles').update(payload).eq('id', kundenId);
  if (error) console.error('[konto] Profil konnte nicht aktualisiert werden:', error.message);
  return !error;
}

function zuAdresse(row: Record<string, unknown>): KundenAdresse {
  return {
    id: row.id as string,
    label: (row.label as string | null) ?? null,
    firstName: row.first_name as string,
    lastName: row.last_name as string,
    company: (row.company as string | null) ?? null,
    street: row.street as string,
    zip: row.zip as string,
    city: row.city as string,
    country: row.country as string,
    phone: (row.phone as string | null) ?? null,
    isDefault: Boolean(row.is_default),
  };
}

export async function ladeAdressen(kundenId: string): Promise<KundenAdresse[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('customer_addresses')
    .select('*')
    .eq('customer_id', kundenId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) {
    console.error('[konto] Adressen konnten nicht geladen werden:', error.message);
    return [];
  }
  return (data ?? []).map(zuAdresse);
}

/** Die Standardadresse, falls vorhanden – zur Vorbelegung im Checkout. */
export async function ladeStandardadresse(kundenId: string): Promise<KundenAdresse | null> {
  const alle = await ladeAdressen(kundenId);
  return alle.find((a) => a.isDefault) ?? alle[0] ?? null;
}

/**
 * Legt eine Adresse an. Ist es die erste Adresse des Kunden, wird sie
 * automatisch zur Standardadresse – niemand soll eine leere Standardauswahl
 * vorfinden, wenn es ohnehin nur eine Möglichkeit gibt.
 */
export async function legeAdresseAn(kundenId: string, eingabe: KundenAdresseEingabe & { label?: string | null }): Promise<{ ok: boolean; fehler?: string }> {
  const db = createAdminClient();
  const bestehende = await ladeAdressen(kundenId);
  const basisEintrag = {
    customer_id: kundenId,
    label: eingabe.label ?? null,
    first_name: eingabe.firstName,
    last_name: eingabe.lastName,
    company: eingabe.company,
    street: eingabe.street,
    zip: eingabe.zip,
    city: eingabe.city,
    country: eingabe.country,
    phone: eingabe.phone,
  };
  const { error } = await db.from('customer_addresses').insert({ ...basisEintrag, is_default: bestehende.length === 0 });
  if (error) {
    // Zwei nahezu gleichzeitige "erste Adresse anlegen"-Aufrufe (zwei Tabs,
    // Doppelklick auf langsamer Verbindung) lesen beide bestehende.length
    // === 0 und versuchen beide is_default: true. Der partielle Unique-Index
    // customer_addresses_ein_standard_je_kunde lässt nur einen davon zu –
    // ohne diesen Wiederholungsversuch ginge die zweite, fachlich gültige
    // Adresse komplett verloren statt nur ihr Standard-Flag.
    if (error.code === '23505' && error.message.includes('customer_addresses_ein_standard_je_kunde')) {
      const { error: zweiterVersuch } = await db.from('customer_addresses').insert({ ...basisEintrag, is_default: false });
      if (!zweiterVersuch) return { ok: true };
      console.error('[konto] Adresse konnte auch im zweiten Versuch nicht angelegt werden:', zweiterVersuch.message);
      return { ok: false, fehler: 'Die Adresse konnte nicht gespeichert werden.' };
    }
    console.error('[konto] Adresse konnte nicht angelegt werden:', error.message);
    return { ok: false, fehler: 'Die Adresse konnte nicht gespeichert werden.' };
  }
  return { ok: true };
}

export async function aktualisiereAdresse(
  kundenId: string,
  adresseId: string,
  eingabe: KundenAdresseEingabe & { label?: string | null }
): Promise<{ ok: boolean; fehler?: string }> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('customer_addresses')
    .update({
      label: eingabe.label ?? null,
      first_name: eingabe.firstName,
      last_name: eingabe.lastName,
      company: eingabe.company,
      street: eingabe.street,
      zip: eingabe.zip,
      city: eingabe.city,
      country: eingabe.country,
      phone: eingabe.phone,
    })
    // Beide Bedingungen: verhindert, dass eine Kunden-ID die Adresse eines
    // ANDEREN Kontos träfe, selbst bei einem Fehler weiter oben im Aufrufer.
    .eq('id', adresseId)
    .eq('customer_id', kundenId)
    .select('id');
  if (error || !data || data.length === 0) {
    console.error('[konto] Adresse konnte nicht aktualisiert werden:', error?.message ?? 'keine passende Zeile');
    return { ok: false, fehler: 'Die Adresse konnte nicht aktualisiert werden.' };
  }
  return { ok: true };
}

export async function loescheAdresse(kundenId: string, adresseId: string): Promise<{ ok: boolean; fehler?: string }> {
  const db = createAdminClient();
  const { error } = await db.from('customer_addresses').delete().eq('id', adresseId).eq('customer_id', kundenId);
  if (error) {
    console.error('[konto] Adresse konnte nicht gelöscht werden:', error.message);
    return { ok: false, fehler: 'Die Adresse konnte nicht gelöscht werden.' };
  }
  return { ok: true };
}

/**
 * Setzt EINE Adresse als Standard, alle anderen werden zurückgesetzt.
 *
 * Zwei Schritte statt einer Transaktion: Der Unique-Index
 * (customer_addresses_ein_standard_je_kunde) erlaubt ohnehin nur höchstens
 * eine `is_default = true`-Zeile je Kunde – ein Zwischenzustand mit zwei
 * Standardadressen kann dadurch nicht bestehen bleiben, selbst wenn der
 * zweite Schritt fehlschlägt.
 */
export async function setzeStandardadresse(kundenId: string, adresseId: string): Promise<{ ok: boolean; fehler?: string }> {
  const db = createAdminClient();
  const { error: zuruecksetzenFehler } = await db
    .from('customer_addresses')
    .update({ is_default: false })
    .eq('customer_id', kundenId)
    .neq('id', adresseId);
  if (zuruecksetzenFehler) {
    return { ok: false, fehler: 'Die Standardadresse konnte nicht geändert werden.' };
  }
  const { error } = await db
    .from('customer_addresses')
    .update({ is_default: true })
    .eq('id', adresseId)
    .eq('customer_id', kundenId);
  if (error) {
    console.error('[konto] Standardadresse konnte nicht gesetzt werden:', error.message);
    return { ok: false, fehler: 'Die Standardadresse konnte nicht geändert werden.' };
  }
  return { ok: true };
}

/**
 * Bestellhistorie des Kontos. Sichtbarkeitsregel bewusst GLEICH wie im
 * Adminbereich (imAdminSichtbar würde hier zu viel verbergen) – anders: Der
 * Kunde soll JEDE eigene Bestellung sehen, auch eine gerade erst angelegte
 * oder eine stornierte. Es gibt keinen Grund, ihm die eigene Historie
 * unvollständig zu zeigen.
 */
export async function ladeBestellungenDesKunden(kundenId: string): Promise<KundenBestellungZeile[]> {
  const db = createAdminClient();
  const { data, error } = await db
    .from('orders')
    .select('id, created_at, order_type, status, total_price')
    .eq('customer_id', kundenId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) {
    console.error('[konto] Bestellungen konnten nicht geladen werden:', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id as string,
    bestellnummer: buildOrderNumber(row.id as string),
    bestelltAm: row.created_at as string,
    orderType: row.order_type as 'inquiry' | 'order',
    status: row.status as string,
    totalPrice: Number(row.total_price ?? 0),
  }));
}

/** Gehört diese Bestellung diesem Konto? Für orderAccess.ts (Zweig 'konto'). */
export async function gehoertBestellungKunden(orderId: string, kundenId: string): Promise<boolean> {
  const db = createAdminClient();
  const { data, error } = await db.from('orders').select('id').eq('id', orderId).eq('customer_id', kundenId).maybeSingle();
  return !error && Boolean(data);
}
