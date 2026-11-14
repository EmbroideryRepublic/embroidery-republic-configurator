/**
 * Links aus den Konto-E-Mails (Registrierung bestätigen, Passwort
 * zurücksetzen) – reine Funktionen, damit jede Entscheidung testbar ist.
 *
 * ── Warum der Link NICHT mehr der „action_link" von Supabase ist ──────────
 * `admin.generateLink()` liefert einen Link über Supabases Verify-Endpunkt.
 * Der prüft das Token und leitet dann auf `redirectTo` weiter – aber
 *   1. nur, wenn `redirectTo` EXAKT (inkl. Query-Teil) in der Redirect-
 *      Allowlist des Supabase-Dashboards steht; sonst fällt er auf die
 *      „Site URL" zurück (real beobachtet 2026-11-14: Hauptseite bzw.
 *      localhost:3000 statt Konto), und
 *   2. mit der Sitzung im URL-Fragment (`#access_token=…`), weil der Admin-
 *      Aufruf keinen PKCE-`code_challenge` kennt. Ein Server kann das
 *      Fragment nie lesen – `exchangeCodeForSession(code)` fand keinen `code`.
 *
 * Stattdessen enthält die E-Mail einen Link auf die EIGENE Route
 * `/auth/callback?typ=…&token_hash=…`; die Route löst das Einmal-Token
 * serverseitig mit `verifyOtp({ type, token_hash })` ein (offizielles
 * Supabase-SSR-Muster für eigene E-Mail-Vorlagen). Damit hängt der Ablauf
 * weder an der Redirect-Allowlist noch am Fragment.
 */

export type KontoLinkTyp = 'registrierung' | 'zuruecksetzen';
export type KontoOtpTyp = 'signup' | 'recovery';

const OTP_TYP: Readonly<Record<KontoLinkTyp, KontoOtpTyp>> = {
  registrierung: 'signup',
  zuruecksetzen: 'recovery',
};

/**
 * Welcher Supabase-OTP-Typ gehört zum `typ` im Link? Unbekanntes → null.
 * Der OTP-Typ wird NUR hieraus abgeleitet (nie aus einem eigenen Parameter):
 * Ein Token ist an seinen Typ gebunden, ein falsch kombinierter Link wird von
 * Supabase ohnehin abgewiesen – eine zweite Quelle für denselben Wert wäre
 * nur eine Gelegenheit, auseinanderzulaufen.
 */
export function otpTypFuer(typ: string | null | undefined): KontoOtpTyp | null {
  if (typ === 'registrierung' || typ === 'zuruecksetzen') return OTP_TYP[typ];
  return null;
}

/**
 * Form eines `hashed_token` (Hex bzw. URL-sichere Zeichen). Fängt Müll früh
 * ab, bevor er an Supabase geht; die eigentliche Prüfung macht Supabase.
 */
export function istGueltigerTokenHash(wert: string | null | undefined): wert is string {
  return typeof wert === 'string' && /^[A-Za-z0-9_-]{16,256}$/.test(wert);
}

/**
 * Baut den Link für die E-Mail. `basis` ist die Adresse, unter der der Shop
 * tatsächlich ausgeliefert wird (siehe `kanonischeBasisUrl()`), damit kein
 * Umweg über eine Weiterleitung nötig ist.
 *
 * Die Newsletter-Absicht der Registrierung wandert nur als Parameter mit –
 * aktiviert wird sie erst NACH der Bestätigung (siehe app/auth/callback).
 */
export function baueKontoLink(
  basis: string,
  typ: KontoLinkTyp,
  tokenHash: string,
  optionen: { newsletter?: boolean } = {}
): string {
  const query = new URLSearchParams({ typ, token_hash: tokenHash });
  if (typ === 'registrierung' && optionen.newsletter) query.set('newsletter', '1');
  return `${basis.replace(/\/$/, '')}/auth/callback?${query.toString()}`;
}

/**
 * So alt darf der E-Mail-Link-Nachweis in einer Sitzung höchstens sein, damit
 * sie ein neues Passwort OHNE das alte setzen darf (Sekunden). Supabase lässt
 * Recovery-Links selbst bis zu einer Stunde gelten; 30 Minuten reichen für
 * „Link klicken, Passwort tippen" und halten das Fenster klein.
 */
export const LINK_SITZUNG_MAX_ALTER_SEKUNDEN = 30 * 60;

/**
 * Gehört diese Sitzung zu einem frisch eingelösten E-Mail-Link
 * (Passwort-zurücksetzen- bzw. Registrierungs-Link)? Grundlage ist der
 * signierte `amr`-Claim (Authentication Method Reference) des Access Tokens –
 * nicht fälschbar, anders als ein eigenes Cookie.
 *
 * Warum nicht mehr nur `recovery`: Supabase vergibt `recovery` nur im PKCE-
 * Ablauf. Wird das Token per `verifyOtp` (Verify-POST) eingelöst, steht in
 * `amr` stattdessen `otp` – laut GoTrue-Quelltext (internal/api/verify.go,
 * `verifyPost` → `issueRefreshToken(..., models.OTP, ...)`). Damit `otp` die
 * Passwortprüfung nicht dauerhaft aushebelt, zählt es nur mit Zeitstempel und
 * nur innerhalb von `LINK_SITZUNG_MAX_ALTER_SEKUNDEN`. Eine normale
 * Anmeldung (`password`) war und bleibt ausgeschlossen.
 *
 * Fail-closed: alles Unklare → false.
 */
export function istFrischeLinkSitzung(amr: unknown, jetztSekunden: number): boolean {
  if (!Array.isArray(amr)) return false;
  return amr.some((eintrag) => {
    if (typeof eintrag === 'string') return eintrag === 'recovery';
    if (!eintrag || typeof eintrag !== 'object') return false;
    const { method, timestamp } = eintrag as { method?: unknown; timestamp?: unknown };
    if (method === 'recovery') return true;
    if (method !== 'otp' || typeof timestamp !== 'number' || !Number.isFinite(timestamp)) return false;
    const alter = jetztSekunden - timestamp;
    // 60 s Toleranz für leicht abweichende Uhren, aber nichts aus der Zukunft.
    return alter >= -60 && alter <= LINK_SITZUNG_MAX_ALTER_SEKUNDEN;
  });
}
