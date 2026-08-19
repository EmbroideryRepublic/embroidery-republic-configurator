import { Phone, Mail } from 'lucide-react';
import { COMPANY, COMPANY_ADDRESS_LINE } from '@/config/company';
import { SHIPPING_RATES } from '@/config/shipping';
import { WaehrungsPreis } from '@/components/shop/WaehrungsPreis';
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
    <footer className="mt-12 border-t border-gold/15 bg-white px-4 py-12 text-sm">
      <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-serif text-base font-semibold text-brand">Embroidery Republic</p>
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-gold-dark">Germany</p>
          <FooterDescription />
          <FooterContactHeading />
          <div className="flex flex-col gap-1.5">
            <a
              href={COMPANY.phoneHref}
              className="inline-flex items-center gap-2 text-xs text-brand/70 transition-colors hover:text-gold-dark"
            >
              <Phone className="h-3.5 w-3.5 text-gold-dark" aria-hidden />
              {COMPANY.phone}
            </a>
            <a
              href={COMPANY.emailHref}
              className="inline-flex items-center gap-2 text-xs text-brand/70 transition-colors hover:text-gold-dark"
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
        <FooterInfoColumn>
          <li className="text-xs text-brand/70">
            <FooterFreeShippingLabel /> <WaehrungsPreis betragInEur={SHIPPING_RATES.DE.freeFrom} />
          </li>
        </FooterInfoColumn>
      </div>

      <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center gap-2 border-t border-gold/10 pt-5 sm:flex-row sm:justify-between">
        <p className="text-xs text-brand/70">
          © {new Date().getFullYear()} {COMPANY.tradeName}
        </p>
        <FooterBottomTagline city={COMPANY.city} />
      </div>
    </footer>
  );
}
