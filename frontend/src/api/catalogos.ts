import { apiRequest } from './client';

export interface CatalogoGrupoActividad {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export interface CatalogoActividad {
  id: string;
  codigo: string;
  descripcion: string;
  grupoId: string | null;
  activo: boolean;
  grupo?: CatalogoGrupoActividad;
}

export interface CatalogoCategoria {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export interface CatalogoTipoRelacionPS {
  id: string;
  codigo: string;
  descripcion: string;
  metodo: string;
  reparteConsumo: boolean;
  activo: boolean;
}

export const fetchActividades = () =>
  apiRequest<CatalogoActividad[]>('/catalogos/actividades');

export const fetchGruposActividad = () =>
  apiRequest<CatalogoGrupoActividad[]>('/catalogos/grupos-actividad');

export const fetchCategorias = () =>
  apiRequest<CatalogoCategoria[]>('/catalogos/categorias');

export const fetchTiposRelacionPS = () =>
  apiRequest<CatalogoTipoRelacionPS[]>('/catalogos/tipos-relacion-ps');

// ── Contratación: conceptos y cláusulas ─────────────────────────────────────

export interface ConceptoCobro {
  id: string;
  codigo: string;
  nombre: string;
  tipo: string;
  montoBase?: string | number | null;
  ivaPct?: string | number | null;
  formula?: string | null;
  variablesFormula?: unknown;
  activo: boolean;
}

export interface ClausulaContractual {
  id: string;
  codigo: string;
  titulo: string;
  contenido: string;
  version: string;
  activo: boolean;
}

export const fetchConceptosCobro = () =>
  apiRequest<ConceptoCobro[]>('/catalogos/conceptos-cobro');

export const fetchClausulas = () =>
  apiRequest<ClausulaContractual[]>('/catalogos/clausulas');

// ── Punto de servicio (operativo) ───────────────────────────────────────────

export interface CatalogoTipoCorte {
  id: string;
  codigo: string;
  descripcion: string;
  impacto?: string | null;
  requiereCuadrilla: boolean;
  activo: boolean;
}

export interface CatalogoCodigoDescripcion {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export interface CatalogoCodigoRecorrido extends CatalogoCodigoDescripcion {
  rutaId?: string | null;
}

export const fetchTiposCorte = () =>
  apiRequest<CatalogoTipoCorte[]>('/catalogos/tipos-corte');

export const fetchTiposSuministro = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos/tipos-suministro');

export const fetchEstructurasTecnicas = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos/estructuras-tecnicas');

export const fetchZonasFacturacion = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos/zonas-facturacion');

export const fetchCodigosRecorrido = () =>
  apiRequest<CatalogoCodigoRecorrido[]>('/catalogos/codigos-recorrido');

// ── Catálogos Operativos (medidores, pagos, oficinas, contratación) ──────────

export interface CatalogoMarcaMedidor {
  id: string;
  codigo: string;
  nombre: string;
  activo: boolean;
}

export interface CatalogoModeloMedidor {
  id: string;
  marcaId: string;
  codigo: string;
  nombre: string;
  activo: boolean;
  marca?: CatalogoMarcaMedidor;
}

export interface CatalogoCalibre {
  id: string;
  codigo: string;
  descripcion: string;
  diametroMm?: number | null;
  activo: boolean;
}

export interface FormaPago {
  id: string;
  codigo: string;
  nombre: string;
  tipoRecaudacion: string;
  aceptaEfectivo: boolean;
  aceptaCheque: boolean;
  aceptaTarjeta: boolean;
  aceptaTransf: boolean;
  requiereReferencia: boolean;
  activo: boolean;
}

export interface SectorHidraulico {
  id: string;
  codigo: string;
  nombre: string;
  administracionId?: string | null;
  activo: boolean;
}

export interface ClaseContrato {
  id: string;
  codigo: string;
  descripcion: string;
  activo: boolean;
}

export interface TipoVariable {
  id: string;
  codigo: string;
  nombre: string;
  tipoDato: string;
  unidad?: string | null;
  activo: boolean;
}

export const fetchMarcasMedidor = () =>
  apiRequest<CatalogoMarcaMedidor[]>('/catalogos-operativos/marcas-medidor');

export const fetchModelosMedidor = () =>
  apiRequest<CatalogoModeloMedidor[]>('/catalogos-operativos/modelos-medidor');

export const fetchCalibres = () =>
  apiRequest<CatalogoCalibre[]>('/catalogos-operativos/calibres');

export const fetchEmplazamientos = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos-operativos/emplazamientos');

export const fetchTiposContador = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos-operativos/tipos-contador');

export const fetchFormasPago = () =>
  apiRequest<FormaPago[]>('/catalogos-operativos/formas-pago');

export const fetchTiposOficina = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos-operativos/tipos-oficina');

export const fetchSectoresHidraulicos = () =>
  apiRequest<SectorHidraulico[]>('/catalogos-operativos/sectores-hidraulicos');

export const fetchClasesContrato = () =>
  apiRequest<ClaseContrato[]>('/catalogos-operativos/clases-contrato');

export const fetchTiposVia = () =>
  apiRequest<CatalogoCodigoDescripcion[]>('/catalogos-operativos/tipos-via');

export const fetchTiposVariable = () =>
  apiRequest<TipoVariable[]>('/catalogos-operativos/tipos-variable');
