import { useCallback, useMemo, useState } from 'react';
import type { TipoContratacionConfiguracion } from '@/api/tipos-contratacion';
import type { SolicitudState } from '@/types/solicitudes';
import { CLASE_CONTRATACION_ALTA_NUEVA_COD } from '../wizard-catalogos-ui';

export type WizardStep =
  | 'puntoServicio'
  | 'personas'
  | 'configContrato'
  | 'variables'
  | 'documentos'
  | 'facturacion'
  | 'ordenes'
  | 'resumen';

export const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'puntoServicio', label: 'Punto de Servicio' },
  { key: 'personas', label: 'Personas' },
  { key: 'configContrato', label: 'Configuración' },
  { key: 'variables', label: 'Variables' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'facturacion', label: 'Facturación' },
  { key: 'ordenes', label: 'Órdenes' },
  { key: 'resumen', label: 'Resumen' },
];

export interface PersonaWizard {
  personaId?: string;
  tipoPersona?: 'fisica' | 'moral' | '';
  paterno?: string;
  materno?: string;
  nombre?: string;
  razonSocial?: string;
  documentoIdentificacion?: string;
  rfc?: string;
  telefonos?: string;
  email?: string;
  usoCfdi?: string;
  regimenFiscal?: string;
}

export interface WizardData {
  puntoServicioId?: string;
  puntoServicioCodigo?: string;
  /** Dirección formateada del domicilio del punto de servicio seleccionado. */
  puntoServicioDireccion?: string;
  administracion?: string;
  propietario?: PersonaWizard;
  personaFiscal?: PersonaWizard;
  personaContacto?: PersonaWizard;
  actividadId?: string;
  /** Nombre legible de la actividad (catálogo), para resumen y revisión. */
  actividadNombre?: string;
  tipoContratacionId?: string;
  /** Descripción del tipo seleccionado (para reglas UI, p. ej. individualización). */
  tipoContratacionDescripcion?: string;
  /**
   * Cuando se conoce desde API (`esIndividualizacion`), evita desalineación con heurística por texto.
   * Si es `undefined`, se usa {@link descripcionEsIndividualizacion} sobre `tipoContratacionDescripcion`.
   */
  tipoEsIndividualizacion?: boolean;
  claseContratacion?: string;
  tipoPuntoServicio?: string;
  referenciaContratoAnterior?: string;
  /** Opcionales; se envían en `POST /contratos` si el operador los captura (SIGE / registro P1). */
  superficiePredio?: number;
  superficieConstruida?: number;
  unidadesServidas?: number;
  personasHabitanVivienda?: number;
  distritoId?: string;
  tipoEnvioFactura?: string;
  conexionYaExiste?: boolean;
  fechaInstalacionConexion?: string;
  tipoCorteCatalogoId?: string;
  calibreMedidorId?: string;
  posibleCorte?: boolean;
  /** IDs `conceptoCobroId` de conceptos de lectura periódica (se envían en `variablesCapturadas`). */
  conceptosLecturaPeriodica: string[];
  variablesCapturadas: Record<string, string | number | boolean>;
  documentosRecibidos: string[];
  generarOrdenInstalacionToma: boolean;
  generarOrdenInstalacionMedidor: boolean;
  /**
   * Con `VITE_FEATURE_FACTURACION_CONTRATACION=true`, si no es `false` se envía `generarFacturaContratacion` en el POST de alta.
   */
  generarFacturaContratacion?: boolean;
  conceptosOverride?: { conceptoCobroId: string; cantidad: number }[];
  /** Solicitud de servicio vinculada al contrato del proceso (precarga paso Personas + sync). */
  solicitudId?: string;
  /** Copia del `formData` de la solicitud para fusionar al guardar cambios desde el wizard. */
  solicitudFormSnapshot?: SolicitudState;
  /** Alineado con `mismosDatosProp` en la solicitud (persona fiscal = titular). */
  fiscalIgualTitular?: boolean;
}

export interface StepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  config?: TipoContratacionConfiguracion;
}

export const initialWizardData = (): WizardData => ({
  claseContratacion: CLASE_CONTRATACION_ALTA_NUEVA_COD,
  variablesCapturadas: {},
  documentosRecibidos: [],
  conceptosLecturaPeriodica: [],
  generarOrdenInstalacionToma: false,
  generarOrdenInstalacionMedidor: false,
  ...(import.meta.env.VITE_FEATURE_FACTURACION_CONTRATACION === 'true'
    ? { generarFacturaContratacion: true }
    : {}),
});

export function descripcionEsIndividualizacion(desc?: string): boolean {
  if (!desc) return false;
  const u = desc.toUpperCase();
  return (
    u.includes('INDIVIDUALIZ') ||
    u.includes('CONDOMIN') ||
    u.includes('UNIDADES PRIVATIVAS')
  );
}

function stepIndex(step: WizardStep | number): number {
  if (typeof step === 'number') {
    return step;
  }
  const i = WIZARD_STEPS.findIndex((s) => s.key === step);
  return i >= 0 ? i : 0;
}

function hasPersonaBasico(p?: PersonaWizard): boolean {
  const tieneNombre = !!(
    p?.nombre?.trim() ||
    p?.paterno?.trim() ||
    (p?.tipoPersona === 'moral' && p?.razonSocial?.trim())
  );
  return !!(p?.personaId || (tieneNombre && p?.rfc?.trim()));
}

function hasPropietarioBasico(p?: PersonaWizard): boolean {
  return hasPersonaBasico(p);
}

function hasPersonaFiscalBasico(f?: PersonaWizard): boolean {
  return hasPersonaBasico(f);
}

export type VariableTipoConfigRow = TipoContratacionConfiguracion['variables'][number];

/** Clave usada en `variablesCapturadas` y en plantillas `{{codigo}}`. */
export function variableStorageKey(row: VariableTipoConfigRow): string {
  const c = row.tipoVariable.codigo?.trim();
  return c && c.length > 0 ? c : row.tipoVariable.id;
}

/** Igual que el DTO de alta: fusiona campos del wizard en el mapa enviado al backend. */
export function mergeVariablesCapturadasRecord(
  data: WizardData,
): Record<string, string | number | boolean> | undefined {
  const base = { ...data.variablesCapturadas };
  if (data.distritoId) base.distritoId = data.distritoId;
  if (data.conexionYaExiste != null) base.conexionYaExiste = data.conexionYaExiste;
  if (data.fechaInstalacionConexion?.trim()) {
    base.fechaInstalacionConexion = data.fechaInstalacionConexion.trim();
  }
  if (data.calibreMedidorId?.trim()) base.calibreMedidorId = data.calibreMedidorId.trim();
  if (data.posibleCorte != null) base.posibleCorte = data.posibleCorte;
  if (data.conceptosLecturaPeriodica.length > 0) {
    base.conceptosLecturaPeriodicaIds = data.conceptosLecturaPeriodica.join(',');
  }
  return Object.keys(base).length > 0 ? base : undefined;
}

export function mergedVariablesCapturadasDisplay(data: WizardData): Record<string, string | number | boolean> {
  return mergeVariablesCapturadasRecord(data) ?? {};
}

/** Obligatorias del tipo cumplidas en `variablesCapturadas`. Sin variables configuradas → true. */
export function variablesStepSatisfied(
  data: WizardData,
  config: TipoContratacionConfiguracion | undefined,
): boolean {
  const rows = config?.variables ?? [];
  if (rows.length === 0) return true;
  const vc = data.variablesCapturadas ?? {};
  for (const row of rows) {
    if (!row.obligatorio) continue;
    const key = variableStorageKey(row);
    const val = vc[key];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
  }
  return true;
}

function computeCanGoNext(step: number, data: WizardData): boolean {
  switch (step) {
    case 0:
      return !!data.puntoServicioId?.trim();
    case 1:
      return hasPropietarioBasico(data.propietario) && hasPersonaFiscalBasico(data.personaFiscal);
    case 2: {
      const indiv =
        typeof data.tipoEsIndividualizacion === 'boolean'
          ? data.tipoEsIndividualizacion
          : descripcionEsIndividualizacion(data.tipoContratacionDescripcion);
      const refPadreOk =
        !indiv || !!(data.referenciaContratoAnterior && data.referenciaContratoAnterior.trim());
      const distritoOk = !indiv || !!data.distritoId?.trim();
      return (
        !!data.administracion?.trim() &&
        !!data.tipoContratacionId?.trim() &&
        !!data.actividadId?.trim() &&
        refPadreOk &&
        distritoOk
      );
    }
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
      return true;
    default:
      return false;
  }
}

export function useWizardState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<WizardData>(initialWizardData);

  const updateData = useCallback((partial: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  /** Reemplaza todo el estado del asistente y vuelve al paso 0 (p. ej. precarga desde proceso). */
  const resetTo = useCallback((next: WizardData) => {
    setCurrentStep(0);
    setData(next);
  }, []);

  const next = useCallback(() => {
    setCurrentStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }, []);

  const prev = useCallback(() => {
    setCurrentStep((s) => Math.max(s - 1, 0));
  }, []);

  const goTo = useCallback((step: WizardStep | number) => {
    const idx = stepIndex(step);
    setCurrentStep(Math.min(Math.max(idx, 0), WIZARD_STEPS.length - 1));
  }, []);

  const reset = useCallback(() => {
    setCurrentStep(0);
    setData(initialWizardData());
  }, []);

  const canGoNext = useMemo(() => computeCanGoNext(currentStep, data), [currentStep, data]);

  const isLastStep = currentStep === WIZARD_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return {
    currentStep,
    data,
    updateData,
    resetTo,
    next,
    prev,
    goTo,
    canGoNext,
    isLastStep,
    isFirstStep,
    reset,
  };
}
