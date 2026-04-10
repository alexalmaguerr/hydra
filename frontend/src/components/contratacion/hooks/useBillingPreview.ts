import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  previewFacturacion,
  type BillingPreview,
} from '@/api/contratos';

export function formatMxn(n: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(n);
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Aplica cantidades sobrescritas igual que en la creación de factura de contratación (servidor). */
export function applyConceptosOverridesToPreview(
  preview: BillingPreview,
  overrides?: { conceptoCobroId: string; cantidad: number }[],
): BillingPreview {
  const map = new Map((overrides ?? []).map((o) => [o.conceptoCobroId, o.cantidad]));
  const items = preview.items.map((item) => {
    const tipoNorm = (item.tipo ?? '').trim().toLowerCase();
    if (tipoNorm === 'fijo') return item;
    const qty = map.get(item.conceptoCobroId) ?? item.cantidad;
    const importe = roundMoney(qty * item.precioProporcional + item.precioBase);
    const ivaImporte = roundMoney(importe * (item.ivaPct / 100));
    return { ...item, cantidad: qty, importe, ivaImporte };
  });
  const subtotal = roundMoney(items.reduce((s, i) => s + i.importe, 0));
  const totalIva = roundMoney(items.reduce((s, i) => s + i.ivaImporte, 0));
  const total = roundMoney(subtotal + totalIva);
  return { items, subtotal, totalIva, total };
}

export interface UseBillingPreviewParams {
  tipoContratacionId: string | undefined;
  variables: Record<string, string | number | boolean>;
  conceptosOverride?: { conceptoCobroId: string; cantidad: number }[];
}

export function useBillingPreview({
  tipoContratacionId,
  variables,
  conceptosOverride,
}: UseBillingPreviewParams) {
  const query = useQuery({
    queryKey: ['billing-preview', tipoContratacionId, variables],
    queryFn: () => previewFacturacion(tipoContratacionId!, variables),
    enabled: Boolean(tipoContratacionId),
  });

  const preview = useMemo(() => {
    if (!query.data) return undefined;
    return applyConceptosOverridesToPreview(query.data, conceptosOverride);
  }, [query.data, conceptosOverride]);

  return {
    ...query,
    preview,
    rawPreview: query.data,
  };
}
