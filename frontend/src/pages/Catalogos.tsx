import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import StatusBadge from '@/components/StatusBadge';
import {
  fetchActividades,
  fetchGruposActividad,
  fetchCategorias,
  fetchTiposRelacionPS,
  type CatalogoActividad,
  type CatalogoGrupoActividad,
  type CatalogoCategoria,
  type CatalogoTipoRelacionPS,
} from '@/api/catalogos';
import { hasApi } from '@/api/contratos';
import { BookOpen, Tag, Share2, Layers } from 'lucide-react';

// ── Static fallback data ──────────────────────────────────────────────────────

const FALLBACK_GRUPOS: CatalogoGrupoActividad[] = [
  { id: 'ga01', codigo: 'GA01', descripcion: 'Agricultura y cultivos', activo: true },
  { id: 'ga02', codigo: 'GA02', descripcion: 'Ganadería y cría de animales', activo: true },
  { id: 'ga03', codigo: 'GA03', descripcion: 'Agroindustria', activo: true },
  { id: 'ga04', codigo: 'GA04', descripcion: 'Pesca y acuicultura', activo: true },
  { id: 'ga05', codigo: 'GA05', descripcion: 'Minería y extracción', activo: true },
  { id: 'ga06', codigo: 'GA06', descripcion: 'Manufactura e industria', activo: true },
  { id: 'ga07', codigo: 'GA07', descripcion: 'Construcción', activo: true },
  { id: 'ga08', codigo: 'GA08', descripcion: 'Comercio al por menor', activo: true },
  { id: 'ga09', codigo: 'GA09', descripcion: 'Comercio al por mayor', activo: true },
  { id: 'ga10', codigo: 'GA10', descripcion: 'Transporte y logística', activo: true },
  { id: 'ga11', codigo: 'GA11', descripcion: 'Hospedaje y turismo', activo: true },
  { id: 'ga12', codigo: 'GA12', descripcion: 'Servicios profesionales', activo: true },
  { id: 'ga13', codigo: 'GA13', descripcion: 'Servicios gubernamentales', activo: true },
  { id: 'ga14', codigo: 'GA14', descripcion: 'Educación', activo: true },
  { id: 'ga15', codigo: 'GA15', descripcion: 'Salud y asistencia social', activo: true },
  { id: 'ga16', codigo: 'GA16', descripcion: 'Recreación y cultura', activo: true },
  { id: 'ga17', codigo: 'GA17', descripcion: 'Culto religioso', activo: true },
  { id: 'ga18', codigo: 'GA18', descripcion: 'Habitacional privada', activo: true },
  { id: 'ga19', codigo: 'GA19', descripcion: 'Uso mixto', activo: true },
];

const FALLBACK_ACTIVIDADES: CatalogoActividad[] = [
  { id: 'a01', codigo: 'HAB_UNIFAM', descripcion: 'Habitacional unifamiliar', grupoId: 'ga18', activo: true },
  { id: 'a02', codigo: 'HAB_MULTIFAM', descripcion: 'Habitacional multifamiliar', grupoId: 'ga18', activo: true },
  { id: 'a03', codigo: 'COM_REST', descripcion: 'Comercio / Restaurante', grupoId: 'ga08', activo: true },
  { id: 'a04', codigo: 'IND_ALIM', descripcion: 'Industria alimentaria', grupoId: 'ga06', activo: true },
  { id: 'a05', codigo: 'GOB_ESCUELA', descripcion: 'Gobierno / Escuela', grupoId: 'ga13', activo: true },
  { id: 'a06', codigo: 'SALUD_HOSP', descripcion: 'Salud / Hospital', grupoId: 'ga15', activo: true },
  { id: 'a07', codigo: 'HOSP_HOTEL', descripcion: 'Hospedaje / Hotel', grupoId: 'ga11', activo: true },
  { id: 'a08', codigo: 'CONST_PROV', descripcion: 'Construcción provisional', grupoId: 'ga07', activo: true },
];

const FALLBACK_CATEGORIAS: CatalogoCategoria[] = [
  { id: 'c01', codigo: 'DOM_A', descripcion: 'Doméstico A (0–10 m³)', activo: true },
  { id: 'c02', codigo: 'DOM_B', descripcion: 'Doméstico B (11–20 m³)', activo: true },
  { id: 'c03', codigo: 'DOM_C', descripcion: 'Doméstico C (21–30 m³)', activo: true },
  { id: 'c04', codigo: 'DOM_D', descripcion: 'Doméstico D (>30 m³)', activo: true },
  { id: 'c05', codigo: 'COM_PEQ', descripcion: 'Comercial pequeño', activo: true },
  { id: 'c06', codigo: 'COM_MED', descripcion: 'Comercial mediano', activo: true },
  { id: 'c07', codigo: 'COM_GDE', descripcion: 'Comercial grande', activo: true },
  { id: 'c08', codigo: 'IND_PEQ', descripcion: 'Industrial pequeño', activo: true },
  { id: 'c09', codigo: 'IND_MED', descripcion: 'Industrial mediano', activo: true },
  { id: 'c10', codigo: 'IND_GDE', descripcion: 'Industrial grande', activo: true },
  { id: 'c11', codigo: 'GOB_FED', descripcion: 'Gobierno federal', activo: true },
  { id: 'c12', codigo: 'GOB_ESTATAL', descripcion: 'Gobierno estatal', activo: true },
  { id: 'c13', codigo: 'GOB_MPAL', descripcion: 'Gobierno municipal', activo: true },
  { id: 'c14', codigo: 'SERV_PUB', descripcion: 'Servicio público', activo: true },
  { id: 'c15', codigo: 'SOCIAL', descripcion: 'Social / Asistencial', activo: true },
  { id: 'c16', codigo: 'RELIG', descripcion: 'Religioso', activo: true },
  { id: 'c17', codigo: 'AGRO', descripcion: 'Agropecuario', activo: true },
  { id: 'c18', codigo: 'CONST_PROV', descripcion: 'Construcción provisional', activo: true },
  { id: 'c19', codigo: 'MIXTO', descripcion: 'Mixto', activo: true },
  { id: 'c20', codigo: 'CONDOM', descripcion: 'Condominio', activo: true },
  { id: 'c21', codigo: 'ESPECIAL', descripcion: 'Especial / Otro', activo: true },
];

const FALLBACK_TIPOS_RELACION: CatalogoTipoRelacionPS[] = [
  { id: 'r01', codigo: 'CONDOM_MAESTRO', descripcion: 'Medidor maestro de condominio', metodo: 'maestro', reparteConsumo: true, activo: true },
  { id: 'r02', codigo: 'CONDOM_INDIVIDUAL', descripcion: 'Unidad individual de condominio', metodo: 'individual', reparteConsumo: false, activo: true },
  { id: 'r03', codigo: 'SUBMEDICION', descripcion: 'Submedición de consumo', metodo: 'submedicion', reparteConsumo: false, activo: true },
  { id: 'r04', codigo: 'RIEGO_COMUN', descripcion: 'Riego de área común', metodo: 'prorrateo', reparteConsumo: true, activo: true },
  { id: 'r05', codigo: 'USO_MIX_PADRE', descripcion: 'PS padre de uso mixto', metodo: 'padre', reparteConsumo: true, activo: true },
  { id: 'r06', codigo: 'USO_MIX_HIJO', descripcion: 'PS hijo de uso mixto', metodo: 'hijo', reparteConsumo: false, activo: true },
];

// ── Component ─────────────────────────────────────────────────────────────────

const Catalogos = () => {
  const useApi = hasApi();

  const { data: grupos = FALLBACK_GRUPOS } = useQuery({
    queryKey: ['catalogos', 'grupos-actividad'],
    queryFn: fetchGruposActividad,
    enabled: useApi,
  });

  const { data: actividades = FALLBACK_ACTIVIDADES } = useQuery({
    queryKey: ['catalogos', 'actividades'],
    queryFn: fetchActividades,
    enabled: useApi,
  });

  const { data: categorias = FALLBACK_CATEGORIAS } = useQuery({
    queryKey: ['catalogos', 'categorias'],
    queryFn: fetchCategorias,
    enabled: useApi,
  });

  const { data: tiposRelacion = FALLBACK_TIPOS_RELACION } = useQuery({
    queryKey: ['catalogos', 'tipos-relacion-ps'],
    queryFn: fetchTiposRelacionPS,
    enabled: useApi,
  });

  // Build grupo lookup map
  const grupoMap = new Map(grupos.map((g) => [g.id, g]));

  return (
    <div>
      <PageHeader
        title="Catálogos CIG2018"
        subtitle="Clasificación de actividades económicas, categorías tarifarias y tipos de relación conforme al estándar CIG2018."
        breadcrumbs={[{ label: 'Configuración', href: '#' }, { label: 'Catálogos' }]}
      />

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Grupos de actividad', value: grupos.length, icon: Layers, color: '#003366' },
          { label: 'Actividades', value: actividades.length, icon: BookOpen, color: '#007BFF' },
          { label: 'Categorías tarifarias', value: categorias.length, icon: Tag, color: '#4A6278' },
          { label: 'Tipos relación PS', value: tiposRelacion.length, icon: Share2, color: '#059669' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-border/50 shadow-sm p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}18` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
              <p className="text-2xl font-bold font-display" style={{ color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <Tabs defaultValue="actividades">
        <TabsList className="mb-4 bg-white border rounded-lg p-1 gap-1 h-auto">
          {[
            { value: 'actividades', label: 'Actividades por grupo' },
            { value: 'categorias', label: 'Categorías tarifarias' },
            { value: 'relaciones', label: 'Tipos relación PS' },
          ].map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="rounded-md data-[state=active]:bg-[#003366] data-[state=active]:text-white text-sm px-4 py-2"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Actividades por grupo ── */}
        <TabsContent value="actividades" className="mt-0 space-y-4">
          {grupos.map((grupo) => {
            const acts = actividades.filter((a) => a.grupoId === grupo.id);
            return (
              <div key={grupo.id} className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-5 py-3.5 bg-muted/30 border-b">
                  <Badge variant="outline" className="font-mono text-xs shrink-0">{grupo.codigo}</Badge>
                  <span className="font-semibold text-sm">{grupo.descripcion}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{acts.length} actividades</span>
                  <StatusBadge status={grupo.activo ? 'Activo' : 'Inactivo'} />
                </div>
                {acts.length > 0 ? (
                  <table className="w-full text-sm">
                    <tbody>
                      {acts.map((a, i) => (
                        <tr key={a.id} className={i > 0 ? 'border-t border-border/40' : ''}>
                          <td className="px-5 py-2.5 w-36 font-mono text-xs text-[#007BFF] font-medium">{a.codigo}</td>
                          <td className="px-4 py-2.5">{a.descripcion}</td>
                          <td className="px-4 py-2.5 text-right">
                            <StatusBadge status={a.activo ? 'Activo' : 'Inactivo'} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="px-5 py-3 text-xs text-muted-foreground italic">Sin actividades registradas en este grupo.</p>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* ── Categorías tarifarias ── */}
        <TabsContent value="categorias" className="mt-0">
          <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  {['Código', 'Descripción', 'Estado'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categorias.map((cat, i) => (
                  <tr key={cat.id} className={`${i > 0 ? 'border-t border-border/50' : ''} hover:bg-muted/20 transition-colors`}>
                    <td className="px-5 py-3 font-mono text-xs text-[#007BFF] font-medium">{cat.codigo}</td>
                    <td className="px-5 py-3 font-medium">{cat.descripcion}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={cat.activo ? 'Activo' : 'Inactivo'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* ── Tipos relación PS ── */}
        <TabsContent value="relaciones" className="mt-0">
          <div className="bg-white rounded-xl border border-border/50 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40">
                  {['Código', 'Descripción', 'Método', 'Reparte consumo', 'Estado'].map((h) => (
                    <th key={h} className="text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tiposRelacion.map((rel, i) => (
                  <tr key={rel.id} className={`${i > 0 ? 'border-t border-border/50' : ''} hover:bg-muted/20 transition-colors`}>
                    <td className="px-5 py-3.5 font-mono text-xs text-[#007BFF] font-medium">{rel.codigo}</td>
                    <td className="px-5 py-3.5 font-medium">{rel.descripcion}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="secondary" className="text-xs font-mono">{rel.metodo}</Badge>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-medium ${rel.reparteConsumo ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {rel.reparteConsumo ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={rel.activo ? 'Activo' : 'Inactivo'} />
                    </td>
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

export default Catalogos;
