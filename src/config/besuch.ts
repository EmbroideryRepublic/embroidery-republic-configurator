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
