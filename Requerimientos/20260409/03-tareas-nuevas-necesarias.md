# Tareas Nuevas Necesarias — PRD 2026-04-06

**Fecha:** 2026-04-09  
**Propósito:** Definir las tareas nuevas (T10–T15) requeridas para cubrir los gaps del nuevo PRD.

---

## T10 — Flujo de Contratación End-to-End

**Requerimientos cubiertos:** 1, 6, 7, 8 (parcial)  
**Dominio:** Orquestación del proceso contractual  
**Dependencias:** T06 (Personas), T11 (PuntoServicio), T13 (Tipos contratación), T14 (Motor tarifario)

### Alcance

- [ ] Máquina de estados (FSM) del proceso contractual con transiciones: Solicitud → Validación → Aprobación → Instalación Toma → Instalación Medidor → Alta Servicio → Activo
- [ ] Estados operativos independientes para: contrato, instalación de toma, instalación de medidor, alta de servicio
- [ ] Trigger automático: al completar instalación de toma → generar orden de instalación de medidor (Req 5 — implementar en T03 ampliada con hook desde T10)
- [ ] Formato estándar de contrato con secciones, campos obligatorios y cláusulas controladas
- [ ] Gestión de plantillas de contrato por tipo de contratación
- [ ] Vinculación: contratación → factura timbrada → convenio de pago (cuando aplique)
- [ ] Vista de timeline/secuencia del proceso contractual para operación

### Modelos Prisma propuestos

```prisma
model ProcesoContratacion {
  id               String   @id @default(cuid())
  contratoId       String   @map("contrato_id")
  estadoContrato   String   @default("Solicitud")
  estadoToma       String   @default("Pendiente")
  estadoMedidor    String   @default("Pendiente")
  estadoServicio   String   @default("Pendiente")
  fechaInicio      DateTime @default(now())
  fechaAprobacion  DateTime?
  fechaAltaServicio DateTime?
  plantillaId      String?  @map("plantilla_id")
  operadorId       String?
  notas            String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  contrato         Contrato @relation(fields: [contratoId], references: [id])
  plantilla        PlantillaContrato? @relation(fields: [plantillaId], references: [id])
  hitos            HitoContratacion[]

  @@index([contratoId])
  @@map("procesos_contratacion")
}

model HitoContratacion {
  id          String   @id @default(cuid())
  procesoId   String   @map("proceso_id")
  tipo        String   // SolicitudRecibida | ValidacionDatos | Aprobacion | InstalacionToma | InstalacionMedidor | AltaServicio
  estado      String   @default("Pendiente")
  responsable String?
  fechaInicio DateTime?
  fechaFin    DateTime?
  notas       String?
  ordenId     String?  @map("orden_id")
  createdAt   DateTime @default(now())

  proceso     ProcesoContratacion @relation(fields: [procesoId], references: [id])

  @@index([procesoId])
  @@map("hitos_contratacion")
}

model PlantillaContrato {
  id              String   @id @default(cuid())
  nombre          String
  tipoContratacion String @map("tipo_contratacion")
  version         Int      @default(1)
  secciones       Json     // { seccion: string, campos: { nombre, obligatorio, tipo }[] }
  clausulas       Json     // { texto, orden, obligatoria }[]
  activa          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  procesos        ProcesoContratacion[]

  @@map("plantillas_contrato")
}
```

### Preguntas abiertas bloqueantes

- ⚠️ Pregunta #1: Formato final estándar del contrato
- ⚠️ Pregunta #2: Criterios de transición entre estados
- ⚠️ Pregunta #3: Validaciones para auto-generar orden de medidor

### Entregables backend

- `ProcesoContratacionModule` con servicio, controller, DTOs
- FSM con validación de transiciones
- Event emitter para trigger de órdenes automáticas
- Endpoint `GET /procesos-contratacion/:id/timeline`

### Entregables frontend

- Vista de timeline del proceso contractual
- Formulario de alta de contrato con plantilla
- Panel de seguimiento por etapa

---

## T11 — Punto de Servicio y Modelo de Cortes

**Requerimientos cubiertos:** 9–14  
**Dominio:** Entidad PuntoServicio, jerarquías, tipos de corte  
**Dependencias:** Ninguna directa (base para T10 y T03 ampliada)

### Alcance

- [ ] Modelo `PuntoServicio` como entidad propia con: info técnica (diámetro toma, material, calibre medidor), administrativa (zona facturación, ruta lectura, tipo suministro), geográfica (coordenadas, domicilio)
- [ ] Catálogos operativos: `EstructuraTecnica`, `TipoSuministro`, `ZonaFacturacion`, `CodigoRecorrido`
- [ ] Modelo de tipos de corte: `CatalogoTipoCorte` con al menos Deuda, BajaTemporal, Administrativo
- [ ] Atributos de corte: fechas, ubicación, bandera cortable/no cortable
- [ ] Relaciones padre-hijo entre puntos de servicio con vigencia (fechaInicio, fechaFin)
- [ ] Reglas de repartición de consumo y facturación en relaciones padre-hijo
- [ ] Migración de datos existentes de `Contrato.tomaId` → PuntoServicio

### Modelos Prisma propuestos

```prisma
model PuntoServicio {
  id                  String   @id @default(cuid())
  codigo              String   @unique
  domicilioId         String?  @map("domicilio_id")
  tipoSuministroId    String?  @map("tipo_suministro_id")
  estructuraTecnicaId String?  @map("estructura_tecnica_id")
  zonaFacturacionId   String?  @map("zona_facturacion_id")
  codigoRecorridoId   String?  @map("codigo_recorrido_id")
  diametroToma        Float?
  materialToma        String?
  calibreMedidor      String?
  coordenadaX         Float?
  coordenadaY         Float?
  esCortable          Boolean  @default(true)
  estado              String   @default("Activo")
  parentId            String?  @map("parent_id")
  parentVigenciaDesde DateTime? @map("parent_vigencia_desde")
  parentVigenciaHasta DateTime? @map("parent_vigencia_hasta")
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  parent              PuntoServicio?  @relation("PuntoServicioJerarquia", fields: [parentId], references: [id])
  hijos               PuntoServicio[] @relation("PuntoServicioJerarquia")
  contratos           Contrato[]
  domicilio           Domicilio?      @relation(fields: [domicilioId], references: [id])
  tipoSuministro      CatalogoTipoSuministro?  @relation(fields: [tipoSuministroId], references: [id])
  estructuraTecnica   CatalogoEstructuraTecnica? @relation(fields: [estructuraTecnicaId], references: [id])

  @@index([parentId])
  @@index([zonaFacturacionId])
  @@map("puntos_servicio")
}

model CatalogoTipoCorte {
  id          String   @id @default(cuid())
  nombre      String   @unique  // Deuda | BajaTemporal | Administrativo | ...
  descripcion String?
  impactoFacturacion String?  // Suspende | Reduce | SinImpacto
  activo      Boolean  @default(true)

  @@map("catalogo_tipos_corte")
}

model CatalogoTipoSuministro {
  id     String @id @default(cuid())
  nombre String @unique
  activo Boolean @default(true)
  puntos PuntoServicio[]
  @@map("catalogo_tipos_suministro")
}

model CatalogoEstructuraTecnica {
  id     String @id @default(cuid())
  nombre String @unique
  activo Boolean @default(true)
  puntos PuntoServicio[]
  @@map("catalogo_estructuras_tecnicas")
}
```

### Preguntas abiertas bloqueantes

- ⚠️ Pregunta #5: Tipos de corte y su impacto operativo/facturación
- ⚠️ Pregunta #10: Regla de repartición padre-hijo

### Entregables

- Módulo `PuntoServicioModule`
- CRUD + endpoints de jerarquía
- Migración de datos `Contrato.tomaId` → `PuntoServicio`
- Seed de catálogos operativos

---

## T12 — Modelo de Domicilios Homologado INEGI

**Requerimientos cubiertos:** 15–19, 21 (parcial)  
**Dominio:** Domicilios normalizados, catálogos INEGI, limpieza  
**Dependencias:** Ninguna (base para T06 ampliada y T11)

### Alcance

- [ ] Modelo `Domicilio` estructurado con campos INEGI: país, estado, municipio, localidad, colonia, calle, numExterior, numInterior, manzana, lote, codigoPostal, complemento
- [ ] Catálogos INEGI: `CatalogoEstado`, `CatalogoMunicipio`, `CatalogoLocalidad`, `CatalogoColonia`, `CatalogoCodigoPostal`
- [ ] Evaluación de relación calles-colonias-CP con rangos par/impar (decisión de diseño pendiente)
- [ ] Función de generación de representación concatenada del domicilio
- [ ] Modelo `DomicilioPersona` para vinculación persona-domicilio con roles
- [ ] Estrategia de limpieza y migración de datos de `Contrato.direccion` → `Domicilio`

### Modelos Prisma propuestos

```prisma
model Domicilio {
  id              String   @id @default(cuid())
  pais            String   @default("México")
  estadoId        String?  @map("estado_id")
  municipioId     String?  @map("municipio_id")
  localidadId     String?  @map("localidad_id")
  coloniaId       String?  @map("colonia_id")
  calle           String?
  numExterior     String?  @map("num_exterior")
  numInterior     String?  @map("num_interior")
  manzana         String?
  lote            String?
  codigoPostal    String?  @map("codigo_postal")
  complemento     String?
  direccionCompleta String? @map("direccion_completa")  // generada automáticamente
  coordenadaX     Float?
  coordenadaY     Float?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  estado          CatalogoEstadoINEGI?     @relation(fields: [estadoId], references: [id])
  municipio       CatalogoMunicipioINEGI?  @relation(fields: [municipioId], references: [id])
  localidad       CatalogoLocalidadINEGI?  @relation(fields: [localidadId], references: [id])
  colonia         CatalogoColoniaINEGI?    @relation(fields: [coloniaId], references: [id])
  personas        DomicilioPersona[]
  puntosServicio  PuntoServicio[]

  @@index([codigoPostal])
  @@index([coloniaId])
  @@map("domicilios")
}

model DomicilioPersona {
  id           String   @id @default(cuid())
  domicilioId  String   @map("domicilio_id")
  personaId    String   @map("persona_id")
  rol          String   // Cliente | Propietario | Inquilino | Fiscal | Correspondencia
  principal    Boolean  @default(false)
  fechaDesde   DateTime @default(now())
  fechaHasta   DateTime?
  createdAt    DateTime @default(now())

  domicilio    Domicilio @relation(fields: [domicilioId], references: [id])
  persona      Persona   @relation(fields: [personaId], references: [id])

  @@unique([domicilioId, personaId, rol])
  @@index([personaId])
  @@map("domicilios_personas")
}

model CatalogoEstadoINEGI {
  id          String @id @default(cuid())
  claveINEGI  String @unique @map("clave_inegi")
  nombre      String
  domicilios  Domicilio[]
  municipios  CatalogoMunicipioINEGI[]
  @@map("catalogo_estados_inegi")
}

model CatalogoMunicipioINEGI {
  id          String @id @default(cuid())
  claveINEGI  String @unique @map("clave_inegi")
  nombre      String
  estadoId    String @map("estado_id")
  estado      CatalogoEstadoINEGI @relation(fields: [estadoId], references: [id])
  domicilios  Domicilio[]
  localidades CatalogoLocalidadINEGI[]
  @@index([estadoId])
  @@map("catalogo_municipios_inegi")
}

model CatalogoLocalidadINEGI {
  id           String @id @default(cuid())
  claveINEGI   String @unique @map("clave_inegi")
  nombre       String
  municipioId  String @map("municipio_id")
  municipio    CatalogoMunicipioINEGI @relation(fields: [municipioId], references: [id])
  domicilios   Domicilio[]
  @@index([municipioId])
  @@map("catalogo_localidades_inegi")
}

model CatalogoColoniaINEGI {
  id           String @id @default(cuid())
  claveINEGI   String @map("clave_inegi")
  nombre       String
  codigoPostal String @map("codigo_postal")
  domicilios   Domicilio[]
  @@index([codigoPostal])
  @@map("catalogo_colonias_inegi")
}
```

### Preguntas abiertas bloqueantes

- ⚠️ Pregunta #8: Nivel de complejidad de domicilios
- ⚠️ Pregunta #9: Relación calles-colonias-CP-rangos par/impar

### Entregables

- Módulo `DomiciliosModule` con CRUD + búsqueda + función concatenación
- Seed de catálogos INEGI (descarga de datos.gob.mx)
- Script de migración: `Contrato.direccion` → `Domicilio` parseado
- Módulo `DomicilioPersonaModule` para vínculo persona-domicilio

---

## T13 — Tipos de Contratación Parametrizados y Catálogos Funcionales

**Requerimientos cubiertos:** 22–25  
**Dominio:** Parametrización de tipos, conceptos, cláusulas, documentos, catálogos funcionales  
**Dependencias:** T14 (Motor tarifario — conceptos de cobro usan tarifas)

### Alcance

- [ ] Modelo `TipoContratacion` parametrizable con: conceptos de cobro, cláusulas contractuales, documentos requeridos (con obligatoriedad)
- [ ] Asociación automática de conceptos de facturación y cláusulas al seleccionar tipo de contratación
- [ ] Lógica para cambio de tipo de contrato: actualización consistente de conceptos, tarifas, cláusulas sin impactar contabilidad
- [ ] Homologación de catálogos funcionales: actividades, tipos de contratación, estructura técnica, sectores hidráulicos, tipos de punto de servicio

### Modelos Prisma propuestos

```prisma
model TipoContratacion {
  id              String   @id @default(cuid())
  codigo          String   @unique
  nombre          String
  descripcion     String?
  activo          Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  conceptos       ConceptoCobroTipoContratacion[]
  clausulas       ClausulaTipoContratacion[]
  documentosRequeridos DocumentoRequeridoTipoContratacion[]
  contratos       Contrato[]

  @@map("tipos_contratacion")
}

model ConceptoCobro {
  id          String   @id @default(cuid())
  codigo      String   @unique
  nombre      String
  descripcion String?
  tipo        String   // Fijo | Variable | Proporcional
  activo      Boolean  @default(true)

  tiposContratacion ConceptoCobroTipoContratacion[]

  @@map("conceptos_cobro")
}

model ConceptoCobroTipoContratacion {
  id                  String @id @default(cuid())
  tipoContratacionId  String @map("tipo_contratacion_id")
  conceptoCobroId     String @map("concepto_cobro_id")
  obligatorio         Boolean @default(true)

  tipoContratacion    TipoContratacion @relation(fields: [tipoContratacionId], references: [id])
  conceptoCobro       ConceptoCobro @relation(fields: [conceptoCobroId], references: [id])

  @@unique([tipoContratacionId, conceptoCobroId])
  @@map("conceptos_cobro_tipos_contratacion")
}

model ClausulaContractual {
  id     String @id @default(cuid())
  codigo String @unique
  titulo String
  texto  String
  version Int   @default(1)
  activa Boolean @default(true)

  tiposContratacion ClausulaTipoContratacion[]

  @@map("clausulas_contractuales")
}

model ClausulaTipoContratacion {
  id                  String @id @default(cuid())
  tipoContratacionId  String @map("tipo_contratacion_id")
  clausulaId          String @map("clausula_id")
  orden               Int    @default(0)
  obligatoria         Boolean @default(true)

  tipoContratacion    TipoContratacion @relation(fields: [tipoContratacionId], references: [id])
  clausula            ClausulaContractual @relation(fields: [clausulaId], references: [id])

  @@unique([tipoContratacionId, clausulaId])
  @@map("clausulas_tipos_contratacion")
}

model DocumentoRequeridoTipoContratacion {
  id                  String @id @default(cuid())
  tipoContratacionId  String @map("tipo_contratacion_id")
  tipoDocumento       String // INE | CURP | RFC | Escrituras | ComprobanteDOM | Otro
  nombre              String
  obligatorio         Boolean @default(true)

  tipoContratacion    TipoContratacion @relation(fields: [tipoContratacionId], references: [id])

  @@map("documentos_requeridos_tipos_contratacion")
}
```

### Preguntas abiertas bloqueantes

- ⚠️ Pregunta #6: Regla de asociación automática conceptos/cláusulas/docs
- ⚠️ Pregunta #7: Cambio de tipo de contrato sin afectar contabilidad
- ⚠️ Pregunta #12: Documentos obligatorios por tipo de contratación

### Entregables

- Módulo `TipoContratacionModule` con CRUD y configuración
- Servicio de asociación automática: al crear contrato con tipo X → cargar conceptos, cláusulas, docs
- Servicio de migración de tipo de contrato con rollback de conceptos/tarifas
- Seed de catálogos funcionales iniciales
- Admin UI para configurar tipos de contratación

---

## T14 — Motor Tarifario

**Requerimientos cubiertos:** 26–31  
**Dominio:** Fórmulas tarifarias, vigencias, escalonamiento, correctores  
**Dependencias:** T13 (Tipos contratación para vincular tarifas a tipos)

### Alcance

- [ ] Modelo `Tarifa` con fórmulas compuestas: precio base + componente proporcional (cantidad × factor), variables (distancia, diámetro), IVA diferenciado
- [ ] Tipos de tarifa: escalonada mensual, fija especial, proporcional
- [ ] Vigencias históricas: cada tarifa tiene fechaInicio/fechaFin, versiones inmutables
- [ ] Correctores/variables: multas, recargos, ajustes, descuentos, consumo no registrado
- [ ] Ajustes manuales excepcionales con trazabilidad y autorización
- [ ] Actualización automática trimestral con generación de nueva versión
- [ ] Validación de asignación tarifaria por: administración, tipo de usuario, tipo de servicio

### Modelos Prisma propuestos

```prisma
model Tarifa {
  id                 String   @id @default(cuid())
  codigo             String
  nombre             String
  tipo               String   // Escalonada | Fija | Proporcional
  tipoContratacionId String?  @map("tipo_contratacion_id")
  tipoServicio       String?
  formula            Json     // { base: number, proporcional: { factor, variable }, iva: { tasa, exento } }
  escalones          Json?    // [{ desde, hasta, precioUnitario }] para tipo Escalonada
  variables          Json?    // { distancia, diametro, etc. }
  ivaTasa            Float    @default(0.16)
  ivaExento          Boolean  @default(false)
  version            Int      @default(1)
  vigenciaDesde      DateTime @map("vigencia_desde")
  vigenciaHasta      DateTime? @map("vigencia_hasta")
  activa             Boolean  @default(true)
  aprobadaPor        String?
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  ajustes            AjusteTarifario[]

  @@index([codigo, version])
  @@index([vigenciaDesde])
  @@index([tipoContratacionId])
  @@map("tarifas")
}

model CorrectTarifario {
  id          String   @id @default(cuid())
  codigo      String   @unique
  nombre      String   // Multa | Recargo | Descuento | Ajuste | ConsumoNoRegistrado
  tipo        String   // Porcentaje | MontoFijo | Formula
  valor       Float?
  formula     Json?    // para tipo Formula
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())

  @@map("correctores_tarifarios")
}

model AjusteTarifario {
  id            String   @id @default(cuid())
  tarifaId      String?  @map("tarifa_id")
  contratoId    String?  @map("contrato_id")
  tipo          String   // Manual | Automatico
  motivo        String
  montoOriginal Float    @map("monto_original")
  montoAjustado Float    @map("monto_ajustado")
  autorizadoPor String   @map("autorizado_por")
  estado        String   @default("Pendiente")  // Pendiente | Aprobado | Rechazado | Aplicado
  createdAt     DateTime @default(now())

  tarifa        Tarifa?  @relation(fields: [tarifaId], references: [id])

  @@index([contratoId])
  @@map("ajustes_tarifarios")
}

model ActualizacionTarifaria {
  id              String   @id @default(cuid())
  periodo         String   // "2026-Q1", "2026-Q2"...
  tipo            String   // Trimestral | Extraordinaria
  porcentajeIncremento Float?
  tarifasActualizadas Int  @default(0)
  ejecutadaPor    String?
  estado          String   @default("Pendiente") // Pendiente | EnProceso | Completada | Fallida
  fechaEjecucion  DateTime?
  createdAt       DateTime @default(now())

  @@map("actualizaciones_tarifarias")
}
```

### Preguntas abiertas bloqueantes

- ⚠️ Pregunta #11: Excepciones tarifarias y autorizaciones
- ⚠️ Pregunta #13: Controles de asignación tarifaria

### Entregables

- Módulo `TarifasModule` con motor de cálculo
- Función `calcularMonto(tarifaId, variables)` para evaluación de fórmulas
- Job programado para actualización trimestral
- UI de administración de tarifas con vigencias
- UI de ajustes manuales con flujo de aprobación
- Endpoint de validación: `POST /tarifas/validar-asignacion`

---

## T15 — Reglas de Calidad y Marco de Migración de Datos

**Requerimientos cubiertos:** 32, 33 (parcial)  
**Dominio:** Framework de validación pre-migración, consistencia cruzada  
**Dependencias:** T12 (Domicilios), T13 (Catálogos), T14 (Tarifas)

### Alcance

- [ ] Definir reglas de calidad por dominio: Contratos, Personas, Domicilios, Puntos de servicio, Tarifas
- [ ] Reglas de homologación: mapeo de datos legacy → nuevos catálogos
- [ ] Reglas de limpieza: duplicados, inconsistencias, datos faltantes
- [ ] Scripts de validación ejecutables pre-migración
- [ ] Reporte de calidad de datos con métricas
- [ ] Reglas de consistencia cruzada entre procesos (contratación ↔ facturación ↔ cortes ↔ lecturas)

### Entregables

- Documento de reglas de calidad por dominio
- Scripts de validación y reporte
- Dashboard de calidad de datos (opcional, puede ser parte de T09 ampliada)
- Capa de servicios compartidos para reglas de negocio cruzadas
