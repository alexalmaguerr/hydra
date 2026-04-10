---
date: 2026-04-09
task: usuarios-seed-ctcf-hydra
classification: SIMPLE
confidence: HIGH
workflow_type: research
next_command: /ks-conductor
---

## Respuesta directa (usuarios listados)

**Sí:** los cinco correos `@ctcf.local` están definidos en el seed de Prisma **`backend/prisma/seed.ts`**, función **`seedUser()`**, con `upsert` por `email`. Contraseña sembrada (bcrypt): **`demo123`** (misma para todos según el código).

| Email | Rol en seed | Nombre display |
|-------|-------------|----------------|
| demo@ctcf.local | SUPER_ADMIN | Usuario Demo |
| operador@ctcf.local | OPERADOR | Usuario Operador |
| lecturista@ctcf.local | LECTURISTA | Usuario Lecturista |
| atencion@ctcf.local | ATENCION_CLIENTES | Atención Clientes |
| cliente@ctcf.local | CLIENTE | Cliente Demo |

**“Hydra”:** en el repo, *hydra* aparece ligado a **SIGE** (`sige_hydra`, scripts de import, migraciones), no a un seed separado de usuarios. No hay otro archivo de seed con estos emails; el único origen versionado es `seed.ts`.

**Ejecución del seed:** encadenado tras `main()` en `seed.ts` (líneas ~788–799): `main().then(() => seedUser()).then(...)`; comando verificado: `npm run prisma:seed` en `backend/package.json` y `prisma.seed` en el mismo manifest.

## Stack summary

- Backend NestJS + Prisma (`backend/`). Seeds: TypeScript en `prisma/seed.ts`.

## Workflow type

- **research** (solo comprobar presencia en seeds; sin cambios).

## Relevant files (dependencias)

- **`backend/prisma/seed.ts`**: define usuarios (`seedUser`); importa `PrismaClient`, `bcrypt`; ejecutado por Prisma CLI.
- **`backend/package.json`**: script `prisma:seed` y bloque `prisma.seed`.
- **Consumidores indirectos:** cualquier despliegue que ejecute `npx prisma db seed` o `start:prod` (migra + seed).

## Validation commands (desde repo)

- `cd backend && npm run prisma:seed` — aplica seed (requiere DB y `DATABASE_URL`).
- No se ejecutó en esta sesión (solo inspección estática).

## Memory findings

- **DevContext:** conversación inicializada; contexto de código/arquitectura vacío en la respuesta MCP.
- **cursor10x `getComprehensiveContext`:** sin hits específicos de este repo; mensajes similares de otros proyectos.

## Recommended skill / subagent

- N/A para implementación; si se amplía: **database-schema-designer** solo si se cambia modelo `User`.

## SequentialThinking

- **skipped** — clasificación y ubicación de archivos claras por búsqueda en repo; sin bifurcación de enfoque.

## Conditional flags

- **security-review:** no (solo lectura; no tocar auth).
- **database-schema-designer:** no.
- **write-unit-tests:** no.
- **humanizer:** no.
- **reducing-entropy:** no.

## Risks / constraints

- Existencia **en base real** solo tras ejecutar seed/migrate contra esa instancia; el artefacto confirma **código de seed**, no el estado de un servidor Hydra concreto.

## Cursor CLI routing

- **`recommended_cli: no`** — verificación puntual en un solo archivo; no hay batch mecánico ni alcance masivo; `agent-dispatch` no aporta.

## Suggested parallelization

- N/A.
