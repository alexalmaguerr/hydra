import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Plus, RefreshCw } from 'lucide-react';

import { createPuntoServicio, fetchPuntosServicio } from '@/api/puntos-servicio';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

function formatDomicilio(
  d: { calle: string | null; numExterior: string | null; codigoPostal: string | null } | null | undefined,
): string {
  if (!d) return '—';
  const parts = [d.calle, d.numExterior, d.codigoPostal].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

export default function PuntosServicio() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [codigo, setCodigo] = useState('');

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['puntos-servicio', 'catalogo'],
    queryFn: () => fetchPuntosServicio({ page: 1, limit: 500 }),
  });

  const rows = data?.data ?? [];

  const createMut = useMutation({
    mutationFn: () =>
      createPuntoServicio({
        codigo: codigo.trim(),
        estado: 'Activo',
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['puntos-servicio'] });
      toast.success('Punto de servicio creado', {
        description: `Código ${codigo.trim()} registrado correctamente.`,
      });
      setCodigo('');
      setOpen(false);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'No se pudo crear el punto de servicio.';
      toast.error('Error al crear', { description: msg });
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Puntos de servicio"
        subtitle="Catálogo operativo: altas y consulta de puntos de servicio (códigos únicos)."
        breadcrumbs={[{ label: 'Infraestructura', href: '#' }, { label: 'Puntos de servicio' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`mr-1 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />
              Nuevo punto
            </Button>
          </div>
        }
      />

      <p className="text-sm text-muted-foreground">
        Desde el asistente de{' '}
        <Link to="/app/contratos" className="font-medium text-primary underline underline-offset-2">
          Alta de contrato
        </Link>{' '}
        puede volver aquí para dar de alta un código y luego seleccionarlo en el paso 1.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          Cargando puntos de servicio…
        </div>
      ) : null}

      {isError ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Error al cargar el catálogo.'}
        </div>
      ) : null}

      {!isLoading && !isError && rows.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hay puntos de servicio registrados. Use &quot;Nuevo punto&quot; para crear el primero.
        </div>
      ) : null}

      {!isLoading && !isError && rows.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Domicilio</TableHead>
                <TableHead>Tipo suministro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((ps) => (
                <TableRow key={ps.id}>
                  <TableCell className="font-mono font-medium">{ps.codigo}</TableCell>
                  <TableCell>{ps.estado}</TableCell>
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {formatDomicilio(ps.domicilio)}
                  </TableCell>
                  <TableCell>{ps.tipoSuministro?.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo punto de servicio</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="ps-codigo">Código</Label>
            <Input
              id="ps-codigo"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value)}
              placeholder="Código único (obligatorio)"
              className="font-mono"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              El código debe ser único. Puede completar domicilio y catálogos después desde procesos de campo o
              actualización masiva.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              disabled={!codigo.trim() || createMut.isPending}
              onClick={() => createMut.mutate()}
            >
              {createMut.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando…
                </>
              ) : (
                'Crear'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div>
        <Button variant="ghost" size="sm" asChild>
          <Link to="/app/contratos">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Volver a contratos
          </Link>
        </Button>
      </div>
    </div>
  );
}
