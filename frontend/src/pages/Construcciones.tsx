import { useState } from 'react';
import { useData } from '@/context/DataContext';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Construcciones = () => {
  const { construcciones, addConstruccion, updateConstruccion, factibilidades } = useData();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ factibilidadId: '', nombre: '', ubicacion: '' });

  const aprobadas = factibilidades.filter(f => f.estado === 'Aprobada');

  const handleCreate = () => {
    addConstruccion({ ...form, estado: 'Planeación', fecha: new Date().toISOString().split('T')[0] });
    setForm({ factibilidadId: '', nombre: '', ubicacion: '' });
    setShowCreate(false);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Construcción</h1>
        <Button onClick={() => setShowCreate(true)} disabled={aprobadas.length === 0}><Plus className="h-4 w-4 mr-1" /> Nueva construcción</Button>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Nombre</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>
            {construcciones.map(c => (
              <tr key={c.id}>
                <td className="font-mono text-xs">{c.id}</td>
                <td>{c.nombre}</td>
                <td>{c.ubicacion}</td>
                <td><StatusBadge status={c.estado} /></td>
                <td className="flex gap-1">
                  {c.estado === 'Planeación' && <Button size="sm" variant="outline" onClick={() => updateConstruccion(c.id, { estado: 'En proceso' })}>Iniciar</Button>}
                  {c.estado === 'En proceso' && <Button size="sm" onClick={() => updateConstruccion(c.id, { estado: 'Finalizada' })}>Finalizar</Button>}
                </td>
              </tr>
            ))}
            {construcciones.length === 0 && <tr><td colSpan={5} className="text-center text-muted-foreground py-8">No hay construcciones</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Construcción</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={form.factibilidadId} onValueChange={v => setForm({ ...form, factibilidadId: v })}>
              <SelectTrigger><SelectValue placeholder="Factibilidad aprobada" /></SelectTrigger>
              <SelectContent>
                {aprobadas.map(f => <SelectItem key={f.id} value={f.id}>{f.id} - {f.predio}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input placeholder="Nombre de obra" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} />
            <Input placeholder="Ubicación" value={form.ubicacion} onChange={e => setForm({ ...form, ubicacion: e.target.value })} />
            <Button onClick={handleCreate} disabled={!form.factibilidadId || !form.nombre} className="w-full">Crear</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Construcciones;
