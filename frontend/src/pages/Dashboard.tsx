import { Link } from 'react-router-dom';
import {
  FileText,
  Plus,
  Calculator,
  Stamp,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';

const QUICK_ACTIONS = [
  { label: 'Nueva factibilidad', icon: Plus, to: '/app/factibilidades?new=1' },
  { label: 'Nuevo contrato', icon: FileText, to: '/app/contratos?new=1' },
  { label: 'Simulador tarifario', icon: Calculator, to: '/app/simulador' },
  { label: 'Monitor timbrado', icon: Stamp, to: '/app/timbrado' },
];

const Dashboard = () => {
  const { factibilidades, contratos, lecturas, timbrados, pagos, preFacturas } = useData();

  const factPendientes = factibilidades.filter(
    (f) => f.estado === 'Pre-factibilidad' || f.estado === 'En comité',
  ).length;
  const contratosPendientes = contratos.filter((c) => c.estado === 'Pendiente de alta').length;
  const lecturasPendientes = lecturas.filter((l) => l.estado === 'Pendiente').length;
  const erroresTimbrado = timbrados.filter((t) => t.estado === 'Error PAC').length;
  const totalActivos = contratos.filter((c) => c.estado === 'Activo').length;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Vista general del sistema CEA Querétaro."
        actions={
          <Link to="/app/factibilidades?new=1">
            <Button className="bg-[#007BFF] hover:bg-blue-600 text-white">
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva factibilidad
            </Button>
          </Link>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard
          label="Factibilidades pendientes"
          value={factPendientes}
          sub={
            <span className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="w-3 h-3" /> Activas en revisión
            </span>
          }
        />
        <KpiCard
          label="Contratos pendientes"
          value={contratosPendientes}
          accent="warning"
          footer={
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-400 rounded-full"
                style={{
                  width: `${Math.min(100, (contratosPendientes / Math.max(contratos.length, 1)) * 100)}%`,
                }}
              />
            </div>
          }
        />
        <KpiCard
          label="Lecturas pendientes"
          value={lecturasPendientes}
          sub={`${lecturas.length} totales este periodo`}
        />
        <KpiCard
          label="Errores de timbrado"
          value={erroresTimbrado}
          accent={erroresTimbrado > 0 ? 'danger' : 'default'}
          sub={
            erroresTimbrado > 0 ? (
              <span className="text-red-600 font-medium">Requieren atención</span>
            ) : (
              'Sin errores activos'
            )
          }
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border/50 shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Contratos activos
          </p>
          <p className="text-4xl font-bold font-display text-[#003366]">{totalActivos}</p>
          <p className="text-xs text-muted-foreground mt-1">Total en el sistema</p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Pre-facturas
          </p>
          <p className="text-4xl font-bold font-display text-[#007BFF]">{preFacturas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Generadas este periodo</p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 shadow-sm p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Pagos registrados
          </p>
          <p className="text-4xl font-bold font-display text-emerald-600">{pagos.length}</p>
          <p className="text-xs text-muted-foreground mt-1">En el mes actual</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Accesos rápidos
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((a) => (
            <Link
              key={a.to}
              to={a.to}
              className="flex items-center gap-3 bg-white rounded-xl border border-border/50 shadow-sm px-4 py-3.5 text-sm font-medium text-foreground hover:border-[#007BFF]/40 hover:shadow-md transition-all group"
            >
              <div className="w-8 h-8 rounded-lg bg-[#007BFF]/10 flex items-center justify-center group-hover:bg-[#007BFF]/20 transition-colors">
                <a.icon className="w-4 h-4 text-[#007BFF]" />
              </div>
              <span className="flex-1">{a.label}</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#007BFF] transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent contracts */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Contratos recientes
          </p>
          <Link to="/app/contratos" className="text-xs text-[#007BFF] hover:underline font-medium">
            VER TODOS →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/40">
                {['ID', 'Titular', 'Tipo', 'Estado', 'Fecha'].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contratos.slice(0, 5).map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-[#007BFF] font-medium">
                    {c.id}
                  </td>
                  <td className="px-4 py-3.5 font-medium">{c.nombre}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {c.tipoContrato} / {c.tipoServicio}
                  </td>
                  <td className="px-4 py-3.5">
                    <StatusBadge status={c.estado} />
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{c.fecha}</td>
                </tr>
              ))}
              {contratos.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted-foreground py-10">
                    No hay contratos registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
