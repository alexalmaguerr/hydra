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
