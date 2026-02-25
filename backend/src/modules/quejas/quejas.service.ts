import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateQuejaDto } from './dto/create-queja.dto';
import { UpdateQuejaDto } from './dto/update-queja.dto';
import { CreateSeguimientoDto } from './dto/create-seguimiento.dto';

@Injectable()
export class QuejasService {
  constructor(private readonly prisma: PrismaService) {}

  async findByContrato(contratoId: string) {
    return this.prisma.quejaAclaracion.findMany({
      where: { contratoId },
      include: { seguimientos: { orderBy: { fecha: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const queja = await this.prisma.quejaAclaracion.findUnique({
      where: { id },
      include: { seguimientos: { orderBy: { fecha: 'asc' } } },
    });
    if (!queja) throw new NotFoundException('Queja/Aclaración no encontrada');
    return queja;
  }

  async create(dto: CreateQuejaDto) {
    return this.prisma.quejaAclaracion.create({
      data: {
        contratoId: dto.contratoId,
        tipo: dto.tipo,
        descripcion: dto.descripcion,
        estado: dto.estado ?? 'Registrada',
        atendidoPor: dto.atendidoPor ?? null,
        categoria: dto.categoria ?? null,
        prioridad: dto.prioridad ?? 'Media',
        canal: dto.canal ?? 'Ventanilla',
        areaAsignada: dto.areaAsignada ?? 'Atención a clientes',
        enlaceExterno: dto.enlaceExterno ?? null,
      },
      include: { seguimientos: true },
    });
  }

  async update(id: string, dto: UpdateQuejaDto) {
    await this.findOne(id);
    return this.prisma.quejaAclaracion.update({
      where: { id },
      data: {
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.areaAsignada !== undefined && { areaAsignada: dto.areaAsignada }),
        ...(dto.motivoCierre !== undefined && { motivoCierre: dto.motivoCierre }),
        ...(dto.enlaceExterno !== undefined && { enlaceExterno: dto.enlaceExterno }),
        ...(dto.prioridad !== undefined && { prioridad: dto.prioridad }),
        ...(dto.atendidoPor !== undefined && { atendidoPor: dto.atendidoPor }),
        ...(dto.categoria !== undefined && { categoria: dto.categoria }),
      },
      include: { seguimientos: { orderBy: { fecha: 'asc' } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.quejaAclaracion.update({
      where: { id },
      data: { estado: 'Cancelada' },
    });
  }

  async addSeguimiento(quejaId: string, dto: CreateSeguimientoDto) {
    await this.findOne(quejaId);
    return this.prisma.seguimientoQueja.create({
      data: {
        quejaId,
        nota: dto.nota,
        usuario: dto.usuario,
        tipo: dto.tipo,
      },
    });
  }
}
