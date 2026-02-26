import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PersonasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { nombre?: string; rfc?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.nombre && { nombre: { contains: params.nombre, mode: 'insensitive' as const } }),
      ...(params.rfc && { rfc: { contains: params.rfc } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.persona.findMany({
        where,
        include: {
          roles: {
            include: { contrato: { select: { id: true, nombre: true, estado: true } } },
          },
        },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.persona.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const p = await this.prisma.persona.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            contrato: { select: { id: true, nombre: true, estado: true, zonaId: true } },
          },
        },
      },
    });
    if (!p) throw new NotFoundException('Persona no encontrada');
    return p;
  }

  async create(data: {
    nombre: string;
    rfc?: string;
    tipo?: string;
    email?: string;
    telefono?: string;
  }) {
    return this.prisma.persona.create({ data });
  }

  async update(
    id: string,
    data: Partial<{
      nombre: string;
      rfc: string;
      tipo: string;
      email: string;
      telefono: string;
    }>,
  ) {
    await this.findOne(id);
    return this.prisma.persona.update({ where: { id }, data });
  }

  async asignarRol(personaId: string, contratoId: string, rol: string) {
    return this.prisma.rolPersonaContrato.upsert({
      where: { personaId_contratoId_rol: { personaId, contratoId, rol } },
      create: { personaId, contratoId, rol },
      update: { activo: true, fechaHasta: null },
    });
  }

  async revocarRol(personaId: string, contratoId: string, rol: string) {
    return this.prisma.rolPersonaContrato.update({
      where: { personaId_contratoId_rol: { personaId, contratoId, rol } },
      data: { activo: false, fechaHasta: new Date() },
    });
  }
}
