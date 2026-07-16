import Link from 'next/link';
import { Mail, Phone, MapPin } from 'lucide-react';

export const metadata = { title: 'Kontakt | Embroidery Republic Germany' };

export default function KontaktPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <Link href="/" className="text-xs text-gold-dark hover:underline">
        ← Zurück zum Konfigurator
      </Link>

      <h1 className="mb-1 mt-4 font-serif text-2xl font-semibold text-brand">Kontakt</h1>
      <p className="mb-6 text-sm text-brand/60">
        Fragen zu deiner Konfiguration, Mengenrabatten oder einer individuellen Anfrage? Wir
        melden uns persönlich zurück.
      </p>

      <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Platzhalter-Kontaktdaten.</strong> Bitte durch echte E-Mail-Adresse, Telefonnummer
        und Anschrift ersetzen.
      </div>

      <div className="space-y-4 text-sm text-brand/80">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-light text-gold-dark">
            <Mail className="h-4 w-4" />
          </span>
          [E-Mail-Adresse einsetzen]
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-light text-gold-dark">
            <Phone className="h-4 w-4" />
          </span>
          [Telefonnummer einsetzen]
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold-light text-gold-dark">
            <MapPin className="h-4 w-4" />
          </span>
          [Anschrift einsetzen]
        </div>
      </div>

      <p className="mt-8 text-xs text-brand/40">
        Ein echtes Kontaktformular mit Versand folgt zusammen mit der Bestellprozess-Anbindung
        (siehe Architektur-Roadmap).
      </p>
    </main>
  );
}
