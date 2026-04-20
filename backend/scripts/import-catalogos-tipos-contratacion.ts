/**
 * Carga manual: administraciones + tipos de contratación desde el Excel SIGE.
 * Uso: npm run import:catalogos-tipos -- [ruta-opcional-al.xlsx]
 */
import { PrismaClient } from '@prisma/client';
import {
  importCatalogosTiposContratacion,
  linkHydraClausulasToAllTipos,
} from '../prisma/catalogos-tipos-contratacion-import';

const prisma = new PrismaClient();

const xlsxPath = process.argv[2];

/** Si se pasa ruta al .xlsx, se importa desde ese archivo aunque exista JSON en el repo. */
importCatalogosTiposContratacion(prisma, {
  xlsxPath,
  forzarExcel: Boolean(xlsxPath),
  removeLegacyStubTipos: true,
})
  .then(() => linkHydraClausulasToAllTipos(prisma))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
