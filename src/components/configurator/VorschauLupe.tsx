'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import clsx from 'clsx';
import { Minus, Plus, X } from 'lucide-react';
import type Konva from 'konva';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@/config/products';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { TranslationKey } from '@/lib/i18n/translations';
import {
  FINGER_ABSTAND_PX,
  LINSE_DURCHMESSER_GROSS_PX,
  LINSE_RAND_PX,
  LUPE_STANDARD_STAERKE,
  SCHNAPPSCHUSS_ENTPRELLUNG_MS,
  SCHNAPPSCHUSS_MAX_NEUVERSUCHE,
  SCHNAPPSCHUSS_NEUVERSUCH_MS,
  berechneAusschnitt,
  berechneSchnappschussPixelRatio,
  entprelle,
  linsenDurchmesser,
  linsenGeometrie,
  linsenInnenDurchmesser,
  naechsteStaerke,
  schnittmenge,
  staerkeText,
  tastenSchritt,
  tastenStaerkeRichtung,
  zeigerAnteil,
  type Entprellt,
  type Punkt,
  type ZeigerArt,
} from './lupe';
import { erzeugeSchnappschuss } from './lupeSchnappschuss';

/** Der Hinweis „Zum Prüfen über das Motiv fahren“ erscheint nur beim ersten Einschalten pro Seitenaufruf. */
let hinweisSchonGezeigt = false;

/** Hintergrund der Linse, wo die Vorschau selbst nicht hinreicht (Rand der Leinwand). */
const LINSEN_HINTERGRUND = '#ece7de';

interface VorschauLupeProps {
  aktiv: boolean;
  onSchliessen: () => void;
  stageRef: RefObject<Konva.Stage | null>;
  /** Scrollbarer Rahmen der Leinwand: Zeigerereignisse kommen von hier, bei Zoom über 100 % scrollt er. */
  containerRef: RefObject<HTMLDivElement | null>;
  /** Äußere Hülle (position: relative): darin liegt die Linse, ohne vom Scrollrahmen abgeschnitten zu werden. */
  huelleRef: RefObject<HTMLDivElement | null>;
  /** Ändert sich genau dann, wenn sich das BILD der Vorschau ändert (siehe lupe.ts::schnappschussSchluessel). */
  schluessel: string;
  /** Skalierfaktor der Stage (scale × zoom), für die Auflösung des Zwischenspeichers. */
  stageScale: number;
  /** Mitte des Motivs als Anteil (0…1) an der Leinwand – dort startet die Lupe beim Einschalten. */
  start: Punkt | null;
}

/**
 * Lupe für die Konfigurator-Vorschau: eine runde Linse, die dem Zeiger folgt und die Stelle darunter 2–4-fach vergrößert
 * zeigt (Standard 2,5×) – zum Prüfen von Druckqualität und Platzierung.
 *
 * REINE ANZEIGE. Die Lupe verändert keine Motive, keinen Preis, keine Bestellung und keine Produktionsdatei.
 *
 * Schärfe: Die Linse zeichnet nicht die 1×-Leinwand größer, sondern ein einmal in hoher Auflösung gezeichnetes Bild
 * (lupeSchnappschuss.ts, ca. 3-fach), das ohne Bedienelemente nur Foto und Motive enthält. Das Bild wird mit Verzögerung
 * (200 ms) neu gezeichnet, wenn sich Motive, Ansicht, Produktfarbe oder Größe ändern – nicht bei jeder Mausbewegung.
 * Pro Mausbewegung wird nur ein kleiner Canvas (Linsengröße) per requestAnimationFrame neu gezeichnet.
 *
 * Bedienung:
 *  - Maus: Die Linse folgt dem Zeiger über der Vorschau. Beim Drücken der Maustaste (Motiv ziehen, Griff ziehen,
 *    anklicken) verschwindet sie, solange die Taste unten ist – sie stört das Bearbeiten nicht.
 *  - Finger: Ziehen bewegt die Linse (oberhalb des Fingers, damit er sie nicht verdeckt); die Seite scrollt dabei nicht.
 *    Solange die Lupe an ist, gehört der Finger der Lupe – Motive verschiebt man mit ausgeschalteter Lupe.
 *  - Tastatur: Ist der Fokus auf dem Lupe-Knopf oder in der Lupenleiste, bewegen die Pfeiltasten die Linse
 *    (Umschalt = größere Schritte), „+“/„−“ ändern die Vergrößerung. Escape schließt die Lupe.
 */
export function VorschauLupe({ aktiv, onSchliessen, stageRef, containerRef, huelleRef, schluessel, stageScale, start }: VorschauLupeProps) {
  const sprache = useLanguageStore((s) => s.language);
  const t = (key: TranslationKey, vars?: Record<string, string | number>) => translate(key, sprache, vars);

  const [staerke, setStaerke] = useState<number>(LUPE_STANDARD_STAERKE);
  /** Es gibt einen fertigen Zwischenspeicher – erst dann zeigt die Linse etwas. */
  const [bereit, setBereit] = useState(false);
  /** Maustaste ist unten (Motiv wird gezogen/angeklickt): Linse aus dem Weg. */
  const [gedrueckt, setGedrueckt] = useState(false);
  const [durchmesser, setDurchmesser] = useState<number>(LINSE_DURCHMESSER_GROSS_PX);
  /** Welcher Hinweistext gerade eingeblendet ist (nur beim ersten Einschalten). */
  const [hinweis, setHinweis] = useState<ZeigerArt | null>(null);

  const linseRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leisteRef = useRef<HTMLDivElement>(null);
  const schnappRef = useRef<HTMLCanvasElement | null>(null);
  const zeigerRef = useRef<Punkt>({ x: 0.5, y: 0.5 });
  const artRef = useRef<ZeigerArt>('maus');
  const hinweisAnRef = useRef(false);
  const rafRef = useRef(0);
  const entprelltRef = useRef<Entprellt | null>(null);
  const letzterSchluesselRef = useRef(schluessel);
  // Aktuelle Werte für Funktionen, die nicht bei jeder Änderung neu entstehen sollen (Ereignisfunktionen, rAF).
  const aktuell = useRef({ staerke, durchmesser, stageScale, start, onSchliessen });
  aktuell.current = { staerke, durchmesser, stageScale, start, onSchliessen };

  // ── Zeichnen: Linse positionieren und Ausschnitt malen ───────────────
  const zeichne = useCallback(() => {
    rafRef.current = 0;
    const linse = linseRef.current;
    const canvas = canvasRef.current;
    const huelle = huelleRef.current;
    const container = containerRef.current;
    const inhalt = stageRef.current?.content;
    if (!linse || !canvas || !huelle || !container || !inhalt) return;

    const { staerke: s, durchmesser: d } = aktuell.current;
    const radius = d / 2;
    const wr = huelle.getBoundingClientRect();
    const sr = inhalt.getBoundingClientRect();
    const cr = container.getBoundingClientRect();
    const bild = { x: sr.left - wr.left, y: sr.top - wr.top, width: sr.width, height: sr.height };
    const art = artRef.current;

    // Bereich, in dem die GANZE Linse liegen darf: die Hülle (nie über den Seitenrand hinaus – das würde auf dem Handy
    // waagerechtes Scrollen auslösen), für den Finger zusätzlich nach oben erweitert (Linse sitzt über dem Finger).
    // Alles zusätzlich auf das sichtbare Fenster begrenzt.
    const oben = art === 'finger' ? d + FINGER_ABSTAND_PX : 0;
    const huellenBereich = { x: 0, y: -oben, width: wr.width, height: wr.height + oben };
    const fenster = { x: -wr.left, y: -wr.top, width: document.documentElement.clientWidth, height: window.innerHeight };
    const bereich = schnittmenge(huellenBereich, fenster) ?? huellenBereich;

    const zeigerPx = { x: bild.x + zeigerRef.current.x * bild.width, y: bild.y + zeigerRef.current.y * bild.height };
    const geo = linsenGeometrie({ zeiger: zeigerPx, art, bild, bereich, radius });
    linse.style.transform = `translate3d(${geo.fensterMitte.x - radius}px, ${geo.fensterMitte.y - radius}px, 0)`;

    // Bedienleiste unten rechts im sichtbaren Teil der Vorschau (bei Zoom über 100 % ist das nur ein Ausschnitt).
    const leiste = leisteRef.current;
    const sichtbar = schnittmenge(bild, { x: cr.left - wr.left, y: cr.top - wr.top, width: cr.width, height: cr.height });
    if (leiste && sichtbar) {
      leiste.style.left = `${sichtbar.x + sichtbar.width - 8}px`;
      leiste.style.top = `${sichtbar.y + sichtbar.height - 8}px`;
      leiste.style.maxWidth = `${Math.max(120, sichtbar.width - 16)}px`;
    }

    // Ausschnitt malen
    const dpr = Math.min(3, window.devicePixelRatio || 1);
    const innen = linsenInnenDurchmesser(d);
    const pixel = Math.round(innen * dpr);
    if (canvas.width !== pixel) {
      canvas.width = pixel;
      canvas.height = pixel;
    }
    const ctx = canvas.getContext('2d');
    const snap = schnappRef.current;
    if (!ctx || !snap || snap.width === 0) return;
    ctx.fillStyle = LINSEN_HINTERGRUND;
    ctx.fillRect(0, 0, pixel, pixel);
    const ausschnitt = berechneAusschnitt({
      ziel: { x: geo.ziel.x - bild.x, y: geo.ziel.y - bild.y },
      vorschau: { width: bild.width, height: bild.height },
      zwischenspeicher: { width: snap.width, height: snap.height },
      linseCss: innen,
      linsePixel: pixel,
      staerke: s,
    });
    if (!ausschnitt) return;
    // Die Vorschau hat einen weißen Grund (CSS), der Zwischenspeicher ist dort durchsichtig.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(ausschnitt.ziel.x, ausschnitt.ziel.y, ausschnitt.ziel.width, ausschnitt.ziel.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(
      snap,
      ausschnitt.quelle.x,
      ausschnitt.quelle.y,
      ausschnitt.quelle.width,
      ausschnitt.quelle.height,
      ausschnitt.ziel.x,
      ausschnitt.ziel.y,
      ausschnitt.ziel.width,
      ausschnitt.ziel.height
    );
  }, [huelleRef, containerRef, stageRef]);

  /** Höchstens einmal pro Bild neu zeichnen, egal wie viele Zeigerereignisse eintreffen. */
  const anfordern = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(zeichne);
  }, [zeichne]);

  const verbirgHinweis = useCallback(() => {
    if (!hinweisAnRef.current) return;
    hinweisAnRef.current = false;
    setHinweis(null);
  }, []);

  /** Zeiger (Pixel im Fenster) → Anteil an der Vorschau. */
  const setzeZeiger = useCallback(
    (clientX: number, clientY: number, art: ZeigerArt) => {
      const inhalt = stageRef.current?.content;
      if (!inhalt) return;
      const r = inhalt.getBoundingClientRect();
      zeigerRef.current = zeigerAnteil({ x: clientX, y: clientY }, { x: r.left, y: r.top, width: r.width, height: r.height });
      artRef.current = art;
      verbirgHinweis();
      anfordern();
    },
    [stageRef, anfordern, verbirgHinweis]
  );

  const verschiebeUm = useCallback(
    (delta: Punkt) => {
      const inhalt = stageRef.current?.content;
      if (!inhalt) return;
      const r = inhalt.getBoundingClientRect();
      const z = zeigerRef.current;
      zeigerRef.current = {
        x: Math.min(1, Math.max(0, z.x + delta.x / Math.max(1, r.width))),
        y: Math.min(1, Math.max(0, z.y + delta.y / Math.max(1, r.height))),
      };
      artRef.current = 'maus';
      verbirgHinweis();
      anfordern();
    },
    [stageRef, anfordern, verbirgHinweis]
  );

  // ── Einschalten: Startpunkt, Hinweis, Größe ──────────────────────────
  useEffect(() => {
    if (!aktiv) return;
    const grob = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
    artRef.current = grob ? 'finger' : 'maus';
    zeigerRef.current = aktuell.current.start ?? { x: 0.5, y: 0.45 };
    setDurchmesser(linsenDurchmesser(document.documentElement.clientWidth));
    let hinweisTimer: ReturnType<typeof setTimeout> | undefined;
    if (!hinweisSchonGezeigt) {
      hinweisSchonGezeigt = true;
      hinweisAnRef.current = true;
      setHinweis(artRef.current);
      hinweisTimer = setTimeout(verbirgHinweis, 9000);
    }
    anfordern();
    return () => {
      clearTimeout(hinweisTimer);
      hinweisAnRef.current = false;
      setHinweis(null);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [aktiv, anfordern, verbirgHinweis]);

  // Neu zeichnen, sobald sich etwas ändert, das die Linse betrifft.
  useEffect(() => {
    if (aktiv) anfordern();
  }, [aktiv, staerke, durchmesser, bereit, gedrueckt, anfordern]);

  // ── Zwischenspeicher: hochauflösende Aufnahme der Vorschau ───────────
  useEffect(() => {
    if (!aktiv) return;
    let versuche = 0;
    let wiederholung: ReturnType<typeof setTimeout> | undefined;

    const aufnehmen = () => {
      clearTimeout(wiederholung);
      const stage = stageRef.current;
      if (!stage) return;
      const { pixelRatio } = berechneSchnappschussPixelRatio({
        stageScale: aktuell.current.stageScale,
        logischeBreite: CANVAS_WIDTH,
        logischeHoehe: CANVAS_HEIGHT,
      });
      const ergebnis = erzeugeSchnappschuss(stage, { pixelRatio, erzwingen: versuche >= SCHNAPPSCHUSS_MAX_NEUVERSUCHE });
      if (ergebnis.status === 'wartet') {
        // Foto oder Logo lädt noch: kurz warten und erneut versuchen.
        versuche += 1;
        wiederholung = setTimeout(aufnehmen, SCHNAPPSCHUSS_NEUVERSUCH_MS);
        return;
      }
      versuche = 0;
      if (ergebnis.status !== 'bereit') return;
      const alt = schnappRef.current;
      schnappRef.current = ergebnis.canvas;
      if (alt && alt !== ergebnis.canvas) alt.width = 0; // Speicher des alten Bildes freigeben
      setBereit(true);
      anfordern();
    };

    const entprellt = entprelle(aufnehmen, SCHNAPPSCHUSS_ENTPRELLUNG_MS);
    entprelltRef.current = entprellt;
    letzterSchluesselRef.current = schluessel;
    entprellt.sofort();
    // Webschriften, die erst nach dem ersten Zeichnen fertig werden, verändern Texte: neu aufnehmen.
    const schriftFertig = () => entprellt.aufrufen();
    document.fonts?.addEventListener?.('loadingdone', schriftFertig);

    return () => {
      entprellt.abbrechen();
      clearTimeout(wiederholung);
      entprelltRef.current = null;
      document.fonts?.removeEventListener?.('loadingdone', schriftFertig);
      if (schnappRef.current) schnappRef.current.width = 0;
      schnappRef.current = null;
      setBereit(false);
    };
    // `schluessel` bewusst nicht in den Abhängigkeiten: Änderungen behandelt der nächste Effekt (entprellt).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktiv, stageRef, anfordern]);

  useEffect(() => {
    if (!aktiv || letzterSchluesselRef.current === schluessel) return;
    letzterSchluesselRef.current = schluessel;
    entprelltRef.current?.aufrufen();
  }, [aktiv, schluessel]);

  // ── Eingaben: Maus/Stift, Finger ─────────────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!aktiv || !container) return;

    const beiZeigerBewegung = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return; // Finger laufen über die Touch-Ereignisse unten
      setzeZeiger(e.clientX, e.clientY, 'maus');
    };
    const beiZeigerUnten = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setGedrueckt(true);
    };
    const beiZeigerOben = () => setGedrueckt(false);

    // Finger: Die Lupe übernimmt das Ziehen. Das Ereignis wird abgefangen, bevor Konva es sieht (sonst würde ein Motiv
    // verschoben) und das Scrollen der Seite wird unterbunden (nicht-passiver Listener + preventDefault).
    const beiBeruehrung = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const finger = e.touches[0];
      if (finger) setzeZeiger(finger.clientX, finger.clientY, 'finger');
    };
    const beiBeruehrungEnde = (e: TouchEvent) => {
      e.preventDefault(); // verhindert das nachgereichte „Klick“-Ereignis (würde Konva auswählen/abwählen lassen)
      e.stopPropagation();
    };
    const beiScroll = () => anfordern();

    const vorherigesTouchAction = container.style.touchAction;
    container.style.touchAction = 'none';
    container.addEventListener('pointermove', beiZeigerBewegung);
    container.addEventListener('pointerdown', beiZeigerUnten);
    window.addEventListener('pointerup', beiZeigerOben);
    window.addEventListener('pointercancel', beiZeigerOben);
    container.addEventListener('touchstart', beiBeruehrung, { passive: false, capture: true });
    container.addEventListener('touchmove', beiBeruehrung, { passive: false, capture: true });
    container.addEventListener('touchend', beiBeruehrungEnde, { passive: false, capture: true });
    container.addEventListener('scroll', beiScroll, { passive: true });

    return () => {
      container.style.touchAction = vorherigesTouchAction;
      container.removeEventListener('pointermove', beiZeigerBewegung);
      container.removeEventListener('pointerdown', beiZeigerUnten);
      window.removeEventListener('pointerup', beiZeigerOben);
      window.removeEventListener('pointercancel', beiZeigerOben);
      container.removeEventListener('touchstart', beiBeruehrung, { capture: true });
      container.removeEventListener('touchmove', beiBeruehrung, { capture: true });
      container.removeEventListener('touchend', beiBeruehrungEnde, { capture: true });
      container.removeEventListener('scroll', beiScroll);
      setGedrueckt(false);
    };
  }, [aktiv, containerRef, setzeZeiger, anfordern]);

  // Größe der Vorschau ändert sich (Fenster, Zoom, Spaltenbreite): Linse neu ausrichten.
  useEffect(() => {
    if (!aktiv) return;
    const beobachter = typeof ResizeObserver === 'function' ? new ResizeObserver(() => anfordern()) : null;
    for (const element of [containerRef.current, stageRef.current?.content, huelleRef.current]) {
      if (element) beobachter?.observe(element);
    }
    const beiFensterGroesse = () => {
      setDurchmesser(linsenDurchmesser(document.documentElement.clientWidth));
      anfordern();
    };
    window.addEventListener('resize', beiFensterGroesse);
    return () => {
      beobachter?.disconnect();
      window.removeEventListener('resize', beiFensterGroesse);
    };
  }, [aktiv, containerRef, stageRef, huelleRef, anfordern]);

  // ── Tastatur ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aktiv) return;
    const beiTaste = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Ein offener Dialog (Warenkorb, Vergleich) schließt zuerst – nicht beides auf einmal.
        if (document.querySelector('[aria-modal="true"]')) return;
        schliesse();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // Pfeile/Plus/Minus gehören der Lupe nur, wenn der Fokus auf dem Lupe-Knopf oder in der Lupenleiste liegt.
      // Sonst bleiben die Pfeiltasten wie bisher zum Feinverschieben des ausgewählten Motivs da.
      const ziel = e.target instanceof Element ? e.target : null;
      if (!ziel?.closest('[data-lupe-tasten]')) return;
      const schritt = tastenSchritt(e.key, e.shiftKey);
      if (schritt) {
        e.preventDefault();
        e.stopPropagation();
        verschiebeUm(schritt);
        return;
      }
      const richtung = tastenStaerkeRichtung(e.key);
      if (richtung) {
        e.preventDefault();
        e.stopPropagation();
        setStaerke((s) => naechsteStaerke(s, richtung));
      }
    };
    // Aufnahmephase am Fenster: läuft vor dem Tastenkürzel-Handler des Konfigurators (Pfeile = Motiv verschieben).
    window.addEventListener('keydown', beiTaste, true);
    return () => window.removeEventListener('keydown', beiTaste, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktiv, verschiebeUm]);

  /** Schließt die Lupe; lag der Fokus in der Lupenleiste (verschwindet gleich), geht er zurück auf den Lupe-Knopf. */
  function schliesse() {
    const fokus = document.activeElement;
    if (fokus && leisteRef.current?.contains(fokus)) {
      document.querySelector<HTMLElement>('[data-lupe-schalter]')?.focus();
    }
    aktuell.current.onSchliessen();
  }

  if (!aktiv) return null;

  const innen = linsenInnenDurchmesser(durchmesser);
  const linseSichtbar = bereit && !gedrueckt;
  const staerkeAnzeige = staerkeText(staerke, sprache);

  return (
    <>
      {/* Linse: dekorativ (aria-hidden) – dieselben Informationen stehen im Bild selbst. Reagiert nicht auf Zeigerereignisse,
          damit Klicks und Ziehen darunter ankommen. */}
      <div
        ref={linseRef}
        aria-hidden="true"
        data-lupe-linse
        className={clsx(
          'pointer-events-none absolute left-0 top-0 z-30 rounded-full bg-white transition-opacity duration-150',
          linseSichtbar ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          width: durchmesser,
          height: durchmesser,
          padding: LINSE_RAND_PX,
          transform: 'translate3d(-9999px, -9999px, 0)',
          willChange: 'transform',
          // Weicher Schatten + hauchdünne dunkle Kontur: Der weiße Rand bleibt auch auf hellem Textil erkennbar.
          boxShadow: '0 14px 34px rgba(20,18,16,0.38), 0 3px 8px rgba(20,18,16,0.24), 0 0 0 1px rgba(20,18,16,0.16)',
        }}
      >
        <canvas ref={canvasRef} className="block rounded-full" style={{ width: innen, height: innen }} />
      </div>

      {/* Bedienleiste unten rechts an der Vorschau (wie das „x“ auf dem Vorbildfoto) */}
      <div
        ref={leisteRef}
        role="group"
        aria-label={t('lupe_gruppe')}
        data-lupe-tasten
        className="absolute z-40 flex w-max flex-col items-end gap-1.5"
        style={{ left: 0, top: 0, transform: 'translate(-100%, -100%)' }}
      >
        {hinweis && (
          <p role="note" className="rounded-lg bg-brand/90 px-3 py-2 text-xs leading-snug text-white shadow-lg">
            {t(hinweis === 'finger' ? 'lupe_hinweis_finger' : 'lupe_hinweis_maus')}
          </p>
        )}
        <div className="flex items-center gap-0.5 rounded-full border border-brand/15 bg-white/95 p-0.5 shadow-lg backdrop-blur">
          <LeistenKnopf label={t('lupe_schwaecher')} onClick={() => setStaerke((s) => naechsteStaerke(s, -1))}>
            <Minus className="h-4 w-4" aria-hidden />
          </LeistenKnopf>
          <span
            data-lupe-staerke
            aria-live="polite"
            className="min-w-[2.6rem] select-none text-center text-xs font-semibold tabular-nums text-brand"
          >
            <span className="sr-only">{t('lupe_vergroesserung')} </span>
            {staerkeAnzeige}
          </span>
          <LeistenKnopf label={t('lupe_staerker')} onClick={() => setStaerke((s) => naechsteStaerke(s, 1))}>
            <Plus className="h-4 w-4" aria-hidden />
          </LeistenKnopf>
          <LeistenKnopf label={t('lupe_schliessen')} onClick={schliesse}>
            <X className="h-4 w-4" aria-hidden />
          </LeistenKnopf>
        </div>
      </div>

      <p role="status" className="sr-only">
        {t('lupe_status_an')}
      </p>
    </>
  );
}

function LeistenKnopf({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-8 w-8 items-center justify-center rounded-full text-brand transition-colors hover:bg-cream-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold-dark"
    >
      {children}
    </button>
  );
}
