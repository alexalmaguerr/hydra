-- Paso 1: Ejecutar este SQL contra la BD de producción para limpiar estado parcial.
--   psql $DATABASE_URL -f scripts/fix-failed-migration.sql
--
-- Paso 2: Marcar la migración fallida como rolled-back.
--   npm run migrate:resolve-failed
--
-- Paso 3: Aplicar migraciones pendientes.
--   prisma migrate deploy

DROP TABLE IF EXISTS "sige_hydra" CASCADE;
