import { apiRequest, hasApi } from './client';

export interface PagoDto {
  id: string;
  contratoId: string;
  monto: number;
  fecha: string;
  tipo: string;
  concepto: string;
  origen?: string;
}

export interface PagoExternoDto {
  id: string;
  referencia: string;
  monto: number;
  fecha: string;
  tipo: string;
  estado: string;
  contratoIdSugerido?: string;
  facturaIdSugerido?: string;
  concepto?: string;
}

export async function fetchPagos(): Promise<PagoDto[]> {
  const res = await apiRequest<PagoDto[] | { data: PagoDto[] }>('/pagos?limit=200');
  return Array.isArray(res) ? res : ((res as { data: PagoDto[] }).data ?? []);
}

export async function fetchPagosExternos(): Promise<PagoExternoDto[]> {
  return apiRequest<PagoExternoDto[]>('/pagos-externos');
}

export { hasApi };
