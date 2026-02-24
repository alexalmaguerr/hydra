import { NavLink, Outlet } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, FileCheck, Building2, Droplets, FileText, Gauge,
  Route, BookOpen, BarChart3, Calculator, FileSearch, Stamp, Printer,
  CreditCard, PieChart, Menu, X, ChevronDown, User, Headphones, SlidersHorizontal,
  Globe, ClipboardList
} from 'lucide-react';
import { useData } from '@/context/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const navGroups = [
  {
    label: 'General',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Infraestructura',
    items: [
      { to: '/factibilidades', icon: FileCheck, label: 'Factibilidades' },
      { to: '/construcciones', icon: Building2, label: 'Construcción' },
      { to: '/tomas', icon: Droplets, label: 'Tomas' },
    ]
  },
  {
    label: 'Servicios',
    items: [
      { to: '/contratos', icon: FileText, label: 'Contratos' },
      { to: '/medidores', icon: Gauge, label: 'Medidores' },
      { to: '/rutas', icon: Route, label: 'Rutas' },
      { to: '/lecturas', icon: BookOpen, label: 'Lecturas' },
    ]
  },
  {
    label: 'Facturación',
    items: [
      { to: '/consumos', icon: BarChart3, label: 'Consumos' },
      { to: '/tarifas', icon: Calculator, label: 'Tarifas' },
      { to: '/simulador', icon: FileSearch, label: 'Simulador' },
      { to: '/prefacturacion', icon: FileSearch, label: 'Pre-Facturación' },
      { to: '/ajustes-facturacion', icon: SlidersHorizontal, label: 'Ajustes facturación' },
      { to: '/timbrado', icon: Stamp, label: 'Timbrado' },
      { to: '/recibos', icon: Printer, label: 'Recibos' },
    ]
  },
  {
    label: 'Finanzas',
    items: [
      { to: '/pagos', icon: CreditCard, label: 'Pagos' },
      { to: '/contabilidad', icon: PieChart, label: 'Contabilidad' },
    ]
  },
  {
    label: 'Interfaces de Cliente',
    items: [
      { to: '/atencion-clientes', icon: Headphones, label: 'Atención a clientes' },
      { to: '/tramites-digitales', icon: ClipboardList, label: 'Trámites Digitales' },
      { to: '/portal', icon: Globe, label: 'Portal de Clientes' },
    ]
  },
];

const MOCK_USERS = [
  { id: 'all', name: 'Todas las zonas', administracionIds: [] as string[], zonaIds: [] as string[] },
  { id: 'U001', name: 'Usuario CEA Norte', administracionIds: ['ADM01'], zonaIds: ['Z001', 'Z002', 'Z003'] },
  { id: 'U002', name: 'Usuario Zibatá', administracionIds: ['ADM02'], zonaIds: ['Z004', 'Z005'] },
];

const AppLayout = () => {
  const { currentUser, setCurrentUser, allowedZonaIds } = useData();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const currentValue = !currentUser ? 'all' : currentUser.id;
  const handleUserChange = (id: string) => {
    const u = MOCK_USERS.find(x => x.id === id);
    if (id === 'all' || !u) setCurrentUser(null);
    else setCurrentUser({ id: u.id, name: u.name, administracionIds: u.administracionIds, zonaIds: u.zonaIds });
  };

  const toggleGroup = (label: string) => {
    setCollapsed(prev => ({ ...prev, [label]: !prev[label] }));
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-60' : 'w-0'} flex-shrink-0 bg-sidebar text-sidebar-foreground transition-all duration-200 overflow-hidden`}>
        <div className="flex h-full w-60 flex-col">
          <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
            <Droplets className="h-7 w-7 text-sidebar-primary" />
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground">CEA Querétaro</h1>
              <p className="text-[10px] text-sidebar-muted">Sistema de Gestión</p>
            </div>
          </div>
          <nav className="sidebar-nav flex-1 overflow-y-auto py-2 px-2">
            {navGroups.map(group => (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground"
                >
                  {group.label}
                  <ChevronDown className={`h-3 w-3 transition-transform ${collapsed[group.label] ? '-rotate-90' : ''}`} />
                </button>
                {!collapsed[group.label] && group.items.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }`
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-md p-1.5 hover:bg-muted">
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-medium text-muted-foreground">Sistema de Gestión Comercial</span>
          <div className="ml-auto flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <Select value={currentValue} onValueChange={handleUserChange}>
              <SelectTrigger className="w-[200px]"><SelectValue placeholder="Acceso" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las zonas</SelectItem>
                {MOCK_USERS.filter(u => u.id !== 'all').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
