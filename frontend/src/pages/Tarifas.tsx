import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/context/DataContext';
import { hasApi } from '@/api/client';
import {
  fetchTarifasVigentes,
  calcularMonto,
  fetchActualizaciones,
  crearActualizacion,
  aplicarActualizacion,
} from '@/api/tarifas';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Plus, Calculator, RefreshCw, TrendingUp } from 'lucide-react';

const TIPOS_SERVICIO = ['AGUA', 'SANEAMIENTO', 'ALCANTARILLADO', 'MIXTO'];

const Tarifas = () => {
  const useApi = hasApi();
  const { tarifas: ctxTarifas, descuentos } = useData();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Simulador
  const [simTipo, setSimTipo] = useState('AGUA');
  const [simM3, setSimM3] = useState('');
  const [simResultado, setSimResultado] = useState<{ monto: number; detalle: any[] } | null>(null);
  const [simLoading, setSimLoading] = useState(false);

  // Nueva actualización
  const [showNuevaAct, setShowNuevaAct] = useState(false);
  const [actForm, setActForm] = useState({ nombre: '', factorAjuste: '1.04', fechaAplicacion: '', fuenteOficial: '' });

  const { data: tarifasApi = [] } = useQuery({
    queryKey: ['tarifas-vigentes'],
    queryFn: () => fetchTarifasVigentes(),
    enabled: useApi,
  });

  const { data: actualizaciones = [] } = useQuery({
    queryKey: ['tarifas-actualizaciones'],
    queryFn: fetchActualizaciones,
    enabled: useApi,
  });

  const crearMut = useMutation({
    mutationFn: crearActualizacion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarifas-actualizaciones'] });
      setShowNuevaAct(false);
      setActForm({ nombre: '', factorAjuste: '1.04', fechaAplicacion: '', fuenteOficial: '' });
      toast({ title: 'Actualización creada', description: 'Lista para aplicar cuando sea necesario.' });
    },
  });

  const aplicarMut = useMutation({
    mutationFn: aplicarActualizacion,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tarifas-vigentes'] });
      qc.invalidateQueries({ queryKey: ['tarifas-actualizaciones'] });
      toast({ title: 'Actualización aplicada', description: 'Las tarifas han sido actualizadas.' });
    },
  });

  const handleSimular = async () => {
    if (!simM3 || isNaN(Number(simM3))) return;
    setSimLoading(true);
    try {
      if (useApi) {
        const res = await calcularMonto(simTipo, Number(simM3));
        setSimResultado({ monto: res.monto, detalle: res.detalle ?? [] });
      } else {
        // fallback: cálculo simple con tarifas del context
        const tarifa = ctxTarifas.find(t => Number(simM3) >= t.rangoMin && Number(simM3) <= t.rangoMax);
        const monto = tarifa ? tarifa.cargoFijo + Number(simM3) * tarifa.precioPorM3 : 0;
        setSimResultado({ monto, detalle: [] });
      }
    } finally {
      setSimLoading(false);
    }
  };

  const tarifas = useApi ? tarifasApi : ctxTarifas.map(t => ({
    id: t.id, tipoServicio: t.tipo, rangoMin: t.rangoMin, rangoMax: t.rangoMax,
    precioPorM3: t.precioPorM3, cargoFijo: t.cargoFijo,
    vigenciaDesde: '2026-01-01', vigenciaHasta: null, activo: true,
  }));

  const pctFactor = actualizaciones[0]
    ? `+${((actualizaciones[0].factorAjuste - 1) * 100).toFixed(0)}%`
    : '—';

  return (
    <div>
      <PageHeader
        title="Motor Tarifario"
        subtitle="Gestión de tarifas vigentes, simulador de cálculo y actualizaciones tarifarias."
        breadcrumbs={[{ label: 'Facturación', href: '#' }, { label: 'Tarifas' }]}
        actions={
          <Button onClick={() => setShowNuevaAct(true)} className="bg-[#007BFF] hover:bg-blue-600 text-white">
            <Plus className="w-4 h-4 mr-1.5" /> Nueva actualización
          </Button>
        }
      />

      <div className="grid grid-cols-3 gap-4 mb-6">
        <KpiCard label="Tarifas activas" value={tarifas.length} sub="Esquemas vigentes hoy" />
        <KpiCard label="Descuentos vigentes" value={descuentos.filter(d => d.activo).length} accent="success" />
        <KpiCard
          label="Última actualización"
          value={actualizaciones[0] ? pctFactor : '—'}
          sub={actualizaciones[0]?.nombre ?? 'Sin actualizaciones'}
          accent={actualizaciones.length > 0 ? 'primary' : 'default'}
        />
      </div>

      <Tabs defaultValue="vigentes">
        <TabsList className="mb-4">
          <TabsTrigger value="vigentes">Tarifas vigentes</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
          <TabsTrigger value="actualizaciones">Actualizaciones</TabsTrigger>
          <TabsTrigger value="descuentos">Descuentos</TabsTrigger>
        </TabsList>

        {/* ── Tarifas vigentes ── */}
        <TabsContent value="vigentes">
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  {['Tipo servicio', 'Rango (m³)', '$/m³', 'Cargo fijo', 'Vigencia desde', 'Estado'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tarifas.map(t => (
                  <tr key={t.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium">{t.tipoServicio}</td>
                    <td className="px-4 py-3.5 text-muted-foreground font-mono">{t.rangoMin} – {t.rangoMax === 999 || t.rangoMax >= 999 ? '∞' : t.rangoMax} m³</td>
                    <td className="px-4 py-3.5 font-semibold text-[#003366]">${Number(t.precioPorM3).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">${Number(t.cargoFijo).toFixed(2)}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{t.vigenciaDesde ?? '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={t.activo ? 'Activo' : 'Inactivo'} /></td>
                  </tr>
                ))}
                {tarifas.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted-foreground py-10">No hay tarifas registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Simulador ── */}
        <TabsContent value="simulador">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Calcular monto por consumo
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Tipo de servicio</label>
                  <Select value={simTipo} onValueChange={setSimTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_SERVICIO.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Consumo (m³)</label>
                  <Input
                    type="number"
                    placeholder="Ej. 22"
                    value={simM3}
                    onChange={e => { setSimM3(e.target.value); setSimResultado(null); }}
                  />
                </div>
                <Button
                  onClick={handleSimular}
                  disabled={!simM3 || simLoading}
                  className="w-full bg-[#007BFF] hover:bg-blue-600 text-white"
                >
                  <Calculator className="w-4 h-4 mr-1.5" />
                  {simLoading ? 'Calculando…' : 'Calcular monto'}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-border/50 shadow-sm p-6 flex flex-col items-center justify-center">
              {simResultado ? (
                <div className="text-center w-full">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Monto calculado
                  </p>
                  <p className="text-5xl font-bold font-display text-[#003366] mb-1">
                    ${simResultado.monto.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {simM3} m³ · {simTipo}
                  </p>
                  {simResultado.detalle.length > 0 && (
                    <div className="text-left border rounded-lg overflow-hidden mt-4">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-muted/40">
                            <th className="px-3 py-2 text-left text-muted-foreground">Rango</th>
                            <th className="px-3 py-2 text-right text-muted-foreground">m³</th>
                            <th className="px-3 py-2 text-right text-muted-foreground">Importe</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simResultado.detalle.map((d, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-3 py-2">{d.rango}</td>
                              <td className="px-3 py-2 text-right tabular-nums">{d.m3}</td>
                              <td className="px-3 py-2 text-right tabular-nums font-medium">${d.importe.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Calculator className="w-12 h-12 mx-auto mb-3 opacity-20" />
                  <p className="text-sm">Ingresa el consumo y tipo de servicio para calcular el monto</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Actualizaciones ── */}
        <TabsContent value="actualizaciones">
          <div className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  {['Nombre', 'Factor ajuste', 'Fecha aplicación', 'Fuente oficial', 'Estado', 'Acción'].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actualizaciones.map(a => (
                  <tr key={a.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-medium">{a.nombre}</td>
                    <td className="px-4 py-3.5 font-mono">
                      <span className={`font-semibold ${a.factorAjuste > 1 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        ×{a.factorAjuste} ({a.factorAjuste > 1 ? '+' : ''}{((a.factorAjuste - 1) * 100).toFixed(1)}%)
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">{a.fechaAplicacion?.split('T')[0]}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{a.fuenteOficial ?? '—'}</td>
                    <td className="px-4 py-3.5"><StatusBadge status={a.estado === 'aplicada' ? 'Aprobada' : a.estado === 'pendiente' ? 'Pendiente' : a.estado} /></td>
                    <td className="px-4 py-3.5">
                      {a.estado === 'pendiente' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs border-[#007BFF] text-[#007BFF] hover:bg-[#007BFF]/10"
                          disabled={aplicarMut.isPending}
                          onClick={() => aplicarMut.mutate(a.id)}
                        >
                          <RefreshCw className="w-3 h-3 mr-1" /> Aplicar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
                {actualizaciones.length === 0 && (
                  <tr><td colSpan={6} className="text-center text-muted-foreground py-10">Sin actualizaciones registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Descuentos ── */}
        <TabsContent value="descuentos">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {descuentos.map(d => (
              <div key={d.id} className="bg-white rounded-xl border border-border/50 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{d.nombre}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tipo: {d.tipo}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold font-display text-[#007BFF]">{d.porcentaje}%</p>
                  <div className="mt-1"><StatusBadge status={d.activo ? 'Activo' : 'Inactivo'} /></div>
                </div>
              </div>
            ))}
            {descuentos.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-3 py-8 text-center">Sin descuentos configurados</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog nueva actualización */}
      <Dialog open={showNuevaAct} onOpenChange={setShowNuevaAct}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nueva actualización tarifaria</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Nombre / descripción</label>
              <Input placeholder="Ej. Actualización Q2 2026" value={actForm.nombre} onChange={e => setActForm({ ...actForm, nombre: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Factor de ajuste (1.04 = +4%)</label>
              <Input type="number" step="0.01" min="0.01" value={actForm.factorAjuste} onChange={e => setActForm({ ...actForm, factorAjuste: e.target.value })} />
              {actForm.factorAjuste && (
                <p className="text-xs text-[#007BFF] mt-1">
                  = {actForm.factorAjuste > '1' ? '+' : ''}{((Number(actForm.factorAjuste) - 1) * 100).toFixed(1)}% sobre todas las tarifas
                </p>
              )}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fecha de aplicación</label>
              <Input type="date" value={actForm.fechaAplicacion} onChange={e => setActForm({ ...actForm, fechaAplicacion: e.target.value })} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Fuente oficial (opcional)</label>
              <Input placeholder="Ej. Decreto DOF 2026-04-01" value={actForm.fuenteOficial} onChange={e => setActForm({ ...actForm, fuenteOficial: e.target.value })} />
            </div>
            <Button
              className="w-full bg-[#007BFF] hover:bg-blue-600 text-white mt-2"
              disabled={!actForm.nombre || !actForm.factorAjuste || !actForm.fechaAplicacion || crearMut.isPending}
              onClick={() => crearMut.mutate({
                nombre: actForm.nombre,
                factorAjuste: Number(actForm.factorAjuste),
                fechaAplicacion: actForm.fechaAplicacion,
                fuenteOficial: actForm.fuenteOficial || undefined,
              })}
            >
              <TrendingUp className="w-4 h-4 mr-1.5" />
              {crearMut.isPending ? 'Guardando…' : 'Crear actualización'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tarifas;
