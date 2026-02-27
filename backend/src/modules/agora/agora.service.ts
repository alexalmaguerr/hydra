import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * AgoraService — mock integration layer for the Agora ticketing system.
 * When the real Agora API is available, swap the stub implementations for
 * actual HTTP calls. The DB model (AgoraTicket) keeps a local copy regardless.
 */
@Injectable()
export class AgoraService {
  constructor(private readonly prisma: PrismaService) {}

  async createTicket(dto: {
    contratoId?: string;
    tramiteId?: string;
    quejaId?: string;
    titulo: string;
    descripcion: string;
    prioridad?: string;
    creadoPor: string;
  }) {
    // Stub: in production, POST to Agora API here and get back agoraRef
    const agoraRef = `AGORA-MOCK-${Date.now()}`;

    const ticket = await this.prisma.agoraTicket.create({
      data: {
        contratoId: dto.contratoId ?? null,
        tramiteId: dto.tramiteId ?? null,
        quejaId: dto.quejaId ?? null,
        agoraRef,
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        prioridad: dto.prioridad ?? 'Media',
        creadoPor: dto.creadoPor,
        datosEnvio: dto,
        respuesta: { mock: true, message: 'Ticket creado en modo mock' },
      },
    });

    return { ...ticket, _mock: true };
  }

  async findOne(id: string) {
    const ticket = await this.prisma.agoraTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');
    return ticket;
  }

  async findAll(params: { contratoId?: string; estado?: string }) {
    return this.prisma.agoraTicket.findMany({
      where: {
        ...(params.contratoId && { contratoId: params.contratoId }),
        ...(params.estado && { estado: params.estado }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateEstado(id: string, estado: string) {
    await this.findOne(id);
    // Stub: in production sync status from Agora API
    return this.prisma.agoraTicket.update({
      where: { id },
      data: { estado },
    });
  }
}
