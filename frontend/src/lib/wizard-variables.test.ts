import { describe, expect, it } from 'vitest';
import type { TipoContratacionConfiguracion } from '@/api/tipos-contratacion';
import {
  mergeVariablesCapturadasRecord,
  variableStorageKey,
  variablesStepSatisfied,
  type WizardData,
} from '@/components/contratacion/hooks/useWizardState';

function row(
  overrides: Partial<TipoContratacionConfiguracion['variables'][number]> &
    Pick<TipoContratacionConfiguracion['variables'][number], 'id' | 'obligatorio' | 'orden' | 'tipoVariable'>,
): TipoContratacionConfiguracion['variables'][number] {
  return {
    obligatorio: false,
    orden: 0,
    valorDefecto: null,
    ...overrides,
  };
}

describe('variableStorageKey', () => {
  it('prefers codigo over id', () => {
    expect(
      variableStorageKey(
        row({
          id: 'x',
          obligatorio: true,
          orden: 1,
          tipoVariable: {
            id: 'tv1',
            codigo: 'DIAMETRO',
            nombre: 'Diámetro',
            tipoDato: 'TEXTO',
            valoresPosibles: null,
            unidad: null,
          },
        }),
      ),
    ).toBe('DIAMETRO');
  });
});

describe('variablesStepSatisfied', () => {
  it('is true when config has no variables', () => {
    const data = { variablesCapturadas: {} } as WizardData;
    expect(variablesStepSatisfied(data, undefined)).toBe(true);
  });

  it('requires obligatorio keys', () => {
    const config = {
      variables: [
        row({
          id: 'a',
          obligatorio: true,
          orden: 0,
          tipoVariable: {
            id: 'tv',
            codigo: 'CAMPO1',
            nombre: 'Campo 1',
            tipoDato: 'TEXTO',
            valoresPosibles: null,
            unidad: null,
          },
        }),
      ],
    } as TipoContratacionConfiguracion;
    const empty = { variablesCapturadas: {} } as WizardData;
    expect(variablesStepSatisfied(empty, config)).toBe(false);
    const ok = { variablesCapturadas: { CAMPO1: 'x' } } as WizardData;
    expect(variablesStepSatisfied(ok, config)).toBe(true);
  });
});

describe('mergeVariablesCapturadasRecord', () => {
  it('merges distritoId from wizard root', () => {
    const data = {
      variablesCapturadas: { a: 1 },
      distritoId: 'd-1',
      conceptosLecturaPeriodica: [],
    } as WizardData;
    const m = mergeVariablesCapturadasRecord(data);
    expect(m?.distritoId).toBe('d-1');
    expect(m?.a).toBe(1);
  });
});
