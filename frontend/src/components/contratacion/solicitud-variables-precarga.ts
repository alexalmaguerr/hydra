import type { SolicitudState } from '@/types/solicitudes';

/**
 * Convierte variables de solicitud (CEAFUS01, strings) al mapa del wizard / preview de facturación.
 */
export function solicitudVarsToWizardVars(
  vc: Record<string, string>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [k, raw] of Object.entries(vc)) {
    if (raw === undefined || raw === null) continue;
    const v = typeof raw === 'string' ? raw : String(raw);
    if (v === 'true') out[k] = true;
    else if (v === 'false') out[k] = false;
    else out[k] = v;
  }
  return out;
}

/**
 * Cantidades por concepto guardadas en cuantificación (opcional).
 * Si existen en `formData`, se aplican sobre la vista previa con tarifas vigentes (`conceptosOverride`).
 */
export function extractConceptosCuantificacionOverride(
  solForm: SolicitudState | undefined,
): { conceptoCobroId: string; cantidad: number }[] | undefined {
  if (!solForm) return undefined;
  const raw =
    solForm.conceptosCuantificacionOverride ??
    (solForm as unknown as { conceptosOverride?: unknown }).conceptosOverride;
  if (!Array.isArray(raw)) return undefined;
  const out: { conceptoCobroId: string; cantidad: number }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const id =
      typeof o.conceptoCobroId === 'string'
        ? o.conceptoCobroId
        : typeof o.concepto_cobro_id === 'string'
          ? o.concepto_cobro_id
          : '';
    const q =
      typeof o.cantidad === 'number' && Number.isFinite(o.cantidad)
        ? o.cantidad
        : Number(o.cantidad);
    if (!id.trim() || !Number.isFinite(q)) continue;
    out.push({ conceptoCobroId: id.trim(), cantidad: q });
  }
  return out.length ? out : undefined;
}
