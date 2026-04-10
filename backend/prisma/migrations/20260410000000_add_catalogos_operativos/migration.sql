-- Migration: add_catalogos_operativos
-- Agrega catálogos operativos del sistema anterior: medidores, formas de pago,
-- oficinas, tipos de variable, sectores hidráulicos, clases de contrato, tipos de vía.
-- Amplía modelos existentes: Medidor, MedidorBodega, TipoContratacion, ConceptoCobro,
-- CatalogoCategoria, CatalogoTipoSuministro, ClausulaContractual, Pago, Tarifa.

-- ══════════════════════════════════════════════════════════════════════════════
-- NUEVAS TABLAS
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Catálogo: Marcas de Medidor ─────────────────────────────────────────────
CREATE TABLE "catalogo_marcas_medidor" (
    "id"         TEXT NOT NULL,
    "codigo"     TEXT NOT NULL,
    "nombre"     TEXT NOT NULL,
    "activo"     BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_marcas_medidor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_marcas_medidor_codigo_key" ON "catalogo_marcas_medidor"("codigo");

-- ─── Catálogo: Modelos de Medidor ────────────────────────────────────────────
CREATE TABLE "catalogo_modelos_medidor" (
    "id"         TEXT NOT NULL,
    "marca_id"   TEXT NOT NULL,
    "codigo"     TEXT NOT NULL,
    "nombre"     TEXT NOT NULL,
    "activo"     BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_modelos_medidor_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_modelos_medidor_codigo_key" ON "catalogo_modelos_medidor"("codigo");
CREATE INDEX "catalogo_modelos_medidor_marca_id_idx" ON "catalogo_modelos_medidor"("marca_id");
ALTER TABLE "catalogo_modelos_medidor"
    ADD CONSTRAINT "catalogo_modelos_medidor_marca_id_fkey"
        FOREIGN KEY ("marca_id") REFERENCES "catalogo_marcas_medidor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Catálogo: Calibres ──────────────────────────────────────────────────────
CREATE TABLE "catalogo_calibres" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "diametro_mm" DECIMAL(8,2),
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_calibres_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_calibres_codigo_key" ON "catalogo_calibres"("codigo");

-- ─── Catálogo: Emplazamientos ────────────────────────────────────────────────
CREATE TABLE "catalogo_emplazamientos" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_emplazamientos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_emplazamientos_codigo_key" ON "catalogo_emplazamientos"("codigo");

-- ─── Catálogo: Tipos de Contador ─────────────────────────────────────────────
CREATE TABLE "catalogo_tipos_contador" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_tipos_contador_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_contador_codigo_key" ON "catalogo_tipos_contador"("codigo");

-- ─── Catálogo: Formas de Pago ────────────────────────────────────────────────
CREATE TABLE "catalogo_formas_pago" (
    "id"                  TEXT NOT NULL,
    "codigo"              TEXT NOT NULL,
    "nombre"              TEXT NOT NULL,
    "tipo_recaudacion"    TEXT NOT NULL,
    "acepta_efectivo"     BOOLEAN NOT NULL DEFAULT false,
    "acepta_cheque"       BOOLEAN NOT NULL DEFAULT false,
    "acepta_tarjeta"      BOOLEAN NOT NULL DEFAULT false,
    "acepta_transf"       BOOLEAN NOT NULL DEFAULT false,
    "requiere_referencia" BOOLEAN NOT NULL DEFAULT false,
    "layout_archivo_id"   TEXT,
    "activo"              BOOLEAN NOT NULL DEFAULT true,
    "created_at"          TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"          TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_formas_pago_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_formas_pago_codigo_key" ON "catalogo_formas_pago"("codigo");

-- ─── Catálogo: Tipos de Oficina ──────────────────────────────────────────────
CREATE TABLE "catalogo_tipos_oficina" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_tipos_oficina_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_oficina_codigo_key" ON "catalogo_tipos_oficina"("codigo");

-- ─── Oficinas ────────────────────────────────────────────────────────────────
CREATE TABLE "oficinas" (
    "id"                TEXT NOT NULL,
    "codigo"            TEXT NOT NULL,
    "nombre"            TEXT NOT NULL,
    "administracion_id" TEXT,
    "tipo_oficina_id"   TEXT,
    "direccion"         TEXT,
    "horario"           TEXT,
    "activo"            BOOLEAN NOT NULL DEFAULT true,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "oficinas_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "oficinas_codigo_key" ON "oficinas"("codigo");
CREATE INDEX "oficinas_administracion_id_idx" ON "oficinas"("administracion_id");
CREATE INDEX "oficinas_tipo_oficina_id_idx" ON "oficinas"("tipo_oficina_id");
ALTER TABLE "oficinas"
    ADD CONSTRAINT "oficinas_administracion_id_fkey"
        FOREIGN KEY ("administracion_id") REFERENCES "administraciones"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "oficinas_tipo_oficina_id_fkey"
        FOREIGN KEY ("tipo_oficina_id") REFERENCES "catalogo_tipos_oficina"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Catálogo: Tipos de Variable ─────────────────────────────────────────────
CREATE TABLE "catalogo_tipos_variable" (
    "id"               TEXT NOT NULL,
    "codigo"           TEXT NOT NULL,
    "nombre"           TEXT NOT NULL,
    "tipo_dato"        TEXT NOT NULL,
    "valores_posibles" JSONB,
    "unidad"           TEXT,
    "activo"           BOOLEAN NOT NULL DEFAULT true,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_tipos_variable_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_variable_codigo_key" ON "catalogo_tipos_variable"("codigo");

-- ─── Variables por Tipo de Contratación ──────────────────────────────────────
CREATE TABLE "variables_tipo_contratacion" (
    "id"                    TEXT NOT NULL,
    "tipo_contratacion_id"  TEXT NOT NULL,
    "tipo_variable_id"      TEXT NOT NULL,
    "obligatorio"           BOOLEAN NOT NULL DEFAULT false,
    "valor_defecto"         TEXT,
    "orden"                 INTEGER NOT NULL DEFAULT 0,
    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "variables_tipo_contratacion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "variables_tipo_contratacion_tipo_contratacion_id_tipo_variable_id_key"
    ON "variables_tipo_contratacion"("tipo_contratacion_id", "tipo_variable_id");
ALTER TABLE "variables_tipo_contratacion"
    ADD CONSTRAINT "variables_tipo_contratacion_tipo_contratacion_id_fkey"
        FOREIGN KEY ("tipo_contratacion_id") REFERENCES "tipos_contratacion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "variables_tipo_contratacion_tipo_variable_id_fkey"
        FOREIGN KEY ("tipo_variable_id") REFERENCES "catalogo_tipos_variable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── Sectores Hidráulicos ────────────────────────────────────────────────────
CREATE TABLE "sectores_hidraulicos" (
    "id"                TEXT NOT NULL,
    "codigo"            TEXT NOT NULL,
    "nombre"            TEXT NOT NULL,
    "administracion_id" TEXT,
    "activo"            BOOLEAN NOT NULL DEFAULT true,
    "created_at"        TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"        TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sectores_hidraulicos_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sectores_hidraulicos_codigo_key" ON "sectores_hidraulicos"("codigo");
CREATE INDEX "sectores_hidraulicos_administracion_id_idx" ON "sectores_hidraulicos"("administracion_id");
ALTER TABLE "sectores_hidraulicos"
    ADD CONSTRAINT "sectores_hidraulicos_administracion_id_fkey"
        FOREIGN KEY ("administracion_id") REFERENCES "administraciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Catálogo: Clases de Contrato ────────────────────────────────────────────
CREATE TABLE "catalogo_clases_contrato" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_clases_contrato_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_clases_contrato_codigo_key" ON "catalogo_clases_contrato"("codigo");

-- ─── Catálogo: Tipos de Vía ─────────────────────────────────────────────────
CREATE TABLE "catalogo_tipos_via" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "abreviatura" TEXT,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "catalogo_tipos_via_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_via_codigo_key" ON "catalogo_tipos_via"("codigo");

-- ══════════════════════════════════════════════════════════════════════════════
-- AMPLIACIÓN DE TABLAS EXISTENTES
-- ══════════════════════════════════════════════════════════════════════════════

-- ─── Medidor: campos de catálogo ─────────────────────────────────────────────
ALTER TABLE "medidores"
    ADD COLUMN "marca_id"                    TEXT,
    ADD COLUMN "modelo_id"                   TEXT,
    ADD COLUMN "calibre_id"                  TEXT,
    ADD COLUMN "emplazamiento_id"            TEXT,
    ADD COLUMN "tipo_contador_id"            TEXT,
    ADD COLUMN "digitos"                     INTEGER,
    ADD COLUMN "tipo_esfera"                 TEXT,
    ADD COLUMN "tipo_telemetria"             TEXT,
    ADD COLUMN "fecha_instalacion"           TIMESTAMP(3),
    ADD COLUMN "fecha_ultima_verificacion"   TIMESTAMP(3);

CREATE INDEX "medidores_marca_id_idx"  ON "medidores"("marca_id");
CREATE INDEX "medidores_modelo_id_idx" ON "medidores"("modelo_id");
CREATE INDEX "medidores_calibre_id_idx" ON "medidores"("calibre_id");

ALTER TABLE "medidores"
    ADD CONSTRAINT "medidores_marca_id_fkey"
        FOREIGN KEY ("marca_id") REFERENCES "catalogo_marcas_medidor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "medidores_modelo_id_fkey"
        FOREIGN KEY ("modelo_id") REFERENCES "catalogo_modelos_medidor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "medidores_calibre_id_fkey"
        FOREIGN KEY ("calibre_id") REFERENCES "catalogo_calibres"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "medidores_emplazamiento_id_fkey"
        FOREIGN KEY ("emplazamiento_id") REFERENCES "catalogo_emplazamientos"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "medidores_tipo_contador_id_fkey"
        FOREIGN KEY ("tipo_contador_id") REFERENCES "catalogo_tipos_contador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── MedidorBodega: campos de catálogo ───────────────────────────────────────
ALTER TABLE "medidores_bodega"
    ADD COLUMN "marca_id"      TEXT,
    ADD COLUMN "modelo_id"     TEXT,
    ADD COLUMN "calibre_id"    TEXT,
    ADD COLUMN "digitos"       INTEGER,
    ADD COLUMN "fecha_ingreso" TIMESTAMP(3);

CREATE INDEX "medidores_bodega_marca_id_idx" ON "medidores_bodega"("marca_id");

ALTER TABLE "medidores_bodega"
    ADD CONSTRAINT "medidores_bodega_marca_id_fkey"
        FOREIGN KEY ("marca_id") REFERENCES "catalogo_marcas_medidor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "medidores_bodega_modelo_id_fkey"
        FOREIGN KEY ("modelo_id") REFERENCES "catalogo_modelos_medidor"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "medidores_bodega_calibre_id_fkey"
        FOREIGN KEY ("calibre_id") REFERENCES "catalogo_calibres"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── TipoContratacion: administración y clase de contrato ────────────────────
ALTER TABLE "tipos_contratacion"
    ADD COLUMN "administracion_id"   TEXT,
    ADD COLUMN "clase_contrato_id"   TEXT;

CREATE INDEX "tipos_contratacion_administracion_id_idx" ON "tipos_contratacion"("administracion_id");
CREATE INDEX "tipos_contratacion_clase_contrato_id_idx" ON "tipos_contratacion"("clase_contrato_id");

ALTER TABLE "tipos_contratacion"
    ADD CONSTRAINT "tipos_contratacion_administracion_id_fkey"
        FOREIGN KEY ("administracion_id") REFERENCES "administraciones"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "tipos_contratacion_clase_contrato_id_fkey"
        FOREIGN KEY ("clase_contrato_id") REFERENCES "catalogo_clases_contrato"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── ConceptoCobro: origen ───────────────────────────────────────────────────
ALTER TABLE "conceptos_cobro"
    ADD COLUMN "origen" TEXT NOT NULL DEFAULT 'CONTRATACION';

CREATE INDEX "conceptos_cobro_origen_idx" ON "conceptos_cobro"("origen");

-- ─── CatalogoCategoria: flags operativos ─────────────────────────────────────
ALTER TABLE "catalogo_categorias"
    ADD COLUMN "permite_int_fraccionamiento" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "formato_recibo"              TEXT;

-- ─── CatalogoTipoSuministro: configuración ──────────────────────────────────
ALTER TABLE "catalogo_tipos_suministro"
    ADD COLUMN "periodo_lectura"   TEXT,
    ADD COLUMN "requiere_medidor"  BOOLEAN NOT NULL DEFAULT true;

-- ─── ClausulaContractual: aplica a punto de servicio ─────────────────────────
ALTER TABLE "clausulas_contractuales"
    ADD COLUMN "aplica_punto_servicio" BOOLEAN NOT NULL DEFAULT false;

-- ─── Pago: forma de pago normalizada y oficina ──────────────────────────────
ALTER TABLE "pagos"
    ADD COLUMN "forma_pago_id" TEXT,
    ADD COLUMN "oficina"       TEXT;

CREATE INDEX "pagos_forma_pago_id_idx" ON "pagos"("forma_pago_id");

ALTER TABLE "pagos"
    ADD CONSTRAINT "pagos_forma_pago_id_fkey"
        FOREIGN KEY ("forma_pago_id") REFERENCES "catalogo_formas_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Tarifa: administración y tipo contratación ─────────────────────────────
ALTER TABLE "tarifas"
    ADD COLUMN "administracion_id"       TEXT,
    ADD COLUMN "tipo_contratacion_codigo" TEXT;

CREATE INDEX "tarifas_administracion_id_idx" ON "tarifas"("administracion_id");
CREATE INDEX "tarifas_tipo_contratacion_codigo_idx" ON "tarifas"("tipo_contratacion_codigo");
