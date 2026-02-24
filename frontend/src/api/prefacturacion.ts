import { apiRequest, hasApi } from './client';

export interface PreFacturaDto {
  id: string;
  contratoId: string;
  periodo: string;
  consumoM3: number;
  subtotal: number;
  descuento: number;
  total: number;
  estado: string;
}

export async function fetchPreFacturas(): Promise<PreFacturaDto[]> {
  return apiRequest<PreFacturaDto[]>('/api/prefacturas');
}

export { hasApi };
