#!/usr/bin/env node
/**
 * Meldet URLs per IndexNow (offenes Protokoll) an Bing, Yandex, Naver, Seznam –
 * und damit mittelbar an DuckDuckGo, Ecosia und die Websuche von ChatGPT, die
 * auf dem Bing-Index aufsetzen. Google nutzt IndexNow NICHT (dort: Search
 * Console, siehe docs/runbook.md 2.6).
 *
 *   npm run seo:indexnow                       → alle URLs aus der Live-Sitemap
 *   npm run seo:indexnow -- /produkt/x /faq    → nur diese Pfade
 *
 * Kein Konto nötig: Der Besitz der Domain wird dadurch belegt, dass unter
 * `https://<host>/<schlüssel>.txt` genau dieser Schlüssel steht (Datei liegt in
 * `public/`). Gemeldet werden ausschließlich bereits öffentliche Adressen.
 * Nach inhaltlichen Änderungen erneut ausführen – nur für geänderte Seiten.
 */
import { readdirSync, readFileSync } from 'node:fs';

const HOST = 'www.ergermany.de';
const datei = readdirSync('public').find((f) => /^[a-f0-9]{32}\.txt$/.test(f));
if (!datei) {
  console.error('Keine IndexNow-Schlüsseldatei in public/ gefunden (<32 Hexzeichen>.txt).');
  process.exit(1);
}
const key = datei.replace(/\.txt$/, '');
if (readFileSync(`public/${datei}`, 'utf8').trim() !== key) {
  console.error(`Inhalt von public/${datei} muss exakt dem Dateinamen entsprechen.`);
  process.exit(1);
}

// Beweis zuerst: Ist der Schlüssel unter der Live-Adresse wirklich abrufbar?
const beleg = await fetch(`https://${HOST}/${datei}`);
if (!beleg.ok || (await beleg.text()).trim() !== key) {
  console.error(`Schlüsseldatei unter https://${HOST}/${datei} nicht (korrekt) erreichbar – erst deployen. Status ${beleg.status}`);
  process.exit(1);
}

const pfade = process.argv.slice(2);
let urls;
if (pfade.length) {
  urls = pfade.map((p) => `https://${HOST}${p.startsWith('/') ? p : `/${p}`}`);
} else {
  const xml = await (await fetch(`https://${HOST}/sitemap.xml`)).text();
  urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/&amp;/g, '&'));
}
const fremd = urls.filter((u) => new URL(u).hostname !== HOST);
if (fremd.length) {
  console.error(`Abbruch: ${fremd.length} URL(s) nicht auf ${HOST}, z.B. ${fremd[0]}`);
  process.exit(1);
}

const antwort = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'content-type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: HOST, key, keyLocation: `https://${HOST}/${datei}`, urlList: urls }),
});
console.log(`IndexNow: ${urls.length} URLs gemeldet → HTTP ${antwort.status} ${antwort.statusText}`);
console.log('(200/202 = angenommen; 422 = URLs/Schlüssel passen nicht zur Domain; 429 = zu oft gesendet)');
process.exit(antwort.status === 200 || antwort.status === 202 ? 0 : 1);
