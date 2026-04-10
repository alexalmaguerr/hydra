-- AlterTable: add snapshot of contract text captured at creation time
ALTER TABLE "contratos" ADD COLUMN "texto_contrato_snapshot" TEXT;
