/**
 * OBSOLETO — Este script ya no se usa.
 *
 * Los catálogos de localidades y colonias ahora provienen de Aquasis (CEA Querétaro)
 * y se cargan mediante la migración:
 *
 *   backend/prisma/migrations/20260427000000_aquasis_localidades_colonias/migration.sql
 *
 * Fuentes originales usadas para generar esa migration:
 *   - Catálogos de domicilio.xlsx → Localidad (Población)  [filtro pobproid 1-18]
 *   - Catálogos de domicilio.xlsx → Localidad              [tabla intermedia, solo para join]
 *   - Catálogos de domicilio.xlsx → Colonia (Barrio)       [resultado: localidad_pobid directo]
 *
 * El script Python que generó el SQL está en:
 *   (se ejecutó manualmente en sesión de desarrollo, 2026-04-27)
 */

console.log('Este script está obsoleto. Ver migration 20260427000000_aquasis_localidades_colonias.');
process.exit(0);
