# Importación del catálogo territorial INEGI + SEPOMEX (producción)

Las tablas `catalogo_estados_inegi`, `catalogo_municipios_inegi`, `catalogo_localidades_inegi` y `catalogo_colonias_inegi` se crean con las **migraciones Prisma** existentes (`20260408000000_*`, etc.). No deben llenarse con datos de demostración en `seed.ts`: el volumen es masivo y la fuente debe ser **oficial**.

Este proyecto carga los datos con el script:

`backend/scripts/import-inegi-catalog.ts`

## Fuentes oficiales

1. **Localidades (jerarquía estado → municipio → localidad)**  
   Catálogo de localidades / marco geoestadístico del **INEGI**, en CSV o XLSX, con claves compatibles con el modelo (ver columnas admitidas abajo).  
   Punto de partida: [Marco geoestadístico / Catálogo único de claves](https://www.inegi.org.mx/app/ageeml/) y [Servicio web del catálogo único](https://www.inegi.org.mx/servicios/catalogounico.html).

2. **Asentamientos y código postal (colonias en la app)**  
   Archivo **CPdescarga** (XLSX) de **Correos de México (SEPOMEX)**.  
   Descarga habitual: portal de códigos postales de Correos de México (catálogo nacional de CP).

Las **zonas de facturación** (`catalogo_zonas_facturacion`) son catálogo **operativo del organismo**, no INEGI; no forman parte de este import.

## Requisitos previos

- `DATABASE_URL` apuntando a la base donde ya corrió `prisma migrate deploy`.
- Archivos accesibles **en el contenedor** (ruta local) **o** vía **URL HTTPS** (ver siguiente sección).
- **Node.js 18+** en el entorno que ejecute el script (usa `fetch` para descargas).

## Sin SSH (GitHub + Easypanel) y archivos en Google Drive

No hace falta subir los XLSX/CSV al repositorio Git. Flujo habitual:

1. Subir los archivos oficiales a **Google Drive** (o otro almacenamiento) con enlace **“Cualquiera con el enlace puede ver”** (o equivalente público de solo lectura).
2. Copiar el enlace de compartir (formato `https://drive.google.com/file/d/FILE_ID/...`).
3. En **Easypanel**, definir variables de entorno del servicio backend (o del job que ejecute el import):

   | Variable | Ejemplo |
   |----------|---------|
   | `INEGI_LOCALIDADES_URL` | `https://drive.google.com/file/d/XXXX/view?usp=sharing` |
   | `SEPOMEX_XLSX_URL` | `https://drive.google.com/file/d/YYYY/view?usp=sharing` |
   | `INEGI_LOCALIDADES_DOWNLOAD_EXT` | `.xlsx` si el archivo de localidades es Excel y la URL no termina en `.xlsx` |
   | `SEPOMEX_DOWNLOAD_EXT` | `.xlsx` (por defecto el script asume `.xlsx` si la URL no trae extensión) |

4. Ejecutar **una vez** el import contra la base de datos de producción/staging. Sin SSH, opciones típicas en Easypanel:

   - **Comando de inicio temporal** (solo en un despliegue): por ejemplo  
     `sh -c "npx prisma migrate deploy && npx prisma db seed && npx ts-node --compiler-options '{\"module\":\"CommonJS\"}' scripts/import-inegi-catalog.ts --wipe-inegi --force && node dist/src/main.js"`  
     Luego **volver** al comando de arranque normal (sin el import), para no repetir la carga en cada reinicio.
   - **Servicio / tarea one-shot** duplicado del backend con el mismo `DATABASE_URL` y comando que solo ejecute `npx ts-node ... import-inegi-catalog.ts` y termine.
   - **Consola web** del contenedor (si Easypanel la ofrece) para lanzar el mismo comando manualmente.

El script convierte enlaces de Drive a descarga directa y, si Google muestra la página de “virus scan”, intenta el segundo paso con `confirm`. Si falla, pruebe otro hosting (p. ej. bucket S3 con URL firmada) o ponga `INEGI_IMPORT_BEARER` si la URL exige token.

**Seguridad:** un enlace “público” de Drive permite que quien tenga la URL descargue el archivo. No commitear URLs con datos sensibles; rotar el enlace si se filtra.

## Uso

Desde `backend/`:

```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/import-inegi-catalog.ts \
  --localidades ./data/inegi/localidades.csv \
  --sepomex ./data/sepomex/CPdescarga.xlsx
```

O con variables de entorno (ruta **o** URL; si existen ambas para el mismo archivo, tienen prioridad `*_URL`):

```text
INEGI_LOCALIDADES_PATH=/ruta/localidades.csv
SEPOMEX_XLSX_PATH=/ruta/CPdescarga.xlsx
```

```text
INEGI_LOCALIDADES_URL=https://drive.google.com/file/d/.../view?usp=sharing
SEPOMEX_XLSX_URL=https://drive.google.com/file/d/.../view?usp=sharing
```

```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/import-inegi-catalog.ts
```

Script npm (equivalente):

```bash
npm run import:inegi-catalog -- --localidades ./data/inegi/localidades.csv --sepomex ./data/sepomex/CPdescarga.xlsx
```

### Primera carga (vaciar tablas INEGI)

Solo si se acepta poner en `NULL` las FKs de domicilios que apuntaban a catálogo (comportamiento `ON DELETE` del esquema):

```bash
npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/import-inegi-catalog.ts \
  --wipe-inegi --force \
  --localidades ./data/inegi/localidades.csv \
  --sepomex ./data/sepomex/CPdescarga.xlsx
```

Sin `--force`, el script pide confirmación escribiendo `SI` en consola.

### Solo una parte del flujo

- `--skip-colonias`: solo estados, municipios y localidades.
- `--skip-localidades`: solo colonias SEPOMEX (requiere municipios ya cargados y coherentes con `c_estado` + `c_mnpio`).

## Columnas admitidas (localidades)

El script detecta delimitador `,` o tabulador en la primera línea.

**Claves (una u otra estrategia):**

- Columna de clave geoestadística de **9 dígitos**: por ejemplo `CVEGEO`, `PK_CVEGEO`, `CLAVE_GEOESTADISTICA` (nombre flexible, ver código).
- O columnas separadas: `CVE_ENT` / `ENTIDAD`, `CVE_MUN` / `MUN`, `CVE_LOC` / `LOC`.

**Nombres:**

- `NOM_LOC` (obligatorio para crear filas de localidad).
- `NOM_ENT`, `NOM_MUN` recomendados para nombres de estado y municipio (si faltan, se usan textos genéricos).

Misma lógica para la **primera hoja** de un XLSX de localidades.

## Localidades SIGE / «Catálogos de domicilio» (Querétaro)

Los municipios de Querétaro del sistema anterior se cargan desde `backend/prisma/data/catalogo-municipios-qro-sige.json` (derivado del catálogo territorial compatible con **AGEEML** / SIGE). Las **localidades** masivas para esos mismos municipios están en el Excel **`Catálogos de domicilio.xlsx`**, hoja **`Localidad (Población)`**, columnas `pobid`, `pobnombre`, `pobproid`, `pobcodine`:

- **`pobproid`** coincide con **`proid`** en la hoja «Municipio (provincia)» y con la clave municipal utilizada junto al catálogo ya cargado (equivalente **`cve_mun`** / **`proid`** según la fuente).
- La relación con la BD es **`pobproid` → `CatalogoMunicipioINEGI`** mediante `claveINEGI` (`22001` … `22018` en Querétaro).

**Import solo para municipios ya presentes en BD** (~3 600 localidades para los 18 municipios de Querétaro si el libro contiene el catálogo nacional completo):

```bash
cd backend
npm run import:localidades-sige-qro -- --file "../ruta/a/Catálogos de domicilio.xlsx"
```

Sin `--file`, el script usa por defecto la ruta interna `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Catálogos de domicilio.xlsx` si existe. También puede definirse **`CAT_DOM_XLSX_PATH`**.

Clave única en tabla: combinación de clave geoestadística (`pobcodine`, 9 dígitos si existe) más `pobid`, para evitar duplicados por datos sucios en el archivo fuente (`skipDuplicates` en `createMany`).

## Columnas SEPOMEX (CPdescarga)

El script busca por nombre (mayúsculas/minúsculas toleradas):

- `c_estado`, `c_mnpio`, `d_codigo` (CP de 5 dígitos), `d_asenta`, `id_asenta_cpcons`.

Solo se insertan filas cuyo municipio exista ya en `catalogo_municipios_inegi` (clave `c_estado` de 2 dígitos + `c_mnpio` de 3 dígitos).

## Re-ejecución e idempotencia

Se usa `createMany` con `skipDuplicates: true` respecto a `clave_inegi` única. Las repeticiones no rompen el job; sirve para cargas incrementales si las fuentes no cambian de clave.

## Orden recomendado en despliegue

1. `prisma migrate deploy`
2. `prisma db seed` (usuarios y catálogos operativos; **no** incluye INEGI)
3. Ejecutar **este import** con los archivos oficiales de la fecha de corte acordada
4. Levantar la API

## Nota sobre “migración” de datos

Meter cientos de miles de `INSERT` en un único archivo SQL de Prisma no es mantenible ni revisable en Git. La **migración de esquema** sigue en Prisma; la **migración de datos** masiva es este script (o un pipeline que lo invoque) con artefactos oficiales versionados fuera del repo o en almacenamiento de releases.
