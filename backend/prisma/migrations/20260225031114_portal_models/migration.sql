-- AlterTable
ALTER TABLE "users" ADD COLUMN     "contrato_ids" TEXT[];

-- CreateTable
CREATE TABLE "consumos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "m3" DECIMAL(10,2) NOT NULL,
    "tipo" TEXT NOT NULL,
    "confirmado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consumos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timbrados" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "consumo_id" TEXT,
    "uuid" TEXT NOT NULL DEFAULT '',
    "estado" TEXT NOT NULL,
    "periodo" TEXT NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "iva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "fecha_emision" TEXT NOT NULL,
    "fecha_vencimiento" TEXT NOT NULL,
    "error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timbrados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recibos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "timbrado_id" TEXT NOT NULL,
    "saldo_vigente" DECIMAL(10,2) NOT NULL,
    "saldo_vencido" DECIMAL(10,2) NOT NULL,
    "fecha_vencimiento" TEXT NOT NULL,
    "parcialidades" INTEGER NOT NULL DEFAULT 1,
    "impreso" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recibos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagos" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "recibo_id" TEXT,
    "timbrado_id" TEXT,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "origen" TEXT NOT NULL DEFAULT 'nativo',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pagos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "consumos_contrato_id_idx" ON "consumos"("contrato_id");

-- CreateIndex
CREATE UNIQUE INDEX "timbrados_consumo_id_key" ON "timbrados"("consumo_id");

-- CreateIndex
CREATE INDEX "timbrados_contrato_id_idx" ON "timbrados"("contrato_id");

-- CreateIndex
CREATE INDEX "recibos_contrato_id_idx" ON "recibos"("contrato_id");

-- CreateIndex
CREATE INDEX "recibos_timbrado_id_idx" ON "recibos"("timbrado_id");

-- CreateIndex
CREATE INDEX "pagos_contrato_id_idx" ON "pagos"("contrato_id");

-- CreateIndex
CREATE INDEX "pagos_recibo_id_idx" ON "pagos"("recibo_id");

-- AddForeignKey
ALTER TABLE "consumos" ADD CONSTRAINT "consumos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timbrados" ADD CONSTRAINT "timbrados_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timbrados" ADD CONSTRAINT "timbrados_consumo_id_fkey" FOREIGN KEY ("consumo_id") REFERENCES "consumos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recibos" ADD CONSTRAINT "recibos_timbrado_id_fkey" FOREIGN KEY ("timbrado_id") REFERENCES "timbrados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_recibo_id_fkey" FOREIGN KEY ("recibo_id") REFERENCES "recibos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagos" ADD CONSTRAINT "pagos_timbrado_id_fkey" FOREIGN KEY ("timbrado_id") REFERENCES "timbrados"("id") ON DELETE SET NULL ON UPDATE CASCADE;
