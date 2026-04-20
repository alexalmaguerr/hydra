/**
 * Importa localidades del archivo SIGE «Catálogos de domicilio.xlsx» para los municipios
 * de Querétaro ya cargados en BD (véase prisma/data/catalogo-municipios-qro-sige.json).
 *
 * Hoja de datos: **Localidad (Población)** (columnas pobid, pobnombre, pobproid, pobcodine).
 * `pobproid` coincide con `proid` en la hoja «Municipio (provincia)» y con `cve_mun`/`proid`
 * según el catálogo municipal ya integrado — se resuelve a `CatalogoMunicipioINEGI` por `claveINEGI`.
 *
 * Clave única (`claveINEGI`): `${claveINEGI9}_${pobid}` cuando hay 9 dígitos en pobcodine;
 * si no, `SIGE_${pobid}` (casos datos incompletos).
 *
 * Uso (desde backend/):
 *   npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/import-localidades-sige-qro.ts \
 *     --file "../_DocumentacIon_Interna_Sistema_Anterior/Gestion Servicio/Contratos/Catálogos de domicilio.xlsx"
 *
 * Variables:
 *   CAT_DOM_XLSX_PATH — ruta al XLSX si no se pasa --file
 */

import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BATCH = 800;

type MunicipioQroRow = {
  proid: number;
  claveINEGI: string;
};

function parseArgs(): { file?: string } {
  const argv = process.argv.slice(2);
  let file = process.env.CAT_DOM_XLSX_PATH?.trim();
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--file' && argv[i + 1]) {
      file = argv[++i];
    }
  }
  return { file };
}

function nineDigitClave(pobcodine: unknown): string | null {
  const digits = String(pobcodine ?? '')
    .replace(/\D/g, '')
    .trim();
  if (digits.length < 9) return null;
  return digits.slice(-9);
}

function buildClaveINEGI(pobcodine: unknown, pobid: number): string {
  const nine = nineDigitClave(pobcodine);
  if (nine) return `${nine}_${pobid}`;
  return `SIGE_${pobid}`;
}

function nombreLocalidad(raw: unknown): string {
  const s = String(raw ?? '')
    .trim()
    .slice(0, 512);
  return s || '(sin nombre)';
}

async function main() {
  const { file: fileArg } = parseArgs();
  const backendRoot = path.join(__dirname, '..');
  const defaultRelative = path.join(
    '..',
    '_DocumentacIon_Interna_Sistema_Anterior',
    'Gestion Servicio',
    'Contratos',
    'Catálogos de domicilio.xlsx',
  );
  const filePath = fileArg
    ? path.resolve(fileArg)
    : path.resolve(backendRoot, defaultRelative);

  if (!fs.existsSync(filePath)) {
    console.error('No existe el archivo:', filePath);
    console.error('Pase --file <ruta> o defina CAT_DOM_XLSX_PATH.');
    process.exit(1);
  }

  const munJsonPath = path.join(backendRoot, 'prisma', 'data', 'catalogo-municipios-qro-sige.json');
  if (!fs.existsSync(munJsonPath)) {
    console.error('Falta catálogo municipal QRO:', munJsonPath);
    process.exit(1);
  }

  const municipiosQro: MunicipioQroRow[] = JSON.parse(fs.readFileSync(munJsonPath, 'utf8'));
  const allowedProid = new Set(municipiosQro.map((m) => m.proid));

  const claves = [...new Set(municipiosQro.map((m) => m.claveINEGI))];
  const munDb = await prisma.catalogoMunicipioINEGI.findMany({
    where: { claveINEGI: { in: claves } },
    select: { id: true, claveINEGI: true },
  });

  const claveToId = new Map(munDb.map((m) => [m.claveINEGI, m.id]));
  const proidToMunicipioId = new Map<number, string>();
  for (const pr of municipiosQro) {
    const mid = claveToId.get(pr.claveINEGI);
    if (mid) proidToMunicipioId.set(pr.proid, mid);
    else console.warn(`Municipio no encontrado en BD para clave ${pr.claveINEGI} (${pr.proid}).`);
  }

  console.log(
    `Municipios QRO en BD resueltos: ${proidToMunicipioId.size}/${municipiosQro.length}`,
  );

  console.log('Leyendo Excel (puede tardar):', filePath);
  const wb = XLSX.readFile(filePath);
  const sheetName = 'Localidad (Población)';
  if (!wb.SheetNames.includes(sheetName)) {
    console.error('El libro no contiene la hoja', sheetName);
    console.error('Hojas disponibles:', wb.SheetNames.join(', '));
    process.exit(1);
  }

  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });

  let skippedNoMun = 0;
  let inserted = 0;

  let batch: { municipioId: string; claveINEGI: string; nombre: string; activo: boolean }[] =
    [];

  for (const row of rows) {
    const pobproid = Number(row.pobproid);
    if (!Number.isFinite(pobproid) || !allowedProid.has(pobproid)) continue;

    const pobid = Number(row.pobid);
    if (!Number.isFinite(pobid)) continue;

    const municipioId = proidToMunicipioId.get(pobproid);
    if (!municipioId) {
      skippedNoMun++;
      continue;
    }

    const claveINEGI = buildClaveINEGI(row.pobcodine, pobid);
    batch.push({
      municipioId,
      claveINEGI,
      nombre: nombreLocalidad(row.pobnombre),
      activo: true,
    });

    if (batch.length >= BATCH) {
      const r = await prisma.catalogoLocalidadINEGI.createMany({
        data: batch,
        skipDuplicates: true,
      });
      inserted += r.count;
      batch = [];
    }
  }

  if (batch.length) {
    const r = await prisma.catalogoLocalidadINEGI.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += r.count;
  }

  const total = await prisma.catalogoLocalidadINEGI.count();
  console.log(
    `Filas insertadas (nuevas): ${inserted}. Omitidas sin municipio en BD: ${skippedNoMun}. Total localidades en BD: ${total}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
