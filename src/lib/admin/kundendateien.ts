/**
 * Grundlage für den ZIP-Sammel-Download aller Original-Kundendateien einer
 * Bestellung (siehe app/api/admin/bestellungen/[id]/kundendateien/route.ts).
 *
 * Bewusst eine eigene, schlanke Abfrage statt getOrderDetail() wiederzu-
 * verwenden: Der ZIP-Download braucht nur (Position, Ansicht, Original-Pfad,
 * Kundendateiname), nicht die vollständige Admin-Detailsicht mit Vorschau-
 * URLs, Lieferantenauftrag usw. – ein Route Handler ist kein React-Baum, der
 * sich die dort ohnehin schon geladenen Daten teilen könnte.
 *
 * ── Gleiche Abfrageform wie getOrderDetail() (lib/admin/data.ts) ────────
 * Weder order_items noch configuration_elements haben eine echte
 * Reihenfolge-Spalte (nur eine zufällige UUID, siehe
 * supabase/migrations/0001_init.sql) – die "Position N"/"Logo N"-Nummerierung
 * verlässt sich deshalb wie schon in ProductionPreview.tsx auf die
 * Rückgabereihenfolge der Datenbank. Damit diese Reihenfolge zwischen der
 * Admin-Seite und diesem ZIP-Export möglichst identisch bleibt (Fund aus dem
 * adversarialen Review vom 2026-08-31), stellt diese Datei ihre Abfragen
 * bewusst GENAUSO wie getOrderDetail(): alle Elemente laden (kein
 * `element_type`-Filter in der SQL-Abfrage selbst), dann clientseitig auf
 * Logos filtern – statt einer eigenen, anders geformten Abfrage. Eine
 * WIRKLICHE Garantie gäbe nur eine echte Sequenz-Spalte in der Datenbank
 * (nicht Teil dieser Änderung, betrifft auch die bereits bestehende
 * ProductionPreview-Nummerierung).
 *
 * Die "Logo N"-Nummerierung folgt exakt derselben Zählweise wie
 * components/admin/ProductionPreview.tsx (nur Logo-Elemente zählen, je
 * Ansicht neu ab 1) – ein Admin, der eine Datei im Browser als "Logo 2" auf
 * der Vorderseite sieht, findet im ZIP dieselbe Bezeichnung wieder.
 */
import { createAdminClient } from '@/lib/supabase/server';
import { downloadProductionFile } from '@/lib/supabase/storage';
import { ansichtLabel } from '@/lib/admin/ansichten';

export interface KundendateiEintrag {
  /** Vorgeschlagener, eindeutiger Dateiname innerhalb des ZIPs. */
  zipEintragsname: string;
  /** Storage-Pfad der Original-Datei (orders/<id>/...) – null, wenn diese
   *  Bestellung gar keinen Original-Pfad für dieses Element kennt (siehe
   *  AdminOrderElementRow.originalStorageKey in lib/admin/data.ts für
   *  dieselbe Unterscheidung auf der Admin-Detailseite). */
  storagePfad: string | null;
  /** Ursprünglicher Dateiname, wie von der Kundschaft hochgeladen. */
  kundenDateiname: string;
}

/** Schutz gegen einen ausufernden Speicherbedarf bei einer theoretisch
 *  extrem großen Bestellung (Validierungsgrenzen erlauben bis zu 100
 *  Positionen × 40 Elemente, siehe lib/orders/orderValidation.ts): Der ZIP
 *  wird vollständig im Arbeitsspeicher gebaut (kein Streaming), deshalb hier
 *  eine harte, großzügig bemessene Obergrenze statt eines unbegrenzten
 *  Promise.all über alle Dateien. In der Praxis (Handarbeits-Bestellungen
 *  dieses Shops) nie erreicht – für den pathologischen Fall meldet die Route
 *  dann klar, dass Einzel-Downloads statt des Sammel-ZIPs nötig sind. */
export const MAX_DATEIEN_IM_ZIP = 300;

const KOMBINIERENDE_AKZENTE = new RegExp('[\\u0300-\\u036f]', 'g');
const UNSICHERE_ZEICHEN = new RegExp('[^a-zA-Z0-9._-]+', 'g');
const MEHRFACH_UNTERSTRICH = new RegExp('_+', 'g');
const RAND_UNTERSTRICH = new RegExp('^_+|_+$', 'g');

/**
 * Reduziert einen Namen auf ein Zeichenset, das in jedem Zip-Extraktions-
 * Tool (auch ältere Bordmittel ohne UTF-8-Flag-Unterstützung) sicher lesbar
 * bleibt: NFKD-Zerlegung trennt Umlaute in Basisbuchstabe + Akzent (ü → u +
 * Akzentzeichen), die Akzente werden verworfen, alles verbleibende Nicht-
 * Alphanumerische wird zu "_". Der ECHTE, vollständige Kundendateiname bleibt
 * separat in KundendateiEintrag.kundenDateiname erhalten – hier geht es nur
 * um den Namen INNERHALB des ZIP-Archivs.
 */
function saeubereFuerDateisystem(wert: string): string {
  const bereinigt = wert
    .normalize('NFKD')
    .replace(KOMBINIERENDE_AKZENTE, '')
    .replace(UNSICHERE_ZEICHEN, '_')
    .replace(MEHRFACH_UNTERSTRICH, '_')
    .replace(RAND_UNTERSTRICH, '');
  return bereinigt.length > 0 ? bereinigt.slice(0, 120) : 'datei';
}

/**
 * Lädt alle Logo-Elemente einer Bestellung mit den Angaben, die für einen
 * ZIP-Eintrag gebraucht werden. Liefert eine leere Liste bei Ladefehlern
 * oder wenn die Bestellung keine Logo-Elemente hat – wirft nicht: der
 * aufrufende Route Handler entscheidet, wie er "nichts zu laden" meldet.
 *
 * Elemente OHNE Original-Pfad (sehr alte Bestellung, oder eine Datenzeile
 * außerhalb des normalen Bestell-Einfügewegs) werden NICHT stillschweigend
 * übersprungen, sondern MIT `storagePfad: null` zurückgegeben – so bleibt
 * eintraege.length weiterhin "wie viele Logo-Elemente gibt es wirklich" (für
 * die 404-Entscheidung der Route) UND ladeKundendateiBytes() kann jedes
 * fehlende Element im ZIP-Hinweistext benennen, statt es kommentarlos
 * verschwinden zu lassen.
 */
export async function ladeKundendateienFuerZip(orderId: string): Promise<KundendateiEintrag[]> {
  const supabase = createAdminClient();

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, product_name')
    .eq('order_id', orderId);

  if (itemsError || !items || items.length === 0) return [];

  const itemIds = items.map((row) => row.id as string);
  // Bewusst OHNE .eq('element_type', 'logo') in der SQL-Abfrage – siehe
  // Kopfkommentar: dieselbe Abfrageform wie getOrderDetail() (data.ts), das
  // ebenfalls alle Elemente lädt und clientseitig unterscheidet.
  const { data: elementRows, error: elementsError } = await supabase
    .from('configuration_elements')
    .select('order_item_id, element_type, view, file_name, original_file_url')
    .in('order_item_id', itemIds);

  if (elementsError || !elementRows) return [];

  const eintraege: KundendateiEintrag[] = [];
  const vergebeneNamen = new Set<string>();
  // Zähler je (Position × Ansicht) – dieselbe Granularität wie ProductionPreview.
  const zaehlerJeAnsicht = new Map<string, number>();
  // orders/<orderId>/ als Präfix – Verteidigung in der Tiefe: eine
  // original_file_url, die (aus welchem Grund auch immer) NICHT zu dieser
  // Bestellung gehört, wird verworfen statt heruntergeladen, obwohl der
  // heutige einzige Schreibweg (orders.ts::buildElementRecord über die
  // atomare Einfüge-Funktion) das nie erzeugt.
  const erwartetesPraefix = `orders/${orderId}/`;

  items.forEach((item, itemIndex) => {
    const eigeneElemente = elementRows.filter((el) => el.order_item_id === item.id && el.element_type === 'logo');
    for (const el of eigeneElemente) {
      const rohPfad = (el.original_file_url as string | null) ?? null;
      const originalPath = rohPfad && rohPfad.startsWith(erwartetesPraefix) ? rohPfad : null;

      const view = el.view as string;
      const zaehlerSchluessel = `${itemIndex}:${view}`;
      const logoNummer = (zaehlerJeAnsicht.get(zaehlerSchluessel) ?? 0) + 1;
      zaehlerJeAnsicht.set(zaehlerSchluessel, logoNummer);

      const produktName = saeubereFuerDateisystem((item.product_name as string) ?? 'Produkt');
      const kundenDateiname = ((el.file_name as string | null) ?? 'logo.png').trim() || 'logo.png';
      const endung = kundenDateiname.includes('.') ? kundenDateiname.split('.').pop() : null;
      const basisOhneEndung = endung ? kundenDateiname.slice(0, -(endung.length + 1)) : kundenDateiname;
      const endungSicher = endung ? endung.toLowerCase().replace(new RegExp('[^a-z0-9]', 'g'), '') : '';

      let zipEintragsname =
        `Position-${itemIndex + 1}_${produktName}_${saeubereFuerDateisystem(ansichtLabel(view))}_Logo-${logoNummer}_` +
        `${saeubereFuerDateisystem(basisOhneEndung)}${endungSicher ? `.${endungSicher}` : ''}`;

      // Verteidigung gegen Kollisionen (zwei Logos derselben Ansicht mit
      // exakt gleichem bereinigten Namen).
      let zaehlerSuffix = 2;
      const basisName = zipEintragsname;
      while (vergebeneNamen.has(zipEintragsname.toLowerCase())) {
        const punktIndex = basisName.lastIndexOf('.');
        zipEintragsname =
          punktIndex > 0
            ? `${basisName.slice(0, punktIndex)}-${zaehlerSuffix}${basisName.slice(punktIndex)}`
            : `${basisName}-${zaehlerSuffix}`;
        zaehlerSuffix += 1;
      }
      vergebeneNamen.add(zipEintragsname.toLowerCase());

      eintraege.push({
        zipEintragsname,
        storagePfad: originalPath,
        kundenDateiname,
      });
    }
  });

  return eintraege;
}

export interface ZipBauErgebnis {
  /** Erfolgreich gelesene Dateien, bereit zum Einpacken. */
  geladen: { zipEintragsname: string; bytes: Buffer }[];
  /** zipEintragsname + Grund je Datei, die NICHT gelesen werden konnte
   *  (z.B. DSGVO-Altdatei-Löschung, oder kein Original-Pfad hinterlegt) –
   *  nicht fatal, wird im ZIP als Hinweisdatei mitgeliefert statt den
   *  gesamten Download scheitern zu lassen. */
  fehlgeschlagen: { zipEintragsname: string; grund: string }[];
}

/** Lädt die tatsächlichen Bytes aller Einträge – fehlende Einzeldateien
 *  brechen den Gesamt-Download NICHT ab (siehe ZipBauErgebnis.fehlgeschlagen).
 *  Bricht dagegen VOLLSTÄNDIG mit einem Fehler ab, wenn mehr als
 *  MAX_DATEIEN_IM_ZIP Einträge verlangt sind – siehe dortiger Kommentar. */
export async function ladeKundendateiBytes(eintraege: KundendateiEintrag[]): Promise<ZipBauErgebnis> {
  if (eintraege.length > MAX_DATEIEN_IM_ZIP) {
    throw new Error(
      `Diese Bestellung hat ${eintraege.length} Kundendateien – mehr als das Limit von ${MAX_DATEIEN_IM_ZIP} für den ` +
        `ZIP-Sammel-Download. Bitte die Dateien einzeln herunterladen.`
    );
  }

  const geladen: ZipBauErgebnis['geladen'] = [];
  const fehlgeschlagen: ZipBauErgebnis['fehlgeschlagen'] = [];

  await Promise.all(
    eintraege.map(async (eintrag) => {
      if (!eintrag.storagePfad) {
        fehlgeschlagen.push({
          zipEintragsname: eintrag.zipEintragsname,
          grund: 'Kein Original-Pfad hinterlegt (sehr alte Bestellung oder unvollständiger Datensatz).',
        });
        return;
      }
      try {
        const bytes = await downloadProductionFile(eintrag.storagePfad);
        geladen.push({ zipEintragsname: eintrag.zipEintragsname, bytes });
      } catch (fehler) {
        fehlgeschlagen.push({
          zipEintragsname: eintrag.zipEintragsname,
          grund: fehler instanceof Error ? fehler.message : 'Unbekannter Fehler beim Laden.',
        });
      }
    })
  );

  return { geladen, fehlgeschlagen };
}
