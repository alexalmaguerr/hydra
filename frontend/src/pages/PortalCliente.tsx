import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams, useOutletContext, useNavigate } from 'react-router-dom';
import {
  getPortalConsumos,
  getPortalTimbrados,
  getPortalPagos,
  getPortalSaldos,
  type PortalConsumo,
  type PortalTimbrado,
  type PortalPago,
  type PortalSaldos,
} from '@/api/portal';
import type { PortalContextValue } from '@/components/PortalLayout';
import {
  FileText,
  BarChart3,
  Receipt,
  CreditCard,
  Building2,
  UserPlus,
  PowerOff,
  UserMinus,
  Plug,
  FilePlus,
  BadgePercent,
  Download,
  Calendar,
  RefreshCw,
  Phone,
  MessageCircle,
  ChevronRight,
  Lock,
  AlertCircle,
  Plus,
  HelpCircle,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function Breadcrumb({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-4">
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />}
          {item.onClick ? (
            <button onClick={item.onClick} className="hover:text-blue-600 transition-colors">
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? 'text-gray-700 font-medium' : ''}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pagada: 'bg-green-100 text-green-700',
    Pendiente: 'bg-yellow-100 text-yellow-700',
    Vencida: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

// ─── Tab values ─────────────────────────────────────────────────────────────

const TAB_VALUES = ['inicio', 'consumo', 'facturas', 'recibos', 'metodos-pago', 'tramites-digitales'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTab(s: string | null): s is TabValue {
  return s !== null && (TAB_VALUES as readonly string[]).includes(s);
}

// ─── Main component ──────────────────────────────────────────────────────────

const PortalCliente = () => {
  const { contratos, contratoId, loadingContratos } = useOutletContext<PortalContextValue>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabFromUrl = searchParams.get('tab');
  const activeTab: TabValue = isTab(tabFromUrl) ? tabFromUrl : 'inicio';

  const setTab = useCallback(
    (tab: TabValue) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', tab);
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  // Per-tab data
  const [consumos, setConsumos] = useState<PortalConsumo[]>([]);
  const [timbrados, setTimbrados] = useState<PortalTimbrado[]>([]);
  const [pagos, setPagos] = useState<PortalPago[]>([]);
  const [saldos, setSaldos] = useState<PortalSaldos>({ vencido: 0, vigente: 0, total: 0, intereses: 0 });
  const [loadingData, setLoadingData] = useState(false);

  // Search/filter state
  const [folioSearch, setFolioSearch] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [recibosSubtab, setRecibosSubtab] = useState<'recientes' | 'historico' | 'pendientes' | 'facturas'>('recientes');

  useEffect(() => {
    if (!contratoId) return;
    setLoadingData(true);
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
    }).finally(() => setLoadingData(false));
  }, [contratoId]);

  const contrato = useMemo(
    () => (contratoId ? contratos.find((c) => c.id === contratoId) ?? null : null),
    [contratos, contratoId]
  );

  const loading = loadingContratos || loadingData;

  // Derived: facturas rows
  const facturasRows = useMemo(() => {
    const hoy = new Date().toISOString().split('T')[0];
    return timbrados.map((t) => {
      const recibo = t.recibos?.[0];
      const saldoVigente = recibo ? Number(recibo.saldoVigente) : 0;
      const saldoVencido = recibo ? Number(recibo.saldoVencido) : 0;
      const saldo = saldoVigente + saldoVencido;
      const vencimiento = recibo?.fechaVencimiento ?? t.fechaVencimiento;
      const estado = saldo <= 0 ? 'Pagada' : vencimiento && vencimiento < hoy ? 'Vencida' : 'Pendiente';
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

  const facturasFiltradas = useMemo(() => {
    return facturasRows.filter((f) => {
      const matchFolio = folioSearch === '' || f.id.toLowerCase().includes(folioSearch.toLowerCase());
      const matchEstado = filtroEstado === 'todos' || f.estado === filtroEstado;
      return matchFolio && matchEstado;
    });
  }, [facturasRows, folioSearch, filtroEstado]);

  const ultimaFactura = facturasRows[0] ?? null;

  const consumosRows = useMemo(
    () => consumos.map((c) => ({
      id: c.id,
      periodoDisplay: c.periodo ? c.periodo.replace(/-(\d{2})$/, '/$1') : '—',
      m3: Number(c.m3),
      tipo: c.tipo,
    })),
    [consumos]
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading && !contrato) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Cargando información…</p>
        </div>
      </div>
    );
  }

  if (!contrato && !loadingContratos) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500">Seleccione un contrato para continuar.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── INICIO ─────────────────────────────────────────────────────────── */}
      {activeTab === 'inicio' && (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bienvenido, {contrato?.nombre ?? '—'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Consulta tu consumo, facturas, pagos y gestiona tus trámites desde aquí.
            </p>
          </div>

          {/* Saldos */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Vencido', value: saldos.vencido, color: 'text-red-600' },
              { label: 'Vigente', value: saldos.vigente, color: 'text-green-600' },
              { label: 'Total', value: saldos.total, color: 'text-gray-900' },
              { label: 'Intereses', value: saldos.intereses, color: 'text-gray-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
                <p className={`text-2xl font-bold tabular-nums ${color}`}>{fmt(value)}</p>
                <p className="text-xs text-gray-400 mt-0.5">MXN</p>
              </div>
            ))}
          </div>

          {/* Payment instructions */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Instrucciones de pago</h3>
            <ol className="space-y-1 text-sm text-gray-600 list-decimal list-inside">
              <li>Banco: Banco Acme</li>
              <li>Número de cuenta: XXX (referencia por contrato)</li>
            </ol>
          </div>

          {/* Quick actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Ver mis facturas', tab: 'facturas' as TabValue, icon: FileText, desc: 'Historial y estado de tus facturas' },
              { label: 'Mis recibos', tab: 'recibos' as TabValue, icon: Receipt, desc: 'Pagos realizados y comprobantes' },
              { label: 'Trámites digitales', tab: 'tramites-digitales' as TabValue, icon: BarChart3, desc: 'Solicitudes y gestión de servicio' },
            ].map(({ label, tab, icon: Icon, desc }) => (
              <button
                key={tab}
                onClick={() => setTab(tab)}
                className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition-all group"
              >
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <Icon className="h-5 w-5 text-blue-600" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" aria-hidden />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CONSUMO ────────────────────────────────────────────────────────── */}
      {activeTab === 'consumo' && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: 'Portal', onClick: () => setTab('inicio') }, { label: 'Consumo' }]} />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mi Consumo</h1>
            <p className="mt-1 text-sm text-gray-500">Historial de lecturas de consumo de agua potable.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Periodo</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Consumo (m³)</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {consumosRows.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-10 text-center text-gray-400 text-sm">
                      No hay consumos registrados para este contrato.
                    </td>
                  </tr>
                ) : (
                  consumosRows.map((r) => (
                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-medium text-gray-800">{r.periodoDisplay}</td>
                      <td className="px-5 py-4 text-right tabular-nums text-gray-700">{r.m3}</td>
                      <td className="px-5 py-4 text-gray-500">{r.tipo}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FACTURAS ───────────────────────────────────────────────────────── */}
      {activeTab === 'facturas' && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: 'Portal de Clientes', onClick: () => setTab('inicio') }, { label: 'Mis Facturas' }]} />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Facturas</h1>
              <p className="mt-1 text-sm text-gray-500">Gestiona tus pagos y descarga tus comprobantes fiscales digitales.</p>
            </div>
          </div>

          {/* Summary banner */}
          {ultimaFactura && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
                <div className="p-6 sm:w-56 shrink-0">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">Estado de Cuenta</p>
                  <p className="text-4xl font-bold text-gray-900 tabular-nums">{fmt(saldos.total)}</p>
                  {saldos.vencido > 0 ? (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                      <AlertCircle className="h-3 w-3" aria-hidden /> Pendiente de Pago
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      Al corriente
                    </span>
                  )}
                </div>
                <div className="p-6 flex-1">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-base font-semibold text-gray-900">Última Factura Generada</p>
                      <p className="text-sm text-gray-500 mt-0.5">Periodo: {ultimaFactura.periodoDisplay}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha de Vencimiento</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{ultimaFactura.vencimiento}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5 flex-wrap">
                    <button
                      disabled
                      className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
                    >
                      <CreditCard className="h-4 w-4" aria-hidden />
                      Pagar Ahora
                    </button>
                    <button
                      disabled
                      className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                      Descargar PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Historial */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 mr-1">
                <RefreshCw className="h-4 w-4 text-blue-600" aria-hidden />
                <h2 className="text-base font-semibold text-gray-900">Historial de Facturación</h2>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por folio..."
                    value={folioSearch}
                    onChange={(e) => setFolioSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="Pagada">Pagada</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Vencida">Vencida</option>
                </select>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Folio</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha de Emisión</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Periodo</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Monto</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {facturasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">
                      No hay facturas para mostrar.
                    </td>
                  </tr>
                ) : (
                  facturasFiltradas.map((f) => (
                    <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 font-mono text-blue-600 font-medium">{f.id}</td>
                      <td className="px-5 py-4 text-gray-600">{f.fechaFac}</td>
                      <td className="px-5 py-4 text-blue-500 font-medium">{f.periodoDisplay}</td>
                      <td className="px-5 py-4 text-right tabular-nums font-semibold text-gray-800">{fmt(f.importe)}</td>
                      <td className="px-5 py-4"><StatusPill status={f.estado} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button disabled title="Descargar PDF" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 opacity-40 cursor-not-allowed">
                            <FileText className="h-4 w-4" aria-hidden />
                          </button>
                          <button disabled title="Ver XML" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400 opacity-40 cursor-not-allowed">
                            <span className="text-[10px] font-bold">&lt;/&gt;</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {facturasFiltradas.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Mostrando 1-{facturasFiltradas.length} de {facturasFiltradas.length} facturas</span>
                <div className="flex items-center gap-1">
                  <button disabled className="px-2 py-1 rounded text-gray-300 cursor-not-allowed">&lt;</button>
                  <button className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold">1</button>
                  <button disabled className="px-2 py-1 rounded text-gray-300 cursor-not-allowed">&gt;</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── RECIBOS ────────────────────────────────────────────────────────── */}
      {activeTab === 'recibos' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Mis Recibos</h1>
              <p className="mt-1 text-sm text-gray-500">Gestiona y visualiza tu historial de pagos del servicio de agua potable.</p>
            </div>
            <button
              disabled
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nuevo Pago
            </button>
          </div>

          {/* Sub-tabs pill */}
          <div className="bg-white border border-gray-200 rounded-xl p-1.5 flex gap-1">
            {(['recientes', 'historico', 'pendientes', 'facturas'] as const).map((st) => {
              const labels = { recientes: 'Recientes', historico: 'Histórico', pendientes: 'Pendientes', facturas: 'Facturas' };
              return (
                <button
                  key={st}
                  onClick={() => setRecibosSubtab(st)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${
                    recibosSubtab === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {labels[st]}
                </button>
              );
            })}
          </div>

          {/* Table */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Concepto</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Forma de Pago</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Monto</th>
                  <th className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-400 text-sm">
                      No hay recibos registrados para este contrato.
                    </td>
                  </tr>
                ) : (
                  pagos.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                            <Calendar className="h-4 w-4 text-blue-500" aria-hidden />
                          </div>
                          <span className="tabular-nums text-gray-700">{p.fecha}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-800">{p.concepto}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <CreditCard className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                          {p.tipo}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums font-semibold text-gray-800">
                        {fmt(Number(p.monto))}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button disabled className="flex items-center gap-1.5 text-blue-600 text-sm font-medium opacity-40 cursor-not-allowed ml-auto">
                          <Download className="h-4 w-4" aria-hidden />
                          Descargar
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {pagos.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
                <span>Mostrando {pagos.length} de {pagos.length} recibos</span>
                <div className="flex items-center gap-1">
                  <button disabled className="px-2 py-1 rounded text-gray-300 cursor-not-allowed">&lt;</button>
                  <button className="px-3 py-1 rounded-md bg-blue-600 text-white text-xs font-semibold">1</button>
                  <button disabled className="px-2 py-1 rounded text-gray-300 cursor-not-allowed">&gt;</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MÉTODOS DE PAGO ────────────────────────────────────────────────── */}
      {activeTab === 'metodos-pago' && (
        <div className="space-y-6">
          <Breadcrumb items={[{ label: 'Inicio', onClick: () => setTab('inicio') }, { label: 'Gestión de Pagos' }]} />
          <h1 className="text-3xl font-bold text-gray-900">Métodos de Pago</h1>
          <p className="text-sm text-gray-500 -mt-4">Administra tus tarjetas y servicios de domiciliación bancaria de forma segura.</p>

          {/* Cards grid */}
          <div className="grid lg:grid-cols-2 gap-5">
            {/* Tarjetas */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-blue-600" aria-hidden />
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Tarjetas de Crédito y Débito</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Usa tus tarjetas para pagos manuales o programados.</p>
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-1.5 text-sm font-semibold border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg opacity-50 cursor-not-allowed hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden />
                  Añadir
                </button>
              </div>
              <div className="flex-1 px-5 py-8 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                  <CreditCard className="h-7 w-7 text-gray-400" aria-hidden />
                </div>
                <p className="text-sm font-medium text-gray-600">No tienes tarjetas registradas</p>
                <p className="text-xs text-gray-400 mt-1">Añade una tarjeta para realizar pagos en línea</p>
              </div>
              <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-1.5 text-xs text-gray-400">
                <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Tus datos están protegidos con encriptación bancaria de 256 bits.
              </div>
            </div>

            {/* Domiciliación */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" aria-hidden />
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">Domiciliación Bancaria</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Configura el cargo automático a tu cuenta de cheques o ahorros.</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 px-5 py-6 flex flex-col items-center justify-center text-center">
                <div className="h-14 w-14 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                  <RefreshCw className="h-7 w-7 text-blue-400" aria-hidden />
                </div>
                <p className="text-sm font-semibold text-gray-800">Ahorra tiempo y evita recargos</p>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  Al activar la domiciliación, tus recibos se pagarán automáticamente en la fecha de vencimiento.
                </p>
                <div className="mt-4 w-full border border-dashed border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-gray-500">Estado del servicio:</span>
                    <span className="text-xs font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded">INACTIVO</span>
                  </div>
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-lg text-sm font-semibold opacity-50 cursor-not-allowed"
                  >
                    <span className="text-base">⚙</span>
                    Configurar Domiciliación
                  </button>
                </div>
              </div>
              <div className="mx-5 mb-4 flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5">
                <AlertCircle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" aria-hidden />
                <p className="text-xs text-yellow-700">
                  Recuerda que debes tener una tarjeta o CLABE registrada para activar este servicio.
                </p>
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-600" aria-hidden />
              <h2 className="text-base font-semibold text-gray-900">Actividad Reciente</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Fecha</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Acción</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">Método</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-400">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-gray-400 text-sm">
                    No hay actividad reciente registrada.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TRÁMITES DIGITALES ─────────────────────────────────────────────── */}
      {activeTab === 'tramites-digitales' && (
        <div className="space-y-8">
          <Breadcrumb items={[{ label: 'Portal CEA', onClick: () => setTab('inicio') }, { label: 'Trámites Digitales' }]} />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Trámites Digitales</h1>
              <p className="mt-1 text-sm text-gray-500 max-w-lg">
                Gestiona tus servicios de agua potable, alcantarillado y saneamiento de manera eficiente y segura desde cualquier lugar.
              </p>
            </div>
            <button
              disabled
              className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium opacity-60 cursor-not-allowed"
            >
              <HelpCircle className="h-4 w-4" aria-hidden />
              Guía de Trámites
            </button>
          </div>

          {/* CONTRATOS */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-6 bg-blue-50 rounded flex items-center justify-center shrink-0">
                <FileText className="h-3.5 w-3.5 text-blue-600" aria-hidden />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Contratos</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: FilePlus, title: 'Alta de Contrato', desc: 'Solicita un nuevo servicio de agua potable para uso doméstico o comercial.', cta: 'Iniciar trámite', active: false },
                { icon: UserPlus, title: 'Cambio de Propietario', desc: 'Actualiza los datos del titular del contrato por compra-venta o herencia.', cta: 'Iniciar trámite', active: true, href: '/portal/tramites/cambio-propietario' },
                { icon: PowerOff, title: 'Baja Temporal', desc: 'Suspende el servicio por un período definido sin cancelar el contrato.', cta: 'Iniciar trámite', active: true, href: '/portal/tramites/baja-temporal' },
                { icon: UserMinus, title: 'Baja Permanente', desc: 'Cancelación definitiva del contrato de suministro y retiro de medidor.', cta: 'Iniciar trámite', active: true, href: '/portal/tramites/baja-definitiva' },
              ].map(({ icon: Icon, title, desc, cta, active, href }) => (
                <div key={title} className={`bg-white border rounded-xl p-5 flex flex-col gap-3 transition-colors ${active ? 'border-gray-200 hover:border-blue-300 hover:shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>
                  <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <Icon className="h-5 w-5 text-gray-600" aria-hidden />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{desc}</p>
                  </div>
                  {active ? (
                    <button
                      onClick={() => navigate(href!)}
                      className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:gap-2 transition-all"
                    >
                      {cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  ) : (
                    <button disabled className="flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-30 cursor-not-allowed">
                      {cta} <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* DESCUENTOS */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-6 bg-blue-50 rounded flex items-center justify-center shrink-0">
                <BadgePercent className="h-3.5 w-3.5 text-blue-600" aria-hidden />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Descuentos</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <BadgePercent className="h-5 w-5 text-gray-600" aria-hidden />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Jubilado / Pensionado</h3>
                  <p className="text-xs text-gray-500 mt-1">Solicitud de tarifa especial para adultos mayores o personas jubiladas.</p>
                </div>
                <button disabled className="flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-50 cursor-not-allowed">
                  Aplicar ahora <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </section>

          {/* SOLICITUDES */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-6 w-6 bg-blue-50 rounded flex items-center justify-center shrink-0">
                <Receipt className="h-3.5 w-3.5 text-blue-600" aria-hidden />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-700">Solicitudes</h2>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-300 transition-colors">
                <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Plug className="h-5 w-5 text-gray-600" aria-hidden />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">Reconexión</h3>
                  <p className="text-xs text-gray-500 mt-1">Solicita la reactivación del servicio tras haber cubierto adeudos pendientes.</p>
                </div>
                <button disabled className="flex items-center gap-1 text-sm font-semibold text-blue-600 opacity-50 cursor-not-allowed">
                  Solicitar <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
            </div>
          </section>

          {/* Help banner */}
          <div className="bg-blue-600 rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="text-white">
              <h2 className="text-xl font-bold">¿Necesitas ayuda con tu trámite?</h2>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider mt-1">Nuestro agente usa inteligencia artificial</p>
              <p className="text-blue-100 text-sm mt-2">
                María está especializada en trámites de agua potable, alcantarillado y saneamiento. Te guía paso a paso, resuelve tus dudas y procesa tus solicitudes al instante.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 shrink-0">
              <a
                href="https://wa.me/524424700013"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white text-blue-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors shadow-sm"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
                Habla con María
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortalCliente;
