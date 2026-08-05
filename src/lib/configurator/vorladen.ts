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
import { resolveColorImages, repraesentativBildVon } from '@/lib/assets';

const angestossen = new Set<string>();

function lade(url: string): void {
  if (!url || angestossen.has(url)) return;
  angestossen.add(url);
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
}

/** Alle vorhandenen Ansichten der ersten Farbe – das, was beim Öffnen eines
 *  Modells zählt. Iteriert über die tatsächlich geführten Ansichten des
 *  Produkts (keine feste front/back/sleeve-Annahme). */
export function vorladenModell(p: ProductConfig): void {
  if (typeof window === 'undefined') return;
  const farbe = p.colors[0];
  if (!farbe) return;
  for (const url of Object.values(resolveColorImages(p.id, farbe.id))) lade(url);
}

/** Repräsentativbilder mehrerer Modelle – beim Öffnen einer Produktart. */
export function vorladenListe(produkte: ProductConfig[]): void {
  if (typeof window === 'undefined') return;
  for (const p of produkte) {
    const farbe = p.colors[0];
    if (!farbe) continue;
    const rep = repraesentativBildVon(p.id, farbe.id);
    if (rep) lade(rep);
  }
}

/** Sämtliche Farbansichten eines Modells – wenn es im Konfigurator liegt. */
export function vorladenAlleFarben(p: ProductConfig): void {
  if (typeof window === 'undefined') return;
  for (const farbe of p.colors) {
    for (const url of Object.values(resolveColorImages(p.id, farbe.id))) lade(url);
  }
}

