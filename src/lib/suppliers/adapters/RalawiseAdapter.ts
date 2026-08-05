/**
 * Adapter für ralawise.com – vorbereiteter Stub, noch ohne Shop-Logik.
 * Wird relevant, sobald Produkte mit supplierId 'ralawise' im Katalog
 * gepflegt sind (src/lib/suppliers/supplierRefs.ts).
 */
import { BaseSupplierAdapter } from './SupplierAdapter';
import type { SupplierId } from '../types';

export class RalawiseAdapter extends BaseSupplierAdapter {
  readonly supplierId: SupplierId = 'ralawise';
}
