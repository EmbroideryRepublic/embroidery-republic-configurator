import type { StateStorage } from 'zustand/middleware';

/**
 * localStorage kann voll laufen (v.a. durch Logo-Bilddaten als Base64) und
 * wirft dann einen QuotaExceededError. Ohne Abfangen crasht das komplett
 * unbeteiligte Speichern-im-Hintergrund die ganze Interaktion – der Nutzer
 * verliert seine Arbeit mitten im Konfigurieren. Dieser Wrapper fängt das
 * ab: schlägt das Speichern fehl, wird es leise übersprungen (die
 * Konfiguration bleibt im Arbeitsspeicher/dieser Sitzung voll nutzbar,
 * nur die Wiederherstellung nach einem Neuladen der Seite kann dann
 * unvollständig sein).
 */
export const safeLocalStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch (err) {
      console.warn(
        `Konfiguration konnte nicht gespeichert werden (Speicherplatz voll?). ` +
          `Die Sitzung bleibt nutzbar, geht aber bei einem Neuladen der Seite verloren.`,
        err
      );
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignorieren
    }
  },
};
