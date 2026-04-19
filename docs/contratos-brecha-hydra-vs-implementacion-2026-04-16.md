# Brecha Hydra vs implementación actual — contratos y alta

**Fecha:** 2026-04-16  
**Objetivo:** documentar **todo lo faltante** respecto a referencias del sistema anterior (Hydra), priorizar **qué se puede cerrar con ingeniería** y qué exige **decisión de negocio / fiscal**, y dar un **plan de iteración** revisable en backlog.

**Referencias externas analizadas (texto extraído):**

- `…/Hydra/Contratacion/contrato_reimpresion_texto.txt` — contrato solo (reimpresión).
- `…/Hydra/Contratacion/proceso_contratacion_alta_texto.txt` — **paquete de alta**: primera parte ≈ **CFDI / factura de contratación** (conceptos, subtotal, IVA, total, método PPD, sellos), luego **mismo cuerpo contractual** que reimpresión.

**Referencias en repo (legado empaquetado):** `docs/contratacion-indice-documentacion-sistema-anterior.md` (`_DocumentacIon_Interna_Sistema_Anterior/.../Formatos/`).

**Documento hermano (pendientes ya inventariados):** `docs/pendientes-flujo-contratacion-y-plan.md` (IDs **F-01** … **F-07**). Este archivo **no sustituye** ese índice: **cruza** Hydra explícito ↔ código ↔ F-xx.

---

## 1. Qué modela Hydra (resumen normativo de layout)

### 1.1 `proceso_contratacion_alta` (alta completa)

Orden lógico observado en el TXT:

1. **Hoja fiscal (CFDI)**  
   Emisor/receptor, régimen, folio/contrato en leyenda, domicilio fiscal/toma, tabla de **conceptos** (clave, descripción, cantidad, valor unitario, importe, IVA), **subtotal / IVA / total**, **método de pago** (ej. PPD — pago en parcialidades), **forma de pago**, bloques de **sello digital** / cadena original (comprobante timbrado o listo para timbre).

2. **Contrato legal**  
   Título largo tipo *“CONTRATO DE PRESTACIÓN DE SERVICIOS INTEGRALES… celebran LA COMISIÓN… y EL USUARIO…”* con **domicilios completos** de ambas partes (no solo nombre).

3. **Bloque “Datos de instalación”** (antes de “CLÁUSULAS”)  
   - Dirección de servicio (domicilio completo).  
   - Diámetro de la toma.  
   - Tipo de usuario / giro / uso / gasto (unidades).

4. **CLÁUSULAS**  
   Texto jurídico numerado (PRIMERA, SEGUNDA, … hasta VIGÉSIMA NOVENA u otras según plantilla).

5. **Firmas** (en reimpresión/alta Hydra el PDF incluye área de firmas; el TXT corta en páginas).

6. En **reimpresión** (`contrato_reimpresion_texto.txt`) la estructura es la misma **parte contractual** (puntos 2–5), **sin** la hoja CFDI delante.

### 1.2 Implicación para producto

Hydra entrega al usuario un **documento compuesto** en alta: **factura timbrada (o representación impresa) + contrato**. El sistema actual separa: HTML de contrato por endpoint y factura/timbrado en flujo distinto (ver §3).

---

## 2. Estado actual en *contract-to-cash-flow*

| Área | Comportamiento hoy |
|------|-------------------|
| **Alta UI** | Wizard modal (`Contratos.tsx` + `WizardContratacion`): pasos punto de servicio, personas, configuración, variables, documentos, facturación, órdenes, resumen, confirmación. |
| **Precarga** | `?procesoId=` + `fetchProceso` (no selector nativo “solicitud de servicio”; puede enlazarse vía proceso). |
| **Texto contractual** | Plantilla de proceso o, si no hay, **todas** las cláusulas del tipo concatenadas; snapshot al crear (`buildTextoSnapshot` / `textoContratoSnapshot`). |
| **Impresión “PDF”** | `GET /contratos/:id/contrato-pdf` devuelve **HTML** imprimible (`wrapTextoHtml`): cabecera corta CEA, número, **nombre + fecha**, **cuerpo** (plantilla/cláusulas interpoladas), firmas, **segunda copia** etiquetada “Copia”. |
| **Factura contratación** | Tras alta (feature): `crearFacturaContratacionTx` crea líneas y `Timbrado` con estado **`Pendiente`** — **no** equivale a CFDI timbrado con sellos como en Hydra. |
| **Datos de instalación en carátula** | **No** están en `wrapTextoHtml`; solo `nombre`, `fecha`, `numero` y `body` genérico. |
| **Introducción “que celebran…” con domicilios** | **No** replicada en el wrapper; dependería de plantilla/cláusulas o de ampliar plantilla base. |
| **Convenio anticipo + facturas periódicas** | **No** en alta. |
| **Paquete único descargable** | **No** (contrato HTML ≠ PDF binario ≠ PDF+CFDI unidos). |

---

## 3. Matriz de brechas (ID nuevos ↔ acción ↔ F-xx)

| ID | Tema | Hydra / requisito | Hoy | Acción sugerida | Dep. | Cruce F-xx |
|----|------|-------------------|-----|-----------------|------|------------|
| **H-01** | Paquete **CFDI + contrato** en un solo entregable | `proceso_contratacion_alta` | Solo HTML contrato; factura aparte | Opciones: (a) vista “Descargar paquete” que fusione representación CFDI + HTML contrato en un solo PDF vía librería servidor; (b) ZIP con XML+PDF; (c) solo UX con dos enlaces claros “Factura” / “Contrato”. | Fiscal + stack PDF | F-01 |
| **H-02** | **CFDI timbrado** con sellos y leyenda fiscal | TXT muestra sellos, cadena, totales | `Timbrado` `Pendiente` sin flujo PAC descrito en este repo | Integrar módulo timbrado (existente o futuro) y disparo **post**-alta o síncrono según SLA; actualizar estados. | PAC / proveedor | F-01 + matriz validación |
| **H-03** | Bloque **“Datos de instalación”** antes de cláusulas | Hydra | **Hecho** en `getContratoPdf` / `wrapTextoHtml` (domicilio suministro, diámetro toma/calibre, fecha conexión, tipo, actividad, unidades, RFC). | Afinar etiquetas vs TXT Hydra si negocio lo pide. | Bajo | F-01 |
| **H-04** | **Encabezado contractual completo** (domicilios LA COMISIÓN / EL USUARIO) | Hydra | **Parcial:** párrafo intro “partes” + domicilio titular (INEGI o `direccion`); sin dirección fiscal parametrizable de la CEA. | Plantilla en BD o config `{{direccionComision}}` + interpolación completa. | Medio | F-01 |
| **H-05** | **PDF binario** oficial vs HTML | PDFs en `Formatos/` | HTML “print to PDF” | Definir si el entregable oficial es **PDF generado** (puppeteer/pdfkit) o HTML aceptado; alinear con negocio. | Decisión | F-01 |
| **H-06** | **Reimpresión** = mismo contrato sin CFDI | `contrato_reimpresion` | Mismo endpoint; no distingue “solo contrato” | Query `?modo=reimpresion` o endpoint `…/contrato-pdf` vs `…/proceso-alta-pdf` que omita hoja fiscal. | Bajo | F-01 |
| **H-07** | Vincular **solicitud de servicio** explícita | Negocio | Solo `procesoId` | UI: buscar solicitud → crear/abrir proceso → precargar wizard; API si falta `solicitudId` en proceso. | Medio | F-04 / matriz |
| **H-08** | Fecha instalación toma desde **orden** | Hydra implícito en operación | Solo captura manual si “conexión existe” | Leer orden de instalación completada y volcar fecha en contrato/variables. | Órdenes + reglas | F-04 |
| **H-09** | Cuantificación desde **inspección / otro módulo** | Negocio | Solo preview por tipo | API: adjuntar snapshot de cuantificación o `conceptosOverride` desde inspección; UI enlace. | Inspección | F-03, F-04 |
| **H-10** | **Convenio** anticipo + resto en periódicas | Negocio | No | Modelo de pagos + reglas de facturación recurrente (ver doc Word legado). | Producto + BD | F-02 |
| **H-11** | Paridad visual **logo / márgenes / tipografía** | PDFs Formatos/ | CSS genérico | Diff visual + assets. | Diseño | F-01 |
| **H-12** | Cláusulas **condicionales** por tipo | “Luego condiciones…” (mensaje previo) | Todas las del tipo si no hay plantilla | Motor reglas + orden; no mezclar con “incluir todas” hasta definir reglas. | Producto | Matriz § cláusulas |

---

## 4. Qué podemos hacer **ya** (sin bloqueo externo)

Orden sugerido por **costo / valor**:

1. **H-03** — ~~Insertar bloque “Datos de instalación”~~ **Implementado** en `getContratoPdf` / `wrapTextoHtml` (relaciones `domicilio`, `puntoServicio`, `actividad`; `variablesCapturadas` y catálogo calibre). *Validación pendiente:* cotejo línea a línea con TXT Hydra.

2. **H-04** (MVP) — **Parcial:** intro de partes en HTML de impresión; pendiente parametrizar `{{direccionComision}}` / plantilla y ampliar `mergeTemplateInterpolationVars` en snapshot si se desea misma interpolación que Hydra.

3. **H-04 bis — Plantilla Hydra + 31 cláusulas reales**: seed `prisma/seed.ts` ahora carga:
   - `PlantillaContrato` ID `PLANTILLA_HYDRA_CEA_V1` con cuerpo completo (intro con `{{variables}}` + 31 cláusulas), formato idéntico a reimpresión Hydra.
   - 31 registros `ClausulaContractual` (prefijo `HYDRA_01_…` a `HYDRA_31_…`), 20 con texto real del escaneo OCR y 11 con placeholder (cláusulas 16-26 no legibles en el escaneo — completar manualmente).
   - Vinculación `ClausulaTipoContratacion` de **cada** cláusula a los 5 tipos existentes (`DOM_HAB`, `COM`, `IND`, `GOB`, `MIXTO`), con orden correcto.

4. **H-06** — Parámetro o segundo endpoint para **reimpresión** sin intentar anexar factura (claridad operativa).

4. **H-07** (MVP UI) — En modal de alta: campo “ID solicitud” o buscador que resuelva a `procesoId` / cree proceso (si API lo permite), además de deep link `?procesoId=`.

5. Documentar en UI que **“PDF”** hoy es **imprimir desde navegador** (evita expectativa de archivo .pdf timbrado).

---

## 5. Qué requiere **decisión o dependencia** antes de codificar

| ID | Por qué |
|----|--------|
| H-01, H-02, H-05 | Arquitectura fiscal (PAC, XML, representación impresa, quién genera el PDF único). |
| H-09 | Contrato con módulo de inspección/cuantificación (dueño del dato). |
| H-10 | Reglas de cobro y contabilidad de anticipos. |
| H-12 | Catálogo de reglas legales por tipo de contratación. |

---

## 6. Plan de iteración (propuesta de sprints cortos)

| Sprint | Entregable | IDs | Verificación |
|--------|------------|-----|--------------|
| **S1** | Bloque datos de instalación + ampliación mínima de variables en PDF HTML | H-03, parte H-04 | Impresión lado a lado con `contrato_reimpresion_texto` § datos instalación |
| **S2** | Modo reimpresión + copy UX “imprimir / guardar como PDF” | H-06 | QA manual |
| **S3** | Búsqueda vinculación solicitud → proceso → wizard | H-07 | E2E o smoke con API |
| **S4** | Fecha toma desde orden cerrada | H-08 | Contrato con orden en BD de prueba |
| **S5** | Integración timbrado real + estado ≠ solo Pendiente | H-02 | Ambiente PAC de prueba |
| **S6** | Paquete único o ZIP (CFDI + contrato) | H-01 | Aprobación negocio + H-05 |

*(Los sprints S5–S6 pueden invertirse según prioridad fiscal.)*

---

## 7. Criterios de aceptación globales (para cerrar el “tema Hydra”)

- [ ] Un operador puede **imprimir** un contrato que incluya **datos de instalación** alineados al legado (contenido mínimo acordado).
- [ ] Queda claro en producto si **alta** debe generar **un solo archivo** o **dos** (CFDI + contrato); el comportamiento implementado coincide con la decisión.
- [ ] **Timbrado**: el estado del comprobante refleja el flujo real (p. ej. pendiente vs timbrado vs error), documentado.
- [ ] **Reimpresión** no mezcla hoja fiscal si el producto define que no debe.
- [ ] Matriz `docs/validacion-flujo-contratacion-2026-04-09.md` actualizada cuando cierre cada H-xx mayor.

---

## 8. Archivos de código tocados cuando se implemente (referencia rápida)

- `backend/src/modules/contratos/contratos.service.ts` — `getContratoPdf`, `wrapTextoHtml`, `mergeTemplateInterpolationVars`, `buildTextoSnapshot`.
- `frontend/src/pages/Contratos.tsx`, `frontend/src/components/contratacion/*` — UX vinculación, textos de ayuda.
- Posible nuevo servicio de **composición de documentos** si H-01 se resuelve sin inflar `ContratosService`.

---

## 9. Nota sobre archivos `.pdf` / `.docx` en Descargas

Los binarios bajo `c:\Users\mitza\Downloads\HumanSoftware\Hydra\...` no están versionados en el repo; este análisis se basó en los **`.txt`** exportados (misma carpeta `Contratacion/`). Para revisiones legales finas, mantener los **PDF oficiales** como fuente de verdad visual y actualizar la §7 cuando negocio firme paridad.

---

*Fin del documento — listo para tickets en backlog (copiar IDs H-xx a issues).*
