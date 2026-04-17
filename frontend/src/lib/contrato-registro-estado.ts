/**
 * Mapea estados persistidos del contrato a las cuatro etiquetas del flujo de registro.
 * La fuente de verdad sigue siendo `contrato.estado` en backend; esto es solo presentación.
 */
export type FlujoRegistroEstadoKey =
  | 'pago_pendiente'
  | 'instalacion_conexion'
  | 'instalacion_medidor'
  | 'completado'
  | 'otro';

export interface FlujoRegistroEstadoUi {
  key: FlujoRegistroEstadoKey;
  /** Etiqueta en español para la tabla de registro */
  label: string;
}

export function mapEstadoContratoToFlujoRegistro(estado: string | null | undefined): FlujoRegistroEstadoUi {
  const e = (estado ?? '').trim();
  const lower = e.toLowerCase();

  if (lower === 'activo') {
    return { key: 'completado', label: 'Completado' };
  }
  if (lower === 'pendiente de toma' || lower.includes('toma')) {
    return { key: 'instalacion_conexion', label: 'Instalación de conexión' };
  }
  if (
    lower === 'pendiente de zona' ||
    lower === 'pendiente de medidor' ||
    lower.includes('medidor')
  ) {
    return { key: 'instalacion_medidor', label: 'Instalación de medidor' };
  }
  if (
    lower === 'pendiente de alta' ||
    lower.includes('pendiente de pago') ||
    lower.includes('pago')
  ) {
    return { key: 'pago_pendiente', label: 'Pago pendiente' };
  }

  return { key: 'otro', label: e.length ? e : '—' };
}
