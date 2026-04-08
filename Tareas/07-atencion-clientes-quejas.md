# Tarea 07 — Módulo de Atención a Clientes y Quejas

**PRD reqs:** 35–37  
**Sección PRD:** "Módulo de atención al cliente y quejas"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Prioridad:** ALTA — el backend ya está implementado, esta tarea es principalmente frontend + 1 endpoint nuevo

---

## Contexto y estado actual

### Backend YA implementado (NO reescribir)

- `backend/src/modules/quejas/quejas.service.ts` — COMPLETO con:
  - `findByContrato(contratoId)`, `findOne(id)`, `create(dto)`, `update(id, dto)`, `remove(id)`
  - `addSeguimiento(quejaId, dto)` — agrega notas al seguimiento
- `backend/src/modules/quejas/quejas.controller.ts` — endpoints disponibles:
  - `GET /quejas/contrato/:contratoId`
  - `GET /quejas/:id`
  - `POST /quejas`
  - `PATCH /quejas/:id`
  - `DELETE /quejas/:id`
  - `GET /quejas/:id/seguimientos`
  - `POST /quejas/:id/seguimientos`
- Schema Prisma `QuejaAclaracion` — tiene campos: tipo, descripcion, estado, atendidoPor, categoria, prioridad, canal, areaAsignada, enlaceExterno, motivoCierre

### Frontend actual — PARCIALMENTE implementado con DataContext

- `frontend/src/pages/AtencionClientes.tsx` — tiene toda la UI pero usa `useData()` de `DataContext` en lugar del backend real
- `frontend/src/pages/atencion/BusquedaContrato.tsx` — búsqueda por contrato usa datos mock
- `frontend/src/pages/atencion/TabQuejas.tsx` — lista quejas de DataContext
- `frontend/src/pages/atencion/QuejaDialog.tsx` — crea queja en DataContext
- `frontend/src/pages/atencion/ContextoRapido.tsx` — muestra contexto de contrato (saldos, pagos, etc.)

### Lo que falta

1. **Endpoint nuevo:** `GET /contratos/:id/contexto-atencion` — vista sin datos técnicos (req 35)
2. **Frontend:** Conectar todos los componentes al backend real (reemplazar `useData()`)
3. **Frontend:** Buscador de contrato en `BusquedaContrato.tsx` contra API real
4. **Frontend:** Campo enlace externo a herramientas de reclamos (req 36)

---

## Objetivo

1. Crear endpoint `/contratos/:id/contexto-atencion` (backend)
2. Migrar frontend de DataContext → API real para quejas y búsqueda de contrato
3. Mantener la UI existente — solo cambiar la fuente de datos

---

## Aceptación (Definition of Done)

- [ ] `GET /contratos/:id/contexto-atencion` devuelve saldos + últimos pagos + últimas facturas + quejas abiertas
- [ ] `frontend/src/pages/atencion/BusquedaContrato.tsx` usa API real `GET /contratos?search=`
- [ ] `frontend/src/pages/atencion/TabQuejas.tsx` usa API real `/quejas/contrato/:contratoId`
- [ ] `frontend/src/pages/atencion/QuejaDialog.tsx` llama `POST /quejas`
- [ ] `frontend/src/pages/atencion/ContextoRapido.tsx` usa `GET /contratos/:id/contexto-atencion`
- [ ] `frontend/src/pages/AtencionClientes.tsx` no tiene dependencias de DataContext para quejas/contratos

---

## Paso 1: Backend — endpoint contexto-atencion

### Agregar en `backend/src/modules/contratos/contratos.service.ts`

```typescript
// Endpoint de contexto de atención — SOLO datos relevantes para el agente de atención
// SIN datos técnicos de medidor, zona, ruta, etc. (req 35)
async getContextoAtencion(contratoId: string) {
  const contrato = await this.prisma.contrato.findUnique({
    where: { id: contratoId },
    select: {
      id: true,
      nombre: true,
      rfc: true,
      tipoServicio: true,
      estado: true,
      contacto: true,
      direccion: true,
      // NO incluir: medidorId, rutaId, zonaId, tomaId (datos técnicos)
    },
  });
  if (!contrato) throw new NotFoundException('Contrato no encontrado');

  // Saldo actual (suma facturas - pagos)
  const [totalFacturado, totalPagado] = await Promise.all([
    this.prisma.recibo.aggregate({
      where: { contratoId, estado: { not: 'Cancelado' } },
      _sum: { total: true },
    }),
    this.prisma.pago.aggregate({
      where: { contratoId },
      _sum: { monto: true },
    }),
  ]);
  const saldo = Number(totalFacturado._sum.total ?? 0) - Number(totalPagado._sum.monto ?? 0);

  // Últimos 5 pagos
  const ultimosPagos = await this.prisma.pago.findMany({
    where: { contratoId },
    orderBy: { fecha: 'desc' },
    take: 5,
    select: { id: true, monto: true, fecha: true, tipo: true, concepto: true },
  });

  // Últimas 3 facturas (timbrados)
  const ultimasFacturas = await this.prisma.timbrado.findMany({
    where: { contratoId },
    orderBy: { fechaEmision: 'desc' },
    take: 3,
    select: { id: true, uuid: true, total: true, estado: true, fechaEmision: true },
  });

  // Quejas abiertas (estado != Cerrada ni Cancelada)
  const quejasAbiertas = await this.prisma.quejaAclaracion.findMany({
    where: {
      contratoId,
      estado: { notIn: ['Cerrada', 'Cancelada', 'Resuelta'] },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, tipo: true, descripcion: true, estado: true,
      prioridad: true, createdAt: true, canal: true,
    },
  });

  return {
    contrato,
    saldo,
    ultimosPagos,
    ultimasFacturas,
    quejasAbiertas,
    resumen: {
      totalPagado: Number(totalPagado._sum.monto ?? 0),
      totalFacturado: Number(totalFacturado._sum.total ?? 0),
      quejasAbiertas: quejasAbiertas.length,
    },
  };
}
```

### Agregar en `backend/src/modules/contratos/contratos.controller.ts`

```typescript
@Get(':id/contexto-atencion')
@UseGuards(JwtAuthGuard)
getContextoAtencion(@Param('id') id: string) {
  return this.service.getContextoAtencion(id);
}
```

### Agregar búsqueda por texto en `contratos.service.ts`

```typescript
async search(query: string, limit = 10) {
  return this.prisma.contrato.findMany({
    where: {
      OR: [
        { nombre: { contains: query, mode: 'insensitive' } },
        { id: { contains: query } },
        { rfc: { contains: query } },
        { direccion: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true, nombre: true, rfc: true, estado: true, tipoServicio: true, direccion: true,
    },
    take: limit,
    orderBy: { nombre: 'asc' },
  });
}
```

En el controller:
```typescript
@Get('search')
@UseGuards(JwtAuthGuard)
search(@Query('q') q: string, @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number) {
  return this.service.search(q, limit);
}
```

> **Nota:** Registrar la ruta `GET /contratos/search` ANTES de `GET /contratos/:id` en el controller para que NestJS no confunda "search" como un parámetro de ID.

---

## Paso 2: API client — `frontend/src/api/atencion.ts` (nuevo)

```typescript
import { api } from './client';

export const buscarContratos = (q: string) =>
  api.get('/contratos/search', { params: { q } }).then(r => r.data);

export const getContextoAtencion = (contratoId: string) =>
  api.get(`/contratos/${contratoId}/contexto-atencion`).then(r => r.data);

export const getQuejasByContrato = (contratoId: string) =>
  api.get(`/quejas/contrato/${contratoId}`).then(r => r.data);

export const createQueja = (data: {
  contratoId: string; tipo: string; descripcion: string;
  prioridad?: string; canal?: string; areaAsignada?: string;
  atendidoPor?: string; enlaceExterno?: string;
}) => api.post('/quejas', data).then(r => r.data);

export const updateQueja = (id: string, data: Partial<{
  estado: string; areaAsignada: string; motivoCierre: string;
  enlaceExterno: string; prioridad: string; atendidoPor: string;
}>) => api.patch(`/quejas/${id}`, data).then(r => r.data);

export const getSeguimientosQueja = (quejaId: string) =>
  api.get(`/quejas/${quejaId}/seguimientos`).then(r => r.data);

export const addSeguimientoQueja = (quejaId: string, data: { nota: string; usuario?: string; tipo?: string }) =>
  api.post(`/quejas/${quejaId}/seguimientos`, data).then(r => r.data);
```

---

## Paso 3: Frontend — migración de DataContext → API real

### `frontend/src/pages/atencion/BusquedaContrato.tsx`

Reemplazar la búsqueda mock por:

```typescript
// Reemplazar:
// const { contratos } = useData();
// const resultados = contratos.filter(c => c.nombre.includes(query))

// Con:
import { buscarContratos } from '@/api/atencion';
import { useQuery } from '@tanstack/react-query'; // si está disponible, o useState/useEffect

// En el componente:
const [query, setQuery] = useState('');
const [resultados, setResultados] = useState([]);
const [loading, setLoading] = useState(false);

const handleSearch = async (q: string) => {
  setQuery(q);
  if (q.length < 2) { setResultados([]); return; }
  setLoading(true);
  try {
    const data = await buscarContratos(q);
    setResultados(data);
  } catch { setResultados([]); }
  finally { setLoading(false); }
};
```

### `frontend/src/pages/atencion/ContextoRapido.tsx`

```typescript
// Reemplazar datos mock/DataContext con:
import { getContextoAtencion } from '@/api/atencion';

// En el componente (recibe contratoId como prop):
const [contexto, setContexto] = useState(null);

useEffect(() => {
  if (!contratoId) return;
  getContextoAtencion(contratoId).then(setContexto).catch(console.error);
}, [contratoId]);

// Mostrar:
// - contrato.nombre, contrato.estado, contrato.tipoServicio
// - contexto.saldo (formateado como moneda)
// - contexto.ultimosPagos (tabla compacta)
// - contexto.ultimasFacturas (tabla compacta)
// - contexto.quejasAbiertas.length (badge)
// NO mostrar: datos técnicos (medidorId, zonaId, rutaId)
```

### `frontend/src/pages/atencion/TabQuejas.tsx`

```typescript
// Reemplazar:
// const { quejas } = useData();
// const quejasFiltradas = quejas.filter(q => q.contratoId === contratoId)

// Con:
import { getQuejasByContrato } from '@/api/atencion';
// Cargar con useEffect cuando contratoId cambie
```

### `frontend/src/pages/atencion/QuejaDialog.tsx`

```typescript
// Reemplazar:
// const { addQueja } = useData();

// Con:
import { createQueja } from '@/api/atencion';
// En el submit del formulario:
// await createQueja({ contratoId, tipo, descripcion, prioridad, canal, atendidoPor });
```

### `frontend/src/pages/AtencionClientes.tsx`

Después de los cambios anteriores, eliminar dependencias de DataContext:

```typescript
// Eliminar:
// import { useData } from '@/context/DataContext';
// const { contratos, quejas, ... } = useData();

// Los sub-componentes BusquedaContrato, ContextoRapido, TabQuejas y QuejaDialog
// ya gestionan su propio estado con la API — AtencionClientes.tsx solo los compone.
```

---

## Notas importantes para el ejecutor

1. **No reescribir el backend:** El servicio `quejas.service.ts` está completo y probado. Solo agregar el endpoint `getContextoAtencion` y `search` en contratos.

2. **Req 35 — Sin datos técnicos:** `getContextoAtencion` NO debe exponer `medidorId`, `rutaId`, `zonaId`, `tomaId`. Solo información que necesita el agente de atención: nombre, estado, saldo, últimas facturas/pagos, quejas.

3. **Req 36 — Enlace externo:** El campo `enlaceExterno` en `QuejaAclaracion` ya existe. La UI debe mostrar ese enlace como botón/link cuando tiene valor. Al crear queja, el agente puede capturar la URL del ticket en el sistema externo de reclamos.

4. **Búsqueda: orden de rutas NestJS:** En el controller de contratos, `GET /contratos/search` DEBE declararse antes de `GET /contratos/:id`. NestJS procesa rutas en orden de declaración y "search" se interpretaría como un ID si va después.

5. **DataContext:** Al terminar esta tarea, `AtencionClientes.tsx` y sus sub-componentes NO deben depender de `DataContext` para quejas ni contratos. El DataContext puede seguir existiendo para otros módulos.

6. **Guardrails — NO modificar:**
   - `backend/src/modules/quejas/quejas.service.ts` — no tocar el código existente
   - `backend/src/modules/quejas/quejas.controller.ts` — no tocar
   - UI existente de `AtencionClientes.tsx` — solo reemplazar fuente de datos, no rediseñar

---

## Validación

```bash
# Backend: nuevo endpoint
cd backend && npm run build

curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/contratos/<id>/contexto-atencion

# Debe retornar:
# { contrato: {nombre, estado...}, saldo, ultimosPagos[], ultimasFacturas[], quejasAbiertas[] }
# SIN medidorId ni rutaId

curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/contratos/search?q=garcia"
# Debe retornar lista de contratos que coinciden

# Frontend
cd frontend && npm run dev
# Navegar a /atencion
# Buscar un contrato por nombre → debe aparecer en dropdown
# Seleccionar → ContextoRapido debe mostrar datos reales (no mock)
# Crear queja → debe guardarse en BD
# Refrescar página → queja debe persistir
```
