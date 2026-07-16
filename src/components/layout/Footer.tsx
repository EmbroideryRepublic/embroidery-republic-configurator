import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gold/15 bg-white px-4 py-6 text-center text-xs text-brand/40">
      <p className="mb-2 font-serif text-sm text-brand/60">Embroidery Republic Germany</p>
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <Link href="/ueber-uns" className="hover:text-gold-dark">
          Über uns
        </Link>
        <Link href="/faq" className="hover:text-gold-dark">
          FAQ
        </Link>
        <Link href="/kontakt" className="hover:text-gold-dark">
          Kontakt
        </Link>
        <Link href="/impressum" className="hover:text-gold-dark">
          Impressum
        </Link>
        <Link href="/datenschutz" className="hover:text-gold-dark">
          Datenschutz
        </Link>
        <Link href="/agb" className="hover:text-gold-dark">
          AGB
        </Link>
      </nav>
      <p className="mt-3">© {new Date().getFullYear()} Embroidery Republic Germany</p>
    </footer>
  );
}
