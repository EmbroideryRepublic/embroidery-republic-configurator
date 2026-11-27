'use client';

import { meldeBestellwegSchritt } from '@/lib/besuch/ereignisMelden';
import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, Tag, TrendingDown } from 'lucide-react';
import { InfoTooltip } from '@/components/ui/InfoTooltip';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useCartStore } from '@/stores/cartStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import { useCurrencyStore, formatPriceWithCurrency } from '@/stores/currencyStore';
import { QUANTITY_TIERS, DTF_POSITION_TIERS, STICKEREI_POSITION_TIERS, type PriceCalculationResult } from '@/lib/pricing/calculatePrice';
import type { MengenTipp, NaechsteStufe } from '@/lib/pricing/mengenTipp';
import { getProduct } from '@/config/products';
import { SizeQuantityTable } from './SizeQuantityTable';
import type { TranslationKey } from '@/lib/i18n/translations';
import type { CartItem, PrintView } from '@/types';
import { DECORATION_POSITION_ORDER, positionTranslationKey } from '@/config/decorationPositions';
import { sumSizeQuantities } from '@/lib/pricing/quantity';
import { istNurAufAnfrage } from '@/config/bestellweg';
import { useAktuelleAktion } from '@/components/aktion/useAktion';


interface SummaryPanelProps {
  productName: string;
  breakdown: PriceCalculationResult['breakdown'] | null;
  /** Staffelgrenze knapp über der gewählten Menge, für die derselbe Gesamtpreis gilt (Mengenpreis-Deckel, lib/pricing/mengenTipp.ts). */
  mengenTipp?: MengenTipp | null;
  /** Nächste Menge, ab der der Stückpreis sinkt (lib/pricing/mengenTipp.ts) – „Noch 2 Stück – dann nur noch 26,99 €“. */
  naechsteStufe?: NaechsteStufe | null;
  /** true = mindestens ein Preisbaustein konnte nicht verarbeitet werden.
   *  Der Preis ist dann ungültig und darf nicht bestellt werden. */
  priceHasErrors?: boolean;
  /** Aufgerufen nach erfolgreichem "In den Warenkorb" – öffnet im Elternteil
   *  (ConfiguratorPrototype) die bestehende CartDrawer-Schublade mit
   *  Erfolgsbestätigung, statt den Kauferfolg nur am Header-Badge und dem
   *  kurzzeitig grünen Button hier erkennbar zu lassen. */
  onItemAdded?: () => void;
}

export function SummaryPanel({
  productName,
  breakdown,
  mengenTipp = null,
  naechsteStufe = null,
  priceHasErrors = false,
  onItemAdded,
}: SummaryPanelProps) {
  const printMethod = useConfiguratorStore((s) => s.printMethod);
  const productId = useConfiguratorStore((s) => s.productId);
  const colorId = useConfiguratorStore((s) => s.colorId);
  const sizeQuantities = useConfiguratorStore((s) => s.sizeQuantities);
  const elements = useConfiguratorStore((s) => s.elements);
  const unitPrice = useConfiguratorStore((s) => s.unitPrice);
  const totalPrice = useConfiguratorStore((s) => s.totalPrice);
  const resetDesign = useConfiguratorStore((s) => s.resetDesign);

  const quantity = sumSizeQuantities(sizeQuantities);
  const product = productId ? getProduct(productId) : null;
  // Stickerei gibt es nur auf Anfrage (config/bestellweg.ts): Der Preis bleibt
  // sichtbar und dynamisch, gilt aber ausdrücklich nur als Kostenschätzung –
  // statt "In den Warenkorb" wird die Position zur Anfrage hinzugefügt.
  const nurAnfrage = istNurAufAnfrage(printMethod);
  // DTF hat seit 2026-08-09 eine eigene feste Positionsstaffel statt eines
  // Prozentrabatts (siehe DTF_POSITION_TIERS in calculatePrice.ts) – die
  // Chip-Leiste und der "Noch X Stück bis…"-Hinweis unten müssen deshalb
  // wissen, welche der beiden Staffeln gerade gilt. QUANTITY_TIERS.
  // veredelungDiscountPercent beschreibt nur noch Stickerei korrekt.
  // Seit 2026-11-26 haben DTF und Stickerei getrennte Positionstabellen (STICKEREI_POSITION_TIERS); Stufen, bei denen die erste Position
  // gleich bleibt (ab 3 Stück 9,00 € wie bei 1 Stück), taugen weder als Chip noch als „Noch N Stück bis …“.
  const positionsStufen = (breakdown?.isStitchBased ? STICKEREI_POSITION_TIERS : DTF_POSITION_TIERS).filter(
    (t, i, alle) => i === 0 || t.erste !== alle[i - 1]!.erste
  );
  const nextDtfTier = breakdown?.isPositionBased
    ? positionsStufen.find((t) => t.minQuantity > quantity)
    : undefined;

  const addCartItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);
  const currency = useCurrencyStore((s) => s.currency);
  const formatPrice = (amount: number) => formatPriceWithCurrency(amount, currency);
  // Preisaktion (config/aktion.ts, z. B. Black Week): Der Rabatt steckt schon im angezeigten Preis (breakdown.aktion*); Name und Code für die Anzeige.
  const aktion = useAktuelleAktion();
  const aktionAngewendet = Boolean(aktion && breakdown && breakdown.aktionTotal < 0);

  const [isPriceChanged, setIsPriceChanged] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const previousTotal = useRef(totalPrice);
  useEffect(() => {
    if (previousTotal.current !== totalPrice) {
      setIsPriceChanged(true);
      previousTotal.current = totalPrice;
      const timeout = setTimeout(() => setIsPriceChanged(false), 400);
      return () => clearTimeout(timeout);
    }
  }, [totalPrice]);

  // Einzelstücke sind ausdrücklich erlaubt – es gibt keine Mindestmenge mehr.
  // Zusätzlich zu Auswahl und gültigem Preis gilt seit der Geschäftsregel vom
  // 2026-08-19: Wir verkaufen ausschließlich personalisierte Ware, also muss
  // mindestens ein Logo- oder Textelement vorhanden sein, bevor überhaupt in
  // den Warenkorb gelegt werden kann. Serverseitig durchgesetzt in
  // orderValidation.ts (pruefePosition) – diese Client-Prüfung ist nur die
  // frühestmögliche, freundliche Rückmeldung, keine eigene Sicherheitsebene.
  const hasElement = elements.length > 0;
  // Ausbauplan (quickwins): ein unveränderter Vorlagen-Platzhalter (z.B.
  // "Euer Firmenname") ist kein echter Kundeninhalt – ohne diese Prüfung
  // ließ er sich unverändert bis in den Checkout tragen und hätte bei
  // personalisierter, vom Widerruf ausgeschlossener Ware zu einer
  // Fehlproduktion auf Kosten des Betriebs geführt.
  const hasUnbearbeitetenPlatzhalter = elements.some((e) => e.type === 'text' && e.isTemplatePlaceholder);
  const canAddToCart =
    productId !== null && colorId !== null && quantity > 0 && hasElement && !priceHasErrors && !hasUnbearbeitetenPlatzhalter;

  function handleAddToCart() {
    if (!canAddToCart || !productId || !colorId) return;
    const item: CartItem = {
      id: crypto.randomUUID(),
      printMethod,
      productId,
      colorId,
      sizeQuantities,
      quantity,
      elements: useConfiguratorStore.getState().elements,
      unitPrice,
      totalPrice,
      setupTotal: breakdown?.setupTotal ?? 0,
      // Anzeige im Warenkorb („Black Week: −X €“); der Server rechnet den Rabatt immer selbst.
      ...(breakdown && breakdown.aktionTotal < 0 ? { aktionErsparnis: Math.round(-breakdown.aktionTotal * 100) / 100 } : {}),
      addedAt: Date.now(),
    };
    addCartItem(item);
    // Nur der Name des Schritts wird gezählt – kein Produkt, keine Menge, kein Preis (lib/besuch/ereignisMelden.ts).
    meldeBestellwegSchritt('in_den_warenkorb');
    resetDesign();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2500);
    onItemAdded?.();
  }

  return (
    // Zwei Kästen als direkte Kinder der (scrollenden) rechten Spalte: oben Größen/Staffel, darunter die Kauf-Leiste
    // mit Preis und Bestellknopf. Nur die Kauf-Leiste klebt unten fest (ab lg, Fensterhöhe ≥ 600 px) – so bleibt der
    // Knopf immer erreichbar, und die Größentabelle scrollt mit den Werkzeugen, statt ihnen den Platz zu nehmen.
    <>
    <div className="flex-shrink-0 space-y-2 rounded-xl border border-gold/20 bg-white p-3 shadow-elegant">
      {/* Veredelung, Elemente und Position stehen jetzt in der Live-Übersicht
          (KonfigUebersicht) oben in der Spalte – hier bleibt der eigentliche
          Preis- und Bestellbereich, um Doppelungen zu vermeiden. */}
      {product && <SizeQuantityTable product={product} />}

      {/* Harte Warnung statt still falscher Preis. Tritt nur auf, wenn eine
          Preisregel im laufenden Betrieb nicht verarbeitet werden konnte –
          in Entwicklung und Tests bricht die Engine vorher ab. */}
      {priceHasErrors && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
          {t('summary_price_invalid')}
        </p>
      )}

      {/* Keine Mindestmenge mehr – stattdessen die einmaligen Rüstkosten
          ausweisen. Der Kunde soll verstehen, WARUM ein Einzelstück
          verhältnismäßig teurer ist und dass sich Menge lohnt. */}
      {breakdown && breakdown.setupTotal > 0 && (
        <p className="text-xs text-brand/70">
          {t('summary_setup_fee')}: {formatPrice(breakdown.setupTotal)}{' '}
          <span>
            ({formatPrice(breakdown.setupPerUnit)} {t('summary_setup_per_unit')})
          </span>
        </p>
      )}

      {/* Mengenrabatt als schmale Chip-Leiste.
          Vorher ein eigener Block mit Überschrift, Erklärtext, Fortschritts-
          und Ersparnishinweis – zusammen rund 120 px, die dem Preis und dem
          Bestellknopf fehlten. Die Staffel selbst ist die Information; alles
          Weitere steht im Tooltip oder ergibt sich aus dem Preis. */}
      <div className="flex items-center gap-1">
        <TrendingDown className="h-3.5 w-3.5 flex-shrink-0 text-gold-dark" aria-hidden="true" />
        <div className="flex min-w-0 flex-1 gap-0.5">
          {breakdown?.isPositionBased
            ? positionsStufen.map((tier) => (
                <div
                  key={tier.minQuantity}
                  className={clsx(
                    'min-w-0 flex-1 truncate rounded-md py-0.5 text-center text-[10px] font-medium',
                    quantity >= tier.minQuantity ? 'bg-gold-btn text-white' : 'bg-cream text-brand/70'
                  )}
                  title={`ab ${tier.minQuantity} Stück: ${formatPrice(tier.erste)} für die erste Position, ${formatPrice(tier.zweite)} für die zweite, ${formatPrice(tier.abDritte)} für jede weitere`}
                >
                  {formatPrice(tier.erste)}
                </div>
              ))
            : QUANTITY_TIERS.map((tier) => (
                <div
                  key={tier.minQuantity}
                  className={clsx(
                    'min-w-0 flex-1 truncate rounded-md py-0.5 text-center text-[10px] font-medium',
                    quantity >= tier.minQuantity ? 'bg-gold-btn text-white' : 'bg-cream text-brand/70'
                  )}
                  title={`ab ${tier.minQuantity} Stück: -${tier.veredelungDiscountPercent}% auf Veredelung, -${tier.baseDiscountPercent}% auf Grundpreis`}
                >
                  {tier.veredelungDiscountPercent > 0 ? `-${tier.veredelungDiscountPercent}%` : `${tier.minQuantity}+`}
                </div>
              ))}
        </div>
      </div>

      {/* Nur der NÄCHSTE Schritt bzw. die erreichte Ersparnis – eine Zeile,
          und nur wenn sie etwas aussagt. Bei DTF bezieht sich der Hinweis auf
          die feste Positionsstaffel (DTF_POSITION_TIERS), nicht auf
          QUANTITY_TIERS.veredelungDiscountPercent (gilt seit 2026-08-09 nur
          noch für Stickerei). */}
      {/* Ausbauplan (quickwins): Vor der ersten Mengenauswahl ist quantity 0 –
          "Noch 1 Stück bis …" wäre dann unverständlich, weil "noch" eine
          bereits laufende Zählung suggeriert, die es noch gar nicht gibt.
          Alle drei Hinweise deshalb erst ab quantity > 0. */}
      {quantity > 0 && mengenTipp ? (
        <p className="text-[11px] font-medium text-green-700" data-testid="mengen-tipp">
          Tipp: Mit {mengenTipp.menge} statt {quantity} Stück zahlst du genauso viel ({formatPrice(mengenTipp.gesamtpreis)}) – und
          erhältst {mengenTipp.mehrStueck} Stück mehr.
        </p>
      ) : quantity > 0 && naechsteStufe ? (
        <p className="text-[11px] font-medium text-green-700" data-testid="naechste-stufe">
          Noch {naechsteStufe.mehrStueck} Stück – dann nur noch {formatPrice(naechsteStufe.stueckpreis)} pro Stück (jetzt{' '}
          {formatPrice(unitPrice)}).
        </p>
      ) : quantity > 0 && nextDtfTier ? (
        <p className="text-[11px] text-brand/70">
          Noch {nextDtfTier.minQuantity - quantity} Stück bis {formatPrice(nextDtfTier.erste)} für die erste Position.
        </p>
      ) : quantity > 0 && !breakdown?.isPositionBased && breakdown?.nextTier ? (
        <p className="text-[11px] text-brand/70">
          Noch {breakdown.nextTier.minQuantity - quantity} Stück bis {breakdown.nextTier.veredelungDiscountPercent}% Rabatt.
        </p>
      ) : quantity > 0 && breakdown && breakdown.savingsAmount > 0 ? (
        <p className="text-[11px] font-medium text-green-700">
          Du sparst {formatPrice(breakdown.savingsAmount)}.
        </p>
      ) : null}

      {breakdown && (
        <div className="rounded-lg bg-cream/70 text-xs text-brand/70">
          <button
            type="button"
            onClick={() => setShowBreakdown((v) => !v)}
            className="flex w-full items-center justify-between px-2.5 py-1.5"
          >
            <span>Preisdetails</span>
            {/* Nach unten = geöffnet, die Preisdetails stehen darunter. */}
            <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', !showBreakdown && 'rotate-180')} />
          </button>
          {showBreakdown && (
            <div className="space-y-1 px-2.5 pb-2.5">
              <div className="flex items-center justify-between">
                <span>{productName}-Grundpreis</span>
                <span>{formatPrice(breakdown.basePrice)}</span>
              </div>
              {breakdown.positionFeeTotal > 0 && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    Positions-Aufschlag
                    <InfoTooltip text="Manche Positionen kosten wegen des höheren Aufwands beim Wechseln/Einspannen etwas mehr als andere." />
                  </span>
                  <span>{formatPrice(breakdown.positionFeeTotal)}</span>
                </div>
              )}
              {DECORATION_POSITION_ORDER
                .filter((view) => (breakdown.areaPriceByView[view] ?? 0) > 0)
                .map((view, i) => (
                  <div key={view} className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      {breakdown.isStitchBased && breakdown.isPositionBased
                        ? 'Bestickung'
                        : breakdown.isStitchBased
                          ? 'Stichpreis'
                          : breakdown.isPositionBased
                            ? 'Bedruckung'
                            : t('summary_area_price')}{' '}
                      {t(positionTranslationKey(view))}
                      {i === 0 && (
                        <InfoTooltip
                          text={
                            breakdown.isStitchBased && breakdown.isPositionBased
                              ? `${formatPrice(breakdown.firstPositionPrice)} für die erste bestickte Ansicht, ${formatPrice(breakdown.additionalPositionPrice)} für die zweite, ${formatPrice(breakdown.furtherPositionPrice)} für jede weitere ab der dritten – zuzüglich ${formatPrice(breakdown.pricePer1000Stitches)} pro 1.000 geschätzte Stiche (≈ ${breakdown.totalEstimatedStitches.toLocaleString('de-DE')} Stiche insgesamt${breakdown.veredelungDiscountPercent > 0 ? `, Stichaufpreis um ${breakdown.veredelungDiscountPercent.toLocaleString('de-DE')} % mengenrabattiert` : ''}). Die Stichzahl ist nur eine Näherung – für die verbindliche Zahl zählt die Digitalisierung (z.B. Chroma Inspire).`
                              : breakdown.isStitchBased
                              ? `Berechnet nach geschätzter Stichzahl (≈ ${breakdown.totalEstimatedStitches.toLocaleString('de-DE')} Stiche insgesamt) × ${formatPrice(breakdown.pricePer1000Stitches)} pro 1.000 Stiche. Nur eine Näherung – für die verbindliche Zahl zählt die Digitalisierung (z.B. Chroma Inspire).`
                              : breakdown.isPositionBased
                                ? `${formatPrice(breakdown.firstPositionPrice)} für die erste bedruckte Ansicht, ${formatPrice(breakdown.additionalPositionPrice)} für die zweite, ${formatPrice(breakdown.furtherPositionPrice)} für jede weitere ab der dritten – bis zum Standardformat unabhängig von der Größe der Motive. Sehr große Motive kosten zusätzlich einen Großformat-Zuschlag.`
                                : `Je größer ein Logo oder Text, desto mehr Material wird verbraucht – automatisch berechnet mit ${formatPrice(breakdown.areaPricePerCm2)} pro cm².`
                          }
                        />
                      )}
                    </span>
                    <span>{formatPrice(breakdown.areaPriceByView[view] ?? 0)}</span>
                  </div>
                ))}
              {breakdown.grossformatPerUnit > 0 && (
                <div className="flex items-center justify-between" data-testid="grossformat-zuschlag">
                  <span className="flex items-center gap-1">
                    Großformat-Zuschlag
                    <InfoTooltip text="Mehrkosten für die Transferfolie bei großen Motiven. Maßgeblich ist das echte, flache Maß des Motivs (im Foto erscheint die Brust gewölbt, das Motiv ist in echt breiter als gezeichnet). Bis ca. 26 × 32 cm fällt kein Zuschlag an." />
                  </span>
                  <span>{formatPrice(breakdown.grossformatPerUnit)}</span>
                </div>
              )}
              {breakdown.setupPerUnit > 0 && (
                <div className="flex items-center justify-between" data-testid="einrichtung-zeile">
                  <span className="flex items-center gap-1">
                    Einrichtung (einmalig)
                    <InfoTooltip text={`Einmalig ${formatPrice(breakdown.setupTotal)} je Position bei kleinen Mengen (bis 2 Stück), auf die Stückzahl verteilt. Hier steht der Anteil je Stück.`} />
                  </span>
                  <span>{formatPrice(breakdown.setupPerUnit)}</span>
                </div>
              )}
              {breakdown.mengenDeckelPerUnit < -0.005 && breakdown.mengenDeckelAufMenge !== null && (
                <div className="flex items-center justify-between" data-testid="mengenpreis-zeile">
                  <span className="flex items-center gap-1">
                    Mengenpreis wie bei {breakdown.mengenDeckelAufMenge} Stück
                    <InfoTooltip text={`Ab ${breakdown.mengenDeckelAufMenge} Stück gilt der günstigere Staffelpreis für die ganze Bestellung. Damit eine größere Bestellung nie weniger kostet als eine kleinere, zahlst du für ${quantity} Stück höchstens so viel wie für ${breakdown.mengenDeckelAufMenge} Stück. Hier steht die Ersparnis je Stück.`} />
                  </span>
                  <span>−{formatPrice(Math.abs(breakdown.mengenDeckelPerUnit))}</span>
                </div>
              )}
              {Math.abs(breakdown.rundungPerUnit) >= 0.005 && (
                <div className="flex items-center justify-between" data-testid="rundung-zeile">
                  <span className="flex items-center gap-1">
                    Rundung auf ,99 €
                    <InfoTooltip text="Der Stückpreis wird auf den nächsten ,99-€-Betrag gerundet (höchstens ± 0,50 €)." />
                  </span>
                  <span>
                    {breakdown.rundungPerUnit > 0 ? '+' : '−'}
                    {formatPrice(Math.abs(breakdown.rundungPerUnit))}
                  </span>
                </div>
              )}
              {aktionAngewendet && aktion && breakdown.aktionPerUnit < -0.005 && (
                <div className="flex items-center justify-between font-medium text-gold-dark" data-testid="aktion-details-zeile">
                  <span className="flex items-center gap-1">
                    {aktion.name} −{breakdown.aktionProzent} % ({aktion.code})
                    <InfoTooltip text={`${aktion.name}: ${breakdown.aktionProzent} % auf den Preis dieser Position (Textil, Veredelung und Einrichtung), automatisch angewendet – nichts einzugeben. Gilt bis einschließlich ${aktion.letzterTag}. Der Versand ist ausgenommen.`} />
                  </span>
                  <span>−{formatPrice(Math.abs(breakdown.aktionPerUnit))}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>

    <div className="flex-shrink-0 space-y-2 rounded-xl border border-gold/20 bg-white p-3 shadow-elegant lg:[@media(min-height:600px)]:sticky lg:[@media(min-height:600px)]:bottom-0 lg:[@media(min-height:600px)]:z-10">
      {/* Gesamtpreis, sobald überhaupt eine Menge gewählt ist – auch bei
          einem einzigen Stück. Vorher erschien er erst ab 5 Stück. */}
      {/* Preisaktion: macht sichtbar, dass der Code automatisch gilt – ohne Eingabefeld. Der Gesamtpreis darunter enthält den Rabatt bereits. */}
      {quantity > 0 && aktionAngewendet && aktion && breakdown && (
        <p
          data-testid="aktion-hinweis"
          className="flex items-center justify-between gap-2 rounded-lg bg-brand px-3 py-1.5 text-[11px] font-semibold text-white"
        >
          <span className="flex min-w-0 items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 flex-shrink-0 text-gold" aria-hidden="true" />
            <span className="font-mono tracking-[0.08em]">{aktion.code}</span>
            <span className="truncate font-medium text-white/80">angewendet · −{breakdown.aktionProzent} %</span>
          </span>
          <span className="flex-shrink-0 tabular-nums text-gold">−{formatPrice(Math.abs(breakdown.aktionTotal))}</span>
        </p>
      )}
      {/* Noch keine Menge gewählt (z. B. Besucher über den Instagram-Link): Die Aktion steht schon vorher da, nicht erst nach der Eingabe. */}
      {quantity === 0 && aktion && !nurAnfrage && (
        <p data-testid="aktion-hinweis-leer" className="flex flex-col gap-0.5 rounded-lg bg-brand px-3 py-2 text-white">
          <span className="flex items-center gap-2 text-[11px] font-semibold">
            <Tag className="h-3.5 w-3.5 flex-shrink-0 text-gold" aria-hidden="true" />
            <span className="whitespace-nowrap font-black uppercase tracking-[0.12em]">{aktion.name}</span>
            <span className="whitespace-nowrap rounded-full bg-gold px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-brand">−{aktion.prozent} %</span>
          </span>
          <span className="text-[11px] font-medium leading-snug text-white/80">automatisch im Warenkorb · bis {aktion.letzterTagKurz}</span>
        </p>
      )}
      {quantity > 0 ? (
        <div
          className={clsx(
            'flex items-center justify-between rounded-lg bg-gradient-to-r from-gold-light/80 to-cream px-3 py-2.5 transition-transform duration-200',
            isPriceChanged && 'scale-[1.03]'
          )}
          aria-live="polite"
          aria-atomic="true"
        >
          <div>
            <span className="text-sm font-medium text-brand">
              {t(nurAnfrage ? 'summary_total_price_estimate' : 'summary_total_price')}
            </span>
            {/* Ausbauplan (quickwins): macht den Gesamtpreis nachvollziehbar
                ("20,79 €/Stk. × 22" statt einer nicht herleitbaren Summe) –
                stärkt den Eindruck der Mengenstaffel als fair, reduziert
                Rückfragen. */}
            {/* Kurz vor einer Staffelgrenze (Mengenpreis-Deckel) ergibt „Stückpreis × Menge“ wegen der Rundung des Stückpreises nicht
                mehr genau den Gesamtpreis – dort steht stattdessen, wessen Preis gilt. */}
            <p className="text-[11px] text-brand/70" data-testid="gesamtpreis-herleitung">
              {breakdown && breakdown.mengenDeckelAufMenge !== null
                ? `Preis wie bei ${breakdown.mengenDeckelAufMenge} Stück (≈ ${formatPrice(unitPrice)}/Stk.)`
                : `${aktionAngewendet && Math.abs(unitPrice * quantity - totalPrice) >= 0.005 ? '≈ ' : ''}${formatPrice(unitPrice)}/Stk. × ${quantity}`}
            </p>
          </div>
          {/* whitespace-nowrap: Die längere Bezeichnung bei Stickerei ("Geschätzter
              Gesamtpreis (unverbindlich)") darf umbrechen, der Betrag nicht –
              sonst steht in der schmalen Spalte das €-Zeichen allein in einer Zeile. */}
          <span className={clsx('flex-shrink-0 whitespace-nowrap pl-2 font-serif text-xl font-bold text-gold-dark')}>
            {formatPrice(totalPrice)}
          </span>
        </div>
      ) : (
        <div className="rounded-lg bg-cream/70 px-3 py-2.5" aria-live="polite" aria-atomic="true">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-brand/70">{t('summary_unit_price')}</span>
            <span className="font-serif text-lg font-semibold text-brand">{formatPrice(unitPrice)}</span>
          </div>
          {/* Der Hinweis „Bitte zuerst eine Größe und Menge wählen.“ steht unter dem Knopf (!canAddToCart) –
              hier zusätzlich wiederholt, stand er zweimal übereinander und kostete Höhe. */}
        </div>
      )}

      {nurAnfrage && (
        <p className="text-[11px] leading-relaxed text-brand/70">{t('summary_embroidery_inquiry_note')}</p>
      )}

      <button
        type="button"
        onClick={handleAddToCart}
        disabled={!canAddToCart}
        className={clsx(
          'flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-medium text-white shadow-elegant transition-colors disabled:cursor-not-allowed disabled:opacity-40',
          justAdded ? 'bg-green-600' : 'bg-gold hover:bg-gold-dark'
        )}
      >
        {justAdded ? (
          <>
            <Check className="h-4 w-4" />
            {t(nurAnfrage ? 'summary_added_inquiry' : 'summary_added')}
          </>
        ) : (
          t(nurAnfrage ? 'summary_add_to_inquiry' : 'summary_add_to_cart')
        )}
      </button>
      {!canAddToCart && (
        <p className="text-center text-xs text-amber-800">
          {hasUnbearbeitetenPlatzhalter
            ? t('summary_replace_placeholder_first')
            : quantity > 0 && !hasElement
              ? t('summary_add_element_first')
              : t('summary_select_size_first')}
        </p>
      )}
    </div>
    </>
  );
}
