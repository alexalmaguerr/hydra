# Catálogo Actividad (SIGE)

## Origen

- Archivo fuente: `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Catálogos del contrato.xlsx`, hoja **Actividad**.
- Columnas: `actipolid` (identificador legado), `actividad` (descripción).

## Datos en el repositorio

- JSON exportado para el seed: `backend/prisma/data/catalogo-actividad-sige.json` (filas con texto vacío excluidas).
- Sembrado en `seed.ts` dentro de `seedCatalogosActividadRelacionPS()`:
  - Grupo de actividad: código `SIGE_EST`, id `GA_SIGE`, descripción *Tipo de establecimiento (catálogo operativo — hoja Actividad, SIGE)*.
  - Cada ítem usa `id` y `codigo` **`ACTIPOL_{actipolid}`** para trazabilidad con el sistema anterior.
  - Campo `descripcion` en base de datos = texto de la columna `actividad` (mayúsculas según fuente).

## Interfaz

En la app interna: **Configuración → Catálogos del contrato** (`/app/catalogos-contrato`, pestaña *Actividad*). Otras pestañas de la misma pantalla: categoría tarifaria, estado del contrato (referencia AQUACIS) y tipo de envío de factura.

## API

`GET /catalogos/actividades` devuelve **solo** filas cuyo `codigo` comienza por `ACTIPOL_` (catálogo SIGE sembrado desde `catalogo-actividad-sige.json`). Así no aparecen en el wizard ni en catálogos registros demo u híbridos con otro formato. `GET /catalogos/grupos-actividad` no cambia.

## Entornos ya sembrados

El seed hace **upsert** por `codigo` sobre las filas SIGE y pone `activo: true` en cada una. Tras eso, **desactiva** (`activo: false`) cualquier fila de `catalogo_actividades` cuyo `codigo` no empiece por `ACTIPOL_` (p. ej. restos `HAB_UNIFAM` u otras inserciones ajenas al Excel). Vuelva a ejecutar el seed tras importar desde el Excel si regeneró el JSON.

## Regenerar el JSON desde Excel

Desde `backend` (usa `xlsx` en `devDependencies`). Ajustar la ruta del `.xlsx` si cambia:

```bash
cd backend
node -e "const XLSX=require('xlsx');const fs=require('fs');const path=require('path');const p=require('path').join('..','_DocumentacIon_Interna_Sistema_Anterior','Gestion Servicio','Contratos','Catálogos del contrato.xlsx');const wb=XLSX.readFile(p);const j=XLSX.utils.sheet_to_json(wb.Sheets['Actividad'],{defval:''});const rows=j.map(r=>({actipolid:Number(r.actipolid),actividad:String(r.actividad||'').trim()})).filter(r=>r.actividad.length>0).sort((a,b)=>a.actipolid-b.actipolid);fs.writeFileSync(path.join('prisma','data','catalogo-actividad-sige.json'),JSON.stringify(rows,null,2),'utf8');console.log('rows',rows.length);"
```
