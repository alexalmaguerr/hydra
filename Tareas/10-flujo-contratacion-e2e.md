# Tarea 10 — Flujo de Contratación End-to-End

**PRD reqs:** 1, 2, 3, 4, 5 (parcial), 6, 7, 8 (parcial)  
**Sección PRD:** "Flujo de contratación visible de punta a punta"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencias:** T06 (Personas), T11 (PuntoServicio), T13 (TipoContratacion), T14 (Motor tarifario)

---

## Contexto

El PRD 2026-04-06 requiere un flujo de contratación visible desde la captura de personas relacionadas hasta la instalación, facturación y habilitación de lecturas. Debe contemplar roles de persona (propietaria, fiscal, contacto), estados operativos independientes para contrato, toma, medidor y alta de servicio, formato estándar de contrato con cláusulas controladas, y vinculación con factura de contratación.

Se usará como referencia funcional la lógica histórica de CIG 2018 para trazabilidad, sin copia literal.

---

## Objetivo

1. Máquina de estados (FSM) del proceso contractual: Solicitud → Validación → Aprobación → Instalación Toma → Instalación Medidor → Alta Servicio → Activo
2. Estados operativos independientes para: contrato, instalación de toma, instalación de medidor, alta del servicio
3. Formato estándar de contrato con plantillas parametrizadas por tipo de contratación
4. Vinculación: contratación → factura timbrada → convenio de pago (cuando aplique)
5. Vista de timeline/secuencia del proceso contractual para operación
6. Trigger: al completar instalación de toma → generar orden de instalación de medidor (coordinar con T03)

---

## Aceptación (Definition of Done)

- [ ] Migración con `ProcesoContratacion`, `HitoContratacion`, `PlantillaContrato` aplicada
- [ ] `POST /procesos-contratacion` inicia nuevo proceso vinculado a contrato
- [ ] `PATCH /procesos-contratacion/:id/avanzar` transiciona etapa con validación FSM
- [ ] `GET /procesos-contratacion/:id/timeline` devuelve secuencia de hitos
- [ ] `GET /contratos/:id/flujo-completo` agrega historial + órdenes + trámites + hitos
- [ ] Plantillas de contrato CRUD: `GET/POST/PATCH /plantillas-contrato`
- [ ] Al completar etapa "InstalacionToma" → emitir evento para que T03 genere orden InstalacionMedidor
- [ ] Frontend: vista de timeline del proceso contractual
- [ ] Frontend: formulario de alta de contrato con selección de plantilla

---

## Modelos Prisma (ya aplicados en schema)

```prisma
model ProcesoContratacion {
  id               String   @id @default(cuid())
  contratoId       String?  @map("contrato_id")
  tramiteId        String?  @map("tramite_id")
  etapa            String   @default("solicitud")
  estado           String   @default("en_progreso")
  fechaInicio      DateTime @default(now()) @map("fecha_inicio")
  fechaFin         DateTime? @map("fecha_fin")
  plantillaId      String?  @map("plantilla_id")
  creadoPor        String?  @map("creado_por")
  datosAdicionales Json?    @map("datos_adicionales")
  // ... relaciones con Contrato, PlantillaContrato, HitoContratacion[]
}

model HitoContratacion {
  id         String   @id @default(cuid())
  procesoId  String   @map("proceso_id")
  etapa      String
  estado     String   @default("pendiente")
  nota       String?
  usuario    String?
  fechaCumpl DateTime? @map("fecha_cumpl")
}

model PlantillaContrato {
  id          String   @id @default(cuid())
  nombre      String
  version     String   @default("1.0")
  contenido   String   @db.Text
  variables   Json?
  activo      Boolean  @default(true)
}
```

---

## Paso 1: Backend — módulo `procesos-contratacion`

### `procesos-contratacion.service.ts`

```typescript
@Injectable()
export class ProcesosContratacionService {
  private readonly etapasValidas = [
    'solicitud', 'validacion', 'aprobacion',
    'instalacion_toma', 'instalacion_medidor', 'alta_servicio', 'activo'
  ];

  async crear(dto: { contratoId?: string; plantillaId?: string; creadoPor?: string }) {
    // Crear proceso + hitos iniciales para cada etapa
  }

  async avanzarEtapa(procesoId: string, datos: { nota?: string; usuario?: string }) {
    // Validar FSM: solo avanzar a siguiente etapa
    // Al completar instalacion_toma → emitir evento para T03
    // Al llegar a 'activo' → marcar fechaFin
  }

  async getTimeline(procesoId: string) {
    // Retornar hitos con fechas y estados
  }

  async getFlujoPorContrato(contratoId: string) {
    // Agregar: proceso + historial contrato + órdenes + trámites
  }
}
```

### Transiciones FSM

| Etapa actual | Siguiente | Condiciones |
|---|---|---|
| solicitud | validacion | Datos mínimos completos |
| validacion | aprobacion | Documentos verificados |
| aprobacion | instalacion_toma | Aprobación de supervisor |
| instalacion_toma | instalacion_medidor | Orden de toma ejecutada → auto-generar orden medidor |
| instalacion_medidor | alta_servicio | Orden de medidor ejecutada |
| alta_servicio | activo | Lectura inicial registrada |

---

## Paso 2: Frontend

### Vista timeline del proceso

- Timeline vertical con etapas
- Cada etapa: estado (pendiente/completado/en_progreso), fecha, responsable, notas
- Acciones contextuales según etapa actual
- Indicadores visuales de progreso

### Formulario alta de contrato

- Selección de tipo de contratación (carga conceptos/cláusulas automáticas de T13)
- Selección de plantilla de contrato
- Datos de personas relacionadas (propietario, fiscal, contacto)
- Preview del contrato con cláusulas

---

## Preguntas abiertas bloqueantes

- ⚠️ #1: Formato final estándar del contrato (campos obligatorios por tipo)
- ⚠️ #2: Criterios exactos de transición entre estados
- ⚠️ #3: Validaciones para auto-generar orden de medidor

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_procesos_contratacion
npm run build

# Crear proceso
curl -X POST http://localhost:3001/procesos-contratacion \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId":"<id>","plantillaId":"<id>","creadoPor":"admin"}'

# Avanzar etapa
curl -X PATCH http://localhost:3001/procesos-contratacion/<id>/avanzar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nota":"Documentos verificados","usuario":"operador1"}'

# Timeline
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/procesos-contratacion/<id>/timeline
```
