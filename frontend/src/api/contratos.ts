import { apiRequest, hasApi } from './client';

export interface ContratoDto {
  id: string;
  tomaId?: string | null;
  tipoContrato: string;
  tipoServicio: string;
  nombre: string;
  rfc: string;
  direccion: string;
  contacto: string;
  estado: string;
  fecha: string;
  medidorId?: string | null;
  rutaId?: string | null;
  zonaId?: string | null;
  domiciliado: boolean;
  fechaReconexionPrevista?: string | null;
  ceaNumContrato?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContratoDto {
  tomaId?: string;
  tipoContrato: string;
  tipoServicio: string;
  nombre: string;
  rfc: string;
  direccion: string;
  contacto: string;
  estado: string;
  fecha: string;
  medidorId?: string;
  rutaId?: string;
  zonaId?: string;
  domiciliado?: boolean;
  fechaReconexionPrevista?: string;
  ceaNumContrato?: string;
}

export interface UpdateContratoDto {
  ceaNumContrato?: string | null;
  estado?: string;
  domiciliado?: boolean;
  fechaReconexionPrevista?: string | null;
}

export async function fetchContratos(): Promise<ContratoDto[]> {
  return apiRequest<ContratoDto[]>('/contratos');
}

export async function fetchContrato(id: string): Promise<ContratoDto> {
  return apiRequest<ContratoDto>(`/contratos/${id}`);
}

export async function createContrato(dto: CreateContratoDto): Promise<ContratoDto> {
  return apiRequest<ContratoDto>('/contratos', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateContrato(id: string, dto: UpdateContratoDto): Promise<ContratoDto> {
  return apiRequest<ContratoDto>(`/contratos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export { hasApi };
