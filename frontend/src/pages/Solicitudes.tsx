import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSolicitudes,
  aceptarSolicitud as apiAceptarSolicitud,
  cancelarSolicitud as apiCancelarSolicitud,
  retormarSolicitud as apiRetormarSolicitud,
  type SolicitudDto,
  type SolicitudInspeccionDto,
} from '@/api/solicitudes';
import { fetchTiposContratacion } from '@/api/tipos-contratacion';
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
  WifiOff,
  Ban,
  RotateCcw,
  Filter,
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
  const tipoFromForm = typeof fd?.tipoContratacionId === 'string' ? fd.tipoContratacionId.trim() : '';
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
    tipoContratacionId: (dto.tipoContratacionId ?? tipoFromForm) || '',
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
  cancelada: {
    label: 'Cancelada',
    icon: Ban,
    className: 'border-slate-400/60 bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400',
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

// ── Inspection mock data (3 presets for demo cycling) ────────────────────────

const MOCK_INSPECCIONES: OrdenInspeccionData[] = [
  // 1. Residencial — toma nueva, ruptura moderada
  {
    estado: 'completada',
    fechaInspeccion: '2026-04-10',
    numeroOficial: '45',
    tipoUso: 'domestico',
    giro: 'Casa habitación',
    areaTerreno: '120',
    condicionToma: 'no_tiene',
    condicionesPredio: 'construido',
    infraHidraulicaExterna: 'si',
    infraSanitaria: 'si',
    materialCalle: 'concreto_asfaltico',
    materialBanqueta: 'concreto',
    metrosRupturaAguaBanqueta: '3',
    metrosRupturaAguaCalle: '2',
    metrosRupturaDrenajeBanqueta: '3',
    metrosRupturaDrenajeCalle: '0',
    observaciones: 'Predio con construcción terminada. Sin toma de agua existente. Se identifican preparaciones previas de agua y drenaje.',
    resultadoEjecucion: 'visitada_ejecutada',
    resultadoInspeccion: 'ejecutada',
    inspectorNumEmpleado: '180076',
    inspectorNombre: 'Sergio Leonardo Nuñez López',
    inicio: '2026-04-10T09:00:00',
    fin: '2026-04-10T09:18:45',
    tipoOrdenCorrecto: 'si',
  },
  // 2. Baldío — sin toma, ruptura drenaje
  {
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
  },
  // 3. Comercial — toma en mal estado, ruptura mayor, inspector adicional
  {
    estado: 'completada',
    fechaInspeccion: '2026-04-14',
    numeroOficial: '201 A',
    tipoUso: 'comercial',
    giro: 'Restaurante',
    areaTerreno: '320',
    condicionToma: 'mala',
    condicionesPredio: 'construido',
    infraHidraulicaExterna: 'si',
    infraSanitaria: 'si',
    materialCalle: 'concreto_hidraulico',
    materialBanqueta: 'concreto_hidraulico',
    metrosRupturaAguaBanqueta: '4',
    metrosRupturaAguaCalle: '5',
    metrosRupturaDrenajeBanqueta: '4',
    metrosRupturaDrenajeCalle: '6',
    observaciones: 'Local comercial con toma existente en mal estado. Se requiere cambio completo de la toma y reposición de banqueta y calle por obras previas.',
    resultadoEjecucion: 'visitada_ejecutada',
    resultadoInspeccion: 'ejecutada',
    inspectorNumEmpleado: '110152',
    inspectorNombre: 'María Elena Guerrero Vázquez',
    inspectoresAdicionales: [{ noEmpleado: '180076', nombre: 'Sergio Leonardo Nuñez López' }],
    inicio: '2026-04-14T10:30:00',
    fin: '2026-04-14T10:55:10',
    tipoOrdenCorrecto: 'si',
  },
];

// ── Inspection Sheet ──────────────────────────────────────────────────────────

function OrdenInspeccionSheet({
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
  const [mockIdx, setMockIdx] = useState(0);

  if (!record) return null;

  // For demo: use mock data if no real inspection data exists
  const orden = record.ordenInspeccion;
  const demoOrden = MOCK_INSPECCIONES[mockIdx];

  function cycleMock() {
    setMockIdx((i) => (i + 1) % MOCK_INSPECCIONES.length);
  }

  function InspeccionView({ data }: { data: OrdenInspeccionData }) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          {data.estado === 'completada' ? (
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

        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Información general</p>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Fecha de inspección" value={data.fechaInspeccion} />
          <DetailRow label="Número oficial" value={data.numeroOficial} />
          <DetailRow label="Tipo de uso" value={CATALOG_LABEL(TIPO_USO, data.tipoUso)} />
          <DetailRow label="Giro" value={data.giro} />
          <DetailRow label="Área terreno (m²)" value={data.areaTerreno ? `${data.areaTerreno} m²` : undefined} />
          <DetailRow label="Condición de la toma" value={CATALOG_LABEL(CONDICION_TOMA, data.condicionToma)} />
          <DetailRow label="Condiciones del predio" value={CATALOG_LABEL(CONDICIONES_PREDIO, data.condicionesPredio)} />
        </div>

        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Infraestructura</p>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Infra. hidráulica externa" value={data.infraHidraulicaExterna === 'si' ? 'Sí' : data.infraHidraulicaExterna === 'no' ? 'No' : undefined} />
          <DetailRow label="Infra. sanitaria" value={data.infraSanitaria === 'si' ? 'Sí' : data.infraSanitaria === 'no' ? 'No' : undefined} />
          <DetailRow label="Material de calle" value={data.materialCalle ? MATERIAL_LABEL[data.materialCalle] : undefined} />
          <DetailRow label="Material de banqueta" value={data.materialBanqueta ? MATERIAL_LABEL[data.materialBanqueta] : undefined} />
        </div>

        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ruptura AGUA</p>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Banqueta (ml)" value={data.metrosRupturaAguaBanqueta} />
          <DetailRow label="Calle (ml)" value={data.metrosRupturaAguaCalle} />
        </div>

        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ruptura DRENAJE</p>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Banqueta (ml)" value={data.metrosRupturaDrenajeBanqueta} />
          <DetailRow label="Calle (ml)" value={data.metrosRupturaDrenajeCalle} />
        </div>

        {data.observaciones && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</p>
              <p className="text-sm">{data.observaciones}</p>
            </div>
          </>
        )}

        {data.evidencias && data.evidencias.length > 0 && (
          <>
            <Separator />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidencia fotográfica</p>
            <div className="grid grid-cols-2 gap-2">
              {data.evidencias.map((src, i) => (
                <img key={i} src={src} alt={`Evidencia ${i + 1}`} className="w-full rounded-md border object-cover aspect-video" />
              ))}
            </div>
          </>
        )}

        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultados</p>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="Resultado de ejecución" value={CATALOG_LABEL(RESULTADO_EJECUCION, data.resultadoEjecucion)} />
          <DetailRow label="Resultado de inspección" value={CATALOG_LABEL(RESULTADO_INSPECCION, data.resultadoInspeccion)} />
        </div>

        <Separator />
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector asignado</p>
        <div className="grid grid-cols-2 gap-4">
          <DetailRow label="No. Empleado" value={data.inspectorNumEmpleado} />
          <DetailRow label="Nombre" value={data.inspectorNombre} />
        </div>
        {data.firmaInspector && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Firma del inspector</p>
            <img src={data.firmaInspector} alt="Firma inspector" className="max-h-28 rounded-md border bg-white p-2" />
          </div>
        )}

        {data.inspectoresAdicionales && data.inspectoresAdicionales.length > 0 && (
          <>
            <Separator />
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspectores adicionales</p>
            {data.inspectoresAdicionales.map((insp, i) => (
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
          <DetailRow label="Inicio" value={data.inicio} />
          <DetailRow label="Fin" value={data.fin} />
          <DetailRow label="Tipo de orden correcto" value={data.tipoOrdenCorrecto === 'si' ? 'Sí' : data.tipoOrdenCorrecto === 'no' ? 'No' : undefined} />
        </div>
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-[540px]">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              Orden de inspección
            </SheetTitle>
            {!orden && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 gap-1.5 border-dashed text-muted-foreground hover:text-foreground"
                onClick={cycleMock}
              >
                <Wand2 className="h-3 w-3" />
                Demo {mockIdx + 1}/{MOCK_INSPECCIONES.length}
              </Button>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {record.folio} — {record.propNombreCompleto}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            <span className="font-medium">Domicilio del predio: </span>
            {record.predioResumen}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {/* No real data — show waiting state with demo data below */}
          {!orden && (
            <>
              <div className="mb-5 flex items-center gap-3 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-400">
                <WifiOff className="h-4 w-4 shrink-0" />
                <span>Pendiente de recibir datos del sistema externo. Se muestra un ejemplo de referencia.</span>
              </div>
              <InspeccionView data={demoOrden} />
            </>
          )}

          {/* Real data received */}
          {orden && <InspeccionView data={orden} />}
        </div>

        {/* Footer actions — view mode after inspection is completed */}
        {orden?.estado === 'completada' && record && (
          <div className="border-t px-6 py-4 space-y-3">
            {(record.estado === 'en_cotizacion' || record.estado === 'inspeccion_completada') && (
              <>
                <p className="text-xs text-muted-foreground">La inspección fue completada. Puedes avanzar a cuantificación o cancelar la solicitud.</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-50 hover:text-slate-700"
                    onClick={() => onRechazar(record.id)}
                  >
                    <Ban className="mr-1.5 h-4 w-4" />
                    Cancelar solicitud
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
            {record.estado === 'cancelada' && (
              <div className="flex items-center gap-2 text-slate-600">
                <Ban className="h-4 w-4" />
                <span className="text-sm font-medium">Solicitud cancelada</span>
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
  onVerInspeccion,
}: {
  record: SolicitudRecord | null;
  open: boolean;
  onClose: () => void;
  onAceptar: (id: string, contratoId?: string) => void;
  onRechazar: (id: string) => void;
  onVerInspeccion: (record: SolicitudRecord) => void;
}) {
  const [aceptando, setAceptando] = useState(false);

  if (!record) return null;

  // Use real inspection data if available, otherwise use first mock preset for cotización
  const ordenData = record.ordenInspeccion ?? MOCK_INSPECCIONES[0];
  const conceptos = calcularCotizacion(ordenData);
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Cotización — {record.folio}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {record.propNombreCompleto} · {record.predioResumen}
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 text-xs"
              onClick={() => { onClose(); onVerInspeccion(record); }}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Orden de inspección
            </Button>
          </div>
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
            Cancelar solicitud
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

const ESTADO_FILTER_OPTIONS = [
  { value: 'todas', label: 'Todas las activas' },
  { value: 'inspeccion_pendiente', label: 'Pendiente de inspección' },
  { value: 'en_cotizacion', label: 'En cotización' },
  { value: 'aceptada', label: 'Alta de contrato' },
] as const;

export default function Solicitudes() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todas');
  const [tab, setTab] = useState<'activas' | 'canceladas'>('activas');
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

  const { data: tiposData } = useQuery({
    queryKey: ['tipos-contratacion', 'all'],
    queryFn: () => fetchTiposContratacion({ limit: 500 }),
    staleTime: 10 * 60 * 1000,
  });
  // Map tipoContratacionId → requiereInspeccion (default true when unknown)
  const tipoInspeccionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const t of tiposData?.data ?? []) {
      map.set(t.id, t.requiereInspeccion ?? true);
    }
    return map;
  }, [tiposData]);

  // ── Mutations ─────────────────────────────────────────────────────────
  const cancelarMutation = useMutation({
    mutationFn: (id: string) => apiCancelarSolicitud(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });

  const retormarMutation = useMutation({
    mutationFn: (id: string) => apiRetormarSolicitud(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['solicitudes'] }),
  });

  // Active = not cancelled/rejected
  const activeRecords = useMemo(
    () => records.filter((r) => r.estado !== 'cancelada' && r.estado !== 'rechazada'),
    [records],
  );
  const cancelledRecords = useMemo(
    () => records.filter((r) => r.estado === 'cancelada' || r.estado === 'rechazada'),
    [records],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = tab === 'canceladas' ? cancelledRecords : activeRecords;
    let result = base;
    if (estadoFiltro !== 'todas' && tab === 'activas') {
      result = result.filter((r) => {
        if (estadoFiltro === 'inspeccion_pendiente') return ['borrador', 'inspeccion_pendiente', 'inspeccion_en_proceso'].includes(r.estado);
        if (estadoFiltro === 'en_cotizacion') return ['inspeccion_completada', 'en_cotizacion', 'cotizado'].includes(r.estado);
        if (estadoFiltro === 'aceptada') return r.estado === 'aceptada' || r.estado === 'contratado';
        return r.estado === estadoFiltro;
      });
    }
    if (!q) return result;
    return result.filter(
      (r) =>
        r.folio.toLowerCase().includes(q) ||
        r.propNombreCompleto.toLowerCase().includes(q) ||
        r.predioResumen.toLowerCase().includes(q),
    );
  }, [records, search, estadoFiltro, tab, activeRecords, cancelledRecords]);

  // KPI counts
  const total = activeRecords.length;
  const pendientesInsp = activeRecords.filter((r) =>
    ['borrador', 'inspeccion_pendiente', 'inspeccion_en_proceso'].includes(r.estado),
  ).length;
  const enCotizacion = activeRecords.filter((r) =>
    ['inspeccion_completada', 'en_cotizacion', 'cotizado'].includes(r.estado),
  ).length;
  const aceptadas = activeRecords.filter((r) => r.estado === 'aceptada' || r.estado === 'contratado').length;
  const canceladas = cancelledRecords.length;

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
    navigate(
      contratoId ? `/app/contratos?iniciarAlta=1&contratoId=${encodeURIComponent(contratoId)}` : '/app/contratos',
    );
  }

  // Cancel solicitud (client doesn't continue, but can come back)
  function handleRechazar(id: string) {
    cancelarMutation.mutate(id);
    setInspRecord(null);
    setCotizandoRecord(null);
    toast.info('Solicitud cancelada — el cliente puede retomar el trámite en cualquier momento');
  }

  function handleRetomar(id: string) {
    retormarMutation.mutate(id);
    toast.success('Solicitud reactivada');
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
          { label: 'Solicitudes activas', value: total, className: '' },
          { label: 'Pendientes de inspección', value: pendientesInsp, className: 'text-amber-600' },
          { label: 'En cotización', value: enCotizacion, className: 'text-blue-600' },
          { label: 'Alta de contrato', value: aceptadas, className: 'text-emerald-600' },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-4">
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className={cn('text-3xl font-bold tabular-nums', kpi.className)}>{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        <button
          type="button"
          onClick={() => { setTab('activas'); setEstadoFiltro('todas'); setSearch(''); }}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            tab === 'activas' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <ClipboardList className="h-4 w-4" />
          Activas
          {total > 0 && (
            <span className={cn('ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums', tab === 'activas' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
              {total}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => { setTab('canceladas'); setSearch(''); }}
          className={cn(
            'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            tab === 'canceladas' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <Ban className="h-4 w-4" />
          Canceladas
          {canceladas > 0 && (
            <span className={cn('ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold tabular-nums', tab === 'canceladas' ? 'bg-slate-200 text-slate-700' : 'bg-muted text-muted-foreground')}>
              {canceladas}
            </span>
          )}
        </button>
      </div>

      {/* ── Toolbar ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por folio, propietario o domicilio…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {tab === 'activas' && (
          <div className="flex items-center gap-1.5">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="flex rounded-md border overflow-hidden">
              {ESTADO_FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setEstadoFiltro(opt.value)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium transition-colors border-r last:border-r-0',
                    estadoFiltro === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ClipboardList className="h-7 w-7" />
          </div>
          <div>
            <p className="font-medium">
              {tab === 'canceladas'
                ? 'No hay solicitudes canceladas'
                : records.length === 0
                  ? 'No hay solicitudes registradas'
                  : 'Sin resultados para este filtro'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {tab === 'canceladas'
                ? 'Las solicitudes canceladas por el cliente aparecerán aquí y pueden ser retomadas.'
                : records.length === 0
                  ? 'Cuando llegue un cliente a ventanilla, usa el botón "Nueva solicitud" para empezar.'
                  : 'Ajusta la búsqueda o el filtro para encontrar solicitudes.'}
            </p>
          </div>
          {records.length === 0 && tab === 'activas' && (
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
                      {tab === 'canceladas' ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1.5 border-emerald-500 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => handleRetomar(r.id)}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Retomar trámite
                        </Button>
                      ) : (
                        <>
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
                          ) : (r.estado === 'en_cotizacion' || r.estado === 'inspeccion_completada' || r.estado === 'cotizado'
                              || (tipoInspeccionMap.get(r.tipoContratacionId) === false)) ? (
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
                        </>
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
        onAceptar={handleContinuarCuantificacion}
        onRechazar={handleRechazar}
      />

      <CotizacionModal
        record={cotizandoRecord}
        open={!!cotizandoRecord}
        onClose={() => setCotizandoRecord(null)}
        onAceptar={(id, contratoId) => handleConfirmarCotizacion(id, contratoId)}
        onRechazar={handleRechazar}
        onVerInspeccion={(r) => { setCotizandoRecord(null); setInspRecord(r); }}
      />
    </div>
  );
}
