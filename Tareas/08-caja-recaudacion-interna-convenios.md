# Tarea 08 — Caja, Recaudación Interna, Parcialidades y Convenios

**PRD reqs:** 43–46  
**Sección PRD:** "Caja, recaudación interna, parcialidades y convenios"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencia:** Tarea 02 (modelo base de Pago) debe estar aplicada primero

---

## Contexto y estado actual

### Schema Prisma actual (verificado)

```prisma
model Recibo {
  id               String
  contratoId       String
  timbradoId       String
  saldoVigente     Decimal
  saldoVencido     Decimal
  fechaVencimiento String
  parcialidades    Int  @default(1)
  impreso          Boolean @default(false)
  // Relaciones: contrato, timbrado, pagos[]
}

model Pago {
  id         String
  contratoId String
  reciboId   String?
  timbradoId String?
  monto      Decimal
  fecha      String
  tipo       String   // Efectivo | Transferencia | Tarjeta | SPEI | OXXO | CoDi | WEB
  concepto   String
  origen     String   @default("nativo")
}
```

### Stubs actuales

- `backend/src/modules/recibos/recibos.controller.ts` — `GET /recibos` retorna `[]`
- `backend/src/modules/pagos/pagos.controller.ts` — `GET /pagos` retorna `[]`
- `frontend/src/pages/Recibos.tsx` — stub sin conexión a backend
- No existen módulos `Convenio`, `SesionCaja`, `Anticipo`

---

## Objetivo

1. Implementar `RecibosService` y `PagosService` con lógica real
2. Apertura/cierre de caja con anticipos (req 43)
3. Registro de pago nativo con preview antes de imprimir recibo (req 44)
4. Convenios de pago: múltiples facturas, parcialidades, saldo a favor (req 45)
5. Mensajes globales e individuales en recibos (req 46)

---

## Aceptación (Definition of Done)

- [ ] Migración con `SesionCaja`, `Anticipo`, `Convenio`, `MensajeRecibo` aplicada
- [ ] `POST /caja/abrir` y `POST /caja/cerrar` con resumen de la sesión
- [ ] `GET /recibos?contratoId=&estado=` lista recibos con filtros
- [ ] `POST /pagos` crea pago nativo con validación de recibo
- [ ] `GET /pagos/preview/:reciboId` devuelve datos para preview antes de imprimir
- [ ] `POST /convenios` crea convenio con múltiples facturas y plan de parcialidades
- [ ] `POST /convenios/:id/parcialidades/aplicar` aplica una parcialidad al convenio
- [ ] `GET/POST /mensajes-recibo` CRUD de mensajes globales e individuales
- [ ] Frontend `Recibos.tsx` con modal preview + mensajes + saldos
- [ ] Frontend nueva página `Convenios.tsx`

---

## Paso 1: Migración Prisma

```prisma
// Agregar a backend/prisma/schema.prisma

model SesionCaja {
  id              String   @id @default(cuid())
  usuarioId       String   @map("usuario_id")
  apertura        DateTime @default(now())
  cierre          DateTime?
  montoInicial    Decimal  @default(0) @db.Decimal(10, 2) @map("monto_inicial")
  totalCobrado    Decimal  @default(0) @db.Decimal(10, 2) @map("total_cobrado")
  totalEfectivo   Decimal  @default(0) @db.Decimal(10, 2) @map("total_efectivo")
  totalTransf     Decimal  @default(0) @db.Decimal(10, 2) @map("total_transf")
  totalTarjeta    Decimal  @default(0) @db.Decimal(10, 2) @map("total_tarjeta")
  totalAnticipo   Decimal  @default(0) @db.Decimal(10, 2) @map("total_anticipo")
  estado          String   @default("Abierta")  // Abierta | Cerrada
  resumen         Json?
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  anticipos       Anticipo[]

  @@index([usuarioId])
  @@index([estado])
  @@map("sesiones_caja")
}

model Anticipo {
  id          String   @id @default(cuid())
  contratoId  String   @map("contrato_id")
  sesionId    String?  @map("sesion_id")
  monto       Decimal  @db.Decimal(10, 2)
  aplicado    Boolean  @default(false)
  pagoId      String?  @map("pago_id")  // pago al que se aplicó
  concepto    String?
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  sesion      SesionCaja? @relation(fields: [sesionId], references: [id], onDelete: SetNull)

  @@index([contratoId])
  @@index([aplicado])
  @@map("anticipos")
}

model Convenio {
  id                String   @id @default(cuid())
  contratoId        String   @map("contrato_id")
  tipo              String   @default("Parcialidades")
  // Parcialidades | SaldoAFavor | GraciaTotal
  numParcialidades  Int      @map("num_parcialidades")
  montoParcialidad  Decimal  @db.Decimal(10, 2) @map("monto_parcialidad")
  montoTotal        Decimal  @db.Decimal(10, 2) @map("monto_total")
  montoPagado       Decimal  @default(0) @db.Decimal(10, 2) @map("monto_pagado")
  facturas          Json
  // Array de { timbradoId, monto }
  estado            String   @default("Activo")
  // Activo | Completado | Cancelado | Vencido
  parcialidadesRestantes Int @default(0) @map("parcialidades_restantes")
  saldoAFavor       Decimal  @default(0) @db.Decimal(10, 2) @map("saldo_a_favor")
  fechaInicio       DateTime @default(now()) @map("fecha_inicio")
  fechaVencimiento  DateTime? @map("fecha_vencimiento")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  contrato          Contrato @relation(fields: [contratoId], references: [id], onDelete: Restrict)
  pagos             Pago[]

  @@index([contratoId])
  @@index([estado])
  @@map("convenios")
}

model MensajeRecibo {
  id          String   @id @default(cuid())
  tipo        String   // Global | Individual
  contratoId  String?  @map("contrato_id")
  // null = global, contratoId = individual
  mensaje     String
  activo      Boolean  @default(true)
  vigenciaDesde DateTime? @map("vigencia_desde")
  vigenciaHasta DateTime? @map("vigencia_hasta")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@index([tipo])
  @@index([contratoId])
  @@map("mensajes_recibo")
}
```

Agregar relaciones inversas:
```prisma
// En model Contrato:
convenios   Convenio[]
anticipos   Anticipo[]  // si se necesita acceso directo

// En model Pago (agregar campo):
convenioId  String?  @map("convenio_id")
convenio    Convenio? @relation(fields: [convenioId], references: [id], onDelete: SetNull)
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_caja_convenios`

---

## Paso 2: Backend — módulo `caja`

Crear `backend/src/modules/caja/`:

### `caja.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CajaService {
  constructor(private readonly prisma: PrismaService) {}

  async abrir(usuarioId: string, montoInicial: number = 0) {
    // Verificar que no haya sesión abierta para este usuario
    const sesionAbierta = await this.prisma.sesionCaja.findFirst({
      where: { usuarioId, estado: 'Abierta' },
    });
    if (sesionAbierta) throw new BadRequestException('Ya tienes una sesión de caja abierta');

    return this.prisma.sesionCaja.create({
      data: { usuarioId, montoInicial },
    });
  }

  async cerrar(sesionId: string) {
    const sesion = await this.prisma.sesionCaja.findUnique({ where: { id: sesionId } });
    if (!sesion) throw new NotFoundException('Sesión no encontrada');
    if (sesion.estado === 'Cerrada') throw new BadRequestException('La sesión ya está cerrada');

    // Calcular totales de la sesión
    const pagos = await this.prisma.pago.findMany({
      where: {
        createdAt: { gte: sesion.apertura },
        origen: 'nativo',
      },
      select: { monto: true, tipo: true },
    });

    const totales = pagos.reduce((acc, p) => {
      const monto = Number(p.monto);
      acc.totalCobrado += monto;
      if (p.tipo === 'Efectivo') acc.totalEfectivo += monto;
      else if (['Transferencia', 'SPEI'].includes(p.tipo)) acc.totalTransf += monto;
      else if (p.tipo === 'Tarjeta') acc.totalTarjeta += monto;
      return acc;
    }, { totalCobrado: 0, totalEfectivo: 0, totalTransf: 0, totalTarjeta: 0 });

    const anticiposAplicados = await this.prisma.anticipo.aggregate({
      where: { sesionId, aplicado: true },
      _sum: { monto: true },
    });

    return this.prisma.sesionCaja.update({
      where: { id: sesionId },
      data: {
        estado: 'Cerrada',
        cierre: new Date(),
        ...totales,
        totalAnticipo: Number(anticiposAplicados._sum.monto ?? 0),
        resumen: {
          totalPagos: pagos.length,
          desglose: pagos.reduce((acc, p) => {
            acc[p.tipo] = (acc[p.tipo] ?? 0) + Number(p.monto);
            return acc;
          }, {} as Record<string, number>),
        },
      },
    });
  }

  async getSesionActiva(usuarioId: string) {
    return this.prisma.sesionCaja.findFirst({
      where: { usuarioId, estado: 'Abierta' },
      include: {
        anticipos: { where: { aplicado: false }, select: { id: true, contratoId: true, monto: true } },
      },
    });
  }
}
```

---

## Paso 3: Backend — `RecibosService` y `PagosService`

### Reemplazar `backend/src/modules/recibos/recibos.controller.ts`

```typescript
import {
  Controller, Get, Post, Param, Query, Body,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('recibos')
@UseGuards(JwtAuthGuard)
export class RecibosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('contratoId') contratoId?: string,
    @Query('impreso') impreso?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const where = {
      ...(contratoId && { contratoId }),
      ...(impreso !== undefined && { impreso: impreso === 'true' }),
    };
    const [data, total] = await Promise.all([
      this.prisma.recibo.findMany({
        where,
        include: {
          timbrado: { select: { uuid: true, total: true, estado: true, periodo: true } },
          contrato: { select: { nombre: true, estado: true } },
          pagos: { select: { id: true, monto: true, fecha: true, tipo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.recibo.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  @Get('preview/:reciboId')
  async getPreview(@Param('reciboId') reciboId: string) {
    const recibo = await this.prisma.recibo.findUnique({
      where: { id: reciboId },
      include: {
        contrato: { select: { id: true, nombre: true, rfc: true, direccion: true, tipoServicio: true } },
        timbrado: true,
        pagos: { orderBy: { fecha: 'desc' } },
      },
    });
    if (!recibo) return null;

    // Saldo pendiente
    const pagado = recibo.pagos.reduce((s, p) => s + Number(p.monto), 0);
    const pendiente = Number(recibo.saldoVigente) + Number(recibo.saldoVencido) - pagado;

    // Mensajes para el recibo
    const mensajes = await this.prisma.mensajeRecibo.findMany({
      where: {
        activo: true,
        OR: [{ tipo: 'Global' }, { tipo: 'Individual', contratoId: recibo.contratoId }],
        OR: [
          { vigenciaDesde: null },
          { vigenciaDesde: { lte: new Date() } },
        ],
        OR: [
          { vigenciaHasta: null },
          { vigenciaHasta: { gte: new Date() } },
        ],
      },
      orderBy: [{ tipo: 'asc' }, { createdAt: 'asc' }],
    });

    return { recibo, pendiente, mensajes };
  }

  @Post(':id/marcar-impreso')
  async marcarImpreso(@Param('id') id: string) {
    return this.prisma.recibo.update({ where: { id }, data: { impreso: true } });
  }
}
```

### Reemplazar `backend/src/modules/pagos/pagos.controller.ts`

```typescript
import {
  Controller, Get, Post, Param, Query, Body,
  UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('pagos')
@UseGuards(JwtAuthGuard)
export class PagosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('contratoId') contratoId?: string,
    @Query('origen') origen?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const where = {
      ...(contratoId && { contratoId }),
      ...(origen && { origen }),
    };
    const [data, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        include: {
          contrato: { select: { nombre: true } },
          recibo: { select: { id: true, saldoVigente: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pago.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  @Post()
  async crear(@Body() body: {
    contratoId: string;
    reciboId?: string;
    timbradoId?: string;
    convenioId?: string;
    monto: number;
    tipo: string;
    concepto?: string;
    fecha?: string;
  }) {
    return this.prisma.pago.create({
      data: {
        contratoId: body.contratoId,
        reciboId: body.reciboId ?? null,
        timbradoId: body.timbradoId ?? null,
        convenioId: body.convenioId ?? null,
        monto: body.monto,
        fecha: body.fecha ?? new Date().toISOString().substring(0, 10),
        tipo: body.tipo,
        concepto: body.concepto ?? 'Pago en caja',
        origen: 'nativo',
      },
      include: { recibo: true },
    });
  }
}
```

---

## Paso 4: Backend — módulo `convenios`

Crear `backend/src/modules/convenios/`:

### `convenios.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConveniosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { contratoId?: string; estado?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.estado && { estado: params.estado }),
    };
    const [data, total] = await Promise.all([
      this.prisma.convenio.findMany({
        where,
        include: { contrato: { select: { nombre: true, estado: true } }, pagos: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.convenio.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async create(dto: {
    contratoId: string;
    tipo?: string;
    numParcialidades: number;
    facturas: { timbradoId: string; monto: number }[];
    fechaVencimiento?: string;
  }) {
    const montoTotal = dto.facturas.reduce((s, f) => s + f.monto, 0);
    const montoParcialidad = Math.ceil(montoTotal / dto.numParcialidades * 100) / 100;

    return this.prisma.convenio.create({
      data: {
        contratoId: dto.contratoId,
        tipo: dto.tipo ?? 'Parcialidades',
        numParcialidades: dto.numParcialidades,
        montoParcialidad,
        montoTotal,
        parcialidadesRestantes: dto.numParcialidades,
        facturas: dto.facturas,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
      },
      include: { contrato: { select: { nombre: true } } },
    });
  }

  async aplicarParcialidad(convenioId: string, monto: number, tipo: string) {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId } });
    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    if (convenio.estado !== 'Activo') throw new BadRequestException('El convenio no está activo');

    // Crear pago
    const pago = await this.prisma.pago.create({
      data: {
        contratoId: convenio.contratoId,
        convenioId,
        monto,
        fecha: new Date().toISOString().substring(0, 10),
        tipo,
        concepto: `Parcialidad convenio ${convenioId.substring(0, 8)}`,
        origen: 'nativo',
      },
    });

    const nuevoPagado = Number(convenio.montoPagado) + monto;
    const nuevasRestantes = convenio.parcialidadesRestantes - 1;
    const saldoAFavor = Math.max(0, nuevoPagado - Number(convenio.montoTotal));
    const nuevoEstado = nuevasRestantes <= 0 || nuevoPagado >= Number(convenio.montoTotal)
      ? 'Completado'
      : 'Activo';

    await this.prisma.convenio.update({
      where: { id: convenioId },
      data: {
        montoPagado: nuevoPagado,
        parcialidadesRestantes: Math.max(0, nuevasRestantes),
        saldoAFavor,
        estado: nuevoEstado,
      },
    });

    return { pagoId: pago.id, estado: nuevoEstado, saldoAFavor, parcialidadesRestantes: Math.max(0, nuevasRestantes) };
  }

  async cancelar(convenioId: string) {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId } });
    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    if (convenio.estado === 'Completado') throw new BadRequestException('No se puede cancelar un convenio completado');
    return this.prisma.convenio.update({ where: { id: convenioId }, data: { estado: 'Cancelado' } });
  }
}
```

### `convenios.controller.ts`

```typescript
import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConveniosService } from './convenios.service';

@Controller('convenios')
@UseGuards(JwtAuthGuard)
export class ConveniosController {
  constructor(private readonly service: ConveniosService) {}

  @Get()
  findAll(
    @Query('contratoId') contratoId?: string,
    @Query('estado') estado?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) { return this.service.findAll({ contratoId, estado, page, limit }); }

  @Post()
  create(@Body() body: object) { return this.service.create(body as any); }

  @Post(':id/parcialidades/aplicar')
  aplicar(
    @Param('id') id: string,
    @Body() body: { monto: number; tipo: string },
  ) { return this.service.aplicarParcialidad(id, body.monto, body.tipo); }

  @Post(':id/cancelar')
  cancelar(@Param('id') id: string) { return this.service.cancelar(id); }
}
```

### Mensajes de recibo (agregar a RecibosController o módulo separado)

```typescript
// GET /mensajes-recibo — lista mensajes activos
// POST /mensajes-recibo — crear mensaje global o individual
// PATCH /mensajes-recibo/:id — activar/desactivar, cambiar vigencia
```

---

## Paso 5: Frontend

### `frontend/src/pages/Recibos.tsx`

```typescript
// Reemplazar stub con:
//
// Sección 1: "Buscar Recibo"
//   - Input buscar por contrato (autocomplete con /contratos/search)
//   - Tabla de recibos del contrato: periodo, total, vencimiento, saldo pendiente, estado
//
// Por cada recibo:
//   - Botón "Preview" → abre modal con:
//     - Datos del contrato (nombre, RFC, dirección)
//     - Detalle de la factura (periodo, subtotal, IVA, total)
//     - Saldo pendiente
//     - Mensajes del recibo (globales + individuales)
//     - Historial de pagos del recibo
//     - Botón "Confirmar pago" → abre sub-modal con:
//       - Monto, tipo de pago (Efectivo/Tarjeta/Transferencia), fecha
//       - POST /pagos
//     - Botón "Imprimir" → POST /recibos/:id/marcar-impreso
//
// Sección 2: "Caja" (visible para usuarios con sesión activa)
//   - Estado de caja: Abierta/Cerrada, usuario, hora apertura
//   - Totales en tiempo real: cobrado, efectivo, transferencia, tarjeta
//   - Botón "Abrir caja" / "Cerrar caja"
//
// Sección 3: "Mensajes"
//   - Lista de mensajes activos globales e individuales
//   - CRUD básico (admin)
```

### `frontend/src/pages/Convenios.tsx` (nueva página)

```typescript
// Crear nuevo archivo:
//
// Sección 1: Lista de convenios con filtros (estado, contrato)
//   - Tabla: contrato, tipo, parcialidades, total, pagado, restante, estado
//   - Badge color por estado: Activo=azul, Completado=verde, Cancelado=rojo
//
// Sección 2: "Nuevo Convenio" (modal/panel)
//   - Buscar contrato
//   - Seleccionar facturas pendientes del contrato (checkboxes)
//   - Configurar: número de parcialidades, fecha vencimiento
//   - Preview: monto por parcialidad automático
//   - POST /convenios
//
// Sección 3: Detalle de convenio
//   - Plan de parcialidades: número, monto, estado (pagado/pendiente), fecha
//   - Historial de pagos
//   - Botón "Aplicar parcialidad" → abre modal: monto, tipo pago
//   - POST /convenios/:id/parcialidades/aplicar
```

---

## Notas importantes para el ejecutor

1. **Dependencia T02:** El modelo `Pago` necesita campo `convenioId`. Si T02 ya se ejecutó y `PagoExterno` ya existe, agregar solo el campo `convenioId` al modelo `Pago` en esta migración.

2. **Módulo de recibos:** El `RecibosController` en esta tarea inyecta directamente `PrismaService` para simplicidad. Si el equipo prefiere un `RecibosService`, extraerlo sin cambiar el comportamiento.

3. **Sesión de caja:** La sesión está ligada al usuario (`usuarioId` del JWT). El módulo `CajaService` requiere que `JwtAuthGuard` inyecte el usuario en el request — usar `@Request() req` para obtener `req.user.id`.

4. **Saldo a favor (req 45):** Al completar un convenio con exceso de pago, `saldoAFavor` se calcula y almacena. La aplicación de ese saldo a futuros recibos debe resolverse en el siguiente sprint — en esta tarea solo se calcula y almacena.

5. **Guardrails — NO modificar:**
   - Models `Pago`, `Recibo`, `Timbrado` existentes — solo AGREGAR campos opcionales
   - Implementación de `portal.service.ts` (usa `Pago` y `Recibo` existentes)

---

## Modificaciones PRD 2026-04-06

> Los siguientes cambios son requeridos por el PRD 2026-04-06 y **ya están aplicados en el schema Prisma**.

### MOD-T08-1: Factura de contratación vinculada a convenio (Req 8)

**Estado anterior:** Convenio existe con saldo y parcialidades. No hay vínculo explícito con factura de contratación.  
**Cambio:** Campos para vincular convenio con factura de origen.

Campos agregados al schema:
```prisma
origenTipo            String?  @map("origen_tipo") // adeudo_vencido | corte | reconexion
facturaOrigenId       String?  @map("factura_origen_id")
porcentajeAnticipo    Decimal? @db.Decimal(5, 2) @map("porcentaje_anticipo")
montoAnticipo         Decimal? @db.Decimal(10, 2) @map("monto_anticipo")
anticipoPagado        Boolean  @default(false) @map("anticipo_pagado")
datosConvenio         Json?    @map("datos_convenio")
checklistInterna      Json?    @map("checklist_interna")
```

- [ ] Agregar lógica: al aprobar contratación con pago diferido → crear Convenio automáticamente vinculado a factura de contratación
- [ ] Validar porcentaje de anticipo configurable por tipo de contratación
- [ ] Frontend: mostrar origen del convenio en detalle (badge: Contratación | Adeudo | Reconexión)
- [ ] Frontend: checklist interna del convenio visible para supervisores

### Impacto en ConveniosService

```typescript
// Agregar en convenios.service.ts:
async crearDesdeContratacion(dto: {
  contratoId: string;
  facturaOrigenId: string;
  montoTotal: number;
  numParcialidades: number;
  porcentajeAnticipo?: number;
}) {
  const montoAnticipo = dto.porcentajeAnticipo
    ? dto.montoTotal * (dto.porcentajeAnticipo / 100)
    : 0;
  return this.prisma.convenio.create({
    data: {
      contratoId: dto.contratoId,
      tipo: 'Parcialidades',
      origenTipo: 'contratacion',
      facturaOrigenId: dto.facturaOrigenId,
      numParcialidades: dto.numParcialidades,
      montoTotal: dto.montoTotal,
      montoParcialidad: (dto.montoTotal - montoAnticipo) / dto.numParcialidades,
      parcialidadesRestantes: dto.numParcialidades,
      porcentajeAnticipo: dto.porcentajeAnticipo ?? null,
      montoAnticipo,
      facturas: [{ timbradoId: dto.facturaOrigenId, monto: dto.montoTotal }],
    },
  });
}
```

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_caja_convenios
npm run build

# Abrir caja
curl -X POST http://localhost:3001/caja/abrir \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"montoInicial": 500}'

# Registrar pago nativo
curl -X POST http://localhost:3001/pagos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId": "<id>", "monto": 450, "tipo": "Efectivo", "concepto": "Pago mensualidad"}'

# Preview de recibo
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/recibos/preview/<reciboId>

# Crear convenio
curl -X POST http://localhost:3001/convenios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId":"<id>","numParcialidades":3,"facturas":[{"timbradoId":"<id>","monto":1500}]}'

# Aplicar parcialidad
curl -X POST http://localhost:3001/convenios/<id>/parcialidades/aplicar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"monto": 500, "tipo": "Efectivo"}'

# Cerrar caja
curl -X POST http://localhost:3001/caja/cerrar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"sesionId": "<id>"}'
```
