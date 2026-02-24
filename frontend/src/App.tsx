import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/context/DataContext";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Factibilidades from "@/pages/Factibilidades";
import Construcciones from "@/pages/Construcciones";
import Tomas from "@/pages/Tomas";
import Contratos from "@/pages/Contratos";
import Medidores from "@/pages/Medidores";
import Rutas from "@/pages/Rutas";
import Lecturas from "@/pages/Lecturas";
import Consumos from "@/pages/Consumos";
import Tarifas from "@/pages/Tarifas";
import Simulador from "@/pages/Simulador";
import PreFacturacion from "@/pages/PreFacturacion";
import TimbradoPage from "@/pages/TimbradoPage";
import Recibos from "@/pages/Recibos";
import Pagos from "@/pages/Pagos";
import Contabilidad from "@/pages/Contabilidad";
import AtencionClientes from "@/pages/AtencionClientes";
import AjustesFacturacion from "@/pages/AjustesFacturacion";
import TramitesDigitales from "@/pages/TramitesDigitales";
import PortalLayout from "@/components/PortalLayout";
import PortalCliente from "@/pages/PortalCliente";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/portal" element={<PortalLayout />}>
              <Route index element={<PortalCliente />} />
            </Route>
            <Route path="/tramites-digitales" element={<PortalLayout />}>
              <Route index element={<TramitesDigitales />} />
            </Route>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/factibilidades" element={<Factibilidades />} />
              <Route path="/construcciones" element={<Construcciones />} />
              <Route path="/tomas" element={<Tomas />} />
              <Route path="/contratos" element={<Contratos />} />
              <Route path="/medidores" element={<Medidores />} />
              <Route path="/rutas" element={<Rutas />} />
              <Route path="/lecturas" element={<Lecturas />} />
              <Route path="/consumos" element={<Consumos />} />
              <Route path="/tarifas" element={<Tarifas />} />
              <Route path="/simulador" element={<Simulador />} />
              <Route path="/prefacturacion" element={<PreFacturacion />} />
              <Route path="/ajustes-facturacion" element={<AjustesFacturacion />} />
              <Route path="/timbrado" element={<TimbradoPage />} />
              <Route path="/recibos" element={<Recibos />} />
              <Route path="/pagos" element={<Pagos />} />
              <Route path="/contabilidad" element={<Contabilidad />} />
              <Route path="/atencion-clientes" element={<AtencionClientes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
