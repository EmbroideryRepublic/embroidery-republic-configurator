/**
 * Öffentliche Oberfläche der Supplier Engine – Konsumenten (Admin-Actions,
 * spätere UI) importieren NUR von hier, nicht aus den Unterordnern.
 */
export * from './types';
export { SUPPLIERS, getSupplierDescriptor, createSupplierAdapter, getSupplierCredentials } from './registry';
export type { SupplierDescriptor } from './registry';
export type { SupplierAdapter } from './adapters/SupplierAdapter';
export { buildSupplierPositions } from './buildSupplierPositions';
export type { SupplierSourceItem } from './buildSupplierPositions';
export { createSupplierOrder } from './createSupplierOrder';
export type { CreateSupplierOrderResult } from './createSupplierOrder';
export { runSupplierJob } from './worker/supplierWorker';
