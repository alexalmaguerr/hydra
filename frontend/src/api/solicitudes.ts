import { apiRequest } from './client';
import type { SolicitudState, OrdenInspeccionData } from '@/types/solicitudes';

// ── DTOs ──────────────────────────────────────────────────────────────────────

export interface SolicitudInspeccionDto {
  id: string;
  solicitudId: string;
  estado: string;
  inspector: string | null;
  fechaInspeccion: string | null;
  materialCalle: string | null;
  materialBanqueta: string | null;
  metrosRupturaCalle: string | null;
  metrosRupturaBanqueta: string | null;
  existeRed: string | null;
  distanciaRed: string | null;
  presionRed: string | null;
  tipoMaterialRed: string | null;
  profundidadRed: string | null;
  diametroToma: string | null;
  tomaExistente: string | null;
  diametroTomaExistente: string | null;
  estadoTomaExistente: string | null;
  medidorExistente: string | null;
  numMedidorExistente: string | null;
  observaciones: string | null;
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

export const fetchSolicitudes = (params?: { estado?: string; page?: number; limit?: number }) => {
  const sp = new URLSearchParams();
  if (params?.estado) sp.set('estado', params.estado);
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

export const deleteSolicitud = (id: string) => apiRequest<void>(`/solicitudes/${id}`, { method: 'DELETE' });
