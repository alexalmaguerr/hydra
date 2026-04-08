import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

interface CreateTipoContratacionDto {
  codigo: string;
  nombre: string;
  descripcion?: string;
  requiereMedidor?: boolean;
}

interface UpdateTipoContratacionDto {
  nombre?: string;
  descripcion?: string;
  requiereMedidor?: boolean;
  activo?: boolean;
}

@Injectable()
export class TiposContratacionService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── CRUD TipoContratacion ─────────────────────────────────────────────────

  async findAll(params: { activo?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const where: Record<string, unknown> = {
      ...(params.activo !== undefined && { activo: params.activo === 'true' }),
    };
    const [data, total] = await Promise.all([
      this.prisma.tipoContratacion.findMany({
        where,
        include: {
          _count: { select: { contratos: true, conceptos: true, clausulas: true, documentos: true } },
        },
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tipoContratacion.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const tipo = await this.prisma.tipoContratacion.findFirst({
      where: { OR: [{ id }, { codigo: id }] },
      include: {
        _count: { select: { contratos: true } },
      },
    });
    if (!tipo) throw new NotFoundException(`TipoContratacion '${id}' no encontrado`);
    return tipo;
  }

  async create(dto: CreateTipoContratacionDto) {
    const existing = await this.prisma.tipoContratacion.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existing) throw new ConflictException(`Código '${dto.codigo}' ya existe`);

    return this.prisma.tipoContratacion.create({
      data: {
        codigo: dto.codigo,
        nombre: dto.nombre,
        descripcion: dto.descripcion ?? null,
        requiereMedidor: dto.requiereMedidor ?? true,
      },
    });
  }

  async update(id: string, dto: UpdateTipoContratacionDto) {
    const tipo = await this.findOne(id);
    return this.prisma.tipoContratacion.update({
      where: { id: tipo.id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.requiereMedidor !== undefined && { requiereMedidor: dto.requiereMedidor }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  // ─── Configuración (conceptos + cláusulas + documentos) ───────────────────

  async getConfiguracion(id: string) {
    const tipo = await this.prisma.tipoContratacion.findFirst({
      where: { OR: [{ id }, { codigo: id }] },
      include: {
        conceptos: {
          include: { conceptoCobro: true },
          orderBy: { orden: 'asc' },
        },
        clausulas: {
          include: { clausula: true },
          orderBy: { orden: 'asc' },
        },
        documentos: {
          orderBy: [{ obligatorio: 'desc' }, { createdAt: 'asc' }],
        },
      },
    });
    if (!tipo) throw new NotFoundException(`TipoContratacion '${id}' no encontrado`);
    return tipo;
  }

  // ─── Asociaciones: Conceptos ───────────────────────────────────────────────

  async agregarConcepto(tipoId: string, dto: { conceptoCobroId: string; obligatorio?: boolean; orden?: number }) {
    const tipo = await this.findOne(tipoId);
    const concepto = await this.prisma.conceptoCobro.findUnique({ where: { id: dto.conceptoCobroId } });
    if (!concepto) throw new NotFoundException(`ConceptoCobro '${dto.conceptoCobroId}' no encontrado`);

    const exists = await this.prisma.conceptoCobroTipoContratacion.findUnique({
      where: { tipoContratacionId_conceptoCobroId: { tipoContratacionId: tipo.id, conceptoCobroId: dto.conceptoCobroId } },
    });
    if (exists) throw new ConflictException('Este concepto ya está asociado al tipo de contratación');

    return this.prisma.conceptoCobroTipoContratacion.create({
      data: {
        tipoContratacionId: tipo.id,
        conceptoCobroId: dto.conceptoCobroId,
        obligatorio: dto.obligatorio ?? true,
        orden: dto.orden ?? 0,
      },
      include: { conceptoCobro: true },
    });
  }

  async removerConcepto(tipoId: string, conceptoCobroId: string) {
    const tipo = await this.findOne(tipoId);
    const assoc = await this.prisma.conceptoCobroTipoContratacion.findUnique({
      where: { tipoContratacionId_conceptoCobroId: { tipoContratacionId: tipo.id, conceptoCobroId } },
    });
    if (!assoc) throw new NotFoundException('Asociación no encontrada');
    return this.prisma.conceptoCobroTipoContratacion.delete({
      where: { tipoContratacionId_conceptoCobroId: { tipoContratacionId: tipo.id, conceptoCobroId } },
    });
  }

  // ─── Asociaciones: Cláusulas ───────────────────────────────────────────────

  async agregarClausula(tipoId: string, dto: { clausulaId: string; obligatorio?: boolean; orden?: number }) {
    const tipo = await this.findOne(tipoId);
    const clausula = await this.prisma.clausulaContractual.findUnique({ where: { id: dto.clausulaId } });
    if (!clausula) throw new NotFoundException(`ClausulaContractual '${dto.clausulaId}' no encontrada`);

    const exists = await this.prisma.clausulaTipoContratacion.findUnique({
      where: { tipoContratacionId_clausulaId: { tipoContratacionId: tipo.id, clausulaId: dto.clausulaId } },
    });
    if (exists) throw new ConflictException('Esta cláusula ya está asociada al tipo de contratación');

    return this.prisma.clausulaTipoContratacion.create({
      data: {
        tipoContratacionId: tipo.id,
        clausulaId: dto.clausulaId,
        obligatorio: dto.obligatorio ?? true,
        orden: dto.orden ?? 0,
      },
      include: { clausula: true },
    });
  }

  async removerClausula(tipoId: string, clausulaId: string) {
    const tipo = await this.findOne(tipoId);
    const assoc = await this.prisma.clausulaTipoContratacion.findUnique({
      where: { tipoContratacionId_clausulaId: { tipoContratacionId: tipo.id, clausulaId } },
    });
    if (!assoc) throw new NotFoundException('Asociación no encontrada');
    return this.prisma.clausulaTipoContratacion.delete({
      where: { tipoContratacionId_clausulaId: { tipoContratacionId: tipo.id, clausulaId } },
    });
  }

  // ─── Asociaciones: Documentos Requeridos ──────────────────────────────────

  async agregarDocumento(tipoId: string, dto: { nombreDocumento: string; descripcion?: string; obligatorio?: boolean }) {
    const tipo = await this.findOne(tipoId);
    return this.prisma.documentoRequeridoTipoContratacion.create({
      data: {
        tipoContratacionId: tipo.id,
        nombreDocumento: dto.nombreDocumento,
        descripcion: dto.descripcion ?? null,
        obligatorio: dto.obligatorio ?? true,
      },
    });
  }

  async removerDocumento(tipoId: string, documentoId: string) {
    await this.findOne(tipoId);
    const doc = await this.prisma.documentoRequeridoTipoContratacion.findUnique({
      where: { id: documentoId },
    });
    if (!doc || doc.tipoContratacionId !== (await this.findOne(tipoId)).id) {
      throw new NotFoundException('Documento no encontrado');
    }
    return this.prisma.documentoRequeridoTipoContratacion.delete({ where: { id: documentoId } });
  }

  // ─── Cambio de tipo de contrato (req 24) ──────────────────────────────────

  async cambiarTipoContrato(
    contratoId: string,
    nuevoTipoId: string,
    motivo: string,
    usuario?: string,
  ) {
    const contrato = await this.prisma.contrato.findUnique({
      where: { id: contratoId },
      select: { id: true, tipoContratacionId: true },
    });
    if (!contrato) throw new NotFoundException('Contrato no encontrado');

    const nuevoTipo = await this.findOne(nuevoTipoId);

    if (contrato.tipoContratacionId === nuevoTipo.id) {
      throw new BadRequestException('El contrato ya tiene este tipo de contratación');
    }

    const [updated] = await this.prisma.$transaction([
      // Actualizar el tipo en el contrato
      this.prisma.contrato.update({
        where: { id: contratoId },
        data: { tipoContratacionId: nuevoTipo.id },
      }),
      // Registrar el cambio en el histórico
      this.prisma.historicoContrato.create({
        data: {
          contratoId,
          campo: 'tipoContratacionId',
          valorAnterior: contrato.tipoContratacionId ?? null,
          valorNuevo: nuevoTipo.id,
          motivo,
          usuario: usuario ?? null,
        },
      }),
    ]);

    // Retornar la nueva configuración asociada al tipo
    const nuevaConfig = await this.getConfiguracion(nuevoTipo.id);
    return {
      contrato: updated,
      configuracion: nuevaConfig,
      advertencia:
        'El cambio aplica a períodos futuros. Pagos y pólizas previas no se modifican.',
    };
  }

  // ─── Catálogos: ConceptoCobro ──────────────────────────────────────────────

  async findConceptosCobro(params: { activo?: string } = {}) {
    return this.prisma.conceptoCobro.findMany({
      where: params.activo !== undefined ? { activo: params.activo === 'true' } : undefined,
      orderBy: { codigo: 'asc' },
    });
  }

  async createConceptoCobro(dto: {
    codigo: string;
    nombre: string;
    tipo: string;
    montoBase?: number;
    ivaPct?: number;
  }) {
    return this.prisma.conceptoCobro.create({ data: dto });
  }

  async updateConceptoCobro(id: string, dto: Partial<{ nombre: string; tipo: string; montoBase: number; ivaPct: number; activo: boolean }>) {
    return this.prisma.conceptoCobro.update({ where: { id }, data: dto });
  }

  // ─── Catálogos: ClausulaContractual ───────────────────────────────────────

  async findClausulas(params: { activo?: string } = {}) {
    return this.prisma.clausulaContractual.findMany({
      where: params.activo !== undefined ? { activo: params.activo === 'true' } : undefined,
      orderBy: { codigo: 'asc' },
    });
  }

  async createClausula(dto: { codigo: string; titulo: string; contenido: string; version?: string }) {
    return this.prisma.clausulaContractual.create({
      data: { ...dto, version: dto.version ?? '1.0' },
    });
  }

  async updateClausula(id: string, dto: Partial<{ titulo: string; contenido: string; version: string; activo: boolean }>) {
    return this.prisma.clausulaContractual.update({ where: { id }, data: dto });
  }
}
