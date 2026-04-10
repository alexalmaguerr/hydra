import { CheckCircle2 } from 'lucide-react';

import { formatMxn, useBillingPreview } from '../hooks/useBillingPreview';
import type { StepProps } from '@/components/contratacion/hooks/useWizardState';

export default function PasoConfirmacion({ data }: StepProps) {
  const { preview, isLoading } = useBillingPreview({
    tipoContratacionId: data.tipoContratacionId,
    variables: data.variablesCapturadas,
    conceptosOverride: data.conceptosOverride,
  });

  const totalLabel =
    !data.tipoContratacionId || isLoading ? '—' : preview ? formatMxn(preview.total) : '—';

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center space-y-8 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">Revise los datos del contrato antes de confirmar</h2>
        <p className="text-sm text-muted-foreground">
          Al hacer clic en Crear Contrato, se generará el contrato con todos los datos capturados.
        </p>
      </div>

      <div className="w-full rounded-lg border bg-muted/30 p-6 text-left shadow-sm">
        <dl className="space-y-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Punto de servicio</dt>
            <dd className="font-medium">{data.puntoServicioCodigo?.trim() || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Propietario</dt>
            <dd className="font-medium">{data.propietario?.nombre?.trim() || '—'}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Total facturación (estimado)</dt>
            <dd className="text-lg font-semibold tabular-nums">{totalLabel}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
