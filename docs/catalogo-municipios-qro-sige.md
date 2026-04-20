# Catálogo municipios Querétaro (SIGE / domicilio)

## Origen

- Archivo: `_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Catálogos de domicilio.xlsx`
- Hoja: `Municipio (provincia)`
- Filtro: `procomid = 22` (provincia / estado Querétaro en el legado SIGE)

Columnas en el Excel: `proid`, `pronombre`, `procomid`, `proindblk`.

## Carga en la app

- Datos versionados: `backend/prisma/data/catalogo-municipios-qro-sige.json`
- Sembrado: función `seedInegiQueretaro()` en `backend/prisma/seed.ts` (estado INEGI `22` + municipios con `claveINEGI` = `22` + `proid` en tres dígitos, p. ej. `22014` = Querétaro).

## Clave INEGI

`proid` del Excel coincide con el **municipio** de la clave geoestadística INEGI para la entidad 22 (tres dígitos CVE_MUN). La clave única en BD es `claveINEGI` = `22` + `proid` rellenado a 3 dígitos.

## Activo (`activo` en BD)

Se toma de `proindblk` en el Excel: `activo = true` cuando `proindblk === "1"`, `false` cuando `"0"` (p. ej. ARROYO SECO y CORREGIDORA en el extracto usado).

## Demo localidades / colonias

Las filas de demostración (localidades y colonias de ejemplo) quedan asociadas a los municipios INEGI **22014** (Querétaro) y **22011** (El Marqués), con claves de localidad alineadas a ese esquema (`220140001`, etc.).

Si una base ya tenía datos sembrados con claves antiguas incorrectas (`22001` como ciudad de Querétaro), conviene `prisma migrate reset` o limpiar manualmente catálogos INEGI de Querétaro antes de volver a sembrar.
