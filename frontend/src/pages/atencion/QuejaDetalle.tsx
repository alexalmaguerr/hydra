import { useState } from 'react';
import { ExternalLink, MessageSquare, RefreshCw, Tag, User, XCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { QuejaAclaracion, QuejaAreaAsignada, SeguimientoTipo } from '@/context/DataContext';

interface QuejaDetalleProps {
  queja: QuejaAclaracion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuarioActual?: string;
  onCambiarEstado: (quejaId: string, nuevoEstado: QuejaAclaracion['estado'], motivo?: string) => void;
  onReasignar: (quejaId: string, area: QuejaAreaAsignada) => void;
  onAgregarNota: (quejaId: string, nota: string, tipo: SeguimientoTipo) => void;
}

const PRIORIDAD_CONFIG: Record<string, string> = {
  Urgente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  Alta: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  Media: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Baja: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const ESTADO_CONFIG: Record<string, string> = {
  'Registrada': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'En atención': 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  'Resuelta': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  'Cerrada': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

const SEGUIMIENTO_ICON: Record<SeguimientoTipo, React.ReactNode> = {
  nota: <MessageSquare className="h-3.5 w-3.5" />,
  cambio_estado: <RefreshCw className="h-3.5 w-3.5" />,
  reasignacion: <Tag className="h-3.5 w-3.5" />,
  contacto_cliente: <User className="h-3.5 w-3.5" />,
};

const SEGUIMIENTO_LABEL: Record<SeguimientoTipo, string> = {
  nota: 'Nota',
  cambio_estado: 'Cambio de estado',
  reasignacion: 'Reasignación',
  contacto_cliente: 'Contacto con cliente',
};

const AREAS: QuejaAreaAsignada[] = ['Atención a clientes', 'Operación', 'Facturación', 'Jurídico', 'Cartera'];
const ESTADOS: QuejaAclaracion['estado'][] = ['Registrada', 'En atención', 'Resuelta', 'Cerrada'];

function formatDateTime(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function QuejaDetalle({
  queja,
  open,
  onOpenChange,
  usuarioActual = 'sistema',
  onCambiarEstado,
  onReasignar,
  onAgregarNota,
}: QuejaDetalleProps) {
  const [nota, setNota] = useState('');
  const [tipoNota, setTipoNota] = useState<SeguimientoTipo>('nota');
  const [nuevoEstado, setNuevoEstado] = useState<QuejaAclaracion['estado'] | ''>('');
  const [nuevaArea, setNuevaArea] = useState<QuejaAreaAsignada | ''>('');
  const [motivoCierre, setMotivoCierre] = useState('');
  const [activeAction, setActiveAction] = useState<'nota' | 'estado' | 'reasignar' | 'cerrar' | null>(null);

  function resetActions() {
    setActiveAction(null);
    setNota('');
    setNuevoEstado('');
    setNuevaArea('');
    setMotivoCierre('');
  }

  function handleAgregarNota() {
    if (!queja || !nota.trim()) return;
    onAgregarNota(queja.id, nota.trim(), tipoNota);
    resetActions();
  }

  function handleCambiarEstado() {
    if (!queja || !nuevoEstado) return;
    onCambiarEstado(queja.id, nuevoEstado, motivoCierre || undefined);
    const notaEstado = `Estado cambiado a "${nuevoEstado}"${motivoCierre ? `: ${motivoCierre}` : ''}`;
    onAgregarNota(queja.id, notaEstado, 'cambio_estado');
    resetActions();
  }

  function handleReasignar() {
    if (!queja || !nuevaArea) return;
    onReasignar(queja.id, nuevaArea);
    onAgregarNota(queja.id, `Reasignado a "${nuevaArea}"`, 'reasignacion');
    resetActions();
  }

  function handleCerrar() {
    if (!queja || !motivoCierre.trim()) return;
    onCambiarEstado(queja.id, 'Cerrada', motivoCierre.trim());
    onAgregarNota(queja.id, `Cerrado: ${motivoCierre.trim()}`, 'cambio_estado');
    resetActions();
  }

  if (!queja) return null;

  const seguimientos = [...(queja.seguimientos ?? [])].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const isClosed = queja.estado === 'Cerrada' || queja.estado === 'Resuelta';

  return (
    <Sheet open={open} onOpenChange={v => { onOpenChange(v); if (!v) resetActions(); }}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1 flex-1">
              <SheetTitle className="text-base leading-tight">
                {queja.tipo}: {queja.categoria ?? 'Sin categoría'}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span>{formatDate(queja.fecha)}</span>
                {queja.canal && <><span>·</span><span>{queja.canal}</span></>}
                {queja.atendidoPor && <><span>·</span><span>Por: {queja.atendidoPor}</span></>}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <span className={cn('px-2 py-0.5 rounded text-xs font-medium', ESTADO_CONFIG[queja.estado])}>
                {queja.estado}
              </span>
              {queja.prioridad && (
                <span className={cn('px-2 py-0.5 rounded text-xs font-medium', PRIORIDAD_CONFIG[queja.prioridad])}>
                  {queja.prioridad}
                </span>
              )}
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* Descripción */}
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Descripción</p>
              <p className="text-sm leading-relaxed">{queja.descripcion}</p>
            </div>

            {/* Metadatos */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {queja.areaAsignada && (
                <div>
                  <p className="text-xs text-muted-foreground">Área asignada</p>
                  <p className="font-medium">{queja.areaAsignada}</p>
                </div>
              )}
              {queja.enlaceExterno && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Sistema externo</p>
                  <a
                    href={queja.enlaceExterno}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver en sistema externo
                  </a>
                </div>
              )}
              {queja.motivoCierre && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Motivo de cierre</p>
                  <p className="text-sm">{queja.motivoCierre}</p>
                </div>
              )}
            </div>

            {/* Timeline de seguimientos */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
                Seguimiento ({seguimientos.length})
              </p>
              {seguimientos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin seguimientos registrados.</p>
              ) : (
                <ol className="relative border-l border-border ml-3 space-y-4">
                  {seguimientos.map((s) => (
                    <li key={s.id} className="ml-4">
                      <div className="absolute -left-[7px] flex items-center justify-center w-3.5 h-3.5 rounded-full border bg-background text-muted-foreground">
                        {SEGUIMIENTO_ICON[s.tipo]}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium">{SEGUIMIENTO_LABEL[s.tipo]}</span>
                          <span className="text-xs text-muted-foreground">{formatDateTime(s.fecha)}</span>
                          <span className="text-xs text-muted-foreground">· {s.usuario}</span>
                        </div>
                        <p className="text-sm text-foreground/90">{s.nota}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Acciones */}
            {!isClosed && (
              <div className="space-y-3 pb-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Acciones</p>

                {activeAction === null && (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={() => setActiveAction('nota')}>
                      <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                      Agregar nota
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveAction('estado')}>
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Cambiar estado
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setActiveAction('reasignar')}>
                      <Tag className="h-3.5 w-3.5 mr-1.5" />
                      Reasignar área
                    </Button>
                    <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:border-red-300" onClick={() => setActiveAction('cerrar')}>
                      <XCircle className="h-3.5 w-3.5 mr-1.5" />
                      Cerrar
                    </Button>
                  </div>
                )}

                {activeAction === 'nota' && (
                  <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Tipo de seguimiento</Label>
                      <Select value={tipoNota} onValueChange={v => setTipoNota(v as SeguimientoTipo)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nota">Nota interna</SelectItem>
                          <SelectItem value="contacto_cliente">Contacto con cliente</SelectItem>
                          <SelectItem value="cambio_estado">Cambio de estado</SelectItem>
                          <SelectItem value="reasignacion">Reasignación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nota</Label>
                      <Textarea value={nota} onChange={e => setNota(e.target.value)} rows={3} placeholder="Describe el seguimiento..." />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAgregarNota} disabled={!nota.trim()}>Guardar nota</Button>
                      <Button size="sm" variant="ghost" onClick={resetActions}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {activeAction === 'estado' && (
                  <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Nuevo estado</Label>
                      <Select value={nuevoEstado} onValueChange={v => setNuevoEstado(v as QuejaAclaracion['estado'])}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Seleccionar..." />
                        </SelectTrigger>
                        <SelectContent>
                          {ESTADOS.filter(e => e !== queja.estado).map(e => (
                            <SelectItem key={e} value={e}>{e}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleCambiarEstado} disabled={!nuevoEstado}>Cambiar estado</Button>
                      <Button size="sm" variant="ghost" onClick={resetActions}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {activeAction === 'reasignar' && (
                  <div className="space-y-3 rounded-md border bg-muted/20 p-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Área destino</Label>
                      <Select value={nuevaArea} onValueChange={v => setNuevaArea(v as QuejaAreaAsignada)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Seleccionar área..." />
                        </SelectTrigger>
                        <SelectContent>
                          {AREAS.filter(a => a !== queja.areaAsignada).map(a => (
                            <SelectItem key={a} value={a}>{a}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleReasignar} disabled={!nuevaArea}>Reasignar</Button>
                      <Button size="sm" variant="ghost" onClick={resetActions}>Cancelar</Button>
                    </div>
                  </div>
                )}

                {activeAction === 'cerrar' && (
                  <div className="space-y-3 rounded-md border border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30 p-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Motivo de cierre <span className="text-red-500">*</span></Label>
                      <Textarea
                        value={motivoCierre}
                        onChange={e => setMotivoCierre(e.target.value)}
                        rows={2}
                        placeholder="Describe el motivo o resolución..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="destructive" onClick={handleCerrar} disabled={!motivoCierre.trim()}>Cerrar queja</Button>
                      <Button size="sm" variant="ghost" onClick={resetActions}>Cancelar</Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
