---
description: Contexto completo del proyecto CEA Querétaro — arquitectura, módulos, estado actual y flujos clave.
alwaysApply: true
---

# Contexto del Proyecto — CEA Querétaro (Contract-to-Cash-Flow)

Sistema de gestión de agua potable para la CEA (Comisión Estatal del Agua) de Querétaro. Cubre el ciclo completo: solicitud de servicio → contratación → toma → lectura → facturación → cobranza.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| UI | Shadcn/UI + Tailwind CSS + Radix UI |
| Estado del servidor | TanStack Query (useQuery / useMutation) |
| Backend | NestJS + TypeScript |
| ORM | Prisma |
| Base de datos | PostgreSQL 35.188.238.10:5433 (base: `hydra`) |
| Auth | JWT (NestJS Guards) |

**Puertos locales:**
- Frontend: `http://localhost:8080` (Vite dev)
- Backend: `http://localhost:3001`
- `VITE_API_BASE_URL=http://localhost:3001`

---

## Estructura de Carpetas

```
contract-to-cash-flow/
├── frontend/src/
│   ├── pages/              # Una página por módulo
│   ├── components/
│   │   ├── contratacion/   # Wizard de alta de contrato
│   │   ├── contratos/      # Diálogos de edición de contrato
│   │   └── ui/             # Componentes Shadcn/custom
│   ├── api/                # Funciones fetch por dominio
│   └── types/              # Interfaces TypeScript compartidas
├── backend/src/modules/    # Un módulo NestJS por dominio
└── backend/prisma/         # schema.prisma + migrations
```

---

## Módulos Frontend (Pages)

| Página | Descripción |
|--------|-------------|
| `Solicitudes.tsx` | Lista y gestión de solicitudes de servicio (entrada del flujo) |
| `SolicitudServicio.tsx` | Formulario completo de solicitud de servicio |
| `Contratos.tsx` | Lista de contratos + wizard de alta + edición |
| `PuntosServicio.tsx` | Catálogo de puntos de servicio (ubicaciones) |
| `TiposContratacion.tsx` | Catálogo de tipos de contratación con variables |
| `Factibilidades.tsx` | Solicitudes de factibilidad técnica |
| `Lecturas.tsx` | Captura y gestión de lecturas de medidores |
| `Consumos.tsx` | Histórico de consumos por punto de servicio |
| `PreFacturacion.tsx` | Pre-facturación masiva por periodo |
| `Pagos.tsx` | Registro de pagos |
| `Recibos.tsx` | Generación y consulta de recibos |
| `Medidores.tsx` | Inventario de medidores |
| `Rutas.tsx` | Rutas de lecturistas |
| `Administraciones.tsx` | Catálogo de administraciones (zonas operativas) |
| `Tarifas.tsx` | Gestión de tarifas por tipo de contratación |

---

## Flujo Principal: Solicitud → Contrato

Este es el flujo más complejo y el que más hemos trabajado:

```
SolicitudServicio (captura)
    ↓ estado: pendiente_revision
Solicitudes (lista)
    ↓ [Inspección si aplica / Cuantificación]
    ↓ estado: en_cotizacion
    ↓ [Aceptar cotización]
    ↓ backend crea Contrato + ProcesoContratacion, guarda contratoId en solicitud
    ↓ navega a /app/contratos?iniciarAlta=1&contratoId=X
Contratos (lista)
    ↓ busca/crea ProcesoContratacion, obtiene procesoId
    ↓ abre WizardContratacion con procesoPrecargaId=procesoId
WizardContratacion (7 pasos)
    ↓ fetcha solicitud via GET /solicitudes?contratoId=X
    ↓ precarga TODOS los campos desde solicitud.formData
    ↓ [usuario valida/edita en modo lectura]
    ↓ POST /contratos → crea contrato definitivo
```

### Estados de Solicitud
`pendiente_revision` → `inspeccion_requerida` → `inspeccion_en_proceso` → `en_cotizacion` → `aceptada` → `contratado`
También: `rechazada`, `cancelada`

### Tipos INDIVIDUAL (esIndividualizacion = true)
- Saltan inspección directamente a cotización
- Campo `requiereInspeccion = false` en DB (migration: `20260420150000_individual_no_requiere_inspeccion`)
- Lógica frontend: `tipoInspeccionMap` usa `!t.esIndividualizacion` como fallback

---

## Wizard de Alta de Contrato (7 Pasos)

**Componente principal:** `frontend/src/components/contratacion/WizardContratacion.tsx`

| Paso | Componente | Descripción |
|------|-----------|-------------|
| 0 | `PasoPersonas.tsx` | Propietario/titular, persona fiscal, contacto |
| 1 | `PasoConfigContrato.tsx` | Admin, tipo contratación, actividad, distrito, referencias |
| 2 | `PasoVariables.tsx` | Variables dinámicas del tipo de contratación |
| 3 | `PasoDocumentos.tsx` | Lista de documentos requeridos |
| 4 | `PasoFacturacion.tsx` | Vista previa de facturación + conceptos lectura periódica |
| 5 | `PasoOrdenes.tsx` | Órdenes de instalación (toma/medidor) |
| 6 | `PasoResumen.tsx` | Resumen final antes de crear |

### Precarga desde Solicitud
`WizardContratacion` tiene lógica de precarga completa en el `useEffect` de línea ~238:
- **Personas:** `solicitudFormToWizardPersonas(solForm)` → mapea propietario/fiscal
- **Config:** `adminId`, `tipoContratacionId`, `actividadId`, `distritoId`, `contratoPadre`
- **Variables:** `solicitudVarsToWizardVars(solForm.variablesCapturadas)`
- **Conceptos override:** `extractConceptosCuantificacionOverride(solForm)`

### Sync Bidireccional (Solicitud ↔ Wizard)
- **Paso 0 (Personas):** Modo solo-lectura con botón "Editar" / "Bloquear y guardar". Al guardar → `updateSolicitud(id, { formData, propNombreCompleto, ... })`. También sincroniza al hacer clic en "Siguiente" (`handlePrimary` step 0).
- **Paso 1 (Config):** Mismo patrón — modo solo-lectura con botón "Editar". Al guardar → `updateSolicitud(id, { adminId, tipoContratacionId, formData: { ...snapshot, actividadId, distritoId } })`.

**Archivos de mapeo:**
- `solicitud-personas-wizard.ts` — `solicitudFormToWizardPersonas()` y `wizardPersonasToSolicitudUpdate()`
- `solicitud-variables-precarga.ts` — `solicitudVarsToWizardVars()` y `extractConceptosCuantificacionOverride()`

---

## Modelos Prisma Clave

| Modelo | Descripción |
|--------|-------------|
| `Solicitud` | Solicitud de servicio; tiene `formData` (JSONB = `SolicitudState`) y `contratoId` |
| `SolicitudInspeccion` | Orden de inspección vinculada a solicitud |
| `Contrato` | Contrato definitivo |
| `ProcesoContratacion` | Proceso de alta vinculado a un contrato (hitos, etapas) |
| `PuntoServicio` | Ubicación física de servicio de agua |
| `TipoContratacion` | Catálogo de tipos con `esIndividualizacion`, `requiereInspeccion` |
| `VariableTipoContratacion` | Variables dinámicas por tipo (datos a capturar) |
| `ConceptoCobro` | Conceptos de cobro con tarifas |
| `Persona` | Persona física o moral (propietario, fiscal, contacto) |
| `RolPersonaContrato` | Relación persona ↔ contrato con rol (PROPIETARIO, FISCAL, CONTACTO) |
| `Domicilio` | Domicilio normalizado con claves INEGI |
| `Toma` | Toma de agua (conexión física) |
| `Lectura` | Lectura de medidor |
| `Consumo` | Consumo calculado por periodo |
| `Recibo` | Recibo de cobro |
| `Pago` | Pago registrado |

---

## API Backend — Endpoints Relevantes

```
# Solicitudes
GET    /solicitudes?estado=&contratoId=&page=&limit=
POST   /solicitudes
PATCH  /solicitudes/:id
POST   /solicitudes/:id/inspeccion
POST   /solicitudes/:id/aceptar      → crea Contrato + ProcesoContratacion
POST   /solicitudes/:id/rechazar
POST   /solicitudes/:id/cancelar     ✅ implementado
POST   /solicitudes/:id/retomar      ✅ implementado

# Contratos
GET    /contratos
POST   /contratos
PATCH  /contratos/:id

# Procesos de contratación
GET    /procesos-contratacion?contratoId=
GET    /procesos-contratacion/:id
POST   /procesos-contratacion

# Tipos de contratación
GET    /tipos-contratacion
GET    /tipos-contratacion/:id

# Catálogos
GET    /catalogos/actividades
GET    /catalogos/administraciones
GET    /catalogos/distritos
GET    /catalogos/sat?tipo=REGIMEN_FISCAL|USO_CFDI
```

---

## Tipos Frontend Importantes

### `SolicitudState` (`types/solicitudes.ts`)
JSONB guardado en `solicitud.formData`. Contiene todos los campos del formulario:
`adminId`, `tipoContratacionId`, `actividadId`, `distritoId`, `contratoPadre`,
`propPaterno/Materno/Nombre/Rfc/Correo/Telefono`, `propTipoPersona`,
`predioDir`, `variablesCapturadas`, `conceptosCuantificacionOverride`, `documentosRecibidos`, etc.

### `WizardData` (`hooks/useWizardState.ts`)
Estado del wizard de alta. Campos clave:
- `solicitudId?` — ID de solicitud vinculada (activa el modo precarga)
- `solicitudFormSnapshot?` — snapshot del formData para sync bidireccional
- `propietario`, `personaFiscal`, `personaContacto` — tipo `PersonaWizard`
- `fiscalIgualTitular?` — checkbox "persona fiscal = titular"
- `administracion`, `tipoContratacionId`, `actividadId`, `distritoId`
- `variablesCapturadas`, `conceptosOverride`, `documentosRecibidos`

---

## Patrones de Código Frecuentes

### Modo Solo-Lectura en Pasos del Wizard
Patrón implementado en `PasoPersonas` y `PasoConfigContrato`:
```tsx
const [soloLectura, setSoloLectura] = useState(true);
const tieneSolicitud = Boolean(data.solicitudId && data.solicitudFormSnapshot);

// Botón Editar / Guardar y bloquear
// Mutation que llama updateSolicitud() y luego setSoloLectura(true)
```

### SearchableSelect
Componente en `components/ui/searchable-select.tsx` — Combobox Shadcn con búsqueda:
```tsx
<SearchableSelect
  options={[{ value: 'id', label: 'Nombre' }]}
  value={selected}
  onValueChange={setSelected}
  placeholder="Seleccione..."
/>
```

### TanStack Query — patrón estándar
```tsx
const q = useQuery({ queryKey: ['clave', params], queryFn: () => fetchFn(params) });
const mutation = useMutation({ mutationFn: apiCall, onSuccess: () => queryClient.invalidateQueries(...) });
```

---

## Estado Actual de Features (2026-04-23)

### ✅ Implementado y funcionando
- Flujo completo solicitud → inspección → cotización → aceptar → wizard de alta
- Tipos INDIVIDUAL (esIndividualizacion): saltan inspección, van directo a cotización
- Botón "Cancelar solicitud" en cada fila de la lista (no en modales)
- Endpoints `POST /solicitudes/:id/cancelar` y `POST /solicitudes/:id/retomar`
- Ordenamiento por fecha (asc/desc) en lista de solicitudes
- Pre-carga bidireccional wizard ↔ solicitud: personas y configuración
  - Paso 0 Personas: modo lectura + Editar + sync back a solicitud
  - Paso 1 Config: modo lectura + Editar + sync back a solicitud
- Combobox con búsqueda para tipo de contratación en PasoConfigContrato
- Vista previa de facturación en PasoFacturacion con conceptos de lectura periódica
- ContratoEditDialog para editar contratos existentes

### 🔧 Pendiente / En progreso
- Aplicar migración DB en servidor: `requiereInspeccion = false` para tipos INDIVIDUAL
  - Archivo: `backend/prisma/migrations/20260420150000_individual_no_requiere_inspeccion/migration.sql`
  - Servidor: 35.188.238.10:5433
- Despliegue de endpoints `/cancelar` y `/retomar` en servidor
- SearchableSelect pendiente de re-aplicar en: régimen fiscal/CFDI (PasoPersonas), tipo envío factura (PasoFacturacion)

### ⚠️ Notas de comportamiento
- `tipoInspeccionMap` en Solicitudes.tsx: usa `(t.requiereInspeccion ?? true) && !t.esIndividualizacion` para determinar si tipo requiere inspección (doble guarda hasta que corra migración)
- El wizard requiere `procesoPrecargaId` (ID del ProcesoContratacion) para activar precarga, no el contratoId directo
- `PasoConfigContrato` limpia `variablesCapturadas` al cambiar tipo de contratación — esto es intencional para evitar datos huérfanos

---

## Comandos de Desarrollo

```bash
# Frontend
cd frontend && npm run dev          # localhost:8080
cd frontend && npm run build
cd frontend && npx tsc --noEmit     # Type-check

# Backend
cd backend && npm run start:dev     # localhost:3001
cd backend && npx prisma migrate dev
cd backend && npx prisma studio

# Migraciones en producción
cd backend && npx prisma migrate deploy
```

---

## Convenciones del Proyecto

- **IDs:** UUIDs generados por Prisma (`@default(uuid())`)
- **Fechas:** ISO string en frontend, `DateTime` en Prisma
- **snake_case** en BD, **camelCase** en TypeScript
- **JSONB** para `formData` en Solicitud y `variablesCapturadas` en Contrato
- Los catálogos SAT (régimen fiscal, uso CFDI) tienen fallback offline en `lib/sat-catalog-fallback.ts`
- `hasApi()` en `api/client.ts` — devuelve false cuando no hay backend disponible; los componentes lo usan para mostrar datos demo
