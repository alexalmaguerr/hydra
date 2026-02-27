import { useState, useEffect, useCallback } from 'react';
import { MessageSquarePlus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  getTramiteSeguimientos,
  addTramiteSeguimiento,
  type TramiteSeguimientoDto,
} from '@/api/tramites';

interface SeguimientoPanelProps {
  tramiteId: string;
  usuarioActual?: string;
  /** Called after a new note is added */
  onAdded?: () => void;
}

const TIPOS_NOTA = ['Interno', 'Seguimiento', 'Resolucion', 'Notificacion'] as const;

function formatDateTime(s: string) {
  const d = new Date(s);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const TIPO_COLOR: Record<string, string> = {
  Interno: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  Seguimiento: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  Resolucion: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
  Notificacion: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200',
};

export default function SeguimientoPanel({
  tramiteId,
  usuarioActual = 'sistema',
  onAdded,
}: SeguimientoPanelProps) {
  const [seguimientos, setSeguimientos] = useState<TramiteSeguimientoDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [nota, setNota] = useState('');
  const [tipo, setTipo] = useState<string>('Interno');
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getTramiteSeguimientos(tramiteId)
      .then(setSeguimientos)
      .catch(() => setSeguimientos([]))
      .finally(() => setLoading(false));
  }, [tramiteId]);

  useEffect(() => { load(); }, [load]);

  async function handleAdd() {
    if (!nota.trim()) return;
    setSaving(true);
    try {
      await addTramiteSeguimiento(tramiteId, {
        nota: nota.trim(),
        usuario: usuarioActual,
        tipo,
      });
      setNota('');
      load();
      onAdded?.();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Seguimiento interno
        </p>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={load} disabled={loading}>
          <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
        </Button>
      </div>

      {/* Note list */}
      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
        {loading && <p className="text-xs text-muted-foreground">Cargando notas...</p>}
        {!loading && seguimientos.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin notas de seguimiento.</p>
        )}
        {seguimientos.map((s) => (
          <div key={s.id} className="rounded-md border p-2.5 text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', TIPO_COLOR[s.tipo] ?? TIPO_COLOR.Interno)}>
                {s.tipo}
              </span>
              <span className="text-muted-foreground tabular-nums">{formatDateTime(s.fecha)}</span>
            </div>
            <p className="break-words">{s.nota}</p>
            <p className="text-muted-foreground">Por: {s.usuario}</p>
          </div>
        ))}
      </div>

      {/* Add note */}
      <div className="space-y-2 border-t pt-3">
        <div className="flex gap-2">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIPOS_NOTA.map((t) => (
                  <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Textarea
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Agregar nota de seguimiento..."
          className="text-xs min-h-[60px] resize-none"
        />
        <Button
          size="sm"
          className="gap-1.5 text-xs h-7"
          onClick={handleAdd}
          disabled={saving || !nota.trim()}
        >
          <MessageSquarePlus className="h-3.5 w-3.5" />
          {saving ? 'Guardando...' : 'Agregar nota'}
        </Button>
      </div>
    </div>
  );
}
