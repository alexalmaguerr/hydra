import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { MapPinned, Landmark } from 'lucide-react';
import { hasApi } from '@/api/contratos';
import {
  fetchAdministraciones,
  type AdministracionCatalogo,
} from '@/api/catalogos';

const DEMO: AdministracionCatalogo[] = [
  {
    id: 'demo-exp-01',
    nombre: 'Querétaro — Centro histórico y cuerpos de agua (demo sin API)',
  },
  {
    id: 'demo-exp-12',
    nombre: 'Pedro Escobedo (demo sin API)',
  },
];

const Administraciones = () => {
  const useApi = hasApi();

  const { data, isLoading } = useQuery({
    queryKey: ['catalogos-operativos', 'administraciones'],
    queryFn: fetchAdministraciones,
    enabled: useApi,
    staleTime: 60 * 60 * 1000,
  });

  const rows = useMemo<AdministracionCatalogo[]>(
    () => (useApi ? (data ?? []) : DEMO),
    [useApi, data],
  );

  const sorted = useMemo(
    () => [...rows].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    [rows],
  );

  return (
    <div>
      <PageHeader
        title="Administraciones territoriales"
        subtitle="Catálogo SIGE (Excel): jurisdicciones EXP-01 … EXP-13 usadas para tipos de contratación."
        breadcrumbs={[
          { label: 'Configuración', href: '/app/dashboard' },
          { label: 'Administraciones' },
        ]}
      />

      <div className="grid grid-cols-2 gap-4 mb-6">
        <KpiCard label="Administraciones" value={sorted.length} icon={Landmark} accent="primary" />
        <KpiCard
          label="Fuente"
          value={useApi ? 'API' : 'Demo'}
          icon={MapPinned}
        />
      </div>

      {!useApi && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          Sin API configurada se muestran datos de demostración. Conecte el backend para ver el catálogo importado.
        </p>
      )}

      <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
        {isLoading && useApi && (
          <p className="p-6 text-sm text-muted-foreground text-center">Cargando administraciones…</p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Código
              </th>
              <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">
                Nombre
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((a, i) => (
              <tr
                key={a.id}
                className={`${i > 0 ? 'border-t border-border/50' : ''} hover:bg-muted/20 transition-colors`}
              >
                <td className="px-4 py-3.5 font-mono text-xs text-[#007BFF] font-semibold whitespace-nowrap">
                  {a.id}
                </td>
                <td className="px-4 py-3.5 font-medium leading-snug">{a.nombre}</td>
              </tr>
            ))}
            {sorted.length === 0 && !isLoading && (
              <tr>
                <td colSpan={2} className="text-center text-muted-foreground py-12">
                  Sin administraciones registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Administraciones;
