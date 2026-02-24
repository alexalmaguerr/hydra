import { useData } from '@/context/DataContext';

const Tarifas = () => {
  const { tarifas, descuentos } = useData();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tarifas y Descuentos</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="section-title">Tarifas vigentes</h3>
          <div className="rounded-lg border overflow-hidden">
            <table className="data-table">
              <thead><tr><th>Tipo</th><th>Rango (m³)</th><th>$/m³</th><th>Cargo fijo</th></tr></thead>
              <tbody>
                {tarifas.map(t => (
                  <tr key={t.id}>
                    <td>{t.tipo}</td>
                    <td>{t.rangoMin} - {t.rangoMax === 999 ? '∞' : t.rangoMax}</td>
                    <td className="font-semibold">${t.precioPorM3.toFixed(2)}</td>
                    <td>${t.cargoFijo.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3 className="section-title">Descuentos aplicables</h3>
          <div className="space-y-3">
            {descuentos.map(d => (
              <div key={d.id} className="widget-card flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{d.nombre}</h4>
                  <p className="text-xs text-muted-foreground">Tipo: {d.tipo}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary">{d.porcentaje}%</span>
                  <p className="text-xs">{d.activo ? <span className="status-badge status-success">Activo</span> : <span className="status-badge status-error">Inactivo</span>}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tarifas;
