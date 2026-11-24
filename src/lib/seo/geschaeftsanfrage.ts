/**
 * Prüfung und Aufbau der Geschäftsanfrage (rein, ohne Netz und Datenbank – gleiche Logik im Browser zur Benutzerführung und auf dem Server als maßgebliche Prüfung).
 *
 * Aus den Formularangaben wird Betreff und Text der E-Mail an uns. Alles, was in den Betreff oder in Einzeilen-Felder kommt, wird von Zeilenumbrüchen und
 * Steuerzeichen befreit (kein Einschleusen von Kopfzeilen); Auswahlfelder nehmen nur bekannte Werte an.
 */
import {
  ANFRAGE_GRENZEN,
  BRANCHEN,
  FORMULAR_TEXTE,
  GESCHAEFTSANFRAGE_BETREFF,
  KLEIDUNG,
  LOGO_GRENZEN,
  MENGEN,
  VEREDELUNG,
  normalisiereKennung,
} from '@/config/seo/geschaeftsanfrage';

export type KennungQuelle = 'qr' | 'gespeichert' | 'eingegeben';

export interface GeschaeftsanfrageEingabe {
  firma: string;
  branche: string;
  kleidung: string[];
  menge: string;
  veredelung: string;
  name: string;
  email: string;
  telefon?: string;
  anmerkung?: string;
  kennung?: string;
  kennungQuelle?: KennungQuelle;
  /** Honeypot – für echte Nutzer leer. */
  website?: string;
  attachments?: { dateiname: string; dataUrl: string }[];
}

export type FeldName = 'firma' | 'branche' | 'kleidung' | 'menge' | 'veredelung' | 'name' | 'email' | 'telefon' | 'anmerkung' | 'kennung';
export type FeldFehler = Partial<Record<FeldName, string>>;

export type AnfrageErgebnis =
  | { ok: true; betreff: string; nachricht: string; kennung: string | null; name: string; email: string }
  | { ok: false; felder: FeldFehler };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEFON_RE = /^[0-9+\-/() .]+$/;
// eslint-disable-next-line no-control-regex
const STEUERZEICHEN = /[\u0000-\u001f\u007f\u2028\u2029]+/g;

/** Text, der in einer Zeile stehen muss: Steuerzeichen und Umbrüche werden zu Leerzeichen, mehrfacher Leerraum zu einem. */
export function einzeilig(wert: unknown): string {
  return typeof wert === 'string' ? wert.replace(STEUERZEICHEN, ' ').replace(/\s+/g, ' ').trim() : '';
}

/** Mehrzeiliger Text: Umbrüche bleiben (als \n), sonstige Steuerzeichen fallen weg. */
function mehrzeilig(wert: unknown): string {
  if (typeof wert !== 'string') return '';
  // eslint-disable-next-line no-control-regex
  return wert.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0009\u000b-\u001f\u007f\u2028\u2029]/g, '').trim();
}

const label = (optionen: readonly { id: string; label: string }[], id: string) => optionen.find((o) => o.id === id)?.label;

const QUELLE_TEXT: Record<KennungQuelle, string> = {
  qr: 'aus dem QR-Code übernommen',
  gespeichert: 'beim Besuch über den QR-Code gemerkt',
  eingegeben: 'von Hand eingetragen',
};

export function pruefeGeschaeftsanfrage(eingabe: unknown): AnfrageErgebnis {
  const e = (eingabe !== null && typeof eingabe === 'object' ? eingabe : {}) as Record<string, unknown>;
  const fehler: FeldFehler = {};
  const t = FORMULAR_TEXTE.fehler;

  const firma = einzeilig(e.firma);
  if (firma.length < ANFRAGE_GRENZEN.firmaMin || firma.length > ANFRAGE_GRENZEN.firmaMax) fehler.firma = t.firma;

  const branche = typeof e.branche === 'string' ? e.branche : '';
  if (!BRANCHEN.some((b) => b.id === branche)) fehler.branche = t.branche;

  const kleidungRoh = Array.isArray(e.kleidung) ? e.kleidung.filter((k): k is string => typeof k === 'string') : [];
  const kleidung = [...new Set(kleidungRoh)];
  if (kleidung.length === 0 || kleidung.some((k) => !KLEIDUNG.some((o) => o.id === k))) fehler.kleidung = t.kleidung;

  const menge = typeof e.menge === 'string' ? e.menge : '';
  if (!MENGEN.some((m) => m.id === menge)) fehler.menge = t.menge;

  const veredelung = typeof e.veredelung === 'string' ? e.veredelung : '';
  if (!VEREDELUNG.some((v) => v.id === veredelung)) fehler.veredelung = t.veredelung;

  const name = einzeilig(e.name);
  if (name.length < ANFRAGE_GRENZEN.nameMin || name.length > ANFRAGE_GRENZEN.nameMax) fehler.name = t.name;

  const email = einzeilig(e.email);
  if (!EMAIL_RE.test(email) || email.length > ANFRAGE_GRENZEN.emailMax) fehler.email = t.email;

  const telefon = einzeilig(e.telefon);
  if (telefon && (!TELEFON_RE.test(telefon) || telefon.replace(/\D/g, '').length < 6 || telefon.length > 25)) fehler.telefon = t.telefon;

  const anmerkung = mehrzeilig(e.anmerkung);
  if (anmerkung.length > ANFRAGE_GRENZEN.anmerkungMax) fehler.anmerkung = t.anmerkung;

  // Kennung: leer ist in Ordnung; sonst muss sie exakt das Format haben (Kleinschreibung und Leerraum werden korrigiert)
  const kennungRoh = einzeilig(e.kennung);
  const kennung = kennungRoh ? normalisiereKennung(kennungRoh) : null;
  if (kennungRoh && !kennung) fehler.kennung = t.kennung;

  if (Object.keys(fehler).length > 0) return { ok: false, felder: fehler };

  const quelle: KennungQuelle = e.kennungQuelle === 'qr' || e.kennungQuelle === 'gespeichert' ? e.kennungQuelle : 'eingegeben';
  const logoAnzahl = Array.isArray(e.attachments) ? e.attachments.length : 0;
  const betreff = `${GESCHAEFTSANFRAGE_BETREFF}${kennung ? ` [${kennung}]` : ''} – ${firma}`.slice(0, 150);
  const zeilen = [
    GESCHAEFTSANFRAGE_BETREFF.toUpperCase(),
    kennung ? `Kennung aus dem Brief: ${kennung} (${QUELLE_TEXT[quelle]})` : 'Kennung aus dem Brief: keine',
    '',
    `Unternehmen: ${firma}`,
    `Branche: ${label(BRANCHEN, branche)}`,
    `Gewünschte Kleidung: ${kleidung.map((k) => label(KLEIDUNG, k)).join(', ')}`,
    `Ungefähre Stückzahl: ${label(MENGEN, menge)}`,
    `Veredelung: ${label(VEREDELUNG, veredelung)}`,
    '',
    `Ansprechpartner: ${name}`,
    `E-Mail: ${email}`,
    `Telefon: ${telefon || 'nicht angegeben'}`,
    `Logo: ${logoAnzahl > 0 ? `${logoAnzahl} Datei${logoAnzahl > 1 ? 'en' : ''} angehängt` : 'nicht angehängt'}`,
    ...(anmerkung ? ['', 'Anmerkung:', anmerkung] : []),
  ];
  return { ok: true, betreff, nachricht: zeilen.join('\n'), kennung, name, email };
}

/** Prüft die Logo-Auswahl im Browser: Anzahl, Format, Gesamtgröße. `null` = in Ordnung, sonst die Meldung für die Kundschaft. */
export function pruefeLogoAuswahl(bestehend: readonly { size: number }[], neu: readonly { type: string; size: number }[]): string | null {
  if (bestehend.length + neu.length > LOGO_GRENZEN.maxDateien) return FORMULAR_TEXTE.fehler.logoZuViele;
  if (neu.some((d) => !(LOGO_GRENZEN.erlaubteTypen as readonly string[]).includes(d.type))) return FORMULAR_TEXTE.fehler.logoFormat;
  const summe = [...bestehend, ...neu].reduce((s, d) => s + d.size, 0);
  if (summe > LOGO_GRENZEN.maxBytesGesamt) return FORMULAR_TEXTE.fehler.logoZuGross;
  return null;
}
