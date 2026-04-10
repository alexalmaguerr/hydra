import { describe, expect, it } from 'vitest';
import { wizardRequierePlantillaConChecklist } from './contrato-wizard-validation';

describe('wizardRequierePlantillaConChecklist', () => {
  it('returns false when iniciar is off', () => {
    expect(
      wizardRequierePlantillaConChecklist({
        iniciarProcesoContratacion: false,
        documentosRecibidos: ['INE'],
        plantillaProcesoId: '',
      }),
    ).toBe(false);
  });

  it('returns false when no documents in checklist', () => {
    expect(
      wizardRequierePlantillaConChecklist({
        iniciarProcesoContratacion: true,
        documentosRecibidos: [],
        plantillaProcesoId: '',
      }),
    ).toBe(false);
  });

  it('returns false when plantilla is selected', () => {
    expect(
      wizardRequierePlantillaConChecklist({
        iniciarProcesoContratacion: true,
        documentosRecibidos: ['INE'],
        plantillaProcesoId: 'tpl_1',
      }),
    ).toBe(false);
  });

  it('returns true when iniciar + checklist + sin plantilla', () => {
    expect(
      wizardRequierePlantillaConChecklist({
        iniciarProcesoContratacion: true,
        documentosRecibidos: ['Comprobante'],
        plantillaProcesoId: '   ',
      }),
    ).toBe(true);
  });
});
