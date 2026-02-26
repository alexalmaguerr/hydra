import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  private assertOwns(contratoId: string, contratoIds: string[]) {
    if (!contratoIds.includes(contratoId)) {
      throw new ForbiddenException('No tienes acceso a este contrato');
    }
  }

  async getContratos(contratoIds: string[]) {
    return this.prisma.contrato.findMany({
      where: { id: { in: contratoIds } },
      select: {
        id: true,
        nombre: true,
        rfc: true,
        tipoContrato: true,
        tipoServicio: true,
        estado: true,
        direccion: true,
        fecha: true,
        ceaNumContrato: true,
      },
      orderBy: { id: 'asc' },
    });
  }

  async getConsumos(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.consumo.findMany({
      where: { contratoId },
      orderBy: { periodo: 'desc' },
    });
  }

  async getTimbrados(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.timbrado.findMany({
      where: { contratoId },
      include: { recibos: true },
      orderBy: { periodo: 'desc' },
    });
  }

  async getRecibos(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.recibo.findMany({
      where: { contratoId },
      orderBy: { fechaVencimiento: 'desc' },
    });
  }

  async getPagos(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.pago.findMany({
      where: { contratoId },
      orderBy: { fecha: 'desc' },
    });
  }

  async getSaldos(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    const recibos = await this.prisma.recibo.findMany({
      where: { contratoId },
      select: { saldoVigente: true, saldoVencido: true },
    });
    const vencido = recibos.reduce((s, r) => s + Number(r.saldoVencido), 0);
    const vigente = recibos.reduce((s, r) => s + Number(r.saldoVigente), 0);
    return { vencido, vigente, total: vencido + vigente, intereses: 0 };
  }
}
