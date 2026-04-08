# Tarea 09 — Monitoreo, Conciliaciones y Operación

**PRD reqs:** 47–48  
**Sección PRD:** "Monitoreo, conciliaciones y operación"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencias:** Tareas 02, 04, 05 deben estar aplicadas (sus modelos se referencian aquí)

---

## Contexto y objetivo

El PRD requiere:

- **Req 47**: Monitoreo de procesos críticos (ETL pagos externos, scripts GIS, generación de pólizas, validación de lecturas) con alertas tempranas ante fallas.
- **Req 48**: Conciliaciones periódicas entre sistemas (padrón vs GIS, recaudación vs facturación, facturación vs contabilidad) para detectar y corregir desfases.

Actualmente no existe ningún módulo de monitoreo ni un dashboard de conciliación. Todos los procesos críticos (ETL, GIS, contabilidad) se ejecutan de forma "fire and forget" sin registro centralizado de estado.

---

## Aceptación (Definition of Done)

- [ ] Migración con `LogProceso` y `ConciliacionReporte` aplicada
- [ ] `POST /monitoreo/procesos/registrar` — registra inicio/fin de cualquier proceso con estado
- [ ] `GET /monitoreo/procesos` — lista registros con filtros (tipo, estado, fecha)
- [ ] `GET /monitoreo/dashboard` — resumen de salud del sistema: últimas 24h por tipo
- [ ] `POST /conciliaciones/ejecutar` — lanza una conciliación puntual (tipo configurable)
- [ ] `GET /conciliaciones` — lista histórico de conciliaciones con diferencias detectadas
- [ ] Frontend `Monitoreo.tsx` — dashboard en tiempo real con tarjetas por proceso y tabla de conciliaciones
- [ ] Integración de `LogProceso.create()` en los servicios de T02 (ETL pagos), T04 (contabilidad), T05 (GIS)

---

## Paso 1: Migración Prisma

```prisma
// Agregar a backend/prisma/schema.prisma

model LogProceso {
  id          String   @id @default(cuid())
  tipo        String
  // ETL_PAGOS | GIS_EXPORT | POLIZA_COBROS | POLIZA_FACTURACION | VALIDACION_LECTURAS | TIMBRADO | OTRO
  subTipo     String?  @map("sub_tipo")
  // Ej: nombre del banco para ETL, periodo para pólizas
  estado      String   @default("Iniciado")
  // Iniciado | Procesando | Completado | Error | Advertencia
  inicio      DateTime @default(now())
  fin         DateTime?
  duracionMs  Int?     @map("duracion_ms")
  registros   Int      @default(0)
  // Cantidad procesada (filas, contratos, pagos, etc.)
  errores     Int      @default(0)
  advertencias Int     @default(0)
  detalle     Json?
  // Payload libre: { banco, archivo, rechazados, ... }
  errorMsg    String?  @map("error_msg")
  usuarioId   String?  @map("usuario_id")
  createdAt   DateTime @default(now()) @map("created_at")

  @@index([tipo])
  @@index([estado])
  @@index([inicio])
  @@map("log_procesos")
}

model ConciliacionReporte {
  id              String   @id @default(cuid())
  tipo            String
  // PADRON_VS_GIS | RECAUDACION_VS_FACTURACION | FACTURACION_VS_CONTABILIDAD
  periodo         String
  // YYYY-MM para conciliaciones mensuales
  ejecutadoEn     DateTime @default(now()) @map("ejecutado_en")
  totalSistemaA   Int      @map("total_sistema_a")
  totalSistemaB   Int      @map("total_sistema_b")
  coincidencias   Int
  diferencias     Int
  montoSistemaA   Decimal? @db.Decimal(14, 2) @map("monto_sistema_a")
  montoSistemaB   Decimal? @db.Decimal(14, 2) @map("monto_sistema_b")
  montoDiferencia Decimal? @db.Decimal(14, 2) @map("monto_diferencia")
  detalles        Json?
  // Array de { entidad, campoA, campoB, diferencia }
  estado          String   @default("Revisión")
  // Revisión | Aceptado | Corregido
  createdAt       DateTime @default(now()) @map("created_at")

  @@index([tipo])
  @@index([periodo])
  @@map("conciliacion_reportes")
}
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_monitoreo_conciliaciones`

---

## Paso 2: Servicio de logging (helper reutilizable)

Crear `backend/src/common/monitoreo.helper.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

export type TipoProceso =
  | 'ETL_PAGOS'
  | 'GIS_EXPORT'
  | 'POLIZA_COBROS'
  | 'POLIZA_FACTURACION'
  | 'VALIDACION_LECTURAS'
  | 'TIMBRADO'
  | 'OTRO';

export type EstadoProceso = 'Iniciado' | 'Procesando' | 'Completado' | 'Error' | 'Advertencia';

/**
 * Envuelve un proceso crítico con logging automático de inicio/fin/error.
 * Uso:
 *   const resultado = await conMonitoreo(prisma, 'ETL_PAGOS', async (log) => {
 *     log.registros = filasProcesadas;
 *     return resultado;
 *   }, { subTipo: 'OXXO', usuarioId });
 */
export async function conMonitoreo<T>(
  prisma: PrismaClient,
  tipo: TipoProceso,
  fn: (ctx: { registros: number; errores: number; advertencias: number; detalle: object }) => Promise<T>,
  opts?: { subTipo?: string; usuarioId?: string; detalle?: object },
): Promise<T> {
  const log = await prisma.logProceso.create({
    data: { tipo, subTipo: opts?.subTipo, estado: 'Iniciado', usuarioId: opts?.usuarioId },
  });
  const inicio = Date.now();
  const ctx = { registros: 0, errores: 0, advertencias: 0, detalle: opts?.detalle ?? {} };
  try {
    const result = await fn(ctx);
    await prisma.logProceso.update({
      where: { id: log.id },
      data: {
        estado: ctx.errores > 0 ? 'Advertencia' : 'Completado',
        fin: new Date(),
        duracionMs: Date.now() - inicio,
        registros: ctx.registros,
        errores: ctx.errores,
        advertencias: ctx.advertencias,
        detalle: ctx.detalle,
      },
    });
    return result;
  } catch (err: unknown) {
    await prisma.logProceso.update({
      where: { id: log.id },
      data: {
        estado: 'Error',
        fin: new Date(),
        duracionMs: Date.now() - inicio,
        errores: ctx.errores + 1,
        errorMsg: err instanceof Error ? err.message : String(err),
        detalle: ctx.detalle,
      },
    });
    throw err;
  }
}
```

### Integración en servicios existentes (T02, T04, T05)

Agregar en cada servicio crítico:

**`EtlPagosService.procesarArchivo()`** (T02):
```typescript
import { conMonitoreo } from '../../common/monitoreo.helper';
// ...
return conMonitoreo(this.prisma as any, 'ETL_PAGOS', async (ctx) => {
  // lógica ETL
  ctx.registros = totalFilas;
  ctx.errores = rechazados;
  ctx.detalle = { banco, archivo: nombreArchivo };
  return resultado;
}, { subTipo: banco, usuarioId });
```

**`ContabilidadService.generarPoliza()`** (T04):
```typescript
return conMonitoreo(this.prisma as any, 'POLIZA_COBROS', async (ctx) => {
  // lógica pólizas
  ctx.registros = numLineas;
  ctx.detalle = { periodo };
  return poliza;
}, { subTipo: periodo });
```

**`GisService.exportarDelta()`** (T05):
```typescript
return conMonitoreo(this.prisma as any, 'GIS_EXPORT', async (ctx) => {
  // lógica export GIS
  ctx.registros = cambios.length;
  ctx.detalle = { desde, hasta };
  return cambios;
});
```

---

## Paso 3: Backend — módulo `monitoreo`

Crear `backend/src/modules/monitoreo/`:

### `monitoreo.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MonitoreoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarLogs(params: {
    tipo?: string;
    estado?: string;
    desde?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const where = {
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
      ...(params.desde && { inicio: { gte: new Date(params.desde) } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.logProceso.findMany({
        where,
        orderBy: { inicio: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.logProceso.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getDashboard() {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tipos = ['ETL_PAGOS', 'GIS_EXPORT', 'POLIZA_COBROS', 'POLIZA_FACTURACION', 'VALIDACION_LECTURAS', 'TIMBRADO'];

    const resumen = await Promise.all(
      tipos.map(async (tipo) => {
        const logs = await this.prisma.logProceso.findMany({
          where: { tipo, inicio: { gte: hace24h } },
          orderBy: { inicio: 'desc' },
          take: 10,
          select: { id: true, estado: true, inicio: true, fin: true, registros: true, errores: true, duracionMs: true, errorMsg: true },
        });
        const ultimo = logs[0] ?? null;
        const errores = logs.filter(l => l.estado === 'Error').length;
        const saludable = logs.length === 0 || ultimo?.estado === 'Completado' || ultimo?.estado === 'Advertencia';
        return { tipo, total: logs.length, errores, ultimo, saludable };
      })
    );

    return { generadoEn: new Date(), procesos: resumen };
  }

  async registrarManual(dto: {
    tipo: string;
    subTipo?: string;
    estado: string;
    registros?: number;
    errores?: number;
    errorMsg?: string;
    detalle?: object;
    usuarioId?: string;
  }) {
    return this.prisma.logProceso.create({ data: { ...dto } });
  }
}
```

### `monitoreo.controller.ts`

```typescript
import { Controller, Get, Post, Query, Body, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MonitoreoService } from './monitoreo.service';

@Controller('monitoreo')
@UseGuards(JwtAuthGuard)
export class MonitoreoController {
  constructor(private readonly service: MonitoreoService) {}

  @Get('procesos')
  listarLogs(
    @Query('tipo') tipo?: string,
    @Query('estado') estado?: string,
    @Query('desde') desde?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) { return this.service.listarLogs({ tipo, estado, desde, page, limit }); }

  @Get('dashboard')
  getDashboard() { return this.service.getDashboard(); }

  @Post('procesos/registrar')
  registrarManual(@Body() body: object) { return this.service.registrarManual(body as any); }
}
```

---

## Paso 4: Backend — módulo `conciliaciones`

Crear `backend/src/modules/conciliaciones/`:

### `conciliaciones.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

type TipoConciliacion = 'PADRON_VS_GIS' | 'RECAUDACION_VS_FACTURACION' | 'FACTURACION_VS_CONTABILIDAD';

@Injectable()
export class ConciliacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(params: { tipo?: string; periodo?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.periodo && { periodo: params.periodo }),
    };
    const [data, total] = await Promise.all([
      this.prisma.conciliacionReporte.findMany({ where, orderBy: { ejecutadoEn: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.conciliacionReporte.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async ejecutar(tipo: TipoConciliacion, periodo: string) {
    switch (tipo) {
      case 'RECAUDACION_VS_FACTURACION':
        return this.conciliarRecaudacionVsFacturacion(periodo);
      case 'FACTURACION_VS_CONTABILIDAD':
        return this.conciliarFacturacionVsContabilidad(periodo);
      case 'PADRON_VS_GIS':
        return this.conciliarPadronVsGis(periodo);
      default:
        throw new BadRequestException(`Tipo de conciliación desconocido: ${tipo}`);
    }
  }

  // Conciliación: suma de pagos externos conciliados vs total timbrado en el período
  private async conciliarRecaudacionVsFacturacion(periodo: string) {
    const [year, month] = periodo.split('-').map(Number);
    const desde = new Date(year, month - 1, 1);
    const hasta = new Date(year, month, 0, 23, 59, 59);

    // Sistema A: Facturación (timbrados en período)
    const timbrados = await this.prisma.timbrado.findMany({
      where: { periodo, estado: 'Timbrada OK' },
      select: { id: true, total: true },
    });
    const montoFacturacion = timbrados.reduce((s, t) => s + Number(t.total), 0);

    // Sistema B: Pagos registrados (origen nativo + externo conciliados)
    const pagos = await this.prisma.pago.findMany({
      where: {
        createdAt: { gte: desde, lte: hasta },
      },
      select: { id: true, monto: true, tipo: true, origen: true },
    });
    const montoRecaudacion = pagos.reduce((s, p) => s + Number(p.monto), 0);

    const diferencias: object[] = [];
    if (Math.abs(montoFacturacion - montoRecaudacion) > 0.01) {
      diferencias.push({
        campo: 'montoTotal',
        facturacion: montoFacturacion,
        recaudacion: montoRecaudacion,
        brecha: montoRecaudacion - montoFacturacion,
      });
    }

    return this.prisma.conciliacionReporte.create({
      data: {
        tipo: 'RECAUDACION_VS_FACTURACION',
        periodo,
        totalSistemaA: timbrados.length,
        totalSistemaB: pagos.length,
        coincidencias: diferencias.length === 0 ? timbrados.length : 0,
        diferencias: diferencias.length,
        montoSistemaA: new Decimal(montoFacturacion),
        montoSistemaB: new Decimal(montoRecaudacion),
        montoDiferencia: new Decimal(montoRecaudacion - montoFacturacion),
        detalles: diferencias,
      },
    });
  }

  // Conciliación: pólizas contables generadas vs timbrados/pagos del período
  private async conciliarFacturacionVsContabilidad(periodo: string) {
    const timbrados = await this.prisma.timbrado.findMany({
      where: { periodo, estado: 'Timbrada OK' },
      select: { id: true, total: true, subtotal: true, iva: true },
    });
    const totalFacturado = timbrados.reduce((s, t) => s + Number(t.total), 0);

    // Intentar leer pólizas contables si existe el modelo (T04)
    let totalPolizas = 0;
    let numPolizas = 0;
    try {
      const polizas = await (this.prisma as any).poliza.findMany({
        where: { periodo, tipo: 'Facturación' },
        select: { id: true, total: true },
      });
      totalPolizas = polizas.reduce((s: number, p: { total: Decimal }) => s + Number(p.total), 0);
      numPolizas = polizas.length;
    } catch {
      // El modelo Poliza puede no existir si T04 no se ejecutó
    }

    const brecha = totalPolizas - totalFacturado;
    const detalles: object[] = Math.abs(brecha) > 0.01
      ? [{ campo: 'monto', facturado: totalFacturado, polizas: totalPolizas, brecha }]
      : [];

    return this.prisma.conciliacionReporte.create({
      data: {
        tipo: 'FACTURACION_VS_CONTABILIDAD',
        periodo,
        totalSistemaA: timbrados.length,
        totalSistemaB: numPolizas,
        coincidencias: detalles.length === 0 ? timbrados.length : 0,
        diferencias: detalles.length,
        montoSistemaA: new Decimal(totalFacturado),
        montoSistemaB: new Decimal(totalPolizas),
        montoDiferencia: new Decimal(brecha),
        detalles,
      },
    });
  }

  // Conciliación: contratos activos vs registros GIS sincronizados
  private async conciliarPadronVsGis(periodo: string) {
    const contratos = await this.prisma.contrato.count({ where: { estado: 'Activo' } });

    let totalGis = 0;
    let sinGis: string[] = [];
    try {
      const cambiosGis = await (this.prisma as any).cambioGIS.findMany({
        where: { entidad: 'Contrato', sincronizado: true },
        select: { entidadId: true },
        distinct: ['entidadId'],
      });
      totalGis = cambiosGis.length;
      const idsGis = new Set(cambiosGis.map((c: { entidadId: string }) => c.entidadId));
      const todosContratos = await this.prisma.contrato.findMany({
        where: { estado: 'Activo' },
        select: { id: true },
      });
      sinGis = todosContratos.filter(c => !idsGis.has(c.id)).map(c => c.id);
    } catch {
      // El modelo CambioGIS puede no existir si T05 no se ejecutó
    }

    return this.prisma.conciliacionReporte.create({
      data: {
        tipo: 'PADRON_VS_GIS',
        periodo,
        totalSistemaA: contratos,
        totalSistemaB: totalGis,
        coincidencias: contratos - sinGis.length,
        diferencias: sinGis.length,
        detalles: sinGis.length > 0 ? { contratosSinGis: sinGis.slice(0, 100) } : {},
      },
    });
  }

  async marcarEstado(id: string, estado: string) {
    return this.prisma.conciliacionReporte.update({ where: { id }, data: { estado } });
  }
}
```

### `conciliaciones.controller.ts`

```typescript
import { Controller, Get, Post, Param, Query, Body, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConciliacionesService } from './conciliaciones.service';

@Controller('conciliaciones')
@UseGuards(JwtAuthGuard)
export class ConciliacionesController {
  constructor(private readonly service: ConciliacionesService) {}

  @Get()
  listar(
    @Query('tipo') tipo?: string,
    @Query('periodo') periodo?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) { return this.service.listar({ tipo, periodo, page, limit }); }

  @Post('ejecutar')
  ejecutar(@Body() body: { tipo: string; periodo: string }) {
    return this.service.ejecutar(
      body.tipo as 'PADRON_VS_GIS' | 'RECAUDACION_VS_FACTURACION' | 'FACTURACION_VS_CONTABILIDAD',
      body.periodo,
    );
  }

  @Post(':id/estado')
  marcarEstado(@Param('id') id: string, @Body() body: { estado: string }) {
    return this.service.marcarEstado(id, body.estado);
  }
}
```

---

## Paso 5: Frontend — `Monitoreo.tsx`

```typescript
// Estructura de la página (reemplaza stub o crea nueva):
//
// Sección 1: "Salud del sistema" (tarjetas — GET /monitoreo/dashboard)
//   Por cada proceso crítico:
//   - Tarjeta con: nombre amigable, ícono, estado del último run (verde/amarillo/rojo)
//   - Último run: fecha/hora, duración, registros, errores
//   - Badge: Saludable | Con errores | Sin actividad
//   - Auto-refresh cada 60s
//
// Sección 2: "Log de procesos" (tabla — GET /monitoreo/procesos)
//   - Filtros: tipo, estado, fecha desde
//   - Tabla: tipo, subtipo, inicio, duración, registros, errores, estado
//   - Click en fila → panel lateral con detalle JSON
//   - Paginación
//
// Sección 3: "Conciliaciones" (tabla + acciones — GET /conciliaciones)
//   - Header con botón "Ejecutar conciliación" → modal:
//     - Select tipo: Padrón vs GIS / Recaudación vs Facturación / Facturación vs Contabilidad
//     - Input período: YYYY-MM (default: mes actual)
//     - POST /conciliaciones/ejecutar
//   - Tabla de reportes: tipo, período, sistema A, sistema B, diferencias, monto brecha, estado
//   - Click en fila → panel con detalles de diferencias (JSON estructurado)
//   - Botones por fila: "Marcar como Aceptado" / "Marcar como Corregido"
```

---

## Paso 6: Registro del módulo en AppModule

```typescript
// En backend/src/app.module.ts, agregar imports:
import { MonitoreoModule } from './modules/monitoreo/monitoreo.module';
import { ConciliacionesModule } from './modules/conciliaciones/conciliaciones.module';

// En @Module({ imports: [...] }):
MonitoreoModule,
ConciliacionesModule,
```

---

## Notas para el ejecutor

1. **Dependencias opcionales**: La conciliación `PADRON_VS_GIS` y `FACTURACION_VS_CONTABILIDAD` intentan usar modelos de T05 y T04 respectivamente. Están envueltas en try/catch para degradar graciosamente si esas tareas no se han ejecutado.

2. **`conMonitoreo` helper**: Es un helper utilitario, no un módulo NestJS. Se importa directamente donde se necesita. No requiere módulo separado.

3. **Auto-refresh en frontend**: Usar `useEffect` con `setInterval(refresh, 60000)` y limpiarlo en el cleanup — no usar librerías externas.

4. **Alertas proactivas (mejora futura)**: La fase actual solo registra y muestra. Las alertas por email/webhook cuando `estado === 'Error'` son un siguiente sprint — el modelo `LogProceso` ya tiene los campos necesarios.

5. **Guardrails — NO modificar:**
   - Lógica de negocio en T02, T04, T05 — solo AGREGAR `conMonitoreo` como wrapper
   - Schema de modelos existentes — solo AGREGAR los dos nuevos

---

## Modificaciones PRD 2026-04-06

> Los siguientes cambios son requeridos por el PRD 2026-04-06 y **ya están aplicados en el schema Prisma**.

### MOD-T09-1: Reglas de consistencia cruzada (Req 33)

**Estado anterior:** `ConciliacionReporte` tiene tipos: `RECAUDACION_VS_FACTURACION`, `FACTURACION_VS_CONTABILIDAD`, `PADRON_VS_GIS`.  
**Cambio:** Agregar tipos de conciliación para los nuevos dominios del PRD + campos de métricas de calidad.

Campos agregados al schema `ConciliacionReporte`:
```prisma
contratosSinPunto   Int?     @map("contratos_sin_punto")
domiciliosSinINEGI  Int?     @map("domicilios_sin_inegi")
tarifasVencidas     Int?     @map("tarifas_vencidas")
```

### Nuevos tipos de conciliación a implementar

- [ ] **`CONTRATACION_VS_FACTURACION`**: Verificar que todo contrato activo tenga conceptos de cobro asignados y tarifa vigente
- [ ] **`TARIFAS_VS_TIPOS_CONTRATO`**: Verificar que las tarifas asignadas correspondan al tipo de contratación
- [ ] **`CORTES_VS_ESTADO_SERVICIO`**: Verificar que los cortes se reflejen en el estado del punto de servicio
- [ ] **`DOMICILIOS_VS_CONTRATOS`**: Verificar que todo contrato activo tenga domicilio estructurado
- [ ] **`CALIDAD_DATOS`**: Ejecutar reglas de calidad transversales definidas en T15

### Implementación sugerida

```typescript
// Agregar a conciliaciones.service.ts:

private async conciliarContratacionVsFacturacion(periodo: string) {
  const contratosActivos = await this.prisma.contrato.count({ where: { estado: 'Activo' } });
  const sinTipoContratacion = await this.prisma.contrato.count({
    where: { estado: 'Activo', tipoContratacionId: null },
  });
  const sinPuntoServicio = await this.prisma.contrato.count({
    where: { estado: 'Activo', puntoServicioId: null },
  });
  const sinDomicilio = await this.prisma.contrato.count({
    where: { estado: 'Activo', domicilioId: null },
  });

  return this.prisma.conciliacionReporte.create({
    data: {
      tipo: 'CONTRATACION_VS_FACTURACION',
      periodo,
      totalSistemaA: contratosActivos,
      totalSistemaB: contratosActivos - sinTipoContratacion,
      coincidencias: contratosActivos - sinTipoContratacion - sinPuntoServicio - sinDomicilio,
      diferencias: sinTipoContratacion + sinPuntoServicio + sinDomicilio,
      contratosSinPunto: sinPuntoServicio,
      domiciliosSinINEGI: sinDomicilio,
      detalles: {
        sinTipoContratacion,
        sinPuntoServicio,
        sinDomicilio,
      },
    },
  });
}
```

### Impacto en getDashboard (MonitoreoService)

- [ ] Agregar tipo `CALIDAD_DATOS` a la lista de procesos monitoreados
- [ ] Frontend: nueva tarjeta en dashboard para métricas de calidad de datos
- [ ] Frontend: gráfico de tendencia de calidad por período

### Nuevas dependencias

| Dependencia | Modelo | Descripción |
|---|---|---|
| T11 | `PuntoServicio` | Conciliación contratos ↔ puntos de servicio |
| T12 | `Domicilio` | Conciliación domicilios ↔ INEGI |
| T13 | `TipoContratacion` | Conciliación tipos ↔ conceptos |
| T14 | `Tarifa` | Conciliación tarifas vigentes |
| T15 | Reglas de calidad | Conciliación transversal de calidad de datos |

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_monitoreo_conciliaciones
npm run build

# Dashboard de salud
curl -H "Authorization: Bearer <token>" http://localhost:3001/monitoreo/dashboard

# Lista de logs (últimas 50 ejecuciones)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/monitoreo/procesos?desde=2026-02-01"

# Ejecutar conciliación recaudación vs facturación
curl -X POST http://localhost:3001/conciliaciones/ejecutar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"RECAUDACION_VS_FACTURACION","periodo":"2026-02"}'

# Lista histórico de conciliaciones
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/conciliaciones?tipo=RECAUDACION_VS_FACTURACION"

# Marcar conciliación como aceptada
curl -X POST http://localhost:3001/conciliaciones/<id>/estado \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"estado":"Aceptado"}'
```
