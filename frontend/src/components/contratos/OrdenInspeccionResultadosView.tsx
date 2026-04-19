import { CheckCircle2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { OrdenInspeccionData } from '@/types/solicitudes';

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

const MATERIAL_LABEL: Record<string, string> = {
  empedrado: 'Empedrado',
  concreto_hidraulico: 'Concreto hidráulico',
  concreto_asfaltico: 'Concreto asfáltico',
  concreto: 'Concreto',
  tierra: 'Tierra',
  adoquin: 'Adoquín',
  otro: 'Otro',
};

const catalogLabel = (list: { id: string; label: string }[], id?: string) =>
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

/** Misma jerarquía de campos que la ficha de solicitud / Survey123 (Inspección para contratar). */
export function OrdenInspeccionResultadosView({ orden }: { orden: OrdenInspeccionData }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <span className="text-sm font-medium">Resultados recibidos</span>
      </div>

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Información general</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="Fecha de inspección" value={orden.fechaInspeccion} />
        <DetailRow label="Número oficial" value={orden.numeroOficial} />
        <DetailRow label="Tipo de uso" value={catalogLabel(TIPO_USO, orden.tipoUso)} />
        <DetailRow label="Giro" value={orden.giro} />
        <DetailRow label="Área terreno (m²)" value={orden.areaTerreno ? `${orden.areaTerreno} m²` : undefined} />
        <DetailRow label="Condición de la toma" value={catalogLabel(CONDICION_TOMA, orden.condicionToma)} />
        <DetailRow label="Condiciones del predio" value={catalogLabel(CONDICIONES_PREDIO, orden.condicionesPredio)} />
      </div>

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Infraestructura</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow
          label="Infra. hidráulica externa"
          value={orden.infraHidraulicaExterna === 'si' ? 'Sí' : orden.infraHidraulicaExterna === 'no' ? 'No' : undefined}
        />
        <DetailRow
          label="Infra. sanitaria"
          value={orden.infraSanitaria === 'si' ? 'Sí' : orden.infraSanitaria === 'no' ? 'No' : undefined}
        />
        <DetailRow label="Material de calle" value={orden.materialCalle ? MATERIAL_LABEL[orden.materialCalle] : undefined} />
        <DetailRow label="Material de banqueta" value={orden.materialBanqueta ? MATERIAL_LABEL[orden.materialBanqueta] : undefined} />
      </div>

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ruptura AGUA</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="Banqueta (ml)" value={orden.metrosRupturaAguaBanqueta} />
        <DetailRow label="Calle (ml)" value={orden.metrosRupturaAguaCalle} />
      </div>

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ruptura DRENAJE</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="Banqueta (ml)" value={orden.metrosRupturaDrenajeBanqueta} />
        <DetailRow label="Calle (ml)" value={orden.metrosRupturaDrenajeCalle} />
      </div>

      {orden.observaciones ? (
        <>
          <Separator />
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Observaciones</p>
            <p className="text-sm leading-relaxed">{orden.observaciones}</p>
          </div>
        </>
      ) : null}

      {orden.evidencias && orden.evidencias.length > 0 ? (
        <>
          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Evidencia fotográfica</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {orden.evidencias.map((src, i) => (
              <img key={i} src={src} alt={`Evidencia ${i + 1}`} className="aspect-video w-full rounded-md border object-cover" />
            ))}
          </div>
        </>
      ) : null}

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultados</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="Resultado de ejecución" value={catalogLabel(RESULTADO_EJECUCION, orden.resultadoEjecucion)} />
        <DetailRow label="Resultado de inspección" value={catalogLabel(RESULTADO_INSPECCION, orden.resultadoInspeccion)} />
      </div>

      <Separator />
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector asignado</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="No. Empleado" value={orden.inspectorNumEmpleado} />
        <DetailRow label="Nombre" value={orden.inspectorNombre} />
      </div>
      {orden.firmaInspector ? (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Firma del inspector</p>
          <img src={orden.firmaInspector} alt="Firma inspector" className="max-h-28 rounded-md border bg-white p-2" />
        </div>
      ) : null}

      {orden.inspectoresAdicionales && orden.inspectoresAdicionales.length > 0 ? (
        <>
          <Separator />
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspectores adicionales</p>
          {orden.inspectoresAdicionales.map((insp, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailRow label="No. Empleado" value={insp.noEmpleado} />
                <DetailRow label="Nombre" value={insp.nombre} />
              </div>
              {insp.firma ? (
                <img src={insp.firma} alt={`Firma inspector ${i + 2}`} className="max-h-28 rounded-md border bg-white p-2" />
              ) : null}
            </div>
          ))}
        </>
      ) : null}

      <Separator />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <DetailRow label="Inicio" value={orden.inicio} />
        <DetailRow label="Fin" value={orden.fin} />
        <DetailRow
          label="Tipo de orden correcto"
          value={orden.tipoOrdenCorrecto === 'si' ? 'Sí' : orden.tipoOrdenCorrecto === 'no' ? 'No' : undefined}
        />
      </div>
    </div>
  );
}
