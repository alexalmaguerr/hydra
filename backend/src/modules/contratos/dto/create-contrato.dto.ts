import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsArray,
  ArrayMaxSize,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PersonaRelacionContratoDto {
  @IsOptional() @IsString() personaId?: string;
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() rfc?: string;
  @IsOptional() @IsString() curp?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() telefono?: string;
  @IsOptional() @IsString() razonSocial?: string;
  @IsOptional() @IsString() regimenFiscal?: string;
}

export class ConceptoOverrideDto {
  @IsString() conceptoCobroId: string;
  @IsNumber() cantidad: number;
}

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

  /** Persona moral / datos fiscales en el contrato */
  @IsOptional() @IsString() razonSocial?: string;
  @IsOptional() @IsString() regimenFiscal?: string;

  /** Si true, al crear se genera orden InstalacionToma y estado Pendiente de toma (prioridad sobre medidor). */
  @IsOptional() @IsBoolean() generarOrdenInstalacionToma?: boolean;
  /** Si true (y no hay orden de toma), orden InstalacionMedidor y estado Pendiente de zona. */
  @IsOptional() @IsBoolean() generarOrdenInstalacionMedidor?: boolean;
  /** Generar factura de contratación con los conceptos del tipo (requiere FEATURE_FACTURACION_CONTRATACION=true). */
  @IsOptional() @IsBoolean() generarFacturaContratacion?: boolean;
  /** Omitir creación de Persona + rol PROPIETARIO (solo datos planos en contrato). */
  @IsOptional() @IsBoolean() omitirRegistroPersonaTitular?: boolean;

  /** Checklist de documentos marcados como recibidos durante la contratación. */
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  documentosRecibidos?: string[];

  /**
   * Plantilla del proceso cuando el checklist se captura en el mismo POST.
   * Requiere al menos un valor en `documentosRecibidos`; si no, 400.
   */
  @IsOptional() @IsString() plantillaContratacionId?: string;

  /** Persona fiscal relacionada (rol FISCAL). */
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaRelacionContratoDto)
  personaFiscal?: PersonaRelacionContratoDto;

  /** Persona de contacto relacionada (rol CONTACTO). */
  @IsOptional()
  @ValidateNested()
  @Type(() => PersonaRelacionContratoDto)
  personaContacto?: PersonaRelacionContratoDto;

  /** Variables dinámicas capturadas durante el wizard (superficie, unidades, etc.). */
  @IsOptional()
  variablesCapturadas?: Record<string, string | number | boolean>;

  /** Override de cantidades por concepto desde el wizard paso 6. */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConceptoOverrideDto)
  conceptosOverride?: ConceptoOverrideDto[];
}
