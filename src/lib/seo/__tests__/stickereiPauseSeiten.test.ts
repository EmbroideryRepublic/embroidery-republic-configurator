/**
 * Stickerei-Pause in den SEO-Seiten (Betriebsschalter BETRIEBSSCHALTER in config/bestellweg.ts).
 *
 * Betreiberauftrag: „Es darf keine falschen Leistungsversprechen geben.“ Solange die Stickerei pausiert ist, darf KEIN
 * sichtbarer Kundentext sie als verfügbare Leistung nahelegen – weder im Seitentext noch im HTML-Kopf (Titel,
 * Beschreibung, Open Graph), in den strukturierten Daten (JSON-LD), in llms.txt, im Manifest oder in der Sitemap.
 * Erlaubt bleiben nur die ausdrücklichen Pause-Hinweise (HINWEIS_STICKEREI_PAUSIERT und die Kartenkennzeichnung
 * KARTE_STICKEREI_PAUSIERT).
 *
 * Geprüft wird nicht der Quelltext, sondern das, was ausgeliefert wird: Die Seiten werden tatsächlich gerendert
 * (renderToStaticMarkup) und die Metadaten-Funktionen der Seiten aufgerufen. Umgekehrt muss bei leerem Schalter der
 * bisherige Wortlaut samt Stickerei-Angebot vollständig zurückkehren (Wiederaufnahme).
 *
 * Nicht geprüft werden Adressen (Slugs wie „hoodies-bedrucken-besticken“ sind indexiert und bleiben) und der
 * Markenname „Embroidery Republic“.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import Kategorieseite, { generateMetadata as kategorieMetadata } from '@/app/[kategorie]/page';
import manifest from '@/app/manifest';
import sitemap from '@/app/sitemap';
import { AnlassLandingpage, anlassMetadata } from '@/components/seo/AnlassLandingpage';
import { DtfLandingpage, dtfMetadata } from '@/components/seo/DtfLandingpage';
import { FooterSeoLinks } from '@/components/seo/FooterSeoLinks';
import { GeschaeftsanfrageForm } from '@/components/seo/GeschaeftsanfrageForm';
import { BETRIEBSSCHALTER } from '@/config/bestellweg';
import { ANLASS_SEITEN } from '@/config/seo/anlassSeiten';
import { DTF_SEITEN } from '@/config/seo/dtfSeiten';
import {
  A_DAUER_DTF,
  A_DATEIEN_DTF,
  A_DTF,
  HINWEIS_STICKEREI_PAUSIERT,
  KARTE_STICKEREI_PAUSIERT,
  KATEGORIE_SEITEN,
} from '@/config/seo/kategorieSeiten';
import { PRODUCTS } from '@/config/products';
import { kanonischeBasisUrl } from '../basisUrl';
import { fuelleVorlage, kategorieFakten, seitenTexte } from '../kategorieSeite';
import { llmsText } from '../llmsText';
import { shopBeschreibung } from '../shopBeschreibung';
import { organisationSchema, sammlungSchema } from '../strukturierteDaten';
import type { PrintMethod } from '@/types';

// ── Hilfen ──────────────────────────────────────────────────────────────

async function mitSchalter<T>(pausiert: PrintMethod[], fn: () => Promise<T> | T): Promise<T> {
  const vorher = [...BETRIEBSSCHALTER.pausierteVeredelungen];
  BETRIEBSSCHALTER.pausierteVeredelungen = [...pausiert];
  try {
    return await fn();
  } finally {
    BETRIEBSSCHALTER.pausierteVeredelungen = vorher;
  }
}
const PAUSIERT: PrintMethod[] = ['embroidery'];
const AN: PrintMethod[] = [];

/** Wörter, die die Stickerei als Leistung nahelegen: Stick… (besticken, Stickerei, Stickdaten, Stickbild …), gestickt, digitalisieren, Garn(farben), Stiche. („sticky“ ist ein CSS-Wort, „Garnet“ ein Farbname.) */
const STICKEREI_WORTE = /stick(?!y)|gestickt|digitalisier|\bgarn\b|garnfarb|\bstiche\b|\bstichen\b/i;

const KATEGORIE_SLUGS = KATEGORIE_SEITEN.map((s) => s.slug);

const maskiere = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Sichtbarer Text einer gerenderten Seite samt Attributtexten (alt/title/aria-label) und JSON-LD, ohne Markup. */
function sichtbarerText(html: string): string {
  const attribute = [...html.matchAll(/\b(?:alt|title|aria-label|placeholder)="([^"]*)"/g)].map((m) => m[1]).join(' ');
  const ohneMarkup = html.replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, ' ');
  return `${ohneMarkup} ${attribute}`
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');
}

/** Entfernt, was ausdrücklich erlaubt ist: Adressen (Slugs), den Pause-Hinweis und die Kennzeichnung der Stickerei-Karte. */
function ohneErlaubtes(text: string): string {
  let t = text.replace(/\s+/g, ' ');
  for (const slug of KATEGORIE_SLUGS) t = t.split(slug).join('');
  t = t.split(HINWEIS_STICKEREI_PAUSIERT).join('');
  t = t.replace(new RegExp(`Stickerei\\s+${maskiere(KARTE_STICKEREI_PAUSIERT)}`, 'g'), '');
  return t;
}

function pruefeOhneStickerei(text: string, wo: string): void {
  const rest = ohneErlaubtes(text);
  const treffer = rest.match(new RegExp(`.{0,70}(?:${STICKEREI_WORTE.source}).{0,70}`, 'i'));
  assert.equal(treffer, null, `${wo}: Stickerei-Aussage trotz Pause: „${treffer?.[0]}“`);
}

async function rendere(element: unknown): Promise<string> {
  return renderToStaticMarkup((await element) as never);
}

const kategorieSeite = (slug: string) => rendere(Kategorieseite({ params: Promise.resolve({ kategorie: slug }) }));
const kategorieKopf = (slug: string) => kategorieMetadata({ params: Promise.resolve({ kategorie: slug }) });

/** JSON-LD-Blöcke einer gerenderten Seite. */
function jsonLd(html: string): Record<string, unknown>[] {
  return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(
    (m) => JSON.parse(m[1]!) as Record<string, unknown>
  );
}

// ── Pausiert: keine Aussage über die Stickerei ──────────────────────────

test('Pause: Kategorieseiten (Hoodies, T-Shirts, Poloshirts) – Text, Kopf, FAQ und JSON-LD ohne Stickerei-Aussage', async () => {
  await mitSchalter(PAUSIERT, async () => {
    for (const seite of KATEGORIE_SEITEN) {
      const html = await kategorieSeite(seite.slug);
      const kopf = JSON.stringify(await kategorieKopf(seite.slug));
      pruefeOhneStickerei(sichtbarerText(html), `${seite.slug} (Seite, Text und JSON-LD)`);
      pruefeOhneStickerei(kopf, `${seite.slug} (Titel, Beschreibung, Open Graph)`);

      const text = sichtbarerText(html);
      assert.ok(text.includes(HINWEIS_STICKEREI_PAUSIERT), `${seite.slug}: der Pause-Hinweis fehlt`);
      assert.equal(html.split(KARTE_STICKEREI_PAUSIERT).length - 1, 1, `${seite.slug}: genau eine Kennzeichnung „${KARTE_STICKEREI_PAUSIERT}“`);
      assert.ok(!text.includes('DTF-Transferdruck oder Stickerei?'), `${seite.slug}: die Überschrift bietet noch die Wahl an`);
      assert.ok(!text.includes(seite.verfahren.stickerei), `${seite.slug}: Beschreibung der Stickerei-Karte steht noch auf der Seite`);

      // Die Stickerei-Karte trägt nur Name und Kennzeichnung; DTF steht vorn (auch beim Poloshirt).
      assert.ok(html.indexOf('>DTF-Transferdruck</h3>') < html.indexOf('>Stickerei</h3>'), `${seite.slug}: DTF-Karte steht nicht vorn`);

      // Der Kopf nennt den Pausen-Wortlaut.
      const texte = seitenTexte(seite, false);
      assert.deepEqual((await kategorieKopf(seite.slug)).title, { absolute: texte.titel });
      assert.ok(text.includes(texte.h1), `${seite.slug}: Überschrift`);

      // JSON-LD: Seitenname und Beschreibung sind der Pausen-Wortlaut; die FAQ-Auszeichnung ist wortgleich mit der sichtbaren Seite.
      const bloecke = jsonLd(html);
      const sammlung = bloecke.find((b) => b['@type'] === 'CollectionPage')!;
      assert.equal(sammlung['name'], texte.h1);
      assert.equal(sammlung['description'], fuelleVorlage(texte.beschreibung, kategorieFakten(seite.art)));
      const faq = bloecke.find((b) => b['@type'] === 'FAQPage') as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
      assert.equal(faq.mainEntity.length, texte.fragen.length, `${seite.slug}: Anzahl der FAQ-Einträge`);
      for (const f of faq.mainEntity) {
        assert.ok(text.includes(f.name) && text.includes(f.acceptedAnswer.text), `${seite.slug}: FAQ nicht wortgleich sichtbar: ${f.name}`);
      }
    }
  });
});

test('Pause: Anlass- und Ratgeberseiten – Text, Kopf, FAQ und JSON-LD ohne Stickerei-Aussage', async () => {
  await mitSchalter(PAUSIERT, async () => {
    assert.ok(ANLASS_SEITEN.length > 0);
    for (const seite of ANLASS_SEITEN) {
      pruefeOhneStickerei(sichtbarerText(await rendere(AnlassLandingpage({ seite }))), `${seite.slug} (Seite)`);
      pruefeOhneStickerei(JSON.stringify(anlassMetadata(seite)), `${seite.slug} (Kopf)`);
    }
  });
});

test('Pause: DTF-Seiten (Marken und weitere Produktarten) – Text, Kopf, FAQ und JSON-LD ohne Stickerei-Aussage', async () => {
  await mitSchalter(PAUSIERT, async () => {
    assert.ok(DTF_SEITEN.length > 0);
    for (const seite of DTF_SEITEN) {
      pruefeOhneStickerei(sichtbarerText(await rendere(DtfLandingpage({ seite }))), `${seite.slug} (Seite)`);
      pruefeOhneStickerei(JSON.stringify(dtfMetadata(seite)), `${seite.slug} (Kopf)`);
    }
  });
});

test('Pause: Fußzeilen-Links, Geschäftsanfrage-Formular, llms.txt, Manifest, Sitemap und Sammlungs-Schemas ohne Stickerei-Aussage', async () => {
  await mitSchalter(PAUSIERT, async () => {
    pruefeOhneStickerei(sichtbarerText(renderToStaticMarkup(createElement(FooterSeoLinks))), 'Fußzeilen-Links');
    pruefeOhneStickerei(sichtbarerText(renderToStaticMarkup(createElement(GeschaeftsanfrageForm))), 'Geschäftsanfrage-Formular');

    // llms.txt nennt die Pause ausdrücklich; sonst kommt die Stickerei darin nicht vor.
    const llms = llmsText(kanonischeBasisUrl());
    assert.ok(llms.includes('Die Stickerei ist wegen Wartungs- und Umbauarbeiten vorübergehend nicht verfügbar.'));
    pruefeOhneStickerei(llms.replace('Die Stickerei ist wegen Wartungs- und Umbauarbeiten vorübergehend nicht verfügbar.', ''), 'llms.txt');

    pruefeOhneStickerei(JSON.stringify(manifest()), 'Manifest');
    pruefeOhneStickerei(sitemap().map((e) => e.url).join('\n'), 'Sitemap');
    pruefeOhneStickerei(JSON.stringify(sammlungSchema(kanonischeBasisUrl(), PRODUCTS.length)), 'Sammlungs-Schema (/produkt)');
    pruefeOhneStickerei(JSON.stringify(organisationSchema(kanonischeBasisUrl())), 'Organisations-Schema (Startseite)');
    pruefeOhneStickerei(shopBeschreibung(['Hoodies', 'T-Shirts', 'Polos'], false), 'Beschreibung der Produktübersicht');
  });
});

test('Pause: jede Kategorieseite hat einen Pausen-Wortlaut mit Titel ≤ 60 Zeichen, eindeutiger Beschreibung 70–160 Zeichen und mindestens vier Fragen', () => {
  const titel = KATEGORIE_SEITEN.map((s) => seitenTexte(s, false).titel);
  assert.equal(new Set(titel).size, titel.length, 'doppelter Titel');
  const beschreibungen = KATEGORIE_SEITEN.map((s) => fuelleVorlage(seitenTexte(s, false).beschreibung, kategorieFakten(s.art)));
  assert.equal(new Set(beschreibungen).size, beschreibungen.length, 'doppelte Beschreibung');
  for (const s of KATEGORIE_SEITEN) {
    const t = seitenTexte(s, false);
    assert.ok(t.titel.length <= 60 && /bedrucken/.test(t.titel), `${s.slug}: Titel „${t.titel}“`);
    const b = fuelleVorlage(t.beschreibung, kategorieFakten(s.art));
    assert.ok(b.length >= 70 && b.length <= 160, `${s.slug}: Beschreibung ${b.length} Zeichen: ${b}`);
    assert.ok(t.fragen.length >= 4, `${s.slug}: nur ${t.fragen.length} Fragen`);
    const fragen = t.fragen.map((f) => f.q);
    assert.equal(new Set(fragen).size, fragen.length, `${s.slug}: doppelte Frage`);
    for (const f of t.fragen) {
      assert.ok(f.q.endsWith('?') && f.a.length > 40, `${s.slug}: Frage/Antwort unvollständig: ${f.q}`);
      assert.doesNotMatch(fuelleVorlage(`${f.q} ${f.a}`, kategorieFakten(s.art)), /[{}]/, `${s.slug}: Rest-Platzhalter`);
    }
    for (const text of [t.h1, t.titel, t.dtf, ...t.einleitung]) assert.doesNotMatch(fuelleVorlage(text, kategorieFakten(s.art)), /[{}]/);
  }
});

test('Pause: die Pausen-Antworten sind wortgleich mit den (freigegebenen) Antworten der DTF-Seiten', () => {
  const dtf = DTF_SEITEN.find((s) => s.art === 'longsleeve')!;
  const antwort = (frage: string) => dtf.fragen.find((f) => f.q === frage)!.a;
  assert.equal(A_DTF, antwort('Wofür eignet sich der DTF-Transferdruck?'));
  assert.equal(A_DATEIEN_DTF, antwort('Welche Dateien kann ich für mein Logo hochladen?'));
  assert.equal(A_DAUER_DTF, antwort('Wie lange dauert es, bis meine Bestellung ankommt?'));
});

// ── Wiederaufnahme: leerer Schalter = bisheriger Wortlaut ───────────────

/** Der Wortlaut der Seiten vor der Pause-Anpassung (Stickerei wird angeboten). */
const BISHERIG: Record<string, { titel: string; h1: string; beschreibung: string; fragen: string[]; zuerst: 'dtf' | 'embroidery' }> = {
  'hoodies-bedrucken-besticken': {
    titel: 'Hoodies bedrucken & besticken lassen – ab 1 Stück',
    h1: 'Hoodies bedrucken & besticken lassen',
    beschreibung:
      '{anzahl} Hoodies von {marken3} u. a. mit Logo oder Motiv veredeln: DTF-Transferdruck oder Stickerei, live im Konfigurator, ab 1 Stück.',
    fragen: [
      'Kann ich auch nur einen einzelnen Hoodie bedrucken oder besticken lassen?',
      'Was ist besser für einen Hoodie: Druck oder Stickerei?',
      'Welche Dateien kann ich für mein Logo hochladen?',
      'Wie lange dauert es, bis mein Hoodie ankommt?',
      'Welche Hoodies gibt es und wie schwer sind sie?',
      'Was kostet es, einen Hoodie bedrucken zu lassen?',
    ],
    zuerst: 'dtf',
  },
  't-shirts-bedrucken-besticken': {
    titel: 'T-Shirts bedrucken & besticken lassen – ab 1 Stück',
    h1: 'T-Shirts bedrucken & besticken lassen',
    beschreibung:
      '{anzahl} T-Shirts von {marken3} u. a. mit Logo oder Motiv veredeln: DTF-Transferdruck oder Stickerei, live im Konfigurator, ab 1 Stück.',
    fragen: [
      'Kann ich auch nur ein einzelnes T-Shirt bedrucken oder besticken lassen?',
      'Wo auf dem T-Shirt kann ich mein Motiv platzieren?',
      'Was ist besser für ein T-Shirt: Druck oder Stickerei?',
      'Welche Dateien kann ich für mein Logo hochladen?',
      'Wie lange dauert es, bis meine T-Shirts ankommen?',
      'Welche T-Shirts gibt es und wie schwer sind sie?',
    ],
    zuerst: 'dtf',
  },
  'poloshirts-besticken-bedrucken': {
    titel: 'Poloshirts besticken & bedrucken lassen – ab 1 Stück',
    h1: 'Poloshirts besticken & bedrucken lassen',
    beschreibung:
      '{anzahl} Poloshirts von {marken3} u. a. mit Firmenlogo besticken oder bedrucken: live im Konfigurator gestalten, ab 1 Stück, ohne Mindestmenge.',
    fragen: [
      'Kann ich auch nur ein einzelnes Poloshirt besticken lassen?',
      'Was ist der Unterschied zwischen Poloshirt und Polohemd?',
      'Was ist besser für ein Poloshirt: Stickerei oder Druck?',
      'Wie läuft die Digitalisierung meines Logos für die Stickerei ab?',
      'Welche Dateien kann ich für mein Logo hochladen?',
      'Wie lange dauert es, bis meine Poloshirts ankommen?',
      'Welche Poloshirts gibt es und wie schwer sind sie?',
    ],
    zuerst: 'embroidery',
  },
};

test('Wiederaufnahme (Schalter leer): Kategorieseiten tragen wieder den bisherigen Wortlaut samt Stickerei-Angebot', async () => {
  await mitSchalter(AN, async () => {
    assert.deepEqual(Object.keys(BISHERIG).sort(), [...KATEGORIE_SLUGS].sort());
    for (const seite of KATEGORIE_SEITEN) {
      const alt = BISHERIG[seite.slug]!;
      const texte = seitenTexte(seite, true);
      // Titel, Überschrift, Beschreibung, Fragen: wie vor der Pause-Anpassung, unverändert aus der Konfiguration.
      assert.equal(texte.titel, alt.titel);
      assert.equal(texte.h1, alt.h1);
      assert.equal(texte.beschreibung, alt.beschreibung);
      assert.deepEqual(texte.fragen.map((f) => f.q), alt.fragen);
      assert.deepEqual(texte.fragen, seite.fragen.map((f) => ({ q: f.q, a: f.a })));
      assert.deepEqual(texte.einleitung, seite.einleitung);
      assert.equal(texte.dtf, seite.verfahren.dtf);

      const html = await kategorieSeite(seite.slug);
      const text = sichtbarerText(html);
      const fakten = kategorieFakten(seite.art);
      assert.ok(text.includes(alt.h1), `${seite.slug}: Überschrift`);
      assert.ok(text.includes('DTF-Transferdruck oder Stickerei?'), `${seite.slug}: Überschrift des Verfahrensabschnitts`);
      assert.ok(text.includes('Veredelt wird wahlweise per DTF-Transferdruck oder Stickerei.'), `${seite.slug}: Einleitung`);
      assert.ok(text.includes(seite.verfahren.stickerei), `${seite.slug}: Beschreibung der Stickerei`);
      assert.ok(text.includes(seite.verfahren.hinweis), `${seite.slug}: „zwischen ihnen wechseln“`);
      assert.ok(text.includes('Stickerei gibt es nur auf Anfrage'), `${seite.slug}: Ablauf`);
      for (const q of alt.fragen) assert.ok(text.includes(fuelleVorlage(q, fakten)), `${seite.slug}: Frage fehlt: ${q}`);
      assert.ok(text.includes('Für Stickerei digitalisiert unser Team dein Logo anschließend manuell in Garnfarben'), `${seite.slug}: Dateien-Antwort`);
      assert.ok(text.includes('alle Druck- bzw. Stickdaten vollständig vorliegen'), `${seite.slug}: Dauer-Antwort`);
      assert.ok(text.includes('Stickerei ist langlebiger und hochwertiger in der Haptik'), `${seite.slug}: Verfahren-Antwort`);
      assert.ok(!text.includes(HINWEIS_STICKEREI_PAUSIERT), `${seite.slug}: Pause-Hinweis trotz Wiederaufnahme`);
      assert.ok(!html.includes(KARTE_STICKEREI_PAUSIERT), `${seite.slug}: Kennzeichnung trotz Wiederaufnahme`);
      if (seite.beispiele.some((b) => b.methode === 'embroidery')) {
        assert.ok(/Stickerei, Brustlogo/.test(text) && text.includes('rund 4.000 Stichen'), `${seite.slug}: Stickerei-Preisbeispiele`);
      }
      // Reihenfolge der Karten wie bisher (Poloshirt: Stickerei zuerst).
      const dtfVorn = html.indexOf('>DTF-Transferdruck</h3>') < html.indexOf('>Stickerei</h3>');
      assert.equal(dtfVorn, alt.zuerst === 'dtf', `${seite.slug}: Reihenfolge der Karten`);

      const kopf = await kategorieKopf(seite.slug);
      assert.deepEqual(kopf.title, { absolute: alt.titel });
      assert.equal(kopf.description, fuelleVorlage(alt.beschreibung, fakten));
    }
    // Poloshirt: „gesticktes Logo“ steht in der Einleitung.
    assert.match(sichtbarerText(await kategorieSeite('poloshirts-besticken-bedrucken')), /mit gesticktem Logo auf der Brust/);
  });
});

test('Wiederaufnahme (Schalter leer): Manifest, Sammlungs-Schema, Beschreibung und llms.txt nennen die Stickerei wieder', async () => {
  await mitSchalter(AN, async () => {
    assert.match(manifest().description ?? '', /DTF-Transferdruck und Stickerei/);
    assert.match(String(sammlungSchema(kanonischeBasisUrl(), 5)['description']), /DTF-Transferdruck oder Stickerei, ab 1 Stück/);
    assert.match(String(organisationSchema(kanonischeBasisUrl())['description']), /DTF-Transferdruck und Stickerei/);
    assert.match(shopBeschreibung(['Hoodies'], true), /DTF-Transferdruck oder Stickerei/);
    assert.ok(!llmsText(kanonischeBasisUrl()).includes('Stickerei'));
  });
});
