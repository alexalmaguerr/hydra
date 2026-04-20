# Catálogo SAT (CFDI — Anexo 20)

## Origen de datos

Los valores sembrados coinciden con el libro **`Catálogos del SAT.xlsx`** (hojas *Régimen Fiscal* y *Uso del CFDI*), ubicado en la documentación interna del sistema anterior. Esa ruta está en `.gitignore`; en entornos nuevos el Excel puede no existir, pero la **semilla** en el repositorio (`backend/prisma/catalogo-sat-seed-data.ts`) conserva el mismo contenido.

## Modelo y API

- **Tabla** `catalogo_sat` con `tipo`: `REGIMEN_FISCAL` | `USO_CFDI`, clave SAT, descripción, banderas de aplicación a persona física/moral, vigencias, y (para uso CFDI) texto de régimenes receptores permitidos según el Excel.
- **Endpoints** (JWT, mismo prefijo que otros catálogos de contratación):
  - `GET /api/catalogos/sat` — todos los registros activos/inactivos según query.
  - `GET /api/catalogos/sat?tipo=REGIMEN_FISCAL`
  - `GET /api/catalogos/sat?tipo=USO_CFDI`

## Operación local

Después de traer cambios:

```bash
cd backend
npx prisma migrate deploy
npm run prisma:seed
```

En el menú lateral: **Configuración → Catálogos SAT (CFDI)** (`/app/catalogos-sat`) abre directamente las tablas SAT. También están en **Configuración → Catálogos CIG2018**, pestaña **SAT · CFDI**.

## Comportamiento en solicitudes (paso fiscal)

En **Solicitud de servicio**, cuando hay API activa:

1. **Régimen fiscal**: solo filas cuyas banderas `aplicaFisica` / `aplicaMoral` coinciden con el tipo de persona elegido.
2. **Uso del CFDI**: solo filas que (a) aplican al mismo tipo de persona y (b) incluyen el régimen fiscal seleccionado en la lista `regimenesReceptorPermitidos` (columna SAT «Régimen Fiscal Receptor», separada por comas).

Si no hay régimen seleccionado, el uso del CFDI permanece deshabilitado hasta elegir régimen. Al cambiar tipo de persona o régimen, se limpian selecciones que dejen de ser válidas.

Sin API, se usan listas estáticas acotadas en `SolicitudServicio.tsx` con la misma lógica de filtrado (datos alineados al seed).

## Actualización desde Excel

Si el SAT publica una versión nueva del libro y se coloca el `.xlsx` localmente, puedes volcar hojas con `xlsx` (como en reconocimientos previos del proyecto) y actualizar **`catalogo-sat-seed-data.ts`** o ejecutar un script de importación dedicado; luego `npm run prisma:seed` para `upsert` idempotente.
