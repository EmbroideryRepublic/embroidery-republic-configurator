/**
 * Schreibt alle Produkt-IDs nach public/_pruef/ids.json, damit der
 * Browser-Durchlauf (scripts/pruef/farbdurchlauf.html) sie laden kann, ohne
 * dass die Liste von Hand in die Konsole getippt werden muss.
 *
 *   npx tsx --tsconfig tsconfig.scripts.json scripts/pruefIds.mts
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { PRODUCTS } from '../src/config/products/index.ts';

mkdirSync('public/_pruef', { recursive: true });
writeFileSync('public/_pruef/ids.json', JSON.stringify(PRODUCTS.map((p) => p.id)));
console.log(`${PRODUCTS.length} Produkt-IDs → public/_pruef/ids.json`);
