# Validación del flujo de contratación (2026-04-09)

Documento de brechas entre el flujo operativo deseado (lista de pasos + notas SIGE/AQUACIS) y la implementación actual del repositorio **contract-to-cash-flow**. Basado en inspección de `schema.prisma`, módulos NestJS y pantalla de contratos.

## Leyenda

- **Cubierto (modelo/API):** existe entidad o endpoint que puede soportar el paso, aunque la UI no lo exponga.
- **Parcial:** hay piezas pero falta regla de negocio, UI o enlace entre módulos.
- **Faltante:** no localizado en código revisado.

## Matriz paso → implementación

| Paso / requerimiento | Estado | Notas |
|----------------------|--------|--------|
| Inspección cuando aplica | Parcial | Existen `Factibilidad` / `Construccion` / `Toma` en territorio-obra, pero el alta de contrato en UI no las encadena ni crea hitos de inspección en `ProcesoContratacion`. |
| Cuantificación del costo | Parcial | `CostoContrato` y motor tarifario (otras tareas); no hay flujo guiado en el wizard de alta. |
| 1. Punto de servicio | Parcial | `Contrato.puntoServicioId` y modelo `PuntoServicio` existen; el wizard solo ofrece **toma** (`tomaId`). |
| 2. Persona propietaria | Parcial | `RolPersonaContrato` + `Persona`; el alta usa `nombre`/`rfc` en el contrato sin crear rol ni persona. |
| 3. Persona fiscal | Parcial | Campos fiscales en `Contrato` (`razonSocial`, `regimenFiscal`, etc.) y personas; sin flujo dedicado en wizard. |
| 3.1 Contacto opcional | Parcial | Campo `contacto` en contrato; no como rol `CONTACTO` en `RolPersonaContrato`. |
| 3.2 Contrato padre | Parcial | `referenciaContratoAnterior` en schema y `update` en servicio; no en wizard. |
| 4. Actividad | Parcial | `actividadId` / `CatalogoActividad`; no en wizard. |
| 5. Tipo de contratación | Parcial | `tipoContratacionId` y catálogos; wizard usa `tipoContrato`/`tipoServicio` como strings genéricos (Agua/Doméstico, etc.), no catálogo `TipoContratacion`. |
| 6. Superficie, unidades, personas | Parcial | Campos en `Contrato` (`superficiePredio`, `superficieConstruida`, `unidadesServidas`, `personasHabitanVivienda`); no en wizard. |
| 7. Documentos recibidos | Parcial | `DocumentoRequeridoTipoContratacion` define requisitos; `Documento` está ligado a `Tramite`, no a un checklist de contratación en el alta. |
| 8. Factura contratación timbrada + convenio | Parcial | `Timbrado`, `Recibo`, `Convenio` existen; el timbrado típico está asociado a `Consumo` en el modelo. Falta definir/implementar el camino explícito “factura única de contratación” y su convenio en el flujo de alta. |
| 9. Orden instalación toma | Parcial | `Orden.tipo` admite valores como `InstalacionToma`; no se genera desde el wizard ni regla única documentada en contrato. |
| 10. Orden instalación medidor | Parcial | Se puede crear manualmente; **auto:** al marcar orden `InstalacionToma` como `Ejecutada` (`OrdenesService.updateEstado`). |
| 11. Estados pendiente toma / pendiente zona | Faltante | El alta pone `estado: 'Pendiente de alta'` (`Contratos.tsx`). No hay estados nominales “pendiente de toma” / “pendiente de zona” ni transiciones automáticas al crear órdenes. |
| 12. Imprimir contrato (titular) | Faltante | `PlantillaContrato` + CRUD bajo `procesos-contratacion/plantillas/*`; no hay generación PDF/imprimir en frontend revisado. |
| 13. Asignar zona + código recorrido → Alta | Parcial | `zonaId`, `rutaId` en `Contrato`; asignación manual. **No** hay regla automática “al asignar ruta → estado Activo”. |
| Al atender orden toma → auto orden medidor + pendiente zona | Parcial | Auto orden medidor: **sí** en `ordenes.service.ts`. Cambio de estado contrato a “pendiente de zona”: **no** en el mismo flujo. |
| Reimprimir con mismas cláusulas contratadas | Faltante | Las cláusulas vienen del catálogo vía `TipoContratacion`; no hay versión/snapshot del texto aceptado al firmar, por lo que histórico vs plantilla vigente no está resuelto. |

## Riesgos y duplicidades

1. **Dos orígenes de orden de medidor:** (a) `ProcesosContratacionService.avanzarEtapa` al entrar en etapa `instalacion_medidor`; (b) `OrdenesService.updateEstado` al ejecutar `InstalacionToma`. Si se usan proceso + órdenes reales a la vez, puede haber **órdenes duplicadas** o orden fuera de tiempo respecto a campo.
2. **Desalineación documentación Prisma vs código:** comentario en `ProcesoContratacion.etapa` menciona valores distintos a `ETAPAS_FLUJO` en `procesos-contratacion.service.ts` (convivencia `instalacion_toma` / `instalacion_medidor` en servicio).
3. **`getFlujoCompleto`:** según `Tareas/10-flujo-contratacion-e2e.md` debería agregar órdenes + trámites + hitos; la implementación actual incluye proceso reciente e historial parcial pero **no** ensambla órdenes ni trámites en ese método.

## Próximos pasos sugeridos (ingeniería)

1. Unificar **una** máquina de estados (¿`Contrato.estado` vs `ProcesoContratacion.etapa` vs estados en órdenes?) y documentar valores canónicos.
2. Extender wizard o flujo por pasos hasta cubrir 1–13, o exponer API ya existente en UI (personas, punto servicio, tipo contratación, campos P1).
3. Definir entidad o relación para **factura de contratación** (timbrado sin consumo o tipo de timbrado) y enganchar convenio.
4. Reglas automáticas: al ejecutar `InstalacionToma` → opcionalmente actualizar estado contrato; al asignar `rutaId`+`zonaId` → transición a `Activo` si reglas de negocio lo permiten.
5. **Snapshot de contrato firmado** (texto + ids de cláusulas y versión) para reimpresión fiel.

## Referencias de código

- Auto orden medidor al ejecutar toma: `backend/src/modules/ordenes/ordenes.service.ts` (`updateEstado`, `autoGenerarOrdenMedidor`).
- Auto orden medidor al avanzar proceso: `backend/src/modules/procesos-contratacion/procesos-contratacion.service.ts` (`avanzarEtapa`).
- Wizard alta 3 pasos: `frontend/src/pages/Contratos.tsx`.
- Modelo contrato: `backend/prisma/schema.prisma` (`Contrato`).

## Actualización implementada (misma fecha, iteración de entrega)

- **Alta de contrato (`POST /contratos`):** transacción que persiste `razonSocial` / `regimenFiscal`, crea `Persona` + `RolPersonaContrato` (PROPIETARIO) salvo `omitirRegistroPersonaTitular`, y según flags genera orden `InstalacionToma` o `InstalacionMedidor` con estados **Pendiente de toma** / **Pendiente de zona** (la toma tiene prioridad sobre medidor).
- **Actualización (`PATCH /contratos/:id`):** acepta `zonaId` / `rutaId` y demás campos P1; si tras el merge hay zona y ruta y el estado previo es uno de los pendientes acordados, pasa a **Activo** (sin pisar un `estado` explícito en el body).
- **`getFlujoCompleto`:** incluye órdenes recientes, trámites y procesos de contratación con hitos (y plantilla resumida).
- **Preview de texto:** `GET /contratos/:id/texto-contrato` — plantilla del proceso vigente o, en su defecto, cláusulas del tipo de contratación; sustitución básica `{{nombre}}`, `{{rfc}}`, `{{direccion}}`, `{{contacto}}`, `{{razonSocial}}`, `{{regimenFiscal}}`, `{{fecha}}`.
- **Catálogos HTTP:** `GET /catalogos/actividades`, `grupos-actividad`, `categorias`, `tipos-relacion-ps` (alineados con `frontend/src/api/catalogos.ts`).
- **Duplicidad orden medidor:** la orden de medidor por etapa de proceso fue retirada en favor del flujo por órdenes de campo; en `OrdenesService` se evita duplicar `InstalacionMedidor` pendiente/en proceso.
- **Frontend:** wizard con opciones fiscales y de órdenes; `StatusBadge` y búsqueda en atención reconocen **Pendiente de toma** / **Pendiente de zona**; KPI “Pendientes en campo”.
- **UI posterior:** pestaña **Texto contrato** en el detalle del contrato (`Contratos.tsx`) que consume `GET /contratos/:id/texto-contrato`; asistente de alta con selects opcionales de **tipo de contratación** (catálogo) y **punto de servicio** (`GET /puntos-servicio`, `GET /tipos-contratacion`).

### Contrato + proceso en el mismo alta (revisión 2026-04-09, iteración posterior)

- **`POST /contratos`** puede devolver el contrato con el campo adicional **`procesoGestionadoEnAlta`** (`true` si en esa petición se creó o actualizó un `ProcesoContratacion` por checklist de `documentosRecibidos`).
- **`plantillaContratacionId`** en el body solo tiene efecto si `documentosRecibidos` trae al menos un ítem; si no, la API responde **400** (evita plantilla “huérfana” en el payload).
- El cliente (wizard) exige **plantilla** cuando están activos “iniciar proceso” y al menos un documento en checklist, para no dejar un proceso sin plantilla al omitir el segundo `POST` a procesos.
- El hito inicial “solicitud completada” al abrir proceso se centraliza en `crearHitoInicialSolicitudCompletado` (`hito-inicial.util.ts`), reutilizado por alta de contrato y por `POST /procesos-contratacion`.
