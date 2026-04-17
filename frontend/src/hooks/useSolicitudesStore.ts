import { useState, useCallback } from 'react';
import type { SolicitudRecord, SolicitudState, OrdenInspeccionData, SolicitudEstado } from '@/types/solicitudes';

const STORAGE_KEY = 'ctcf_solicitudes_v1';

function readAll(): SolicitudRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SolicitudRecord[]) : [];
  } catch {
    return [];
  }
}

function writeAll(records: SolicitudRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function generateFolio(existing: SolicitudRecord[]): string {
  const year = new Date().getFullYear();
  const prefix = `SOL-${year}-`;
  const maxSeq = existing
    .map((r) => {
      const m = r.folio.match(/^SOL-\d{4}-(\d+)$/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .reduce((a, b) => Math.max(a, b), 0);
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function deriveName(f: SolicitudState): string {
  if (f.propTipoPersona === 'moral') return f.propRazonSocial?.trim() || '—';
  return [f.propPaterno, f.propMaterno, f.propNombre].filter(Boolean).join(' ').trim() || '—';
}

export function derivePredioResumen(f: SolicitudState): string {
  const calle = f.predioDir.calle?.trim();
  const num = f.predioDir.numExterior?.trim();
  const cp = f.predioDir.codigoPostal?.trim();
  if (!calle) return '—';
  let s = calle;
  if (num) s += ` #${num}`;
  if (cp) s += `, CP ${cp}`;
  return s;
}

export function useSolicitudesStore() {
  const [records, setRecords] = useState<SolicitudRecord[]>(() => readAll());

  const persist = useCallback((updated: SolicitudRecord[]) => {
    writeAll(updated);
    setRecords(updated);
  }, []);

  const create = useCallback(
    (formData: SolicitudState): SolicitudRecord => {
      const current = readAll(); // fresh read to avoid stale closure
      const now = new Date().toISOString();
      const record: SolicitudRecord = {
        id: crypto.randomUUID(),
        folio: generateFolio(current),
        fechaSolicitud: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' }),
        propNombreCompleto: deriveName(formData),
        propTelefono: formData.propTelefono || '—',
        predioResumen: derivePredioResumen(formData),
        adminId: formData.adminId,
        tipoContratacionId: formData.tipoContratacionId,
        usoDomestico: formData.usoDomestico,
        estado: 'borrador',
        formData,
        createdAt: now,
      };
      const updated = [...current, record];
      persist(updated);
      return record;
    },
    [persist],
  );

  const updateFormData = useCallback(
    (id: string, formData: SolicitudState) => {
      const current = readAll();
      const updated = current.map((r) =>
        r.id === id
          ? {
              ...r,
              formData,
              propNombreCompleto: deriveName(formData),
              propTelefono: formData.propTelefono || '—',
              predioResumen: derivePredioResumen(formData),
              adminId: formData.adminId,
              tipoContratacionId: formData.tipoContratacionId,
              usoDomestico: formData.usoDomestico,
            }
          : r,
      );
      persist(updated);
    },
    [persist],
  );

  const updateEstado = useCallback(
    (id: string, estado: SolicitudEstado) => {
      const current = readAll();
      persist(current.map((r) => (r.id === id ? { ...r, estado } : r)));
    },
    [persist],
  );

  const setOrdenInspeccion = useCallback(
    (id: string, orden: OrdenInspeccionData) => {
      const current = readAll();
      const nextEstado: SolicitudEstado =
        orden.estado === 'completada' ? 'en_cotizacion' : 'inspeccion_en_proceso';
      persist(
        current.map((r) =>
          r.id === id ? { ...r, ordenInspeccion: orden, estado: nextEstado } : r,
        ),
      );
    },
    [persist],
  );

  const aceptarSolicitud = useCallback(
    (id: string) => {
      const current = readAll();
      persist(current.map((r) => (r.id === id ? { ...r, estado: 'aceptada' as SolicitudEstado } : r)));
    },
    [persist],
  );

  const rechazarSolicitud = useCallback(
    (id: string) => {
      const current = readAll();
      persist(current.map((r) => (r.id === id ? { ...r, estado: 'rechazada' as SolicitudEstado } : r)));
    },
    [persist],
  );

  const remove = useCallback(
    (id: string) => {
      const current = readAll();
      persist(current.filter((r) => r.id !== id));
    },
    [persist],
  );

  const getById = useCallback((id: string) => records.find((r) => r.id === id), [records]);

  return { records, create, updateFormData, updateEstado, setOrdenInspeccion, aceptarSolicitud, rechazarSolicitud, remove, getById };
}
