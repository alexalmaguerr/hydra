import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SolicitudesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Folio generation ──────────────────────────────────────────────────────
  private async generarFolio(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SOL-${year}-`;
    const last = await this.prisma.solicitud.findFirst({
      where: { folio: { startsWith: prefix } },
      orderBy: { folio: 'desc' },
    });
    const seq = last
      ? parseInt(last.folio.replace(prefix, ''), 10) + 1
      : 1;
    return `${prefix}${String(seq).padStart(3, '0')}`;
  }

  // ── CRUD ──────────────────────────────────────────────────────────────────
  async findAll(params: { estado?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const where = params.estado ? { estado: params.estado } : {};

    const [data, total] = await Promise.all([
      this.prisma.solicitud.findMany({
        where,
        include: { inspeccion: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.solicitud.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const s = await this.prisma.solicitud.findUnique({
      where: { id },
      include: { inspeccion: true },
    });
    if (!s) throw new NotFoundException('Solicitud no encontrada');
    return s;
  }

  async create(dto: {
    propTipoPersona: string;
    propNombreCompleto: string;
    propRfc?: string;
    propCorreo?: string;
    propTelefono?: string;
    predioResumen: string;
    claveCatastral?: string;
    adminId?: string;
    tipoContratacionId?: string;
    formData: object;
  }) {
    const folio = await this.generarFolio();
    return this.prisma.solicitud.create({
      data: {
        folio,
        propTipoPersona: dto.propTipoPersona,
        propNombreCompleto: dto.propNombreCompleto,
        propRfc: dto.propRfc ?? null,
        propCorreo: dto.propCorreo ?? null,
        propTelefono: dto.propTelefono ?? null,
        predioResumen: dto.predioResumen,
        claveCatastral: dto.claveCatastral ?? null,
        adminId: dto.adminId ?? null,
        tipoContratacionId: dto.tipoContratacionId ?? null,
        estado: 'inspeccion_pendiente',
        formData: dto.formData,
      },
      include: { inspeccion: true },
    });
  }

  async updateFormData(id: string, dto: {
    propNombreCompleto?: string;
    propRfc?: string;
    propCorreo?: string;
    propTelefono?: string;
    predioResumen?: string;
    claveCatastral?: string;
    adminId?: string;
    tipoContratacionId?: string;
    formData?: object;
  }) {
    await this.findOne(id);
    return this.prisma.solicitud.update({
      where: { id },
      data: {
        ...(dto.propNombreCompleto && { propNombreCompleto: dto.propNombreCompleto }),
        ...(dto.propRfc !== undefined && { propRfc: dto.propRfc }),
        ...(dto.propCorreo !== undefined && { propCorreo: dto.propCorreo }),
        ...(dto.propTelefono !== undefined && { propTelefono: dto.propTelefono }),
        ...(dto.predioResumen && { predioResumen: dto.predioResumen }),
        ...(dto.claveCatastral !== undefined && { claveCatastral: dto.claveCatastral }),
        ...(dto.adminId !== undefined && { adminId: dto.adminId }),
        ...(dto.tipoContratacionId !== undefined && { tipoContratacionId: dto.tipoContratacionId }),
        ...(dto.formData && { formData: dto.formData }),
      },
      include: { inspeccion: true },
    });
  }

  // ── Inspection upsert ──────────────────────────────────────────────────────
  async upsertInspeccion(
    solicitudId: string,
    data: {
      estado: string;
      inspector?: string;
      fechaInspeccion?: string;
      materialCalle?: string;
      materialBanqueta?: string;
      metrosRupturaCalle?: string;
      metrosRupturaBanqueta?: string;
      existeRed?: string;
      distanciaRed?: string;
      presionRed?: string;
      tipoMaterialRed?: string;
      profundidadRed?: string;
      diametroToma?: string;
      tomaExistente?: string;
      diametroTomaExistente?: string;
      estadoTomaExistente?: string;
      medidorExistente?: string;
      numMedidorExistente?: string;
      observaciones?: string;
    },
  ) {
    await this.findOne(solicitudId);

    const nextEstado = data.estado === 'completada' ? 'en_cotizacion' : 'inspeccion_en_proceso';

    await this.prisma.solicitud.update({
      where: { id: solicitudId },
      data: { estado: nextEstado },
    });

    const inspeccion = await this.prisma.solicitudInspeccion.upsert({
      where: { solicitudId },
      create: { solicitudId, ...data },
      update: { ...data },
    });

    return this.prisma.solicitud.findUnique({
      where: { id: solicitudId },
      include: { inspeccion: true },
    });
  }

  // ── Accept — creates a Contrato and links it ──────────────────────────────
  async aceptar(id: string) {
    const sol = await this.findOne(id);

    // Create the contrato
    const formData = sol.formData as any;
    const contrato = await this.prisma.contrato.create({
      data: {
        tipoContrato: 'NORMAL',
        tipoServicio: 'AGUA_POTABLE',
        nombre: sol.propNombreCompleto,
        rfc: sol.propRfc || 'XAXX010101000',
        direccion: sol.predioResumen,       // ← ubicación del predio como valor por defecto
        contacto: sol.propTelefono || '',
        estado: 'Pendiente de alta',
        fecha: new Date().toISOString().split('T')[0],
        tipoContratacionId: sol.tipoContratacionId ?? null,
        domiciliado: false,
        superficiePredio: formData?.superficieTotal
          ? parseFloat(formData.superficieTotal)
          : null,
        superficieConstruida: formData?.superficieConstruida
          ? parseFloat(formData.superficieConstruida)
          : null,
        personasHabitanVivienda: formData?.personasVivienda
          ? parseInt(formData.personasVivienda, 10)
          : null,
      },
    });

    // Link contrato to solicitud and update estado
    await this.prisma.solicitud.update({
      where: { id },
      data: { estado: 'aceptada', contratoId: contrato.id },
    });

    return { solicitudId: id, contratoId: contrato.id, folio: contrato.id };
  }

  // ── Reject ────────────────────────────────────────────────────────────────
  async rechazar(id: string) {
    await this.findOne(id);
    return this.prisma.solicitud.update({
      where: { id },
      data: { estado: 'rechazada' },
      include: { inspeccion: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.solicitud.delete({ where: { id } });
  }
}
