import React, { useCallback, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check } from 'lucide-react';
import { createContrato, type CreateContratoDto } from '@/api/contratos';
import { toast } from '@/components/ui/sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WIZARD_STEPS, useWizardState, type WizardData } from './hooks/useWizardState';
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
}

function buildCreateContratoDto(data: WizardData): CreateContratoDto {
  const fecha = new Date().toISOString().split('T')[0];
  const prop = data.propietario;
  const nombreCompleto = [prop?.paterno, prop?.materno, prop?.nombre]
    .filter(Boolean).join(' ').trim() || '';
  const dto: CreateContratoDto = {
    puntoServicioId: data.puntoServicioId || undefined,
    actividadId: data.actividadId || undefined,
    // No enviamos tipoContratacionId al backend hasta que los catálogos estén sincronizados
    tipoContratacionId: undefined,
    referenciaContratoAnterior: data.referenciaContratoAnterior?.trim() || undefined,
    tipoContrato: '',
    tipoServicio: '',
    nombre: nombreCompleto,
    rfc: prop?.rfc?.trim() ?? '',
    direccion: '',
    contacto: prop?.telefonos?.trim() || prop?.email?.trim() || '',
    estado: 'Pendiente de alta',
    fecha,
    variablesCapturadas: Object.keys(data.variablesCapturadas).length ? { ...data.variablesCapturadas } : undefined,
    documentosRecibidos: data.documentosRecibidos.length
      ? Array.from(new Set(data.documentosRecibidos.map((d) => d.trim()).filter((d) => d.length > 0)))
      : undefined,
    generarOrdenInstalacionToma: data.generarOrdenInstalacionToma || undefined,
    generarOrdenInstalacionMedidor:
      !data.generarOrdenInstalacionToma && data.generarOrdenInstalacionMedidor ? true : undefined,
    conceptosOverride: data.conceptosOverride?.length ? data.conceptosOverride : undefined,
  };

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
  // Contacto es opcional — enviamos solo si tiene al menos nombre o personaId (sin requerir rfc)
  if (pc && (pc.personaId || pcNombre)) {
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

export function WizardContratacion({ onComplete, onCancel }: WizardContratacionProps) {
  const queryClient = useQueryClient();
  const {
    currentStep,
    data,
    updateData,
    next,
    prev,
    canGoNext,
    isLastStep,
    isFirstStep,
  } = useWizardState();

  // No usamos config del backend por ahora (catálogos de tipos son hardcoded)
  const { data: config } = useTipoContratacionConfig(undefined);

  const createMutation = useMutation({
    mutationFn: (dto: CreateContratoDto) => createContrato(dto),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contratos'] });
      toast.success('Contrato creado', { description: 'El contrato se registró correctamente.' });
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
      : !canGoNext || createMutation.isPending;

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
