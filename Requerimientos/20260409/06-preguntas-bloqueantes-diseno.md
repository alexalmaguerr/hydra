# Preguntas Bloqueantes de Diseño — PRD 2026-04-06

**Fecha:** 2026-04-09  
**Estado:** Pendiente de respuesta del equipo funcional  
**Propósito:** Estas 8 preguntas bloquean implementación de tareas nuevas y ampliadas. Deben resolverse antes de avanzar con las fases de desarrollo.

---

## P1 — Formato final estándar del contrato

**Bloquea:** T10 (Flujo contratación E2E), T13 (Tipos contratación)  
**Requerimiento PRD:** Req 7 — "Formato estándar con estructura homogénea, datos obligatorios y cláusulas controladas"

### Contexto
El PRD requiere un formato estándar de contrato con campos obligatorios controlados por tipo de contratación. Actualmente no existe una plantilla formal.

### Decisión requerida
1. ¿Cuáles son los campos obligatorios mínimos que debe incluir todo contrato (independientemente del tipo)?
2. ¿Existen campos adicionales que varían por tipo de contratación (DOM_HAB, COM, IND, GOB)?
3. ¿El formato impreso del contrato es un documento único o puede tener variantes por tipo?
4. ¿Las cláusulas contractuales tienen versiones vigentes o son estáticas?

### Propuesta provisional
Se implementó un modelo `PlantillaContrato` con campos: nombre, versión, contenido (texto largo), variables (JSON dinámicas). Se complementa con `ClausulaContractual` vinculada a `TipoContratacion`. Si se resuelve esta pregunta, se ajustará el contenido de las plantillas y las cláusulas obligatorias por tipo.

---

## P2 — Criterios de transición entre estados del proceso contractual

**Bloquea:** T10 (Flujo contratación E2E)  
**Requerimiento PRD:** Req 6 — "Estados operativos independientes: contrato, toma, medidor, alta servicio"

### Contexto
El flujo E2E propuesto tiene 7 etapas: Solicitud → Validación → Aprobación → Instalación Toma → Instalación Medidor → Alta Servicio → Activo. Cada transición necesita condiciones claras.

### Decisión requerida
1. ¿Qué condiciones exactas deben cumplirse para avanzar de cada etapa a la siguiente?
2. ¿Quién autoriza cada transición (sistema automático, operador, supervisor)?
3. ¿Es posible retroceder a una etapa anterior? ¿Bajo qué circunstancias?
4. ¿Existen estados especiales como "Suspendido" o "En espera de documentación"?

### Propuesta provisional
Se implementó una FSM básica en `ProcesosContratacionService` con transiciones lineales. Se documentó una tabla de transiciones en `Tareas/10-flujo-contratacion-e2e.md`. Se ajustará cuando se definan las condiciones exactas.

---

## P3 — Validaciones para auto-generar orden de medidor

**Bloquea:** T03 ampliada (Órdenes), T10 (Flujo E2E)  
**Requerimiento PRD:** Req 5 — "Auto-generar orden de instalación de medidor al concluir instalación de toma"

### Contexto
Al completar una orden de instalación de toma, el sistema debe generar automáticamente una orden de instalación de medidor. Las validaciones previas a esta auto-generación no están definidas.

### Decisión requerida
1. ¿Se genera la orden de medidor inmediatamente o hay un periodo de espera/verificación?
2. ¿Qué datos de campo de la orden de toma deben trasladarse a la orden de medidor?
3. ¿La orden de medidor se asigna al mismo operador o a una cuadrilla diferente?
4. ¿Qué pasa si la instalación de toma se reporta con observaciones o incidencias?

### Propuesta provisional
Se documentó el trigger en T03 (`MOD-T03-1`) para generar la orden al transicionar a `Ejecutada`. La prioridad y asignación de la nueva orden se definirán cuando se resuelva esta pregunta.

---

## P5 — Tipos de corte y su impacto operativo/facturación

**Bloquea:** T11 (Punto de servicio y cortes), T03 ampliada  
**Requerimiento PRD:** Reqs 11–12 — "Diferenciar tipos de corte" + "Registrar fechas, ubicación, cortable/no cortable"

### Contexto
El PRD menciona tipos de corte diferenciados (deuda, baja temporal, extensibles) con impacto distinto en facturación y operación. El modelo actual solo tiene `tipo: Corte` sin subtipología.

### Decisión requerida
1. ¿Cuál es la lista definitiva de tipos de corte?
2. ¿Cada tipo de corte tiene un impacto diferente en facturación (suspensión total, parcial, solo registro)?
3. ¿Qué tipos de corte requieren cuadrilla de campo y cuáles son administrativos?
4. ¿Un contrato puede tener múltiples cortes activos simultáneamente?
5. ¿Los cortes se vinculan al punto de servicio o al contrato?

### Propuesta provisional
Se creó `CatalogoTipoCorte` con campos: código, descripción, impacto, requiereCuadrilla. Se definieron 4 tipos iniciales (DEUDA, BAJA_TEMP, ADMIN, FUGA). Se ajustará la lista cuando se resuelva esta pregunta.

---

## P6 — Regla de asociación automática conceptos/cláusulas/documentos

**Bloquea:** T13 (Tipos de contratación)  
**Requerimiento PRD:** Reqs 22–23 — "Parametrizar tipo de contratación" + "Asociación automática"

### Contexto
Cada tipo de contratación debe tener asociados automáticamente: conceptos de cobro (obligatorios/opcionales), cláusulas contractuales (con orden), y documentos requeridos (obligatorios/opcionales).

### Decisión requerida
1. ¿Cuáles son los conceptos de cobro por cada tipo de contratación (DOM_HAB, COM, IND, GOB, MIXTO)?
2. ¿Cuáles son las cláusulas contractuales vigentes y su orden de aparición?
3. ¿Cuáles son los documentos requeridos por tipo y cuáles son obligatorios vs opcionales?
4. ¿La asociación se aplica solo al crear o también retroactivamente a contratos existentes?

### Propuesta provisional
Se implementaron tablas de asociación: `ConceptoCobroTipoContratacion`, `ClausulaTipoContratacion`, `DocumentoRequeridoTipoContratacion`, cada una con campos de obligatoriedad y orden. Se definieron 5 conceptos de cobro iniciales como seed. Se completará el catálogo cuando se resuelva esta pregunta.

---

## P7 — Cambio de tipo de contrato sin afectar contabilidad/convenios

**Bloquea:** T13 (Tipos de contratación), T14 (Motor tarifario)  
**Requerimiento PRD:** Req 24 — "Al cambiar tipo de contrato, actualizar conceptos y tarifas consistentemente"

### Contexto
Un cambio de tipo de contratación implica cambiar conceptos de cobro, tarifas, y potencialmente cláusulas contractuales. Esto no debe romper pagos ya registrados, pólizas generadas, ni convenios activos.

### Decisión requerida
1. ¿El cambio de tipo afecta solo períodos futuros o también el período en curso?
2. ¿Se requiere recalcular el saldo pendiente con la nueva tarifa o se mantiene el saldo calculado con la tarifa anterior?
3. ¿Qué pasa con un convenio activo al cambiar el tipo de contrato?
4. ¿Quién autoriza un cambio de tipo (operador, supervisor, gerente)?
5. ¿Debe quedar registro contable del cambio (póliza de ajuste)?

### Propuesta provisional
Se documentó en T13 que el método `cambiarTipoContrato()` debe: registrar en HistoricoContrato, remover conceptos del tipo anterior, aplicar conceptos del nuevo tipo, recalcular tarifas, pero NO modificar pagos ni pólizas ya generadas. Se ajustará la lógica cuando se definan las reglas exactas.

---

## P10 — Regla de repartición padre-hijo puntos de servicio

**Bloquea:** T11 (Punto de servicio)  
**Requerimiento PRD:** Reqs 13–14 — "Relaciones padre-hijo con vigencias" + "Repartición de consumo y facturación"

### Contexto
Los puntos de servicio pueden tener relaciones jerárquicas (padre-hijo) donde el consumo y la facturación se reparten entre los hijos según un porcentaje. Esto es crítico para predios con múltiples tomas.

### Decisión requerida
1. ¿La repartición es siempre por porcentaje fijo o puede ser por fórmula (ej: proporcional al consumo individual)?
2. ¿La suma de reparticiones de todos los hijos debe ser exactamente 100%, o puede ser menor (consumo propio del padre)?
3. ¿Un punto de servicio puede tener múltiples niveles de jerarquía (abuelo → padre → hijo)?
4. ¿La repartición aplica a consumo, facturación o ambos?
5. ¿Las vigencias de la relación padre-hijo afectan recálculos retroactivos?

### Propuesta provisional
Se implementó `PuntoServicio.puntoServicioPadreId` con `reparticionConsumo` como porcentaje simple. Se validará que la suma de reparticiones no exceda 100%. Se ajustará el modelo cuando se definan las reglas exactas.

---

## P12 — Documentos obligatorios por tipo de contratación

**Bloquea:** T13 (Tipos de contratación), T10 (Flujo E2E)  
**Requerimiento PRD:** Req 22 — "Parametrizar tipo de contratación con documentos requeridos (obligatoriedad)"

### Contexto
Cada tipo de contratación requiere documentos específicos. Algunos son obligatorios (bloquean avance del proceso) y otros son opcionales.

### Decisión requerida
1. ¿Cuáles son los documentos requeridos por cada tipo de contratación?
2. ¿Cuáles son obligatorios (bloquean) vs opcionales (informativos)?
3. ¿Los documentos tienen fecha de vigencia o vencimiento?
4. ¿Se requiere verificación manual de cada documento o alguno puede ser verificado automáticamente (ej: RFC con SAT)?
5. ¿El checklist de documentos es configurable por administrador o es estático?

### Propuesta provisional
Se implementó `DocumentoRequeridoTipoContratacion` con campos: nombreDocumento, descripcion, obligatorio, orden. Se configurará como CRUD administrable por el equipo funcional. Se completará el catálogo cuando se resuelva esta pregunta.

---

## Resumen de dependencias entre preguntas y tareas

| Pregunta | Tareas bloqueadas | Prioridad |
|----------|-------------------|-----------|
| P1 | T10, T13 | Alta |
| P2 | T10 | Alta |
| P3 | T03, T10 | Media |
| P5 | T11, T03 | Alta |
| P6 | T13 | Alta |
| P7 | T13, T14 | Alta |
| P10 | T11 | Media |
| P12 | T13, T10 | Media |

## Fases de implementación condicionadas

| Fase | Tareas | Preguntas que la desbloquean |
|------|--------|------------------------------|
| Fase 1 — Fundamentos | T12, T06 ampliada | Ninguna (P8, P9 son parciales, no bloquean) |
| Fase 2 — Entidades operativas | T11, T03 ampliada | P5, P10 |
| Fase 3 — Parametrización | T13, T14 | P1, P6, P7, P12 |
| Fase 4 — Orquestación | T10, T08 ampliada | P2, P3 |
| Fase 5 — Calidad | T15, T09 ampliada | Todas las anteriores |

**Nota:** La Fase 1 puede comenzar inmediatamente sin bloqueos. Las fases 2–5 requieren respuestas progresivas.
