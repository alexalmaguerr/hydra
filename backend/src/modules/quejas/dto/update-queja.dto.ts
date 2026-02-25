export class UpdateQuejaDto {
  estado?: string;
  areaAsignada?: string;
  motivoCierre?: string;
  enlaceExterno?: string;
  prioridad?: string; // 'Alta' | 'Media' | 'Baja'
  atendidoPor?: string;
  categoria?: string;
}
