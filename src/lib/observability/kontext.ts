/**
 * ═══════════════════════════════════════════════════════════════════════
 * ANFRAGEKONTEXT – Request-ID über den gesamten Lebenszyklus
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Trägt eine Kennung durch alle Funktionen einer Anfrage, ohne sie durch
 * jede Signatur reichen zu müssen.
 *
 * ── Warum AsyncLocalStorage ───────────────────────────────────────────
 * Die Alternative wäre, die Kennung als Parameter überall mitzugeben. Das
 * berührt jede Funktion, auch solche, die mit Protokollierung nichts zu tun
 * haben – und beim ersten vergessenen Durchreichen bricht die Kette.
 *
 * `AsyncLocalStorage` hält den Wert über `await`-Grenzen hinweg. Jede
 * Funktion, die tiefer im Aufruf liegt, sieht denselben Kontext, ohne davon
 * zu wissen.
 *
 * ── Bestellnummer kommt später dazu ───────────────────────────────────
 * Beim Eintreffen der Anfrage ist noch keine Bestellung bekannt. Sobald sie
 * entsteht, wird sie über `merkeBestellung()` nachgetragen – ab da erscheint
 * sie in jedem weiteren Protokolleintrag derselben Anfrage.
 *
 * Damit lässt sich ein Ablauf von zwei Seiten rekonstruieren: über die
 * Anfrage-Kennung („was geschah in diesem Aufruf?") und über die
 * Bestellnummer („was geschah mit dieser Bestellung?").
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import { randomBytes } from 'node:crypto';

export interface AnfrageKontext {
  /** Acht Zeichen – kurz genug fürs Auge, eindeutig genug für den Betrieb. */
  anfrageId: string;
  /** Sobald bekannt: die Bestellnummer. */
  bestellnummer?: string;
  /** Für die Laufzeitmessung. */
  beginn: number;
}

const speicher = new AsyncLocalStorage<AnfrageKontext>();

/** Erzeugt eine neue Anfrage-Kennung. */
export function neueAnfrageId(): string {
  return randomBytes(4).toString('hex');
}

/**
 * Führt eine Funktion innerhalb eines Anfragekontexts aus.
 *
 * Alles, was darin aufgerufen wird – auch über `await` hinweg –, sieht
 * dieselbe Kennung.
 */
export function mitAnfrageKontext<T>(fn: () => T, anfrageId = neueAnfrageId()): T {
  return speicher.run({ anfrageId, beginn: Date.now() }, fn);
}

/** Der aktuelle Kontext, oder undefined außerhalb einer Anfrage. */
export function aktuellerKontext(): AnfrageKontext | undefined {
  return speicher.getStore();
}

/**
 * Trägt die Bestellnummer nach.
 *
 * Ab diesem Punkt erscheint sie in jedem Protokolleintrag derselben Anfrage.
 * Ohne aktiven Kontext (z.B. in einem Skript) passiert nichts – das ist kein
 * Fehler, nur weniger Zusammenhang.
 */
export function merkeBestellung(bestellnummer: string): void {
  const kontext = speicher.getStore();
  if (kontext) kontext.bestellnummer = bestellnummer;
}

/** Millisekunden seit Beginn der Anfrage. 0 außerhalb eines Kontexts. */
export function laufzeitMs(): number {
  const kontext = speicher.getStore();
  return kontext ? Date.now() - kontext.beginn : 0;
}
