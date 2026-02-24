import { useData } from '@/context/DataContext';
import { Link } from 'react-router-dom';
import { FileCheck, FileText, BookOpen, Stamp, AlertTriangle, Plus, Calculator, BarChart3 } from 'lucide-react';
import StatusBadge from '@/components/StatusBadge';

const WidgetCard = ({ title, value, icon: Icon, color, link }: { title: string; value: number; icon: any; color: string; link: string }) => (
  <Link to={link} className="widget-card flex items-center gap-4">
    <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  </Link>
);

const QuickAction = ({ label, icon: Icon, to }: { label: string; icon: any; to: string }) => (
  <Link to={to} className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary">
    <Icon className="h-4 w-4 text-primary" />
    {label}
  </Link>
);

const Dashboard = () => {
  const { factibilidades, contratos, lecturas, timbrados, pagos, preFacturas } = useData();

  const factPendientes = factibilidades.filter(f => f.estado === 'Pre-factibilidad' || f.estado === 'En comité').length;
  const contratosPendientes = contratos.filter(c => c.estado === 'Pendiente de alta').length;
  const lecturasPendientes = lecturas.filter(l => l.estado === 'Pendiente').length;
  const errorTimbrado = timbrados.filter(t => t.estado === 'Error PAC').length;
  const totalContratos = contratos.filter(c => c.estado === 'Activo').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Vista general del sistema CEA Querétaro</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <WidgetCard title="Factibilidades pendientes" value={factPendientes} icon={FileCheck} color="bg-info/10 text-info" link="/factibilidades" />
        <WidgetCard title="Contratos pendientes" value={contratosPendientes} icon={FileText} color="bg-warning/10 text-warning" link="/contratos" />
        <WidgetCard title="Lecturas pendientes" value={lecturasPendientes} icon={BookOpen} color="bg-primary/10 text-primary" link="/lecturas" />
        <WidgetCard title="Errores de timbrado" value={errorTimbrado} icon={AlertTriangle} color="bg-destructive/10 text-destructive" link="/timbrado" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="widget-card">
          <h3 className="section-title">Contratos activos</h3>
          <p className="text-3xl font-bold text-primary">{totalContratos}</p>
          <p className="text-xs text-muted-foreground mt-1">Total en el sistema</p>
        </div>
        <div className="widget-card">
          <h3 className="section-title">Pre-facturas</h3>
          <p className="text-3xl font-bold text-accent">{preFacturas.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Generadas este periodo</p>
        </div>
        <div className="widget-card">
          <h3 className="section-title">Pagos registrados</h3>
          <p className="text-3xl font-bold text-success">{pagos.length}</p>
          <p className="text-xs text-muted-foreground mt-1">En el mes actual</p>
        </div>
      </div>

      <div>
        <h2 className="section-title">Accesos rápidos</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction label="Nueva factibilidad" icon={Plus} to="/factibilidades?new=1" />
          <QuickAction label="Nuevo contrato" icon={FileText} to="/contratos?new=1" />
          <QuickAction label="Simulador" icon={Calculator} to="/simulador" />
          <QuickAction label="Monitor de timbrado" icon={Stamp} to="/timbrado" />
        </div>
      </div>

      {/* Recent contracts */}
      <div className="mt-8">
        <h2 className="section-title">Contratos recientes</h2>
        <div className="rounded-lg border overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Titular</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              {contratos.slice(0, 5).map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs">{c.id}</td>
                  <td>{c.nombre}</td>
                  <td>{c.tipoContrato} / {c.tipoServicio}</td>
                  <td><StatusBadge status={c.estado} /></td>
                  <td className="text-muted-foreground">{c.fecha}</td>
                </tr>
              ))}
              {contratos.length === 0 && (
                <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No hay contratos registrados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
