/**
 * ═══════════════════════════════════════════════════════════════════════
 * BESUCHERZÄHLER – Konfiguration (keine Logik)
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Herleitung, Datenschutz und Grenzen der Zahlen: docs/besucherzaehler.md
 */

/**
 * Pfade, die NIE gezählt werden: nicht öffentlich oder mit Zugriffstoken in der
 * Adresse (`/bestellung/<token>` ist ein Geheimnis und gehört in keine
 * Statistik).
 */
export const BESUCH_AUSGESCHLOSSEN = ['/admin', '/api', '/bestellung', '/konto', '/auth', '/_next'] as const;

/**
 * Kampagnen-Quellen (`?utm_source=…` in der Adresse), die einzeln ausgewiesen
 * werden. Alles andere zählt als „sonstige".
 *
 * Bewusst eine feste Liste statt freier Werte: Sonst könnte jeder Aufrufer die
 * Tabelle mit beliebigen Quellnamen füllen. Neue Kanäle einfach hier ergänzen.
 */
export const BESUCH_QUELLEN = [
  'instagram',
  'facebook',
  'tiktok',
  'pinterest',
  'linkedin',
  'whatsapp',
  'google',
  'google-ads',
  'gbp',
  'newsletter',
  'email',
  'flyer',
  'qr',
  'visitenkarte',
  'presse',
  'verzeichnis',
  'empfehlung',
  'paketbeilage',
  'messe',
] as const;

/** Aufruf ohne (bekannte) Kennzeichnung: Suchmaschine, direkter Aufruf, Verweise … */
export const QUELLE_OHNE_KENNZEICHNUNG = 'ohne-kennzeichnung';
/** Eine Kennzeichnung ist vorhanden, steht aber nicht in `BESUCH_QUELLEN`. */
export const QUELLE_SONSTIGE = 'sonstige';

/**
 * Anzeigenamen für die Auswertung. `satisfies` erzwingt beim Übersetzen, dass
 * jede Quelle der Liste oben einen Namen hat – eine neue Quelle ohne Namen
 * bricht den Build, statt als rohes Kürzel im Adminbereich zu erscheinen.
 */
export const BESUCH_QUELLEN_NAMEN = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  pinterest: 'Pinterest',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  google: 'Google (Eintrag oder Link)',
  'google-ads': 'Google Ads',
  gbp: 'Google-Unternehmensprofil',
  newsletter: 'Newsletter',
  email: 'E-Mail-Signatur',
  flyer: 'Flyer / Print',
  qr: 'QR-Code',
  visitenkarte: 'Visitenkarte',
  presse: 'Presse',
  verzeichnis: 'Branchenverzeichnis',
  empfehlung: 'Empfehlung',
  paketbeilage: 'Paketbeilage',
  messe: 'Messe / Veranstaltung',
  [QUELLE_OHNE_KENNZEICHNUNG]: 'Ohne Kennzeichnung',
  [QUELLE_SONSTIGE]: 'Sonstige Kennzeichnung',
} as const satisfies Record<(typeof BESUCH_QUELLEN)[number] | typeof QUELLE_OHNE_KENNZEICHNUNG | typeof QUELLE_SONSTIGE, string>;

/** Anzeigename einer Quelle; unbekannte Werte (z.B. nach Listenänderung) erscheinen unverändert. */
export function quellenName(quelle: string): string {
  return (BESUCH_QUELLEN_NAMEN as Record<string, string>)[quelle] ?? quelle;
}
/** Sammelposten für gültige Adressen, die nicht in der Sitemap stehen (z.B. 404-Seiten). */
export const PFAD_SONSTIGE = '(sonstige Seiten)';

/** So viele Tage zeigt die Admin-Auswertung. */
export const BESUCH_ANZEIGE_TAGE = 30;

// ═══════════════════════════════════════════════════════════════════════
// EREIGNISSE – „Weg zur Bestellung“ (Migration 0040)
// ═══════════════════════════════════════════════════════════════════════

/**
 * Schalter der Ereignis-Messung (seit 2026-11-27 AN). Die Messung meldet zusätzlich zur Seitenadresse den Namen eines Ereignisses
 * („Konfigurator geöffnet“). Voraussetzungen, die erfüllt sind: Migration 0040 angewendet und verifiziert, und der ergänzte Absatz in
 * der Datenschutzerklärung (Ziffer 3, „Reichweitenmessung“, vom Betreiber freigegeben; Wortlaut: docs/seo/datenschutz-besucherzaehler-wortlaut.md).
 * Ist der Schalter aus, sendet der Browser nichts und der Server speichert nichts.
 */
export const EREIGNIS_MESSUNG_AKTIV = true;

/**
 * Die Schritte, die gezählt werden – feste Liste wie die Quellen: Der Client kann nur diese Namen melden, alles andere wird verworfen.
 * Gezählt werden BESUCHER (Tageskennung), nicht Klicks: Wer fünfmal in den Warenkorb legt, zählt einmal pro Tag.
 * Bewusst NICHT erfasst: Inhalt, Dateiname, Größe oder Vorschau des Motivs, Produkt, Farbe, Menge, Preis, Name oder Bestelldaten.
 */
export const BESUCH_EREIGNISSE = ['konfigurator_geoeffnet', 'motiv_hochgeladen', 'text_hinzugefuegt', 'in_den_warenkorb'] as const;
export type BesuchEreignis = (typeof BESUCH_EREIGNISSE)[number];

export const BESUCH_EREIGNIS_NAMEN = {
  konfigurator_geoeffnet: 'Konfigurator geöffnet',
  motiv_hochgeladen: 'Motiv hochgeladen',
  text_hinzugefuegt: 'Text hinzugefügt',
  in_den_warenkorb: 'In den Warenkorb gelegt',
} as const satisfies Record<BesuchEreignis, string>;
