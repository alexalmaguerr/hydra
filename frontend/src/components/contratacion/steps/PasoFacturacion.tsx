import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';

import type { StepProps } from '@/components/contratacion/hooks/useWizardState';
import { formatMxn, useBillingPreview } from '@/components/contratacion/hooks/useBillingPreview';

const TIPO_ENVIO_OPTIONS: { value: string; label: string }[] = [
  { value: 'PAPEL', label: 'Papel' },
  { value: 'PDF', label: 'Correo electrónico' },
  { value: 'PAPEL_PDF', label: 'Papel y correo electrónico' },
];

const FEATURE_FACTURA_ALTA = import.meta.env.VITE_FEATURE_FACTURACION_CONTRATACION === 'true';

export default function PasoFacturacion({ data, updateData }: StepProps) {
  const variables = useMemo(() => data.variablesCapturadas ?? {}, [data.variablesCapturadas]);
  const { preview, isLoading, isError, refetch, isFetching } = useBillingPreview({
    tipoContratacionId: data.tipoContratacionId,
    variables,
    conceptosOverride: data.conceptosOverride,
  });

  const [selCatalogo, setSelCatalogo] = useState<string>('');
  const [selLectura, setSelLectura] = useState<string>('');

  const idsLectura = data.conceptosLecturaPeriodica;
  const itemsCatalogo = preview?.items ?? [];
  const disponiblesLectura = itemsCatalogo.filter((i) => !idsLectura.includes(i.conceptoCobroId));

  const agregarLectura = () => {
    if (!selCatalogo) return;
    if (idsLectura.includes(selCatalogo)) return;
    updateData({ conceptosLecturaPeriodica: [...idsLectura, selCatalogo] });
    setSelCatalogo('');
  };

  const quitarLectura = () => {
    if (!selLectura) return;
    updateData({ conceptosLecturaPeriodica: idsLectura.filter((id) => id !== selLectura) });
    setSelLectura('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Facturación</h2>
          <p className="text-sm text-muted-foreground">
            Vista previa con tarifas vigentes del tipo de contratación y conceptos de lectura periódica opcionales.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 text-xs"
          onClick={() => updateData({ tipoEnvioFactura: 'PAPEL' })}
        >
          Prellenar demo
        </Button>
      </div>

      <div className="space-y-2 max-w-md">
        <Label>Tipo de entrega de factura</Label>
        <SearchableSelect
          value={data.tipoEnvioFactura ?? ''}
          onValueChange={(v) => updateData({ tipoEnvioFactura: v || undefined })}
          placeholder="Seleccione…"
          searchPlaceholder="Buscar tipo…"
          options={TIPO_ENVIO_OPTIONS}
        />
        <p className="text-xs text-muted-foreground">
          Valores almacenados: <span className="font-mono">PAPEL</span>, <span className="font-mono">PDF</span>,{' '}
          <span className="font-mono">PAPEL_PDF</span>.
        </p>
      </div>

      {FEATURE_FACTURA_ALTA ? (
        <div className="flex items-start gap-3 rounded-lg border p-4 max-w-lg">
          <Checkbox
            id="generar-factura-alta"
            checked={data.generarFacturaContratacion !== false}
            onCheckedChange={(v) => updateData({ generarFacturaContratacion: v === true })}
            aria-labelledby="generar-factura-alta-label"
          />
          <div className="space-y-1">
            <Label id="generar-factura-alta-label" htmlFor="generar-factura-alta" className="text-sm font-medium cursor-pointer">
              Generar factura de contratación al crear el contrato
            </Label>
            <p className="text-xs text-muted-foreground">
              Si está activo el módulo fiscal en servidor, se registrarán conceptos y timbrado pendiente en la misma operación de alta.
            </p>
          </div>
        </div>
      ) : null}

      {!data.tipoContratacionId ? (
        <p className="text-sm text-muted-foreground rounded-md border border-dashed px-3 py-2">
          Seleccione el tipo de contratación en el paso de configuración para calcular la cuantificación.
        </p>
      ) : isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Calculando conceptos y tarifas…
        </div>
      ) : isError ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive">No se pudo obtener la vista previa de facturación.</p>
          <Button type="button" size="sm" variant="outline" onClick={() => refetch()}>
            Reintentar
          </Button>
        </div>
      ) : preview ? (
        <>
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b text-xs">
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Concepto</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Cant.</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Importe</th>
                  <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">IVA</th>
                </tr>
              </thead>
              <tbody>
                {preview.items.map((c) => (
                  <tr key={c.conceptoCobroId} className="border-t">
                    <td className="px-4 py-2.5 font-medium">{c.nombre}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{c.tipo}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{c.cantidad}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{formatMxn(c.importe)}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                      {formatMxn(c.ivaImporte)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t bg-muted/20">
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-sm text-muted-foreground">
                    Subtotal
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">{formatMxn(preview.subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={4} className="px-4 py-2 text-right text-sm text-muted-foreground">
                    IVA
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums font-semibold">{formatMxn(preview.totalIva)}</td>
                </tr>
                <tr className="border-t">
                  <td colSpan={4} className="px-4 py-2.5 text-right font-semibold">
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-base font-bold">{formatMxn(preview.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          {isFetching ? (
            <p className="text-xs text-muted-foreground">Actualizando importes…</p>
          ) : null}

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Conceptos de lectura periódica (opcional)</h3>
            <p className="text-xs text-muted-foreground">
              Tomados del mismo catálogo de conceptos del tipo. Se guardan como{' '}
              <span className="font-mono">conceptosLecturaPeriodicaIds</span> en variables capturadas.
            </p>
            <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
              <div className="flex min-h-[160px] flex-col rounded-lg border bg-muted/10">
                <div className="border-b px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  Catálogo (tipo)
                </div>
                <div className="flex-1 overflow-y-auto p-1" role="listbox" aria-label="Conceptos disponibles">
                  {disponiblesLectura.map((i) => (
                    <button
                      key={i.conceptoCobroId}
                      type="button"
                      role="option"
                      aria-selected={selCatalogo === i.conceptoCobroId}
                      onClick={() => setSelCatalogo(i.conceptoCobroId)}
                      className={`flex w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                        selCatalogo === i.conceptoCobroId ? 'bg-primary/15' : 'hover:bg-muted/60'
                      }`}
                    >
                      {i.nombre}
                    </button>
                  ))}
                  {disponiblesLectura.length === 0 && (
                    <p className="p-2 text-xs text-muted-foreground">Sin conceptos adicionales.</p>
                  )}
                </div>
              </div>
              <div className="flex flex-row justify-center gap-2 sm:flex-col sm:justify-center">
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={!selCatalogo}
                  onClick={agregarLectura}
                  aria-label="Agregar concepto a lectura periódica"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  disabled={!selLectura}
                  onClick={quitarLectura}
                  aria-label="Quitar concepto de lectura periódica"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex min-h-[160px] flex-col rounded-lg border bg-muted/10">
                <div className="border-b px-3 py-1.5 text-xs font-semibold uppercase text-muted-foreground">
                  Seleccionados
                </div>
                <div className="flex-1 overflow-y-auto p-1" role="listbox" aria-label="Conceptos de lectura">
                  {idsLectura.map((id) => {
                    const nom = itemsCatalogo.find((x) => x.conceptoCobroId === id)?.nombre ?? id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="option"
                        aria-selected={selLectura === id}
                        onClick={() => setSelLectura(id)}
                        className={`flex w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
                          selLectura === id ? 'bg-primary/15' : 'hover:bg-muted/60'
                        }`}
                      >
                        {nom}
                      </button>
                    );
                  })}
                  {idsLectura.length === 0 && (
                    <p className="p-2 text-xs text-muted-foreground">Ninguno seleccionado.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
