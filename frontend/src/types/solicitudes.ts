import type { DomicilioFormValue } from '@/components/contratacion/DomicilioPickerForm';

// Re-export for consumers that only need the form shape
export type { DomicilioFormValue };

export interface SolicitudState {
  claveCatastral: string;
  folioExpediente: string;
  predioDir: DomicilioFormValue;
  predioManzana: string;
  predioLote: string;
  superficieTotal: string;
  superficieConstruida: string;
  propTipoPersona: 'fisica' | 'moral' | '';
  propPaterno: string;
  propMaterno: string;
  propNombre: string;
  propRazonSocial: string;
  propRfc: string;
  propCorreo: string;
  propTelefono: string;
  propDir: DomicilioFormValue;
  propManzana: string;
  propLote: string;
  usoDomestico: 'si' | 'no' | '';
  hayTuberias: 'si' | 'no' | '';
  hayInfraCEA: 'si' | 'no' | '';
  esCondominio: 'si' | 'no' | '';
  condoViviendas: string;
  condoUbicacionTomas: 'banqueta' | 'cuadro' | '';
  condoTieneMedidorMacro: 'si' | 'no' | '';
  condoNumMedidor: string;
  condoAreasComunes: 'si' | 'no' | '';
  condoNumAreas: string;
  condoAgrupacion: 'si' | 'no' | '';
  condoNombreAgrupacion: string;
  personasVivienda: string;
  tieneCertConexion: 'si' | 'no' | '';
  adminId: string;
  tipoContratacionId: string;
  contratoPadre: string;
  requiereFactura: 'si' | 'no' | '';
  mismosDatosProp: 'si' | 'no' | '';
  fiscalTipoPersona: 'fisica' | 'moral' | '';
  fiscalRazonSocial: string;
  fiscalRfc: string;
  fiscalCorreo: string;
  fiscalDir: DomicilioFormValue;
  fiscalRegimenFiscal: string;
  fiscalUsoCfdi: string;
}

export const SOLICITUD_STATE_EMPTY: SolicitudState = {
  claveCatastral: '',
  folioExpediente: '',
  predioDir: { estadoINEGIId: '', municipioINEGIId: '', localidadINEGIId: '', coloniaINEGIId: '', codigoPostal: '', calle: '', numExterior: '', numInterior: '', referencia: '' },
  predioManzana: '',
  predioLote: '',
  superficieTotal: '',
  superficieConstruida: '',
  propTipoPersona: '',
  propPaterno: '',
  propMaterno: '',
  propNombre: '',
  propRazonSocial: '',
  propRfc: '',
  propCorreo: '',
  propTelefono: '',
  propDir: { estadoINEGIId: '', municipioINEGIId: '', localidadINEGIId: '', coloniaINEGIId: '', codigoPostal: '', calle: '', numExterior: '', numInterior: '', referencia: '' },
  propManzana: '',
  propLote: '',
  usoDomestico: '',
  hayTuberias: '',
  hayInfraCEA: '',
  esCondominio: '',
  condoViviendas: '',
  condoUbicacionTomas: '',
  condoTieneMedidorMacro: '',
  condoNumMedidor: '',
  condoAreasComunes: '',
  condoNumAreas: '',
  condoAgrupacion: '',
  condoNombreAgrupacion: '',
  personasVivienda: '',
  tieneCertConexion: '',
  adminId: '',
  tipoContratacionId: '',
  contratoPadre: '',
  requiereFactura: '',
  mismosDatosProp: '',
  fiscalTipoPersona: '',
  fiscalRazonSocial: '',
  fiscalRfc: '',
  fiscalCorreo: '',
  fiscalDir: { estadoINEGIId: '', municipioINEGIId: '', localidadINEGIId: '', coloniaINEGIId: '', codigoPostal: '', calle: '', numExterior: '', numInterior: '', referencia: '' },
  fiscalRegimenFiscal: '',
  fiscalUsoCfdi: '',
};

// ── Inspection order ──────────────────────────────────────────────────────────

export interface OrdenInspeccionData {
  estado: 'en_proceso' | 'completada';
  fechaInspeccion?: string;
  inspector?: string;
  // Physical survey data
  materialCalle?: 'concreto_hidraulico' | 'concreto_asfaltico' | 'tierra' | 'adoquin' | 'otro';
  materialBanqueta?: 'concreto_hidraulico' | 'tierra' | 'adoquin' | 'otro';
  metrosRupturaCalle?: string;
  metrosRupturaBanqueta?: string;
  diametroToma?: string;
  existeRed?: 'si' | 'no' | '';
  distanciaRed?: string;          // metros lineales
  presionRed?: string;            // kg/cm²
  tipoMaterialRed?: string;
  profundidadRed?: string;        // metros
  observaciones?: string;
  // Toma existente
  tomaExistente?: 'si' | 'no' | '';
  diametroTomaExistente?: string;
  estadoTomaExistente?: string;   // buena, regular, mala
  // Medidor existente
  medidorExistente?: 'si' | 'no' | '';
  numMedidorExistente?: string;
}

// ── Solicitud record (persisted) ──────────────────────────────────────────────

export type SolicitudEstado =
  | 'borrador'
  | 'inspeccion_pendiente'
  | 'inspeccion_en_proceso'
  | 'inspeccion_completada'
  | 'en_cotizacion'
  | 'aceptada'
  | 'rechazada'
  | 'cotizado'
  | 'contratado';

export interface SolicitudRecord {
  id: string;
  folio: string;
  fechaSolicitud: string;
  propNombreCompleto: string;
  propTelefono: string;
  predioResumen: string;
  adminId: string;
  tipoContratacionId: string;
  usoDomestico: 'si' | 'no' | '';
  estado: SolicitudEstado;
  ordenInspeccion?: OrdenInspeccionData;
  formData: SolicitudState;
  createdAt: string;
}
