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
| 1. Punto de servicio | Implementado | `PasoServicioPoint` + `puntoServicioId` en `POST /contratos` (`WizardContratacion` / `buildCreateContratoDto`). |
| 2. Persona propietaria | Parcial | Wizard `PasoPersonas`; `POST /contratos` crea `Persona` + `RolPersonaContrato` (PROPIETARIO) salvo `omitirRegistroPersonaTitular`. |
| 3. Persona fiscal | Implementado | `personaFiscal` en wizard y DTO; alta hace upsert de rol FISCAL cuando aplica (`contratos.service.ts`). |
| 3.1 Contacto opcional | Implementado | `personaContacto` opcional en wizard y DTO; rol CONTACTO en alta cuando hay datos suficientes. |
| 3.2 Contrato padre | Implementado | `referenciaContratoAnterior` en `PasoConfigContrato` (obligatorio si el tipo catalogado es individualización/condominio). |
| 4. Actividad | Implementado | Selector en `PasoConfigContrato` + `actividadId` en alta. |
| 5. Tipo de contratación | Implementado | Catálogo por administración en `PasoConfigContrato`; `tipoContratacionId` en alta (además de `tipoContrato` / `tipoServicio` como strings operativos). |
| 5.1 Clase de contratación | Implementado | Valor fijo **Alta nueva** (código `AN`); se envía como `tipoContrato` en el alta; en UI es solo lectura en `PasoConfigContrato` (sin catálogo desplegable). |
| 6. Superficie, unidades, personas | Implementado | Campos opcionales en `PasoConfigContrato` y envío en `CreateContratoDto` (`superficiePredio`, `superficieConstruida`, `unidadesServidas`, `personasHabitanVivienda`). |
| 7. Documentos recibidos | Implementado | Checklist desde `GET /tipos-contratacion/:id/configuracion` (`documentos`); validación de obligatorios en `POST /contratos`. |
| 8. Factura contratación timbrada + convenio | Implementado (flag) | `POST /contratos/:id/factura-contratacion` genera `Timbrado` sin consumo + `CostoContrato` con conceptos del tipo; controlado por `FEATURE_FACTURACION_CONTRATACION`. Checkbox en wizard. |
| 9. Orden instalación toma | Implementado | Paso **Órdenes** del wizard (`PasoOrdenes`); flag `generarOrdenInstalacionToma` en `POST /contratos` crea orden de instalación de toma. |
| 10. Orden instalación medidor | Implementado | Flag `generarOrdenInstalacionMedidor` (excluyente con toma en UI); creación en alta y **auto** al ejecutar toma (`OrdenesService.updateEstado`). |
| 11. Estados pendiente toma / pendiente zona | Implementado | En `contratos.service.ts` (alta): si `generarOrdenInstalacionToma` → `estado` **Pendiente de toma**; si solo medidor → **Pendiente de zona**; si no hay órdenes en el alta, el body puede enviar `Pendiente de alta` y el backend lo respeta. El wizard documenta el estado previsto en `PasoOrdenes`. |
| 12. Imprimir contrato (titular) | Implementado | `GET /contratos/:id/contrato-pdf` devuelve HTML imprimible (usa snapshot o preview); botón "Imprimir / PDF" en tab Texto contrato. |
| 13. Asignar zona + código recorrido → Alta | Parcial | `zonaId`, `rutaId` en `Contrato`; asignación manual. **No** hay regla automática “al asignar ruta → estado Activo”. |
| Al atender orden toma → auto orden medidor + pendiente zona | Parcial | Auto orden medidor: **sí** en `ordenes.service.ts`. Cambio de estado contrato a “pendiente de zona”: **no** en el mismo flujo. |
| Reimprimir con mismas cláusulas contratadas | Implementado | `Contrato.textoContratoSnapshot` almacena el texto al momento del alta; `GET /contratos/:id/contrato-pdf` lo usa si existe, garantizando reimpresión fiel. |

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
- Asistente de alta: `frontend/src/components/contratacion/WizardContratacion.tsx` (desde detalle / flujo de contratos en UI).
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

### Facturación, PDF e impresión de contrato (2026-04-10)

- **`Contrato.textoContratoSnapshot`** (campo `Text?`): se captura automáticamente al crear el contrato, resolviendo el snapshot de cláusulas para reimpresión fiel.
- **`GET /contratos/:id/contrato-pdf`**: devuelve HTML print-ready con el texto del snapshot (o preview si no hay snapshot). El frontend abre en nueva pestaña para imprimir/guardar PDF vía navegador. **Orden del impreso (alineado al formato CEA):** línea «Número de contrato»; párrafo inicial de partes (plantilla); bloque **Datos de instalación** (dirección de servicio, diámetro de la toma en mm, fila Tipo de usuario / Giro, fila Uso / Gasto / Unidades); a continuación la transición «El presente Contrato…», el título **CLÁUSULAS** centrado y el cuerpo de cláusulas (`wrapTextoHtml` + `buildDatosInstalacionHtml` en `contratos.service.ts`).
- **`POST /contratos/:id/factura-contratacion`**: genera `Timbrado` (estado Pendiente, sin consumo) + registros `CostoContrato` con los conceptos de cobro del tipo de contratación. Controlado por `FEATURE_FACTURACION_CONTRATACION=true`.
- **Wizard**: checkbox "Generar factura de contratación al crear el contrato" en el paso **Facturación** (`PasoFacturacion.tsx`, visible solo con `VITE_FEATURE_FACTURACION_CONTRATACION=true`); por defecto marcado; envía `generarFacturaContratacion` en el POST de alta cuando aplica.
- **Tab Facturación** en detalle: botón "Facturar contratación" (visible solo con flag) para generar la factura post-alta.
- **Tab Texto contrato** en detalle: botón "Imprimir / PDF" que abre el endpoint HTML en nueva pestaña.
- **Feature flag**: `FEATURE_FACTURACION_CONTRATACION` (backend) / `VITE_FEATURE_FACTURACION_CONTRATACION` (frontend), default `false`.

### Documentación del sistema anterior en el repo (2026-04-16)

Para alinear la matriz anterior con implementación y PDF de contrato, usar el índice `docs/contratacion-indice-documentacion-sistema-anterior.md` (rutas bajo `_DocumentacIon_Interna_Sistema_Anterior/`, consultas SQL legado y formatos PDF de contratación).

### Matriz principal — revisión 2026-04-16 (código actual)

Se actualizaron las filas **1–11** de la tabla “Matriz paso → implementación” para reflejar el wizard (`WizardContratacion`, pasos bajo `frontend/src/components/contratacion/steps/`) y el comportamiento de `POST /contratos` en `backend/src/modules/contratos/contratos.service.ts` (estado inicial según flags de órdenes, checklist de documentos, campos de predio opcionales).

**2026-04-16 (visibilidad en listado):** si el alta envía `distritoId` en `variablesCapturadas`, el servicio de contratos **rellena `zonaId`** desde el distrito cuando no vino en el DTO. En la pantalla `Contratos`, si hay filtro por zonas del contexto, los contratos **Pendiente de alta** sin `zonaId` siguen listándose para no “perder” altas recientes hasta asignar zona/ruta.

**2026-04-16 (reanudar registro y columna “Estado (flujo)”):** la columna de flujo ya no muestra “Pago pendiente” para el estado persistido **Pendiente de alta** (solo para estados ligados a pago). En listado y ficha, contratos **Pendiente de alta** tienen acción **Continuar contratación** (y **Editar** reanuda el mismo asistente): se localiza el `ProcesoContratacion` abierto del contrato, se abre el wizard con `?new=1&procesoId=…`, y si no hubiera proceso se intenta `POST /procesos-contratacion`.

**2026-04-19 (wizard de alta):** el asistente tiene **8 pasos**; la revisión final y la acción **Crear Contrato** ocurren en el paso **Resumen** (`PasoResumen.tsx` + pie de `WizardContratacion.tsx`). Se eliminó el paso separado “Confirmación”.
