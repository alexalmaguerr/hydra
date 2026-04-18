import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSolicitudes,
  upsertInspeccion as apiUpsertInspeccion,
  aceptarSolicitud as apiAceptarSolicitud,
  rechazarSolicitud as apiRechazarSolicitud,
  type SolicitudDto,
  type SolicitudInspeccionDto,
} from '@/api/solicitudes';
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
  Wand2,
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
import type { SolicitudRecord, OrdenInspeccionData, SolicitudEstado } from '@/types/solicitudes';

// ── DTO → local record mappers ────────────────────────────────────────────────

function inspDtoToOrden(insp: SolicitudInspeccionDto): OrdenInspeccionData {
  return {
    estado: insp.estado as OrdenInspeccionData['estado'],
    fechaInspeccion: insp.fechaInspeccion ?? undefined,
    numeroOficial: insp.numeroOficial ?? undefined,
    tipoUso: insp.tipoUso ?? undefined,
    giro: insp.giro ?? undefined,
    areaTerreno: insp.areaTerreno ?? undefined,
    condicionToma: insp.condicionToma ?? undefined,
    condicionesPredio: insp.condicionesPredio ?? undefined,
    infraHidraulicaExterna: (insp.infraHidraulicaExterna as 'si' | 'no' | '') ?? '',
    infraSanitaria: (insp.infraSanitaria as 'si' | 'no' | '') ?? '',
    materialCalle: insp.materialCalle ?? undefined,
    materialBanqueta: insp.materialBanqueta ?? undefined,
    metrosRupturaAguaBanqueta: insp.metrosRupturaAguaBanqueta ?? undefined,
    metrosRupturaAguaCalle: insp.metrosRupturaAguaCalle ?? undefined,
    metrosRupturaDrenajeBanqueta: insp.metrosRupturaDrenajeBanqueta ?? undefined,
    metrosRupturaDrenajeCalle: insp.metrosRupturaDrenajeCalle ?? undefined,
    observaciones: insp.observaciones ?? undefined,
    evidencias: (insp.evidencias as string[]) ?? undefined,
    resultadoEjecucion: insp.resultadoEjecucion ?? undefined,
    resultadoInspeccion: insp.resultadoInspeccion ?? undefined,
    inspectorNumEmpleado: insp.inspectorNumEmpleado ?? undefined,
    inspectorNombre: insp.inspectorNombre ?? undefined,
    firmaInspector: insp.firmaInspector ?? undefined,
    inspectoresAdicionales: (insp.inspectoresAdicionales as OrdenInspeccionData['inspectoresAdicionales']) ?? undefined,
    inicio: insp.inicio ?? undefined,
    fin: insp.fin ?? undefined,
    tipoOrdenCorrecto: (insp.tipoOrdenCorrecto as 'si' | 'no' | '') ?? '',
    // Legacy
    inspector: insp.inspector ?? undefined,
    diametroToma: insp.diametroToma ?? undefined,
    medidorExistente: (insp.medidorExistente as 'si' | 'no' | '') ?? '',
    numMedidorExistente: insp.numMedidorExistente ?? undefined,
    metrosRupturaCalle: insp.metrosRupturaCalle ?? undefined,
    metrosRupturaBanqueta: insp.metrosRupturaBanqueta ?? undefined,
    existeRed: (insp.existeRed as 'si' | 'no' | '') ?? '',
  };
}

function dtoToRecord(dto: SolicitudDto): SolicitudRecord {
  const fd = dto.formData as any;
  return {
    id: dto.id,
    folio: dto.folio,
    fechaSolicitud: new Date(dto.fechaSolicitud).toLocaleDateString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit',
    }),
    propNombreCompleto: dto.propNombreCompleto,
    propTelefono: dto.propTelefono ?? '—',
    predioResumen: dto.predioResumen,
    adminId: fd?.adminId ?? '',
    tipoContratacionId: dto.tipoContratacionId ?? '',
    usoDomestico: (fd?.usoDomestico as 'si' | 'no' | '') ?? '',
    estado: dto.estado as SolicitudEstado,
    ordenInspeccion: dto.inspeccion ? inspDtoToOrden(dto.inspeccion) : undefined,
    formData: dto.formData,
    contratoId: dto.contratoId ?? undefined,
    createdAt: dto.createdAt,
  };
}

// ── Catalogues for inspection form ───────────────────────────────────────────

const MATERIAL_CALLE = [
  { id: 'empedrado', label: 'Empedrado' },
  { id: 'concreto_hidraulico', label: 'Concreto hidráulico' },
  { id: 'concreto_asfaltico', label: 'Concreto asfáltico' },
  { id: 'tierra', label: 'Tierra' },
  { id: 'adoquin', label: 'Adoquín' },
  { id: 'otro', label: 'Otro' },
];

const MATERIAL_BANQUETA = [
  { id: 'concreto', label: 'Concreto' },
  { id: 'concreto_hidraulico', label: 'Concreto hidráulico' },
  { id: 'tierra', label: 'Tierra' },
  { id: 'adoquin', label: 'Adoquín' },
  { id: 'otro', label: 'Otro' },
];

const CONDICION_TOMA = [
  { id: 'no_tiene', label: 'No tiene' },
  { id: 'buena', label: 'Buena' },
  { id: 'regular', label: 'Regular' },
  { id: 'mala', label: 'Mala' },
  { id: 'registrada', label: 'Registrada' },
];

const CONDICIONES_PREDIO = [
  { id: 'baldio', label: 'Baldío' },
  { id: 'construido', label: 'Construido' },
  { id: 'en_construccion', label: 'En construcción' },
  { id: 'fraccionamiento', label: 'Fraccionamiento' },
];

const TIPO_USO = [
  { id: 'domestico', label: 'Doméstico' },
  { id: 'no_domestico', label: 'No Doméstico' },
  { id: 'baldio', label: 'Baldío' },
  { id: 'comercial', label: 'Comercial' },
  { id: 'industrial', label: 'Industrial' },
];

const RESULTADO_EJECUCION = [
  { id: 'visitada_ejecutada', label: 'Visitada y Ejecutada' },
  { id: 'no_ejecutada', label: 'No Ejecutada' },
  { id: 'cancelada', label: 'Cancelada' },
];

const RESULTADO_INSPECCION = [
  { id: 'ejecutada', label: 'Ejecutada' },
  { id: 'no_ejecutada', label: 'No Ejecutada' },
  { id: 'pendiente', label: 'Pendiente' },
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
    label: 'Alta de contrato iniciada',
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
    label: 'Alta de contrato iniciada',
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
  empedrado: 'Empedrado',
  concreto_hidraulico: 'Concreto hidráulico',
  concreto_asfaltico: 'Concreto asfáltico',
  concreto: 'Concreto',
  tierra: 'Tierra',
  adoquin: 'Adoquín',
  otro: 'Otro',
};

const CATALOG_LABEL = (list: { id: string; label: string }[], id?: string) =>
  list.find((x) => x.id === id)?.label ?? id ?? '—';

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

// ── Inspection mock data ──────────────────────────────────────────────────────

const MOCK_INSPECCION: OrdenInspeccionData = {
  estado: 'completada',
  fechaInspeccion: '2026-04-13',
  numeroOficial: 'No marcado',
  tipoUso: 'baldio',
  giro: 'Baldío',
  areaTerreno: '180',
  condicionToma: 'no_tiene',
  condicionesPredio: 'baldio',
  infraHidraulicaExterna: 'si',
  infraSanitaria: 'si',
  materialCalle: 'empedrado',
  materialBanqueta: 'concreto',
  metrosRupturaAguaBanqueta: '2',
  metrosRupturaAguaCalle: '0',
  metrosRupturaDrenajeBanqueta: '2',
  metrosRupturaDrenajeCalle: '3',
  observaciones: 'Solar baldío físicamente no se aprecian las preparaciones de agua y drenaje, se marcan metros de ruptura.',
  resultadoEjecucion: 'visitada_ejecutada',
  resultadoInspeccion: 'ejecutada',
  inspectorNumEmpleado: '180076',
  inspectorNombre: 'Sergio Leonardo Nuñez López',
  inicio: '2026-04-13T13:15:09',
  fin: '2026-04-13T13:19:25',
  tipoOrdenCorrecto: 'si',
};

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

  function handlePrellenar() {
    setDraft(MOCK_INSPECCION);
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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Información general</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Fecha de inspección" value={orden.fechaInspeccion} />
                <DetailRow label="Número oficial" value={orden.numeroOficial} />
                <DetailRow label="Tipo de uso" value={CATALOG_LABEL(TIPO_USO, orden.tipoUso)} />
                <DetailRow label="Giro" value={orden.giro} />
                <DetailRow label="Área terreno (m²)" value={orden.areaTerreno ? `${orden.areaTerreno} m²` : undefined} />
                <DetailRow label="Condición de la toma" value={CATALOG_LABEL(CONDICION_TOMA, orden.condicionToma)} />
                <DetailRow label="Condiciones del predio" value={CATALOG_LABEL(CONDICIONES_PREDIO, orden.condicionesPredio)} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Infraestructura</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Infra. hidráulica externa" value={orden.infraHidraulicaExterna === 'si' ? 'Sí' : orden.infraHidraulicaExterna === 'no' ? 'No' : undefined} />
                <DetailRow label="Infra. sanitaria" value={orden.infraSanitaria === 'si' ? 'Sí' : orden.infraSanitaria === 'no' ? 'No' : undefined} />
                <DetailRow label="Material de calle" value={orden.materialCalle ? MATERIAL_LABEL[orden.materialCalle] : undefined} />
                <DetailRow label="Material de banqueta" value={orden.materialBanqueta ? MATERIAL_LABEL[orden.materialBanqueta] : undefined} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ruptura AGUA</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Banqueta (ml)" value={orden.metrosRupturaAguaBanqueta} />
                <DetailRow label="Calle (ml)" value={orden.metrosRupturaAguaCalle} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ruptura DRENAJE</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Banqueta (ml)" value={orden.metrosRupturaDrenajeBanqueta} />
                <DetailRow label="Calle (ml)" value={orden.metrosRupturaDrenajeCalle} />
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

              {orden.evidencias && orden.evidencias.length > 0 && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidencia fotográfica</p>
                  <div className="grid grid-cols-2 gap-2">
                    {orden.evidencias.map((src, i) => (
                      <img key={i} src={src} alt={`Evidencia ${i + 1}`} className="w-full rounded-md border object-cover aspect-video" />
                    ))}
                  </div>
                </>
              )}

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultados</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Resultado de ejecución" value={CATALOG_LABEL(RESULTADO_EJECUCION, orden.resultadoEjecucion)} />
                <DetailRow label="Resultado de inspección" value={CATALOG_LABEL(RESULTADO_INSPECCION, orden.resultadoInspeccion)} />
              </div>

              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector asignado</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="No. Empleado" value={orden.inspectorNumEmpleado} />
                <DetailRow label="Nombre" value={orden.inspectorNombre} />
              </div>
              {orden.firmaInspector && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Firma del inspector</p>
                  <img src={orden.firmaInspector} alt="Firma inspector" className="max-h-28 rounded-md border bg-white p-2" />
                </div>
              )}

              {orden.inspectoresAdicionales && orden.inspectoresAdicionales.length > 0 && (
                <>
                  <Separator />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspectores adicionales</p>
                  {orden.inspectoresAdicionales.map((insp, i) => (
                    <div key={i} className="rounded-md border p-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <DetailRow label="No. Empleado" value={insp.noEmpleado} />
                        <DetailRow label="Nombre" value={insp.nombre} />
                      </div>
                      {insp.firma && (
                        <img src={insp.firma} alt={`Firma inspector ${i + 2}`} className="max-h-28 rounded-md border bg-white p-2" />
                      )}
                    </div>
                  ))}
                </>
              )}

              <Separator />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Inicio" value={orden.inicio} />
                <DetailRow label="Fin" value={orden.fin} />
                <DetailRow label="Tipo de orden correcto" value={orden.tipoOrdenCorrecto === 'si' ? 'Sí' : orden.tipoOrdenCorrecto === 'no' ? 'No' : undefined} />
              </div>
            </div>
          )}

          {/* Edit / create form */}
          {editing && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Registrar resultados de inspección</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
                  onClick={handlePrellenar}
                >
                  <Wand2 className="h-3 w-3" />
                  Prellenar demo
                </Button>
              </div>

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

              {/* Información general */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Información general</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Fecha de inspección</Label>
                  <Input className="h-9" type="date" value={draft.fechaInspeccion ?? ''} onChange={(e) => set({ fechaInspeccion: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Número oficial</Label>
                  <Input className="h-9" placeholder="Ej. 123 o No marcado" value={draft.numeroOficial ?? ''} onChange={(e) => set({ numeroOficial: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Tipo de uso</Label>
                  <Select value={draft.tipoUso ?? ''} onValueChange={(v) => set({ tipoUso: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {TIPO_USO.map((t) => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Giro</Label>
                  <Input className="h-9" placeholder="Ej. Baldío, Restaurante…" value={draft.giro ?? ''} onChange={(e) => set({ giro: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Área terreno (m²)</Label>
                  <Input className="h-9" type="number" min="0" placeholder="0" value={draft.areaTerreno ?? ''} onChange={(e) => set({ areaTerreno: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Condición de la toma</Label>
                  <Select value={draft.condicionToma ?? ''} onValueChange={(v) => set({ condicionToma: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {CONDICION_TOMA.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-sm">Condiciones del predio</Label>
                  <Select value={draft.condicionesPredio ?? ''} onValueChange={(v) => set({ condicionesPredio: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {CONDICIONES_PREDIO.map((c) => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Infraestructura */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Infraestructura</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm">¿Infra. hidráulica externa?</Label>
                  <YesNo value={draft.infraHidraulicaExterna ?? ''} onChange={(v) => set({ infraHidraulicaExterna: v })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">¿Infra. sanitaria?</Label>
                  <YesNo value={draft.infraSanitaria ?? ''} onChange={(v) => set({ infraSanitaria: v })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Material de calle</Label>
                  <Select value={draft.materialCalle ?? ''} onValueChange={(v) => set({ materialCalle: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_CALLE.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Material de banqueta</Label>
                  <Select value={draft.materialBanqueta ?? ''} onValueChange={(v) => set({ materialBanqueta: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {MATERIAL_BANQUETA.map((m) => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Ruptura AGUA */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metros de ruptura — AGUA</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Banqueta (ml)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0" value={draft.metrosRupturaAguaBanqueta ?? ''} onChange={(e) => set({ metrosRupturaAguaBanqueta: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Calle (ml)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0" value={draft.metrosRupturaAguaCalle ?? ''} onChange={(e) => set({ metrosRupturaAguaCalle: e.target.value })} />
                </div>
              </div>

              {/* Ruptura DRENAJE */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Metros de ruptura — DRENAJE</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Banqueta (ml)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0" value={draft.metrosRupturaDrenajeBanqueta ?? ''} onChange={(e) => set({ metrosRupturaDrenajeBanqueta: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Calle (ml)</Label>
                  <Input className="h-9" type="number" min="0" step="0.01" placeholder="0" value={draft.metrosRupturaDrenajeCalle ?? ''} onChange={(e) => set({ metrosRupturaDrenajeCalle: e.target.value })} />
                </div>
              </div>

              {/* Observaciones y evidencia */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observaciones y evidencia</p>
              <div className="space-y-1">
                <Label className="text-sm">Observaciones</Label>
                <textarea
                  className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                  placeholder="Descripción de las condiciones encontradas…"
                  value={draft.observaciones ?? ''}
                  onChange={(e) => set({ observaciones: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Evidencia fotográfica</Label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? []);
                    files.forEach((file) => {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const b64 = ev.target?.result as string;
                        set({ evidencias: [...(draft.evidencias ?? []), b64] });
                      };
                      reader.readAsDataURL(file);
                    });
                    e.target.value = '';
                  }}
                />
                {draft.evidencias && draft.evidencias.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {draft.evidencias.map((src, i) => (
                      <div key={i} className="relative group">
                        <img src={src} alt={`Evidencia ${i + 1}`} className="w-full rounded-md border object-cover aspect-video" />
                        <button
                          type="button"
                          onClick={() => set({ evidencias: draft.evidencias!.filter((_, j) => j !== i) })}
                          className="absolute top-1 right-1 hidden group-hover:flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white text-xs"
                        >✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resultados */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultados</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Resultado de ejecución</Label>
                  <Select value={draft.resultadoEjecucion ?? ''} onValueChange={(v) => set({ resultadoEjecucion: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {RESULTADO_EJECUCION.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Resultado de inspección</Label>
                  <Select value={draft.resultadoInspeccion ?? ''} onValueChange={(v) => set({ resultadoInspeccion: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                    <SelectContent>
                      {RESULTADO_INSPECCION.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Inspector principal */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector asignado</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">No. Empleado</Label>
                  <Input className="h-9" placeholder="180076" value={draft.inspectorNumEmpleado ?? ''} onChange={(e) => set({ inspectorNumEmpleado: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Nombre</Label>
                  <Input className="h-9" placeholder="Nombre completo" value={draft.inspectorNombre ?? ''} onChange={(e) => set({ inspectorNombre: e.target.value })} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Firma del inspector</Label>
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-muted/80"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => set({ firmaInspector: ev.target?.result as string });
                    reader.readAsDataURL(file);
                  }}
                />
                {draft.firmaInspector && (
                  <div className="flex items-start gap-2">
                    <img src={draft.firmaInspector} alt="Firma" className="max-h-24 rounded-md border bg-white p-2" />
                    <button type="button" onClick={() => set({ firmaInspector: undefined })} className="text-xs text-destructive hover:underline">Eliminar</button>
                  </div>
                )}
              </div>

              {/* Inspectores adicionales */}
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspectores adicionales</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => set({ inspectoresAdicionales: [...(draft.inspectoresAdicionales ?? []), { noEmpleado: '', nombre: '' }] })}
                >
                  + Agregar
                </Button>
              </div>
              {(draft.inspectoresAdicionales ?? []).map((insp, i) => (
                <div key={i} className="rounded-md border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">Inspector {i + 2}</p>
                    <button
                      type="button"
                      onClick={() => set({ inspectoresAdicionales: draft.inspectoresAdicionales!.filter((_, j) => j !== i) })}
                      className="text-xs text-destructive hover:underline"
                    >Eliminar</button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">No. Empleado</Label>
                      <Input className="h-8" placeholder="110152" value={insp.noEmpleado} onChange={(e) => {
                        const updated = [...draft.inspectoresAdicionales!];
                        updated[i] = { ...updated[i], noEmpleado: e.target.value };
                        set({ inspectoresAdicionales: updated });
                      }} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Nombre</Label>
                      <Input className="h-8" placeholder="Nombre completo" value={insp.nombre} onChange={(e) => {
                        const updated = [...draft.inspectoresAdicionales!];
                        updated[i] = { ...updated[i], nombre: e.target.value };
                        set({ inspectoresAdicionales: updated });
                      }} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Firma</Label>
                    <input
                      type="file"
                      accept="image/*"
                      className="block w-full text-xs text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-2 file:py-1 file:text-xs file:font-medium"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const updated = [...draft.inspectoresAdicionales!];
                          updated[i] = { ...updated[i], firma: ev.target?.result as string };
                          set({ inspectoresAdicionales: updated });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                    {insp.firma && <img src={insp.firma} alt="Firma" className="max-h-20 rounded-md border bg-white p-1" />}
                  </div>
                </div>
              ))}

              {/* Tiempos y validación */}
              <Separator />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tiempos y validación</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-sm">Inicio</Label>
                  <Input className="h-9" type="datetime-local" value={draft.inicio ?? ''} onChange={(e) => set({ inicio: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Fin</Label>
                  <Input className="h-9" type="datetime-local" value={draft.fin ?? ''} onChange={(e) => set({ fin: e.target.value })} />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label className="text-sm">¿El tipo de inspección y número de orden es correcto?</Label>
                  <YesNo value={draft.tipoOrdenCorrecto ?? ''} onChange={(v) => set({ tipoOrdenCorrecto: v })} />
                </div>
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

  // Ruptura y reposición de calle (agua + drenaje, con fallback a legacy)
  const mlCalleAgua = parseFloat(orden.metrosRupturaAguaCalle ?? orden.metrosRupturaCalle ?? '0') || 0;
  const mlCalleDrenaje = parseFloat(orden.metrosRupturaDrenajeCalle ?? '0') || 0;
  const mlCalle = mlCalleAgua + mlCalleDrenaje;
  if (mlCalle > 0) {
    const pu = PRECIO_CALLE[orden.materialCalle ?? ''] ?? 400;
    conceptos.push({ descripcion: `Reposición de calle (${MATERIAL_LABEL[orden.materialCalle ?? ''] ?? 'N/A'})`, cantidad: mlCalle, unidad: 'ml', precioUnitario: pu, subtotal: mlCalle * pu });
  }

  // Ruptura y reposición de banqueta (agua + drenaje, con fallback a legacy)
  const mlBanquetaAgua = parseFloat(orden.metrosRupturaAguaBanqueta ?? orden.metrosRupturaBanqueta ?? '0') || 0;
  const mlBanquetaDrenaje = parseFloat(orden.metrosRupturaDrenajeBanqueta ?? '0') || 0;
  const mlBanqueta = mlBanquetaAgua + mlBanquetaDrenaje;
  if (mlBanqueta > 0) {
    const pu = PRECIO_BANQUETA[orden.materialBanqueta ?? ''] ?? 350;
    conceptos.push({ descripcion: `Reposición de banqueta (${MATERIAL_LABEL[orden.materialBanqueta ?? ''] ?? 'N/A'})`, cantidad: mlBanqueta, unidad: 'ml', precioUnitario: pu, subtotal: mlBanqueta * pu });
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
  onAceptar: (id: string, contratoId?: string) => void;
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
      // Backend /aceptar creates the Contrato and links it to this Solicitud
      const res = await apiAceptarSolicitud(record!.id);
      onAceptar(record!.id, res.contratoId);
    } catch (err) {
      setAceptando(false);
      toast.error('Error al aceptar', { description: err instanceof Error ? err.message : 'No se pudo crear el contrato. Verifica la conexión con el servidor.' });
    }
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
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [inspRecord, setInspRecord] = useState<SolicitudRecord | null>(null);
  const [cotizandoRecord, setCotizandoRecord] = useState<SolicitudRecord | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────
  const { data: solicitudesData } = useQuery({
    queryKey: ['solicitudes'],
    queryFn: () => fetchSolicitudes({ limit: 200 }),
  });
  const records = useMemo(
    () => (solicitudesData?.data ?? []).map(dtoToRecord),
    [solicitudesData],
  );

  // ── Mutations ─────────────────────────────────────────────────────────
  const upsertInspeccionMutation = useMutation({
    mutationFn: ({ id, orden }: { id: string; orden: OrdenInspeccionData }) =>
      apiUpsertInspeccion(id, orden),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });

  const rechazarMutation = useMutation({
    mutationFn: (id: string) => apiRechazarSolicitud(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return records;
    return records.filter(
      (r) =>
        r.folio.toLowerCase().includes(q) ||
        r.propNombreCompleto.toLowerCase().includes(q) ||
        r.predioResumen.toLowerCase().includes(q),
    );
  }, [records, search]);

  // KPI counts (3-state model)
  const total = records.length;
  const pendientesInsp = records.filter((r) =>
    ['borrador', 'inspeccion_pendiente', 'inspeccion_en_proceso'].includes(r.estado),
  ).length;
  const enCotizacion = records.filter((r) =>
    ['inspeccion_completada', 'en_cotizacion', 'cotizado'].includes(r.estado),
  ).length;
  const aceptadas = records.filter((r) => r.estado === 'aceptada' || r.estado === 'contratado').length;
  const rechazadas = records.filter((r) => r.estado === 'rechazada').length;

  function handleSaveOrden(id: string, orden: OrdenInspeccionData) {
    upsertInspeccionMutation.mutate({ id, orden });
    const nextEstado = orden.estado === 'completada' ? 'en_cotizacion' as const : 'inspeccion_en_proceso' as const;
    setInspRecord((prev) => (prev?.id === id ? { ...prev, ordenInspeccion: orden, estado: nextEstado } : prev));
  }

  // Opens the cotización modal instead of navigating immediately
  function handleContinuarCuantificacion(id: string) {
    const r = records.find((r) => r.id === id) ?? inspRecord;
    setCotizandoRecord(r ?? null);
    setInspRecord(null);
  }

  // Called from CotizacionModal when client accepts (API call is inside the modal)
  function handleConfirmarCotizacion(_id: string, contratoId?: string) {
    queryClient.invalidateQueries({ queryKey: ['solicitudes'] });
    queryClient.invalidateQueries({ queryKey: ['contratos'] });
    setCotizandoRecord(null);
    toast.success('Cotización aceptada — proceso de contratación iniciado');
    navigate(contratoId ? `/app/contratos?detail=${contratoId}` : '/app/contratos');
  }

  // Called from CotizacionModal or sheet footer to reject
  function handleRechazar(id: string) {
    rechazarMutation.mutate(id);
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
              {records.length === 0 ? 'No hay solicitudes registradas' : 'Sin resultados para este filtro'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {records.length === 0
                ? 'Cuando llegue un cliente a ventanilla, usa el botón "Nueva solicitud" para empezar.'
                : 'Ajusta la búsqueda para encontrar solicitudes.'}
            </p>
          </div>
          {records.length === 0 && (
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
                          onClick={() => navigate(r.contratoId ? `/app/contratos?detail=${r.contratoId}` : '/app/contratos')}
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
        onAceptar={(id, contratoId) => handleConfirmarCotizacion(id, contratoId)}
        onRechazar={handleRechazar}
      />
    </div>
  );
}
