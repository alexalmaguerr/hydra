import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Droplets, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const PortalLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/portal/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="flex-shrink-0 border-b bg-card">
        <div className="flex items-center gap-3 px-4 py-3">
          {/* Brand */}
          <NavLink to="/portal" className="flex items-center gap-2 shrink-0">
            <Droplets className="h-6 w-6 text-primary" aria-hidden />
            <div>
              <p className="text-sm font-bold text-foreground leading-none">CEA Querétaro</p>
              <p className="text-[10px] text-muted-foreground">Portal del Cliente</p>
            </div>
          </NavLink>

          {/* User info + logout */}
          {user && (
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-4 w-4 shrink-0" aria-hidden />
                <span className="truncate max-w-[160px]">{user.name}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PortalLayout;
