import { apiRequest } from './client';

export interface ContratoSearch {
  id: string;
  nombre: string;
  rfc: string;
  estado: string;
  tipoServicio: string;
  direccion: string;
}

export interface ContextoAtencion {
  contrato: {
    id: string;
    nombre: string;
    rfc: string;
    tipoServicio: string;
    estado: string;
    contacto: string;
    direccion: string;
  };
  saldo: number;
  ultimosPagos: { id: string; monto: string; fecha: string; tipo: string; concepto: string }[];
  ultimasFacturas: { id: string; uuid: string; total: string; estado: string; fechaEmision: string }[];
  quejasAbiertas: { id: string; tipo: string; descripcion: string; estado: string; prioridad: string; createdAt: string; canal: string }[];
  resumen: { totalPagado: number; totalFacturado: number; quejasAbiertas: number };
}

export interface QuejaApi {
  id: string;
  contratoId: string;
  tipo: string;
  descripcion: string;
  estado: string;
  prioridad?: string;
  canal?: string;
  areaAsignada?: string;
  atendidoPor?: string;
  enlaceExterno?: string;
  categoria?: string;
  createdAt: string;
}

export function buscarContratos(q: string, limit = 10): Promise<ContratoSearch[]> {
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiRequest<ContratoSearch[]>(`/contratos/search?${params}`);
}

export function getContextoAtencion(contratoId: string): Promise<ContextoAtencion> {
  return apiRequest<ContextoAtencion>(`/contratos/${contratoId}/contexto-atencion`);
}

export function getQuejasByContrato(contratoId: string): Promise<QuejaApi[]> {
  return apiRequest<unknown>(`/quejas/contrato/${contratoId}`).then((res) => {
    if (Array.isArray(res)) return res as QuejaApi[];
    if (res && Array.isArray((res as any).data)) return (res as any).data as QuejaApi[];
    return [];
  });
}

export function createQueja(data: {
  contratoId: string;
  tipo: string;
  descripcion: string;
  prioridad?: string;
  canal?: string;
  areaAsignada?: string;
  atendidoPor?: string;
  enlaceExterno?: string;
  categoria?: string;
}): Promise<QuejaApi> {
  return apiRequest<QuejaApi>('/quejas', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateQueja(
  id: string,
  data: Partial<{
    estado: string;
    areaAsignada: string;
    motivoCierre: string;
    enlaceExterno: string;
    prioridad: string;
    atendidoPor: string;
  }>,
): Promise<QuejaApi> {
  return apiRequest<QuejaApi>(`/quejas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function getSeguimientosQueja(quejaId: string): Promise<unknown[]> {
  return apiRequest<unknown[]>(`/quejas/${quejaId}/seguimientos`);
}

export function addSeguimientoQueja(
  quejaId: string,
  data: { nota: string; usuario?: string; tipo?: string },
): Promise<unknown> {
  return apiRequest<unknown>(`/quejas/${quejaId}/seguimientos`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
