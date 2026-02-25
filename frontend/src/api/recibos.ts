import { apiRequest, hasApi } from './client';

export interface ReciboDto {
  id: string;
  timbradoId: string;
  contratoId: string;
  saldoVigente: number;
  saldoVencido: number;
  parcialidades: number;
  fechaVencimiento: string;
  impreso: boolean;
  mensajeIndividual?: string;
}

export interface TimbradoDto {
  id: string;
  preFacturaId: string;
  contratoId: string;
  uuid: string;
  estado: string;
  error?: string;
  fecha: string;
}

export async function fetchRecibos(): Promise<ReciboDto[]> {
  return apiRequest<ReciboDto[]>('/recibos');
}

export async function fetchTimbrados(): Promise<TimbradoDto[]> {
  return apiRequest<TimbradoDto[]>('/timbrados');
}

export { hasApi };
