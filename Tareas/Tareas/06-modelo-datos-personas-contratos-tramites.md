# Tarea 06 — Modelo de Personas, Contratos, Trámites y Documentos

**PRD reqs:** 28–34  
**Sección PRD:** "Modelo de datos de personas, contratos y puntos de servicio" + "Gestión de contratos, trámites y documentos"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui

---

## Contexto y estado actual

### Schema Prisma actual — Contrato (verificado)

```prisma
model Contrato {
  id                      String   @id @default(cuid())
  tomaId                  String?
  tipoContrato            String   // tipo de contrato
  tipoServicio            String   // tipo de servicio
  nombre                  String   // nombre del cliente (plano, sin entidad Persona)
  rfc                     String   // RFC plano en Contrato
  direccion               String
  contacto                String
  estado                  String
  fecha                   String
  medidorId               String?
  rutaId                  String?
  zonaId                  String?
  domiciliado             Boolean  @default(false)
  fechaReconexionPrevista String?
  // relaciones existentes...
}
```

**Problema (req 28–30):** El contrato actual tiene nombre/RFC planos. El PRD requiere un modelo de `Persona` separado que puede ser Física o Moral, con múltiples roles por contrato (Propietario, Cliente, PersonaFiscal) y separación de datos de cliente vs datos de servicio.

### Estado del frontend

- `frontend/src/pages/TramitesDigitales.tsx` — stub vacío
- `frontend/src/pages/Simulador.tsx` — stub/parcial
- `frontend/src/pages/Contratos.tsx` — implementación parcial

---

## Objetivo

1. Entidad `Persona` separada del contrato (req 28, 29)
2. Roles de persona en contrato: Propietario, Cliente, PersonaFiscal (req 29)
3. Historial de cambios del contrato (req 31)
4. Módulo de trámites: alta, baja, cambio nombre, subrogación, cambio tarifa (req 32–34)
5. Gestión de documentos por trámite (req 33)
6. Frontend: TramitesDigitales.tsx con flujo guiado por tipo; Simulador vinculado a contrato

---

## Aceptación (Definition of Done)

- [ ] Migración con `Persona`, `RolPersonaContrato`, `HistoricoContrato`, `Tramite`, `Documento` aplicada
- [ ] Contratos existentes NO pierden datos (migración debe preservar nombre/rfc en Persona nueva)
- [ ] `GET/POST /personas` con búsqueda por nombre o RFC
- [ ] `GET/POST /tramites` con CRUD y transición de estados
- [ ] `POST /tramites/:id/documentos` para adjuntar documentos
- [ ] `GET /contratos/:id/historial` devuelve historial de cambios
- [ ] Frontend `TramitesDigitales.tsx` con flujo guiado por tipo de trámite

---

## Paso 1: Migración Prisma

> **IMPORTANTE:** Esta migración debe ser ejecutada con cuidado. Los contratos existentes tienen `nombre` y `rfc` directamente — la migración debe crear `Persona` para cada contrato existente y asignar el rol `Propietario`.

```prisma
// Agregar a backend/prisma/schema.prisma

model Persona {
  id         String   @id @default(cuid())
  nombre     String
  rfc        String?
  tipo       String   @default("Fisica")  // Fisica | Moral
  email      String?
  telefono   String?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  roles      RolPersonaContrato[]
  tramites   Tramite[]

  @@index([rfc])
  @@index([nombre])
  @@map("personas")
}

model RolPersonaContrato {
  id         String   @id @default(cuid())
  personaId  String   @map("persona_id")
  contratoId String   @map("contrato_id")
  rol        String
  // Propietario | Cliente | PersonaFiscal | Arrendatario
  activo     Boolean  @default(true)
  fechaDesde DateTime @default(now()) @map("fecha_desde")
  fechaHasta DateTime? @map("fecha_hasta")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  persona    Persona  @relation(fields: [personaId], references: [id], onDelete: Restrict)
  contrato   Contrato @relation(fields: [contratoId], references: [id], onDelete: Restrict)

  @@unique([personaId, contratoId, rol])
  @@index([contratoId])
  @@index([personaId])
  @@map("roles_persona_contrato")
}

model HistoricoContrato {
  id             String   @id @default(cuid())
  contratoId     String   @map("contrato_id")
  campo          String
  valorAnterior  String?  @map("valor_anterior")
  valorNuevo     String?  @map("valor_nuevo")
  motivo         String?
  usuario        String?
  tramiteId      String?  @map("tramite_id")
  createdAt      DateTime @default(now()) @map("created_at")

  contrato       Contrato @relation(fields: [contratoId], references: [id], onDelete: Cascade)

  @@index([contratoId])
  @@index([campo])
  @@map("historico_contratos")
}

model Tramite {
  id          String   @id @default(cuid())
  folio       String   @unique
  contratoId  String?  @map("contrato_id")
  personaId   String?  @map("persona_id")
  tipo        String
  // Alta | Baja | CambioNombre | Subrogacion | CambioTarifa | CambioMedidor | 
  // Factibilidad | ReposicionMedidor | Aclaracion
  estado      String   @default("Iniciado")
  // Iniciado | EnRevision | Aprobado | Rechazado | Completado | Cancelado
  descripcion String?
  datosAdicionales Json? @map("datos_adicionales")
  // campos extra según tipo: { tarifa_nueva, motivo_baja, nuevo_nombre, etc. }
  aprobadoPor String?  @map("aprobado_por")
  fechaAprobacion DateTime? @map("fecha_aprobacion")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  contrato    Contrato? @relation(fields: [contratoId], references: [id], onDelete: SetNull)
  persona     Persona?  @relation(fields: [personaId], references: [id], onDelete: SetNull)
  documentos  Documento[]
  historial   HistoricoContrato[]

  @@index([contratoId])
  @@index([tipo])
  @@index([estado])
  @@map("tramites")
}

model Documento {
  id         String   @id @default(cuid())
  tramiteId  String   @map("tramite_id")
  nombre     String
  tipo       String
  // INE | Comprobante | CURP | RFC | Escrituras | Contrato | Otro
  url        String?
  verificado Boolean  @default(false)
  notas      String?
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  tramite    Tramite  @relation(fields: [tramiteId], references: [id], onDelete: Cascade)

  @@index([tramiteId])
  @@map("documentos")
}
```

Agregar relaciones inversas en `Contrato`:
```prisma
// En model Contrato agregar:
personas         RolPersonaContrato[]
historico        HistoricoContrato[]
tramites         Tramite[]
```

### Script de migración de datos existentes

Después de `npx prisma migrate dev --name add_personas_tramites`, ejecutar este script de seed/migración para preservar datos:

```typescript
// Agregar en backend/prisma/seed.ts (o crear script separado migrate-personas.ts)
// Este script crea una Persona para cada contrato que no tenga una asignada

const contratos = await prisma.contrato.findMany({
  where: { personas: { none: {} } }, // contratos sin persona asignada
  select: { id: true, nombre: true, rfc: true },
});

for (const c of contratos) {
  const persona = await prisma.persona.create({
    data: {
      nombre: c.nombre,
      rfc: c.rfc || null,
      tipo: 'Fisica',
    },
  });
  await prisma.rolPersonaContrato.create({
    data: {
      personaId: persona.id,
      contratoId: c.id,
      rol: 'Propietario',
    },
  });
}
console.log(`Migradas ${contratos.length} personas desde contratos existentes`);
```

---

## Paso 2: Backend — módulos `personas` y `tramites`

### `backend/src/modules/personas/personas.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { nombre?: string; rfc?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.nombre && { nombre: { contains: params.nombre, mode: 'insensitive' as const } }),
      ...(params.rfc && { rfc: { contains: params.rfc } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.persona.findMany({
        where,
        include: { roles: { include: { contrato: { select: { id: true, nombre: true, estado: true } } } } },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.persona.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const p = await this.prisma.persona.findUnique({
      where: { id },
      include: { roles: { include: { contrato: { select: { id: true, nombre: true, estado: true, zonaId: true } } } } },
    });
    if (!p) throw new NotFoundException('Persona no encontrada');
    return p;
  }

  async create(data: { nombre: string; rfc?: string; tipo?: string; email?: string; telefono?: string }) {
    return this.prisma.persona.create({ data });
  }

  async update(id: string, data: Partial<{ nombre: string; rfc: string; tipo: string; email: string; telefono: string }>) {
    await this.findOne(id);
    return this.prisma.persona.update({ where: { id }, data });
  }

  async asignarRol(personaId: string, contratoId: string, rol: string) {
    return this.prisma.rolPersonaContrato.upsert({
      where: { personaId_contratoId_rol: { personaId, contratoId, rol } },
      create: { personaId, contratoId, rol },
      update: { activo: true, fechaHasta: null },
    });
  }

  async revocarRol(personaId: string, contratoId: string, rol: string) {
    return this.prisma.rolPersonaContrato.update({
      where: { personaId_contratoId_rol: { personaId, contratoId, rol } },
      data: { activo: false, fechaHasta: new Date() },
    });
  }
}
```

### `backend/src/modules/tramites/tramites.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TramitesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generarFolio(tipo: string): Promise<string> {
    const hoy = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const count = await this.prisma.tramite.count({ where: { tipo } });
    return `${tipo.substring(0, 3).toUpperCase()}-${hoy}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async findAll(params: { contratoId?: string; tipo?: string; estado?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
    };
    const [data, total] = await Promise.all([
      this.prisma.tramite.findMany({
        where,
        include: {
          contrato: { select: { id: true, nombre: true } },
          persona: { select: { id: true, nombre: true, rfc: true } },
          documentos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tramite.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const t = await this.prisma.tramite.findUnique({
      where: { id },
      include: {
        contrato: { select: { id: true, nombre: true, estado: true, zonaId: true } },
        persona: { select: { id: true, nombre: true, rfc: true, tipo: true } },
        documentos: true,
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!t) throw new NotFoundException('Trámite no encontrado');
    return t;
  }

  async create(dto: {
    contratoId?: string;
    personaId?: string;
    tipo: string;
    descripcion?: string;
    datosAdicionales?: object;
  }) {
    const folio = await this.generarFolio(dto.tipo);
    return this.prisma.tramite.create({
      data: {
        folio,
        contratoId: dto.contratoId ?? null,
        personaId: dto.personaId ?? null,
        tipo: dto.tipo,
        descripcion: dto.descripcion ?? null,
        datosAdicionales: dto.datosAdicionales ?? null,
      },
      include: { contrato: { select: { id: true, nombre: true } }, documentos: true },
    });
  }

  async updateEstado(id: string, estado: string, aprobadoPor?: string) {
    const tramite = await this.findOne(id);
    const estadosValidos = ['Iniciado', 'EnRevision', 'Aprobado', 'Rechazado', 'Completado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) throw new BadRequestException('Estado inválido');

    const data: any = { estado };
    if (estado === 'Aprobado' || estado === 'Completado') {
      data.aprobadoPor = aprobadoPor ?? null;
      data.fechaAprobacion = new Date();
    }

    const updated = await this.prisma.tramite.update({ where: { id }, data });

    // Ejecutar efectos del trámite al completarlo
    if (estado === 'Completado' && tramite.contratoId) {
      await this.ejecutarEfectosTramite(tramite);
    }

    return updated;
  }

  private async ejecutarEfectosTramite(tramite: any) {
    const { tipo, contratoId, datosAdicionales } = tramite;
    const d = datosAdicionales as any;

    switch (tipo) {
      case 'CambioNombre': {
        if (d?.nombre_nuevo) {
          const anterior = await this.prisma.contrato.findUnique({
            where: { id: contratoId }, select: { nombre: true },
          });
          await this.prisma.contrato.update({ where: { id: contratoId }, data: { nombre: d.nombre_nuevo } });
          await this.prisma.historicoContrato.create({
            data: {
              contratoId,
              campo: 'nombre',
              valorAnterior: anterior?.nombre,
              valorNuevo: d.nombre_nuevo,
              motivo: `Trámite ${tramite.folio}`,
              tramiteId: tramite.id,
            },
          });
        }
        break;
      }
      case 'Baja': {
        await this.prisma.contrato.update({ where: { id: contratoId }, data: { estado: 'Inactivo' } });
        await this.prisma.historicoContrato.create({
          data: { contratoId, campo: 'estado', valorAnterior: 'Activo', valorNuevo: 'Inactivo', motivo: `Baja: ${tramite.folio}`, tramiteId: tramite.id },
        });
        break;
      }
      case 'CambioTarifa': {
        if (d?.tipo_servicio_nuevo) {
          const anterior = await this.prisma.contrato.findUnique({ where: { id: contratoId }, select: { tipoServicio: true } });
          await this.prisma.contrato.update({ where: { id: contratoId }, data: { tipoServicio: d.tipo_servicio_nuevo } });
          await this.prisma.historicoContrato.create({
            data: { contratoId, campo: 'tipoServicio', valorAnterior: anterior?.tipoServicio, valorNuevo: d.tipo_servicio_nuevo, motivo: `Trámite ${tramite.folio}`, tramiteId: tramite.id },
          });
        }
        break;
      }
    }
  }

  async addDocumento(tramiteId: string, data: { nombre: string; tipo: string; url?: string; notas?: string }) {
    await this.findOne(tramiteId);
    return this.prisma.documento.create({ data: { tramiteId, ...data } });
  }

  async verificarDocumento(documentoId: string, verificado: boolean) {
    return this.prisma.documento.update({ where: { id: documentoId }, data: { verificado } });
  }
}
```

### Contratos — agregar endpoint de historial

En `backend/src/modules/contratos/contratos.service.ts` agregar:

```typescript
async getHistorial(contratoId: string) {
  return this.prisma.historicoContrato.findMany({
    where: { contratoId },
    orderBy: { createdAt: 'desc' },
    include: { tramite: { select: { folio: true, tipo: true } } },
  });
}
```

En `contratos.controller.ts`:
```typescript
@Get(':id/historial')
getHistorial(@Param('id') id: string) {
  return this.service.getHistorial(id);
}
```

---

## Paso 3: Frontend

### `frontend/src/pages/TramitesDigitales.tsx`

```typescript
// Estructura de la página:
//
// 1. Listado de trámites con filtros: tipo, estado, contrato, fecha
//    - Tabla: Folio, Tipo, Contrato, Estado (badge), Fecha creación, Acciones
//
// 2. "Nuevo Trámite" — stepper guiado por tipo:
//
//    Paso 1: Selección de tipo
//      - Grid de cards: Alta | Baja | Cambio Nombre | Subrogación |
//        Cambio Tarifa | Cambio Medidor | Factibilidad | Aclaración
//
//    Paso 2: Datos del trámite (campos varían por tipo):
//      - Alta: buscar/crear Persona, datos de Toma/servicio
//      - Baja: buscar Contrato, motivo
//      - Cambio Nombre: buscar Contrato, nombre nuevo, documentos requeridos
//      - Subrogación: buscar Contrato, nueva Persona propietaria
//      - Cambio Tarifa: buscar Contrato, nueva tarifa, justificación
//
//    Paso 3: Documentos requeridos
//      - Checklist de documentos por tipo de trámite
//      - Upload de documentos (PDF/JPG)
//      - Estado verificado/pendiente por documento
//
//    Paso 4: Revisión y envío
//
// 3. Detalle de trámite:
//    - Info general + documentos + historial de estados
//    - Botones según rol: Aprobar/Rechazar (ADMIN), Completar (OPERADOR)
```

### Actualizar `frontend/src/pages/Contratos.tsx`

Agregar pestaña "Historial" en el detalle de contrato:
```typescript
// En el modal/panel de detalle de contrato, agregar pestaña:
// "Historial de cambios" → GET /contratos/:id/historial
// Tabla: fecha, campo, valor anterior, valor nuevo, motivo, trámite asociado
```

### Actualizar `frontend/src/pages/Simulador.tsx`

Si existe, vincular a la búsqueda de contrato real:
```typescript
// GET /contratos/:id → obtener contrato real
// GET /contratos/:id/historial → historial de tarifas
// POST /tramites → crear trámite de CambioTarifa desde simulador
```

---

## Notas importantes para el ejecutor

1. **Compatibilidad con datos existentes:** El modelo `Contrato` ya tiene `nombre` y `rfc` directamente. **NO eliminar estos campos del schema** — solo agregar la relación con `Persona`. La migración de datos (script seed) crea entidades `Persona` para los contratos existentes sin romper nada.

2. **Folio único:** El folio de trámite usa una combinación de tipo+fecha+secuencia. En producción con alta concurrencia, considerar usar una secuencia de BD (`CREATE SEQUENCE tramite_seq`) en vez del count.

3. **Documentos físicos:** La URL de documentos puede ser una ruta relativa al filesystem del servidor o una URL de un servicio de almacenamiento (S3, MinIO). El sistema solo almacena la URL — el upload físico debe resolverse según la infraestructura disponible (Easypanel/Docker volume).

4. **Documentos requeridos por tipo:** La lógica de qué documentos son requeridos para cada tipo de trámite debe definirse como una constante/config o en BD. Iniciar con una constante en el frontend.

5. **Guardrails — NO modificar:**
   - Campos `nombre`, `rfc` del modelo `Contrato` — NO eliminar
   - `portal.service.ts` — ya funciona con `Contrato.nombre`
   - Migraciones previas

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_personas_tramites
# Ejecutar migración de datos
npx ts-node prisma/migrate-personas.ts

npm run build

# Crear persona
curl -X POST http://localhost:3001/personas \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan García","rfc":"GAJJ800101XXX","tipo":"Fisica"}'

# Crear trámite de cambio de nombre
curl -X POST http://localhost:3001/tramites \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId":"<id>","tipo":"CambioNombre","datosAdicionales":{"nombre_nuevo":"Juan García López"}}'

# Completar trámite
curl -X PATCH http://localhost:3001/tramites/<id>/estado \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"estado":"Completado","aprobadoPor":"admin@empresa.mx"}'

# Verificar historial
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/contratos/<id>/historial
```
