import { Loader2 } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { StepProps } from '../hooks/useWizardState';

export default function PasoDocumentos({ data, updateData, config }: StepProps) {
  if (!data.tipoContratacionId) {
    return (
      <section aria-labelledby="paso-documentos" className="space-y-2">
        <h2 id="paso-documentos" className="text-base font-semibold">
          Documentos
        </h2>
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
          Seleccione el tipo de contratación en el paso de configuración para ver el checklist.
        </p>
      </section>
    );
  }

  if (!config) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
        <p className="text-sm">Cargando documentos requeridos…</p>
      </div>
    );
  }

  const docs = [...config.documentos].sort((a, b) => a.nombreDocumento.localeCompare(b.nombreDocumento));

  const toggle = (nombre: string, checked: boolean) => {
    const n = nombre.trim();
    const set = new Set(
      data.documentosRecibidos.map((d) => d.trim()).filter(Boolean),
    );
    if (checked) set.add(n);
    else set.delete(n);
    updateData({ documentosRecibidos: Array.from(set) });
  };

  return (
    <section aria-labelledby="paso-documentos" className="space-y-4">
      <div>
        <h2 id="paso-documentos" className="text-base font-semibold">
          Documentos
        </h2>
        <p className="text-sm text-muted-foreground">
          Marque la documentación que ya recibió en físico o digital.
        </p>
      </div>

      {docs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay documentos configurados para este tipo de contratación.
        </p>
      ) : (
        <ul className="space-y-3" role="list">
          {docs.map((doc) => {
            const id = `doc-${doc.id}`;
            const checked = data.documentosRecibidos.some(
              (d) => d.trim() === doc.nombreDocumento.trim(),
            );
            return (
              <li
                key={doc.id}
                className="flex flex-row items-start gap-3 rounded-lg border p-3"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(c) => toggle(doc.nombreDocumento, c === true)}
                />
                <div className="min-w-0 flex-1">
                  <Label htmlFor={id} className="cursor-pointer font-medium leading-snug">
                    {doc.nombreDocumento}
                    {doc.obligatorio ? (
                      <span className="ml-1 text-destructive" title="Obligatorio">
                        *
                      </span>
                    ) : null}
                  </Label>
                  {doc.descripcion ? (
                    <p className="mt-1 text-xs text-muted-foreground">{doc.descripcion}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
