import { apiRequest } from './client';

export interface PortalContrato {
  id: string;
  nombre: string;
  rfc: string;
  tipoContrato: string;
  tipoServicio: string;
  estado: string;
  direccion: string;
  fecha: string;
  ceaNumContrato?: string | null;
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

export interface PortalEstadoOperativo {
  contratoId: string;
  estado: string;
  bloqueadoJuridico: boolean;
  tieneAdeudo: boolean;
  montoAdeudo: number;
  fechaReconexionPrevista?: string | null;
}

export interface PortalOrden {
  id: string;
  tipo: string;
  estado: string;
  prioridad: string;
  fechaSolicitud: string;
  fechaProgramada?: string | null;
  fechaEjecucion?: string | null;
  notas?: string | null;
  seguimientos: Array<{ id: string; fecha: string; nota?: string | null; estadoNuevo?: string | null }>;
}

export interface PortalDatosFiscales {
  id: string;
  nombre: string;
  rfc: string;
  razonSocial?: string | null;
  regimenFiscal?: string | null;
  constanciaFiscalUrl?: string | null;
}

export interface PortalContacto {
  id: string;
  personaId: string;
  contratoId: string;
  rol: string;
  activo: boolean;
  fechaDesde: string;
  persona: { id: string; nombre: string; rfc?: string | null; email?: string | null; telefono?: string | null; tipo: string };
}

export interface PortalTimbradoDescarga {
  timbradoId: string;
  uuid: string;
  periodo: string;
  total: number;
  fechaEmision: string;
  _stub: boolean;
  message: string;
  xmlUrl?: string | null;
}

export const getPortalEstadoOperativo = (contratoId: string) =>
  apiRequest<PortalEstadoOperativo>(`/portal/estado-operativo?contratoId=${contratoId}`);

export const getPortalOrdenes = (contratoId: string) =>
  apiRequest<PortalOrden[]>(`/portal/ordenes?contratoId=${contratoId}`);

export const getPortalDatosFiscales = (contratoId: string) =>
  apiRequest<PortalDatosFiscales>(`/portal/datos-fiscales?contratoId=${contratoId}`);

export const updatePortalDatosFiscales = (
  contratoId: string,
  data: { rfc?: string; razonSocial?: string; regimenFiscal?: string },
) =>
  apiRequest<PortalDatosFiscales>(`/portal/datos-fiscales?contratoId=${contratoId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const getPortalContactos = (contratoId: string) =>
  apiRequest<PortalContacto[]>(`/portal/contactos?contratoId=${contratoId}`);

export const addPortalContacto = (
  contratoId: string,
  data: { nombre?: string; rfc?: string; email?: string; telefono?: string; rol: string },
) =>
  apiRequest<PortalContacto>(`/portal/contactos?contratoId=${contratoId}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getTimbradoDescarga = (timbradoId: string) =>
  apiRequest<PortalTimbradoDescarga>(`/portal/timbrados/${timbradoId}/descargar`);
