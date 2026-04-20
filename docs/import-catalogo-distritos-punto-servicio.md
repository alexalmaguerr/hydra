# Catálogo Distrito (punto de servicio)

Los distritos operativos expuestos en API (`GET /catalogos/distritos`) y cargados por `seed` corresponden a la hoja **«Distrito»** del libro Excel de catálogos de punto de servicio (columnas **Administración** | **Distrito**). La fuente de referencia en el repo es:

`_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/catálogos de punto de servicio.xlsx`

## Modelo en base de datos

Registros en tabla `distritos` (Prisma `Distrito`), con `zona_id` obligatorio. El Excel **no** incluye zona operativa; el seed y el script de import asignan por defecto la zona **`Z001`** (Norte / CEA Querétaro) hasta que exista un mapeo explícito negocio ↔ zona.

Identificadores estables: **`DIST01`** … **`DIST04`**, derivados del prefijo numérico del texto del distrito (`01-…`, `02-…`, etc.).

## Carga inicial

`npm run prisma:seed` (desde `backend/`) inserta o actualiza los cuatro distritos definidos en `prisma/seed-data/distritos-punto-servicio.ts`.

## Reimportar desde el XLSX

Con `DATABASE_URL` configurado y el libro accesible:

```bash
cd backend
npm run import:distritos-punto-servicio
```

Opcional: ruta explícita al archivo:

```bash
npm run import:distritos-punto-servicio -- "C:/ruta/al/catálogos de punto de servicio.xlsx"
```

El script valida que existan filas para los ids esperados y advierte si falta alguna.
