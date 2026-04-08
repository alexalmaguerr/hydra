# Mapa de Requerimientos — Trazabilidad PRD 2026-04-06

**Fecha:** 2026-04-09  
**Propósito:** Trazar cada requerimiento del PRD del 6 de abril hacia la tarea que lo cubre (existente o nueva).

---

## Convenciones

- **T01–T09**: Tareas existentes en `Tareas/`
- **T10–T14**: Tareas nuevas propuestas (ver `03-tareas-nuevas-necesarias.md`)
- ✅ = Cubierto completamente
- 🔶 = Parcialmente cubierto — requiere ampliación
- ❌ = Sin cobertura — requiere tarea nueva
- ⚠️ = Bloqueado por pregunta abierta del PRD

---

## Matriz de trazabilidad

| Req # | Descripción resumida | Tarea actual | Estado | Tarea destino | Notas |
|-------|---------------------|-------------|--------|--------------|-------|
| 1 | Flujo contratación E2E visible | T06 (trámites) | 🔶 | T06 ampliada + T10 | T06 tiene trámites pero no el flujo orquestado |
| 2 | Roles persona: propietaria, fiscal, contacto | T06 (Persona/Rol) | 🔶 | T06 ampliada | Falta rol "Contacto" y trazabilidad de participación |
| 3 | Visibilidad histórica referencia CIG 2018 | T06 (HistoricoContrato) | 🔶 | T06 ampliada | Historial existe pero sin referencia CIG |
| 4 | Consulta estado histórico secuencial | T06 (historial) | 🔶 | T06 ampliada | Falta vista de secuencia operativa |
| 5 | Auto-generar orden instalación medidor post-toma | T03 (órdenes) | 🔶 | T03 ampliada | Falta trigger automático |
| 6 | Estados operativos independientes: contrato/toma/medidor/servicio | T06 (estado contrato) | 🔶 ⚠️ | T10 + T11 | Requiere entidades separadas con FSM propia. Pregunta abierta #2 |
| 7 | Formato estándar de contrato | Ninguna | ❌ ⚠️ | T10 | Pregunta abierta #1 |
| 8 | Factura de contratación timbrada + convenios | T08 (convenios) | 🔶 | T08 ampliada + T10 | Falta vinculación contratación → factura |
| 9 | Punto de servicio como entidad propia | T06 (parcial, Toma) | 🔶 | T11 | Rediseño Toma → PuntoServicio |
| 10 | Catálogos operativos del punto de servicio | Ninguna | ❌ | T11 | Estructura técnica, suministro, zona fact., recorrido |
| 11 | Tipos de corte diferenciados | T03 (tipo Corte genérico) | 🔶 ⚠️ | T11 | Pregunta abierta #5 |
| 12 | Fechas, ubicación, cortable/no cortable | T03 (parcial) | 🔶 | T11 | Falta modelo de condición de corte |
| 13 | Relaciones padre-hijo puntos de servicio | Ninguna | ❌ | T11 | Modelo jerárquico con vigencias |
| 14 | Reglas de repartición consumo/facturación padre-hijo | Ninguna | ❌ ⚠️ | T11 | Pregunta abierta #10 |
| 15 | Domicilios homologados con INEGI | Ninguna | ❌ | T12 | Modelo nuevo completo |
| 16 | Limpieza de datos de domicilios | Ninguna | ❌ | T12 | Estrategia de cleansing |
| 17 | Niveles de detalle domicilio (país→complemento) | Ninguna | ❌ | T12 | Modelo jerárquico |
| 18 | Relación calles-colonias-CP-rangos par/impar | Ninguna | ❌ ⚠️ | T12 | Pregunta abierta #9 |
| 19 | Representación concatenada de domicilio | Ninguna | ❌ | T12 | Computed field o función |
| 20 | Personas: física/moral, RFC, ID, teléfonos, correos, régimen fiscal | T06 (Persona básica) | 🔶 | T06 ampliada | Falta: identificación, régimen fiscal, multi-contacto |
| 21 | Domicilios vinculados a personas por roles | Ninguna | ❌ | T12 + T06 | Requiere modelo domicilios (T12) + vínculo persona |
| 22 | Tipos de contratación parametrizados: conceptos, cláusulas, documentos | Ninguna | ❌ ⚠️ | T13 | Pregunta abierta #6, #12 |
| 23 | Asociación automática conceptos/cláusulas por tipo contratación | Ninguna | ❌ | T13 | Motor de reglas |
| 24 | Cambio tipo contrato actualiza conceptos/tarifas | Ninguna | ❌ ⚠️ | T13 | Pregunta abierta #7 |
| 25 | Homologar catálogos funcionales | Ninguna | ❌ | T13 | Actividades, estructura técnica, sectores |
| 26 | Fórmulas tarifarias compuestas (base + proporcional + IVA) | Ninguna | ❌ | T14 | Motor de cálculo |
| 27 | Ajustes manuales excepcionales con trazabilidad | Ninguna | ❌ ⚠️ | T14 | Pregunta abierta #11 |
| 28 | Tarifas escalonadas, fijas especiales, vigencias históricas | Ninguna | ❌ | T14 | Modelo de vigencias |
| 29 | Tarifas variables: multas, recargos, descuentos, consumo no registrado | Ninguna | ❌ | T14 | Correctores tarifarios |
| 30 | Actualización automática trimestral con histórico | Ninguna | ❌ | T14 | Job programado + versionamiento |
| 31 | Validación asignación tarifaria por admin/tipo/servicio | Ninguna | ❌ ⚠️ | T14 | Pregunta abierta #13 |
| 32 | Reglas de calidad y limpieza pre-migración | Ninguna | ❌ | T15 | Estrategia transversal |
| 33 | Consistencia entre contratación/facturación/cortes/lecturas/admin | T09 (conciliaciones) | 🔶 | T09 ampliada + T15 | Falta capa de reglas compartidas |

---

## Resumen por tarea destino

### Tareas existentes a modificar

| Tarea | Reqs que absorbe | Tipo de cambio |
|-------|-----------------|----------------|
| **T03** — Sistema de Órdenes | 5, 11 (parcial), 12 (parcial) | Agregar trigger auto-generación de orden post-toma; ampliar modelo de corte |
| **T06** — Personas, Contratos, Trámites | 1-4, 20, 21 (parcial) | Ampliar Persona (régimen fiscal, identificación, multi-contacto); agregar rol Contacto; vista de flujo E2E |
| **T08** — Caja, Convenios | 8 | Vincular contratación → factura → convenio |
| **T09** — Monitoreo, Conciliaciones | 33 (parcial) | Ampliar conciliaciones con reglas de consistencia cruzada |

### Tareas nuevas necesarias

| Tarea | Reqs que cubre | Dominio |
|-------|---------------|---------|
| **T10** — Flujo de contratación E2E | 1, 6, 7, 8 (parcial) | Orquestación del proceso contractual con FSM |
| **T11** — Punto de servicio y cortes | 9-14 | Entidad PuntoServicio, jerarquías, tipos de corte |
| **T12** — Modelo de domicilios INEGI | 15-19, 21 (parcial) | Domicilios normalizados, catálogos INEGI, limpieza |
| **T13** — Tipos de contratación y catálogos | 22-25 | Parametrización, conceptos, cláusulas, catálogos |
| **T14** — Motor tarifario | 26-31 | Fórmulas, vigencias, escalonamiento, correctores |
| **T15** — Reglas de calidad y migración | 32, 33 (parcial) | Framework de validación pre-migración |

---

## Dependencias entre tareas

```
T12 (Domicilios) ← T06 ampliada (Persona con domicilio por roles)
T11 (PuntoServicio) ← T03 ampliada (Órdenes con tipos de corte)
T13 (Tipos contratación) ← T14 (Motor tarifario) — los conceptos de cobro usan tarifas
T10 (Flujo contratación) ← T06 (Persona), T11 (PuntoServicio), T13 (Tipos), T14 (Tarifas)
T15 (Calidad/migración) ← T12 (Domicilios), T13 (Catálogos), T14 (Tarifas) — valida todo
```

### Orden sugerido de implementación

1. **Fase 1 (fundamentos):** T12 Domicilios → T06 ampliada (Persona + domicilios)
2. **Fase 2 (entidades operativas):** T11 PuntoServicio → T03 ampliada (Órdenes/cortes)
3. **Fase 3 (parametrización):** T13 Tipos de contratación → T14 Motor tarifario
4. **Fase 4 (orquestación):** T10 Flujo contratación E2E → T08 ampliada (factura contratación)
5. **Fase 5 (calidad):** T15 Reglas de calidad → T09 ampliada (conciliaciones)
