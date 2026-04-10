import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Loader2, RefreshCw, Search } from 'lucide-react';

import { fetchPuntosServicio, type PuntoServicioListItem } from '@/api/puntos-servicio';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { StepProps } from '../hooks/useWizardState';

function formatDomicilio(ps: PuntoServicioListItem): string {
  const d = ps.domicilio;
  if (!d) return '—';
  const parts = [d.calle, d.numExterior, d.codigoPostal].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export default function PasoServicioPoint({ data, updateData }: StepProps) {
  const [q, setQ] = useState('');
  const { data: list, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['puntos-servicio', 'wizard'],
    queryFn: () => fetchPuntosServicio({ page: 1, limit: 500 }),
  });

  const rows = list?.data ?? [];

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return rows;
    return rows.filter((ps) => {
      const codigo = ps.codigo?.toLowerCase() ?? '';
      const dom = formatDomicilio(ps).toLowerCase();
      const tipo = ps.tipoSuministro?.descripcion?.toLowerCase() ?? '';
      return codigo.includes(t) || dom.includes(t) || tipo.includes(t);
    });
  }, [rows, q]);

  const handleSelect = (ps: PuntoServicioListItem) => {
    updateData({
      puntoServicioId: ps.id,
      puntoServicioCodigo: ps.codigo?.trim() || ps.id,
    });
  };

  return (
    <section aria-labelledby="paso-punto-servicio" className="space-y-4">
      <div>
        <h2 id="paso-punto-servicio" className="text-base font-semibold">
          Punto de servicio
        </h2>
        <p className="text-sm text-muted-foreground">
          Busque y seleccione el punto de servicio asociado al contrato. Si aún no existe en el sistema, délo de alta
          en el catálogo y vuelva a este paso.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" asChild>
          <Link to="/app/puntos-servicio" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-1.5 h-4 w-4" aria-hidden />
            Abrir catálogo — dar de alta
          </Link>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
        >
          <RefreshCw className={`mr-1.5 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} aria-hidden />
          Actualizar lista
        </Button>
      </div>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filtrar por código, domicilio o tipo de suministro…"
          className="pl-9"
          aria-label="Filtrar puntos de servicio"
        />
      </div>

      {data.puntoServicioId ? (
        <p className="text-sm">
          <span className="text-muted-foreground">Seleccionado:</span>{' '}
          <span className="font-medium">{data.puntoServicioCodigo || data.puntoServicioId}</span>
        </p>
      ) : null}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden />
          <p className="text-sm">Cargando puntos de servicio…</p>
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          <p>
            No se pudo cargar el catálogo:{' '}
            {error instanceof Error ? error.message : 'Error desconocido'}
          </p>
          <button
            type="button"
            className="mt-2 text-sm font-medium underline underline-offset-2"
            onClick={() => refetch()}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {!isLoading && !isError && filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-4 py-6 text-sm">
          {rows.length === 0 ? (
            <div className="space-y-3">
              <p className="text-muted-foreground">
                No hay puntos de servicio en el catálogo (o no tiene permisos para listarlos). Para registrar uno
                nuevo, use el catálogo de puntos de servicio.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" asChild>
                  <Link to="/app/puntos-servicio" target="_blank" rel="noopener noreferrer">
                    Ir a catálogo y dar de alta
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Ningún resultado coincide con el filtro.</p>
          )}
        </div>
      ) : null}

      {!isLoading && !isError && filtered.length > 0 ? (
        <ScrollArea className="h-[min(360px,50vh)] rounded-md border">
          <ul className="divide-y p-0" role="listbox" aria-label="Puntos de servicio">
            {filtered.map((ps) => {
              const selected = data.puntoServicioId === ps.id;
              return (
                <li key={ps.id} role="none">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => handleSelect(ps)}
                    className={cn(
                      'flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition-colors',
                      'hover:bg-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      selected && 'bg-primary/10',
                    )}
                  >
                    <span className="font-medium">{ps.codigo}</span>
                    <span className="text-xs text-muted-foreground">{formatDomicilio(ps)}</span>
                    {ps.tipoSuministro?.descripcion ? (
                      <span className="text-xs text-muted-foreground">
                        {ps.tipoSuministro.descripcion}
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      ) : null}
    </section>
  );
}
