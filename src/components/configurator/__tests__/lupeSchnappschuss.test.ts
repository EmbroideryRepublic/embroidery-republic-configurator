/**
 * Zwischenspeicher der Lupe (lupeSchnappschuss.ts): Bedienelemente der Vorschau kommen NICHT ins Bild, werden aber
 * immer wiederhergestellt; ein noch ladendes Bild führt zu „später erneut“, nicht zu einem Bild mit Lücke.
 *
 * Konva selbst läuft hier nicht (braucht einen Browser); geprüft wird mit einer kleinen Nachbildung der Stage, die
 * genau die Schnittstelle bietet, die lupeSchnappschuss.ts benutzt.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type Konva from 'konva';
import { WARNRAHMEN_FARBE, erzeugeSchnappschuss } from '../lupeSchnappschuss';

class FalscherKnoten {
  sichtbar = true;
  strichAn = true;
  constructor(
    public klasse: string,
    public namen: string[] = [],
    public strich: string | undefined = undefined,
    public bild: unknown = undefined
  ) {}
  hasName(name: string) {
    return this.namen.includes(name);
  }
  getClassName() {
    return this.klasse;
  }
  visible(wert?: boolean): boolean | this {
    if (wert === undefined) return this.sichtbar;
    this.sichtbar = wert;
    return this;
  }
  stroke() {
    return this.strich;
  }
  strokeEnabled(wert?: boolean): boolean | this {
    if (wert === undefined) return this.strichAn;
    this.strichAn = wert;
    return this;
  }
  image() {
    return this.bild;
  }
}

interface Aufnahme {
  pixelRatio: number;
  /** Zustand der Knoten im Moment der Aufnahme. */
  sichtbar: Record<string, boolean>;
  strich: Record<string, boolean>;
}

function falscheStage(knoten: Record<string, FalscherKnoten>, optionen: { wirf?: number } = {}) {
  const aufnahmen: Aufnahme[] = [];
  let versuche = 0;
  const stage = {
    find(auswahl: string | ((k: FalscherKnoten) => boolean)) {
      const alle = Object.values(knoten);
      if (typeof auswahl === 'string') return alle.filter((k) => k.getClassName() === auswahl);
      return alle.filter(auswahl);
    },
    toCanvas({ pixelRatio }: { pixelRatio: number }) {
      versuche += 1;
      aufnahmen.push({
        pixelRatio,
        sichtbar: Object.fromEntries(Object.entries(knoten).map(([name, k]) => [name, k.sichtbar])),
        strich: Object.fromEntries(Object.entries(knoten).map(([name, k]) => [name, k.strichAn])),
      });
      if (optionen.wirf && versuche <= optionen.wirf) throw new Error('Canvas zu groß');
      return { width: 2100, height: 2520 } as unknown as HTMLCanvasElement;
    },
  };
  return { stage: stage as unknown as Konva.Stage, aufnahmen };
}

function szene() {
  return {
    foto: new FalscherKnoten('Image', [], undefined, { complete: true, naturalWidth: 1200 }),
    logo: new FalscherKnoten('Image', ['motiv'], WARNRAHMEN_FARBE, { width: 100 }), // Canvas-Quelle (Gewebetextur)
    text: new FalscherKnoten('Text', ['motiv'], '#ffffff'), // Umrandung des Textes – gehört zum Motiv
    druckflaeche: new FalscherKnoten('Rect', ['print-area']),
    beschriftung: new FalscherKnoten('Text', ['steuerung']),
    sperrzone: new FalscherKnoten('Group', ['steuerung']),
    hilfslinie: new FalscherKnoten('Rect', ['steuerung']),
    griffe: new FalscherKnoten('Transformer'),
  };
}

test('Aufnahme enthält nur Foto und Motive: Druckfläche, Beschriftungen, Sperrzonen, Hilfslinien und Griffe sind ausgeblendet', () => {
  const knoten = szene();
  const { stage, aufnahmen } = falscheStage(knoten);
  const ergebnis = erzeugeSchnappschuss(stage, { pixelRatio: 3 });
  assert.equal(ergebnis.status, 'bereit');
  assert.equal(aufnahmen.length, 1);
  assert.equal(aufnahmen[0]!.pixelRatio, 3);
  const bild = aufnahmen[0]!.sichtbar;
  for (const verborgen of ['druckflaeche', 'beschriftung', 'sperrzone', 'hilfslinie', 'griffe']) {
    assert.equal(bild[verborgen], false, `${verborgen} darf nicht im Zwischenspeicher sein`);
  }
  for (const sichtbar of ['foto', 'logo', 'text']) {
    assert.equal(bild[sichtbar], true, `${sichtbar} muss im Zwischenspeicher sein`);
  }
});

test('Nach der Aufnahme sind alle Bedienelemente wieder sichtbar (die Vorschau bleibt unverändert)', () => {
  const knoten = szene();
  const { stage } = falscheStage(knoten);
  erzeugeSchnappschuss(stage, { pixelRatio: 3 });
  for (const [name, k] of Object.entries(knoten)) {
    assert.equal(k.sichtbar, true, `${name} muss wieder sichtbar sein`);
    assert.equal(k.strichAn, true, `${name}: Strich muss wieder an sein`);
  }
});

test('Ein bereits ausgeblendetes Element (z. B. ausgeblendete Ebene) wird nicht fälschlich eingeblendet', () => {
  const knoten = szene();
  knoten.griffe.sichtbar = false;
  const { stage } = falscheStage(knoten);
  erzeugeSchnappschuss(stage, { pixelRatio: 3 });
  assert.equal(knoten.griffe.sichtbar, false);
});

test('Roter Warnrahmen (Motiv außerhalb der Fläche) kommt nicht ins Bild; eine echte Textumrandung bleibt', () => {
  const knoten = szene();
  const { stage, aufnahmen } = falscheStage(knoten);
  erzeugeSchnappschuss(stage, { pixelRatio: 3 });
  assert.equal(aufnahmen[0]!.strich.logo, false, 'Warnrahmen aus');
  assert.equal(aufnahmen[0]!.strich.text, true, 'Textumrandung bleibt');
  assert.equal(knoten.logo.strichAn, true, 'danach wieder an');
});

test('Auch wenn das Zeichnen fehlschlägt, werden die Bedienelemente wiederhergestellt', () => {
  const knoten = szene();
  const { stage } = falscheStage(knoten, { wirf: 99 });
  const ergebnis = erzeugeSchnappschuss(stage, { pixelRatio: 3 });
  assert.equal(ergebnis.status, 'fehler');
  for (const [name, k] of Object.entries(knoten)) {
    assert.equal(k.sichtbar, true, `${name} muss trotz Fehler wieder sichtbar sein`);
    assert.equal(k.strichAn, true);
  }
});

test('Zu groß für das Gerät: ein zweiter Versuch mit halber Auflösung', () => {
  const { stage, aufnahmen } = falscheStage(szene(), { wirf: 1 });
  const ergebnis = erzeugeSchnappschuss(stage, { pixelRatio: 12 });
  assert.equal(ergebnis.status, 'bereit');
  assert.deepEqual(
    aufnahmen.map((a) => a.pixelRatio),
    [12, 6]
  );
});

test('Lädt ein Bild noch (Foto oder Logo), wird nicht aufgenommen – später erneut', () => {
  const knoten = szene();
  knoten.logo.bild = undefined; // Logo noch nicht geladen
  const { stage, aufnahmen } = falscheStage(knoten);
  assert.equal(erzeugeSchnappschuss(stage, { pixelRatio: 3 }).status, 'wartet');
  assert.equal(aufnahmen.length, 0);

  knoten.logo.bild = { width: 100 };
  knoten.foto.bild = { complete: false, naturalWidth: 0 }; // Foto lädt noch
  assert.equal(erzeugeSchnappschuss(stage, { pixelRatio: 3 }).status, 'wartet');
  assert.equal(aufnahmen.length, 0);

  knoten.foto.bild = { complete: true, naturalWidth: 1200 };
  assert.equal(erzeugeSchnappschuss(stage, { pixelRatio: 3 }).status, 'bereit');
});

test('Erzwingen: ein defektes Logo darf die Lupe nicht dauerhaft verhindern', () => {
  const knoten = szene();
  knoten.logo.bild = undefined;
  const { stage, aufnahmen } = falscheStage(knoten);
  assert.equal(erzeugeSchnappschuss(stage, { pixelRatio: 3, erzwingen: true }).status, 'bereit');
  assert.equal(aufnahmen.length, 1);
});

// ── Verdrahtung in ConfiguratorCanvas (Quelltext-Prüfung, wie ladezustand.test.ts) ──

const canvasQuelle = readFileSync('src/components/configurator/ConfiguratorCanvas.tsx', 'utf8').replace(/\r\n/g, '\n');

test('ConfiguratorCanvas: alle Bedienelemente der Vorschau tragen den Namen „steuerung“, die Motive den Namen „motiv“', () => {
  // Beschriftung der Fläche, Sperrzone Kreis, Sperrzone Rechteck-Gruppe, zwei Hilfslinien, zwei Maßanzeigen (Logo, Text)
  assert.equal((canvasQuelle.match(/name="steuerung"/g) ?? []).length, 7);
  // Logo und Text
  assert.equal((canvasQuelle.match(/name="motiv"/g) ?? []).length, 2);
  // Der Name der Druckfläche bleibt „print-area“ (Klick darauf wählt ab; die Aufnahme blendet sie aus).
  assert.match(canvasQuelle, /name="print-area"/);
});

test('ConfiguratorCanvas: Lupe kommt nur, wenn ein Schließen-Callback übergeben wird (Großansicht bleibt ohne Lupe)', () => {
  assert.match(canvasQuelle, /\{onLupeSchliessen && \(\s*<VorschauLupe/);
  const modal = readFileSync('src/components/configurator/LargePreviewModal.tsx', 'utf8');
  assert.ok(!/onLupeSchliessen|lupeAn/.test(modal), 'Großansicht reicht nichts an die Lupe durch');
});

test('Lupe ändert keine Bestell-/Preis-/Exportdaten: kein Store-Schreibzugriff und kein Export in der Lupe', () => {
  const lupe = readFileSync('src/components/configurator/VorschauLupe.tsx', 'utf8');
  const schnappschuss = readFileSync('src/components/configurator/lupeSchnappschuss.ts', 'utf8');
  const rechnung = readFileSync('src/components/configurator/lupe.ts', 'utf8');
  for (const [name, text] of [['VorschauLupe.tsx', lupe], ['lupeSchnappschuss.ts', schnappschuss], ['lupe.ts', rechnung]] as const) {
    assert.ok(!/useConfiguratorStore/.test(text), `${name} liest/schreibt den Konfigurator-Store nicht`);
    assert.ok(!/toDataURL|toBlob|fetch\(/.test(text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')), `${name} exportiert/versendet nichts`);
  }
});

test('Ladestabilität: Der Platzhalter vor dem Laden enthält nichts von der Lupe, und die Lupe startet immer ausgeschaltet', () => {
  const quelle = readFileSync('src/components/configurator/ConfiguratorPrototype.tsx', 'utf8').replace(/\r\n/g, '\n');
  const start = quelle.indexOf('if (!isHydrated) {');
  const ende = quelle.indexOf('\n  }\n', start);
  assert.ok(start > 0 && ende > start, 'Platzhalter-Block gefunden');
  assert.ok(!/lupe/i.test(quelle.slice(start, ende)), 'Platzhalter bleibt unverändert (fester Höhe, kein Layout-Sprung)');
  assert.match(quelle, /const \[lupeAn, setLupeAn\] = useState\(false\)/);
});
