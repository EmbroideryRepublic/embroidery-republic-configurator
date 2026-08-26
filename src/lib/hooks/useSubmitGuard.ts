'use client';

import { useCallback, useRef, useState } from 'react';

/**
 * ABSICHERUNG EINES ABSENDEVORGANGS (Bestellung, Anfrage).
 *
 * Kapselt die vier Dinge, die beim Abschicken schiefgehen können, an EINER
 * Stelle – statt sie in jedem Formular erneut (und unterschiedlich) zu lösen:
 *
 *  1. MEHRFACHKLICK. Ein deaktivierter Knopf allein genügt nicht: React setzt
 *     Zustand asynchron, und zwischen Klick und Neuzeichnen passen weitere
 *     Klicks – ebenso löst die Eingabetaste im Formular ein Absenden aus, ohne
 *     dass der Knopf berührt wird. Die Sperre liegt deshalb in einer Ref und
 *     wirkt SOFORT, nicht erst beim nächsten Rendern.
 *
 *  2. WIEDERHOLUNG NACH ABBRUCH. Jeder Absendevorgang bekommt eine Kennung,
 *     die über alle Wiederholungen hinweg gleich bleibt. Der Server erkennt
 *     daran eine Wiederholung und gibt die bereits angelegte Bestellung
 *     zurück, statt eine zweite zu erzeugen (Migration 0011).
 *
 *     Sie liegt im `localStorage` und damit BEWUSST nicht im Formularzustand:
 *     sie muss ein Neuladen der Seite überleben. Bricht die Verbindung mitten
 *     in der Absendung ab, lädt die Kundschaft erfahrungsgemäß neu, statt
 *     erneut zu klicken – eine Kennung im Formularzustand wäre dann verloren
 *     und die Bestellung entstünde ein zweites Mal.
 *
 *     Auch nicht im Warenkorb-Store: der schreibt asynchron nach IndexedDB,
 *     und die Kennung ist kein Warenkorbinhalt, sondern gehört zum
 *     Absendevorgang. `localStorage` schreibt synchron und hält beides
 *     getrennt.
 *
 *  3. ZEITÜBERSCHREITUNG. Ohne Grenze wartet die Kundschaft unbegrenzt auf
 *     eine Antwort, die nie kommt. Nach Ablauf wird eine Meldung gezeigt, die
 *     den entscheidenden Punkt benennt: erneut absenden ist gefahrlos.
 *
 *  4. VERBINDUNGSABBRUCH. Ein Netzwerkfehler wird als solcher benannt, nicht
 *     als anonymer Fehlschlag.
 *
 * Nach einem ERFOLG muss die Kennung verworfen werden, damit ein späterer,
 * inhaltlich neuer Absendevorgang nicht fälschlich als Wiederholung des
 * vorherigen gilt. Dafür ist `reset()` zuständig.
 */

/**
 * Wartezeit, bis ein Absendevorgang als hängend gilt.
 *
 * Bewusst großzügig: Der Server legt die Bestellung an, erzeugt
 * Druckvorschauen, lädt Dateien hoch, baut das Produktionsblatt und
 * verschickt E-Mails. Eine zu knappe Grenze würde erfolgreiche Bestellungen
 * als Fehler melden – der teurere Irrtum von beiden.
 */
export const ABSENDE_ZEITGRENZE_MS = 60_000;

export type SubmitGuardFehlerart = 'timeout' | 'offline' | 'unbekannt';

export interface SubmitGuardTexte {
  /** Zeitüberschreitung – muss erwähnen, dass erneutes Senden gefahrlos ist. */
  timeout: string;
  /** Keine Verbindung. */
  offline: string;
  /** Alles Übrige. */
  fallback: string;
}

export interface SubmitGuard {
  isSubmitting: boolean;
  error: string | null;
  setError: (nachricht: string | null) => void;
  /**
   * Führt den Absendevorgang genau einmal gleichzeitig aus. Der Rückruf
   * bekommt die Kennung, die er unverändert an den Server weiterreicht.
   *
   * Rückgabe: das Ergebnis, oder `undefined`, wenn abgewiesen (läuft bereits)
   * oder fehlgeschlagen – in beiden Fällen ist `error` bereits gesetzt.
   */
  submit: <T>(aufruf: (clientRequestId: string) => Promise<T>) => Promise<T | undefined>;
  /**
   * Nach ERFOLG aufrufen: löst die Sperre und verwirft die Absendekennung.
   * Ohne das Verwerfen würde der nächste, inhaltlich neue Vorgang dieselbe
   * Kennung tragen und vom Server als Wiederholung behandelt.
   */
  reset: () => void;
}

/** Erkennt einen Verbindungsabbruch, soweit das im Browser möglich ist. */
function istVerbindungsfehler(fehler: unknown): boolean {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true;
  return fehler instanceof TypeError; // fetch scheitert netzwerkseitig als TypeError
}

class Zeitueberschreitung extends Error {}

function erzeugeKennung(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  // Fallback für Umgebungen ohne Web-Crypto (kein sicherer Kontext). Muss
  // nicht kryptografisch sicher sein, nur praktisch eindeutig – sie dient
  // allein dem Wiedererkennen der eigenen Wiederholung.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
}

/**
 * Liest die Kennung oder legt sie an. Schlägt der Zugriff fehl (privater
 * Modus, Speicher voll), wird eine flüchtige Kennung erzeugt: der Schutz ist
 * dann schwächer, aber die Bestellung bleibt möglich. Ein Doppelschutz darf
 * nie selbst zum Hindernis werden.
 */
function holeOderErzeuge(schluessel: string): string {
  try {
    const vorhanden = window.localStorage.getItem(schluessel);
    if (vorhanden) return vorhanden;
    const neue = erzeugeKennung();
    window.localStorage.setItem(schluessel, neue);
    return neue;
  } catch {
    return erzeugeKennung();
  }
}

function verwirf(schluessel: string): void {
  try {
    window.localStorage.removeItem(schluessel);
  } catch {
    /* nichts zu tun – siehe holeOderErzeuge */
  }
}

/**
 * Verwirft eine gespeicherte Absendekennung anhand ihres Schlüssels, OHNE
 * eine Hook-Instanz zu brauchen – reine `localStorage`-Operation, keine
 * React-Zustandsänderung.
 *
 * Wird gebraucht, wenn der Server einen Absendevorgang bereits ENDGÜLTIG
 * abgeschlossen hat (Bestellung angelegt), die aufrufende Komponente aber
 * zu diesem Zeitpunkt bereits unmounted sein könnte (z.B. Schublade während
 * der Übermittlung per X/Escape/Overlay-Klick geschlossen) – `reset()` aus
 * `useSubmitGuard()` selbst ist an die Hook-Instanz gebunden und aktualisiert
 * React-State, was nach einem Unmount nicht mehr sicher aufrufbar ist.
 *
 * Fund vom 2026-08-26 (Produktionsreife-Audit): Ohne diesen von der
 * Komponenten-Lebensdauer entkoppelten Weg blieb die Kennung nach einem
 * währenddessen geschlossenen Warenkorb-Drawer dauerhaft in `localStorage`
 * stehen – ein späterer, inhaltlich NEUER Bestellversuch in derselben
 * Browser-Sitzung wurde dadurch fälschlich als Wiederholung erkannt und der
 * Server lieferte die ALTE Bestellung zurück, ohne den neuen Warenkorb-
 * Inhalt je zu speichern.
 */
export function verwirfGespeicherteKennung(schluessel: string): void {
  verwirf(schluessel);
}

/**
 * @param texte      Anzeigetexte je Fehlerart.
 * @param schluessel Speicherschlüssel der Absendekennung. Je Vorgangsart
 *                   EIGEN wählen (Bestellung ≠ Anfrage), sonst würde eine
 *                   Bestellung nach einer Anfrage fälschlich als deren
 *                   Wiederholung gelten.
 */
export function useSubmitGuard(texte: SubmitGuardTexte, schluessel: string): SubmitGuard {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Die Sperre bewusst als Ref: sie muss SOFORT gelten, nicht erst nach dem
  // nächsten Rendern.
  const laeuft = useRef(false);
  const schluesselRef = useRef(schluessel);
  schluesselRef.current = schluessel;
  // Die Texte kommen aus der Übersetzung und sind bei jedem Rendern ein neues
  // Objekt. Über eine Ref bleibt `submit` stabil, ohne dass veraltete Texte
  // angezeigt werden.
  const texteRef = useRef(texte);
  texteRef.current = texte;

  const reset = useCallback(() => {
    verwirf(schluesselRef.current);
    laeuft.current = false;
    setIsSubmitting(false);
  }, []);

  const submit = useCallback(
    async <T,>(aufruf: (clientRequestId: string) => Promise<T>): Promise<T | undefined> => {
      // Zweiter Klick, während der erste noch läuft: stillschweigend
      // verwerfen. Eine Fehlermeldung wäre hier falsch – es ist kein Fehler,
      // sondern schlicht schon unterwegs.
      if (laeuft.current) return undefined;
      laeuft.current = true;
      setIsSubmitting(true);
      setError(null);

      // Beim ERSTEN Versuch erzeugt, danach unverändert wiederverwendet –
      // auch über ein Neuladen der Seite hinweg.
      const kennung = holeOderErzeuge(schluesselRef.current);

      let zeitgeber: ReturnType<typeof setTimeout> | undefined;
      try {
        const ergebnis = await Promise.race([
          aufruf(kennung),
          new Promise<never>((_, ablehnen) => {
            zeitgeber = setTimeout(() => ablehnen(new Zeitueberschreitung()), ABSENDE_ZEITGRENZE_MS);
          }),
        ]);
        return ergebnis;
      } catch (fehler) {
        const art: SubmitGuardFehlerart =
          fehler instanceof Zeitueberschreitung ? 'timeout' : istVerbindungsfehler(fehler) ? 'offline' : 'unbekannt';
        setError(texteRef.current[art === 'unbekannt' ? 'fallback' : art]);
        if (art === 'unbekannt') console.error('[submit] Absenden fehlgeschlagen:', fehler);
        return undefined;
      } finally {
        if (zeitgeber) clearTimeout(zeitgeber);
        laeuft.current = false;
        setIsSubmitting(false);
      }
    },
    []
  );

  return { isSubmitting, error, setError, submit, reset };
}
