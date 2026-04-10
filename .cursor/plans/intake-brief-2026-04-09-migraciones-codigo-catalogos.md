---
date: 2026-04-09
slug: migraciones-codigo-catalogos
---

# Intake brief

## Task
Crear todas las migraciones necesarias y cambios de código para usarlas donde corresponda.

## Acceptance criteria (ajustadas por evidencia de repo)
- Esquema Prisma validado; migraciones existentes documentadas hasta 20260409120000.
- Sin drift conocido: no se añaden tablas masivas del Excel de domicilio legado (bloqueo de producto previo en scout).
- Código backend expone y valida campos de BD ya existentes que faltaban en la API (p. ej. `tipoRelacionPadreId` en `PuntoServicio`).
- `npm run build` y `npm run lint` en backend pasan.

## Scope excluded
- Nuevas migraciones para calles/país/localidad legacy (~300k filas) sin decisión INEGI vs legado.
- `prisma migrate deploy` / status contra PostgreSQL (host `hydra_hydra-db` no alcanzable en este entorno).

## Open questions (producto)
- ¿Importar jerarquía de domicilio del Excel o mantener solo INEGI?

## DevContext
conversationId: 9eb1d41f-67f6-41f3-a384-7b8dda8747d4

## Brainstorming / requirements-gathering
No ejecutados: el alcance se acotó con scout previo + inspección de schema/migraciones.
