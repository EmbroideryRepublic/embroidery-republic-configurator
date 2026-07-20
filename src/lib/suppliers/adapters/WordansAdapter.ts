/**
 * Adapter für wordans.de – vorbereiteter Stub, noch ohne Shop-Logik.
 * Wird relevant, sobald Produkte mit supplierId 'wordans' im Katalog
 * gepflegt sind (src/config/products/supplierRefs.ts).
 */
import { BaseSupplierAdapter } from './SupplierAdapter';
import type { SupplierId } from '../types';

export class WordansAdapter extends BaseSupplierAdapter {
  readonly supplierId: SupplierId = 'wordans';
}
