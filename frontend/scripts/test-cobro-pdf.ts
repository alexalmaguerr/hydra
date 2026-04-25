/**
 * Test rápido del motor de tarifas sin necesitar el frontend.
 * Ejecutar: npx ts-node --esm scripts/test-cobro-pdf.ts
 *
 * Valida:
 *  1. Lookup de tarifa ≤ 200 m³
 *  2. Fórmula > 200 m³
 *  3. Redondeo CEA
 *  4. Recargo mensual
 *  5. Checkboxes aplica agua/alcantarillado/saneamiento
 */

import {
  calcularCargoPeriodo,
  resolveAdministracion,
  resolveTipoTarifa,
  RECARGO_MENSUAL,
} from '../src/lib/tarifas';

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

function log(label: string, value: unknown) {
  console.log(`  ${label.padEnd(30)} ${value}`);
}

console.log('\n══════════════════════════════════════════');
console.log('  TEST: Motor de Tarifas CEA Querétaro   ');
console.log('══════════════════════════════════════════\n');

// ── Caso 1: 24 m3 total, 24 unidades (1 m3/unidad) ──────────────────────────
console.log('① 24 m3 total / 24 unidades → 1 m3 por unidad');
const c1 = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 24, 24);
if (c1) {
  log('Agua:', MXN.format(c1.agua));
  log('Alcantarillado (10%):', MXN.format(c1.alcantarillado));
  log('Saneamiento (12%):', MXN.format(c1.saneamiento));
  log('Subtotal (sin IVA):', MXN.format(c1.subtotal));
  log('Total:', MXN.format(c1.total));
} else console.error('  ❌ No se encontró tarifa');

// ── Caso 2: 15 m3, 1 unidad ──────────────────────────────────────────────────
console.log('\n② 15 m3 / 1 unidad (DOMÉSTICA MEDIO, QUERÉTARO)');
const c2 = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 15, 1);
if (c2) {
  log('Agua:', MXN.format(c2.agua));
  log('Alcantarillado:', MXN.format(c2.alcantarillado));
  log('Saneamiento:', MXN.format(c2.saneamiento));
  log('Total:', MXN.format(c2.total));
}

// ── Caso 3: > 200 m³ ─────────────────────────────────────────────────────────
console.log('\n③ 250 m3 / 1 unidad → usa fórmula > 200');
const c3 = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 250, 1);
if (c3) {
  log('Agua (fórmula):', MXN.format(c3.agua));
  log('  = (250 × $87) × 1 + $221.95', '');
  log('Alcantarillado:', MXN.format(c3.alcantarillado));
  log('Saneamiento:', MXN.format(c3.saneamiento));
  log('Total:', MXN.format(c3.total));
}

// ── Caso 4: Redondeo CEA ─────────────────────────────────────────────────────
console.log('\n④ Redondeo CEA');
// 49 m3 / 2 unidades = 24.5 → ≤ 0.50 → baja a 24
const c4a = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 49, 2);
const c4b = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 24, 2); // exacto 24/unidad
log('49m3/2uds (24.5 → baja a 24):', MXN.format(c4a?.agua ?? 0));
log('48m3/2uds (exacto 24):', MXN.format(c4b?.agua ?? 0));
log('¿Iguales? (deben serlo):', c4a?.agua === c4b?.agua ? '✅ Sí' : '❌ No');

// 49.02 m3 / 2 = 24.51 → > 0.50 → sube a 25
const c4c = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 49.02, 2);
const c4d = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 50, 2); // exacto 25/unidad
log('49.02m3/2uds (24.51 → sube a 25):', MXN.format(c4c?.agua ?? 0));
log('50m3/2uds (exacto 25):', MXN.format(c4d?.agua ?? 0));
log('¿Iguales? (deben serlo):', c4c?.agua === c4d?.agua ? '✅ Sí' : '❌ No');

// ── Caso 5: Recargo mensual ──────────────────────────────────────────────────
console.log('\n⑤ Recargo mensual');
log('Tasa RECARGO_MENSUAL:', `${(RECARGO_MENSUAL * 100).toFixed(4)}%`);
log('¿Es 1.470%?:', RECARGO_MENSUAL === 0.01470 ? '✅ Correcto' : `❌ Es ${RECARGO_MENSUAL}`);
const servicioVencido = c2?.subtotal ?? 0;
const recargo = servicioVencido * RECARGO_MENSUAL;
log(`Recargo sobre ${MXN.format(servicioVencido)}:`, MXN.format(recargo));

// ── Caso 6: Resolución de nombres ────────────────────────────────────────────
console.log('\n⑥ Resolución de nombres');
log('resolveAdministracion("Querétaro"):', resolveAdministracion('Querétaro'));
log('resolveAdministracion("QUERÉTARO"):', resolveAdministracion('QUERÉTARO'));
log('resolveTipoTarifa("DOMÉSTICO INDIVIDUAL"):', resolveTipoTarifa('DOMÉSTICO INDIVIDUAL', 'QUERÉTARO'));
log('resolveTipoTarifa("DOMESTICO MEDIO"):', resolveTipoTarifa('DOMESTICO MEDIO', 'QUERÉTARO'));
log('resolveTipoTarifa("COMERCIAL"):', resolveTipoTarifa('COMERCIAL', 'QUERÉTARO'));

// ── Caso 7: Checkboxes (solo agua, sin alcantarillado ni saneamiento) ────────
console.log('\n⑦ Solo agua aplica');
const cargo = calcularCargoPeriodo('QUERÉTARO', 'DOMÉSTICA MEDIO', 15, 1);
const aplicaAlcantarillado = false;
const aplicaSaneamiento = false;
const agua = cargo?.agua ?? 0;
const alc = aplicaAlcantarillado ? cargo?.alcantarillado ?? 0 : 0;
const san = aplicaSaneamiento ? cargo?.saneamiento ?? 0 : 0;
const total7 = agua + alc + san;
log('Agua:', MXN.format(agua));
log('Alcantarillado (no aplica):', MXN.format(alc));
log('Saneamiento (no aplica):', MXN.format(san));
log('Servicio del periodo:', MXN.format(total7));
log('Recargo mes 2:', MXN.format(total7 * RECARGO_MENSUAL));

console.log('\n══════════════════════════════════════════\n');
