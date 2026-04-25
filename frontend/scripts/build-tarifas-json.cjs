/**
 * Genera src/data/tarifas-agua.json desde el CSV de CEA Querétaro.
 * Uso: node scripts/build-tarifas-json.cjs
 *
 * Estructura de salida:
 *   { [admin]: { [tarifa]: { precios: number[], precioBase200: number, precioM3Adicional: number, tasa: number } } }
 *
 *   precios[m]        = cargo acumulado para m m³ por unidad (m = 0..200)
 *   precioBase200     = cargo fijo cuando consumo > 200 m³ (de la fila "> 200")
 *   precioM3Adicional = cargo por cada m³ adicional sobre 200 (de la fila "> 200")
 *   tasa              = tasa de IVA (0 o 0.16)
 */

const fs   = require('fs');
const path = require('path');

const CSV_PATH = path.join(
  process.env.HOME,
  'Desktop',
  'Tarifas_periodicas.xlsx - AGUA POTABLE PERIODICAS M3.csv',
);
const OUT_PATH = path.join(__dirname, '..', 'src', 'data', 'tarifas-agua.json');

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePrice(raw) {
  if (!raw) return 0;
  // quita espacios, signo $, comas, comillas
  const clean = raw.replace(/[$,\s"']/g, '');
  if (clean === '-' || clean === '') return 0;
  return parseFloat(clean) || 0;
}

function parseTasa(raw) {
  if (!raw) return 0;
  const v = parseFloat(raw.replace(/[,\s"']/g, ''));
  return isNaN(v) ? 0 : v;
}

// ── Parseo CSV ─────────────────────────────────────────────────────────────────

const raw  = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = raw.split('\n').map(l => l.replace(/\r$/, ''));

// Las primeras 3 líneas son títulos; la línea 4 (índice 3) es el encabezado real
// Saltamos las 4 primeras y trabajamos con los datos desde la línea 5 (índice 4)
const dataLines = lines.slice(4).filter(l => l.trim() !== '');

// Resultado acumulado
const result = {};

for (const line of dataLines) {
  // Separar respetando comillas (las celdas con $ usan comillas en algunos exportes)
  // Usamos split simple por coma — los valores con $ ya tienen comillas si hay coma interna
  // En este CSV los precios están en comillas tipo: " $ 1,234.56 "
  const cols = splitCSVLine(line);

  const admin = cols[0]?.trim();
  const m3raw = cols[1]?.trim();

  if (!admin || !m3raw) continue;

  if (!result[admin]) result[admin] = {};

  const isOver200 = m3raw === '> 200';
  const m3 = isOver200 ? null : parseInt(m3raw, 10);
  if (!isOver200 && isNaN(m3)) continue;

  // Grupos de tarifa: empiezan en col índice 2, cada grupo tiene 4 cols
  // TARIFA | PRECIO BASE | M3 ADICIONAL | TASA
  let col = 2;
  while (col + 3 < cols.length) {
    const nombre      = cols[col]?.trim();
    const precioBase  = parsePrice(cols[col + 1]);
    const m3Adicional = parsePrice(cols[col + 2]);
    const tasa        = parseTasa(cols[col + 3]);
    col += 4;

    if (!nombre) continue;

    if (!result[admin][nombre]) {
      result[admin][nombre] = {
        precios: [],
        precioBase200: 0,
        precioM3Adicional: 0,
        tasa: 0,
      };
    }

    const entry = result[admin][nombre];
    entry.tasa = tasa; // sobreescribir con último valor (consistente)

    if (isOver200) {
      entry.precioBase200     = precioBase;
      entry.precioM3Adicional = m3Adicional;
    } else {
      // Asegurar que el array tenga el tamaño correcto
      while (entry.precios.length <= m3) entry.precios.push(0);
      entry.precios[m3] = precioBase;
    }
  }
}

// ── Validación rápida ─────────────────────────────────────────────────────────

let totalTarifas = 0;
for (const [admin, tarifas] of Object.entries(result)) {
  for (const [nombre, entry] of Object.entries(tarifas)) {
    totalTarifas++;
    if (entry.precios.length !== 201) {
      console.warn(`⚠  ${admin}/${nombre}: precios.length = ${entry.precios.length} (esperado 201)`);
    }
  }
}

console.log(`✅ Administraciones: ${Object.keys(result).length}`);
console.log(`✅ Tarifas totales:  ${totalTarifas}`);
console.log(`✅ Ejemplo QUERÉTARO/DOMÉSTICA MEDIO:`);
const ej = result['QUERÉTARO']?.['DOMÉSTICA MEDIO'];
if (ej) {
  console.log(`   precios[0]       = ${ej.precios[0]}`);
  console.log(`   precios[15]      = ${ej.precios[15]}`);
  console.log(`   precios[200]     = ${ej.precios[200]}`);
  console.log(`   precioBase200    = ${ej.precioBase200}`);
  console.log(`   precioM3Adicional= ${ej.precioM3Adicional}`);
  console.log(`   tasa             = ${ej.tasa}`);
}

// ── Escritura ─────────────────────────────────────────────────────────────────

fs.writeFileSync(OUT_PATH, JSON.stringify(result, null, 0));
console.log(`\n📦 Escrito en ${OUT_PATH} (${(fs.statSync(OUT_PATH).size / 1024).toFixed(1)} KB)`);

// ── Utilidad: parsear línea CSV respetando comillas ───────────────────────────

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
