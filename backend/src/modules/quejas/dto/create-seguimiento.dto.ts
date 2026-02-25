export class CreateSeguimientoDto {
  nota: string;
  usuario: string;
  tipo: string; // 'nota' | 'cambio_estado' | 'reasignacion' | 'contacto_cliente'
}
