import { apiRequest } from './client';

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
  contrato?: { nombre: string; estado: string };
  timbrado?: { uuid: string; total: number; estado: string; periodo: string };
  pagos?: { id: string; monto: number; fecha: string; tipo: string }[];
  createdAt?: string;
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

export interface ReciboPreviewDto {
  recibo: {
    id: string;
    contratoId: string;
    timbradoId: string;
    saldoVigente: number;
    saldoVencido: number;
    fechaVencimiento: string;
    impreso: boolean;
    contrato: { id: string; nombre: string; rfc?: string; direccion: string; tipoServicio?: string };
    timbrado: { uuid: string; total: number; subtotal: number; iva: number; periodo: string; estado: string };
    pagos: { id: string; monto: number; fecha: string; tipo: string; concepto: string }[];
  };
  pendiente: number;
  mensajes: MensajeReciboDto[];
}

export interface MensajeReciboDto {
  id: string;
  tipo: string;
  contratoId?: string;
  mensaje: string;
  activo: boolean;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  createdAt: string;
}

export async function getRecibos(params?: {
  contratoId?: string;
  impreso?: boolean;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.contratoId) q.set('contratoId', params.contratoId);
  if (params?.impreso !== undefined) q.set('impreso', String(params.impreso));
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return apiRequest<{ data: ReciboDto[]; total: number; page: number; limit: number }>(
    `/recibos?${q}`,
  );
}

export async function getReciboPreview(reciboId: string) {
  return apiRequest<ReciboPreviewDto>(`/recibos/preview/${reciboId}`);
}

export async function marcarImpreso(id: string) {
  return apiRequest<ReciboDto>(`/recibos/${id}/marcar-impreso`, { method: 'POST' });
}

export async function getMensajesRecibo() {
  return apiRequest<MensajeReciboDto[]>('/mensajes-recibo');
}

export async function createMensajeRecibo(data: {
  tipo: string;
  contratoId?: string;
  mensaje: string;
}) {
  return apiRequest<MensajeReciboDto>('/mensajes-recibo', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function fetchRecibos(): Promise<ReciboDto[]> {
  const res = await apiRequest<ReciboDto[] | { data: ReciboDto[] }>('/recibos?limit=200');
  return Array.isArray(res) ? res : ((res as { data: ReciboDto[] }).data ?? []);
}

export async function fetchTimbrados(): Promise<TimbradoDto[]> {
  return apiRequest<TimbradoDto[]>('/timbrados');
}

export { hasApi } from './client';
