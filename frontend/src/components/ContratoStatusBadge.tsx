import { AlertTriangle, Ban, CheckCircle, Clock, Gavel, Shield, WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import type { EstadoOperativoDto } from '@/api/contratos';

interface ContratoStatusBadgeProps {
  estado: string;
  compact?: boolean;
}

const estadoConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  Activo: { label: 'Activo', variant: 'default', icon: CheckCircle },
  activo: { label: 'Activo', variant: 'default', icon: CheckCircle },
  Cortado: { label: 'Cortado', variant: 'destructive', icon: WifiOff },
  cortado: { label: 'Cortado', variant: 'destructive', icon: WifiOff },
  'Baja Temporal': { label: 'Baja Temporal', variant: 'secondary', icon: Clock },
  BajaTemp: { label: 'Baja Temporal', variant: 'secondary', icon: Clock },
  'Baja Definitiva': { label: 'Baja Definitiva', variant: 'destructive', icon: Ban },
  BajaDef: { label: 'Baja Definitiva', variant: 'destructive', icon: Ban },
  Inactivo: { label: 'Inactivo', variant: 'secondary', icon: Ban },
};

export function ContratoStatusBadge({ estado, compact = false }: ContratoStatusBadgeProps) {
  const config = estadoConfig[estado] ?? { label: estado, variant: 'outline' as const, icon: Shield };
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1 text-xs font-medium">
      <Icon className={compact ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
      {config.label}
    </Badge>
  );
}

interface EstadoOperativoAlertsProps {
  estadoOp: EstadoOperativoDto;
}

export function EstadoOperativoAlerts({ estadoOp }: EstadoOperativoAlertsProps) {
  if (!estadoOp.alertas.length && !estadoOp.bloqueadoJuridico && !estadoOp.tieneAdeudo) return null;

  return (
    <div className="flex flex-col gap-2">
      {estadoOp.bloqueadoJuridico && (
        <Alert variant="destructive">
          <Gavel className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Bloqueo jurídico activo — Contacte al área legal antes de realizar cualquier operación.
          </AlertDescription>
        </Alert>
      )}
      {estadoOp.tieneAdeudo && !estadoOp.bloqueadoJuridico && (
        <Alert variant="default" className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Adeudo pendiente de <strong>${estadoOp.montoAdeudo.toFixed(2)} MXN</strong>.
            {estadoOp.tieneConvenioActivo && ' Convenio de pago activo.'}
          </AlertDescription>
        </Alert>
      )}
      {estadoOp.alertas
        .filter(a => !a.includes('Adeudo') && !a.includes('bloqueo jurídico'))
        .map((alerta, i) => (
          <Alert key={i} variant="default" className="border-slate-300 bg-slate-50 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{alerta}</AlertDescription>
          </Alert>
        ))}
    </div>
  );
}

interface CandadoActionsProps {
  estadoOp: EstadoOperativoDto;
  action: 'tramitar' | 'baja' | 'convenio' | 'reconectar';
  children: React.ReactNode;
}

/**
 * Wraps an action element and shows a disabled state with tooltip if the
 * corresponding canX flag is false.
 */
export function CandadoAction({ estadoOp, action, children }: CandadoActionsProps) {
  const allowed =
    action === 'tramitar' ? estadoOp.canTramitar :
    action === 'baja' ? estadoOp.canBaja :
    action === 'convenio' ? estadoOp.canConvenio :
    estadoOp.canReconectar;

  if (allowed) return <>{children}</>;

  const razones: Record<string, string> = {
    tramitar: 'Bloqueo jurídico activo',
    baja: estadoOp.tieneAdeudo ? 'Liquidar adeudo antes de dar de baja' : 'No disponible en estado actual',
    convenio: estadoOp.bloqueadoJuridico ? 'Bloqueo jurídico activo' : 'Sin adeudo para convenir',
    reconectar: estadoOp.bloqueadoJuridico ? 'Bloqueo jurídico activo' : 'Sin adeudo pendiente',
  };

  return (
    <div title={razones[action]} className="cursor-not-allowed opacity-50">
      <div className="pointer-events-none">{children}</div>
    </div>
  );
}
