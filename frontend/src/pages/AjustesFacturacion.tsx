import { useState, useMemo } from 'react';
import { useData, TIPOS_AJUSTE_FACTURACION, type TipoAjusteFacturacionId } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import StatusBadge from '@/components/StatusBadge';

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

const AjustesFacturacion = () => {
  const {
    preFacturas,
    contratos,
    aplicarAjusteFactura,
    timbrados,
  } = useData();
  const [contratoIdFilter, setContratoIdFilter] = useState<string>('');
  const [preFacturaSeleccionada, setPreFacturaSeleccionada] = useState<typeof preFacturas[0] | null>(null);
  const [tipoAjusteId, setTipoAjusteId] = useState<TipoAjusteFacturacionId | ''>('');
  const [consumoM3, setConsumoM3] = useState('');
  const [descuentoAdicional, setDescuentoAdicional] = useState('');
  const [observacion, setObservacion] = useState('');
  const [mensaje, setMensaje] = useState<'ok' | 'error' | null>(null);

  const preFacturasNoTimbradas = useMemo(
    () => preFacturas.filter(
      (pf) => !timbrados.some((t) => t.preFacturaId === pf.id)
    ),
    [preFacturas, timbrados]
  );
  const preFacturasFiltradas = useMemo(
    () =>
      contratoIdFilter
        ? preFacturasNoTimbradas.filter((pf) => pf.contratoId === contratoIdFilter)
        : preFacturasNoTimbradas,
    [preFacturasNoTimbradas, contratoIdFilter]
  );

  const abrirDialogo = (pf: typeof preFacturas[0]) => {
    setPreFacturaSeleccionada(pf);
    setTipoAjusteId('');
    setConsumoM3(String(pf.consumoM3));
    setDescuentoAdicional('');
    setObservacion('');
    setMensaje(null);
  };

  const cerrarDialogo = () => {
    setPreFacturaSeleccionada(null);
    setTipoAjusteId('');
    setMensaje(null);
  };

  const enviarAjuste = () => {
    if (!preFacturaSeleccionada || !tipoAjusteId) return;
    const tipo = tipoAjusteId as TipoAjusteFacturacionId;
    const params = {
      tipoAjusteId: tipo,
      preFacturaId: preFacturaSeleccionada.id,
      observacion: observacion || undefined,
    };
    if (consumoM3 !== '' && !Number.isNaN(Number(consumoM3))) {
      params.consumoM3 = Number(consumoM3);
    }
    if (descuentoAdicional !== '' && !Number.isNaN(Number(descuentoAdicional))) {
      params.descuentoAdicional = Number(descuentoAdicional);
    }
    const ok = aplicarAjusteFactura(params);
    setMensaje(ok ? 'ok' : 'error');
    if (ok) setTimeout(cerrarDialogo, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <h1 className="page-title">Ajustes a la facturación</h1>
      </div>

      <div className="widget-card">
        <h2 className="section-title">Catálogo de tipos de ajuste</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Cada tipo de ajuste aplica un algoritmo distinto al modificar la factura (actualización de datos, corrección por lectura, descuento por área, etc.).
        </p>
        <div className="overflow-x-auto min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Área</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {TIPOS_AJUSTE_FACTURACION.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>{t.label}</TableCell>
                  <TableCell className="text-muted-foreground">{t.area}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="widget-card">
        <h2 className="section-title">Modificar factura (prefactura)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Seleccione una prefactura no timbrada y el tipo de ajuste; se aplicará el algoritmo correspondiente.
        </p>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <div>
            <Label htmlFor="ajuste-contrato" className="mr-2">Contrato</Label>
            <Select value={contratoIdFilter || 'all'} onValueChange={(v) => setContratoIdFilter(v === 'all' ? '' : v)}>
              <SelectTrigger id="ajuste-contrato" className="w-40">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {contratos.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="overflow-x-auto min-w-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Contrato</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Consumo m³</TableHead>
                <TableHead>Subtotal</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preFacturasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No hay prefacturas pendientes de timbrar para ajustar.
                  </TableCell>
                </TableRow>
              ) : (
                preFacturasFiltradas.map((pf) => (
                  <TableRow key={pf.id}>
                    <TableCell className="font-mono text-xs">{pf.id}</TableCell>
                    <TableCell>{pf.contratoId}</TableCell>
                    <TableCell>{pf.periodo}</TableCell>
                    <TableCell className="tabular-nums">{pf.consumoM3}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(pf.subtotal)}</TableCell>
                    <TableCell className="tabular-nums">{formatCurrency(pf.total)}</TableCell>
                    <TableCell><StatusBadge status={pf.estado} /></TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => abrirDialogo(pf)}>
                        Ajustar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!preFacturaSeleccionada} onOpenChange={(open) => !open && cerrarDialogo()}>
        <DialogContent className="sm:max-w-md" aria-describedby="ajuste-desc">
          <DialogHeader>
            <DialogTitle>Aplicar ajuste a prefactura</DialogTitle>
            <DialogDescription id="ajuste-desc">
              {preFacturaSeleccionada && (
                <>Prefactura {preFacturaSeleccionada.id} · Contrato {preFacturaSeleccionada.contratoId} · Periodo {preFacturaSeleccionada.periodo}</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="tipo-ajuste">Tipo de ajuste</Label>
              <Select value={tipoAjusteId} onValueChange={(v) => setTipoAjusteId(v as TipoAjusteFacturacionId)}>
                <SelectTrigger id="tipo-ajuste">
                  <SelectValue placeholder="Seleccione tipo" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_AJUSTE_FACTURACION.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.label} ({t.area})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(tipoAjusteId === 'actualizacion_datos' || tipoAjusteId === 'correccion_lectura') && (
              <div>
                <Label htmlFor="consumo-m3">Nuevo consumo (m³)</Label>
                <Input
                  id="consumo-m3"
                  type="number"
                  min={0}
                  value={consumoM3}
                  onChange={(e) => setConsumoM3(e.target.value)}
                />
              </div>
            )}
            {(tipoAjusteId === 'deuda' || tipoAjusteId === 'juridica' || tipoAjusteId === 'convenio' || tipoAjusteId === 'atencion_publico') && (
              <div>
                <Label htmlFor="descuento">Descuento adicional (MXN)</Label>
                <Input
                  id="descuento"
                  type="number"
                  min={0}
                  value={descuentoAdicional}
                  onChange={(e) => setDescuentoAdicional(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label htmlFor="observacion">Observación</Label>
              <Input
                id="observacion"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                placeholder="Motivo del ajuste (opcional)"
              />
            </div>
          </div>
          <DialogFooter>
            {mensaje === 'ok' && <span className="text-sm text-green-600">Ajuste aplicado.</span>}
            {mensaje === 'error' && <span className="text-sm text-destructive">No se pudo aplicar el ajuste.</span>}
            <Button variant="outline" onClick={cerrarDialogo}>Cancelar</Button>
            <Button onClick={enviarAjuste} disabled={!tipoAjusteId}>Aplicar ajuste</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AjustesFacturacion;
