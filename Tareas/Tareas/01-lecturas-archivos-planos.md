# Tarea 01 — Módulo de Lecturas y Archivos Planos

**PRD reqs:** 1–11  
**Secciones PRD:** "Módulo de lecturas y archivos planos" + "Mensajes de lecturistas y comentarios de campo"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui

---

## Contexto y estado actual

### Archivos de referencia disponibles

- **Archivo de salida AQUACIS → nuevo sistema:**  
  `Requerimientos/Documentos/Interfaces-.../Interfase con Sistema de Lecturas/Archivos que emite AQUACIS/0001M08L20`  
  Formato posicional de ancho fijo (~1300 chars por línea). Campos identificados:
  - Pos 1–4: código tipo (ej. `0001`)
  - Pos 5–6: zona/administración (`M0`)
  - Pos 7–14: periodo (AAAAMMDD)
  - Pos 15–21: letra ruta (`8L20000`)
  - Pos 22–29: número de contrato (8 dígitos)
  - Pos 30–109: nombre del cliente (80 chars)
  - Pos 110–117: lectura anterior
  - Luego: 4 lecturas históricas con consumos, incidencia, URL foto, etc.
  - Incluye: nombre colonia, tipo tarifa, tipo instalación, código incidencia

- **Archivo de regreso (nuevo sistema → AQUACIS):**  
  `Archivos que recibe AQUACIS/0007AM1L44` — mismo layout con lecturas capturadas

- **Layout documentado:**  
  `Archivos que recibe AQUACIS/Para recibir el archivo con las lecturas.docx`  
  `Archivos que emite AQUACIS/Para la generación del archivo de salida.docx`  
  `Layout documentación.xlsx`

- **Catálogos:**  
  `Lectores.dat` — catálogo de lecturistas  
  `Observac.dat` — catálogo de incidencias/observaciones

### Estado actual del código

- `backend/src/modules/lecturas/lecturas.controller.ts` — STUB: solo `GET /lecturas` retorna `[]`
- `backend/src/modules/lecturas/lecturas.module.ts` — solo importa controller
- `frontend/src/pages/Lecturas.tsx` — página existente (stub sin conexión a backend)
- `frontend/src/api/lecturas.ts` — cliente API existente
- Schema Prisma actual: NO tiene modelos de Lectura, Lote, Lecturista ni Incidencia

---

## Objetivo

Implementar el módulo completo de lecturas:
1. Parseo y carga de archivos planos en formato AQUACIS
2. Catálogos de lecturistas e incidencias
3. Validación de lotes (todos los contratos con lectura o incidencia)
4. Generación de estimadas cuando incidencia = avería
5. Módulo de mensajes de lecturistas (req 10–11)
6. Frontend: upload, validaciones visuales, filtros, paginación

---

## Aceptación (Definition of Done)

- [ ] Migración Prisma con todos los modelos nuevos aplicada sin errores
- [ ] `POST /lecturas/lotes/upload` acepta archivo plano, parsea y almacena en BD
- [ ] Validación de lote bloquea carga si algún contrato no tiene lectura ni incidencia
- [ ] Lectura estimada se genera automáticamente para incidencias tipo avería
- [ ] `GET /lecturas/lotes` lista lotes con estado y estadísticas
- [ ] `GET /lecturas?rutaId=&zona=&periodo=&estado=&page=&limit=` funciona con paginación
- [ ] Frontend `Lecturas.tsx` conectado a backend real con pestañas: Carga, Validaciones, Historial
- [ ] Catálogos de lecturistas e incidencias con CRUD básico

---

## Paso 1: Migración Prisma

Crear nueva migración en `backend/prisma/migrations/` con los siguientes modelos.

### Modelos a agregar en `backend/prisma/schema.prisma`

```prisma
// ---- Catálogos de lecturas ----
model Lecturista {
  id           String   @id @default(cuid())
  codigo       String   @unique
  nombre       String
  contratistaId String?  @map("contratista_id")
  activo       Boolean  @default(true)
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  contratista  Contratista? @relation(fields: [contratistaId], references: [id], onDelete: SetNull)
  lecturas     Lectura[]

  @@map("lecturistas")
}

model Contratista {
  id         String       @id @default(cuid())
  nombre     String
  activo     Boolean      @default(true)
  createdAt  DateTime     @default(now()) @map("created_at")
  updatedAt  DateTime     @updatedAt @map("updated_at")
  lecturistas Lecturista[]

  @@map("contratistas")
}

model CatalogoIncidencia {
  id          String   @id @default(cuid())
  codigo      String   @unique
  descripcion String
  esAveria    Boolean  @default(false) @map("es_averia") // true = genera estimada
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  lecturas    Lectura[]

  @@map("catalogo_incidencias")
}

model LoteLecturas {
  id              String   @id @default(cuid())
  zonaId          String?  @map("zona_id")
  rutaId          String?  @map("ruta_id")
  periodo         String   // AAAAMM
  tipoLote        String   @map("tipo_lote") // Lectura | Inspeccion | Repaso
  archivoNombre   String   @map("archivo_nombre")
  archivoHash     String?  @map("archivo_hash")
  estado          String   @default("Pendiente") // Pendiente | Validando | Valido | Rechazado | Aplicado
  totalRegistros  Int      @default(0) @map("total_registros")
  totalValidos    Int      @default(0) @map("total_validos")
  totalConError   Int      @default(0) @map("total_con_error")
  errores         Json?    // array de { contrato, motivo }
  cargadoPor      String?  @map("cargado_por")
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  zona            Zona?    @relation(fields: [zonaId], references: [id], onDelete: SetNull)
  ruta            Ruta?    @relation(fields: [rutaId], references: [id], onDelete: SetNull)
  lecturas        Lectura[]

  @@index([zonaId])
  @@index([rutaId])
  @@index([periodo])
  @@map("lotes_lecturas")
}

model Lectura {
  id                  String   @id @default(cuid())
  loteId              String   @map("lote_id")
  contratoId          String   @map("contrato_id")
  lecturistaId        String?  @map("lecturista_id")
  incidenciaId        String?  @map("incidencia_id")
  periodo             String
  lecturaActual       Int?     @map("lectura_actual")
  lecturaAnterior     Int?     @map("lectura_anterior")
  consumoReal         Int?     @map("consumo_real")
  consumoEstimado     Int?     @map("consumo_estimado")  // generado si avería
  esEstimada          Boolean  @default(false) @map("es_estimada")
  lecturaMinZona      Int?     @map("lectura_min_zona")
  lecturaMaxZona      Int?     @map("lectura_max_zona")
  urlFoto             String?  @map("url_foto")
  estado              String   @default("Pendiente") // Pendiente | Valida | NoValida | Estimada
  motivoInvalidacion  String?  @map("motivo_invalidacion")
  datosRaw            Json?    @map("datos_raw")  // campos adicionales del archivo plano
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  lote        LoteLecturas       @relation(fields: [loteId], references: [id], onDelete: Cascade)
  lecturista  Lecturista?        @relation(fields: [lecturistaId], references: [id], onDelete: SetNull)
  incidencia  CatalogoIncidencia? @relation(fields: [incidenciaId], references: [id], onDelete: SetNull)

  @@index([loteId])
  @@index([contratoId])
  @@index([periodo])
  @@index([estado])
  @@map("lecturas")
}

model MensajeLecturista {
  id         String   @id @default(cuid())
  loteId     String?  @map("lote_id")
  contratoId String?  @map("contrato_id")
  mensaje    String
  tipo       String   @default("comentario") // comentario | alerta | incidencia_campo
  visible    Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([loteId])
  @@index([contratoId])
  @@map("mensajes_lecturistas")
}
```

También agregar relaciones inversas en modelos existentes:
```prisma
// En model Zona: agregar
lotesLecturas   LoteLecturas[]

// En model Ruta: agregar
lotesLecturas   LoteLecturas[]
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_lecturas_module`

---

## Paso 2: Backend — Servicio de lecturas

### Archivo: `backend/src/modules/lecturas/lecturas.service.ts`

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LecturasService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Parser de archivo plano AQUACIS (formato posicional) ----
  parseArchivoPlano(contenido: string): ParsedLectura[] {
    const lineas = contenido.split('\n').filter(l => l.trim().length > 0);
    return lineas.map((linea, idx) => {
      try {
        return {
          contrato: linea.substring(14, 22).trim(),
          cliente: linea.substring(22, 102).trim(),
          lecturaAnterior: parseInt(linea.substring(110, 119).trim()) || null,
          lecturaActual: this.extraerLecturaActual(linea),
          codigoIncidencia: this.extraerIncidencia(linea),
          codigoLecturista: linea.substring(102, 109).trim(),
          urlFoto: this.extraerUrlFoto(linea),
          consumoHistorico: this.extraerConsumos(linea),
          datosRaw: { linea: idx + 1, raw: linea },
        };
      } catch {
        return null;
      }
    }).filter(Boolean);
  }

  // Extraer la lectura actual del campo correspondiente en el layout AQUACIS
  private extraerLecturaActual(linea: string): number | null {
    // La lectura actual está en posición ~530 (revisar layout documentado)
    const val = linea.substring(529, 538).trim();
    const n = parseInt(val);
    return isNaN(n) ? null : n;
  }

  private extraerIncidencia(linea: string): string | null {
    // Código de incidencia 2 chars en posición ~465 (revisar layout)
    const codigo = linea.substring(464, 466).trim();
    return codigo || null;
  }

  private extraerUrlFoto(linea: string): string | null {
    // URL foto si aplica (revisar posición en layout)
    return null;
  }

  private extraerConsumos(linea: string): number[] {
    // 4 consumos históricos del archivo
    return [];
  }

  // ---- Carga de lote ----
  async cargarLote(params: {
    zonaId?: string;
    rutaId?: string;
    periodo: string;
    tipoLote: string;
    archivoNombre: string;
    contenido: string;
    cargadoPor?: string;
  }) {
    const parsed = this.parseArchivoPlano(params.contenido);
    if (parsed.length === 0) {
      throw new BadRequestException('El archivo no contiene registros válidos');
    }

    // Validar que todos los contratos tengan lectura o incidencia (req 3)
    const sinDatos = parsed.filter(p => p.lecturaActual === null && !p.codigoIncidencia);
    if (sinDatos.length > 0) {
      throw new BadRequestException({
        message: 'Lote rechazado: contratos sin lectura ni incidencia',
        contratos: sinDatos.map(p => p.contrato),
      });
    }

    // Crear lote en BD
    const lote = await this.prisma.loteLecturas.create({
      data: {
        zonaId: params.zonaId ?? null,
        rutaId: params.rutaId ?? null,
        periodo: params.periodo,
        tipoLote: params.tipoLote,
        archivoNombre: params.archivoNombre,
        estado: 'Validando',
        totalRegistros: parsed.length,
        cargadoPor: params.cargadoPor ?? null,
      },
    });

    // Procesar cada lectura
    let totalValidos = 0;
    let totalConError = 0;
    const errores: { contrato: string; motivo: string }[] = [];

    for (const p of parsed) {
      // Verificar si incidencia es avería para generar estimada (req 4)
      const incidencia = p.codigoIncidencia
        ? await this.prisma.catalogoIncidencia.findUnique({ where: { codigo: p.codigoIncidencia } })
        : null;

      const esEstimada = incidencia?.esAveria ?? false;
      const consumoEstimado = esEstimada
        ? await this.calcularEstimada(p.contrato)
        : null;

      const estado = p.lecturaActual !== null ? 'Valida' : (esEstimada ? 'Estimada' : 'NoValida');

      await this.prisma.lectura.create({
        data: {
          loteId: lote.id,
          contratoId: p.contrato,
          periodo: params.periodo,
          lecturaActual: p.lecturaActual,
          lecturaAnterior: p.lecturaAnterior,
          consumoReal: p.lecturaActual !== null && p.lecturaAnterior !== null
            ? p.lecturaActual - p.lecturaAnterior
            : null,
          consumoEstimado,
          esEstimada,
          incidenciaId: incidencia?.id ?? null,
          urlFoto: p.urlFoto,
          estado,
          datosRaw: p.datosRaw,
        },
      });

      if (estado === 'Valida' || estado === 'Estimada') totalValidos++;
      else { totalConError++; errores.push({ contrato: p.contrato, motivo: 'Sin lectura válida' }); }
    }

    // Actualizar estadísticas del lote
    await this.prisma.loteLecturas.update({
      where: { id: lote.id },
      data: {
        estado: totalConError === 0 ? 'Valido' : 'Rechazado',
        totalValidos,
        totalConError,
        errores: errores.length > 0 ? errores : undefined,
      },
    });

    return { loteId: lote.id, totalRegistros: parsed.length, totalValidos, totalConError, errores };
  }

  // ---- Estimada: promedio de los últimos 3 consumos reales del contrato (req 4) ----
  private async calcularEstimada(contratoId: string): Promise<number> {
    const ultimas = await this.prisma.lectura.findMany({
      where: { contratoId, esEstimada: false, consumoReal: { not: null } },
      orderBy: { periodo: 'desc' },
      take: 3,
      select: { consumoReal: true },
    });
    if (ultimas.length === 0) return 0;
    const suma = ultimas.reduce((s, l) => s + (l.consumoReal ?? 0), 0);
    return Math.round(suma / ultimas.length);
  }

  // ---- Listar lotes con filtros ----
  async findLotes(params: { zonaId?: string; rutaId?: string; periodo?: string; estado?: string }) {
    return this.prisma.loteLecturas.findMany({
      where: {
        ...(params.zonaId && { zonaId: params.zonaId }),
        ...(params.rutaId && { rutaId: params.rutaId }),
        ...(params.periodo && { periodo: { contains: params.periodo } }),
        ...(params.estado && { estado: params.estado }),
      },
      include: { zona: { select: { id: true, nombre: true } }, ruta: { select: { id: true, sector: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---- Listar lecturas con paginación y filtros ----
  async findLecturas(params: {
    loteId?: string;
    contratoId?: string;
    rutaId?: string;
    zonaId?: string;
    periodo?: string;
    estado?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const where = {
      ...(params.loteId && { loteId: params.loteId }),
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.estado && { estado: params.estado }),
      ...(params.periodo && { periodo: { contains: params.periodo } }),
      ...(params.rutaId && { lote: { rutaId: params.rutaId } }),
      ...(params.zonaId && { lote: { zonaId: params.zonaId } }),
    };

    const [data, total] = await Promise.all([
      this.prisma.lectura.findMany({
        where,
        include: {
          incidencia: { select: { codigo: true, descripcion: true, esAveria: true } },
          lecturista: { select: { codigo: true, nombre: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.lectura.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ---- Catálogos ----
  async getLecturistas() {
    return this.prisma.lecturista.findMany({ include: { contratista: true }, orderBy: { nombre: 'asc' } });
  }

  async getIncidencias() {
    return this.prisma.catalogoIncidencia.findMany({ orderBy: { codigo: 'asc' } });
  }

  // ---- Mensajes lecturistas ----
  async createMensaje(data: { loteId?: string; contratoId?: string; mensaje: string; tipo?: string }) {
    return this.prisma.mensajeLecturista.create({ data });
  }

  async getMensajes(params: { loteId?: string; contratoId?: string }) {
    return this.prisma.mensajeLecturista.findMany({
      where: {
        ...(params.loteId && { loteId: params.loteId }),
        ...(params.contratoId && { contratoId: params.contratoId }),
        visible: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

interface ParsedLectura {
  contrato: string;
  cliente: string;
  lecturaAnterior: number | null;
  lecturaActual: number | null;
  codigoIncidencia: string | null;
  codigoLecturista: string;
  urlFoto: string | null;
  consumoHistorico: number[];
  datosRaw: object;
}
```

### Archivo: `backend/src/modules/lecturas/lecturas.controller.ts`

```typescript
import {
  Controller, Get, Post, Query, Param, Body, UploadedFile,
  UseInterceptors, UseGuards, ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LecturasService } from './lecturas.service';

@Controller('lecturas')
@UseGuards(JwtAuthGuard)
export class LecturasController {
  constructor(private readonly service: LecturasService) {}

  // ---- Lotes ----
  @Get('lotes')
  findLotes(
    @Query('zonaId') zonaId?: string,
    @Query('rutaId') rutaId?: string,
    @Query('periodo') periodo?: string,
    @Query('estado') estado?: string,
  ) {
    return this.service.findLotes({ zonaId, rutaId, periodo, estado });
  }

  @Post('lotes/upload')
  @UseInterceptors(FileInterceptor('archivo'))
  async uploadLote(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: { zonaId?: string; rutaId?: string; periodo: string; tipoLote?: string },
  ) {
    const contenido = archivo.buffer.toString('latin1'); // encoding AQUACIS
    return this.service.cargarLote({
      zonaId: body.zonaId,
      rutaId: body.rutaId,
      periodo: body.periodo,
      tipoLote: body.tipoLote ?? 'Lectura',
      archivoNombre: archivo.originalname,
      contenido,
    });
  }

  // ---- Lecturas individuales ----
  @Get()
  findLecturas(
    @Query('loteId') loteId?: string,
    @Query('contratoId') contratoId?: string,
    @Query('rutaId') rutaId?: string,
    @Query('zonaId') zonaId?: string,
    @Query('periodo') periodo?: string,
    @Query('estado') estado?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.service.findLecturas({ loteId, contratoId, rutaId, zonaId, periodo, estado, page, limit });
  }

  // ---- Catálogos ----
  @Get('catalogo/lecturistas')
  getLecturistas() { return this.service.getLecturistas(); }

  @Get('catalogo/incidencias')
  getIncidencias() { return this.service.getIncidencias(); }

  // ---- Mensajes lecturistas ----
  @Get('mensajes')
  getMensajes(@Query('loteId') loteId?: string, @Query('contratoId') contratoId?: string) {
    return this.service.getMensajes({ loteId, contratoId });
  }

  @Post('mensajes')
  createMensaje(@Body() body: { loteId?: string; contratoId?: string; mensaje: string; tipo?: string }) {
    return this.service.createMensaje(body);
  }
}
```

### Archivo: `backend/src/modules/lecturas/lecturas.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LecturasController } from './lecturas.controller';
import { LecturasService } from './lecturas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } })],
  controllers: [LecturasController],
  providers: [LecturasService],
  exports: [LecturasService],
})
export class LecturasModule {}
```

Registrar `LecturasModule` en `backend/src/app.module.ts` imports.

---

## Paso 3: Frontend — `frontend/src/pages/Lecturas.tsx`

Reemplazar el stub actual con implementación completa:

```typescript
// Estructura de la página (implementar con shadcn-ui Tabs, Table, Dialog, Progress)
// Pestaña 1: "Carga" — upload de archivo plano
//   - Selector de zona, ruta, periodo, tipo de lote
//   - Dropzone para archivo .txt/.dat
//   - Progress bar durante upload
//   - Resultado: estadísticas del lote (válidos, con error, lista de errores)
//
// Pestaña 2: "Validaciones" — lecturas del lote actual o filtradas
//   - Tabla con filtros: estado (Valida/NoValida/Estimada), contrato, ruta, zona
//   - Columnas: Contrato, Cliente, Lectura Anterior, Lectura Actual, Consumo, Incidencia, Estado, Foto
//   - Badge de color por estado (verde=Válida, amarillo=Estimada, rojo=NoVálida)
//   - Indicador de valores fuera de rango (min/max zona)
//
// Pestaña 3: "Historial" — lotes anteriores
//   - Tabla paginada de lotes con: fecha, zona, ruta, periodo, total, válidos, errores, estado
//   - Click en lote → carga sus lecturas en pestaña Validaciones
```

Conectar a `frontend/src/api/lecturas.ts`:

```typescript
// Agregar en lecturas.ts:
export const uploadLote = (formData: FormData) =>
  api.post('/lecturas/lotes/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getLotes = (params?: Record<string, string>) =>
  api.get('/lecturas/lotes', { params }).then(r => r.data);

export const getLecturas = (params?: Record<string, string | number>) =>
  api.get('/lecturas', { params }).then(r => r.data);

export const getCatalogoLecturistas = () =>
  api.get('/lecturas/catalogo/lecturistas').then(r => r.data);

export const getCatalogoIncidencias = () =>
  api.get('/lecturas/catalogo/incidencias').then(r => r.data);

export const getMensajes = (params?: Record<string, string>) =>
  api.get('/lecturas/mensajes', { params }).then(r => r.data);

export const createMensaje = (data: object) =>
  api.post('/lecturas/mensajes', data).then(r => r.data);
```

---

## Paso 4: Seed de catálogos

Agregar a `backend/prisma/seed.ts`:

```typescript
// Seed incidencias (extraídas de Observac.dat real)
const incidencias = [
  { codigo: 'CB', descripcion: 'CORTE DE BARDA', esAveria: false },
  { codigo: 'CD', descripcion: 'CUADRO DAÑADO', esAveria: true },
  { codigo: 'CE', descripcion: 'CONTADOR ERRADO', esAveria: true },
  { codigo: 'EN', descripcion: 'EN CONSTRUCCION', esAveria: false },
  { codigo: 'IC', descripcion: 'INCIDENCIA CAMPO', esAveria: false },
  { codigo: 'IO', descripcion: 'INTERIOR CERRADO', esAveria: false },
  { codigo: 'L',  descripcion: 'LECTURA NORMAL', esAveria: false },
  { codigo: 'M',  descripcion: 'MEDIDOR NUEVO', esAveria: false },
  { codigo: 'S',  descripcion: 'SIN MEDIDOR', esAveria: true },
  { codigo: 'TE', descripcion: 'TOMA EN TIERRA', esAveria: true },
];

for (const inc of incidencias) {
  await prisma.catalogoIncidencia.upsert({
    where: { codigo: inc.codigo },
    create: inc,
    update: inc,
  });
}
```

---

## Notas importantes para el ejecutor

1. **Encoding del archivo plano:** Los archivos AQUACIS usan ISO-8859-1 (latin1), NO UTF-8. Usar `buffer.toString('latin1')` al parsear.

2. **Posiciones exactas del layout:** Las posiciones de los campos en el archivo plano deben verificarse con el archivo `Layout documentación.xlsx` real (abrir con Excel o librería como `xlsx`). Las posiciones indicadas en el código son estimadas basadas en la muestra `0001M08L20`.

3. **MulterModule:** Asegurarse de que `@nestjs/platform-express` esté instalado. Si no: `npm install --save @nestjs/platform-express multer @types/multer`

4. **Módulo mensajes (req 11):** Si el negocio decide mantenerlo deshabilitado, el endpoint existe pero la UI muestra un toggle "Habilitar mensajes de campo" que controla la visibilidad.

5. **Guardrails — NO modificar:**
   - `backend/src/modules/auth/` — no tocar el módulo de autenticación
   - `backend/prisma/migrations/` — solo AGREGAR nueva migración, no modificar las existentes
   - `frontend/src/context/` — no modificar DataContext (está siendo reemplazado por backend real)

---

## Dependencias a instalar

```bash
# Backend
cd backend
npm install --save @nestjs/platform-express multer @types/multer

# Si se requiere leer xlsx para validar layouts (opcional, solo desarrollo)
npm install --save xlsx
```

---

## Validación

```bash
# 1. Compilar backend
cd backend && npm run build

# 2. Aplicar migración
npx prisma migrate dev --name add_lecturas_module

# 3. Ejecutar seed
npx prisma db seed

# 4. Probar upload con archivo de muestra
curl -X POST http://localhost:3001/lecturas/lotes/upload \
  -H "Authorization: Bearer <token>" \
  -F "archivo=@Requerimientos/Documentos/.../0001M08L20" \
  -F "periodo=202408" \
  -F "tipoLote=Lectura"

# 5. Frontend
cd frontend && npm run dev
# Navegar a /lecturas y verificar las 3 pestañas
```
