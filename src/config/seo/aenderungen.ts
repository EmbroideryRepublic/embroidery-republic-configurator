/**
 * Datum der letzten INHALTLICHEN Änderung einzelner Seiten – für `lastmod` in der Sitemap.
 *
 * Warum so wenige: Google wertet `lastmod` nur, wenn es verlässlich stimmt. Ein Datum für jede Seite, das bei jedem Abruf der Sitemap neu
 * entsteht, wäre ein falsches Signal (siehe app/sitemap.ts). Darum steht hier nur, was bewusst überarbeitet wurde – mit dem Tag der
 * Überarbeitung. Seiten ohne Eintrag tragen kein `lastmod`.
 *
 * Pflege: Wer den Text einer Seite inhaltlich ändert, trägt hier das Datum ein. Reine Technik- oder Gestaltungsänderungen zählen nicht.
 */
import { VERGLEICH_PRODUKTE } from '@/config/seo/produktPilot';

const ueberarbeitet20261126 = '2026-11-26';

export const LETZTE_AENDERUNG: Readonly<Record<string, string>> = {
  // Produktseiten mit „Im Vergleich“ und „Druckfläche je Größe“ (config/seo/produktPilot.ts)
  ...Object.fromEntries(VERGLEICH_PRODUKTE.map((id) => [`/produkt/${id}`, ueberarbeitet20261126])),
  // Gezielt überarbeitete Seiten (Titel, Beschreibung, Einleitung, Fragen, „Welches Modell passt?“)
  '/longsleeves-bedrucken': ueberarbeitet20261126,
  '/gildan-bedrucken': ueberarbeitet20261126,
  '/jacken-bedrucken': ueberarbeitet20261126,
  '/zip-hoodies-bedrucken': ueberarbeitet20261126,
  '/poloshirts-besticken-bedrucken': ueberarbeitet20261126,
  '/hoodies-bedrucken-besticken': ueberarbeitet20261126,
  '/t-shirts-bedrucken-besticken': ueberarbeitet20261126,
  // Aufgaben getrennt: Selbstgestaltung (Firmenkleidung) und Angebot (Geschäftskunden)
  '/firmenkleidung-bedrucken': ueberarbeitet20261126,
  '/geschaeftskunden': ueberarbeitet20261126,
  '/ueber-uns': ueberarbeitet20261126,
};
