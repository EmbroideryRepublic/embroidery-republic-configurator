import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConfigElement, ConfiguratorState, PrintArea, PrintMethod, PrintView } from '@/types';
import { MINIMUM_QUANTITY } from '@/lib/pricing/calculatePrice';
import { computeTextBoxCm } from '@/lib/canvas/textSizing';
import { estimateTextStitches } from '@/lib/embroidery/estimateStitches';
import { indexedDbStorage } from '@/lib/storage/indexedDbStorage';

const MAX_HISTORY = 30;

interface ConfiguratorActions {
  setPrintMethod: (method: PrintMethod) => void;
  setProduct: (productId: string) => void;
  setColor: (colorId: string) => void;
  /** Menge für eine einzelne Größe setzen (0 = aus der Auswahl entfernen). */
  setSizeQuantity: (size: string, quantity: number) => void;
  resetSizeQuantities: () => void;
  setActiveView: (view: PrintView) => void;

  addElement: (element: ConfigElement) => void;
  /** Laufende, häufige Änderungen (z.B. während des Ziehens) – NICHT in der
   *  Undo-Historie erfasst, sonst würde jeder Zwischenschritt einen
   *  Undo-Eintrag erzeugen. */
  updateElement: (id: string, changes: Partial<ConfigElement>) => void;
  /** Abgeschlossene, bewusste Änderungen (Ende von Verschieben/Skalieren/
   *  Drehen, Positions-Presets) – wird in der Undo-Historie erfasst. */
  commitElement: (id: string, changes: Partial<ConfigElement>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string, bounds?: { movementWidthCm: number; referenceGarmentHeightCm: number }) => void;

  /** Kopieren/Einfügen (Strg+C/Strg+V) – auch über Ansichten hinweg (z.B.
   *  Logo von der Vorderseite auf der Rückseite einfügen). Die Zwischen-
   *  ablage wird bewusst NICHT gespeichert (kein Sinn nach Neuladen). */
  clipboardElement: ConfigElement | null;
  copyElement: (id: string) => void;
  pasteElement: (targetView: PrintView, printAreas: PrintArea[]) => void;

  /** Ebenen-Verwaltung */
  renameElement: (id: string, name: string) => void;
  toggleElementLock: (id: string) => void;
  toggleElementHidden: (id: string) => void;
  moveElementUp: (id: string) => void;
  moveElementDown: (id: string) => void;

  /**
   * Passt bestehende Elemente an neue Druckbereiche an (nach Produkt- oder
   * Veredelungswechsel), statt das Design zu verwerfen. Elemente werden in
   * den neuen Bereich hineingeklemmt (Position/Größe), falls nötig.
   * Elemente einer Ansicht, für die es im neuen Kontext keinen Druckbereich
   * mehr gibt, werden entfernt. Gibt die Anzahl entfernter Elemente zurück,
   * damit die UI den Kunden freundlich informieren kann.
   */
  syncElementsToPrintAreas: (printAreas: PrintArea[]) => number;

  /** UI-Auswahl (nicht Teil der gespeicherten Konfiguration) */
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;

  /** Undo/Redo-Historie über strukturelle und abgeschlossene Änderungen. */
  history: ConfigElement[][];
  future: ConfigElement[][];
  undo: () => void;
  redo: () => void;

  setPrices: (unitPrice: number, totalPrice: number) => void;
  reset: () => void;
  resetDesign: () => void;
  /** Lädt eine bereits im Warenkorb liegende Position zurück in den Editor
   *  (Produkt, Farbe, Veredelung, Größen/Mengen, Design) – für "Bearbeiten"
   *  im Warenkorb, statt alles neu konfigurieren zu müssen. */
  loadCartItemForEditing: (item: {
    printMethod: PrintMethod;
    productId: string;
    colorId: string;
    sizeQuantities: Record<string, number>;
    elements: ConfigElement[];
  }) => void;
}

const initialState: ConfiguratorState = {
  printMethod: 'dtf',
  productId: null,
  colorId: null,
  sizeQuantities: {},
  activeView: 'front',
  elements: [],
  unitPrice: 0,
  totalPrice: 0,
};

function snapshot(state: { history: ConfigElement[][]; elements: ConfigElement[] }) {
  return [...state.history.slice(-(MAX_HISTORY - 1)), state.elements];
}

export const useConfiguratorStore = create<ConfiguratorState & ConfiguratorActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Wechsel der Veredelungsart ändert Druckbereichsgrößen ggf. stark –
      // das Design bleibt trotzdem erhalten, `syncElementsToPrintAreas`
      // (vom aufrufenden Code nach dem Laden der neuen Bereiche aufgerufen)
      // passt Position/Größe an bzw. entfernt nicht mehr passende Elemente.
      setPrintMethod: (printMethod) => set({ printMethod, selectedElementId: null }),

      setProduct: (productId) => set({ productId, selectedElementId: null }),
      setColor: (colorId) => set({ colorId }),
      setSizeQuantity: (size, quantity) =>
        set((state) => {
          const next = { ...state.sizeQuantities };
          if (quantity <= 0) {
            delete next[size];
          } else {
            next[size] = quantity;
          }
          return { sizeQuantities: next };
        }),
      resetSizeQuantities: () => set({ sizeQuantities: {} }),
      setActiveView: (activeView) => set({ activeView, selectedElementId: null }),

      addElement: (element) =>
        set((state) => ({
          history: snapshot(state),
          future: [],
          elements: [...state.elements, element],
        })),

      updateElement: (id, changes) =>
        set((state) => ({
          elements: state.elements.map((el) =>
            el.id === id ? ({ ...el, ...changes } as ConfigElement) : el
          ),
        })),

      commitElement: (id, changes) =>
        set((state) => ({
          history: snapshot(state),
          future: [],
          elements: state.elements.map((el) =>
            el.id === id ? ({ ...el, ...changes } as ConfigElement) : el
          ),
        })),

      removeElement: (id) =>
        set((state) => ({
          history: snapshot(state),
          future: [],
          elements: state.elements.filter((el) => el.id !== id),
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
        })),

      clipboardElement: null,
      copyElement: (id) => {
        const original = get().elements.find((el) => el.id === id);
        if (!original) return;
        set({ clipboardElement: original });
      },
      pasteElement: (targetView, printAreas) => {
        const clipboard = get().clipboardElement;
        if (!clipboard) return;
        const area = printAreas.find((a) => a.view === targetView);
        if (!area) return;

        // In den Zielbereich hineinklemmen (Größe ggf. verkleinern), damit
        // ein Logo, das z.B. auf der breiten Rückseite kopiert wurde, auf
        // dem schmaleren Ärmel nicht über den Rand hinausragt.
        const widthCm = Math.min(clipboard.widthCm, area.maxWidthCm);
        const heightCm = Math.min(clipboard.heightCm, area.maxHeightCm);
        const scale = widthCm / clipboard.widthCm;

        // Beim Einfügen in dieselbe Ansicht leicht versetzen (sonst liegt
        // die Kopie exakt auf dem Original und wirkt wie "nichts passiert").
        const sameView = clipboard.view === targetView;
        const offset = sameView ? 1 : 0;
        const xCm = Math.min(Math.max(clipboard.xCm + offset, 0), Math.max(area.movementWidthCm - widthCm, 0));
        const yCm = Math.min(Math.max(clipboard.yCm + offset, 0), Math.max(area.referenceGarmentHeightCm - heightCm, 0));

        const pasted: ConfigElement = {
          ...clipboard,
          id: crypto.randomUUID(),
          view: targetView,
          widthCm,
          heightCm,
          xCm,
          yCm,
          isOutOfBounds: false,
          name: sameView ? `${clipboard.name} (Kopie)` : clipboard.name,
          ...(clipboard.type === 'text' ? { fontSizePx: clipboard.fontSizePx * scale } : {}),
        } as ConfigElement;

        set((state) => ({
          history: snapshot(state),
          future: [],
          elements: [...state.elements, pasted],
          selectedElementId: pasted.id,
        }));
      },
      duplicateElement: (id, bounds) => {
        const original = get().elements.find((el) => el.id === id);
        if (!original) return;

        let xCm = original.xCm + 1;
        let yCm = original.yCm + 1;

        if (bounds) {
          const maxX = Math.max(bounds.movementWidthCm - original.widthCm, 0);
          const maxY = Math.max(bounds.referenceGarmentHeightCm - original.heightCm, 0);
          xCm = Math.min(xCm, maxX);
          yCm = Math.min(yCm, maxY);
        }

        const copy: ConfigElement = {
          ...original,
          id: crypto.randomUUID(),
          xCm,
          yCm,
          isOutOfBounds: false,
          name: `${original.name} (Kopie)`,
        };
        set((state) => ({
          history: snapshot(state),
          future: [],
          elements: [...state.elements, copy],
          selectedElementId: copy.id,
        }));
      },

      renameElement: (id, name) =>
        set((state) => ({
          elements: state.elements.map((el) => (el.id === id ? { ...el, name } : el)),
        })),

      toggleElementLock: (id) =>
        set((state) => ({
          history: snapshot(state),
          future: [],
          elements: state.elements.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)),
        })),

      toggleElementHidden: (id) =>
        set((state) => ({
          elements: state.elements.map((el) => (el.id === id ? { ...el, hidden: !el.hidden } : el)),
        })),

      // Ebenenreihenfolge: spätere Elemente im Array werden im Canvas später
      // (also oben) gezeichnet. "Nach oben" verschiebt ein Element im Array
      // nach hinten.
      moveElementUp: (id) =>
        set((state) => {
          const index = state.elements.findIndex((el) => el.id === id);
          if (index === -1 || index === state.elements.length - 1) return state;
          const elements = [...state.elements];
          const current = elements[index];
          const next = elements[index + 1];
          if (!current || !next) return state;
          elements[index] = next;
          elements[index + 1] = current;
          return { history: snapshot(state), future: [], elements };
        }),

      moveElementDown: (id) =>
        set((state) => {
          const index = state.elements.findIndex((el) => el.id === id);
          if (index <= 0) return state;
          const elements = [...state.elements];
          const current = elements[index];
          const previous = elements[index - 1];
          if (!current || !previous) return state;
          elements[index] = previous;
          elements[index - 1] = current;
          return { history: snapshot(state), future: [], elements };
        }),

      syncElementsToPrintAreas: (printAreas) => {
        const state = get();
        let droppedCount = 0;

        const nextElements: ConfigElement[] = [];
        for (const el of state.elements) {
          const area = printAreas.find((a) => a.view === el.view);
          if (!area) {
            droppedCount += 1;
            continue;
          }

          if (el.type === 'text') {
            // WICHTIG: Bei Text nicht nur die Box klemmen, sonst laufen
            // Schriftgröße und Box auseinander (Text ragt sichtbar über die
            // künstlich verkleinerte Box hinaus). Stattdessen die
            // Schriftgröße mitskalieren und die Box aus der echten
            // Textmessung bei der neuen Schriftgröße neu berechnen.
            let fontSizePx = el.fontSizePx;
            let box = computeTextBoxCm(el.content, el.fontFamily, fontSizePx, el.bold, el.italic, area);

            if (box.widthCm > area.maxWidthCm || box.heightCm > area.maxHeightCm) {
              const scale = Math.min(area.maxWidthCm / box.widthCm, area.maxHeightCm / box.heightCm);
              fontSizePx = Math.max(6, fontSizePx * scale);
              box = computeTextBoxCm(el.content, el.fontFamily, fontSizePx, el.bold, el.italic, area);
            }

            const xCm = Math.min(Math.max(el.xCm, 0), Math.max(area.movementWidthCm - box.widthCm, 0));
            const yCm = Math.min(Math.max(el.yCm, 0), Math.max(area.referenceGarmentHeightCm - box.heightCm, 0));

            nextElements.push({
              ...el,
              fontSizePx,
              widthCm: box.widthCm,
              heightCm: box.heightCm,
              xCm,
              yCm,
              isOutOfBounds: false,
              estimatedStitches: estimateTextStitches(box.widthCm * box.heightCm, el.inkCoverageRatio ?? 0.35),
            });
            continue;
          }

          // Logos: Größe/Position wie bisher in den neuen Bereich hineinklemmen.
          const widthCm = Math.min(el.widthCm, area.maxWidthCm);
          const heightCm = Math.min(el.heightCm, area.maxHeightCm);
          const xCm = Math.min(Math.max(el.xCm, 0), Math.max(area.movementWidthCm - widthCm, 0));
          const yCm = Math.min(Math.max(el.yCm, 0), Math.max(area.referenceGarmentHeightCm - heightCm, 0));

          // Stichzahl anteilig zur Flächenänderung mitskalieren (grobe,
          // aber synchron mögliche Näherung – eine echte Neuvermessung des
          // Bildes wäre asynchron und würde den Produktwechsel spürbar
          // verzögern; sie erfolgt ohnehin automatisch beim nächsten
          // Skalieren des Logos im Canvas).
          const oldArea = el.widthCm * el.heightCm;
          const newArea = widthCm * heightCm;
          const scaledStitches =
            oldArea > 0 ? Math.round((el.estimatedStitches ?? 0) * (newArea / oldArea)) : el.estimatedStitches ?? 0;

          nextElements.push({
            ...el,
            widthCm,
            heightCm,
            xCm,
            yCm,
            isOutOfBounds: false,
            estimatedStitches: scaledStitches,
          } as ConfigElement);
        }

        if (droppedCount > 0 || nextElements.length !== state.elements.length) {
          set({ elements: nextElements, history: [], future: [], selectedElementId: null });
        } else if (
          nextElements.some((el, i) => {
            const orig = state.elements[i];
            if (!orig) return true;
            return el.widthCm !== orig.widthCm || el.xCm !== orig.xCm || el.yCm !== orig.yCm;
          })
        ) {
          set({ elements: nextElements });
        }

        return droppedCount;
      },

      selectedElementId: null,
      setSelectedElementId: (id) => set({ selectedElementId: id }),

      history: [],
      future: [],

      undo: () =>
        set((state) => {
          const previous = state.history[state.history.length - 1];
          if (!previous) return state;
          return {
            elements: previous,
            history: state.history.slice(0, -1),
            future: [...state.future, state.elements].slice(-MAX_HISTORY),
            selectedElementId: null,
          };
        }),

      redo: () =>
        set((state) => {
          const next = state.future[state.future.length - 1];
          if (!next) return state;
          return {
            elements: next,
            future: state.future.slice(0, -1),
            history: [...state.history, state.elements].slice(-MAX_HISTORY),
            selectedElementId: null,
          };
        }),

      setPrices: (unitPrice, totalPrice) => set({ unitPrice, totalPrice }),

      reset: () => set({ ...initialState, selectedElementId: null, history: [], future: [] }),

      resetDesign: () =>
        set({
          elements: [],
          selectedElementId: null,
          history: [],
          future: [],
          sizeQuantities: {},
        }),

      loadCartItemForEditing: (item) =>
        set({
          printMethod: item.printMethod,
          productId: item.productId,
          colorId: item.colorId,
          sizeQuantities: { ...item.sizeQuantities },
          elements: item.elements.map((el) => ({ ...el })),
          selectedElementId: null,
          activeView: 'front',
          history: [],
          future: [],
        }),
    }),
    {
      name: 'konfigurator-design',
      // IndexedDB statt localStorage (siehe indexedDbStorage.ts) – behebt
      // QuotaExceededError bei mehreren Logos (Base64-Bilddaten sprengen
      // schnell das kleine localStorage-Limit).
      storage: createJSONStorage(() => indexedDbStorage),
      // WICHTIG: Version hochzählen, sobald sich die Struktur von
      // ConfigElement (z.B. TextElement) ändert – z.B. neue Pflichtfelder
      // wie letterSpacing/hasOutline. Ohne das würden ältere, im Browser
      // gespeicherte Elemente ohne diese Felder geladen und einzelne
      // Bedienelemente (die genau dieses Feld lesen/schreiben) würden ins
      // Leere laufen, ohne dass ein Fehler sichtbar wird.
      version: 8,
      migrate: (persistedState, storedVersion) => {
        const state = persistedState as Partial<ConfiguratorState> & { sizeLabel?: string | null; quantity?: number };
        if (storedVersion < 7) {
          // Struktur von TextElement hat sich geändert – gespeichertes
          // Design ist nicht mehr sicher kompatibel. Produkt/Farbe/Größe
          // bleiben erhalten, nur die platzierten Elemente werden
          // zurückgesetzt (einmalig, betrifft nur alte Browser-Stände).
          state.elements = [];
        }
        if (storedVersion < 8) {
          // sizeLabel + quantity (eine Größe) -> sizeQuantities (mehrere
          // Größen gleichzeitig). Alten Einzelwert als Startpunkt übernehmen,
          // statt ihn zu verwerfen.
          const { sizeLabel, quantity, ...rest } = state;
          return { ...rest, sizeQuantities: sizeLabel ? { [sizeLabel]: quantity ?? MINIMUM_QUANTITY } : {} };
        }
        return state;
      },
      // Nur die eigentliche Konfiguration zwischenspeichern, nicht die
      // Undo-Historie oder die UI-Auswahl (selectedElementId) – die machen
      // nach einem Neuladen der Seite ohnehin keinen Sinn mehr.
      partialize: (state) => ({
        printMethod: state.printMethod,
        productId: state.productId,
        colorId: state.colorId,
        sizeQuantities: state.sizeQuantities,
        activeView: state.activeView,
        elements: state.elements,
      }),
    }
  )
);
