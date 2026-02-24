import { useState } from 'react';
import { useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Simulador = () => {
  const { contratos, calcularTarifa } = useData();
  const [contratoId, setContratoId] = useState('');
  const [mes, setMes] = useState('');
  const [consumo, setConsumo] = useState('');
  const [resultado, setResultado] = useState<null | { subtotal: number; cargoFijo: number; total: number }>(null);

  const activos = contratos.filter(c => c.estado === 'Activo');

  const handleSimular = () => {
    const contrato = contratos.find(c => c.id === contratoId);
    if (!contrato) return;
    const res = calcularTarifa(contrato.tipoServicio, Number(consumo));
    setResultado(res);
  };

  const contrato = contratos.find(c => c.id === contratoId);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Simulador de Facturación</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="widget-card">
          <h3 className="section-title">Parámetros</h3>
          <div className="space-y-3">
            <Select value={contratoId} onValueChange={v => { setContratoId(v); setResultado(null); }}>
              <SelectTrigger><SelectValue placeholder="Seleccionar contrato" /></SelectTrigger>
              <SelectContent>{activos.map(c => <SelectItem key={c.id} value={c.id}>{c.id} - {c.nombre}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="month" value={mes} onChange={e => setMes(e.target.value)} />
            <Input type="number" placeholder="Consumo en m³" value={consumo} onChange={e => { setConsumo(e.target.value); setResultado(null); }} />
            <Button onClick={handleSimular} disabled={!contratoId || !consumo} className="w-full">Simular</Button>
          </div>
        </div>

        {resultado && contrato && (
          <div className="widget-card">
            <h3 className="section-title">Pre-factura simulada</h3>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Contrato:</span> <span>{contrato.id}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Titular:</span> <span>{contrato.nombre}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Servicio:</span> <span>{contrato.tipoServicio}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Periodo:</span> <span>{mes}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Consumo:</span> <span>{consumo} m³</span></div>
                <hr className="border-border" />
                <div className="flex justify-between"><span className="text-muted-foreground">Cargo fijo:</span> <span>${resultado.cargoFijo.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Consumo:</span> <span>${resultado.subtotal.toFixed(2)}</span></div>
                <hr className="border-border" />
                <div className="flex justify-between text-lg font-bold"><span>Total:</span> <span className="text-primary">${resultado.total.toFixed(2)}</span></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Simulador;
