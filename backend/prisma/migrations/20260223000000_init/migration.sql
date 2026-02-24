-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "administraciones" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "administraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" TEXT NOT NULL,
    "administracion_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distritos" (
    "id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "distritos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "factibilidades" (
    "id" TEXT NOT NULL,
    "predio" TEXT NOT NULL,
    "solicitante" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "notas" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "factibilidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construcciones" (
    "id" TEXT NOT NULL,
    "factibilidad_id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "construcciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tomas" (
    "id" TEXT NOT NULL,
    "construccion_id" TEXT NOT NULL,
    "ubicacion" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tomas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contratos" (
    "id" TEXT NOT NULL,
    "toma_id" TEXT,
    "tipo_contrato" TEXT NOT NULL,
    "tipo_servicio" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rfc" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "contacto" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "fecha" TEXT NOT NULL,
    "medidor_id" TEXT,
    "ruta_id" TEXT,
    "zona_id" TEXT,
    "domiciliado" BOOLEAN NOT NULL DEFAULT false,
    "fecha_reconexion_prevista" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "costos_contrato" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "periodo" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "costos_contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medidores" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "cobro_diferido" BOOLEAN NOT NULL DEFAULT false,
    "lectura_inicial" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medidores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medidores_bodega" (
    "id" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "zona_id" TEXT,
    "estado" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medidores_bodega_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rutas" (
    "id" TEXT NOT NULL,
    "zona_id" TEXT NOT NULL,
    "distrito_id" TEXT,
    "sector" TEXT NOT NULL,
    "libreta" TEXT NOT NULL,
    "lecturista" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rutas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "zonas_administracion_id_idx" ON "zonas"("administracion_id");

-- CreateIndex
CREATE INDEX "distritos_zona_id_idx" ON "distritos"("zona_id");

-- CreateIndex
CREATE INDEX "construcciones_factibilidad_id_idx" ON "construcciones"("factibilidad_id");

-- CreateIndex
CREATE INDEX "tomas_construccion_id_idx" ON "tomas"("construccion_id");

-- CreateIndex
CREATE INDEX "contratos_toma_id_idx" ON "contratos"("toma_id");

-- CreateIndex
CREATE INDEX "contratos_ruta_id_idx" ON "contratos"("ruta_id");

-- CreateIndex
CREATE INDEX "contratos_zona_id_idx" ON "contratos"("zona_id");

-- CreateIndex
CREATE INDEX "contratos_medidor_id_idx" ON "contratos"("medidor_id");

-- CreateIndex
CREATE INDEX "costos_contrato_contrato_id_idx" ON "costos_contrato"("contrato_id");

-- CreateIndex
CREATE UNIQUE INDEX "medidores_contrato_id_key" ON "medidores"("contrato_id");

-- CreateIndex
CREATE INDEX "medidores_contrato_id_idx" ON "medidores"("contrato_id");

-- CreateIndex
CREATE INDEX "medidores_bodega_zona_id_idx" ON "medidores_bodega"("zona_id");

-- CreateIndex
CREATE INDEX "rutas_zona_id_idx" ON "rutas"("zona_id");

-- CreateIndex
CREATE INDEX "rutas_distrito_id_idx" ON "rutas"("distrito_id");

-- AddForeignKey
ALTER TABLE "zonas" ADD CONSTRAINT "zonas_administracion_id_fkey" FOREIGN KEY ("administracion_id") REFERENCES "administraciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distritos" ADD CONSTRAINT "distritos_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construcciones" ADD CONSTRAINT "construcciones_factibilidad_id_fkey" FOREIGN KEY ("factibilidad_id") REFERENCES "factibilidades"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tomas" ADD CONSTRAINT "tomas_construccion_id_fkey" FOREIGN KEY ("construccion_id") REFERENCES "construcciones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_toma_id_fkey" FOREIGN KEY ("toma_id") REFERENCES "tomas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_ruta_id_fkey" FOREIGN KEY ("ruta_id") REFERENCES "rutas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "costos_contrato" ADD CONSTRAINT "costos_contrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medidores" ADD CONSTRAINT "medidores_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos" ADD CONSTRAINT "contratos_medidor_id_fkey" FOREIGN KEY ("medidor_id") REFERENCES "medidores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medidores_bodega" ADD CONSTRAINT "medidores_bodega_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_zona_id_fkey" FOREIGN KEY ("zona_id") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rutas" ADD CONSTRAINT "rutas_distrito_id_fkey" FOREIGN KEY ("distrito_id") REFERENCES "distritos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

