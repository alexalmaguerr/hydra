# Tarea 12 — Modelo de Domicilios Homologado INEGI

**PRD reqs:** 15, 16, 17, 18, 19, 21 (parcial)  
**Sección PRD:** "Homologación de domicilios con catálogos INEGI"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencias:** Ninguna (base para T06 ampliada y T11)

---

## Contexto

El PRD 2026-04-06 requiere homologar domicilios con catálogos INEGI, contemplar un proceso de limpieza de datos, soportar distintos niveles de detalle (país → estado → municipio → localidad → colonia → calle → número), generar representación concatenada automática, y vincular domicilios a personas mediante roles flexibles.

---

## Objetivo

1. Modelo `Domicilio` estructurado con campos INEGI
2. Catálogos INEGI: Estado, Municipio, Localidad, Colonia (vinculados jerárquicamente)
3. Función de generación automática de dirección concatenada
4. Modelo `DomicilioPersona` para vinculación persona-domicilio con roles
5. Estrategia de limpieza y migración de `Contrato.direccion` → `Domicilio`

---

## Aceptación (Definition of Done)

- [ ] Migración con `Domicilio`, `DomicilioPersona`, catálogos INEGI aplicada
- [ ] `GET/POST /domicilios` CRUD con autocompletado de catálogos INEGI
- [ ] `GET /domicilios/buscar?cp=&colonia=` búsqueda por código postal y colonia
- [ ] Función `generarDireccionConcatenada()` ejecutada automáticamente al crear/editar
- [ ] `POST /domicilios-persona` vincula persona con domicilio y rol
- [ ] Seed de catálogos INEGI para Querétaro (mínimo viable)
- [ ] Script de migración: `Contrato.direccion` → `Domicilio` parseado
- [ ] Frontend: formulario de domicilio con cascada Estado → Municipio → Colonia

---

## Modelos Prisma (ya aplicados en schema)

```prisma
model Domicilio {
  id              String   @id @default(cuid())
  calle           String
  numExterior     String?
  numInterior     String?
  coloniaINEGIId  String?
  codigoPostal    String?
  localidadINEGIId String?
  municipioINEGIId String?
  estadoINEGIId   String?
  entreCalle1     String?
  entreCalle2     String?
  referencia      String?
  direccionConcatenada String?
  gpsLat          Decimal?
  gpsLng          Decimal?
  validadoINEGI   Boolean  @default(false)
  // ... relaciones con catálogos, contratos, puntosServicio, personaLinks
}

model DomicilioPersona {
  id          String @id @default(cuid())
  personaId   String
  domicilioId String
  tipo        String @default("fiscal") // fiscal | servicio | correspondencia
  principal   Boolean @default(false)
  // ... unique constraint [personaId, domicilioId, tipo]
}

// Catálogos INEGI (jerárquicos): Estado → Municipio → Localidad, Municipio → Colonia
```

---

## Paso 1: Backend — función de dirección concatenada

```typescript
export function generarDireccionConcatenada(domicilio: {
  calle: string;
  numExterior?: string | null;
  numInterior?: string | null;
  coloniaName?: string | null;
  codigoPostal?: string | null;
  municipioName?: string | null;
  estadoName?: string | null;
}): string {
  const partes = [
    domicilio.calle,
    domicilio.numExterior ? `#${domicilio.numExterior}` : null,
    domicilio.numInterior ? `Int. ${domicilio.numInterior}` : null,
    domicilio.coloniaName ? `Col. ${domicilio.coloniaName}` : null,
    domicilio.codigoPostal ? `C.P. ${domicilio.codigoPostal}` : null,
    domicilio.municipioName,
    domicilio.estadoName,
  ];
  return partes.filter(Boolean).join(', ');
}
```

---

## Paso 2: Backend — módulo `domicilios`

### `domicilios.service.ts`

```typescript
@Injectable()
export class DomiciliosService {
  async create(dto: CreateDomicilioDto) {
    // Resolver nombres de catálogos INEGI
    // Generar dirección concatenada
    // Crear domicilio
  }

  async buscarPorCP(codigoPostal: string) {
    // Retornar colonias disponibles para ese CP
  }

  async getCascadaINEGI(params: { estadoId?: string; municipioId?: string }) {
    // Retornar municipios de un estado, o localidades/colonias de un municipio
  }

  async vincularPersona(domicilioId: string, personaId: string, tipo: string) {
    // Crear DomicilioPersona
  }
}
```

---

## Paso 3: Seed de catálogos INEGI

Fuente: https://www.inegi.org.mx/app/ageeml/

Para el MVP, cargar solo el estado de Querétaro:
- Catálogo de estados (32 registros)
- Municipios de Querétaro (18 registros)
- Localidades principales
- Colonias con código postal (SEPOMEX / INEGI)

```bash
# Ejemplo de seed
npx ts-node prisma/seed-inegi.ts
```

---

## Paso 4: Script de migración Contrato.direccion → Domicilio

```typescript
// Estrategia de parsing:
// 1. Intentar extraer código postal con regex /C\.?P\.?\s*(\d{5})/
// 2. Buscar colonia en catálogo por nombre fuzzy
// 3. Crear Domicilio con datos parseados
// 4. Marcar validadoINEGI = false para revisión manual
// 5. Vincular Contrato.domicilioId
// 6. NO eliminar Contrato.direccion (campo legacy preservado)
```

---

## Paso 5: Frontend

- Formulario de domicilio con cascada: Estado → Municipio → Colonia
- Autocompletado de colonias al escribir código postal
- Preview de dirección concatenada en tiempo real
- Gestión de domicilios por persona (tipos: fiscal, servicio, correspondencia)

---

## Preguntas abiertas

- ⚠️ #8: Nivel de complejidad de domicilios (no comprometer mantenibilidad)
- ⚠️ #9: Relación calles-colonias-CP con rangos par/impar (se recomienda priorizar modelo simple)

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_domicilios_inegi
npx ts-node prisma/seed-inegi.ts
npm run build

curl -X POST http://localhost:3001/domicilios \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"calle":"Av. Universidad","numExterior":"100","codigoPostal":"76000","coloniaINEGIId":"<id>"}'

curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/domicilios/buscar?cp=76000"
```
