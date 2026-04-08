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
}
