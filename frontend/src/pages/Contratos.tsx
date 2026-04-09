import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/context/DataContext';
import { fetchContratos, createContrato, updateContrato, hasApi, type CreateContratoDto } from '@/api/contratos';
import {
  fetchProcesos,
  crearProceso,
  avanzarEtapa,
  cancelarProceso,
  type ProcesoContratacion,
} from '@/api/procesos-contratacion';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Eye, ChevronRight, Hash, User, Droplets, FileText, SlidersHorizontal, Download, TrendingUp, GitBranch } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'react-router-dom';
import { Check, Pencil } from 'lucide-react';

/** Inline editable field for linking/updating the CEA contract number */
function CeaNumInput({ contratoId, initial, onSaved }: { contratoId: string; initial: string; onSaved: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateContrato(contratoId, { ceaNumContrato: value || null });
      onSaved(value);
      setEditing(false);
    } catch {
      // ignore — keep editing open
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <span className="flex items-center gap-1.5">
        <span className="font-mono">{value || '—'}</span>
        <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground">
          <Pencil className="h-3 w-3" />
        </button>
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Ej. 523160"
        className="h-6 text-xs font-mono w-28 py-0 px-1.5"
        autoFocus
        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
      />
      <button onClick={handleSave} disabled={saving} className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50">
        <Check className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

const Contratos = () => {
  const queryClient = useQueryClient();
  const useApi = hasApi();
  const { contratos: contextContratos, tomas, addContrato, allowedZonaIds, timbrados, recibos, preFacturas, pagos } = useData();

  const { data: apiContratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: fetchContratos,
    enabled: useApi,
  });
  const createMutation = useMutation({
    mutationFn: (dto: CreateContratoDto) => createContrato(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos'] }),
  });

  const contratos = useApi
    ? (Array.isArray(apiContratos) ? apiContratos : [])
    : contextContratos;
  const contratosVisibles = useMemo(() =>
    !allowedZonaIds ? contratos : contratos.filter((c: { zonaId?: string }) => c.zonaId && allowedZonaIds.includes(c.zonaId)),
    [contratos, allowedZonaIds]
  );
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [detail, setDetail] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const [form, setForm] = useState({
    tomaId: '', tipoContrato: '' as any, tipoServicio: '' as any,
    nombre: '', rfc: '', direccion: '', contacto: ''
  });

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowWizard(true);
  }, [searchParams]);

  const disponibles = tomas.filter(t => t.estado === 'Disponible');
  const contratoIdsVisibles = useMemo(() => new Set(contratosVisibles.map(c => c.id)), [contratosVisibles]);

  const handleCreate = () => {
    const payload = { ...form, estado: 'Pendiente de alta', fecha: new Date().toISOString().split('T')[0] };
    if (useApi) {
      createMutation.mutate(payload as CreateContratoDto, {
        onSuccess: () => {
          setForm({ tomaId: '', tipoContrato: '', tipoServicio: '', nombre: '', rfc: '', direccion: '', contacto: '' });
          setStep(1);
          setShowWizard(false);
        },
      });
    } else {
      addContrato(payload);
      setForm({ tomaId: '', tipoContrato: '', tipoServicio: '', nombre: '', rfc: '', direccion: '', contacto: '' });
      setStep(1);
      setShowWizard(false);
    }
  };

  const selected = contratosVisibles.find(c => c.id === detail);

  const facturasDesglose = useMemo(() => {
    if (!selected) return { pagadas: [], porCobrar: [], vencidas: [] };
    const facturasContrato = timbrados
      .filter(t => t.contratoId === selected.id)
      .map(t => {
        const recibo = recibos.find(r => r.timbradoId === t.id);
        const pf = preFacturas.find(p => p.id === t.preFacturaId);
        const total = recibo ? recibo.saldoVigente + recibo.saldoVencido : (pf?.total ?? 0);
        const fechaVenc = recibo?.fechaVencimiento ?? '';
        return { timbrado: t, recibo, preFactura: pf, total, fechaVencimiento: fechaVenc };
      })
      .sort((a, b) => (a.preFactura?.periodo ?? '').localeCompare(b.preFactura?.periodo ?? ''));
    const totalPagos = pagos.filter(p => p.contratoId === selected.id).reduce((s, p) => s + p.monto, 0);
    let runningPagos = totalPagos;
    const hoy = new Date().toISOString().split('T')[0];
    const pagadas: typeof facturasContrato = [];
    const porCobrar: typeof facturasContrato = [];
    const vencidas: typeof facturasContrato = [];
    facturasContrato.forEach(f => {
      if (runningPagos >= f.total) {
        pagadas.push(f);
        runningPagos -= f.total;
      } else if (f.fechaVencimiento && f.fechaVencimiento < hoy) {
        vencidas.push(f);
      } else {
        porCobrar.push(f);
      }
    });
    return { pagadas, porCobrar, vencidas };
  }, [selected, timbrados, recibos, preFacturas, pagos]);

  const activos = contratosVisibles.filter((c: { estado: string }) => c.estado === 'Activo').length;
  const pendientesAlta = contratosVisibles.filter((c: { estado: string }) => c.estado === 'Pendiente de alta').length;
  const suspendidos = contratosVisibles.filter((c: { estado: string }) => c.estado === 'Suspendido').length;

  return (
    <div>
      <PageHeader
        title="Contratos"
        subtitle="Gestión centralizada de contratos de servicio hidráulico."
        breadcrumbs={[{ label: 'Servicios', href: '#' }, { label: 'Contratos' }]}
        actions={
          <Button
            onClick={() => { setStep(1); setShowWizard(true); }}
            disabled={disponibles.length === 0}
            className="bg-[#007BFF] hover:bg-blue-600 text-white"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Alta de contrato
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total contratos"
          value={contratosVisibles.length.toLocaleString()}
          sub={<span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="w-3 h-3" /> En el sistema</span>}
        />
        <KpiCard label="Activos" value={activos} accent="success"
          footer={<div className="w-full h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (activos / Math.max(contratosVisibles.length, 1)) * 100)}%` }} /></div>}
        />
        <KpiCard label="Pendientes de alta" value={pendientesAlta} accent={pendientesAlta > 0 ? 'warning' : 'default'} />
        <KpiCard label="Suspendidos" value={suspendidos} accent={suspendidos > 0 ? 'danger' : 'default'} />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm"><SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" /> Filtrar</Button>
        <Button variant="ghost" size="sm" className="text-muted-foreground"><Download className="w-3.5 h-3.5 mr-1.5" /> Exportar CSV</Button>
        <span className="ml-auto text-xs text-muted-foreground font-medium uppercase tracking-wide">
          {contratosVisibles.length} contratos
        </span>
      </div>

      <div className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
        {isLoading && useApi && (
          <div className="p-6 text-center text-muted-foreground text-sm">Cargando contratos…</div>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              {['ID', 'Titular', 'Tipo', 'Servicio', 'Estado', 'Fecha', ''].map((h) => (
                <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contratosVisibles.map((c: { id: string; nombre: string; tipoContrato: string; tipoServicio: string; estado: string; fecha: string }) => (
              <tr key={c.id} className="border-t border-border/50 hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3.5 font-mono text-xs text-[#007BFF] font-medium">{c.id}</td>
                <td className="px-4 py-3.5 font-medium">{c.nombre}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{c.tipoContrato}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{c.tipoServicio}</td>
                <td className="px-4 py-3.5"><StatusBadge status={c.estado} /></td>
                <td className="px-4 py-3.5 text-muted-foreground">{c.fecha}</td>
                <td className="px-4 py-3.5"><Button variant="ghost" size="sm" onClick={() => setDetail(c.id)}><Eye className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {contratosVisibles.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No hay contratos</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Wizard */}
      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Alta de Contrato — Paso {step} de 3</DialogTitle>
            <DialogDescription>
              Asistente para registrar un nuevo contrato de servicio en tres pasos.
            </DialogDescription>
          </DialogHeader>
          
          {/* Step indicators */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={`flex items-center gap-1 ${s <= step ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${s <= step ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>{s}</div>
                <span className="text-xs hidden sm:inline">{s === 1 ? 'Selección' : s === 2 ? 'Datos' : 'Confirmar'}</span>
                {s < 3 && <ChevronRight className="h-4 w-4" />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-3">
              <Select value={form.tomaId} onValueChange={v => setForm({ ...form, tomaId: v })}>
                <SelectTrigger><SelectValue placeholder="Seleccionar toma disponible" /></SelectTrigger>
                <SelectContent>{disponibles.map(t => <SelectItem key={t.id} value={t.id}>{t.id} - {t.ubicacion} ({t.tipo})</SelectItem>)}</SelectContent>
              </Select>
              <Select value={form.tipoContrato} onValueChange={v => setForm({ ...form, tipoContrato: v as any })}>
                <SelectTrigger><SelectValue placeholder="Tipo de contrato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agua">Agua</SelectItem>
                  <SelectItem value="Saneamiento">Saneamiento</SelectItem>
                  <SelectItem value="Alcantarillado">Alcantarillado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.tipoServicio} onValueChange={v => setForm({ ...form, tipoServicio: v as any })}>
                <SelectTrigger><SelectValue placeholder="Tipo de servicio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doméstico">Doméstico</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={() => setStep(2)} disabled={!form.tomaId || !form.tipoContrato || !form.tipoServicio} className="w-full">Siguiente</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              <Input placeholder="RFC" value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value })} />
              <Input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
              <Input placeholder="Contacto (teléfono)" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                <Button onClick={() => setStep(3)} disabled={!form.nombre || !form.rfc} className="flex-1">Siguiente</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
                <h4 className="font-semibold">Resumen del contrato</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div><span className="text-muted-foreground">Toma:</span> {form.tomaId}</div>
                  <div><span className="text-muted-foreground">Contrato:</span> {form.tipoContrato}</div>
                  <div><span className="text-muted-foreground">Servicio:</span> {form.tipoServicio}</div>
                  <div><span className="text-muted-foreground">Titular:</span> {form.nombre}</div>
                  <div><span className="text-muted-foreground">RFC:</span> {form.rfc}</div>
                  <div><span className="text-muted-foreground">Dirección:</span> {form.direccion}</div>
                  <div><span className="text-muted-foreground">Contacto:</span> {form.contacto}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Atrás</Button>
                <Button onClick={handleCreate} className="flex-1" disabled={useApi && createMutation.isPending}>
                  {useApi && createMutation.isPending ? 'Creando…' : 'Crear contrato'}
                </Button>
              </div>
              {useApi && createMutation.isError && (
                <p className="text-sm text-destructive">{createMutation.error?.message ?? 'Error al crear contrato'}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent className="max-w-6xl w-[95vw] h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {selected ? `Contrato ${selected.id}` : 'Detalle de contrato'}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? 'Ficha del contrato con pestañas de información y procesos.'
                : 'No hay contrato seleccionado o no está disponible en la lista actual.'}
            </DialogDescription>
          </DialogHeader>
          {!selected && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No se encontró el contrato en la lista visible. Cierra el panel e inténtalo de nuevo.
            </div>
          )}
          {selected && (() => {
            // Mock data para validación con cliente (campos aún no en BD)
            const mock = {
              tipoCliente: 'Particular',
              consumoPromedio: 8,
              email1: 'titular@ejemplo.com',
              email2: '',
              telFijo: '',
              movil: selected.contacto || '',
              jubilado: false,
              juridica: false,
              administracion: 'CEA Querétaro',
              envioFactura: 'Correo electrónico',
              observaciones: [
                { fecha: selected.fecha, observacion: 'Alta de contrato', usuario: 'SISTEMA' },
              ],
            };

            const todasFacturas = [
              ...facturasDesglose.vencidas,
              ...facturasDesglose.porCobrar,
              ...facturasDesglose.pagadas,
            ];
            const saldoTotal = todasFacturas.reduce((s, f) => {
              const esPagada = facturasDesglose.pagadas.includes(f);
              return s + (esPagada ? 0 : f.total);
            }, 0);

            const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
              <div className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm">
                <span className="text-muted-foreground shrink-0">{label}</span>
                <span className="font-medium text-right">{value}</span>
              </div>
            );

            return (
              <div className="flex h-full overflow-hidden">

                {/* ── Sidebar izquierdo ── */}
                <aside className="w-56 shrink-0 border-r flex flex-col overflow-y-auto bg-muted/10">

                  {/* Identidad */}
                  <div className="p-5 border-b space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-mono text-xl font-bold tracking-tight leading-none">{selected.id}</span>
                      <StatusBadge status={selected.estado} />
                    </div>
                    <p className="font-semibold text-sm leading-snug">{selected.nombre}</p>
                    {selected.rfc && (
                      <p className="text-xs text-muted-foreground font-mono">{selected.rfc}</p>
                    )}
                    {selected.contacto && (
                      <p className="text-xs text-muted-foreground">{selected.contacto}</p>
                    )}
                  </div>

                  {/* Clasificación y fechas */}
                  <div className="p-4 border-b space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-xs">{selected.tipoContrato}</Badge>
                      <Badge variant="secondary" className="text-xs">{selected.tipoServicio}</Badge>
                    </div>
                    <dl className="space-y-1.5 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Alta</dt>
                        <dd className="font-medium tabular-nums">{selected.fecha}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Zona</dt>
                        <dd className="font-medium">{selected.zonaId || '—'}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Toma</dt>
                        <dd className="font-mono font-medium">{selected.tomaId || '—'}</dd>
                      </div>
                    </dl>
                  </div>

                  {/* Estado de cuenta */}
                  <div className="p-4 space-y-1 flex-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Estado de cuenta</p>
                    <dl className="space-y-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Total pendiente</dt>
                        <dd className={`font-medium tabular-nums ${saldoTotal > 0 ? 'text-red-400' : 'text-emerald-500'}`}>${saldoTotal.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Vencidas</dt>
                        <dd className={`font-medium tabular-nums ${facturasDesglose.vencidas.length > 0 ? 'text-red-400' : 'text-muted-foreground'}`}>{facturasDesglose.vencidas.length}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Por cobrar</dt>
                        <dd className="font-medium tabular-nums text-amber-400">{facturasDesglose.porCobrar.length}</dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">Pagadas</dt>
                        <dd className="font-medium tabular-nums text-emerald-500">{facturasDesglose.pagadas.length}</dd>
                      </div>
                    </dl>
                  </div>
                </aside>

                {/* ── Panel derecho con tabs ── */}
                <Tabs defaultValue="general" className="flex flex-col flex-1 min-w-0 overflow-hidden">

                  {/* Tab bar estilo underline */}
                  <div className="shrink-0 border-b px-4 pt-1">
                    <TabsList className="h-auto bg-transparent p-0 gap-0 border-0 flex">
                      {([
                        { value: 'general',     icon: Hash,        label: 'General' },
                        { value: 'titular',     icon: User,        label: 'Titular' },
                        { value: 'servicio',    icon: Droplets,    label: 'Servicio' },
                        { value: 'facturacion', icon: FileText,    label: 'Facturación' },
                        { value: 'historico',   icon: ChevronRight,label: 'Histórico' },
                        { value: 'procesos',    icon: GitBranch,   label: 'Procesos' },
                      ] as const).map(({ value, icon: Icon, label }) => (
                        <TabsTrigger
                          key={value}
                          value={value}
                          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm gap-1.5 -mb-px font-normal data-[state=active]:font-medium"
                        >
                          <Icon className="h-3.5 w-3.5" />{label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </div>

                  {/* Contenido scrollable */}
                  <div className="flex-1 overflow-y-auto p-6">

                    {/* ── General ── */}
                    <TabsContent value="general" className="mt-0 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <section className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Contrato</h3>
                          <div className="rounded-lg border divide-y">
                            <Row label="Estado" value={<StatusBadge status={selected.estado} />} />
                            <Row label="Fecha de alta" value={selected.fecha} />
                            <Row label="Tipo" value={selected.tipoContrato} />
                            <Row label="Servicio" value={selected.tipoServicio} />
                            <Row label="Domiciliado" value={selected.domiciliado ? 'Sí' : 'No'} />
                            {selected.fechaReconexionPrevista && (
                              <Row label="Reconexión prevista" value={selected.fechaReconexionPrevista} />
                            )}
                            <Row
                              label="N° Contrato CEA"
                              value={
                                <CeaNumInput
                                  contratoId={selected.id}
                                  initial={selected.ceaNumContrato ?? ''}
                                  onSaved={(v) => {
                                    // optimistically update local state
                                    (selected as any).ceaNumContrato = v;
                                  }}
                                />
                              }
                            />
                          </div>
                        </section>
                        <section className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Configuración</h3>
                          <div className="rounded-lg border divide-y">
                            <Row label="Administración" value={mock.administracion} />
                            <Row label="Zona" value={selected.zonaId || '—'} />
                            <Row label="Consumo promedio" value={`${mock.consumoPromedio} m³`} />
                            <Row label="Envío de factura" value={mock.envioFactura} />
                            <Row label="Tipo de cliente" value={mock.tipoCliente} />
                            <Row label="Jubilado / Pensionado" value={mock.jubilado ? 'Sí' : 'No'} />
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    {/* ── Titular ── */}
                    <TabsContent value="titular" className="mt-0 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <section className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Datos personales</h3>
                          <div className="rounded-lg border divide-y">
                            <Row label="Nombre completo" value={selected.nombre} />
                            <Row label="RFC" value={<span className="font-mono">{selected.rfc || '—'}</span>} />
                            <Row label="Persona" value={mock.juridica ? 'Jurídica' : 'Física'} />
                            <Row label="Dirección" value={selected.direccion || '—'} />
                          </div>
                        </section>
                        <section className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Contacto</h3>
                          <div className="rounded-lg border divide-y">
                            <Row label="Teléfono fijo" value={mock.telFijo || '—'} />
                            <Row label="Móvil" value={mock.movil || '—'} />
                            <Row label="Email principal" value={mock.email1 || '—'} />
                            <Row label="Email secundario" value={mock.email2 || '—'} />
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    {/* ── Servicio ── */}
                    <TabsContent value="servicio" className="mt-0 space-y-5">
                      <div className="grid grid-cols-2 gap-5">
                        <section className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Punto de servicio</h3>
                          <div className="rounded-lg border divide-y">
                            <Row label="Toma" value={<span className="font-mono">{selected.tomaId || '—'}</span>} />
                            <Row label="Dirección" value={selected.direccion || '—'} />
                            <Row label="Zona" value={selected.zonaId || '—'} />
                            <Row label="Ruta" value={selected.rutaId || 'Sin asignar'} />
                          </div>
                        </section>
                        <section className="space-y-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-0.5">Medidor</h3>
                          <div className="rounded-lg border divide-y">
                            <Row label="ID Medidor" value={<span className="font-mono">{selected.medidorId || 'Sin asignar'}</span>} />
                            <Row label="Serie" value="—" />
                            <Row label="Estado" value="—" />
                            <Row label="Lectura inicial" value="—" />
                          </div>
                        </section>
                      </div>
                    </TabsContent>

                    {/* ── Facturación ── */}
                    <TabsContent value="facturacion" className="mt-0">
                      {todasFacturas.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-12">Sin facturas para este contrato.</p>
                      ) : (
                        <div className="table-container">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/50 border-b">
                                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Periodo</th>
                                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Periodicidad</th>
                                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">F. Factura</th>
                                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Estado</th>
                                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Importe</th>
                                <th className="px-3 py-2.5 text-right font-medium text-muted-foreground">Recargo</th>
                                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Motivo</th>
                                <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Nº Factura</th>
                              </tr>
                            </thead>
                            <tbody>
                              {todasFacturas.map(f => {
                                const esPagada = facturasDesglose.pagadas.includes(f);
                                const esVencida = facturasDesglose.vencidas.includes(f);
                                const estadoLabel = esPagada ? 'COBRADA' : esVencida ? 'VENCIDA' : 'PENDIENTE';
                                const impagada = !esPagada && esVencida;
                                return (
                                  <tr key={f.timbrado.id} className="border-t hover:bg-muted/30 transition-colors">
                                    <td className="px-3 py-2 font-medium">{f.preFactura?.periodo ?? '—'}</td>
                                    <td className="px-3 py-2 text-muted-foreground">MENSUAL</td>
                                    <td className="px-3 py-2 tabular-nums text-muted-foreground">
                                      {f.timbrado.fecha ?? f.fechaVencimiento ?? '—'}
                                    </td>
                                    <td className="px-3 py-2 font-medium">
                                      <span className={impagada ? 'text-red-400/90 dark:text-red-400/80' : 'text-muted-foreground'}>
                                        {estadoLabel}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right tabular-nums font-medium">${f.total.toFixed(2)}</td>
                                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">$0.00</td>
                                    <td className="px-3 py-2 text-muted-foreground">Periódica</td>
                                    <td className="px-3 py-2 font-mono text-muted-foreground">{f.timbrado.uuid || f.timbrado.id}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </TabsContent>

                    {/* ── Histórico ── */}
                    <TabsContent value="historico" className="mt-0">
                      <table className="w-full text-sm border rounded-lg overflow-hidden">
                        <thead>
                          <tr className="bg-muted/50 text-left text-xs">
                            <th className="px-4 py-3 font-medium text-muted-foreground">Fecha</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Observación</th>
                            <th className="px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mock.observaciones.map((o, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-4 py-3 tabular-nums whitespace-nowrap text-muted-foreground">{o.fecha}</td>
                              <td className="px-4 py-3">{o.observacion}</td>
                              <td className="px-4 py-3 text-muted-foreground text-xs font-mono">{o.usuario}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </TabsContent>

                    {/* ── Procesos de contratación ── */}
                    <TabsContent value="procesos" className="mt-0">
                      <ProcesosTab contratoId={selected.id} useApi={useApi} />
                    </TabsContent>

                  </div>
                </Tabs>

              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── ProcesosTab ─────────────────────────────────────────────────────────────

/** Must match backend ETAPAS_FLUJO in procesos-contratacion.service.ts */
const ETAPAS = [
  'solicitud',
  'factibilidad',
  'contrato',
  'instalacion_toma',
  'instalacion_medidor',
  'alta',
];

function etapaLabel(e: string) {
  const labels: Record<string, string> = {
    solicitud: 'Solicitud',
    factibilidad: 'Factibilidad',
    contrato: 'Contrato',
    instalacion_toma: 'Instalación toma',
    instalacion_medidor: 'Instalación medidor',
    alta: 'Alta',
  };
  return labels[e] ?? e;
}

function ProcesosTab({ contratoId, useApi }: { contratoId: string; useApi: boolean }) {
  const queryClient = useQueryClient();
  const [cancelMotivo, setCancelMotivo] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);

  const { data: procesos = [], isLoading, isError, error } = useQuery({
    queryKey: ['procesos', contratoId],
    queryFn: () => fetchProcesos(contratoId),
    enabled: useApi,
    retry: 1,
  });

  const crearMut = useMutation({
    mutationFn: () => crearProceso({ contratoId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procesos', contratoId] }),
  });

  const avanzarMut = useMutation({
    mutationFn: (id: string) => avanzarEtapa(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['procesos', contratoId] }),
  });

  const cancelarMut = useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => cancelarProceso(id, motivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procesos', contratoId] });
      setCancelId(null);
      setCancelMotivo('');
    },
  });

  const MOCK_PROCESO: ProcesoContratacion = {
    id: 'proc-mock-1',
    contratoId,
    tipoContratacionId: null,
    etapaActual: 'factibilidad',
    estado: 'en_curso',
    creadoPor: 'SISTEMA',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    historial: [
      { id: 'h1', procesoId: 'proc-mock-1', etapa: 'solicitud', estado: 'completada', nota: 'Solicitud recibida', fechaInicio: new Date().toISOString(), fechaFin: new Date().toISOString() },
      { id: 'h2', procesoId: 'proc-mock-1', etapa: 'factibilidad', estado: 'en_curso', nota: null, fechaInicio: new Date().toISOString(), fechaFin: null },
    ],
  };

  if (isLoading) {
    return <p className="text-sm text-muted-foreground text-center py-8">Cargando procesos…</p>;
  }

  if (isError) {
    return (
      <div className="text-center py-14 space-y-2">
        <p className="text-sm font-medium text-destructive">Error al cargar procesos</p>
        <p className="text-xs text-muted-foreground">{(error as Error)?.message ?? 'Error desconocido'}</p>
      </div>
    );
  }

  // Empty state — both when API has no data and when no API
  if (procesos.length === 0) {
    return (
      <div className="text-center py-14 text-sm text-muted-foreground space-y-3">
        <GitBranch className="w-10 h-10 mx-auto opacity-20" />
        <p className="font-medium">Sin procesos de contratación</p>
        <p className="text-xs max-w-xs mx-auto">
          Este contrato aún no tiene un proceso formal iniciado. Puedes iniciar uno para dar seguimiento a las etapas de alta.
        </p>
        <Button size="sm" className="bg-[#007BFF] hover:bg-blue-600 text-white mt-2"
          onClick={() => useApi ? crearMut.mutate() : undefined}
          disabled={crearMut.isPending}
        >
          <Plus className="w-3.5 h-3.5 mr-1.5" />
          {crearMut.isPending ? 'Iniciando…' : 'Iniciar proceso'}
        </Button>
        {!useApi && (
          <p className="text-[11px] text-muted-foreground/60 pt-1">Vista previa (sin API conectada)</p>
        )}
      </div>
    );
  }

  const displayProcesos = useApi ? procesos : [MOCK_PROCESO];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{displayProcesos.length} proceso(s) registrado(s)</p>
        {useApi && (
          <Button size="sm" variant="outline" onClick={() => crearMut.mutate()} disabled={crearMut.isPending}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Nuevo proceso
          </Button>
        )}
      </div>

      {displayProcesos.map((proceso) => {
        const etapaIdx = ETAPAS.indexOf(proceso.etapaActual);
        const isCancelado = proceso.estado === 'cancelado';
        const isCompletado = proceso.estado === 'completado';

        return (
          <div key={proceso.id} className="rounded-xl border border-border/50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-muted/20 border-b">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{proceso.id.slice(0, 8)}…</span>
                <StatusBadge status={
                  isCancelado ? 'Cancelado' :
                  isCompletado ? 'Activo' :
                  'Pendiente de alta'
                } />
              </div>
              <div className="flex items-center gap-2">
                {!isCancelado && !isCompletado && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => avanzarMut.mutate(proceso.id)}
                      disabled={avanzarMut.isPending || etapaIdx >= ETAPAS.length - 1}
                    >
                      Avanzar etapa
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setCancelId(proceso.id)}
                    >
                      Cancelar
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Stepper */}
            <div className="px-5 py-4">
              <div className="flex items-center gap-0">
                {ETAPAS.map((etapa, i) => {
                  const done = i < etapaIdx;
                  const active = i === etapaIdx && !isCancelado;
                  return (
                    <React.Fragment key={etapa}>
                      <div className="flex flex-col items-center gap-1 min-w-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                          isCancelado && i <= etapaIdx ? 'border-red-300 bg-red-50 text-red-400' :
                          done ? 'border-emerald-500 bg-emerald-500 text-white' :
                          active ? 'border-[#007BFF] bg-[#007BFF] text-white' :
                          'border-border bg-muted text-muted-foreground'
                        }`}>
                          {done ? '✓' : i + 1}
                        </div>
                        <span className={`text-[10px] text-center leading-tight max-w-[60px] ${active ? 'font-semibold text-[#007BFF]' : done ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                          {etapaLabel(etapa)}
                        </span>
                      </div>
                      {i < ETAPAS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 mb-4 rounded-full ${done ? 'bg-emerald-400' : 'bg-border'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Historial */}
            {proceso.historial && proceso.historial.length > 0 && (
              <div className="border-t px-5 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Historial de etapas</p>
                <div className="space-y-1.5">
                  {proceso.historial.map((h) => (
                    <div key={h.id} className="flex items-start gap-2.5 text-xs">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${h.estado === 'completada' ? 'bg-emerald-500' : h.estado === 'en_curso' ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
                      <div className="flex-1">
                        <span className="font-medium">{etapaLabel(h.etapa)}</span>
                        {h.nota && <span className="text-muted-foreground ml-1.5">— {h.nota}</span>}
                      </div>
                      <span className="text-muted-foreground tabular-nums shrink-0">
                        {new Date(h.fechaInicio).toLocaleDateString('es-MX')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Cancel dialog */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-semibold">Cancelar proceso</h3>
            <Input
              placeholder="Motivo de cancelación"
              value={cancelMotivo}
              onChange={(e) => setCancelMotivo(e.target.value)}
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setCancelId(null); setCancelMotivo(''); }}>Cancelar</Button>
              <Button
                variant="destructive"
                disabled={!cancelMotivo.trim() || cancelarMut.isPending}
                onClick={() => cancelarMut.mutate({ id: cancelId, motivo: cancelMotivo })}
              >
                Confirmar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Contratos;
