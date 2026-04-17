import { apiRequest, hasApi } from './client';

export interface ContratoDto {
  id: string;
  tomaId?: string | null;
  puntoServicioId?: string | null;
  domicilioId?: string | null;
  tipoContratacionId?: string | null;
  tipoContrato: string;
  tipoServicio: string;
  nombre: string;
  rfc: string;
  direccion: string;
  contacto: string;
  estado: string;
  fecha: string;
  medidorId?: string | null;
  rutaId?: string | null;
  zonaId?: string | null;
  domiciliado: boolean;
  fechaReconexionPrevista?: string | null;
  ceaNumContrato?: string | null;
  razonSocial?: string | null;
  regimenFiscal?: string | null;
  tipoEnvioFactura?: string | null;
  actividadId?: string | null;
  categoriaId?: string | null;
  referenciaContratoAnterior?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContratoDto {
  personaFiscal?: {
    personaId?: string;
    nombre?: string;
    rfc?: string;
    curp?: string;
    email?: string;
    telefono?: string;
    razonSocial?: string;
    regimenFiscal?: string;
  };
  personaContacto?: {
    personaId?: string;
    nombre?: string;
    rfc?: string;
    curp?: string;
    email?: string;
    telefono?: string;
    razonSocial?: string;
    regimenFiscal?: string;
  };
  tomaId?: string;
  puntoServicioId?: string;
  tipoContratacionId?: string;
  actividadId?: string;
  categoriaId?: string;
  referenciaContratoAnterior?: string;
  tipoEnvioFactura?: string;
  observaciones?: string;
  cicloFacturacion?: string;
  mesesAdeudo?: number;
  superficiePredio?: number;
  superficieConstruida?: number;
  unidadesServidas?: number;
  personasHabitanVivienda?: number;
  documentosRecibidos?: string[];
  tipoContrato: string;
  tipoServicio: string;
  nombre: string;
  rfc: string;
  direccion: string;
  contacto: string;
  estado: string;
  fecha: string;
  medidorId?: string;
  rutaId?: string;
  zonaId?: string;
  domiciliado?: boolean;
  fechaReconexionPrevista?: string;
  ceaNumContrato?: string;
  razonSocial?: string;
  regimenFiscal?: string;
  generarOrdenInstalacionToma?: boolean;
  generarOrdenInstalacionMedidor?: boolean;
  generarFacturaContratacion?: boolean;
  omitirRegistroPersonaTitular?: boolean;
  /** Con checklist en alta: opcional, enlaza plantilla al proceso creado en el mismo POST. */
  plantillaContratacionId?: string;
  variablesCapturadas?: Record<string, string | number | boolean>;
  conceptosOverride?: { conceptoCobroId: string; cantidad: number }[];
}

/** Respuesta de POST /contratos (incluye metadatos de proceso en la misma alta). */
export type CreateContratoResponseDto = ContratoDto & {
  procesoGestionadoEnAlta?: boolean;
  facturaContratacion?: {
    timbradoId: string;
    costos: { concepto: string; monto: number }[];
    total: number;
  };
};

export interface UpdateContratoDto {
  ceaNumContrato?: string | null;
  estado?: string;
  domiciliado?: boolean;
  fechaReconexionPrevista?: string | null;
  bloqueadoJuridico?: boolean;
  razonSocial?: string | null;
  regimenFiscal?: string | null;
  constanciaFiscalUrl?: string | null;
  domicilioId?: string | null;
  puntoServicioId?: string | null;
  tipoContratacionId?: string | null;
  zonaId?: string | null;
  rutaId?: string | null;
  fechaBaja?: string | null;
  actividadId?: string | null;
  categoriaId?: string | null;
  referenciaContratoAnterior?: string | null;
  observaciones?: string | null;
  tipoEnvioFactura?: string | null;
  indicadorEmisionRecibo?: boolean;
  indicadorExentarFacturacion?: boolean;
  indicadorContactoCorreo?: boolean;
  cicloFacturacion?: string | null;
  superficiePredio?: number | null;
  superficieConstruida?: number | null;
  mesesAdeudo?: number | null;
  unidadesServidas?: number | null;
  personasHabitanVivienda?: number | null;
  textoContratoSnapshot?: string | null;
}

export interface EstadoOperativoDto {
  contratoId: string;
  nombre: string;
  estado: string;
  bloqueadoJuridico: boolean;
  tieneAdeudo: boolean;
  montoAdeudo: number;
  tieneConvenioActivo: boolean;
  fechaReconexionPrevista?: string | null;
  canTramitar: boolean;
  canReconectar: boolean;
  canBaja: boolean;
  canConvenio: boolean;
  alertas: string[];
}

export async function fetchContratos(): Promise<ContratoDto[]> {
  return apiRequest<ContratoDto[]>('/contratos');
}

export async function fetchContrato(id: string): Promise<ContratoDto> {
  return apiRequest<ContratoDto>(`/contratos/${id}`);
}

export async function createContrato(dto: CreateContratoDto): Promise<CreateContratoResponseDto> {
  return apiRequest<CreateContratoResponseDto>('/contratos', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function updateContrato(id: string, dto: UpdateContratoDto): Promise<ContratoDto> {
  return apiRequest<ContratoDto>(`/contratos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

export async function fetchEstadoOperativo(id: string): Promise<EstadoOperativoDto> {
  return apiRequest<EstadoOperativoDto>(`/contratos/${id}/estado-operativo`);
}

export interface TextoContratoPreviewDto {
  texto: string;
  fuente: 'plantilla' | 'clausulas' | 'vacío';
  contratoId: string;
}

export async function fetchTextoContratoPreview(id: string): Promise<TextoContratoPreviewDto> {
  return apiRequest<TextoContratoPreviewDto>(`/contratos/${id}/texto-contrato`);
}

export function getContratoPdfUrl(id: string): string {
  const base = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001';
  return `${base}/contratos/${id}/contrato-pdf`;
}

export interface FacturaContratacionDto {
  timbradoId: string;
  costos: { concepto: string; monto: number }[];
  total: number;
}

export async function crearFacturaContratacion(id: string): Promise<FacturaContratacionDto> {
  return apiRequest<FacturaContratacionDto>(`/contratos/${id}/factura-contratacion`, {
    method: 'POST',
  });
}

// ── Billing preview ──────────────────────────────────────────────────────────

export interface BillingLineItem {
  conceptoCobroId: string;
  nombre: string;
  tipo: string;
  cantidad: number;
  precioBase: number;
  precioProporcional: number;
  importe: number;
  ivaPct: number;
  ivaImporte: number;
  obligatorio: boolean;
  orden: number;
}

export interface BillingPreview {
  items: BillingLineItem[];
  subtotal: number;
  totalIva: number;
  total: number;
}

export async function previewFacturacion(
  tipoContratacionId: string,
  variables: Record<string, string | number | boolean>,
): Promise<BillingPreview> {
  return apiRequest<BillingPreview>('/contratos/preview-facturacion', {
    method: 'POST',
    body: JSON.stringify({ tipoContratacionId, variables }),
  });
}

export async function cancelarContrato(id: string): Promise<ContratoDto> {
  return apiRequest<ContratoDto>(`/contratos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ estado: 'Cancelado' }),
  });
}

export { hasApi };
