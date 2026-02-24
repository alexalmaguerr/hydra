-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'OPERADOR', 'LECTURISTA', 'ATENCION_CLIENTES', 'CLIENTE');

-- DropForeignKey
ALTER TABLE "contratos" DROP CONSTRAINT "contratos_medidor_id_fkey";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'OPERADOR',
ALTER COLUMN "administracion_ids" DROP DEFAULT,
ALTER COLUMN "zona_ids" DROP DEFAULT;
