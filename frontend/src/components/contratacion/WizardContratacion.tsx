import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { createContrato, type CreateContratoDto, type CreateContratoResponseDto } from '@/api/contratos';
import { fetchProceso } from '@/api/procesos-contratacion';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  WIZARD_STEPS,
  initialWizardData,
  mergeVariablesCapturadasRecord,
  useWizardState,
  variablesStepSatisfied,
  type WizardData,
} from './hooks/useWizardState';
import { useTipoContratacionConfig } from './hooks/useTipoContratacionConfig';
import PasoServicioPoint from './steps/PasoServicioPoint';
import PasoPersonas from './steps/PasoPersonas';
import PasoConfigContrato from './steps/PasoConfigContrato';
import PasoVariables from './steps/PasoVariables';
import PasoDocumentos from './steps/PasoDocumentos';
import PasoFacturacion from './steps/PasoFacturacion';
import PasoOrdenes from './steps/PasoOrdenes';
import PasoResumen from './steps/PasoResumen';
import PasoConfirmacion from './steps/PasoConfirmacion';

export interface WizardContratacionProps {
  onComplete: () => void;
  onCancel: () => void;
  /** Si viene de la URL u otra pantalla: precarga compatible con `GET /procesos-contratacion/:id`. */
  procesoPrecargaId?: string | null;
}

function buildCreateContratoDto(data: WizardData): CreateContratoDto {
  const fecha = new Date().toISOString().split('T')[0];
  const prop = data.propietario;
  const nombreCompleto = [prop?.paterno, prop?.materno, prop?.nombre]
    .filter(Boolean).join(' ').trim() || '';
  const tipoContrato = (data.claseContratacion ?? '').trim() || 'ALTA';
  const tipoServicio = (data.tipoPuntoServicio ?? '').trim() || 'AGUA';
  const dto: CreateContratoDto = {
    puntoServicioId: data.puntoServicioId || undefined,
    actividadId: data.actividadId || undefined,
    tipoContratacionId: data.tipoContratacionId?.trim() || undefined,
    referenciaContratoAnterior: data.referenciaContratoAnterior?.trim() || undefined,
    tipoContrato,
    tipoServicio,
    nombre: nombreCompleto,
    rfc: prop?.rfc?.trim() ?? '',
    direccion: '',
    contacto: prop?.telefonos?.trim() || prop?.email?.trim() || '',
    estado: 'Pendiente de alta',
    fecha,
    tipoEnvioFactura: data.tipoEnvioFactura?.trim() || undefined,
    variablesCapturadas: mergeVariablesCapturadasRecord(data),
    documentosRecibidos: data.documentosRecibidos.length
      ? Array.from(new Set(data.documentosRecibidos.map((d) => d.trim()).filter((d) => d.length > 0)))
      : undefined,
    generarOrdenInstalacionToma: data.generarOrdenInstalacionToma || undefined,
    generarOrdenInstalacionMedidor:
      !data.generarOrdenInstalacionToma && data.generarOrdenInstalacionMedidor ? true : undefined,
    conceptosOverride: data.conceptosOverride?.length ? data.conceptosOverride : undefined,
  };

  if (
    data.superficiePredio != null &&
    Number.isFinite(data.superficiePredio) &&
    data.superficiePredio >= 0
  ) {
    dto.superficiePredio = data.superficiePredio;
  }
  if (
    data.superficieConstruida != null &&
    Number.isFinite(data.superficieConstruida) &&
    data.superficieConstruida >= 0
  ) {
    dto.superficieConstruida = data.superficieConstruida;
  }
  if (
    data.unidadesServidas != null &&
    Number.isFinite(data.unidadesServidas) &&
    data.unidadesServidas >= 0 &&
    Number.isInteger(data.unidadesServidas)
  ) {
    dto.unidadesServidas = data.unidadesServidas;
  }
  if (
    data.personasHabitanVivienda != null &&
    Number.isFinite(data.personasHabitanVivienda) &&
    data.personasHabitanVivienda >= 0 &&
    Number.isInteger(data.personasHabitanVivienda)
  ) {
    dto.personasHabitanVivienda = data.personasHabitanVivienda;
  }

  if (
    import.meta.env.VITE_FEATURE_FACTURACION_CONTRATACION === 'true' &&
    dto.tipoContratacionId &&
    data.generarFacturaContratacion !== false
  ) {
    dto.generarFacturaContratacion = true;
  }

  // Backend requiere personaId O (nombre + rfc) — solo enviamos si tenemos ambos o personaId
  const pf = data.personaFiscal;
  const pfNombre = [pf?.paterno, pf?.materno, pf?.nombre].filter(Boolean).join(' ').trim();
  const pfRfc = pf?.rfc?.trim();
  if (pf && (pf.personaId || (pfNombre && pfRfc))) {
    dto.personaFiscal = {
      personaId: pf.personaId,
      nombre: pfNombre || undefined,
      rfc: pfRfc || undefined,
      email: pf.email?.trim() || undefined,
      telefono: pf.telefonos?.trim() || undefined,
      razonSocial: pf.razonSocial?.trim() || undefined,
      regimenFiscal: pf.regimenFiscal?.trim() || undefined,
    };
  }

  const pc = data.personaContacto;
  const pcNombre = [pc?.paterno, pc?.nombre].filter(Boolean).join(' ').trim();
  // Contacto es opcional — solo enviamos si tiene personaId o (nombre + rfc)
  if (pc && (pc.personaId || (pcNombre && pc.rfc?.trim()))) {
    dto.personaContacto = {
      personaId: pc.personaId,
      nombre: pcNombre || undefined,
      email: pc.email?.trim() || undefined,
      telefono: pc.telefonos?.trim() || undefined,
    };
  }

  if (prop?.razonSocial?.trim()) dto.razonSocial = prop.razonSocial.trim();
  if (prop?.regimenFiscal?.trim()) dto.regimenFiscal = prop.regimenFiscal.trim();

  return dto;
}

function canCreateContract(data: WizardData): boolean {
  const prop = data.propietario;
  const fiscal = data.personaFiscal;
  const tieneNombreProp = !!(prop?.nombre?.trim() || prop?.paterno?.trim() || prop?.personaId);
  const tieneNombreFiscal = !!(fiscal?.nombre?.trim() || fiscal?.paterno?.trim() || fiscal?.rfc?.trim() || fiscal?.personaId);
  return !!data.puntoServicioId?.trim() && tieneNombreProp && tieneNombreFiscal;
}

const stepComponents = [
  PasoServicioPoint,
  PasoPersonas,
  PasoConfigContrato,
  PasoVariables,
  PasoDocumentos,
  PasoFacturacion,
  PasoOrdenes,
  PasoResumen,
  PasoConfirmacion,
] as const;

export function WizardContratacion({ onComplete, onCancel, procesoPrecargaId }: WizardContratacionProps) {
  const queryClient = useQueryClient();
  const {
    currentStep,
    data,
    updateData,
    resetTo,
    next,
    prev,
    canGoNext,
    isLastStep,
    isFirstStep,
  } = useWizardState();

  const procesoQ = useQuery({
    queryKey: ['proceso-contratacion', procesoPrecargaId],
    queryFn: () => fetchProceso(procesoPrecargaId!),
    enabled: Boolean(procesoPrecargaId?.trim()),
  });

  const precargaAplicadaParaId = useRef<string | null>(null);

  useEffect(() => {
    if (!procesoPrecargaId?.trim()) {
      precargaAplicadaParaId.current = null;
    }
  }, [procesoPrecargaId]);

  useEffect(() => {
    if (!procesoPrecargaId?.trim() || !procesoQ.isSuccess || !procesoQ.data) return;
    if (precargaAplicadaParaId.current === procesoPrecargaId) return;
    precargaAplicadaParaId.current = procesoPrecargaId;
    const p = procesoQ.data;
    const extra =
      p.datosAdicionales && typeof p.datosAdicionales === 'object' && !Array.isArray(p.datosAdicionales)
        ? (p.datosAdicionales as Record<string, unknown>)
        : {};
    const patch: Partial<WizardData> = {};

    const psFromExtra = typeof extra.puntoServicioId === 'string' ? extra.puntoServicioId : undefined;
    const psFromContrato = p.contrato?.puntoServicioId ?? undefined;
    if (psFromExtra || psFromContrato) {
      patch.puntoServicioId = psFromExtra ?? psFromContrato ?? undefined;
    }

    const c = p.contrato;
    if (c?.tipoContratacion?.id) {
      patch.tipoContratacionId = c.tipoContratacion.id;
      patch.tipoContratacionDescripcion = c.tipoContratacion.nombre ?? '';
    }
    if (c?.actividadId) patch.actividadId = c.actividadId;
    if (c?.referenciaContratoAnterior) patch.referenciaContratoAnterior = c.referenciaContratoAnterior;
    if (c?.tipoEnvioFactura) patch.tipoEnvioFactura = c.tipoEnvioFactura;
    if (c?.superficiePredio != null && Number.isFinite(c.superficiePredio)) {
      patch.superficiePredio = c.superficiePredio;
    }
    if (c?.superficieConstruida != null && Number.isFinite(c.superficieConstruida)) {
      patch.superficieConstruida = c.superficieConstruida;
    }
    if (c?.unidadesServidas != null && Number.isFinite(c.unidadesServidas)) {
      patch.unidadesServidas = c.unidadesServidas;
    }
    if (c?.personasHabitanVivienda != null && Number.isFinite(c.personasHabitanVivienda)) {
      patch.personasHabitanVivienda = c.personasHabitanVivienda;
    }

    const vc = c?.variablesCapturadas;
    if (vc && typeof vc === 'object' && !Array.isArray(vc)) {
      const o = vc as Record<string, unknown>;
      const nextVc: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(o)) {
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') nextVc[k] = v;
      }
      if (typeof o.distritoId === 'string') patch.distritoId = o.distritoId;
      if (typeof o.fechaInstalacionConexion === 'string') patch.fechaInstalacionConexion = o.fechaInstalacionConexion;
      if (typeof o.calibreMedidorId === 'string') patch.calibreMedidorId = o.calibreMedidorId;
      if (typeof o.posibleCorte === 'boolean') patch.posibleCorte = o.posibleCorte;
      if (typeof o.conexionYaExiste === 'boolean') patch.conexionYaExiste = o.conexionYaExiste;
      if (Object.keys(nextVc).length) patch.variablesCapturadas = nextVc;
      const ids = o.conceptosLecturaPeriodicaIds;
      if (typeof ids === 'string' && ids.trim()) {
        patch.conceptosLecturaPeriodica = ids.split(',').map((s) => s.trim()).filter(Boolean);
      }
    }

    for (const rp of c?.personas ?? []) {
      const person = rp.persona;
      const pw = {
        personaId: person.id,
        nombre: person.nombre?.trim() || undefined,
        rfc: person.rfc?.trim() || undefined,
      };
      if (rp.rol === 'PROPIETARIO') patch.propietario = pw;
      if (rp.rol === 'FISCAL') patch.personaFiscal = pw;
      if (rp.rol === 'CONTACTO') patch.personaContacto = pw;
    }

    resetTo({ ...initialWizardData(), ...patch });
  }, [procesoPrecargaId, procesoQ.isSuccess, procesoQ.data, resetTo]);

  const {
    data: config,
    isPending: tipoConfigPending,
    isFetching: tipoConfigFetching,
    isError: tipoConfigError,
  } = useTipoContratacionConfig(
    data.tipoContratacionId?.trim() ? data.tipoContratacionId.trim() : undefined,
  );

  const variablesStepReady = useMemo(() => {
    if (currentStep !== 3) return true;
    if (!data.tipoContratacionId?.trim()) return false;
    if (tipoConfigError) return false;
    if (tipoConfigPending || tipoConfigFetching) return false;
    return variablesStepSatisfied(data, config ?? undefined);
  }, [currentStep, data, config, tipoConfigPending, tipoConfigFetching, tipoConfigError]);

  const effectiveCanGoNext = useMemo(
    () => (currentStep === 3 ? variablesStepReady : canGoNext),
    [currentStep, variablesStepReady, canGoNext],
  );

  const createMutation = useMutation({
    mutationFn: (dto: CreateContratoDto) => createContrato(dto),
    onSuccess: async (created: CreateContratoResponseDto) => {
      await queryClient.invalidateQueries({ queryKey: ['contratos'] });
      if (created.facturaContratacion) {
        toast.success('Contrato creado', {
          description: `Factura de contratación registrada (total ${created.facturaContratacion.total.toFixed(2)} MXN).`,
        });
      } else {
        toast.success('Contrato creado', { description: 'El contrato se registró correctamente.' });
      }
      onComplete();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'No se pudo crear el contrato.';
      toast.error('Error al crear contrato', { description: message });
    },
  });

  const StepView = stepComponents[currentStep];

  const stepProps = useMemo(
    () => ({
      data,
      updateData,
      config: config ?? undefined,
    }),
    [data, updateData, config],
  );

  const handlePrimary = useCallback(() => {
    if (isLastStep) {
      if (!canCreateContract(data)) {
        const prop = data.propietario;
        const fiscal = data.personaFiscal;
        const missingProp = !(prop?.nombre?.trim() || prop?.paterno?.trim() || prop?.personaId);
        const missingFiscalRfc = !!(fiscal?.personaId == null && !(fiscal?.rfc?.trim()));
        const desc = !data.puntoServicioId
          ? 'Seleccione un punto de servicio.'
          : missingProp
          ? 'Complete el nombre del propietario/titular.'
          : missingFiscalRfc
          ? 'La persona fiscal requiere nombre y RFC.'
          : 'Complete los datos obligatorios antes de continuar.';
        toast.error('Datos incompletos', { description: desc });
        return;
      }
      createMutation.mutate(buildCreateContratoDto(data));
      return;
    }
    next();
  }, [isLastStep, data, next, createMutation]);

  const primaryDisabled =
    isLastStep
      ? !canCreateContract(data) || createMutation.isPending
      : !effectiveCanGoNext || createMutation.isPending;

  const primaryLabel = isLastStep
    ? createMutation.isPending
      ? 'Creando…'
      : 'Crear Contrato'
    : 'Siguiente';

  return (
    <div className="flex flex-col gap-6">
      <nav aria-label="Progreso del asistente de contratación" className="w-full overflow-x-auto pb-2">
        <ol className="flex min-w-[640px] items-center sm:min-w-0">
          {WIZARD_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            const segmentDone = i < currentStep;
            return (
              <React.Fragment key={step.key}>
                <li className="flex flex-col items-center gap-1">
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-semibold transition-colors',
                      done && 'border-emerald-600 bg-emerald-600 text-white',
                      active && !done && 'border-blue-600 bg-blue-600 text-white',
                      !active && !done && 'border-muted-foreground/35 bg-muted text-muted-foreground',
                    )}
                    aria-current={active ? 'step' : undefined}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : <span>{i + 1}</span>}
                  </div>
                  <span
                    className={cn(
                      'hidden max-w-[4.5rem] truncate text-center text-[10px] leading-tight sm:block',
                      active ? 'font-medium text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.label}
                  </span>
                </li>
                {i < WIZARD_STEPS.length - 1 ? (
                  <div
                    className={cn('mx-1 h-0.5 min-w-[12px] flex-1', segmentDone ? 'bg-emerald-600' : 'bg-border')}
                    aria-hidden
                  />
                ) : null}
              </React.Fragment>
            );
          })}
        </ol>
      </nav>

      {procesoPrecargaId?.trim() && procesoQ.isSuccess ? (
        <p className="text-xs text-muted-foreground rounded-md border border-dashed bg-muted/30 px-3 py-2">
          Valores iniciales tomados del proceso{' '}
          <span className="font-mono text-foreground">{procesoPrecargaId}</span>. Verifique y complete el formulario.
        </p>
      ) : null}
      {procesoPrecargaId?.trim() && procesoQ.isError ? (
        <p className="text-xs text-destructive">
          No se pudo cargar el proceso indicado; continúe el registro sin precarga.
        </p>
      ) : null}

      <div className="min-h-[200px] rounded-lg border bg-card p-4 shadow-sm">
        <StepView {...stepProps} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={createMutation.isPending}>
          Cancelar
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={prev} disabled={isFirstStep || createMutation.isPending}>
            Anterior
          </Button>
          <Button type="button" onClick={handlePrimary} disabled={primaryDisabled}>
            {primaryLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default WizardContratacion;
