import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { Prisma, type PrismaClient } from '@prisma/client';
import { crearHitoInicialSolicitudCompletado } from '../procesos-contratacion/hito-inicial.util';

type PersonaRelacionInput = {
  personaId?: string;
  nombre?: string;
  rfc?: string;
  curp?: string;
  email?: string;
  telefono?: string;
  razonSocial?: string;
  regimenFiscal?: string;
};

/** FK string fields: trim; empty string becomes null (avoids invalid "" references). */
function optionalFkId(value?: string | null): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t.length > 0 ? t : null;
}

function normalizeDocumentosRecibidos(raw?: string[] | null): string[] {
  return Array.from(
    new Set(
      (raw ?? [])
        .map((d) => String(d).trim())
        .filter((d) => d.length > 0),
    ),
  );
}

async function loadNombreDocumentosObligatorios(
  db: Pick<PrismaClient, 'documentoRequeridoTipoContratacion'>,
  tipoContratacionId: string,
): Promise<string[]> {
  const rows = await db.documentoRequeridoTipoContratacion.findMany({
    where: { tipoContratacionId, obligatorio: true },
    select: { nombreDocumento: true },
  });
  return [
    ...new Set(
      rows
        .map((r) => r.nombreDocumento.trim())
        .filter((n) => n.length > 0),
    ),
  ];
}

function assertDocsRecibidosCubrenObligatorios(
  required: string[],
  docsRecibidos: string[],
): void {
  const received = new Set(docsRecibidos);
  const missing = required.filter((n) => !received.has(n));
  if (missing.length > 0) {
    throw new BadRequestException(
      `Faltan documentos obligatorios marcados como recibidos: ${missing.join(', ')}`,
    );
  }
}

// Estados que implican servicio activo
const ESTADOS_ACTIVOS = ['Activo', 'activo'];
// Estados cortados que pueden reconectarse
const ESTADOS_CORTADOS = ['Cortado', 'cortado'];
// Estados de baja que bloquean la mayoria de tramites
const ESTADOS_BAJA = ['BajaTemp', 'BajaDef', 'Baja Temporal', 'Baja Definitiva'];

@Injectable()
export class ContratosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.contrato.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const c = await this.prisma.contrato.findUnique({ where: { id } });
    if (!c) throw new NotFoundException('Contrato no encontrado');
    return c;
  }

  async update(
    id: string,
    dto: {
      ceaNumContrato?: string | null;
      estado?: string;
      domiciliado?: boolean;
      fechaReconexionPrevista?: string | null;
      bloqueadoJuridico?: boolean;
      razonSocial?: string | null;
      regimenFiscal?: string | null;
      constanciaFiscalUrl?: string | null;
      domicilioId?: string | null;
      puntoServicioId?: string | null;
      tipoContratacionId?: string | null;
      // P1 campos adicionales
      fechaBaja?: string | null;
      actividadId?: string | null;
      categoriaId?: string | null;
      referenciaContratoAnterior?: string | null;
      observaciones?: string | null;
      tipoEnvioFactura?: string | null;
      indicadorEmisionRecibo?: boolean;
      indicadorExentarFacturacion?: boolean;
      indicadorContactoCorreo?: boolean;
      cicloFacturacion?: string | null;
      superficiePredio?: number | null;
      superficieConstruida?: number | null;
      mesesAdeudo?: number | null;
      unidadesServidas?: number | null;
      personasHabitanVivienda?: number | null;
      zonaId?: string | null;
      rutaId?: string | null;
    },
  ) {
    await this.findOne(id);
    const prev = await this.prisma.contrato.findUnique({
      where: { id },
      select: { estado: true, zonaId: true, rutaId: true },
    });
    if (!prev) throw new NotFoundException('Contrato no encontrado');

    const mergedZona = dto.zonaId !== undefined ? dto.zonaId : prev.zonaId;
    const mergedRuta = dto.rutaId !== undefined ? dto.rutaId : prev.rutaId;
    const shouldAutoActivo =
      dto.estado === undefined &&
      !!mergedZona &&
      !!mergedRuta &&
      ['Pendiente de zona', 'Pendiente de alta', 'Pendiente de toma'].includes(
        prev.estado ?? '',
      );

    return this.prisma.contrato.update({
      where: { id },
      data: {
        ...(dto.ceaNumContrato !== undefined && { ceaNumContrato: dto.ceaNumContrato }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(shouldAutoActivo && { estado: 'Activo' }),
        ...(dto.domiciliado !== undefined && { domiciliado: dto.domiciliado }),
        ...(dto.fechaReconexionPrevista !== undefined && { fechaReconexionPrevista: dto.fechaReconexionPrevista }),
        ...(dto.bloqueadoJuridico !== undefined && { bloqueadoJuridico: dto.bloqueadoJuridico }),
        ...(dto.razonSocial !== undefined && { razonSocial: dto.razonSocial }),
        ...(dto.regimenFiscal !== undefined && { regimenFiscal: dto.regimenFiscal }),
        ...(dto.constanciaFiscalUrl !== undefined && { constanciaFiscalUrl: dto.constanciaFiscalUrl }),
        ...(dto.domicilioId !== undefined && { domicilioId: dto.domicilioId }),
        ...(dto.puntoServicioId !== undefined && { puntoServicioId: dto.puntoServicioId }),
        ...(dto.tipoContratacionId !== undefined && { tipoContratacionId: dto.tipoContratacionId }),
        ...(dto.fechaBaja !== undefined && { fechaBaja: dto.fechaBaja }),
        ...(dto.actividadId !== undefined && { actividadId: dto.actividadId }),
        ...(dto.categoriaId !== undefined && { categoriaId: dto.categoriaId }),
        ...(dto.referenciaContratoAnterior !== undefined && { referenciaContratoAnterior: dto.referenciaContratoAnterior }),
        ...(dto.observaciones !== undefined && { observaciones: dto.observaciones }),
        ...(dto.tipoEnvioFactura !== undefined && { tipoEnvioFactura: dto.tipoEnvioFactura }),
        ...(dto.indicadorEmisionRecibo !== undefined && { indicadorEmisionRecibo: dto.indicadorEmisionRecibo }),
        ...(dto.indicadorExentarFacturacion !== undefined && { indicadorExentarFacturacion: dto.indicadorExentarFacturacion }),
        ...(dto.indicadorContactoCorreo !== undefined && { indicadorContactoCorreo: dto.indicadorContactoCorreo }),
        ...(dto.cicloFacturacion !== undefined && { cicloFacturacion: dto.cicloFacturacion }),
        ...(dto.superficiePredio !== undefined && { superficiePredio: dto.superficiePredio }),
        ...(dto.superficieConstruida !== undefined && { superficieConstruida: dto.superficieConstruida }),
        ...(dto.mesesAdeudo !== undefined && { mesesAdeudo: dto.mesesAdeudo }),
        ...(dto.unidadesServidas !== undefined && { unidadesServidas: dto.unidadesServidas }),
        ...(dto.personasHabitanVivienda !== undefined && { personasHabitanVivienda: dto.personasHabitanVivienda }),
        ...(dto.zonaId !== undefined && { zonaId: dto.zonaId }),
        ...(dto.rutaId !== undefined && { rutaId: dto.rutaId }),
      },
    });
  }

  async getEstadoOperativo(contratoId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: {
        id: true,
        nombre: true,
        estado: true,
        bloqueadoJuridico: true,
        fechaReconexionPrevista: true,
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const [totalFacturadoAgg, totalPagadoAgg, convenioActivo] = await Promise.all([
      this.prisma.timbrado.aggregate({
        where: { contratoId, estado: 'Timbrada OK' },
        _sum: { total: true },
      }),
      this.prisma.pago.aggregate({
        where: { contratoId },
        _sum: { monto: true },
      }),
      this.prisma.convenio.findFirst({
        where: { contratoId, estado: 'Activo' },
        select: { id: true, estado: true },
      }),
    ]);

    const totalFacturado = Number(totalFacturadoAgg._sum.total ?? 0);
    const totalPagado = Number(totalPagadoAgg._sum.monto ?? 0);
    const montoAdeudo = Math.max(0, totalFacturado - totalPagado);
    const tieneAdeudo = montoAdeudo > 0.01;

    const estadoNorm = contrato.estado ?? '';
    const esCortado = ESTADOS_CORTADOS.some(s => estadoNorm.toLowerCase().includes(s.toLowerCase()));
    const esActivo = ESTADOS_ACTIVOS.some(s => estadoNorm.toLowerCase() === s.toLowerCase());
    const esBaja = ESTADOS_BAJA.some(s => estadoNorm.toLowerCase().includes(s.toLowerCase()));
    const bloqueadoJuridico = contrato.bloqueadoJuridico;

    const alertas: string[] = [];

    if (bloqueadoJuridico) {
      alertas.push('Contrato con bloqueo jurídico. Comuníquese con el área legal antes de realizar cualquier trámite.');
    }
    if (tieneAdeudo && !bloqueadoJuridico) {
      alertas.push(`Adeudo pendiente de $${montoAdeudo.toFixed(2)} MXN. Algunos trámites requieren saldo en cero.`);
    }
    if (esCortado) {
      alertas.push('Servicio actualmente cortado. Para reconexión realice el pago total o convenga parcialidades.');
    }
    if (esBaja) {
      alertas.push('Contrato en proceso de baja. Las operaciones disponibles son limitadas.');
    }

    // Candado: solo puede tramitar alta/cambios de datos si no está bloqueado jurídicamente
    const canTramitar = !bloqueadoJuridico;
    // Reconexión: solo si está cortado (o tiene adeudo pero quiere convenio)
    const canReconectar = !bloqueadoJuridico && (esCortado || tieneAdeudo);
    // Baja temporal/definitiva: requiere adeudo cero
    const canBaja = !tieneAdeudo && !bloqueadoJuridico && !esBaja;
    // Convenios: solo si no está bloqueado jurídicamente
    const canConvenio = !bloqueadoJuridico && tieneAdeudo;

    return {
      contratoId: contrato.id,
      nombre: contrato.nombre,
      estado: contrato.estado,
      bloqueadoJuridico,
      tieneAdeudo,
      montoAdeudo,
      tieneConvenioActivo: !!convenioActivo,
      fechaReconexionPrevista: contrato.fechaReconexionPrevista,
      canTramitar,
      canReconectar,
      canBaja,
      canConvenio,
      alertas,
    };
  }

  async search(query: string, limit = 10) {
    return this.prisma.contrato.findMany({
      where: {
        OR: [
          { nombre: { contains: query, mode: Prisma.QueryMode.insensitive } },
          { id: { contains: query } },
          { rfc: { contains: query } },
          { direccion: { contains: query, mode: Prisma.QueryMode.insensitive } },
        ],
      },
      select: {
        id: true,
        nombre: true,
        rfc: true,
        estado: true,
        tipoServicio: true,
        direccion: true,
      },
      take: limit,
      orderBy: { nombre: 'asc' },
    });
  }

  async getHistorial(contratoId: string) {
    await this.findOne(contratoId);
    return this.prisma.historicoContrato.findMany({
      where: { contratoId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getContextoAtencion(contratoId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: {
        id: true,
        nombre: true,
        rfc: true,
        tipoServicio: true,
        estado: true,
        contacto: true,
        direccion: true,
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const [totalFacturadoAgg, totalPagadoAgg, ultimosPagos, ultimasFacturas, quejasAbiertas] =
      await Promise.all([
        this.prisma.timbrado.aggregate({
          where: { contratoId, estado: 'Timbrada OK' },
          _sum: { total: true },
        }),
        this.prisma.pago.aggregate({
          where: { contratoId },
          _sum: { monto: true },
        }),
        this.prisma.pago.findMany({
          where: { contratoId },
          orderBy: { fecha: 'desc' },
          take: 5,
          select: { id: true, monto: true, fecha: true, tipo: true, concepto: true },
        }),
        this.prisma.timbrado.findMany({
          where: { contratoId },
          orderBy: { fechaEmision: 'desc' },
          take: 3,
          select: { id: true, uuid: true, total: true, estado: true, fechaEmision: true },
        }),
        this.prisma.quejaAclaracion.findMany({
          where: {
            contratoId,
            estado: { notIn: ['Cerrada', 'Cancelada', 'Resuelta'] },
          },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            tipo: true,
            descripcion: true,
            estado: true,
            prioridad: true,
            createdAt: true,
            canal: true,
          },
        }),
      ]);

    const totalFacturado = Number(totalFacturadoAgg._sum.total ?? 0);
    const totalPagado = Number(totalPagadoAgg._sum.monto ?? 0);
    const saldo = totalFacturado - totalPagado;

    return {
      contrato,
      saldo,
      ultimosPagos,
      ultimasFacturas,
      quejasAbiertas,
      resumen: {
        totalPagado,
        totalFacturado,
        quejasAbiertas: quejasAbiertas.length,
      },
    };
  }

  async create(dto: CreateContratoDto) {
    const tomaId = optionalFkId(dto.tomaId);
    const puntoServicioId = optionalFkId(dto.puntoServicioId);
    const domicilioId = optionalFkId(dto.domicilioId);
    const tipoContratacionId = optionalFkId(dto.tipoContratacionId);
    const medidorId = optionalFkId(dto.medidorId);
    const rutaId = optionalFkId(dto.rutaId);
    const zonaId = optionalFkId(dto.zonaId);
    const actividadId = optionalFkId(dto.actividadId);
    const categoriaId = optionalFkId(dto.categoriaId);
    const plantillaContratacionId = optionalFkId(dto.plantillaContratacionId);

    const refChecks: Promise<void>[] = [];

    if (tomaId) {
      refChecks.push(
        this.prisma.toma
          .findUnique({ where: { id: tomaId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `La toma indicada no existe (tomaId: ${tomaId}).`,
              );
            }
          }),
      );
    }
    if (puntoServicioId) {
      refChecks.push(
        this.prisma.puntoServicio
          .findUnique({ where: { id: puntoServicioId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `El punto de servicio indicado no existe (puntoServicioId: ${puntoServicioId}).`,
              );
            }
          }),
      );
    }
    if (domicilioId) {
      refChecks.push(
        this.prisma.domicilio
          .findUnique({ where: { id: domicilioId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `El domicilio indicado no existe (domicilioId: ${domicilioId}).`,
              );
            }
          }),
      );
    }
    if (tipoContratacionId) {
      refChecks.push(
        this.prisma.tipoContratacion
          .findUnique({
            where: { id: tipoContratacionId },
            select: { id: true },
          })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `El tipo de contratación indicado no existe (tipoContratacionId: ${tipoContratacionId}).`,
              );
            }
          }),
      );
    }
    if (medidorId) {
      refChecks.push(
        this.prisma.medidor
          .findUnique({ where: { id: medidorId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `El medidor indicado no existe (medidorId: ${medidorId}).`,
              );
            }
          }),
      );
    }
    if (rutaId) {
      refChecks.push(
        this.prisma.ruta
          .findUnique({ where: { id: rutaId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `La ruta indicada no existe (rutaId: ${rutaId}).`,
              );
            }
          }),
      );
    }
    if (zonaId) {
      refChecks.push(
        this.prisma.zona
          .findUnique({ where: { id: zonaId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `La zona indicada no existe (zonaId: ${zonaId}).`,
              );
            }
          }),
      );
    }
    if (actividadId) {
      refChecks.push(
        this.prisma.catalogoActividad
          .findUnique({ where: { id: actividadId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `La actividad del catálogo indicada no existe (actividadId: ${actividadId}).`,
              );
            }
          }),
      );
    }
    if (categoriaId) {
      refChecks.push(
        this.prisma.catalogoCategoria
          .findUnique({ where: { id: categoriaId }, select: { id: true } })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `La categoría del catálogo indicada no existe (categoriaId: ${categoriaId}).`,
              );
            }
          }),
      );
    }
    if (plantillaContratacionId) {
      refChecks.push(
        this.prisma.plantillaContrato
          .findUnique({
            where: { id: plantillaContratacionId },
            select: { id: true },
          })
          .then((row) => {
            if (!row) {
              throw new BadRequestException(
                `La plantilla de contratación indicada no existe (plantillaContratacionId: ${plantillaContratacionId}).`,
              );
            }
          }),
      );
    }

    await Promise.all(refChecks);

    const docsRecibidos = normalizeDocumentosRecibidos(dto.documentosRecibidos);
    if (plantillaContratacionId && docsRecibidos.length === 0) {
      throw new BadRequestException(
        'plantillaContratacionId solo aplica cuando documentosRecibidos incluye al menos un documento.',
      );
    }

    let estadoInicial = dto.estado;
    if (dto.generarOrdenInstalacionToma === true) {
      estadoInicial = 'Pendiente de toma';
    } else if (dto.generarOrdenInstalacionMedidor === true) {
      estadoInicial = 'Pendiente de zona';
    }

    const omitirPersona = dto.omitirRegistroPersonaTitular === true;

    return this.prisma.$transaction(async (tx) => {
      let procesoGestionadoEnAlta = false;

      if (tipoContratacionId) {
        const required = await loadNombreDocumentosObligatorios(
          tx,
          tipoContratacionId,
        );
        assertDocsRecibidosCubrenObligatorios(required, docsRecibidos);
      }

      const findOrCreatePersona = async (
        input: PersonaRelacionInput,
      ): Promise<{ id: string }> => {
        const personaId = optionalFkId(input.personaId);
        if (personaId) {
          const existente = await tx.persona.findUnique({
            where: { id: personaId },
            select: { id: true },
          });
          if (!existente) {
            throw new BadRequestException(
              `La persona indicada no existe (personaId: ${personaId}).`,
            );
          }
          return existente;
        }

        const nombre = (input.nombre ?? '').trim();
        const rfc = (input.rfc ?? '').trim();
        if (!nombre || !rfc) {
          throw new BadRequestException(
            'Para registrar una persona relacionada se requiere personaId o nombre+rfc.',
          );
        }

        const porRfc = await tx.persona.findFirst({
          where: { rfc },
          select: { id: true },
        });
        if (porRfc) return porRfc;

        return tx.persona.create({
          data: {
            nombre,
            rfc,
            curp: (input.curp ?? '').trim() || null,
            tipo: (input.razonSocial ?? '').trim() ? 'Moral' : 'Fisica',
            email: (input.email ?? '').trim() || null,
            telefono: (input.telefono ?? '').trim() || null,
            razonSocial: (input.razonSocial ?? '').trim() || null,
            regimenFiscal: (input.regimenFiscal ?? '').trim() || null,
          },
          select: { id: true },
        });
      };

      const upsertRolPersona = async (
        contratoId: string,
        rol: 'PROPIETARIO' | 'FISCAL' | 'CONTACTO',
        input?: PersonaRelacionInput,
      ) => {
        if (!input) return;
        const persona = await findOrCreatePersona(input);
        await tx.rolPersonaContrato.upsert({
          where: {
            personaId_contratoId_rol: {
              personaId: persona.id,
              contratoId,
              rol,
            },
          },
          create: {
            personaId: persona.id,
            contratoId,
            rol,
          },
          update: { activo: true, fechaHasta: null },
        });
      };

      const contrato = await tx.contrato.create({
        data: {
          tomaId,
          puntoServicioId,
          domicilioId,
          tipoContratacionId,
          tipoContrato: dto.tipoContrato,
          tipoServicio: dto.tipoServicio,
          nombre: dto.nombre,
          rfc: dto.rfc,
          razonSocial: dto.razonSocial ?? null,
          regimenFiscal: dto.regimenFiscal ?? null,
          direccion: dto.direccion ?? '',
          contacto: dto.contacto ?? '',
          estado: estadoInicial,
          fecha: dto.fecha,
          medidorId,
          rutaId,
          zonaId,
          domiciliado: dto.domiciliado ?? false,
          fechaReconexionPrevista: dto.fechaReconexionPrevista ?? null,
          ceaNumContrato: dto.ceaNumContrato ?? null,
          fechaBaja: dto.fechaBaja ?? null,
          actividadId,
          categoriaId,
          referenciaContratoAnterior: dto.referenciaContratoAnterior ?? null,
          observaciones: dto.observaciones ?? null,
          tipoEnvioFactura: dto.tipoEnvioFactura ?? null,
          indicadorEmisionRecibo: dto.indicadorEmisionRecibo ?? true,
          indicadorExentarFacturacion: dto.indicadorExentarFacturacion ?? false,
          indicadorContactoCorreo: dto.indicadorContactoCorreo ?? false,
          cicloFacturacion: dto.cicloFacturacion ?? null,
          superficiePredio: dto.superficiePredio ?? null,
          superficieConstruida: dto.superficieConstruida ?? null,
          mesesAdeudo: dto.mesesAdeudo ?? null,
          unidadesServidas: dto.unidadesServidas ?? null,
          personasHabitanVivienda: dto.personasHabitanVivienda ?? null,
        },
      });

      if (!omitirPersona) {
        let persona = await tx.persona.findFirst({
          where: { rfc: dto.rfc },
        });
        if (!persona) {
          persona = await tx.persona.create({
            data: {
              nombre: dto.nombre,
              rfc: dto.rfc,
              tipo: 'Fisica',
              telefono: (dto.contacto ?? '').trim() || null,
            },
          });
        }
        await tx.rolPersonaContrato.upsert({
          where: {
            personaId_contratoId_rol: {
              personaId: persona.id,
              contratoId: contrato.id,
              rol: 'PROPIETARIO',
            },
          },
          create: {
            personaId: persona.id,
            contratoId: contrato.id,
            rol: 'PROPIETARIO',
          },
          update: { activo: true },
        });
      }

      if (dto.personaFiscal) {
        await upsertRolPersona(contrato.id, 'FISCAL', dto.personaFiscal);
      }
      if (dto.personaContacto) {
        await upsertRolPersona(contrato.id, 'CONTACTO', dto.personaContacto);
      }

      if (dto.generarOrdenInstalacionToma === true) {
        await tx.orden.create({
          data: {
            contratoId: contrato.id,
            tipo: 'InstalacionToma',
            prioridad: 'Normal',
            notas: 'Generada en alta de contrato',
            origenAutomatico: true,
            eventoOrigen: 'contrato.create',
          },
        });
      } else if (dto.generarOrdenInstalacionMedidor === true) {
        await tx.orden.create({
          data: {
            contratoId: contrato.id,
            tipo: 'InstalacionMedidor',
            prioridad: 'Normal',
            notas: 'Generada en alta de contrato',
            origenAutomatico: true,
            eventoOrigen: 'contrato.create',
          },
        });
      }

      if (docsRecibidos.length > 0) {
        const procesoReciente = await tx.procesoContratacion.findFirst({
          where: { contratoId: contrato.id },
          orderBy: { createdAt: 'desc' },
          select: { id: true, datosAdicionales: true, plantillaId: true },
        });

        const plantillaParaProceso = plantillaContratacionId;

        if (procesoReciente) {
          const prev =
            procesoReciente.datosAdicionales &&
            typeof procesoReciente.datosAdicionales === 'object' &&
            !Array.isArray(procesoReciente.datosAdicionales)
              ? (procesoReciente.datosAdicionales as Record<string, unknown>)
              : {};

          await tx.procesoContratacion.update({
            where: { id: procesoReciente.id },
            data: {
              ...(plantillaParaProceso && !procesoReciente.plantillaId
                ? { plantillaId: plantillaParaProceso }
                : {}),
              datosAdicionales: {
                ...prev,
                documentosRecibidos: docsRecibidos,
                checklistCapturadoEnAlta: true,
              },
            },
          });
          const nHitos = await tx.hitoContratacion.count({
            where: { procesoId: procesoReciente.id },
          });
          // Procesos legacy sin hitos: semántica de “inicio” en solicitud completada (puede no coincidir con etapa actual del proceso).
          if (nHitos === 0) {
            await crearHitoInicialSolicitudCompletado(
              tx,
              procesoReciente.id,
              null,
            );
          }
        } else {
          const nuevoProceso = await tx.procesoContratacion.create({
            data: {
              contratoId: contrato.id,
              etapa: 'solicitud',
              estado: 'en_progreso',
              plantillaId: plantillaParaProceso,
              datosAdicionales: {
                documentosRecibidos: docsRecibidos,
                checklistCapturadoEnAlta: true,
              },
            },
          });
          await crearHitoInicialSolicitudCompletado(
            tx,
            nuevoProceso.id,
            null,
          );
        }
        procesoGestionadoEnAlta = true;
      }

      return {
        ...contrato,
        procesoGestionadoEnAlta,
      };
    });
  }

  /** Flujo completo del contrato: personas, domicilio, tipo contratación, órdenes, trámites, procesos e historial */
  async getFlujoCompleto(contratoId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        domicilio: {
          include: {
            coloniaINEGI: true,
            municipioINEGI: true,
            estadoINEGI: true,
          },
        },
        tipoContratacion: {
          include: {
            conceptos: { include: { conceptoCobro: true } },
            clausulas: { include: { clausula: true } },
            documentos: true,
          },
        },
        personas: {
          where: { activo: true },
          include: {
            persona: {
              select: {
                id: true,
                nombre: true,
                apellidoPaterno: true,
                apellidoMaterno: true,
                rfc: true,
                curp: true,
                tipo: true,
                email: true,
                telefono: true,
              },
            },
          },
        },
        ordenes: {
          orderBy: { createdAt: 'desc' },
          take: 25,
          select: {
            id: true,
            tipo: true,
            estado: true,
            prioridad: true,
            fechaSolicitud: true,
            fechaProgramada: true,
            fechaEjecucion: true,
            notas: true,
            origenAutomatico: true,
            eventoOrigen: true,
          },
        },
        tramites: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            folio: true,
            tipo: true,
            estado: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        procesosContratacion: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            hitos: { orderBy: { createdAt: 'asc' } },
            plantilla: { select: { id: true, nombre: true, version: true } },
          },
        },
        historico: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');
    return contrato;
  }

  /** Vista previa de texto contractual (plantilla del proceso o cláusulas del tipo), con sustitución básica de variables. */
  async getTextoContratoPreview(contratoId: string) {
    const c = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      include: {
        tipoContratacion: {
          include: {
            clausulas: {
              orderBy: { orden: 'asc' },
              include: { clausula: true },
            },
          },
        },
      },
    });
    if (!c) throw new NotFoundException('Contrato no encontrado');

    const proceso = await this.prisma.procesoContratacion.findFirst({
      where: { contratoId },
      orderBy: { createdAt: 'desc' },
      include: { plantilla: true },
    });

    let base = (proceso?.plantilla?.contenido ?? '').trim();
    let fuente: 'plantilla' | 'clausulas' | 'vacío' = 'vacío';
    if (base.length > 0) {
      fuente = 'plantilla';
    } else if (c.tipoContratacion?.clausulas?.length) {
      base = c.tipoContratacion.clausulas
        .map((row) => row.clausula.contenido)
        .join('\n\n');
      fuente = 'clausulas';
    }

    const vars: Record<string, string> = {
      nombre: c.nombre,
      rfc: c.rfc,
      direccion: c.direccion,
      contacto: c.contacto,
      razonSocial: c.razonSocial ?? '',
      regimenFiscal: c.regimenFiscal ?? '',
      fecha: c.fecha,
    };
    let texto = base;
    for (const [k, v] of Object.entries(vars)) {
      texto = texto.split(`{{${k}}}`).join(v);
    }

    return { texto, fuente, contratoId: c.id };
  }
}
