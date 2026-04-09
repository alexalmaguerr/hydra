export class CreateContratoDto {
  tomaId?: string;
  puntoServicioId?: string;
  domicilioId?: string;
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
  // P1 campos adicionales
  fechaBaja?: string;
  actividadId?: string;
  categoriaId?: string;
  referenciaContratoAnterior?: string;
  observaciones?: string;
  tipoEnvioFactura?: string;
  indicadorEmisionRecibo?: boolean;
  indicadorExentarFacturacion?: boolean;
  indicadorContactoCorreo?: boolean;
  cicloFacturacion?: string;
  superficiePredio?: number;
  superficieConstruida?: number;
  mesesAdeudo?: number;
  unidadesServidas?: number;
  personasHabitanVivienda?: number;
}
