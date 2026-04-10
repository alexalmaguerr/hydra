import { useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatMxn, useBillingPreview } from '../hooks/useBillingPreview';
import type { StepProps } from '@/components/contratacion/hooks/useWizardState';

function isConceptoFijo(tipo: string | undefined): boolean {
  return (tipo ?? '').trim().toLowerCase() === 'fijo';
}

export default function PasoFacturacion({ data, updateData }: StepProps) {
  const { preview, isLoading, isError, error, refetch } = useBillingPreview({
    tipoContratacionId: data.tipoContratacionId,
    variables: data.variablesCapturadas,
    conceptosOverride: data.conceptosOverride,
  });

  const handleCantidadChange = useCallback(
    (conceptoCobroId: string, raw: string) => {
      const parsed = Number(raw.replace(',', '.'));
      const cantidad = Number.isFinite(parsed) ? parsed : 0;
      const prev = data.conceptosOverride ?? [];
      const without = prev.filter((o) => o.conceptoCobroId !== conceptoCobroId);
      updateData({ conceptosOverride: [...without, { conceptoCobroId, cantidad }] });
    },
    [data.conceptosOverride, updateData],
  );

  if (!data.tipoContratacionId) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
        Seleccione tipo de contratación primero
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Calculando vista previa de facturación…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
        <p className="text-sm text-destructive">
          No se pudo cargar la vista previa: {error instanceof Error ? error.message : 'Error desconocido'}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!preview || preview.items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay conceptos de cobro configurados para este tipo de contratación.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Revise los conceptos y ajuste las cantidades cuando el tipo de concepto no sea fijo.
      </p>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Concepto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="w-[120px]">Cantidad</TableHead>
              <TableHead className="text-right">Precio base</TableHead>
              <TableHead className="text-right">Precio prop.</TableHead>
              <TableHead className="text-right">Importe</TableHead>
              <TableHead className="text-right">IVA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.items.map((row) => {
              const fijo = isConceptoFijo(row.tipo);
              return (
                <TableRow key={row.conceptoCobroId}>
                  <TableCell className="font-medium">{row.nombre}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{row.tipo}</TableCell>
                  <TableCell>
                    {fijo ? (
                      <span className="tabular-nums">{row.cantidad}</span>
                    ) : (
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        className="h-9 w-full tabular-nums"
                        aria-label={`Cantidad para ${row.nombre}`}
                        value={Number.isFinite(row.cantidad) ? row.cantidad : 0}
                        onChange={(e) => handleCantidadChange(row.conceptoCobroId, e.target.value)}
                      />
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatMxn(row.precioBase)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMxn(row.precioProporcional)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatMxn(row.importe)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatMxn(row.ivaImporte)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-medium">
                Subtotal
              </TableCell>
              <TableCell className="text-right tabular-nums font-semibold">{formatMxn(preview.subtotal)}</TableCell>
              <TableCell />
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-medium">
                IVA total
              </TableCell>
              <TableCell />
              <TableCell className="text-right tabular-nums font-semibold">{formatMxn(preview.totalIva)}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5} className="text-right font-medium">
                Total
              </TableCell>
              <TableCell colSpan={2} className="text-right tabular-nums font-bold">
                {formatMxn(preview.total)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}
