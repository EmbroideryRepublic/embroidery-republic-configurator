#!/usr/bin/env node
/**
 * SEO-Konsistenzprüfung gegen die LIVE-Seite – nur lesend, ohne Abhängigkeiten.
 *
 *   npm run seo:pruefen                       → https://www.ergermany.de
 *   npm run seo:pruefen -- https://staging.x  → andere Basisadresse
 *
 * Warum es das gibt: Ende 2026-10 fiel auf, dass `ergermany.de` per 308 auf
 * `www.ergermany.de` umleitet, die Seite dort aber `rel="canonical"` auf die
 * Adresse OHNE www trug und alle 163 Sitemap-Einträge ebenfalls – jede
 * kanonische Adresse widersprach dem Server. Das wirft keinen Fehler, kein
 * Test schlägt an, und Google indexiert solche Seiten verzögert oder gar nicht.
 * Dieses Skript prüft genau die Dinge, die still kaputtgehen können:
 *
 *   1. Der Gegen-Host (mit/ohne www) leitet per 301/308 auf den Haupt-Host um.
 *   2. HTTP leitet auf HTTPS um.
 *   3. Startseite: Canonical und Vorschaubild zeigen auf den Haupt-Host.
 *   4. robots.txt: `Sitemap:`-Zeile zeigt auf den Haupt-Host.
 *   5. Sitemap: jede URL liegt auf dem Haupt-Host und antwortet DIREKT mit 200.
 *   6. Jede Seite: genau ein Canonical = die eigene URL, ein <title>, eine
 *      Meta-Description, ein og:image, genau ein <h1>; Titel/Descriptions einmalig.
 *   7. Strukturierte Daten (JSON-LD) sind gültiges JSON und zeigen auf den
 *      Haupt-Host.
 *   8. Die technischen *.vercel.app-Adressen sind per X-Robots-Tag gesperrt.
 *   9. Unbekannte Adressen liefern echtes 404 (kein Soft-404).
 *
 * Exit-Code 1, sobald eine Prüfung fehlschlägt.
 */

const basis = (process.argv[2] ?? 'https://www.ergermany.de').replace(/\/$/, '');
const host = new URL(basis).hostname;
const UA = { 'user-agent': 'seo-pruefen/1.0 (+Konsistenzpruefung)' };

const ergebnisse = [];
const ok = (name, detail = '') => ergebnisse.push({ ok: true, name, detail });
const fehl = (name, detail = '') => ergebnisse.push({ ok: false, name, detail });
const pruefe = (bedingung, name, detail = '') => (bedingung ? ok(name, detail) : fehl(name, detail));

/** Holt eine URL OHNE Weiterleitungen zu folgen – wir wollen sie sehen. */
async function hole(url, optionen = {}) {
  try {
    return await fetch(url, { redirect: 'manual', headers: UA, ...optionen });
  } catch (fehler) {
    return { status: 0, headers: new Headers(), text: async () => '', fehler: String(fehler?.cause?.code ?? fehler) };
  }
}

const ohneSlash = (u) => (u ?? '').replace(/\/$/, '');
const hostVon = (u) => {
  try {
    return new URL(u).hostname;
  } catch {
    return '';
  }
};
const grab = (html, re) => (html.match(re) ?? [])[1];
const alle = (html, re) => [...html.matchAll(re)].map((m) => m[1]);
const entities = (s = '') => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');

// ── 1. Gegen-Host ────────────────────────────────────────────────────────
const gegenHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
{
  const r = await hole(`https://${gegenHost}/`);
  const ziel = hostVon(r.headers.get('location') ?? '');
  if ([301, 308].includes(r.status)) {
    pruefe(ziel === host, `Gegen-Host ${gegenHost} leitet dauerhaft auf ${host} um`, `${r.status} → ${r.headers.get('location')}`);
  } else if (r.status === 0) {
    ok(`Gegen-Host ${gegenHost}`, `nicht erreichbar (${r.fehler}) – übersprungen`);
  } else {
    fehl(`Gegen-Host ${gegenHost} muss auf ${host} umleiten`, `Status ${r.status}${r.status === 200 ? ' – beide Hosts liefern Inhalt aus (Duplicate Content)' : ''}`);
  }
}

// ── 2. HTTP → HTTPS ──────────────────────────────────────────────────────
{
  const r = await hole(`http://${host}/`);
  pruefe([301, 308].includes(r.status) && (r.headers.get('location') ?? '').startsWith('https://'), 'HTTP leitet auf HTTPS um', `${r.status} → ${r.headers.get('location')}`);
}

// ── 3. Startseite ────────────────────────────────────────────────────────
{
  const r = await hole(`${basis}/`);
  const html = await r.text();
  pruefe(r.status === 200, 'Startseite antwortet direkt mit 200', `Status ${r.status}`);
  const canonical = grab(html, /<link rel="canonical" href="([^"]+)"/);
  pruefe(ohneSlash(canonical) === basis, 'Startseite: Canonical = Haupt-Host', canonical ?? 'FEHLT');
  const og = grab(html, /<meta property="og:image" content="([^"]+)"/);
  pruefe(hostVon(og) === host, 'Startseite: Open-Graph-Bild liegt auf dem Haupt-Host', og ?? 'FEHLT');
}

// ── 4. robots.txt ────────────────────────────────────────────────────────
{
  const r = await hole(`${basis}/robots.txt`);
  const text = await r.text();
  const sitemapZeile = grab(text, /^Sitemap:\s*(\S+)/im);
  pruefe(r.status === 200, 'robots.txt erreichbar', `Status ${r.status}`);
  pruefe(hostVon(sitemapZeile) === host, 'robots.txt: Sitemap-Zeile zeigt auf den Haupt-Host', sitemapZeile ?? 'FEHLT');
  pruefe(/Disallow:\s*\/admin/i.test(text), 'robots.txt sperrt /admin');
}

// ── 5.+6.+7. Sitemap und jede einzelne Seite ─────────────────────────────
let urls = [];
{
  const r = await hole(`${basis}/sitemap.xml`);
  const xml = await r.text();
  urls = alle(xml, /<loc>([^<]+)<\/loc>/g).map(entities);
  pruefe(r.status === 200 && urls.length > 0, `Sitemap erreichbar und befüllt`, `${urls.length} URLs`);
  const fremd = urls.filter((u) => hostVon(u) !== host);
  pruefe(fremd.length === 0, 'Sitemap: alle URLs liegen auf dem Haupt-Host', fremd.length ? `${fremd.length} abweichend, z.B. ${fremd[0]}` : `${urls.length}/${urls.length}`);
}

const seiten = [];
async function pruefeSeite(url) {
  const r = await hole(url);
  const eintrag = { url, status: r.status, probleme: [] };
  if (r.status !== 200) {
    eintrag.probleme.push(`Status ${r.status}${[301, 308].includes(r.status) ? ' (Weiterleitung in der Sitemap)' : ''}`);
    return eintrag;
  }
  const html = await r.text();
  const canonicals = alle(html, /<link rel="canonical" href="([^"]+)"/g);
  if (canonicals.length !== 1) eintrag.probleme.push(`${canonicals.length} Canonical-Tags`);
  else if (ohneSlash(canonicals[0]) !== ohneSlash(url)) eintrag.probleme.push(`Canonical ≠ eigene URL (${canonicals[0]})`);
  eintrag.titel = entities(grab(html.replace(/\n/g, ' '), /<title>([^<]*)<\/title>/) ?? '');
  eintrag.beschreibung = entities(grab(html, /<meta name="description" content="([^"]*)"/) ?? '');
  if (!eintrag.titel) eintrag.probleme.push('kein <title>');
  if (!eintrag.beschreibung) eintrag.probleme.push('keine Meta-Description');
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) eintrag.probleme.push(`${h1} <h1>`);
  if (/<meta name="robots" content="[^"]*noindex/i.test(html)) eintrag.probleme.push('noindex trotz Sitemap-Eintrag');
  // Vorschaubild für geteilte Links: Seiten mit eigenem `openGraph` verlieren das
  // geerbte Standardbild still (siehe src/lib/seo/vorschau.ts).
  const ogBild = grab(html, /<meta property="og:image" content="([^"]+)"/);
  if (!ogBild) eintrag.probleme.push('kein og:image (geteilte Links ohne Vorschaubild)');
  else if (hostVon(ogBild) !== host) eintrag.probleme.push(`og:image auf fremdem Host (${ogBild})`);
  for (const block of alle(html, /<script type="application\/ld\+json">([^<]*)<\/script>/g)) {
    try {
      const daten = JSON.parse(block);
      const urlFelder = JSON.stringify(daten).match(/"(?:url|item)":"https?:[^"]+"/g) ?? [];
      const fremd = urlFelder.filter((f) => hostVon(f.split('":"')[1]?.replace(/"$/, '')) !== host);
      if (fremd.length) eintrag.probleme.push(`JSON-LD mit fremdem Host (${fremd[0]})`);
    } catch {
      eintrag.probleme.push('JSON-LD ist kein gültiges JSON');
    }
  }
  return eintrag;
}
{
  // Begrenzte Parallelität: freundlich zum Server und zur Rate-Limit-Grenze.
  const warteschlange = [...urls];
  const arbeiter = Array.from({ length: 6 }, async () => {
    while (warteschlange.length) {
      const u = warteschlange.shift();
      if (u) seiten.push(await pruefeSeite(u));
    }
  });
  await Promise.all(arbeiter);

  const kaputt = seiten.filter((s) => s.probleme.length);
  pruefe(
    kaputt.length === 0,
    `Seiten einzeln: antwortet direkt mit 200, 1 Canonical = eigene URL, Titel, Description, 1×<h1>, JSON-LD gültig`,
    kaputt.length
      ? `${kaputt.length}/${seiten.length} mit Problem, z.B. ${kaputt[0].url} → ${kaputt[0].probleme.join('; ')}`
      : `${seiten.length}/${seiten.length} in Ordnung`
  );

  const gruppiere = (feld) => {
    const m = new Map();
    for (const s of seiten.filter((x) => x[feld])) m.set(s[feld], [...(m.get(s[feld]) ?? []), s.url]);
    return [...m.entries()].filter(([, l]) => l.length > 1);
  };
  const dupTitel = gruppiere('titel');
  pruefe(dupTitel.length === 0, 'Seitentitel sind einmalig', dupTitel.length ? `${dupTitel.length} doppelt, z.B. „${dupTitel[0][0]}“ (${dupTitel[0][1].length}×)` : `${new Set(seiten.map((s) => s.titel)).size} verschiedene`);
  const dupBeschr = gruppiere('beschreibung');
  pruefe(dupBeschr.length === 0, 'Meta-Descriptions sind einmalig', dupBeschr.length ? `${dupBeschr.length} doppelt, z.B. (${dupBeschr[0][1].length}×) ${dupBeschr[0][1][0]}` : `${new Set(seiten.map((s) => s.beschreibung)).size} verschiedene`);

  const langeTitel = seiten.filter((s) => s.titel && s.titel.length > 65);
  // Hinweis, kein Fehler: Google kürzt ab ~60 Zeichen (Pixelbreite), nicht hart.
  ok('Titellänge', langeTitel.length ? `${langeTitel.length} Titel > 65 Zeichen (werden in der Trefferliste gekürzt)` : 'alle ≤ 65 Zeichen');
}

// ── 8. vercel.app-Adressen ───────────────────────────────────────────────
{
  const r = await hole('https://ergermany.vercel.app/');
  if (r.status === 0) ok('vercel.app-Adresse', `nicht erreichbar (${r.fehler}) – übersprungen`);
  else pruefe((r.headers.get('x-robots-tag') ?? '').toLowerCase().includes('noindex'), 'ergermany.vercel.app ist per X-Robots-Tag auf noindex gesetzt', `Status ${r.status}, X-Robots-Tag: ${r.headers.get('x-robots-tag') ?? 'FEHLT'}`);
}

// ── 9. Soft-404 ──────────────────────────────────────────────────────────
{
  const r = await hole(`${basis}/diese-seite-gibt-es-garantiert-nicht-xyz`);
  pruefe(r.status === 404, 'Unbekannte Adresse liefert echtes 404', `Status ${r.status}`);
}

// ── Ausgabe ──────────────────────────────────────────────────────────────
console.log(`\nSEO-Prüfung für ${basis}\n${'─'.repeat(72)}`);
for (const e of ergebnisse) console.log(`${e.ok ? '✔' : '✘'} ${e.name}${e.detail ? `\n    ${e.detail}` : ''}`);
const fehler = ergebnisse.filter((e) => !e.ok).length;
console.log(`${'─'.repeat(72)}\n${ergebnisse.length - fehler}/${ergebnisse.length} bestanden${fehler ? `, ${fehler} FEHLGESCHLAGEN` : ' – alles in Ordnung'}\n`);
process.exit(fehler ? 1 : 0);
