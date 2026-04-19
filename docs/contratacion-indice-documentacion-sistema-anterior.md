# Índice — documentación interna del sistema anterior (Hydra / legado)

**Ubicación en el repo:** `_DocumentacIon_Interna_Sistema_Anterior/`  
**Objetivo:** centralizar rutas y significado de los archivos útiles para **cerrar brechas** del flujo de contratación en *contract-to-cash-flow* (matriz de validación, PDF, catálogos, cuantificación, convenios/pagos).

> Nota: varios nombres de archivo muestran caracteres corruptos en consola Windows (`catlogos.txt`); la carpeta real contiene `catalogos.txt` (con acento). Usar el Explorador de archivos o `Get-ChildItem -LiteralPath` si un script falla al abrir por nombre.

---

## 1. Gestión de servicio — Contratos

Ruta base: `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/`

### 1.1 Flujo y proceso (negocio / SIGE)

| Recurso | Formato | Uso sugerido |
|---------|---------|--------------|
| `Flujo de la contratación.docx` | Word | Pasos operativos deseados; contrastar con `docs/validacion-flujo-contratacion-2026-04-09.md`. |
| `Mapeo Proceso de Contratación.pdf` | PDF | Diagrama / roles; alinear con `ProcesoContratacion` y etapas en backend. |
| `Procesos de facturación contratación CEA.docx` | Word | Reglas de facturación en contratación; relacionar con `POST /contratos/:id/factura-contratacion` y flags. |
| `CUANTIFICACION CONTRATACION.PDF` | PDF | Criterios de cuantificación; cubre brecha “Cuantificación del costo” de la matriz (guía de negocio, no código). |

### 1.2 Entidades de dominio (documentación por módulo legado)

| Archivo | Contenido típico |
|---------|------------------|
| `1. Punto de servicio.docx` | Reglas del punto de servicio en el sistema anterior. |
| `2. Domicilio.docx` | Domicilio / territorio. |
| `3. Persona.docx` | Personas y roles. |
| `4. Contrato.docx` | Contrato en legado. |

### 1.3 Catálogos y datos de referencia (Excel / texto)

| Archivo | Uso sugerido |
|---------|--------------|
| `Catálogos del contrato.xlsx` | Cruce con `TipoContratacion`, documentos, variables en Prisma/seed. |
| `Catálogos_tipo_contratacion.xlsx` | Tipos por administración / parámetros; validar `GET /tipos-contratacion` y seeds. |
| `catálogos de punto de servicio.xlsx` | Tipos de PS; validar wizard vs `PuntoServicio`. |
| `Catálogos de domicilio.xlsx` | INEGI / domicilio si aplica al alta. |
| `catálogos.txt` (nombre con acento) | Consultas SQL sueltas: `tipoesttec`, `tipoptosrv`, `tiposumin`, distritos desde `ptoserv`, geografías, `catecontra`, `tipocontador`, etc. Útil para **migración de catálogos** o comprobación de cobertura. |
| `consultas_tipos_contratacion.txt` | **Consultas canónicas** del legado para tipo de contratación (ver §2). |

### 1.4 Formatos de contrato (P-G7 — referencia visual / legal)

Carpeta: `.../Contratos/Formatos/`

| Archivo | Uso sugerido |
|---------|--------------|
| `Formato Contrato Individual Provisional.pdf` | Referencia de maquetación para `wrapTextoHtml` / PDF (titular individual). |
| `Formato Condominal Provisional.pdf` | Variante condominio / múltiples titulares (si el producto la distingue). |
| `Formato Contrato Alc y San_contacto_notificaciones.pdf` | Cláusulas de contacto / notificaciones. |
| `proceso_contratacion_alta.pdf` / `.docx` | Flujo de alta y formato asociado. |
| `contrato_reimpresion.pdf` / `.docx` | Reimpresión; alinear con `textoContratoSnapshot` y `GET /contratos/:id/contrato-pdf`. |

**Implementación:** el backend ya genera HTML con cabecera, número de contrato, cuerpo, firmas y segunda copia (`wrapTextoHtml` en `contratos.service.ts`). El siguiente paso de ingeniería es **diff visual** frente a estos PDF (no automatizable aquí sin extraer texto/layout del PDF).

### 1.5 Otros

| Archivo | Notas |
|---------|--------|
| `CEAFUS01.docx` | Posible formato o anexo institucional; revisar si aplica a plantillas. |

---

## 2. Mapeo rápido legado (SQL) → conceptos del sistema nuevo

Fuente principal: `consultas_tipos_contratacion.txt`.

| Tabla / vista legado (Hydra) | Concepto en *contract-to-cash-flow* |
|------------------------------|--------------------------------------|
| `tipocontratcn` + `tabladesc` | `TipoContratacion` + textos / `codigo` |
| `explotacion` | `Administracion` (administraciones) |
| `clascontra` | Clase de contratación (si existe catálogo o campo en tipo) |
| `tipoptosrv` | Tipo de punto de servicio |
| `explotesttec` / `tipoesttec` | Estructura técnica por administración |
| `actividad` | `CatalogoActividad` / `actividadId` |
| `tipodocumento` | Tipos de documento / integración con checklist |
| `conctipocontra` / `tipoconcep` / `concepto` | Conceptos y tarifas por tipo → `CostoContrato`, motor de billing |
| `tipotarifa` | Tarifas base |
| `clausulas` | Cláusulas de plantilla |
| `docucontra` | Documentos requeridos por contratación → `config.documentos` |
| `tipovarcontra` / `tipovariable` / `grupovarcontra` | Variables por tipo → `config.variables` / `variablesCapturadas` |

Los valores numéricos de `tctcod` en Oracle **no** equivalen a `cuid` de Prisma; el mapeo para migración debe ser por **código estable** o tabla intermedia de correspondencia.

---

## 3. Interfaces — recaudación / formas de pago (P-CONV)

Ruta: `_DocumentacIon_Interna_Sistema_Anterior/Interfaces/Archivos que se reciben de la recaudación externa/`

| Recurso | Uso sugerido |
|---------|--------------|
| `DIF. FORMAS DE PAGO.xlsx` | Catálogo de formas de pago del legado. |
| `LAYOUTS_Pagos_20022026.xlsx` | Layout de archivos de pago; útil si el convenio de pagos debe alinearse a layouts de caja/banco. |
| Subcarpeta `Archivos/` | Ejemplos `.txt` de bancos / cadenas comerciales (formato de conciliación, no wizard); contexto para **no confundir** convenio de contratación con layout de recaudación. |

Para **convenio de pagos / anticipo en el alta**, priorizar primero `Procesos de facturación contratación CEA.docx` y la matriz en `docs/validacion-flujo-contratacion-2026-04-09.md` antes de modelar campos nuevos.

---

## 4. Tarifas y medidores (contexto)

- `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Tarifas/` — `Tarifas.docx`, `Tarifas_contratacion.xlsx`, `consultas_tarifas.txt`.
- `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Medidores/` — catálogos y `Medidores.docx`.

Sirven para la brecha “cuantificación” y órdenes de medidor, en coordinación con `docs/pendientes-flujo-contratacion-y-plan.md` §3.3.

---

## 5. Próximos pasos recomendados (con esta documentación)

1. **P-G7:** Abrir en paralelo `Formato Contrato Individual Provisional.pdf` y un PDF generado por `GET /contratos/:id/contrato-pdf`; anotar diferencias (logo, márgenes, tipografía, orden de bloques); ajustar CSS/HTML en `wrapTextoHtml`.
2. **P-MAT — Cuantificación:** el wizard expone el paso **Cuantificación** con la tabla de conceptos (`preview-facturacion`) y guía operativa referida a `CUANTIFICACION CONTRATACION.PDF`; refinamientos de negocio adicionales siguen en `docs/pendientes-flujo-contratacion-y-plan.md` (p. ej. convenio F-02).
3. **P-CONV:** extraer del Word de facturación contratación si el anticipo es documental o financiero en BD.
4. **Seeds / catálogos:** usar `consultas_tipos_contratacion.txt` + Excel de tipos para validar que cada tipo activo en legado tenga equivalente o plan de migración en Prisma.
5. Mantener **este índice** actualizado cuando se agreguen archivos nuevos a `_DocumentacIon_Interna_Sistema_Anterior/`.

---

## 6. Referencias cruzadas en el repo

- `docs/pendientes-flujo-contratacion-y-plan.md` — plan único de cierre.
- `docs/validacion-flujo-contratacion-2026-04-09.md` — matriz paso ↔ implementación.
- `backend/src/modules/contratos/contratos.service.ts` — `wrapTextoHtml`, snapshot, PDF.
