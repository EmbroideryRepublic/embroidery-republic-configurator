/**
 * Bewusst auf Systemschriften beschränkt (keine Google-Fonts-Nachladung
 * beim Build/Runtime nötig – vermeidet zusätzliche Netzwerkabhängigkeiten
 * für dieses Werkzeug). Eigene Web-Fonts können hier später ergänzt werden.
 */
export const AVAILABLE_FONTS = [
  'Arial',
  'Helvetica',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Verdana',
  'Trebuchet MS',
  'Impact',
] as const;

export type AvailableFont = (typeof AVAILABLE_FONTS)[number];
