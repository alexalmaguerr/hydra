---
name: Portal del Cliente MVP
overview: "Plan para añadir un módulo \"Portal del Cliente\" inspirado en Atención a Clientes y en la referencia visual adjunta: vista orientada al cliente con pestañas Consumos, Facturas y Recibos (historial de pagos), resumen de adeudos y acciones de pago, sin sesión en este MVP."
todos: []
isProject: false
---

# Plan: Módulo Portal del Cliente (MVP/POC)

## Objetivo

Crear un módulo **Portal del Cliente** donde el usuario final (cliente) pueda ver su información relevante en pestañas **Consumos**, **Facturas** y **Recibos**, con resumen de adeudos (vencido/vigente/total), y acciones para pagar facturas. En el MVP no existirá sesión: se simulará el cliente mediante un selector de contrato (o contrato por defecto). Eventualmente: contratación de nuevo contrato/toma de servicio.

## Contexto técnico

- **Referencia de UI**: La imagen adjunta muestra un portal con bienvenida, "Saldos de tus cuentas" (Vencido en rojo, Vigente en verde, Total), pestañas Facturas / Consumos / Pagos, tabla de facturas con filtros (Todas, No pagadas), botones "Subir comprobante" y "Pagar", y columnas Folio, Conceptos, Emisión, Vencimiento, Estado, Total, Saldo.
- **Módulo base**: [src/pages/AtencionClientes.tsx](src/pages/AtencionClientes.tsx) ya consume `useData()` y construye filas de facturas (`facturasRows` desde `timbrados` + `recibos` + `preFacturas`), recibos, lecturas/consumos y pagos por `contratoId`. Se reutilizarán las mismas fuentes de datos y patrones de cálculo (p. ej. `deudaTotal`, `formatCurrency`).
- **Datos en DataContext**: [src/context/DataContext.tsx](src/context/DataContext.tsx) expone `contratos`, `consumos`, `timbrados`, `preFacturas`, `recibos`, `pagos`, `pagosParcialidad`. No hay entidad "cliente" separada: el titular es `contrato.nombre` y el alcance por contrato.

## Decisiones de diseño

- **Ruta**: `/portal` (o `/portal-cliente`) para no mezclar con rutas internas.
- **Layout**: Layout propio **sin sidebar** (solo cabecera con logo, bienvenida, selector de contrato y opcional "Completar datos"), para que la experiencia coincida con la referencia y se diferencie del back-office.
- **Identidad del "cliente" en MVP**: Selector de contrato en la cabecera del portal (dropdown por contrato id/nombre). Opcional: `?contrato=CT001` para deep-link.
- **Pestañas**: **Consumos** (consumo m³ por periodo), **Facturas** (facturas/recibos por cobrar con estado y saldo), **Recibos** (historial de pagos del contrato). Nomenclatura alineada con lo que el usuario final desea ver.
- **Acciones**: Botón **Pagar** (flujo mock o deshabilitado con tooltip "Próximamente") y **Subir comprobante** (mock/deshabilitado). Dejar hueco para futura contratación (nuevo contrato/toma).

## Arquitectura de rutas y layout

- En [src/App.tsx](src/App.tsx): una ruta que use `PortalLayout` como wrapper y un hijo `path="portal"` que renderice la página del portal. El resto de rutas siguen bajo `AppLayout`.
- En [src/components/AppLayout.tsx](src/components/AppLayout.tsx): añadir enlace "Portal del Cliente" a `/portal` para que el personal interno pueda abrirlo y simular cualquier contrato.

## Estructura de la página Portal del Cliente

1. **Cabecera (PortalLayout)**
  - Logo / nombre del organismo (reutilizar o simplificar el de AppLayout).
  - Texto tipo: "Bienvenido, [nombre del titular]" (desde `contrato.nombre` del contrato seleccionado).
  - Párrafo breve: "En el portal podrá consultar consumos, facturas y pagos; podrá pagar sus facturas…" (alineado con la referencia).
  - Selector de contrato (dropdown: lista de contratos con `id` y/o `nombre`). En MVP sin sesión, este selector define el "cliente".
  - Botón opcional "Completar datos" (placeholder o enlace a formulario futuro).
  - Opcional: bloque "Instrucciones de pago" (texto fijo o mock: banco, cuenta, referencia).
2. **Resumen de saldos**
  - **Vencido**: suma de saldos vencidos (p. ej. `recibos.saldoVencido` y lógica ya usada en Atención a Clientes para deuda vencida).
  - **Vigente**: suma de saldos vigentes (`recibos.saldoVigente`).
  - **Total**: total adeudo (vencido + vigente) para el contrato.
  - **Intereses**: opcional; si no hay lógica en contexto, mostrar 0 o omitir.
  - Estilo: vencido en rojo/destructive, vigente en verde/success, total destacado (como en la referencia).
3. **Pestañas**
  - **Consumos**: tabla con datos de Consumo (y/o lecturas): periodo, m³, tipo (Real, Promedio, etc.). Filtrar por `contratoId` seleccionado.
  - **Facturas**: tabla tipo "facturas/adeudos" por contrato (timbrados + recibos + preFacturas por contrato), con periodo, fecha emisión, vencimiento, total, saldo, estado (Vencida/Pendiente/Pagada). Columnas: Folio/ID, Periodo o concepto, Emisión, Vencimiento, Estado, Total, Saldo. Filtros: "Todas", "No pagadas". Botones: "Pagar", "Subir comprobante" (mock o deshabilitados).
  - **Recibos**: historial de pagos del contrato (`pagos` filtrados por `contratoId`): fecha, concepto, monto, forma de pago.
4. **Placeholder para evolución**
  - Bloque o enlace "Contratar nuevo servicio / toma" (deshabilitado o ruta futura).

## Archivos a crear o modificar

- **Crear** `src/components/PortalLayout.tsx`: Layout sin sidebar; cabecera (logo, bienvenida, selector contrato, "Completar datos"); `<Outlet />` para la página del portal.
- **Crear** `src/pages/PortalCliente.tsx`: Resumen de saldos (vencido/vigente/total), Tabs Consumos / Facturas / Recibos, tablas y botones. Usar `useData()` y estado local `contratoId` (inicial desde URL `?contrato=` si existe).
- **Modificar** [src/App.tsx](src/App.tsx): Añadir ruta con `PortalLayout` y `path="portal"` para `<PortalCliente />`. Mantener rutas actuales bajo `AppLayout`.
- **Modificar** [src/components/AppLayout.tsx](src/components/AppLayout.tsx): Añadir ítem "Portal del Cliente" con `to="/portal"`.

## Reutilización de código

- Reutilizar lógica de AtencionClientes para filas de facturas y para `deudaTotal` / saldos (vencido/vigente). Opción: helper o hook `useFacturasYDeuda(contratoId)`.
- Usar `formatCurrency` y componentes UI existentes: `Tabs`, `Table`, `Button`, `Select`, `StatusBadge` en `@/components/ui/`*.
- Solo lectura desde `useData()`; no nuevas entidades en DataContext para el MVP.

## Orden de implementación sugerido

1. PortalLayout y ruta en App + enlace en AppLayout.
2. PortalCliente con selector de contrato, bienvenida y resumen de saldos (vencido/vigente/total).
3. Pestaña Facturas: tabla y filtros "Todas" / "No pagadas", botones Pagar y Subir comprobante (mock).
4. Pestaña Consumos: tabla periodo / m³ / tipo.
5. Pestaña Recibos: tabla de pagos del contrato.
6. Ajustes de estilo (colores vencido/vigente, accesibilidad) y opcional "Instrucciones de pago" / "Completar datos".

## Notas para después del MVP

- **Sesión**: Cuando exista autenticación, el `contratoId` vendrá del usuario logueado; se podrá ocultar el selector o limitarlo a "mis contratos".
- **Pago real**: El botón "Pagar" enlazará a flujo de pago (link de pago, pasarela).
- **Nueva contratación**: Añadir ruta o sección "Contratar nuevo servicio / toma" que apunte a factibilidades o flujo de alta de contrato.

