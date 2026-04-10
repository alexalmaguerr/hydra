import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Territorial: administraciones y zonas
  await prisma.administracion.upsert({
    where: { id: 'ADM01' },
    update: {},
    create: { id: 'ADM01', nombre: 'CEA Querétaro' },
  });
  await prisma.administracion.upsert({
    where: { id: 'ADM02' },
    update: {},
    create: { id: 'ADM02', nombre: 'Operadora Zibatá' },
  });

  await prisma.zona.upsert({
    where: { id: 'Z001' },
    update: {},
    create: { id: 'Z001', administracionId: 'ADM01', nombre: 'Norte' },
  });
  await prisma.zona.upsert({
    where: { id: 'Z002' },
    update: {},
    create: { id: 'Z002', administracionId: 'ADM01', nombre: 'El Marqués' },
  });
  await prisma.zona.upsert({
    where: { id: 'Z003' },
    update: {},
    create: { id: 'Z003', administracionId: 'ADM01', nombre: 'Corregidora' },
  });

  await prisma.distrito.upsert({
    where: { id: 'DIST01' },
    update: {},
    create: { id: 'DIST01', zonaId: 'Z001', nombre: 'Juriquilla Centro' },
  });
  await prisma.distrito.upsert({
    where: { id: 'DIST02' },
    update: {},
    create: { id: 'DIST02', zonaId: 'Z001', nombre: 'Juriquilla Norte' },
  });

  // Factibilidades
  await prisma.factibilidad.upsert({
    where: { id: 'F001' },
    update: {},
    create: {
      id: 'F001',
      predio: 'Lote 23-A Juriquilla',
      solicitante: 'Carlos Mendoza',
      direccion: 'Av. Juriquilla 450',
      estado: 'Aprobada',
      fecha: '2025-01-15',
      notas: 'Zona con infraestructura disponible',
    },
  });
  await prisma.factibilidad.upsert({
    where: { id: 'F002' },
    update: {},
    create: {
      id: 'F002',
      predio: 'Manzana 5 El Marqués',
      solicitante: 'María López',
      direccion: 'Calle Norte 120',
      estado: 'En comité',
      fecha: '2025-02-01',
      notas: 'Pendiente dictamen técnico',
    },
  });

  // Construcciones
  await prisma.construccion.upsert({
    where: { id: 'C001' },
    update: {},
    create: {
      id: 'C001',
      factibilidadId: 'F001',
      nombre: 'Red hidráulica Juriquilla Ph2',
      ubicacion: 'Juriquilla',
      estado: 'Finalizada',
      fecha: '2025-01-20',
    },
  });

  // Tomas
  await prisma.toma.upsert({
    where: { id: 'T001' },
    update: {},
    create: {
      id: 'T001',
      construccionId: 'C001',
      ubicacion: 'Juriquilla Lote 23-A #1',
      tipo: 'Agua',
      estado: 'Asignada',
    },
  });
  await prisma.toma.upsert({
    where: { id: 'T002' },
    update: {},
    create: {
      id: 'T002',
      construccionId: 'C001',
      ubicacion: 'Juriquilla Lote 23-A #2',
      tipo: 'Agua',
      estado: 'Disponible',
    },
  });

  // Rutas
  await prisma.ruta.upsert({
    where: { id: 'R001' },
    update: {},
    create: {
      id: 'R001',
      zonaId: 'Z001',
      sector: 'Juriquilla',
      libreta: 'LIB-001',
      lecturista: 'Pedro Ramírez',
    },
  });

  // Contratos
  await prisma.contrato.upsert({
    where: { id: 'CT001' },
    update: {},
    create: {
      id: 'CT001',
      tomaId: 'T001',
      tipoContrato: 'Agua',
      tipoServicio: 'Doméstico',
      nombre: 'Juan Pérez García',
      rfc: 'PEGJ800101XXX',
      direccion: 'Juriquilla Lote 23-A #1',
      contacto: '442-111-2233',
      estado: 'Activo',
      fecha: '2025-01-25',
      rutaId: 'R001',
      zonaId: 'Z001',
      domiciliado: true,
    },
  });
  await prisma.contrato.upsert({
    where: { id: 'CT002' },
    update: {},
    create: {
      id: 'CT002',
      tomaId: 'T002',
      tipoContrato: 'Agua',
      tipoServicio: 'Doméstico',
      nombre: 'María López',
      rfc: 'LOM850202YYY',
      direccion: 'Juriquilla Lote 23-A #2',
      contacto: '442-222-3344',
      estado: 'Activo',
      fecha: '2025-01-26',
      rutaId: 'R001',
      zonaId: 'Z001',
      domiciliado: false,
    },
  });

  // ---- Datos de portal para CT001 ----

  // Consumos (últimos 3 meses)
  await prisma.consumo.upsert({
    where: { id: 'CON001' },
    update: {},
    create: {
      id: 'CON001',
      contratoId: 'CT001',
      periodo: '2024-12',
      m3: 18,
      tipo: 'Real',
      confirmado: true,
    },
  });
  await prisma.consumo.upsert({
    where: { id: 'CON002' },
    update: {},
    create: {
      id: 'CON002',
      contratoId: 'CT001',
      periodo: '2025-01',
      m3: 21,
      tipo: 'Real',
      confirmado: true,
    },
  });
  await prisma.consumo.upsert({
    where: { id: 'CON003' },
    update: {},
    create: {
      id: 'CON003',
      contratoId: 'CT001',
      periodo: '2025-02',
      m3: 19,
      tipo: 'Real',
      confirmado: false,
    },
  });

  // Timbrado 1 — pagado (dic 2024)
  await prisma.timbrado.upsert({
    where: { id: 'TIM001' },
    update: {},
    create: {
      id: 'TIM001',
      contratoId: 'CT001',
      consumoId: 'CON001',
      uuid: 'a1b2c3d4-0001-0001-0001-000000000001',
      estado: 'Timbrada OK',
      periodo: '2024-12',
      subtotal: 360.00,
      iva: 57.60,
      total: 417.60,
      fechaEmision: '2025-01-05',
      fechaVencimiento: '2025-01-20',
    },
  });

  // Timbrado 2 — pendiente (ene 2025)
  await prisma.timbrado.upsert({
    where: { id: 'TIM002' },
    update: {},
    create: {
      id: 'TIM002',
      contratoId: 'CT001',
      consumoId: 'CON002',
      uuid: 'a1b2c3d4-0002-0002-0002-000000000002',
      estado: 'Timbrada OK',
      periodo: '2025-01',
      subtotal: 420.00,
      iva: 67.20,
      total: 487.20,
      fechaEmision: '2025-02-05',
      fechaVencimiento: '2025-02-20',
    },
  });

  // Recibo 1 — pagado (saldo 0)
  await prisma.recibo.upsert({
    where: { id: 'REC001' },
    update: {},
    create: {
      id: 'REC001',
      contratoId: 'CT001',
      timbradoId: 'TIM001',
      saldoVigente: 0,
      saldoVencido: 0,
      fechaVencimiento: '2025-01-20',
      impreso: true,
    },
  });

  // Recibo 2 — pendiente
  await prisma.recibo.upsert({
    where: { id: 'REC002' },
    update: {},
    create: {
      id: 'REC002',
      contratoId: 'CT001',
      timbradoId: 'TIM002',
      saldoVigente: 487.20,
      saldoVencido: 0,
      fechaVencimiento: '2025-02-20',
      impreso: false,
    },
  });

  // Pago histórico para dic 2024
  await prisma.pago.upsert({
    where: { id: 'PAG001' },
    update: {},
    create: {
      id: 'PAG001',
      contratoId: 'CT001',
      reciboId: 'REC001',
      timbradoId: 'TIM001',
      monto: 417.60,
      fecha: '2025-01-18',
      tipo: 'Transferencia',
      concepto: 'Pago factura dic 2024',
      origen: 'nativo',
    },
  });

  console.log('Seed completado: administraciones, zonas, distritos, factibilidades, construcciones, tomas, rutas, contratos, consumos, timbrados, recibos, pagos.');
}

async function seedUser() {
  const hash = await bcrypt.hash('demo123', 10);

  await prisma.user.upsert({
    where: { email: 'demo@ctcf.local' },
    update: { role: 'SUPER_ADMIN' },
    create: {
      email: 'demo@ctcf.local',
      passwordHash: hash,
      name: 'Usuario Demo',
      role: 'SUPER_ADMIN',
      administracionIds: ['ADM01'],
      zonaIds: ['Z001', 'Z002'],
      contratoIds: [],
    },
  });

  await prisma.user.upsert({
    where: { email: 'operador@ctcf.local' },
    update: {},
    create: {
      email: 'operador@ctcf.local',
      passwordHash: hash,
      name: 'Usuario Operador',
      role: 'OPERADOR',
      administracionIds: ['ADM01'],
      zonaIds: ['Z001'],
      contratoIds: [],
    },
  });

  await prisma.user.upsert({
    where: { email: 'lecturista@ctcf.local' },
    update: {},
    create: {
      email: 'lecturista@ctcf.local',
      passwordHash: hash,
      name: 'Usuario Lecturista',
      role: 'LECTURISTA',
      administracionIds: ['ADM01'],
      zonaIds: ['Z001'],
      contratoIds: [],
    },
  });

  await prisma.user.upsert({
    where: { email: 'atencion@ctcf.local' },
    update: {},
    create: {
      email: 'atencion@ctcf.local',
      passwordHash: hash,
      name: 'Atención Clientes',
      role: 'ATENCION_CLIENTES',
      administracionIds: ['ADM01'],
      zonaIds: ['Z001', 'Z002'],
      contratoIds: [],
    },
  });

  await prisma.user.upsert({
    where: { email: 'cliente@ctcf.local' },
    update: { contratoIds: ['CT001', 'CT002'] },
    create: {
      email: 'cliente@ctcf.local',
      passwordHash: hash,
      name: 'Cliente Demo',
      role: 'CLIENTE',
      administracionIds: [],
      zonaIds: [],
      contratoIds: ['CT001', 'CT002'],
    },
  });

  console.log('Usuarios creados: demo (SUPER_ADMIN), operador (OPERADOR), lecturista (LECTURISTA), atencion (ATENCION_CLIENTES), cliente (CLIENTE) — todos con contraseña demo123');
}

async function seedCatalogoTramites() {
  const tipos = [
    {
      tipo: 'Alta',
      descripcion: 'Alta de nuevo servicio de agua potable y/o saneamiento',
      tipoFirma: 'autografa',
      documentosRequeridos: [
        { nombre: 'Identificación oficial', requerido: true },
        { nombre: 'Comprobante de domicilio', requerido: true },
        { nombre: 'Escritura o título de propiedad', requerido: true },
        { nombre: 'CURP', requerido: false },
      ],
    },
    {
      tipo: 'Baja Temporal',
      descripcion: 'Suspensión temporal del servicio a solicitud del titular',
      tipoFirma: 'ambas',
      documentosRequeridos: [
        { nombre: 'Identificación oficial', requerido: true },
        { nombre: 'Solicitud de baja temporal', requerido: true },
        { nombre: 'Estado de cuenta sin adeudos', requerido: true },
      ],
    },
    {
      tipo: 'Baja Definitiva',
      descripcion: 'Cancelación definitiva del servicio',
      tipoFirma: 'autografa',
      documentosRequeridos: [
        { nombre: 'Identificación oficial', requerido: true },
        { nombre: 'Solicitud de baja definitiva', requerido: true },
        { nombre: 'Estado de cuenta sin adeudos', requerido: true },
        { nombre: 'Croquis de ubicación de toma', requerido: false },
      ],
    },
    {
      tipo: 'Cambio Propietario',
      descripcion: 'Cambio de titular del contrato de servicio',
      tipoFirma: 'autografa',
      documentosRequeridos: [
        { nombre: 'Identificación oficial del nuevo propietario', requerido: true },
        { nombre: 'Escritura o contrato de compra-venta', requerido: true },
        { nombre: 'Estado de cuenta sin adeudos', requerido: true },
        { nombre: 'Comprobante de domicilio del nuevo propietario', requerido: false },
      ],
    },
    {
      tipo: 'Reconexion',
      descripcion: 'Reconexión del servicio después de corte por adeudo u otro motivo',
      tipoFirma: 'ambas',
      documentosRequeridos: [
        { nombre: 'Comprobante de pago del adeudo', requerido: true },
        { nombre: 'Identificación oficial', requerido: false },
      ],
    },
    {
      tipo: 'CambioNombre',
      descripcion: 'Corrección o actualización del nombre en el contrato',
      tipoFirma: 'ambas',
      documentosRequeridos: [
        { nombre: 'Identificación oficial', requerido: true },
        { nombre: 'Acta de nacimiento o escritura (si aplica)', requerido: false },
      ],
    },
    {
      tipo: 'CambioTarifa',
      descripcion: 'Cambio de tarifa o tipo de servicio',
      tipoFirma: 'autografa',
      documentosRequeridos: [
        { nombre: 'Solicitud de cambio de tarifa', requerido: true },
        { nombre: 'Documentación que acredite nuevo uso', requerido: true },
      ],
    },
  ];

  for (const cat of tipos) {
    await prisma.catalogoTramite.upsert({
      where: { tipo: cat.tipo },
      update: { descripcion: cat.descripcion, tipoFirma: cat.tipoFirma, documentosRequeridos: cat.documentosRequeridos },
      create: {
        tipo: cat.tipo,
        descripcion: cat.descripcion,
        tipoFirma: cat.tipoFirma,
        documentosRequeridos: cat.documentosRequeridos,
      },
    });
  }
  console.log('Catálogo de trámites sembrado:', tipos.map(t => t.tipo).join(', '));
}

async function seedCatalogosOperativos() {
  // Tipos de corte (T11 — CatalogoTipoCorte)
  const tiposCorte = [
    { codigo: 'DEUDA', descripcion: 'Corte por adeudo', impacto: 'suspensión_total', requiereCuadrilla: true },
    { codigo: 'BAJA_TEMP', descripcion: 'Baja temporal', impacto: 'suspensión_total', requiereCuadrilla: true },
    { codigo: 'ADMIN', descripcion: 'Corte administrativo', impacto: 'solo_registro', requiereCuadrilla: false },
    { codigo: 'FUGA', descripcion: 'Corte por fuga', impacto: 'suspensión_total', requiereCuadrilla: true },
  ];
  for (const tc of tiposCorte) {
    await prisma.catalogoTipoCorte.upsert({
      where: { codigo: tc.codigo },
      update: { descripcion: tc.descripcion, impacto: tc.impacto, requiereCuadrilla: tc.requiereCuadrilla },
      create: tc,
    });
  }
  console.log('Tipos de corte sembrados:', tiposCorte.map(t => t.codigo).join(', '));

  // Tipos de suministro (T11 — CatalogoTipoSuministro)
  const tiposSuministro = [
    { codigo: 'AGUA', descripcion: 'Agua potable' },
    { codigo: 'SANEAMIENTO', descripcion: 'Saneamiento' },
    { codigo: 'ALCANTARILLADO', descripcion: 'Alcantarillado' },
    { codigo: 'MIXTO', descripcion: 'Agua potable + Saneamiento' },
  ];
  for (const ts of tiposSuministro) {
    await prisma.catalogoTipoSuministro.upsert({
      where: { codigo: ts.codigo },
      update: { descripcion: ts.descripcion },
      create: ts,
    });
  }
  console.log('Tipos de suministro sembrados:', tiposSuministro.map(t => t.codigo).join(', '));

  // Estructuras técnicas (T11 — CatalogoEstructuraTecnica)
  const estructuras = [
    { codigo: 'DOM_IND', descripcion: 'Domiciliaria individual' },
    { codigo: 'DOM_COND', descripcion: 'Domiciliaria condominial' },
    { codigo: 'COM_IND', descripcion: 'Comercial individual' },
    { codigo: 'IND_PESADO', descripcion: 'Industrial pesado' },
    { codigo: 'GOB_PUB', descripcion: 'Gobierno / uso público' },
  ];
  for (const et of estructuras) {
    await prisma.catalogoEstructuraTecnica.upsert({
      where: { codigo: et.codigo },
      update: { descripcion: et.descripcion },
      create: et,
    });
  }
  console.log('Estructuras técnicas sembradas:', estructuras.map(e => e.codigo).join(', '));
}

async function seedCatalogosContratacion() {
  // Tipos de contratación (T13)
  const tiposContratacion = [
    { codigo: 'DOM_HAB', nombre: 'Doméstico Habitacional', requiereMedidor: true },
    { codigo: 'COM', nombre: 'Comercial', requiereMedidor: true },
    { codigo: 'IND', nombre: 'Industrial', requiereMedidor: true },
    { codigo: 'GOB', nombre: 'Gobierno', requiereMedidor: true },
    { codigo: 'MIXTO', nombre: 'Uso Mixto', requiereMedidor: true },
  ];
  for (const tc of tiposContratacion) {
    await prisma.tipoContratacion.upsert({
      where: { codigo: tc.codigo },
      update: { nombre: tc.nombre, requiereMedidor: tc.requiereMedidor },
      create: tc,
    });
  }
  console.log('Tipos de contratación sembrados:', tiposContratacion.map(t => t.codigo).join(', '));

  // Conceptos de cobro (T13)
  const conceptosCobro = [
    { codigo: 'AGUA', nombre: 'Servicio de agua', tipo: 'variable' },
    { codigo: 'SANEAMIENTO', nombre: 'Saneamiento', tipo: 'porcentual' },
    { codigo: 'ALCANTARILLADO', nombre: 'Alcantarillado', tipo: 'fijo' },
    { codigo: 'CONTRATACION', nombre: 'Cargo por contratación', tipo: 'fijo' },
    { codigo: 'RECONEXION', nombre: 'Cargo por reconexión', tipo: 'fijo' },
  ];
  for (const cc of conceptosCobro) {
    await prisma.conceptoCobro.upsert({
      where: { codigo: cc.codigo },
      update: { nombre: cc.nombre, tipo: cc.tipo },
      create: cc,
    });
  }
  console.log('Conceptos de cobro sembrados:', conceptosCobro.map(c => c.codigo).join(', '));

  // Cláusulas contractuales base (T13)
  const clausulas = [
    {
      codigo: 'DERECHOS_USUARIO',
      titulo: 'Derechos del Usuario',
      contenido: 'El usuario tiene derecho a recibir el servicio en condiciones adecuadas de presión, continuidad y calidad conforme a la normativa vigente.',
    },
    {
      codigo: 'OBLIGACIONES_USUARIO',
      titulo: 'Obligaciones del Usuario',
      contenido: 'El usuario está obligado a pagar puntualmente los cargos por servicio, conservar en buen estado las instalaciones y permitir la revisión del medidor.',
    },
    {
      codigo: 'CAUSAS_CORTE',
      titulo: 'Causas de Interrupción del Servicio',
      contenido: 'El organismo operador podrá interrumpir el servicio por falta de pago, mal uso de las instalaciones, fraude o situaciones de emergencia técnica.',
    },
    {
      codigo: 'VIGENCIA',
      titulo: 'Vigencia del Contrato',
      contenido: 'El presente contrato tendrá vigencia indefinida a partir de su firma, pudiendo ser rescindido por cualquiera de las partes con aviso previo de 30 días naturales.',
    },
  ];
  for (const cl of clausulas) {
    await prisma.clausulaContractual.upsert({
      where: { codigo: cl.codigo },
      update: { titulo: cl.titulo, contenido: cl.contenido },
      create: cl,
    });
  }
  console.log('Cláusulas contractuales sembradas:', clausulas.map(c => c.codigo).join(', '));
}

async function seedCatalogosActividadRelacionPS() {
  // ─── Grupos de Actividad (19 grupos CIG2018) ────────────────────────────────
  const grupos = [
    { id: 'GA01', codigo: 'AGRIC', descripcion: 'Agricultura' },
    { id: 'GA02', codigo: 'GANAD', descripcion: 'Ganadería' },
    { id: 'GA03', codigo: 'AGRO', descripcion: 'Agroindustria' },
    { id: 'GA04', codigo: 'PESCA', descripcion: 'Pesca y acuicultura' },
    { id: 'GA05', codigo: 'MINER', descripcion: 'Minería' },
    { id: 'GA06', codigo: 'MANUF', descripcion: 'Manufactura e industria' },
    { id: 'GA07', codigo: 'CONST', descripcion: 'Construcción' },
    { id: 'GA08', codigo: 'COMERC', descripcion: 'Comercio al por mayor' },
    { id: 'GA09', codigo: 'COMERCM', descripcion: 'Comercio al por menor' },
    { id: 'GA10', codigo: 'TRANSP', descripcion: 'Transporte y almacenamiento' },
    { id: 'GA11', codigo: 'HOSPED', descripcion: 'Hospedaje y alimentos' },
    { id: 'GA12', codigo: 'SERV_PROF', descripcion: 'Servicios profesionales' },
    { id: 'GA13', codigo: 'SERV_GOB', descripcion: 'Servicios gubernamentales' },
    { id: 'GA14', codigo: 'EDUC', descripcion: 'Educación' },
    { id: 'GA15', codigo: 'SALUD', descripcion: 'Salud y asistencia social' },
    { id: 'GA16', codigo: 'RECREAC', descripcion: 'Recreación y cultura' },
    { id: 'GA17', codigo: 'RELIG', descripcion: 'Religioso y social' },
    { id: 'GA18', codigo: 'HAB_PRIVADA', descripcion: 'Habitacional privada' },
    { id: 'GA19', codigo: 'USO_MIX', descripcion: 'Uso mixto' },
  ];
  for (const g of grupos) {
    await (prisma as any).catalogoGrupoActividad.upsert({
      where: { codigo: g.codigo },
      update: { descripcion: g.descripcion },
      create: g,
    });
  }
  console.log('Grupos de actividad sembrados:', grupos.length);

  // ─── Actividades principales (subset representativo CIG2018) ────────────────
  const actividades = [
    // Habitacional
    { id: 'ACT001', codigo: 'HAB_UNIFAM', descripcion: 'Habitacional unifamiliar', grupoId: 'GA18' },
    { id: 'ACT002', codigo: 'HAB_MULTIFAM', descripcion: 'Habitacional multifamiliar / condominio', grupoId: 'GA18' },
    { id: 'ACT003', codigo: 'HAB_RURAL', descripcion: 'Habitacional rural', grupoId: 'GA18' },
    { id: 'ACT004', codigo: 'HAB_SOCIAL', descripcion: 'Vivienda de interés social', grupoId: 'GA18' },
    // Comercio
    { id: 'ACT010', codigo: 'COM_TIENDA', descripcion: 'Tienda de abarrotes / miscelánea', grupoId: 'GA09' },
    { id: 'ACT011', codigo: 'COM_FARMACIA', descripcion: 'Farmacia', grupoId: 'GA09' },
    { id: 'ACT012', codigo: 'COM_REST', descripcion: 'Restaurante / fonda / comedor', grupoId: 'GA11' },
    { id: 'ACT013', codigo: 'COM_HOTEL', descripcion: 'Hotel / motel / hostal', grupoId: 'GA11' },
    { id: 'ACT014', codigo: 'COM_OFICINA', descripcion: 'Oficinas comerciales / despachos', grupoId: 'GA12' },
    { id: 'ACT015', codigo: 'COM_PLAZA', descripcion: 'Plaza comercial / centro comercial', grupoId: 'GA08' },
    { id: 'ACT016', codigo: 'COM_LAVAND', descripcion: 'Lavandería', grupoId: 'GA09' },
    { id: 'ACT017', codigo: 'COM_SALON', descripcion: 'Salón de eventos / banquetes', grupoId: 'GA16' },
    { id: 'ACT018', codigo: 'COM_ESTETICA', descripcion: 'Estética / salón de belleza', grupoId: 'GA09' },
    { id: 'ACT019', codigo: 'COM_LAVADO', descripcion: 'Lavado de autos', grupoId: 'GA09' },
    { id: 'ACT020', codigo: 'COM_GAS', descripcion: 'Gasolinera / estación de servicio', grupoId: 'GA09' },
    // Industria
    { id: 'ACT030', codigo: 'IND_ALIM', descripcion: 'Industria alimentaria', grupoId: 'GA06' },
    { id: 'ACT031', codigo: 'IND_TEXTIL', descripcion: 'Industria textil', grupoId: 'GA06' },
    { id: 'ACT032', codigo: 'IND_QUIM', descripcion: 'Industria química / farmacéutica', grupoId: 'GA06' },
    { id: 'ACT033', codigo: 'IND_METAL', descripcion: 'Industria metalmecánica', grupoId: 'GA06' },
    { id: 'ACT034', codigo: 'IND_AUTOM', descripcion: 'Automotriz / autopartes', grupoId: 'GA06' },
    { id: 'ACT035', codigo: 'IND_PLASTICO', descripcion: 'Plásticos y hule', grupoId: 'GA06' },
    { id: 'ACT036', codigo: 'IND_PAPEL', descripcion: 'Papel y cartón', grupoId: 'GA06' },
    // Gobierno y servicios públicos
    { id: 'ACT050', codigo: 'GOB_MPIO', descripcion: 'Presidencia / palacio municipal', grupoId: 'GA13' },
    { id: 'ACT051', codigo: 'GOB_ESCUELA', descripcion: 'Escuela pública (SEP)', grupoId: 'GA14' },
    { id: 'ACT052', codigo: 'GOB_HOSP', descripcion: 'Hospital / clínica pública (IMSS/ISSSTE)', grupoId: 'GA15' },
    { id: 'ACT053', codigo: 'GOB_PARQUE', descripcion: 'Parque / área verde pública', grupoId: 'GA13' },
    { id: 'ACT054', codigo: 'GOB_MERCADO', descripcion: 'Mercado público', grupoId: 'GA13' },
    // Privados no lucrativos
    { id: 'ACT060', codigo: 'PRIV_IGLESIA', descripcion: 'Iglesia / templo / capilla', grupoId: 'GA17' },
    { id: 'ACT061', codigo: 'PRIV_ASOC', descripcion: 'Asociación civil / ONG', grupoId: 'GA17' },
    { id: 'ACT062', codigo: 'PRIV_CLUB', descripcion: 'Club deportivo privado', grupoId: 'GA16' },
    // Construcción
    { id: 'ACT070', codigo: 'CONST_OBRA', descripcion: 'Obra en construcción / provisional', grupoId: 'GA07' },
    // Agropecuario
    { id: 'ACT080', codigo: 'AGRO_RIEGO', descripcion: 'Riego agrícola', grupoId: 'GA01' },
    { id: 'ACT081', codigo: 'AGRO_GRANJA', descripcion: 'Granja / rancho ganadero', grupoId: 'GA02' },
    // Mixto
    { id: 'ACT090', codigo: 'MIX_COMHAB', descripcion: 'Uso mixto (comercio + habitacional)', grupoId: 'GA19' },
  ];
  for (const a of actividades) {
    await (prisma as any).catalogoActividad.upsert({
      where: { codigo: a.codigo },
      update: { descripcion: a.descripcion, grupoId: a.grupoId },
      create: a,
    });
  }
  console.log('Actividades sembradas:', actividades.length);

  // ─── Categorías de Contrato (21 categorías CIG2018) ─────────────────────────
  const categorias = [
    { id: 'CAT01', codigo: 'DOM_A', descripcion: 'Doméstico A (0–10 m³)' },
    { id: 'CAT02', codigo: 'DOM_B', descripcion: 'Doméstico B (11–20 m³)' },
    { id: 'CAT03', codigo: 'DOM_C', descripcion: 'Doméstico C (21–30 m³)' },
    { id: 'CAT04', codigo: 'DOM_D', descripcion: 'Doméstico D (>30 m³)' },
    { id: 'CAT05', codigo: 'COM_PEQ', descripcion: 'Comercial pequeño' },
    { id: 'CAT06', codigo: 'COM_MED', descripcion: 'Comercial mediano' },
    { id: 'CAT07', codigo: 'COM_GDE', descripcion: 'Comercial grande' },
    { id: 'CAT08', codigo: 'IND_PEQ', descripcion: 'Industrial pequeño' },
    { id: 'CAT09', codigo: 'IND_MED', descripcion: 'Industrial mediano' },
    { id: 'CAT10', codigo: 'IND_GDE', descripcion: 'Industrial grande' },
    { id: 'CAT11', codigo: 'GOB_FED', descripcion: 'Gobierno federal' },
    { id: 'CAT12', codigo: 'GOB_ESTATAL', descripcion: 'Gobierno estatal' },
    { id: 'CAT13', codigo: 'GOB_MPAL', descripcion: 'Gobierno municipal' },
    { id: 'CAT14', codigo: 'SERV_PUB', descripcion: 'Servicio público (escuelas, hospitales)' },
    { id: 'CAT15', codigo: 'SOCIAL', descripcion: 'Interés social (vivienda / subsidio)' },
    { id: 'CAT16', codigo: 'RELIG', descripcion: 'Religioso / sin fines de lucro' },
    { id: 'CAT17', codigo: 'AGRO', descripcion: 'Agropecuario / riego' },
    { id: 'CAT18', codigo: 'CONST_PROV', descripcion: 'Construcción provisional' },
    { id: 'CAT19', codigo: 'MIXTO', descripcion: 'Uso mixto' },
    { id: 'CAT20', codigo: 'CONDOM', descripcion: 'Condominial / medidor maestro' },
    { id: 'CAT21', codigo: 'ESPECIAL', descripcion: 'Tarifa especial / convenio' },
  ];
  for (const c of categorias) {
    await (prisma as any).catalogoCategoria.upsert({
      where: { codigo: c.codigo },
      update: { descripcion: c.descripcion },
      create: c,
    });
  }
  console.log('Categorías de contrato sembradas:', categorias.length);

  // ─── Tipos de Relación Padre-Hijo PS (P10 – 6 tipos CIG2018) ────────────────
  const tiposRelacionPS = [
    {
      id: 'TRP01',
      codigo: 'CONDOM_MAESTRO',
      descripcion: 'Medidor maestro condominial',
      metodo: 'proporcional',
      reparteConsumo: true,
    },
    {
      id: 'TRP02',
      codigo: 'CONDOM_INDIVIDUAL',
      descripcion: 'Unidad condominial individual',
      metodo: 'individual',
      reparteConsumo: false,
    },
    {
      id: 'TRP03',
      codigo: 'SUBMEDICION',
      descripcion: 'Sub-medición (toma derivada)',
      metodo: 'diferencia',
      reparteConsumo: true,
    },
    {
      id: 'TRP04',
      codigo: 'RIEGO_COMUN',
      descripcion: 'Área común de riego / jardín',
      metodo: 'porcentual',
      reparteConsumo: true,
    },
    {
      id: 'TRP05',
      codigo: 'USO_MIX_PADRE',
      descripcion: 'Planta baja comercial (padre mixto)',
      metodo: 'individual',
      reparteConsumo: false,
    },
    {
      id: 'TRP06',
      codigo: 'USO_MIX_HIJO',
      descripcion: 'Piso habitacional (hijo mixto)',
      metodo: 'individual',
      reparteConsumo: false,
    },
  ];
  for (const t of tiposRelacionPS) {
    await (prisma as any).catalogoTipoRelacionPS.upsert({
      where: { codigo: t.codigo },
      update: { descripcion: t.descripcion, metodo: t.metodo, reparteConsumo: t.reparteConsumo },
      create: t,
    });
  }
  console.log('Tipos de relación padre-hijo PS sembrados:', tiposRelacionPS.length);
}

async function seedTarifas() {
  const vigenciaDesde = new Date('2026-01-01');

  const tarifas = [
    // AGUA doméstica — escalonada
    { id: 'TAR01', codigo: 'AGUA-DOM-R1', nombre: 'Agua doméstica rango 1 (0-10 m³)', tipoServicio: 'AGUA', tipoCalculo: 'escalonado', rangoMinM3: 0, rangoMaxM3: 10, precioUnitario: 8.50, cuotaFija: null, ivaPct: 16 },
    { id: 'TAR02', codigo: 'AGUA-DOM-R2', nombre: 'Agua doméstica rango 2 (11-20 m³)', tipoServicio: 'AGUA', tipoCalculo: 'escalonado', rangoMinM3: 10, rangoMaxM3: 20, precioUnitario: 12.80, cuotaFija: null, ivaPct: 16 },
    { id: 'TAR03', codigo: 'AGUA-DOM-R3', nombre: 'Agua doméstica rango 3 (21-30 m³)', tipoServicio: 'AGUA', tipoCalculo: 'escalonado', rangoMinM3: 20, rangoMaxM3: 30, precioUnitario: 18.40, cuotaFija: null, ivaPct: 16 },
    { id: 'TAR04', codigo: 'AGUA-DOM-R4', nombre: 'Agua doméstica rango 4 (>30 m³)', tipoServicio: 'AGUA', tipoCalculo: 'escalonado', rangoMinM3: 30, rangoMaxM3: null, precioUnitario: 26.90, cuotaFija: null, ivaPct: 16 },
    // SANEAMIENTO — cargo fijo
    { id: 'TAR05', codigo: 'SAN-FIJO', nombre: 'Saneamiento cargo fijo mensual', tipoServicio: 'SANEAMIENTO', tipoCalculo: 'fijo', rangoMinM3: null, rangoMaxM3: null, precioUnitario: null, cuotaFija: 45.00, ivaPct: 16 },
    // ALCANTARILLADO — variable
    { id: 'TAR06', codigo: 'ALC-VAR', nombre: 'Alcantarillado variable por m³', tipoServicio: 'ALCANTARILLADO', tipoCalculo: 'variable', rangoMinM3: 0, rangoMaxM3: null, precioUnitario: 4.20, cuotaFija: null, ivaPct: 16 },
  ];

  for (const t of tarifas) {
    await prisma.tarifa.upsert({
      where: { id: t.id },
      update: { precioUnitario: t.precioUnitario, cuotaFija: t.cuotaFija, activo: true },
      create: {
        id: t.id,
        codigo: t.codigo,
        nombre: t.nombre,
        tipoServicio: t.tipoServicio,
        tipoCalculo: t.tipoCalculo,
        rangoMinM3: t.rangoMinM3,
        rangoMaxM3: t.rangoMaxM3,
        precioUnitario: t.precioUnitario,
        cuotaFija: t.cuotaFija,
        ivaPct: t.ivaPct,
        vigenciaDesde,
      },
    });
  }
  console.log('Tarifas sembradas:', tarifas.length);
}

async function seedCatalogosMedidor() {
  const marcas = [
    { id: 'MRC01', codigo: 'ELSTER', nombre: 'Elster / Honeywell' },
    { id: 'MRC02', codigo: 'SENSUS', nombre: 'Sensus / Xylem' },
    { id: 'MRC03', codigo: 'ITRON', nombre: 'Itron' },
    { id: 'MRC04', codigo: 'BADGER', nombre: 'Badger Meter' },
    { id: 'MRC05', codigo: 'ZENNER', nombre: 'Zenner' },
    { id: 'MRC06', codigo: 'DIEHL', nombre: 'Diehl Metering' },
    { id: 'MRC07', codigo: 'ARAD', nombre: 'Arad Group' },
    { id: 'MRC08', codigo: 'KAMSTRUP', nombre: 'Kamstrup' },
    { id: 'MRC09', codigo: 'MASTER_METER', nombre: 'Master Meter' },
    { id: 'MRC10', codigo: 'LAO', nombre: 'LAO Industria' },
  ];
  for (const m of marcas) {
    await prisma.catalogoMarcaMedidor.upsert({
      where: { codigo: m.codigo },
      update: { nombre: m.nombre },
      create: m,
    });
  }

  const modelos = [
    { id: 'MOD01', marcaId: 'MRC01', codigo: 'V100', nombre: 'V100 Volumétrico' },
    { id: 'MOD02', marcaId: 'MRC01', codigo: 'S150', nombre: 'S150 Chorro único' },
    { id: 'MOD03', marcaId: 'MRC02', codigo: 'MEITWIN', nombre: 'MeiTwin' },
    { id: 'MOD04', marcaId: 'MRC02', codigo: 'IPERL', nombre: 'iPERL Ultrasónico' },
    { id: 'MOD05', marcaId: 'MRC03', codigo: 'FLODIS', nombre: 'Flodis Chorro único' },
    { id: 'MOD06', marcaId: 'MRC03', codigo: 'AQUADIS', nombre: 'Aquadis+ Volumétrico' },
    { id: 'MOD07', marcaId: 'MRC04', codigo: 'M25', nombre: 'M25 Industrial' },
    { id: 'MOD08', marcaId: 'MRC05', codigo: 'MTKD', nombre: 'MTK-D Doméstico' },
    { id: 'MOD09', marcaId: 'MRC10', codigo: 'LAO_DOM', nombre: 'Doméstico estándar' },
    { id: 'MOD10', marcaId: 'MRC10', codigo: 'LAO_IND', nombre: 'Industrial tipo Woltman' },
  ];
  for (const m of modelos) {
    await prisma.catalogoModeloMedidor.upsert({
      where: { codigo: m.codigo },
      update: { nombre: m.nombre, marcaId: m.marcaId },
      create: m,
    });
  }

  const calibres = [
    { id: 'CAL01', codigo: '1/2"', descripcion: 'Media pulgada (13 mm)', diametroMm: 13 },
    { id: 'CAL02', codigo: '3/4"', descripcion: 'Tres cuartos de pulgada (19 mm)', diametroMm: 19 },
    { id: 'CAL03', codigo: '1"', descripcion: 'Una pulgada (25 mm)', diametroMm: 25 },
    { id: 'CAL04', codigo: '1-1/2"', descripcion: 'Pulgada y media (38 mm)', diametroMm: 38 },
    { id: 'CAL05', codigo: '2"', descripcion: 'Dos pulgadas (50 mm)', diametroMm: 50 },
    { id: 'CAL06', codigo: '3"', descripcion: 'Tres pulgadas (75 mm)', diametroMm: 75 },
    { id: 'CAL07', codigo: '4"', descripcion: 'Cuatro pulgadas (100 mm)', diametroMm: 100 },
    { id: 'CAL08', codigo: '6"', descripcion: 'Seis pulgadas (150 mm)', diametroMm: 150 },
  ];
  for (const c of calibres) {
    await prisma.catalogoCalibre.upsert({
      where: { codigo: c.codigo },
      update: { descripcion: c.descripcion },
      create: c,
    });
  }

  const emplazamientos = [
    { id: 'EMP01', codigo: 'INTERIOR', descripcion: 'Interior del predio' },
    { id: 'EMP02', codigo: 'BANQUETA', descripcion: 'En banqueta / acera' },
    { id: 'EMP03', codigo: 'PARED_EXT', descripcion: 'Pared exterior' },
    { id: 'EMP04', codigo: 'CAJA_REGISTRO', descripcion: 'Caja de registro subterránea' },
    { id: 'EMP05', codigo: 'CUARTO_MAQ', descripcion: 'Cuarto de máquinas' },
    { id: 'EMP06', codigo: 'SOTANO', descripcion: 'Sótano' },
  ];
  for (const e of emplazamientos) {
    await prisma.catalogoEmplazamiento.upsert({
      where: { codigo: e.codigo },
      update: { descripcion: e.descripcion },
      create: e,
    });
  }

  const tiposContador = [
    { id: 'TC01', codigo: 'VOLUMETRICO', descripcion: 'Volumétrico (pistón oscilante)' },
    { id: 'TC02', codigo: 'CHORRO_UNICO', descripcion: 'Chorro único (velocidad)' },
    { id: 'TC03', codigo: 'CHORRO_MULTIPLE', descripcion: 'Chorro múltiple' },
    { id: 'TC04', codigo: 'WOLTMAN', descripcion: 'Woltman (turbina axial)' },
    { id: 'TC05', codigo: 'ULTRASONICO', descripcion: 'Ultrasónico' },
    { id: 'TC06', codigo: 'ELECTROMAG', descripcion: 'Electromagnético' },
    { id: 'TC07', codigo: 'PROPORCIONAL', descripcion: 'Proporcional / combinado' },
  ];
  for (const tc of tiposContador) {
    await prisma.catalogoTipoContador.upsert({
      where: { codigo: tc.codigo },
      update: { descripcion: tc.descripcion },
      create: tc,
    });
  }

  console.log(
    `Catálogos de medidores sembrados: ${marcas.length} marcas, ${modelos.length} modelos, ${calibres.length} calibres, ${emplazamientos.length} emplazamientos, ${tiposContador.length} tipos`,
  );
}

async function seedFormasPagoOficinas() {
  const formasPago = [
    { id: 'FP01', codigo: 'EFECTIVO', nombre: 'Efectivo en caja', tipoRecaudacion: 'CAJA', aceptaEfectivo: true },
    { id: 'FP02', codigo: 'CHEQUE', nombre: 'Cheque', tipoRecaudacion: 'CAJA', aceptaCheque: true },
    { id: 'FP03', codigo: 'TARJETA_DEB', nombre: 'Tarjeta de débito', tipoRecaudacion: 'CAJA', aceptaTarjeta: true },
    { id: 'FP04', codigo: 'TARJETA_CRED', nombre: 'Tarjeta de crédito', tipoRecaudacion: 'CAJA', aceptaTarjeta: true },
    { id: 'FP05', codigo: 'SPEI', nombre: 'Transferencia SPEI', tipoRecaudacion: 'BANCO', aceptaTransf: true, requiereReferencia: true },
    { id: 'FP06', codigo: 'DOMICILIACION', nombre: 'Domiciliación bancaria', tipoRecaudacion: 'DOMICILIACION', aceptaTransf: true, requiereReferencia: true },
    { id: 'FP07', codigo: 'OXXO', nombre: 'Pago en OXXO', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP08', codigo: 'BANORTE', nombre: 'Pago en Banorte', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP09', codigo: 'BBVA', nombre: 'Pago en BBVA', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP10', codigo: 'SANTANDER', nombre: 'Pago en Santander', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP11', codigo: 'BANAMEX', nombre: 'Pago en Citibanamex', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP12', codigo: 'SCOTIABANK', nombre: 'Pago en Scotiabank', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP13', codigo: 'HSBC', nombre: 'Pago en HSBC', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP14', codigo: 'BAJIO', nombre: 'Pago en BanBajío', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP15', codigo: 'AFIRME', nombre: 'Pago en Afirme', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP16', codigo: 'SORIANA', nombre: 'Pago en Soriana', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP17', codigo: 'ELEKTRA', nombre: 'Pago en Elektra', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP18', codigo: 'CODI', nombre: 'CoDi', tipoRecaudacion: 'WEB', aceptaTransf: true },
    { id: 'FP19', codigo: 'WEB_PORTAL', nombre: 'Pago en portal web', tipoRecaudacion: 'WEB', aceptaTarjeta: true },
    { id: 'FP20', codigo: 'AMEX', nombre: 'American Express', tipoRecaudacion: 'EXTERNO', aceptaTarjeta: true, requiereReferencia: true },
    { id: 'FP21', codigo: 'REGALII', nombre: 'Regalii', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP22', codigo: 'SUPERQ', nombre: 'Super Q', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP23', codigo: 'BIMBONET', nombre: 'Bimbonet', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP24', codigo: 'CAJA_FLORENCIA', nombre: 'Caja Florencia', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP25', codigo: 'CAJA_GONZALEZ', nombre: 'Caja González', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP26', codigo: 'CAJA_INMACULADA', nombre: 'Caja Inmaculada', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
    { id: 'FP27', codigo: 'MUNICIPIO_QRO', nombre: 'Municipio de Querétaro', tipoRecaudacion: 'EXTERNO', requiereReferencia: true },
  ];
  for (const fp of formasPago) {
    await prisma.formaPago.upsert({
      where: { codigo: fp.codigo },
      update: { nombre: fp.nombre },
      create: {
        id: fp.id,
        codigo: fp.codigo,
        nombre: fp.nombre,
        tipoRecaudacion: fp.tipoRecaudacion,
        aceptaEfectivo: fp.aceptaEfectivo ?? false,
        aceptaCheque: fp.aceptaCheque ?? false,
        aceptaTarjeta: fp.aceptaTarjeta ?? false,
        aceptaTransf: fp.aceptaTransf ?? false,
        requiereReferencia: fp.requiereReferencia ?? false,
      },
    });
  }
  console.log('Formas de pago sembradas:', formasPago.length);

  const tiposOficina = [
    { id: 'TOF01', codigo: 'CENTRAL', descripcion: 'Oficina central' },
    { id: 'TOF02', codigo: 'MODULO', descripcion: 'Módulo de atención' },
    { id: 'TOF03', codigo: 'SUCURSAL', descripcion: 'Sucursal' },
    { id: 'TOF04', codigo: 'CAJA_EXT', descripcion: 'Punto de recaudación externo' },
  ];
  for (const to of tiposOficina) {
    await prisma.tipoOficina.upsert({
      where: { codigo: to.codigo },
      update: { descripcion: to.descripcion },
      create: to,
    });
  }

  const oficinas = [
    { id: 'OF01', codigo: 'CEA_CENTRAL', nombre: 'Oficina Central CEA', administracionId: 'ADM01', tipoOficinaId: 'TOF01', direccion: 'Blvd. Bernardo Quintana 100, Querétaro' },
    { id: 'OF02', codigo: 'CEA_NORTE', nombre: 'Módulo Norte', administracionId: 'ADM01', tipoOficinaId: 'TOF02', direccion: 'Av. Constituyentes 200, Querétaro' },
    { id: 'OF03', codigo: 'CEA_SUR', nombre: 'Módulo Sur', administracionId: 'ADM01', tipoOficinaId: 'TOF02', direccion: 'Av. 5 de Febrero 1500, Querétaro' },
    { id: 'OF04', codigo: 'CEA_MARQUES', nombre: 'Sucursal El Marqués', administracionId: 'ADM01', tipoOficinaId: 'TOF03', direccion: 'Centro El Marqués' },
  ];
  for (const of_ of oficinas) {
    await prisma.oficina.upsert({
      where: { codigo: of_.codigo },
      update: { nombre: of_.nombre },
      create: of_,
    });
  }
  console.log('Oficinas sembradas:', oficinas.length);
}

async function seedSectoresClasesVariables() {
  const sectores = [
    { id: 'SH01', codigo: 'SEC_CENTRO', nombre: 'Centro', administracionId: 'ADM01' },
    { id: 'SH02', codigo: 'SEC_NORTE', nombre: 'Norte', administracionId: 'ADM01' },
    { id: 'SH03', codigo: 'SEC_SUR', nombre: 'Sur', administracionId: 'ADM01' },
    { id: 'SH04', codigo: 'SEC_PONIENTE', nombre: 'Poniente', administracionId: 'ADM01' },
    { id: 'SH05', codigo: 'SEC_ORIENTE', nombre: 'Oriente', administracionId: 'ADM01' },
    { id: 'SH06', codigo: 'SEC_MARQUES', nombre: 'El Marqués', administracionId: 'ADM01' },
    { id: 'SH07', codigo: 'SEC_CORREGIDORA', nombre: 'Corregidora', administracionId: 'ADM01' },
  ];
  for (const s of sectores) {
    await prisma.sectorHidraulico.upsert({
      where: { codigo: s.codigo },
      update: { nombre: s.nombre },
      create: s,
    });
  }
  console.log('Sectores hidráulicos sembrados:', sectores.length);

  const clases = [
    { id: 'CLC01', codigo: 'AN', descripcion: 'Alta nueva' },
    { id: 'CLC02', codigo: 'CN', descripcion: 'Cambio de nombre / titular' },
    { id: 'CLC03', codigo: 'PB', descripcion: 'Proceso de baja' },
    { id: 'CLC04', codigo: 'BJ', descripcion: 'Baja definitiva' },
    { id: 'CLC05', codigo: 'CT', descripcion: 'Cambio de tipo' },
    { id: 'CLC06', codigo: 'RX', descripcion: 'Reconexión' },
    { id: 'CLC07', codigo: 'BT', descripcion: 'Baja temporal' },
  ];
  for (const c of clases) {
    await prisma.claseContrato.upsert({
      where: { codigo: c.codigo },
      update: { descripcion: c.descripcion },
      create: c,
    });
  }
  console.log('Clases de contrato sembradas:', clases.length);

  const tiposVia = [
    { id: 'TV01', codigo: 'CALLE', descripcion: 'Calle', abreviatura: 'C.' },
    { id: 'TV02', codigo: 'AVENIDA', descripcion: 'Avenida', abreviatura: 'Av.' },
    { id: 'TV03', codigo: 'BOULEVARD', descripcion: 'Boulevard', abreviatura: 'Blvd.' },
    { id: 'TV04', codigo: 'CALZADA', descripcion: 'Calzada', abreviatura: 'Czda.' },
    { id: 'TV05', codigo: 'CERRADA', descripcion: 'Cerrada', abreviatura: 'Cerr.' },
    { id: 'TV06', codigo: 'PRIVADA', descripcion: 'Privada', abreviatura: 'Priv.' },
    { id: 'TV07', codigo: 'ANDADOR', descripcion: 'Andador', abreviatura: 'And.' },
    { id: 'TV08', codigo: 'PROLONGACION', descripcion: 'Prolongación', abreviatura: 'Prol.' },
    { id: 'TV09', codigo: 'CIRCUITO', descripcion: 'Circuito', abreviatura: 'Cto.' },
    { id: 'TV10', codigo: 'CAMINO', descripcion: 'Camino', abreviatura: 'Cam.' },
    { id: 'TV11', codigo: 'CARRETERA', descripcion: 'Carretera', abreviatura: 'Carr.' },
    { id: 'TV12', codigo: 'PASEO', descripcion: 'Paseo', abreviatura: 'Pso.' },
    { id: 'TV13', codigo: 'RETORNO', descripcion: 'Retorno', abreviatura: 'Ret.' },
  ];
  for (const tv of tiposVia) {
    await prisma.tipoVia.upsert({
      where: { codigo: tv.codigo },
      update: { descripcion: tv.descripcion },
      create: tv,
    });
  }
  console.log('Tipos de vía sembrados:', tiposVia.length);

  const tiposVariable = [
    { id: 'TVAR01', codigo: 'DISTANCIA_RED', nombre: 'Distancia a red principal', tipoDato: 'NUMERO', unidad: 'metros' },
    { id: 'TVAR02', codigo: 'DIAMETRO_TOMA', nombre: 'Diámetro de toma', tipoDato: 'LISTA', valoresPosibles: ['1/2"', '3/4"', '1"', '1-1/2"', '2"'] },
    { id: 'TVAR03', codigo: 'PROFUNDIDAD_TOMA', nombre: 'Profundidad de toma', tipoDato: 'NUMERO', unidad: 'metros' },
    { id: 'TVAR04', codigo: 'SUPERFICIE', nombre: 'Superficie del predio', tipoDato: 'NUMERO', unidad: 'm²' },
    { id: 'TVAR05', codigo: 'NUM_DEPARTAMENTOS', nombre: 'Número de departamentos', tipoDato: 'NUMERO' },
    { id: 'TVAR06', codigo: 'TIPO_DESCARGA', nombre: 'Tipo de descarga', tipoDato: 'LISTA', valoresPosibles: ['DOMESTICA', 'INDUSTRIAL', 'MIXTA'] },
    { id: 'TVAR07', codigo: 'GIRO_ACTIVIDAD', nombre: 'Giro de actividad', tipoDato: 'TEXTO' },
    { id: 'TVAR08', codigo: 'REQUIERE_FACTIBILIDAD', nombre: 'Requiere dictamen de factibilidad', tipoDato: 'BOOLEANO' },
    { id: 'TVAR09', codigo: 'PRESION_DISPONIBLE', nombre: 'Presión disponible en red', tipoDato: 'NUMERO', unidad: 'kg/cm²' },
    { id: 'TVAR10', codigo: 'MATERIAL_TUBERIA', nombre: 'Material de tubería', tipoDato: 'LISTA', valoresPosibles: ['PVC', 'CPVC', 'PEAD', 'COBRE', 'GALVANIZADO', 'ACERO'] },
  ];
  for (const tv of tiposVariable) {
    await prisma.tipoVariable.upsert({
      where: { codigo: tv.codigo },
      update: { nombre: tv.nombre },
      create: {
        id: tv.id,
        codigo: tv.codigo,
        nombre: tv.nombre,
        tipoDato: tv.tipoDato,
        unidad: tv.unidad ?? null,
        valoresPosibles: tv.valoresPosibles ?? null,
      },
    });
  }
  console.log('Tipos de variable sembrados:', tiposVariable.length);
}

main()
  .then(() => seedUser())
  .then(() => seedCatalogoTramites())
  .then(() => seedCatalogosOperativos())
  .then(() => seedCatalogosContratacion())
  .then(() => seedCatalogosActividadRelacionPS())
  .then(() => seedTarifas())
  .then(() => seedCatalogosMedidor())
  .then(() => seedFormasPagoOficinas())
  .then(() => seedSectoresClasesVariables())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
