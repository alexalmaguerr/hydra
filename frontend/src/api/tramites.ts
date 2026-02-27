import { apiRequest } from './client';

export interface CatalogoTramiteDto {
  id: string;
  tipo: string;
  descripcion: string | null;
  documentosRequeridos: string[];
  tipoFirma: string;
  activo: boolean;
}

export interface TramiteDto {
  id: string;
  contratoId: string;
  tipo: string;
  estado: string;
  canal?: string | null;
  notificadoPor?: string | null;
  descripcion?: string | null;
  createdAt: string;
  updatedAt: string;
  seguimientos?: TramiteSeguimientoDto[];
}

export interface TramiteSeguimientoDto {
  id: string;
  tramiteId: string;
  fecha: string;
  nota: string;
  usuario: string;
  tipo: string;
}

export const getCatalogoTramites = (tipo?: string) => {
  const q = tipo ? `?tipo=${encodeURIComponent(tipo)}` : '';
  return apiRequest<CatalogoTramiteDto[]>(`/tramites/catalogo${q}`);
};

export const getTramiteSeguimientos = (tramiteId: string) =>
  apiRequest<TramiteSeguimientoDto[]>(`/tramites/${tramiteId}/seguimientos`);

export const addTramiteSeguimiento = (
  tramiteId: string,
  data: { nota: string; usuario: string; tipo?: string },
) =>
  apiRequest<TramiteSeguimientoDto>(`/tramites/${tramiteId}/seguimientos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
