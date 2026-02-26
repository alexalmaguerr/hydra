import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { Prisma } from '@prisma/client';

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

  async update(id: string, dto: { ceaNumContrato?: string | null; estado?: string; domiciliado?: boolean; fechaReconexionPrevista?: string | null }) {
    await this.findOne(id);
    return this.prisma.contrato.update({
      where: { id },
      data: {
        ...(dto.ceaNumContrato !== undefined && { ceaNumContrato: dto.ceaNumContrato }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.domiciliado !== undefined && { domiciliado: dto.domiciliado }),
        ...(dto.fechaReconexionPrevista !== undefined && { fechaReconexionPrevista: dto.fechaReconexionPrevista }),
      },
    });
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
        ceaNumContrato: dto.ceaNumContrato ?? null,
      },
    });
  }
}
