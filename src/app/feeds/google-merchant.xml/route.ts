/**
 * /feeds/google-merchant.xml – Produktfeed für Google Merchant Center (kostenlose Shopping-Einträge).
 * Aufbau und Begründung: lib/seo/merchantFeed.ts (die Route selbst darf nur Handler exportieren).
 *
 * Der Betreiber hinterlegt diese Adresse im Merchant Center als „geplanten Abruf“. Der Feed ist kein Seiteninhalt:
 * `X-Robots-Tag: noindex` hält ihn aus den Suchergebnissen heraus, Googles Merchant-Abruf bleibt möglich.
 * Die Antwort ist ein Stream (ca. 25 MB), weil Vercel-Funktionen nicht gestreamte Antworten nur bis 4,5 MB liefern.
 */
import { PRODUCTS } from '@/config/products';
import { kanonischeBasisUrl } from '@/lib/seo/basisUrl';
import { feedStrom } from '@/lib/seo/merchantFeed';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  const stueck = feedStrom(PRODUCTS, kanonischeBasisUrl());
  const kodierer = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      const n = stueck.next();
      if (n.done) controller.close();
      else controller.enqueue(kodierer.encode(n.value));
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'X-Robots-Tag': 'noindex',
      'Cache-Control': 'no-store',
    },
  });
}
