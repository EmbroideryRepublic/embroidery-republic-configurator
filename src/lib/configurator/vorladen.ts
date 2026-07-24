/**
 * Bilder im Hintergrund vorladen, damit der Produktwechsel sofort wirkt.
 *
 * Die Vorschau in der Mitte zeigt beim Wechsel dieselbe Bilddatei wie die
 * Modellkarte (`front`) – die ist dann meist schon im Cache. Spürbar wird die
 * Wartezeit erst bei den übrigen Ansichten (Rückseite, Ärmel) und anderen
 * Farben. Genau die holt dieses Modul vorab, sobald der Kunde ein Modell auch
 * nur überfährt oder eine Produktart öffnet.
 *
 * Reiner Cache-Aufwärmer: Jede URL wird höchstens einmal angestoßen, das
 * Ergebnis interessiert nicht – der Browser legt es in seinen Bildcache, aus
 * dem der spätere echte Zugriff bedient wird. Kein Netzwerkzugriff, wenn kein
 * `window` da ist (SSR).
 */
import type { ProductConfig } from '@/config/products/types';

const angestossen = new Set<string>();

function lade(url: string): void {
  if (!url || angestossen.has(url)) return;
  angestossen.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

/** Alle vier Ansichten der ersten Farbe – das, was beim Öffnen eines Modells zählt. */
export function vorladenModell(p: ProductConfig): void {
  if (typeof window === 'undefined') return;
  const farbe = p.colors[0];
  if (!farbe) return;
  lade(farbe.images.front);
  lade(farbe.images.back);
  lade(farbe.images.sleeve_left);
  lade(farbe.images.sleeve_right);
}

/** Vorderansichten mehrerer Modelle – beim Öffnen einer Produktart. */
export function vorladenListe(produkte: ProductConfig[]): void {
  if (typeof window === 'undefined') return;
  for (const p of produkte) {
    const front = p.colors[0]?.images.front;
    if (front) lade(front);
  }
}

/** Sämtliche Farbansichten eines Modells – wenn es im Konfigurator liegt. */
export function vorladenAlleFarben(p: ProductConfig): void {
  if (typeof window === 'undefined') return;
  for (const farbe of p.colors) {
    lade(farbe.images.front);
    lade(farbe.images.back);
    lade(farbe.images.sleeve_left);
    lade(farbe.images.sleeve_right);
  }
}
