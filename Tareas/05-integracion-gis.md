# Tarea 05 — Integración y Conciliación con GIS

**PRD reqs:** 24–27  
**Sección PRD:** "Integración y conciliación con GIS"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui

---

## Contexto y estado actual

### Descripción del req según PRD

- **Req 24:** Exportación diferencial de cambios desde la última sincronización exitosa (entidades: Contrato, Medidor, Zona, Distrito, Toma, etc.)
- **Req 25:** Script externo (Python) que consume el delta y actualiza el GIS. El nuevo sistema provee los endpoints, el script es externo.
- **Req 26:** Detección inteligente de cambios: no exportar registros que no cambiaron; rastrear desde última sync exitosa.
- **Req 27:** Conciliación: comparar padrón interno vs GIS y reportar diferencias (contratos en GIS que no existen en sistema, viceversa).

### No hay archivos de referencia en Documentos

Los scripts Python son externos. Este módulo provee la API que esos scripts consumen.

### Estado actual del código

- No existe módulo `gis` en backend ni frontend
- Schema Prisma: no hay modelos de cambios GIS ni log de sincronización
- Modelos que emiten cambios: `Contrato`, `Medidor`, `Zona`, `Distrito`, `Toma`, `Ruta`

---

## Objetivo

1. Sistema de captura de cambios (CDC) sobre entidades clave del padrón
2. Endpoint de exportación diferencial desde última sync exitosa
3. Log de sincronizaciones con estado y estadísticas
4. Endpoint de conciliación padrón vs GIS

---

## Aceptación (Definition of Done)

- [ ] Migración con `CambioGIS` y `LogSincronizacion` aplicada
- [ ] `GET /gis/cambios/pendientes` lista cambios desde última sync exitosa
- [ ] `POST /gis/sincronizaciones/iniciar` marca inicio de sync y registra cambios exportados
- [ ] `POST /gis/sincronizaciones/:id/completar` marca sync como exitosa o fallida
- [ ] `GET /gis/conciliacion` ejecuta conciliación y devuelve diferencias (parámetro: lista GIS externa)
- [ ] Frontend: sección "GIS" en Administración/Operaciones con estado de sincronización
- [ ] Middleware Prisma captura automáticamente cambios en entidades configuradas

---

## Paso 1: Migración Prisma

```prisma
// Agregar a backend/prisma/schema.prisma

model CambioGIS {
  id         String   @id @default(cuid())
  entidad    String
  // Contrato | Medidor | Zona | Distrito | Toma | Ruta
  entidadId  String   @map("entidad_id")
  accion     String
  // insert | update | delete
  camposModificados Json? @map("campos_modificados")
  // { campo: { anterior, nuevo } }
  datosSnapshot Json? @map("datos_snapshot")
  // snapshot del registro en el momento del cambio
  exportado  Boolean  @default(false)
  logId      String?  @map("log_id")
  // sync que lo exportó
  createdAt  DateTime @default(now()) @map("created_at")

  log        LogSincronizacion? @relation(fields: [logId], references: [id], onDelete: SetNull)

  @@index([entidad, entidadId])
  @@index([exportado])
  @@index([createdAt])
  @@map("cambios_gis")
}

model LogSincronizacion {
  id           String   @id @default(cuid())
  tipo         String   @default("GIS")
  // GIS | GIS_conciliacion
  estado       String   @default("en_progreso")
  // en_progreso | exitosa | fallida
  totalCambios Int?     @map("total_cambios")
  totalExportados Int?  @map("total_exportados")
  totalErrores Int?     @map("total_errores")
  detalles     Json?
  fechaInicio  DateTime @default(now()) @map("fecha_inicio")
  fechaFin     DateTime? @map("fecha_fin")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  cambios      CambioGIS[]

  @@index([estado])
  @@index([tipo])
  @@map("logs_sincronizacion")
}
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_gis`

---

## Paso 2: Backend — módulo `gis`

Crear `backend/src/modules/gis/`:

### `gis-tracker.middleware.ts`
Middleware que captura cambios automáticamente después de mutaciones en entidades GIS-relevantes.

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Entidades que emiten cambios al GIS
const ENTIDADES_GIS = ['Contrato', 'Medidor', 'Zona', 'Distrito', 'Toma', 'Ruta'] as const;
type EntidadGIS = typeof ENTIDADES_GIS[number];

@Injectable()
export class GisTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  // Registrar un cambio manualmente (llamado desde servicios)
  async registrarCambio(params: {
    entidad: EntidadGIS;
    entidadId: string;
    accion: 'insert' | 'update' | 'delete';
    camposModificados?: Record<string, { anterior: unknown; nuevo: unknown }>;
    datosSnapshot?: object;
  }) {
    return this.prisma.cambioGIS.create({
      data: {
        entidad: params.entidad,
        entidadId: params.entidadId,
        accion: params.accion,
        camposModificados: params.camposModificados ?? null,
        datosSnapshot: params.datosSnapshot ?? null,
      },
    });
  }

  // Obtener cambios no exportados desde la última sync exitosa
  async getCambiosPendientes(params?: {
    entidades?: EntidadGIS[];
    desde?: Date;
  }) {
    const where = {
      exportado: false,
      ...(params?.entidades?.length && { entidad: { in: params.entidades } }),
      ...(params?.desde && { createdAt: { gte: params.desde } }),
    };
    return this.prisma.cambioGIS.findMany({
      where,
      orderBy: [{ entidad: 'asc' }, { createdAt: 'asc' }],
    });
  }

  // Fecha desde la cual calcular el delta (req 26)
  async getFechaUltimaSyncExitosa(): Promise<Date | null> {
    const ultima = await this.prisma.logSincronizacion.findFirst({
      where: { tipo: 'GIS', estado: 'exitosa' },
      orderBy: { fechaFin: 'desc' },
      select: { fechaFin: true },
    });
    return ultima?.fechaFin ?? null;
  }
}
```

### `gis.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GisTrackerService } from './gis-tracker.middleware';

@Injectable()
export class GisService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tracker: GisTrackerService,
  ) {}

  // ---- Delta de cambios (req 24, 26) ----
  async getDelta(params?: { entidades?: string[] }) {
    const desde = await this.tracker.getFechaUltimaSyncExitosa();
    const cambios = await this.tracker.getCambiosPendientes({
      entidades: params?.entidades as any,
      desde: desde ?? undefined,
    });

    return {
      desde: desde?.toISOString() ?? 'primera_sincronizacion',
      totalCambios: cambios.length,
      cambios,
    };
  }

  // ---- Iniciar sincronización ----
  async iniciarSync(): Promise<{ logId: string; totalCambiosPendientes: number }> {
    const desde = await this.tracker.getFechaUltimaSyncExitosa();
    const cambiosPendientes = await this.tracker.getCambiosPendientes({
      desde: desde ?? undefined,
    });

    const log = await this.prisma.logSincronizacion.create({
      data: {
        tipo: 'GIS',
        estado: 'en_progreso',
        totalCambios: cambiosPendientes.length,
        cambios: {
          connect: cambiosPendientes.map(c => ({ id: c.id })),
        },
      },
    });

    return { logId: log.id, totalCambiosPendientes: cambiosPendientes.length };
  }

  // ---- Completar sincronización ----
  async completarSync(
    logId: string,
    resultado: { estado: 'exitosa' | 'fallida'; totalExportados: number; totalErrores: number; detalles?: object },
  ) {
    const log = await this.prisma.logSincronizacion.findUnique({ where: { id: logId } });
    if (!log) throw new NotFoundException('Log de sincronización no encontrado');

    // Marcar cambios como exportados si la sync fue exitosa
    if (resultado.estado === 'exitosa') {
      await this.prisma.cambioGIS.updateMany({
        where: { logId, exportado: false },
        data: { exportado: true },
      });
    }

    return this.prisma.logSincronizacion.update({
      where: { id: logId },
      data: {
        estado: resultado.estado,
        totalExportados: resultado.totalExportados,
        totalErrores: resultado.totalErrores,
        detalles: resultado.detalles ?? null,
        fechaFin: new Date(),
      },
    });
  }

  // ---- Listar sincronizaciones ----
  async getHistorialSync(params: { page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const [data, total] = await Promise.all([
      this.prisma.logSincronizacion.findMany({
        orderBy: { fechaInicio: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true, tipo: true, estado: true,
          totalCambios: true, totalExportados: true, totalErrores: true,
          fechaInicio: true, fechaFin: true,
        },
      }),
      this.prisma.logSincronizacion.count(),
    ]);
    return { data, total, page, limit };
  }

  // ---- Conciliación padrón vs GIS (req 27) ----
  // El script Python envía la lista de IDs conocidos en GIS
  // Se comparan contra los IDs en el sistema
  async conciliar(params: {
    entidad: string;
    idsEnGIS: string[];
  }) {
    const { entidad, idsEnGIS } = params;
    const gisSet = new Set(idsEnGIS);

    // IDs en el sistema para esa entidad
    let idsEnSistema: string[] = [];
    switch (entidad) {
      case 'Contrato':
        idsEnSistema = (await this.prisma.contrato.findMany({ select: { id: true } })).map(c => c.id);
        break;
      case 'Medidor':
        idsEnSistema = (await this.prisma.medidor.findMany({ select: { id: true } })).map(m => m.id);
        break;
      case 'Zona':
        idsEnSistema = (await this.prisma.zona.findMany({ select: { id: true } })).map(z => z.id);
        break;
      case 'Distrito':
        idsEnSistema = (await this.prisma.distrito.findMany({ select: { id: true } })).map(d => d.id);
        break;
      default:
        return { error: `Entidad ${entidad} no soportada para conciliación` };
    }

    const sistemaSet = new Set(idsEnSistema);
    const soloEnSistema = idsEnSistema.filter(id => !gisSet.has(id));
    const soloEnGIS = idsEnGIS.filter(id => !sistemaSet.has(id));

    // Registrar resultado de conciliación
    await this.prisma.logSincronizacion.create({
      data: {
        tipo: 'GIS_conciliacion',
        estado: 'exitosa',
        totalCambios: soloEnSistema.length + soloEnGIS.length,
        detalles: { soloEnSistema: soloEnSistema.slice(0, 100), soloEnGIS: soloEnGIS.slice(0, 100) },
        fechaFin: new Date(),
      },
    });

    return {
      entidad,
      totalEnSistema: idsEnSistema.length,
      totalEnGIS: idsEnGIS.length,
      soloEnSistema: { count: soloEnSistema.length, ids: soloEnSistema.slice(0, 50) },
      soloEnGIS: { count: soloEnGIS.length, ids: soloEnGIS.slice(0, 50) },
      diferencias: soloEnSistema.length + soloEnGIS.length,
    };
  }

  // ---- Estado del módulo GIS (para dashboard) ----
  async getEstado() {
    const [ultimaSync, cambiosPendientes] = await Promise.all([
      this.prisma.logSincronizacion.findFirst({
        where: { tipo: 'GIS' },
        orderBy: { fechaInicio: 'desc' },
        select: { id: true, estado: true, fechaInicio: true, fechaFin: true, totalExportados: true },
      }),
      this.prisma.cambioGIS.count({ where: { exportado: false } }),
    ]);
    return { ultimaSync, cambiosPendientes };
  }
}
```

### `gis.controller.ts`

```typescript
import { Controller, Get, Post, Param, Body, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GisService } from './gis.service';

@Controller('gis')
@UseGuards(JwtAuthGuard)
export class GisController {
  constructor(private readonly service: GisService) {}

  @Get('estado')
  getEstado() { return this.service.getEstado(); }

  @Get('cambios/pendientes')
  getDelta(@Query('entidades') entidades?: string) {
    return this.service.getDelta({
      entidades: entidades ? entidades.split(',') : undefined,
    });
  }

  @Post('sincronizaciones/iniciar')
  iniciarSync() { return this.service.iniciarSync(); }

  @Post('sincronizaciones/:id/completar')
  completarSync(
    @Param('id') id: string,
    @Body() body: { estado: 'exitosa' | 'fallida'; totalExportados: number; totalErrores: number; detalles?: object },
  ) {
    return this.service.completarSync(id, body);
  }

  @Get('sincronizaciones')
  getHistorial(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.service.getHistorialSync({ page, limit });
  }

  @Post('conciliacion')
  conciliar(@Body() body: { entidad: string; idsEnGIS: string[] }) {
    return this.service.conciliar(body);
  }
}
```

### `gis.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { GisController } from './gis.controller';
import { GisService } from './gis.service';
import { GisTrackerService } from './gis-tracker.middleware';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GisController],
  providers: [GisService, GisTrackerService],
  exports: [GisTrackerService],
})
export class GisModule {}
```

Registrar en `app.module.ts`.

---

## Paso 3: Integración CDC — captura automática de cambios

En los servicios existentes de `ContratoService`, `MedidorService`, etc., agregar llamadas a `GisTrackerService` después de mutaciones:

```typescript
// Ejemplo en contratos.service.ts create():
const contrato = await this.prisma.contrato.create({ data });
// Registrar cambio para GIS
await this.gisTracker.registrarCambio({
  entidad: 'Contrato',
  entidadId: contrato.id,
  accion: 'insert',
  datosSnapshot: contrato,
});
return contrato;

// Ejemplo en update():
const anterior = await this.prisma.contrato.findUnique({ where: { id } });
const updated = await this.prisma.contrato.update({ where: { id }, data });
const modificados: Record<string, { anterior: unknown; nuevo: unknown }> = {};
for (const key of Object.keys(data)) {
  if (anterior?.[key] !== updated[key]) {
    modificados[key] = { anterior: anterior?.[key], nuevo: updated[key] };
  }
}
if (Object.keys(modificados).length > 0) {
  await this.gisTracker.registrarCambio({
    entidad: 'Contrato',
    entidadId: id,
    accion: 'update',
    camposModificados: modificados,
    datosSnapshot: updated,
  });
}
```

Inyectar `GisTrackerService` en `ContratosModule`, `MedidorModule`, etc.

---

## Paso 4: Frontend — sección GIS

Agregar sección GIS en `frontend/src/pages/Dashboard.tsx` o crear `frontend/src/pages/SincronizacionGIS.tsx`:

```typescript
// Componente de estado GIS (para Dashboard):
//   - Semáforo: verde (sync < 24h), amarillo (24-72h sin sync), rojo (> 72h o fallida)
//   - Texto: "Última sincronización: hace X horas — X cambios exportados"
//   - Cambios pendientes: badge con contador
//   - Botón "Ver historial" → navega a /gis
//   - Botón "Iniciar sync manual" (admin only)
//
// Página /gis (nueva o sección en Admin):
//   - Panel de estado: última sync, cambios pendientes, estado
//   - Historial de sincronizaciones: tabla con estado, fecha, totales
//   - Sección conciliación:
//     - Upload JSON con IDs del GIS externo
//     - Resultados: solo en sistema, solo en GIS, totales
//   - Lista de cambios pendientes (paginada, filtrable por entidad)
```

---

## Notas importantes para el ejecutor

1. **CDC vs triggers:** La captura de cambios se hace a nivel de servicio (no triggers de BD) para mantener compatibilidad con Prisma. **El ejecutor debe asegurarse de agregar las llamadas a `gisTracker.registrarCambio()` en TODOS los métodos `create`, `update`, `delete` de los servicios afectados.**

2. **Script Python externo (req 25):** El script Python consume `GET /gis/cambios/pendientes`, procesa los cambios y llama `POST /gis/sincronizaciones/iniciar` al iniciar y `POST /gis/sincronizaciones/:id/completar` al terminar. La autenticación del script debe usar un token de servicio (crear usuario con rol `ADMIN` para el script).

3. **Conciliación (req 27):** El endpoint `POST /gis/conciliacion` recibe la lista de IDs del GIS en el body. Para GIS grandes (> 10k registros), limitar el response a los primeros 50 IDs de diferencia y proveer el conteo total.

4. **Guardrails — NO modificar:**
   - Schema Prisma existente de Contrato/Medidor/Zona/Distrito — solo agregar nuevos modelos
   - Lógica existente de `contratos.service.ts` — solo AGREGAR la llamada a gisTracker al final

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_gis
npm run build

# Crear un contrato → debe registrar cambio GIS automáticamente
curl -X POST http://localhost:3001/contratos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Test","zonaId":"<id>",...}'

# Verificar cambio registrado
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/gis/cambios/pendientes

# Simular sincronización
curl -X POST http://localhost:3001/gis/sincronizaciones/iniciar \
  -H "Authorization: Bearer <token>"

# Completar sync
curl -X POST http://localhost:3001/gis/sincronizaciones/<logId>/completar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"estado":"exitosa","totalExportados":1,"totalErrores":0}'

# Conciliación
curl -X POST http://localhost:3001/gis/conciliacion \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"entidad":"Contrato","idsEnGIS":["id1","id2"]}'
```
