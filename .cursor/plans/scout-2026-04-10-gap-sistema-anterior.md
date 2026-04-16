---
date: 2026-04-10
task: gap-sistema-anterior-vs-implementacion-actual
classification: COMPLEX
confidence: HIGH
workflow_type: research
next_command: /ks-conductor
---

# Scout: Gap entre Documentación Sistema Anterior y Implementación Actual

## Resumen ejecutivo

Se analizó toda la documentación del sistema anterior (AQUACIS/CIG) en `_DocumentacIon_Interna_Sistema_Anterior/` y se cruzó contra la implementación actual (72 modelos Prisma, ~100 endpoints NestJS, ~30 páginas React). El sistema anterior documenta un ERP de agua maduro con módulos de gestión de servicio (contratos, medidores, tarifas), interfaces externas (SAP, lecturas, recaudación, GIS, OM facturación) y catálogos operativos complejos. El sistema actual ya tiene una cobertura significativa pero con brechas importantes en profundidad funcional.

---

## 1. Módulos del sistema anterior vs implementación actual

### 1.1 GESTIÓN DE SERVICIO — CONTRATOS

**Documentación anterior:**
- Entidades: punto de suministro, domicilio, persona, contrato, con catálogos extensos
- Flujo completo: captura personas → domicilio → punto de servicio → contrato → facturación
- Catálogos: ~30+ catálogos operativos vía `cf_quere_int.*` y `tabladesc` (multilenguaje)
- Tipos de contratación parametrizados con conceptos, cláusulas, documentos, variables, grupos de variables
- Formatos de contrato con plantillas y documentos imprimibles
- Procesos de contratación documentados con flujos y mapeo de procesos
- Cuantificación de obra vinculada a contratos

**Estado actual backend:**
- `Contrato` con CRUD completo + 12 endpoints especializados (PDF, texto, factura contratación, estado operativo, etc.)
- `ProcesoContratacion` + `HitoContratacion` + `PlantillaContrato` — flujo E2E implementado
- `TipoContratacion` con conceptos, cláusulas, documentos requeridos — parametrización implementada
- `Persona` con roles, domicilios vinculados
- `PuntoServicio` con jerarquía padre-hijo, catálogos operativos

**Estado actual frontend:**
- `Contratos.tsx` — CRUD + wizard + procesos de contratación (API real)
- `TiposContratacion.tsx` — ABM tipos con configuración (API real)

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| C1 | **Variables de contratación** — el sistema anterior tiene `tipovariable`, `grupovarcontra`, `tipovarcontra` con tipos dato (numérico/carácter/booleano/fecha) y origen (contrato/ciclo/punto/calculado). El actual tiene `TipoVariable` y `VariableTipoContratacion` en schema pero sin motor de evaluación de variables | Media | Backend |
| C2 | **Actividades económicas CIG 2018** — el anterior tiene `actividad` con grupos y clasificaciones detalladas. El actual tiene `CatalogoActividad` y `CatalogoGrupoActividad` pero el seed y la lógica de vinculación con tarifas no está completa | Media | Backend + BD |
| C3 | **Clases de contrato** — `clascontra` en el anterior con lógica de exclusión (`clsccod NOT IN ('CN')`). El actual tiene `ClaseContrato` en schema pero sin lógica de negocio que use las clases para filtrar conceptos | Media | Backend |
| C4 | **Explotaciones (administraciones)** — el anterior tiene `explotacion` con `explotesttec` (estructura técnica por administración). El actual tiene `Administracion` pero sin vínculo con estructuras técnicas específicas por administración | Baja | BD |
| C5 | **Formatos/plantillas de impresión** — el anterior tiene `grupodocumento`, `tipodocumento` con plantillas SMS/email, flags de impresión/archivado. El actual tiene `PlantillaContrato` pero sin documentos de salida parametrizables (cartas, facturas, órdenes) | Alta | Backend + Frontend |
| C6 | **Oficinas y centros de beneficio** — el anterior tiene `oficina` con dirección, tipo, forma de pago, `cbeneficio`, flags de créditos/mensajes/impresión. El actual tiene `Oficina` y `TipoOficina` básicos | Media | BD + Backend |
| C7 | **CEAFUS01** — documento referenciado en contratos, sin equivalente | Baja | Documentación |

---

### 1.2 GESTIÓN DE SERVICIO — MEDIDORES

**Documentación anterior:**
- Catálogos: `tipocontador`, `marcacont`, `modelcont`, `emplazto`, `calibre`, `tipoincide`
- Relación medidor-contrato con historial de cambios
- Incidencias de medidor con tipología

**Estado actual backend:**
- `Medidor` + `MedidorBodega` con relaciones a marca, modelo, calibre, emplazamiento, tipo contador
- `CatalogoMarcaMedidor`, `CatalogoModeloMedidor`, `CatalogoCalibre`, `CatalogoEmplazamiento`, `CatalogoTipoContador`
- Catálogos operativos expuestos vía API CRUD

**Estado actual frontend:**
- `Medidores.tsx` — pero **solo usa DataContext (mock)**, no API real

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| M1 | **Frontend de medidores sin API** — la página usa solo DataContext mock, no consume endpoints reales | Alta | Frontend |
| M2 | **Historial de cambio de medidor** — el anterior rastrea cambios de medidor en contrato. No hay modelo de historial de medidor-contrato explícito | Media | BD + Backend |
| M3 | **Endpoint CRUD de medidores** — no hay un `MedidoresModule` en el backend con endpoints REST | Alta | Backend |

---

### 1.3 GESTIÓN DE SERVICIO — TARIFAS

**Documentación anterior:**
- Precios por bloques/tramos de consumo m³ (`prectramos`) con pivot de 15 tipos de tarifa
- Tarifas fijas por subconcepto (`precsubcon`)
- Correctores tarifarios (`corrtarifa`) con condiciones numéricas y valores operativos
- Vigencias por periodo de aplicación (`ptrafecapl`, `psubfecapl`)
- Validación cruzada tarifa × explotación (administración)
- IDs de tarifa hardcodeados por categoría de uso (beneficencia, comercial, doméstico, industrial, etc.)

**Estado actual backend:**
- `Tarifa` con vigencias, correcciones, ajustes, actualizaciones programadas
- Endpoints: vigentes, calcular, correcciones, ajustes, actualizaciones (CRUD completo)

**Estado actual frontend:**
- `Tarifas.tsx` — lectura vigentes + actualizaciones tarifarias (API real)
- `Simulador.tsx` — solo DataContext mock, no usa API `calcular`

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| T1 | **Bloques/tramos escalonados** — el anterior tiene `prectramos` con límite superior, cuota base y precio por m³ adicional por tramo. El actual tiene campo `escalones` JSON pero no hay evidencia de que el motor de cálculo backend lo implemente con la complejidad del anterior (15 tarifas en pivot por explotación) | Alta | Backend |
| T2 | **Tarifas cruzadas por explotación** — el anterior valida tarifa × administración. El actual tiene `tipoContratacionId` en tarifa pero no validación por administración | Media | Backend |
| T3 | **Simulador sin API real** — usa `calcularTarifa` mock del DataContext | Media | Frontend |
| T4 | **Subconceptos de tarifa** — `precsubcon` con subconcepto (`psubcptoid`, `psubsubcid`). No hay modelo de subconceptos en el actual | Media | BD + Backend |

---

### 1.4 INTERFACES — CONTABILIDAD SAP

**Documentación anterior:**
- Archivos planos con formato posicional: cabecera + posiciones contables
- Dos familias: facturación (ingresos/IVA) y cobros (ventanilla/anticipos)
- Cuentas contables específicas, centros de costo, textos de operación
- Layout Excel con definición de columnas por posición

**Estado actual backend:**
- `ContabilidadModule` con reglas contables, pólizas, generación desde cobros y facturación
- Exportación de pólizas

**Estado actual frontend:**
- `Contabilidad.tsx` — **solo mock** (toasts, datos de DataContext)

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| S1 | **Frontend contabilidad sin API** — la página es placeholder mock | Alta | Frontend |
| S2 | **Generación de archivos planos SAP** — el anterior genera archivos con formato posicional específico. No hay evidencia de que el backend genere este formato (solo pólizas internas) | Alta | Backend |
| S3 | **Mapeo de cuentas contables** — las reglas contables actuales son genéricas. El anterior tiene cuentas SAP específicas (`4173011004`, `2117310001`, etc.) | Media | Backend + BD |

---

### 1.5 INTERFACES — SISTEMA DE LECTURAS

**Documentación anterior:**
- Archivo emisión (`0001`): registro posicional largo con contrato, lecturas históricas, tarifa, incidencias
- Archivo recepción (`0007`): lecturas capturadas con marcas de tiempo, URL foto
- Catálogos: `Lectores.dat` (lecturistas), `Observac.dat` (incidencias con flags)
- Mensajes para lecturistas (`.men`)

**Estado actual backend:**
- `LecturasModule` completo: lotes, upload, readings, catálogo lecturistas, catálogo incidencias, mensajes
- Importación de archivos planos

**Estado actual frontend:**
- `Lecturas.tsx` — lectura de API cuando hay backend, fallback a DataContext

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| L1 | **Generación de archivo de salida (emisión `0001`)** — no hay evidencia de endpoint que genere el archivo plano posicional para enviar al sistema de lecturas | Alta | Backend |
| L2 | **Frontend de lecturas parcial** — funciona con API pero falta UI de gestión de lotes, carga y asignación a rutas | Media | Frontend |

---

### 1.6 INTERFACES — RECAUDACIÓN EXTERNA

**Documentación anterior:**
- ~20+ formatos de archivos de pago de bancos/comercios diferentes (OXXO, BBVA, Banorte, Santander, HSBC, etc.)
- Cada banco tiene layout distinto
- Proceso de conciliación y aplicación de pagos

**Estado actual backend:**
- `PagosExternosModule`: upload, list, conciliar, rechazar
- `EtlPagosService` para ETL helpers

**Estado actual frontend:**
- `Pagos.tsx` — lee de API pero **create/conciliar solo en modo mock**

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| R1 | **Frontend de pagos escritura sin API** — crear pagos y conciliar externamente solo funciona en mock | Alta | Frontend |
| R2 | **Parsers por banco** — no se verificó que existan parsers para los ~20 formatos de bancos del sistema anterior | Alta | Backend |

---

### 1.7 INTERFACES — OM (FACTURACIÓN / IMPRESIÓN)

**Documentación anterior:**
- XML `job` con estructura de documento de facturación para impresión/distribución física
- Metadatos de emisor, envío, clasificación, distribución
- Modelo de factura periódica con soporte papel/electrónica

**Estado actual:**
- No hay módulo OM en backend ni frontend
- `TimbradoPage.tsx` simula timbrado CFDI pero no genera XML de distribución OM

**GAPS IDENTIFICADOS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| O1 | **Integración OM inexistente** — no hay módulo para generar el XML de distribución de facturas impresas | Alta | Backend |
| O2 | **Timbrado es mock** — `TimbradoPage.tsx` simula con random OK/error, no hay integración PAC real | Alta | Frontend + Backend |

---

### 1.8 INTERFACES — ArcGIS

**Documentación anterior:**
- Procesos Python para integración con ArcGIS

**Estado actual:**
- `GisModule` con sincronizaciones, cambios pendientes, conciliación

**GAPS:**

| # | Gap | Severidad | Capa |
|---|-----|-----------|------|
| G1 | **Sin integración real ArcGIS** — el módulo tiene estructura pero no hay conexión real con ArcGIS REST API | Media | Backend |

---

## 2. Funcionalidades de frontend que son solo MOCK (DataContext)

Estas páginas existen pero **no consumen API real**, operan 100% con datos en memoria:

| Página | Entidad | Estado |
|--------|---------|--------|
| `Factibilidades.tsx` | Factibilidad | Mock completo |
| `Construcciones.tsx` | Construcción | Mock completo |
| `Tomas.tsx` | Toma | Mock completo |
| `Medidores.tsx` | Medidor | Mock completo |
| `Rutas.tsx` | Ruta | Mock completo |
| `Simulador.tsx` | Simulación | Mock completo |
| `AjustesFacturacion.tsx` | Ajustes | Mock completo |
| `TimbradoPage.tsx` | Timbrado | Mock simulado |
| `Contabilidad.tsx` | Pólizas/SAP | Mock placeholder |
| `Dashboard.tsx` | KPIs | Mock (DataContext aggregates) |

---

## 3. Endpoints backend STUB (retornan `[]`)

| Endpoint | Controller |
|----------|------------|
| `GET /api/consumos` | `consumos.controller.ts` → `[]` |
| `GET /api/timbrados` | `timbrados.controller.ts` → `[]` |
| `GET /api/prefacturas` | `prefacturas.controller.ts` → `[]` |

Estos son módulos que el frontend consume pero que no tienen implementación real.

---

## 4. Catálogos del sistema anterior vs actual

### Catálogos que EXISTEN en el actual:
- Tipos de corte, suministro, estructura técnica, zona facturación, código recorrido
- Marcas/modelos/calibres medidor, emplazamiento, tipo contador
- Formas de pago, oficinas, tipos oficina, sectores hidráulicos
- Clases de contrato, tipos de vía, tipos de variable
- Conceptos de cobro, cláusulas contractuales
- INEGI: estados, municipios, localidades, colonias
- Actividades, grupos actividad, categorías
- Catálogo de trámites, incidencias lecturas, lecturistas

### Catálogos del anterior que FALTAN o están incompletos:
| Catálogo anterior | Tabla anterior | Estado |
|---|---|---|
| Tipo de envío de factura | `tipoenvfac` | No existe |
| Tipo de relación punto-servicio | `tiporelps` | Existe `CatalogoTipoRelacionPS` pero verificar seed |
| Tipo de punto de servicio | `tipoptosrv` | Parcial (el anterior tiene vista `cf_quere_int.tipoptosrv`) |
| Tipo de categoría de calle | `tipocatcalle` | No existe |
| Sectores hidráulicos con exclusión gestión interna | `sechidraulico` filtrado | Verificar seed |
| Subconceptos | `precsubcon` → subconceptos de tarifa | No existe |
| Grupo de documentos | `grupodocumento` | No existe |
| Tipo de documento (carta/factura/orden/varios) | `tipodocumento.tpdtipo` | Solo `DocumentoRequeridoTipoContratacion` |
| Periodos de tarifa | `ptrafecapl` parametrizado | Verificar vigencias en `Tarifa` |

---

## 5. Priorización de gaps por impacto

### CRITICOS (bloquean flujo de negocio principal):
1. **O2** — Timbrado CFDI es mock (sin integración PAC)
2. **T1** — Motor tarifario sin bloques/tramos reales del sistema anterior
3. **S2** — No genera archivos planos para SAP
4. **L1** — No genera archivo de emisión para sistema de lecturas
5. **R2** — Parsers de archivos de bancos incompletos

### ALTOS (funcionalidad presente pero incompleta):
6. **M1/M3** — Medidores: frontend mock + sin endpoints backend
7. **S1** — Frontend contabilidad es mock
8. **R1** — Frontend pagos escritura es mock
9. **O1** — Integración OM no existe
10. **C5** — Formatos/plantillas de documentos de salida

### MEDIOS (enriquecimiento necesario):
11. **C1** — Motor de variables de contratación
12. **T2** — Validación tarifas × administración
13. **T3** — Simulador sin API real
14. **L2** — Frontend lecturas parcial
15. **M2** — Historial cambio de medidor
16. **C3** — Lógica de clases de contrato
17. **T4** — Subconceptos de tarifa

### BAJOS (mejoras de datos/catálogos):
18. **C4** — Estructuras técnicas por administración
19. **C6** — Oficinas con detalle completo
20. **G1** — Integración real ArcGIS

---

## 6. Recomendaciones de próximos pasos

1. **Conectar frontend mock → API real** para: Medidores, Contabilidad, Simulador, Pagos (escritura), Dashboard KPIs
2. **Implementar los 3 stubs** (`consumos`, `timbrados`, `prefacturas`) con lógica real
3. **Integración PAC** para timbrado CFDI real
4. **Motor tarifario** con bloques escalonados del sistema anterior
5. **Generadores de archivos planos** para SAP y sistema de lecturas
6. **Parsers de bancos** para los ~20 formatos de recaudación externa
7. **Seed completo de catálogos** operativos que faltan del sistema anterior
