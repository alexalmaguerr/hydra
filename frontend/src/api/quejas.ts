import { apiRequest, hasApi } from './client';

export interface SeguimientoQuejaDto {
  id: string;
  quejaId: string;
  fecha: string;
  nota: string;
  usuario: string;
  tipo: 'nota' | 'cambio_estado' | 'reasignacion' | 'contacto_cliente';
  createdAt: string;
}

export interface QuejaAclaracionDto {
  id: string;
  contratoId: string;
  fecha: string;
  tipo: 'Queja' | 'Aclaración';
  descripcion: string;
  estado: string;
  atendidoPor?: string | null;
  categoria?: string | null;
  prioridad: string;
  canal: string;
  areaAsignada: string;
  enlaceExterno?: string | null;
  motivoCierre?: string | null;
  createdAt: string;
  updatedAt: string;
  seguimientos: SeguimientoQuejaDto[];
}

export interface CreateQuejaDto {
  contratoId: string;
  tipo: 'Queja' | 'Aclaración';
  descripcion: string;
  categoria?: string;
  prioridad?: string;
  canal?: string;
  areaAsignada?: string;
  enlaceExterno?: string;
  atendidoPor?: string;
}

export interface UpdateQuejaDto {
  estado?: string;
  prioridad?: string;
  areaAsignada?: string;
  enlaceExterno?: string;
  motivoCierre?: string;
  atendidoPor?: string;
  categoria?: string;
}

export interface CreateSeguimientoDto {
  nota: string;
  usuario: string;
  tipo: 'nota' | 'cambio_estado' | 'reasignacion' | 'contacto_cliente';
}

export async function fetchQuejasByContrato(contratoId: string): Promise<QuejaAclaracionDto[]> {
  return apiRequest<QuejaAclaracionDto[]>(`/quejas?contratoId=${encodeURIComponent(contratoId)}`);
}

export async function fetchQueja(id: string): Promise<QuejaAclaracionDto> {
  return apiRequest<QuejaAclaracionDto>(`/quejas/${id}`);
}

export async function createQueja(dto: CreateQuejaDto): Promise<QuejaAclaracionDto> {
  return apiRequest<QuejaAclaracionDto>('/quejas', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateQueja(id: string, dto: UpdateQuejaDto): Promise<QuejaAclaracionDto> {
  return apiRequest<QuejaAclaracionDto>(`/quejas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function deleteQueja(id: string): Promise<void> {
  return apiRequest<void>(`/quejas/${id}`, { method: 'DELETE' });
}

export async function addSeguimiento(
  quejaId: string,
  dto: CreateSeguimientoDto,
): Promise<SeguimientoQuejaDto> {
  return apiRequest<SeguimientoQuejaDto>(`/quejas/${quejaId}/seguimientos`, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export { hasApi };
