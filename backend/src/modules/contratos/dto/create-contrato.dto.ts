import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
} from 'class-validator';

export class CreateContratoDto {
  @IsOptional() @IsString() tomaId?: string;
  @IsOptional() @IsString() puntoServicioId?: string;
  @IsOptional() @IsString() domicilioId?: string;
  @IsOptional() @IsString() tipoContratacionId?: string;
  @IsString() tipoContrato: string;
  @IsString() tipoServicio: string;
  @IsString() nombre: string;
  @IsString() rfc: string;
  @IsOptional() @IsString() direccion?: string;
  @IsOptional() @IsString() contacto?: string;
  @IsString() estado: string;
  @IsString() fecha: string;
  @IsOptional() @IsString() medidorId?: string;
  @IsOptional() @IsString() rutaId?: string;
  @IsOptional() @IsString() zonaId?: string;
  @IsOptional() @IsBoolean() domiciliado?: boolean;
  @IsOptional() @IsString() fechaReconexionPrevista?: string;
  @IsOptional() @IsString() ceaNumContrato?: string;
  // P1 campos adicionales
  @IsOptional() @IsString() fechaBaja?: string;
  @IsOptional() @IsString() actividadId?: string;
  @IsOptional() @IsString() categoriaId?: string;
  @IsOptional() @IsString() referenciaContratoAnterior?: string;
  @IsOptional() @IsString() observaciones?: string;
  @IsOptional() @IsString() tipoEnvioFactura?: string;
  @IsOptional() @IsBoolean() indicadorEmisionRecibo?: boolean;
  @IsOptional() @IsBoolean() indicadorExentarFacturacion?: boolean;
  @IsOptional() @IsBoolean() indicadorContactoCorreo?: boolean;
  @IsOptional() @IsString() cicloFacturacion?: string;
  @IsOptional() @IsNumber() superficiePredio?: number;
  @IsOptional() @IsNumber() superficieConstruida?: number;
  @IsOptional() @IsNumber() mesesAdeudo?: number;
  @IsOptional() @IsNumber() unidadesServidas?: number;
  @IsOptional() @IsNumber() personasHabitanVivienda?: number;
}
