/**
 * Typen des Kundenkontos. Additiv zum bestehenden Gastkauf – siehe
 * supabase/migrations/0023_kundenkonto.sql für die Architekturbegründung.
 */

export interface KundenProfil {
  id: string;
  email: string;
  displayName: string | null;
  phone: string | null;
  company: string | null;
  vatId: string | null;
  avatarUrl: string | null;
  newsletterOptIn: boolean;
  createdAt: string;
}

export interface KundenAdresse {
  id: string;
  label: string | null;
  firstName: string;
  lastName: string;
  company: string | null;
  street: string;
  zip: string;
  city: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

/**
 * Eingabeform beim Anlegen/Bearbeiten – ohne `id`/`isDefault` (eigene
 * Aktion). `label` ist zusätzlich optional: rein dekorativ, ohne
 * Validierungsbedarf, anders als die übrigen (Pflicht-)Adressfelder.
 */
export type KundenAdresseEingabe = Omit<KundenAdresse, 'id' | 'isDefault' | 'label'> & { label?: string | null };

/** Kompakte Zeile für die Bestellhistorie im Konto. */
export interface KundenBestellungZeile {
  id: string;
  bestellnummer: string;
  bestelltAm: string;
  orderType: 'inquiry' | 'order';
  status: string;
  totalPrice: number;
}
