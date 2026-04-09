import { apiRequest } from './client';

export interface TarifaVigente {
  id: string;
  tipoServicio: string;
  rangoMin: number;
  rangoMax: number;
  precioPorM3: number;
  cargoFijo: number;
  vigenciaDesde: string;
  vigenciaHasta: string | null;
  activo: boolean;
}

export interface ActualizacionTarifaria {
  id: string;
  nombre: string;
  factorAjuste: number;
  fechaAplicacion: string;
  fuenteOficial: string | null;
  estado: string;
  createdAt: string;
}

export interface CalculoMonto {
  tipoServicio: string;
  consumoM3: number;
  monto: number;
  detalle: { rango: string; m3: number; importe: number }[];
}

export const fetchTarifasVigentes = (tipoServicio?: string, fecha?: string) => {
  const params = new URLSearchParams();
  if (tipoServicio) params.set('tipoServicio', tipoServicio);
  if (fecha) params.set('fecha', fecha);
  const qs = params.toString();
  return apiRequest<TarifaVigente[]>(`/tarifas/vigentes${qs ? `?${qs}` : ''}`);
};

export const calcularMonto = (tipoServicio: string, consumoM3: number) =>
  apiRequest<CalculoMonto>(`/tarifas/calcular?tipoServicio=${tipoServicio}&consumoM3=${consumoM3}`);

export const fetchActualizaciones = () =>
  apiRequest<ActualizacionTarifaria[]>('/tarifas/actualizaciones');

export const crearActualizacion = (dto: {
  nombre: string;
  factorAjuste: number;
  fechaAplicacion: string;
  fuenteOficial?: string;
}) =>
  apiRequest<ActualizacionTarifaria>('/tarifas/actualizaciones', {
    method: 'POST',
    body: JSON.stringify(dto),
  });

export const aplicarActualizacion = (id: string) =>
  apiRequest<ActualizacionTarifaria>(`/tarifas/actualizaciones/${id}/aplicar`, {
    method: 'POST',
  });
