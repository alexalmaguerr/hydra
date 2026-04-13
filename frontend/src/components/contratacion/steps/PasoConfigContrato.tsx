import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { fetchActividades } from '@/api/catalogos';
import { TIPOS_CONTRATACION_BY_ADMIN } from '@/config/tipos-contratacion';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { StepProps } from '../hooks/useWizardState';

const ADMINISTRACIONES: Record<string, string> = {
  '1': 'QUERÉTARO',
  '2': 'SANTA ROSA JÁUREGUI',
  '3': 'CORREGIDORA',
  '4': 'PEDRO ESCOBEDO',
  '5': 'TEQUISQUIAPAN',
  '6': 'EZEQUIEL MONTES',
  '7': 'AMEALCO DE BONFIL',
  '8': 'HUIMILPAN',
  '9': 'CADEREYTA DE MONTES-SAN JOAQUÍN',
  '10': 'COLÓN-TOLIMÁN',
  '11': 'JALPAN DE SERRA-LANDA DE MATAMOROS-ARROYO SECO',
  '12': 'EL MARQUÉS',
  '13': 'PINAL DE AMOLES-PEÑAMILLER',
};

export default function PasoConfigContrato({ data, updateData }: StepProps) {
  const [tipoOpen, setTipoOpen] = useState(false);

  const actividadesQ = useQuery({
    queryKey: ['catalogos', 'actividades', 'wizard'],
    queryFn: fetchActividades,
  });
  const actividades = (actividadesQ.data ?? []).filter((a) => a.activo);

  const adminId = data.administracion;
  const adminNombre = adminId ? ADMINISTRACIONES[adminId] : undefined;
  const tiposList = adminId ? (TIPOS_CONTRATACION_BY_ADMIN[adminId] ?? []) : [];

  const selectedTipo = tiposList.find((t) => t.id === data.tipoContratacionId);

  const onTipoChange = (tipoId: string) => {
    updateData({
      tipoContratacionId: tipoId,
      documentosRecibidos: [],
      variablesCapturadas: {},
      conceptosOverride: undefined,
    });
    setTipoOpen(false);
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

      {adminNombre && (
        <p className="rounded-md bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Administración: </span>
          <span className="font-medium">{adminNombre}</span>
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ── Tipo de contratación (combobox) ─────────────────────────── */}
        <div className="space-y-2">
          <Label>Tipo de contratación <span className="text-destructive">*</span></Label>

          {!adminId ? (
            <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
              Seleccione primero un punto de servicio con administración asignada.
            </p>
          ) : tiposList.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin tipos de contratación para esta administración.
            </p>
          ) : (
            <Popover open={tipoOpen} onOpenChange={setTipoOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={tipoOpen}
                  className="w-full justify-between font-normal h-auto min-h-10 whitespace-normal text-left"
                >
                  <span className={cn(!selectedTipo && 'text-muted-foreground')}>
                    {selectedTipo
                      ? `${selectedTipo.descripcion} (${selectedTipo.id})`
                      : 'Buscar tipo de contratación…'}
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Buscar…" className="h-9" />
                  <CommandList>
                    <CommandEmpty>Sin resultados.</CommandEmpty>
                    <CommandGroup>
                      {tiposList.map((t) => (
                        <CommandItem
                          key={t.id}
                          value={`${t.descripcion} ${t.id}`}
                          onSelect={() => onTipoChange(t.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              data.tipoContratacionId === t.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="flex-1 text-sm">
                            {t.descripcion}
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              ({t.id})
                            </span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* ── Actividad ────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="wizard-actividad">
            Actividad <span className="text-destructive">*</span>
          </Label>
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
