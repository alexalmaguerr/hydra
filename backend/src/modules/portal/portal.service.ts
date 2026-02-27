import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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

  /** T13: Timbrado download metadata — in production stream the actual XML/PDF file. */
  async getTimbradoDescarga(timbradoId: string, contratoIds: string[]) {
    const timbrado = await this.prisma.timbrado.findUnique({
      where: { id: timbradoId },
      select: {
        id: true,
        contratoId: true,
        uuid: true,
        estado: true,
        periodo: true,
        total: true,
        fechaEmision: true,
      },
    });
    if (!timbrado) throw new NotFoundException('Timbrado no encontrado');
    this.assertOwns(timbrado.contratoId, contratoIds);

    // Stub: return download metadata; real implementation would stream file from storage
    return {
      timbradoId: timbrado.id,
      uuid: timbrado.uuid,
      periodo: timbrado.periodo,
      total: timbrado.total,
      fechaEmision: timbrado.fechaEmision,
      _stub: true,
      message: 'Descarga no disponible en modo demo. UUID incluido para referencia SAT.',
      xmlUrl: timbrado.uuid ? `https://sat.gob.mx/verificaxml/${timbrado.uuid}` : null,
    };
  }

  /** T14: Update datos fiscales from portal. */
  async updateDatosFiscales(
    contratoId: string,
    contratoIds: string[],
    data: { rfc?: string; razonSocial?: string; regimenFiscal?: string; constanciaFiscalUrl?: string },
  ) {
    this.assertOwns(contratoId, contratoIds);
    if (!data.rfc && !data.razonSocial && !data.regimenFiscal && !data.constanciaFiscalUrl) {
      throw new BadRequestException('No se proporcionaron campos a actualizar');
    }
    return this.prisma.contrato.update({
      where: { id: contratoId },
      data: {
        ...(data.rfc && { rfc: data.rfc }),
        ...(data.razonSocial !== undefined && { razonSocial: data.razonSocial }),
        ...(data.regimenFiscal !== undefined && { regimenFiscal: data.regimenFiscal }),
        ...(data.constanciaFiscalUrl !== undefined && { constanciaFiscalUrl: data.constanciaFiscalUrl }),
      },
      select: {
        id: true,
        nombre: true,
        rfc: true,
        razonSocial: true,
        regimenFiscal: true,
        constanciaFiscalUrl: true,
      },
    });
  }

  /** T14: Get datos fiscales. */
  async getDatosFiscales(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: {
        id: true,
        nombre: true,
        rfc: true,
        razonSocial: true,
        regimenFiscal: true,
        constanciaFiscalUrl: true,
      },
    });
  }

  /** T15: Get contacts linked to contrato. */
  async getContactos(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.rolPersonaContrato.findMany({
      where: { contratoId, activo: true },
      include: { persona: { select: { id: true, nombre: true, rfc: true, email: true, telefono: true, tipo: true } } },
      orderBy: { fechaDesde: 'desc' },
    });
  }

  /** T15: Link a persona as contact of contrato. */
  async addContacto(
    contratoId: string,
    contratoIds: string[],
    data: { personaId?: string; nombre?: string; rfc?: string; email?: string; telefono?: string; rol: string },
  ) {
    this.assertOwns(contratoId, contratoIds);

    let personaId = data.personaId;
    if (!personaId) {
      // Create new persona if not existing
      if (!data.nombre) throw new BadRequestException('nombre es requerido para crear un contacto nuevo');
      const persona = await this.prisma.persona.create({
        data: {
          nombre: data.nombre,
          rfc: data.rfc ?? null,
          email: data.email ?? null,
          telefono: data.telefono ?? null,
        },
      });
      personaId = persona.id;
    }

    return this.prisma.rolPersonaContrato.create({
      data: {
        personaId,
        contratoId,
        rol: data.rol,
      },
      include: { persona: { select: { id: true, nombre: true, rfc: true, email: true, telefono: true } } },
    });
  }

  /** T4: Orders visible from portal. */
  async getOrdenes(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    return this.prisma.orden.findMany({
      where: { contratoId },
      include: { seguimientos: { orderBy: { fecha: 'desc' }, take: 3 } },
      orderBy: { fechaSolicitud: 'desc' },
    });
  }

  /** T1: Estado operativo visible from portal. */
  async getEstadoOperativo(contratoId: string, contratoIds: string[]) {
    this.assertOwns(contratoId, contratoIds);
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: { id: true, nombre: true, estado: true, bloqueadoJuridico: true, fechaReconexionPrevista: true },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const [facturadoAgg, pagadoAgg] = await Promise.all([
      this.prisma.timbrado.aggregate({ where: { contratoId, estado: 'Timbrada OK' }, _sum: { total: true } }),
      this.prisma.pago.aggregate({ where: { contratoId }, _sum: { monto: true } }),
    ]);
    const montoAdeudo = Math.max(0, Number(facturadoAgg._sum.total ?? 0) - Number(pagadoAgg._sum.monto ?? 0));
    return {
      contratoId,
      estado: contrato.estado,
      bloqueadoJuridico: contrato.bloqueadoJuridico,
      tieneAdeudo: montoAdeudo > 0.01,
      montoAdeudo,
      fechaReconexionPrevista: contrato.fechaReconexionPrevista,
    };
  }
}
