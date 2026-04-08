# Análisis de Gap — PRD 2026-04-06 vs Estado Actual

**Fecha:** 2026-04-09  
**PRD analizado:** `Requerimientos/PRD-Draft-2026-04-06.md` (sesión con Alejandro Almaguer, Jessica Godínez Egner)  
**PRDs previos:** `PRD_1.md` (2026-02-23), `PRD_2.md` (2026-02-26)  
**Tareas existentes:** T01–T09 en `Tareas/`

---

## Resumen ejecutivo

El PRD del 6 de abril introduce **cuatro dominios completamente nuevos** no cubiertos por las tareas existentes y **amplía significativamente** tres dominios ya parcialmente diseñados. Los nuevos dominios son: modelo de domicilios INEGI, motor tarifario completo, punto de servicio como entidad propia, y parametrización de tipos de contratación. Los dominios ampliados son: personas (roles flexibles con domicilios), contratos (flujo visible end-to-end con estados diferenciados), y cortes (tipología y relaciones padre-hijo).

---

## 1. Requerimientos completamente nuevos (sin cobertura)

### 1.1 Modelo de domicilios homologado con INEGI (Reqs 15–19)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 15 | Homologar con catálogos INEGI | **SIN COBERTURA** — No existe modelo de domicilios en schema Prisma ni en ninguna tarea |
| 16 | Proceso de limpieza de datos de domicilios | **SIN COBERTURA** — No hay tarea de data cleansing |
| 17 | Niveles de detalle: país, estado, municipio, localidad, colonia, calle, num ext/int, manzana, lote, complementos | **SIN COBERTURA** — Contrato actual tiene `direccion` como string plano |
| 18 | Evaluar relación calles-colonias-CP con rangos par/impar | **SIN COBERTURA** — Decisión de diseño abierta |
| 19 | Generar representación concatenada del domicilio para recibos/comprobantes | **SIN COBERTURA** |

**Impacto:** Requiere nueva tarea completa con migración, modelos, seed de catálogos INEGI, y estrategia de limpieza/migración de datos.

### 1.2 Motor tarifario completo (Reqs 26–31)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 26 | Fórmulas compuestas: precio base + componente proporcional (distancia/diámetro), IVA diferenciado | **SIN COBERTURA** — No existe modelo tarifario en el schema |
| 27 | Ajustes manuales excepcionales con trazabilidad | **SIN COBERTURA** |
| 28 | Tarifas mensuales escalonadas, fijas para especiales, vigencias históricas | **SIN COBERTURA** |
| 29 | Tarifas variables: multas, recargos, ajustes, descuentos, consumo no registrado | **SIN COBERTURA** |
| 30 | Actualización automática trimestral con histórico de vigencias | **SIN COBERTURA** |
| 31 | Validación de asignación tarifaria por administración/tipo usuario/servicio | **SIN COBERTURA** |

**Impacto:** Este es el dominio más complejo del nuevo PRD. Requiere tarea dedicada con diseño de motor de cálculo, modelos de vigencia, y reglas de validación.

### 1.3 Tipos de contratación parametrizados (Reqs 22–24)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 22 | Parametrizar tipo de contratación con conceptos de cobro, cláusulas contractuales y documentos requeridos (obligatoriedad) | **SIN COBERTURA** — T06 tiene tipos de trámite pero no tipos de contratación con esta parametrización |
| 23 | Asociación automática de conceptos de facturación y cláusulas según tipo de contratación | **SIN COBERTURA** |
| 24 | Al cambiar tipo de contrato, actualizar conceptos y tarifas consistentemente | **SIN COBERTURA** |

**Impacto:** Requiere nuevo modelo `TipoContratacion` con relaciones a conceptos, cláusulas y documentos.

### 1.4 Punto de servicio como entidad propia (Reqs 9–14)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 9 | Modelar como entidad propia con info técnica, administrativa y geográfica | **PARCIAL** — El schema tiene `Toma` pero sin esta riqueza |
| 10 | Catálogos operativos: estructura técnica, tipo suministro, zona facturación, código recorrido | **SIN COBERTURA** |
| 11 | Diferenciar tipos de corte: deuda, baja temporal, extensible | **SIN COBERTURA** — `Orden` tiene tipo Corte pero sin tipología de corte |
| 12 | Registrar fechas, ubicación, cortable/no cortable por corte | **SIN COBERTURA** |
| 13 | Relaciones padre-hijo entre puntos de servicio con vigencias | **SIN COBERTURA** |
| 14 | Relaciones padre-hijo para repartición de consumo y facturación | **SIN COBERTURA** |

**Impacto:** Requiere rediseño del modelo `Toma` → `PuntoServicio` con relaciones jerárquicas y catálogos operativos.

### 1.5 Catálogos funcionales (Req 25)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 25 | Depurar y homologar: actividades, tipos de contratación, estructura técnica, sectores hidráulicos, tipos de punto de servicio | **SIN COBERTURA** — No existe modelo de catálogos unificado |

### 1.6 Reglas de calidad pre-migración (Req 32)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 32 | Definir reglas de calidad, homologación y limpieza de datos antes de migración | **SIN COBERTURA** |

### 1.7 Formato estándar de contrato (Req 7)

| Req | Descripción | Estado |
|-----|-------------|--------|
| 7 | Formato estándar con estructura homogénea, datos obligatorios y cláusulas controladas | **SIN COBERTURA** — T06 tiene trámites pero no un modelo de formato/plantilla de contrato |

---

## 2. Requerimientos parcialmente cubiertos (requieren ampliación)

### 2.1 Flujo de contratación visible E2E (Reqs 1–4, 6)

| Req | Descripción | Cobertura actual | Gap |
|-----|-------------|-----------------|-----|
| 1 | Flujo E2E desde captura personas hasta instalación/facturación/lecturas | T06 cubre trámites individuales | Falta orquestación del flujo completo con hitos y dependencias |
| 2 | Roles: propietaria, fiscal, contacto con trazabilidad | T06 tiene `RolPersonaContrato` con: Propietario, Cliente, PersonaFiscal | Falta rol "Contacto" y trazabilidad de participación en el proceso |
| 3 | Recuperar visibilidad histórica referencia CIG 2018 | T06 tiene `HistoricoContrato` | Falta vinculación con lógica operativa CIG 2018 |
| 4 | Consulta estado histórico en secuencia entendible | T06 tiene historial de cambios | Falta vista de secuencia operativa del proceso contractual |
| 6 | Estados operativos independientes: contrato, toma, medidor, alta servicio | Contrato tiene campo `estado` | Falta: estados separados para toma, medidor y servicio |

### 2.2 Modelo de personas (Reqs 20–21)

| Req | Descripción | Cobertura actual | Gap |
|-----|-------------|-----------------|-----|
| 20 | Distinguir física/moral con RFC, ID, teléfonos, correos, régimen fiscal | T06 tiene Persona con nombre, rfc, tipo, email, telefono | Falta: identificación oficial, régimen fiscal, múltiples teléfonos/correos |
| 21 | Domicilios vinculados a personas por roles/etiquetas | No existe relación persona-domicilio | **Nuevo:** Modelo `DomicilioPersona` con roles flexibles |

### 2.3 Generación automática de órdenes (Req 5)

| Req | Descripción | Cobertura actual | Gap |
|-----|-------------|-----------------|-----|
| 5 | Auto-generar orden de instalación de medidor al concluir instalación de toma | T03 tiene Orden pero sin auto-generación por evento | Falta: trigger automático post-instalación de toma |

### 2.4 Factura de contratación (Req 8)

| Req | Descripción | Cobertura actual | Gap |
|-----|-------------|-----------------|-----|
| 8 | Emisión de factura de contratación timbrada + relación con convenios | T08 tiene Convenios; timbrado existe | Falta: vinculación contratación → factura → convenio |

### 2.5 Consistencia entre procesos (Req 33)

| Req | Descripción | Cobertura actual | Gap |
|-----|-------------|-----------------|-----|
| 33 | Contratación, facturación, cortes, lecturas y administración comparten reglas/datos | T09 tiene conciliaciones | Falta: capa de reglas compartidas y validación cruzada |

---

## 3. Requerimientos ya cubiertos adecuadamente

Ningún requerimiento del nuevo PRD está completamente cubierto sin necesidad de modificaciones. Todos requieren al menos ampliación.

---

## 4. Preguntas abiertas del PRD — impacto en diseño

| # | Pregunta | Impacto | Bloquea implementación |
|---|----------|---------|----------------------|
| 1 | Formato final estándar del contrato | Alto — define modelo de plantilla | Sí, para Req 7 |
| 2 | Criterios de transición entre estados | Alto — define máquina de estados | Sí, para Req 6 |
| 3 | Validaciones para auto-generar orden de medidor | Medio — define reglas de negocio | Sí, para Req 5 |
| 4 | Nivel de detalle histórico | Bajo — T06 ya captura cambios | No |
| 5 | Tipos de corte y su impacto operativo/facturación | Alto — define modelo de cortes | Sí, para Reqs 11-12 |
| 6 | Regla de asociación automática conceptos/cláusulas/docs | Alto — define parametrización | Sí, para Reqs 22-23 |
| 7 | Cambio de tipo de contrato sin afectar contabilidad | Alto — reglas de migración tarifaria | Sí, para Req 24 |
| 8 | Nivel de complejidad de domicilios | Medio — impacta Reqs 15-18 | Parcial |
| 9 | Relación calles-colonias-CP-rangos | Medio — decisión de arquitectura | Parcial, para Req 18 |
| 10 | Regla de repartición padre-hijo | Alto — define cálculo | Sí, para Reqs 13-14 |
| 11 | Excepciones tarifarias y autorizaciones | Medio — define permisos | Parcial, para Req 27 |
| 12 | Documentos obligatorios por tipo de contratación | Medio — define catálogo | Sí, para Req 22 |
| 13 | Controles de asignación tarifaria | Medio — define validaciones | Parcial, para Req 31 |

---

## 5. Resumen de impacto

| Categoría | Reqs | Impacto |
|-----------|------|---------|
| Completamente nuevo — requiere tarea nueva | 15-19, 22-31, 32, 25 | **5 tareas nuevas estimadas** |
| Parcialmente cubierto — requiere ampliación de tarea existente | 1-6, 8-14, 20-21, 33 | **Modificaciones en T03, T06, T08, T09** |
| Decisiones de diseño bloqueantes (preguntas abiertas) | 1, 2, 3, 5, 6, 7, 10, 12 | **8 decisiones pendientes** |
