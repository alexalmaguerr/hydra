import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import StatusBadge from '@/components/StatusBadge';
import {
  FileText,
  BarChart3,
  Receipt,
  Upload,
  CreditCard,
  LayoutDashboard,
  Building2,
  UserPlus,
  PowerOff,
  UserMinus,
  Plug,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const TAB_VALUES = ['dashboard', 'consumos', 'facturas', 'recibos', 'metodos-pago', 'tramites-digitales'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(s: string | null): s is TabValue {
  return s !== null && TAB_VALUES.includes(s as TabValue);
}

const PortalCliente = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    contratos,
    recibos,
    timbrados,
    preFacturas,
    consumos,
    pagos,
  } = useData();

  const contratoFromUrl = searchParams.get('contrato');
  const [contratoId, setContratoId] = useState<string | null>(() => {
    if (contratoFromUrl && contratos.some((c) => c.id === contratoFromUrl))
      return contratoFromUrl;
    return contratos[0]?.id ?? null;
  });

  const tabFromUrl = searchParams.get('tab');
  const activeTab = isTabValue(tabFromUrl) ? tabFromUrl : 'dashboard';
  const setActiveTab = useCallback(
    (value: string) => {
      if (!isTabValue(value)) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', value);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    if (contratos.length && !contratoId) {
      setContratoId(contratos[0].id);
    }
  }, [contratos, contratoId]);

  useEffect(() => {
    const c = searchParams.get('contrato');
    if (c && contratos.some((x) => x.id === c) && c !== contratoId) {
      setContratoId(c);
    }
  }, [searchParams, contratos, contratoId]);

  const contrato = useMemo(
    () => (contratoId ? contratos.find((c) => c.id === contratoId) ?? null : null),
    [contratos, contratoId]
  );

  const handleContratoChange = (id: string) => {
    setContratoId(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('contrato', id);
        return next;
      },
      { replace: true }
    );
  };

  const saldos = useMemo(() => {
    if (!contratoId) return { vencido: 0, vigente: 0, total: 0 };
    const recs = recibos.filter((r) => r.contratoId === contratoId);
    const vencido = recs.reduce((s, r) => s + r.saldoVencido, 0);
    const vigente = recs.reduce((s, r) => s + r.saldoVigente, 0);
    return { vencido, vigente, total: vencido + vigente };
  }, [contratoId, recibos]);

  const facturasRows = useMemo(() => {
    if (!contratoId) return [];
    const hoy = new Date().toISOString().split('T')[0];
    return timbrados
      .filter((t) => t.contratoId === contratoId)
      .map((t) => {
        const recibo = recibos.find((r) => r.timbradoId === t.id);
        const pf = preFacturas.find((p) => p.id === t.preFacturaId);
        const total = recibo ? recibo.saldoVigente + recibo.saldoVencido : pf?.total ?? 0;
        const saldoVigente = recibo?.saldoVigente ?? 0;
        const saldoVencido = recibo?.saldoVencido ?? 0;
        const saldo = saldoVigente + saldoVencido;
        const periodo = pf?.periodo ?? '';
        const periodoDisplay = periodo ? periodo.replace(/-(\d{2})$/, '/$1') : '—';
        const vencimiento = recibo?.fechaVencimiento ?? '';
        const estado =
          saldo <= 0
            ? 'Pagada'
            : vencimiento && vencimiento < hoy
              ? 'Vencida'
              : 'Pendiente';
        return {
          idFactura: t.id,
          periodo,
          periodoDisplay,
          fechaFac: t.fecha,
          vencimiento: vencimiento || '—',
          noFactura: `W12024A101119952`,
          importe: total,
          saldo,
          estado,
          uuid: t.uuid,
        };
      })
      .sort((a, b) => (b.periodo ?? '').localeCompare(a.periodo ?? ''));
  }, [contratoId, timbrados, recibos, preFacturas]);

  const facturasFiltroNoPagadas = useMemo(
    () => facturasRows.filter((f) => f.saldo > 0),
    [facturasRows]
  );

  const [filtroFacturas, setFiltroFacturas] = useState<'todas' | 'no-pagadas'>('todas');
  const facturasMostradas =
    filtroFacturas === 'no-pagadas' ? facturasFiltroNoPagadas : facturasRows;

  const consumosRows = useMemo(() => {
    if (!contratoId) return [];
    return consumos
      .filter((c) => c.contratoId === contratoId)
      .map((c) => ({
        id: c.id,
        periodo: c.periodo,
        periodoDisplay: c.periodo ? c.periodo.replace(/-(\d{2})$/, '/$1') : '—',
        m3: c.m3,
        tipo: c.tipo,
      }))
      .sort((a, b) => (b.periodo ?? '').localeCompare(a.periodo ?? ''));
  }, [contratoId, consumos]);

  const pagosRows = useMemo(() => {
    if (!contratoId) return [];
    return pagos
      .filter((p) => p.contratoId === contratoId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [contratoId, pagos]);

  const showContent = contrato != null;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Bienvenido, {contrato?.nombre ?? '—'}
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl">
            En el portal de cliente podrá consultar consumos, facturas y pagos; también podrá
            pagar sus facturas con los métodos de pago habilitados y consultar sus saldos y
            contratos activos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="portal-contrato" className="text-sm font-medium text-muted-foreground">
            Contrato:
          </label>
          <Select
            value={contratoId ?? ''}
            onValueChange={handleContratoChange}
          >
            <SelectTrigger id="portal-contrato" className="w-[200px]">
              <SelectValue placeholder="Seleccione contrato" />
            </SelectTrigger>
            <SelectContent>
              {contratos.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.id} — {c.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="secondary" disabled>
                  Completar datos
                </Button>
              </TooltipTrigger>
              <TooltipContent>Próximamente</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {showContent && (
        <>
          <section
            className="rounded-lg border bg-muted/30 p-4"
            aria-label="Instrucciones de pago"
          >
            <h3 className="text-sm font-semibold text-foreground mb-2">
              Instrucciones de pago
            </h3>
            <p className="text-sm text-muted-foreground">
              1. Banco: Banco Acme
              <br />
              2. Número de cuenta: XXX (referencia por contrato)
            </p>
          </section>

          <section
            className="rounded-lg border bg-card p-4"
            aria-label="Saldos de tus cuentas"
          >
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Saldos de tus cuentas
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Vencido
                </p>
                <p className="text-lg font-semibold tabular-nums text-destructive">
                  {formatCurrency(saldos.vencido)} MXN
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Vigente
                </p>
                <p className="text-lg font-semibold tabular-nums text-green-600 dark:text-green-400">
                  {formatCurrency(saldos.vigente)} MXN
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Total
                </p>
                <p className="text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(saldos.total)} MXN
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Intereses
                </p>
                <p className="text-lg font-semibold tabular-nums text-muted-foreground">
                  {formatCurrency(0)} MXN
                </p>
              </div>
            </div>
          </section>

          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList className="flex flex-wrap h-auto gap-1">
                <TabsTrigger value="dashboard" className="gap-1.5">
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="consumos" className="gap-1.5">
                  <BarChart3 className="h-4 w-4" aria-hidden />
                  Consumos
                </TabsTrigger>
                <TabsTrigger value="facturas" className="gap-1.5">
                  <FileText className="h-4 w-4" aria-hidden />
                  Facturas
                </TabsTrigger>
                <TabsTrigger value="recibos" className="gap-1.5">
                  <Receipt className="h-4 w-4" aria-hidden />
                  Recibos
                </TabsTrigger>
                <TabsTrigger value="metodos-pago" className="gap-1.5">
                  <CreditCard className="h-4 w-4" aria-hidden />
                  Gestión de Métodos de Pago
                </TabsTrigger>
                <TabsTrigger value="tramites-digitales" className="gap-1.5">
                  <ClipboardList className="h-4 w-4" aria-hidden />
                  Trámites Digitales
                </TabsTrigger>
              </TabsList>

              <TabsContent value="dashboard" className="space-y-4">
                <section className="rounded-lg border bg-card p-4" aria-label="Accesos rápidos">
                  <h3 className="text-sm font-semibold text-foreground mb-3">Accesos rápidos</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Desde aquí puede consultar consumos, facturas, recibos, gestionar sus métodos de pago y realizar trámites.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => setActiveTab('consumos')}
                    >
                      <BarChart3 className="h-4 w-4" aria-hidden />
                      Consumos
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => setActiveTab('facturas')}
                    >
                      <FileText className="h-4 w-4" aria-hidden />
                      Facturas
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => setActiveTab('recibos')}
                    >
                      <Receipt className="h-4 w-4" aria-hidden />
                      Recibos
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => setActiveTab('metodos-pago')}
                    >
                      <CreditCard className="h-4 w-4" aria-hidden />
                      Métodos de pago
                    </Button>
                    <Button
                      variant="outline"
                      className="justify-start gap-2"
                      onClick={() => setActiveTab('tramites-digitales')}
                    >
                      <ClipboardList className="h-4 w-4" aria-hidden />
                      Trámites Digitales
                    </Button>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="facturas" className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Select
                      value={filtroFacturas}
                      onValueChange={(v) => setFiltroFacturas(v as 'todas' | 'no-pagadas')}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        <SelectItem value="no-pagadas">No pagadas</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">Creadas en</span>
                    <Select disabled>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Periodo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" disabled>
                          <Upload className="h-4 w-4 mr-1" aria-hidden />
                          Subir comprobante
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" disabled>
                          <CreditCard className="h-4 w-4 mr-1" aria-hidden />
                          Pagar
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Folio</TableHead>
                        <TableHead>Concepto / Periodo</TableHead>
                        <TableHead>Emisión</TableHead>
                        <TableHead>Vencimiento</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="text-right">Saldo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturasMostradas.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                            No hay facturas para mostrar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        facturasMostradas.map((f) => (
                          <TableRow key={f.idFactura}>
                            <TableCell className="font-mono text-primary">{f.idFactura}</TableCell>
                            <TableCell>{f.periodoDisplay}</TableCell>
                            <TableCell>{f.fechaFac}</TableCell>
                            <TableCell>{f.vencimiento}</TableCell>
                            <TableCell>
                              <StatusBadge status={f.estado} />
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(f.importe)}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(f.saldo)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="consumos" className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Periodo</TableHead>
                        <TableHead className="text-right">Consumo (m³)</TableHead>
                        <TableHead>Tipo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumosRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No hay consumos para este contrato.
                          </TableCell>
                        </TableRow>
                      ) : (
                        consumosRows.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.periodoDisplay}</TableCell>
                            <TableCell className="text-right tabular-nums">{r.m3}</TableCell>
                            <TableCell>{r.tipo}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="recibos" className="space-y-4">
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead>Forma de pago</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagosRows.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No hay pagos registrados para este contrato.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagosRows.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="tabular-nums">{p.fecha}</TableCell>
                            <TableCell>{p.concepto}</TableCell>
                            <TableCell>{p.tipo}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(p.monto)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="metodos-pago" className="space-y-4">
                <section className="rounded-lg border bg-card p-4" aria-labelledby="metodos-pago-title">
                  <h3 id="metodos-pago-title" className="text-sm font-semibold text-foreground mb-3">
                    Gestión de Métodos de Pago
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Configure tarjetas de crédito o domiciliación bancaria para pagar sus facturas.
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" aria-hidden />
                        <h4 className="font-medium">Tarjetas de Crédito</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Añada o elimine tarjetas para pago en línea.
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" disabled>
                            Gestionar tarjetas
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Próximamente</TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="rounded-lg border p-4 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" aria-hidden />
                        <h4 className="font-medium">Domiciliación Bancaria</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Configure el cargo automático desde su cuenta bancaria.
                      </p>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="sm" disabled>
                            Gestionar domiciliación
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Próximamente</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="tramites-digitales" className="space-y-4">
                <section className="rounded-lg border bg-card p-4" aria-labelledby="tramites-portal-title">
                  <h3 id="tramites-portal-title" className="text-sm font-semibold text-foreground mb-3">
                    Trámites Digitales para Clientes Activos
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Solicite cambio de propietario, bajas, reconexión o presente quejas y aclaraciones.
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                          <UserPlus className="h-4 w-4" aria-hidden />
                          Cambio de Propietario
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                          <PowerOff className="h-4 w-4" aria-hidden />
                          Baja Temporal
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                          <UserMinus className="h-4 w-4" aria-hidden />
                          Baja Permanente
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                          <Plug className="h-4 w-4" aria-hidden />
                          Solicitud de Reconexión
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                          <MessageSquare className="h-4 w-4" aria-hidden />
                          Quejas y Aclaraciones
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Próximamente</TooltipContent>
                    </Tooltip>
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </>
      )}

      {!showContent && (
        <div className="rounded-lg border bg-muted/30 text-center py-12 text-muted-foreground">
          Seleccione un contrato para ver su información.
        </div>
      )}
    </div>
  );
};

export default PortalCliente;
