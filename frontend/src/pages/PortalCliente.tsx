import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  getPortalContratos,
  getPortalConsumos,
  getPortalTimbrados,
  getPortalPagos,
  getPortalSaldos,
  type PortalContrato,
  type PortalConsumo,
  type PortalTimbrado,
  type PortalPago,
  type PortalSaldos,
} from '@/api/portal';
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
  Building2,
  UserPlus,
  PowerOff,
  UserMinus,
  Plug,
  ClipboardList,
  FilePlus,
  BadgePercent,
} from 'lucide-react';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const TAB_VALUES = ['consumos', 'facturas', 'recibos', 'metodos-pago', 'tramites-digitales'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(s: string | null): s is TabValue {
  return s !== null && TAB_VALUES.includes(s as TabValue);
}

const PortalCliente = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [contratos, setContratos] = useState<PortalContrato[]>([]);
  const [consumos, setConsumos] = useState<PortalConsumo[]>([]);
  const [timbrados, setTimbrados] = useState<PortalTimbrado[]>([]);
  const [pagos, setPagos] = useState<PortalPago[]>([]);
  const [saldos, setSaldos] = useState<PortalSaldos>({ vencido: 0, vigente: 0, total: 0, intereses: 0 });
  const [loading, setLoading] = useState(true);

  const [contratoId, setContratoId] = useState<string | null>(
    searchParams.get('contrato') ?? null
  );

  const tabFromUrl = searchParams.get('tab');
  const activeTab = isTabValue(tabFromUrl) ? tabFromUrl : 'consumos';
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

  // Fetch contratos on mount
  useEffect(() => {
    setLoading(true);
    getPortalContratos()
      .then((data) => {
        setContratos(data);
        setContratoId((prev) => {
          if (prev && data.some((c) => c.id === prev)) return prev;
          return data[0]?.id ?? null;
        });
      })
      .catch(() => setContratos([]))
      .finally(() => setLoading(false));
  }, []);

  // Fetch contract data when contratoId changes
  useEffect(() => {
    if (!contratoId) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('contrato', contratoId);
        return next;
      },
      { replace: true }
    );
    Promise.all([
      getPortalConsumos(contratoId),
      getPortalTimbrados(contratoId),
      getPortalPagos(contratoId),
      getPortalSaldos(contratoId),
    ]).then(([c, t, p, s]) => {
      setConsumos(c);
      setTimbrados(t);
      setPagos(p);
      setSaldos(s);
    }).catch(() => {
      setConsumos([]);
      setTimbrados([]);
      setPagos([]);
      setSaldos({ vencido: 0, vigente: 0, total: 0, intereses: 0 });
    });
  }, [contratoId, setSearchParams]);

  const contrato = useMemo(
    () => (contratoId ? contratos.find((c) => c.id === contratoId) ?? null : null),
    [contratos, contratoId]
  );

  const handleContratoChange = (id: string) => {
    setContratoId(id);
  };

  const facturasRows = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return timbrados.map((t) => {
      const recibo = t.recibos?.[0];
      const saldoVigente = recibo ? Number(recibo.saldoVigente) : 0;
      const saldoVencido = recibo ? Number(recibo.saldoVencido) : 0;
      const saldo = saldoVigente + saldoVencido;
      const vencimiento = recibo?.fechaVencimiento ?? t.fechaVencimiento;
      const estado =
        saldo <= 0
          ? 'Pagada'
          : vencimiento && vencimiento < hoy
            ? 'Vencida'
            : 'Pendiente';
      const periodoDisplay = t.periodo ? t.periodo.replace(/-(\d{2})$/, '/$1') : '—';
      return {
        id: t.id,
        periodo: t.periodo,
        periodoDisplay,
        fechaFac: t.fechaEmision,
        vencimiento: vencimiento || '—',
        importe: Number(t.total),
        saldo,
        estado,
        uuid: t.uuid,
      };
    });
  }, [timbrados]);

  const facturasFiltroNoPagadas = useMemo(
    () => facturasRows.filter((f) => f.saldo > 0),
    [facturasRows]
  );

  const [filtroFacturas, setFiltroFacturas] = useState<'todas' | 'no-pagadas'>('todas');
  const facturasMostradas =
    filtroFacturas === 'no-pagadas' ? facturasFiltroNoPagadas : facturasRows;

  const consumosRows = useMemo(() => {
    return consumos.map((c) => ({
      id: c.id,
      periodo: c.periodo,
      periodoDisplay: c.periodo ? c.periodo.replace(/-(\d{2})$/, '/$1') : '—',
      m3: Number(c.m3),
      tipo: c.tipo,
    }));
  }, [consumos]);

  const showContent = !loading && contrato != null;

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
                  {c.id} — {c.tipoServicio}
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

      {loading && (
        <div className="rounded-lg border bg-muted/30 text-center py-12 text-muted-foreground">
          Cargando información del contrato…
        </div>
      )}

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
                  {formatCurrency(saldos.intereses)} MXN
                </p>
              </div>
            </div>
          </section>

          <TooltipProvider>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              {/* Mobile: select */}
              <div className="sm:hidden">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consumos">Consumos</SelectItem>
                    <SelectItem value="facturas">Facturas</SelectItem>
                    <SelectItem value="recibos">Recibos</SelectItem>
                    <SelectItem value="metodos-pago">Gestión de Métodos de Pago</SelectItem>
                    <SelectItem value="tramites-digitales">Trámites Digitales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {/* Desktop: tab bar */}
              <TabsList className="hidden sm:flex flex-wrap h-auto gap-1">
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
                        <TableHead>Periodo</TableHead>
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
                          <TableRow key={f.id}>
                            <TableCell className="font-mono text-primary">{f.id}</TableCell>
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
                      {pagos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                            No hay pagos registrados para este contrato.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagos.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="tabular-nums">{p.fecha}</TableCell>
                            <TableCell>{p.concepto}</TableCell>
                            <TableCell>{p.tipo}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {formatCurrency(Number(p.monto))}
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
                <section className="rounded-lg border bg-card p-4 space-y-6" aria-labelledby="tramites-portal-title">
                  <div>
                    <h3 id="tramites-portal-title" className="text-sm font-semibold text-foreground mb-1">
                      Trámites Digitales
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Solicite altas, cambios, bajas, descuentos y reconexiones desde aquí.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contratos</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                            <FilePlus className="h-4 w-4" aria-hidden />
                            Alta
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Próximamente</TooltipContent>
                      </Tooltip>
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
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descuentos</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                            <BadgePercent className="h-4 w-4" aria-hidden />
                            Jubilado / Pensionado
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Próximamente</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Solicitudes</p>
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" className="justify-start gap-2 h-auto py-3" disabled>
                            <Plug className="h-4 w-4" aria-hidden />
                            Reconexión
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Próximamente</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </TooltipProvider>
        </>
      )}

      {!loading && !showContent && (
        <div className="rounded-lg border bg-muted/30 text-center py-12 text-muted-foreground">
          Seleccione un contrato para ver su información.
        </div>
      )}
    </div>
  );
};

export default PortalCliente;
