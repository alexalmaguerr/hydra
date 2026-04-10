# Scout — Validación flujo de contratación

**Fecha:** 2026-04-09  
**Clasificación:** COMPLEX (muchos pasos funcionales, varias capas, contratos de producto no cerrados en código).

## Resumen ejecutivo

El **modelo de datos** cubre buena parte del dominio (contrato, punto de servicio, personas por rol, tipo de contratación con documentos/cláusulas, órdenes, timbrados, convenios, proceso de contratación con hitos, plantillas). El **asistente de alta en UI** es un wizard de **3 pasos** centrado en toma + datos planos del titular; **no implementa** la secuencia operativa 1–13. La **generación automática de orden de medidor** existe al **ejecutar** una orden `InstalacionToma` (`OrdenesService.updateEstado`) y también al **avanzar** el proceso a etapa `instalacion_medidor` (`ProcesosContratacionService.avanzarEtapa`), lo que puede **duplicar** órdenes si se usan ambos mecanismos. **No** hay evidencia de transiciones automáticas de `Contrato.estado` a “pendiente de zona” ni de **Alta** al asignar zona/ruta; **no** hay snapshot de cláusulas para reimpresión histórica.

## Archivos y capas relevantes (evidencia)

| Área | Ubicación |
|------|-----------|
| Contrato + campos P1 (superficies, actividad, etc.) | `backend/prisma/schema.prisma` → `Contrato` |
| Órdenes toma/medidor | `backend/prisma/schema.prisma` → `Orden`; `backend/src/modules/ordenes/ordenes.service.ts` |
| Proceso FSM + plantillas | `backend/src/modules/procesos-contratacion/procesos-contratacion.service.ts` |
| API contratos | `backend/src/modules/contratos/contratos.controller.ts`, `contratos.service.ts` |
| Wizard alta | `frontend/src/pages/Contratos.tsx` (título “Paso X de 3”) |
| DTO cliente crear contrato | `frontend/src/api/contratos.ts` (`CreateContratoDto` acotado) |
| Tarea backlog E2E | `Tareas/10-flujo-contratacion-e2e.md` (varios ítems sin marcar) |

## VALIDATION MANIFEST

```
VALIDATION MANIFEST
- lint_cmd: npm run lint (raíz; frontend + backend)
- typecheck_cmd: N/A (sin script dedicado en raíz; inferencia vía build)
- test_cmd: npm run test (raíz; según package.json solo frontend vitest)
- build_cmd: npm run build
- browser_check: no (análisis estático)
- migration_check: no
```

## warm_up_hints

- Skills: `repo-discovery` (ya cubierto), `self-validate` al cierre.
- Subagentes: no requeridos para solo lectura; `documentation-engineer` si se amplía el doc.
- MCP: `user-cursor10x-mcp`, `user-devcontext` para continuidad.

## Alineación con diagrama SIGE / AQUACIS (imagen)

- **Facturación tras instalación de toma y antes del medidor:** el sistema actual no modela explícitamente ese disparador; depende de estados de contrato y ciclo de facturación no enlazados en el wizard.
- **Orden toma vs orden medidor (AQUACIS “masiva” vs SIGE simultáneo):** solo existe creación genérica de `Orden` por tipo string; no hay cola masiva ni diferencia de proceso en esquema más allá de `tipo`.
