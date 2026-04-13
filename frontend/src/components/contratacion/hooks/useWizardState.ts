import { useCallback, useMemo, useState } from 'react';
import type { TipoContratacionConfiguracion } from '@/api/tipos-contratacion';

export type WizardStep =
  | 'puntoServicio'
  | 'personas'
  | 'configContrato'
  | 'variables'
  | 'documentos'
  | 'facturacion'
  | 'ordenes'
  | 'resumen'
  | 'confirmacion';

export const WIZARD_STEPS: { key: WizardStep; label: string }[] = [
  { key: 'puntoServicio', label: 'Punto de Servicio' },
  { key: 'personas', label: 'Personas' },
  { key: 'configContrato', label: 'Configuración' },
  { key: 'variables', label: 'Variables' },
  { key: 'documentos', label: 'Documentos' },
  { key: 'facturacion', label: 'Facturación' },
  { key: 'ordenes', label: 'Órdenes' },
  { key: 'resumen', label: 'Resumen' },
  { key: 'confirmacion', label: 'Confirmación' },
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
  administracion?: string;
  propietario?: PersonaWizard;
  personaFiscal?: PersonaWizard;
  personaContacto?: PersonaWizard;
  actividadId?: string;
  tipoContratacionId?: string;
  referenciaContratoAnterior?: string;
  variablesCapturadas: Record<string, string | number | boolean>;
  documentosRecibidos: string[];
  generarOrdenInstalacionToma: boolean;
  generarOrdenInstalacionMedidor: boolean;
  conceptosOverride?: { conceptoCobroId: string; cantidad: number }[];
}

export interface StepProps {
  data: WizardData;
  updateData: (partial: Partial<WizardData>) => void;
  config?: TipoContratacionConfiguracion;
}

const initialWizardData = (): WizardData => ({
  variablesCapturadas: {},
  documentosRecibidos: [],
  generarOrdenInstalacionToma: false,
  generarOrdenInstalacionMedidor: false,
});

function stepIndex(step: WizardStep | number): number {
  if (typeof step === 'number') {
    return step;
  }
  const i = WIZARD_STEPS.findIndex((s) => s.key === step);
  return i >= 0 ? i : 0;
}

function hasPropietarioBasico(p?: PersonaWizard): boolean {
  return !!(p?.personaId || (p?.nombre?.trim() && p?.rfc?.trim()));
}

function hasPersonaFiscalBasico(f?: PersonaWizard): boolean {
  return !!(f?.personaId || (f?.nombre?.trim() && f?.rfc?.trim()));
}

function computeCanGoNext(step: number, data: WizardData): boolean {
  switch (step) {
    case 0:
      return !!data.puntoServicioId?.trim();
    case 1:
      return hasPropietarioBasico(data.propietario) && hasPersonaFiscalBasico(data.personaFiscal);
    case 2:
      return (
        !!data.administracion?.trim() &&
        !!data.tipoContratacionId?.trim() &&
        !!data.actividadId?.trim()
      );
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
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
    next,
    prev,
    goTo,
    canGoNext,
    isLastStep,
    isFirstStep,
    reset,
  };
}
