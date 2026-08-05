/**
 * Zentrale Lieferanten-Registry – die EINZIGE Stelle, an der Lieferanten
 * beschrieben und ihren Adaptern zugeordnet werden.
 *
 * `SupplierId` ist eine OFFENE ID (`string`, ADR 0004) – ein neuer Lieferant ist
 * rein additiv (Descriptor hier + Mapping-Tabelle + Config). Vollständigkeit
 * erzwingt daher NICHT mehr der Compiler, sondern der Wächter-Test
 * (`__tests__/registry.test.ts`): Adapter- und Mapping-Registry müssen dieselben
 * Lieferanten abdecken, und jede real genutzte `supplierId` muss registriert sein
 * – sonst wirft der fail-loud-Resolver erst zur Laufzeit.
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

/** Lieferanten-Descriptor. Fail-loud: unbekannte ID wirft mit klarer Meldung
 *  (SupplierId ist offen; Wächter-Test sichert die Registrierung). */
export function getSupplierDescriptor(id: SupplierId): SupplierDescriptor {
  const descriptor = SUPPLIERS[id];
  if (!descriptor) {
    throw new Error(`Kein Lieferant "${id}" registriert (registry.ts).`);
  }
  return descriptor;
}

export function createSupplierAdapter(id: SupplierId): SupplierAdapter {
  return getSupplierDescriptor(id).createAdapter();
}

/** Liest die Konto-Zugangsdaten eines Lieferanten aus der Umgebung.
 *  Wirft bewusst früh und mit klarer Meldung, statt dass der Worker
 *  später mitten im Browser-Lauf an einem leeren Loginfeld scheitert. */
export function getSupplierCredentials(id: SupplierId): SupplierCredentials {
  const descriptor = getSupplierDescriptor(id);
  const { username: userVar, password: passVar } = descriptor.credentialsEnv;
  const username = process.env[userVar];
  const password = process.env[passVar];
  if (!username || !password) {
    throw new Error(
      `Zugangsdaten für "${descriptor.label}" fehlen – bitte ${userVar} und ${passVar} in .env.local setzen.`
    );
  }
  return { username, password };
}
