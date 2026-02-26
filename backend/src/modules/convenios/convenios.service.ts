import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ConveniosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { contratoId?: string; estado?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.estado && { estado: params.estado }),
    };
    const [data, total] = await Promise.all([
      this.prisma.convenio.findMany({
        where,
        include: {
          contrato: { select: { nombre: true, estado: true } },
          pagos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.convenio.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const c = await this.prisma.convenio.findUnique({
      where: { id },
      include: {
        contrato: { select: { nombre: true, estado: true } },
        pagos: { orderBy: { fecha: 'desc' } },
      },
    });
    if (!c) throw new NotFoundException('Convenio no encontrado');
    return c;
  }

  async create(dto: {
    contratoId: string;
    tipo?: string;
    numParcialidades: number;
    facturas: { timbradoId: string; monto: number }[];
    fechaVencimiento?: string;
  }) {
    const montoTotal = dto.facturas.reduce((s, f) => s + f.monto, 0);
    const montoParcialidad = Math.ceil((montoTotal / dto.numParcialidades) * 100) / 100;

    return this.prisma.convenio.create({
      data: {
        contratoId: dto.contratoId,
        tipo: dto.tipo ?? 'Parcialidades',
        numParcialidades: dto.numParcialidades,
        montoParcialidad,
        montoTotal,
        parcialidadesRestantes: dto.numParcialidades,
        facturas: dto.facturas,
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
      },
      include: { contrato: { select: { nombre: true } } },
    });
  }

  async aplicarParcialidad(convenioId: string, monto: number, tipo: string) {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId } });
    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    if (convenio.estado !== 'Activo') throw new BadRequestException('El convenio no está activo');

    const pago = await this.prisma.pago.create({
      data: {
        contratoId: convenio.contratoId,
        convenioId,
        monto,
        fecha: new Date().toISOString().substring(0, 10),
        tipo,
        concepto: `Parcialidad convenio ${convenioId.substring(0, 8)}`,
        origen: 'nativo',
      },
    });

    const nuevoPagado = Number(convenio.montoPagado) + monto;
    const nuevasRestantes = convenio.parcialidadesRestantes - 1;
    const saldoAFavor = Math.max(0, nuevoPagado - Number(convenio.montoTotal));
    const nuevoEstado =
      nuevasRestantes <= 0 || nuevoPagado >= Number(convenio.montoTotal)
        ? 'Completado'
        : 'Activo';

    await this.prisma.convenio.update({
      where: { id: convenioId },
      data: {
        montoPagado: nuevoPagado,
        parcialidadesRestantes: Math.max(0, nuevasRestantes),
        saldoAFavor,
        estado: nuevoEstado,
      },
    });

    return {
      pagoId: pago.id,
      estado: nuevoEstado,
      saldoAFavor,
      parcialidadesRestantes: Math.max(0, nuevasRestantes),
    };
  }

  async cancelar(convenioId: string) {
    const convenio = await this.prisma.convenio.findUnique({ where: { id: convenioId } });
    if (!convenio) throw new NotFoundException('Convenio no encontrado');
    if (convenio.estado === 'Completado')
      throw new BadRequestException('No se puede cancelar un convenio completado');
    return this.prisma.convenio.update({
      where: { id: convenioId },
      data: { estado: 'Cancelado' },
    });
  }
}
