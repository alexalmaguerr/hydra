# Tarea 13 — Tipos de Contratación Parametrizados y Catálogos Funcionales

**PRD reqs:** 22, 23, 24, 25  
**Sección PRD:** "Parametrización de tipos de contratación"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencias:** T14 (Motor tarifario — conceptos de cobro usan tarifas)

---

## Contexto

El PRD 2026-04-06 requiere que cada tipo de contratación se parametrice con conceptos de cobro, cláusulas contractuales y documentos requeridos, incluyendo obligatoriedad. El sistema debe asociar automáticamente conceptos y cláusulas al seleccionar un tipo de contratación, y actualizar consistentemente al cambiar de tipo.

---

## Objetivo

1. Modelo `TipoContratacion` parametrizable
2. Tablas de asociación: ConceptoCobro ↔ TipoContratacion, Clausula ↔ TipoContratacion, DocumentoRequerido ↔ TipoContratacion
3. Asociación automática al crear contrato con un tipo seleccionado
4. Lógica de cambio de tipo: actualización consistente sin romper contabilidad
5. Homologación de catálogos funcionales

---

## Aceptación (Definition of Done)

- [ ] Migración con `TipoContratacion`, `ConceptoCobro`, `ClausulaContractual` y tablas de asociación aplicada
- [ ] `GET/POST /tipos-contratacion` CRUD
- [ ] `GET /tipos-contratacion/:id/configuracion` retorna conceptos, cláusulas y documentos asociados
- [ ] `POST /tipos-contratacion/:id/conceptos` agrega concepto con obligatoriedad
- [ ] `POST /tipos-contratacion/:id/clausulas` agrega cláusula con orden
- [ ] `POST /tipos-contratacion/:id/documentos-requeridos` agrega documento
- [ ] `POST /contratos/:id/cambiar-tipo` actualiza tipo con recálculo de conceptos/tarifas
- [ ] `GET /catalogos/conceptos-cobro` CRUD de conceptos
- [ ] `GET /catalogos/clausulas` CRUD de cláusulas
- [ ] Frontend: admin de tipos de contratación con configuración visual

---

## Modelos Prisma (ya aplicados en schema)

```prisma
model TipoContratacion {
  id              String   @id @default(cuid())
  codigo          String   @unique
  nombre          String
  descripcion     String?
  requiereMedidor Boolean  @default(true)
  activo          Boolean  @default(true)
  // ... relaciones: contratos[], conceptos[], clausulas[], documentos[]
}

model ConceptoCobro {
  id          String   @id @default(cuid())
  codigo      String   @unique
  nombre      String
  tipo        String   // fijo | variable | porcentual
  montoBase   Decimal?
  ivaPct      Decimal  @default(16)
  activo      Boolean  @default(true)
}

model ClausulaContractual {
  id        String   @id @default(cuid())
  codigo    String   @unique
  titulo    String
  contenido String   @db.Text
  version   String   @default("1.0")
  activo    Boolean  @default(true)
}

// Tablas de asociación con obligatoriedad y orden
model ConceptoCobroTipoContratacion { ... }
model ClausulaTipoContratacion { ... }
model DocumentoRequeridoTipoContratacion { ... }
```

---

## Paso 1: Backend — módulo `tipos-contratacion`

### `tipos-contratacion.service.ts`

```typescript
@Injectable()
export class TiposContratacionService {
  async getConfiguracion(tipoContratacionId: string) {
    return this.prisma.tipoContratacion.findUnique({
      where: { id: tipoContratacionId },
      include: {
        conceptos: { include: { conceptoCobro: true }, orderBy: { orden: 'asc' } },
        clausulas: { include: { clausula: true }, orderBy: { orden: 'asc' } },
        documentos: { orderBy: { obligatorio: 'desc' } },
      },
    });
  }

  async aplicarConfiguracionAContrato(contratoId: string, tipoContratacionId: string) {
    const config = await this.getConfiguracion(tipoContratacionId);
    // 1. Actualizar contrato.tipoContratacionId
    // 2. Crear CostoContrato para cada concepto obligatorio
    // 3. Retornar lista de documentos requeridos para el trámite
  }

  async cambiarTipoContrato(contratoId: string, nuevoTipoId: string, motivo: string) {
    // 1. Registrar en HistoricoContrato
    // 2. Remover conceptos del tipo anterior
    // 3. Aplicar conceptos del nuevo tipo
    // 4. Recalcular tarifas si aplica
    // 5. NO modificar pagos ni pólizas ya generadas
  }
}
```

---

## Paso 2: Seed de catálogos funcionales iniciales

```typescript
const tiposContratacion = [
  { codigo: 'DOM_HAB', nombre: 'Doméstico Habitacional', requiereMedidor: true },
  { codigo: 'COM', nombre: 'Comercial', requiereMedidor: true },
  { codigo: 'IND', nombre: 'Industrial', requiereMedidor: true },
  { codigo: 'GOB', nombre: 'Gobierno', requiereMedidor: true },
  { codigo: 'MIXTO', nombre: 'Uso Mixto', requiereMedidor: true },
];

const conceptosCobro = [
  { codigo: 'AGUA', nombre: 'Servicio de agua', tipo: 'variable' },
  { codigo: 'SANEAMIENTO', nombre: 'Saneamiento', tipo: 'porcentual' },
  { codigo: 'ALCANTARILLADO', nombre: 'Alcantarillado', tipo: 'fijo' },
  { codigo: 'CONTRATACION', nombre: 'Cargo por contratación', tipo: 'fijo' },
  { codigo: 'RECONEXION', nombre: 'Cargo por reconexión', tipo: 'fijo' },
];
```

---

## Paso 3: Frontend

- Admin de tipos de contratación: tabla con CRUD
- Detalle de tipo con pestañas: Conceptos | Cláusulas | Documentos
- Drag-and-drop para ordenar cláusulas
- Toggle obligatorio/opcional por concepto y documento
- En formulario de contrato: al seleccionar tipo → cargar configuración automática

---

## Preguntas abiertas bloqueantes

- ⚠️ #6: Regla definitiva de asociación automática conceptos/cláusulas/docs
- ⚠️ #7: Resolución de cambio de tipo sin afectar contabilidad/convenios
- ⚠️ #12: Documentos obligatorios por cada tipo de contratación

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_tipos_contratacion
npx ts-node prisma/seed-catalogos.ts
npm run build

curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/tipos-contratacion/DOM_HAB/configuracion

curl -X POST http://localhost:3001/tipos-contratacion/DOM_HAB/conceptos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"conceptoCobroId":"<id>","obligatorio":true,"orden":1}'
```
