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
  return apiRequest<PagoDto[]>('/pagos');
}

export async function fetchPagosExternos(): Promise<PagoExternoDto[]> {
  return apiRequest<PagoExternoDto[]>('/pagos-externos');
}

export { hasApi };
