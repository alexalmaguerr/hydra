---
name: Arquitectura fullstack Easypanel (frontend y backend separados)
overview: Arquitectura fullstack con frontend y backend como dos despliegues independientes en Easypanel, PostgreSQL, y Docker. Incluye skills (backend-patterns, database-schema-designer, frontend-design) y subagentes por fase.
todos: []
isProject: false
---

# Plan: Arquitectura fullstack – Easypanel, frontend y backend separados

## Skills y subagentes

- **backend-patterns**: REST por recurso, Repository + Service + Controller, auth middleware, errores centralizados, paginación.
- **database-schema-designer**: 3NF, DECIMAL para dinero, índices en FKs, migraciones reversibles, seeds.
- **frontend-design**: Estructura `src/`, capa `api/`, TanStack Query, tipos compartidos.
- **Subagentes**: architect-reviewer (límites y CORS), backend-developer (API + Prisma + Dockerfile), frontend-developer (api/ + Dockerfile frontend), fullstack-developer (integración y contratos).

---

## 1. Frontend y backend separados

Dos aplicaciones independientes, cada una con su **Dockerfile** y su **App Service en Easypanel**.

- **Opción A – Dos repos**: `contract-to-cash-flow-web` (frontend) y `contract-to-cash-flow-api` (backend). Cada uno un servicio en Easypanel.
- **Opción B – Monorepo**: Carpeta `frontend/` y `backend/` en el mismo repo; en Easypanel dos App Services (build context y Dockerfile distintos). `docker-compose.yml` solo para desarrollo local.

Recomendación: **separados** en despliegue (dos servicios en Easypanel) y **Easypanel** como plataforma. Base de datos: servicio PostgreSQL de Easypanel; solo el backend se conecta.

---

## 2. Servicios en Easypanel

| Servicio          | Origen              | Puerto | Dominio ejemplo        |
|-------------------|---------------------|--------|------------------------|
| ctcf-frontend     | frontend/ + Dockerfile | 80     | app.ctcf.example.com   |
| ctcf-api          | backend/ + Dockerfile  | 3001   | api.ctcf.example.com   |
| PostgreSQL        | Servicio DB Easypanel | 5432   | —                      |

- Frontend: build Vite → nginx sirve estáticos; en build, `VITE_API_BASE_URL=https://api.ctcf.example.com`.
- Backend: Node (NestJS/Fastify), Prisma; env `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN=https://app.ctcf.example.com`.

---

## 3. Resumen de decisiones

| Tema            | Decisión                                                                 |
|-----------------|--------------------------------------------------------------------------|
| Despliegue      | Easypanel: 2 App Services (frontend + backend) + PostgreSQL              |
| Frontend/Backend| Separados: dos despliegues (dos repos o monorepo con dos Dockerfiles)   |
| Backend         | Node + NestJS o Fastify + Prisma + PostgreSQL                           |
| API             | REST por recurso; backend-patterns                                      |
| DB              | PostgreSQL + Prisma; database-schema-designer                           |
| Frontend        | Vite/React; api/ + TanStack Query; VITE_API_BASE_URL                   |
| CORS            | Backend solo permite origen del frontend                                |
| Subagentes      | architect-reviewer, backend-developer, frontend-developer, fullstack-developer |

Implementación: tareas por fase delegables a los subagentes indicados.
