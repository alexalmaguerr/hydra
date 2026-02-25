import { useState, useMemo } from 'react';
import { ExternalLink, Filter, MessageSquarePlus, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { QuejaAclaracion, QuejaCategoria, QuejaPrioridad } from '@/context/DataContext';

interface TabQuejasProps {
  quejas: QuejaAclaracion[];
  onNuevaQueja: () => void;
  onVerDetalle: (queja: QuejaAclaracion) => void;
}

const PRIORIDAD_CONFIG: Record<QuejaPrioridad, { label: string; className: string }> = {
  Urgente: { label: 'Urgente', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800' },
  Alta: { label: 'Alta', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800' },
  Media: { label: 'Media', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800' },
  Baja: { label: 'Baja', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700' },
};

const ESTADO_CONFIG: Record<string, string> = {
  'Registrada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'En atención': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Resuelta': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Cerrada': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const CATEGORIAS: QuejaCategoria[] = ['Facturación', 'Servicio', 'Medidor', 'Lectura', 'Corte/Reconexión', 'Cobro', 'Otro'];
const PRIORIDADES: QuejaPrioridad[] = ['Urgente', 'Alta', 'Media', 'Baja'];
const ESTADOS = ['Registrada', 'En atención', 'Resuelta', 'Cerrada'] as const;

export default function TabQuejas({ quejas, onNuevaQueja, onVerDetalle }: TabQuejasProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState<string>('todos');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');

  const quejasFiltradas = useMemo(() => {
    return quejas
      .filter(q => {
        if (filtroEstado !== 'todos' && q.estado !== filtroEstado) return false;
        if (filtroPrioridad !== 'todos' && q.prioridad !== filtroPrioridad) return false;
        if (filtroCategoria !== 'todos' && q.categoria !== filtroCategoria) return false;
        if (busqueda) {
          const b = busqueda.toLowerCase();
          return q.descripcion.toLowerCase().includes(b) || q.tipo.toLowerCase().includes(b) || (q.categoria && q.categoria.toLowerCase().includes(b)) || (q.atendidoPor && q.atendidoPor.toLowerCase().includes(b));
        }
        return true;
      })
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [quejas, filtroEstado, filtroPrioridad, filtroCategoria, busqueda]);

  const hasFilters = filtroEstado !== 'todos' || filtroPrioridad !== 'todos' || filtroCategoria !== 'todos' || busqueda;

  const abiertas = quejas.filter(q => q.estado === 'Registrada' || q.estado === 'En atención').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold text-base">Quejas y Aclaraciones</h3>
          <p className="text-sm text-muted-foreground">
            {quejas.length} registro{quejas.length !== 1 ? 's' : ''}
            {abiertas > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {abiertas} abierta{abiertas > 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <Button onClick={onNuevaQueja} size="sm" className="gap-2 shrink-0">
          <MessageSquarePlus className="h-4 w-4" />
          Nueva queja / aclaración
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar en descripción..."
            className="pl-8 h-8 text-sm"
          />
        </div>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="h-8 text-sm w-36">
            <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroPrioridad} onValueChange={setFiltroPrioridad}>
          <SelectTrigger className="h-8 text-sm w-36">
            <SelectValue placeholder="Prioridad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las prioridades</SelectItem>
            {PRIORIDADES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="h-8 text-sm w-40">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las categorías</SelectItem>
            {CATEGORIAS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 text-xs text-muted-foreground"
            onClick={() => { setFiltroEstado('todos'); setFiltroPrioridad('todos'); setFiltroCategoria('todos'); setBusqueda(''); }}
          >
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Tabla */}
      {quejasFiltradas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {hasFilters ? 'Sin resultados con los filtros seleccionados.' : 'No hay quejas o aclaraciones registradas para este contrato.'}
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-xs font-semibold w-28">Fecha</TableHead>
                <TableHead className="text-xs font-semibold w-24">Tipo</TableHead>
                <TableHead className="text-xs font-semibold w-32">Categoría</TableHead>
                <TableHead className="text-xs font-semibold">Descripción</TableHead>
                <TableHead className="text-xs font-semibold w-24">Prioridad</TableHead>
                <TableHead className="text-xs font-semibold w-28">Estado</TableHead>
                <TableHead className="text-xs font-semibold w-36">Área asignada</TableHead>
                <TableHead className="text-xs font-semibold w-10 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {quejasFiltradas.map(q => (
                <TableRow
                  key={q.id}
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => onVerDetalle(q)}
                >
                  <TableCell className="text-xs text-muted-foreground">{formatDate(q.fecha)}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      q.tipo === 'Queja' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    )}>
                      {q.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{q.categoria ?? '—'}</TableCell>
                  <TableCell className="text-xs max-w-xs">
                    <div className="flex items-start gap-1.5">
                      <span className="line-clamp-2">{q.descripcion}</span>
                      {q.enlaceExterno && (
                        <a
                          href={q.enlaceExterno}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="shrink-0 text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          title="Ver en sistema externo"
                        >
                          <ExternalLink className="h-3 w-3 mt-0.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {q.prioridad ? (
                      <span className={cn(
                        'inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium',
                        PRIORIDAD_CONFIG[q.prioridad]?.className
                      )}>
                        {q.prioridad}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                      ESTADO_CONFIG[q.estado] ?? 'bg-gray-100 text-gray-700'
                    )}>
                      {q.estado}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{q.areaAsignada ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground rotate-[-90deg]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
