import { apiRequest, hasApi } from './client';

export interface ContratoDto {
  id: string;
  tomaId?: string | null;
  puntoServicioId?: string | null;
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateContratoDto {
  tomaId?: string;
  puntoServicioId?: string;
  tipoContratacionId?: string;
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
  omitirRegistroPersonaTitular?: boolean;
}

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

export async function createContrato(dto: CreateContratoDto): Promise<ContratoDto> {
  return apiRequest<ContratoDto>('/contratos', {
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

export { hasApi };
