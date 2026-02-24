import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';

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

  async create(dto: CreateContratoDto) {
    return this.prisma.contrato.create({
      data: {
        tomaId: dto.tomaId ?? null,
        tipoContrato: dto.tipoContrato,
        tipoServicio: dto.tipoServicio,
        nombre: dto.nombre,
        rfc: dto.rfc,
        direccion: dto.direccion,
        contacto: dto.contacto,
        estado: dto.estado,
        fecha: dto.fecha,
        medidorId: dto.medidorId ?? null,
        rutaId: dto.rutaId ?? null,
        zonaId: dto.zonaId ?? null,
        domiciliado: dto.domiciliado ?? false,
        fechaReconexionPrevista: dto.fechaReconexionPrevista ?? null,
      },
    });
  }
}
