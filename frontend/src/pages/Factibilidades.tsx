import { useState } from 'react';
import { useData, type FactibilidadEstado } from '@/context/DataContext';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

const Factibilidades = () => {
  const { factibilidades, addFactibilidad, updateFactibilidad } = useData();
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);
  const [form, setForm] = useState({ predio: '', solicitante: '', direccion: '', notas: '' });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') === '1') setShowCreate(true);
  }, [searchParams]);

  const handleCreate = () => {
    addFactibilidad({ ...form, estado: 'Pre-factibilidad', fecha: new Date().toISOString().split('T')[0] });
    setForm({ predio: '', solicitante: '', direccion: '', notas: '' });
    setShowCreate(false);
  };

  const selected = factibilidades.find(f => f.id === detail);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Factibilidades</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-1" /> Nueva pre-factibilidad</Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Predio</th><th>Solicitante</th><th>Estado</th><th>Fecha</th><th></th></tr>
          </thead>
          <tbody>
            {factibilidades.map(f => (
              <tr key={f.id}>
                <td className="font-mono text-xs">{f.id}</td>
                <td>{f.predio}</td>
                <td>{f.solicitante}</td>
                <td><StatusBadge status={f.estado} /></td>
                <td className="text-muted-foreground">{f.fecha}</td>
                <td><Button variant="ghost" size="sm" onClick={() => setDetail(f.id)}><Eye className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Pre-factibilidad</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre del predio" value={form.predio} onChange={e => setForm({ ...form, predio: e.target.value })} />
            <Input placeholder="Solicitante" value={form.solicitante} onChange={e => setForm({ ...form, solicitante: e.target.value })} />
            <Input placeholder="Dirección" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
            <Input placeholder="Notas" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} />
            <Button onClick={handleCreate} disabled={!form.predio || !form.solicitante} className="w-full">Crear pre-factibilidad</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={() => setDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Factibilidad {selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Predio:</span> {selected.predio}</div>
                <div><span className="text-muted-foreground">Solicitante:</span> {selected.solicitante}</div>
                <div><span className="text-muted-foreground">Dirección:</span> {selected.direccion}</div>
                <div><span className="text-muted-foreground">Fecha:</span> {selected.fecha}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Notas:</span> {selected.notas || 'Sin notas'}</div>
              </div>
              <div><StatusBadge status={selected.estado} /></div>
              <div className="flex gap-2">
                {selected.estado === 'Pre-factibilidad' && (
                  <Button size="sm" onClick={() => { updateFactibilidad(selected.id, { estado: 'En comité' }); }}>Enviar a comité</Button>
                )}
                {selected.estado === 'En comité' && (
                  <>
                    <Button size="sm" onClick={() => updateFactibilidad(selected.id, { estado: 'Aprobada' })}>Aprobar</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateFactibilidad(selected.id, { estado: 'Rechazada' })}>Rechazar</Button>
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
