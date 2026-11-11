/**
 * Stickplan: aus Farbebenen (Rastermasken) die Stichfolge bauen.
 *
 * Pro Farbe: kleine Teile verwerfen, Zugkompensation, Teile der Reihe nach (nächster zuerst) sticken: Unterlage
 * (nur bei breiten Flächen), dann die Füllung. Innerhalb eines Teils werden Reihen ohne Sprung verbunden, solange der
 * Weg innerhalb der Fläche bleibt; sonst Sprung mit Sicherungsstichen davor und danach.
 *
 * Ausgabe in Millimetern, Rasterkoordinaten (y nach unten), um die Mitte des Motivs zentriert.
 */
import { STANDARD_PARAMETER, type StickParameter } from './parameter';
import { dilatiere, erodiere, neueMaske, teile, type FarbEbene, type Maske } from './maske';
import { fuellReihen, waehleWinkel, type Pt, type Rahmen } from './fuellung';

export interface StichPunkt {
  x: number;
  y: number;
  art: 'stich' | 'sprung';
}

export interface FarbBlock {
  hex: string;
  stiche: StichPunkt[];
}

export interface Stickplan {
  bloecke: FarbBlock[];
  breiteMm: number;
  hoeheMm: number;
  stichzahl: number;
  sprungzahl: number;
  hinweise: string[];
}

export class StickGrenzeUeberschritten extends Error {
  constructor(nachricht: string) {
    super(nachricht);
    this.name = 'StickGrenzeUeberschritten';
  }
}

function abstandMm(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Baut die Stichfolge eines Farbblocks; hält Position, Richtung und die Sequenz-Grenzen für Sicherungsstiche. */
class Naehbauer {
  stiche: StichPunkt[] = [];
  aktuell: Pt | null;
  private vorher: Pt | null = null;
  private inSequenz = false;

  constructor(
    start: Pt | null,
    private readonly p: StickParameter
  ) {
    this.aktuell = start;
  }

  private stichZu(pt: Pt): void {
    this.stiche.push({ x: pt.x, y: pt.y, art: 'stich' });
    this.vorher = this.aktuell;
    this.aktuell = pt;
  }

  private sprungZu(pt: Pt): void {
    this.stiche.push({ x: pt.x, y: pt.y, art: 'sprung' });
    this.aktuell = pt;
    this.vorher = null;
  }

  /** Sicherungsstiche am Ende: ein kurzes Stück zurück und wieder vor. */
  beendeSequenz(): void {
    if (!this.inSequenz || !this.aktuell) {
      this.inSequenz = false;
      return;
    }
    const ende = this.aktuell;
    if (this.vorher) {
      const dx = ende.x - this.vorher.x;
      const dy = ende.y - this.vorher.y;
      const laenge = Math.hypot(dx, dy) || 1;
      const rueck: Pt = { x: ende.x - (dx / laenge) * this.p.sicherungMm, y: ende.y - (dy / laenge) * this.p.sicherungMm };
      this.stichZu(rueck);
      this.stichZu(ende);
    }
    this.inSequenz = false;
  }

  /** Näht einen Pfad. `innen` entscheidet, ob ein kurzer Weg zum Pfadanfang ohne Sprung (innerhalb der Fläche) geht. */
  naehe(punkte: Pt[], innen: (a: Pt, b: Pt) => boolean): void {
    if (punkte.length === 0) return;
    const p0 = punkte[0]!;
    const naehe = this.aktuell !== null && this.inSequenz && abstandMm(this.aktuell, p0) <= this.p.maxVerbindungMm && innen(this.aktuell, p0);
    if (naehe) {
      if (abstandMm(this.aktuell!, p0) > 0.01) this.stichZu(p0);
    } else {
      this.beendeSequenz();
      this.sprungZu(p0);
      // Anker: Einstich genau am Ziel, dann ein kurzes Stück vor und zurück (Sicherung am Anfang).
      this.stichZu(p0);
      const p1 = punkte[1];
      if (p1) {
        const dx = p1.x - p0.x;
        const dy = p1.y - p0.y;
        const laenge = Math.hypot(dx, dy) || 1;
        const kurz = Math.min(this.p.sicherungMm, laenge / 2);
        this.stichZu({ x: p0.x + (dx / laenge) * kurz, y: p0.y + (dy / laenge) * kurz });
        this.stichZu(p0);
      }
      this.inSequenz = true;
    }
    for (let i = 1; i < punkte.length; i++) this.stichZu(punkte[i]!);
  }
}

function pixelAnzahl(m: Maske): number {
  let n = 0;
  for (let i = 0; i < m.daten.length; i++) n += m.daten[i]!;
  return n;
}

/** Prüft, ob die Strecke a–b vollständig in der Maske liegt (alle 0,2 mm). */
function streckeInnen(maske: Maske, pxProMm: number, a: Pt, b: Pt): boolean {
  const laenge = abstandMm(a, b);
  const schritte = Math.max(2, Math.ceil(laenge / 0.2));
  for (let i = 0; i <= schritte; i++) {
    const t = i / schritte;
    const ix = Math.floor((a.x + (b.x - a.x) * t) * pxProMm);
    const iy = Math.floor((a.y + (b.y - a.y) * t) * pxProMm);
    if (ix < 0 || ix >= maske.breite || iy < 0 || iy >= maske.hoehe || !maske.daten[iy * maske.breite + ix]) return false;
  }
  return true;
}

/**
 * Kleiner Punkt: Füllung mit engeren Reihen und kürzestem Reihenstück; ergibt das keinen Stich (Punkt kleiner als
 * etwa 0,5 mm), ein Stern aus drei Linien durch den Schwerpunkt. So fehlt kein i-Punkt und kein Umlautpunkt in der Datei.
 */
function sticheKleinteil(bauer: Naehbauer, gross: Maske, beschriftung: Int32Array, teil: { id: number; sx: number; sy: number; x0: number; y0: number; x1: number; y1: number }, rahmen: Rahmen, p: StickParameter, innen: (a: Pt, b: Pt) => boolean): void {
  const ppm = p.pxProMm;
  const reihen = fuellReihen(gross, beschriftung, teil.id, rahmen, {
    pxProMm: ppm,
    winkelGrad: 45,
    abstandMm: Math.min(p.fuellAbstandMm, 0.3),
    maxStichMm: p.maxStichMm,
    minLaufMm: 0.15,
  });
  const laeufe = reihen.flatMap((r) => r.laeufe);
  if (laeufe.length >= 2) {
    for (const lauf of laeufe) bauer.naehe(lauf.punkte, innen);
    bauer.beendeSequenz();
    return;
  }
  const cx = teil.sx / ppm;
  const cy = teil.sy / ppm;
  const kante = Math.min((teil.x1 - teil.x0 + 1) / ppm, (teil.y1 - teil.y0 + 1) / ppm);
  const r = Math.min(1, Math.max(0.35, kante / 2));
  const punkt = (grad: number): Pt => ({ x: cx + r * Math.cos((grad * Math.PI) / 180), y: cy + r * Math.sin((grad * Math.PI) / 180) });
  bauer.naehe([punkt(0), punkt(180), punkt(240), punkt(60), punkt(120), punkt(300)], () => true);
  bauer.beendeSequenz();
}

function sticheEbene(bauer: Naehbauer, ebene: FarbEbene, p: StickParameter, hinweise: string[]): void {
  const ppm = p.pxProMm;
  // 1. Kleinteile (Bildrauschen, Staub) entfernen
  const roh = teile(ebene.maske);
  const sauber = neueMaske(ebene.maske.breite, ebene.maske.hoehe);
  // In EINEM Durchlauf: welche Teile bleiben (nicht je Teil die ganze Maske neu durchsuchen – ein verrauschtes Logo hat tausende Teile).
  const behalten = new Uint8Array(roh.teile.length + 1);
  let uebrig = 0;
  for (const t of roh.teile) {
    if (t.pixel / (ppm * ppm) >= p.minFlaecheMm2) {
      behalten[t.id] = 1;
      uebrig++;
    }
  }
  if (uebrig === 0) return;
  for (let i = 0; i < roh.beschriftung.length; i++) if (behalten[roh.beschriftung[i]!]) sauber.daten[i] = 1;

  // Dünne Striche (unter ~0,8 mm) lassen sich nicht sauber sticken – ein Hinweis, wenn die Fläche dabei stark schrumpft.
  const duenn = erodiere(sauber, Math.max(1, Math.round(0.4 * ppm)));
  const gesamt = pixelAnzahl(sauber);
  if (gesamt > 0 && pixelAnzahl(duenn) < gesamt * 0.5) {
    hinweise.push(`Farbe ${ebene.hex}: Mehr als die Hälfte der Fläche besteht aus Linien dünner als etwa 0,8 mm – das lässt sich nicht sauber sticken (Linien dicker zeichnen oder Schrift größer/fetter wählen).`);
  }

  // 2. Zugkompensation: gestickt wird etwas größer als die Vorlage
  const gross = dilatiere(sauber, Math.max(0, Math.round(p.zugKompensationMm * ppm)));
  const { beschriftung, teile: liste } = teile(gross);

  // Verbindungswege dürfen den Rand um 0,2 mm streifen: An pixelgenauen (schrägen) Kanten wäre jede Randstrecke sonst
  // "außerhalb" und würde zu einem Sprung. Der Weg liegt dort ohnehin unter den Nachbarstichen.
  const verbindung = dilatiere(gross, Math.max(1, Math.round(0.2 * ppm)));

  // Unterlage-Basis einmal je Farbe berechnen (Rand eingezogen), nicht je Teil.
  const eingezogen = erodiere(sauber, Math.max(1, Math.round(p.untergrundEinzugMm * ppm)));

  // 3. Teile der Reihe nach: immer das, dessen Schwerpunkt der aktuellen Nadelposition am nächsten liegt
  const offen = [...liste];
  while (offen.length > 0) {
    const aktuell = bauer.aktuell ?? { x: 0, y: 0 };
    let besterIndex = 0;
    let besterAbstand = Infinity;
    offen.forEach((t, idx) => {
      const d = Math.hypot(t.sx / ppm - aktuell.x, t.sy / ppm - aktuell.y);
      if (d < besterAbstand) {
        besterAbstand = d;
        besterIndex = idx;
      }
    });
    const teil = offen.splice(besterIndex, 1)[0]!;
    const rahmen: Rahmen = { x0: teil.x0, y0: teil.y0, x1: teil.x1, y1: teil.y1 };

    const innen = (a: Pt, b: Pt) => streckeInnen(verbindung, ppm, a, b);

    // Punkte (i-Punkt, Umlautpunkte, Satzzeichen): eigene, dichte Kleinfüllung – nie weglassen.
    const teilBreiteMm = (teil.x1 - teil.x0 + 1) / ppm;
    const teilHoeheMm = (teil.y1 - teil.y0 + 1) / ppm;
    if (Math.max(teilBreiteMm, teilHoeheMm) <= p.punktMaxMm) {
      sticheKleinteil(bauer, gross, beschriftung, teil, rahmen, p, innen);
      continue;
    }

    const winkel = waehleWinkel(gross, beschriftung, teil.id, rahmen, ppm);

    // Unterlage nur bei breiten Flächen: Rand eingezogen, quer zur Füllung, grob
    const unterMaske = neueMaske(gross.breite, gross.hoehe);
    let unterPixel = 0;
    for (let y = teil.y0; y <= teil.y1; y++) {
      for (let x = teil.x0; x <= teil.x1; x++) {
        const i = y * gross.breite + x;
        if (eingezogen.daten[i] && beschriftung[i] === teil.id) {
          unterMaske.daten[i] = 1;
          unterPixel++;
        }
      }
    }
    if (unterPixel >= teil.pixel * 0.3 && unterPixel / (ppm * ppm) >= 6) {
      const unterReihen = fuellReihen(unterMaske, null, 1, rahmen, {
        pxProMm: ppm,
        winkelGrad: winkel + 90,
        abstandMm: p.untergrundAbstandMm,
        maxStichMm: p.maxStichMm,
        minLaufMm: p.minLaufMm,
      });
      const unterVerbindung = dilatiere(unterMaske, Math.max(1, Math.round(0.2 * ppm)));
      const innenUnter = (a: Pt, b: Pt) => streckeInnen(unterVerbindung, ppm, a, b);
      for (const reihe of unterReihen) for (const lauf of reihe.laeufe) bauer.naehe(lauf.punkte, innenUnter);
    }

    // Füllung
    const reihen = fuellReihen(gross, beschriftung, teil.id, rahmen, {
      pxProMm: ppm,
      winkelGrad: winkel,
      abstandMm: p.fuellAbstandMm,
      maxStichMm: p.maxStichMm,
      minLaufMm: p.minLaufMm,
    });
    for (const reihe of reihen) for (const lauf of reihe.laeufe) bauer.naehe(lauf.punkte, innen);
    bauer.beendeSequenz();
  }
}

/**
 * Erzeugt aus den Farbebenen den Stickplan (Reihenfolge der Ebenen = Reihenfolge der Garnfarben).
 * Wirft StickGrenzeUeberschritten, wenn das Motiv zu groß oder zu detailreich für die automatische Erzeugung ist.
 */
export function erzeugeStickplan(ebenen: FarbEbene[], p: StickParameter = STANDARD_PARAMETER): Stickplan {
  const hinweise: string[] = [];
  const ppm = p.pxProMm;

  // Mitte und Größe des gesamten Motivs
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const e of ebenen) {
    const { breite: b, hoehe: h, daten } = e.maske;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < b; x++) {
        if (daten[y * b + x]) {
          if (x < x0) x0 = x;
          if (x > x1) x1 = x;
          if (y < y0) y0 = y;
          if (y > y1) y1 = y;
        }
      }
    }
  }
  if (!isFinite(x0)) throw new StickGrenzeUeberschritten('Das Motiv enthält nichts Sichtbares.');
  const breiteMm = (x1 - x0 + 1) / ppm;
  const hoeheMm = (y1 - y0 + 1) / ppm;
  if (Math.max(breiteMm, hoeheMm) > p.maxKanteMm) {
    throw new StickGrenzeUeberschritten(`Das Motiv ist mit ${Math.max(breiteMm, hoeheMm).toFixed(0)} mm zu groß für die automatische Digitalisierung (Grenze ${p.maxKanteMm} mm).`);
  }
  if (Math.min(breiteMm, hoeheMm) < 4) {
    hinweise.push(`Sehr kleines Motiv (${breiteMm.toFixed(1)} × ${hoeheMm.toFixed(1)} mm): Unter etwa 4 mm Höhe werden Buchstaben und Details beim Sticken unsauber.`);
  }
  const mitteX = (x0 + x1 + 1) / 2 / ppm;
  const mitteY = (y0 + y1 + 1) / 2 / ppm;

  const bloecke: FarbBlock[] = [];
  let letzterPunkt: Pt | null = null;
  let stichzahl = 0;
  let sprungzahl = 0;
  for (const ebene of ebenen) {
    const bauer: Naehbauer = new Naehbauer(letzterPunkt, p);
    sticheEbene(bauer, ebene, p, hinweise);
    bauer.beendeSequenz();
    if (bauer.stiche.length === 0) continue;
    letzterPunkt = bauer.aktuell;
    const stiche = bauer.stiche.map((s) => ({ x: s.x - mitteX, y: s.y - mitteY, art: s.art }));
    stichzahl += stiche.filter((s) => s.art === 'stich').length;
    sprungzahl += stiche.filter((s) => s.art === 'sprung').length;
    if (stichzahl > p.maxStiche) {
      throw new StickGrenzeUeberschritten(`Das Motiv ergibt mehr als ${p.maxStiche.toLocaleString('de-DE')} Stiche – zu groß oder zu detailreich für die automatische Digitalisierung.`);
    }
    bloecke.push({ hex: ebene.hex, stiche });
  }
  if (bloecke.length === 0) throw new StickGrenzeUeberschritten('Aus dem Motiv ließen sich keine Stiche erzeugen (alle Teile zu klein).');
  return { bloecke, breiteMm, hoeheMm, stichzahl, sprungzahl, hinweise };
}
