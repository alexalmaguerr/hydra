import { apiRequest, hasApi } from './client';

export interface ConsumoDto {
  id: string;
  contratoId: string;
  lecturaId: string;
  tipo: string;
  m3: number;
  periodo: string;
  confirmado: boolean;
}

export async function fetchConsumos(): Promise<ConsumoDto[]> {
  return apiRequest<ConsumoDto[]>('/consumos');
}

export { hasApi };
