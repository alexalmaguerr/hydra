/**
 * CuantificacionModal — Formulario de cuantificación / cotización.
 *
 * Secciones:
 *  - Encabezado: administración, folio, certificado, contratante, fechas, forma de pago
 *  - Ubicación del servicio: domicilio, materiales (si hay inspección)
 *  - Requerimientos: diámetros, longitudes, tarifa, unidades, elabora, observaciones
 *  - Agua (si aplica): tipo, periodo, meses, consumo m³
 *
 * El cálculo detallado se implementará en una tarea posterior.
 */

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { fetchAdministraciones } from '@/api/catalogos';
import {
  getTiposTarifa,
  resolveAdministracion,
  calcularCargoPeriodo,
  RECARGO_MENSUAL,
} from '@/lib/tarifas';
import type { SolicitudRecord, OrdenInspeccionData } from '@/types/solicitudes';

// ── Constantes ────────────────────────────────────────────────────────────────

const DIAMETROS_TOMA = ["1/2\"", "3/4\"", "1\"", "1.5\"", "2\"", "3\"", "4\""];

const FORMAS_PAGO = [
  { value: 'contado',   label: 'Contado' },
  { value: '3_meses',   label: '3 meses' },
  { value: '6_meses',   label: '6 meses' },
  { value: '9_meses',   label: '9 meses' },
  { value: '12_meses',  label: '12 meses' },
];

const TIPO_AGUA_OPTS = [
  { value: 'individual',  label: 'Individual' },
  { value: 'condominal',  label: 'Condominal' },
];

const NUM_MESES_OPTS = [3, 6, 9, 12] as const;

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });

/** Genera folio de cuantificación temporal hasta que el backend lo provea. */
function generarFolioCuantificacion(solicitudFolio: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  return `COT-${yy}${mm}-${solicitudFolio}`;
}

function toMonthInput(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(yyyymm: string, n: number): string {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toMonthInput(d);
}

function monthLabel(yyyymm: string): string {
  const [y, m] = yyyymm.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
}

// ── Tipos internos ────────────────────────────────────────────────────────────

export interface CuantificacionData {
  folioCuantificacion: string;
  noCertConexion: string;
  elabora: string;
  observaciones: string;
  fechaEmision: string;       // ISO date string
  fechaVigencia: string;      // ISO date string
  formaPago: string;
  // Requerimientos
  diametroToma: string;
  diametroDescarga: string;
  tarifa: string;
  unidadesServidas: number;
  // Agua
  incluirAgua: boolean;
  tipoAgua: 'individual' | 'condominal';
  periodoInicio: string;      // YYYY-MM
  periodoFin: string;         // YYYY-MM (auto-computed from inicio + numMeses)
  numMeses: number;
  consumoM3: number;
  aplicaAgua: boolean;
  aplicaAlcantarillado: boolean;
  aplicaSaneamiento: boolean;
}

export interface CuantificacionModalProps {
  record: SolicitudRecord | null;
  open: boolean;
  onClose: () => void;
  tipoContratacionNombre?: string;
  /** Llamado al guardar — el padre persiste los datos */
  onGuardar: (data: CuantificacionData) => Promise<void>;
  /** Llamado al avanzar a aceptar cotización */
  onAceptar: (data: CuantificacionData) => void;
}

// ── Componente ────────────────────────────────────────────────────────────────

export function CuantificacionModal({
  record,
  open,
  onClose,
  tipoContratacionNombre,
  onGuardar,
  onAceptar,
}: CuantificacionModalProps) {
  const fd = record?.formData;
  const insp: OrdenInspeccionData | undefined = record?.ordenInspeccion;
  const tieneInspeccion = Boolean(insp);

  // Catálogo de administraciones para mostrar nombre legible
  const { data: adminsData } = useQuery({
    queryKey: ['catalogos', 'administraciones'],
    queryFn: fetchAdministraciones,
    staleTime: 30 * 60 * 1000,
    enabled: open,
  });

  const adminNombre = useMemo(() => {
    if (!fd?.adminId) return '—';
    return adminsData?.find((a) => a.id === fd.adminId)?.nombre ?? fd.adminId;
  }, [adminsData, fd?.adminId]);

  // Tarifa: list from CSV catalog filtered to current admin
  const adminCatalogo = resolveAdministracion(adminNombre) ?? 'QUERÉTARO';
  const tiposTarifa = getTiposTarifa(adminCatalogo);

  // Unidades servidas: para doméstico, tomar condoViviendas; si no, 1
  const unidadesDefault = useMemo(() => {
    if (!fd) return 1;
    if (fd.usoDomestico === 'si' && fd.esCondominio === 'si') {
      return parseInt(fd.condoViviendas, 10) || 1;
    }
    return 1;
  }, [fd]);

  // Tarifa inicial: resolver desde tipoContratacionNombre
  const tarifaDefault = useMemo(() => {
    if (!tipoContratacionNombre) return tiposTarifa[0] ?? '';
    // Busca coincidencia parcial en la lista de tarifas
    const upper = tipoContratacionNombre.toUpperCase();
    return tiposTarifa.find((t) => upper.includes(t.toUpperCase()) || t.toUpperCase().includes(upper))
      ?? tiposTarifa[0] ?? '';
  }, [tipoContratacionNombre, tiposTarifa]);

  // ── Estado del formulario ──────────────────────────────────────────────────

  const hoy = new Date();
  const vigenciaDefault = new Date(hoy);
  vigenciaDefault.setDate(vigenciaDefault.getDate() + 5);

  const [folio]             = useState(() => generarFolioCuantificacion(record?.folio ?? ''));
  const [noCertConexion, setNoCertConexion]   = useState('');
  const [elabora, setElabora]                 = useState('');
  const [observaciones, setObservaciones]     = useState('');
  const [fechaVigencia, setFechaVigencia]     = useState(vigenciaDefault.toISOString().slice(0, 10));
  const [formaPago, setFormaPago]             = useState('contado');
  const [diametroToma, setDiametroToma]       = useState(insp?.diametroToma ?? '');
  const [diametroDescarga, setDiametroDescarga] = useState('');
  const [tarifa, setTarifa]                   = useState(tarifaDefault);
  const [unidades, setUnidades]               = useState(String(unidadesDefault));
  const [incluirAgua, setIncluirAgua]           = useState(true);
  const [tipoAgua, setTipoAgua]                 = useState<'individual' | 'condominal'>(
    fd?.esCondominio === 'si' ? 'condominal' : 'individual',
  );
  const [periodoInicio, setPeriodoInicio]       = useState(toMonthInput(hoy));
  const [numMeses, setNumMeses]                 = useState<number>(3);
  const [consumoM3, setConsumoM3]               = useState('');
  const [aplicaAgua, setAplicaAgua]             = useState(true);
  const [aplicaAlcantarillado, setAplicaAlcantarillado] = useState(true);
  const [aplicaSaneamiento, setAplicaSaneamiento]       = useState(true);

  // Período fin: auto-calculado desde inicio + numMeses
  const periodoFin = useMemo(
    () => addMonths(periodoInicio, numMeses - 1),
    [periodoInicio, numMeses],
  );

  // Vista previa del cálculo de agua por mes
  const previewRows = useMemo(() => {
    if (!incluirAgua) return [];
    const m3 = parseFloat(consumoM3) || 0;
    if (m3 <= 0 || !tarifa) return [];
    const u = parseInt(unidades, 10) || 1;
    const cargo = calcularCargoPeriodo(adminCatalogo, tarifa, m3, u);
    if (!cargo) return [];

    const rows: { mes: string; agua: number; alc: number; san: number; recargo: number; total: number }[] = [];
    let saldoVencido = 0;
    for (let i = 0; i < numMeses; i++) {
      const mes = monthLabel(addMonths(periodoInicio, i));
      const agua = aplicaAgua ? cargo.agua : 0;
      const alc  = aplicaAlcantarillado ? cargo.alcantarillado : 0;
      const san  = aplicaSaneamiento ? cargo.saneamiento : 0;
      const servicio = agua + alc + san;
      const recargo  = saldoVencido * RECARGO_MENSUAL;
      const total    = servicio + recargo;
      rows.push({ mes, agua, alc, san, recargo, total });
      saldoVencido += servicio;
    }
    return rows;
  }, [incluirAgua, consumoM3, unidades, adminCatalogo, tarifa, numMeses, periodoInicio, aplicaAgua, aplicaAlcantarillado, aplicaSaneamiento]);

  // Pre-llenar desde inspección cuando cambia el record
  useEffect(() => {
    if (!insp) return;
    if (insp.diametroToma) setDiametroToma(insp.diametroToma);
  }, [insp]);

  // Pre-llenar tarifa cuando carga el catálogo
  useEffect(() => {
    if (tarifaDefault) setTarifa(tarifaDefault);
  }, [tarifaDefault]);

  const [guardando, setGuardando] = useState(false);

  const requiresCert = fd?.tieneCertConexion === 'si';

  // Campos de solo-lectura de la inspección
  const longToma      = insp?.metrosRupturaAguaCalle ?? insp?.metrosRupturaCalle;
  const longDescarga  = insp?.metrosRupturaDrenajeCalle;
  const matCalle      = insp?.materialCalle;
  const matBanqueta   = insp?.materialBanqueta;

  // Dirección del predio
  const domicilio = useMemo(() => {
    const p = fd?.predioDir;
    if (!p) return record?.predioResumen ?? '—';
    return [p.calle, p.numExterior ? `#${p.numExterior}` : '', p.coloniaINEGIId, p.municipioINEGIId]
      .filter(Boolean).join(', ') || record?.predioResumen || '—';
  }, [fd, record]);

  // Nombre del contratante
  const contratante = useMemo(() => {
    if (!fd) return record?.propNombreCompleto ?? '—';
    if (fd.propTipoPersona === 'moral') return fd.propRazonSocial || record?.propNombreCompleto || '—';
    return [fd.propPaterno, fd.propMaterno, fd.propNombre].filter(Boolean).join(' ')
      || record?.propNombreCompleto || '—';
  }, [fd, record]);

  if (!record) return null;

  function buildData(): CuantificacionData {
    return {
      folioCuantificacion: folio,
      noCertConexion,
      elabora,
      observaciones,
      fechaEmision: hoy.toISOString().slice(0, 10),
      fechaVigencia,
      formaPago,
      diametroToma,
      diametroDescarga,
      tarifa,
      unidadesServidas: parseInt(unidades, 10) || 1,
      incluirAgua,
      tipoAgua,
      periodoInicio,
      periodoFin,
      numMeses,
      consumoM3: parseFloat(consumoM3) || 0,
      aplicaAgua,
      aplicaAlcantarillado,
      aplicaSaneamiento,
    };
  }

  async function handleGuardar() {
    setGuardando(true);
    try { await onGuardar(buildData()); }
    finally { setGuardando(false); }
  }

  function handleAceptar() {
    onAceptar(buildData());
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cuantificación</DialogTitle>
          <DialogDescription>{record.folio} · {contratante}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">

          {/* ── Encabezado ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">

            <Field label="Administración">
              <Input value={adminNombre} readOnly className="bg-muted/40" />
            </Field>

            <Field label="Folio cuantificación">
              <Input value={folio} readOnly className="bg-muted/40 font-mono text-sm" />
            </Field>

            <Field label="Contratante">
              <Input value={contratante} readOnly className="bg-muted/40" />
            </Field>

            <Field
              label="No. certificado de conexión"
              required={requiresCert}
              hint={!requiresCert ? 'No aplica (solicitud sin certificado)' : undefined}
            >
              <Input
                value={noCertConexion}
                onChange={(e) => setNoCertConexion(e.target.value)}
                placeholder={requiresCert ? 'Obligatorio' : 'Opcional'}
                disabled={!requiresCert && noCertConexion === ''}
              />
            </Field>

            <Field label="Fecha de emisión">
              <Input value={hoy.toLocaleDateString('es-MX')} readOnly className="bg-muted/40" />
            </Field>

            <Field label="Fecha de vigencia">
              <Input
                type="date"
                value={fechaVigencia}
                onChange={(e) => setFechaVigencia(e.target.value)}
              />
            </Field>

            <Field label="Forma de pago">
              <Select value={formaPago} onValueChange={setFormaPago}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FORMAS_PAGO.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

          </div>

          <Separator />

          {/* ── Ubicación del servicio ─────────────────────────────────── */}
          <SectionTitle>Ubicación del servicio</SectionTitle>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <Field label="Domicilio" className="col-span-2">
              <Input value={domicilio} readOnly className="bg-muted/40" />
            </Field>

            {tieneInspeccion && matCalle && (
              <Field label="Material de la calle">
                <Input value={matCalle} readOnly className="bg-muted/40 capitalize" />
              </Field>
            )}

            {tieneInspeccion && matBanqueta && (
              <Field label="Material de la banqueta">
                <Input value={matBanqueta} readOnly className="bg-muted/40 capitalize" />
              </Field>
            )}
          </div>

          <Separator />

          {/* ── Requerimientos ─────────────────────────────────────────── */}
          <SectionTitle>Requerimientos</SectionTitle>

          <div className="grid grid-cols-2 gap-x-6 gap-y-3">

            <Field label="Diámetro de la toma">
              <Select value={diametroToma} onValueChange={setDiametroToma}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {DIAMETROS_TOMA.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {tieneInspeccion && longToma !== undefined ? (
              <Field label="Longitud de la toma (m)">
                <Input value={longToma ?? ''} readOnly className="bg-muted/40" />
              </Field>
            ) : (
              <Field label="Longitud de la toma (m)" hint="Sin datos de inspección">
                <Input placeholder="m.l." disabled />
              </Field>
            )}

            <Field label="Diámetro de la descarga">
              <Select value={diametroDescarga} onValueChange={setDiametroDescarga}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {DIAMETROS_TOMA.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {tieneInspeccion && longDescarga !== undefined ? (
              <Field label="Longitud de la descarga (m)">
                <Input value={longDescarga ?? ''} readOnly className="bg-muted/40" />
              </Field>
            ) : (
              <Field label="Longitud de la descarga (m)" hint="Sin datos de inspección">
                <Input placeholder="m.l." disabled />
              </Field>
            )}

            <Field label="Tarifa">
              <Select value={tarifa} onValueChange={setTarifa}>
                <SelectTrigger><SelectValue placeholder="Seleccionar…" /></SelectTrigger>
                <SelectContent>
                  {tiposTarifa.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Unidades servidas">
              <Input
                type="number"
                min={1}
                value={unidades}
                onChange={(e) => setUnidades(e.target.value)}
              />
            </Field>

            <Field label="Elabora" className="col-span-2">
              <Input
                value={elabora}
                onChange={(e) => setElabora(e.target.value)}
                placeholder="Nombre de quien elabora"
              />
            </Field>

            <Field label="Observaciones" className="col-span-2">
              <Textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Observaciones generales…"
                rows={3}
                className="resize-none"
              />
            </Field>

          </div>

          <Separator />

          {/* ── Agua ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between">
            <SectionTitle>Servicios de agua</SectionTitle>
            <button
              type="button"
              onClick={() => setIncluirAgua((v) => !v)}
              className="text-xs text-blue-600 hover:underline"
            >
              {incluirAgua ? 'Quitar sección' : '+ Incluir agua'}
            </button>
          </div>

          {incluirAgua && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">

                <Field label="Tipo">
                  <Select value={tipoAgua} onValueChange={(v) => setTipoAgua(v as 'individual' | 'condominal')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPO_AGUA_OPTS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Consumo (m³)">
                  <Input
                    type="number"
                    min={0}
                    step={0.1}
                    value={consumoM3}
                    onChange={(e) => setConsumoM3(e.target.value)}
                    placeholder="m³"
                  />
                </Field>

                <Field label="Periodo inicio">
                  <Input
                    type="month"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                  />
                </Field>

                <Field label="Número de meses">
                  <div className="flex gap-2">
                    {NUM_MESES_OPTS.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setNumMeses(n)}
                        className={`flex-1 h-9 rounded-md border text-sm font-medium transition-colors
                          ${numMeses === n
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-background hover:bg-muted'}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Periodo fin">
                  <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm tabular-nums">
                    {monthLabel(periodoFin)}
                    <Badge variant="secondary" className="ml-2 text-xs">Auto</Badge>
                  </div>
                </Field>

                <Field label="Total meses">
                  <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm tabular-nums">
                    {numMeses} meses
                  </div>
                </Field>

              </div>

              {/* Checkboxes de conceptos */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  Conceptos a incluir
                </p>
                <div className="flex flex-wrap gap-5">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={aplicaAgua}
                      onCheckedChange={(v) => setAplicaAgua(Boolean(v))}
                    />
                    Agua
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={aplicaAlcantarillado}
                      onCheckedChange={(v) => setAplicaAlcantarillado(Boolean(v))}
                    />
                    Alcantarillado (10%)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <Checkbox
                      checked={aplicaSaneamiento}
                      onCheckedChange={(v) => setAplicaSaneamiento(Boolean(v))}
                    />
                    Saneamiento (12%)
                  </label>
                </div>
              </div>

              {/* Vista previa del cálculo */}
              {previewRows.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Proyección de cobro
                  </p>
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium">Mes</th>
                          {aplicaAgua          && <th className="px-3 py-2 text-right font-medium">Agua</th>}
                          {aplicaAlcantarillado && <th className="px-3 py-2 text-right font-medium">Alcantarillado</th>}
                          {aplicaSaneamiento    && <th className="px-3 py-2 text-right font-medium">Saneamiento</th>}
                          <th className="px-3 py-2 text-right font-medium">Recargo</th>
                          <th className="px-3 py-2 text-right font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewRows.map((row, i) => (
                          <tr key={i} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                            <td className="px-3 py-1.5 capitalize">{row.mes}</td>
                            {aplicaAgua          && <td className="px-3 py-1.5 text-right tabular-nums">{MXN.format(row.agua)}</td>}
                            {aplicaAlcantarillado && <td className="px-3 py-1.5 text-right tabular-nums">{MXN.format(row.alc)}</td>}
                            {aplicaSaneamiento    && <td className="px-3 py-1.5 text-right tabular-nums">{MXN.format(row.san)}</td>}
                            <td className="px-3 py-1.5 text-right tabular-nums text-orange-600">
                              {row.recargo > 0 ? MXN.format(row.recargo) : '—'}
                            </td>
                            <td className="px-3 py-1.5 text-right tabular-nums font-medium">{MXN.format(row.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-muted/50 font-medium">
                        <tr>
                          <td className="px-3 py-2">Total</td>
                          {aplicaAgua          && <td className="px-3 py-2 text-right tabular-nums">{MXN.format(previewRows.reduce((s, r) => s + r.agua, 0))}</td>}
                          {aplicaAlcantarillado && <td className="px-3 py-2 text-right tabular-nums">{MXN.format(previewRows.reduce((s, r) => s + r.alc, 0))}</td>}
                          {aplicaSaneamiento    && <td className="px-3 py-2 text-right tabular-nums">{MXN.format(previewRows.reduce((s, r) => s + r.san, 0))}</td>}
                          <td className="px-3 py-2 text-right tabular-nums text-orange-600">{MXN.format(previewRows.reduce((s, r) => s + r.recargo, 0))}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{MXN.format(previewRows.reduce((s, r) => s + r.total, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {incluirAgua && (!consumoM3 || parseFloat(consumoM3) <= 0) && (
                <p className="text-xs text-muted-foreground">
                  Ingresa el consumo en m³ para ver la proyección.
                </p>
              )}
            </div>
          )}

        </div>

        {/* ── Acciones ───────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleGuardar}
              disabled={guardando || (requiresCert && !noCertConexion)}
            >
              {guardando ? 'Guardando…' : 'Guardar borrador'}
            </Button>
            <Button
              onClick={handleAceptar}
              disabled={!tarifa || (requiresCert && !noCertConexion)}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Ver cotización →
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}

// ── Sub-componentes ───────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ''}`}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}
