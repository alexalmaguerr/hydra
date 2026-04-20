import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';
import {
  fetchActividades,
  fetchGruposActividad,
  fetchCategorias,
  type CatalogoActividad,
  type CatalogoCategoria,
} from '@/api/catalogos';
import { hasApi } from '@/api/contratos';
import { BookOpen, Layers, Tag, GitBranch, Send } from 'lucide-react';

/** Referencia SIGE / AQUACIS — hoja «Estado del contrato» (Catálogos del contrato.xlsx) */
const ESTADO_CONTRATO_REF: { id: number; descripcion: string }[] = [
  { id: 1, descripcion: 'ALTA' },
  { id: 2, descripcion: 'BAJA' },
  { id: 3, descripcion: 'PENDIENTE CONTRATAR' },
  { id: 4, descripcion: 'ANULADO' },
  { id: 9999, descripcion: 'SIN ESTADO' },
];

/** Referencia operativa — hoja «Tipo de envío de factura»; alinear con `Contrato.tipoEnvioFactura` */
const TIPO_ENVIO_FACTURA_REF: { codigo: string; descripcion: string }[] = [
  { codigo: 'PAPEL', descripcion: 'Presencial impreso' },
  { codigo: 'PDF', descripcion: 'Por correo' },
  { codigo: 'PAPEL_PDF', descripcion: 'Ambos' },
];

const TAB_VALUES = ['actividad', 'categoria', 'estado', 'envio'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(s: string | null): s is TabValue {
  return s !== null && (TAB_VALUES as readonly string[]).includes(s);
}

function actividadGrupoId(a: CatalogoActividad): string | null {
  return a.grupoId ?? a.grupo?.id ?? null;
}

const CatalogosContrato = () => {
  const useApi = hasApi();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : 'actividad';

  const setTab = (v: string) => {
    if (isTabValue(v)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', v);
        return next;
      });
    }
  };

  useEffect(() => {
    if (!isTabValue(tabParam)) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'actividad');
        return next;
      }, { replace: true });
    }
  }, [tabParam, setSearchParams]);

  const { data: grupos = [] } = useQuery({
    queryKey: ['catalogos', 'grupos-actividad'],
    queryFn: fetchGruposActividad,
    enabled: useApi,
  });

  const { data: actividades = [] } = useQuery({
    queryKey: ['catalogos', 'actividades'],
    queryFn: fetchActividades,
    enabled: useApi,
  });

  const { data: categorias = [] } = useQuery({
    queryKey: ['catalogos', 'categorias'],
    queryFn: fetchCategorias,
    enabled: useApi,
  });

  return (
    <div>
      <PageHeader
        title="Catálogos del contrato"
        subtitle="Actividad (SIGE), categoría tarifaria, estado operativo y tipo de envío de factura. Consulta según libro «Catálogos del contrato»."
        breadcrumbs={[
          { label: 'Configuración', href: '#' },
          { label: 'Catálogos del contrato' },
        ]}
      />

      <Tabs value={activeTab} onValueChange={setTab} className="mt-2">
        <TabsList className="flex flex-wrap h-auto gap-1 bg-muted/40 p-1">
          <TabsTrigger value="actividad" className="gap-1.5">
            <BookOpen className="w-3.5 h-3.5" />
            Actividad
          </TabsTrigger>
          <TabsTrigger value="categoria" className="gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            Categoría
          </TabsTrigger>
          <TabsTrigger value="estado" className="gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            Estado del contrato
          </TabsTrigger>
          <TabsTrigger value="envio" className="gap-1.5">
            <Send className="w-3.5 h-3.5" />
            Envío de factura
          </TabsTrigger>
        </TabsList>

        <TabsContent value="actividad" className="mt-4 space-y-4">
          {!useApi ? (
            <p className="text-sm text-muted-foreground">Conecte la API para cargar actividades.</p>
          ) : grupos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin grupos de actividad.</p>
          ) : (
            grupos.map((grupo) => {
              const acts = actividades.filter((a) => actividadGrupoId(a) === grupo.id);
              return (
                <div key={grupo.id} className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/30 border-b">
                    <Badge variant="outline" className="font-mono text-xs shrink-0">{grupo.codigo}</Badge>
                    <span className="font-semibold text-sm">{grupo.descripcion}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{acts.length} actividades</span>
                    <Layers className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden />
                  </div>
                  {acts.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/20">
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-2">
                            Código
                          </th>
                          <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2">
                            Descripción
                          </th>
                          <th className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-2">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {acts.map((a, j) => (
                          <tr key={a.id} className={j > 0 ? 'border-t border-border/40' : ''}>
                            <td className="px-5 py-2.5 w-40 font-mono text-xs text-[#007BFF] font-medium">{a.codigo}</td>
                            <td className="px-4 py-2.5">{a.descripcion}</td>
                            <td className="px-4 py-2.5 text-right">
                              <StatusBadge status={a.activo ? 'Activo' : 'Inactivo'} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="px-5 py-3 text-xs text-muted-foreground italic">Sin actividades en este grupo.</p>
                  )}
                </div>
              );
            })
          )}
          {useApi && actividades.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Códigos <span className="font-mono">ACTIPOL_*</span> corresponden al catálogo SIGE (actipolid) sembrado en base.
            </p>
          )}
        </TabsContent>

        <TabsContent value="categoria" className="mt-4">
          {!useApi ? (
            <p className="text-sm text-muted-foreground">Conecte la API para cargar categorías.</p>
          ) : (
            <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    {['Código', 'Descripción', 'Estado'].map((h) => (
                      <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categorias.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground text-sm">
                        Sin categorías.
                      </td>
                    </tr>
                  ) : (
                    categorias.map((cat: CatalogoCategoria, i: number) => (
                      <tr key={cat.id} className={`${i > 0 ? 'border-t border-border/50' : ''} hover:bg-muted/20 transition-colors`}>
                        <td className="px-5 py-3 font-mono text-xs text-[#007BFF] font-medium">{cat.codigo}</td>
                        <td className="px-5 py-3 font-medium">{cat.descripcion}</td>
                        <td className="px-5 py-3">
                          <StatusBadge status={cat.activo ? 'Activo' : 'Inactivo'} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="estado" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Valores de referencia usados en operación (AQUACIS). El campo <span className="font-mono">Contrato.estado</span> es texto libre en el modelo actual.
          </p>
          <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                    Id
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody>
                {ESTADO_CONTRATO_REF.map((row, i) => (
                  <tr key={row.id} className={`${i > 0 ? 'border-t border-border/50' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs tabular-nums">{row.id}</td>
                    <td className="px-5 py-3 font-medium">{row.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="envio" className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            Alineado con comentarios de modelo: <span className="font-mono">tipoEnvioFactura</span> (PAPEL, PDF, PAPEL_PDF).
          </p>
          <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                    Código
                  </th>
                  <th className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">
                    Descripción
                  </th>
                </tr>
              </thead>
              <tbody>
                {TIPO_ENVIO_FACTURA_REF.map((row, i) => (
                  <tr key={row.codigo} className={`${i > 0 ? 'border-t border-border/50' : ''}`}>
                    <td className="px-5 py-3 font-mono text-xs text-[#007BFF] font-medium">{row.codigo}</td>
                    <td className="px-5 py-3">{row.descripcion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CatalogosContrato;
