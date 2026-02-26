import { apiRequest } from './client';

export interface SesionCajaDto {
  id: string;
  usuarioId: string;
  apertura: string;
  cierre?: string;
  montoInicial: number;
  totalCobrado: number;
  totalEfectivo: number;
  totalTransf: number;
  totalTarjeta: number;
  totalAnticipo: number;
  estado: string;
  anticipos?: { id: string; contratoId: string; monto: number }[];
}

export async function getCajaActiva(): Promise<SesionCajaDto | null> {
  return apiRequest<SesionCajaDto | null>('/caja/activa').catch(() => null);
}

export async function abrirCaja(montoInicial: number): Promise<SesionCajaDto> {
  return apiRequest<SesionCajaDto>('/caja/abrir', {
    method: 'POST',
    body: JSON.stringify({ montoInicial }),
  });
}

export async function cerrarCaja(sesionId: string): Promise<SesionCajaDto> {
  return apiRequest<SesionCajaDto>('/caja/cerrar', {
    method: 'POST',
    body: JSON.stringify({ sesionId }),
  });
}
