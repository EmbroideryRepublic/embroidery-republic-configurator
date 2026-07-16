'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Image as ImageIcon, Type, Lock, Unlock, Eye, EyeOff, ChevronUp, ChevronDown, Copy, Trash2 } from 'lucide-react';
import { useConfiguratorStore } from '@/stores/configuratorStore';
import { useLanguageStore, translate } from '@/stores/languageStore';
import type { PrintArea } from '@/types';

interface LayersPanelProps {
  printArea: PrintArea | null;
}

export function LayersPanel({ printArea }: LayersPanelProps) {
  const activeView = useConfiguratorStore((s) => s.activeView);
  const elements = useConfiguratorStore((s) => s.elements);
  const selectedElementId = useConfiguratorStore((s) => s.selectedElementId);
  const setSelectedElementId = useConfiguratorStore((s) => s.setSelectedElementId);
  const renameElement = useConfiguratorStore((s) => s.renameElement);
  const toggleElementLock = useConfiguratorStore((s) => s.toggleElementLock);
  const toggleElementHidden = useConfiguratorStore((s) => s.toggleElementHidden);
  const moveElementUp = useConfiguratorStore((s) => s.moveElementUp);
  const moveElementDown = useConfiguratorStore((s) => s.moveElementDown);
  const duplicateElement = useConfiguratorStore((s) => s.duplicateElement);
  const removeElement = useConfiguratorStore((s) => s.removeElement);
  const copyElement = useConfiguratorStore((s) => s.copyElement);
  const pasteElement = useConfiguratorStore((s) => s.pasteElement);
  const clipboardElement = useConfiguratorStore((s) => s.clipboardElement);
  const language = useLanguageStore((s) => s.language);
  const t = (key: Parameters<typeof translate>[0], vars?: Record<string, string | number>) => translate(key, language, vars);

  const [editingId, setEditingId] = useState<string | null>(null);

  // Reihenfolge in der Liste = Zeichenreihenfolge im Canvas, oberste Zeile
  // = oberste Ebene (also zuletzt gezeichnet). Array ist umgekehrt zur
  // Render-Reihenfolge, damit "oben in der Liste" auch visuell "oben" heißt.
  const viewElements = [...elements].filter((el) => el.view === activeView).reverse();

  const pasteButton = clipboardElement && (
    <button
      type="button"
      onClick={() => pasteElement(activeView, printArea ? [printArea] : [])}
      disabled={!printArea}
      title="Einfügen (Strg+V)"
      className="mb-1.5 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gold/40 py-1.5 text-xs text-gold-dark hover:bg-gold-light/30 disabled:opacity-40"
    >
      <Copy className="h-3.5 w-3.5" />
      &quot;{clipboardElement.name}&quot; hier einfügen
    </button>
  );

  if (viewElements.length === 0) {
    return (
      <div>
        {pasteButton}
        <p className="rounded-lg border border-dashed border-gold/20 bg-cream/40 p-3 text-center text-xs text-brand/40">
          {t('layers_empty')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {pasteButton}
      {viewElements.map((el) => {
        const isSelected = el.id === selectedElementId;
        const Icon = el.type === 'logo' ? ImageIcon : Type;
        return (
          <div
            key={el.id}
            onClick={() => setSelectedElementId(el.id)}
            className={clsx(
              'flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors',
              isSelected ? 'border-gold bg-gold-light/50' : 'border-transparent bg-cream/50 hover:bg-cream'
            )}
          >
            <Icon className="h-3.5 w-3.5 flex-shrink-0 text-brand/40" />

            {editingId === el.id ? (
              <input
                autoFocus
                defaultValue={el.name}
                onBlur={(e) => {
                  renameElement(el.id, e.target.value.trim() || el.name);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                onClick={(e) => e.stopPropagation()}
                className="min-w-0 flex-1 rounded border border-gold/40 bg-white px-1 py-0.5 text-xs"
              />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingId(el.id);
                }}
                className="min-w-0 flex-1 truncate text-left text-brand/80 hover:underline"
                title={t('layers_rename_hint')}
              >
                {el.name}
              </button>
            )}

            <div className="flex flex-shrink-0 items-center gap-0.5">
              <IconButton
                title={t('layers_move_up')}
                onClick={(e) => {
                  e.stopPropagation();
                  moveElementUp(el.id);
                }}
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                title={t('layers_move_down')}
                onClick={(e) => {
                  e.stopPropagation();
                  moveElementDown(el.id);
                }}
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                title={el.hidden ? t('layers_show') : t('layers_hide')}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleElementHidden(el.id);
                }}
              >
                {el.hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </IconButton>
              <IconButton
                title={el.locked ? t('layers_unlock') : t('layers_lock')}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleElementLock(el.id);
                }}
              >
                {el.locked ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
              </IconButton>
              <IconButton
                title={t('element_duplicate')}
                onClick={(e) => {
                  e.stopPropagation();
                  duplicateElement(
                    el.id,
                    printArea ? { movementWidthCm: printArea.movementWidthCm, referenceGarmentHeightCm: printArea.referenceGarmentHeightCm } : undefined
                  );
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </IconButton>
              <IconButton
                title={t('element_delete')}
                danger
                onClick={(e) => {
                  e.stopPropagation();
                  removeElement(el.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </IconButton>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={clsx(
        'rounded p-1 text-brand/40 transition-colors hover:bg-white',
        danger ? 'hover:text-red-500' : 'hover:text-gold-dark'
      )}
    >
      {children}
    </button>
  );
}
