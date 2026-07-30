'use client';

/**
 * Der linke Bereich des Konfigurators: ein Produktbrowser, kein Filterbereich.
 *
 * ── Warum kein Filterbereich ──────────────────────────────────────────
 * Wer hier ankommt, steckt schon im Konfigurator und will das Kleidungsstück
 * wechseln, nicht eine Suchmaske bedienen. Die Navigation läuft deshalb wie
 * ein Dateibrowser: eine Hauptgruppe öffnen → eine Produktart öffnen → die
 * Modelle erscheinen als Karten daneben.
 *
 * ── Explorer-Verhalten ────────────────────────────────────────────────
 * Immer nur EIN Pfad ist offen. „Herren" zu öffnen schließt Damen und Unisex;
 * innerhalb von Herren „Hoodies" zu öffnen blendet die übrigen Produktarten
 * aus. So bleibt die Ansicht ruhig und wird nie zur endlosen Liste. Der
 * Breadcrumb oben zeigt den Weg und führt eine Ebene zurück.
 *
 * Die Regeln des Baums (Zuordnung, Badges, Filter) stehen in
 * `lib/configurator/produktbaum.ts`; hier steht nur Darstellung und Bedienung.
 */
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { PRODUCTS } from '@/config/products';
import type { ProductConfig } from '@/config/products/types';
import { QUALITY_TIER_LABELS, sortiereQualityTiers } from '@/config/qualityTiers';
import type { ProductType, QualityTier } from '@/types';
import {
  LEERER_FILTER, anzahlAktiverFilter, baueBaum, modellBadges, modelleVon,
  type Badge, type Browserfilter, type Hauptgruppe,
} from '@/lib/configurator/produktbaum';
import { uebernehmeAuswahl } from '@/lib/configurator/uebernahme';
import { vorladenListe, vorladenModell } from '@/lib/configurator/vorladen';
import { getProduct } from '@/config/products';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useBrowserStore } from '@/stores/browserStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { formatPriceWithCurrency, useCurrencyStore } from '@/stores/currencyStore';

/** Kleines Vorschaubild als Symbol der Produktart – echte Ware statt Piktogramm. */
const ARTBILD = new Map<ProductType, string | undefined>();
for (const p of PRODUCTS) {
  if (!ARTBILD.has(p.productType)) ARTBILD.set(p.productType, p.colors[0]?.images.front);
}

const BADGE_TON: Record<Badge['ton'], string> = {
  neutral: 'bg-brand/[0.05] text-brand/55',
  bio: 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10',
  gold: 'bg-gold-light/60 text-gold-dark ring-1 ring-inset ring-gold/20',
};

export const ProduktBrowser = memo(function ProduktBrowser() {
  const productId = useConfiguratorStore((s) => s.productId);
  const setProduct = useConfiguratorStore((s) => s.setProduct);
  const setColor = useConfiguratorStore((s) => s.setColor);
  const setSizeQuantities = useConfiguratorStore((s) => s.setSizeQuantities);

  const favoriteIds = useFavoritesStore((s) => s.favoriteIds);
  const toggleFavorite = useFavoritesStore((s) => s.toggleFavorite);
  const currency = useCurrencyStore((s) => s.currency);
  const preis = (betrag: number) => formatPriceWithCurrency(betrag, currency);

  const [suche, setSuche] = useState('');
  const [nurFavoriten, setNurFavoriten] = useState(false);
  const [filterOffen, setFilterOffen] = useState(false);
  const [marke, setMarke] = useState<string | undefined>();
  const [qualitaet, setQualitaet] = useState<QualityTier | undefined>();
  const [material, setMaterial] = useState<string | undefined>();
  const [preisMax, setPreisMax] = useState<number | undefined>();

  // Explorer: höchstens eine Gruppe und ein Ast offen. Der zuletzt geöffnete
  // Pfad wird über Sitzungen hinweg gemerkt (browserStore). Bis der
  // persistierte Zustand am Client vorliegt (`hydriert`), wird der Standard
  // (alles zu) gezeigt – so entsteht keine Server/Client-Abweichung.
  const gemerkteGruppe = useBrowserStore((s) => s.offeneGruppe);
  const gemerkteAuswahl = useBrowserStore((s) => s.gewaehlt);
  const setOffeneGruppe = useBrowserStore((s) => s.setOffeneGruppe);
  const setGewaehltStore = useBrowserStore((s) => s.setGewaehlt);

  const [hydriert, setHydriert] = useState(false);
  useEffect(() => setHydriert(true), []);

  const offeneGruppe = hydriert ? gemerkteGruppe : null;
  const gewaehlt = hydriert ? gemerkteAuswahl : null;
  const setGewaehlt = setGewaehltStore;

  // Scrollposition der Modellliste merken und wiederherstellen.
  const modellRef = useRef<HTMLUListElement>(null);
  const setModellScrollTop = useBrowserStore((s) => s.setModellScrollTop);
  // Während des Wiederherstellens darf der programmatische Scroll die gemerkte
  // Position NICHT überschreiben – sonst würde ein noch geklemmter Zwischenwert
  // (Liste anfangs zu kurz) den echten Zielwert vernichten.
  const stelltWieder = useRef(false);
  useLayoutEffect(() => {
    if (!hydriert || !gewaehlt) return;
    const ziel = useBrowserStore.getState().modellScrollTop;
    if (ziel <= 0) return;

    stelltWieder.current = true;
    let versuche = 0;
    const anwenden = () => {
      const el = modellRef.current;
      if (el) {
        el.scrollTop = ziel;
        // Bis Flex-Layout und Kartenhöhen stehen, kann der Wert klemmen –
        // dann über einige Frames nachsetzen, bis er sitzt (max. ~0,5 s).
        if (Math.abs(el.scrollTop - ziel) > 2 && versuche < 30) {
          versuche++;
          requestAnimationFrame(anwenden);
          return;
        }
      }
      stelltWieder.current = false;
    };
    requestAnimationFrame(anwenden);
    // Nur beim Wechsel des Astes ausführen, nicht bei jedem Scroll.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydriert, gewaehlt?.gruppe, gewaehlt?.art]);

  const filter: Browserfilter = useMemo(
    () => ({ ...LEERER_FILTER, suche, nurFavoriten, favoriten: favoriteIds, marke, qualitaet, material, preisMax }),
    [suche, nurFavoriten, favoriteIds, marke, qualitaet, material, preisMax]
  );

  const baum = useMemo(() => baueBaum(PRODUCTS, filter), [filter]);
  const aktiveFilter = anzahlAktiverFilter(filter);

  // Sucht oder filtert jemand, wäre der zugeklappte Baum im Weg: alles offen.
  const eingegrenzt = suche.trim() !== '' || nurFavoriten || aktiveFilter > 0;
  const istOffen = (g: Hauptgruppe) => eingegrenzt || offeneGruppe === g;

  const marken = useMemo(() => [...new Set(PRODUCTS.map((p) => p.brand))].sort(), []);
  const materialien = useMemo(() => [...new Set(PRODUCTS.map((p) => p.material))].sort(), []);
  const stufen = useMemo(() => sortiereQualityTiers([...new Set(PRODUCTS.map((p) => p.qualityTier))]), []);
  const teuerstes = useMemo(() => Math.ceil(Math.max(...PRODUCTS.map((p) => p.basePrice)) / 5) * 5, []);

  const modelle = gewaehlt ? modelleVon(baum, gewaehlt.gruppe, gewaehlt.art) : [];
  const gruppeLabel = gewaehlt ? baum.find((g) => g.gruppe === gewaehlt.gruppe)?.label : undefined;
  const astLabel = gewaehlt
    ? baum.find((g) => g.gruppe === gewaehlt.gruppe)?.arten.find((a) => a.art === gewaehlt.art)?.label
    : undefined;

  function toggleGruppe(g: Hauptgruppe) {
    setOffeneGruppe(offeneGruppe === g ? null : g);
    setGewaehlt(null);
  }

  function waehleArt(gruppe: Hauptgruppe, art: ProductType) {
    setOffeneGruppe(gruppe);
    const schonOffen = gewaehlt?.gruppe === gruppe && gewaehlt.art === art;
    setGewaehlt(schonOffen ? null : { gruppe, art });
    // Vorderansichten der Modelle vorladen, damit die Karten sofort stehen.
    if (!schonOffen) vorladenListe(modelleVon(baum, gruppe, art));
  }

  function waehleModell(p: ProductConfig) {
    if (p.id === productId) return; // schon geladen – nichts zu tun

    // Farbe, Größe und Menge aus der bisherigen Auswahl mitnehmen. Der aktuelle
    // Zustand wird beim Klick direkt aus dem Store gelesen (getState), damit
    // diese Komponente sich nicht bei jeder Mengenänderung neu rendert. Die
    // Veredelungsart bleibt im Store ohnehin erhalten (produktunabhängig).
    const { colorId, sizeQuantities } = useConfiguratorStore.getState();
    const alt = getProduct(productId ?? '');
    const uebernahme = uebernehmeAuswahl(alt, p, colorId, sizeQuantities);

    setProduct(p.id);
    if (uebernahme.colorId) setColor(uebernahme.colorId);
    setSizeQuantities(uebernahme.sizeQuantities);
  }

  function setzeFilterZurueck() {
    setMarke(undefined);
    setQualitaet(undefined);
    setMaterial(undefined);
    setPreisMax(undefined);
  }

  return (
    <div className="flex h-[70vh] gap-2 lg:h-full">
      {/* ══ Spalte 1: der Baum ═══════════════════════════════════════ */}
      <div
        className={clsx(
          // Bei doppelter Schriftgröße brauchen beide Spalten zusammen rund
          // 800 px. Nebeneinander passt das erst ab 2xl; darunter tritt der
          // Baum zurück, sobald eine Produktart offen ist – wie am Telefon.
          'relative flex-col overflow-hidden rounded-xl border border-gold/20 bg-white shadow-elegant',
          'w-full lg:flex lg:w-[17rem] lg:flex-shrink-0 xl:w-[18rem]',
          gewaehlt ? 'hidden' : 'flex'
        )}
      >
        <div className="flex-shrink-0 border-b border-gold/10 p-3">
          <h2 className="mb-2.5 text-[15px] font-semibold uppercase tracking-[0.12em] text-brand/50">
            Produkt Browser
          </h2>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand/30" />
            <input
              value={suche}
              onChange={(e) => setSuche(e.target.value)}
              placeholder="Suche nach Produkten, Marken…"
              className="w-full rounded-full border border-gray-200 py-2.5 pl-9 pr-9 text-[16px] transition-colors focus:border-gold/60 focus:outline-none"
            />
            {suche && (
              <button
                type="button"
                onClick={() => setSuche('')}
                aria-label="Suche leeren"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-brand/30 transition-colors hover:text-brand/70"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <Reiter an={!nurFavoriten} onClick={() => setNurFavoriten(false)}>
              Alle Produkte ({PRODUCTS.length})
            </Reiter>
            <Reiter an={nurFavoriten} onClick={() => setNurFavoriten(true)}>
              Favoriten ({favoriteIds.length})
            </Reiter>

            <button
              type="button"
              onClick={() => setFilterOffen(true)}
              title="Filter öffnen"
              aria-label="Filter öffnen"
              className={clsx(
                'ml-auto flex flex-shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[14px] transition-colors',
                aktiveFilter > 0
                  ? 'border-gold bg-gold text-white'
                  : 'border-gray-200 text-brand/50 hover:border-gold/50 hover:text-brand'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              {aktiveFilter > 0 && aktiveFilter}
            </button>
          </div>

          {/* Breadcrumb – nur wenn in einen Ast hineingegangen wurde. */}
          {gewaehlt && !eingegrenzt && (
            <nav aria-label="Pfad" className="mt-2.5 flex items-center gap-1 text-[15px]">
              <button
                type="button"
                onClick={() => setGewaehlt(null)}
                className="rounded-md px-1 py-0.5 text-brand/50 transition-colors hover:text-gold-dark"
              >
                {gruppeLabel}
              </button>
              <ChevronRight className="h-4 w-4 text-brand/25" aria-hidden />
              <span className="px-1 py-0.5 font-medium text-brand">{astLabel}</span>
            </nav>
          )}
        </div>

        {/* Der Baum. Eigener Scroll-Bereich – Scrollen bewegt nicht die Seite. */}
        <ul className="min-h-0 flex-1 overflow-y-auto p-1.5">
          {baum.map((g) => {
            const auf = istOffen(g.gruppe);
            // Im geöffneten Ast bleibt nur die gewählte Produktart stehen;
            // die Geschwister schließen sich (Explorer-Verhalten).
            const zeigeArten =
              gewaehlt?.gruppe === g.gruppe && !eingegrenzt
                ? g.arten.filter((a) => a.art === gewaehlt.art)
                : g.arten;

            return (
              <li key={g.gruppe} className="border-b border-gold/10 last:border-0">
                <button
                  type="button"
                  onClick={() => toggleGruppe(g.gruppe)}
                  aria-expanded={auf}
                  className={clsx(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-colors',
                    auf ? 'text-brand' : 'hover:bg-cream/70'
                  )}
                >
                  <span className="flex-1 text-[20px] font-semibold uppercase tracking-[0.1em] text-brand/70">
                    {g.label}
                  </span>
                  <span className="text-[15px] tabular-nums text-brand/45">{g.anzahl}</span>
                  {/* Nach unten = offen, die Produktarten stehen darunter.
                      Zugeklappt zeigt der Pfeil nach oben. Damit verhält sich
                      der Gruppenkopf wie die Produktart eine Ebene tiefer, die
                      im offenen Zustand ebenfalls nach unten zeigt. */}
                  <ChevronDown
                    className={clsx('h-5 w-5 text-brand/35 transition-transform duration-300', !auf && 'rotate-180')}
                    aria-hidden
                  />
                </button>

                {/* Weich auf-/zuklappen (0fr → 1fr). */}
                <div className={clsx('klappe', auf && 'klappe-auf')}>
                  <div>
                    <ul key={`${g.gruppe}-${gewaehlt?.art ?? 'alle'}`} className="animate-fade-in pb-1.5">
                      {zeigeArten.length === 0 ? (
                        <li className="px-3 pb-2 text-[14px] text-brand/55">Keine Treffer in dieser Gruppe.</li>
                      ) : (
                        zeigeArten.map((a) => {
                          const an = gewaehlt?.gruppe === g.gruppe && gewaehlt.art === a.art;
                          const bild = ARTBILD.get(a.art);
                          return (
                            <li key={a.art}>
                              <button
                                type="button"
                                onClick={() => waehleArt(g.gruppe, a.art)}
                                className={clsx(
                                  'flex w-full items-center gap-2.5 rounded-lg py-2 pl-2 pr-2 text-left transition-colors',
                                  an ? 'bg-gold-light/60 text-brand' : 'text-brand/75 hover:bg-cream/70'
                                )}
                              >
                                {bild && (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={bild} alt="" loading="lazy" className="h-7 w-7 flex-shrink-0 object-contain" />
                                )}
                                <span className="flex-1 truncate text-[20px]">{a.label}</span>
                                <span className="text-[15px] tabular-nums text-brand/45">{a.anzahl}</span>
                                <ChevronRight
                                  className={clsx(
                                    'h-4 w-4 flex-shrink-0 transition-transform',
                                    an ? 'rotate-90 text-gold-dark' : 'text-brand/25'
                                  )}
                                  aria-hidden
                                />
                              </button>
                            </li>
                          );
                        })
                      )}
                    </ul>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        {/* ── Filter: liegt ÜBER dem Baum und geht wieder weg ────────── */}
        {filterOffen && (
          <div className="absolute inset-0 z-20 flex animate-fade-in flex-col bg-white">
            <div className="flex flex-shrink-0 items-center gap-2 border-b border-gold/10 p-3">
              <h3 className="flex-1 text-[15px] font-semibold uppercase tracking-[0.12em] text-brand/50">Filter</h3>
              <button
                type="button"
                onClick={() => setFilterOffen(false)}
                aria-label="Filter schließen"
                className="rounded-md p-1 text-brand/40 transition-colors hover:text-brand"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
              <Feld label="Marke">
                <Auswahl wert={marke} onWahl={setMarke} alle="Alle Marken" werte={marken} />
              </Feld>
              <Feld label="Qualität">
                <Auswahl
                  wert={qualitaet}
                  onWahl={(v) => setQualitaet(v as QualityTier | undefined)}
                  alle="Alle Qualitäten"
                  werte={stufen}
                  beschrifte={(v) => QUALITY_TIER_LABELS[v as QualityTier]}
                />
              </Feld>
              <Feld label="Material">
                <Auswahl wert={material} onWahl={setMaterial} alle="Alle Materialien" werte={materialien} />
              </Feld>
              <Feld label={`Preis bis ${preis(preisMax ?? teuerstes)}`}>
                <input
                  type="range"
                  min={5}
                  max={teuerstes}
                  step={5}
                  value={preisMax ?? teuerstes}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setPreisMax(v >= teuerstes ? undefined : v);
                  }}
                  className="w-full accent-gold"
                />
              </Feld>
            </div>

            <div className="flex-shrink-0 border-t border-gold/10 p-3">
              <button
                type="button"
                onClick={setzeFilterZurueck}
                disabled={aktiveFilter === 0}
                className="w-full rounded-full border border-gold/40 py-2 text-[15px] text-gold-dark transition-colors hover:bg-gold-light/40 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-brand/25"
              >
                Alle Filter zurücksetzen
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ Spalte 2: Modellkarten des geöffneten Astes ══════════════ */}
      {gewaehlt && (
        <div className="flex w-full flex-shrink-0 flex-col overflow-hidden rounded-xl border border-gold/20 bg-white shadow-elegant lg:w-[17rem] xl:w-[18rem]">
          <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-gold/10 p-2.5">
            <button
              type="button"
              onClick={() => setGewaehlt(null)}
              aria-label="Zurück zur Übersicht"
              className="rounded-md p-0.5 text-brand/40 transition-colors hover:text-brand"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="flex-1 truncate text-[19px] font-medium text-brand">{astLabel}</span>
            <span className="text-[15px] tabular-nums text-brand/50">{modelle.length}</span>
          </div>

          <ul
            ref={modellRef}
            key={`${gewaehlt.gruppe}-${gewaehlt.art}`}
            onScroll={(e) => {
              if (!stelltWieder.current) setModellScrollTop(e.currentTarget.scrollTop);
            }}
            className="min-h-0 flex-1 animate-fade-in space-y-4 overflow-y-auto p-3"
          >
            {modelle.map((p) => (
              <li key={p.id}>
                <Modellkarte
                  produkt={p}
                  aktiv={p.id === productId}
                  gemerkt={favoriteIds.includes(p.id)}
                  preis={preis}
                  onWaehlen={() => waehleModell(p)}
                  onMerken={() => toggleFavorite(p.id)}
                  onVorladen={() => vorladenModell(p)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
});

/** Eine Modellkarte im Premium-Zuschnitt: großes Bild, Name, Marke, Badges, Farbpunkte. */
function Modellkarte({
  produkt, aktiv, gemerkt, preis, onWaehlen, onMerken, onVorladen,
}: {
  produkt: ProductConfig;
  aktiv: boolean;
  gemerkt: boolean;
  preis: (b: number) => string;
  onWaehlen: () => void;
  onMerken: () => void;
  onVorladen: () => void;
}) {
  const badges = modellBadges(produkt);
  const MAX_PUNKTE = 6;
  const punkte = produkt.colors.slice(0, MAX_PUNKTE);
  const weitere = produkt.colors.length - punkte.length;

  return (
    <button
      type="button"
      onClick={onWaehlen}
      // Beim ersten Überfahren alle Ansichten dieses Modells vorladen –
      // ein späterer Klick fühlt sich dann verzögerungsfrei an.
      onMouseEnter={onVorladen}
      onFocus={onVorladen}
      aria-pressed={aktiv}
      className={clsx(
        'group relative block w-full overflow-hidden rounded-2xl border text-left transition-all duration-300 ease-out',
        aktiv
          ? 'border-gold bg-gold-light/25 shadow-[0_0_0_1px_theme(colors.gold.DEFAULT),0_18px_38px_-16px_rgba(168,121,47,0.55)]'
          : 'border-gray-900/[0.07] bg-white hover:-translate-y-1 hover:border-gold/40 hover:shadow-[0_22px_44px_-20px_rgba(43,36,28,0.32)]'
      )}
    >
      {/* Vorschaubild – bewusst groß, damit die Ware wirkt. */}
      <div className="relative aspect-square bg-gradient-to-b from-white to-cream/30">
        {produkt.colors[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={produkt.colors[0].images.front}
            alt={produkt.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        )}
        {/* Bestätigung: dieses Kleidungsstück liegt gerade im Konfigurator. */}
        {aktiv && (
          <span className="animate-marke-auf absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-gold px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
            <Check className="h-3 w-3" strokeWidth={3} />
            Ausgewählt
          </span>
        )}
        <span
          role="button"
          tabIndex={0}
          aria-label={gemerkt ? 'Aus Favoriten entfernen' : 'Zu Favoriten'}
          onClick={(e) => {
            e.stopPropagation();
            onMerken();
          }}
          onKeyDown={(e) => {
            if (e.key !== 'Enter' && e.key !== ' ') return;
            e.preventDefault();
            e.stopPropagation();
            onMerken();
          }}
          className={clsx(
            'absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 backdrop-blur transition-all hover:bg-white',
            gemerkt ? 'text-gold-dark opacity-100' : 'text-brand/35 opacity-0 group-hover:opacity-100'
          )}
        >
          <Star className={clsx('h-3.5 w-3.5', gemerkt && 'fill-gold-dark')} />
        </span>
      </div>

      <div className="border-t border-gray-900/[0.05] p-3">
        <p className="truncate text-[19px] font-semibold leading-tight text-brand">{produkt.name}</p>
        <p className="mt-0.5 truncate text-[14px] uppercase tracking-wide text-brand/40">{produkt.brand}</p>

        <div className="mt-2.5 flex flex-wrap gap-1">
          {badges.map((b) => (
            <span key={b.text} className={clsx('rounded-md px-1.5 py-0.5 text-[13px] font-medium', BADGE_TON[b.ton])}>
              {b.text}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1" aria-label={`${produkt.colors.length} Farben`}>
            {punkte.map((c) => (
              <span
                key={c.id}
                title={c.name}
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: c.hex }}
              />
            ))}
            {weitere > 0 && <span className="text-[13px] font-medium text-brand/40">+{weitere}</span>}
          </span>
          <span className="text-[19px] font-semibold text-gold-dark">ab {preis(produkt.basePrice)}</span>
        </div>
      </div>
    </button>
  );
}

function Reiter({ an, onClick, children }: { an: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'rounded-full px-2.5 py-1 whitespace-nowrap text-[14px] font-medium transition-colors',
        an ? 'bg-gold text-white' : 'bg-cream text-brand/50 hover:bg-cream/70'
      )}
    >
      {children}
    </button>
  );
}

function Feld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[15px] font-medium text-brand/60">{label}</span>
      {children}
    </label>
  );
}

function Auswahl({
  wert, onWahl, alle, werte, beschrifte,
}: {
  wert: string | undefined;
  onWahl: (v: string | undefined) => void;
  alle: string;
  werte: string[];
  beschrifte?: (v: string) => string;
}) {
  return (
    <select
      value={wert ?? ''}
      onChange={(e) => onWahl(e.target.value || undefined)}
      className="w-full rounded-md border border-gray-200 px-2 py-1.5 text-[16px] transition-colors focus:border-gold/60 focus:outline-none"
    >
      <option value="">{alle}</option>
      {werte.map((v) => (
        <option key={v} value={v}>
          {beschrifte ? beschrifte(v) : v}
        </option>
      ))}
    </select>
  );
}
