import { apiRequest } from './client';

export interface PortalContrato {
  id: string;
  nombre: string;
  tipoContrato: string;
  tipoServicio: string;
  estado: string;
  direccion: string;
  fecha: string;
}

export interface PortalConsumo {
  id: string;
  contratoId: string;
  periodo: string;
  m3: number;
  tipo: string;
  confirmado: boolean;
}

export interface PortalRecibo {
  id: string;
  contratoId: string;
  timbradoId: string;
  saldoVigente: number;
  saldoVencido: number;
  fechaVencimiento: string;
  parcialidades: number;
  impreso: boolean;
}

export interface PortalTimbrado {
  id: string;
  contratoId: string;
  uuid: string;
  estado: string;
  periodo: string;
  subtotal: number;
  iva: number;
  total: number;
  fechaEmision: string;
  fechaVencimiento: string;
  recibos: PortalRecibo[];
}

export interface PortalPago {
  id: string;
  contratoId: string;
  monto: number;
  fecha: string;
  tipo: string;
  concepto: string;
  origen: string;
}

export interface PortalSaldos {
  vencido: number;
  vigente: number;
  total: number;
  intereses: number;
}

export const getPortalContratos = () =>
  apiRequest<PortalContrato[]>('/portal/contratos');

export const getPortalConsumos = (contratoId: string) =>
  apiRequest<PortalConsumo[]>(`/portal/consumos?contratoId=${contratoId}`);

export const getPortalTimbrados = (contratoId: string) =>
  apiRequest<PortalTimbrado[]>(`/portal/timbrados?contratoId=${contratoId}`);

export const getPortalRecibos = (contratoId: string) =>
  apiRequest<PortalRecibo[]>(`/portal/recibos?contratoId=${contratoId}`);

export const getPortalPagos = (contratoId: string) =>
  apiRequest<PortalPago[]>(`/portal/pagos?contratoId=${contratoId}`);

export const getPortalSaldos = (contratoId: string) =>
  apiRequest<PortalSaldos>(`/portal/saldos?contratoId=${contratoId}`);
