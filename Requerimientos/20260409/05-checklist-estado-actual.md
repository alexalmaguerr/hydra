# Checklist de Estado Actual — PRD 2026-04-06

**Fecha:** 2026-04-09 (actualizado)  
**Propósito:** Resumen consolidado de qué se hizo, dónde está y qué falta.

---

## Parte A — Lo que se hizo en esta sesión

### 1. Análisis (sesión anterior)

| # | Archivo | Contenido | Estado |
|---|---------|-----------|--------|
| 1 | `01-analisis-gap.md` | Análisis de gap detallado PRD vs tareas existentes | Completo |
| 2 | `02-mapa-requerimientos.md` | Matriz de trazabilidad req → tarea destino | Completo |
| 3 | `03-tareas-nuevas-necesarias.md` | 6 tareas nuevas (T10–T15) con modelos Prisma propuestos | Completo |
| 4 | `04-modificaciones-tareas-existentes.md` | Cambios necesarios en T03, T06, T08, T09 | Completo |
| 5 | `05-checklist-estado-actual.md` | Este archivo — resumen consolidado | Completo |

### 2. Implementación (sesión actual)

| # | Cambio | Ubicación | Estado |
|---|--------|-----------|--------|
| 1 | **Schema Prisma actualizado** — todos los modelos nuevos y campos ampliados | `backend/prisma/schema.prisma` | **APLICADO** |
| 2 | **T10** — Flujo contratación E2E | `Tareas/10-flujo-contratacion-e2e.md` | **CREADO** |
| 3 | **T11** — Punto de servicio y cortes | `Tareas/11-punto-servicio-cortes.md` | **CREADO** |
| 4 | **T12** — Domicilios homologados INEGI | `Tareas/12-modelo-domicilios-inegi.md` | **CREADO** |
| 5 | **T13** — Tipos contratación y catálogos | `Tareas/13-tipos-contratacion-catalogos.md` | **CREADO** |
| 6 | **T14** — Motor tarifario | `Tareas/14-motor-tarifario.md` | **CREADO** |
| 7 | **T15** — Reglas de calidad y migración | `Tareas/15-reglas-calidad-migracion.md` | **CREADO** |
| 8 | **T03 ampliada** — Trigger auto-generación, tipología cortes, condición cortable | `Tareas/03-sistema-ordenes.md` (sección "Modificaciones PRD 2026-04-06") | **ACTUALIZADO** |
| 9 | **T06 ampliada** — Persona extendida, roles, Domicilio, PuntoServicio, TipoContratacion | `Tareas/06-modelo-datos-personas-contratos-tramites.md` (sección "Modificaciones PRD 2026-04-06") | **ACTUALIZADO** |
| 10 | **T08 ampliada** — Convenio vinculado a factura de contratación | `Tareas/08-caja-recaudacion-interna-convenios.md` (sección "Modificaciones PRD 2026-04-06") | **ACTUALIZADO** |
| 11 | **T09 ampliada** — Nuevos tipos de conciliación y métricas de calidad | `Tareas/09-monitoreo-conciliaciones.md` (sección "Modificaciones PRD 2026-04-06") | **ACTUALIZADO** |
| 12 | **Preguntas bloqueantes** — archivo separado con 8 preguntas y propuestas provisionales | `Requerimientos/20260409/06-preguntas-bloqueantes-diseno.md` | **CREADO** |

---

## Parte B — Dónde está cada cosa

### Documentación de requerimientos

| Documento | Ubicación |
|-----------|-----------|
| PRD original (Feb 23) | `Requerimientos/PRD_1.md` |
| PRD portal/trámites (Feb 26) | `Requerimientos/PRD_2.md` |
| PRD nuevo — sesión equipo (Abr 6) | `Requerimientos/PRD-Draft-2026-04-06.md` |
| Análisis y checklists | `Requerimientos/20260409/` (6 archivos) |
| Preguntas bloqueantes | `Requerimientos/20260409/06-preguntas-bloqueantes-diseno.md` |

### Schema Prisma — modelos nuevos agregados

| Modelo | Tarea | Descripción |
|--------|-------|-------------|
| `ProcesoContratacion` | T10 | Máquina de estados del flujo contractual E2E |
| `HitoContratacion` | T10 | Hitos individuales del proceso de contratación |
| `PlantillaContrato` | T10 | Plantillas parametrizables de formato de contrato |
| `PuntoServicio` | T11 | Entidad propia con info técnica/administrativa/geográfica |
| `CatalogoTipoCorte` | T11 | Subtipología de cortes con impacto operativo |
| `CatalogoTipoSuministro` | T11 | Tipos de suministro (agua, saneamiento, etc.) |
| `CatalogoEstructuraTecnica` | T11 | Estructura técnica del punto de servicio |
| `Domicilio` | T12 | Domicilio estructurado con campos INEGI |
| `DomicilioPersona` | T12 | Vinculación persona-domicilio con roles |
| `CatalogoEstadoINEGI` | T12 | Catálogo de estados |
| `CatalogoMunicipioINEGI` | T12 | Catálogo de municipios por estado |
| `CatalogoLocalidadINEGI` | T12 | Catálogo de localidades por municipio |
| `CatalogoColoniaINEGI` | T12 | Catálogo de colonias con código postal |
| `TipoContratacion` | T13 | Tipos de contratación parametrizables |
| `ConceptoCobro` | T13 | Conceptos de cobro para facturación |
| `ConceptoCobroTipoContratacion` | T13 | Asociación concepto ↔ tipo contratación |
| `ClausulaContractual` | T13 | Cláusulas contractuales versionadas |
| `ClausulaTipoContratacion` | T13 | Asociación cláusula ↔ tipo contratación |
| `DocumentoRequeridoTipoContratacion` | T13 | Documentos requeridos por tipo |
| `Tarifa` | T14 | Tarifas con vigencias y escalonamiento |
| `CorreccionTarifaria` | T14 | Correctores: penalizaciones, bonificaciones, descuentos |
| `AjusteTarifario` | T14 | Ajustes manuales excepcionales con trazabilidad |
| `ActualizacionTarifaria` | T14 | Registro de actualizaciones trimestrales |

### Schema Prisma — campos ampliados en modelos existentes

| Modelo | Campos agregados | Tarea |
|--------|------------------|-------|
| `Contrato` | `puntoServicioId`, `domicilioId`, `tipoContratacionId`, relación `procesosContratacion` | T06 ampliada |
| `Persona` | `apellidoPaterno`, `apellidoMaterno`, `curp`, `razonSocial`, `regimenFiscal`, `tipoIdentificacion`, `numIdentificacion`, `telefonoAlt`, relación `domicilios` | T06 ampliada |
| `Orden` | `subtipoCorteId`, `origenAutomatico`, `eventoOrigen`, `ubicacionCorte`, `condicionCortable` | T03 ampliada |
| `Convenio` | `origenTipo`, `facturaOrigenId`, `porcentajeAnticipo`, `montoAnticipo`, `anticipoPagado`, `datosConvenio`, `checklistInterna` | T08 ampliada |
| `ConciliacionReporte` | `contratosSinPunto`, `domiciliosSinINEGI`, `tarifasVencidas` | T09 ampliada |

### Tareas completas (T01–T15)

| Tarea | Ubicación | Estado schema | Estado implementación |
|-------|-----------|---------------|----------------------|
| T01 — Lecturas | `Tareas/01-lecturas-archivos-planos.md` | Definido | Sin cambios PRD |
| T02 — ETL pagos | `Tareas/02-recaudacion-etl-pagos.md` | Definido | Sin cambios PRD |
| T03 — Órdenes | `Tareas/03-sistema-ordenes.md` | **Schema ampliado** | **Actualizado con MODs** |
| T04 — Contabilidad SAP | `Tareas/04-integracion-contable-sap.md` | Definido | Sin cambios PRD |
| T05 — GIS | `Tareas/05-integracion-gis.md` | Definido | Sin cambios PRD |
| T06 — Personas/Contratos | `Tareas/06-modelo-datos-personas-contratos-tramites.md` | **Schema ampliado** | **Actualizado con MODs** |
| T07 — Atención clientes | `Tareas/07-atencion-clientes-quejas.md` | Definido | Sin cambios PRD |
| T08 — Caja/Convenios | `Tareas/08-caja-recaudacion-interna-convenios.md` | **Schema ampliado** | **Actualizado con MODs** |
| T09 — Monitoreo | `Tareas/09-monitoreo-conciliaciones.md` | **Schema ampliado** | **Actualizado con MODs** |
| T10 — Flujo E2E | `Tareas/10-flujo-contratacion-e2e.md` | **Schema nuevo** | **Tarea creada** |
| T11 — PuntoServicio/Cortes | `Tareas/11-punto-servicio-cortes.md` | **Schema nuevo** | **Tarea creada** |
| T12 — Domicilios INEGI | `Tareas/12-modelo-domicilios-inegi.md` | **Schema nuevo** | **Tarea creada** |
| T13 — Tipos contratación | `Tareas/13-tipos-contratacion-catalogos.md` | **Schema nuevo** | **Tarea creada** |
| T14 — Motor tarifario | `Tareas/14-motor-tarifario.md` | **Schema nuevo** | **Tarea creada** |
| T15 — Reglas calidad | `Tareas/15-reglas-calidad-migracion.md` | N/A (proceso) | **Tarea creada** |

---

## Parte C — Qué falta hacer

### Prioridad 1 — Decisiones de diseño bloqueantes (8 preguntas)

**Archivo:** `Requerimientos/20260409/06-preguntas-bloqueantes-diseno.md`

- [ ] **P1**: Formato final estándar del contrato → bloquea T10, T13
- [ ] **P2**: Criterios de transición entre estados del proceso contractual → bloquea T10
- [ ] **P3**: Validaciones para auto-generar orden de medidor → bloquea T03, T10
- [ ] **P5**: Tipos de corte y su impacto operativo/facturación → bloquea T11, T03
- [ ] **P6**: Regla de asociación automática conceptos/cláusulas/docs → bloquea T13
- [ ] **P7**: Cambio de tipo de contrato sin afectar contabilidad → bloquea T13, T14
- [ ] **P10**: Regla de repartición padre-hijo puntos de servicio → bloquea T11
- [ ] **P12**: Documentos obligatorios por tipo de contratación → bloquea T13, T10

### Prioridad 2 — Migración de base de datos

- [ ] Ejecutar `npx prisma migrate dev` con los nuevos modelos agregados al schema
- [ ] Verificar que la migración no rompa datos existentes
- [ ] Crear scripts de seed para catálogos operativos (T11, T13, T14)
- [ ] Crear script de seed para catálogos INEGI de Querétaro (T12)

### Prioridad 3 — Implementación de módulos backend (orden sugerido)

| Fase | Tareas | Pre-requisitos | Preguntas desbloqueo |
|------|--------|----------------|----------------------|
| **Fase 1** | T12 (Domicilios) → T06 ampliada | Ninguno | Ninguna (puede iniciar ya) |
| **Fase 2** | T11 (PuntoServicio) → T03 ampliada | T12 | P5, P10 |
| **Fase 3** | T13 (Tipos contratación) → T14 (Motor tarifario) | T12 | P1, P6, P7, P12 |
| **Fase 4** | T10 (Flujo E2E) → T08 ampliada | T11, T13, T14 | P2, P3 |
| **Fase 5** | T15 (Calidad) → T09 ampliada | Todas las anteriores | Todas |

### Prioridad 4 — Sesiones funcionales pendientes

El PRD menciona sesiones adicionales sobre:
- [ ] Órdenes (detalle operativo)
- [ ] Lecturas (rutas, incidencias, estimaciones)
- [ ] Cortes (reglas y tipos)

---

## Parte D — Métricas del análisis y ejecución

| Métrica | Valor |
|---------|-------|
| Total de requerimientos en PRD 2026-04-06 | **33** |
| Requerimientos sin cobertura previa (nuevos) | **19** (58%) |
| Requerimientos parcialmente cubiertos | **14** (42%) |
| Tareas existentes modificadas | **4** (T03, T06, T08, T09) |
| Tareas existentes sin cambios | **5** (T01, T02, T04, T05, T07) |
| Tareas nuevas creadas | **6** (T10–T15) |
| Modelos Prisma nuevos en schema | **22** |
| Campos nuevos en modelos existentes | **17** |
| Preguntas bloqueantes pendientes | **8** de 13 |

---

## Parte E — Riesgos identificados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Preguntas abiertas no resueltas bloquean 60% de las tareas nuevas | Alto | Programar sesiones funcionales inmediatas |
| Complejidad del motor tarifario (T14) subestimada | Alto | Diseño incremental: primero tarifas simples, luego fórmulas compuestas |
| Migración de datos legacy a nuevos modelos (Domicilio, PuntoServicio) | Alto | Scripts de dry-run y validación antes de migración definitiva |
| Dependencias circulares entre T10–T14 | Medio | Respetar orden de fases propuesto |
| Sesiones funcionales futuras podrían cambiar reqs ya diseñados | Medio | Diseño modular que permita extensión sin refactorización mayor |
| Catálogos INEGI requieren descarga y seed de datos externos | Bajo | Automatizar descarga desde datos.gob.mx |
| La migración Prisma con ~23 modelos nuevos puede ser pesada | Medio | Ejecutar en ambiente de dev primero, validar antes de staging |

---

## Parte F — Resumen ejecutivo

Se completaron todos los cambios de análisis e implementación de schema requeridos por el PRD 2026-04-06:

1. **Schema Prisma actualizado** con 23 modelos nuevos y 17 campos nuevos en modelos existentes
2. **6 tareas nuevas** (T10–T15) creadas con diseño detallado, modelos, endpoints, frontend y validación
3. **4 tareas existentes** (T03, T06, T08, T09) actualizadas con secciones de modificaciones PRD
4. **8 preguntas bloqueantes** documentadas en archivo separado con contexto, decisiones requeridas y propuestas provisionales
5. **Fase 1 puede iniciar inmediatamente** (T12 Domicilios + T06 ampliada) sin depender de preguntas bloqueantes
