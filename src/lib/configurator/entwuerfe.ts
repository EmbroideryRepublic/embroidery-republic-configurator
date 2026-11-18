/**
 * Entwürfe des Konfigurators – reine Logik, keine Darstellung, kein Speicher.
 *
 * ── Wozu ────────────────────────────────────────────────────────────────
 * Der Konfigurator hält genau EINE Arbeitskonfiguration. Wer mitten in einem
 * Hoodie-Design das Produkt wechselt, überträgt Farbe, Größen und Motive auf
 * das neue Produkt – der bisherige Stand war danach nirgends mehr zu sehen und
 * nicht wieder aufrufbar (nur Artikel IM Warenkorb ließen sich bearbeiten).
 *
 * Ein Entwurf ist der Stand, den man beim Produktwechsel hinter sich lässt. Er
 * wird als Karte „Zuletzt bearbeitet" angezeigt und lässt sich mit einem Klick
 * zurück in den Editor laden.
 *
 * ── Regeln (hier festgelegt, damit sie getestet sind) ───────────────────
 *   · Nur ein BEARBEITETER Stand ist einen Entwurf wert: mindestens ein Motiv
 *     oder mindestens ein Stück gewählt. Ein bloß angesehenes Produkt füllte die
 *     Leiste mit Karten, hinter denen nichts steckt.
 *   · Ein Entwurf je Produkt. Wer denselben Hoodie ein zweites Mal verlässt,
 *     ersetzt den älteren Stand dieses Hoodies, statt die Leiste zu verdoppeln.
 *   · Höchstens `MAX_ENTWUERFE` Stück, der älteste fällt zuerst heraus. Logos
 *     liegen als Base64 im Entwurf und können groß sein – die Zahl begrenzt den
 *     Speicherbedarf im Browser.
 *   · Neueste zuerst.
 *
 * Preise werden NICHT hier gerechnet: Der Entwurf trägt nur den zuletzt
 * angezeigten Preis zur Anzeige mit. Beim Laden rechnet der Konfigurator wie
 * immer über die Preispipeline neu.
 */
import type { ConfigElement, PrintMethod, PrintView } from '@/types';
import { sumSizeQuantities } from '@/lib/pricing/quantity';

/** Höchstzahl gemerkter Entwürfe (siehe Kopfkommentar). */
export const MAX_ENTWUERFE = 6;

export interface Entwurf {
  /** Eindeutig je Speicherung (nicht je Produkt) – dient als React-Schlüssel. */
  id: string;
  /** Zeitpunkt (ms seit 1970), zu dem der Stand verlassen wurde. */
  gespeichertAm: number;
  printMethod: PrintMethod;
  productId: string;
  colorId: string | null;
  sizeQuantities: Record<string, number>;
  activeView: PrintView;
  elements: ConfigElement[];
  /** Nur zur Anzeige: Gesamtpreis zum Zeitpunkt des Verlassens (0 = unbekannt). */
  totalPrice: number;
}

/** Der Teil des Konfigurator-Zustands, aus dem ein Entwurf entsteht. */
export interface Arbeitsstand {
  printMethod: PrintMethod;
  productId: string | null;
  colorId: string | null;
  sizeQuantities: Record<string, number>;
  activeView: PrintView;
  elements: ConfigElement[];
  totalPrice: number;
}

/** Lohnt sich ein Entwurf? Mindestens ein Motiv oder mindestens ein Stück. */
export function istEntwurfswuerdig(stand: Pick<Arbeitsstand, 'productId' | 'elements' | 'sizeQuantities'>): boolean {
  if (!stand.productId) return false;
  return stand.elements.length > 0 || sumSizeQuantities(stand.sizeQuantities) > 0;
}

/**
 * Macht aus dem Arbeitsstand einen Entwurf – oder `null`, wenn er keinen lohnt.
 * Kopiert Elemente und Mengen, damit spätere Änderungen am Arbeitsstand den
 * Entwurf nicht mitverändern.
 */
export function erzeugeEntwurf(stand: Arbeitsstand, jetzt: number, id: string): Entwurf | null {
  if (!istEntwurfswuerdig(stand) || !stand.productId) return null;
  return {
    id,
    gespeichertAm: jetzt,
    printMethod: stand.printMethod,
    productId: stand.productId,
    colorId: stand.colorId,
    sizeQuantities: { ...stand.sizeQuantities },
    activeView: stand.activeView,
    elements: stand.elements.map((el) => ({ ...el })),
    totalPrice: Number.isFinite(stand.totalPrice) && stand.totalPrice > 0 ? stand.totalPrice : 0,
  };
}

/**
 * Fügt einen Entwurf vorn ein: ersetzt einen vorhandenen Entwurf desselben
 * Produkts, begrenzt auf `MAX_ENTWUERFE`. Verändert die Eingabeliste nicht.
 */
export function fuegeEntwurfEin(liste: readonly Entwurf[], neu: Entwurf, max: number = MAX_ENTWUERFE): Entwurf[] {
  const ohneAlten = liste.filter((e) => e.productId !== neu.productId);
  return [neu, ...ohneAlten].slice(0, Math.max(1, max));
}

/** Entfernt den Entwurf mit dieser ID (unbekannte ID: Liste bleibt gleich). */
export function entferneEntwurf(liste: readonly Entwurf[], id: string): Entwurf[] {
  return liste.filter((e) => e.id !== id);
}

/**
 * Führt zwei Listen zusammen (z. B. frisch gemerkte Entwürfe und die aus dem
 * Browser-Speicher geladenen): je Produkt gewinnt der NEUERE Entwurf, danach
 * neueste zuerst und begrenzt. Nötig, weil das Laden aus IndexedDB asynchron
 * ist – ein Produktwechsel kann schneller sein als der Speicher.
 */
export function fuehreZusammen(a: readonly Entwurf[], b: readonly Entwurf[], max: number = MAX_ENTWUERFE): Entwurf[] {
  const beste = new Map<string, Entwurf>();
  for (const e of [...a, ...b]) {
    const bisher = beste.get(e.productId);
    if (!bisher || e.gespeichertAm > bisher.gespeichertAm) beste.set(e.productId, e);
  }
  return [...beste.values()].sort((x, y) => y.gespeichertAm - x.gespeichertAm).slice(0, Math.max(1, max));
}

/**
 * Prüft einen aus dem Browser-Speicher geladenen Wert, bevor er verwendet wird:
 * Gespeichertes kann veraltet, gekürzt oder von Hand verändert sein. Verworfen
 * wird alles, was nicht die nötigen Felder hat – lieber ein Entwurf weniger als
 * ein Absturz der Leiste.
 */
export function bereinigeGespeicherte(wert: unknown): Entwurf[] {
  if (!Array.isArray(wert)) return [];
  const ergebnis: Entwurf[] = [];
  for (const roh of wert) {
    if (!roh || typeof roh !== 'object') continue;
    const e = roh as Partial<Entwurf>;
    if (typeof e.id !== 'string' || typeof e.productId !== 'string' || !e.productId) continue;
    if (typeof e.gespeichertAm !== 'number' || !Number.isFinite(e.gespeichertAm)) continue;
    if (!Array.isArray(e.elements)) continue;
    if (!e.sizeQuantities || typeof e.sizeQuantities !== 'object') continue;
    ergebnis.push({
      id: e.id,
      gespeichertAm: e.gespeichertAm,
      printMethod: e.printMethod === 'embroidery' ? 'embroidery' : 'dtf',
      productId: e.productId,
      colorId: typeof e.colorId === 'string' ? e.colorId : null,
      sizeQuantities: { ...e.sizeQuantities },
      activeView: (e.activeView ?? 'front') as PrintView,
      elements: e.elements as ConfigElement[],
      totalPrice: typeof e.totalPrice === 'number' && Number.isFinite(e.totalPrice) ? e.totalPrice : 0,
    });
  }
  return ergebnis.sort((x, y) => y.gespeichertAm - x.gespeichertAm).slice(0, MAX_ENTWUERFE);
}

// ── Handarbeit oder automatische Anpassung? ───────────────────────────────

/**
 * Eigenschaften eines Elements, die der Konfigurator selbst nachführt, wenn sich
 * das Produkt ändert (Canvas: Korrektur über den Rand ragender Motive; Store:
 * `syncElementsToPrintAreas` klemmt Position/Größe und skaliert Text). Eine
 * Änderung NUR an diesen Feldern ist keine Bearbeitung durch die Person.
 */
const AUTOMATISCH_NACHGEFUEHRT: ReadonlySet<string> = new Set([
  'xCm', 'yCm', 'widthCm', 'heightCm', 'isOutOfBounds', 'estimatedStitches', 'fontSizePx',
]);

/**
 * War diese Zustandsänderung Handarbeit der Person – im Gegensatz zu einer
 * automatischen Anpassung nach einem Produktwechsel?
 *
 * Wozu: Das Design wandert beim Produktwechsel auf das neue Produkt mit. Ohne
 * diese Unterscheidung bekäme jedes bloß durchgeblätterte Produkt einen Entwurf,
 * und die Leiste füllte sich mit Karten, hinter denen keine eigene Arbeit steckt
 * – zudem verdrängten sie den Stand, an dem wirklich gearbeitet wurde.
 *
 * Handarbeit ist:
 *   · jede Änderung der Undo-Historie (Hinzufügen, Entfernen, Verlaufspunkt wie
 *     das Ende eines Verschiebens, Rückgängig/Wiederholen) – auch wenn sie nur
 *     die Lage ändert, und
 *   · eine Änderung an einem Merkmal, das der Konfigurator NICHT selbst
 *     nachführt (Text, Farbe, Schrift, Datei …).
 * Keine Handarbeit: Position/Größe/Randkennzeichen/Stichzahl/Schriftgröße
 * allein, ohne Verlaufspunkt – das sind die automatischen Korrekturen.
 */
export function istHandbearbeitung(
  vorher: { elements: readonly ConfigElement[]; history: readonly unknown[] },
  nachher: { elements: readonly ConfigElement[]; history: readonly unknown[] },
): boolean {
  if (nachher.history !== vorher.history) return true;
  if (nachher.elements === vorher.elements) return false;
  const alt = new Map(vorher.elements.map((e) => [e.id, e as unknown as Record<string, unknown>]));
  for (const el of nachher.elements) {
    const a = alt.get(el.id);
    if (!a) return true; // neues Element ohne Verlaufspunkt: nicht automatisch erklärbar
    const neu = el as unknown as Record<string, unknown>;
    for (const key of new Set([...Object.keys(neu), ...Object.keys(a)])) {
      if (!AUTOMATISCH_NACHGEFUEHRT.has(key) && neu[key] !== a[key]) return true;
    }
  }
  return false;
}
