'use client';

import { useConfiguratorStore } from '@/stores/configuratorStore';
import { getProduct } from '@/config/products';

/** Farbwert (Hex) der gerade gewählten Textilfarbe – null, solange Produkt oder Farbe fehlen. */
export function useTextilHex(): string | null {
  const productId = useConfiguratorStore((s) => s.productId);
  const colorId = useConfiguratorStore((s) => s.colorId);
  if (!productId || !colorId) return null;
  return getProduct(productId)?.colors.find((c) => c.id === colorId)?.hex ?? null;
}
