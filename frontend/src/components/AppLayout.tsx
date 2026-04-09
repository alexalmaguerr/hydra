import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Bell, HelpCircle, Grid3X3, Search, LogOut, Settings, Droplets } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { groupRoutesBySection, routesForRole } from '@/config/routes';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Usuario',
  ADMIN: 'Administrador',
  OPERADOR: 'Operador Central',
  LECTURISTA: 'Lecturista',
  ATENCION_CLIENTES: 'Atención Clientes',
  CLIENTE: 'Cliente',
};

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const visibleRoutes = user ? routesForRole(user.role) : [];
  const navGroups = groupRoutesBySection(visibleRoutes);
  const roleLabel = user ? (ROLE_LABELS[user.role] ?? user.role) : '';
  const userInitials = user?.name ? initials(user.name) : 'U';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside
        className="sidebar-nav w-56 flex-shrink-0 flex flex-col overflow-y-auto"
        style={{ background: '#0d1b2e' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 py-4 mb-1">
          <div className="w-8 h-8 rounded-lg bg-[#007BFF] flex items-center justify-center shrink-0">
            <Droplets className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-bold leading-tight truncate">CEA Querétaro</p>
            <p className="text-white/35 text-[9px] uppercase tracking-[0.14em]">Water Management</p>
          </div>
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-1">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-white/30 px-2 mb-1.5">
                {group.label}
              </p>
              {group.items.map((item) => {
                const to =
                  item.path === 'tramites-digitales-admin'
                    ? '/tramites-digitales'
                    : `/app/${item.path}`;
                return (
                  <NavLink
                    key={item.path}
                    to={to}
                    end={item.path === 'dashboard'}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] mb-0.5 transition-colors ${
                        isActive
                          ? 'bg-white/[0.12] text-white font-medium'
                          : 'text-white/55 hover:bg-white/[0.07] hover:text-white'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Bottom: Support + Settings + User */}
        <div className="px-3 pb-4 pt-2 border-t border-white/[0.07]">
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] text-white/45 hover:text-white hover:bg-white/[0.07] transition-colors mb-0.5">
            <HelpCircle className="w-4 h-4 shrink-0" />
            Support
          </button>
          <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-md text-[13px] text-white/45 hover:text-white hover:bg-white/[0.07] transition-colors mb-3">
            <Settings className="w-4 h-4 shrink-0" />
            Settings
          </button>

          {/* User row */}
          <div className="flex items-center gap-2.5 px-2 py-1.5">
            <div className="w-7 h-7 rounded-full bg-[#4A6278] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[12px] font-medium truncate leading-tight">
                {user?.name ?? '—'}
              </p>
              <p className="text-white/35 text-[10px] truncate">{roleLabel}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="text-white/35 hover:text-white transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-14 bg-white border-b border-border/60 flex items-center gap-4 px-6 shrink-0">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              className="w-full pl-9 pr-4 py-2 text-sm bg-muted/50 rounded-lg border border-transparent focus:bg-white focus:border-[#007BFF]/40 focus:ring-2 focus:ring-[#007BFF]/20 outline-none placeholder:text-muted-foreground transition-all"
              placeholder="Buscar expedientes o predios..."
            />
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-0.5 ml-auto">
            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
            <button className="p-2 rounded-lg hover:bg-muted transition-colors">
              <Grid3X3 className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* User chip */}
            <div className="ml-3 flex items-center gap-2.5 pl-3 border-l border-border">
              <div className="text-right leading-tight">
                <p className="text-[13px] font-semibold text-foreground">{user?.name ?? '—'}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {roleLabel}
                </p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#4A6278] flex items-center justify-center text-white text-[12px] font-bold shrink-0">
                {userInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto px-8 py-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
