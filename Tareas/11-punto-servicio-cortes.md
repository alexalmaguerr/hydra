# Tarea 11 — Punto de Servicio y Modelo de Cortes

**PRD reqs:** 9, 10, 11, 12, 13, 14  
**Sección PRD:** "Punto de servicio como entidad propia"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencias:** T12 (Domicilios para vinculación geográfica)

---

## Contexto

El PRD 2026-04-06 define el punto de servicio como entidad central con información técnica, administrativa y geográfica. Debe soportar catálogos operativos, tipología de cortes, relaciones padre-hijo con reglas de repartición, y migración desde el modelo actual de `Toma`.

---

## Objetivo

1. Modelo `PuntoServicio` como entidad propia separada de `Toma`
2. Catálogos operativos: TipoSuministro, EstructuraTecnica
3. Modelo de tipos de corte: `CatalogoTipoCorte`
4. Relaciones padre-hijo entre puntos de servicio con vigencia
5. Reglas de repartición de consumo/facturación en jerarquías
6. Migración de `Contrato.tomaId` → `PuntoServicio`

---

## Aceptación (Definition of Done)

- [ ] Migración con `PuntoServicio`, `CatalogoTipoCorte`, `CatalogoTipoSuministro`, `CatalogoEstructuraTecnica` aplicada
- [ ] `GET/POST /puntos-servicio` CRUD completo
- [ ] `GET /puntos-servicio/:id/hijos` retorna jerarquía de hijos
- [ ] `POST /puntos-servicio/:id/vincular-padre` establece relación padre-hijo
- [ ] `GET/POST /catalogos/tipos-corte` CRUD de tipos de corte
- [ ] `GET/POST /catalogos/tipos-suministro` CRUD de tipos de suministro
- [ ] `GET/POST /catalogos/estructuras-tecnicas` CRUD de estructuras técnicas
- [ ] Frontend: gestión de puntos de servicio con mapa de jerarquías
- [ ] Script de migración: `Toma` → `PuntoServicio`

---

## Modelos Prisma (ya aplicados en schema)

```prisma
model PuntoServicio {
  id                    String   @id @default(cuid())
  codigo                String   @unique
  domicilioId           String?  @map("domicilio_id")
  tipoSuministroId      String?  @map("tipo_suministro_id")
  estructuraTecnicaId   String?  @map("estructura_tecnica_id")
  diametroToma          String?
  materialTuberia       String?
  profundidadToma       Decimal?
  tieneValvula          Boolean  @default(false)
  tieneCaja             Boolean  @default(false)
  gpsLat                Decimal?
  gpsLng                Decimal?
  estado                String   @default("Activo")
  cortable              Boolean  @default(true)
  motivoNoCortable      String?
  puntoServicioPadreId  String?  @map("punto_servicio_padre_id")
  reparticionConsumo    Decimal? // porcentaje 0.00–100.00
  // ... relaciones
}

model CatalogoTipoCorte {
  id          String   @id @default(cuid())
  codigo      String   @unique
  descripcion String
  impacto     String?  // suspensión_total | restricción_parcial | solo_registro
  requiereCuadrilla Boolean @default(false)
  activo      Boolean  @default(true)
}
```

---

## Paso 1: Backend — módulo `puntos-servicio`

### `puntos-servicio.service.ts`

```typescript
@Injectable()
export class PuntosServicioService {
  async findAll(params: { estado?: string; tipoSuministroId?: string; page?: number; limit?: number }) {
    // Listado con filtros y relaciones
  }

  async findOne(id: string) {
    // Incluir: domicilio, tipoSuministro, estructuraTecnica, hijos, padre
  }

  async create(dto: CreatePuntoServicioDto) {
    // Validar código único, asignar catálogos
  }

  async getHijos(id: string) {
    // Retornar árbol de hijos con repartición
  }

  async vincularPadre(id: string, padreId: string, reparticion: number) {
    // Establecer relación padre-hijo con porcentaje de repartición
    // Validar que la suma de reparticiones de hijos no exceda 100%
  }
}
```

### Seed de catálogos operativos

```typescript
// Tipos de corte iniciales
const tiposCorte = [
  { codigo: 'DEUDA', descripcion: 'Corte por adeudo', impacto: 'suspensión_total', requiereCuadrilla: true },
  { codigo: 'BAJA_TEMP', descripcion: 'Baja temporal', impacto: 'suspensión_total', requiereCuadrilla: true },
  { codigo: 'ADMIN', descripcion: 'Corte administrativo', impacto: 'solo_registro', requiereCuadrilla: false },
  { codigo: 'FUGA', descripcion: 'Corte por fuga', impacto: 'suspensión_total', requiereCuadrilla: true },
];

// Tipos de suministro iniciales
const tiposSuministro = [
  { codigo: 'AGUA', descripcion: 'Agua potable' },
  { codigo: 'SANEAMIENTO', descripcion: 'Saneamiento' },
  { codigo: 'ALCANTARILLADO', descripcion: 'Alcantarillado' },
  { codigo: 'MIXTO', descripcion: 'Agua + Saneamiento' },
];
```

---

## Paso 2: Migración de datos Toma → PuntoServicio

```typescript
// Script de migración
// Para cada Toma existente, crear un PuntoServicio equivalente
const tomas = await prisma.toma.findMany({ include: { contratos: true } });
for (const toma of tomas) {
  const ps = await prisma.puntoServicio.create({
    data: {
      codigo: `PS-${toma.id.substring(0, 8)}`,
      estado: toma.estado === 'Asignada' ? 'Activo' : 'Disponible',
    },
  });
  // Actualizar contratos para apuntar al nuevo PuntoServicio
  for (const contrato of toma.contratos) {
    await prisma.contrato.update({
      where: { id: contrato.id },
      data: { puntoServicioId: ps.id },
    });
  }
}
```

---

## Paso 3: Frontend

- Listado de puntos de servicio con filtros (estado, tipo suministro, zona)
- Detalle con: info técnica, contratos asociados, jerarquía padre-hijo
- Administración de catálogos operativos (tipos corte, suministro, estructura técnica)
- Visualización de árbol de jerarquía con porcentajes de repartición

---

## Preguntas abiertas bloqueantes

- ⚠️ #5: Tipos de corte definitivos y su impacto operativo/facturación
- ⚠️ #10: Regla de repartición padre-hijo para consumo y facturación

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_puntos_servicio
npm run build

curl -X POST http://localhost:3001/puntos-servicio \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"codigo":"PS-001","tipoSuministroId":"<id>","cortable":true}'

curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/puntos-servicio/<id>/hijos
```
