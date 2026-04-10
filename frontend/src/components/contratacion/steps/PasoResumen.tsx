import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatMxn, useBillingPreview } from '../hooks/useBillingPreview';
import type { StepProps } from '@/components/contratacion/hooks/useWizardState';

function SectionBadge({ ok }: { ok: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        ok
          ? 'border-emerald-600/50 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-100'
          : 'border-amber-600/50 bg-amber-50 text-amber-900 dark:bg-amber-950/50 dark:text-amber-100'
      }
    >
      {ok ? 'Completo' : 'Pendiente'}
    </Badge>
  );
}

function labelVariables(
  config: StepProps['config'],
  key: string,
): string {
  const vars = config?.variables ?? [];
  const found = vars.find((v) => v.id === key || v.tipoVariable?.id === key);
  if (found?.tipoVariable?.nombre) return found.tipoVariable.nombre;
  if (found?.tipoVariable?.codigo) return found.tipoVariable.codigo;
  return key;
}

function formatValor(v: string | number | boolean): string {
  if (typeof v === 'boolean') return v ? 'Sí' : 'No';
  return String(v);
}

export default function PasoResumen({ data, config }: StepProps) {
  const { preview, isLoading: billingLoading } = useBillingPreview({
    tipoContratacionId: data.tipoContratacionId,
    variables: data.variablesCapturadas,
    conceptosOverride: data.conceptosOverride,
  });

  const psOk = !!(data.puntoServicioCodigo?.trim() || data.puntoServicioId);
  const prop = data.propietario;
  const fiscal = data.personaFiscal;
  const contacto = data.personaContacto;
  const personasOk = [prop, fiscal, contacto].some(
    (p) => p && (p.nombre?.trim() || p.rfc?.trim() || p.personaId),
  );
  const configOk = !!(data.actividadId && data.tipoContratacionId);
  const varsOk = Object.keys(data.variablesCapturadas).length > 0;
  const docsOk = data.documentosRecibidos.length > 0;
  const billingOk =
    !!data.tipoContratacionId && !billingLoading && preview != null && preview.total >= 0;

  const ordenesDesc: string[] = [];
  if (data.generarOrdenInstalacionToma) ordenesDesc.push('Instalación de toma');
  if (data.generarOrdenInstalacionMedidor) ordenesDesc.push('Instalación de medidor');
  const ordenesOk = ordenesDesc.length > 0;

  const tipoNombre =
    config?.id === data.tipoContratacionId ? config.nombre : data.tipoContratacionId ?? '—';

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Punto de servicio</CardTitle>
          <SectionBadge ok={psOk} />
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Código</dt>
              <dd className="font-medium">{data.puntoServicioCodigo?.trim() || '—'}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Personas</CardTitle>
          <SectionBadge ok={personasOk} />
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Propietario
            </h4>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nombre</dt>
                <dd>{prop?.nombre?.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">RFC</dt>
                <dd className="font-mono text-xs">{prop?.rfc?.trim() || '—'}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Fiscal
            </h4>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nombre / razón social</dt>
                <dd>{fiscal?.nombre?.trim() || fiscal?.razonSocial?.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">RFC</dt>
                <dd className="font-mono text-xs">{fiscal?.rfc?.trim() || '—'}</dd>
              </div>
            </dl>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Contacto
            </h4>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">Nombre</dt>
                <dd>{contacto?.nombre?.trim() || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">RFC</dt>
                <dd className="font-mono text-xs">{contacto?.rfc?.trim() || '—'}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Configuración</CardTitle>
          <SectionBadge ok={configOk} />
        </CardHeader>
        <CardContent>
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Actividad</dt>
              <dd className="font-mono text-xs">{data.actividadId ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tipo de contratación</dt>
              <dd>{tipoNombre}</dd>
            </div>
            {data.referenciaContratoAnterior ? (
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Referencia contrato anterior</dt>
                <dd>{data.referenciaContratoAnterior}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Variables</CardTitle>
          <SectionBadge ok={varsOk} />
        </CardHeader>
        <CardContent>
          {Object.keys(data.variablesCapturadas).length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin variables capturadas.</p>
          ) : (
            <dl className="grid gap-3 text-sm">
              {Object.entries(data.variablesCapturadas).map(([key, val]) => (
                <div key={key} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
                  <dt className="min-w-[160px] text-muted-foreground">{labelVariables(config, key)}</dt>
                  <dd className="font-medium break-all">{formatValor(val)}</dd>
                </div>
              ))}
            </dl>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Documentos</CardTitle>
          <SectionBadge ok={docsOk} />
        </CardHeader>
        <CardContent>
          {data.documentosRecibidos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ningún documento registrado.</p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {data.documentosRecibidos.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Facturación</CardTitle>
          <SectionBadge ok={billingOk} />
        </CardHeader>
        <CardContent>
          {!data.tipoContratacionId ? (
            <p className="text-sm text-muted-foreground">Sin tipo de contratación — no hay total.</p>
          ) : billingLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Calculando total…
            </div>
          ) : preview ? (
            <p className="text-lg font-semibold tabular-nums">{formatMxn(preview.total)}</p>
          ) : (
            <p className="text-sm text-muted-foreground">No fue posible obtener el total.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg">Órdenes</CardTitle>
          <SectionBadge ok={ordenesOk} />
        </CardHeader>
        <CardContent>
          {ordenesDesc.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se crearán órdenes de instalación.</p>
          ) : (
            <ul className="list-inside list-disc space-y-1 text-sm">
              {ordenesDesc.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
