import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ChevronDown, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { groupRoutesBySection, routesForRole } from '@/config/routes';

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const toggleGroup = (label: string) => {
    setCollapsed((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Build sidebar groups filtered by the current user's role
  const visibleRoutes = user ? routesForRole(user.role) : [];
  const navGroups = groupRoutesBySection(visibleRoutes);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-60' : 'w-0'} flex-shrink-0 bg-sidebar text-sidebar-foreground transition-all duration-200 overflow-hidden`}
      >
        <div className="flex h-full w-60 flex-col">
          {/* Brand */}
          <div className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border">
            <svg
              className="h-7 w-7 text-sidebar-primary"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z" />
            </svg>
            <div>
              <h1 className="text-sm font-bold text-sidebar-accent-foreground">CEA Querétaro</h1>
              <p className="text-[10px] text-sidebar-muted">Sistema de Gestión</p>
            </div>
          </div>

          {/* Nav */}
          <nav className="sidebar-nav flex-1 overflow-y-auto py-2 px-2">
            {navGroups.map((group) => (
              <div key={group.label} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.label)}
                  className="flex w-full items-center justify-between px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground"
                >
                  {group.label}
                  <ChevronDown
                    className={`h-3 w-3 transition-transform ${collapsed[group.label] ? '-rotate-90' : ''}`}
                  />
                </button>
                {!collapsed[group.label] &&
                  group.items.map((item) => {
                    const routePath =
                      item.path === 'tramites-digitales-admin'
                        ? '/tramites-digitales'
                        : `/app/${item.path}`;
                    return (
                      <NavLink
                        key={item.path}
                        to={routePath}
                        end={item.path === 'dashboard'}
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
                    );
                  })}
              </div>
            ))}
          </nav>

          {/* User info + logout */}
          <div className="border-t border-sidebar-border px-3 py-3">
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <User className="h-4 w-4 text-sidebar-muted shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user?.name ?? '—'}
                </p>
                <p className="text-[10px] text-sidebar-muted truncate">{user?.role ?? ''}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                className="rounded p-1 text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b bg-card px-4 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-md p-1.5 hover:bg-muted"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="text-sm font-medium text-muted-foreground">
            Sistema de Gestión Comercial
          </span>
        </header>
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
