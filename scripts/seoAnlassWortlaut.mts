/**
 * Schreibt den VOLLSTÄNDIGEN, befüllten Wortlaut der Anlass- und Ratgeberseiten nach docs/seo/anlass-seiten-wortlaut.md.
 *
 * Zweck: Die Textfreigabe durch den Betreiber braucht den Text so, wie er auf der Seite steht – mit eingesetzten Zahlen
 * (Modellanzahlen, Beträge, Zeiten), nicht mit Platzhaltern. Die Preisbeispiele stehen mit den echten Preisen der Preis-Engine.
 *
 * Aufruf:  npx tsx --tsconfig tsconfig.scripts.json scripts/seoAnlassWortlaut.mts
 */
import { writeFileSync } from 'node:fs';
import { ANLASS_SEITEN } from '../src/config/seo/anlassSeiten.ts';
import { DTF_ABLAUF_SCHRITTE } from '../src/config/seo/dtfSeiten.ts';
import { berechneBeispiele } from '../src/lib/seo/kategorieSeite.ts';
import { alsKategorieBeispiele, anlassFakten, fuelleAnlass, AUFLOESUNG_BREITEN_CM, mindestPixel } from '../src/lib/seo/anlassSeite.ts';
import { MIN_DPI, OK_DPI } from '../src/lib/canvas/logoQualitaet.ts';
import { formatiereGeld } from '../src/lib/format.ts';
import { llmsText } from '../src/lib/seo/llmsText.ts';
import { BRANCHEN, FORMULAR_TEXTE as FT, KLEIDUNG, MENGEN, VEREDELUNG, LOGO_GRENZEN } from '../src/config/seo/geschaeftsanfrage.ts';
import { pruefeGeschaeftsanfrage } from '../src/lib/seo/geschaeftsanfrage.ts';
import { druckflaechenTabelle, gewichtsUebersicht, groessenTabelle, markeUndName, type TabellenArt } from '../src/lib/seo/katalogAuswertung.ts';
import { zahl } from '../src/lib/format.ts';

const zeilen: string[] = [];
const z = (t = '') => zeilen.push(t);

z('# Wortlaut der Anlass- und Ratgeberseiten');
z();
z('Zur Textfreigabe. Erzeugt mit `scripts/seoAnlassWortlaut.mts` – so, wie der Text auf der Seite steht (Zahlen eingesetzt, Preise aus der Preis-Engine).');
z('Alle Seiten sind nur DTF-Transferdruck (die Stickerei ist pausiert) und verlinken die bestehenden Kategorie-, Marken- und Anlassseiten.');
z();

for (const seite of ANLASS_SEITEN) {
  const f = anlassFakten(seite);
  const fuelle = (t: string) => fuelleAnlass(t, seite, f);
  const titel = fuelle(seite.titel);
  const beschreibung = fuelle(seite.beschreibung);
  z(`## /${seite.slug}`);
  z();
  z(`- **Titel** (${titel.length} Zeichen): ${titel}`);
  z(`- **Meta-Beschreibung** (${beschreibung.length} Zeichen): ${beschreibung}`);
  z(`- **Überschrift (H1):** ${fuelle(seite.h1)}`);
  z(`- **Kleiner Vorspann über der Überschrift:** ${seite.eyebrow}`);
  z(`- **Linktext zu dieser Seite:** ${seite.kurzname}`);
  z();
  for (const absatz of seite.einleitung) z(fuelle(absatz)), z();
  if (f.kacheln.length > 0) {
    z('**Abschnitt „Passende Modelle“:** ' + f.kacheln.map((p) => `${p.brand} ${p.name}`).join(' · '));
    z();
  }
  for (const a of seite.abschnitte) {
    z(`### ${fuelle(a.ueberschrift)}`);
    z();
    for (const p of a.punkte ?? []) z(`- ${fuelle(p)}`);
    if (a.punkte) z();
    for (const absatz of a.absaetze ?? []) z(fuelle(absatz)), z();
    if (a.tabelle === 'rechner') {
      z('*Interaktiver Auflösungsrechner: zwei Eingabefelder (Bildbreite in Pixeln, Druckbreite in cm), Ergebnis in dpi mit Ampel und dem Text des Konfigurators; Beispielwerte 2000 px / 20 cm.*');
      z();
    }
    if (a.tabelle?.startsWith('groessen:')) {
      const t = groessenTabelle(a.tabelle.slice(9) as TabellenArt);
      z('| Größe | ' + t.modelle.map((m) => markeUndName(m)).join(' | ') + ' |');
      z('|---|' + t.modelle.map(() => '---|').join(''));
      for (const g of t.groessen) z(`| ${g} | ` + t.modelle.map((m) => `${zahl(m.masse[g]!.breiteCm)} × ${zahl(m.masse[g]!.laengeCm)} cm`).join(' | ') + ' |');
      z();
      z('Brustbreite × Länge in Zentimetern, Herstellerangaben. Passform: ' + t.modelle.map((m) => `${markeUndName(m)} – ${m.passform}`).join(' · ') + '.');
      z();
    }
    if (a.tabelle?.startsWith('gewicht:')) {
      const u = gewichtsUebersicht(a.tabelle.slice(8) as TabellenArt);
      z(`${u.gesamt} Modelle mit Gewichtsangabe, von ${u.min} bis ${u.max} g/m².`);
      z();
      z('| Stoffgewicht | Modelle | Beispiele |');
      z('|---|---|---|');
      for (const k of u.klassen.filter((x) => x.anzahl > 0)) z(`| ${k.band.label} | ${k.anzahl} | ${k.beispiele.map((b) => `${markeUndName(b)} (${b.gewicht} g/m²)`).join(', ') || '–'} |`);
      z();
    }
    if (a.tabelle?.startsWith('druck:')) {
      const t = druckflaechenTabelle(a.tabelle.slice(6) as TabellenArt);
      for (const [schluessel, titel] of [['vorne', 'Vorderseite'], ['hinten', 'Rückseite']] as const) {
        z('| ' + titel + ' | ' + t.modelle.map((m) => markeUndName(m)).join(' | ') + ' |');
        z('|---|' + t.modelle.map(() => '---|').join(''));
        for (const g of t.groessen) z(`| ${g} | ` + t.modelle.map((m) => `${zahl(m[schluessel][g]!.breiteCm)} × ${zahl(m[schluessel][g]!.hoeheCm)} cm`).join(' | ') + ' |');
        z();
      }
      z('Breite × Höhe der größtmöglichen Druckfläche in Zentimetern, flach gemessen – so, wie das Motiv auf die Folie gedruckt wird.');
      z();
    }
    if (a.tabelle === 'geschaeftsanfrage') {
      z('*Formular mit festen Auswahlfeldern (Pflichtfelder mit *). Es wird nur DTF-Transferdruck angeboten; die Stickerei kommt nicht vor.*');
      z();
      z(`- **${FT.firma}** * (Platzhalter: „${FT.firmaPlatzhalter}“)`);
      z(`- **${FT.branche}** * – ${BRANCHEN.map((x) => x.label).join(' · ')}`);
      z(`- **${FT.menge}** * – ${MENGEN.map((x) => x.label).join(' · ')}`);
      z(`- **${FT.kleidung}** * (${FT.kleidungHinweis}) – ${KLEIDUNG.map((x) => x.label).join(' · ')}`);
      z(`- **${FT.veredelung}** * (vorausgewählt: DTF) – ${VEREDELUNG.map((x) => x.label).join(' · ')}`);
      z(`- **${FT.name}** *, **${FT.email}** *`);
      z(`- **${FT.telefon}** (${FT.telefonHinweis})`);
      z(`- **${FT.logo}** – ${FT.logoHinweis} (Grenze: höchstens ${LOGO_GRENZEN.maxDateien} Dateien, zusammen ${LOGO_GRENZEN.maxBytesGesamt / 1024 / 1024} MB; Knopf: „${FT.logoWaehlen}“)`);
      z(`- **${FT.anmerkung}** (${FT.anmerkungHinweis})`);
      z(`- **${FT.kennung}** (${FT.kennungHinweis}); mit Kennung aus dem QR-Link vorbelegt, dazu der Hinweis: „${FT.kennungUebernommen}“`);
      z(`- Knopf: **${FT.senden}** (beim Senden: „${FT.sendet}“)`);
      z(`- Hinweis unter dem Knopf: ${FT.datenschutz}`);
      z(`- Erfolg: **${FT.erfolgTitel}** – ${FT.erfolgText} (Knopf: „${FT.erfolgNochmal}“)`);
      z(`- Fehlermeldungen: ${Object.values(FT.fehler).map((m) => `„${m}“`).join(' · ')}`);
      z(`- Sammelhinweis: „${FT.sammelfehler}“ · Sendefehler: „${FT.sendefehler}“`);
      z();
      z('Schaltfläche im Kopf der Seite: **Unverbindlich Angebot anfordern** (springt zum Formular), daneben der Link „Oder selbst im Konfigurator gestalten“.');
      z();
      z('So kommt eine Anfrage bei uns an (Beispiel mit Kennung B2B-0011; E-Mail an info@ergermany.de, Antwort geht an die angegebene Adresse):');
      z();
      const beispiel = pruefeGeschaeftsanfrage({ firma: 'Mustermann Heizung GmbH', branche: 'handwerk', kleidung: ['polo', 'tshirt'], menge: '25-49', veredelung: 'dtf', name: 'Erika Mustermann', email: 'erika@mustermann-heizung.de', telefon: '0173 1234567', anmerkung: 'Bitte bis Ende Januar.', kennung: 'B2B-0011', kennungQuelle: 'qr' });
      if (beispiel.ok) {
        z(`Betreff: ${beispiel.betreff}`);
        z();
        z('```');
        z(beispiel.nachricht);
        z('```');
        z();
      }
    }
    if (a.tabelle === 'aufloesung') {
      z('| Druckbreite | mindestens (' + MIN_DPI + ' dpi) | optimal (' + OK_DPI + ' dpi) |');
      z('|---|---|---|');
      for (const cm of AUFLOESUNG_BREITEN_CM) z(`| ${cm} cm | ${mindestPixel(cm, MIN_DPI)} px | ${mindestPixel(cm, OK_DPI)} px |`);
      z();
    }
  }
  if (seite.beispiele.length > 0) {
    const ergebnis = await berechneBeispiele({ slug: seite.slug, beispiele: alsKategorieBeispiele(seite.beispiele) });
    z('### Preisbeispiele');
    z();
    z('Mit steigender Menge sinkt der Stückpreis – Staffelpreise gelten ab 5 Stück.');
    z();
    for (const e of ergebnis) {
      z(`- ${e.beschriftung}: **${formatiereGeld(e.stueckpreis)}** pro Stück${e.menge > 1 ? `, gesamt ${formatiereGeld(e.gesamt)}` : ' (Einzelstück)'}`);
    }
    z();
    z(`Fußnote: Beispielrechnungen mit ${[...new Set(ergebnis.map((e) => e.produktName))].join(', ')}. Preise pro Stück zzgl. Versand – versandkostenfrei ab ${fuelle('{frei}')}. Kein Steuerausweis (§ 19 UStG). Dein Preis hängt von Motiv, Größe, Position und Menge ab und wird im Konfigurator live berechnet.`);
    z();
  }
  if (!seite.ohneAblauf) {
    z('### So läuft deine Bestellung ab (freigegebener Ablauf der DTF-Seiten)');
    z();
    DTF_ABLAUF_SCHRITTE.forEach((s, i) => z(`${i + 1}. ${fuelle(s)}`));
    z();
  }
  z('### Häufige Fragen');
  z();
  for (const q of seite.fragen) {
    z(`**${fuelle(q.q)}**`);
    z();
    z(fuelle(q.a));
    z();
  }
  z('Weiterführende Links am Seitenende: ' + seite.verwandt.map((v) => `/${v}`).join(', '));
  z();
}

z('## /llms.txt (maschinenlesbare Übersicht für KI-Assistenten)');
z();
z('```');
z(llmsText('https://www.ergermany.de'));
z('```');
z();
z('## Weitere Textänderungen');
z();
z('- Meta-Beschreibung der Startseite und der Produktseiten, solange die Stickerei pausiert ist (die Titel bleiben unverändert).');
z('- Fußzeile: neuer Linkblock mit den Spalten „Sortiment“, „Anlässe & Ratgeber“ und „Marken“.');
z('- Startseite: neue Linkreihe „Anlässe & Ratgeber“ unter „Nach Marke stöbern“.');

writeFileSync('docs/seo/anlass-seiten-wortlaut.md', zeilen.join('\n') + '\n');
console.log('docs/seo/anlass-seiten-wortlaut.md geschrieben,', zeilen.length, 'Zeilen');
