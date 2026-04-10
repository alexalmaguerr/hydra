/**
 * Reglas de negocio del asistente de alta (API): checklist + proceso + plantilla.
 */

export type ContratoWizardPlantillaCheckInput = {
  iniciarProcesoContratacion: boolean;
  documentosRecibidos: string[];
  plantillaProcesoId: string;
};

/** Si true, no se debe enviar el POST hasta elegir plantilla (evita proceso sin plantilla). */
export function wizardRequierePlantillaConChecklist(
  form: ContratoWizardPlantillaCheckInput,
): boolean {
  return (
    form.iniciarProcesoContratacion &&
    form.documentosRecibidos.length > 0 &&
    !form.plantillaProcesoId.trim()
  );
}
