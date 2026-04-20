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

## API

Sin cambios de contrato: `GET /catalogos/actividades` y `GET /catalogos/grupos-actividad` siguen igual; el listado incluye las actividades sembradas.

## Entornos ya sembrados

El seed hace **upsert** por `codigo`. No elimina filas antiguas de `catalogo_actividades` (p. ej. códigos tipo `HAB_UNIFAM` de corridas previas). Tras desplegar este cambio, conviene revisar en base si deben borrarse o desactivarse registros obsoletos para evitar duplicidad semántica con el catálogo SIGE.

## Regenerar el JSON desde Excel

Desde `backend` (usa `xlsx` en `devDependencies`). Ajustar la ruta del `.xlsx` si cambia:

```bash
cd backend
node -e "const XLSX=require('xlsx');const fs=require('fs');const path=require('path');const p=require('path').join('..','_DocumentacIon_Interna_Sistema_Anterior','Gestion Servicio','Contratos','Catálogos del contrato.xlsx');const wb=XLSX.readFile(p);const j=XLSX.utils.sheet_to_json(wb.Sheets['Actividad'],{defval:''});const rows=j.map(r=>({actipolid:Number(r.actipolid),actividad:String(r.actividad||'').trim()})).filter(r=>r.actividad.length>0).sort((a,b)=>a.actipolid-b.actipolid);fs.writeFileSync(path.join('prisma','data','catalogo-actividad-sige.json'),JSON.stringify(rows,null,2),'utf8');console.log('rows',rows.length);"
```
