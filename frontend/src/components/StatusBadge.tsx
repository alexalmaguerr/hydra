import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'muted';

const statusVariant: Record<string, Variant> = {
  Aprobada: 'success',
  Finalizada: 'success',
  Activo: 'success',
  Activa: 'success',
  Válida: 'success',
  Validada: 'success',
  Aceptada: 'success',
  'Timbrada OK': 'success',
  Disponible: 'success',
  Completado: 'success',
  Pagada: 'success',
  Resuelta: 'success',
  Cerrada: 'success',
  Cumplido: 'success',
  COBRADA: 'success',
  'En reparación': 'warning',
  'En comité': 'warning',
  'En proceso': 'warning',
  'Pendiente de alta': 'warning',
  Pendiente: 'warning',
  'En trámite': 'warning',
  'Por cobrar': 'warning',
  'En atención': 'warning',
  Registrada: 'warning',
  Vigente: 'warning',
  PENDIENTE: 'warning',
  'No válida': 'danger',
  Rechazada: 'danger',
  Rechazado: 'danger',
  Cancelado: 'danger',
  Inactivo: 'danger',
  'Error PAC': 'danger',
  Vencida: 'danger',
  Vencido: 'danger',
  Suspendido: 'danger',
  'Pre-factibilidad': 'info',
  Planeación: 'info',
  Asignada: 'info',
  ALIA: 'info',
};

const variantClasses: Record<Variant, { pill: string; dot: string }> = {
  success: {
    pill: 'bg-emerald-50 text-emerald-800',
    dot: 'bg-emerald-500',
  },
  warning: {
    pill: 'bg-amber-50 text-amber-800',
    dot: 'bg-amber-500',
  },
  danger: {
    pill: 'bg-red-50 text-red-700',
    dot: 'bg-red-500',
  },
  info: {
    pill: 'bg-blue-50 text-blue-700',
    dot: 'bg-blue-400',
  },
  muted: {
    pill: 'bg-slate-100 text-slate-600',
    dot: 'bg-slate-400',
  },
};

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variant = statusVariant[status] ?? 'muted';
  const { pill, dot } = variantClasses[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        pill,
        className,
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dot)} />
      {status}
    </span>
  );
};

export default StatusBadge;
