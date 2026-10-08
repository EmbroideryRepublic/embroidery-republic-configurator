/**
 * Besucherzähler – Erfassung: Jede Entscheidung, ob und wie ein Seitenaufruf
 * gezählt wird, ist eine reine Funktion und hier belegt.
 *
 * Wichtigste Zusagen, auf die sich die Datenschutzerklärung stützt:
 *   • keine IP-Adresse im Ergebnis, Kennung wechselt täglich
 *   • Roboter, Do-Not-Track, Global-Privacy-Control, Vorab-Laden und der
 *     Betreiber werden nicht gezählt
 *   • der Pfad kommt nur aus der Positivliste in die Datenbank
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ausschlussGrund,
  bereinigeQuelle,
  berlinTag,
  bildeKennung,
  istBot,
  istZaehlHost,
  normalisierePfad,
  type Anfragemerkmale,
} from '../erfassen';
import { PFAD_SONSTIGE, QUELLE_OHNE_KENNZEICHNUNG, QUELLE_SONSTIGE } from '@/config/besuch';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const FIREFOX = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0';
const DUCKDUCKGO_APP =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 DuckDuckGo/7 Safari/605.1.15';

const OEFFENTLICH = new Set(['/', '/faq', '/produkt', '/produkt/hoodie-premium', '/hoodies-bedrucken-besticken']);

// ── Kalendertag ─────────────────────────────────────────────────────────

test('berlinTag: Sommerzeit – 22:30 UTC ist in Berlin schon der nächste Tag', () => {
  assert.equal(berlinTag(new Date('2026-10-08T22:30:00Z')), '2026-10-09');
  assert.equal(berlinTag(new Date('2026-10-08T21:59:59Z')), '2026-10-08');
});

test('berlinTag: Winterzeit – 23:30 UTC ist in Berlin schon der nächste Tag', () => {
  assert.equal(berlinTag(new Date('2026-12-31T22:59:59Z')), '2026-12-31');
  assert.equal(berlinTag(new Date('2026-12-31T23:00:00Z')), '2027-01-01');
});

test('berlinTag: Format ist immer JJJJ-MM-TT (zweistellig)', () => {
  assert.match(berlinTag(new Date('2026-03-05T12:00:00Z')), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(berlinTag(new Date('2026-03-05T12:00:00Z')), '2026-03-05');
});

// ── Pfad ────────────────────────────────────────────────────────────────

test('normalisierePfad: Seiten der Positivliste werden unverändert übernommen', () => {
  assert.equal(normalisierePfad('/', OEFFENTLICH), '/');
  assert.equal(normalisierePfad('/faq', OEFFENTLICH), '/faq');
  assert.equal(normalisierePfad('/produkt/hoodie-premium', OEFFENTLICH), '/produkt/hoodie-premium');
});

test('normalisierePfad: Suchteil, Anker, doppelte und abschließende Schrägstriche fallen weg', () => {
  assert.equal(normalisierePfad('/faq?utm_source=instagram', OEFFENTLICH), '/faq');
  assert.equal(normalisierePfad('/faq#frage-3', OEFFENTLICH), '/faq');
  assert.equal(normalisierePfad('/faq/', OEFFENTLICH), '/faq');
  assert.equal(normalisierePfad('//faq//', OEFFENTLICH), '/faq');
});

test('normalisierePfad: nicht öffentliche Bereiche werden NIE gezählt – auch nicht mit Unterpfad', () => {
  for (const pfad of [
    '/admin',
    '/admin/bestellung/123',
    '/api/besuch',
    '/bestellung/geheimer-zugriffstoken',
    '/konto',
    '/konto/adressen',
    '/auth/callback',
    '/_next/static/x',
  ]) {
    assert.equal(normalisierePfad(pfad, OEFFENTLICH), null, pfad);
  }
});

test('normalisierePfad: ein Zugriffstoken gelangt nie als Pfad in die Statistik', () => {
  // Selbst wenn jemand die Positivliste mit dem Token-Pfad „füttern" würde,
  // schlägt der Ausschluss zuerst zu.
  const mitToken = new Set(['/bestellung/abc123']);
  assert.equal(normalisierePfad('/bestellung/abc123', mitToken), null);
});

test('normalisierePfad: Unbekanntes wird nicht verworfen, sondern unter „sonstige Seiten" gesammelt', () => {
  assert.equal(normalisierePfad('/gibt-es-nicht', OEFFENTLICH), PFAD_SONSTIGE);
  // Der Rohpfad wird dabei NICHT übernommen – nichts Freies landet in der Tabelle.
  assert.notEqual(normalisierePfad('/mailto:jemand@example.org', OEFFENTLICH), '/mailto:jemand@example.org');
});

test('normalisierePfad: Ungültiges wird verworfen', () => {
  assert.equal(normalisierePfad(undefined, OEFFENTLICH), null);
  assert.equal(normalisierePfad(42, OEFFENTLICH), null);
  assert.equal(normalisierePfad({}, OEFFENTLICH), null);
  assert.equal(normalisierePfad('faq', OEFFENTLICH), null);
  assert.equal(normalisierePfad('https://example.org/faq', OEFFENTLICH), null);
  assert.equal(normalisierePfad(`/${'a'.repeat(400)}`, OEFFENTLICH), null);
});

// ── Quelle ──────────────────────────────────────────────────────────────

test('bereinigeQuelle: bekannte Kanäle ohne Rücksicht auf Groß-/Kleinschreibung und Leerzeichen', () => {
  assert.equal(bereinigeQuelle('instagram'), 'instagram');
  assert.equal(bereinigeQuelle('  Instagram '), 'instagram');
  assert.equal(bereinigeQuelle('GOOGLE-ADS'), 'google-ads');
});

test('bereinigeQuelle: unbekannte Werte werden zu „sonstige" – nie frei in die Tabelle', () => {
  assert.equal(bereinigeQuelle('spam-kampagne-123'), QUELLE_SONSTIGE);
  assert.equal(bereinigeQuelle('<script>alert(1)</script>'), QUELLE_SONSTIGE);
  assert.equal(bereinigeQuelle('x'.repeat(500)), QUELLE_SONSTIGE);
});

test('bereinigeQuelle: fehlende Angabe heißt „ohne Kennzeichnung"', () => {
  assert.equal(bereinigeQuelle(undefined), QUELLE_OHNE_KENNZEICHNUNG);
  assert.equal(bereinigeQuelle(null), QUELLE_OHNE_KENNZEICHNUNG);
  assert.equal(bereinigeQuelle(''), QUELLE_OHNE_KENNZEICHNUNG);
  assert.equal(bereinigeQuelle('   '), QUELLE_OHNE_KENNZEICHNUNG);
  assert.equal(bereinigeQuelle(7), QUELLE_OHNE_KENNZEICHNUNG);
});

// ── Roboter ─────────────────────────────────────────────────────────────

test('istBot: gängige Browser sind keine Roboter', () => {
  for (const ua of [CHROME, IPHONE, FIREFOX, DUCKDUCKGO_APP]) assert.equal(istBot(ua), false, ua);
});

test('istBot: Suchmaschinen, Vorschau-Dienste, Werkzeuge und Headless-Browser werden erkannt', () => {
  for (const ua of [
    'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
    'Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)',
    'Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)',
    'DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.1.1 Safari/605.1.15 (Applebot/0.1)',
    'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 (compatible; GoogleOther)',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Linux; Android 11; moto g power (2022)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
    'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    'WhatsApp/2.24.10.80 A',
    'TelegramBot (like TwitterBot)',
    'curl/8.4.0',
    'Wget/1.21.4',
    'python-requests/2.31.0',
    'Go-http-client/2.0',
    'node-fetch/1.0',
    'Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)',
    'Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Playwright',
    'Mozilla/5.0 (compatible; UptimeRobot/2.0; http://www.uptimerobot.com/)',
  ]) {
    assert.equal(istBot(ua), true, ua);
  }
});

test('istBot: fehlende oder winzige Browserkennung gilt als Roboter', () => {
  assert.equal(istBot(null), true);
  assert.equal(istBot(undefined), true);
  assert.equal(istBot(''), true);
  assert.equal(istBot('Mozilla/5.0'), true);
});

// ── Tageskennung ────────────────────────────────────────────────────────

const GEHEIMNIS = 'ein-ausreichend-langes-testgeheimnis-0123456789';

test('bildeKennung: gleiche Eingaben ergeben dieselbe Kennung (sonst gäbe es keine Besucherzählung)', () => {
  const a = bildeKennung('203.0.113.7', CHROME, '2026-10-08', GEHEIMNIS);
  const b = bildeKennung('203.0.113.7', CHROME, '2026-10-08', GEHEIMNIS);
  assert.equal(a, b);
});

test('bildeKennung: andere IP, anderer Browser, anderes Geheimnis → andere Kennung', () => {
  const basis = bildeKennung('203.0.113.7', CHROME, '2026-10-08', GEHEIMNIS);
  assert.notEqual(bildeKennung('203.0.113.8', CHROME, '2026-10-08', GEHEIMNIS), basis);
  assert.notEqual(bildeKennung('203.0.113.7', FIREFOX, '2026-10-08', GEHEIMNIS), basis);
  assert.notEqual(bildeKennung('203.0.113.7', CHROME, '2026-10-08', `${GEHEIMNIS}x`), basis);
});

test('bildeKennung: DERSELBE Besucher hat an jedem Tag eine andere Kennung (keine Verknüpfung über Tage)', () => {
  const kennungen = ['2026-10-08', '2026-10-09', '2026-10-10', '2026-11-08', '2027-10-08'].map((tag) =>
    bildeKennung('203.0.113.7', CHROME, tag, GEHEIMNIS)
  );
  assert.equal(new Set(kennungen).size, kennungen.length);
});

test('bildeKennung: kompakter Hexwert, der weder IP noch Browserkennung enthält', () => {
  const kennung = bildeKennung('203.0.113.7', CHROME, '2026-10-08', GEHEIMNIS);
  assert.match(kennung, /^[0-9a-f]{32}$/);
  assert.ok(!kennung.includes('203'));
  assert.ok(!kennung.toLowerCase().includes('chrome'));
});

test('bildeKennung: IP und Browserkennung lassen sich nicht ineinander verschieben', () => {
  // Trennzeichen verhindert, dass ("1.2.3.4", "5xyz") und ("1.2.3.45", "xyz") kollidieren.
  const a = bildeKennung('1.2.3.4', '5xyz-browser-kennung', '2026-10-08', GEHEIMNIS);
  const b = bildeKennung('1.2.3.45', 'xyz-browser-kennung', '2026-10-08', GEHEIMNIS);
  assert.notEqual(a, b);
});

// ── Ausschlussgründe ────────────────────────────────────────────────────

const MENSCH: Anfragemerkmale = {
  userAgent: CHROME,
  gpc: null,
  dnt: null,
  zweck: null,
  adminCookie: false,
  zaehlHost: true,
};

test('ausschlussGrund: ein gewöhnlicher Besucher wird gezählt', () => {
  assert.equal(ausschlussGrund(MENSCH), null);
});

test('ausschlussGrund: jeder Ausschlussgrund greift einzeln', () => {
  assert.equal(ausschlussGrund({ ...MENSCH, zaehlHost: false }), 'fremder-host');
  assert.equal(ausschlussGrund({ ...MENSCH, gpc: '1' }), 'global-privacy-control');
  assert.equal(ausschlussGrund({ ...MENSCH, dnt: '1' }), 'do-not-track');
  assert.equal(ausschlussGrund({ ...MENSCH, zweck: 'prefetch' }), 'vorab-laden');
  assert.equal(ausschlussGrund({ ...MENSCH, zweck: 'Prerender' }), 'vorab-laden');
  assert.equal(ausschlussGrund({ ...MENSCH, adminCookie: true }), 'betreiber');
  assert.equal(ausschlussGrund({ ...MENSCH, userAgent: 'curl/8.4.0' }), 'roboter');
});

test('ausschlussGrund: GPC="0" und DNT="0" (ausdrücklich NICHT widersprochen) schließen nicht aus', () => {
  assert.equal(ausschlussGrund({ ...MENSCH, gpc: '0', dnt: '0' }), null);
});

test('ausschlussGrund: ein Wert, der kein Vorab-Laden ist, schließt nicht aus', () => {
  assert.equal(ausschlussGrund({ ...MENSCH, zweck: 'navigate' }), null);
});

// ── Hosts ───────────────────────────────────────────────────────────────

test('istZaehlHost: nur die ausdrücklich erlaubten Hosts', () => {
  const erlaubt = ['www.ergermany.de', 'ergermany.de'];
  assert.equal(istZaehlHost('www.ergermany.de', erlaubt), true);
  assert.equal(istZaehlHost('WWW.ERGERMANY.DE', erlaubt), true);
  assert.equal(istZaehlHost('embroidery-republic.vercel.app', erlaubt), false);
  assert.equal(istZaehlHost('localhost:3000', erlaubt), false);
  assert.equal(istZaehlHost('www.ergermany.de.evil.example', erlaubt), false);
  assert.equal(istZaehlHost(null, erlaubt), false);
  assert.equal(istZaehlHost('', erlaubt), false);
});
