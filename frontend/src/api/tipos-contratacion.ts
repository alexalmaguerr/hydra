import { apiRequest } from './client';

export interface TipoContratacion {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  requiereMedidor: boolean;
  activo: boolean;
  // P1/P6
  claseProceso: string | null;
  esContratoFormal: boolean;
  requiereSolicitudPrevia: boolean;
  diasCaducidadSolicitud: number | null;
  organismoAprobacion: string | null;
  diasPlazoAprobacion: number | null;
  periodicidadesPermitidas: string | null;
  tiposClientePermitidos: string | null;
  _count?: { contratos: number };
}

export interface DocumentoRequeridoTipoContratacion {
  id: string;
  nombreDocumento: string;
  obligatorio: boolean;
  descripcion?: string | null;
}

export interface TipoContratacionConfiguracion extends TipoContratacion {
  conceptos: Array<{
    id: string;
    obligatorio: boolean;
    orden: number;
    conceptoCobro: {
      id: string;
      codigo: string;
      nombre: string;
    };
  }>;
  clausulas: Array<{
    id: string;
    obligatorio: boolean;
    orden: number;
    clausula: {
      id: string;
      codigo: string;
      titulo: string;
    };
  }>;
  documentos: DocumentoRequeridoTipoContratacion[];
}

export interface UpdateTipoContratacionDto {
  nombre?: string;
  descripcion?: string;
  requiereMedidor?: boolean;
  activo?: boolean;
  claseProceso?: string | null;
  esContratoFormal?: boolean;
  requiereSolicitudPrevia?: boolean;
  diasCaducidadSolicitud?: number | null;
  organismoAprobacion?: string | null;
  diasPlazoAprobacion?: number | null;
  periodicidadesPermitidas?: string | null;
  tiposClientePermitidos?: string | null;
}

export interface CreateTipoContratacionDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiereMedidor?: boolean;
  claseProceso?: string;
  esContratoFormal?: boolean;
  requiereSolicitudPrevia?: boolean;
  diasCaducidadSolicitud?: number;
  organismoAprobacion?: string;
  diasPlazoAprobacion?: number;
  periodicidadesPermitidas?: string;
  tiposClientePermitidos?: string;
}

export const fetchTiposContratacion = () =>
  apiRequest<{ data: TipoContratacion[]; total: number }>('/tipos-contratacion?limit=100');

export const fetchTipoContratacion = (id: string) =>
  apiRequest<TipoContratacion>(`/tipos-contratacion/${id}`);

export const fetchTipoContratacionConfiguracion = (id: string) =>
  apiRequest<TipoContratacionConfiguracion>(`/tipos-contratacion/${id}/configuracion`);

export const createTipoContratacion = (dto: CreateTipoContratacionDto) =>
  apiRequest<TipoContratacion>('/tipos-contratacion', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

export const updateTipoContratacion = (id: string, dto: UpdateTipoContratacionDto) =>
  apiRequest<TipoContratacion>(`/tipos-contratacion/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
