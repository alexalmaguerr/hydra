/**
 * Motor de cotización de solicitudes de conexión.
 * Calcula los conceptos y montos estimados a partir de los datos de inspección.
 */
import type { OrdenInspeccionData } from '@/types/solicitudes';

export const MATERIAL_LABEL: Record<string, string> = {
  empedrado: 'Empedrado',
  concreto_hidraulico: 'Concreto hidráulico',
  concreto_asfaltico: 'Concreto asfáltico',
  concreto: 'Concreto',
  tierra: 'Tierra',
  adoquin: 'Adoquín',
  otro: 'Otro',
};

const PRECIO_CALLE: Record<string, number> = {
  concreto_hidraulico: 850,
  concreto_asfaltico: 650,
  tierra: 180,
  adoquin: 520,
  otro: 400,
};

const PRECIO_BANQUETA: Record<string, number> = {
  concreto_hidraulico: 750,
  tierra: 150,
  adoquin: 480,
  otro: 350,
};

const PRECIO_TOMA: Record<string, number> = {
  '1/2"': 3200, '3/4"': 4100, '1"': 5800,
  '1.5"': 8500, '2"': 12000, '3"': 18000, '4"': 28000,
};

export interface ConceptoCotizacion {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  subtotal: number;
}

export function calcularCotizacion(orden: OrdenInspeccionData): ConceptoCotizacion[] {
  const conceptos: ConceptoCotizacion[] = [];

  // Derechos de conexión (fijo)
  conceptos.push({ descripcion: 'Derechos de conexión', cantidad: 1, unidad: 'servicio', precioUnitario: 1200, subtotal: 1200 });

  // Ruptura y reposición de calle
  const mlCalleAgua = parseFloat(orden.metrosRupturaAguaCalle ?? orden.metrosRupturaCalle ?? '0') || 0;
  const mlCalleDrenaje = parseFloat(orden.metrosRupturaDrenajeCalle ?? '0') || 0;
  const mlCalle = mlCalleAgua + mlCalleDrenaje;
  if (mlCalle > 0) {
    const pu = PRECIO_CALLE[orden.materialCalle ?? ''] ?? 400;
    conceptos.push({
      descripcion: `Reposición de calle (${MATERIAL_LABEL[orden.materialCalle ?? ''] ?? 'N/A'})`,
      cantidad: mlCalle,
      unidad: 'ml',
      precioUnitario: pu,
      subtotal: mlCalle * pu,
    });
  }

  // Ruptura y reposición de banqueta
  const mlBanquetaAgua = parseFloat(orden.metrosRupturaAguaBanqueta ?? orden.metrosRupturaBanqueta ?? '0') || 0;
  const mlBanquetaDrenaje = parseFloat(orden.metrosRupturaDrenajeBanqueta ?? '0') || 0;
  const mlBanqueta = mlBanquetaAgua + mlBanquetaDrenaje;
  if (mlBanqueta > 0) {
    const pu = PRECIO_BANQUETA[orden.materialBanqueta ?? ''] ?? 350;
    conceptos.push({
      descripcion: `Reposición de banqueta (${MATERIAL_LABEL[orden.materialBanqueta ?? ''] ?? 'N/A'})`,
      cantidad: mlBanqueta,
      unidad: 'ml',
      precioUnitario: pu,
      subtotal: mlBanqueta * pu,
    });
  }

  // Instalación de toma
  if (orden.diametroToma) {
    const pu = PRECIO_TOMA[orden.diametroToma] ?? 5800;
    conceptos.push({ descripcion: `Instalación de toma ${orden.diametroToma}`, cantidad: 1, unidad: 'pieza', precioUnitario: pu, subtotal: pu });
  }

  // Medidor
  if (orden.medidorExistente === 'no') {
    conceptos.push({ descripcion: 'Suministro e instalación de medidor', cantidad: 1, unidad: 'pieza', precioUnitario: 2800, subtotal: 2800 });
  }

  return conceptos;
}

export function totalCotizacion(conceptos: ConceptoCotizacion[]): number {
  return conceptos.reduce((s, c) => s + c.subtotal, 0);
}

/** Convierte un SolicitudInspeccionDto (campos nullable) al shape que espera calcularCotizacion. */
export function inspeccionDtoToOrdenData(dto: Record<string, unknown>): OrdenInspeccionData {
  // str handles both string and numeric values from API (Prisma Float → JS number)
  const str = (v: unknown) => (v != null && v !== '' ? String(v) : undefined);
  return {
    estado: 'completada',
    materialCalle: str(dto.materialCalle),
    materialBanqueta: str(dto.materialBanqueta),
    metrosRupturaAguaCalle: str(dto.metrosRupturaAguaCalle),
    metrosRupturaAguaBanqueta: str(dto.metrosRupturaAguaBanqueta),
    metrosRupturaDrenajeCalle: str(dto.metrosRupturaDrenajeCalle),
    metrosRupturaDrenajeBanqueta: str(dto.metrosRupturaDrenajeBanqueta),
    metrosRupturaCalle: str(dto.metrosRupturaCalle),
    metrosRupturaBanqueta: str(dto.metrosRupturaBanqueta),
    diametroToma: str(dto.diametroToma),
    medidorExistente: (dto.medidorExistente === 'si' || dto.medidorExistente === 'no') ? dto.medidorExistente : undefined,
  };
}
