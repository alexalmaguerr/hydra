import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { fetchActividades, fetchAdministraciones, fetchDistritos, fetchGruposActividad } from '@/api/catalogos';
import { fetchTiposContratacion } from '@/api/tipos-contratacion';
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
import { CLASES_CONTRATACION, TIPOS_PUNTO_SERVICIO } from '../wizard-catalogos-ui';
import { descripcionEsIndividualizacion, type StepProps } from '../hooks/useWizardState';

export default function PasoConfigContrato({ data, updateData }: StepProps) {
  const [tipoOpen, setTipoOpen] = useState(false);

  const actividadesQ = useQuery({
    queryKey: ['catalogos', 'actividades', 'wizard'],
    queryFn: fetchActividades,
  });
  const actividades = (actividadesQ.data ?? []).filter((a) => a.activo);

  const gruposQ = useQuery({
    queryKey: ['catalogos', 'grupos-actividad', 'wizard'],
    queryFn: fetchGruposActividad,
  });
  const grupos = (gruposQ.data ?? []).filter((g) => g.activo);

  const distritosQ = useQuery({
    queryKey: ['catalogos', 'distritos', 'wizard'],
    queryFn: fetchDistritos,
  });

  const administracionesQ = useQuery({
    queryKey: ['catalogos-operativos', 'administraciones', 'wizard'],
    queryFn: fetchAdministraciones,
  });

  const adminId = data.administracion?.trim() || undefined;

  const tiposQ = useQuery({
    queryKey: ['tipos-contratacion', 'wizard', adminId],
    queryFn: () =>
      fetchTiposContratacion({
        administracionId: adminId!,
        activo: true,
        limit: 500,
        page: 1,
      }),
    enabled: !!adminId,
  });

  const administraciones = administracionesQ.data ?? [];
  const adminNombre = adminId
    ? administraciones.find((a) => a.id === adminId)?.nombre
    : undefined;

  const tiposList = tiposQ.data?.data ?? [];

  const selectedTipo = tiposList.find((t) => t.id === data.tipoContratacionId);

  const actividadesFiltradas = data.grupoActividadId
    ? actividades.filter((a) => a.grupoId === data.grupoActividadId)
    : [];

  /** Precarga: si hay actividad pero no grupo, derivar grupo del catálogo. */
  useEffect(() => {
    if (!data.actividadId?.trim() || data.grupoActividadId?.trim()) return;
    const row = actividades.find((a) => a.id === data.actividadId);
    const gid = row?.grupoId?.trim();
    if (gid) updateData({ grupoActividadId: gid });
  }, [data.actividadId, data.grupoActividadId, actividades, updateData]);

  const onTipoChange = (tipoId: string) => {
    const row = tiposList.find((t) => t.id === tipoId);
    const desc = (row?.descripcion?.trim() || row?.nombre?.trim() || '') ?? '';
    updateData({
      tipoContratacionId: tipoId,
      tipoContratacionDescripcion: desc,
      grupoActividadId: undefined,
      actividadId: undefined,
      actividadNombre: undefined,
      documentosRecibidos: [],
      variablesCapturadas: {},
      conceptosOverride: undefined,
    });
    setTipoOpen(false);
  };

  const requiereContratoPadre = descripcionEsIndividualizacion(
    selectedTipo?.descripcion ?? data.tipoContratacionDescripcion,
  );

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

      {/* ── Selector de administración (siempre visible) ──────────────── */}
      <div className="space-y-2">
        <Label htmlFor="wizard-admin">
          Administración <span className="text-destructive">*</span>
        </Label>
        <Select
          value={adminId ?? ''}
          onValueChange={(v) => {
            updateData({
              administracion: v,
              tipoContratacionId: undefined,
              tipoContratacionDescripcion: '',
              distritoId: undefined,
              grupoActividadId: undefined,
              actividadId: undefined,
              actividadNombre: undefined,
              documentosRecibidos: [],
              variablesCapturadas: {},
              conceptosOverride: undefined,
            });
          }}
        >
          <SelectTrigger id="wizard-admin">
            <SelectValue placeholder="Seleccione administración…" />
          </SelectTrigger>
          <SelectContent>
            {administracionesQ.isLoading ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Cargando…</div>
            ) : administracionesQ.isError ? (
              <div className="px-2 py-1.5 text-sm text-destructive">Error al cargar administraciones.</div>
            ) : (
              administraciones.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nombre}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {adminNombre && (
          <p className="text-xs text-muted-foreground">
            {adminId && `Derivada del punto de servicio: `}
            <span className="font-medium">{adminNombre}</span>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Tipo de contratación <span className="text-destructive">*</span></Label>

        {!adminId ? (
          <p className="rounded-md border border-dashed bg-muted/20 px-3 py-2.5 text-sm text-muted-foreground">
            Seleccione la administración primero.
          </p>
        ) : tiposQ.isLoading ? (
          <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Cargando tipos…
          </div>
        ) : tiposQ.isError ? (
          <p className="text-sm text-destructive">No se pudieron cargar los tipos de contratación.</p>
        ) : tiposList.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin tipos de contratación para esta administración (revise que existan registros activos con administración asignada).
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
                    ? `${selectedTipo.descripcion?.trim() || selectedTipo.nombre} (${selectedTipo.codigo})`
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
                    {tiposList.map((t) => {
                      const label = t.descripcion?.trim() || t.nombre;
                      return (
                        <CommandItem
                          key={t.id}
                          value={`${label} ${t.codigo} ${t.id}`}
                          onSelect={() => onTipoChange(t.id)}
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4 shrink-0',
                              data.tipoContratacionId === t.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                          <span className="flex-1 text-sm">
                            {label}
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              ({t.codigo})
                            </span>
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="wizard-ref">
          {requiereContratoPadre ? (
            <>
              Contrato padre (individualizaciones) <span className="text-destructive">*</span>
            </>
          ) : (
            <>Contrato padre (individualizaciones)</>
          )}
        </Label>
        <Input
          id="wizard-ref"
          value={data.referenciaContratoAnterior ?? ''}
          onChange={(e) => updateData({ referenciaContratoAnterior: e.target.value })}
          placeholder="Número o folio del contrato padre"
          aria-required={requiereContratoPadre}
        />
        {requiereContratoPadre && (
          <p className="text-xs text-amber-700 dark:text-amber-500">
            Tipo catalogado como individualización: la referencia al contrato padre es obligatoria.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="wizard-distrito">
            Distrito <span className="text-destructive">*</span>
          </Label>
          {distritosQ.isLoading ? (
            <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando…
            </div>
          ) : distritosQ.isError ? (
            <p className="text-sm text-destructive">No se pudieron cargar los distritos.</p>
          ) : (
            <Select
              value={data.distritoId ?? ''}
              onValueChange={(v) => updateData({ distritoId: v || undefined })}
            >
              <SelectTrigger id="wizard-distrito" aria-label="Distrito">
                <SelectValue placeholder="Seleccione distrito…" />
              </SelectTrigger>
              <SelectContent>
                {(distritosQ.data ?? []).map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.nombre}
                    <span className="ml-1.5 font-mono text-[10px] text-muted-foreground">{d.zonaId}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wizard-grupo-actividad">
            Grupo actividad <span className="text-destructive">*</span>
          </Label>
          {gruposQ.isLoading ? (
            <div className="flex h-10 items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Cargando…
            </div>
          ) : gruposQ.isError ? (
            <p className="text-sm text-destructive">No se pudieron cargar los grupos.</p>
          ) : (
            <Select
              value={data.grupoActividadId ?? ''}
              onValueChange={(v) =>
                updateData({
                  grupoActividadId: v || undefined,
                  actividadId: undefined,
                  actividadNombre: undefined,
                })
              }
            >
              <SelectTrigger id="wizard-grupo-actividad" aria-label="Grupo de actividad">
                <SelectValue placeholder="Seleccione grupo…" />
              </SelectTrigger>
              <SelectContent>
                {grupos.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.codigo} – {g.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

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
              onValueChange={(v) => {
                const row = actividadesFiltradas.find((a) => a.id === v);
                const nombre = row
                  ? (row.descripcion?.trim() || row.codigo?.trim() || v)
                  : v;
                updateData({ actividadId: v, actividadNombre: nombre });
              }}
              disabled={!data.grupoActividadId || actividadesFiltradas.length === 0}
            >
              <SelectTrigger id="wizard-actividad" aria-label="Actividad económica">
                <SelectValue
                  placeholder={
                    !data.grupoActividadId
                      ? 'Primero seleccione grupo'
                      : actividadesFiltradas.length === 0
                        ? 'Sin actividades para este grupo'
                        : 'Seleccione actividad…'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {actividadesFiltradas.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.codigo} – {a.descripcion}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Distrito y actividad se incorporan al alta del contrato (<span className="font-mono">variablesCapturadas</span> /
        catálogo).
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* ── Clase de contratación ───────────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="wizard-clase">Clase de contratación</Label>
          <Select
            value={data.claseContratacion ?? ''}
            onValueChange={(v) => updateData({ claseContratacion: v })}
          >
            <SelectTrigger id="wizard-clase">
              <SelectValue placeholder="Seleccione clase…" />
            </SelectTrigger>
            <SelectContent>
              {CLASES_CONTRATACION.map((c) => (
                <SelectItem key={c.cod} value={c.cod}>
                  <span className="font-mono text-xs text-muted-foreground">{c.cod}</span>
                  <span className="ml-2">{c.descripcion}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Tipo de punto de servicio ────────────────────────────────── */}
        <div className="space-y-2">
          <Label htmlFor="wizard-tps">Tipo de punto de servicio</Label>
          <Select
            value={data.tipoPuntoServicio ?? ''}
            onValueChange={(v) => updateData({ tipoPuntoServicio: v })}
          >
            <SelectTrigger id="wizard-tps">
              <SelectValue placeholder="Seleccione tipo…" />
            </SelectTrigger>
            <SelectContent>
              {TIPOS_PUNTO_SERVICIO.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  <span className="font-mono text-xs text-muted-foreground">{t.id}</span>
                  <span className="ml-2">{t.descripcion}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-dashed p-4">
        <div>
          <h3 className="text-sm font-medium">Predio y ocupación (opcional)</h3>
          <p className="text-xs text-muted-foreground">
            Se guardan en el contrato al confirmar el alta. Deje en blanco lo que no aplique.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wizard-sup-predio">Superficie del predio (m²)</Label>
            <Input
              id="wizard-sup-predio"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={data.superficiePredio === undefined ? '' : String(data.superficiePredio)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') {
                  updateData({ superficiePredio: undefined });
                  return;
                }
                const n = parseFloat(raw);
                updateData({
                  superficiePredio: Number.isFinite(n) && n >= 0 ? n : undefined,
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-sup-cons">Superficie construida (m²)</Label>
            <Input
              id="wizard-sup-cons"
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={data.superficieConstruida === undefined ? '' : String(data.superficieConstruida)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') {
                  updateData({ superficieConstruida: undefined });
                  return;
                }
                const n = parseFloat(raw);
                updateData({
                  superficieConstruida: Number.isFinite(n) && n >= 0 ? n : undefined,
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-unidades">Unidades servidas</Label>
            <Input
              id="wizard-unidades"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={data.unidadesServidas === undefined ? '' : String(data.unidadesServidas)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') {
                  updateData({ unidadesServidas: undefined });
                  return;
                }
                const n = parseInt(raw, 10);
                updateData({
                  unidadesServidas: Number.isFinite(n) && n >= 0 ? n : undefined,
                });
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-personas-viv">Personas que habitan la vivienda</Label>
            <Input
              id="wizard-personas-viv"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={data.personasHabitanVivienda === undefined ? '' : String(data.personasHabitanVivienda)}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (raw === '') {
                  updateData({ personasHabitanVivienda: undefined });
                  return;
                }
                const n = parseInt(raw, 10);
                updateData({
                  personasHabitanVivienda: Number.isFinite(n) && n >= 0 ? n : undefined,
                });
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
