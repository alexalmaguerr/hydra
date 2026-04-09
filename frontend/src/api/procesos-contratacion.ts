import { apiRequest } from './client';

export interface ProcesoContratacion {
  id: string;
  contratoId: string;
  tipoContratacionId: string | null;
  etapaActual: string;
  estado: string;
  creadoPor: string | null;
  createdAt: string;
  updatedAt: string;
  historial?: EtapaHistorial[];
}

export interface EtapaHistorial {
  id: string;
  procesoId: string;
  etapa: string;
  estado: string;
  nota: string | null;
  fechaInicio: string;
  fechaFin: string | null;
}

export const fetchProcesos = (contratoId?: string) =>
  apiRequest<ProcesoContratacion[]>(
    contratoId ? `/procesos-contratacion?contratoId=${contratoId}` : '/procesos-contratacion',
  );

export const fetchProceso = (id: string) =>
  apiRequest<ProcesoContratacion>(`/procesos-contratacion/${id}`);

export const crearProceso = (dto: {
  contratoId: string;
  tipoContratacionId?: string;
  creadoPor?: string;
}) => apiRequest<ProcesoContratacion>('/procesos-contratacion', { method: 'POST', body: JSON.stringify(dto) });

export const avanzarEtapa = (id: string, nota?: string) =>
  apiRequest<ProcesoContratacion>(`/procesos-contratacion/${id}/avanzar`, {
    method: 'POST',
    body: JSON.stringify({ nota }),
  });

export const cancelarProceso = (id: string, motivo: string) =>
  apiRequest<ProcesoContratacion>(`/procesos-contratacion/${id}/cancelar`, {
    method: 'POST',
    body: JSON.stringify({ motivo }),
  });
