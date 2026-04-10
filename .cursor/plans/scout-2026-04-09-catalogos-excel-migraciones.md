---
date: 2026-04-09
task: catalogos-excel-migraciones
classification: COMPLEX
confidence: MEDIUM
workflow_type: migration
next_command: /ks-conductor
---

# Scout: catálogos Excel (sistema anterior) → migraciones y código

## Stack summary

- **Backend:** NestJS 10, Prisma 6, PostgreSQL; prefijo global `api` (`main.ts`).
- **Frontend:** Vite + React 18 + TanStack Query; rutas en `frontend/src/config/routes.ts`, API vía `VITE_API_BASE_URL` normalizado a `…/api`.
- **Datos:** `backend/prisma/schema.prisma` + `prisma/migrations/`; semillas en `backend/prisma/seed.ts` (incl. catálogos operativos y CIG2018).
- **Excel fuente:** 4 archivos en `_DocumentacIon_Interna_Sistema_Anterior/Catalogos/` (estructura inferida con `xlsx` desde `backend` — devDependency verificada).

## Workflow type

**migration** (con trabajo colateral **feature** en UI/menús para administración de catálogos).

## Relevant files (dependencias)

| Área | Archivo / módulo | Depende de (imports / usa) | Lo usan (imported-by) |
|------|------------------|----------------------------|------------------------|
| Contrato / contratación | `backend/src/modules/tipos-contratacion/catalogos-contratacion.controller.ts` | `TiposContratacionService`, JWT guard | `TiposContratacionModule` → `AppModule` |
| Punto de servicio | `backend/src/modules/puntos-servicio/catalogos.controller.ts` | `PuntosServicioService`, JWT guard | `PuntosServicioModule` → `AppModule` |
| Lógica catálogos contratación | `backend/src/modules/tipos-contratacion/tipos-contratacion.service.ts` | Prisma (`ConceptoCobro`, `ClausulaContractual`, `CatalogoActividad`, etc.) | Controllers del módulo |
| Domicilio INEGI | `backend/src/modules/domicilios/domicilios.controller.ts` | `DomiciliosService` | App routing |
| Modelo datos | `backend/prisma/schema.prisma` | — | Prisma client, servicios |
| Seed | `backend/prisma/seed.ts` | Prisma | `npm run prisma:seed` |
| UI catálogos CIG2018 | `frontend/src/pages/Catalogos.tsx` | `@/api/catalogos` | `App.tsx` lazy route |
| Cliente API catálogos | `frontend/src/api/catalogos.ts` | `apiRequest` | `Catalogos.tsx` |
| Menú lateral | `frontend/src/config/routes.ts` | — | layout sidebar |

**Nota:** Dos controladores bajo `@Controller('catalogos')` en módulos distintos; las rutas no colisionan porque los paths relativos difieren (`actividades` vs `tipos-corte`, etc.).

## Validación de comandos (evidencia en repo)

**Backend** (`backend/package.json`):

- `npm run lint` — ESLint
- `npm run build` — `nest build`
- `npm run start:dev` — desarrollo
- `npm run prisma:migrate` — `prisma migrate dev`
- `npm run prisma:seed` / `prisma.seed` — `ts-node prisma/seed.ts`

**Frontend** (`frontend/package.json`):

- `npm run lint`
- `npm run build`
- `npm run test` — `vitest run`

No se encontraron workflows en `.github/` en esta revisión.

## Inventario Excel ↔ modelo actual (validación)

### 1. `Catálogos de domicilio.xlsx`

| Hoja (aprox. filas útiles) | Columnas clave (muestra) | Modelo Prisma actual |
|----------------------------|--------------------------|----------------------|
| País (~256) | `paisid`, `paisnombre`, … | **No** hay `CatalogoPais`; `Domicilio` usa solo INEGI |
| Estado (Comunidad) (~34) | `comid`, `comnombre`, `compaisid` | **Parcial:** `CatalogoEstadoINEGI` es INEGI (clave/nombre), no “comunidad” española |
| Municipio (provincia) (~2463) | `proid`, `pronombre`, `procomid` | **Parcial:** `CatalogoMunicipioINEGI` |
| Localidad (Población) (~299598) | `pobid`, `pobnombre`, `pobproid` | **Parcial:** `CatalogoLocalidadINEGI` (volumen comparable; riesgo de performance en import) |
| Localidad (~299659) | `locid`, `locpobid`, `loccodpost` | Relación calle/colonia en legado; **no** mapeo directo 1:1 con `Domicilio` |
| Colonia (Barrio) (~4149) | `barrid`, `barrlocid`, `barrnombre` | **Parcial:** `CatalogoColoniaINEGI` (requiere `municipioId` + CP + clave) |
| Calles (~33234), Calle-CP (~50896) | IDs de calle, CP, vínculos | **No** modelado como catálogos separados en schema actual |
| Tipo de vía (~135), Tipo calle (~26) | `tviaid`, `tpctcid`, `tddesc` | **No** en Prisma como tablas dedicadas |
| cat calle con (~6165) | tipo contratación, administración, concepto, tipo calle | Cruce negocio; validar vs `TipoContratacion` / tarifas |

**Conclusión:** El Excel describe un **árbol geográfico y callejero legacy** (aparentemente España / SIGE), mientras el producto actual está **homologado INEGI** para `Domicilio`. Requiere **decisión de producto** antes de migración: import paralelo, solo referencia, o ETL a INEGI.

### 2. `catálogos de punto de servicio.xlsx`

| Hoja | Alineación con Prisma/API |
|------|---------------------------|
| Tipo de estructura técnica | → `CatalogoEstructuraTecnica` + API CRUD en `catalogos.controller` |
| Tipo de suministro | → `CatalogoTipoSuministro` + API (ojo: fila de encabezados en Excel parece **no** ser header técnico; limpiar antes de import) |
| Tipos de Relación | → `CatalogoTipoRelacionPS` (`metodo`, `reparteConsumo` deben mapearse desde `trpmetodo`, `trpsnrepcons`) |
| Sector hidráulico, Calibre de la toma, Tipo de punto de servicio, Distrito | **Brecha:** no hay modelos obvios en el fragmento de schema revisado; posible relación con `Zona`/`Ruta` o tablas nuevas |

### 3. `Catálogos del contrato.xlsx`

| Hoja | Alineación |
|------|------------|
| Tipos de contratación (~629) | → `TipoContratacion` + relaciones en seed/UI existentes |
| Grupo actividad / Actividad / Categoría | → `CatalogoGrupoActividad`, `CatalogoActividad`, `CatalogoCategoria` |
| Estado del contrato | Posible catálogo de **estado de negocio** del contrato (validar vs enum/campo `Contrato.estado` en Prisma) |
| Tipo de envío de factura | **Brecha** probable (nuevo catálogo o campo en facturación) |

### 4. `Catálogos_tipo_contratacion.xlsx`

Hojas ricas en joins: `concepto_tipo_contratacion`, `variable_tipo_contratacion`, `tipo_variable`, `documentos`, `clausulas`, `tarifas`, `concepto`, etc. El backend ya expone **conceptos de cobro** y **cláusulas** (`/api/catalogos/conceptos-cobro`, `clausulas`). Falta validar cobertura de **documentos requeridos**, **variables** y **tarifas** frente a `schema.prisma` (modelos `DocumentoRequeridoTipoContratacion`, etc.) en una pasada PLAN/build.

## Memory findings (Phase 0)

- **DevContext:** conversación inicializada; poco contexto de código/arquitectura inyectado (estructura vacía en respuesta).
- **cursor10x:** sin hit directo a este repo; solo mensaje similar no relacionado (otro proyecto).

## Brainstorming gate

**Omitido:** la petición es reconocimiento + plan de migración con fuentes concretas (Excel + rutas de código), no ideación abierta de producto.

## SequentialThinking (resumen)

1. Divergencia fuerte en **domicilio** (legado vs INEGI) es el principal tenedor.
2. Punto de servicio y contrato tienen **alta cobertura parcial** en Prisma/API; varias hojas implican **nuevas tablas** o mapeo a dominios existentes (zonas/rutas).
3. Clasificación **COMPLEX** justificada por volumen (~300k filas localidad), decisiones de modelo y UI administrativa ampliada.
4. Enfoque recomendado: fases — inventario firmado → seeds/scripts de bajo riesgo → decisión domicilio documentada → UI/menús.

## Recommended skill / subagent routing

- **Skills:** `database-schema-designer` (nuevas tablas / FKs), `spec-driven-development` o PRD si se fija contrato de import; `api-contract-design` si se añaden endpoints.
- **Subagent:** `explore` ya satisfecho en esta pasada; para BUILD: `backend-developer` + `frontend-developer` o `fullstack-developer` según capa.
- **Validación:** tras cambios, `backend` lint/build + `prisma migrate` en entorno dev; `frontend` lint/build; pruebas de import en dataset acotado antes de carga completa.

## Conditional flags

| Flag | ¿Aplicar? | Por qué |
|------|-----------|---------|
| security-review | **Sí** (ligero) | Catálogos bajo JWT; nuevos endpoints o import batch deben evitar fugas y validar roles |
| database-schema-designer | **Sí** | Posibles nuevas entidades (calle, tipo vía, distrito, etc.) y FKs |
| write-unit-tests | **Sí** | Scripts ETL / mapeos de columnas y reglas de `metodo` |
| humanizer | **No** | No es foco de copy |
| reducing-entropy | **No** | No solicitado |

## Riesgos y restricciones

- **Volumen:** hojas de ~300k filas requieren import por lotes, índices y migración fuera de transacción monolítica.
- **Calidad de Excel:** hojas con filas de “encabezado humano” (p. ej. tipo de suministro) necesitan limpieza explícita.
- **Ambigüedad geográfica:** mezclar legado no-INEGI con `Domicilio` actual puede corromper integridad; bloqueante hasta acuerdo funcional.
- **Duplicación** entre `Catálogos del contrato.xlsx` y `Catálogos_tipo_contratacion.xlsx`: definir **fuente canónica** para seeds.

## Paralelización sugerida

- En paralelo (tras decisión domicilio): (1) script de diff Excel vs DB para catálogos ya modelados, (2) diseño de gaps (sector/distrito/calibre), (3) mockups de UI de tabs por dominio.
- Secuencial obligatorio: **decisión domicilio** antes de cualquier migración masiva de hojas País→Calle.

## Cursor CLI routing

- **`recommended_cli: no`**
- **Justificación:** el trabajo es análisis de correspondencia modelo/datos, decisiones de dominio y plan de migración; no es batch mecánico de mismo patrón en muchos archivos con bajo riesgo de contrato. `agent-dispatch` no aporta aquí.

## Propuesta de plan (handoff a `/ks-conductor` o Plan mode)

1. **T0 — Decisiones de alcance:** ¿El producto debe soportar el árbol de domicilio del Excel o solo INEGI (México)? ¿Calles como catálogo o solo texto libre en `Domicilio`?
2. **T1 — Matriz de trazabilidad:** por cada hoja Excel → tabla(s) Prisma → endpoint(s) → pantalla(s); marcar Covered / Partial / Gap.
3. **T2 — Migraciones Prisma:** solo para gaps aprobados; índices y unicidad (`codigo`, `clave_inegi`, etc.) alineados a negocio.
4. **T3 — Import:** scripts idempotentes (`upsert` por clave natural), dry-run con conteos y muestras; orden topológico por FKs.
5. **T4 — Seed:** actualizar `seed.ts` o separar `seed-catalogos-legacy.ts` según tamaño.
6. **T5 — API:** completar CRUD donde hoy solo hay `GET` en UI (p. ej. catálogos CIG2018 en frontend).
7. **T6 — Frontend:** ampliar `APP_ROUTES` (subrutas o agrupación “Catálogos”: contrato, punto de servicio, domicilio); reutilizar patrones de `TiposContratacion` / tablas existentes.
8. **T7 — QA:** datos de prueba, regresión en formularios que consumen catálogos (`Contratos`, puntos de servicio, domicilios).

---

*Scout generado sin ediciones al código de aplicación; inventario Excel ejecutado con Node + `xlsx` en `backend`.*
