import { apiRequest } from './client';

export interface PuntoServicioListItem {
  id: string;
  codigo: string;
  estado: string;
  // Catálogos hardcoded (IDs numéricos)
  administracion?: string | null;
  tipoPuntoServicio?: string | null;
  sectorHidraulicoId?: string | null;
  calibreId?: string | null;
  distritoId?: string | null;
  zonaFacturacion?: string | null;
  codigoRecorrido?: string | null;
  libreta?: string | null;
  claveCatastral?: string | null;
  folioExpediente?: string | null;
  estadoSuministro?: string | null;
  fechaInstalacion?: string | null;
  fechaCorte?: string | null;
  coordenadaLat?: number | null;
  coordenadaLon?: number | null;
  cortePosible?: boolean;
  noAccesible?: boolean;
  deshabitado?: boolean;
  posibilidadFraude?: boolean;
  // Relaciones de BD
  tipoSuministro?: { id: string; codigo: string; descripcion: string } | null;
  estructuraTecnica?: { id: string; codigo: string; descripcion: string } | null;
  tipoCorte?: { id: string; codigo: string; descripcion: string } | null;
  domicilio?: {
    id: string;
    calle: string | null;
    numExterior: string | null;
    codigoPostal: string | null;
  } | null;
  tipoRelacionPadre?: {
    id: string;
    codigo: string;
    descripcion: string;
    metodo: string;
    reparteConsumo: boolean;
  } | null;
  puntoServicioPadre?: { id: string; codigo: string } | null;
  _count?: { contratos: number; puntosServicioHijos?: number };
}

export interface PuntosServicioListResponse {
  data: PuntoServicioListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function fetchPuntosServicio(params?: { page?: number; limit?: number; estado?: string }) {
  const q = new URLSearchParams();
  q.set('page', String(params?.page ?? 1));
  q.set('limit', String(params?.limit ?? 100));
  if (params?.estado) q.set('estado', params.estado);
  return apiRequest<PuntosServicioListResponse>(`/puntos-servicio?${q.toString()}`);
}

export interface CreatePuntoServicioDto {
  codigo: string;
  domicilioId?: string;
  administracion?: string;
  tipoPuntoServicio?: string;
  estructuraTecnicaId?: string;
  sectorHidraulicoId?: string;
  calibreId?: string;
  tipoSuministro?: string;
  tipoSuministroId?: string;
  zonaFacturacionId?: string;
  distritoId?: string;
  codigoRecorridoId?: string;
  tipoCorteId?: string;
  estadoSuministro?: string;
  fechaInstalacion?: string;
  fechaCorte?: string;
  coordenadaLat?: number;
  coordenadaLon?: number;
  libreta?: string;
  claveCatastral?: string;
  folioExpediente?: string;
  cortePosible?: boolean;
  noAccesible?: boolean;
  deshabitado?: boolean;
  posibilidadFraude?: boolean;
  estado?: string;
}

export function createPuntoServicio(dto: CreatePuntoServicioDto) {
  return apiRequest<PuntoServicioListItem>('/puntos-servicio', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}
