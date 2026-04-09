import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData, type FactibilidadEstado } from '@/context/DataContext';
import { PageHeader } from '@/components/PageHeader';
import { KpiCard } from '@/components/KpiCard';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, SlidersHorizontal, Download, MoreVertical, TrendingUp, AlertTriangle } from 'lucide-react';

function AvatarInitials({ name }: { name: string }) {
  const parts = name.trim().split(' ');
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  // consistent color from name
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500',
    'bg-amber-500', 'bg-rose-500', 'bg-indigo-500',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-white text-xs font-bold shrink-0 ${colors[idx]}`}
    >
      {initials}
    </span>
  );
}

const Factibilidades = () => {
  const { factibilidades, addFactibilidad, updateFactibilidad } = useData();
  const [searchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [form, setForm] = useState({ predio: '', solicitante: '', direccion: '', notas: '' });

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowCreate(true);
  }, [searchParams]);

  const handleCreate = () => {
    addFactibilidad({
      ...form,
      estado: 'Pre-factibilidad',
      fecha: new Date().toISOString().split('T')[0],
    });
    setForm({ predio: '', solicitante: '', direccion: '', notas: '' });
    setShowCreate(false);
  };

  const selected = factibilidades.find((f) => f.id === detail);

  // KPI counts
  const total = factibilidades.length;
  const enRevision = factibilidades.filter((f) => f.estado === 'En comité').length;
  const aprobadas = factibilidades.filter((f) => f.estado === 'Aprobada').length;
  const urgentes = factibilidades.filter((f) => f.estado === 'Pre-factibilidad').length;
  const pctEfectividad = total > 0 ? Math.round((aprobadas / total) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Factibilidades"
        subtitle="Gestión y seguimiento de solicitudes de infraestructura hidráulica."
        breadcrumbs={[{ label: 'Infraestructura', href: '#' }, { label: 'Factibilidades' }]}
        actions={
          <Button
            onClick={() => setShowCreate(true)}
            className="bg-[#007BFF] hover:bg-blue-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nueva pre-factibilidad
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Total solicitudes"
          value={total.toLocaleString()}
          sub={
            <span className="flex items-center gap-1 text-emerald-600">
              <TrendingUp className="w-3 h-3" /> +12% este mes
            </span>
          }
        />
        <KpiCard
          label="En revisión"
          value={enRevision}
          footer={
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[#007BFF] rounded-full"
                style={{ width: `${Math.min(100, (enRevision / Math.max(total, 1)) * 100 * 3)}%` }}
              />
            </div>
          }
        />
        <KpiCard
          label="Aprobadas"
          value={aprobadas.toLocaleString()}
          sub={
            <span className="flex items-center gap-1 text-emerald-600">
              ✓ {pctEfectividad}% de efectividad
            </span>
          }
        />
        <KpiCard
          label="Urgentes"
          value={urgentes}
          accent={urgentes > 0 ? 'danger' : 'default'}
          sub={
            urgentes > 0 ? (
              <span className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="w-3 h-3" /> Requieren atención
              </span>
            ) : (
              'Sin urgentes'
            )
          }
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <Button variant="outline" size="sm" className="text-sm">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
          Filtrar
        </Button>
        <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Exportar CSV
        </Button>
        <span className="ml-auto text-xs text-muted-foreground font-medium tracking-wide uppercase">
          Mostrando 1–{Math.min(factibilidades.length, 10)} de {factibilidades.length}
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/40">
              {[
                'ID Expediente',
                'Predio / Ubicación',
                'Solicitante',
                'Estado',
                'Fecha Registro',
                'Acciones',
              ].map((h) => (
                <th
                  key={h}
                  className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {factibilidades.map((f) => (
              <tr
                key={f.id}
                className="border-t border-border/50 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => setDetail(f.id)}
                    className="font-medium text-[#007BFF] hover:underline"
                  >
                    {f.id}
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-medium text-foreground">{f.predio}</p>
                  <p className="text-xs text-muted-foreground">{f.direccion}</p>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <AvatarInitials name={f.solicitante} />
                    <span>{f.solicitante}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={f.estado} />
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{f.fecha}</td>
                <td className="px-4 py-3.5">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetail(f.id)}>
                        Ver detalle
                      </DropdownMenuItem>
                      {f.estado === 'Pre-factibilidad' && (
                        <DropdownMenuItem
                          onClick={() => updateFactibilidad(f.id, { estado: 'En comité' as FactibilidadEstado })}
                        >
                          Enviar a comité
                        </DropdownMenuItem>
                      )}
                      {f.estado === 'En comité' && (
                        <>
                          <DropdownMenuItem
                            onClick={() => updateFactibilidad(f.id, { estado: 'Aprobada' as FactibilidadEstado })}
                          >
                            Aprobar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => updateFactibilidad(f.id, { estado: 'Rechazada' as FactibilidadEstado })}
                          >
                            Rechazar
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
            {factibilidades.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-muted-foreground py-12">
                  No hay solicitudes registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Pre-factibilidad</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input
              placeholder="Nombre del predio"
              value={form.predio}
              onChange={(e) => setForm({ ...form, predio: e.target.value })}
            />
            <Input
              placeholder="Solicitante"
              value={form.solicitante}
              onChange={(e) => setForm({ ...form, solicitante: e.target.value })}
            />
            <Input
              placeholder="Dirección"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            />
            <Input
              placeholder="Notas"
              value={form.notas}
              onChange={(e) => setForm({ ...form, notas: e.target.value })}
            />
            <Button
              onClick={handleCreate}
              disabled={!form.predio || !form.solicitante}
              className="w-full bg-[#007BFF] hover:bg-blue-600 text-white"
            >
              Crear pre-factibilidad
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Factibilidad {selected?.id}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Predio</p>
                  <p className="font-medium">{selected.predio}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Solicitante</p>
                  <p className="font-medium">{selected.solicitante}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Dirección</p>
                  <p>{selected.direccion}</p>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Fecha</p>
                  <p>{selected.fecha}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-0.5">Notas</p>
                  <p className="text-muted-foreground">{selected.notas || 'Sin notas'}</p>
                </div>
              </div>
              <StatusBadge status={selected.estado} />
              <div className="flex gap-2 pt-1">
                {selected.estado === 'Pre-factibilidad' && (
                  <Button
                    size="sm"
                    className="bg-[#007BFF] hover:bg-blue-600 text-white"
                    onClick={() => updateFactibilidad(selected.id, { estado: 'En comité' as FactibilidadEstado })}
                  >
                    Enviar a comité
                  </Button>
                )}
                {selected.estado === 'En comité' && (
                  <>
                    <Button
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => updateFactibilidad(selected.id, { estado: 'Aprobada' as FactibilidadEstado })}
                    >
                      Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => updateFactibilidad(selected.id, { estado: 'Rechazada' as FactibilidadEstado })}
                    >
                      Rechazar
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Factibilidades;
