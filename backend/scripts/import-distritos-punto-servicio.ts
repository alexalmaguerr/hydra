/**
 * Importa/actualiza distritos desde la hoja «Distrito» del XLSX de catálogos de punto de servicio.
 *
 * Uso (desde backend/):
 *   npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/import-distritos-punto-servicio.ts [ruta.xlsx]
 *
 * Por defecto intenta el libro en _DocumentacIon_Interna_Sistema_Anterior/.../catálogos de punto de servicio.xlsx
 * relativo a la raíz del repo.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import {
  DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID,
  DISTRITOS_PUNTO_SERVICIO_SEED,
} from '../prisma/seed-data/distritos-punto-servicio';

const prisma = new PrismaClient();

function defaultXlsxPath(): string {
  const repoRoot = path.resolve(__dirname, '..', '..');
  return path.join(
    repoRoot,
    '_DocumentacIon_Interna_Sistema_Anterior',
    'Gestion Servicio',
    'Contratos',
    'catálogos de punto de servicio.xlsx',
  );
}

/** Quita acentos para comparar etiquetas de administración. */
function normalizeLabel(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toUpperCase()
    .trim();
}

/** Deriva DIST01.. a partir del prefijo numérico en la columna Distrito (p. ej. "01-..."). */
function idFromDistritoNombre(nombre: string, rowIndex: number): string {
  const m = /^(\d{1,2})\s*-/u.exec(nombre.trim());
  if (m) return `DIST${m[1].padStart(2, '0')}`;
  return `DIST${String(rowIndex).padStart(2, '0')}`;
}

async function main() {
  const argPath = process.argv[2];
  const xlsxPath = argPath ? path.resolve(argPath) : defaultXlsxPath();

  if (!fs.existsSync(xlsxPath)) {
    console.error(`No existe el archivo: ${xlsxPath}`);
    console.error('Pase la ruta del XLSX como primer argumento o coloque el libro en la ruta por defecto.');
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const sheet = wb.Sheets['Distrito'];
  if (!sheet) {
    console.error('El libro no contiene la hoja "Distrito". Hojas:', wb.SheetNames.join(', '));
    process.exit(1);
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as string[][];

  const dataRows = rows.slice(1).filter((r) => r?.length && String(r[1] ?? '').trim());

  let n = 0;
  const importedIds = new Set<string>();
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const adminRaw = String(row[0] ?? '').trim();
    const nombre = String(row[1] ?? '').trim();
    if (!nombre) continue;

    if (normalizeLabel(adminRaw) !== normalizeLabel('QUERÉTARO') && adminRaw.length > 0) {
      console.warn(`Fila omitida (administración no QUERÉTARO): ${adminRaw} | ${nombre}`);
      continue;
    }

    const id = idFromDistritoNombre(nombre, i + 1);
    await prisma.distrito.upsert({
      where: { id },
      update: {
        nombre,
        zonaId: DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID,
      },
      create: {
        id,
        nombre,
        zonaId: DISTRITOS_PUNTO_SERVICIO_DEFAULT_ZONA_ID,
      },
    });
    importedIds.add(id);
    n++;
    console.log(`OK ${id} → ${nombre}`);
  }

  console.log(`Importación terminada: ${n} distrito(s).`);

  for (const exp of DISTRITOS_PUNTO_SERVICIO_SEED) {
    if (!importedIds.has(exp.id)) {
      console.warn(`Aviso: falta en el XLS el distrito esperado ${exp.id} (${exp.nombre}).`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});
