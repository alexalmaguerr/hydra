# Modificaciones a Tareas Existentes — PRD 2026-04-06

**Fecha:** 2026-04-09  
**Propósito:** Detallar los cambios necesarios en las tareas existentes (T01–T09) para cumplir con el nuevo PRD.

---

## T03 — Sistema de Órdenes Centralizado

**Archivo:** `Tareas/03-sistema-ordenes.md`  
**Requerimientos nuevos que absorbe:** 5 (parcial), 11 (parcial), 12 (parcial)

### Cambios requeridos

#### 1. Trigger automático post-instalación de toma (Req 5)

**Estado actual:** `Orden` se crea manualmente.  
**Cambio:** Agregar event listener que al cambiar `Orden` de tipo `InstalacionToma` a estado `Ejecutada`, genere automáticamente una `Orden` de tipo `InstalacionMedidor` para el mismo contrato.

```
Archivo a modificar: backend/src/modules/ordenes/ordenes.service.ts
Nuevo: método autoGenerarOrdenMedidor(ordenToma: Orden)
Trigger: en método updateEstado(), después de transicionar a 'Ejecutada' y tipo === 'InstalacionToma'
```

- [ ] Agregar lógica de auto-generación en `updateEstado()`
- [ ] Emitir evento `OrdenMedidorGenerada` para notificaciones
- [ ] Test: al completar orden InstalacionToma → existe nueva orden InstalacionMedidor

#### 2. Tipología de cortes ampliada (Req 11)

**Estado actual:** `Orden.tipo` incluye `Corte` sin subtipología.  
**Cambio:** Agregar campo `subtipoCorte` en `Orden` vinculado a `CatalogoTipoCorte` (definido en T11).

```prisma
// Agregar a model Orden:
subtipoCorteId  String?  @map("subtipo_corte_id")
subtipoCorte    CatalogoTipoCorte? @relation(fields: [subtipoCorteId], references: [id])
```

- [ ] Agregar campo `subtipoCorteId` al modelo `Orden`
- [ ] Validar que `subtipoCorteId` sea obligatorio cuando `tipo === 'Corte'`
- [ ] Actualizar DTO de creación de orden para incluir subtipo

#### 3. Atributos de corte: cortable/no cortable (Req 12)

**Estado actual:** `Orden.datosCampo` es JSON genérico.  
**Cambio:** Agregar campos explícitos para condiciones de corte.

```prisma
// Agregar a model Orden:
ubicacionCorte   String?  @map("ubicacion_corte")
condicionCortable Boolean? @map("condicion_cortable")
```

- [ ] Agregar campos de condición de corte
- [ ] Validar condiciones al crear orden de corte
- [ ] Frontend: mostrar condición cortable/no cortable en detalle de orden

---

## T06 — Modelo de Personas, Contratos, Trámites

**Archivo:** `Tareas/06-modelo-datos-personas-contratos-tramites.md`  
**Requerimientos nuevos que absorbe:** 1–4 (parcial), 20, 21 (parcial)

### Cambios requeridos

#### 1. Ampliar modelo Persona (Req 20)

**Estado actual:** Persona tiene: nombre, rfc, tipo, email, telefono.  
**Cambio:** Agregar campos para cumplir con el PRD.

```prisma
// Agregar a model Persona:
identificacionTipo   String?  @map("identificacion_tipo")   // INE | Pasaporte | CedulaProf | Otro
identificacionNumero String?  @map("identificacion_numero")
regimenFiscal        String?  @map("regimen_fiscal")        // 601 | 603 | 612 | 625 | 626 | ...
razonSocial          String?  @map("razon_social")          // para personas Moral
curp                 String?
telefonos            Json?    // [{ tipo: "celular"|"fijo"|"trabajo", numero }]
correos              Json?    // [{ tipo: "personal"|"trabajo", email }]
domicilios           DomicilioPersona[]  // relación nueva (requiere T12)
```

- [ ] Agregar campos `identificacionTipo`, `identificacionNumero`, `regimenFiscal`, `razonSocial`, `curp`
- [ ] Migrar de `email`/`telefono` planos a `correos`/`telefonos` JSON (preservar datos existentes)
- [ ] Agregar relación con `DomicilioPersona` (depende de T12)
- [ ] Actualizar DTOs y servicio de PersonasService
- [ ] Frontend: actualizar formularios de persona con campos nuevos

#### 2. Agregar rol "Contacto" (Req 2)

**Estado actual:** Roles: Propietario, Cliente, PersonaFiscal, Arrendatario.  
**Cambio:** Agregar `Contacto` como rol válido.

- [ ] Agregar `Contacto` a la validación de roles en `asignarRol()`
- [ ] Documentar: Contacto es la persona designada para comunicaciones operativas

#### 3. Trazabilidad de participación en proceso (Req 2)

**Estado actual:** `RolPersonaContrato` tiene fechaDesde/fechaHasta.  
**Cambio:** Agregar campo para registrar participación específica en trámites.

```prisma
// Ya existe relación Tramite.personaId, pero agregar:
// en RolPersonaContrato:
motivoAsignacion String?  @map("motivo_asignacion")
tramiteOrigenId  String?  @map("tramite_origen_id")
```

- [ ] Agregar campos de trazabilidad en `RolPersonaContrato`
- [ ] Registrar automáticamente el trámite que originó la asignación del rol

#### 4. Vista E2E del flujo contractual (Reqs 1, 3, 4)

**Estado actual:** `HistoricoContrato` registra cambios campo por campo.  
**Cambio:** Ampliar para soportar vista de secuencia operativa.

- [ ] Agregar endpoint `GET /contratos/:id/flujo-completo` que agregue: historial del contrato + órdenes asociadas + trámites + hitos de contratación (T10)
- [ ] Frontend: componente `FlujoProcesual.tsx` con timeline visual
- [ ] Incluir referencia a lógica CIG 2018 cuando se documente (Pregunta abierta)

#### 5. Vincular Contrato con Domicilio (Req 21 parcial)

**Estado actual:** `Contrato.direccion` es string plano.  
**Cambio:** Agregar relación con modelo Domicilio (depende de T12).

```prisma
// Agregar a model Contrato:
domicilioId  String?  @map("domicilio_id")
domicilio    Domicilio? @relation(fields: [domicilioId], references: [id])
```

- [ ] Agregar `domicilioId` a Contrato (depende de T12)
- [ ] Migrar `Contrato.direccion` → Domicilio parseado (script de migración)
- [ ] Mantener `direccion` como campo legacy durante transición

#### 6. Vincular Contrato con PuntoServicio (Req 9 parcial)

**Estado actual:** `Contrato.tomaId` apunta a una toma sin modelo propio.  
**Cambio:** Redirigir a `PuntoServicio` (depende de T11).

```prisma
// Modificar en model Contrato:
puntoServicioId  String?  @map("punto_servicio_id")
puntoServicio    PuntoServicio? @relation(fields: [puntoServicioId], references: [id])
```

- [ ] Agregar `puntoServicioId` y migrar datos de `tomaId`
- [ ] Mantener `tomaId` como campo legacy durante transición

#### 7. Vincular Contrato con TipoContratacion (Req 22 parcial)

**Estado actual:** `Contrato.tipoContrato` es string plano.  
**Cambio:** Hacer relación con modelo `TipoContratacion` (depende de T13).

```prisma
// Modificar en model Contrato:
tipoContratacionId  String?  @map("tipo_contratacion_id")
tipoContratacion    TipoContratacion? @relation(fields: [tipoContratacionId], references: [id])
```

- [ ] Agregar `tipoContratacionId` y migrar datos de `tipoContrato`
- [ ] Mantener `tipoContrato` como campo legacy durante transición

---

## T08 — Caja, Recaudación Interna, Convenios

**Archivo:** `Tareas/08-caja-recaudacion-interna-convenios.md`  
**Requerimientos nuevos que absorbe:** 8 (parcial)

### Cambios requeridos

#### 1. Factura de contratación vinculada a convenio (Req 8)

**Estado actual:** Convenio existe con saldo y parcialidades. No hay vínculo explícito con factura de contratación.  
**Cambio:** Agregar campo para vincular convenio con factura de origen (contratación).

```prisma
// Agregar a model Convenio:
facturaOrigenId  String?  @map("factura_origen_id")
origenTipo       String?  @map("origen_tipo")  // Contratacion | Adeudo | Reconexion
```

- [ ] Agregar `facturaOrigenId` y `origenTipo` al modelo `Convenio`
- [ ] Lógica: al aprobar contratación con pago diferido → crear Convenio automáticamente
- [ ] Frontend: mostrar origen del convenio en detalle

---

## T09 — Monitoreo y Conciliaciones

**Archivo:** `Tareas/09-monitoreo-conciliaciones.md`  
**Requerimientos nuevos que absorbe:** 33 (parcial)

### Cambios requeridos

#### 1. Reglas de consistencia cruzada (Req 33)

**Estado actual:** `ConciliacionReporte` tiene tipos: `RECAUDACION_VS_FACTURACION`, `FACTURACION_VS_CONTABILIDAD`, `PADRON_VS_GIS`.  
**Cambio:** Agregar tipos de conciliación nuevos para los dominios del PRD.

- [ ] Agregar tipo `CONTRATACION_VS_FACTURACION`: verificar que todo contrato activo tenga conceptos de cobro asignados y tarifa vigente
- [ ] Agregar tipo `TARIFAS_VS_TIPOS_CONTRATO`: verificar que las tarifas asignadas correspondan al tipo de contratación
- [ ] Agregar tipo `CORTES_VS_ESTADO_SERVICIO`: verificar que los cortes se reflejen en el estado del punto de servicio
- [ ] Agregar tipo `DOMICILIOS_VS_CONTRATOS`: verificar que todo contrato activo tenga domicilio estructurado
- [ ] Implementar los queries de conciliación correspondientes

---

## Tareas sin modificación requerida

Las siguientes tareas **no requieren cambios** por el nuevo PRD:

| Tarea | Razón |
|-------|-------|
| **T01** — Lecturas y archivos planos | Los requerimientos del nuevo PRD no modifican el módulo de lecturas directamente. Sesiones futuras sobre lecturas/rutas podrían generar cambios. |
| **T02** — Recaudación ETL pagos | Sin impacto directo del nuevo PRD. |
| **T04** — Integración contable SAP | Sin impacto directo, aunque el motor tarifario (T14) eventualmente necesitará generar pólizas. |
| **T05** — Integración GIS | Sin impacto directo, aunque el modelo de PuntoServicio (T11) deberá sincronizarse con GIS. |
| **T07** — Atención a clientes y quejas | Sin impacto directo del nuevo PRD. |

---

## Resumen de impacto en tareas existentes

| Tarea | # cambios | Complejidad | Dependencias nuevas |
|-------|-----------|-------------|-------------------|
| **T03** | 3 cambios | Media | T11 (CatalogoTipoCorte) |
| **T06** | 7 cambios | Alta | T11 (PuntoServicio), T12 (Domicilio), T13 (TipoContratacion) |
| **T08** | 1 cambio | Baja | Ninguna nueva |
| **T09** | 1 cambio (4 subtipos) | Media | T11, T12, T13, T14 |
