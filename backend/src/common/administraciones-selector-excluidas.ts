/**
 * Registros del catálogo SIGE que no representan un municipio y no deben
 * mostrarse en selectores de «Administración» (contratación, solicitudes, etc.).
 */
export const ADMINISTRACION_NOMBRES_EXCLUIDOS_SELECTOR = [
  'CEA Querétaro',
  'Operadora Zibatá',
] as const;

const EXCLUIDAS = new Set<string>(ADMINISTRACION_NOMBRES_EXCLUIDOS_SELECTOR);

export function administracionExcluidaDelSelector(nombre: string): boolean {
  return EXCLUIDAS.has(nombre.trim());
}
