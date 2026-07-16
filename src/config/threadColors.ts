/**
 * Realistische Einschränkung: beim Sticken gibt es keine Farbverläufe oder
 * Millionen Farbtöne wie beim Druck, sondern ein festes Garnfarben-Sortiment.
 * Diese Palette orientiert sich an gängigen Standard-Garnfarben (grobe
 * Annäherung an verbreitete Isacord/Madeira-Töne) und wird im
 * Stickerei-Konfigurator anstelle des freien Farbwählers angezeigt.
 */
export interface ThreadColor {
  name: string;
  hex: string;
}

export const THREAD_COLORS: ThreadColor[] = [
  { name: 'Weiß', hex: '#ffffff' },
  { name: 'Schwarz', hex: '#000000' },
  { name: 'Rot', hex: '#c8102e' },
  { name: 'Bordeaux', hex: '#6d1f2a' },
  { name: 'Orange', hex: '#e2711d' },
  { name: 'Gold', hex: '#d4af37' },
  { name: 'Gelb', hex: '#f2c400' },
  { name: 'Hellgrün', hex: '#7ab648' },
  { name: 'Dunkelgrün', hex: '#22543d' },
  { name: 'Königsblau', hex: '#2b5ea7' },
  { name: 'Marineblau', hex: '#1b2a4a' },
  { name: 'Hellblau', hex: '#5bb8d4' },
  { name: 'Pink', hex: '#e0559a' },
  { name: 'Lila', hex: '#6a3d9a' },
  { name: 'Grau', hex: '#8a8d8f' },
  { name: 'Silber', hex: '#c0c0c0' },
];
