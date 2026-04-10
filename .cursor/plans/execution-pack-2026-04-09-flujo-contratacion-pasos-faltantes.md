## Execution Pack

- objective: cerrar brechas del flujo de contratación en alta de contrato (backend + frontend) sin migraciones
- files_layers:
  - `backend/src/modules/contratos/dto/create-contrato.dto.ts`
  - `backend/src/modules/contratos/contratos.service.ts`
  - `frontend/src/api/contratos.ts`
  - `frontend/src/api/tipos-contratacion.ts`
  - `frontend/src/pages/Contratos.tsx`
- implementation_order:
  1. Extender contrato DTO/API para nuevos campos del flujo.
  2. Persistir checklist de documentos recibidos en backend.
  3. Extender wizard frontend con actividad, contrato padre, cuantificación y documentos requeridos.
  4. Validar compilación/lint/test.
- validation_manifest:
  - `npm run lint --prefix frontend`
  - `npm run test --prefix frontend`
  - `npm run build --prefix frontend`
  - `npm run build --prefix backend`
- key_risks:
  - `documentosRecibidos` se persiste en `datosAdicionales` del proceso (JSON), no en tabla documental dedicada.
  - Flujo 8–13 (timbrado legal/impresión formal) sigue fuera de este alcance.
