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
    desde?: string;
    hasta?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: any = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
      ...(params.operadorId && { operadorId: params.operadorId }),
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
        seguimientos: { orderBy: { fecha: 'asc' } },
      },
    });
    if (!orden) throw new NotFoundException('Orden no encontrada');
    return orden;
  }

  async create(dto: {
    contratoId: string;
    tipo: string;
    prioridad?: string;
    fechaProgramada?: string;
    operadorId?: string;
    notas?: string;
    externalRef?: string;
  }) {
    const orden = await this.prisma.orden.create({
      data: {
        contratoId: dto.contratoId,
        tipo: dto.tipo,
        prioridad: dto.prioridad ?? 'Normal',
        fechaProgramada: dto.fechaProgramada ? new Date(dto.fechaProgramada) : null,
        operadorId: dto.operadorId ?? null,
        notas: dto.notas ?? null,
        externalRef: dto.externalRef ?? null,
      },
      include: { contrato: { select: { id: true, nombre: true } }, seguimientos: true },
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

    return this.prisma.orden.update({
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
      include: { seguimientos: { orderBy: { fecha: 'desc' }, take: 3 } },
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
}
