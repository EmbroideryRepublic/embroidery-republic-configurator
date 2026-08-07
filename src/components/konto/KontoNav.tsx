'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, Package } from 'lucide-react';
import { AbmeldenButton } from './AbmeldenButton';

const TABS = [
  { href: '/konto', label: 'Übersicht', icon: User, exact: true },
  { href: '/konto/bestellungen', label: 'Bestellungen', icon: Package },
  { href: '/konto/adressen', label: 'Adressen', icon: MapPin },
  { href: '/konto/profil', label: 'Profil', icon: User },
];

export function KontoNav() {
  const pathname = usePathname();
  return (
    <div className="mb-8 flex items-center justify-between border-b border-gold/20 pb-3">
      <nav className="flex gap-1 overflow-x-auto" aria-label="Kontobereiche">
        {TABS.map((tab) => {
          const aktiv = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                aktiv ? 'bg-gold text-white' : 'text-brand/60 hover:bg-gold-light/40 hover:text-brand'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </nav>
      <AbmeldenButton />
    </div>
  );
}
