# Pendientes — alta de contrato (wizard + API)

**Última regeneración:** 2026-04-16  
**Alcance:** solo el **flujo de alta de contrato** (asistente en UI, `POST /contratos`, datos que persisten y efectos colaterales: órdenes, proceso, factura de contratación, PDF). No incluye módulos ajenos salvo cuando el alta debe enlazarlos.

**Documentos relacionados:** `docs/validacion-flujo-contratacion-2026-04-09.md` (matriz; varias filas tienen **actualizaciones posteriores** en el mismo archivo — contrastar siempre con la sección “Actualización implementada”), `docs/contratacion-indice-documentacion-sistema-anterior.md` (legado Hydra / PDFs / SQL), `docs/contratos-brecha-hydra-vs-implementacion-2026-04-16.md` (extractos Hydra TXT vs implementación; brechas **H-01…H-12** y plan de iteración).

---

## 1. Tabla rápida (¿qué falta?)

| ID | Tema | Estado | Bloqueo principal |
|----|------|--------|-------------------|
| **F-01** | PDF / maquetación vs formato institucional | Pendiente | Ajuste HTML/CSS + revisión visual frente a PDFs en `_DocumentacIon_Interna_Sistema_Anterior/.../Formatos/` |
| **F-02** | Convenio de pagos / anticipo (negocio) | Pendiente | Decisión de producto + diseño de BD/API si no es solo documento |
| **F-03** | Cuantificación del costo en el wizard | **Cerrado (guía UX)** | Paso renombrado a **Cuantificación**; tabla vía `preview-facturacion` + texto guía alineado al presupuesto legado (`CUANTIFICACION CONTRATACION.PDF`). Convenios/anticipo financiero siguen en **F-02**. |
| **F-04** | Inspección (factibilidad / obra / toma) encadenada al alta | Pendiente | Reglas SIGE + UI de hitos en `ProcesoContratacion` |
| **F-05** | Campos de contrato en modelo pero débiles o ausentes en wizard | Parcial | Superficies / unidades / personas ya en wizard (`PasoConfigContrato`); contrato padre y fiscal/contacto ya en flujo. Queda acotar con negocio (p. ej. `mesesAdeudo`, reglas SIGE adicionales). |
| **F-06** | Documentación de estados y una sola “fuente de verdad” | Parcial | Matriz § pasos 1–11 y notas de `POST /contratos` actualizadas (2026-04-16) frente a `contratos.service.ts`. Opcional: diagrama único + inventario desde seed. |
| **F-07** | QA formal + matriz al día | Recurrente | Ejecutar smoke y seguir actualizando la matriz cuando cambie el alta; filas 1–11 revisadas en esta iteración. |

**Cerrado (no repetir):** catálogo estático `frontend/src/config/tipos-contratacion.ts` eliminado (P-LIM). Gaps G1–G6 del scout 2026-04-16 (API de tipos/administraciones, documentos desde `config`, variables dinámicas, interpolación, resumen/billing) **implementados** — ver `.cursor/plans/workflow_state.md` y código en `frontend/src/components/contratacion/`, `backend/src/modules/contratos/contratos.service.ts`.

---

## 2. Ya cubierto en código (alta) — resumen para no duplicar trabajo

- **Tipo de contratación:** `tipoContratacionId` real (cuid) vía API; administraciones vía API (`PasoConfigContrato`, etc.).
- **Actividad:** selector en wizard + `actividadNombre` para resumen (`PasoConfigContrato`, `PasoResumen`).
- **Punto de servicio:** paso `PasoServicioPoint` + envío en DTO de alta (`puntoServicioId` / código en estado del wizard).
- **Variables:** paso dinámico desde `GET /tipos-contratacion/:id/configuracion`, obligatorias, tests en `frontend/src/lib/wizard-variables.test.ts`.
- **Documentos:** lista desde `config.documentos` con fallback.
- **Texto / snapshot:** interpolación incluye `variablesCapturadas`; snapshot al crear; `GET /contratos/:id/contrato-pdf` con `wrapTextoHtml` (cabecera, número, cuerpo, firmas, segunda copia).
- **Factura de contratación:** flag backend/frontend + checkbox en paso facturación + POST asociado (ver matriz § actualización 2026-04-10).
- **Persona titular:** `POST /contratos` puede crear `Persona` + `RolPersonaContrato` (PROPIETARIO) salvo `omitirRegistroPersonaTitular` — revisar si la matriz aún dice “sin crear persona” como bloque absoluto.

---

## 3. Faltantes detallados y pasos para cerrarlos

### F-01 — PDF / formato impreso (ex G7)

**Situación:** `wrapTextoHtml` en `backend/src/modules/contratos/contratos.service.ts` genera HTML imprimible; falta **paridad** con formatos oficiales del legado.

**Evidencia en repo:** `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Formatos/*.pdf` (individual, condominal, contacto/notificaciones, reimpresión, proceso de alta).

**Pasos:**

1. Comparar lado a lado PDF de referencia vs salida de `GET /contratos/:id/contrato-pdf` (contrato de prueba).
2. Anotar brechas: logo, tablas de datos, tipografía, márgenes, orden de secciones.
3. Implementar cambios solo en plantilla HTML/CSS del servicio (y assets si se acuerda URL o archivo estático versionado).
4. Revalidar impresión y segunda copia.
5. Criterio de cierre: aprobación negocio de “paridad esencial” + actualizar esta tabla (marcar F-01 hecho).

---

### F-02 — Convenio de pagos / anticipo

**Situación:** el checklist puede incluir documento tipo convenio; **no** hay flujo de captura de esquema de pagos / anticipo ligado a `Convenio` o entidades financieras en el alta.

**Pasos:**

1. Leer `Procesos de facturación contratación CEA.docx` y `Interfaces/.../DIF. FORMAS DE PAGO.xlsx` (índice en doc sistema anterior) para acotar alcance “documental vs financiero”.
2. Definir MVP (solo adjunto / checklist vs montos y plazos persistidos).
3. Si hay persistencia: extender `CreateContratoDto` + servicio + UI (paso facturación o confirmación).
4. Pruebas de regresión del `POST /contratos`.

---

### F-03 — Cuantificación en el wizard

**Situación (2026-04-18):** el motor `POST /contratos/preview-facturacion` ya alimentaba el paso del wizard; faltaba **nombrar** el paso como en SIGE y dar **guía** al operador según el presupuesto legado.

**Evidencia:** `CUANTIFICACION CONTRATACION.PDF` (presupuesto con desglose de conceptos).

**Implementado:**

1. Paso del stepper y pantalla: etiqueta **Cuantificación** / título “Cuantificación del costo de contratación”.
2. Panel “Guía operativa” (`PasoFacturacion.tsx`): qué incluye la tabla, relación con costos del alta y factura opcional; alcance fuera del paso (convenios → F-02).
3. Resumen y confirmación: etiquetas coherentes (“Cuantificación”, total estimado).

**Pendiente fuera de F-03:** captura de convenio de pagos / anticipo como producto financiero (**F-02**), si aplica.

---

### F-04 — Inspección encadenada al alta

**Situación:** modelos de territorio/obra existen; el wizard **no** crea ni propone hitos de inspección al crear el contrato.

**Pasos:**

1. Cruzar `Flujo de la contratación.docx` / `Mapeo Proceso de Contratación.pdf` con etapas actuales de `ProcesoContratacion`.
2. Definir reglas “cuándo aplica inspección” por tipo o actividad.
3. Backend: efectos en `POST /contratos` o servicio de proceso; Frontend: checklist o paso opcional.
4. Pruebas con tipo que requiera y tipo que no requiera inspección.

---

### F-05 — Campos y roles aún débiles en el alta

**Situación (revisar prioridad con negocio):**

| Tema | Notas |
|------|--------|
| Superficie, unidades, personas | Captura opcional en `PasoConfigContrato` y envío en `CreateContratoDto`; precarga desde `GET /procesos-contratacion/:id` cuando el contrato incluye esos campos. |
| Contrato padre | `referenciaContratoAnterior` en API y en wizard (obligatorio si el tipo es individualización). |
| Rol FISCAL / CONTACTO | Wizard con `personaFiscal` / `personaContacto`; alta crea roles cuando hay datos válidos. Revisar con negocio casos límite (solo titular, etc.). |
| Orden “solo toma” desde wizard | Flags de órdenes en alta existen; revisar si falta UX para “solo orden toma” vs medidor según catálogo. |

**Pasos genéricos:** (1) criterio de negocio, (2) campos en DTO + validación, (3) UI en paso existente o nuevo, (4) prueba e2e/manual, (5) fila en matriz actualizada.

---

### F-06 — Estados y fuente de verdad

**Situación:** la matriz (fila 11) aún describe “Pendiente de alta” como único estado inicial; las **actualizaciones** del mismo doc indican transiciones a **Pendiente de toma / Pendiente de zona** y paso a **Activo** con zona+ruta en `PATCH`. Riesgo: desalinear documentación interna, onboarding y QA.

**Pasos:**

1. Inventariar valores reales de `Contrato.estado` en código y en seed.
2. Unificar narrativa en `docs/validacion-flujo-contratacion-2026-04-09.md` y, si aplica, un diagrama breve aquí o en doc de arquitectura.
3. Asegurar que badges y filtros en UI usan los mismos literales.

---

### F-07 — QA y matriz viva

**Pasos:**

1. Smoke: administración → tipo → variables → documentos → servicio/punto → cuantificación → resumen → confirmación → PDF → (opcional) factura de contratación con flag.
2. Por cada hallazgo, o bien se corrige código o se corrige la matriz si el comportamiento es el acordado.
3. Mantener este archivo como lista maestra de “faltante alta”; la matriz como trazabilidad SIGE global.

---

## 4. Orden sugerido de trabajo

1. **F-07** (smoke + corregir matriz donde esté desfasada respecto al código).  
2. **F-01** (mayor visibilidad hacia usuario final).  
3. **F-02** (convenio/anticipo; lectura PDF/Word de negocio). **F-03** cerrado en UI (paso Cuantificación + guía).  
4. **F-04** + **F-05** (mayor acoplamiento a SIGE).  
5. **F-06** (documentación, puede hacerse en paralelo desde el inventario de estados).

---

## 5. Comandos de verificación

```bash
cd backend && npm run build && npm run lint
cd frontend && npm run build && npm run lint && npm run test
```

---

## 6. Criterios de cierre por ID

| ID | Hecho cuando |
|----|----------------|
| F-01 | Negocio aprueba paridad visual mínima frente a PDFs de `Formatos/`. |
| F-02 | Comportamiento definido y verificable (UI y/o API) + pruebas. |
| F-03 | Criterios de cuantificación reflejados en UI o enlace explícito desde el alta. |
| F-04 | Reglas de inspección aplicadas o explícitamente fuera de alcance con doc. |
| F-05 | Cada sub-ítem priorizado queda implementado o “N/A” documentado. |
| F-06 | Estados y transiciones descritos en docs alineados con código. |
| F-07 | Smoke ejecutado y matriz revisada en las filas tocadas por el alta. |

---

## 7. Referencias

- `docs/contratacion-indice-documentacion-sistema-anterior.md` — rutas legado, SQL, PDFs.  
- `docs/validacion-flujo-contratacion-2026-04-09.md` — matriz 1–13 + actualizaciones.  
- `.cursor/plans/scout-2026-04-16-gaps-registro-contratos.md` — análisis técnico G1–G7.  
- `.cursor/plans/workflow_state.md` — bitácora de implementación.

Al cerrar un **F-xx**, actualizar la tabla del §1 y el §6 en el mismo cambio para que este archivo siga siendo la referencia única de pendientes del **alta de contrato**.
