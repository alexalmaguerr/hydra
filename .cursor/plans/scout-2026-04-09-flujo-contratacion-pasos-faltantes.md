## Scout

### Clasificación
- STANDARD (multicapa frontend+backend, bajo riesgo estructural, sin migración de schema)

### Hallazgos clave
- Backend ya soporta en `CreateContratoDto`/`ContratosService.create`:
  - `actividadId`, `referenciaContratoAnterior`, `superficiePredio`, `superficieConstruida`, `unidadesServidas`, `personasHabitanVivienda`.
- Frontend wizard no captura esos campos.
- `TipoContratacion` ya tiene `DocumentoRequeridoTipoContratacion`, pero wizard no muestra checklist.
- Existe endpoint `GET /tipos-contratacion/:id/configuracion` para traer documentos requeridos.
- `create` de contrato no guarda evidencia de documentos recibidos.

### VALIDATION MANIFEST
- lint_cmd: `npm run lint --prefix frontend`
- typecheck_cmd: N/A (no script dedicado)
- test_cmd: `npm run test --prefix frontend`
- build_cmd: `npm run build --prefix frontend && npm run build --prefix backend`
- browser_check: no
- migration_check: no

### warm_up_hints
- skills: `backend-patterns`, `react-dev`, `self-validate`
- subagent: none (cambio acotado y directo)
