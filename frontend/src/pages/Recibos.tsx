import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useData } from '@/context/DataContext';
import { fetchRecibos, fetchTimbrados, hasApi } from '@/api/recibos';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const Recibos = () => {
  const useApi = hasApi();
  const {
    recibos: contextRecibos,
    addRecibo,
    updateRecibo,
    timbrados: contextTimbrados,
    contratos,
    allowedZonaIds,
    mensajeGlobalRecibos,
    setMensajeGlobalRecibos,
    pagosParcialidad,
  } = useData();
  const { data: apiRecibos = [] } = useQuery({ queryKey: ['recibos'], queryFn: fetchRecibos, enabled: useApi });
  const { data: apiTimbrados = [] } = useQuery({ queryKey: ['timbrados'], queryFn: fetchTimbrados, enabled: useApi });
  const recibos = useApi ? apiRecibos : contextRecibos;
  const timbrados = useApi ? apiTimbrados : contextTimbrados;
  const [showMensajeIndividual, setShowMensajeIndividual] = useState(false);
  const [selectedReciboIds, setSelectedReciboIds] = useState<Set<string>>(new Set());
  const [mensajeIndividualTexto, setMensajeIndividualTexto] = useState('');
  const [filtroContrato, setFiltroContrato] = useState('');
  const [previewReciboId, setPreviewReciboId] = useState<string | null>(null);

  const contratoIdsVisibles = useMemo(() => {
    if (!allowedZonaIds) return new Set(contratos.map(c => c.id));
    return new Set(contratos.filter(c => c.zonaId && allowedZonaIds.includes(c.zonaId)).map(c => c.id));
  }, [contratos, allowedZonaIds]);
  const recibosVisibles = useMemo(() => recibos.filter(r => contratoIdsVisibles.has(r.contratoId)), [recibos, contratoIdsVisibles]);
  const recibosParaSeleccion = useMemo(() => {
    if (!filtroContrato) return recibosVisibles;
    return recibosVisibles.filter(r => r.contratoId === filtroContrato);
  }, [recibosVisibles, filtroContrato]);
  const timbradosOK = useMemo(() =>
    timbrados.filter(t => t.estado === 'Timbrada OK' && contratoIdsVisibles.has(t.contratoId) && !recibos.some(r => r.timbradoId === t.id)),
    [timbrados, recibos, contratoIdsVisibles]
  );

  const generarRecibo = (t: typeof timbrados[0]) => {
    if (useApi) return;
    addRecibo({
      timbradoId: t.id,
      contratoId: t.contratoId,
      saldoVigente: Math.round(Math.random() * 500 + 100),
      saldoVencido: Math.round(Math.random() * 200),
      parcialidades: 0,
      fechaVencimiento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      impreso: false,
    });
  };

  const mensajeEfectivo = (r: typeof recibos[0]) => (r.mensajeIndividual ?? mensajeGlobalRecibos) || '—';

  const parcialidadesByContrato = useMemo(() => {
    const map: Record<string, typeof pagosParcialidad> = {};
    pagosParcialidad.forEach(pp => {
      if (!map[pp.contratoId]) map[pp.contratoId] = [];
      map[pp.contratoId].push(pp);
    });
    return map;
  }, [pagosParcialidad]);

  const previewRecibo = previewReciboId ? recibos.find(r => r.id === previewReciboId) : null;
  const previewContrato = previewRecibo ? contratos.find(c => c.id === previewRecibo.contratoId) : null;
  const previewTimbrado = previewRecibo ? timbrados.find(t => t.id === previewRecibo.timbradoId) : null;
  const previewParcialidades = previewRecibo ? (parcialidadesByContrato[previewRecibo.contratoId] ?? []) : [];

  const toggleSelectRecibo = (id: string) => {
    setSelectedReciboIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const aplicarMensajeIndividual = () => {
    if (useApi) return;
    selectedReciboIds.forEach(id => updateRecibo(id, { mensajeIndividual: mensajeIndividualTexto }));
    setSelectedReciboIds(new Set());
    setMensajeIndividualTexto('');
    setShowMensajeIndividual(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Recibos e Impresión</h1>
      </div>

      <div className="mb-6 rounded-lg border p-4 space-y-3">
        <h3 className="section-title">Mensajes antes de enviar a timbrar</h3>
        <div>
          <label className="text-sm font-medium">Mensaje global</label>
          <Textarea
            placeholder="Mensaje que se mostrará en todos los recibos (salvo los que tengan mensaje individual)"
            value={mensajeGlobalRecibos}
            onChange={e => setMensajeGlobalRecibos(e.target.value)}
            className="mt-1 min-h-[80px]"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowMensajeIndividual(true)}>
          Mensaje individual (seleccionar facturas/recibos)
        </Button>
      </div>

      {timbradosOK.length > 0 && (
        <div className="mb-6">
          <h3 className="section-title">Generar recibos</h3>
          <div className="flex gap-2 flex-wrap">
            {timbradosOK.map(t => (
              <Button key={t.id} variant="outline" size="sm" onClick={() => generarRecibo(t)} disabled={useApi}>
                Recibo {t.contratoId}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Contrato</th>
              <th>Saldo vigente</th>
              <th>Saldo vencido</th>
              <th>Vencimiento</th>
              <th>Parcialidades</th>
              <th>Mensaje</th>
              <th>Impreso</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recibosVisibles.map(r => {
              const contrato = contratos.find(c => c.id === r.contratoId);
              const parcialidades = parcialidadesByContrato[r.contratoId] ?? [];
              return (
                <tr key={r.id}>
                  <td><span className="font-mono text-xs">{r.contratoId}</span> <span className="text-muted-foreground text-xs">- {contrato?.nombre}</span></td>
                  <td className="font-semibold">${r.saldoVigente.toFixed(2)}</td>
                  <td className={r.saldoVencido > 0 ? 'text-destructive font-semibold' : ''}>${r.saldoVencido.toFixed(2)}</td>
                  <td>{r.fechaVencimiento}</td>
                  <td>{parcialidades.length > 0 ? `${parcialidades.filter(p => p.estado === 'Pendiente').length} pendiente(s)` : r.parcialidades}</td>
                  <td className="text-xs max-w-[200px] truncate" title={mensajeEfectivo(r)}>{mensajeEfectivo(r)}</td>
                  <td>{r.impreso ? <span className="status-badge status-success">Sí</span> : <span className="status-badge status-warning">No</span>}</td>
                  <td className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => setPreviewReciboId(r.id)}>Vista previa</Button>
                    {!r.impreso && <Button size="sm" onClick={() => updateRecibo(r.id, { impreso: true })} disabled={useApi}>Imprimir</Button>}
                  </td>
                </tr>
              );
            })}
            {recibosVisibles.length === 0 && <tr><td colSpan={8} className="text-center text-muted-foreground py-8">No hay recibos</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!previewReciboId} onOpenChange={() => setPreviewReciboId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl">Vista previa del recibo</DialogTitle>
          </DialogHeader>
          {previewRecibo && previewContrato && (
            <div className="space-y-5 text-sm">
              {/* Datos del contrato */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-muted-foreground">Contrato</span>
                  <span className="font-medium">{previewRecibo.contratoId} – {previewContrato.nombre}</span>
                </div>
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-muted-foreground">Dirección</span>
                  <span>{previewContrato.direccion}</span>
                </div>
                {previewTimbrado && (
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="font-medium text-muted-foreground">UUID</span>
                    <code className="text-xs font-mono bg-muted/60 px-1.5 py-0.5 rounded break-all" title={previewTimbrado.uuid}>{previewTimbrado.uuid}</code>
                  </div>
                )}
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-medium text-muted-foreground">Fecha vencimiento</span>
                  <span>{previewRecibo.fechaVencimiento}</span>
                </div>
              </div>

              {/* Saldos destacados */}
              <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Saldo vigente</p>
                  <p className="text-lg font-bold tabular-nums">${previewRecibo.saldoVigente.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">Saldo vencido</p>
                  <p className={`text-lg font-bold tabular-nums ${previewRecibo.saldoVencido > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                    ${previewRecibo.saldoVencido.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Parcialidades con badges de estado */}
              {previewParcialidades.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pagos en parcialidades</h4>
                  <ul className="space-y-2">
                    {previewParcialidades.map(pp => (
                      <li key={pp.id} className="flex flex-wrap items-center justify-between gap-2 rounded border bg-card px-3 py-2">
                        <span className="font-medium">Cuota {pp.numero}</span>
                        <span className="tabular-nums">${pp.monto.toFixed(2)}</span>
                        <span className="text-muted-foreground">{pp.fechaVencimiento}</span>
                        <span className={`status-badge ${pp.estado === 'Pagado' ? 'status-success' : 'status-warning'}`}>
                          {pp.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mensaje: solo mostrar bloque si hay contenido o texto amigable si no */}
              <div className="space-y-1">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Mensaje</h4>
                {(previewRecibo.mensajeIndividual ?? mensajeGlobalRecibos) ? (
                  <p className="rounded border bg-muted/20 px-3 py-2 text-foreground">{mensajeEfectivo(previewRecibo)}</p>
                ) : (
                  <p className="text-muted-foreground italic">No hay mensaje para este recibo.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showMensajeIndividual} onOpenChange={setShowMensajeIndividual}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Mensaje individual</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Selecciona los recibos y asigna un mensaje. Este mensaje tiene prioridad sobre el mensaje global.</p>
          <Input
            placeholder="Filtrar por contrato"
            value={filtroContrato}
            onChange={e => setFiltroContrato(e.target.value)}
          />
          <div className="max-h-48 overflow-y-auto space-y-2 border rounded p-2">
            {recibosParaSeleccion.map(r => {
              const c = contratos.find(x => x.id === r.contratoId);
              return (
                <label key={r.id} className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={selectedReciboIds.has(r.id)} onCheckedChange={() => toggleSelectRecibo(r.id)} />
                  <span className="font-mono text-xs">{r.id}</span>
                  <span>{r.contratoId}</span>
                  <span className="text-muted-foreground text-xs">{c?.nombre}</span>
                </label>
              );
            })}
          </div>
          <Textarea
            placeholder="Mensaje para los recibos seleccionados"
            value={mensajeIndividualTexto}
            onChange={e => setMensajeIndividualTexto(e.target.value)}
            className="min-h-[60px]"
          />
          <Button onClick={aplicarMensajeIndividual} disabled={useApi || selectedReciboIds.size === 0 || !mensajeIndividualTexto.trim()}>
            Aplicar a {selectedReciboIds.size} recibo(s)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Recibos;
