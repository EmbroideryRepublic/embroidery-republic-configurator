'use server';

/**
 * Server Actions des Kundenkontos. Additiv zum bestehenden Gastkauf – siehe
 * supabase/migrations/0023_kundenkonto.sql für die Architekturbegründung.
 *
 * ── Muster ──────────────────────────────────────────────────────────────
 * Auth-Operationen (anmelden/abmelden/Passwort setzen) laufen über den
 * SSR-Client (`lib/supabase/server.ts`, `createClient()`) – er liest UND
 * schreibt die Sitzungs-Cookies in genau diesem Server-Action-Aufruf.
 * Profil-/Adressdaten laufen wie überall im Projekt über den Admin-Client
 * (`createAdminClient()`), erst NACHDEM `aktuellerKunde()` die Sitzung
 * geprüft hat.
 *
 * ── Eigene, gebrandete E-Mails statt Supabases Standard-Vorlagen ───────
 * `admin.generateLink()` erzeugt den Bestätigungs-/Reset-Link, OHNE dass
 * Supabase selbst eine E-Mail verschickt – verschickt wird sie über den
 * immer schon vorhandenen `sendEmail()`-Weg (Resend), mit den gleichen
 * Marken-Vorlagen wie die Bestellbestätigung. Ein Konto, ohne diesen Weg,
 * bekäme Supabases generische Vorlage – nicht das „Premium"-Niveau, das für
 * jede andere Mail in diesem Projekt gilt.
 */
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { basisUrl } from '@/lib/seo/basisUrl';
import { pruefeRateLimit } from '@/lib/security/rateLimit';
import { protokoll } from '@/lib/observability/log';
import { sendEmail } from '@/lib/email/sendEmail';
import { aktuellerKunde, istRecoverySitzung } from '@/lib/account/session';
import {
  aktualisiereAdresse as aktualisiereAdresseDb,
  aktualisiereProfil as aktualisiereProfilDb,
  ladeProfil as ladeProfilDb,
  ladeStandardadresse as ladeStandardadresseDb,
  legeAdresseAn as legeAdresseAnDb,
  loescheAdresse as loescheAdresseDb,
  setzeStandardadresse as setzeStandardadresseDb,
} from '@/lib/account/data';
import { pruefeAdresse, pruefeEmail, pruefePasswort, pruefeRegistrierung } from '@/lib/account/validation';
import { GRENZEN } from '@/lib/orders/orderValidation';
import type { KundenAdresseEingabe } from '@/lib/account/types';
import { KontoBestaetigenEmail } from '@/lib/email/templates/KontoBestaetigenEmail';
import { PasswortVergessenEmail } from '@/lib/email/templates/PasswortVergessenEmail';
import { PasswortGeaendertEmail } from '@/lib/email/templates/PasswortGeaendertEmail';
import { NewsletterOptInEmail } from '@/lib/email/templates/NewsletterOptInEmail';
import { KontoWillkommenEmail } from '@/lib/email/templates/KontoWillkommenEmail';

export interface KontoActionResult {
  success: boolean;
  /** Bei Erfolg gelegentlich eine Statusmeldung (z.B. "E-Mail gesendet"),
   *  bei Misserfolg der Fehlergrund – dieselbe Doppelnutzung wie in
   *  lib/actions/admin.ts (`beendeAlleSitzungenAction`). */
  error?: string;
}

function ersterFehler(befunde: { meldung: string }[]): string | undefined {
  return befunde[0]?.meldung;
}

/**
 * Kapselt die Erstellung eines Supabase-Clients fehlersicher.
 *
 * Fehlt oder stimmt die Supabase-Konfiguration nicht, werfen
 * `createServerClient`/`createClient` (lib/supabase/server.ts) SYNCHRON –
 * ungefangen würde das die komplette Server Action (und damit die aufrufende
 * Formular-Komponente) mit einer unbehandelten Exception abstürzen lassen,
 * statt die im Code sorgfältig entworfene Fehlermeldung zu zeigen. Dasselbe
 * Prinzip wie `aktuellerKunde()` (lib/account/session.ts) und `istAdmin()`
 * (lib/admin/auth.ts): bei Zweifel fail-closed, nie ungefangen durchreichen.
 */
function sichererClient<T>(fabrik: () => T): T | null {
  try {
    return fabrik();
  } catch (fehler) {
    protokoll.fehler('AUTH', 'supabase_client_fehlgeschlagen', 'Supabase-Client konnte nicht erstellt werden.', fehler);
    return null;
  }
}

type SupabaseServerClient = ReturnType<typeof createClient>;

/**
 * Bestätigt per erneuter Anmeldung, dass die anfragende Person das aktuelle
 * Passwort kennt – Re-Authentifizierung vor sicherheitskritischen Änderungen
 * (E-Mail ändern, Passwort ändern, Konto löschen). Eine noch gültige, aber
 * z.B. an einem fremden Gerät offen gelassene Sitzung darf solche Aktionen
 * nicht allein auslösen können; dieselbe Prüfung, die Bank- und
 * Mail-Anbieter mit "aktuelles Passwort bestätigen" durchsetzen.
 *
 * `kontext` fließt nur ins Protokoll (z.B. 'email_aendern', 'passwort_aendern',
 * 'konto_loeschen') – für die Kundschaft ist die Fehlermeldung immer gleich.
 */
async function bestaetigePasswort(
  supabase: SupabaseServerClient,
  email: string,
  passwort: string,
  kontext: string
): Promise<{ ok: true } | { ok: false; fehler: string }> {
  try {
    const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
    if (error) {
      protokoll.info('AUTH', `${kontext}_reauth_fehlgeschlagen`, email);
      return { ok: false, fehler: 'Das aktuelle Passwort ist nicht korrekt.' };
    }
    return { ok: true };
  } catch (fehler) {
    protokoll.fehler('AUTH', `${kontext}_reauth_fehlgeschlagen`, email, fehler);
    return { ok: false, fehler: 'Diese Aktion ist derzeit nicht möglich. Bitte versuchen Sie es später erneut.' };
  }
}

// ── Registrierung ──────────────────────────────────────────────────────

export async function registrierenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const passwort = String(formData.get('passwort') ?? '');
  const passwortWiederholung = String(formData.get('passwortWiederholung') ?? '');
  const einwilligungAgb = formData.get('einwilligungAgb') === 'on';
  const newsletterOptIn = formData.get('newsletter') === 'on';

  const befunde = pruefeRegistrierung({ email, passwort, passwortWiederholung, einwilligungAgb });
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const grenze = await pruefeRateLimit('kontoRegistrierung');
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const admin = sichererClient(createAdminClient);
  if (!admin) return { success: false, error: 'Die Registrierung ist derzeit nicht möglich. Bitte versuchen Sie es später erneut.' };
  // Die Newsletter-Absicht wandert nur als Query-Parameter im Bestätigungs-
  // link mit – geschrieben und verschickt wird sie ERST im Callback, NACHDEM
  // der Klick auf den Link die E-Mail-Adresse tatsächlich bestätigt hat
  // (siehe app/auth/callback/route.ts → aktiviereNewsletterNachBestaetigung).
  // Vorher zu schreiben hieße, eine noch unbestätigte Adresse in den
  // Newsletterverteiler aufzunehmen und ihr sofort eine Mail zu schicken.
  const redirectTo = `${basisUrl()}/auth/callback?typ=registrierung${newsletterOptIn ? '&newsletter=1' : ''}`;
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'signup',
    email,
    password: passwort,
    options: { redirectTo },
  });

  if (error) {
    // Kundenmeldung bewusst ohne technisches Detail – dasselbe Prinzip wie
    // pruefeUpload.ts: Grund fürs Protokoll, verständlicher Satz für die
    // Kundschaft. "Bereits registriert" ist hier ausdrücklich kein Leck,
    // sondern die einzig hilfreiche Auskunft (Standard-UX für Registrierung,
    // anders als beim geheimen Storno-Token).
    protokoll.warnung('AUTH', 'registrierung_fehlgeschlagen', error.message);
    const bekannt = /already registered|already exists|already been registered/i.test(error.message);
    return {
      success: false,
      error: bekannt
        ? 'Für diese E-Mail-Adresse besteht bereits ein Konto. Bitte melden Sie sich an oder setzen Sie Ihr Passwort zurück.'
        : 'Die Registrierung ist fehlgeschlagen. Bitte versuchen Sie es erneut.',
    };
  }

  const bestaetigungsLink = data.properties?.action_link;
  if (bestaetigungsLink) {
    await sendEmail({
      to: email,
      subject: 'Bitte bestätigen Sie Ihre E-Mail-Adresse',
      react: KontoBestaetigenEmail({ bestaetigungsUrl: bestaetigungsLink }),
      kontext: { anlass: 'konto_registrierung' },
    });
  } else {
    protokoll.fehler('AUTH', 'registrierung_ohne_link', 'generateLink lieferte keinen action_link.');
  }

  return { success: true };
}

// ── Anmeldung / Abmeldung ───────────────────────────────────────────────

export async function anmeldenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const passwort = String(formData.get('passwort') ?? '');
  if (!email || !passwort) return { success: false, error: 'Bitte E-Mail-Adresse und Passwort angeben.' };

  const grenze = await pruefeRateLimit('kontoAnmeldung', email);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const supabase = sichererClient(createClient);
  if (!supabase) return { success: false, error: 'Die Anmeldung ist derzeit nicht möglich. Bitte versuchen Sie es später erneut.' };
  const { error } = await supabase.auth.signInWithPassword({ email, password: passwort });
  if (error) {
    // Nie verraten, WAS falsch war (E-Mail unbekannt vs. Passwort falsch) –
    // dieselbe Zusammenfassung wie orderAccess.ts bei einem Token.
    protokoll.info('AUTH', 'anmeldung_fehlgeschlagen', email);
    return { success: false, error: 'E-Mail-Adresse oder Passwort ist falsch.' };
  }

  revalidatePath('/konto');
  return { success: true };
}

export async function abmeldenAction(): Promise<void> {
  // Best-effort: Schlägt die Client-Erstellung oder das Abmelden fehl, soll
  // die Person trotzdem auf die Startseite gelangen – wie überall sonst hier
  // bleibt `redirect()` bewusst AUSSERHALB des try/catch, weil Next.js es
  // intern über einen geworfenen Spezialfehler umsetzt, den ein umschließendes
  // catch sonst verschlucken und die Navigation damit stillschweigend
  // verhindern würde.
  const supabase = sichererClient(createClient);
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (fehler) {
      protokoll.fehler('AUTH', 'abmeldung_fehlgeschlagen', undefined, fehler);
    }
  }
  revalidatePath('/konto');
  redirect('/');
}

// ── Passwort vergessen / zurücksetzen ──────────────────────────────────

export async function passwortVergessenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const befunde = pruefeEmail(email);
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const grenze = await pruefeRateLimit('kontoPasswortVergessen', email);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  // Schlägt sogar die Client-Erstellung fehl, wird unten trotzdem die
  // neutrale Standardmeldung zurückgegeben statt eine abweichende
  // Fehlermeldung – dieselbe Enumeration-Schutz-Logik wie beim fachlichen
  // Fehlerfall weiter unten, nur eine Ursache früher.
  const admin = sichererClient(createAdminClient);
  if (admin) {
    const redirectTo = `${basisUrl()}/auth/callback?typ=zuruecksetzen`;
    const { data, error } = await admin.auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo } });

    if (!error && data.properties?.action_link) {
      await sendEmail({
        to: email,
        subject: 'Passwort zurücksetzen',
        react: PasswortVergessenEmail({ zuruecksetzenUrl: data.properties.action_link }),
        kontext: { anlass: 'konto_passwort_vergessen' },
      });
    } else if (error) {
      // Bewusst NUR protokolliert, nie an die Kundschaft weitergegeben: Eine
      // abweichende Meldung für "unbekannte Adresse" würde verraten, welche
      // E-Mail-Adressen registriert sind (E-Mail-Enumeration).
      protokoll.info('AUTH', 'passwort_vergessen_unbekannte_adresse', error.message);
    }
  }

  // IMMER dieselbe Erfolgsmeldung – unabhängig davon, ob die Adresse
  // existiert. Exakt das Prinzip aus bestellung/[token]/page.tsx: "Ob es
  // die Bestellung [hier: das Konto] gibt, geht niemanden etwas an."
  return { success: true, error: 'Falls ein Konto zu dieser E-Mail-Adresse besteht, haben wir einen Link zum Zurücksetzen gesendet.' };
}

export async function passwortZuruecksetzenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const passwort = String(formData.get('passwort') ?? '');
  const passwortWiederholung = String(formData.get('passwortWiederholung') ?? '');
  const befunde = pruefePasswort(passwort);
  if (passwort !== passwortWiederholung) befunde.push({ feld: 'passwortWiederholung', meldung: 'Die Passwörter stimmen nicht überein.' });
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const supabase = sichererClient(createClient);
  if (!supabase) return { success: false, error: 'Das Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.' };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.' };
  }

  // Dieselbe Prüfung wie beim Rendern der Seite (siehe istRecoverySitzung):
  // Eine ganz normale, bereits angemeldete Sitzung reicht sonst aus, um hier
  // ein neues Passwort zu setzen, ohne das alte zu kennen – die Next.js-
  // Action-ID steckt im ausgelieferten JS-Bundle unabhängig davon, welchen
  // Zweig die Seite gerendert hat. Ohne diese Prüfung in der Mutation selbst
  // schützt die Seiten-Prüfung nur die eigene Oberfläche, nicht die Aktion.
  if (!(await istRecoverySitzung())) {
    return { success: false, error: 'Der Link ist abgelaufen oder wurde bereits verwendet. Bitte fordern Sie einen neuen an.' };
  }

  const { error } = await supabase.auth.updateUser({ password: passwort });
  if (error) {
    protokoll.fehler('AUTH', 'passwort_zuruecksetzen_fehlgeschlagen', error.message);
    return { success: false, error: 'Das Passwort konnte nicht geändert werden. Bitte versuchen Sie es erneut.' };
  }

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: 'Ihr Passwort wurde geändert',
      react: PasswortGeaendertEmail({}),
      kontext: { anlass: 'konto_passwort_geaendert' },
    });
  }
  return { success: true };
}

// ── Profil ───────────────────────────────────────────────────────────────

export async function profilAktualisierenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };

  const feld = (name: string) => {
    const wert = String(formData.get(name) ?? '').trim();
    return wert.length > 0 ? wert : null;
  };

  // Dieselbe Längengrenze wie überall sonst im Projekt (Adressen, Bestell-
  // Kontaktdaten – GRENZEN.maxFeldLaenge). Ohne diese Prüfung landete ein
  // unbegrenzt langer Wert direkt in customer_profiles und tauchte
  // unverändert im nächsten Checkout, in Bestell-E-Mails und im
  // Adminbereich wieder auf.
  const PROFIL_FELDER: { name: string; label: string }[] = [
    { name: 'displayName', label: 'Name' },
    { name: 'phone', label: 'Telefonnummer' },
    { name: 'company', label: 'Firma' },
    { name: 'vatId', label: 'USt-IdNr.' },
  ];
  for (const { name, label } of PROFIL_FELDER) {
    const wert = feld(name);
    if (wert && wert.length > GRENZEN.maxFeldLaenge) {
      return { success: false, error: `${label} darf höchstens ${GRENZEN.maxFeldLaenge} Zeichen lang sein.` };
    }
  }

  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const neuerNewsletterStatus = formData.get('newsletter') === 'on';

  // Die DB-Helfer (lib/account/data.ts) erstellen intern selbst einen
  // Admin-Client – schlägt das fehl, würfe der Aufruf hier ungefangen, weil
  // die Helfer selbst keinen try/catch um die Client-Erstellung legen.
  let ok: boolean;
  try {
    // Vorherigen Stand lesen, um die Bestätigungsmail NUR bei einem echten
    // Übergang false→true zu verschicken – sonst käme bei jedem Speichern des
    // Profils (auch ohne Änderung an dieser Option) eine neue Mail.
    const vorher = await ladeProfilDb(kunde.id, kunde.email);
    const neuAktiviert = neuerNewsletterStatus && vorher?.newsletterOptIn === false;

    ok = await aktualisiereProfilDb(kunde.id, {
      displayName: feld('displayName'),
      phone: feld('phone'),
      company: feld('company'),
      vatId: feld('vatId'),
      newsletterOptIn: neuerNewsletterStatus,
    });

    if (ok && neuAktiviert) {
      await sendEmail({
        to: kunde.email,
        subject: 'Newsletter-Anmeldung bestätigt',
        react: NewsletterOptInEmail({}),
        kontext: { anlass: 'newsletter_opt_in' },
      }).catch(() => {});
    }
  } catch (fehler) {
    protokoll.fehler('AUTH', 'profil_aktualisieren_fehlgeschlagen', undefined, fehler);
    ok = false;
  }

  revalidatePath('/konto/profil');
  return { success: ok, error: ok ? 'Gespeichert.' : 'Das Profil konnte nicht gespeichert werden.' };
}

export async function emailAendernAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };

  const neueEmail = String(formData.get('email') ?? '').trim().toLowerCase();
  const aktuellesPasswort = String(formData.get('aktuellesPasswort') ?? '');
  const befunde = pruefeEmail(neueEmail);
  if (!aktuellesPasswort) befunde.push({ feld: 'aktuellesPasswort', meldung: 'Bitte geben Sie Ihr aktuelles Passwort ein.' });
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const supabase = sichererClient(createClient);
  if (!supabase) return { success: false, error: 'Die E-Mail-Adresse konnte derzeit nicht geändert werden. Bitte versuchen Sie es später erneut.' };

  // Re-Authentifizierung vor der Änderung: Ohne erneute Prüfung des aktuellen
  // Passworts könnte eine gekaperte, aber noch gültige Sitzung die Konto-
  // E-Mail umstellen, ohne dass die Kontoinhaberin je ein Geheimnis erneut
  // eingeben musste – dieselbe Gefahr wie bei passwortAendernAction.
  const reauth = await bestaetigePasswort(supabase, kunde.email, aktuellesPasswort, 'email_aendern');
  if (!reauth.ok) return { success: false, error: reauth.fehler };

  // Supabases eigener Bestätigungsablauf für den E-Mail-Wechsel (nicht über
  // generateLink umgeleitet – anders als Registrierung/Reset ist dies eine
  // seltene, sicherheitskritische Änderung; Supabases eigene, serverseitig
  // erzwungene Bestätigung AN BEIDE Adressen ist hier der vorsichtigere Weg
  // als eine selbst gebaute Umleitung.)
  const { error } = await supabase.auth.updateUser({ email: neueEmail });
  if (error) {
    protokoll.fehler('AUTH', 'email_aendern_fehlgeschlagen', error.message);
    return { success: false, error: 'Die E-Mail-Adresse konnte nicht geändert werden.' };
  }
  return {
    success: true,
    error: 'Wir haben eine Bestätigung an die neue Adresse gesendet. Der Wechsel gilt erst nach deren Bestätigung.',
  };
}

export async function passwortAendernAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };

  const aktuellesPasswort = String(formData.get('aktuellesPasswort') ?? '');
  const passwort = String(formData.get('passwort') ?? '');
  const passwortWiederholung = String(formData.get('passwortWiederholung') ?? '');
  const befunde = pruefePasswort(passwort);
  if (passwort !== passwortWiederholung) befunde.push({ feld: 'passwortWiederholung', meldung: 'Die Passwörter stimmen nicht überein.' });
  if (!aktuellesPasswort) befunde.push({ feld: 'aktuellesPasswort', meldung: 'Bitte geben Sie Ihr aktuelles Passwort ein.' });
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const supabase = sichererClient(createClient);
  if (!supabase) return { success: false, error: 'Das Passwort konnte derzeit nicht geändert werden. Bitte versuchen Sie es später erneut.' };

  // Re-Authentifizierung vor der eigentlichen Änderung: Ohne erneute Prüfung
  // des aktuellen Passworts könnte eine noch gültige, aber z.B. an einem
  // fremden Gerät vergessene Sitzung das Passwort ändern, ohne dass die
  // Kontoinhaberin es je selbst eingeben musste (dieselbe Gefahr, gegen die
  // Bank- und Mail-Anbieter mit "aktuelles Passwort bestätigen" schützen).
  const reauth = await bestaetigePasswort(supabase, kunde.email, aktuellesPasswort, 'passwort_aendern');
  if (!reauth.ok) return { success: false, error: reauth.fehler };

  const { error } = await supabase.auth.updateUser({ password: passwort });
  if (error) return { success: false, error: 'Das Passwort konnte nicht geändert werden.' };

  await sendEmail({
    to: kunde.email,
    subject: 'Ihr Passwort wurde geändert',
    react: PasswortGeaendertEmail({}),
    kontext: { anlass: 'konto_passwort_geaendert' },
  });
  return { success: true };
}

// ── Konto löschen (DSGVO Art. 17 „Recht auf Löschung") ─────────────────

/**
 * Löscht das Kundenkonto vollständig auf eigenen Wunsch. Bislang gab es nur
 * die automatische Anonymisierung nach Ablauf der Aufbewahrungsfrist
 * (`anonymisiere_alte_bestellungen()`, 0022_dsgvo_loeschung.sql) – kein
 * DSGVO-Blocker (Art. 17 Abs. 3 lit. b erlaubt die Aufbewahrung während der
 * Frist), aber Kundschaft, die ihr Konto aktiv löschen möchte, sollte nicht
 * auf diese Frist warten müssen (siehe docs/kundenkonto-architektur.md,
 * Abschnitt 9 „Bekannte Grenzen").
 *
 * Absichtlich EIN einziger Schreibzugriff: `deleteUser()` löscht die
 * `auth.users`-Zeile, und genau darauf sind die Fremdschlüssel aus
 * 0023_kundenkonto.sql bereits ausgelegt –
 *   - customer_profiles.id            → ON DELETE CASCADE (Profil mit weg)
 *   - customer_addresses.customer_id  → ON DELETE CASCADE (Adressbuch mit weg)
 *   - orders.customer_id              → ON DELETE SET NULL (Bestellzeile
 *     bleibt vollständig erhalten, nur die Verknüpfung zur Kundennummer
 *     entfällt – exakt dasselbe Prinzip, mit dem
 *     `anonymisiere_alte_bestellungen()` abgelaufene Bestellungen behandelt;
 *     Rechnungs-/Buchführungspflichten nach § 147 AO / § 257 HGB brechen
 *     dadurch nicht).
 * Diese Kaskaden zusätzlich in Anwendungscode nachzubilden (z.B. per
 * `loescheAdresseDb`-Schleife) wäre eine zweite Stelle für dieselbe Regel –
 * „eine Berechnung, ein Ort" gilt auch für Löschregeln.
 */
export async function kontoLoeschenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };

  const passwort = String(formData.get('passwort') ?? '');
  if (!passwort) return { success: false, error: 'Bitte geben Sie Ihr Passwort ein, um die Löschung zu bestätigen.' };

  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const supabase = sichererClient(createClient);
  if (!supabase) return { success: false, error: 'Das Konto konnte derzeit nicht gelöscht werden. Bitte versuchen Sie es später erneut.' };

  // Re-Authentifizierung vor der Löschung – dieselbe Begründung wie bei
  // passwortAendernAction: Eine derart folgenreiche, unwiderrufliche Aktion
  // darf nicht allein durch eine noch gültige, aber z.B. an einem fremden
  // Gerät offen gelassene Sitzung auslösbar sein.
  const reauth = await bestaetigePasswort(supabase, kunde.email, passwort, 'konto_loeschen');
  if (!reauth.ok) return { success: false, error: reauth.fehler };

  const admin = sichererClient(createAdminClient);
  if (!admin) return { success: false, error: 'Das Konto konnte derzeit nicht gelöscht werden. Bitte versuchen Sie es später erneut.' };

  const { error } = await admin.auth.admin.deleteUser(kunde.id);
  if (error) {
    protokoll.fehler('AUTH', 'konto_loeschen_fehlgeschlagen', kunde.email, error);
    return { success: false, error: 'Das Konto konnte nicht gelöscht werden. Bitte versuchen Sie es erneut oder kontaktieren Sie uns.' };
  }

  protokoll.info('AUTH', 'konto_geloescht', kunde.email);

  // Eigene Sitzung beenden statt auf den (nun ohnehin ungültigen) Cookie zu
  // vertrauen – dasselbe Vorgehen wie abmeldenAction. `redirect()` bleibt
  // bewusst außerhalb jedes try/catch (siehe abmeldenAction).
  try {
    await supabase.auth.signOut();
  } catch (fehler) {
    protokoll.fehler('AUTH', 'konto_loeschen_abmeldung_fehlgeschlagen', kunde.email, fehler);
  }
  revalidatePath('/konto');
  redirect('/');
}

// ── Adressbuch ───────────────────────────────────────────────────────────

/**
 * Kapselt einen Aufruf der Adressbuch-DB-Helfer (lib/account/data.ts)
 * fehlersicher – die Helfer erstellen intern selbst einen Admin-Client, ohne
 * eigenen try/catch um dessen Erstellung. Schlägt sie fehl, würde der Aufruf
 * hier sonst ungefangen durchschlagen; dieselbe fail-closed-Fehlermeldung
 * wie beim fachlichen Fehlerfall, den die Helfer selbst schon zurückgeben.
 */
async function sicherAusgefuehrteAdressAktion(
  fehlermeldung: string,
  aktion: () => Promise<{ ok: boolean; fehler?: string }>
): Promise<{ ok: boolean; fehler?: string }> {
  try {
    return await aktion();
  } catch (fehler) {
    protokoll.fehler('AUTH', 'adressbuch_aktion_fehlgeschlagen', undefined, fehler);
    return { ok: false, fehler: fehlermeldung };
  }
}

function adresseAusFormular(formData: FormData): KundenAdresseEingabe & { label?: string | null } {
  const feld = (name: string) => String(formData.get(name) ?? '').trim();
  const optional = (name: string) => {
    const wert = feld(name);
    return wert.length > 0 ? wert : null;
  };
  return {
    label: optional('label'),
    firstName: feld('firstName'),
    lastName: feld('lastName'),
    company: optional('company'),
    street: feld('street'),
    zip: feld('zip'),
    city: feld('city'),
    country: feld('country') || 'Deutschland',
    phone: optional('phone'),
  };
}

export async function adresseAnlegenAction(_prev: KontoActionResult | null, formData: FormData): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };

  const eingabe = adresseAusFormular(formData);
  const befunde = pruefeAdresse(eingabe);
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const ergebnis = await sicherAusgefuehrteAdressAktion('Die Adresse konnte nicht gespeichert werden.', () =>
    legeAdresseAnDb(kunde.id, eingabe)
  );
  revalidatePath('/konto/adressen');
  return { success: ergebnis.ok, error: ergebnis.fehler };
}

export async function adresseAktualisierenAction(
  adresseId: string,
  _prev: KontoActionResult | null,
  formData: FormData
): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };

  const eingabe = adresseAusFormular(formData);
  const befunde = pruefeAdresse(eingabe);
  if (befunde.length > 0) return { success: false, error: ersterFehler(befunde) };

  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };

  const ergebnis = await sicherAusgefuehrteAdressAktion('Die Adresse konnte nicht aktualisiert werden.', () =>
    aktualisiereAdresseDb(kunde.id, adresseId, eingabe)
  );
  revalidatePath('/konto/adressen');
  return { success: ergebnis.ok, error: ergebnis.fehler };
}

export async function adresseLoeschenAction(adresseId: string): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };
  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };
  const ergebnis = await sicherAusgefuehrteAdressAktion('Die Adresse konnte nicht gelöscht werden.', () =>
    loescheAdresseDb(kunde.id, adresseId)
  );
  revalidatePath('/konto/adressen');
  return { success: ergebnis.ok, error: ergebnis.fehler };
}

export async function adresseAlsStandardAction(adresseId: string): Promise<KontoActionResult> {
  const kunde = await aktuellerKunde();
  if (!kunde) return { success: false, error: 'Bitte melden Sie sich an.' };
  const grenze = await pruefeRateLimit('kontoAenderung', kunde.id);
  if (!grenze.erlaubt) return { success: false, error: grenze.meldung };
  const ergebnis = await sicherAusgefuehrteAdressAktion('Die Standardadresse konnte nicht geändert werden.', () =>
    setzeStandardadresseDb(kunde.id, adresseId)
  );
  revalidatePath('/konto/adressen');
  return { success: ergebnis.ok, error: ergebnis.fehler };
}

// ── Checkout-Vorbelegung ────────────────────────────────────────────────

export interface CheckoutVorbelegung {
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  street: string;
  zip: string;
  city: string;
  /** Aus dem Profil (customer_profiles.vat_id, Migration 0023) – wird beim
   *  Absenden serverseitig erneut aus dem Profil gelesen (lib/actions/orders.ts),
   *  nie aus dieser Vorbelegung übernommen. Hier ausschließlich zur Anzeige/
   *  Ausfüllhilfe im Checkout-Formular. */
  vatId: string;
}

/**
 * Für angemeldete Kund:innen: Vorbelegung des Warenkorb-Checkouts aus der
 * hinterlegten Standardadresse (Telefon/Firma notfalls aus dem Profil, wo
 * die Adresse selbst keine Angabe trägt) – reine Ausfüllhilfe, ändert nichts
 * an Preis- oder Steuerberechnung. Rein additiv: ein Gast ohne Konto bekommt
 * weiterhin ein leeres Formular, niemand wird zur Anmeldung gezwungen.
 * `ladeStandardadresse()` (lib/account/data.ts) war genau für diesen Zweck
 * vorgesehen, bis hierher aber nirgends verdrahtet – das holt dieser Aufruf
 * nach, statt die Funktion als toten Code stehen zu lassen.
 *
 * Vom Client aus einmalig aufgerufen, wenn die Schublade tatsächlich den
 * Checkout-Schritt öffnet – nicht bei jedem Seitenaufruf (dieselbe enge
 * Auslösung wie beim Sitzungs-Refresh in middleware.ts, nur clientseitig
 * statt für jede Anfrage).
 */
export async function ladeCheckoutVorbelegung(): Promise<CheckoutVorbelegung | null> {
  const kunde = await aktuellerKunde();
  if (!kunde) return null;

  const [profil, adresse] = await Promise.all([ladeProfilDb(kunde.id, kunde.email), ladeStandardadresseDb(kunde.id)]);

  return {
    firstName: adresse?.firstName ?? '',
    lastName: adresse?.lastName ?? '',
    companyName: adresse?.company ?? profil?.company ?? '',
    email: kunde.email,
    phone: adresse?.phone ?? profil?.phone ?? '',
    street: adresse?.street ?? '',
    zip: adresse?.zip ?? '',
    city: adresse?.city ?? '',
    vatId: profil?.vatId ?? '',
  };
}

/**
 * Wird vom Auth-Callback aufgerufen, NACHDEM eine Registrierung bestätigt
 * wurde (siehe app/auth/callback/route.ts). Getrennt von registrierenAction,
 * weil dieser Schritt erst nach dem Klick auf den E-Mail-Link läuft, nicht
 * bei der Formularabsendung.
 */
export async function sendeWillkommensMailFuerBestaetigung(email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: 'Willkommen bei Embroidery Republic',
    react: KontoWillkommenEmail({}),
    kontext: { anlass: 'konto_willkommen' },
  });
}

/**
 * Wird vom Auth-Callback aufgerufen, NACHDEM eine Registrierung bestätigt
 * wurde UND die Person beim Registrieren den Newsletter-Haken gesetzt hatte
 * (die Absicht reist dafür als `newsletter=1` im redirectTo aus
 * registrierenAction bis hierher mit). Erst der bestätigte Klick beweist,
 * dass die E-Mail-Adresse wirklich dieser Person gehört – vorher darf weder
 * das Profil geschrieben noch die Bestätigungsmail verschickt werden.
 */
export async function aktiviereNewsletterNachBestaetigung(kundenId: string, email: string): Promise<void> {
  const ok = await aktualisiereProfilDb(kundenId, { newsletterOptIn: true });
  if (!ok) return;
  await sendEmail({
    to: email,
    subject: 'Newsletter-Anmeldung bestätigt',
    react: NewsletterOptInEmail({}),
    kontext: { anlass: 'newsletter_opt_in' },
  }).catch(() => {});
}
