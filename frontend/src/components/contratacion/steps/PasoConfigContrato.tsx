import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { fetchActividades } from '@/api/catalogos';
import { fetchTiposContratacion } from '@/api/tipos-contratacion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { StepProps } from '../hooks/useWizardState';

export default function PasoConfigContrato({ data, updateData }: StepProps) {
  const tiposQ = useQuery({
    queryKey: ['tipos-contratacion', 'wizard'],
    queryFn: fetchTiposContratacion,
  });
  const actividadesQ = useQuery({
    queryKey: ['catalogos', 'actividades', 'wizard'],
    queryFn: fetchActividades,
  });

  const tipos = tiposQ.data?.data ?? [];
  const actividades = (actividadesQ.data ?? []).filter((a) => a.activo);

  const onTipoChange = (tipoId: string) => {
    updateData({
      tipoContratacionId: tipoId,
      documentosRecibidos: [],
      variablesCapturadas: {},
      conceptosOverride: undefined,
    });
  };

  return (
    <section aria-labelledby="paso-config" className="space-y-4">
      <div>
        <h2 id="paso-config" className="text-base font-semibold">
          Configuración del contrato
        </h2>
        <p className="text-sm text-muted-foreground">
          Tipo de contratación, actividad económica y referencias.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="wizard-tipo">Tipo de contratación</Label>
          {tiposQ.isLoading ? (
            <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando…
            </div>
          ) : tiposQ.isError ? (
            <p className="text-sm text-destructive">No se pudieron cargar los tipos.</p>
          ) : (
            <Select value={data.tipoContratacionId ?? ''} onValueChange={onTipoChange}>
              <SelectTrigger id="wizard-tipo" aria-label="Tipo de contratación">
                <SelectValue placeholder="Seleccione un tipo" />
              </SelectTrigger>
              <SelectContent>
                {tipos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre} ({t.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wizard-actividad">Actividad</Label>
          {actividadesQ.isLoading ? (
            <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando…
            </div>
          ) : actividadesQ.isError ? (
            <p className="text-sm text-destructive">No se pudieron cargar las actividades.</p>
          ) : (
            <Select
              value={data.actividadId ?? ''}
              onValueChange={(v) => updateData({ actividadId: v })}
            >
              <SelectTrigger id="wizard-actividad" aria-label="Actividad económica">
                <SelectValue placeholder="Seleccione actividad" />
              </SelectTrigger>
              <SelectContent>
                {actividades.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.descripcion || a.codigo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="wizard-ref">Referencia contrato anterior (opcional)</Label>
        <Input
          id="wizard-ref"
          value={data.referenciaContratoAnterior ?? ''}
          onChange={(e) => updateData({ referenciaContratoAnterior: e.target.value })}
          placeholder="Folio o referencia en sistema legado"
        />
      </div>
    </section>
  );
}
