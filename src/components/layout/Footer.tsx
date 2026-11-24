import { Phone, Mail } from 'lucide-react';
import { COMPANY, COMPANY_ADDRESS_LINE } from '@/config/company';
import { SHIPPING_RATES } from '@/config/shipping';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
import { FooterSeoLinks } from '@/components/seo/FooterSeoLinks';
import {
  FooterDescription,
  FooterContactHeading,
  FooterNavColumn,
  FooterLegalColumn,
  FooterInfoColumn,
  FooterFreeShippingLabel,
  FooterBottomTagline,
} from './FooterText';

export function Footer() {
  return (
    <footer className="mt-12 border-t border-brand/10 bg-cream-dark px-4 py-14 text-sm">
      {/* Handy: Navigation und Rechtliches stehen nebeneinander (zwei Spalten), Marke/Kontakt und
          „Gut zu wissen“ über die volle Breite – statt vier Blöcke untereinander (spart rund 200 px). */}
      <div className="mx-auto grid max-w-5xl grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-10 lg:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <p className="text-[19px] font-black uppercase leading-[0.95] tracking-[-0.01em] text-brand">Embroidery<br />Republic</p>
          <p className="mt-1 flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.28em] text-gold-dark"><span aria-hidden className="h-[2px] w-3 bg-gold" />Germany</p>
          <FooterDescription />
          <FooterContactHeading />
          <div className="flex flex-col gap-0 lg:gap-1.5">
            <a
              href={COMPANY.phoneHref}
              className="inline-flex items-center gap-2 py-2 text-xs text-brand/70 transition-colors hover:text-gold-dark lg:py-0"
            >
              <Phone className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
              {COMPANY.phone}
            </a>
            <a
              href={COMPANY.emailHref}
              className="inline-flex items-center gap-2 py-2 text-xs text-brand/70 transition-colors hover:text-gold-dark lg:py-0"
            >
              <Mail className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
              {COMPANY.email}
            </a>
            <p className="mt-1 text-xs text-brand/70">{COMPANY_ADDRESS_LINE}</p>
          </div>
        </div>

        <FooterNavColumn />
        <FooterLegalColumn />

        {/* Versand-Fakt bleibt hier: er enthält einen Geldbetrag und wird
            währungsbewusst über `WaehrungsPreis` gerendert (anderer Fund) –
            FooterInfoColumn reiht ihn nur an der richtigen Position ein. */}
        <FooterInfoColumn className="col-span-2 sm:col-span-1">
          <li className="text-xs text-brand/70">
            <FooterFreeShippingLabel /> <WaehrungsPreis betragInEur={SHIPPING_RATES.DE.freeFrom} />
          </li>
        </FooterInfoColumn>
      </div>

      {/* Sortiment, Anlässe, Marken: von jeder Seite aus verlinkt (interne Verlinkung für die Indexierung). */}
      <FooterSeoLinks />

      <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-2 border-t border-brand/10 pt-5 sm:flex-row sm:justify-between">
        <p className="text-xs text-brand/70">
          © {new Date().getFullYear()} {COMPANY.tradeName}
        </p>
        <FooterBottomTagline city={COMPANY.city} />
      </div>
    </footer>
  );
}
