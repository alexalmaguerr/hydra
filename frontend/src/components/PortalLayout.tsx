import { Outlet } from 'react-router-dom';
import { Droplets } from 'lucide-react';

const PortalLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <header className="flex-shrink-0 border-b bg-card">
      <div className="flex items-center gap-2 px-4 py-4">
        <Droplets className="h-7 w-7 text-primary" aria-hidden />
        <div>
          <h1 className="text-sm font-bold text-foreground">CEA Querétaro</h1>
          <p className="text-[10px] text-muted-foreground">Portal del Cliente</p>
        </div>
      </div>
    </header>
    <main className="flex-1 overflow-y-auto">
      <Outlet />
    </main>
  </div>
);

export default PortalLayout;
