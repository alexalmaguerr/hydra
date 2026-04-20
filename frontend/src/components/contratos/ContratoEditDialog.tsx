import React, { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchContrato, updateContrato, type UpdateContratoDto } from '@/api/contratos';
import { toast } from '@/components/ui/sonner';
import { ScrollArea } from '@/components/ui/scroll-area';

const TIPO_ENVIO_OPTIONS = [
  { value: 'PAPEL', label: 'Papel' },
  { value: 'PDF', label: 'Correo electrónico' },
  { value: 'PAPEL_PDF', label: 'Papel y correo electrónico' },
];

const CICLO_OPTIONS = [
  { value: 'ANUAL', label: 'Anual' },
  { value: 'MENSUAL', label: 'Mensual' },
  { value: 'SEMESTRAL', label: 'Semestral' },
  { value: 'TRIMESTRAL', label: 'Trimestral' },
];

function numFromApi(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'number' && Number.isFinite(v)) return String(v);
  if (typeof v === 'string' && v.trim()) {
    const n = Number(v);
    return Number.isFinite(n) ? String(n) : '';
  }
  return '';
}

function parseOptionalInt(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

function parseOptionalFloat(s: string): number | null {
  const t = s.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export interface ContratoEditDialogProps {
  open: boolean;
  contratoId: string | null;
  onOpenChange: (open: boolean) => void;
  /** Llamado tras guardar correctamente (p. ej. cerrar otra vista). */
  onSaved?: () => void;
}

/**
 * Edición de contrato vía PATCH — distinta de la ficha de solo lectura.
 * No sustituye al asistente de alta cuando el contrato está "Pendiente de alta".
 */
export function ContratoEditDialog({ open, contratoId, onOpenChange, onSaved }: ContratoEditDialogProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['contrato', contratoId],
    queryFn: () => fetchContrato(contratoId!),
    enabled: open && Boolean(contratoId?.trim()),
  });

  const [ceaNumContrato, setCeaNumContrato] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tipoEnvioFactura, setTipoEnvioFactura] = useState<string>('');
  const [domiciliado, setDomiciliado] = useState(false);
  const [fechaReconexionPrevista, setFechaReconexionPrevista] = useState('');
  const [razonSocial, setRazonSocial] = useState('');
  const [regimenFiscal, setRegimenFiscal] = useState('');
  const [zonaId, setZonaId] = useState('');
  const [rutaId, setRutaId] = useState('');
  const [puntoServicioId, setPuntoServicioId] = useState('');
  const [referenciaContratoAnterior, setReferenciaContratoAnterior] = useState('');
  const [bloqueadoJuridico, setBloqueadoJuridico] = useState(false);
  const [indicadorEmisionRecibo, setIndicadorEmisionRecibo] = useState(true);
  const [indicadorExentarFacturacion, setIndicadorExentarFacturacion] = useState(false);
  const [indicadorContactoCorreo, setIndicadorContactoCorreo] = useState(false);
  const [cicloFacturacion, setCicloFacturacion] = useState<string>('');
  const [superficiePredio, setSuperficiePredio] = useState('');
  const [superficieConstruida, setSuperficieConstruida] = useState('');
  const [mesesAdeudo, setMesesAdeudo] = useState('');
  const [unidadesServidas, setUnidadesServidas] = useState('');
  const [personasHabitanVivienda, setPersonasHabitanVivienda] = useState('');

  useEffect(() => {
    if (!data) return;
    setCeaNumContrato(data.ceaNumContrato ?? '');
    setObservaciones(data.observaciones ?? '');
    setTipoEnvioFactura(data.tipoEnvioFactura ?? '');
    setDomiciliado(!!data.domiciliado);
    setFechaReconexionPrevista(data.fechaReconexionPrevista?.slice(0, 10) ?? '');
    setRazonSocial(data.razonSocial ?? '');
    setRegimenFiscal(data.regimenFiscal ?? '');
    setZonaId(data.zonaId ?? '');
    setRutaId(data.rutaId ?? '');
    setPuntoServicioId(data.puntoServicioId ?? '');
    setReferenciaContratoAnterior(data.referenciaContratoAnterior ?? '');
    setBloqueadoJuridico(!!data.bloqueadoJuridico);
    setIndicadorEmisionRecibo(data.indicadorEmisionRecibo !== false);
    setIndicadorExentarFacturacion(!!data.indicadorExentarFacturacion);
    setIndicadorContactoCorreo(!!data.indicadorContactoCorreo);
    setCicloFacturacion(data.cicloFacturacion ?? '');
    setSuperficiePredio(numFromApi(data.superficiePredio));
    setSuperficieConstruida(numFromApi(data.superficieConstruida));
    setMesesAdeudo(data.mesesAdeudo != null ? String(data.mesesAdeudo) : '');
    setUnidadesServidas(data.unidadesServidas != null ? String(data.unidadesServidas) : '');
    setPersonasHabitanVivienda(data.personasHabitanVivienda != null ? String(data.personasHabitanVivienda) : '');
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!contratoId) throw new Error('Sin contrato');
      const dto: UpdateContratoDto = {
        ceaNumContrato: ceaNumContrato.trim() || null,
        observaciones: observaciones.trim() || null,
        tipoEnvioFactura: tipoEnvioFactura.trim() || null,
        domiciliado,
        fechaReconexionPrevista: fechaReconexionPrevista.trim() || null,
        razonSocial: razonSocial.trim() || null,
        regimenFiscal: regimenFiscal.trim() || null,
        zonaId: zonaId.trim() || null,
        rutaId: rutaId.trim() || null,
        puntoServicioId: puntoServicioId.trim() || null,
        referenciaContratoAnterior: referenciaContratoAnterior.trim() || null,
        bloqueadoJuridico,
        indicadorEmisionRecibo,
        indicadorExentarFacturacion,
        indicadorContactoCorreo,
        cicloFacturacion: cicloFacturacion.trim() || null,
        superficiePredio: parseOptionalFloat(superficiePredio),
        superficieConstruida: parseOptionalFloat(superficieConstruida),
        mesesAdeudo: parseOptionalInt(mesesAdeudo),
        unidadesServidas: parseOptionalInt(unidadesServidas),
        personasHabitanVivienda: parseOptionalInt(personasHabitanVivienda),
      };
      return updateContrato(contratoId, dto);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['contratos'] });
      await queryClient.invalidateQueries({ queryKey: ['contrato', contratoId] });
      toast.success('Cambios guardados');
      onSaved?.();
      onOpenChange(false);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'No se pudo guardar';
      toast.error('Error al actualizar', { description: message });
    },
  });

  const titleNum = data?.numeroContrato ?? contratoId?.slice(0, 8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Editar contrato {titleNum != null ? `· ${titleNum}` : ''}</DialogTitle>
          <DialogDescription>
            Actualice los datos operativos del contrato. Los cambios se guardan en el servidor al pulsar Guardar.
          </DialogDescription>
        </DialogHeader>

        {isLoading && (
          <div className="px-6 py-8 text-sm text-muted-foreground">Cargando datos del contrato…</div>
        )}
        {isError && (
          <div className="px-6 py-4 space-y-2">
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : 'No se pudo cargar el contrato.'}
            </p>
            <Button size="sm" variant="outline" type="button" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        )}

        {data && !isLoading && (
          <>
            <ScrollArea className="max-h-[min(520px,60vh)] px-6">
              <div className="space-y-4 pb-4 pr-3">
                <div className="space-y-2">
                  <Label htmlFor="cea">N° contrato CEA</Label>
                  <Input
                    id="cea"
                    value={ceaNumContrato}
                    onChange={(e) => setCeaNumContrato(e.target.value)}
                    className="font-mono"
                    placeholder="Ej. 523160"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="obs">Observaciones</Label>
                  <Textarea
                    id="obs"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    rows={3}
                    placeholder="Notas internas sobre el contrato"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Envío de factura</Label>
                  <Select value={tipoEnvioFactura || '__empty'} onValueChange={(v) => setTipoEnvioFactura(v === '__empty' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">—</SelectItem>
                      {TIPO_ENVIO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="dom">Domiciliado</Label>
                    <p className="text-xs text-muted-foreground">Facturación en domicilio</p>
                  </div>
                  <Switch id="dom" checked={domiciliado} onCheckedChange={setDomiciliado} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frp">Fecha reconexión prevista</Label>
                  <Input
                    id="frp"
                    type="date"
                    value={fechaReconexionPrevista}
                    onChange={(e) => setFechaReconexionPrevista(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rs">Razón social (facturación)</Label>
                  <Input id="rs" value={razonSocial} onChange={(e) => setRazonSocial(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rf">Régimen fiscal</Label>
                  <Input id="rf" value={regimenFiscal} onChange={(e) => setRegimenFiscal(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="zona">Zona (id)</Label>
                    <Input id="zona" className="font-mono text-xs" value={zonaId} onChange={(e) => setZonaId(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ruta">Ruta (id)</Label>
                    <Input id="ruta" className="font-mono text-xs" value={rutaId} onChange={(e) => setRutaId(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ps">Punto de servicio (id)</Label>
                  <Input id="ps" className="font-mono text-xs" value={puntoServicioId} onChange={(e) => setPuntoServicioId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ref">Referencia contrato anterior</Label>
                  <Input id="ref" value={referenciaContratoAnterior} onChange={(e) => setReferenciaContratoAnterior(e.target.value)} />
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
                  <Label htmlFor="bj">Bloqueo jurídico</Label>
                  <Switch id="bj" checked={bloqueadoJuridico} onCheckedChange={setBloqueadoJuridico} />
                </div>
                <div className="space-y-2">
                  <Label>Ciclo de facturación</Label>
                  <Select value={cicloFacturacion || '__empty'} onValueChange={(v) => setCicloFacturacion(v === '__empty' ? '' : v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__empty">—</SelectItem>
                      {CICLO_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-3 rounded-lg border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Indicadores de facturación</p>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="ier" className="font-normal">Emisión de recibo</Label>
                    <Switch id="ier" checked={indicadorEmisionRecibo} onCheckedChange={setIndicadorEmisionRecibo} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="ief" className="font-normal">Exentar facturación</Label>
                    <Switch id="ief" checked={indicadorExentarFacturacion} onCheckedChange={setIndicadorExentarFacturacion} />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="icc" className="font-normal">Contacto por correo</Label>
                    <Switch id="icc" checked={indicadorContactoCorreo} onCheckedChange={setIndicadorContactoCorreo} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="sp">Superficie predio (m²)</Label>
                    <Input id="sp" inputMode="decimal" value={superficiePredio} onChange={(e) => setSuperficiePredio(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sc">Superficie construida (m²)</Label>
                    <Input id="sc" inputMode="decimal" value={superficieConstruida} onChange={(e) => setSuperficieConstruida(e.target.value)} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="ma">Meses adeudo</Label>
                    <Input id="ma" inputMode="numeric" value={mesesAdeudo} onChange={(e) => setMesesAdeudo(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="us">Unidades servidas</Label>
                    <Input id="us" inputMode="numeric" value={unidadesServidas} onChange={(e) => setUnidadesServidas(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ph">Personas que habitan la vivienda</Label>
                  <Input id="ph" inputMode="numeric" value={personasHabitanVivienda} onChange={(e) => setPersonasHabitanVivienda(e.target.value)} />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="px-6 py-4 border-t shrink-0 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saveMutation.isPending}>
                Cancelar
              </Button>
              <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
