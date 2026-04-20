/**
 * Genera prisma/data/catalogos-tipos-contratacion-sige.json desde el Excel SIGE (solo en máquina con el .xlsx).
 * Uso:
 *   cd backend
 *   npm run export:catalogos-tipos-sige-json -- "C:/ruta/Catálogos de tipos contratacion.xlsx"
 * Sin argumento: intenta la ruta por defecto bajo _DocumentacIon_Interna_Sistema_Anterior/...
 */
import * as fs from 'fs';
import * as path from 'path';
import {
  buildCatalogosPayloadFromXlsx,
  defaultSigeCatalogosXlsxPath,
} from '../prisma/catalogos-tipos-contratacion-import';

const outPath = path.join(__dirname, '../prisma/data/catalogos-tipos-contratacion-sige.json');
const inputPath = process.argv[2] ?? defaultSigeCatalogosXlsxPath();

if (!fs.existsSync(inputPath)) {
  console.error(`No se encontró el Excel: ${inputPath}`);
  console.error('Pasa la ruta como primer argumento o coloca el archivo en la ruta por defecto.');
  process.exit(1);
}

const payload = buildCatalogosPayloadFromXlsx(inputPath);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
console.log(`Escrito: ${outPath}`);
console.log(
  `Resumen: ${payload.administraciones.length} administraciones, ` +
    `${payload.tiposConMedidor.length} tipos con medidor, ` +
    `${payload.tiposSinMedidor.length} tipos sin medidor`,
);
