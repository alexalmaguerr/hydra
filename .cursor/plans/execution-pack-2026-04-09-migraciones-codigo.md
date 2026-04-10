# Execution pack — migraciones + uso en código

```
EXECUTION PACK
  objective: Alinear API de puntos de servicio con columnas ya migradas (tipo_relacion_padre_id) y dejar documentado el estado de migraciones existentes.
  files_layers: backend/src/modules/puntos-servicio/puntos-servicio.service.ts, puntos-servicio.controller.ts; opcional frontend/src/api/puntos-servicio.ts (tipos).
  parallel_streams: none
  implementation_order:
    1. Añadir tipoRelacionPadreId a DTOs internos create/update + validación FK CatalogoTipoRelacionPS.
    2. Incluir tipoRelacionPadre (y catálogos ya usados en findOne) en findAll para listados.
    3. Extender vincularPadre con tipoRelacionPadreId opcional; desvincularPadre limpia tipoRelacionPadreId.
    4. Actualizar tipos TS del cliente frontend si aplica.
    5. npm run lint + npm run build en backend.
  validation_manifest: (ver scout)
  validations_required: lint, build (backend); migrate status N/A (sin DB)
  key_risks: DB remota no verificada; omitir cambios de schema masivos sin decisión de negocio.
  what_not_to_touch: prisma/schema sin nueva migración; domicilios legado Excel.
  executor_checklist:
    - [ ] FK tipo relación validada cuando se envía id
    - [ ] desvincularPadre deja tipoRelacionPadreId en null
    - [ ] build verde
  done_criteria: API create/update/vincular aceptan y persisten tipoRelacionPadreId; listados incluyen relación; lint/build OK.
```
