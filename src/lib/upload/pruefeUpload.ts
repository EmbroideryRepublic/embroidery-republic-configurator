/**
 * ═══════════════════════════════════════════════════════════════════════
 * UPLOAD-PRÜFUNG – die einzige Stelle, die entscheidet, was gespeichert wird
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Reine Funktionen ohne Datenzugriff und ohne Nebenwirkungen. Jede Datei, die
 * in den Speicher geht, kommt hier vorbei – `uploadProductionFile()` nimmt
 * nichts Ungeprüftes mehr an.
 *
 * ── Warum serverseitig, obwohl der Browser schon prüft ────────────────
 * `LogoUploader.tsx` begrenzt Typ und Größe. Das ist Benutzerführung, kein
 * Schutz: Die Server Action nimmt jede Data-URL entgegen, die ein Aufrufer
 * schickt – auch eine, die nie durch den Konfigurator gelaufen ist.
 *
 * ── Warum ausschließlich PNG ──────────────────────────────────────────
 * Der Konfigurator erzeugt ausnahmslos PNG: PDF wird über pdfjs gerastert,
 * PNG und SVG laufen durch `cropImageToContent()`, und jeder dieser Wege
 * endet in `canvas.toDataURL('image/png')`. Ein SVG erreicht die Serverseite
 * nie.
 *
 * Diese Einschränkung hier zu ERZWINGEN statt sie nur vorauszusetzen,
 * beseitigt die gesamte Klasse der SVG- und XML-Angriffe strukturell:
 * eingebettete Skripte, XXE, Billion Laughs. Es wird bewusst nicht versucht,
 * SVG zu bereinigen – eine selbstgeschriebene Bereinigung ist eine dauerhafte
 * Angriffsfläche; sie nicht zu brauchen ist der bessere Schutz.
 *
 * Vollständige Herleitung: docs/upload-lebenszyklus.md
 */

/** Grenzwerte an einer Stelle – anpassbar ohne Eingriff in die Logik. */
export const UPLOAD_GRENZEN = {
  /** Höchstgröße der dekodierten Datei in Bytes. Wie im Browser: 10 MB. */
  maxBytes: 10 * 1024 * 1024,
  /** Höchste Bildbreite. Bei 300 dpi rund 68 cm – größer als jede Druckfläche. */
  maxBreitePx: 8000,
  /** Höchste Bildhöhe. */
  maxHoehePx: 8000,
} as const;

/**
 * Erlaubte Formate mit ihrer Signatur.
 *
 * Die Signatur ist maßgeblich, nicht der deklarierte MIME-Typ: Letzterer
 * stammt vom Aufrufer und ist damit wertlos als Nachweis.
 */
const ERLAUBTE_FORMATE = [
  {
    mime: 'image/png',
    /** PNG beginnt immer mit diesen acht Bytes (RFC 2083). */
    signatur: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
] as const;

/** Warum eine Datei abgelehnt wurde – für Protokoll und Tests, NICHT für die Kundschaft. */
export type Ablehnungsgrund =
  | 'kein_data_url'
  | 'zu_gross'
  | 'leer'
  | 'unbekanntes_format'
  | 'abmessungen_unlesbar'
  | 'zu_grosse_abmessungen';

export interface UploadGeprueft {
  ok: true;
  bytes: Buffer;
  mime: string;
  breitePx: number;
  hoehePx: number;
}

export interface UploadAbgelehnt {
  ok: false;
  grund: Ablehnungsgrund;
  /** Was die Kundschaft zu sehen bekommt – nennt nur Änderbares. */
  kundenMeldung: string;
  /** Ausführlich, ausschließlich fürs Serverprotokoll. */
  protokoll: string;
}

export type UploadPruefung = UploadGeprueft | UploadAbgelehnt;

/**
 * Meldungen für die Kundschaft.
 *
 * Bewusst grob: Sie nennen, was zu ändern ist, aber nicht, welche Prüfung
 * gegriffen hat. Aus den Antworten soll sich nicht ableiten lassen, welche
 * Hürde als Nächstes zu umgehen wäre.
 */
const KUNDEN_MELDUNGEN: Record<Ablehnungsgrund, string> = {
  kein_data_url: 'Diese Datei konnte nicht gelesen werden. Bitte laden Sie sie erneut hoch.',
  leer: 'Diese Datei konnte nicht gelesen werden. Bitte laden Sie sie erneut hoch.',
  zu_gross: 'Die Datei ist zu groß. Bitte verwenden Sie eine Datei bis 10 MB.',
  unbekanntes_format: 'Dieses Dateiformat wird nicht unterstützt. Bitte laden Sie eine PNG-Datei hoch.',
  abmessungen_unlesbar: 'Diese Datei konnte nicht gelesen werden. Bitte laden Sie sie erneut hoch.',
  zu_grosse_abmessungen: 'Das Bild hat zu große Abmessungen. Bitte verwenden Sie eine kleinere Datei.',
};

function ablehnen(grund: Ablehnungsgrund, protokoll: string): UploadAbgelehnt {
  return { ok: false, grund, kundenMeldung: KUNDEN_MELDUNGEN[grund], protokoll };
}

/**
 * Größe einer Base64-Zeichenkette in Bytes – OHNE zu dekodieren.
 *
 * Der entscheidende Punkt gegen Speicherüberlauf: `Buffer.from(…, 'base64')`
 * legt den gesamten Inhalt im Speicher ab. Eine 500-MB-Data-URL belegt über
 * 350 MB Heap, bevor irgendeine Prüfung greifen könnte. Base64 kodiert je 3
 * Bytes in 4 Zeichen; aus der Zeichenlänge folgt die Bytegröße exakt.
 */
export function base64Bytelaenge(base64: string): number {
  const zeichen = base64.length;
  if (zeichen === 0) return 0;
  const fuellzeichen = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((zeichen * 3) / 4) - fuellzeichen;
}

/** Beginnt der Puffer mit dieser Signatur? */
function hatSignatur(bytes: Buffer, signatur: readonly number[]): boolean {
  if (bytes.length < signatur.length) return false;
  return signatur.every((b, i) => bytes[i] === b);
}

/**
 * Breite und Höhe eines PNG aus dem Header.
 *
 * Der IHDR-Block steht bei PNG immer an derselben Stelle: Bytes 16–19 Breite,
 * 20–23 Höhe, jeweils als 32-Bit-Zahl. Es wird nichts dekodiert und nichts
 * gerendert – die Prüfung kostet nichts und greift, bevor eine Bildbombe
 * Speicher belegen kann.
 */
export function pngAbmessungen(bytes: Buffer): { breite: number; hoehe: number } | null {
  if (bytes.length < 24) return null;
  // Der IHDR-Block muss unmittelbar auf die Signatur folgen.
  if (bytes.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { breite: bytes.readUInt32BE(16), hoehe: bytes.readUInt32BE(20) };
}

/**
 * Prüft eine Data-URL vollständig.
 *
 * Reihenfolge ist Absicht: Erst die Größe (billig, ohne Dekodieren), dann
 * der Inhalt. Eine Bombe soll abgewiesen werden, bevor sie Speicher belegt.
 */
export function pruefeDataUrl(dataUrl: string): UploadPruefung {
  // `[\s\S]` statt des s-Flags: Das Zielsystem ist auf ES2017 gesetzt.
  const treffer = /^data:([^;,]+);base64,([\s\S]*)$/.exec(dataUrl);
  if (!treffer) {
    return ablehnen('kein_data_url', 'Kein gültiges data:…;base64,-Format.');
  }
  const [, deklarierterTyp = '', base64 = ''] = treffer;

  // ── 1. Größe VOR dem Dekodieren ────────────────────────────────────
  const groesse = base64Bytelaenge(base64);
  if (groesse === 0) {
    return ablehnen('leer', 'Die Data-URL enthält keine Daten.');
  }
  if (groesse > UPLOAD_GRENZEN.maxBytes) {
    return ablehnen(
      'zu_gross',
      `${groesse} Bytes überschreiten die Grenze von ${UPLOAD_GRENZEN.maxBytes} Bytes (vor dem Dekodieren erkannt).`
    );
  }

  const bytes = Buffer.from(base64, 'base64');

  // ── 2. Tatsächliches Format über die Signatur ──────────────────────
  // Der deklarierte Typ wird bewusst ignoriert; er stammt vom Aufrufer.
  const format = ERLAUBTE_FORMATE.find((f) => hatSignatur(bytes, f.signatur));
  if (!format) {
    return ablehnen(
      'unbekanntes_format',
      `Signatur passt zu keinem erlaubten Format. Deklariert war „${deklarierterTyp}", ` +
        `gefunden: ${[...bytes.subarray(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join(' ')}.`
    );
  }

  // ── 3. Abmessungen aus dem Header ──────────────────────────────────
  const masse = pngAbmessungen(bytes);
  if (!masse) {
    return ablehnen('abmessungen_unlesbar', 'PNG-Signatur vorhanden, aber der IHDR-Block fehlt oder ist unvollständig.');
  }
  if (masse.breite === 0 || masse.hoehe === 0) {
    return ablehnen('abmessungen_unlesbar', `Ungültige Abmessungen: ${masse.breite} × ${masse.hoehe}.`);
  }
  if (masse.breite > UPLOAD_GRENZEN.maxBreitePx || masse.hoehe > UPLOAD_GRENZEN.maxHoehePx) {
    return ablehnen(
      'zu_grosse_abmessungen',
      `${masse.breite} × ${masse.hoehe} px überschreitet ` +
        `${UPLOAD_GRENZEN.maxBreitePx} × ${UPLOAD_GRENZEN.maxHoehePx} px.`
    );
  }

  return { ok: true, bytes, mime: format.mime, breitePx: masse.breite, hoehePx: masse.hoehe };
}

/**
 * Ist dies eine unbedenkliche Pfadkomponente?
 *
 * Element-IDs stammen vom Client und gehen in den Speicherpfad ein. Ohne
 * Prüfung könnte ein Wert wie `../../fremde-bestellung` den Ordner der
 * Bestellung verlassen.
 */
export function istSicherePfadkomponente(wert: string): boolean {
  return /^[a-zA-Z0-9_-]{1,64}$/.test(wert);
}

/**
 * Ist dies ein unbedenklicher Speicherpfad?
 *
 * Geprüft wird der VOLLSTÄNDIGE Pfad, nicht eine einzelne Komponente. Erlaubt
 * sind Segmente aus Buchstaben, Ziffern, Bindestrich, Unterstrich und Punkt,
 * getrennt durch `/`.
 *
 * ── Warum an der Engstelle und nicht bei jedem Aufrufer ───────────────
 * Pfade entstehen an fünf Stellen im Projekt. Jede einzeln abzusichern
 * bedeutet, dass die sechste – die morgen dazukommt – vergessen wird. Die
 * Prüfung sitzt deshalb in `uploadProductionFile`, `downloadProductionFile`
 * und `getProductionFileSignedUrl`: Jeder Weg in den und aus dem Speicher
 * führt hindurch, unabhängig davon, wer den Pfad gebaut hat.
 *
 * Abgewiesen werden insbesondere `..` (Verzeichniswechsel), absolute Pfade,
 * Backslashes (Windows-Trennzeichen) und Null-Bytes.
 */
export function istSichererSpeicherpfad(pfad: string): boolean {
  if (pfad.length === 0 || pfad.length > 512) return false;
  if (pfad.includes('\0') || pfad.includes('\\')) return false;
  if (pfad.startsWith('/') || pfad.endsWith('/')) return false;

  const segmente = pfad.split('/');
  return segmente.every((s) => /^[a-zA-Z0-9._-]{1,128}$/.test(s) && s !== '.' && s !== '..');
}

/** Fehler bei einem unzulässigen Speicherpfad. */
export class UnsichererPfadFehler extends Error {
  constructor(pfad: string) {
    // Der beanstandete Pfad gehört ins Protokoll, nicht in eine Antwort an
    // die Kundschaft – der Aufrufer entscheidet, was er weitergibt.
    super(`Unzulässiger Speicherpfad: ${JSON.stringify(pfad)}`);
    this.name = 'UnsichererPfadFehler';
  }
}
