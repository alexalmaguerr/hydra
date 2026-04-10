---
date: 2026-04-10
task: mas-cambios-revision-flujo-contratos
classification: STANDARD
confidence: HIGH
workflow_type: research
next_command: /ks-conductor
---

## Stack summary

- Monorepo Node.js con `npm` y lockfiles por app (`backend/package-lock.json`, `frontend/package-lock.json`).
- Backend: NestJS + Prisma + class-validator (`backend/package.json`), dominio principal en `backend/src/modules`.
- Frontend: Vite + React + TypeScript + React Query (`frontend/package.json`), pantalla principal de alta en `frontend/src/pages/Contratos.tsx`.
- Estado de cambios locales relevantes: modificados `backend/src/modules/contratos/contratos.service.ts`, `backend/src/modules/contratos/dto/create-contrato.dto.ts`, `frontend/src/api/contratos.ts`, `frontend/src/api/tipos-contratacion.ts`, `frontend/src/pages/Contratos.tsx`.

## Workflow type detected

- `research` (scout de verificación tras cambios recientes).

## Relevant files (with dependency direction)

- `backend/src/modules/contratos/contratos.service.ts`
  - **imports:** `./dto/create-contrato.dto`, `../ordenes/ordenes.service`, Prisma service y utilidades de contrato.
  - **imported-by:** `backend/src/modules/contratos/contratos.module.ts` (provider wiring).
  - **impacto:** reglas de alta, validación FK (`puntoServicioId`), órdenes automáticas y transición de estado.

- `backend/src/modules/contratos/dto/create-contrato.dto.ts`
  - **imports:** decoradores `class-validator`.
  - **imported-by:** `backend/src/modules/contratos/contratos.controller.ts`, `backend/src/modules/contratos/contratos.service.ts`.
  - **impacto:** contrato API request boundary para alta.

- `backend/prisma/schema.prisma`
  - **imports/imported-by:** fuente de verdad para Prisma Client en todo backend.
  - **impacto:** modelo de `Contrato`, `PuntoServicio`, `CatalogoTipoCorte`, catálogos operativos y relaciones.

- `backend/src/modules/puntos-servicio/puntos-servicio.service.ts`
  - **imports:** `../../prisma/prisma.service`.
  - **imported-by:** `puntos-servicio.controller.ts`, `catalogos.controller.ts`, `puntos-servicio.module.ts`.
  - **impacto:** CRUD de punto de servicio, jerarquía padre-hijo, catálogos de soporte.

- `frontend/src/pages/Contratos.tsx`
  - **imports:** `@/api/contratos`, `@/api/puntos-servicio`, `@/api/tipos-contratacion`, `@/api/catalogos`.
  - **imported-by:** router de frontend (página de contratos).
  - **impacto:** wizard de alta y surface de campos/flags nuevos.

- `frontend/src/api/contratos.ts`
  - **imports:** `./client`.
  - **imported-by:** `frontend/src/pages/Contratos.tsx`.
  - **impacto:** contrato tipado cliente-servidor para alta/edición.

- `frontend/src/api/tipos-contratacion.ts`
  - **imports:** `./client`.
  - **imported-by:** `frontend/src/pages/Contratos.tsx`, `frontend/src/pages/TiposContratacion.tsx`.
  - **impacto:** consumo de configuraciones y checklist documental por tipo.

## Validation commands (verified from repo)

- Root:
  - `npm run dev`
  - `npm run dev:frontend`
  - `npm run dev:backend`
  - `npm run build`
  - `npm run lint`
  - `npm run test` (solo frontend)
- Backend (`backend/package.json`):
  - `npm run start:dev --prefix backend`
  - `npm run build --prefix backend`
  - `npm run lint --prefix backend`
  - `npm run prisma:generate --prefix backend`
  - `npm run prisma:migrate --prefix backend`
  - `npm run prisma:seed --prefix backend`
- Frontend (`frontend/package.json`):
  - `npm run dev --prefix frontend`
  - `npm run build --prefix frontend`
  - `npm run lint --prefix frontend`
  - `npm run test --prefix frontend`

## Memory findings

- **Devcontext (`initialize_conversation_context`)**: conversación inicializada correctamente; sin contexto arquitectónico adicional útil (retornó estructura vacía de code context).
- **cursor10x (`getComprehensiveContext`)**: no devolvió hitos/decisiones/requisitos previos relevantes para este repo/tema; similitudes semánticas apuntan a conversaciones no relacionadas.
- **Brainstorming gate**: omitido correctamente (tarea de recon pura, no diseño de feature).

## Recommended skill/subagent routing

- Skill recomendado para siguiente fase: `backend-patterns` + `api-contract-design` (si se va a cerrar gap de campos/reglas en API).
- Subagente recomendado para BUILD posterior: `fullstack-developer` (cambios actuales tocan DTO + service + APIs + UI wizard).
- Subagente alternativo para validación de gap funcional: `backend-developer` (si la siguiente iteración es solo backend/schema).

## Recommended classification

- `STANDARD`
  - Justificación: superficie multi-capa (Prisma + Nest + React), reglas de negocio y contratos API ya activos, pero con patrones existentes y ownership claro.

## Confidence

- `HIGH` (evidencia directa de código, scripts y estado git actual).

## SequentialThinking

- `skipped` — no hubo ambigüedad entre tiers ni forks arquitectónicos competidores en esta revisión; la clasificación cae claramente en `STANDARD`.

## Conditional review flags

- `security-review`: **yes** — toca endpoints autenticados y mutaciones de contrato (validaciones y transición de estado).
- `database-schema-designer`: **yes** — el gap detectado está centrado en modelo `PuntoServicio` y relación temporal padre-hijo.
- `write-unit-tests`: **yes** — cambios en reglas de estado/órdenes y validaciones FK ameritan cobertura dirigida.
- `humanizer`: **no** — trabajo técnico, no de tono/copy.
- `reducing-entropy`: **no** — no hay solicitud explícita de simplificación/dedupe.

## Risks/constraints

- Riesgo de desalineación entre contrato funcional de negocio y modelo persistente actual de `PuntoServicio` (faltan campos/catálogos clave).
- Riesgo de regresión de flujo por coexistencia de estados (`Pendiente de toma`/`Pendiente de zona`/`Activo`) y triggers de órdenes.
- Falta de tests backend en scripts del módulo contratos (no hay `npm test` backend definido), obliga validación más manual/integración.
- Mucho ruido de archivos no rastreados en repo; evitar tocar artefactos fuera de alcance.

## Suggested parallelization

- En paralelo seguro:
  - Diseñar matriz de gap campo-a-campo (`regla negocio` ↔ `schema/API/UI`).
  - Definir propuesta de migraciones Prisma para `PuntoServicio` + tabla de relación histórica padre-hijo.
  - Preparar checklist de validación API/frontend para wizard de alta.
- En serie (no paralelo):
  - Cambios en `schema.prisma` + migración + actualización DTO/service/controller.
  - Luego sincronizar `frontend/src/api/*` y `Contratos.tsx`.

## Cursor CLI routing

- `recommended_cli: no`
- Justificación: no es un batch mecánico masivo ni patrón repetitivo headless; requiere juicio funcional y trazabilidad entre dominio, API y UI en iteraciones pequeñas.
