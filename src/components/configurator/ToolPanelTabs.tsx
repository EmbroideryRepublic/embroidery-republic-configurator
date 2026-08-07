'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { LayoutGrid, Type, ImageIcon, Sparkles } from 'lucide-react';
import { LogoUploader } from './LogoUploader';
import { TextToolPanel } from './TextToolPanel';
import { ElementToolbar } from './ElementToolbar';
import { LayersPanel } from './LayersPanel';
import { TemplateToolPanel } from './TemplateToolPanel';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import type { PrintArea } from '@/types';

type TabId = 'design' | 'text' | 'logo' | 'templates';

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'design', label: 'Design', icon: LayoutGrid },
  { id: 'logo', label: 'Logo', icon: ImageIcon },
  { id: 'text', label: 'Text', icon: Type },
  { id: 'templates', label: 'Vorlagen', icon: Sparkles },
];

// Nach einem Logo-Upload zeigt der Logo-Tab kurz die DPI-Qualitätsampel
// (siehe LogoUploader). Der automatische Wechsel zum Design-Tab wird für
// diesen Fall verzögert, damit die Ampel wahrgenommen werden kann, statt
// sofort wieder aus dem DOM entfernt zu werden.
const LOGO_TAB_SWITCH_DELAY_MS = 1800;

interface ToolPanelTabsProps {
  printArea: PrintArea | null;
  printAreas: PrintArea[];
}

export function ToolPanelTabs({ printArea, printAreas }: ToolPanelTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('logo');

  // Sobald irgendwo ein neues Element ausgewählt wird – egal ob durch
  // Hinzufügen ODER durch direktes Anklicken im Canvas – automatisch zum
  // Design-Tab wechseln. Dort liegen alle Bearbeitungsoptionen (Schriftart,
  // Farbe, Größe, Position …). Vorher blieb man z.B. nach dem Hinzufügen
  // eines Textes auf dem Text-Tab stehen und sah die Bearbeitungsoptionen
  // gar nicht.
  // Ausnahme: frisch ausgewählte Logos – dort läuft der Wechsel verzögert,
  // damit die DPI-Qualitätsampel im Logo-Tab kurz sichtbar bleibt (siehe
  // LOGO_TAB_SWITCH_DELAY_MS oben).
  const selectedElementId = useConfiguratorStore((s) => s.selectedElementId);
  const previousSelectedId = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedElementId || selectedElementId === previousSelectedId.current) {
      previousSelectedId.current = selectedElementId;
      return;
    }
    previousSelectedId.current = selectedElementId;

    const selected = useConfiguratorStore.getState().elements.find((el) => el.id === selectedElementId);
    if (selected?.type === 'logo') {
      const timer = setTimeout(() => setActiveTab('design'), LOGO_TAB_SWITCH_DELAY_MS);
      return () => clearTimeout(timer);
    }
    setActiveTab('design');
  }, [selectedElementId]);

  return (
    <div className="overflow-hidden rounded-xl border border-gold/20 bg-white shadow-elegant">
      <div className="flex border-b border-gold/10">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors',
                isActive ? 'border-b-2 border-gold text-gold-dark' : 'border-b-2 border-transparent text-brand/70 hover:text-brand'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="animate-fade-in p-3">
        {activeTab === 'design' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/70">
                Ebenen
              </h3>
              <LayersPanel printArea={printArea} />
            </div>
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/70">
                Ausgewähltes Element
              </h3>
              <ElementToolbar printArea={printArea} />
            </div>
          </div>
        )}
        {activeTab === 'logo' && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/70">
              Logo hinzufügen
            </h3>
            <LogoUploader printArea={printArea} />
          </div>
        )}
        {activeTab === 'text' && (
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand/70">
              Text hinzufügen
            </h3>
            <TextToolPanel printArea={printArea} onElementAdded={() => setActiveTab('design')} />
          </div>
        )}
        {activeTab === 'templates' && (
          <TemplateToolPanel printAreas={printAreas} onApplied={() => setActiveTab('design')} />
        )}
      </div>
    </div>
  );
}
