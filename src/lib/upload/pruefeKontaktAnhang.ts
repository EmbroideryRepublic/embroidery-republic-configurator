/**
 * ═══════════════════════════════════════════════════════════════════════
 * PRÜFUNG VON KONTAKT-ANHÄNGEN
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Eigene, kleinere Schwester von `pruefeUpload.ts` (dort PNG-ausschließlich,
 * absichtlich nicht erweiterbar – siehe dortiger Kopfkommentar, das ist die
 * Konfigurator-Logo-Pipeline, die stets selbst PNG erzeugt). Anhänge an einer
 * Kontaktanfrage (Referenzfoto, Skizze, PDF-Angebot) brauchen ein breiteres,
 * aber weiterhin eng begrenztes Format-Set – gleiche Haltung, eigene Datei:
 * Größe VOR dem Dekodieren prüfen, Signatur statt deklariertem MIME-Typ
 * entscheidet, kundenseitige Meldung nennt nur Änderbares.
 *
 * Wie bei `pruefeUpload.ts` prüft der Server autoritativ – die Auswahl im
 * Browser (ContactForm.tsx) ist Benutzerführung, kein Schutz.
 */
import { base64Bytelaenge } from './pruefeUpload';

/** Grenzwerte an einer Stelle. next.config.js begrenzt Server-Action-Bodies
 *  auf 15 MB gesamt – 8 MB Rohdaten bleiben nach Base64-Kodierung (+~33 %)
 *  sicher darunter, auch mit den übrigen Formularfeldern. */
export const KONTAKT_ANHANG_GRENZEN = {
  maxBytesProDatei: 5 * 1024 * 1024,
  maxDateien: 3,
  maxBytesGesamt: 8 * 1024 * 1024,
} as const;

/** Erlaubte Formate mit ihrer Signatur – maßgeblich ist die Signatur, nicht
 *  der vom Aufrufer deklarierte MIME-Typ. */
const ERLAUBTE_FORMATE = [
  { mime: 'image/png', signatur: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/jpeg', signatur: [0xff, 0xd8, 0xff] },
  /** "%PDF" */
  { mime: 'application/pdf', signatur: [0x25, 0x50, 0x44, 0x46] },
] as const;

export type KontaktAnhangAblehnungsgrund =
  | 'kein_data_url'
  | 'leer'
  | 'zu_gross'
  | 'unbekanntes_format'
  | 'zu_viele_dateien'
  | 'gesamtgroesse_zu_gross';

export interface KontaktAnhangGeprueft {
  ok: true;
  dateiname: string;
  bytes: Buffer;
  mime: string;
}

export interface KontaktAnhangAbgelehnt {
  ok: false;
  grund: KontaktAnhangAblehnungsgrund;
  /** Was die Kundschaft zu sehen bekommt. */
  kundenMeldung: string;
  /** Ausführlich, ausschließlich fürs Serverprotokoll. */
  protokoll: string;
}

export type KontaktAnhangPruefung = KontaktAnhangGeprueft | KontaktAnhangAbgelehnt;

const KUNDEN_MELDUNGEN: Record<KontaktAnhangAblehnungsgrund, string> = {
  kein_data_url: 'Ein Anhang konnte nicht gelesen werden. Bitte laden Sie ihn erneut hoch.',
  leer: 'Ein Anhang konnte nicht gelesen werden. Bitte laden Sie ihn erneut hoch.',
  zu_gross: `Ein Anhang ist zu groß. Bitte verwenden Sie Dateien bis ${KONTAKT_ANHANG_GRENZEN.maxBytesProDatei / (1024 * 1024)} MB.`,
  unbekanntes_format: 'Dieses Dateiformat wird nicht unterstützt. Erlaubt sind PNG, JPEG und PDF.',
  zu_viele_dateien: `Bitte fügen Sie höchstens ${KONTAKT_ANHANG_GRENZEN.maxDateien} Dateien an.`,
  gesamtgroesse_zu_gross: 'Die Anhänge sind zusammen zu groß. Bitte entfernen Sie eine Datei.',
};

function hatSignatur(bytes: Buffer, signatur: readonly number[]): boolean {
  if (bytes.length < signatur.length) return false;
  return signatur.every((b, i) => bytes[i] === b);
}

/** Prüft einen einzelnen Anhang. Reihenfolge wie in pruefeUpload.ts: erst
 *  die Größe (billig, ohne Dekodieren), dann der Inhalt. */
function pruefeEinzelnenAnhang(dateiname: string, dataUrl: string): KontaktAnhangPruefung {
  // `[\s\S]` statt s-Flag: Zielsystem ist auf ES2017 gesetzt.
  const treffer = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!treffer) {
    return { ok: false, grund: 'kein_data_url', kundenMeldung: KUNDEN_MELDUNGEN.kein_data_url, protokoll: `${dateiname}: kein gültiges data:…;base64,-Format.` };
  }
  const [, deklarierterTyp = '', base64 = ''] = treffer;

  const groesse = base64Bytelaenge(base64);
  if (groesse === 0) {
    return { ok: false, grund: 'leer', kundenMeldung: KUNDEN_MELDUNGEN.leer, protokoll: `${dateiname}: enthält keine Daten.` };
  }
  if (groesse > KONTAKT_ANHANG_GRENZEN.maxBytesProDatei) {
    return {
      ok: false,
      grund: 'zu_gross',
      kundenMeldung: KUNDEN_MELDUNGEN.zu_gross,
      protokoll: `${dateiname}: ${groesse} Bytes überschreiten ${KONTAKT_ANHANG_GRENZEN.maxBytesProDatei} Bytes (vor dem Dekodieren erkannt).`,
    };
  }

  const bytes = Buffer.from(base64, 'base64');
  const format = ERLAUBTE_FORMATE.find((f) => hatSignatur(bytes, f.signatur));
  if (!format) {
    return {
      ok: false,
      grund: 'unbekanntes_format',
      kundenMeldung: KUNDEN_MELDUNGEN.unbekanntes_format,
      protokoll: `${dateiname}: Signatur passt zu keinem erlaubten Format. Deklariert war „${deklarierterTyp}".`,
    };
  }

  return { ok: true, dateiname, bytes, mime: format.mime };
}

export interface KontaktAnhaengeGeprueft {
  ok: true;
  anhaenge: KontaktAnhangGeprueft[];
}
export interface KontaktAnhaengeAbgelehnt {
  ok: false;
  kundenMeldung: string;
  protokoll: string;
}
export type KontaktAnhaengeEingabe = { dateiname: string; dataUrl: string };

/** Prüft die vollständige Anhangsliste: Anzahl, jede Datei einzeln, dann die
 *  Gesamtgröße. Bricht bei der ERSTEN Ablehnung ab – eine Anfrage mit einem
 *  ungültigen Anhang wird als Ganzes abgelehnt, statt ihn stillschweigend
 *  wegzulassen (die Kundschaft soll wissen, dass etwas fehlt). */
export function pruefeKontaktAnhaenge(eingabe: KontaktAnhaengeEingabe[]): KontaktAnhaengeGeprueft | KontaktAnhaengeAbgelehnt {
  if (eingabe.length > KONTAKT_ANHANG_GRENZEN.maxDateien) {
    return {
      ok: false,
      kundenMeldung: KUNDEN_MELDUNGEN.zu_viele_dateien,
      protokoll: `${eingabe.length} Anhänge überschreiten die Grenze von ${KONTAKT_ANHANG_GRENZEN.maxDateien}.`,
    };
  }

  const geprueft: KontaktAnhangGeprueft[] = [];
  for (const { dateiname, dataUrl } of eingabe) {
    const ergebnis = pruefeEinzelnenAnhang(dateiname, dataUrl);
    if (!ergebnis.ok) return { ok: false, kundenMeldung: ergebnis.kundenMeldung, protokoll: ergebnis.protokoll };
    geprueft.push(ergebnis);
  }

  const gesamtgroesse = geprueft.reduce((summe, a) => summe + a.bytes.length, 0);
  if (gesamtgroesse > KONTAKT_ANHANG_GRENZEN.maxBytesGesamt) {
    return {
      ok: false,
      kundenMeldung: KUNDEN_MELDUNGEN.gesamtgroesse_zu_gross,
      protokoll: `Gesamtgröße ${gesamtgroesse} Bytes überschreitet ${KONTAKT_ANHANG_GRENZEN.maxBytesGesamt} Bytes.`,
    };
  }

  return { ok: true, anhaenge: geprueft };
}
