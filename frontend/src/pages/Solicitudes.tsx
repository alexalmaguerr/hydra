import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardPlus,
  ClipboardList,
  Pencil,
  Search,
  ClipboardCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  ArrowRight,
  Receipt,
  CalendarClock,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { createContrato } from '@/api/contratos';
import { useSolicitudesStore } from '@/hooks/useSolicitudesStore';
import type { SolicitudRecord, OrdenInspeccionData, SolicitudEstado } from '@/types/solicitudes';

// ── Catalogues for inspection form ───────────────────────────────────────────

const MATERIAL_CALLE = [
  { id: 'concreto_hidraulico', label: 'Concreto hidráulico' },
  { id: 'concreto_asfaltico', label: 'Concreto asfáltico' },
  { id: 'tierra', label: 'Tierra' },
  { id: 'adoquin', label: 'Adoquín' },
  { id: 'otro', label: 'Otro' },
];

const MATERIAL_BANQUETA = [
  { id: 'concreto_hidraulico', label: 'Concreto hidráulico' },
  { id: 'tierra', label: 'Tierra' },
  { id: 'adoquin', label: 'Adoquín' },
  { id: 'otro', label: 'Otro' },
];

const DIAMETROS_TOMA = ['1/2"', '3/4"', '1"', '1.5"', '2"', '3"', '4"'];

// ── Status badge ──────────────────────────────────────────────────────────────

const ESTADO_CONFIG: Record<SolicitudEstado, { label: string; icon: React.ElementType; className: string }> = {
  borrador: {
    label: 'Pendiente de inspección',
    icon: Clock,
    className: 'border-slate-300 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
  },
  inspeccion_pendiente: {
    label: 'Pendiente de inspección',
    icon: Clock,
    className: 'border-amber-400/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  inspeccion_en_proceso: {
    label: 'Pendiente de inspección',
    icon: AlertCircle,
    className: 'border-amber-400/60 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  },
  inspeccion_completada: {
    label: 'En cotización',
    icon: FileText,
    className: 'border-blue-400/60 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  en_cotizacion: {
    label: 'En cotización',
    icon: FileText,
    className: 'border-blue-400/60 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  aceptada: {
    label: 'Aceptada',
    icon: CheckCircle2,
    className: 'border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
  rechazada: {
    label: 'Rechazada',
    icon: XCircle,
    className: 'border-red-400/60 bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300',
  },
  cotizado: {
    label: 'En cotización',
    icon: ClipboardCheck,
    className: 'border-blue-400/60 bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
  },
  contratado: {
    label: 'Aceptada',
    icon: CheckCircle2,
    className: 'border-emerald-500/60 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
  },
};

function EstadoBadge({ estado }: { estado: SolicitudEstado }) {
  const cfg = ESTADO_CONFIG[estado];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn('flex w-fit items-center gap-1 text-xs', cfg.className)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

// ── Inspection detail helpers ─────────────────────────────────────────────────

const MATERIAL_LABEL: Record<string, string> = {
  concreto_hidraulico: 'Concreto hidráulico',
  concreto_asfaltico: 'Concreto asfáltico',
  tierra: 'Tierra',
  adoquin: 'Adoquín',
  otro: 'Otro',
};

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ── YesNo pill ────────────────────────────────────────────────────────────────

function YesNo({
  value,
  onChange,
}: {
  value: 'si' | 'no' | '';
  onChange: (v: 'si' | 'no') => void;
}) {
  return (
    <div className="flex flex-row">
      {(['si', 'no'] as const).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'border px-3 py-1.5 text-sm font-medium transition-colors select-none',
            opt === 'si' ? 'rounded-l-md border-r-0' : 'rounded-r-md',
            value === opt
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background border-input hover:bg-accent',
          )}
        >
          {opt === 'si' ? 'Sí' : 'No'}
        </button>
      ))}
    </div>
  );
}

// ── Inspection Sheet ──────────────────────────────────────────────────────────

function OrdenInspeccionSheet({
  record,
  open,
  onClose,
  onSave,
  onAceptar,
  onRechazar,
}: {
  record: SolicitudRecord | null;
  open: boolean;
  onClose: () => void;
  onSave: (id: string, orden: OrdenInspeccionData) => void;
  onAceptar: (id: string) => void;
  onRechazar: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<OrdenInspeccionData>>({});

  function startEdit() {
    setDraft(record?.ordenInspeccion ?? { estado: 'en_proceso' });
    setEditing(true);
  }

  function set(patch: Partial<OrdenInspeccionData>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleSave() {
    if (!record) return;
    onSave(record.id, draft as OrdenInspeccionData);
    setEditing(false);
  }

  if (!record) return null;

  const orden = record.ordenInspeccion;

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) { onClose(); setEditing(false); } }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[540px]">
        <SheetHeader className="border-b px-6 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            Orden de inspección
          </SheetTitle>
          <div className="text-xs text-muted-foreground">
            {record.folio} — {record.propNombreCompleto}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium">Domicilio del predio: </span>
            {record.predioResumen}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* No results yet */}
          {!orden && !editing && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300">
                <ClipboardList className="h-8 w-8" />
              </div>
              <div>
                <p className="font-semibold">Orden de inspección en proceso</p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  Aún no se han recibido los resultados de la inspección en campo. El inspector registrará los datos una vez concluida.
                </p>
              </div>
              <Button type="button" size="sm" onClick={startEdit}>
                Registrar resultados
              </Button>
            </div>
          )}

          {/* Results already recorded — view mode */}
          {orden && !editing && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {orden.estado === 'completada' ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                      <span className="font-medium">Inspección completada</span>
                    </>
                  ) : (
                    <Badge variant="secondary" className="gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      En proceso
                    </Badge>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={startEdit}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Editar
                </Button>
              </div>

              <Separator />

              {/* Inspector / fecha */}
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Inspector" value={orden.inspector} />
                <DetailRow label="Fecha de inspección" value={orden.fechaInspeccion} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vía pública</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Material de calle" value={orden.materialCalle ? MATERIAL_LABEL[orden.materialCalle] : undefined} />
                <DetailRow label="Material de banqueta" value={orden.materialBanqueta ? MATERIAL_LABEL[orden.materialBanqueta] : undefined} />
                <DetailRow label="Metros ruptura de calle" value={orden.metrosRupturaCalle ? `${orden.metrosRupturaCalle} ml` : undefined} />
                <DetailRow label="Metros ruptura de banqueta" value={orden.metrosRupturaBanqueta ? `${orden.metrosRupturaBanqueta} ml` : undefined} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Red de agua</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="¿Existe red en frente del predio?" value={orden.existeRed === 'si' ? 'Sí' : orden.existeRed === 'no' ? 'No' : undefined} />
                <DetailRow label="Distancia de la red al predio" value={orden.distanciaRed ? `${orden.distanciaRed} m` : undefined} />
                <DetailRow label="Presión en la red" value={orden.presionRed ? `${orden.presionRed} kg/cm²` : undefined} />
                <DetailRow label="Tipo de material de la red" value={orden.tipoMaterialRed} />
                <DetailRow label="Profundidad de la red" value={orden.profundidadRed ? `${orden.profundidadRed} m` : undefined} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Toma</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Diámetro de toma requerido" value={orden.diametroToma} />
                <DetailRow label="¿Existe toma actualmente?" value={orden.tomaExistente === 'si' ? 'Sí' : orden.tomaExistente === 'no' ? 'No' : undefined} />
                {orden.tomaExistente === 'si' && (
                  <>
                    <DetailRow label="Diámetro de toma existente" value={orden.diametroTomaExistente} />
                    <DetailRow label="Estado de toma existente" value={orden.estadoTomaExistente} />
                  </>
                )}
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medidor</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="¿Existe medidor actualmente?" value={orden.medidorExistente === 'si' ? 'Sí' : orden.medidorExistente === 'no' ? 'No' : undefined} />
                {orden.medidorExistente === 'si' && (
                  <DetailRow label="Núm. de medidor existente" value={orden.numMedidorExistente} />
                )}
              </div>

              {orden.observaciones && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</p>
                    <p className="text-sm">{orden.observaciones}</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Edit / create form */}
          {editing && (
            <div className="space-y-5">
              <p className="text-sm font-semibold">Registrar resultados de inspección</p>

              {/* Estado */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado de la inspección</Label>
                <div className="flex flex-row">
                  {([['en_proceso', 'En proceso'], ['completada', 'Completada']] as const).map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => set({ estado: val })}
                      className={cn(
                        'border px-3.5 py-1.5 text-sm font-medium transition-colors select-none',
                        val === 'en_proceso' ? 'rounded-l-md border-r-0' : 'rounded-r-md',
                        (draft.estado ?? 'en_proceso') === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-background border-input hover:bg-accent',
                      )}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Inspector</Label>
                  <Input className="h-9" placeholder="Nombre del inspector" value={draft.inspector ?? ''} onChange={(e) => set({ inspector: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Fecha de inspección</Label>
                  <Input className="h-9" type="date" value={draft.fechaInspeccion ?? ''} onChange={(e) => set({ fechaInspeccion: e.target.value })} />
                </div>
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vía pública</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Material de calle</Label>
                  <Select value={draft.materialCalle ?? ''} onValueChange={(v) => set({ materialCalle: v as OrdenInspeccionData['materialCalle'] })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CALLE.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Material de banqueta</Label>
                  <Select value={draft.materialBanqueta ?? ''} onValueChange={(v) => set({ materialBanqueta: v as OrdenInspeccionData['materialBanqueta'] })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_BANQUETA.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Metros ruptura de calle (ml)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0.00" value={draft.metrosRupturaCalle ?? ''} onChange={(e) => set({ metrosRupturaCalle: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Metros ruptura de banqueta (ml)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0.00" value={draft.metrosRupturaBanqueta ?? ''} onChange={(e) => set({ metrosRupturaBanqueta: e.target.value })} />
                </div>
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Red de agua</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm">¿Existe red en frente del predio?</Label>
                  <YesNo value={draft.existeRed ?? ''} onChange={(v) => set({ existeRed: v })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Distancia de la red al predio (m)</Label>
                  <Input className="h-9" type="number" min="0" step="0.1" placeholder="0.0" value={draft.distanciaRed ?? ''} onChange={(e) => set({ distanciaRed: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Presión en la red (kg/cm²)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0.00" value={draft.presionRed ?? ''} onChange={(e) => set({ presionRed: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Tipo de material de la red</Label>
                  <Input className="h-9" placeholder="Ej. PVC, Asbesto…" value={draft.tipoMaterialRed ?? ''} onChange={(e) => set({ tipoMaterialRed: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Profundidad de la red (m)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0.00" value={draft.profundidadRed ?? ''} onChange={(e) => set({ profundidadRed: e.target.value })} />
                </div>
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Toma</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Diámetro de toma requerido</Label>
                  <Select value={draft.diametroToma ?? ''} onValueChange={(v) => set({ diametroToma: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {DIAMETROS_TOMA.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm">¿Existe toma actualmente?</Label>
                  <YesNo value={draft.tomaExistente ?? ''} onChange={(v) => set({ tomaExistente: v })} />
                </div>
                {draft.tomaExistente === 'si' && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-sm">Diámetro toma existente</Label>
                      <Select value={draft.diametroTomaExistente ?? ''} onValueChange={(v) => set({ diametroTomaExistente: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                        <SelectContent>
                          {DIAMETROS_TOMA.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Estado de toma existente</Label>
                      <Select value={draft.estadoTomaExistente ?? ''} onValueChange={(v) => set({ estadoTomaExistente: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                        <SelectContent>
                          {['Buena', 'Regular', 'Mala'].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Medidor</p>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm">¿Existe medidor actualmente?</Label>
                  <YesNo value={draft.medidorExistente ?? ''} onChange={(v) => set({ medidorExistente: v })} />
                </div>
                {draft.medidorExistente === 'si' && (
                  <div className="space-y-1">
                    <Label className="text-sm">Núm. de medidor existente</Label>
                    <Input className="h-9" placeholder="Núm. medidor" value={draft.numMedidorExistente ?? ''} onChange={(e) => set({ numMedidorExistente: e.target.value })} />
                  </div>
                )}
              </div>

              <Separator />
              <div className="space-y-1">
                <Label className="text-sm">Observaciones del inspector</Label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Notas adicionales del inspector…"
                  value={draft.observaciones ?? ''}
                  onChange={(e) => set({ observaciones: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer actions — edit mode */}
        {editing && (
          <div className="flex items-center justify-end gap-2 border-t px-6 py-4">
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancelar</Button>
            <Button type="button" onClick={handleSave} className="bg-[#007BFF] hover:bg-blue-600 text-white">
              Guardar inspección
            </Button>
          </div>
        )}

        {/* Footer actions — view mode after inspection is completed */}
        {!editing && orden?.estado === 'completada' && record && (
          <div className="border-t px-6 py-4 space-y-3">
            {(record.estado === 'en_cotizacion' || record.estado === 'inspeccion_completada') && (
              <>
                <p className="text-xs text-muted-foreground">La inspección fue completada. Puedes avanzar a cuantificación o rechazar la solicitud.</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                    onClick={() => onRechazar(record.id)}
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button
                    type="button"
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => onAceptar(record.id)}
                  >
                    <ArrowRight className="mr-1.5 h-4 w-4" />
                    Continuar con cuantificación
                  </Button>
                </div>
              </>
            )}
            {(record.estado === 'aceptada' || record.estado === 'contratado') && (
              <div className="flex items-center gap-2 text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-medium">Solicitud aceptada — proceso de contratación iniciado</span>
              </div>
            )}
            {record.estado === 'rechazada' && (
              <div className="flex items-center gap-2 text-red-700">
                <XCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Solicitud rechazada</span>
              </div>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Cotización pricing engine ─────────────────────────────────────────────────

const PRECIO_CALLE: Record<string, number> = {
  concreto_hidraulico: 850,
  concreto_asfaltico: 650,
  tierra: 180,
  adoquin: 520,
  otro: 400,
};

const PRECIO_BANQUETA: Record<string, number> = {
  concreto_hidraulico: 750,
  tierra: 150,
  adoquin: 480,
  otro: 350,
};

const PRECIO_TOMA: Record<string, number> = {
  '1/2"': 3200, '3/4"': 4100, '1"': 5800,
  '1.5"': 8500, '2"': 12000, '3"': 18000, '4"': 28000,
};

interface ConceptoCotizacion {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
}

function calcularCotizacion(orden: OrdenInspeccionData): ConceptoCotizacion[] {
  const conceptos: ConceptoCotizacion[] = [];

  // Derechos de conexión (fixed)
  conceptos.push({ descripcion: 'Derechos de conexión', cantidad: 1, unidad: 'servicio', precioUnitario: 1200, subtotal: 1200 });

  // Ruptura y reposición de calle
  const mlCalle = parseFloat(orden.metrosRupturaCalle ?? '0') || 0;
  if (mlCalle > 0) {
    const pu = PRECIO_CALLE[orden.materialCalle ?? ''] ?? 400;
    conceptos.push({ descripcion: `Reposición de calle (${orden.materialCalle ?? 'N/A'})`, cantidad: mlCalle, unidad: 'ml', precioUnitario: pu, subtotal: mlCalle * pu });
  }

  // Ruptura y reposición de banqueta
  const mlBanqueta = parseFloat(orden.metrosRupturaBanqueta ?? '0') || 0;
  if (mlBanqueta > 0) {
    const pu = PRECIO_BANQUETA[orden.materialBanqueta ?? ''] ?? 350;
    conceptos.push({ descripcion: `Reposición de banqueta (${orden.materialBanqueta ?? 'N/A'})`, cantidad: mlBanqueta, unidad: 'ml', precioUnitario: pu, subtotal: mlBanqueta * pu });
  }

  // Instalación de toma
  if (orden.diametroToma) {
    const pu = PRECIO_TOMA[orden.diametroToma] ?? 5800;
    conceptos.push({ descripcion: `Instalación de toma ${orden.diametroToma}`, cantidad: 1, unidad: 'pieza', precioUnitario: pu, subtotal: pu });
  }

  // Medidor (solo si no existe)
  if (orden.medidorExistente === 'no') {
    conceptos.push({ descripcion: 'Suministro e instalación de medidor', cantidad: 1, unidad: 'pieza', precioUnitario: 2800, subtotal: 2800 });
  }

  return conceptos;
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

// ── Cotización Modal ──────────────────────────────────────────────────────────

function CotizacionModal({
  record,
  open,
  onClose,
  onAceptar,
  onRechazar,
}: {
  record: SolicitudRecord | null;
  open: boolean;
  onClose: () => void;
  onAceptar: (id: string) => void;
  onRechazar: (id: string) => void;
}) {
  const [aceptando, setAceptando] = useState(false);

  if (!record || !record.ordenInspeccion) return null;

  const conceptos = calcularCotizacion(record.ordenInspeccion);
  const total = conceptos.reduce((s, c) => s + c.subtotal, 0);
  const vigencia = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });

  async function handleAceptar() {
    setAceptando(true);
    try {
      await createContrato({
        tipoContrato: 'NORMAL',
        tipoServicio: 'AGUA_POTABLE',
        nombre: record!.propNombreCompleto,
        rfc: record!.formData.propRfc || 'XAXX010101000',
        direccion: record!.predioResumen,   // ← siempre la ubicación del predio
        contacto: record!.propTelefono,
        estado: 'ACTIVO',
        fecha: new Date().toISOString().split('T')[0],
        tipoContratacionId: record!.tipoContratacionId || undefined,
        domiciliado: false,
      });
    } catch {
      // API may not be connected; continue with local state update
    }
    onAceptar(record!.id);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blue-600" />
            Cotización — {record.folio}
          </DialogTitle>
          <DialogDescription>
            {record.propNombreCompleto} · {record.predioResumen}
          </DialogDescription>
        </DialogHeader>

        {/* Validity notice */}
        <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          Esta cotización tiene una vigencia de 5 días hábiles — vence el <span className="font-medium ml-1">{vigencia}</span>
        </div>

        {/* Concepts table */}
        <div className="overflow-hidden rounded-md border text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">Concepto</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Cant.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">P.U.</th>
                <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {conceptos.map((c) => (
                <tr key={c.descripcion}>
                  <td className="px-4 py-2.5">{c.descripcion}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{c.cantidad} {c.unidad}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{MXN.format(c.precioUnitario)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums font-medium">{MXN.format(c.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t bg-muted/20">
                <td colSpan={3} className="px-4 py-3 text-right font-semibold">Total estimado</td>
                <td className="px-4 py-3 text-right text-base font-bold tabular-nums">{MXN.format(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <p className="text-xs text-muted-foreground">* Los precios son estimados y pueden ajustarse según las condiciones del terreno.</p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onRechazar(record.id)}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Rechazar cotización
          </Button>
          <Button
            type="button"
            disabled={aceptando}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={handleAceptar}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            {aceptando ? 'Iniciando contrato…' : 'Cliente acepta la cotización'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main list page ────────────────────────────────────────────────────────────

export default function Solicitudes() {
  const navigate = useNavigate();
  const store = useSolicitudesStore();
  const [search, setSearch] = useState('');
  const [inspRecord, setInspRecord] = useState<SolicitudRecord | null>(null);
  const [cotizandoRecord, setCotizandoRecord] = useState<SolicitudRecord | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return store.records;
    return store.records.filter(
      (r) =>
        r.folio.toLowerCase().includes(q) ||
        r.propNombreCompleto.toLowerCase().includes(q) ||
        r.predioResumen.toLowerCase().includes(q),
    );
  }, [store.records, search]);

  // KPI counts (3-state model)
  const total = store.records.length;
  const pendientesInsp = store.records.filter((r) =>
    ['borrador', 'inspeccion_pendiente', 'inspeccion_en_proceso'].includes(r.estado),
  ).length;
  const enCotizacion = store.records.filter((r) =>
    ['inspeccion_completada', 'en_cotizacion', 'cotizado'].includes(r.estado),
  ).length;
  const aceptadas = store.records.filter((r) => r.estado === 'aceptada' || r.estado === 'contratado').length;
  const rechazadas = store.records.filter((r) => r.estado === 'rechazada').length;

  function handleSaveOrden(id: string, orden: OrdenInspeccionData) {
    store.setOrdenInspeccion(id, orden);
    const nextEstado = orden.estado === 'completada' ? 'en_cotizacion' as const : 'inspeccion_en_proceso' as const;
    setInspRecord((prev) => (prev?.id === id ? { ...prev, ordenInspeccion: orden, estado: nextEstado } : prev));
  }

  // Opens the cotización modal instead of navigating immediately
  function handleContinuarCuantificacion(id: string) {
    const r = store.records.find((r) => r.id === id) ?? inspRecord;
    setCotizandoRecord(r ?? null);
    setInspRecord(null);
  }

  // Called from CotizacionModal when client accepts
  function handleConfirmarCotizacion(id: string) {
    store.aceptarSolicitud(id);
    setCotizandoRecord(null);
    toast.success('Cotización aceptada — proceso de contratación iniciado');
    navigate('/app/contratos');
  }

  // Called from CotizacionModal or sheet footer to reject
  function handleRechazar(id: string) {
    store.rechazarSolicitud(id);
    setInspRecord(null);
    setCotizandoRecord(null);
    toast.info('Solicitud rechazada');
  }

  return (
    <div className="space-y-6">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Solicitudes de Servicio</h1>
          <p className="text-sm text-muted-foreground">CEA-FUS01 — Registro de solicitudes de contratación en ventanilla</p>
        </div>
        <Button
          type="button"
          className="bg-[#007BFF] hover:bg-blue-600 text-white"
          onClick={() => navigate('/app/solicitudes/nueva')}
        >
          <ClipboardPlus className="mr-2 h-4 w-4" />
          Nueva solicitud
        </Button>
      </div>

      {/* ── Flow indicator ───────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg border bg-muted/30 px-4 py-2.5 text-xs text-muted-foreground">
        <span>Flujo:</span>
        {[
          'Solicitud CEA-FUS01',
          'Inspección en campo',
          'Cotización (5 días vigencia)',
          'Contratación',
        ].map((step, i, arr) => (
          <span key={step} className="flex items-center gap-1.5">
            <span>{step}</span>
            {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground/40" />}
          </span>
        ))}
      </div>

      {/* ── KPIs ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total solicitudes', value: total, className: '' },
          { label: 'Pendientes de inspección', value: pendientesInsp, className: 'text-amber-600' },
          { label: 'En cotización', value: enCotizacion, className: 'text-blue-600' },
          { label: 'Aceptadas', value: aceptadas + rechazadas, className: 'text-emerald-600' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={cn('text-3xl font-bold tabular-nums', kpi.className)}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Buscar por folio, propietario o domicilio…"
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div>
            <p className="font-medium">
              {store.records.length === 0 ? 'No hay solicitudes registradas' : 'Sin resultados para este filtro'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {store.records.length === 0
                ? 'Cuando llegue un cliente a ventanilla, usa el botón "Nueva solicitud" para empezar.'
                : 'Ajusta la búsqueda para encontrar solicitudes.'}
            </p>
          </div>
          {store.records.length === 0 && (
            <Button type="button" onClick={() => navigate('/app/solicitudes/nueva')} className="bg-[#007BFF] hover:bg-blue-600 text-white">
              <ClipboardPlus className="mr-2 h-4 w-4" />
              Nueva solicitud
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Folio</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Propietario</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground md:table-cell">Domicilio del predio</th>
                <th className="hidden px-4 py-3 text-left font-medium text-muted-foreground sm:table-cell">Fecha</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium">{r.folio}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium">{r.propNombreCompleto}</span>
                    {r.propTelefono && r.propTelefono !== '—' && (
                      <span className="block text-xs text-muted-foreground">{r.propTelefono}</span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {r.predioResumen}
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                    {r.fechaSolicitud}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge estado={r.estado} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => navigate(`/app/solicitudes/${r.id}/editar`)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Editar
                      </Button>
                      {(r.estado === 'aceptada' || r.estado === 'contratado') ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
                          onClick={() => navigate('/app/contratos')}
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                          Ver contrato
                        </Button>
                      ) : (r.estado === 'en_cotizacion' || r.estado === 'inspeccion_completada' || r.estado === 'cotizado') ? (
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1.5 bg-blue-600 text-white hover:bg-blue-700"
                          onClick={() => setCotizandoRecord(r)}
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Cuantificación
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                          onClick={() => setInspRecord(r)}
                        >
                          <ClipboardList className="h-3.5 w-3.5" />
                          Inspección
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Inspection Sheet ──────────────────────────────────────────── */}
      <OrdenInspeccionSheet
        record={inspRecord}
        open={!!inspRecord}
        onClose={() => setInspRecord(null)}
        onSave={handleSaveOrden}
        onAceptar={handleContinuarCuantificacion}
        onRechazar={handleRechazar}
      />

      <CotizacionModal
        record={cotizandoRecord}
        open={!!cotizandoRecord}
        onClose={() => setCotizandoRecord(null)}
        onAceptar={handleConfirmarCotizacion}
        onRechazar={handleRechazar}
      />
    </div>
  );
}
