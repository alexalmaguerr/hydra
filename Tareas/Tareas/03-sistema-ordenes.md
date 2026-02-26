# Tarea 03 — Sistema de Órdenes Centralizado

**PRD reqs:** 17–19  
**Sección PRD:** "Sistema de órdenes (corte, instalación, reconexión, etc.)"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui

---

## Contexto y estado actual

### Archivos de referencia disponibles

- `Requerimientos/Documentos/Interfaces-.../OM/` — archivos de órdenes:
  - `20260223031244_..._1pags_01.txt` — control file de órdenes (formato texto estructurado)
  - `20260223031244_..._1pags_01.pdf` — recibo de orden impreso
  - `facturacion_3841207.xml` — XML de facturación asociado a orden
- El archivo de control muestra: código explotación, empresa, datos de envío, numero de contrato/cuenta, tipo de orden

### Estado actual del código

- **No existe módulo de órdenes** en backend ni frontend
- Schema Prisma: campo `fechaReconexionPrevista` y `domiciliado` en `Contrato` — ya preparado para integración con órdenes
- `frontend/src/pages/` — no existe página de órdenes aún
- Q Order es el sistema actual que se quiere reemplazar/integrar (req 18)

### Decisiones de diseño pendientes (PRD pregunta abierta #1)

El PRD tiene abierta la pregunta: ¿Q Order se sustituye completamente o se mantiene como cliente de servicios?

**Supuesto para esta tarea:** implementar el nuevo sistema de órdenes como fuente única de verdad (req 17), con endpoints de servicio web que Q Order u otros sistemas puedan consumir (req 19). Q Order puede mantenerse como frontend especializado apuntando a estos endpoints.

---

## Objetivo

1. Módulo de órdenes centralizado (Corte, Instalación, Reconexión, Revisión, Inspección)
2. API REST como fuente única de verdad, consumible por Q Order u otros sistemas
3. Frontend: gestión y seguimiento de órdenes por estado
4. Integración con Contrato (fecha reconexión, estado domiciliado)

---

## Aceptación (Definition of Done)

- [ ] Migración con modelo `Orden` y `SeguimientoOrden` aplicada
- [ ] CRUD completo: `GET/POST /ordenes`, `GET/PATCH /ordenes/:id`
- [ ] `GET /ordenes/:id/seguimientos`, `POST /ordenes/:id/seguimientos`
- [ ] Endpoint público/semi-público para Q Order: `GET /ordenes/servicio/contrato/:contratoId`
- [ ] `PATCH /ordenes/:id/estado` actualiza estado y crea seguimiento automático
- [ ] Frontend `Ordenes.tsx` con listado + filtros + kanban por estado + formulario de creación
- [ ] Al crear orden de Reconexión, actualizar `contrato.fechaReconexionPrevista`

---

## Paso 1: Migración Prisma

Agregar a `backend/prisma/schema.prisma`:

```prisma
model Orden {
  id                  String   @id @default(cuid())
  contratoId          String   @map("contrato_id")
  tipo                String
  // Corte | Instalacion | Reconexion | Revision | Inspeccion | Mantenimiento
  estado              String   @default("Pendiente")
  // Pendiente | Asignada | EnProceso | Ejecutada | Cancelada | Rechazada
  prioridad           String   @default("Normal")  // Normal | Alta | Urgente
  fechaSolicitud      DateTime @default(now()) @map("fecha_solicitud")
  fechaProgramada     DateTime? @map("fecha_programada")
  fechaEjecucion      DateTime? @map("fecha_ejecucion")
  operadorId          String?  @map("operador_id")
  notas               String?
  datosCampo          Json?    @map("datos_campo")  // fotos, lecturas, observaciones
  externalRef         String?  @map("external_ref")  // referencia en Q Order u otro sistema
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  contrato            Contrato @relation(fields: [contratoId], references: [id], onDelete: Restrict)
  seguimientos        SeguimientoOrden[]

  @@index([contratoId])
  @@index([estado])
  @@index([tipo])
  @@index([fechaProgramada])
  @@map("ordenes")
}

model SeguimientoOrden {
  id        String   @id @default(cuid())
  ordenId   String   @map("orden_id")
  fecha     DateTime @default(now())
  estadoAnterior String? @map("estado_anterior")
  estadoNuevo    String? @map("estado_nuevo")
  nota      String?
  usuario   String?
  createdAt DateTime @default(now()) @map("created_at")

  orden     Orden    @relation(fields: [ordenId], references: [id], onDelete: Cascade)

  @@index([ordenId])
  @@map("seguimientos_orden")
}
```

Agregar relación inversa en `Contrato`:
```prisma
// En model Contrato agregar:
ordenes   Orden[]
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_ordenes`

---

## Paso 2: Backend — módulo `ordenes`

Crear carpeta `backend/src/modules/ordenes/` con los siguientes archivos:

### `ordenes.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdenesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    contratoId?: string;
    tipo?: string;
    estado?: string;
    operadorId?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
      ...(params.operadorId && { operadorId: params.operadorId }),
      ...(params.desde && params.hasta && {
        fechaProgramada: {
          gte: new Date(params.desde),
          lte: new Date(params.hasta),
        },
      }),
    };
    const [data, total] = await Promise.all([
      this.prisma.orden.findMany({
        where,
        include: {
          contrato: { select: { id: true, nombre: true, direccion: true, zonaId: true } },
          seguimientos: { orderBy: { fecha: 'desc' }, take: 1 },
        },
        orderBy: { fechaSolicitud: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.orden.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const orden = await this.prisma.orden.findUnique({
      where: { id },
      include: {
        contrato: { select: { id: true, nombre: true, direccion: true, estado: true, zonaId: true } },
        seguimientos: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    return orden;
  }

  async create(dto: {
    contratoId: string;
    tipo: string;
    prioridad?: string;
    fechaProgramada?: string;
    operadorId?: string;
    notas?: string;
    externalRef?: string;
  }) {
    // Crear orden
    const orden = await this.prisma.orden.create({
      data: {
        contratoId: dto.contratoId,
        tipo: dto.tipo,
        prioridad: dto.prioridad ?? 'Normal',
        fechaProgramada: dto.fechaProgramada ? new Date(dto.fechaProgramada) : null,
        operadorId: dto.operadorId ?? null,
        notas: dto.notas ?? null,
        externalRef: dto.externalRef ?? null,
      },
      include: { contrato: { select: { id: true, nombre: true } }, seguimientos: true },
    });

    // Si es Reconexión, actualizar fechaReconexionPrevista en el contrato
    if (dto.tipo === 'Reconexion' && dto.fechaProgramada) {
      await this.prisma.contrato.update({
        where: { id: dto.contratoId },
        data: { fechaReconexionPrevista: dto.fechaProgramada },
      });
    }

    return orden;
  }

  async updateEstado(id: string, nuevoEstado: string, nota?: string, usuario?: string) {
    const orden = await this.findOne(id);
    const estadoAnterior = orden.estado;

    if (estadoAnterior === nuevoEstado)
      throw new BadRequestException('El estado no cambia');

    const updated = await this.prisma.orden.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === 'Ejecutada' && { fechaEjecucion: new Date() }),
        seguimientos: {
          create: {
            estadoAnterior,
            estadoNuevo: nuevoEstado,
            nota: nota ?? null,
            usuario: usuario ?? null,
          },
        },
      },
      include: { seguimientos: { orderBy: { fecha: 'desc' }, take: 1 } },
    });

    return updated;
  }

  async actualizarDatosCampo(id: string, datosCampo: object) {
    await this.findOne(id);
    return this.prisma.orden.update({
      where: { id },
      data: { datosCampo },
    });
  }

  async addSeguimiento(ordenId: string, data: { nota: string; usuario?: string; estadoNuevo?: string }) {
    await this.findOne(ordenId);
    return this.prisma.seguimientoOrden.create({
      data: {
        ordenId,
        nota: data.nota,
        usuario: data.usuario ?? null,
        estadoNuevo: data.estadoNuevo ?? null,
      },
    });
  }

  // Endpoint para Q Order u otros sistemas externos (req 19)
  async getByContrato(contratoId: string) {
    return this.prisma.orden.findMany({
      where: { contratoId },
      include: { seguimientos: { orderBy: { fecha: 'desc' }, take: 3 } },
      orderBy: { fechaSolicitud: 'desc' },
    });
  }

  // Estadísticas para dashboard
  async getEstadisticas() {
    const [porEstado, porTipo] = await Promise.all([
      this.prisma.orden.groupBy({ by: ['estado'], _count: { id: true } }),
      this.prisma.orden.groupBy({ by: ['tipo'], _count: { id: true } }),
    ]);
    return { porEstado, porTipo };
  }
}
```

### `ordenes.controller.ts`

```typescript
import {
  Controller, Get, Post, Patch, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OrdenesService } from './ordenes.service';

@Controller('ordenes')
@UseGuards(JwtAuthGuard)
export class OrdenesController {
  constructor(private readonly service: OrdenesService) {}

  @Get()
  findAll(
    @Query('contratoId') contratoId?: string,
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
    @Query('operadorId') operadorId?: string,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.service.findAll({ contratoId, tipo, estado, operadorId, desde, hasta, page, limit });
  }

  @Get('estadisticas')
  getEstadisticas() { return this.service.getEstadisticas(); }

  // Endpoint público para sistemas externos (req 19)
  @Get('servicio/contrato/:contratoId')
  getByContrato(@Param('contratoId') contratoId: string) {
    return this.service.getByContrato(contratoId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  create(@Body() body: {
    contratoId: string; tipo: string; prioridad?: string;
    fechaProgramada?: string; operadorId?: string; notas?: string; externalRef?: string;
  }) {
    return this.service.create(body);
  }

  @Patch(':id/estado')
  updateEstado(
    @Param('id') id: string,
    @Body() body: { estado: string; nota?: string; usuario?: string },
  ) {
    return this.service.updateEstado(id, body.estado, body.nota, body.usuario);
  }

  @Patch(':id/datos-campo')
  updateDatosCampo(@Param('id') id: string, @Body() body: object) {
    return this.service.actualizarDatosCampo(id, body);
  }

  @Get(':id/seguimientos')
  getSeguimientos(@Param('id') id: string) {
    return this.service.findOne(id).then(o => o.seguimientos);
  }

  @Post(':id/seguimientos')
  addSeguimiento(
    @Param('id') id: string,
    @Body() body: { nota: string; usuario?: string; estadoNuevo?: string },
  ) {
    return this.service.addSeguimiento(id, body);
  }
}
```

### `ordenes.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { OrdenesController } from './ordenes.controller';
import { OrdenesService } from './ordenes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [OrdenesController],
  providers: [OrdenesService],
  exports: [OrdenesService],
})
export class OrdenesModule {}
```

Registrar `OrdenesModule` en `backend/src/app.module.ts`.

---

## Paso 3: Frontend — `frontend/src/pages/Ordenes.tsx` (nueva página)

```typescript
// Crear nuevo archivo: frontend/src/pages/Ordenes.tsx
//
// Layout principal con 2 vistas (toggle vista):
//
// Vista 1: "Lista" — tabla con filtros
//   - Filtros: Tipo (Corte/Instalación/Reconexión/Revisión/Inspección),
//     Estado (Pendiente/Asignada/EnProceso/Ejecutada/Cancelada),
//     Fecha desde/hasta, Operador
//   - Columnas: Folio/ID, Contrato, Cliente, Tipo, Estado (badge color),
//     Prioridad, Fecha Programada, Operador, Última nota
//   - Acciones: Ver detalle, Cambiar estado, Agregar nota
//
// Vista 2: "Kanban" — columnas por estado
//   - Columnas: Pendiente | Asignada | En Proceso | Ejecutada
//   - Cards con: contrato, tipo, prioridad, fecha programada
//   - Drag entre columnas actualiza estado (llamar PATCH /ordenes/:id/estado)
//
// Panel lateral / Modal "Nueva Orden":
//   - Búsqueda de contrato (autocomplete)
//   - Tipo (selector)
//   - Prioridad
//   - Fecha programada (datepicker)
//   - Notas
//
// Panel detalle de orden:
//   - Info completa del contrato
//   - Timeline de seguimientos (estado anterior → nuevo, fecha, usuario, nota)
//   - Formulario "Agregar seguimiento"
//   - Botones de cambio de estado
```

Agregar en `frontend/src/api/`:

```typescript
// Crear frontend/src/api/ordenes.ts
import { api } from './client';

export const getOrdenes = (params?: Record<string, string | number>) =>
  api.get('/ordenes', { params }).then(r => r.data);

export const getOrden = (id: string) =>
  api.get(`/ordenes/${id}`).then(r => r.data);

export const createOrden = (data: object) =>
  api.post('/ordenes', data).then(r => r.data);

export const updateEstadoOrden = (id: string, estado: string, nota?: string) =>
  api.patch(`/ordenes/${id}/estado`, { estado, nota }).then(r => r.data);

export const addSeguimientoOrden = (id: string, data: object) =>
  api.post(`/ordenes/${id}/seguimientos`, data).then(r => r.data);

export const getOrdenesByContrato = (contratoId: string) =>
  api.get(`/ordenes/servicio/contrato/${contratoId}`).then(r => r.data);
```

Registrar la nueva ruta en `frontend/src/App.tsx`:

```typescript
// Agregar import
import Ordenes from './pages/Ordenes';

// Agregar en el router:
<Route path="/ordenes" element={<AppLayout><Ordenes /></AppLayout>} />
```

Agregar enlace de navegación en `AppLayout.tsx` o sidebar.

---

## Notas importantes para el ejecutor

1. **Q Order (req 18):** El endpoint `GET /ordenes/servicio/contrato/:contratoId` está diseñado como endpoint de servicio. Si Q Order continúa operando, debe apuntar a este endpoint para consultar y actualizar estados. Documentar la URL base y autenticación para el equipo de Q Order.

2. **`datosCampo` (JSON):** Usar para capturar datos de campo flexibles: foto_url, lectura_en_campo, observaciones_tecnico, firma_cliente, etc. El schema JSON se define según necesidades operativas.

3. **Guardrails — NO modificar:**
   - Campos `fechaReconexionPrevista` y `domiciliado` en Contrato — ya existen, solo se usan
   - Módulos existentes (auth, portal, quejas)

---

## Validación

```bash
# 1. Migración
cd backend && npx prisma migrate dev --name add_ordenes

# 2. Compilar y probar
npm run build

# Crear orden de prueba
curl -X POST http://localhost:3001/ordenes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId": "<id>", "tipo": "Reconexion", "prioridad": "Alta", "fechaProgramada": "2026-03-01"}'

# Cambiar estado
curl -X PATCH http://localhost:3001/ordenes/<id>/estado \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"estado": "Ejecutada", "nota": "Reconexión completada", "usuario": "Juan"}'

# Endpoint externo (sin auth o con API key separada)
curl http://localhost:3001/ordenes/servicio/contrato/<contratoId>
```
