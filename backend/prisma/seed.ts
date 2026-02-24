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

  // Contratos (sin medidor asignado para seed mínimo; se pueden añadir medidores después)
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

  console.log('Seed completado: administraciones, zonas, distritos, factibilidades, construcciones, tomas, rutas, contratos.');
}

async function seedUser() {
  const hash = await bcrypt.hash('demo123', 10);
  await prisma.user.upsert({
    where: { email: 'demo@ctcf.local' },
    update: {},
    create: {
      email: 'demo@ctcf.local',
      passwordHash: hash,
      name: 'Usuario Demo',
      administracionIds: ['ADM01'],
      zonaIds: ['Z001', 'Z002'],
    },
  });
  console.log('Usuario demo creado: demo@ctcf.local / demo123');
}

main()
  .then(() => seedUser())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
