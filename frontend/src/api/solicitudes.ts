import { apiRequest } from './client';
import type { SolicitudState, OrdenInspeccionData } from '@/types/solicitudes';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface SolicitudInspeccionDto {
  id: string;
  solicitudId: string;
  estado: string;
  fechaInspeccion: string | null;
  numeroOficial: string | null;
  tipoUso: string | null;
  giro: string | null;
  areaTerreno: string | null;
  condicionToma: string | null;
  condicionesPredio: string | null;
  infraHidraulicaExterna: string | null;
  infraSanitaria: string | null;
  materialCalle: string | null;
  materialBanqueta: string | null;
  metrosRupturaAguaBanqueta: string | null;
  metrosRupturaAguaCalle: string | null;
  metrosRupturaDrenajeBanqueta: string | null;
  metrosRupturaDrenajeCalle: string | null;
  observaciones: string | null;
  evidencias: string[] | null;
  resultadoEjecucion: string | null;
  resultadoInspeccion: string | null;
  inspectorNumEmpleado: string | null;
  inspectorNombre: string | null;
  firmaInspector: string | null;
  inspectoresAdicionales: Array<{ noEmpleado: string; nombre: string; firma?: string }> | null;
  inicio: string | null;
  fin: string | null;
  tipoOrdenCorrecto: string | null;
  // Legacy
  inspector: string | null;
  diametroToma: string | null;
  medidorExistente: string | null;
  numMedidorExistente: string | null;
  metrosRupturaCalle: string | null;
  metrosRupturaBanqueta: string | null;
  existeRed: string | null;
  distanciaRed: string | null;
  presionRed: string | null;
  tipoMaterialRed: string | null;
  profundidadRed: string | null;
  tomaExistente: string | null;
  diametroTomaExistente: string | null;
  estadoTomaExistente: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SolicitudDto {
  id: string;
  folio: string;
  fechaSolicitud: string;
  propTipoPersona: string;
  propNombreCompleto: string;
  propRfc: string | null;
  propCorreo: string | null;
  propTelefono: string | null;
  predioResumen: string;
  claveCatastral: string | null;
  adminId: string | null;
  tipoContratacionId: string | null;
  estado: string;
  formData: SolicitudState;
  inspeccion: SolicitudInspeccionDto | null;
  contratoId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedSolicitudes {
  data: SolicitudDto[];
  total: number;
  page: number;
  limit: number;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const fetchSolicitudes = (params?: {
  estado?: string;
  contratoId?: string;
  page?: number;
  limit?: number;
}) => {
  const sp = new URLSearchParams();
  if (params?.estado) sp.set('estado', params.estado);
  if (params?.contratoId?.trim()) sp.set('contratoId', params.contratoId.trim());
  if (params?.page) sp.set('page', String(params.page));
  if (params?.limit) sp.set('limit', String(params.limit));
  const q = sp.toString();
  return apiRequest<PaginatedSolicitudes>(`/solicitudes${q ? `?${q}` : ''}`);
};

export const fetchSolicitud = (id: string) => apiRequest<SolicitudDto>(`/solicitudes/${id}`);

export const createSolicitud = (dto: {
  propTipoPersona: string;
  propNombreCompleto: string;
  propRfc?: string;
  propCorreo?: string;
  propTelefono?: string;
  predioResumen: string;
  claveCatastral?: string;
  adminId?: string;
  tipoContratacionId?: string;
  formData: SolicitudState;
}) =>
  apiRequest<SolicitudDto>('/solicitudes', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

export const updateSolicitud = (
  id: string,
  dto: {
    propNombreCompleto?: string;
    propTipoPersona?: string;
    propRfc?: string;
    propCorreo?: string;
    propTelefono?: string;
    predioResumen?: string;
    claveCatastral?: string;
    adminId?: string;
    tipoContratacionId?: string;
    formData?: SolicitudState;
  },
) =>
  apiRequest<SolicitudDto>(`/solicitudes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });

export const upsertInspeccion = (solicitudId: string, inspeccion: OrdenInspeccionData) =>
  apiRequest<SolicitudDto>(`/solicitudes/${solicitudId}/inspeccion`, {
    method: 'POST',
    body: JSON.stringify(inspeccion),
  });

export const aceptarSolicitud = (id: string) =>
  apiRequest<{ solicitudId: string; contratoId: string }>(`/solicitudes/${id}/aceptar`, {
    method: 'POST',
  });

export const rechazarSolicitud = (id: string) =>
  apiRequest<SolicitudDto>(`/solicitudes/${id}/rechazar`, { method: 'POST' });

export const cancelarSolicitud = (id: string) =>
  apiRequest<SolicitudDto>(`/solicitudes/${id}/cancelar`, { method: 'POST' });

export const retormarSolicitud = (id: string) =>
  apiRequest<SolicitudDto>(`/solicitudes/${id}/retomar`, { method: 'POST' });

export const deleteSolicitud = (id: string) => apiRequest<void>(`/solicitudes/${id}`, { method: 'DELETE' });
