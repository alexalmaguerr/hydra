/** Datos extraídos del archivo interno `Catálogos del SAT.xlsx` (hojas Régimen Fiscal, Uso del CFDI). */

export const SAT_VIGENCIA_INICIO = new Date(Date.UTC(2022, 0, 1));

export interface RegimenFiscalSatRow {
  clave: string;
  descripcion: string;
  aplicaFisica: boolean;
  aplicaMoral: boolean;
}

export interface UsoCfdiSatRow {
  clave: string;
  descripcion: string;
  aplicaFisica: boolean;
  aplicaMoral: boolean;
  regimenesReceptorPermitidos: string | null;
}

export const REGIMEN_FISCAL_SAT: RegimenFiscalSatRow[] = [
  { clave: '601', descripcion: 'General de Ley Personas Morales', aplicaFisica: false, aplicaMoral: true },
  { clave: '603', descripcion: 'Personas Morales con Fines no Lucrativos', aplicaFisica: false, aplicaMoral: true },
  {
    clave: '605',
    descripcion: 'Sueldos y Salarios e Ingresos Asimilados a Salarios',
    aplicaFisica: true,
    aplicaMoral: false,
  },
  { clave: '606', descripcion: 'Arrendamiento', aplicaFisica: true, aplicaMoral: false },
  { clave: '607', descripcion: 'Régimen de Enajenación o Adquisición de Bienes', aplicaFisica: true, aplicaMoral: false },
  { clave: '608', descripcion: 'Demás ingresos', aplicaFisica: true, aplicaMoral: false },
  {
    clave: '610',
    descripcion: 'Residentes en el Extranjero sin Establecimiento Permanente en México',
    aplicaFisica: true,
    aplicaMoral: true,
  },
  { clave: '611', descripcion: 'Ingresos por Dividendos (socios y accionistas)', aplicaFisica: true, aplicaMoral: false },
  {
    clave: '612',
    descripcion: 'Personas Físicas con Actividades Empresariales y Profesionales',
    aplicaFisica: true,
    aplicaMoral: false,
  },
  { clave: '614', descripcion: 'Ingresos por intereses', aplicaFisica: true, aplicaMoral: false },
  { clave: '615', descripcion: 'Régimen de los ingresos por obtención de premios', aplicaFisica: true, aplicaMoral: false },
  { clave: '616', descripcion: 'Sin obligaciones fiscales', aplicaFisica: true, aplicaMoral: false },
  {
    clave: '620',
    descripcion: 'Sociedades Cooperativas de Producción que optan por diferir sus ingresos',
    aplicaFisica: false,
    aplicaMoral: true,
  },
  { clave: '621', descripcion: 'Incorporación Fiscal', aplicaFisica: true, aplicaMoral: false },
  {
    clave: '622',
    descripcion: 'Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras',
    aplicaFisica: false,
    aplicaMoral: true,
  },
  { clave: '623', descripcion: 'Opcional para Grupos de Sociedades', aplicaFisica: false, aplicaMoral: true },
  { clave: '624', descripcion: 'Coordinados', aplicaFisica: false, aplicaMoral: true },
  {
    clave: '625',
    descripcion: 'Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas',
    aplicaFisica: true,
    aplicaMoral: false,
  },
  { clave: '626', descripcion: 'Régimen Simplificado de Confianza', aplicaFisica: true, aplicaMoral: true },
];

export const USO_CFDI_SAT: UsoCfdiSatRow[] = [
  {
    clave: 'G01',
    descripcion: 'Adquisición de mercancías.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625,626',
  },
  {
    clave: 'G02',
    descripcion: 'Devoluciones, descuentos o bonificaciones.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 616, 620, 621, 622, 623, 624, 625,626',
  },
  {
    clave: 'G03',
    descripcion: 'Gastos en general.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I01',
    descripcion: 'Construcciones.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I02',
    descripcion: 'Mobiliario y equipo de oficina por inversiones.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I03',
    descripcion: 'Equipo de transporte.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I04',
    descripcion: 'Equipo de computo y accesorios.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I05',
    descripcion: 'Dados, troqueles, moldes, matrices y herramental.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I06',
    descripcion: 'Comunicaciones telefónicas.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I07',
    descripcion: 'Comunicaciones satelitales.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'I08',
    descripcion: 'Otra maquinaria y equipo.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos: '601, 603, 606, 612, 620, 621, 622, 623, 624, 625, 626',
  },
  {
    clave: 'D01',
    descripcion: 'Honorarios médicos, dentales y gastos hospitalarios.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D02',
    descripcion: 'Gastos médicos por incapacidad o discapacidad.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D03',
    descripcion: 'Gastos funerales.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D04',
    descripcion: 'Donativos.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D05',
    descripcion: 'Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación).',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D06',
    descripcion: 'Aportaciones voluntarias al SAR.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D07',
    descripcion: 'Primas por seguros de gastos médicos.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D08',
    descripcion: 'Gastos de transportación escolar obligatoria.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D09',
    descripcion:
      'Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones.',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'D10',
    descripcion: 'Pagos por servicios educativos (colegiaturas).',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605, 606, 608, 611, 612, 614, 607, 615, 625',
  },
  {
    clave: 'S01',
    descripcion: 'Sin efectos fiscales.',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos:
      '601, 603, 605, 606, 608, 610, 611, 612, 614, 616, 620, 621, 622, 623, 624, 607, 615, 625, 626',
  },
  {
    clave: 'CP01',
    descripcion: 'Pagos',
    aplicaFisica: true,
    aplicaMoral: true,
    regimenesReceptorPermitidos:
      '601, 603, 605, 606, 608, 610, 611, 612, 614, 616, 620, 621, 622, 623, 624, 607, 615, 625, 626',
  },
  {
    clave: 'CN01',
    descripcion: 'Nómina',
    aplicaFisica: true,
    aplicaMoral: false,
    regimenesReceptorPermitidos: '605',
  },
];
