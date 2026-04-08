-- PRD 2026-04-06 Fase 1: Domicilios INEGI, Personas (campos extendidos), Contratos (nuevas relaciones)
-- Includes: T10 (procesos contratación), T11 (puntos servicio + cortes), T12 (domicilios INEGI),
--           T13 (tipos contratación + catálogos), T14 (motor tarifario)

-- ============================================================
-- 1. CATÁLOGOS BASE (sin dependencias)
-- ============================================================

CREATE TABLE "catalogo_estados_inegi" (
    "id" TEXT NOT NULL,
    "clave_inegi" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_estados_inegi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_estados_inegi_clave_inegi_key" ON "catalogo_estados_inegi"("clave_inegi");

CREATE TABLE "catalogo_tipos_suministro" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_tipos_suministro_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_suministro_codigo_key" ON "catalogo_tipos_suministro"("codigo");

CREATE TABLE "catalogo_estructuras_tecnicas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_estructuras_tecnicas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_estructuras_tecnicas_codigo_key" ON "catalogo_estructuras_tecnicas"("codigo");

CREATE TABLE "catalogo_tipos_corte" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "impacto" TEXT,
    "requiere_cuadrilla" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_tipos_corte_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_corte_codigo_key" ON "catalogo_tipos_corte"("codigo");

CREATE TABLE "tipos_contratacion" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "requiere_medidor" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tipos_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tipos_contratacion_codigo_key" ON "tipos_contratacion"("codigo");

CREATE TABLE "conceptos_cobro" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "monto_base" DECIMAL(10,2),
    "iva_pct" DECIMAL(5,2) NOT NULL DEFAULT 16,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "conceptos_cobro_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conceptos_cobro_codigo_key" ON "conceptos_cobro"("codigo");

CREATE TABLE "clausulas_contractuales" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "clausulas_contractuales_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "clausulas_contractuales_codigo_key" ON "clausulas_contractuales"("codigo");

CREATE TABLE "tarifas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_servicio" TEXT NOT NULL,
    "tipo_calculo" TEXT NOT NULL,
    "rango_min_m3" INTEGER,
    "rango_max_m3" INTEGER,
    "precio_unitario" DECIMAL(10,4),
    "cuota_fija" DECIMAL(10,2),
    "iva_pct" DECIMAL(5,2) NOT NULL DEFAULT 16,
    "vigencia_desde" TIMESTAMP(3) NOT NULL,
    "vigencia_hasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tarifas_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "tarifas_codigo_idx" ON "tarifas"("codigo");
CREATE INDEX "tarifas_tipo_servicio_idx" ON "tarifas"("tipo_servicio");
CREATE INDEX "tarifas_vigencia_desde_idx" ON "tarifas"("vigencia_desde");

CREATE TABLE "actualizaciones_tarifarias" (
    "id" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha_publicacion" TIMESTAMP(3) NOT NULL,
    "fecha_aplicacion" TIMESTAMP(3) NOT NULL,
    "fuente_oficial" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "tarifas_afectadas" JSONB,
    "aplicado_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "actualizaciones_tarifarias_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "actualizaciones_tarifarias_estado_idx" ON "actualizaciones_tarifarias"("estado");

CREATE TABLE "plantillas_contrato" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "contenido" TEXT NOT NULL,
    "variables" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "plantillas_contrato_pkey" PRIMARY KEY ("id")
);

-- ============================================================
-- 2. CATÁLOGOS INEGI DEPENDIENTES
-- ============================================================

CREATE TABLE "catalogo_municipios_inegi" (
    "id" TEXT NOT NULL,
    "estado_id" TEXT NOT NULL,
    "clave_inegi" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_municipios_inegi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_municipios_inegi_clave_inegi_key" ON "catalogo_municipios_inegi"("clave_inegi");
CREATE INDEX "catalogo_municipios_inegi_estado_id_idx" ON "catalogo_municipios_inegi"("estado_id");

CREATE TABLE "catalogo_localidades_inegi" (
    "id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "clave_inegi" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_localidades_inegi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_localidades_inegi_clave_inegi_key" ON "catalogo_localidades_inegi"("clave_inegi");
CREATE INDEX "catalogo_localidades_inegi_municipio_id_idx" ON "catalogo_localidades_inegi"("municipio_id");

CREATE TABLE "catalogo_colonias_inegi" (
    "id" TEXT NOT NULL,
    "municipio_id" TEXT NOT NULL,
    "codigo_postal" TEXT NOT NULL,
    "clave_inegi" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_colonias_inegi_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_colonias_inegi_clave_inegi_key" ON "catalogo_colonias_inegi"("clave_inegi");
CREATE INDEX "catalogo_colonias_inegi_municipio_id_idx" ON "catalogo_colonias_inegi"("municipio_id");
CREATE INDEX "catalogo_colonias_inegi_codigo_postal_idx" ON "catalogo_colonias_inegi"("codigo_postal");

-- ============================================================
-- 3. DOMICILIOS
-- ============================================================

CREATE TABLE "domicilios" (
    "id" TEXT NOT NULL,
    "calle" TEXT NOT NULL,
    "num_exterior" TEXT,
    "num_interior" TEXT,
    "colonia_inegi_id" TEXT,
    "codigo_postal" TEXT,
    "localidad_inegi_id" TEXT,
    "municipio_inegi_id" TEXT,
    "estado_inegi_id" TEXT,
    "entre_calle_1" TEXT,
    "entre_calle_2" TEXT,
    "referencia" TEXT,
    "direccion_concatenada" TEXT,
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "validado_inegi" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "domicilios_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "domicilios_colonia_inegi_id_idx" ON "domicilios"("colonia_inegi_id");
CREATE INDEX "domicilios_codigo_postal_idx" ON "domicilios"("codigo_postal");
CREATE INDEX "domicilios_municipio_inegi_id_idx" ON "domicilios"("municipio_inegi_id");

CREATE TABLE "domicilios_persona" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "domicilio_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'fiscal',
    "principal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "domicilios_persona_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "domicilios_persona_persona_id_domicilio_id_tipo_key" ON "domicilios_persona"("persona_id", "domicilio_id", "tipo");
CREATE INDEX "domicilios_persona_persona_id_idx" ON "domicilios_persona"("persona_id");
CREATE INDEX "domicilios_persona_domicilio_id_idx" ON "domicilios_persona"("domicilio_id");

-- ============================================================
-- 4. PUNTOS DE SERVICIO
-- ============================================================

CREATE TABLE "puntos_servicio" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "domicilio_id" TEXT,
    "tipo_suministro_id" TEXT,
    "estructura_tecnica_id" TEXT,
    "diametro_toma" TEXT,
    "material_tuberia" TEXT,
    "profundidad_toma" DECIMAL(5,2),
    "tiene_valvula" BOOLEAN NOT NULL DEFAULT false,
    "tiene_caja" BOOLEAN NOT NULL DEFAULT false,
    "gps_lat" DECIMAL(10,7),
    "gps_lng" DECIMAL(10,7),
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "cortable" BOOLEAN NOT NULL DEFAULT true,
    "motivo_no_cortable" TEXT,
    "punto_servicio_padre_id" TEXT,
    "reparticion_consumo" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "puntos_servicio_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "puntos_servicio_codigo_key" ON "puntos_servicio"("codigo");
CREATE INDEX "puntos_servicio_domicilio_id_idx" ON "puntos_servicio"("domicilio_id");
CREATE INDEX "puntos_servicio_tipo_suministro_id_idx" ON "puntos_servicio"("tipo_suministro_id");
CREATE INDEX "puntos_servicio_punto_servicio_padre_id_idx" ON "puntos_servicio"("punto_servicio_padre_id");

-- ============================================================
-- 5. PROCESOS DE CONTRATACIÓN
-- ============================================================

CREATE TABLE "procesos_contratacion" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT,
    "tramite_id" TEXT,
    "etapa" TEXT NOT NULL DEFAULT 'solicitud',
    "estado" TEXT NOT NULL DEFAULT 'en_progreso',
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "plantilla_id" TEXT,
    "creado_por" TEXT,
    "datos_adicionales" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "procesos_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "procesos_contratacion_contrato_id_idx" ON "procesos_contratacion"("contrato_id");
CREATE INDEX "procesos_contratacion_etapa_idx" ON "procesos_contratacion"("etapa");
CREATE INDEX "procesos_contratacion_estado_idx" ON "procesos_contratacion"("estado");

CREATE TABLE "hitos_contratacion" (
    "id" TEXT NOT NULL,
    "proceso_id" TEXT NOT NULL,
    "etapa" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "nota" TEXT,
    "usuario" TEXT,
    "fecha_cumpl" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hitos_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hitos_contratacion_proceso_id_idx" ON "hitos_contratacion"("proceso_id");

-- ============================================================
-- 6. CATÁLOGOS TIPOS CONTRATACIÓN (tablas pivote)
-- ============================================================

CREATE TABLE "conceptos_cobro_tipo_contratacion" (
    "id" TEXT NOT NULL,
    "tipo_contratacion_id" TEXT NOT NULL,
    "concepto_cobro_id" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "conceptos_cobro_tipo_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "conceptos_cobro_tipo_contratacion_tipo_contratacion_id_concept" ON "conceptos_cobro_tipo_contratacion"("tipo_contratacion_id", "concepto_cobro_id");

CREATE TABLE "clausulas_tipo_contratacion" (
    "id" TEXT NOT NULL,
    "tipo_contratacion_id" TEXT NOT NULL,
    "clausula_id" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "clausulas_tipo_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "clausulas_tipo_contratacion_tipo_contratacion_id_clausula_id_k" ON "clausulas_tipo_contratacion"("tipo_contratacion_id", "clausula_id");

CREATE TABLE "documentos_requeridos_tipo_contratacion" (
    "id" TEXT NOT NULL,
    "tipo_contratacion_id" TEXT NOT NULL,
    "nombre_documento" TEXT NOT NULL,
    "obligatorio" BOOLEAN NOT NULL DEFAULT true,
    "descripcion" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documentos_requeridos_tipo_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "documentos_requeridos_tipo_contratacion_tipo_contratacion_id_i" ON "documentos_requeridos_tipo_contratacion"("tipo_contratacion_id");

-- ============================================================
-- 7. MOTOR TARIFARIO (tablas auxiliares)
-- ============================================================

CREATE TABLE "correcciones_tarifarias" (
    "id" TEXT NOT NULL,
    "tarifa_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "formula" TEXT,
    "porcentaje" DECIMAL(5,2),
    "monto_fijo" DECIMAL(10,2),
    "condiciones" JSONB,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "correcciones_tarifarias_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "correcciones_tarifarias_tarifa_id_idx" ON "correcciones_tarifarias"("tarifa_id");
CREATE INDEX "correcciones_tarifarias_tipo_idx" ON "correcciones_tarifarias"("tipo");

CREATE TABLE "ajustes_tarifarios" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto_original" DECIMAL(10,2) NOT NULL,
    "monto_ajustado" DECIMAL(10,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "aprobado_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ajustes_tarifarios_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ajustes_tarifarios_contrato_id_idx" ON "ajustes_tarifarios"("contrato_id");
CREATE INDEX "ajustes_tarifarios_periodo_idx" ON "ajustes_tarifarios"("periodo");

-- ============================================================
-- 8. NUEVAS COLUMNAS EN TABLAS EXISTENTES
-- ============================================================

-- personas: campos extendidos PRD 2026-04-06
ALTER TABLE "personas"
    ADD COLUMN "apellido_paterno" TEXT,
    ADD COLUMN "apellido_materno" TEXT,
    ADD COLUMN "curp" TEXT,
    ADD COLUMN "razon_social" TEXT,
    ADD COLUMN "regimen_fiscal" TEXT,
    ADD COLUMN "tipo_identificacion" TEXT,
    ADD COLUMN "num_identificacion" TEXT,
    ADD COLUMN "telefono_alt" TEXT;
CREATE INDEX "personas_curp_idx" ON "personas"("curp");

-- contratos: nuevas relaciones PRD 2026-04-06
ALTER TABLE "contratos"
    ADD COLUMN "punto_servicio_id" TEXT,
    ADD COLUMN "domicilio_id" TEXT,
    ADD COLUMN "tipo_contratacion_id" TEXT;
CREATE INDEX "contratos_punto_servicio_id_idx" ON "contratos"("punto_servicio_id");
CREATE INDEX "contratos_domicilio_id_idx" ON "contratos"("domicilio_id");
CREATE INDEX "contratos_tipo_contratacion_id_idx" ON "contratos"("tipo_contratacion_id");

-- ordenes: campos de corte PRD 2026-04-06
ALTER TABLE "ordenes"
    ADD COLUMN "subtipo_corte_id" TEXT,
    ADD COLUMN "origen_automatico" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "evento_origen" TEXT,
    ADD COLUMN "ubicacion_corte" TEXT,
    ADD COLUMN "condicion_cortable" BOOLEAN;
CREATE INDEX "ordenes_subtipo_corte_id_idx" ON "ordenes"("subtipo_corte_id");

-- convenios: campos de origen PRD 2026-04-06
ALTER TABLE "convenios"
    ADD COLUMN "origen_tipo" TEXT,
    ADD COLUMN "factura_origen_id" TEXT;
CREATE INDEX "convenios_origen_tipo_idx" ON "convenios"("origen_tipo");

-- conciliacion_reportes: campos de monitoreo PRD 2026-04-06
ALTER TABLE "conciliacion_reportes"
    ADD COLUMN "contratos_sin_punto" INTEGER,
    ADD COLUMN "domicilios_sin_inegi" INTEGER,
    ADD COLUMN "tarifas_vencidas" INTEGER;

-- ============================================================
-- 9. FOREIGN KEYS
-- ============================================================

-- INEGI jerarquía
ALTER TABLE "catalogo_municipios_inegi"
    ADD CONSTRAINT "catalogo_municipios_inegi_estado_id_fkey"
    FOREIGN KEY ("estado_id") REFERENCES "catalogo_estados_inegi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catalogo_localidades_inegi"
    ADD CONSTRAINT "catalogo_localidades_inegi_municipio_id_fkey"
    FOREIGN KEY ("municipio_id") REFERENCES "catalogo_municipios_inegi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "catalogo_colonias_inegi"
    ADD CONSTRAINT "catalogo_colonias_inegi_municipio_id_fkey"
    FOREIGN KEY ("municipio_id") REFERENCES "catalogo_municipios_inegi"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domicilios → catálogos INEGI
ALTER TABLE "domicilios"
    ADD CONSTRAINT "domicilios_colonia_inegi_id_fkey"
    FOREIGN KEY ("colonia_inegi_id") REFERENCES "catalogo_colonias_inegi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "domicilios"
    ADD CONSTRAINT "domicilios_localidad_inegi_id_fkey"
    FOREIGN KEY ("localidad_inegi_id") REFERENCES "catalogo_localidades_inegi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "domicilios"
    ADD CONSTRAINT "domicilios_municipio_inegi_id_fkey"
    FOREIGN KEY ("municipio_inegi_id") REFERENCES "catalogo_municipios_inegi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "domicilios"
    ADD CONSTRAINT "domicilios_estado_inegi_id_fkey"
    FOREIGN KEY ("estado_inegi_id") REFERENCES "catalogo_estados_inegi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Domicilios persona → personas + domicilios
ALTER TABLE "domicilios_persona"
    ADD CONSTRAINT "domicilios_persona_persona_id_fkey"
    FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "domicilios_persona"
    ADD CONSTRAINT "domicilios_persona_domicilio_id_fkey"
    FOREIGN KEY ("domicilio_id") REFERENCES "domicilios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Puntos servicio → domicilios + catálogos
ALTER TABLE "puntos_servicio"
    ADD CONSTRAINT "puntos_servicio_domicilio_id_fkey"
    FOREIGN KEY ("domicilio_id") REFERENCES "domicilios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "puntos_servicio"
    ADD CONSTRAINT "puntos_servicio_tipo_suministro_id_fkey"
    FOREIGN KEY ("tipo_suministro_id") REFERENCES "catalogo_tipos_suministro"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "puntos_servicio"
    ADD CONSTRAINT "puntos_servicio_estructura_tecnica_id_fkey"
    FOREIGN KEY ("estructura_tecnica_id") REFERENCES "catalogo_estructuras_tecnicas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "puntos_servicio"
    ADD CONSTRAINT "puntos_servicio_punto_servicio_padre_id_fkey"
    FOREIGN KEY ("punto_servicio_padre_id") REFERENCES "puntos_servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Procesos contratación → contratos + plantillas
ALTER TABLE "procesos_contratacion"
    ADD CONSTRAINT "procesos_contratacion_contrato_id_fkey"
    FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "procesos_contratacion"
    ADD CONSTRAINT "procesos_contratacion_plantilla_id_fkey"
    FOREIGN KEY ("plantilla_id") REFERENCES "plantillas_contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Hitos → procesos
ALTER TABLE "hitos_contratacion"
    ADD CONSTRAINT "hitos_contratacion_proceso_id_fkey"
    FOREIGN KEY ("proceso_id") REFERENCES "procesos_contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Conceptos cobro tipo contratación
ALTER TABLE "conceptos_cobro_tipo_contratacion"
    ADD CONSTRAINT "conceptos_cobro_tipo_contratacion_tipo_contratacion_id_fkey"
    FOREIGN KEY ("tipo_contratacion_id") REFERENCES "tipos_contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conceptos_cobro_tipo_contratacion"
    ADD CONSTRAINT "conceptos_cobro_tipo_contratacion_concepto_cobro_id_fkey"
    FOREIGN KEY ("concepto_cobro_id") REFERENCES "conceptos_cobro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Cláusulas tipo contratación
ALTER TABLE "clausulas_tipo_contratacion"
    ADD CONSTRAINT "clausulas_tipo_contratacion_tipo_contratacion_id_fkey"
    FOREIGN KEY ("tipo_contratacion_id") REFERENCES "tipos_contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "clausulas_tipo_contratacion"
    ADD CONSTRAINT "clausulas_tipo_contratacion_clausula_id_fkey"
    FOREIGN KEY ("clausula_id") REFERENCES "clausulas_contractuales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Documentos requeridos tipo contratación
ALTER TABLE "documentos_requeridos_tipo_contratacion"
    ADD CONSTRAINT "documentos_requeridos_tipo_contratacion_tipo_contratacion_id_f"
    FOREIGN KEY ("tipo_contratacion_id") REFERENCES "tipos_contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Correcciones tarifarias → tarifas
ALTER TABLE "correcciones_tarifarias"
    ADD CONSTRAINT "correcciones_tarifarias_tarifa_id_fkey"
    FOREIGN KEY ("tarifa_id") REFERENCES "tarifas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Ajustes tarifarios → contratos
ALTER TABLE "ajustes_tarifarios"
    ADD CONSTRAINT "ajustes_tarifarios_contrato_id_fkey"
    FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Contratos → nuevas relaciones
ALTER TABLE "contratos"
    ADD CONSTRAINT "contratos_punto_servicio_id_fkey"
    FOREIGN KEY ("punto_servicio_id") REFERENCES "puntos_servicio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contratos"
    ADD CONSTRAINT "contratos_domicilio_id_fkey"
    FOREIGN KEY ("domicilio_id") REFERENCES "domicilios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "contratos"
    ADD CONSTRAINT "contratos_tipo_contratacion_id_fkey"
    FOREIGN KEY ("tipo_contratacion_id") REFERENCES "tipos_contratacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Ordenes → tipo de corte
ALTER TABLE "ordenes"
    ADD CONSTRAINT "ordenes_subtipo_corte_id_fkey"
    FOREIGN KEY ("subtipo_corte_id") REFERENCES "catalogo_tipos_corte"("id") ON DELETE SET NULL ON UPDATE CASCADE;
