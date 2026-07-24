/**
 * Tests der Kalkulationsbausteine: Folienbelegung, Gemeinkosten, Preisbildung.
 *
 * Der Schwerpunkt liegt auf den Stellen, an denen eine Kalkulation
 * unbemerkt falsch werden kann: der Rückwärtsrechnung vom Verkaufspreis,
 * der Ausschussquote und der Mengenabhängigkeit der Bogenkosten.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  DTF_BOEGEN,
  DTF_LIEFERANTENVERSAND,
  SICHERHEITSABSTAND_MM,
  DtfKostenUnbekannt,
  guenstigsteBelegung,
  motiveJeBogen,
  dtfStaffelVorhanden,
} from '../dtfKosten';
import {
  GEMEINKOSTEN_BLOECKE,
  STUNDENSATZ_REFERENZ,
  aktiveGemeinkosten,
  gemeinkostenHinterlegt,
  gemeinkostenblock,
  ERWARTETE_BESTELLUNGEN_JE_MONAT,
  kostenebene,
} from '../gemeinkosten';
import { kalkuliere, kalkuliereBestellung, produktkosten, rundeAufLadenpreis, STICKKOSTEN_JE_1000_STICHE } from '../selbstkosten';
import { steuersatzFuer, steuersatzVorhanden, SteuersatzUnbekannt, bruttoZuNetto, nettoZuBrutto, steueranteil } from '../steuer';
import { BESCHAFFUNG, LIEFERANTENVERSAND, lieferantenversandAnteil } from '../beschaffung';
import { PREISSTRATEGIE, STRATEGIE_ALTERNATIVEN, gewinnsatzFuerMenge, rundeNachRegel } from '../preisstrategie';

// ── Folienbelegung ───────────────────────────────────────────────────────

test('die Bogenliste ist hinterlegt', () => {
  assert.equal(dtfStaffelVorhanden(), true);
  assert.equal(DTF_BOEGEN.length, 4);
  for (const b of DTF_BOEGEN) {
    assert.ok(b.einkaufspreis > 0, `${b.id} ohne Preis`);
    assert.ok(b.breiteMm > 0 && b.hoeheMm > 0);
  }
});

test('der Sicherheitsabstand wird eingehalten', () => {
  const a4 = DTF_BOEGEN.find((b) => b.id === 'a4')!;
  // A4 ist 210 mm breit. Ein 100-mm-Motiv passt zweimal nebeneinander nur,
  // wenn Rand und Zwischenraum zusammen ≤ 10 mm blieben – bei 8 mm Abstand
  // reicht das nicht.
  const proBogen = motiveJeBogen(a4, 100, 100);
  const ohneAbstand = Math.floor(210 / 100) * Math.floor(297 / 100);
  assert.ok(proBogen < ohneAbstand, 'der Abstand muss die Ausbeute senken');
});

test('das Motiv wird auch quer geprüft', () => {
  const a4 = DTF_BOEGEN.find((b) => b.id === 'a4')!;
  // Ein breites, flaches Motiv passt hochkant schlechter als quer.
  assert.equal(motiveJeBogen(a4, 280, 90), motiveJeBogen(a4, 90, 280));
});

test('ein Einzelstück trägt den ganzen Bogen', () => {
  const eins = guenstigsteBelegung([{ breiteMm: 200, hoeheMm: 250, anzahl: 1 }]);
  assert.equal(eins.boegen.length, 1);
  assert.equal(eins.versand, DTF_LIEFERANTENVERSAND.kosten, 'unter 75 € fällt Lieferantenversand an');
  // Bestätigung des Betreibers: Einzelstück ≈ 14 €.
  assert.ok(eins.gesamt >= 11 && eins.gesamt <= 16, `Einzelstück kostet ${eins.gesamt} €, erwartet ~14 €`);
});

test('mehr Stück senken die Kosten je Motiv deutlich', () => {
  const motiv = { breiteMm: 100, hoeheMm: 100 };
  const eins = guenstigsteBelegung([{ ...motiv, anzahl: 1 }]);
  const fuenfzig = guenstigsteBelegung([{ ...motiv, anzahl: 50 }]);
  assert.ok(
    fuenfzig.jeMotiv < eins.jeMotiv / 2,
    `bei 50 Stück muss das Motiv deutlich günstiger sein (${eins.jeMotiv} → ${fuenfzig.jeMotiv})`
  );
});

test('die Kosten je Motiv sinken monoton mit der Menge', () => {
  // Kein Sprung nach oben: eine größere Bestellung darf je Stück nie teurer
  // werden als eine kleinere.
  let vorher = Infinity;
  for (const anzahl of [1, 2, 5, 10, 15, 25, 50, 100]) {
    const r = guenstigsteBelegung([{ breiteMm: 80, hoeheMm: 80, anzahl }]);
    assert.ok(r.jeMotiv <= vorher + 0.001, `bei ${anzahl} Stück stieg der Stückpreis auf ${r.jeMotiv}`);
    vorher = r.jeMotiv;
  }
});

test('ab 75 € Bogenwert entfällt der Lieferantenversand', () => {
  const viel = guenstigsteBelegung([{ breiteMm: 250, hoeheMm: 350, anzahl: 40 }]);
  assert.ok(viel.bogenkosten >= DTF_LIEFERANTENVERSAND.freiAbWarenwert);
  assert.equal(viel.versand, 0);
});

test('ein zu großes Motiv wird abgewiesen, nicht geschätzt', () => {
  assert.throws(
    () => guenstigsteBelegung([{ breiteMm: 900, hoeheMm: 900, anzahl: 1 }]),
    (fehler: Error) => {
      assert.ok(fehler instanceof DtfKostenUnbekannt);
      assert.match(fehler.message, /passt auf keinen Bogen/i);
      return true;
    }
  );
});

test('unbrauchbare Maße und leere Aufträge werden abgewiesen', () => {
  assert.throws(() => guenstigsteBelegung([]), DtfKostenUnbekannt);
  assert.throws(() => guenstigsteBelegung([{ breiteMm: 0, hoeheMm: 10, anzahl: 1 }]), DtfKostenUnbekannt);
  assert.throws(() => guenstigsteBelegung([{ breiteMm: Number.NaN, hoeheMm: 10, anzahl: 1 }]), DtfKostenUnbekannt);
});

test('die Ausnutzung liegt zwischen 0 und 1', () => {
  const r = guenstigsteBelegung([{ breiteMm: 100, hoeheMm: 100, anzahl: 12 }]);
  assert.ok(r.ausnutzung > 0 && r.ausnutzung <= 1, `Ausnutzung ${r.ausnutzung} außerhalb des Bereichs`);
});

test('der Sicherheitsabstand ist der vereinbarte', () => {
  assert.equal(SICHERHEITSABSTAND_MM, 8);
});

// ── Gemeinkosten ─────────────────────────────────────────────────────────

test('die vom Betreiber genannten Positionen sind vollständig vorgesehen', () => {
  const erwartet = [
    'verpackung',
    'versandkosten',
    'zahlungsgebuehr',
    'zahlungsgebuehr_fix',
    'retourenquote',
    'ausschuss_stick',
    'ausschuss_dtf',
    'arbeitszeit',
    'gewinn',
  ];
  for (const id of erwartet) {
    assert.ok(gemeinkostenblock(id), `Kostenblock „${id}" fehlt`);
  }
});

test('die bestätigten Werte stehen wie genannt', () => {
  assert.equal(gemeinkostenblock('verpackung')!.wert, 0.5);
  assert.equal(gemeinkostenblock('versandkosten')!.wert, 5.5);
  assert.equal(gemeinkostenblock('ausschuss_stick')!.wert, 10);
  assert.equal(gemeinkostenblock('ausschuss_dtf')!.wert, 2);
  assert.equal(STUNDENSATZ_REFERENZ, 30);
});

test('Retouren und Arbeitszeit sind bewusst ausgeschaltet', () => {
  // Beide sind keine fehlenden Werte, sondern Entscheidungen. Wer sie
  // aktiviert, muss das bewusst tun.
  for (const id of ['retourenquote', 'arbeitszeit']) {
    const block = gemeinkostenblock(id)!;
    assert.equal(block.aktiv, false, `${id} ist aktiv`);
    assert.match(block.beschreibung, /BEWUSST AUSGESCHALTET/, `${id} erklärt die Abschaltung nicht`);
  }
});

test('Gemeinkosten sind jetzt hinterlegt', () => {
  assert.equal(gemeinkostenHinterlegt(), true);
  assert.ok(aktiveGemeinkosten().length >= 6);
});

test('jeder Block erklärt, woher sein Wert stammt', () => {
  for (const block of GEMEINKOSTEN_BLOECKE) {
    assert.ok(block.beschreibung.length > 40, `${block.id}: Beschreibung zu knapp`);
    assert.ok(block.bezeichnung.length > 0);
  }
});

test('aktive Blöcke mit Wert nennen ihre Herkunft', () => {
  // Ein aktiver Wert ohne Herkunftsangabe ist ein geratener Wert.
  for (const block of aktiveGemeinkosten()) {
    assert.match(
      block.beschreibung,
      /Angabe Betreiber|MARKTÜBLICH|Festlegung des Betreibers|STELLSCHRAUBE/,
      `${block.id} nennt keine Herkunft`
    );
  }
});

test('die Kennungen sind eindeutig', () => {
  const ids = GEMEINKOSTEN_BLOECKE.map((b) => b.id);
  assert.equal(new Set(ids).size, ids.length, 'doppelte Kennung');
});

test('die Umlage-Bezugsgröße fehlt weiterhin', () => {
  assert.equal(ERWARTETE_BESTELLUNGEN_JE_MONAT, 0);
});

// ── Rundung ──────────────────────────────────────────────────────────────

test('gerundet wird auf x,90 und nie nach unten', () => {
  assert.equal(rundeAufLadenpreis(19.73), 19.9);
  assert.equal(rundeAufLadenpreis(19.9), 19.9, 'ein exakter Treffer bleibt');
  assert.equal(rundeAufLadenpreis(19.91), 20.9, 'knapp darüber steigt auf die nächste Stufe');
  assert.equal(rundeAufLadenpreis(24.5), 24.9);
  assert.equal(rundeAufLadenpreis(0), 0);
});

test('die Rundung senkt den Preis nie unter den Rohwert', () => {
  // Das ist der Punkt: Runden darf die Marge nicht auffressen.
  for (let roh = 5; roh < 60; roh += 0.07) {
    assert.ok(rundeAufLadenpreis(roh) >= roh - 0.001, `${roh} wurde auf ${rundeAufLadenpreis(roh)} gesenkt`);
  }
});

// ── Kalkulation ──────────────────────────────────────────────────────────

const DTF_AUFTRAG = {
  einkaufspreis: 3.24,
  menge: 15,
  veredelung: 'dtf' as const,
  dtfMotive: [{ breiteMm: 100, hoeheMm: 100 }],
};

test('eine vollständige Kalkulation liefert alle Bestandteile', () => {
  const k = kalkuliere(DTF_AUFTRAG);
  assert.ok(k.textil > 0);
  assert.ok(k.veredelung > 0);
  assert.ok(k.ausschuss > 0, 'DTF-Ausschuss muss anfallen');
  assert.ok(k.zahlung > 0);
  assert.ok(k.verkaufspreis > 0);
  assert.ok(k.selbstkosten > k.textil, 'Selbstkosten müssen über den reinen Textilkosten liegen');
});

test('der Verkaufspreis deckt die Selbstkosten', () => {
  // Der wichtigste Test überhaupt. Über viele Mengen und Einkaufspreise.
  for (const menge of [1, 3, 15, 50, 200]) {
    for (const einkaufspreis of [2.84, 7.4, 22.04]) {
      const k = kalkuliere({ ...DTF_AUFTRAG, menge, einkaufspreis });
      assert.ok(
        k.verkaufspreis * menge >= k.selbstkosten,
        `${menge} × ${einkaufspreis} €: VK ${k.verkaufspreis} deckt Kosten ${k.selbstkostenJeStueck} nicht`
      );
    }
  }
});

test('die Marge ist ein Anteil des Verkaufspreises, kein Aufschlag auf die Kosten', () => {
  // 25 % Gewinn + 2,5 % Zahlung: Der Rohpreis muss Kosten/0,725 sein, nicht
  // Kosten × 1,25. Bei einer großen Menge verschwinden die Fixanteile fast
  // und die Marge nähert sich dem Zielwert.
  const k = kalkuliere({ ...DTF_AUFTRAG, menge: 500 });
  assert.ok(k.margeProzent >= 20, `Marge ${k.margeProzent} % liegt zu weit unter dem Ziel von 25 %`);
});

test('Einzelstücke sind je Stück deutlich teurer als Firmenmengen', () => {
  const eins = kalkuliere({ ...DTF_AUFTRAG, menge: 1 });
  const fuenfzehn = kalkuliere({ ...DTF_AUFTRAG, menge: 15 });
  assert.ok(
    eins.verkaufspreis > fuenfzehn.verkaufspreis,
    `Einzelstück ${eins.verkaufspreis} muss über Mengenpreis ${fuenfzehn.verkaufspreis} liegen`
  );
});

test('Stickerei trägt die höhere Ausschussquote', () => {
  const stick = kalkuliere({ einkaufspreis: 10, menge: 20, veredelung: 'stick', stiche: 12000 });
  const dtf = kalkuliere({ einkaufspreis: 10, menge: 20, veredelung: 'dtf', dtfMotive: [{ breiteMm: 80, hoeheMm: 80 }] });
  const stickAnteil = stick.ausschuss / (stick.textil + stick.veredelung);
  const dtfAnteil = dtf.ausschuss / (dtf.textil + dtf.veredelung);
  assert.ok(stickAnteil > dtfAnteil * 3, 'die Stick-Ausschussquote muss deutlich höher wirken');
});

test('der unbestätigte Stichsatz wird im Ergebnis ausgewiesen', () => {
  const k = kalkuliere({ einkaufspreis: 10, menge: 10, veredelung: 'stick', stiche: 12000 });
  assert.ok(
    k.hinweise.some((h) => h.includes('nicht bestätigt')),
    'die Unsicherheit des Stichsatzes muss im Ergebnis stehen'
  );
  assert.equal(STICKKOSTEN_JE_1000_STICHE, 0.1);
});

test('fehlende Grundlagen erscheinen als Hinweis statt als Fehler', () => {
  const ohneMotiv = kalkuliere({ einkaufspreis: 5, menge: 10, veredelung: 'dtf' });
  assert.equal(ohneMotiv.veredelung, 0);
  assert.ok(ohneMotiv.hinweise.some((h) => h.includes('Keine DTF-Motive')));

  const ohneEk = kalkuliere({ ...DTF_AUFTRAG, einkaufspreis: 0 });
  assert.ok(ohneEk.hinweise.some((h) => h.includes('Kein Einkaufspreis')));
});

test('eine Menge unter 1 wird auf 1 gehoben statt durch null zu teilen', () => {
  const k = kalkuliere({ ...DTF_AUFTRAG, menge: 0 });
  assert.ok(Number.isFinite(k.verkaufspreis) && k.verkaufspreis > 0);
});

// ── Umsatzsteuer ─────────────────────────────────────────────────────────

test('der Steuersatz ist der gesetzliche Regelsatz', () => {
  assert.equal(steuersatzFuer('DE').satz, 19);
  assert.equal(steuersatzFuer().satz, 19, 'ohne Land gilt das Standardland');
});

test('netto und brutto rechnen sich verlustfrei ineinander um', () => {
  for (const netto of [1, 8.4, 20.08, 33.53, 199.99]) {
    assert.ok(Math.abs(bruttoZuNetto(nettoZuBrutto(netto)) - netto) < 0.01, `${netto} überlebt die Umrechnung nicht`);
  }
});

test('der Steueranteil ergänzt den Nettobetrag zum Bruttobetrag', () => {
  const brutto = 23.9;
  assert.ok(Math.abs(bruttoZuNetto(brutto) + steueranteil(brutto) - brutto) < 0.01);
});

test('gerundet wird der BRUTTOpreis, nicht der Nettopreis', () => {
  // Der entscheidende Test. Der psychologische Preis muss dort landen, wo
  // die Kundschaft ihn liest – am Bruttopreis. Ein glatter Nettopreis von
  // 19,90 € ergäbe brutto 23,68 € und damit eine krumme Auszeichnung.
  const k = kalkuliere(DTF_AUFTRAG);
  assert.match(k.verkaufspreis.toFixed(2), /\.90$/, `Bruttopreis ${k.verkaufspreis} endet nicht auf ,90`);
  assert.ok(Math.abs(k.verkaufspreisNetto * 1.19 - k.verkaufspreis) < 0.02, 'Netto und Brutto passen nicht zusammen');
});

test('die Marge rechnet auf netto, nicht auf brutto', () => {
  // Die Umsatzsteuer ist durchlaufender Posten. Würde sie in die Marge
  // eingehen, sähe jede Kalkulation um 19 Prozentpunkte zu gut aus.
  const k = kalkuliere({ ...DTF_AUFTRAG, menge: 500 });
  const margeBrutto = ((k.verkaufspreis * 500 - k.selbstkosten) / (k.verkaufspreis * 500)) * 100;
  assert.ok(k.margeProzent < margeBrutto, 'die Nettomarge muss unter der Bruttomarge liegen');
  assert.ok(k.margeProzent >= 20 && k.margeProzent <= 40, `Nettomarge ${k.margeProzent} % unplausibel`);
});

test('der Nettopreis deckt die Selbstkosten – nicht erst der Bruttopreis', () => {
  // Wenn die Kosten nur brutto gedeckt wären, finanzierte die Umsatzsteuer
  // den Betrieb – und beim Abführen fehlte das Geld.
  for (const menge of [1, 15, 50]) {
    const k = kalkuliere({ ...DTF_AUFTRAG, menge });
    assert.ok(
      k.verkaufspreisNetto * menge >= k.selbstkosten,
      `bei ${menge} Stück deckt der Nettopreis die Kosten nicht`
    );
  }
});

test('der Versanderlös wird netto gegengerechnet', () => {
  // 6,90 € ist ein Kundenpreis und damit brutto. Würde er voll gegen die
  // Nettokosten gerechnet, schrieben wir uns 1,10 € gut, die dem Finanzamt
  // gehören.
  const klein = kalkuliere({ einkaufspreis: 3.24, menge: 1, veredelung: 'dtf', dtfMotive: [{ breiteMm: 100, hoeheMm: 100 }] });
  // DHL 5,50 + Karton 0,50 + Lieferantenversand 4,90, abzüglich des netto
  // gerechneten Versanderlöses von 6,90 brutto.
  const erwarteteLogistik = 5.5 + 0.5 + 4.9 - 6.9 / 1.19;
  assert.ok(Math.abs(klein.logistik - erwarteteLogistik) < 0.02, `Logistik ${klein.logistik}, erwartet ${erwarteteLogistik.toFixed(2)}`);
});

// ── Trennung produktbezogen / bestellbezogen ─────────────────────────────

test('die Kostenebene folgt eindeutig aus der Kostenart', () => {
  assert.equal(kostenebene('betrag_je_stueck'), 'produkt');
  assert.equal(kostenebene('risiko_prozent'), 'produkt');
  assert.equal(kostenebene('betrag_je_bestellung'), 'bestellung');
  assert.equal(kostenebene('prozent_vom_verkaufspreis'), 'bestellung');
  assert.equal(kostenebene('fix_monatlich'), 'bestellung');
});

test('bestellbezogene Blöcke tragen einen Verteilungsschlüssel', () => {
  for (const block of aktiveGemeinkosten()) {
    if (kostenebene(block.art) === 'bestellung' && block.art === 'betrag_je_bestellung') {
      assert.ok(block.verteilung, `${block.id} verteilt sich unbestimmt`);
    }
  }
});

test('Versand verteilt nach Menge, Zahlungsgebühr nach Wert', () => {
  // Der Schlüssel ist eine fachliche Aussage, kein Detail.
  assert.equal(gemeinkostenblock('versandkosten')!.verteilung, 'nach_menge');
  assert.equal(gemeinkostenblock('verpackung')!.verteilung, 'nach_menge');
  assert.equal(gemeinkostenblock('zahlungsgebuehr_fix')!.verteilung, 'nach_wert');
});

test('produktbezogene Kosten kennen keinen Versand und keine Verpackung', () => {
  // Der Kern der Trennung: Was ein Produkt kostet, hängt nicht daran, wie
  // die Bestellung verschickt wird.
  const eins = produktkosten({ ...DTF_AUFTRAG, menge: 1 });
  const versandUndVerpackung = 5.5 + 0.5;
  assert.ok(eins.kosten < versandUndVerpackung + 20, 'Produktkosten enthalten offenbar Logistik');

  // Zwei Positionen einzeln gerechnet ergeben genau die Summe – kein
  // Bestellanteil verfälscht die Produktkosten.
  const a = produktkosten({ ...DTF_AUFTRAG, menge: 10 });
  const b = produktkosten({ ...DTF_AUFTRAG, menge: 20 });
  const zusammen = produktkosten({ ...DTF_AUFTRAG, menge: 30 });
  assert.ok(a.kosten + b.kosten >= zusammen.kosten, 'getrennte Fertigung kann nicht günstiger sein als gemeinsame');
});

test('eine Sammelbestellung ist günstiger als zwei Einzelbestellungen', () => {
  // Der wirtschaftliche Kern der Trennung: Wer zwei Produkte zusammen
  // bestellt, verursacht einen Versand statt zwei.
  const a = { ...DTF_AUFTRAG, menge: 5 };
  const b = {
    einkaufspreis: 14.68,
    menge: 5,
    veredelung: 'dtf' as const,
    dtfMotive: [{ breiteMm: 100, hoeheMm: 100 }],
  };

  const zusammen = kalkuliereBestellung([a, b]);
  const getrennt = kalkuliereBestellung([a]).selbstkosten + kalkuliereBestellung([b]).selbstkosten;

  assert.ok(
    zusammen.selbstkosten < getrennt,
    `Sammelbestellung (${zusammen.selbstkosten}) muss unter zwei Einzelbestellungen (${getrennt.toFixed(2)}) liegen`
  );

  // Die Produktkosten selbst bleiben unberührt – sie hängen nicht daran,
  // wie die Positionen zu Bestellungen zusammengefasst werden.
  assert.ok(Math.abs(zusammen.produktkosten - (produktkosten(a).kosten + produktkosten(b).kosten)) < 0.02);
});

test('die Summe der Positionskosten ergibt die Bestellkosten', () => {
  const b = kalkuliereBestellung([
    { ...DTF_AUFTRAG, menge: 5 },
    { einkaufspreis: 22.04, menge: 3, veredelung: 'dtf', dtfMotive: [{ breiteMm: 200, hoeheMm: 250 }] },
  ]);
  const summeSelbstkosten = b.positionen.reduce((s, p) => s + p.selbstkosten, 0);
  assert.ok(Math.abs(summeSelbstkosten - b.selbstkosten) < 0.05, 'die Positionen summieren sich nicht zur Bestellung');

  const summeProdukt = b.positionen.reduce((s, p) => s + p.produktkosten, 0);
  assert.ok(Math.abs(summeProdukt - b.produktkosten) < 0.02);
});

test('jede Position trägt nur ihren Anteil an den Bestellkosten', () => {
  const b = kalkuliereBestellung([
    { ...DTF_AUFTRAG, menge: 1 },
    { ...DTF_AUFTRAG, menge: 99 },
  ]);
  const [klein, gross] = b.positionen;
  assert.ok(klein!.anteilBestellkosten < gross!.anteilBestellkosten, 'die kleine Position trägt zu viel');
});

test('eine Bestellung deckt ihre Kosten', () => {
  for (const positionen of [
    [{ ...DTF_AUFTRAG, menge: 1 }],
    [{ ...DTF_AUFTRAG, menge: 15 }],
    [{ ...DTF_AUFTRAG, menge: 5 }, { einkaufspreis: 22.04, menge: 2, veredelung: 'dtf' as const, dtfMotive: [{ breiteMm: 150, hoeheMm: 150 }] }],
  ]) {
    const b = kalkuliereBestellung(positionen);
    assert.ok(b.erloesNetto >= b.selbstkosten, `Nettoerlös ${b.erloesNetto} deckt Kosten ${b.selbstkosten} nicht`);
  }
});

test('eine leere Bestellung wird sauber beantwortet, nicht mit einem Fehler', () => {
  const leer = kalkuliereBestellung([]);
  assert.equal(leer.selbstkosten, 0);
  assert.equal(leer.positionen.length, 0);
  assert.ok(leer.hinweise.length > 0);
});

// ── Beschaffung / Lieferantenversand ─────────────────────────────────────

test('in der Anfangsphase wird je Kundenbestellung beschafft', () => {
  assert.equal(BESCHAFFUNG.modell, 'je_bestellung');
  assert.equal(BESCHAFFUNG.auftraegeJeLieferantenbestellung, 1);
});

test('unter der Freigrenze faellt der Lieferantenversand voll an', () => {
  assert.equal(lieferantenversandAnteil(50), LIEFERANTENVERSAND.kosten);
});

test('ab 150 EUR Warenwert entfaellt der Lieferantenversand', () => {
  assert.equal(lieferantenversandAnteil(LIEFERANTENVERSAND.freiAbWarenwert), 0);
  assert.equal(lieferantenversandAnteil(500), 0);
  assert.equal(lieferantenversandAnteil(149.99), LIEFERANTENVERSAND.kosten, 'einen Cent darunter noch nicht');
});

test('Lagerhaltung kennt keinen Lieferantenversand je Bestellung', () => {
  // Der spaetere Zielzustand: Die Ware liegt im Regal, der Versand steckt
  // bereits im Einkaufspreis der Lagerbestellung.
  const lager = { modell: 'lager' as const, auftraegeJeLieferantenbestellung: 1 };
  assert.equal(lieferantenversandAnteil(10, lager), 0);
  assert.equal(lieferantenversandAnteil(500, lager), 0);
});

test('eine Sammelbestellung teilt den Versand und erreicht die Freigrenze eher', () => {
  const einzeln = { modell: 'je_bestellung' as const, auftraegeJeLieferantenbestellung: 1 };
  const sammel = { modell: 'sammelbestellung' as const, auftraegeJeLieferantenbestellung: 5 };

  // 40 EUR je Auftrag: einzeln unter der Grenze, zu fuenft darueber.
  assert.equal(lieferantenversandAnteil(40, einzeln), LIEFERANTENVERSAND.kosten);
  assert.equal(lieferantenversandAnteil(40, sammel), 0, '5 x 40 = 200 EUR liegt ueber 150');

  // 20 EUR je Auftrag: auch zu fuenft unter der Grenze, aber geteilt.
  const geteilt = lieferantenversandAnteil(20, sammel);
  assert.ok(geteilt > 0 && geteilt < LIEFERANTENVERSAND.kosten, `geteilter Anteil ${geteilt} unplausibel`);
  assert.ok(Math.abs(geteilt - LIEFERANTENVERSAND.kosten / 5) < 0.01);
});

test('der Lieferantenversand ist ein Kostenblock, kein fester Produktzuschlag', () => {
  // Er darf nirgends im Produktpreis eingebrannt sein: dieselbe Position,
  // einmal einzeln und einmal in einer grossen Bestellung, hat identische
  // PRODUKTkosten.
  const position = { ...DTF_AUFTRAG, menge: 5 };
  const allein = kalkuliereBestellung([position]);
  const inGross = kalkuliereBestellung([position, { einkaufspreis: 22.04, menge: 20, veredelung: 'dtf', dtfMotive: [{ breiteMm: 100, hoeheMm: 100 }] }]);

  assert.ok(
    Math.abs(allein.positionen[0]!.produktkosten - inGross.positionen[0]!.produktkosten) < 0.01,
    'die Produktkosten der Position haengen an der Bestellung – der Versand ist eingebrannt'
  );
  // In der grossen Bestellung wird die Freigrenze ueberschritten, der
  // Lieferantenversand entfaellt und der Anteil der Position sinkt.
  assert.ok(inGross.positionen[0]!.anteilBestellkosten < allein.positionen[0]!.anteilBestellkosten);
});

test('der eingerechnete Lieferantenversand wird im Ergebnis ausgewiesen', () => {
  const k = kalkuliere({ ...DTF_AUFTRAG, menge: 1 });
  assert.ok(
    k.hinweise.some((h) => h.includes('Lieferantenversand')),
    'die Kalkulation soll offenlegen, dass der Lieferantenversand enthalten ist'
  );
});

// ── Preisstrategie: Istkosten gegen strategischen Preis ──────────────────

test('die aktive Strategie ist neutral und aendert keinen Preis', () => {
  // Wichtig: Die Strategiedatei stellt die Wahl bereit, trifft sie aber nicht.
  assert.equal(PREISSTRATEGIE.preisbasis.modell, BESCHAFFUNG.modell);
  assert.equal(PREISSTRATEGIE.margen.length, 1, 'noch keine mengenabhaengige Staffelung');
});

test('der Deckungsbeitrag rechnet gegen die ISTkosten, nicht gegen die Preisbasis', () => {
  // Der zentrale Test dieser Trennung. Eine Strategie, die guenstigere
  // Beschaffung unterstellt, darf sich nicht selbst schoenrechnen.
  const guenstiger = STRATEGIE_ALTERNATIVEN.find((s) => s.preisbasis.modell === 'lager')!;
  const auftrag = [{ ...DTF_AUFTRAG, menge: 1 }];

  const neutral = kalkuliereBestellung(auftrag, PREISSTRATEGIE);
  const strategisch = kalkuliereBestellung(auftrag, guenstiger);

  // Die Istkosten sind in beiden Faellen (fast) gleich - es wird ja real
  // gleich beschafft. Nur der PREIS unterscheidet sich.
  assert.ok(
    Math.abs(neutral.selbstkosten - strategisch.selbstkosten) < 0.5,
    `Istkosten duerfen nicht von der Strategie abhaengen (${neutral.selbstkosten} vs ${strategisch.selbstkosten})`
  );
  assert.ok(
    strategisch.positionen[0]!.verkaufspreis < neutral.positionen[0]!.verkaufspreis,
    'die guenstigere Preisbasis muss zu einem niedrigeren Preis fuehren'
  );
  assert.ok(
    strategisch.deckungsbeitrag < neutral.deckungsbeitrag,
    'der niedrigere Preis muss sich im Deckungsbeitrag niederschlagen'
  );
});

test('die Preisbasis wird getrennt von den Istkosten ausgewiesen', () => {
  const sammel = STRATEGIE_ALTERNATIVEN.find((s) => s.preisbasis.modell === 'sammelbestellung')!;
  const k = kalkuliereBestellung([{ ...DTF_AUFTRAG, menge: 1 }], sammel);
  assert.ok(k.preisbasisKosten < k.selbstkosten, 'die Preisbasis muss unter den Istkosten liegen');
  assert.ok(k.hinweise.some((h) => h.includes('tragen wir bewusst selbst')));
});

test('eine mengenabhaengige Marge wirkt nur unterhalb der Schwelle', () => {
  const gestaffelt = STRATEGIE_ALTERNATIVEN.find((s) => s.margen.length > 1)!;
  assert.equal(gewinnsatzFuerMenge(1, gestaffelt), 10, 'Einzelstueck mit kleiner Marge');
  assert.equal(gewinnsatzFuerMenge(14, gestaffelt), 10);
  assert.equal(gewinnsatzFuerMenge(15, gestaffelt), 25, 'ab Firmenmenge voller Satz');
  assert.equal(gewinnsatzFuerMenge(500, gestaffelt), 25);
});

test('jede Alternative traegt ihre Kosten oder weist es aus', () => {
  // Keine Strategie darf still ein Verlustgeschaeft erzeugen.
  for (const strategie of [PREISSTRATEGIE, ...STRATEGIE_ALTERNATIVEN]) {
    for (const menge of [1, 5, 15, 50]) {
      const k = kalkuliereBestellung(
        [{ einkaufspreis: 3.24, menge, veredelung: 'dtf', dtfMotive: [{ breiteMm: 200, hoeheMm: 250 }] }],
        strategie
      );
      if (!k.decktIstkosten) {
        assert.ok(
          k.hinweise.some((h) => h.includes('traegt sich nicht') || h.includes('trägt sich nicht')),
          `${strategie.name} bei ${menge} St. deckt nicht, sagt es aber nicht`
        );
      }
      assert.equal(k.decktIstkosten, k.deckungsbeitrag >= -0.005);
    }
  }
});

test('jede Alternative erklaert ihr Risiko', () => {
  for (const strategie of STRATEGIE_ALTERNATIVEN) {
    assert.ok(strategie.beschreibung.length > 80, `${strategie.name}: Beschreibung zu knapp`);
    for (const stufe of strategie.margen) {
      assert.ok(stufe.begruendung.length > 20, `${strategie.name}: Margenstufe ohne Begruendung`);
    }
  }
});

// ── Rundungsregel als Konfiguration ──────────────────────────────────────

test('die Rundungsregel ist konfigurierbar und nicht im Code verdrahtet', () => {
  assert.equal(rundeNachRegel(19.73, { art: 'endet_auf', nachkomma: 0.9 }), 19.9);
  assert.equal(rundeNachRegel(19.73, { art: 'endet_auf', nachkomma: 0.99 }), 19.99);
  assert.equal(rundeNachRegel(19.73, { art: 'endet_auf', nachkomma: 0.5 }), 20.5, 'ueber dem Kandidaten steigt es');
  assert.equal(rundeNachRegel(19.73, { art: 'vielfaches', schritt: 0.5 }), 20);
  assert.equal(rundeNachRegel(19.73, { art: 'vielfaches', schritt: 5 }), 20);
  assert.equal(rundeNachRegel(19.73, { art: 'keine' }), 19.73);
});

test('jede Rundungsregel rundet nach oben, nie nach unten', () => {
  const regeln = [
    { art: 'endet_auf' as const, nachkomma: 0.9 },
    { art: 'endet_auf' as const, nachkomma: 0.99 },
    { art: 'vielfaches' as const, schritt: 0.5 },
    { art: 'keine' as const },
  ];
  for (const regel of regeln) {
    for (let roh = 5; roh < 60; roh += 0.13) {
      assert.ok(
        rundeNachRegel(roh, regel) >= roh - 0.011,
        `${regel.art} senkte ${roh.toFixed(2)} auf ${rundeNachRegel(roh, regel)}`
      );
    }
  }
});

test('eine geaenderte Rundungsregel wirkt auf den Preis', () => {
  // Der Beleg, dass die Regel wirklich durchgereicht wird.
  const auftrag = [{ ...DTF_AUFTRAG, menge: 15 }];
  const neunzig = kalkuliereBestellung(auftrag, PREISSTRATEGIE);
  const glatt = kalkuliereBestellung(auftrag, { ...PREISSTRATEGIE, rundung: { art: 'vielfaches', schritt: 1 } });

  assert.match(neunzig.positionen[0]!.verkaufspreis.toFixed(2), /\.90$/);
  assert.match(glatt.positionen[0]!.verkaufspreis.toFixed(2), /\.00$/);
});
