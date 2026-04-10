/**
 * Carga el catálogo territorial completo en tablas INEGI (producción).
 *
 * Fuentes oficiales esperadas:
 * 1) Catálogo de localidades (INEGI / Marco geoestadístico): CSV o XLSX con claves de entidad,
 *    municipio y localidad (o clave geoestadística de 9 dígitos).
 * 2) Catálogo de códigos postales (SEPOMEX / Correos de México): XLSX "CPdescarga" (asentamientos + CP).
 *
 * Uso:
 *   cd backend && npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/import-inegi-catalog.ts \
 *     --localidades ./data/inegi/localidades.csv \
 *     --sepomex ./data/sepomex/CPdescarga.xlsx
 *
 * Variables de entorno (alternativa a flags):
 *   INEGI_LOCALIDADES_URL o INEGI_LOCALIDADES_PATH (URL https tiene prioridad si ambas existen)
 *   SEPOMEX_XLSX_URL o SEPOMEX_XLSX_PATH
 *   INEGI_LOCALIDADES_DOWNLOAD_EXT  extensión temporal si la URL no termina en .csv/.xlsx (ej. .xlsx)
 *   SEPOMEX_DOWNLOAD_EXT            idem para SEPOMEX (por defecto .xlsx)
 *   INEGI_IMPORT_BEARER             opcional, Authorization Bearer para URLs no públicas
 *
 * Opciones:
 *   --wipe-inegi     Vacía tablas INEGI antes de importar (pone NULL en FKs de domicilios).
 *   --force          Con --wipe-inegi, no pide confirmación en stdin.
 *   --skip-colonias  Solo estados / municipios / localidades.
 *   --skip-localidades  Solo colonias SEPOMEX (requiere municipios ya cargados).
 *
 * Ver: docs/import-catalogo-inegi.md
 */

import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as os from 'os';
import * as readline from 'readline';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const BATCH = 2500;

function normHeader(h: string): string {
  return h
    .replace(/^\ufeff/, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (!inQuotes && c === delimiter) {
      out.push(cur.trim());
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur.trim());
  return out;
}

function padEnt(s: string): string {
  const n = parseInt(String(s).replace(/\D/g, ''), 10);
  if (Number.isNaN(n) || n < 1 || n > 32) return '';
  return String(n).padStart(2, '0');
}

function padMun(s: string): string {
  const n = parseInt(String(s).replace(/\D/g, ''), 10);
  if (Number.isNaN(n) || n < 0) return '';
  return String(n).padStart(3, '0');
}

function padLoc(s: string): string {
  const n = parseInt(String(s).replace(/\D/g, ''), 10);
  if (Number.isNaN(n) || n < 0) return '';
  return String(n).padStart(4, '0');
}

function munClave(ent: string, mun: string): string {
  return `${padEnt(ent)}${padMun(mun)}`;
}

function locClave(ent: string, mun: string, loc: string): string {
  return `${padEnt(ent)}${padMun(mun)}${padLoc(loc)}`;
}

function splitCvegeo(raw: string): { ent: string; mun: string; loc: string } | null {
  const d = String(raw).replace(/\D/g, '');
  if (d.length < 9) return null;
  const ent = d.slice(0, 2);
  const mun = d.slice(2, 5);
  const loc = d.slice(5, 9);
  if (!padEnt(ent)) return null;
  return { ent, mun, loc };
}

function detectDelimiter(firstLine: string): string {
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return tabs > commas ? '\t' : ',';
}

function findColIdx(headers: string[], aliases: string[]): number {
  const norm = headers.map((h) => normHeader(h));
  for (const al of aliases) {
    const t = normHeader(al);
    const i = norm.indexOf(t);
    if (i >= 0) return i;
  }
  for (const al of aliases) {
    const t = normHeader(al);
    const i = norm.findIndex((n) => n === t || n.endsWith(t) || t.endsWith(n));
    if (i >= 0) return i;
  }
  return -1;
}

function getCell(row: string[], idx: number): string {
  if (idx < 0 || idx >= row.length) return '';
  return row[idx] ?? '';
}

type LocalidadRow = { ent: string; mun: string; loc: string; nomLoc: string };

function parseArgs(): {
  localidades?: string;
  sepomex?: string;
  wipe: boolean;
  force: boolean;
  skipColonias: boolean;
  skipLocalidades: boolean;
} {
  const envL =
    process.env.INEGI_LOCALIDADES_URL?.trim() || process.env.INEGI_LOCALIDADES_PATH?.trim();
  const envS = process.env.SEPOMEX_XLSX_URL?.trim() || process.env.SEPOMEX_XLSX_PATH?.trim();
  let localidades = envL;
  let sepomex = envS;
  let wipe = false;
  let force = false;
  let skipColonias = false;
  let skipLocalidades = false;
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--localidades' && argv[i + 1]) {
      localidades = argv[++i];
    } else if (a === '--sepomex' && argv[i + 1]) {
      sepomex = argv[++i];
    } else if (a === '--wipe-inegi') {
      wipe = true;
    } else if (a === '--force') {
      force = true;
    } else if (a === '--skip-colonias') {
      skipColonias = true;
    } else if (a === '--skip-localidades') {
      skipLocalidades = true;
    }
  }
  return { localidades, sepomex, wipe, force, skipColonias, skipLocalidades };
}

function isRemoteUrl(s: string): boolean {
  return /^https?:\/\//i.test(s.trim());
}

function googleDriveFileId(rawUrl: string): string | null {
  const mPath = rawUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (mPath) return mPath[1];
  try {
    const u = new URL(rawUrl);
    const id = u.searchParams.get('id');
    if (id && /drive\.google\.com|docs\.google\.com/.test(u.hostname)) return id;
  } catch {
    /* ignore */
  }
  return null;
}

/** Convierte enlaces de vista/compartir de Drive a URL de descarga directa. */
function normalizeDownloadUrl(rawUrl: string): string {
  const id = googleDriveFileId(rawUrl);
  if (id) {
    return `https://drive.google.com/uc?export=download&id=${id}`;
  }
  return rawUrl.trim();
}

function extFromInput(input: string, fallback: string): string {
  if (isRemoteUrl(input)) {
    try {
      const p = new URL(input).pathname;
      const e = path.extname(p).toLowerCase();
      if (e === '.csv' || e === '.xlsx' || e === '.xls' || e === '.txt') return e;
    } catch {
      /* ignore */
    }
    return fallback;
  }
  const e = path.extname(input).toLowerCase();
  return e || fallback;
}

function looksLikeHtml(buf: Buffer, contentType: string): boolean {
  if (contentType.includes('text/html')) return true;
  const head = buf.slice(0, 80).toString('utf8').trimStart();
  return head.startsWith('<!') || head.toLowerCase().startsWith('<html');
}

function extractGoogleDriveConfirm(html: string): string | null {
  const m = html.match(/confirm=([^&"'<>\s]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function fetchBytes(url: string): Promise<{ buf: Buffer; contentType: string }> {
  if (typeof fetch === 'undefined') {
    throw new Error('Se requiere Node.js 18+ (fetch global) para descargar por URL.');
  }
  const headers: Record<string, string> = {
    'User-Agent': 'contract-to-cash-flow-inegi-import/1.0',
  };
  const bearer = process.env.INEGI_IMPORT_BEARER?.trim();
  if (bearer) headers['Authorization'] = `Bearer ${bearer}`;

  const res = await fetch(url, { redirect: 'follow', headers });
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} al descargar: ${url.slice(0, 120)}`);
  }
  return { buf, contentType };
}

/**
 * Descarga a archivo temporal. Soporta Google Drive (enlace público / “cualquiera con el enlace”).
 */
async function downloadToTemp(sourceUrl: string, ext: string): Promise<{ path: string; cleanup: () => void }> {
  const normalized = normalizeDownloadUrl(sourceUrl);
  let { buf, contentType } = await fetchBytes(normalized);

  if (looksLikeHtml(buf, contentType)) {
    const id = googleDriveFileId(sourceUrl) ?? googleDriveFileId(normalized);
    const html = buf.slice(0, Math.min(buf.length, 250_000)).toString('utf8');
    const confirm = extractGoogleDriveConfirm(html);
    if (id && confirm) {
      const second = `https://drive.google.com/uc?export=download&id=${id}&confirm=${encodeURIComponent(confirm)}`;
      const r2 = await fetchBytes(second);
      buf = r2.buf;
      contentType = r2.contentType;
    } else if (id) {
      const alt = `https://drive.usercontent.google.com/download?id=${id}&export=download`;
      const r3 = await fetchBytes(alt);
      buf = r3.buf;
      contentType = r3.contentType;
    }
    if (looksLikeHtml(buf, contentType)) {
      throw new Error(
        'La URL devolvió HTML en lugar del archivo. En Google Drive use “Cualquiera con el enlace” o ' +
          'defina INEGI_LOCALIDADES_DOWNLOAD_EXT / SEPOMEX_DOWNLOAD_EXT si el archivo es XLSX sin extensión en la URL.',
      );
    }
  }

  const dotExt = ext.startsWith('.') ? ext : `.${ext}`;
  const tmp = path.join(os.tmpdir(), `inegi-import-${randomBytes(8).toString('hex')}${dotExt}`);
  fs.writeFileSync(tmp, buf);
  const cleanup = () => {
    try {
      fs.unlinkSync(tmp);
    } catch {
      /* ignore */
    }
  };
  console.log('Descargado a temporal:', tmp, `(${buf.length} bytes)`);
  return { path: tmp, cleanup };
}

type ResolvedInput = { path: string; cleanup?: () => void };

async function resolveLocalPathOrDownload(
  input: string | undefined,
  opts: { defaultExt: string; envExtVar: string },
): Promise<ResolvedInput | null> {
  if (!input?.trim()) return null;
  const trimmed = input.trim();
  if (isRemoteUrl(trimmed)) {
    const envExt = process.env[opts.envExtVar]?.trim();
    const ext = envExt || extFromInput(trimmed, opts.defaultExt);
    return downloadToTemp(trimmed, ext);
  }
  const local = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
  if (!fs.existsSync(local)) return null;
  return { path: local };
}

async function wipeInegiTables(opts: { force: boolean }) {
  const domConCol = await prisma.domicilio.count({
    where: { coloniaINEGIId: { not: null } },
  });
  if (domConCol > 0 && !opts.force) {
    console.warn(
      `Advertencia: ${domConCol} domicilio(s) tienen colonia INEGI. Al borrar, esas FK quedarán en NULL (onDelete).`,
    );
  }
  if (!opts.force) {
    const answer = await new Promise<string>((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
      rl.question('¿Vaciar catálogos INEGI? Escriba SI: ', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
    if (answer !== 'SI') {
      console.log('Cancelado.');
      process.exit(0);
    }
  }
  await prisma.$transaction([
    prisma.catalogoColoniaINEGI.deleteMany({}),
    prisma.catalogoLocalidadINEGI.deleteMany({}),
    prisma.catalogoMunicipioINEGI.deleteMany({}),
    prisma.catalogoEstadoINEGI.deleteMany({}),
  ]);
  console.log('Tablas INEGI vaciadas.');
}

async function importLocalidadesFile(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.xlsx' || ext === '.xls') {
    await importLocalidadesXlsx(filePath);
  } else {
    await importLocalidadesCsv(filePath);
  }
}

function xlsxPickKey(headerRow: string[], aliases: string[]): string {
  for (const h of headerRow) {
    const n = normHeader(h);
    if (aliases.some((a) => normHeader(a) === n)) return h;
  }
  return '';
}

async function importLocalidadesXlsx(filePath: string) {
  console.log('Leyendo localidades (XLSX):', filePath);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rows.length === 0) {
    throw new Error('Hoja vacía o sin filas');
  }
  const headerRow = Object.keys(rows[0]);
  const keys = headerRow.map((k) => normHeader(k));
  const kEnt = xlsxPickKey(headerRow, ['CVE_ENT', 'ENTIDAD', 'CVE_ENTIDAD']);
  const kMun = xlsxPickKey(headerRow, ['CVE_MUN', 'MUN', 'CVE_MUNICIPIO']);
  const kLoc = xlsxPickKey(headerRow, ['CVE_LOC', 'LOC', 'LOCALIDAD', 'CVE_LOCALIDAD']);
  const kNomEnt = xlsxPickKey(headerRow, ['NOM_ENT', 'NOMBRE_ENTIDAD', 'ENTIDAD_NOMBRE']);
  const kNomMun = xlsxPickKey(headerRow, ['NOM_MUN', 'NOMBRE_MUNICIPIO', 'MUNICIPIO_NOMBRE']);
  const kNomLoc = xlsxPickKey(headerRow, ['NOM_LOC', 'NOMBRE_LOCALIDAD', 'LOCALIDAD_NOMBRE']);
  const kGeo = xlsxPickKey(headerRow, ['CVEGEO', 'CVE_GEO', 'PK_CVEGEO', 'CLAVE_GEOESTADISTICA']);

  if (!kNomLoc) {
    throw new Error(
      'No se encontró columna de nombre de localidad (ej. NOM_LOC). Cabeceras: ' + keys.join(', '),
    );
  }

  const entNom = new Map<string, string>();
  const munNom = new Map<string, string>();
  const locRows: LocalidadRow[] = [];

  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const pick = (k: string) => (k && row[k] != null ? String(row[k]).trim() : '');

    let ent = '';
    let mun = '';
    let loc = '';
    const geo = pick(kGeo);
    if (geo) {
      const sp = splitCvegeo(geo);
      if (sp) {
        ent = sp.ent;
        mun = sp.mun;
        loc = sp.loc;
      }
    }
    if (!ent && kEnt) ent = padEnt(pick(kEnt));
    if (!mun && kMun) mun = padMun(pick(kMun));
    if (!loc && kLoc) loc = padLoc(pick(kLoc));
    const nomLoc = pick(kNomLoc);
    if (!nomLoc || !ent || !mun || !loc) continue;

    const ne = pick(kNomEnt);
    const nm = pick(kNomMun);
    if (ne) entNom.set(ent, ne);
    if (nm) munNom.set(munClave(ent, mun), nm);

    locRows.push({ ent, mun, loc, nomLoc });
  }

  await persistJerarquia(entNom, munNom, locRows);
}

async function importLocalidadesCsv(filePath: string) {
  console.log('Leyendo localidades (CSV/TSV):', filePath);
  const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let lineNo = 0;
  let delimiter = ',';
  let headers: string[] = [];
  let idxEnt = -1;
  let idxMun = -1;
  let idxLoc = -1;
  let idxNomEnt = -1;
  let idxNomMun = -1;
  let idxNomLoc = -1;
  let idxGeo = -1;

  const entNom = new Map<string, string>();
  const munNom = new Map<string, string>();
  const locRows: LocalidadRow[] = [];

  for await (const line of rl) {
    lineNo++;
    if (!line.trim()) continue;
    if (lineNo === 1) {
      delimiter = detectDelimiter(line);
      headers = parseDelimitedLine(line, delimiter);
      idxEnt = findColIdx(headers, ['CVE_ENT', 'ENTIDAD', 'CVE_ENTIDAD']);
      idxMun = findColIdx(headers, ['CVE_MUN', 'MUN', 'CVE_MUNICIPIO']);
      idxLoc = findColIdx(headers, ['CVE_LOC', 'LOC', 'LOCALIDAD', 'CVE_LOCALIDAD']);
      idxNomEnt = findColIdx(headers, ['NOM_ENT', 'NOMBRE_ENTIDAD']);
      idxNomMun = findColIdx(headers, ['NOM_MUN', 'NOMBRE_MUNICIPIO']);
      idxNomLoc = findColIdx(headers, ['NOM_LOC', 'NOMBRE_LOCALIDAD']);
      idxGeo = findColIdx(headers, ['CVEGEO', 'CVE_GEO', 'PK_CVEGEO', 'CLAVE_GEOESTADISTICA']);
      if (idxNomLoc < 0) {
        throw new Error(
          `No se encontró columna de nombre de localidad. Cabeceras: ${headers.join(' | ')}`,
        );
      }
      continue;
    }

    const cells = parseDelimitedLine(line, delimiter);
    let ent = '';
    let mun = '';
    let loc = '';
    const geo = getCell(cells, idxGeo);
    if (geo) {
      const sp = splitCvegeo(geo);
      if (sp) {
        ent = sp.ent;
        mun = sp.mun;
        loc = sp.loc;
      }
    }
    if (!ent && idxEnt >= 0) ent = padEnt(getCell(cells, idxEnt));
    if (!mun && idxMun >= 0) mun = padMun(getCell(cells, idxMun));
    if (!loc && idxLoc >= 0) loc = padLoc(getCell(cells, idxLoc));
    const nomLoc = getCell(cells, idxNomLoc);
    if (!nomLoc || !ent || !mun || !loc) continue;

    const ne = getCell(cells, idxNomEnt);
    const nm = getCell(cells, idxNomMun);
    if (ne) entNom.set(ent, ne);
    if (nm) munNom.set(munClave(ent, mun), nm);

    locRows.push({ ent, mun, loc, nomLoc });
  }

  await persistJerarquia(entNom, munNom, locRows);
}

async function persistJerarquia(
  entNom: Map<string, string>,
  munNom: Map<string, string>,
  locRows: LocalidadRow[],
) {
  console.log(
    `Derivado: ${entNom.size} entidades, ${munNom.size} municipios únicos, ${locRows.length} filas de localidad`,
  );

  const estadosData = Array.from(entNom.entries()).map(([claveINEGI, nombre]) => ({
    claveINEGI,
    nombre: nombre || `Entidad ${claveINEGI}`,
    activo: true,
  }));
  if (estadosData.length === 0) {
    throw new Error('No se derivó ningún estado. Revise columnas del archivo.');
  }

  for (let i = 0; i < estadosData.length; i += BATCH) {
    await prisma.catalogoEstadoINEGI.createMany({
      data: estadosData.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  const estadoDb = await prisma.catalogoEstadoINEGI.findMany({
    select: { id: true, claveINEGI: true },
  });
  const estadoIdByClave = new Map(estadoDb.map((e) => [e.claveINEGI, e.id]));

  const munKeys = new Set<string>();
  for (const lr of locRows) {
    munKeys.add(munClave(lr.ent, lr.mun));
  }
  const municipiosData: {
    claveINEGI: string;
    nombre: string;
    estadoId: string;
    activo: boolean;
  }[] = [];
  for (const mk of Array.from(munKeys)) {
    const estadoClave = mk.slice(0, 2);
    const entId = estadoIdByClave.get(estadoClave);
    if (!entId) continue;
    const munPart = mk.slice(2);
    const nombre =
      munNom.get(mk) || `Municipio ${munPart} (${estadoClave})`;
    municipiosData.push({
      claveINEGI: mk,
      nombre,
      estadoId: entId,
      activo: true,
    });
  }

  for (let i = 0; i < municipiosData.length; i += BATCH) {
    await prisma.catalogoMunicipioINEGI.createMany({
      data: municipiosData.slice(i, i + BATCH),
      skipDuplicates: true,
    });
  }

  const munDb = await prisma.catalogoMunicipioINEGI.findMany({
    select: { id: true, claveINEGI: true },
  });
  const municipioIdByClave = new Map(munDb.map((m) => [m.claveINEGI, m.id]));

  let locBatch: { municipioId: string; claveINEGI: string; nombre: string; activo: boolean }[] =
    [];
  for (const lr of locRows) {
    const mk = munClave(lr.ent, lr.mun);
    const mid = municipioIdByClave.get(mk);
    if (!mid) continue;
    const cl = locClave(lr.ent, lr.mun, lr.loc);
    locBatch.push({
      municipioId: mid,
      claveINEGI: cl,
      nombre: lr.nomLoc.slice(0, 500),
      activo: true,
    });
    if (locBatch.length >= BATCH) {
      await prisma.catalogoLocalidadINEGI.createMany({
        data: locBatch,
        skipDuplicates: true,
      });
      locBatch = [];
    }
  }
  if (locBatch.length) {
    await prisma.catalogoLocalidadINEGI.createMany({
      data: locBatch,
      skipDuplicates: true,
    });
  }

  const [ne, nm, nl] = await Promise.all([
    prisma.catalogoEstadoINEGI.count(),
    prisma.catalogoMunicipioINEGI.count(),
    prisma.catalogoLocalidadINEGI.count(),
  ]);
  console.log(`INEGI jerarquía persistida. Conteos en BD: estados=${ne}, municipios=${nm}, localidades=${nl}`);
}

function rowVal(row: Record<string, unknown>, keys: string[]): string {
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const exact = rowKeys.find((rk) => normHeader(rk) === normHeader(k));
    if (exact != null && row[exact] != null && String(row[exact]).trim() !== '') {
      return String(row[exact]).trim();
    }
  }
  for (const k of keys) {
    const lk = k.toLowerCase();
    const found = rowKeys.find((rk) => rk.toLowerCase() === lk);
    if (found != null && row[found] != null && String(row[found]).trim() !== '') {
      return String(row[found]).trim();
    }
  }
  return '';
}

async function importSepomex(filePath: string) {
  console.log('Leyendo SEPOMEX (XLSX):', filePath);
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
  if (rows.length === 0) throw new Error('SEPOMEX: hoja vacía');

  const munDb = await prisma.catalogoMunicipioINEGI.findMany({
    select: { id: true, claveINEGI: true },
  });
  const municipioIdByClave = new Map(munDb.map((m) => [m.claveINEGI, m.id]));

  let batch: {
    municipioId: string;
    codigoPostal: string;
    claveINEGI: string;
    nombre: string;
    activo: boolean;
  }[] = [];
  let n = 0;
  let skipped = 0;

  for (const raw of rows) {
    const row = raw as Record<string, unknown>;
    const cEst = padEnt(rowVal(row, ['c_estado', 'C_ESTADO', 'CVE_ENT']));
    const cMun = padMun(rowVal(row, ['c_mnpio', 'C_MNPIO', 'CVE_MUN']));
    const dCp = rowVal(row, ['d_codigo', 'D_CODIGO', 'd_CP', 'CP', 'CODIGO_POSTAL']).replace(
      /\D/g,
      '',
    );
    const nombre = rowVal(row, ['d_asenta', 'D_ASENTA', 'ASENTAMIENTO', 'NOMBRE_ASENTAMIENTO']);
    const idAsenta = rowVal(row, ['id_asenta_cpcons', 'ID_ASENTA_CPCONS']);

    if (!cEst || !cMun || dCp.length !== 5 || !nombre) {
      skipped++;
      continue;
    }
    const mk = `${cEst}${cMun}`;
    const mid = municipioIdByClave.get(mk);
    if (!mid) {
      skipped++;
      continue;
    }

    const idPart = (idAsenta || '0').replace(/\D/g, '') || '0';
    const claveINEGI = `${mk}${dCp}${idPart.padStart(6, '0')}`.slice(0, 64);

    batch.push({
      municipioId: mid,
      codigoPostal: dCp,
      claveINEGI,
      nombre: nombre.slice(0, 500),
      activo: true,
    });

    if (batch.length >= BATCH) {
      await prisma.catalogoColoniaINEGI.createMany({ data: batch, skipDuplicates: true });
      n += batch.length;
      batch = [];
    }
  }
  if (batch.length) {
    await prisma.catalogoColoniaINEGI.createMany({ data: batch, skipDuplicates: true });
    n += batch.length;
  }

  const nc = await prisma.catalogoColoniaINEGI.count();
  console.log(
    `SEPOMEX: filas procesadas ~${n}, registros omitidos (sin municipio en catálogo o datos incompletos): ${skipped}. Total colonias en BD: ${nc}`,
  );
}

async function main() {
  const args = parseArgs();

  if (args.wipe) {
    await wipeInegiTables({ force: args.force });
  }

  if (args.skipLocalidades && args.skipColonias) {
    console.log('Sin importación (--skip-localidades y --skip-colonias).');
    return;
  }

  if (!args.skipLocalidades) {
    const resolved = await resolveLocalPathOrDownload(args.localidades, {
      defaultExt: '.csv',
      envExtVar: 'INEGI_LOCALIDADES_DOWNLOAD_EXT',
    });
    if (!resolved) {
      console.error(
        'Falta archivo o URL de localidades. Use --localidades, INEGI_LOCALIDADES_URL o INEGI_LOCALIDADES_PATH.',
      );
      process.exit(1);
    }
    try {
      await importLocalidadesFile(resolved.path);
    } finally {
      resolved.cleanup?.();
    }
  }

  if (!args.skipColonias) {
    const resolved = await resolveLocalPathOrDownload(args.sepomex, {
      defaultExt: '.xlsx',
      envExtVar: 'SEPOMEX_DOWNLOAD_EXT',
    });
    if (!resolved) {
      console.error(
        'Falta archivo o URL SEPOMEX. Use --sepomex, SEPOMEX_XLSX_URL o SEPOMEX_XLSX_PATH.',
      );
      process.exit(1);
    }
    try {
      await importSepomex(resolved.path);
    } finally {
      resolved.cleanup?.();
    }
  }

  console.log('Importación INEGI / SEPOMEX finalizada.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
