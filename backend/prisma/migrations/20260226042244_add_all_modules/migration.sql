-- AlterTable
ALTER TABLE "pagos" ADD COLUMN     "convenio_id" TEXT;

-- CreateTable
CREATE TABLE "contratistas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturistas" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contratista_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecturistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_incidencias" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "es_averia" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_incidencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lotes_lecturas" (
    "id" TEXT NOT NULL,
    "zona_id" TEXT,
    "ruta_id" TEXT,
    "periodo" TEXT NOT NULL,
    "tipo_lote" TEXT NOT NULL,
    "archivo_nombre" TEXT NOT NULL,
    "archivo_hash" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "total_registros" INTEGER NOT NULL DEFAULT 0,
    "total_validos" INTEGER NOT NULL DEFAULT 0,
    "total_con_error" INTEGER NOT NULL DEFAULT 0,
    "errores" JSONB,
    "cargado_por" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lotes_lecturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecturas" (
    "id" TEXT NOT NULL,
    "lote_id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "lecturista_id" TEXT,
    "incidencia_id" TEXT,
    "periodo" TEXT NOT NULL,
    "lectura_actual" INTEGER,
    "lectura_anterior" INTEGER,
    "consumo_real" INTEGER,
    "consumo_estimado" INTEGER,
    "es_estimada" BOOLEAN NOT NULL DEFAULT false,
    "lectura_min_zona" INTEGER,
    "lectura_max_zona" INTEGER,
    "url_foto" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "motivo_invalidacion" TEXT,
    "datos_raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecturas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_lecturistas" (
    "id" TEXT NOT NULL,
    "lote_id" TEXT,
    "contrato_id" TEXT,
    "mensaje" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'comentario',
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensajes_lecturistas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos_externos" (
    "id" TEXT NOT NULL,
    "recaudador" TEXT NOT NULL,
    "archivo_nombre" TEXT NOT NULL,
    "referencia" TEXT,
    "contrato_raw" TEXT,
    "contrato_id" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_pago_real" TIMESTAMP(3) NOT NULL,
    "forma_pago" TEXT,
    "canal" TEXT,
    "oficina" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'pendiente_conciliar',
    "motivo_rechazo" TEXT,
    "recibo_id" TEXT,
    "datos_raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_externos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordenes" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Pendiente',
    "prioridad" TEXT NOT NULL DEFAULT 'Normal',
    "fecha_solicitud" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_programada" TIMESTAMP(3),
    "fecha_ejecucion" TIMESTAMP(3),
    "operador_id" TEXT,
    "notas" TEXT,
    "datos_campo" JSONB,
    "external_ref" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ordenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos_orden" (
    "id" TEXT NOT NULL,
    "orden_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado_anterior" TEXT,
    "estado_nuevo" TEXT,
    "nota" TEXT,
    "usuario" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_orden_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_contables" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo_transaccion" TEXT NOT NULL,
    "indicador" TEXT NOT NULL,
    "cuenta_contable" TEXT NOT NULL,
    "descripcion_sap" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "polizas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'MXN',
    "estado" TEXT NOT NULL DEFAULT 'generada',
    "referencia_id" TEXT,
    "error_detalle" TEXT,
    "archivo_idoc" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "polizas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_poliza" (
    "id" TEXT NOT NULL,
    "poliza_id" TEXT NOT NULL,
    "posicion" INTEGER NOT NULL,
    "indicador" TEXT NOT NULL,
    "monto" DECIMAL(12,2) NOT NULL,
    "cuenta_contable" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "texto" TEXT,
    "centro_coste" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lineas_poliza_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs_sincronizacion" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'GIS',
    "estado" TEXT NOT NULL DEFAULT 'en_progreso',
    "total_cambios" INTEGER,
    "total_exportados" INTEGER,
    "total_errores" INTEGER,
    "detalles" JSONB,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logs_sincronizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cambios_gis" (
    "id" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "campos_modificados" JSONB,
    "datos_snapshot" JSONB,
    "exportado" BOOLEAN NOT NULL DEFAULT false,
    "log_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cambios_gis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'Fisica',
    "email" TEXT,
    "telefono" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles_persona_contrato" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_desde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_hasta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_persona_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_contratos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "campo" TEXT NOT NULL,
    "valor_anterior" TEXT,
    "valor_nuevo" TEXT,
    "motivo" TEXT,
    "usuario" TEXT,
    "tramite_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tramites" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "contrato_id" TEXT,
    "persona_id" TEXT,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Iniciado',
    "descripcion" TEXT,
    "datos_adicionales" JSONB,
    "aprobado_por" TEXT,
    "fecha_aprobacion" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documentos" (
    "id" TEXT NOT NULL,
    "tramite_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT,
    "verificado" BOOLEAN NOT NULL DEFAULT false,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sesiones_caja" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cierre" TIMESTAMP(3),
    "monto_inicial" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_cobrado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_efectivo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_transf" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_tarjeta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total_anticipo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'Abierta',
    "resumen" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sesiones_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anticipos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "sesion_id" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "aplicado" BOOLEAN NOT NULL DEFAULT false,
    "pago_id" TEXT,
    "concepto" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anticipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "convenios" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Parcialidades',
    "num_parcialidades" INTEGER NOT NULL,
    "monto_parcialidad" DECIMAL(10,2) NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "monto_pagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "facturas" JSONB NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activo',
    "parcialidades_restantes" INTEGER NOT NULL DEFAULT 0,
    "saldo_a_favor" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "convenios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mensajes_recibo" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "contrato_id" TEXT,
    "mensaje" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "vigencia_desde" TIMESTAMP(3),
    "vigencia_hasta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mensajes_recibo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "log_procesos" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "sub_tipo" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'Iniciado',
    "inicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fin" TIMESTAMP(3),
    "duracion_ms" INTEGER,
    "registros" INTEGER NOT NULL DEFAULT 0,
    "errores" INTEGER NOT NULL DEFAULT 0,
    "advertencias" INTEGER NOT NULL DEFAULT 0,
    "detalle" JSONB,
    "error_msg" TEXT,
    "usuario_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "log_procesos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conciliacion_reportes" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "ejecutado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_sistema_a" INTEGER NOT NULL,
    "total_sistema_b" INTEGER NOT NULL,
    "coincidencias" INTEGER NOT NULL,
    "diferencias" INTEGER NOT NULL,
    "monto_sistema_a" DECIMAL(14,2),
    "monto_sistema_b" DECIMAL(14,2),
    "monto_diferencia" DECIMAL(14,2),
    "detalles" JSONB,
    "estado" TEXT NOT NULL DEFAULT 'Revisión',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conciliacion_reportes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lecturistas_codigo_key" ON "lecturistas"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_incidencias_codigo_key" ON "catalogo_incidencias"("codigo");

-- CreateIndex
CREATE INDEX "lotes_lecturas_zona_id_idx" ON "lotes_lecturas"("zona_id");

-- CreateIndex
CREATE INDEX "lotes_lecturas_ruta_id_idx" ON "lotes_lecturas"("ruta_id");

-- CreateIndex
CREATE INDEX "lotes_lecturas_periodo_idx" ON "lotes_lecturas"("periodo");

-- CreateIndex
CREATE INDEX "lecturas_lote_id_idx" ON "lecturas"("lote_id");

-- CreateIndex
CREATE INDEX "lecturas_contrato_id_idx" ON "lecturas"("contrato_id");

-- CreateIndex
CREATE INDEX "lecturas_periodo_idx" ON "lecturas"("periodo");

-- CreateIndex
CREATE INDEX "lecturas_estado_idx" ON "lecturas"("estado");

-- CreateIndex
CREATE INDEX "mensajes_lecturistas_lote_id_idx" ON "mensajes_lecturistas"("lote_id");

-- CreateIndex
CREATE INDEX "mensajes_lecturistas_contrato_id_idx" ON "mensajes_lecturistas"("contrato_id");

-- CreateIndex
CREATE INDEX "pagos_externos_contrato_id_idx" ON "pagos_externos"("contrato_id");

-- CreateIndex
CREATE INDEX "pagos_externos_estado_idx" ON "pagos_externos"("estado");

-- CreateIndex
CREATE INDEX "pagos_externos_recaudador_idx" ON "pagos_externos"("recaudador");

-- CreateIndex
CREATE INDEX "pagos_externos_fecha_pago_real_idx" ON "pagos_externos"("fecha_pago_real");

-- CreateIndex
CREATE INDEX "ordenes_contrato_id_idx" ON "ordenes"("contrato_id");

-- CreateIndex
CREATE INDEX "ordenes_estado_idx" ON "ordenes"("estado");

-- CreateIndex
CREATE INDEX "ordenes_tipo_idx" ON "ordenes"("tipo");

-- CreateIndex
CREATE INDEX "ordenes_fecha_programada_idx" ON "ordenes"("fecha_programada");

-- CreateIndex
CREATE INDEX "seguimientos_orden_orden_id_idx" ON "seguimientos_orden"("orden_id");

-- CreateIndex
CREATE INDEX "reglas_contables_tipo_transaccion_idx" ON "reglas_contables"("tipo_transaccion");

-- CreateIndex
CREATE UNIQUE INDEX "polizas_numero_key" ON "polizas"("numero");

-- CreateIndex
CREATE INDEX "polizas_periodo_idx" ON "polizas"("periodo");

-- CreateIndex
CREATE INDEX "polizas_tipo_idx" ON "polizas"("tipo");

-- CreateIndex
CREATE INDEX "polizas_estado_idx" ON "polizas"("estado");

-- CreateIndex
CREATE INDEX "lineas_poliza_poliza_id_idx" ON "lineas_poliza"("poliza_id");

-- CreateIndex
CREATE INDEX "logs_sincronizacion_estado_idx" ON "logs_sincronizacion"("estado");

-- CreateIndex
CREATE INDEX "logs_sincronizacion_tipo_idx" ON "logs_sincronizacion"("tipo");

-- CreateIndex
CREATE INDEX "cambios_gis_entidad_entidad_id_idx" ON "cambios_gis"("entidad", "entidad_id");

-- CreateIndex
CREATE INDEX "cambios_gis_exportado_idx" ON "cambios_gis"("exportado");

-- CreateIndex
CREATE INDEX "cambios_gis_created_at_idx" ON "cambios_gis"("created_at");

-- CreateIndex
CREATE INDEX "personas_rfc_idx" ON "personas"("rfc");

-- CreateIndex
CREATE INDEX "personas_nombre_idx" ON "personas"("nombre");

-- CreateIndex
CREATE INDEX "roles_persona_contrato_contrato_id_idx" ON "roles_persona_contrato"("contrato_id");

-- CreateIndex
CREATE INDEX "roles_persona_contrato_persona_id_idx" ON "roles_persona_contrato"("persona_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_persona_contrato_persona_id_contrato_id_rol_key" ON "roles_persona_contrato"("persona_id", "contrato_id", "rol");

-- CreateIndex
CREATE INDEX "historico_contratos_contrato_id_idx" ON "historico_contratos"("contrato_id");

-- CreateIndex
CREATE INDEX "historico_contratos_campo_idx" ON "historico_contratos"("campo");

-- CreateIndex
CREATE UNIQUE INDEX "tramites_folio_key" ON "tramites"("folio");

-- CreateIndex
CREATE INDEX "tramites_contrato_id_idx" ON "tramites"("contrato_id");

-- CreateIndex
CREATE INDEX "tramites_tipo_idx" ON "tramites"("tipo");

-- CreateIndex
CREATE INDEX "tramites_estado_idx" ON "tramites"("estado");

-- CreateIndex
CREATE INDEX "documentos_tramite_id_idx" ON "documentos"("tramite_id");

-- CreateIndex
CREATE INDEX "sesiones_caja_usuario_id_idx" ON "sesiones_caja"("usuario_id");

-- CreateIndex
CREATE INDEX "sesiones_caja_estado_idx" ON "sesiones_caja"("estado");

-- CreateIndex
CREATE INDEX "anticipos_contrato_id_idx" ON "anticipos"("contrato_id");

-- CreateIndex
CREATE INDEX "anticipos_aplicado_idx" ON "anticipos"("aplicado");

-- CreateIndex
CREATE INDEX "convenios_contrato_id_idx" ON "convenios"("contrato_id");

-- CreateIndex
CREATE INDEX "convenios_estado_idx" ON "convenios"("estado");

-- CreateIndex
CREATE INDEX "mensajes_recibo_tipo_idx" ON "mensajes_recibo"("tipo");

-- CreateIndex
CREATE INDEX "mensajes_recibo_contrato_id_idx" ON "mensajes_recibo"("contrato_id");

-- CreateIndex
CREATE INDEX "log_procesos_tipo_idx" ON "log_procesos"("tipo");

-- CreateIndex
CREATE INDEX "log_procesos_estado_idx" ON "log_procesos"("estado");

-- CreateIndex
CREATE INDEX "log_procesos_inicio_idx" ON "log_procesos"("inicio");

-- CreateIndex
CREATE INDEX "conciliacion_reportes_tipo_idx" ON "conciliacion_reportes"("tipo");

-- CreateIndex
CREATE INDEX "conciliacion_reportes_periodo_idx" ON "conciliacion_reportes"("periodo");

-- CreateIndex
CREATE INDEX "pagos_convenio_id_idx" ON "pagos"("convenio_id");

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_convenio_id_fkey" FOREIGN KEY ("convenio_id") REFERENCES "convenios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturistas" ADD CONSTRAINT "lecturistas_contratista_id_fkey" FOREIGN KEY ("contratista_id") REFERENCES "contratistas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_lecturas" ADD CONSTRAINT "lotes_lecturas_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lotes_lecturas" ADD CONSTRAINT "lotes_lecturas_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas" ADD CONSTRAINT "lecturas_lote_id_fkey" FOREIGN KEY ("lote_id") REFERENCES "lotes_lecturas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas" ADD CONSTRAINT "lecturas_lecturista_id_fkey" FOREIGN KEY ("lecturista_id") REFERENCES "lecturistas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecturas" ADD CONSTRAINT "lecturas_incidencia_id_fkey" FOREIGN KEY ("incidencia_id") REFERENCES "catalogo_incidencias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seguimientos_orden" ADD CONSTRAINT "seguimientos_orden_orden_id_fkey" FOREIGN KEY ("orden_id") REFERENCES "ordenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_poliza" ADD CONSTRAINT "lineas_poliza_poliza_id_fkey" FOREIGN KEY ("poliza_id") REFERENCES "polizas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cambios_gis" ADD CONSTRAINT "cambios_gis_log_id_fkey" FOREIGN KEY ("log_id") REFERENCES "logs_sincronizacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_persona_contrato" ADD CONSTRAINT "roles_persona_contrato_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "roles_persona_contrato" ADD CONSTRAINT "roles_persona_contrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_contratos" ADD CONSTRAINT "historico_contratos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_contratos" ADD CONSTRAINT "historico_contratos_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tramites" ADD CONSTRAINT "tramites_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documentos" ADD CONSTRAINT "documentos_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anticipos" ADD CONSTRAINT "anticipos_sesion_id_fkey" FOREIGN KEY ("sesion_id") REFERENCES "sesiones_caja"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anticipos" ADD CONSTRAINT "anticipos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "convenios" ADD CONSTRAINT "convenios_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
