# Intake brief — Validación flujo de contratación

**Fecha:** 2026-04-09  
**Tarea:** Validar el flujo de contratación operativo (pasos 1–13 + inspección, costo, reimpresión) frente a la implementación actual del monorepo.

## Criterios de aceptación

- Mapa paso a paso del requerimiento vs evidencia en código (backend, Prisma, frontend).
- Lista explícita de brechas, duplicidades (p. ej. dos rutas para orden de medidor) y riesgos.
- Referencias a archivos y símbolos verificables.

## Alcance excluido

- Implementación de nuevas pantallas o APIs en esta sesión.
- Validación ejecutada de lint/test completo del monorepo (tarea fue análisis de dominio).

## Preguntas abiertas (producto / negocio)

- ¿La “factura de contratación” es un `Timbrado` sin `consumo` o un concepto distinte del ciclo de consumo?
- ¿Los estados “pendiente de toma” y “pendiente de zona” deben ser valores canónicos del campo `Contrato.estado` o un subestado / FSM aparte?

## Devcontext

- `conversationId`: `9eb1d41f-67f6-41f3-a384-7b8dda8747d4` (sesión actual).

## Brainstorming / requirements-gathering

- No aplicado: el requerimiento llegó como lista numerada explícita.
