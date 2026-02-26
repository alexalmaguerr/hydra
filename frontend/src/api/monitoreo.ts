import { apiRequest } from './client';

export interface LogProcesoDto {
  id: string;
  tipo: string;
  subTipo?: string;
  estado: string;
  inicio: string;
  fin?: string;
  duracionMs?: number;
  registros: number;
  errores: number;
  advertencias: number;
  detalle?: object;
  errorMsg?: string;
  usuarioId?: string;
}

export interface DashboardProcesoDto {
  tipo: string;
  total: number;
  errores: number;
  ultimo: {
    id: string;
    estado: string;
    inicio: string;
    fin?: string;
    registros: number;
    errores: number;
    duracionMs?: number;
    errorMsg?: string;
  } | null;
  saludable: boolean;
}

export interface DashboardDto {
  generadoEn: string;
  procesos: DashboardProcesoDto[];
}

export interface ConciliacionDto {
  id: string;
  tipo: string;
  periodo: string;
  ejecutadoEn: string;
  totalSistemaA: number;
  totalSistemaB: number;
  coincidencias: number;
  diferencias: number;
  montoSistemaA?: number;
  montoSistemaB?: number;
  montoDiferencia?: number;
  detalles?: object;
  estado: string;
}

export async function getDashboard() {
  return apiRequest<DashboardDto>('/monitoreo/dashboard');
}

export async function getLogs(params?: {
  tipo?: string;
  estado?: string;
  desde?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.tipo) q.set('tipo', params.tipo);
  if (params?.estado) q.set('estado', params.estado);
  if (params?.desde) q.set('desde', params.desde);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return apiRequest<{ data: LogProcesoDto[]; total: number; page: number; limit: number }>(
    `/monitoreo/procesos?${q}`,
  );
}

export async function getConciliaciones(params?: {
  tipo?: string;
  periodo?: string;
  page?: number;
  limit?: number;
}) {
  const q = new URLSearchParams();
  if (params?.tipo) q.set('tipo', params.tipo);
  if (params?.periodo) q.set('periodo', params.periodo);
  if (params?.page) q.set('page', String(params.page));
  if (params?.limit) q.set('limit', String(params.limit));
  return apiRequest<{ data: ConciliacionDto[]; total: number }>(`/conciliaciones?${q}`);
}

export async function ejecutarConciliacion(tipo: string, periodo: string) {
  return apiRequest<ConciliacionDto>('/conciliaciones/ejecutar', {
    method: 'POST',
    body: JSON.stringify({ tipo, periodo }),
  });
}

export async function marcarEstadoConciliacion(id: string, estado: string) {
  return apiRequest<ConciliacionDto>(`/conciliaciones/${id}/estado`, {
    method: 'POST',
    body: JSON.stringify({ estado }),
  });
}
