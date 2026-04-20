/**
 * Distritos operativos — hoja «Distrito» del libro
 * `catálogos de punto de servicio.xlsx` (SIGE legado).
 *
 * Columnas en fuente: Administración | Distrito.
 * No incluye zona operativa; se asocian todos a {@link DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID}
 * (primera zona de CEA Querétaro en seed) hasta que exista mapeo explícito negocio↔zona.
 */
export const DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID = 'Z001';

export const DISTRITOS_PUNTO_SERVICIO_SEED: ReadonlyArray<{
  id: string;
  zonaId: string;
  nombre: string;
}> = [
  { id: 'DIST01', zonaId: DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID, nombre: '01-DISTRITO NORORIENTE' },
  { id: 'DIST02', zonaId: DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID, nombre: '02-DISTRITO NORPONIENTE' },
  { id: 'DIST03', zonaId: DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID, nombre: '03-ZONA SURORIENTE' },
  { id: 'DIST04', zonaId: DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID, nombre: '04-ZONA SURPONIENTE' },
];
