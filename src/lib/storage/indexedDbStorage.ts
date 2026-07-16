import type { StateStorage } from 'zustand/middleware';

/**
 * Speichert die Konfiguration in IndexedDB statt localStorage.
 *
 * Grund: localStorage hat nur ca. 5-10 MB Kapazität (browserabhängig).
 * Hochgeladene Logos werden als Base64-Daten-URLs gespeichert (oft
 * mehrere hundert KB, teils mehrere MB pro Bild) – bereits 2-3 Logos
 * konnten dadurch die localStorage-Kapazität überschreiten
 * (QuotaExceededError), wodurch das Design nicht mehr gespeichert werden
 * konnte. IndexedDB hat ein deutlich größeres Limit (meist 50+ MB, oft
 * ein Anteil des freien Festplattenspeichers) und ist dafür gemacht,
 * größere Datenmengen im Browser zu speichern.
 */
const DB_NAME = 'konfigurator-storage';
const STORE_NAME = 'keyval';
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB nicht verfügbar'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    const request = fn(store);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    tx.oncomplete = () => db.close();
  });
}

/**
 * Kompatibel mit zustand/persist's `StateStorage`-Interface. Fällt bei
 * Fehlern (z.B. IndexedDB nicht verfügbar, privater Modus in manchen
 * Browsern) auf localStorage zurück, damit die App auch dann nicht
 * komplett ohne Zwischenspeicherung dasteht.
 */
export const indexedDbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      const result = await withStore<string | undefined>('readonly', (store) => store.get(name));
      return result ?? null;
    } catch {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
  },
  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await withStore('readwrite', (store) => store.put(value, name));
    } catch (err) {
      console.error('IndexedDB-Speicherung fehlgeschlagen, versuche localStorage:', err);
      try {
        localStorage.setItem(name, value);
      } catch (fallbackErr) {
        console.error('Auch localStorage-Fallback fehlgeschlagen:', fallbackErr);
      }
    }
  },
  removeItem: async (name: string): Promise<void> => {
    try {
      await withStore('readwrite', (store) => store.delete(name));
    } catch {
      try {
        localStorage.removeItem(name);
      } catch {
        // ignorieren
      }
    }
  },
};
