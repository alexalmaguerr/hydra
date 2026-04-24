/**
 * Plantilla PDF de cotización/cuantificación — formato oficial CEA Querétaro.
 *
 * Secciones:
 *  1. Encabezado: org izquierda · Folio / Emisión / Vigencia derecha
 *  2. Contratante
 *  3. Datos del Servicio
 *  4. Requerimientos (cuadrícula 3 columnas)
 *  5. Cuantificación: info de periodos + tabla 8 columnas con IVA
 *  6. Totales: CONTADO / CONVENIO / Condiciones de convenio
 *  7. Observaciones
 *  8. Elaboró
 */
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ConceptoCotizacion } from './cotizacion';
import type { SolicitudRecord, OrdenInspeccionData } from '@/types/solicitudes';

// ── Paleta ─────────────────────────────────────────────────────────────────────

const GRAY_BG = '#e8e8e8';
const BORDER  = '#aaaaaa';
const DARK    = '#111111';
const MUTED   = '#555555';
const ACCENT  = '#1d4ed8';
const IVA_RATE = 0.16;

// ── Estilos ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: DARK,
    paddingTop: 22,
    paddingBottom: 38,
    paddingHorizontal: 26,
  },
  // ── Encabezado ────────────────────────────────────────────────────────────
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orgBlock: { flex: 1 },
  orgName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: ACCENT, marginBottom: 2 },
  orgSub: { fontSize: 7, color: MUTED },
  infoBlock: { alignItems: 'flex-end' },
  infoLine: { flexDirection: 'row', marginBottom: 1 },
  infoLabel: { fontSize: 7.5, color: MUTED, width: 52, textAlign: 'right', marginRight: 4 },
  infoValue: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', width: 72 },
  // ── Fila genérica con borde ───────────────────────────────────────────────
  simpleRow: {
    flexDirection: 'row',
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 2,
  },
  simpleLabel: {
    fontSize: 7,
    color: MUTED,
    width: 90,
    borderRightWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  simpleValue: {
    fontSize: 7.5,
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  // ── Cabecera de sección ────────────────────────────────────────────────────
  sectionHeader: {
    backgroundColor: GRAY_BG,
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    marginTop: 5,
  },
  // ── Cuadrícula info (3 celdas dobles por fila) ────────────────────────────
  gridRow: {
    flexDirection: 'row',
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: BORDER,
  },
  gridCell: {
    flex: 1,
    flexDirection: 'row',
    borderRightWidth: 0.5,
    borderColor: BORDER,
  },
  gridCellLast: {
    flex: 1,
    flexDirection: 'row',
  },
  gridLabel: {
    fontSize: 6.8,
    color: MUTED,
    width: 72,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRightWidth: 0.5,
    borderColor: BORDER,
  },
  gridValue: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    flex: 1,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  // ── Tabla de conceptos ────────────────────────────────────────────────────
  tableWrap: { marginTop: 6 },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: GRAY_BG },
  tableRow: { flexDirection: 'row' },
  tableRowAlt: { flexDirection: 'row', backgroundColor: '#f9fafb' },
  tableTotalRow: { flexDirection: 'row', backgroundColor: '#eef0f4' },
  th: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
    paddingVertical: 3,
    paddingHorizontal: 3,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  td: {
    fontSize: 7,
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  tdR: {
    fontSize: 7,
    textAlign: 'right',
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  // ── Sección de pago ───────────────────────────────────────────────────────
  paySection: { marginTop: 8, flexDirection: 'row', gap: 8 },
  payTable: { flex: 1 },
  payHeaderRow: { flexDirection: 'row' },
  payRow: { flexDirection: 'row' },
  payLabelCell: {
    fontSize: 7,
    color: MUTED,
    width: 50,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  payHeaderCell: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    backgroundColor: GRAY_BG,
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  payCell: {
    fontSize: 7,
    textAlign: 'right',
    flex: 1,
    paddingVertical: 2,
    paddingHorizontal: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  convenioBlock: { flex: 1.8 },
  convenioHeader: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'center',
    backgroundColor: GRAY_BG,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderWidth: 0.5,
    borderColor: BORDER,
    marginBottom: 2,
  },
  convenioRow: { flexDirection: 'row', marginBottom: 1 },
  convenioLabel: { fontSize: 7, color: MUTED, flex: 1.4, paddingLeft: 2 },
  convenioValue: { fontSize: 7, fontFamily: 'Helvetica-Bold', flex: 1, textAlign: 'right' },
  // ── Observaciones ─────────────────────────────────────────────────────────
  obsBox: {
    borderWidth: 0.5,
    borderColor: BORDER,
    paddingHorizontal: 6,
    paddingVertical: 6,
    minHeight: 36,
    fontSize: 7.5,
    color: MUTED,
    marginTop: 2,
  },
  // ── Elaboró ───────────────────────────────────────────────────────────────
  elaboroRow: {
    flexDirection: 'row',
    marginTop: 10,
    alignItems: 'flex-start',
  },
  elaboroLabel: { fontSize: 7.5, color: MUTED, width: 50 },
  elaboroLine: { flex: 1, borderBottomWidth: 0.5, borderColor: BORDER, paddingBottom: 2 },
  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    bottom: 14,
    left: 26,
    right: 26,
    borderTopWidth: 0.5,
    borderColor: '#cccccc',
    paddingTop: 4,
  },
  footerText: { fontSize: 6.5, color: '#aaaaaa', textAlign: 'center' },
});

// ── Formateadores ──────────────────────────────────────────────────────────────

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const MATERIAL_LABEL: Record<string, string> = {
  empedrado: 'Empedrado',
  concreto_hidraulico: 'Concreto hidráulico',
  concreto_asfaltico: 'Concreto asfáltico',
  concreto: 'Concreto',
  tierra: 'Tierra',
  adoquin: 'Adoquín',
  otro: 'Otro',
};

const TIPO_USO_LABEL: Record<string, string> = {
  domestico: 'Doméstico',
  no_domestico: 'No Doméstico',
  baldio: 'Baldío',
  comercial: 'Comercial',
  industrial: 'Industrial',
};

function dash(v?: string | null): string {
  return v?.trim() || '—';
}

function buildNombre(record: SolicitudRecord): string {
  const fd = record.formData;
  if (fd.propTipoPersona === 'moral') return fd.propRazonSocial || record.propNombreCompleto || '—';
  return [fd.propPaterno, fd.propMaterno, fd.propNombre].filter(Boolean).join(' ')
    || record.propNombreCompleto || '—';
}

function buildDomicilio(record: SolicitudRecord): string {
  const fd = record.formData;
  const parts = [
    fd.predioDir?.calle,
    fd.predioDir?.numExterior ? `#${fd.predioDir.numExterior}` : undefined,
    fd.predioDir?.coloniaINEGIId ? `Col. ${fd.predioDir.coloniaINEGIId}` : undefined,
    fd.predioDir?.municipioINEGIId,
    fd.predioDir?.codigoPostal ? `CP ${fd.predioDir.codigoPostal}` : undefined,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : record.predioResumen;
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function GridRow({ cells }: { cells: [string, string][] }) {
  return (
    <View style={s.gridRow}>
      {cells.map(([label, value], i) => {
        const isLast = i === cells.length - 1;
        return (
          <View key={label} style={isLast ? s.gridCellLast : s.gridCell}>
            <Text style={s.gridLabel}>{label}</Text>
            <Text style={s.gridValue}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── Interfaz pública ───────────────────────────────────────────────────────────

export interface CotizacionPdfProps {
  record: SolicitudRecord;
  ordenData?: OrdenInspeccionData;
  conceptos: ConceptoCotizacion[];
  tipoContratacionNombre?: string;
  fecha?: string;
  observaciones?: string;
  elaboro?: string;
}

// ── Componente ─────────────────────────────────────────────────────────────────

export function CotizacionPdfDocument({
  record,
  ordenData,
  conceptos,
  tipoContratacionNombre,
  fecha,
  observaciones,
  elaboro,
}: CotizacionPdfProps) {
  const fd = record.formData;
  const vars = fd.variablesCapturadas ?? {};
  const od = ordenData; // alias; puede ser undefined → campos muestran '—'

  const fechaDoc = fecha ?? new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const vigenciaDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const vigencia = vigenciaDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const nombre = buildNombre(record);
  const domicilio = buildDomicilio(record);

  // IVA y totales
  const subtotal = conceptos.reduce((s, c) => s + c.subtotal, 0);
  const totalIva = subtotal * IVA_RATE;
  const total = subtotal + totalIva;

  // Datos de requerimientos (de ordenData + variablesCapturadas)
  const tipoServicio = tipoContratacionNombre
    || (od?.tipoUso ? (TIPO_USO_LABEL[od.tipoUso] ?? od.tipoUso) : '—');
  const diametroToma = dash(od?.diametroToma ?? vars.diametroToma);
  const longitudToma = dash(vars.longitudToma ?? vars.longitud_toma);
  const unidadesServicio = dash(vars.unidadesServicio ?? vars.unidades_servicio ?? vars.viviendas);
  const diametroDrenaje = dash(vars.diametroDrenaje ?? vars.diametro_drenaje ?? vars.diametroDscarga);
  const longitudDrenaje = dash(vars.longitudDrenaje ?? vars.longitud_drenaje ?? vars.longitudDescarga);
  const habitantes = dash(fd.personasVivienda || vars.habitantes || vars.personasVivienda);
  const matCalle = od?.materialCalle ? (MATERIAL_LABEL[od.materialCalle] ?? od.materialCalle) : '—';
  const matBanqueta = od?.materialBanqueta ? (MATERIAL_LABEL[od.materialBanqueta] ?? od.materialBanqueta) : '—';

  // Datos de cuantificación / periodos
  const periodoTarifas = dash(vars.periodoTarifas ?? vars.periodo_tarifas);
  const fechaEntrega = dash(vars.fechaEntrega ?? vars.fecha_entrega);
  const periodoInicio = dash(vars.periodoInicio ?? vars.periodo_inicio);
  const periodoFin = dash(vars.periodoFin ?? vars.periodo_fin);
  const meses = dash(vars.meses ?? vars.numeroPeriodos);
  const consumoM3 = dash(vars.consumoM3 ?? vars.consumo_m3 ?? vars.m3);

  return (
    <Document title={`Cotización ${record.folio}`} author="CEA Querétaro">
      <Page size="LETTER" style={s.page}>

        {/* ── 1. Encabezado ─────────────────────────────────────────── */}
        <View style={s.headerRow}>
          <View style={s.orgBlock}>
            <Text style={s.orgName}>CEA Querétaro</Text>
            <Text style={s.orgSub}>Comisión Estatal del Agua — Gobierno del Estado de Querétaro</Text>
          </View>
          <View style={s.infoBlock}>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Folio</Text>
              <Text style={s.infoValue}>{record.folio}</Text>
            </View>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Emisión</Text>
              <Text style={s.infoValue}>{fechaDoc}</Text>
            </View>
            <View style={s.infoLine}>
              <Text style={s.infoLabel}>Vigencia</Text>
              <Text style={s.infoValue}>{vigencia}</Text>
            </View>
          </View>
        </View>

        {/* ── 2. Contratante ────────────────────────────────────────── */}
        <View style={s.simpleRow}>
          <Text style={s.simpleLabel}>Contratante:</Text>
          <Text style={[s.simpleValue, { fontFamily: 'Helvetica-Bold' }]}>{nombre}</Text>
        </View>

        {/* ── 3. Datos del Servicio ─────────────────────────────────── */}
        <Text style={s.sectionHeader}>Datos del Servicio</Text>
        <View style={s.simpleRow}>
          <Text style={s.simpleLabel}>Domicilio</Text>
          <Text style={s.simpleValue}>{domicilio}</Text>
        </View>
        <View style={s.simpleRow}>
          <Text style={s.simpleLabel}>Clave Catastral:</Text>
          <Text style={s.simpleValue}>{dash(fd.claveCatastral)}</Text>
        </View>

        {/* ── 4. Requerimientos ─────────────────────────────────────── */}
        <Text style={s.sectionHeader}>Requerimientos</Text>
        <GridRow cells={[
          ['Tipo de servicio', tipoServicio],
          ['Diámetro Toma', diametroToma],
          ['Longitud Toma', longitudToma],
        ]} />
        <GridRow cells={[
          ['Unidades de servicio', unidadesServicio],
          ['Diámetro descarga', diametroDrenaje],
          ['Longitud Descarga', longitudDrenaje],
        ]} />
        <GridRow cells={[
          ['Habitantes', habitantes],
          ['Material calle', matCalle],
          ['Material banqueta', matBanqueta],
        ]} />

        {/* ── 5. Cuantificación ─────────────────────────────────────── */}
        <Text style={s.sectionHeader}>Cuantificación</Text>
        <GridRow cells={[
          ['Periodo de tarifas de contratación', periodoTarifas],
          ['Periodo Inicio', periodoInicio],
          ['Periodo fin', periodoFin],
        ]} />
        <GridRow cells={[
          ['Fecha de entrega de la unidad', fechaEntrega],
          ['Meses', meses],
          ['Consumo M3', consumoM3],
        ]} />

        {/* ── Tabla de conceptos (8 cols) ───────────────────────────── */}
        <View style={s.tableWrap}>
          {/* Header */}
          <View style={s.tableHeaderRow}>
            <Text style={[s.th, { flex: 3 }]}>Concepto</Text>
            <Text style={[s.th, { flex: 1.1 }]}>Precio base</Text>
            <Text style={[s.th, { flex: 0.75 }]}>Cantidad</Text>
            <Text style={[s.th, { flex: 1.1 }]}>Precio adicional</Text>
            <Text style={[s.th, { flex: 0.9 }]}>Cantidad adicional</Text>
            <Text style={[s.th, { flex: 1.1 }]}>Importe</Text>
            <Text style={[s.th, { flex: 1 }]}>IVA</Text>
            <Text style={[s.th, { flex: 1.1 }]}>Total</Text>
          </View>
          {/* Rows */}
          {conceptos.map((c, i) => {
            const iva = c.subtotal * IVA_RATE;
            const rowTotal = c.subtotal + iva;
            const rowStyle = i % 2 === 0 ? s.tableRow : s.tableRowAlt;
            return (
              <View key={c.descripcion} style={rowStyle}>
                <Text style={[s.td, { flex: 3 }]}>{c.descripcion}</Text>
                <Text style={[s.tdR, { flex: 1.1 }]}>{MXN.format(c.precioUnitario)}</Text>
                <Text style={[s.tdR, { flex: 0.75 }]}>{c.cantidad}</Text>
                <Text style={[s.tdR, { flex: 1.1 }]}>—</Text>
                <Text style={[s.tdR, { flex: 0.9 }]}>—</Text>
                <Text style={[s.tdR, { flex: 1.1 }]}>{MXN.format(c.subtotal)}</Text>
                <Text style={[s.tdR, { flex: 1 }]}>{MXN.format(iva)}</Text>
                <Text style={[s.tdR, { flex: 1.1 }]}>{MXN.format(rowTotal)}</Text>
              </View>
            );
          })}
          {/* Total row */}
          <View style={s.tableTotalRow}>
            <Text style={[s.td, { flex: 3 + 1.1 + 0.75 + 1.1 + 0.9, fontFamily: 'Helvetica-Bold', textAlign: 'right' }]}>
              TOTAL
            </Text>
            <Text style={[s.tdR, { flex: 1.1, fontFamily: 'Helvetica-Bold' }]}>{MXN.format(subtotal)}</Text>
            <Text style={[s.tdR, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{MXN.format(totalIva)}</Text>
            <Text style={[s.tdR, { flex: 1.1, fontFamily: 'Helvetica-Bold', color: ACCENT }]}>{MXN.format(total)}</Text>
          </View>
        </View>

        {/* ── 6. Sección de pago ────────────────────────────────────── */}
        <View style={s.paySection}>
          {/* CONTADO / CONVENIO table */}
          <View style={s.payTable}>
            <View style={s.payHeaderRow}>
              <Text style={[s.payLabelCell, { borderColor: 'transparent', backgroundColor: 'transparent' }]}> </Text>
              <Text style={s.payHeaderCell}>CONTADO</Text>
              <Text style={s.payHeaderCell}>CONVENIO</Text>
            </View>
            {[
              ['Subtotal', subtotal],
              ['IVA', totalIva],
              ['Total', total],
            ].map(([label, val]) => (
              <View key={label as string} style={s.payRow}>
                <Text style={s.payLabelCell}>{label as string}</Text>
                <Text style={s.payCell}>{MXN.format(0)}</Text>
                <Text style={[s.payCell, { fontFamily: 'Helvetica-Bold' }]}>{MXN.format(val as number)}</Text>
              </View>
            ))}
          </View>
          {/* Condiciones de convenio */}
          <View style={s.convenioBlock}>
            <Text style={s.convenioHeader}>CONDICIONES DE CONVENIO DE PAGO</Text>
            <View style={s.convenioRow}>
              <Text style={s.convenioLabel}>Anticipo</Text>
              <Text style={s.convenioValue}>—</Text>
            </View>
            <View style={s.convenioRow}>
              <Text style={s.convenioLabel}>No. parcialidades</Text>
              <Text style={s.convenioValue}>—</Text>
            </View>
            <View style={s.convenioRow}>
              <Text style={s.convenioLabel}>Importe de las parcialidades</Text>
              <Text style={s.convenioValue}>—</Text>
            </View>
          </View>
        </View>

        {/* ── 7. Observaciones ──────────────────────────────────────── */}
        <Text style={[s.sectionHeader, { marginTop: 8 }]}>OBSERVACIONES</Text>
        <Text style={s.obsBox}>
          {observaciones || '* Los precios son estimados y pueden ajustarse según las condiciones del terreno. Vigencia de la cotización: 5 días hábiles.'}
        </Text>

        {/* ── 8. Elaboró ────────────────────────────────────────────── */}
        <View style={s.elaboroRow}>
          <Text style={s.elaboroLabel}>Elaboró:</Text>
          <Text style={s.elaboroLine}>{elaboro ?? '  CEA Querétaro'}</Text>
        </View>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <View style={s.footer}>
          <Text style={s.footerText}>
            CEA Querétaro — Sistema de Gestión de Agua Potable | Folio {record.folio} | {fechaDoc}
          </Text>
        </View>

      </Page>
    </Document>
  );
}
