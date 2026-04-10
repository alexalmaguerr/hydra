import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useData } from '@/context/DataContext';
import {
  fetchContratos,
  createContrato,
  updateContrato,
  fetchTextoContratoPreview,
  getContratoPdfUrl,
  crearFacturaContratacion,
  hasApi,
  type CreateContratoDto,
} from '@/api/contratos';
import { toast } from '@/components/ui/sonner';
import { wizardRequierePlantillaConChecklist } from '@/lib/contrato-wizard-validation';
import { fetchTipoContratacionConfiguracion, fetchTiposContratacion } from '@/api/tipos-contratacion';
import { fetchPuntosServicio } from '@/api/puntos-servicio';
import { fetchActividades } from '@/api/catalogos';
import {
  fetchProcesos,
  crearProceso,
  avanzarEtapa,
  cancelarProceso,
  fetchPlantillasContrato,
  type ProcesoContratacion,
} from '@/api/procesos-contratacion';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Eye, ChevronRight, Hash, User, Droplets, FileText, SlidersHorizontal, Download, TrendingUp, GitBranch, ScrollText } from 'lucide-react';
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

function ContratoTextoPreviewPanel({
  contratoId,
  enabled,
}: {
  contratoId: string;
  enabled: boolean;
}) {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['contrato-texto-preview', contratoId],
    queryFn: () => fetchTextoContratoPreview(contratoId),
    enabled: enabled && !!contratoId,
  });

  if (!enabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Activa la API (VITE_API_URL) para generar la vista previa desde la plantilla del proceso o las cláusulas del tipo de contratación.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Cargando vista previa…</p>;
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-destructive">No se pudo cargar la vista previa.</p>
        <Button size="sm" variant="outline" type="button" onClick={() => refetch()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const fuenteLabels: Record<string, string> = {
    plantilla: 'Plantilla del proceso',
    clausulas: 'Cláusulas del tipo',
    'vacío': 'Sin contenido',
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{fuenteLabels[data!.fuente] ?? data!.fuente}</Badge>
        {isFetching ? <span className="text-xs text-muted-foreground">Actualizando…</span> : null}
        <Button size="sm" variant="ghost" className="h-7 text-xs" type="button" onClick={() => refetch()}>
          Actualizar
        </Button>
      </div>
      <div className="rounded-md border bg-muted/30 p-4 max-h-[min(480px,55vh)] overflow-y-auto">
        {data!.texto.trim() ? (
          <pre className="text-sm whitespace-pre-wrap font-sans text-foreground leading-relaxed">{data!.texto}</pre>
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay plantilla en el proceso reciente ni cláusulas asociadas al tipo de contratación. Configura el tipo o crea un proceso con plantilla.
          </p>
        )}
      </div>
    </div>
  );
}

const Contratos = () => {
  const queryClient = useQueryClient();
  const useApi = hasApi();
  const { contratos: contextContratos, tomas, addContrato, allowedZonaIds, timbrados, recibos, preFacturas, pagos } = useData();

  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(1);
  const [detail, setDetail] = useState<string | null>(null);
  const [searchParams] = useSearchParams();

  const { data: apiContratos = [], isLoading } = useQuery({
    queryKey: ['contratos'],
    queryFn: fetchContratos,
    enabled: useApi,
  });
  const createMutation = useMutation({
    mutationFn: (dto: CreateContratoDto) => createContrato(dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contratos'] }),
  });

  const { data: tiposWizardResp } = useQuery({
    queryKey: ['tipos-contratacion', 'wizard-list'],
    queryFn: fetchTiposContratacion,
    enabled: useApi && showWizard,
  });
  const tiposWizard = useMemo(
    () => (tiposWizardResp?.data ?? []).filter((t) => t.activo),
    [tiposWizardResp],
  );

  const { data: puntosWizardResp } = useQuery({
    queryKey: ['puntos-servicio', 'wizard-list'],
    queryFn: () => fetchPuntosServicio({ limit: 200 }),
    enabled: useApi && showWizard,
  });
  const puntosWizard = puntosWizardResp?.data ?? [];

  const { data: actividadesWizard = [] } = useQuery({
    queryKey: ['catalogos', 'actividades', 'wizard-list'],
    queryFn: fetchActividades,
    enabled: useApi && showWizard,
  });
  const { data: plantillasWizard = [] } = useQuery({
    queryKey: ['procesos-contratacion', 'plantillas-wizard'],
    queryFn: () => fetchPlantillasContrato(true),
    enabled: useApi && showWizard,
  });

  const contratos = useApi
    ? (Array.isArray(apiContratos) ? apiContratos : [])
    : contextContratos;
  const contratosVisibles = useMemo(() =>
    !allowedZonaIds ? contratos : contratos.filter((c: { zonaId?: string }) => c.zonaId && allowedZonaIds.includes(c.zonaId)),
    [contratos, allowedZonaIds]
  );

  const emptyWizardForm = () => ({
    tomaId: '',
    tipoContrato: '' as string,
    tipoServicio: '' as string,
    actividadId: '',
    referenciaContratoAnterior: '',
    nombre: '',
    rfc: '',
    direccion: '',
    contacto: '',
    razonSocial: '',
    regimenFiscal: '',
    superficiePredio: '',
    superficieConstruida: '',
    unidadesServidas: '',
    personasHabitanVivienda: '',
    documentosRecibidos: [] as string[],
    generarOrdenInstalacionToma: false,
    generarOrdenInstalacionMedidor: false,
    generarFacturaContratacion: false,
    omitirRegistroPersonaTitular: false,
    tipoContratacionId: '',
    puntoServicioId: '',
    iniciarProcesoContratacion: true,
    plantillaProcesoId: '',
    fiscalNombre: '',
    fiscalRfc: '',
    fiscalCurp: '',
    fiscalEmail: '',
    fiscalTelefono: '',
    contactoNombre: '',
    contactoRfc: '',
    contactoEmail: '',
    contactoTelefono: '',
  });

  const [form, setForm] = useState(emptyWizardForm);

  const { data: tipoConfigWizard } = useQuery({
    queryKey: ['tipos-contratacion', form.tipoContratacionId, 'configuracion'],
    queryFn: () => fetchTipoContratacionConfiguracion(form.tipoContratacionId),
    enabled: useApi && showWizard && !!form.tipoContratacionId,
  });
  const documentosRequeridosWizard = useMemo(
    () => tipoConfigWizard?.documentos ?? [],
    [tipoConfigWizard?.documentos],
  );
  const requiredDocs = useMemo(
    () =>
      documentosRequeridosWizard
        .filter((d) => d.obligatorio)
        .map((d) => d.nombreDocumento.trim())
        .filter((n) => n.length > 0),
    [documentosRequeridosWizard],
  );

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowWizard(true);
  }, [searchParams]);

  const disponibles = tomas.filter(t => t.estado === 'Disponible');
  const contratoIdsVisibles = useMemo(() => new Set(contratosVisibles.map(c => c.id)), [contratosVisibles]);

  const handleCreate = () => {
    if (
      useApi &&
      wizardRequierePlantillaConChecklist({
        iniciarProcesoContratacion: form.iniciarProcesoContratacion,
        documentosRecibidos: form.documentosRecibidos,
        plantillaProcesoId: form.plantillaProcesoId,
      })
    ) {
      toast.error('Plantilla requerida', {
        description:
          'Si inicia el proceso de contratación y marcó documentos en el checklist, elija una plantilla.',
      });
      return;
    }
    const fecha = new Date().toISOString().split('T')[0];
    const parseNum = (value: string): number | undefined => {
      const t = value.trim();
      if (!t) return undefined;
      const n = Number(t);
      return Number.isFinite(n) ? n : undefined;
    };
    const payload: CreateContratoDto = {
      tomaId: form.tomaId || undefined,
      tipoContratacionId: form.tipoContratacionId || undefined,
      puntoServicioId: form.puntoServicioId || undefined,
      actividadId: form.actividadId || undefined,
      referenciaContratoAnterior: form.referenciaContratoAnterior.trim() || undefined,
      tipoContrato: form.tipoContrato,
      tipoServicio: form.tipoServicio,
      nombre: form.nombre,
      rfc: form.rfc,
      direccion: form.direccion,
      contacto: form.contacto,
      estado: 'Pendiente de alta',
      fecha,
      generarOrdenInstalacionToma: form.generarOrdenInstalacionToma || undefined,
      generarOrdenInstalacionMedidor:
        !form.generarOrdenInstalacionToma && form.generarOrdenInstalacionMedidor
          ? true
          : undefined,
      generarFacturaContratacion: form.generarFacturaContratacion || undefined,
      omitirRegistroPersonaTitular: form.omitirRegistroPersonaTitular || undefined,
      superficiePredio: parseNum(form.superficiePredio),
      superficieConstruida: parseNum(form.superficieConstruida),
      unidadesServidas: parseNum(form.unidadesServidas),
      personasHabitanVivienda: parseNum(form.personasHabitanVivienda),
      documentosRecibidos: form.documentosRecibidos.length
        ? Array.from(
            new Set(
              form.documentosRecibidos
                .map((d) => d.trim())
                .filter((d) => d.length > 0),
            ),
          )
        : undefined,
    };
    const fiscalNombre = form.fiscalNombre.trim();
    const fiscalRfc = form.fiscalRfc.trim();
    if (fiscalNombre || fiscalRfc) {
      payload.personaFiscal = {
        nombre: fiscalNombre || undefined,
        rfc: fiscalRfc || undefined,
        curp: form.fiscalCurp.trim() || undefined,
        email: form.fiscalEmail.trim() || undefined,
        telefono: form.fiscalTelefono.trim() || undefined,
      };
    }
    const contactoNombre = form.contactoNombre.trim();
    const contactoRfc = form.contactoRfc.trim();
    if (contactoNombre || contactoRfc) {
      payload.personaContacto = {
        nombre: contactoNombre || undefined,
        rfc: contactoRfc || undefined,
        email: form.contactoEmail.trim() || undefined,
        telefono: form.contactoTelefono.trim() || undefined,
      };
    }
    if (form.razonSocial.trim()) payload.razonSocial = form.razonSocial.trim();
    if (form.regimenFiscal.trim()) payload.regimenFiscal = form.regimenFiscal.trim();
    if (
      form.documentosRecibidos.length > 0 &&
      form.iniciarProcesoContratacion &&
      form.plantillaProcesoId
    ) {
      payload.plantillaContratacionId = form.plantillaProcesoId;
    }
    if (useApi) {
      createMutation.mutate(payload, {
        onSuccess: async (created) => {
          if (created.procesoGestionadoEnAlta) {
            void queryClient.invalidateQueries({ queryKey: ['procesos', created.id] });
          }
          if (
            form.iniciarProcesoContratacion &&
            !created.procesoGestionadoEnAlta
          ) {
            try {
              await crearProceso({
                contratoId: created.id,
                tipoContratacionId: form.tipoContratacionId || undefined,
                plantillaId: form.plantillaProcesoId || undefined,
                creadoPor: 'operador',
              });
              void queryClient.invalidateQueries({ queryKey: ['procesos', created.id] });
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : 'Error al iniciar el proceso de contratación';
              toast.error('Contrato creado, pero falló el proceso', {
                description: msg,
              });
            }
          }
          setForm(emptyWizardForm());
          setStep(1);
          setShowWizard(false);
        },
      });
    } else {
      addContrato(payload);
      setForm(emptyWizardForm());
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
  const pendientesCampo = contratosVisibles.filter(
    (c: { estado: string }) => c.estado === 'Pendiente de toma' || c.estado === 'Pendiente de zona',
  ).length;
  const suspendidos = contratosVisibles.filter((c: { estado: string }) => c.estado === 'Suspendido').length;
  const missingRequiredDocs = requiredDocs.filter((d) => !form.documentosRecibidos.includes(d));

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
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <KpiCard
          label="Total contratos"
          value={contratosVisibles.length.toLocaleString()}
          sub={<span className="flex items-center gap-1 text-emerald-600"><TrendingUp className="w-3 h-3" /> En el sistema</span>}
        />
        <KpiCard label="Activos" value={activos} accent="success"
          footer={<div className="w-full h-1.5 bg-muted rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (activos / Math.max(contratosVisibles.length, 1)) * 100)}%` }} /></div>}
        />
        <KpiCard label="Pendientes de alta" value={pendientesAlta} accent={pendientesAlta > 0 ? 'warning' : 'default'} />
        <KpiCard label="Pendientes en campo" value={pendientesCampo} accent={pendientesCampo > 0 ? 'warning' : 'default'} />
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
        <DialogContent className="max-w-xl">
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
              <Select value={form.tipoContrato} onValueChange={v => setForm({ ...form, tipoContrato: v as string })}>
                <SelectTrigger><SelectValue placeholder="Tipo de contrato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agua">Agua</SelectItem>
                  <SelectItem value="Saneamiento">Saneamiento</SelectItem>
                  <SelectItem value="Alcantarillado">Alcantarillado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={form.tipoServicio} onValueChange={v => setForm({ ...form, tipoServicio: v as string })}>
                <SelectTrigger><SelectValue placeholder="Tipo de servicio" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Doméstico">Doméstico</SelectItem>
                  <SelectItem value="Comercial">Comercial</SelectItem>
                  <SelectItem value="Industrial">Industrial</SelectItem>
                </SelectContent>
              </Select>
              {useApi && (
                <>
                  {tiposWizard.length > 0 ? (
                    <Select
                      value={form.tipoContratacionId || '__none__'}
                      onValueChange={(v) =>
                        setForm({ ...form, tipoContratacionId: v === '__none__' ? '' : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo de contratación (catálogo, opcional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="__none__">Sin tipo (catálogo)</SelectItem>
                        {tiposWizard.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.codigo} — {t.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hay tipos de contratación activos en catálogo.</p>
                  )}
                  {puntosWizard.length > 0 ? (
                    <Select
                      value={form.puntoServicioId || '__none__'}
                      onValueChange={(v) =>
                        setForm({ ...form, puntoServicioId: v === '__none__' ? '' : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Punto de servicio (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="__none__">Sin punto de servicio</SelectItem>
                        {puntosWizard.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.codigo}
                            {p.domicilio?.calle ? ` · ${p.domicilio.calle}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-xs text-muted-foreground">No hay puntos de servicio listados (revisa permisos o datos).</p>
                  )}
                  {actividadesWizard.length > 0 ? (
                    <Select
                      value={form.actividadId || '__none__'}
                      onValueChange={(v) =>
                        setForm({ ...form, actividadId: v === '__none__' ? '' : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Actividad (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="__none__">Sin actividad</SelectItem>
                        {actividadesWizard.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.codigo} — {a.descripcion}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                  {plantillasWizard.length > 0 ? (
                    <Select
                      value={form.plantillaProcesoId || '__none__'}
                      onValueChange={(v) =>
                        setForm({ ...form, plantillaProcesoId: v === '__none__' ? '' : v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Plantilla para proceso (opcional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <SelectItem value="__none__">Sin plantilla</SelectItem>
                        {plantillasWizard.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.nombre} v{p.version}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : null}
                </>
              )}
              <Input
                placeholder="Contrato padre (opcional)"
                value={form.referenciaContratoAnterior}
                onChange={(e) => setForm({ ...form, referenciaContratoAnterior: e.target.value })}
              />
              <Button onClick={() => setStep(2)} disabled={!form.tomaId || !form.tipoContrato || !form.tipoServicio} className="w-full">Siguiente</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <Input placeholder="Nombre completo" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
              <Input placeholder="RFC" value={form.rfc} onChange={e => setForm({ ...form, rfc: e.target.value })} />
              <Input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
              <Input placeholder="Contacto (teléfono)" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} />
              <Input placeholder="Razón social (opcional, moral)" value={form.razonSocial} onChange={e => setForm({ ...form, razonSocial: e.target.value })} />
              <Input placeholder="Régimen fiscal (opcional)" value={form.regimenFiscal} onChange={e => setForm({ ...form, regimenFiscal: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Superficie predio (m²)"
                  value={form.superficiePredio}
                  onChange={(e) => setForm({ ...form, superficiePredio: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Superficie construcción (m²)"
                  value={form.superficieConstruida}
                  onChange={(e) => setForm({ ...form, superficieConstruida: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Unidades de servicio"
                  value={form.unidadesServidas}
                  onChange={(e) => setForm({ ...form, unidadesServidas: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Personas en vivienda"
                  value={form.personasHabitanVivienda}
                  onChange={(e) => setForm({ ...form, personasHabitanVivienda: e.target.value })}
                />
              </div>
              {useApi && form.tipoContratacionId && documentosRequeridosWizard.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <p className="text-sm font-medium">Documentos recibidos para contratación</p>
                  {documentosRequeridosWizard.map((doc) => {
                    const docKey = doc.nombreDocumento.trim();
                    const checked =
                      docKey.length > 0 && form.documentosRecibidos.includes(docKey);
                    return (
                      <label key={doc.id} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          className="mt-0.5"
                          disabled={!docKey}
                          checked={checked}
                          onChange={(e) => {
                            if (!docKey) return;
                            setForm((prev) => ({
                              ...prev,
                              documentosRecibidos: e.target.checked
                                ? Array.from(new Set([...prev.documentosRecibidos, docKey]))
                                : prev.documentosRecibidos.filter((d) => d !== docKey),
                            }));
                          }}
                        />
                        <span>
                          {doc.nombreDocumento}
                          {doc.obligatorio ? <span className="text-destructive"> *</span> : null}
                          {doc.descripcion ? (
                            <span className="text-xs text-muted-foreground block">{doc.descripcion}</span>
                          ) : null}
                        </span>
                      </label>
                    );
                  })}
                  {missingRequiredDocs.length > 0 ? (
                    <p className="text-xs text-destructive">
                      Faltan documentos obligatorios: {missingRequiredDocs.join(', ')}
                    </p>
                  ) : null}
                </div>
              )}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.generarOrdenInstalacionToma}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        generarOrdenInstalacionToma: e.target.checked,
                        generarOrdenInstalacionMedidor: e.target.checked ? false : form.generarOrdenInstalacionMedidor,
                      })
                    }
                  />
                  <span>Generar orden de instalación de toma (estado: Pendiente de toma)</span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    disabled={form.generarOrdenInstalacionToma}
                    checked={form.generarOrdenInstalacionMedidor}
                    onChange={(e) => setForm({ ...form, generarOrdenInstalacionMedidor: e.target.checked })}
                  />
                  <span>Generar orden de medidor sin toma previa (estado: Pendiente de zona)</span>
                </label>
                {import.meta.env.VITE_FEATURE_FACTURACION_CONTRATACION === 'true' && (
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={form.generarFacturaContratacion}
                      onChange={(e) => setForm({ ...form, generarFacturaContratacion: e.target.checked })}
                    />
                    <span>Generar factura de contratación al crear (conceptos del tipo)</span>
                  </label>
                )}
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.iniciarProcesoContratacion}
                    onChange={(e) => setForm({ ...form, iniciarProcesoContratacion: e.target.checked })}
                  />
                  <span>Iniciar proceso de contratación automáticamente al crear</span>
                </label>
                <label className="flex items-start gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={form.omitirRegistroPersonaTitular}
                    onChange={(e) => setForm({ ...form, omitirRegistroPersonaTitular: e.target.checked })}
                  />
                  <span>Omitir registro de persona titular en directorio</span>
                </label>
              </div>
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-sm font-medium">Persona fiscal (opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Nombre fiscal" value={form.fiscalNombre} onChange={e => setForm({ ...form, fiscalNombre: e.target.value })} />
                  <Input placeholder="RFC fiscal" value={form.fiscalRfc} onChange={e => setForm({ ...form, fiscalRfc: e.target.value })} />
                  <Input placeholder="CURP fiscal" value={form.fiscalCurp} onChange={e => setForm({ ...form, fiscalCurp: e.target.value })} />
                  <Input placeholder="Email fiscal" value={form.fiscalEmail} onChange={e => setForm({ ...form, fiscalEmail: e.target.value })} />
                  <Input placeholder="Teléfono fiscal" value={form.fiscalTelefono} onChange={e => setForm({ ...form, fiscalTelefono: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">Si capturas persona fiscal nueva, usa al menos nombre y RFC.</p>
              </div>
              <div className="pt-2 border-t border-border space-y-2">
                <p className="text-sm font-medium">Persona contacto (opcional)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Nombre contacto" value={form.contactoNombre} onChange={e => setForm({ ...form, contactoNombre: e.target.value })} />
                  <Input placeholder="RFC contacto" value={form.contactoRfc} onChange={e => setForm({ ...form, contactoRfc: e.target.value })} />
                  <Input placeholder="Email contacto" value={form.contactoEmail} onChange={e => setForm({ ...form, contactoEmail: e.target.value })} />
                  <Input placeholder="Teléfono contacto" value={form.contactoTelefono} onChange={e => setForm({ ...form, contactoTelefono: e.target.value })} />
                </div>
                <p className="text-xs text-muted-foreground">Si capturas contacto nuevo, usa al menos nombre y RFC para registrarlo en directorio.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Atrás</Button>
                <Button
                  onClick={() => setStep(3)}
                  disabled={
                    !form.nombre ||
                    !form.rfc ||
                    missingRequiredDocs.length > 0 ||
                    ((form.fiscalNombre.trim() || form.fiscalRfc.trim()) &&
                      (!form.fiscalNombre.trim() || !form.fiscalRfc.trim())) ||
                    ((form.contactoNombre.trim() || form.contactoRfc.trim()) &&
                      (!form.contactoNombre.trim() || !form.contactoRfc.trim()))
                  }
                  className="flex-1"
                >
                  Siguiente
                </Button>
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
                  {form.referenciaContratoAnterior ? (
                    <div><span className="text-muted-foreground">Contrato padre:</span> {form.referenciaContratoAnterior}</div>
                  ) : null}
                  <div><span className="text-muted-foreground">Dirección:</span> {form.direccion}</div>
                  <div><span className="text-muted-foreground">Contacto:</span> {form.contacto}</div>
                  {form.superficiePredio && <div><span className="text-muted-foreground">Sup. predio:</span> {form.superficiePredio} m²</div>}
                  {form.superficieConstruida && <div><span className="text-muted-foreground">Sup. construcción:</span> {form.superficieConstruida} m²</div>}
                  {form.unidadesServidas && <div><span className="text-muted-foreground">Unidades:</span> {form.unidadesServidas}</div>}
                  {form.personasHabitanVivienda && <div><span className="text-muted-foreground">Personas vivienda:</span> {form.personasHabitanVivienda}</div>}
                  {(form.razonSocial || form.regimenFiscal) && (
                    <>
                      <div><span className="text-muted-foreground">Razón social:</span> {form.razonSocial || '—'}</div>
                      <div><span className="text-muted-foreground">Régimen:</span> {form.regimenFiscal || '—'}</div>
                    </>
                  )}
                  {useApi && form.tipoContratacionId ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Tipo contratación:</span>{' '}
                      {(() => {
                        const t = tiposWizard.find((x) => x.id === form.tipoContratacionId);
                        return t ? `${t.codigo} — ${t.nombre}` : form.tipoContratacionId;
                      })()}
                    </div>
                  ) : null}
                  {useApi && form.puntoServicioId ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Punto de servicio:</span>{' '}
                      {puntosWizard.find((p) => p.id === form.puntoServicioId)?.codigo ?? form.puntoServicioId}
                    </div>
                  ) : null}
                  {useApi && form.actividadId ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Actividad:</span>{' '}
                      {actividadesWizard.find((a) => a.id === form.actividadId)?.descripcion ?? form.actividadId}
                    </div>
                  ) : null}
                  {useApi && form.iniciarProcesoContratacion ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Proceso automático:</span>{' '}
                      {form.plantillaProcesoId
                        ? `Sí, con plantilla ${
                            plantillasWizard.find((p) => p.id === form.plantillaProcesoId)?.nombre ??
                            form.plantillaProcesoId
                          }`
                        : 'Sí, sin plantilla'}
                    </div>
                  ) : (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Proceso automático:</span> No
                    </div>
                  )}
                  {(form.fiscalNombre || form.fiscalRfc) ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Persona fiscal:</span>{' '}
                      {form.fiscalNombre || '—'}{form.fiscalRfc ? ` (${form.fiscalRfc})` : ''}
                    </div>
                  ) : null}
                  {(form.contactoNombre || form.contactoRfc) ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Persona contacto:</span>{' '}
                      {form.contactoNombre || '—'}{form.contactoRfc ? ` (${form.contactoRfc})` : ''}
                    </div>
                  ) : null}
                  {form.documentosRecibidos.length > 0 ? (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Documentos recibidos:</span>{' '}
                      {form.documentosRecibidos.join(', ')}
                    </div>
                  ) : null}
                  <div className="col-span-2 text-xs text-muted-foreground">
                    {form.generarOrdenInstalacionToma && '• Orden de toma al crear'}
                    {form.generarOrdenInstalacionMedidor && !form.generarOrdenInstalacionToma && '• Orden de medidor al crear'}
                    {form.generarFacturaContratacion && ' • Factura de contratación al crear'}
                    {form.omitirRegistroPersonaTitular && ' • Sin persona en directorio'}
                  </div>
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
                        { value: 'texto-contrato', icon: ScrollText, label: 'Texto contrato' },
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
                            <Row
                              label="Punto de servicio (id)"
                              value={<span className="font-mono text-xs">{selected.puntoServicioId || '—'}</span>}
                            />
                            <Row
                              label="Tipo contratación (id)"
                              value={<span className="font-mono text-xs">{selected.tipoContratacionId || '—'}</span>}
                            />
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

                    {/* ── Vista previa texto contractual ── */}
                    <TabsContent value="texto-contrato" className="mt-0 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Vista previa (plantilla o cláusulas)
                          </h3>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = getContratoPdfUrl(selected.id);
                              window.open(url, '_blank');
                            }}
                          >
                            <Download className="h-3.5 w-3.5 mr-1" /> Imprimir / PDF
                          </Button>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Texto generado con variables del contrato (nombre, RFC, dirección, etc.). No sustituye al PDF firmado.
                        </p>
                        <ContratoTextoPreviewPanel contratoId={selected.id} enabled={useApi} />
                      </div>
                    </TabsContent>

                    {/* ── Facturación ── */}
                    <TabsContent value="facturacion" className="mt-0">
                      {import.meta.env.VITE_FEATURE_FACTURACION_CONTRATACION === 'true' && (
                        <div className="flex justify-end mb-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                const res = await crearFacturaContratacion(selected.id);
                                toast.success(`Factura de contratación generada: $${res.total.toFixed(2)}`);
                                queryClient.invalidateQueries({ queryKey: ['contratos'] });
                              } catch (err: any) {
                                toast.error(err?.message ?? 'Error al generar factura de contratación');
                              }
                            }}
                          >
                            <FileText className="h-3.5 w-3.5 mr-1" /> Facturar contratación
                          </Button>
                        </div>
                      )}
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
