import { useMemo } from 'react';
import { useAuth, type UserRole } from '@/context/AuthContext';

// ─── Permission definitions ──────────────────────────────────────────────────

/** All discrete permissions available in the internal module */
export type Permission =
  // Convenios
  | 'convenios.view'
  | 'convenios.create'
  | 'convenios.edit'
  | 'convenios.checklist'
  // Ordenes
  | 'ordenes.view'
  | 'ordenes.changeEstado'
  // Tramites
  | 'tramites.view'
  | 'tramites.seguimiento.add'
  | 'tramites.seguimiento.view'
  // Contratos
  | 'contratos.view'
  | 'contratos.editFiscal'
  // Quejas
  | 'quejas.view'
  | 'quejas.create'
  | 'quejas.resolve'
  // Admin
  | 'admin.usuarios'
  | 'admin.configuracion';

/** Role → permission set */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  SUPER_ADMIN: [
    'convenios.view', 'convenios.create', 'convenios.edit', 'convenios.checklist',
    'ordenes.view', 'ordenes.changeEstado',
    'tramites.view', 'tramites.seguimiento.add', 'tramites.seguimiento.view',
    'contratos.view', 'contratos.editFiscal',
    'quejas.view', 'quejas.create', 'quejas.resolve',
    'admin.usuarios', 'admin.configuracion',
  ],
  ADMIN: [
    'convenios.view', 'convenios.create', 'convenios.edit', 'convenios.checklist',
    'ordenes.view', 'ordenes.changeEstado',
    'tramites.view', 'tramites.seguimiento.add', 'tramites.seguimiento.view',
    'contratos.view', 'contratos.editFiscal',
    'quejas.view', 'quejas.create', 'quejas.resolve',
    'admin.usuarios', 'admin.configuracion',
  ],
  OPERADOR: [
    'convenios.view', 'convenios.create', 'convenios.edit', 'convenios.checklist',
    'ordenes.view', 'ordenes.changeEstado',
    'tramites.view', 'tramites.seguimiento.add', 'tramites.seguimiento.view',
    'contratos.view',
    'quejas.view', 'quejas.create',
  ],
  ATENCION_CLIENTES: [
    'convenios.view', 'convenios.create', 'convenios.checklist',
    'ordenes.view',
    'tramites.view', 'tramites.seguimiento.add', 'tramites.seguimiento.view',
    'contratos.view',
    'quejas.view', 'quejas.create',
  ],
  LECTURISTA: [
    'contratos.view',
    'ordenes.view',
    'tramites.view', 'tramites.seguimiento.view',
  ],
  CLIENTE: [],
};

// ─── Hook ────────────────────────────────────────────────────────────────────

interface PermissionsResult {
  can: (permission: Permission) => boolean;
  canAll: (...permissions: Permission[]) => boolean;
  canAny: (...permissions: Permission[]) => boolean;
  role: UserRole | null;
}

/**
 * Returns permission helpers for the currently logged-in user.
 * Usage:
 *   const { can } = usePermissions();
 *   if (can('convenios.create')) { ... }
 */
export function usePermissions(): PermissionsResult {
  const { user } = useAuth();

  return useMemo<PermissionsResult>(() => {
    const role = user?.role ?? null;
    const permSet = new Set<Permission>(
      role ? (ROLE_PERMISSIONS[role] ?? []) : [],
    );

    return {
      role,
      can: (p) => permSet.has(p),
      canAll: (...ps) => ps.every((p) => permSet.has(p)),
      canAny: (...ps) => ps.some((p) => permSet.has(p)),
    };
  }, [user]);
}
