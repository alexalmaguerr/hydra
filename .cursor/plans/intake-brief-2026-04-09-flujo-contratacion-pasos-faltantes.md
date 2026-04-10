## Intake Brief

- Fecha: 2026-04-09
- Task: implementar pasos faltantes del flujo de contratación en backend y frontend
- Alcance esperado:
  - Completar captura en wizard para pasos operativos faltantes (actividad, contrato padre, cuantificación, checklist de documentos).
  - Conectar payload de alta con campos backend ya soportados.
  - Guardar evidencia de documentos recibidos en backend para trazabilidad.
- Fuera de alcance:
  - Timbrado/factura de contratación end-to-end.
  - Generación PDF legal de contrato firmado.
  - Rediseño completo de FSM de contratación.
- Aceptación:
  - UI de alta captura y envía nuevos campos.
  - Backend persiste nuevos datos y acepta checklist de documentos.
  - Validación local (lint/build) de frontend y build de backend en verde.
- Devcontext conversationId: `9eb1d41f-67f6-41f3-a384-7b8dda8747d4`
