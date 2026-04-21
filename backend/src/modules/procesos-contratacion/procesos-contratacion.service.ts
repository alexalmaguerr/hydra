import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { crearHitoInicialSolicitudCompletado } from './hito-inicial.util';

// Secuencia oficial de etapas del flujo de contratación (req PRD #1, #6)
const ETAPAS_FLUJO: string[] = ['solicitud', 'factibilidad', 'contrato', 'instalacion_toma', 'instalacion_medidor', 'alta'];

@Injectable()
export class ProcesosContratacionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Procesos ─────────────────────────────────────────────────────────────

  async findAll(params: { contratoId?: string; etapa?: string; estado?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.etapa && { etapa: params.etapa }),
      ...(params.estado && { estado: params.estado }),
    };
    const [data, total] = await Promise.all([
      this.prisma.procesoContratacion.findMany({
        where,
        include: {
          hitos: { orderBy: { createdAt: 'asc' } },
          plantilla: { select: { id: true, nombre: true, version: true } },
          contrato: {
            select: {
              id: true,
              nombre: true,
              rfc: true,
              estado: true,
              tipoServicio: true,
              direccion: true,
              fecha: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.procesoContratacion.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const p = await this.prisma.procesoContratacion.findUnique({
      where: { id },
      include: {
        hitos: { orderBy: { createdAt: 'asc' } },
        plantilla: true,
        contrato: {
          select: {
            id: true,
            nombre: true,
            estado: true,
            tipoServicio: true,
            tipoContrato: true,
            puntoServicioId: true,
            puntoServicio: { select: { id: true, codigo: true } },
            actividadId: true,
            referenciaContratoAnterior: true,
            tipoEnvioFactura: true,
            superficiePredio: true,
            superficieConstruida: true,
            unidadesServidas: true,
            personasHabitanVivienda: true,
            variablesCapturadas: true,
            tipoContratacion: { select: { id: true, nombre: true, codigo: true } },
            personas: {
              where: { activo: true },
              include: { persona: { select: { id: true, nombre: true, rfc: true, tipo: true } } },
            },
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Proceso de contratación no encontrado');
    return p;
  }

  async create(dto: {
    contratoId?: string;
    tramiteId?: string;
    plantillaId?: string;
    creadoPor?: string;
    datosAdicionales?: object;
  }) {
    const proceso = await this.prisma.procesoContratacion.create({
      data: {
        contratoId: dto.contratoId ?? null,
        tramiteId: dto.tramiteId ?? null,
        etapa: 'solicitud',
        estado: 'en_progreso',
        plantillaId: dto.plantillaId ?? null,
        creadoPor: dto.creadoPor ?? null,
        datosAdicionales: dto.datosAdicionales ?? Prisma.DbNull,
      },
    });

    await crearHitoInicialSolicitudCompletado(
      this.prisma,
      proceso.id,
      dto.creadoPor ?? null,
    );

    return this.findOne(proceso.id);
  }

  /**
   * Avanza el proceso a la siguiente etapa.
   * Al avanzar, actualiza automáticamente contrato.estado según la etapa alcanzada
   * y crea las órdenes de instalación necesarias (req PRD #5).
   *
   * Mapa etapa → contrato.estado:
   *   factibilidad       → "En factibilidad"
   *   contrato           → "Pendiente de firma"
   *   instalacion_toma   → "Pendiente de toma"   + Orden InstalacionToma
   *   instalacion_medidor→ "Pendiente de medidor" (orden ya existe o se crea si no)
   *   alta               → "Activo"
   */
  async avanzarEtapa(id: string, dto: { nota?: string; usuario?: string; datosAdicionales?: object }) {
    const proceso = await this.findOne(id);
    if (proceso.estado === 'completado') throw new BadRequestException('El proceso ya está completado');
    if (proceso.estado === 'cancelado') throw new BadRequestException('No se puede avanzar un proceso cancelado');

    const idxActual = ETAPAS_FLUJO.indexOf(proceso.etapa);
    if (idxActual === -1) throw new BadRequestException(`Etapa desconocida: ${proceso.etapa}`);
    if (idxActual >= ETAPAS_FLUJO.length - 1) {
      throw new BadRequestException('El proceso ya está en la etapa final');
    }

    const nuevaEtapa = ETAPAS_FLUJO[idxActual + 1];
    const esUltima = idxActual + 1 === ETAPAS_FLUJO.length - 1;

    // Mapa etapa alcanzada → estado del contrato
    const estadoContratoMap: Record<string, string> = {
      factibilidad:        'En factibilidad',
      contrato:            'Pendiente de firma',
      instalacion_toma:    'Pendiente de toma',
      instalacion_medidor: 'Pendiente de medidor',
      alta:                'Activo',
    };
    const nuevoEstadoContrato = estadoContratoMap[nuevaEtapa];

    const procesoActualizado = await this.prisma.$transaction(async (tx) => {
      // 1. Avanzar el proceso
      const p = await tx.procesoContratacion.update({
        where: { id },
        data: {
          etapa: nuevaEtapa,
          estado: esUltima ? 'completado' : 'en_progreso',
          fechaFin: esUltima ? new Date() : null,
          ...(dto.datosAdicionales && { datosAdicionales: dto.datosAdicionales }),
        },
      });

      // 2. Registrar hito
      await tx.hitoContratacion.create({
        data: {
          procesoId: id,
          etapa: nuevaEtapa,
          estado: 'completado',
          nota: dto.nota ?? null,
          usuario: dto.usuario ?? null,
          fechaCumpl: new Date(),
        },
      });

      // 3. Actualizar estado del contrato vinculado
      if (proceso.contratoId && nuevoEstadoContrato) {
        await tx.contrato.update({
          where: { id: proceso.contratoId },
          data: { estado: nuevoEstadoContrato },
        });
      }

      // 4. Crear orden de InstalacionToma al entrar a esa etapa
      if (nuevaEtapa === 'instalacion_toma' && proceso.contratoId) {
        const existe = await tx.orden.findFirst({
          where: { contratoId: proceso.contratoId, tipo: 'InstalacionToma', estado: { in: ['Pendiente', 'En proceso'] } },
        });
        if (!existe) {
          await tx.orden.create({
            data: {
              contratoId: proceso.contratoId,
              tipo: 'InstalacionToma',
              prioridad: 'Normal',
              notas: `Generada al avanzar proceso ${id} a instalacion_toma`,
              origenAutomatico: true,
              eventoOrigen: `proceso:${id}:instalacion_toma`,
            },
          });
        }
      }

      // 5. Crear orden de InstalacionMedidor al entrar a esa etapa (si no existe ya)
      if (nuevaEtapa === 'instalacion_medidor' && proceso.contratoId) {
        const existe = await tx.orden.findFirst({
          where: { contratoId: proceso.contratoId, tipo: 'InstalacionMedidor', estado: { in: ['Pendiente', 'En proceso'] } },
        });
        if (!existe) {
          await tx.orden.create({
            data: {
              contratoId: proceso.contratoId,
              tipo: 'InstalacionMedidor',
              prioridad: 'Normal',
              notas: `Generada al avanzar proceso ${id} a instalacion_medidor`,
              origenAutomatico: true,
              eventoOrigen: `proceso:${id}:instalacion_medidor`,
            },
          });
        }
      }

      return p;
    });

    return this.findOne(procesoActualizado.id);
  }

  async cancelar(id: string, motivo: string, usuario?: string) {
    await this.findOne(id);
    const [proceso] = await this.prisma.$transaction([
      this.prisma.procesoContratacion.update({
        where: { id },
        data: { estado: 'cancelado', fechaFin: new Date() },
      }),
      this.prisma.hitoContratacion.create({
        data: {
          procesoId: id,
          etapa: 'cancelado',
          estado: 'completado',
          nota: motivo,
          usuario: usuario ?? null,
          fechaCumpl: new Date(),
        },
      }),
    ]);
    return proceso;
  }

  // ─── Plantillas de Contrato ───────────────────────────────────────────────

  async findPlantillas(soloActivas = false) {
    return this.prisma.plantillaContrato.findMany({
      where: { ...(soloActivas && { activo: true }) },
      orderBy: [{ nombre: 'asc' }, { version: 'desc' }],
    });
  }

  async findOnePlantilla(id: string) {
    const p = await this.prisma.plantillaContrato.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Plantilla no encontrada');
    return p;
  }

  async createPlantilla(dto: {
    nombre: string;
    version?: string;
    contenido: string;
    variables?: object;
  }) {
    return this.prisma.plantillaContrato.create({
      data: {
        nombre: dto.nombre,
        version: dto.version ?? '1.0',
        contenido: dto.contenido,
        variables: dto.variables ?? Prisma.DbNull,
      },
    });
  }

  async updatePlantilla(id: string, dto: Partial<{
    nombre: string;
    version: string;
    contenido: string;
    variables: object;
    activo: boolean;
  }>) {
    await this.findOnePlantilla(id);
    return this.prisma.plantillaContrato.update({ where: { id }, data: dto });
  }
}
