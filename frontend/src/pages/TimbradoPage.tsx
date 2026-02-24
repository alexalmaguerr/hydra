import { useState, useMemo } from 'react';
import { useData } from '@/context/DataContext';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const TimbradoPage = () => {
  const { timbrados, addTimbrado, updateTimbrado, preFacturas, contratos, zonas, allowedZonaIds } = useData();
  const [zonaId, setZonaId] = useState<string>('all');

  const contratoIdsZona = useMemo(() => {
    if (zonaId === 'all') return new Set(contratos.map(c => c.id));
    return new Set(contratos.filter(c => c.zonaId === zonaId).map(c => c.id));
  }, [contratos, zonaId]);

  const preFacturasZona = useMemo(() => preFacturas.filter(pf => contratoIdsZona.has(pf.contratoId)), [preFacturas, contratoIdsZona]);
  const aceptadas = useMemo(() =>
    preFacturasZona.filter(pf => pf.estado === 'Aceptada' && !timbrados.some(t => t.preFacturaId === pf.id)),
    [preFacturasZona, timbrados]
  );
  const timbradosFiltrados = useMemo(() => timbrados.filter(t => contratoIdsZona.has(t.contratoId)), [timbrados, contratoIdsZona]);

  const timbrar = (pf: typeof preFacturas[0]) => {
    const exito = Math.random() > 0.3;
    addTimbrado({
      preFacturaId: pf.id,
      contratoId: pf.contratoId,
      uuid: exito ? `UUID-${Date.now().toString(36).toUpperCase()}` : '',
      estado: exito ? 'Timbrada OK' : 'Error PAC',
      error: exito ? undefined : 'Error de conexión con PAC: timeout',
      fecha: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Monitor de Timbrado</h1>
        <Select value={zonaId} onValueChange={setZonaId}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Zona" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las zonas</SelectItem>
            {(allowedZonaIds ? zonas.filter(z => allowedZonaIds.includes(z.id)) : zonas).map(z => (
              <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {aceptadas.length > 0 && (
        <div className="mb-6">
          <h3 className="section-title">Pre-facturas listas para timbrar</h3>
          <div className="flex gap-2 flex-wrap">
            {aceptadas.map(pf => (
              <Button key={pf.id} size="sm" onClick={() => timbrar(pf)}>
                Timbrar {pf.id} (${pf.total.toFixed(2)})
              </Button>
            ))}
            <Button variant="outline" onClick={() => aceptadas.forEach(timbrar)}>Timbrar todas</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <table className="data-table">
          <thead><tr><th>ID</th><th>Pre-factura</th><th>Contrato</th><th>UUID</th><th>Estado</th><th>Error</th><th></th></tr></thead>
          <tbody>
            {timbradosFiltrados.map(t => (
              <tr key={t.id}>
                <td className="font-mono text-xs">{t.id}</td>
                <td className="font-mono text-xs">{t.preFacturaId}</td>
                <td className="font-mono text-xs">{t.contratoId}</td>
                <td className="font-mono text-xs">{t.uuid || '—'}</td>
                <td><StatusBadge status={t.estado} /></td>
                <td className="text-xs text-destructive">{t.error || '—'}</td>
                <td>
                  {t.estado === 'Error PAC' && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const exito = Math.random() > 0.3;
                      updateTimbrado(t.id, {
                        estado: exito ? 'Timbrada OK' : 'Error PAC',
                        uuid: exito ? `UUID-${Date.now().toString(36).toUpperCase()}` : '',
                        error: exito ? undefined : 'Reintento fallido',
                      });
                    }}>Reintentar</Button>
                  )}
                </td>
              </tr>
            ))}
            {timbradosFiltrados.length === 0 && <tr><td colSpan={7} className="text-center text-muted-foreground py-8">No hay timbrados en esta zona</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimbradoPage;
