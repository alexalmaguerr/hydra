import { apiRequest } from './client';

export interface ConvenioDto {
  id: string;
  contratoId: string;
  tipo: string;
  numParcialidades: number;
  montoParcialidad: number;
  montoTotal: number;
  montoPagado: number;
  parcialidadesRestantes: number;
  saldoAFavor: number;
  estado: string;
  fechaInicio: string;
  fechaVencimiento?: string;
  facturas: { timbradoId: string; monto: number }[];
  contrato?: { nombre: string; estado: string };
  pagos?: { id: string; monto: number; fecha: string; tipo: string; concepto: string }[];
  createdAt?: string;
}

export async function getConvenios(params?: {
  contratoId?: string;
  estado?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.contratoId) q.set('contratoId', params.contratoId);
  if (params?.estado) q.set('estado', params.estado);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return apiRequest<{ data: ConvenioDto[]; total: number; page: number; limit: number }>(
    `/convenios?${q}`,
  );
}

export async function getConvenio(id: string) {
  return apiRequest<ConvenioDto>(`/convenios/${id}`);
}

export async function createConvenio(data: {
  contratoId: string;
  tipo?: string;
  numParcialidades: number;
  facturas: { timbradoId: string; monto: number }[];
  fechaVencimiento?: string;
}) {
  return apiRequest<ConvenioDto>('/convenios', { method: 'POST', body: JSON.stringify(data) });
}

export async function aplicarParcialidad(convenioId: string, monto: number, tipo: string) {
  return apiRequest<{
    pagoId: string;
    estado: string;
    saldoAFavor: number;
    parcialidadesRestantes: number;
  }>(`/convenios/${convenioId}/parcialidades/aplicar`, {
    method: 'POST',
    body: JSON.stringify({ monto, tipo }),
  });
}

export async function cancelarConvenio(id: string) {
  return apiRequest<ConvenioDto>(`/convenios/${id}/cancelar`, { method: 'POST' });
}
