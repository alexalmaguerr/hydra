-- Catálogo SAT (CFDI): c_RegimenFiscal, c_UsoCFDI (Anexo 20)
-- Fuente de verdad de datos: semilla alineada a `Catálogos del SAT.xlsx` (sistema anterior)

CREATE TYPE "CatalogoSatTipo" AS ENUM ('REGIMEN_FISCAL', 'USO_CFDI');

CREATE TABLE "catalogo_sat" (
    "id" TEXT NOT NULL,
    "tipo" "CatalogoSatTipo" NOT NULL,
    "clave" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "aplica_fisica" BOOLEAN NOT NULL DEFAULT false,
    "aplica_moral" BOOLEAN NOT NULL DEFAULT false,
    "vigencia_inicio" TIMESTAMP(3),
    "vigencia_fin" TIMESTAMP(3),
    "regimenes_receptor_permitidos" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalogo_sat_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "catalogo_sat_tipo_clave_key" ON "catalogo_sat"("tipo", "clave");

CREATE INDEX "catalogo_sat_tipo_activo_idx" ON "catalogo_sat"("tipo", "activo");
