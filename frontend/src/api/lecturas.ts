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
  return apiRequest<LecturaDto[]>('/api/lecturas');
}

export { hasApi };
