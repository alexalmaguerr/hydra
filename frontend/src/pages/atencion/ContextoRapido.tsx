import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Droplets, MessageSquareWarning, XCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contrato, QuejaAclaracion, Pago, Recibo, PagoParcialidad } from '@/context/DataContext';

interface ContextoRapidoProps {
  contrato: Contrato;
  quejas: QuejaAclaracion[];
  pagos: Pago[];
  recibos: Recibo[];
  pagosParcialidad: PagoParcialidad[];
  onVerQuejas: () => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + (dateStr.length === 10 ? 'T00:00:00' : ''));
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADO_CONFIG: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  'Activo': {
    label: 'Servicio activo',
    icon: <CheckCircle2 className="h-4 w-4" />,
    className: 'text-green-700 bg-green-50 border-green-200 dark:text-green-400 dark:bg-green-950 dark:border-green-800',
  },
  'Suspendido': {
    label: 'Servicio suspendido',
    icon: <XCircle className="h-4 w-4" />,
    className: 'text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950 dark:border-red-800',
  },
  'Cancelado': {
    label: 'Contrato cancelado',
    icon: <XCircle className="h-4 w-4" />,
    className: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700',
  },
  'Pendiente de alta': {
    label: 'Pendiente de alta',
    icon: <Clock className="h-4 w-4" />,
    className: 'text-yellow-700 bg-yellow-50 border-yellow-200 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-800',
  },
};

interface AlertaItem {
  tipo: 'error' | 'warning' | 'info';
  mensaje: string;
}

export default function ContextoRapido({
  contrato,
  quejas,
  pagos,
  recibos,
  pagosParcialidad,
  onVerQuejas,
}: ContextoRapidoProps) {
  const { alertas, deudaTotal, deudaConvenio, deudaActual, ultimoPago, quejasAbiertas, ultimaQueja } = useMemo(() => {
    const quejasAbiertas = quejas.filter(q => q.estado === 'Registrada' || q.estado === 'En atención');
    const ultimaQueja = [...quejas].sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null;
    const ultimoPago = [...pagos].sort((a, b) => b.fecha.localeCompare(a.fecha))[0] ?? null;

    const parcialidadesPendientes = pagosParcialidad.filter(
      p => p.contratoId === contrato.id && p.estado === 'Pendiente'
    );
    const vencidas = parcialidadesPendientes.filter(p => p.fechaVencimiento < new Date().toISOString().slice(0, 10));

    // Deuda calculada a partir de recibos
    const recibosPorContrato = recibos.filter(r => r.contratoId === contrato.id);
    const deudaTotal = recibosPorContrato.reduce((acc, r) => acc + r.saldoVigente + r.saldoVencido, 0);
    const deudaConvenio = recibosPorContrato.reduce((acc, r) => acc + r.parcialidades, 0);
    const deudaActual = Math.max(0, deudaTotal - deudaConvenio);

    const alertas: AlertaItem[] = [];
    if (contrato.estado === 'Suspendido') {
      alertas.push({ tipo: 'error', mensaje: `Servicio suspendido${contrato.fechaReconexionPrevista ? ` · Reconexión prevista: ${formatDate(contrato.fechaReconexionPrevista)}` : ''}` });
    }
    if (quejasAbiertas.length > 0) {
      alertas.push({ tipo: 'warning', mensaje: `${quejasAbiertas.length} queja${quejasAbiertas.length > 1 ? 's' : ''} abierta${quejasAbiertas.length > 1 ? 's' : ''}` });
    }
    if (vencidas.length > 0) {
      alertas.push({ tipo: 'error', mensaje: `${vencidas.length} parcialidad${vencidas.length > 1 ? 'es' : ''} vencida${vencidas.length > 1 ? 's' : ''}` });
    }
    if (deudaActual > 0 && contrato.estado === 'Activo') {
      alertas.push({ tipo: 'info', mensaje: `Deuda actual: ${formatCurrency(deudaActual)}` });
    }

    return { alertas, deudaTotal, deudaConvenio, deudaActual, ultimoPago, quejasAbiertas, ultimaQueja };
  }, [contrato, quejas, pagos, recibos, pagosParcialidad]);

  const estadoConfig = ESTADO_CONFIG[contrato.estado] ?? ESTADO_CONFIG['Activo'];

  return (
    <div className="space-y-3">
      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border',
                a.tipo === 'error' && 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
                a.tipo === 'warning' && 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:border-yellow-800 cursor-pointer hover:bg-yellow-100',
                a.tipo === 'info' && 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800',
              )}
              onClick={a.tipo === 'warning' ? onVerQuejas : undefined}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {a.mensaje}
            </div>
          ))}
        </div>
      )}

      {/* Panel de cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Estado del servicio */}
        <div className={cn('rounded-lg border p-3 flex flex-col gap-1', estadoConfig.className)}>
          <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide opacity-70">
            <Droplets className="h-3.5 w-3.5" />
            Estado
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            {estadoConfig.icon}
            {estadoConfig.label}
          </div>
          <div className="text-xs opacity-60">{contrato.tipoServicio} · {contrato.tipoContrato}</div>
        </div>

        {/* Deuda total */}
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <CreditCard className="h-3.5 w-3.5" />
            Deuda total
          </div>
          <div className={cn('font-bold text-lg tabular-nums', deudaTotal > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400')}>
            {formatCurrency(deudaTotal)}
          </div>
          <div className="text-xs text-muted-foreground">
            Convenio: {formatCurrency(deudaConvenio)}
          </div>
        </div>

        {/* Deuda actual */}
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <Zap className="h-3.5 w-3.5" />
            Deuda actual
          </div>
          <div className={cn('font-bold text-lg tabular-nums', deudaActual > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400')}>
            {formatCurrency(deudaActual)}
          </div>
          <div className="text-xs text-muted-foreground">
            {ultimoPago ? `Último pago: ${formatDate(ultimoPago.fecha)}` : 'Sin pagos registrados'}
          </div>
        </div>

        {/* Quejas abiertas */}
        <button
          onClick={onVerQuejas}
          className={cn(
            'rounded-lg border p-3 flex flex-col gap-1 text-left transition-colors',
            quejasAbiertas.length > 0
              ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-950 dark:border-amber-800'
              : 'bg-card hover:bg-accent'
          )}
        >
          <div className={cn(
            'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide',
            quejasAbiertas.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-muted-foreground'
          )}>
            <MessageSquareWarning className="h-3.5 w-3.5" />
            Quejas / Aclaraciones
          </div>
          <div className={cn(
            'font-bold text-lg',
            quejasAbiertas.length > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-foreground'
          )}>
            {quejasAbiertas.length > 0 ? `${quejasAbiertas.length} abierta${quejasAbiertas.length > 1 ? 's' : ''}` : 'Sin pendientes'}
          </div>
          {ultimaQueja && (
            <div className="text-xs text-muted-foreground truncate">
              Última: {formatDate(ultimaQueja.fecha)} · {ultimaQueja.tipo}
            </div>
          )}
          {!ultimaQueja && (
            <div className="text-xs text-muted-foreground">Sin historial</div>
          )}
        </button>
      </div>
    </div>
  );
}
