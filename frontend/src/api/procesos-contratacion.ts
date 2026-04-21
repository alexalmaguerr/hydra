import { apiRequest } from './client';

export interface ProcesoContratacion {
  id: string;
  contratoId: string;
  tipoContratacionId: string | null;
  etapaActual: string;
  estado: string;
  creadoPor: string | null;
  createdAt: string;
  updatedAt: string;
  historial?: EtapaHistorial[];
  contrato?: {
    id: string;
    nombre: string;
    rfc: string | null;
    estado: string;
    tipoServicio: string | null;
    direccion: string | null;
    fecha: string | null;
  };
}

/** Respuesta de `GET /procesos-contratacion/:id` (Prisma + includes del servicio). */
export interface ProcesoContratacionDetalle {
  id: string;
  contratoId: string | null;
  tramiteId: string | null;
  etapa: string;
  estado: string;
  datosAdicionales: Record<string, unknown> | null;
  creadoPor: string | null;
  createdAt: string;
  updatedAt: string;
  plantilla?: { id: string; nombre: string; version: string } | null;
  contrato?: {
    id: string;
    nombre: string;
    estado: string;
    tipoServicio: string | null;
    tipoContrato: string;
    puntoServicioId: string | null;
    puntoServicio?: { id: string; codigo: string } | null;
    actividadId: string | null;
    referenciaContratoAnterior: string | null;
    tipoEnvioFactura: string | null;
    superficiePredio?: number | null;
    superficieConstruida?: number | null;
    unidadesServidas?: number | null;
    personasHabitanVivienda?: number | null;
    variablesCapturadas: unknown;
    tipoContratacion?: { id: string; nombre: string; codigo: string } | null;
    personas?: Array<{
      rol: string;
      persona: { id: string; nombre: string; rfc: string | null; tipo: string };
    }>;
  } | null;
}

export interface PlantillaContrato {
  id: string;
  nombre: string;
  version: string;
  activo: boolean;
}

export interface EtapaHistorial {
  id: string;
  procesoId: string;
  etapa: string;
  estado: string;
  nota: string | null;
  fechaInicio: string;
  fechaFin: string | null;
}

/** Backend list shape (paginated). */
interface PaginatedProcesosResponse {
  data: ApiProcesoRow[];
  total: number;
  page: number;
  limit: number;
}

/** Row as returned by Prisma from GET /procesos-contratacion */
interface ApiProcesoRow {
  id: string;
  contratoId: string | null;
  etapa: string;
  estado: string;
  creadoPor: string | null;
  createdAt: string;
  updatedAt: string;
  hitos?: ApiHitoRow[];
  contrato?: {
    id: string;
    nombre: string;
    rfc: string | null;
    estado: string;
    tipoServicio: string | null;
    direccion: string | null;
    fecha: string | null;
  };
}

interface ApiHitoRow {
  id: string;
  procesoId: string;
  etapa: string;
  estado: string;
  nota: string | null;
  fechaCumpl: string | null;
  createdAt: string;
}

function hitoFecha(h: ApiHitoRow): string {
  return (h.fechaCumpl ?? h.createdAt) as string;
}

/** Maps API / Prisma proceso + hitos to the UI contract used by Contratos.tsx */
function normalizeProcesoFromApi(p: ApiProcesoRow): ProcesoContratacion {
  const estadoUi =
    p.estado === 'en_progreso' ? 'en_curso' : p.estado;
  return {
    id: p.id,
    contratoId: p.contratoId ?? '',
    tipoContratacionId: null,
    etapaActual: p.etapa,
    estado: estadoUi,
    creadoPor: p.creadoPor,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    contrato: p.contrato,
    historial: (p.hitos ?? []).map((h) => ({
      id: h.id,
      procesoId: h.procesoId,
      etapa: h.etapa,
      estado:
        h.estado === 'completado'
          ? 'completada'
          : h.estado === 'pendiente'
            ? 'en_curso'
            : h.estado,
      nota: h.nota,
      fechaInicio: hitoFecha(h),
      fechaFin: h.estado === 'completado' ? hitoFecha(h) : null,
    })),
  };
}

export async function fetchProcesos(opts?: { contratoId?: string; etapa?: string; limit?: number }): Promise<ProcesoContratacion[]> {
  const params = new URLSearchParams();
  if (opts?.contratoId) params.set('contratoId', opts.contratoId);
  if (opts?.etapa) params.set('etapa', opts.etapa);
  params.set('limit', String(opts?.limit ?? 100));
  const path = `/procesos-contratacion?${params.toString()}`;
  const raw = await apiRequest<ProcesoContratacion[] | PaginatedProcesosResponse | unknown>(path);

  if (Array.isArray(raw)) {
    return raw.map((row) => normalizeProcesoFromApi(row as ApiProcesoRow));
  }
  if (
    raw &&
    typeof raw === 'object' &&
    Array.isArray((raw as PaginatedProcesosResponse).data)
  ) {
    return (raw as PaginatedProcesosResponse).data.map(normalizeProcesoFromApi);
  }
  return [];
}

export const fetchProceso = (id: string) =>
  apiRequest<ProcesoContratacionDetalle>(`/procesos-contratacion/${id}`);

export const crearProceso = (dto: {
  contratoId: string;
  tipoContratacionId?: string;
  plantillaId?: string;
  creadoPor?: string;
}) => apiRequest<ProcesoContratacion>('/procesos-contratacion', { method: 'POST', body: JSON.stringify(dto) });

export const fetchPlantillasContrato = (soloActivas = true) =>
  apiRequest<PlantillaContrato[]>(
    `/procesos-contratacion/plantillas/lista?soloActivas=${soloActivas ? 'true' : 'false'}`,
  );

export const avanzarEtapa = (id: string, nota?: string) =>
  apiRequest<ProcesoContratacion>(`/procesos-contratacion/${id}/avanzar`, {
    method: 'POST',
    body: JSON.stringify({ nota }),
  });

export const cancelarProceso = (id: string, motivo: string) =>
  apiRequest<ProcesoContratacion>(`/procesos-contratacion/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
