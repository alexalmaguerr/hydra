export class CreateQuejaDto {
  contratoId: string;
  tipo: string; // 'Queja' | 'Aclaración'
  descripcion: string;
  estado?: string;
  atendidoPor?: string;
  categoria?: string;
  prioridad?: string; // 'Alta' | 'Media' | 'Baja'
  canal?: string;
  areaAsignada?: string;
  enlaceExterno?: string;
}
