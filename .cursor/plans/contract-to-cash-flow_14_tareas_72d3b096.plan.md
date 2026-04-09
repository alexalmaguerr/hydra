---
name: Contract-to-cash-flow 14 tareas
overview: "Plan para implementar las 14 tareas en el proyecto contract-to-cash-flow: modelo de datos (Administraciones/Zonas/Distritos, extensiones de Recibo/Pago/Lectura), seeds, inventario de medidores, asignación visual de contratos a rutas (drag-and-drop), validaciones y visualizaciones de lecturas, pre-facturación por etapas, mensajes en recibos, recibos con preview y parcialidades, tipos de pago y conciliación, y detalle de contrato con desglose de facturas. El proyecto actual es solo frontend con estado en memoria (DataContext)."
todos: []
isProject: false
---

# Plan: 14 tareas en contract-to-cash-flow

## Contexto actual

- **Stack**: React 18, Vite, TypeScript, shadcn-ui, Tailwind. Sin backend; todo el estado vive en [DataContext.tsx](src/context/DataContext.tsx).
- **Modelos existentes**: Factibilidad → Construcción → Toma → Contrato; Medidor (1:1 contrato); Ruta (`contratoIds[]`); Lectura, Consumo, PreFactura, Timbrado, Recibo, Pago. No existen Administración, Zona ni Distrito.

---

## Fase 1: Modelo de datos y jerarquía territorial

**Objetivo**: Base para facturación por zona (8) y accesos por administración/zona (10).

- En [DataContext.tsx](src/context/DataContext.tsx):
  - Definir `Administracion` (id, nombre, zonaIds).
  - Definir `Zona` (id, administracionId, nombre, distritoIds).
  - Definir `Distrito` (id, zonaId, nombre).
  - Vincular **Ruta** a `zonaId` (y opcionalmente distrito si aplica).
  - Vincular **Contrato** a `zonaId` (derivable por ruta o explícito) para filtrar por zona en facturación.
- Añadir estado inicial (vacío o con un seed mínimo) y getters/acciones para Admin/Zona/Distrito en el contexto.

**Archivos**: `src/context/DataContext.tsx`, tipos exportados si se usan en más de un módulo.

---

## Fase 2: Seed Administraciones, Zonas y Distritos (tarea 6)

- En DataContext (o archivo `src/data/seedTerritorial.ts` reexportado/inyectado al contexto):
  - Seed de 1–2 administraciones, cada una con 2–3 zonas, cada zona con 2–3 distritos.
  - Asignar rutas existentes a zonas y contratos a zonas (vía ruta o directo).
- Ajustar tipos de `Ruta` y `Contrato` para incluir `zonaId` y usarlos en las pantallas que listan rutas/contratos.

---

## Fase 3: Inventario de medidores (tarea 1)

- **Página**: [Medidores.tsx](src/pages/Medidores.tsx).
- Objetivo: Tratarlo como **inventario** (medidores disponibles + asignados).
  - Opción A: Los medidores siguen ligados a contrato; la “inventario” es lista de todos los medidores con estado (Activo/Inactivo/Disponible si se agrega estado “en bodega”).
  - Opción B: Introducir entidad “Medidor en bodega” (sin contrato) y “Medidor asignado” (con contrato); al asignar se mueve de bodega a contrato.
- Implementar:
  - Listado completo con filtros (por zona, estado, serie).
  - Si se elige Opción B: CRUD de medidores en bodega y flujo “Asignar a contrato” desde inventario.

---

## Fase 4: Asignar contratos a rutas con drag-and-drop (tarea 2)

- **Página**: [Rutas.tsx](src/pages/Rutas.tsx).
- Vista dual:
  - Una columna: lista de **rutas** (por zona/distrito si ya existen).
  - Otra: **contratos sin ruta** o contratos de una ruta seleccionada.
- Implementar drag-and-drop (ej. `@dnd-kit/core` + `@dnd-kit/sortable`) para:
  - Arrastrar contrato a una ruta → actualizar `ruta.contratoIds` y `contrato.rutaId`.
  - Arrastrar contrato fuera de ruta → quitar de ruta.
- Persistir cambios con `updateRuta` y `updateContrato` del DataContext.

---

## Fase 5: Seed lecturas y visualizaciones de validación (tarea 3)

- **Modelo de Lectura** en DataContext:
  - Añadir campos opcionales: `lecturaMinZona`, `lecturaMaxZona`, `simuladoMensual` (o mínimo de zona), y un flag o motivo de “no válida” (ej. `motivoInvalidacion`).
- **Seed**:
  - Generar muchas lecturas (ej. 100–500) para varios contratos/periodos con mezcla de válidas, no válidas y con valores fuera de min/max o con simulado.
- **Página Lecturas** [Lecturas.tsx](src/pages/Lecturas.tsx):
  - **Visualizaciones**:
    - Gráfica o cards: lecturas por estado (Válida / No válida / Pendiente).
    - Gráfica o tabla: lecturas que exceden máximo o están bajo mínimo (usando `lecturaMinZona` / `lecturaMaxZona`).
    - Listado o resumen de “lecturas no válidas” con simulado mensual o mínimo de zona mostrado.
  - Mantener captura actual y añadir pestañas o secciones: “Captura”, “Validaciones”, “Historial”.

---

## Fase 6: Filtros y paginación en lecturas (tarea 7)

- En [Lecturas.tsx](src/pages/Lecturas.tsx):
  - Filtros: por ruta, zona, contrato, periodo, estado (Válida/No válida/Pendiente), fecha.
  - Tabla de historial con **paginación** (ej. 20 por página) usando estado local o componente de paginación (shadcn o custom).
  - Asegurar que el seed de la tarea 3 dé volumen suficiente para probar filtros y paginación.

---

## Fase 7: Seeds consumos y facturas (tareas 4 y 5)

- **Consumos**: En DataContext o `src/data/seedConsumos.ts`, generar consumos para contratos/periodos a partir de lecturas existentes (reales) o estimados (promedio/fijo), alineados con periodos de pre-facturación.
- **Facturas**: En este proyecto “factura” = PreFactura + Timbrado (y opcionalmente Recibo). Seed:
  - PreFacturas en estado Aceptada/Validada para varios contratos/periodos.
  - Timbrados asociados (UUID, estado Timbrada OK).
  - Opcionalmente Recibos ligados a esos timbrados.
- Cargar estos datos como estado inicial en DataContext (o mediante un “botón seed” en desarrollo).

---

## Fase 8: Facturación por zonas (tarea 8)

- **Definición**: La facturación (pre-facturación y timbrado) se organiza **por zona**.
- En [PreFacturacion.tsx](src/pages/PreFacturacion.tsx) y [TimbradoPage.tsx](src/pages/TimbradoPage.tsx):
  - Selector de **zona** (o “Todas”).
  - Filtrar consumos listos para pre-facturar y pre-facturas por contratos que pertenecen a la zona seleccionada (usando `contrato.zonaId` o ruta→zona).
  - Misma lógica en Timbrado: solo pre-facturas aceptadas de esa zona.
- Opcional: vista resumen por zona (totales, cantidad de facturas).

---

## Fase 9: Pre-facturación visual por etapas y validación bulk (tarea 9)

- **PreFacturacion** debe mostrar **etapas** de validación de forma visual (ej. columnas o steps):
  - Etapa 1: Pendientes de validar (estado Pendiente).
  - Etapa 2: Validadas (estado Validada).
  - Etapa 3: Aceptadas (estado Aceptada).
- Acciones:
  - Validar/corregir **una** pre-factura (como ahora).
  - **Bulk**: selección múltiple (checkboxes) + “Validar seleccionadas” / “Aceptar seleccionadas”.
- Mostrar en cada ítem la información necesaria para corregir (contrato, periodo, m³, importes, posible mensaje de error de validación si se agrega).

---

## Fase 10: Accesos por Administración y Zona (tarea 10)

- **Modelo de “usuario” o “sesión”** en contexto (sin backend puede ser mock):
  - `administracionesIds: string[]` y `zonasIds: string[]` (o derivar zonas desde administraciones).
- **AppLayout / enrutado**:
  - No cambiar rutas; en cada página que liste datos (Contratos, Rutas, Lecturas, Consumos, PreFacturación, Timbrado, Recibos, Pagos), filtrar por:
    - Contratos que pertenecen a una zona del usuario.
    - Rutas de esas zonas; lecturas/consumos/prefacturas de esos contratos; etc.
- Selector de “Administración” o “Zona” en el header/sidebar (si el usuario tiene más de una) para cambiar contexto.
- Datos seed: al menos un usuario con acceso a 1 administración y varias zonas para probar.

---

## Fase 11: Mensajes internos en recibos (tarea 11)

- **Modelo**:
  - **Recibo** (o entidad “Campaña de recibos” si se prefiere): `mensajeGlobal: string`, y lista de `mensajesIndividuales: { reciboId o facturaId, mensaje }`.
  - Alternativa: en cada Recibo, `mensajeIndividual?: string`; y a nivel de “lote” o pantalla, `mensajeGlobal` para la emisión actual.
- **UI** (pantalla Recibos o “Enviar a timbrar”):
  - Campo **Mensaje global** (textarea).
  - Opción **Mensaje individual**: selector/filtro de facturas/recibos (por contrato, zona, periodo, etc.), multi-selección; al elegir ítems, asignar mensaje individual a cada uno (prioridad sobre el global).
  - Regla de visualización: si existe mensaje individual para ese recibo/factura, mostrar solo ese; si no, el global.

---

## Fase 12: Recibos de impresión – campos y preview (tarea 12)

- **Modelo Recibo** en DataContext (extender el actual):
  - `fechaVencimiento` (ya existe).
  - `saldosVencidos`, `saldosVigentes` (ya existen como saldoVencido/saldoVigente).
  - `parcialidades: number` (ya existe); si hay “pagos en parcialidades” del contrato, considerar una entidad **PagoParcialidad** o array en contrato/recibo con fechas/montos.
- **Seed parcialidades**:
  - Para contratos con “pago diferido” o “parcialidades”, seed de cuotas (número de parcialidad, monto, fecha, estado).
- **UI Recibos**:
  - Mostrar en tabla: fecha vencimiento, saldos vencidos, saldos vigentes, parcialidades (y si aplica resumen de parcialidades del contrato).
  - Mostrar mensaje efectivo (individual si existe, si no global).
  - **Modal Preview**: al “Imprimir” o “Vista previa”, abrir modal con el contenido del recibo (datos del contrato, factura, saldos, vencimiento, parcialidades, mensaje) antes de marcar como impreso o enviar.

---

## Fase 13: Pagos – tipos, conciliación externa y nativos (tarea 13)

- **Tipos de pago** en DataContext:
  - Extender `Pago.tipo` con: SPEI, OXXO, CODI, CAJERO, CHATBOT, WEB, CAJAS POPULARES (y mantener Efectivo, Transferencia, Tarjeta como “nativos” o agregar flag `origen: 'nativo' | 'externo'`).
- **Pagos de recaudación externa (webservice)**:
  - Nueva entidad o estructura: `PagoExterno` (referencia, monto, fecha, tipo, estado: pendiente_conciliar | conciliado, contratoId/adeudoId/facturaId sugeridos por “AI”).
  - Seed: varios `PagoExterno` “por conciliar” y algunos “sin reconciliar” (sin contrato sugerido o con sugerencia).
  - **Pantalla**: listado de pagos externos por conciliar; para cada uno mostrar sugerencia (contrato/adeudo/factura); acciones “Confirmar conciliación” y “Buscar contrato/adeudo/factura” (selector manual).
- **Pagos nativos**: sección o pestaña “Pagos aplicados (link de pago)” que liste pagos con `origen === 'nativo'` o tipo Link de pago, todos aplicados a contrato/adeudo.

---

## Fase 14: Detalle de contrato – desglose de facturas (tarea 14)

- En [Contratos.tsx](src/pages/Contratos.tsx), en el **modal/detalle** del contrato (o página `/contratos/:id`):
  - Obtener todas las facturas del contrato (Timbrados o PreFacturas + Timbrados asociados a ese `contratoId`).
  - Desglose en secciones o tabla:
    - **Pagadas**: facturas con pago(s) que cubren el total (usar datos de Pago/Recibo aplicados).
    - **Por cobrar**: facturas timbradas sin pagar o con saldo pendiente.
    - **Vencidas**: facturas con fecha de vencimiento < hoy y sin pagar (usar Recibo.fechaVencimiento y saldos).
  - Mostrar para cada ítem: periodo, UUID si aplica, monto, estado (pagada/por cobrar/vencida), saldo si hay parcialidad.

---

## Orden de implementación sugerido

1. Fase 1 + 2 (modelo territorial + seed Admin/Zonas/Distritos).
2. Fase 3 (inventario medidores).
3. Fase 4 (drag-drop rutas).
4. Fase 5 + 6 (seed lecturas, validaciones y filtros/paginación).
5. Fase 7 (seeds consumos y facturas).
6. Fase 8 (facturación por zona).
7. Fase 9 (pre-facturación visual y bulk).
8. Fase 10 (accesos Admin/Zona).
9. Fase 11 + 12 (mensajes recibos y recibos con preview/parcialidades).
10. Fase 13 (pagos tipos y conciliación).
11. Fase 14 (detalle contrato facturas).

---

## Dependencias técnicas

- **Drag-and-drop**: añadir `@dnd-kit/core` y `@dnd-kit/sortable` (o similar) para la asignación contratos ↔ rutas.
- **Gráficas**: ya existe `recharts` en el proyecto; usarlo para visualizaciones de validación de lecturas.
- **Paginación**: componente existente en [components/ui/pagination.tsx](src/components/ui/pagination.tsx); reutilizar en Lecturas.

---

## Notas

- Sin backend, toda la lógica y filtros (incluidos “accesos” y “conciliación AI”) serán simulados en el cliente (contexto + datos seed).
- Cuando se agregue API real, se puede extraer la capa de datos a servicios que consuman el backend y mantengan la misma interfaz hacia los componentes.

