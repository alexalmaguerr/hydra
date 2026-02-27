-- AlterTable
ALTER TABLE "contratos" ADD COLUMN     "bloqueado_juridico" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "constancia_fiscal_url" TEXT,
ADD COLUMN     "razon_social" TEXT,
ADD COLUMN     "regimen_fiscal" TEXT;

-- AlterTable
ALTER TABLE "convenios" ADD COLUMN     "anticipo_pagado" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "checklist_interna" JSONB,
ADD COLUMN     "datos_convenio" JSONB,
ADD COLUMN     "monto_anticipo" DECIMAL(10,2),
ADD COLUMN     "porcentaje_anticipo" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "tramites" ADD COLUMN     "canal" TEXT DEFAULT 'presencial',
ADD COLUMN     "notificado_por" TEXT;

-- CreateTable
CREATE TABLE "seguimientos_tramite" (
    "id" TEXT NOT NULL,
    "tramite_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'nota',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_tramite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalogo_tramites" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo_firma" TEXT NOT NULL,
    "documentos_requeridos" JSONB NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_tramites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agora_tickets" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT,
    "tramite_id" TEXT,
    "queja_id" TEXT,
    "agora_ref" TEXT,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Abierto',
    "prioridad" TEXT NOT NULL DEFAULT 'Media',
    "creado_por" TEXT NOT NULL,
    "datos_envio" JSONB,
    "respuesta" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agora_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "seguimientos_tramite_tramite_id_idx" ON "seguimientos_tramite"("tramite_id");

-- CreateIndex
CREATE UNIQUE INDEX "catalogo_tramites_tipo_key" ON "catalogo_tramites"("tipo");

-- CreateIndex
CREATE INDEX "agora_tickets_contrato_id_idx" ON "agora_tickets"("contrato_id");

-- CreateIndex
CREATE INDEX "agora_tickets_estado_idx" ON "agora_tickets"("estado");

-- AddForeignKey
ALTER TABLE "seguimientos_tramite" ADD CONSTRAINT "seguimientos_tramite_tramite_id_fkey" FOREIGN KEY ("tramite_id") REFERENCES "tramites"("id") ON DELETE CASCADE ON UPDATE CASCADE;
