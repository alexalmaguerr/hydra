import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, MessageSquareWarning, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getContextoAtencion, type ContextoAtencion } from '@/api/atencion';

interface ContextoRapidoProps {
  contratoId: string;
  onVerQuejas: () => void;
}

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr.length === 10 ? dateStr + 'T00:00:00' : dateStr);
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
  'Inactivo': {
    label: 'Contrato inactivo',
    icon: <XCircle className="h-4 w-4" />,
    className: 'text-gray-700 bg-gray-50 border-gray-200 dark:text-gray-400 dark:bg-gray-900 dark:border-gray-700',
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

export default function ContextoRapido({ contratoId, onVerQuejas }: ContextoRapidoProps) {
  const [contexto, setContexto] = useState<ContextoAtencion | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getContextoAtencion(contratoId)
      .then(setContexto)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [contratoId]);

  if (loading) {
    return <div className="text-sm text-muted-foreground py-4">Cargando contexto...</div>;
  }
  if (!contexto) {
    return <div className="text-sm text-muted-foreground py-4">No se pudo cargar el contexto.</div>;
  }

  const { contrato, saldo, ultimosPagos, quejasAbiertas, resumen } = contexto;
  const estadoConfig = ESTADO_CONFIG[contrato.estado] ?? ESTADO_CONFIG['Activo'];

  const alertas: { tipo: 'error' | 'warning' | 'info'; mensaje: string }[] = [];
  if (contrato.estado === 'Suspendido') {
    alertas.push({ tipo: 'error', mensaje: 'Servicio suspendido' });
  }
  if (quejasAbiertas.length > 0) {
    alertas.push({ tipo: 'warning', mensaje: `${quejasAbiertas.length} queja${quejasAbiertas.length > 1 ? 's' : ''} abierta${quejasAbiertas.length > 1 ? 's' : ''}` });
  }
  if (saldo > 0) {
    alertas.push({ tipo: 'info', mensaje: `Saldo pendiente: ${formatCurrency(saldo)}` });
  }

  const ultimoPago = ultimosPagos[0] ?? null;

  return (
    <div className="space-y-3">
      {alertas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {alertas.map((a, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium border cursor-pointer',
                a.tipo === 'error' && 'bg-red-50 text-red-700 border-red-200',
                a.tipo === 'warning' && 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100',
                a.tipo === 'info' && 'bg-blue-50 text-blue-700 border-blue-200',
              )}
              onClick={a.tipo === 'warning' ? onVerQuejas : undefined}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {a.mensaje}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Estado */}
        <div className={cn('rounded-lg border p-3 flex flex-col gap-1', estadoConfig.className)}>
          <div className="text-xs font-medium uppercase tracking-wide opacity-70">Estado</div>
          <div className="flex items-center gap-1.5 font-semibold text-sm">
            {estadoConfig.icon}
            {estadoConfig.label}
          </div>
          <div className="text-xs opacity-60">{contrato.tipoServicio}</div>
        </div>

        {/* Saldo */}
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            <CreditCard className="h-3.5 w-3.5" />
            Saldo pendiente
          </div>
          <div className={cn('font-bold text-lg tabular-nums', saldo > 0 ? 'text-red-600' : 'text-green-600')}>
            {formatCurrency(saldo)}
          </div>
          <div className="text-xs text-muted-foreground">
            Facturado: {formatCurrency(resumen.totalFacturado)}
          </div>
        </div>

        {/* Último pago */}
        <div className="rounded-lg border bg-card p-3 flex flex-col gap-1">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Último pago</div>
          {ultimoPago ? (
            <>
              <div className="font-bold text-lg tabular-nums text-green-600">
                {formatCurrency(Number(ultimoPago.monto))}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(ultimoPago.fecha)} · {ultimoPago.tipo}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">Sin pagos</div>
          )}
        </div>

        {/* Quejas */}
        <button
          onClick={onVerQuejas}
          className={cn(
            'rounded-lg border p-3 flex flex-col gap-1 text-left transition-colors',
            quejasAbiertas.length > 0
              ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
              : 'bg-card hover:bg-accent'
          )}
        >
          <div className={cn(
            'flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide',
            quejasAbiertas.length > 0 ? 'text-amber-700' : 'text-muted-foreground'
          )}>
            <MessageSquareWarning className="h-3.5 w-3.5" />
            Quejas / Aclaraciones
          </div>
          <div className={cn('font-bold text-lg', quejasAbiertas.length > 0 ? 'text-amber-700' : 'text-foreground')}>
            {quejasAbiertas.length > 0 ? `${quejasAbiertas.length} abierta${quejasAbiertas.length > 1 ? 's' : ''}` : 'Sin pendientes'}
          </div>
        </button>
      </div>
    </div>
  );
}
