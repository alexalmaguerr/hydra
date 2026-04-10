import { useEffect, useMemo, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { TipoContratacionConfiguracion } from '@/api/tipos-contratacion';
import type { StepProps } from '../hooks/useWizardState';

function varKey(
  row: TipoContratacionConfiguracion['variables'][number],
): string {
  const c = row.tipoVariable.codigo?.trim();
  return c && c.length > 0 ? c : row.tipoVariable.id;
}

function parseDefault(
  row: TipoContratacionConfiguracion['variables'][number],
): string | number | boolean {
  const raw = row.valorDefecto;
  const tipo = (row.tipoVariable.tipoDato ?? '').trim().toLowerCase();
  if (raw == null || raw === '') {
    return emptyForTipo(tipo);
  }
  if (tipo === 'boolean' || tipo === 'bool') {
    return raw === 'true' || raw === '1' || raw === 'sí' || raw === 'si';
  }
  if (tipo === 'number' || tipo === 'decimal' || tipo === 'entero') {
    const n = Number(String(raw).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  }
  return String(raw);
}

function emptyForTipo(tipo: string): string | number | boolean {
  if (tipo === 'boolean' || tipo === 'bool') return false;
  if (tipo === 'number' || tipo === 'decimal' || tipo === 'entero') return 0;
  return '';
}

export default function PasoVariables({ data, updateData, config }: StepProps) {
  const variableIdsKey = useMemo(
    () => config?.variables?.map((v) => v.id).join(',') ?? '',
    [config?.variables],
  );
  const capturaRef = useRef(data.variablesCapturadas);
  capturaRef.current = data.variablesCapturadas;

  useEffect(() => {
    if (!data.tipoContratacionId || !variableIdsKey || !config?.variables?.length) return;

    const cap = capturaRef.current;
    const next: Record<string, string | number | boolean> = {};
    for (const row of config.variables) {
      const k = varKey(row);
      const existing = cap[k];
      if (existing !== undefined) {
        next[k] = existing;
      } else {
        next[k] = parseDefault(row);
      }
    }
    updateData({ variablesCapturadas: next });
    // `config` en el cierre: la sincronización depende de `config?.id` y `variableIdsKey`, no de la identidad del objeto.
  }, [data.tipoContratacionId, config?.id, variableIdsKey, updateData]);

  if (!data.tipoContratacionId) {
    return (
      <section aria-labelledby="paso-variables" className="space-y-2">
        <h2 id="paso-variables" className="text-base font-semibold">
          Variables
        </h2>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Seleccione el tipo de contratación en el paso anterior para cargar las variables.
        </p>
      </section>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Cargando variables del tipo de contratación…</p>
      </div>
    );
  }

  const vars = [...config.variables].sort((a, b) => a.orden - b.orden);

  if (vars.length === 0) {
    return (
      <section aria-labelledby="paso-variables" className="space-y-2">
        <h2 id="paso-variables" className="text-base font-semibold">
          Variables
        </h2>
        <p className="text-sm text-muted-foreground">
          Este tipo no tiene variables configuradas.
        </p>
      </section>
    );
  }

  const setVal = (k: string, val: string | number | boolean) => {
    updateData({
      variablesCapturadas: { ...data.variablesCapturadas, [k]: val },
    });
  };

  return (
    <section aria-labelledby="paso-variables" className="space-y-4">
      <div>
        <h2 id="paso-variables" className="text-base font-semibold">
          Variables
        </h2>
        <p className="text-sm text-muted-foreground">
          Valores usados en fórmulas de facturación para este tipo de contratación.
        </p>
      </div>

      <div className="grid gap-4">
        {vars.map((row) => {
          const k = varKey(row);
          const tipo = (row.tipoVariable.tipoDato ?? '').trim().toLowerCase();
          const label = row.tipoVariable.nombre || row.tipoVariable.codigo || k;
          const val = data.variablesCapturadas[k];
          const suffix = row.tipoVariable.unidad ? ` (${row.tipoVariable.unidad})` : '';

          if (tipo === 'boolean' || tipo === 'bool') {
            const checked = Boolean(val);
            return (
              <div
                key={row.id}
                className="flex flex-row items-center gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={`var-${row.id}`}
                  checked={checked}
                  onCheckedChange={(c) => setVal(k, c === true)}
                />
                <Label htmlFor={`var-${row.id}`} className="cursor-pointer font-normal">
                  {label}
                  {row.obligatorio ? <span className="text-destructive"> *</span> : null}
                  {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
                </Label>
              </div>
            );
          }

          return (
            <div key={row.id} className="space-y-1.5">
              <Label htmlFor={`var-${row.id}`}>
                {label}
                {row.obligatorio ? <span className="text-destructive"> *</span> : null}
                {suffix ? <span className="text-muted-foreground">{suffix}</span> : null}
              </Label>
              <Input
                id={`var-${row.id}`}
                type={tipo === 'number' || tipo === 'decimal' || tipo === 'entero' ? 'number' : 'text'}
                step={tipo === 'decimal' ? 'any' : undefined}
                value={
                  val === undefined || val === null
                    ? ''
                    : typeof val === 'boolean'
                      ? val
                        ? 'true'
                        : 'false'
                      : String(val)
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  if (tipo === 'number' || tipo === 'decimal' || tipo === 'entero') {
                    const n = Number(raw.replace(',', '.'));
                    setVal(k, Number.isFinite(n) ? n : 0);
                  } else {
                    setVal(k, raw);
                  }
                }}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
