import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OrdenesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    contratoId?: string;
    tipo?: string;
    estado?: string;
    operadorId?: string;
    subtipoCorteId?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: Record<string, unknown> = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
      ...(params.operadorId && { operadorId: params.operadorId }),
      ...(params.subtipoCorteId && { subtipoCorteId: params.subtipoCorteId }),
      ...(params.desde &&
        params.hasta && {
          fechaProgramada: { gte: new Date(params.desde), lte: new Date(params.hasta) },
        }),
    };
    const [data, total] = await Promise.all([
      this.prisma.orden.findMany({
        where,
        include: {
          contrato: { select: { id: true, nombre: true, direccion: true, zonaId: true } },
          subtipoCorte: { select: { id: true, codigo: true, descripcion: true, impacto: true } },
          seguimientos: { orderBy: { fecha: 'desc' }, take: 1 },
        },
        orderBy: { fechaSolicitud: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.orden.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const orden = await this.prisma.orden.findUnique({
      where: { id },
      include: {
        contrato: { select: { id: true, nombre: true, direccion: true, estado: true, zonaId: true } },
        subtipoCorte: { select: { id: true, codigo: true, descripcion: true, impacto: true, requiereCuadrilla: true } },
        seguimientos: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    return orden;
  }

  async create(dto: {
    contratoId: string;
    tipo: string;
    subtipoCorteId?: string;
    prioridad?: string;
    fechaProgramada?: string;
    operadorId?: string;
    notas?: string;
    externalRef?: string;
    origenAutomatico?: boolean;
    eventoOrigen?: string;
    ubicacionCorte?: string;
    condicionCortable?: boolean;
  }) {
    // MOD-T03-2: subtipoCorteId obligatorio para tipo Corte
    if (dto.tipo === 'Corte' && !dto.subtipoCorteId) {
      throw new BadRequestException('subtipoCorteId es obligatorio cuando tipo es Corte');
    }

    const orden = await this.prisma.orden.create({
      data: {
        contratoId: dto.contratoId,
        tipo: dto.tipo,
        subtipoCorteId: dto.subtipoCorteId ?? null,
        prioridad: dto.prioridad ?? 'Normal',
        fechaProgramada: dto.fechaProgramada ? new Date(dto.fechaProgramada) : null,
        operadorId: dto.operadorId ?? null,
        notas: dto.notas ?? null,
        externalRef: dto.externalRef ?? null,
        origenAutomatico: dto.origenAutomatico ?? false,
        eventoOrigen: dto.eventoOrigen ?? null,
        ubicacionCorte: dto.ubicacionCorte ?? null,
        condicionCortable: dto.condicionCortable ?? null,
      },
      include: {
        contrato: { select: { id: true, nombre: true } },
        subtipoCorte: { select: { id: true, codigo: true, descripcion: true } },
        seguimientos: true,
      },
    });

    if (dto.tipo === 'Reconexion' && dto.fechaProgramada) {
      await this.prisma.contrato.update({
        where: { id: dto.contratoId },
        data: { fechaReconexionPrevista: dto.fechaProgramada },
      });
    }

    return orden;
  }

  async updateEstado(id: string, nuevoEstado: string, nota?: string, usuario?: string) {
    const orden = await this.findOne(id);
    const estadoAnterior = orden.estado;

    if (estadoAnterior === nuevoEstado) throw new BadRequestException('El estado no cambia');

    const updated = await this.prisma.orden.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === 'Ejecutada' && { fechaEjecucion: new Date() }),
        seguimientos: {
          create: {
            estadoAnterior,
            estadoNuevo: nuevoEstado,
            nota: nota ?? null,
            usuario: usuario ?? null,
          },
        },
      },
      include: { seguimientos: { orderBy: { fecha: 'desc' }, take: 1 } },
    });

    // MOD-T03-1: auto-generar orden de medidor al ejecutar instalación de toma
    if (nuevoEstado === 'Ejecutada' && orden.tipo === 'InstalacionToma') {
      await this.autoGenerarOrdenMedidor(orden);
      await this.marcarContratoPendienteDeZona(orden.contratoId);
    }

    return updated;
  }

  async actualizarDatosCampo(id: string, datosCampo: object) {
    await this.findOne(id);
    return this.prisma.orden.update({ where: { id }, data: { datosCampo } });
  }

  async addSeguimiento(
    ordenId: string,
    data: { nota: string; usuario?: string; estadoNuevo?: string },
  ) {
    await this.findOne(ordenId);
    return this.prisma.seguimientoOrden.create({
      data: {
        ordenId,
        nota: data.nota,
        usuario: data.usuario ?? null,
        estadoNuevo: data.estadoNuevo ?? null,
      },
    });
  }

  async getByContrato(contratoId: string) {
    return this.prisma.orden.findMany({
      where: { contratoId },
      include: {
        subtipoCorte: { select: { id: true, codigo: true, descripcion: true } },
        seguimientos: { orderBy: { fecha: 'desc' }, take: 3 },
      },
      orderBy: { fechaSolicitud: 'desc' },
    });
  }

  async getEstadisticas() {
    const [porEstado, porTipo] = await Promise.all([
      this.prisma.orden.groupBy({ by: ['estado'], _count: { id: true } }),
      this.prisma.orden.groupBy({ by: ['tipo'], _count: { id: true } }),
    ]);
    return { porEstado, porTipo };
  }

  // MOD-T03-1: generación automática de orden de medidor al completar instalación de toma
  private async autoGenerarOrdenMedidor(orden: {
    id: string;
    contratoId: string;
    operadorId: string | null;
  }) {
    const pendiente = await this.prisma.orden.findFirst({
      where: {
        contratoId: orden.contratoId,
        tipo: 'InstalacionMedidor',
        estado: { in: ['Pendiente', 'En proceso'] },
      },
    });
    if (pendiente) return;

    await this.prisma.orden.create({
      data: {
        contratoId: orden.contratoId,
        tipo: 'InstalacionMedidor',
        prioridad: 'Normal',
        operadorId: orden.operadorId,
        notas: `Auto-generada al completar InstalacionToma ${orden.id}`,
        origenAutomatico: true,
        eventoOrigen: `InstalacionToma:${orden.id}`,
      },
    });
  }

  /** Tras ejecutar toma: contrato listo para asignación de zona/ruta (facturación operativa). */
  private async marcarContratoPendienteDeZona(contratoId: string) {
    const c = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: { estado: true },
    });
    if (!c) return;
    const prev = c.estado ?? '';
    if (['Pendiente de toma', 'Pendiente de alta'].includes(prev)) {
      await this.prisma.contrato.update({
        where: { id: contratoId },
        data: { estado: 'Pendiente de zona' },
      });
    }
  }
}
