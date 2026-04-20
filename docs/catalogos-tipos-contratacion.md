# Catálogo SIGE: administraciones y tipos de contratación

## Fuente en producción (recomendado)

Archivo versionado en el repositorio:

`backend/prisma/data/catalogos-tipos-contratacion-sige.json`

Estructura:

- **administraciones**: `{ expid, nombre }[]` (misma lógica que la hoja Excel `administracion`).
- **tiposConMedidor** / **tiposSinMedidor**: arrays de objetos con las mismas columnas que el Excel (`tctcod`, `tipo_contratacion`, `tctexpid`, `tctclsccod`, `tctsnactivo`, etc.).

El seed y `importCatalogosTiposContratacion` **leen primero este JSON**. No hace falta subir el Excel al servidor ni incluirlo en la imagen Docker.

### Regenerar el JSON desde el Excel (solo en una máquina que tenga el .xlsx)

```bash
cd backend
npm run export:catalogos-tipos-sige-json -- "C:/ruta/Catálogos de tipos contratacion.xlsx"
```

Sin argumento intenta la ruta por defecto bajo `_DocumentacIon_Interna_Sistema_Anterior/.../Catálogos de tipos contratacion.xlsx`.

Luego **commitea** `prisma/data/catalogos-tipos-contratacion-sige.json` para que CI y producción carguen el catálogo completo.

Variables opcionales:

- `SIGE_CATALOGOS_JSON` — ruta alternativa al JSON.
- `SIGE_CATALOGOS_XLSX` — ruta alternativa al Excel (solo si no usas JSON o fuerzas Excel).

## Fuente legacy (desarrollo)

Archivo Excel: `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Catálogos de tipos contratacion.xlsx`

- Hoja **administracion**: `expid` (1–13) y nombre de administración.
- Hoja **tipos de contratacion**: tipos **con medidor** (`requiere_medidor = true`).
- Hoja **tipos de contratacion sin medid**: tipos **sin medidor** (`requiere_medidor = false`).

Si **no** existe el JSON y **sí** existe este Excel en la ruta por defecto o en `SIGE_CATALOGOS_XLSX`, el import usa el libro (misma lógica que antes).

## Relación administración ↔ tipo

- Columna **tctexpid** enlaza cada tipo con **expid** del catálogo de administraciones.
- En API/BD el identificador estable es **`EXP-{expid en dos dígitos}`** (p. ej. expid 7 → `EXP-07`, Amealco).

Hay **32 descripciones distintas** de tipo en el catálogo “con medidor”; cada administración tiene un subconjunto; el mismo nombre puede tener **distinto tctcod** según administración.

El código legacy único por fila es **tctcod**. En base de datos el campo `TipoContratacion.codigo` es `TCT-{tctcod}` (único global).

## Carga en base de datos

Tras `seed` de clases de contrato (`seedSectoresClasesVariables`), el seed ejecuta:

1. `importCatalogosTiposContratacion` — upsert desde **JSON** (o Excel si no hay JSON) de administraciones y tipos (con/sin medidor).
2. `linkHydraClausulasToAllTipos` — vincula las cláusulas Hydra existentes a cada tipo importado.

Import manual (misma lógica + vínculos Hydra; usa JSON salvo que pases un `.xlsx` explícito, entonces fuerza Excel):

```bash
cd backend
npm run import:catalogos-tipos
```

Forzar un Excel concreto (ignora JSON temporalmente):

```bash
npm run import:catalogos-tipos -- "C:/ruta/Catálogos de tipos contratacion.xlsx"
```

Si **no** hay JSON ni Excel, el import solo aplica las **13 administraciones** embebidas en código (`FALLBACK_ADMINISTRACIONES`) y **no** importa tipos.

## Consulta en la aplicación (Configuración)

En el panel interno, grupo **Configuración**:

- **Administraciones (SIGE)** — lista de jurisdicciones (`/app/administraciones`).
- **Tipos de contratación** — tabla con columna **Administración** y filtros por administración y con/sin medidor cuando la API está disponible (`/app/tipos-contratacion`).
- **Variables de contratación** — catálogo maestro (`TipoVariable`) y vínculos por tipo (`VariableTipoContratacion`): orden, obligatorio y valor por defecto (`/app/variables-contratacion`). Define qué variables aparecen en el paso **Variables** del wizard según `GET /tipos-contratacion/:id/configuracion`.

## Excluidas del selector (UI)

Algunos nombres del Excel no representan un municipio (p. ej. entidad operadora). `GET /catalogos-operativos/administraciones` **no** los devuelve para formularios; la lista vive en `backend/src/common/administraciones-selector-excluidas.ts` y el import SIGE los omite al hacer upsert.

## Cambio respecto a IDs anteriores

Las administraciones de demo **ADM01/ADM02** quedaron reemplazadas por **`EXP-01`** (QUERÉTARO) y **`EXP-12`** (EL MARQUÉS) donde correspondía el demo local (zonas Z004/Z005).
