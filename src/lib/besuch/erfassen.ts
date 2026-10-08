/**
 * Besucherzähler – Erfassung. Reine Funktionen (kein Netz, keine Datenbank),
 * damit jede Entscheidung testbar ist; die Route (app/api/besuch) verdrahtet sie.
 *
 * ── Leitplanken ───────────────────────────────────────────────────────
 *  • Nichts vom Endgerät: kein Cookie, kein Local Storage, kein Auslesen von
 *    Geräteangaben. Der Browser meldet nur die Adresse der aufgerufenen Seite.
 *  • Keine IP-Adresse in der Datenbank. Aus IP + Browserkennung entsteht mit
 *    einem geheimen, TÄGLICH wechselnden Schlüssel (HMAC) eine Tageskennung; der
 *    Tag ist Teil des Schlüssels, daher lässt sie sich nicht über Tage verknüpfen.
 *  • Der Pfad kommt nie frei vom Client in die Datenbank, sondern wird gegen die
 *    Positivliste der öffentlichen Seiten (Sitemap) geprüft. Das schützt vor
 *    Müll in der Tabelle und davor, dass ein Zugriffstoken aus einer Adresse in
 *    der Statistik landet.
 *  • Im Zweifel nicht zählen: Robots, Do-Not-Track, Global-Privacy-Control,
 *    Vorab-Laden und der Betreiber selbst fallen heraus.
 */
import { createHmac } from 'node:crypto';
import {
  BESUCH_AUSGESCHLOSSEN,
  BESUCH_QUELLEN,
  PFAD_SONSTIGE,
  QUELLE_OHNE_KENNZEICHNUNG,
  QUELLE_SONSTIGE,
} from '@/config/besuch';

/** Kalendertag in Europe/Berlin als `YYYY-MM-DD` (Zeitzone fest, siehe lib/format.ts). */
export function berlinTag(zeit: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(zeit);
}

/**
 * Prüft einen vom Client gemeldeten Pfad.
 *  → `null`      wird nicht gezählt (nicht öffentlich / ungültig)
 *  → Pfad        steht in der Sitemap
 *  → PFAD_SONSTIGE  gültige Adresse, aber nicht in der Sitemap (z.B. 404)
 */
export function normalisierePfad(roh: unknown, oeffentlich: ReadonlySet<string>): string | null {
  if (typeof roh !== 'string') return null;
  let pfad = roh.split('?')[0]!.split('#')[0]!;
  if (!pfad.startsWith('/') || pfad.length > 300) return null;
  pfad = pfad.replace(/\/{2,}/g, '/');
  if (pfad.length > 1) pfad = pfad.replace(/\/+$/, '');
  if (BESUCH_AUSGESCHLOSSEN.some((p) => pfad === p || pfad.startsWith(`${p}/`))) return null;
  return oeffentlich.has(pfad) ? pfad : PFAD_SONSTIGE;
}

/** Macht aus dem frei eingegebenen `utm_source` einen Wert der festen Liste. */
export function bereinigeQuelle(roh: unknown): string {
  if (typeof roh !== 'string') return QUELLE_OHNE_KENNZEICHNUNG;
  const quelle = roh.trim().toLowerCase().slice(0, 40);
  if (!quelle) return QUELLE_OHNE_KENNZEICHNUNG;
  return (BESUCH_QUELLEN as readonly string[]).includes(quelle) ? quelle : QUELLE_SONSTIGE;
}

/**
 * Roboter, Vorschau-Abrufe, Monitoring und Befehlszeilen-Clients. Absichtlich
 * großzügig: Ein fälschlich ausgelassener Mensch fällt kaum auf, ein mitgezählter
 * Roboter verfälscht jede Zahl.
 *
 * Die großen Crawler (Googlebot, Bingbot, YandexBot, Applebot, Baiduspider,
 * DuckDuckBot …) tragen „bot" bzw. „spider" im Namen und brauchen keinen
 * eigenen Eintrag. Bewusst NICHT aufgeführt sind Namen, die auch echte
 * Browser tragen (z.B. „DuckDuckGo", „Yandex.Browser").
 */
const BOT_MUSTER =
  /bot|crawl|spider|slurp|scrape|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|checker|curl\/|wget|python|httpclient|axios|node-fetch|go-http|java\/|libwww|okhttp|facebookexternalhit|whatsapp|telegram|preview|embedly|inspectiontool|google-|googleother|mediapartners|ahrefs|semrush|mj12|petalbot|vercel|phantom|puppeteer|playwright|selenium/i;

export function istBot(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.length < 12) return true;
  return BOT_MUSTER.test(userAgent);
}

/**
 * Tageskennung: HMAC über IP + Browserkennung. Zwei Stufen, damit aus dem
 * Betriebsgeheimnis ein eigener, zweckgebundener Schlüssel wird (kein
 * Wiederverwenden des Geheimnisses als solches) und der Tag den Schlüssel
 * wechselt:
 *   zweckSchluessel = HMAC(geheimnis, 'besuch-v1')
 *   tagesSchluessel = HMAC(zweckSchluessel, tag)
 *   kennung         = HMAC(tagesSchluessel, ip + '\n' + userAgent)
 * Ohne das Geheimnis lässt sich aus einer Kennung weder die IP-Adresse
 * zurückgewinnen noch prüfen, ob eine bestimmte IP dahintersteckt.
 */
export function bildeKennung(ip: string, userAgent: string, tag: string, geheimnis: string): string {
  const zweckSchluessel = createHmac('sha256', geheimnis).update('besuch-v1').digest();
  const tagesSchluessel = createHmac('sha256', zweckSchluessel).update(tag).digest();
  return createHmac('sha256', tagesSchluessel).update(`${ip}\n${userAgent}`).digest('hex').slice(0, 32);
}

export interface Anfragemerkmale {
  userAgent: string | null;
  /** Wert des Headers `Sec-GPC` (Global Privacy Control). */
  gpc: string | null;
  /** Wert des Headers `DNT` (Do Not Track). */
  dnt: string | null;
  /** `Sec-Purpose`/`Purpose`: „prefetch", „prerender" … */
  zweck: string | null;
  /** Trägt der Aufrufer ein Admin-Cookie? (Nur Vorhandensein – keine Prüfung.) */
  adminCookie: boolean;
  /** Läuft die Anfrage auf der echten Domain (nicht lokal/Vorschau)? */
  zaehlHost: boolean;
}

/** Warum eine Anfrage NICHT gezählt wird – `null`, wenn sie gezählt werden darf. */
export function ausschlussGrund(m: Anfragemerkmale): string | null {
  if (!m.zaehlHost) return 'fremder-host';
  if (m.gpc === '1') return 'global-privacy-control';
  if (m.dnt === '1') return 'do-not-track';
  if (m.zweck && /prefetch|prerender/i.test(m.zweck)) return 'vorab-laden';
  if (m.adminCookie) return 'betreiber';
  if (istBot(m.userAgent)) return 'roboter';
  return null;
}

/** Ist `host` (mit Port) einer der Hosts, auf denen gezählt wird? */
export function istZaehlHost(host: string | null | undefined, erlaubt: readonly string[]): boolean {
  if (!host) return false;
  const h = host.toLowerCase();
  return erlaubt.some((e) => e.toLowerCase() === h);
}
