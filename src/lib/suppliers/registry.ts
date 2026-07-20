/**
 * Zentrale Lieferanten-Registry – die EINZIGE Stelle, an der Lieferanten
 * beschrieben und ihren Adaptern zugeordnet werden.
 *
 * `Record<SupplierId, …>` erzwingt Vollständigkeit: wird die SupplierId-
 * Union in types.ts um einen Lieferanten erweitert, kompiliert das Projekt
 * erst wieder, wenn hier auch sein Descriptor eingetragen ist.
 */
import type { SupplierAdapter } from './adapters/SupplierAdapter';
import { TextilGrosshandelAdapter } from './adapters/TextilGrosshandelAdapter';
import { WordansAdapter } from './adapters/WordansAdapter';
import { NeedenAdapter } from './adapters/NeedenAdapter';
import { RalawiseAdapter } from './adapters/RalawiseAdapter';
import type { SupplierCredentials, SupplierId } from './types';

export interface SupplierDescriptor {
  id: SupplierId;
  /** Anzeigename für Admin-UI und Logs. */
  label: string;
  baseUrl: string;
  /** Namen der env-Variablen mit den Konto-Zugangsdaten – die Werte
   *  selbst leben ausschließlich in .env.local, nie im Code. */
  credentialsEnv: { username: string; password: string };
  /** Factory statt Singleton: jeder Worker-Lauf bekommt eine frische
   *  Adapter-Instanz (kein geteilter Zustand zwischen Jobs). */
  createAdapter: () => SupplierAdapter;
}

export const SUPPLIERS: Record<SupplierId, SupplierDescriptor> = {
  'textil-grosshandel': {
    id: 'textil-grosshandel',
    label: 'Textil-Großhandel (textil-grosshandel.eu)',
    baseUrl: 'https://www.textil-grosshandel.eu',
    credentialsEnv: { username: 'SUPPLIER_TG_USERNAME', password: 'SUPPLIER_TG_PASSWORD' },
    createAdapter: () => new TextilGrosshandelAdapter(),
  },
  wordans: {
    id: 'wordans',
    label: 'Wordans (wordans.de)',
    baseUrl: 'https://www.wordans.de',
    credentialsEnv: { username: 'SUPPLIER_WORDANS_USERNAME', password: 'SUPPLIER_WORDANS_PASSWORD' },
    createAdapter: () => new WordansAdapter(),
  },
  needen: {
    id: 'needen',
    label: 'Needen (needen.de)',
    baseUrl: 'https://www.needen.de',
    credentialsEnv: { username: 'SUPPLIER_NEEDEN_USERNAME', password: 'SUPPLIER_NEEDEN_PASSWORD' },
    createAdapter: () => new NeedenAdapter(),
  },
  ralawise: {
    id: 'ralawise',
    label: 'Ralawise (ralawise.com)',
    baseUrl: 'https://www.ralawise.com',
    credentialsEnv: { username: 'SUPPLIER_RALAWISE_USERNAME', password: 'SUPPLIER_RALAWISE_PASSWORD' },
    createAdapter: () => new RalawiseAdapter(),
  },
};

export function getSupplierDescriptor(id: SupplierId): SupplierDescriptor {
  return SUPPLIERS[id];
}

export function createSupplierAdapter(id: SupplierId): SupplierAdapter {
  return SUPPLIERS[id].createAdapter();
}

/** Liest die Konto-Zugangsdaten eines Lieferanten aus der Umgebung.
 *  Wirft bewusst früh und mit klarer Meldung, statt dass der Worker
 *  später mitten im Browser-Lauf an einem leeren Loginfeld scheitert. */
export function getSupplierCredentials(id: SupplierId): SupplierCredentials {
  const { username: userVar, password: passVar } = SUPPLIERS[id].credentialsEnv;
  const username = process.env[userVar];
  const password = process.env[passVar];
  if (!username || !password) {
    throw new Error(
      `Zugangsdaten für "${SUPPLIERS[id].label}" fehlen – bitte ${userVar} und ${passVar} in .env.local setzen.`
    );
  }
  return { username, password };
}
