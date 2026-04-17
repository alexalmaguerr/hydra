-- CreateTable solicitudes
CREATE TABLE "solicitudes" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "prop_tipo_persona" TEXT NOT NULL DEFAULT 'fisica',
    "prop_nombre_completo" TEXT NOT NULL DEFAULT '',
    "prop_rfc" TEXT,
    "prop_correo" TEXT,
    "prop_telefono" TEXT,
    "predio_resumen" TEXT NOT NULL DEFAULT '',
    "clave_catastral" TEXT,
    "admin_id" TEXT,
    "tipo_contratacion_id" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'inspeccion_pendiente',
    "form_data" JSONB NOT NULL DEFAULT '{}',
    "contrato_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitudes_pkey" PRIMARY KEY ("id")
);

-- CreateTable solicitud_inspecciones
CREATE TABLE "solicitud_inspecciones" (
    "id" TEXT NOT NULL,
    "solicitud_id" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'en_proceso',
    "inspector" TEXT,
    "fecha_inspeccion" TEXT,
    "material_calle" TEXT,
    "material_banqueta" TEXT,
    "metros_ruptura_calle" TEXT,
    "metros_ruptura_banqueta" TEXT,
    "existe_red" TEXT,
    "distancia_red" TEXT,
    "presion_red" TEXT,
    "tipo_material_red" TEXT,
    "profundidad_red" TEXT,
    "diametro_toma" TEXT,
    "toma_existente" TEXT,
    "diametro_toma_existente" TEXT,
    "estado_toma_existente" TEXT,
    "medidor_existente" TEXT,
    "num_medidor_existente" TEXT,
    "observaciones" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solicitud_inspecciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "solicitudes_folio_key" ON "solicitudes"("folio");
CREATE UNIQUE INDEX "solicitud_inspecciones_solicitud_id_key" ON "solicitud_inspecciones"("solicitud_id");
CREATE INDEX "solicitudes_estado_idx" ON "solicitudes"("estado");
CREATE INDEX "solicitudes_contrato_id_idx" ON "solicitudes"("contrato_id");

-- AddForeignKey
ALTER TABLE "solicitud_inspecciones" ADD CONSTRAINT "solicitud_inspecciones_solicitud_id_fkey"
    FOREIGN KEY ("solicitud_id") REFERENCES "solicitudes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
