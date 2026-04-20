# Catálogo SIGE: administraciones y tipos de contratación

## Fuente

Archivo Excel: `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Catálogos de tipos contratacion.xlsx`

- Hoja **administracion**: `expid` (1–13) y nombre de administración.
- Hoja **tipos de contratacion**: tipos **con medidor** (`requiere_medidor = true`).
- Hoja **tipos de contratacion sin medid**: tipos **sin medidor** (`requiere_medidor = false`).

El código legacy único por fila es **tctcod**. En base de datos el campo `TipoContratacion.codigo` es `TCT-{tctcod}` (único global).

## Relación administración ↔ tipo

- Columna **tctexpid** enlaza cada tipo con **expid** del catálogo de administraciones.
- En API/BD el identificador estable es **`EXP-{expid en dos dígitos}`** (p. ej. expid 7 → `EXP-07`, Amealco).

Hay **32 descripciones distintas** de tipo en el catálogo “con medidor”; cada administración tiene un subconjunto; el mismo nombre puede tener **distinto tctcod** según administración.

## Carga en base de datos

Tras `seed` de clases de contrato (`seedSectoresClasesVariables`), el seed ejecuta:

1. `importCatalogosTiposContratacion` — upsert de administraciones desde el Excel y de todos los tipos (con/sin medidor).
2. `linkHydraClausulasToAllTipos` — vincula las cláusulas Hydra existentes a cada tipo importado.

Import manual (misma lógica + vínculos Hydra):

```bash
cd backend
npm run import:catalogos-tipos
```

Ruta al libro opcional:

```bash
npm run import:catalogos-tipos -- "C:/ruta/Catálogos de tipos contratacion.xlsx"
```

Si el archivo no existe en la ruta por defecto, el import solo aplica las **13 administraciones** embebidas en código (`FALLBACK_ADMINISTRACIONES`) y **no** importa tipos.

## Cambio respecto a IDs anteriores

Las administraciones de demo **ADM01/ADM02** quedaron reemplazadas por **`EXP-01`** (QUERÉTARO) y **`EXP-12`** (EL MARQUÉS) donde correspondía el demo local (zonas Z004/Z005).
