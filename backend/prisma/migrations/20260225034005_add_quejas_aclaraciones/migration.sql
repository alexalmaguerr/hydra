-- CreateTable
CREATE TABLE "quejas_aclaraciones" (
    "id" TEXT NOT NULL,
    "contrato_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Registrada',
    "atendido_por" TEXT,
    "categoria" TEXT,
    "prioridad" TEXT NOT NULL DEFAULT 'Media',
    "canal" TEXT NOT NULL DEFAULT 'Ventanilla',
    "area_asignada" TEXT NOT NULL DEFAULT 'Atención a clientes',
    "enlace_externo" TEXT,
    "motivo_cierre" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quejas_aclaraciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seguimientos_queja" (
    "id" TEXT NOT NULL,
    "queja_id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nota" TEXT NOT NULL,
    "usuario" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seguimientos_queja_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quejas_aclaraciones_contrato_id_idx" ON "quejas_aclaraciones"("contrato_id");

-- CreateIndex
CREATE INDEX "seguimientos_queja_queja_id_idx" ON "seguimientos_queja"("queja_id");

-- AddForeignKey
ALTER TABLE "seguimientos_queja" ADD CONSTRAINT "seguimientos_queja_queja_id_fkey" FOREIGN KEY ("queja_id") REFERENCES "quejas_aclaraciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
