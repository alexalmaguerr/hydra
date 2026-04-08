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

main()
  .then(() => seedUser())
  .then(() => seedCatalogoTramites())
  .then(() => seedCatalogosOperativos())
  .then(() => seedCatalogosContratacion())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
