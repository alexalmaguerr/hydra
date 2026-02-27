import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { Prisma } from '@prisma/client';

// Estados que implican servicio activo
const ESTADOS_ACTIVOS = ['Activo', 'activo'];
// Estados cortados que pueden reconectarse
const ESTADOS_CORTADOS = ['Cortado', 'cortado'];
// Estados de baja que bloquean la mayoria de tramites
const ESTADOS_BAJA = ['BajaTemp', 'BajaDef', 'Baja Temporal', 'Baja Definitiva'];

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

  async update(
    id: string,
    dto: {
      ceaNumContrato?: string | null;
      estado?: string;
      domiciliado?: boolean;
      fechaReconexionPrevista?: string | null;
      bloqueadoJuridico?: boolean;
      razonSocial?: string | null;
      regimenFiscal?: string | null;
      constanciaFiscalUrl?: string | null;
    },
  ) {
    await this.findOne(id);
    return this.prisma.contrato.update({
      where: { id },
      data: {
        ...(dto.ceaNumContrato !== undefined && { ceaNumContrato: dto.ceaNumContrato }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.domiciliado !== undefined && { domiciliado: dto.domiciliado }),
        ...(dto.fechaReconexionPrevista !== undefined && { fechaReconexionPrevista: dto.fechaReconexionPrevista }),
        ...(dto.bloqueadoJuridico !== undefined && { bloqueadoJuridico: dto.bloqueadoJuridico }),
        ...(dto.razonSocial !== undefined && { razonSocial: dto.razonSocial }),
        ...(dto.regimenFiscal !== undefined && { regimenFiscal: dto.regimenFiscal }),
        ...(dto.constanciaFiscalUrl !== undefined && { constanciaFiscalUrl: dto.constanciaFiscalUrl }),
      },
    });
  }

  async getEstadoOperativo(contratoId: string) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: {
        id: true,
        nombre: true,
        estado: true,
        bloqueadoJuridico: true,
        fechaReconexionPrevista: true,
      },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const [totalFacturadoAgg, totalPagadoAgg, convenioActivo] = await Promise.all([
      this.prisma.timbrado.aggregate({
        where: { contratoId, estado: 'Timbrada OK' },
        _sum: { total: true },
      }),
      this.prisma.pago.aggregate({
        where: { contratoId },
        _sum: { monto: true },
      }),
      this.prisma.convenio.findFirst({
        where: { contratoId, estado: 'Activo' },
        select: { id: true, estado: true },
      }),
    ]);

    const totalFacturado = Number(totalFacturadoAgg._sum.total ?? 0);
    const totalPagado = Number(totalPagadoAgg._sum.monto ?? 0);
    const montoAdeudo = Math.max(0, totalFacturado - totalPagado);
    const tieneAdeudo = montoAdeudo > 0.01;

    const estadoNorm = contrato.estado ?? '';
    const esCortado = ESTADOS_CORTADOS.some(s => estadoNorm.toLowerCase().includes(s.toLowerCase()));
    const esActivo = ESTADOS_ACTIVOS.some(s => estadoNorm.toLowerCase() === s.toLowerCase());
    const esBaja = ESTADOS_BAJA.some(s => estadoNorm.toLowerCase().includes(s.toLowerCase()));
    const bloqueadoJuridico = contrato.bloqueadoJuridico;

    const alertas: string[] = [];

    if (bloqueadoJuridico) {
      alertas.push('Contrato con bloqueo jurídico. Comuníquese con el área legal antes de realizar cualquier trámite.');
    }
    if (tieneAdeudo && !bloqueadoJuridico) {
      alertas.push(`Adeudo pendiente de $${montoAdeudo.toFixed(2)} MXN. Algunos trámites requieren saldo en cero.`);
    }
    if (esCortado) {
      alertas.push('Servicio actualmente cortado. Para reconexión realice el pago total o convenga parcialidades.');
    }
    if (esBaja) {
      alertas.push('Contrato en proceso de baja. Las operaciones disponibles son limitadas.');
    }

    // Candado: solo puede tramitar alta/cambios de datos si no está bloqueado jurídicamente
    const canTramitar = !bloqueadoJuridico;
    // Reconexión: solo si está cortado (o tiene adeudo pero quiere convenio)
    const canReconectar = !bloqueadoJuridico && (esCortado || tieneAdeudo);
    // Baja temporal/definitiva: requiere adeudo cero
    const canBaja = !tieneAdeudo && !bloqueadoJuridico && !esBaja;
    // Convenios: solo si no está bloqueado jurídicamente
    const canConvenio = !bloqueadoJuridico && tieneAdeudo;

    return {
      contratoId: contrato.id,
      nombre: contrato.nombre,
      estado: contrato.estado,
      bloqueadoJuridico,
      tieneAdeudo,
      montoAdeudo,
      tieneConvenioActivo: !!convenioActivo,
      fechaReconexionPrevista: contrato.fechaReconexionPrevista,
      canTramitar,
      canReconectar,
      canBaja,
      canConvenio,
      alertas,
    };
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
