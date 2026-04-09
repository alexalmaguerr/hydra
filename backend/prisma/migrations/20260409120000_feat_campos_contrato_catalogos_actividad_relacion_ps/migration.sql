-- Migration: feat_campos_contrato_catalogos_actividad_relacion_ps
-- Agrega campos faltantes al Contrato (P1), configuración a TipoContratacion (P1/P6),
-- catálogos de actividad, categoría y tipo de relación padre-hijo PS (P10).

-- ─── Catálogo: Grupo de Actividad ────────────────────────────────────────────
CREATE TABLE "catalogo_grupos_actividad" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalogo_grupos_actividad_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_grupos_actividad_codigo_key" ON "catalogo_grupos_actividad"("codigo");

-- ─── Catálogo: Actividad ─────────────────────────────────────────────────────
CREATE TABLE "catalogo_actividades" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "grupo_id"    TEXT,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalogo_actividades_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_actividades_codigo_key" ON "catalogo_actividades"("codigo");
CREATE INDEX "catalogo_actividades_grupo_id_idx" ON "catalogo_actividades"("grupo_id");
ALTER TABLE "catalogo_actividades"
    ADD CONSTRAINT "catalogo_actividades_grupo_id_fkey"
        FOREIGN KEY ("grupo_id") REFERENCES "catalogo_grupos_actividad"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Catálogo: Categoría de Contrato ─────────────────────────────────────────
CREATE TABLE "catalogo_categorias" (
    "id"          TEXT NOT NULL,
    "codigo"      TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "activo"      BOOLEAN NOT NULL DEFAULT true,
    "created_at"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalogo_categorias_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_categorias_codigo_key" ON "catalogo_categorias"("codigo");

-- ─── Catálogo: Tipo de Relación Padre-Hijo PS (P10) ──────────────────────────
CREATE TABLE "catalogo_tipos_relacion_ps" (
    "id"              TEXT NOT NULL,
    "codigo"          TEXT NOT NULL,
    "descripcion"     TEXT NOT NULL,
    "metodo"          TEXT NOT NULL,
    "reparte_consumo" BOOLEAN NOT NULL DEFAULT false,
    "activo"          BOOLEAN NOT NULL DEFAULT true,
    "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "catalogo_tipos_relacion_ps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "catalogo_tipos_relacion_ps_codigo_key" ON "catalogo_tipos_relacion_ps"("codigo");

-- ─── Contrato: campos faltantes (P1) ─────────────────────────────────────────
ALTER TABLE "contratos"
    ADD COLUMN "fecha_baja"                     TEXT,
    ADD COLUMN "actividad_id"                   TEXT,
    ADD COLUMN "categoria_id"                   TEXT,
    ADD COLUMN "referencia_contrato_anterior"   TEXT,
    ADD COLUMN "observaciones"                  TEXT,
    ADD COLUMN "tipo_envio_factura"             TEXT,
    ADD COLUMN "indicador_emision_recibo"       BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "indicador_exentar_facturacion"  BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "indicador_contacto_correo"      BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "ciclo_facturacion"              TEXT,
    ADD COLUMN "superficie_predio"              DECIMAL(10,2),
    ADD COLUMN "superficie_construida"          DECIMAL(10,2),
    ADD COLUMN "meses_adeudo"                   INTEGER,
    ADD COLUMN "unidades_servidas"              INTEGER,
    ADD COLUMN "personas_habitan_vivienda"      INTEGER;

CREATE INDEX "contratos_actividad_id_idx"  ON "contratos"("actividad_id");
CREATE INDEX "contratos_categoria_id_idx"  ON "contratos"("categoria_id");

ALTER TABLE "contratos"
    ADD CONSTRAINT "contratos_actividad_id_fkey"
        FOREIGN KEY ("actividad_id") REFERENCES "catalogo_actividades"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "contratos_categoria_id_fkey"
        FOREIGN KEY ("categoria_id") REFERENCES "catalogo_categorias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── TipoContratacion: configuración del proceso (P1, P6) ────────────────────
ALTER TABLE "tipos_contratacion"
    ADD COLUMN "clase_proceso"               TEXT,
    ADD COLUMN "es_contrato_formal"          BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "requiere_solicitud_previa"   BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "dias_caducidad_solicitud"    INTEGER,
    ADD COLUMN "organismo_aprobacion"        TEXT,
    ADD COLUMN "dias_plazo_aprobacion"       INTEGER,
    ADD COLUMN "periodicidades_permitidas"   TEXT,
    ADD COLUMN "tipos_cliente_permitidos"    TEXT;

-- ─── PuntoServicio: tipo de relación padre-hijo (P10) ────────────────────────
ALTER TABLE "puntos_servicio"
    ADD COLUMN "tipo_relacion_padre_id" TEXT;

CREATE INDEX "puntos_servicio_tipo_relacion_padre_id_idx" ON "puntos_servicio"("tipo_relacion_padre_id");
ALTER TABLE "puntos_servicio"
    ADD CONSTRAINT "puntos_servicio_tipo_relacion_padre_id_fkey"
        FOREIGN KEY ("tipo_relacion_padre_id") REFERENCES "catalogo_tipos_relacion_ps"("id") ON DELETE SET NULL ON UPDATE CASCADE;
