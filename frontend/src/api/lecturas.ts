import { apiRequest, hasApi } from './client';

export interface LecturaDto {
  id: string;
  contratoId: string;
  rutaId: string;
  lecturaAnterior: number;
  lecturaActual: number;
  consumo: number;
  estado: string;
  incidencia: string;
  fecha: string;
  periodo: string;
  lecturaMinZona?: number;
  lecturaMaxZona?: number;
  simuladoMensual?: number;
  motivoInvalidacion?: string;
}

export async function fetchLecturas(): Promise<LecturaDto[]> {
  const res = await apiRequest<LecturaDto[] | { data: LecturaDto[] }>('/lecturas?limit=200');
  return Array.isArray(res) ? res : ((res as { data: LecturaDto[] }).data ?? []);
}

export { hasApi };
