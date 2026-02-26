import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TramitesService {
  constructor(private readonly prisma: PrismaService) {}

  private async generarFolio(tipo: string): Promise<string> {
    const hoy = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const count = await this.prisma.tramite.count({ where: { tipo } });
    return `${tipo.substring(0, 3).toUpperCase()}-${hoy}-${(count + 1).toString().padStart(4, '0')}`;
  }

  async findAll(params: {
    contratoId?: string;
    tipo?: string;
    estado?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.contratoId && { contratoId: params.contratoId }),
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
    };
    const [data, total] = await Promise.all([
      this.prisma.tramite.findMany({
        where,
        include: {
          contrato: { select: { id: true, nombre: true } },
          persona: { select: { id: true, nombre: true, rfc: true } },
          documentos: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.tramite.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const t = await this.prisma.tramite.findUnique({
      where: { id },
      include: {
        contrato: { select: { id: true, nombre: true, estado: true, zonaId: true } },
        persona: { select: { id: true, nombre: true, rfc: true, tipo: true } },
        documentos: true,
        historial: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!t) throw new NotFoundException('Trámite no encontrado');
    return t;
  }

  async create(dto: {
    contratoId?: string;
    personaId?: string;
    tipo: string;
    descripcion?: string;
    datosAdicionales?: object;
  }) {
    const folio = await this.generarFolio(dto.tipo);
    return this.prisma.tramite.create({
      data: {
        folio,
        contratoId: dto.contratoId ?? null,
        personaId: dto.personaId ?? null,
        tipo: dto.tipo,
        descripcion: dto.descripcion ?? null,
        datosAdicionales: dto.datosAdicionales ?? undefined,
      },
      include: {
        contrato: { select: { id: true, nombre: true } },
        documentos: true,
      },
    });
  }

  async updateEstado(id: string, estado: string, aprobadoPor?: string) {
    const tramite = await this.findOne(id);
    const estadosValidos = ['Iniciado', 'EnRevision', 'Aprobado', 'Rechazado', 'Completado', 'Cancelado'];
    if (!estadosValidos.includes(estado)) throw new BadRequestException('Estado inválido');

    const data: any = { estado };
    if (estado === 'Aprobado' || estado === 'Completado') {
      data.aprobadoPor = aprobadoPor ?? null;
      data.fechaAprobacion = new Date();
    }

    const updated = await this.prisma.tramite.update({ where: { id }, data });

    if (estado === 'Completado' && tramite.contratoId) {
      await this.ejecutarEfectosTramite(tramite);
    }

    return updated;
  }

  private async ejecutarEfectosTramite(tramite: any) {
    const { tipo, contratoId, datosAdicionales } = tramite;
    const d = datosAdicionales as any;

    switch (tipo) {
      case 'CambioNombre': {
        if (d?.nombre_nuevo) {
          const anterior = await this.prisma.contrato.findUnique({
            where: { id: contratoId },
            select: { nombre: true },
          });
          await this.prisma.contrato.update({
            where: { id: contratoId },
            data: { nombre: d.nombre_nuevo },
          });
          await this.prisma.historicoContrato.create({
            data: {
              contratoId,
              campo: 'nombre',
              valorAnterior: anterior?.nombre,
              valorNuevo: d.nombre_nuevo,
              motivo: `Trámite ${tramite.folio}`,
              tramiteId: tramite.id,
            },
          });
        }
        break;
      }
      case 'Baja': {
        await this.prisma.contrato.update({
          where: { id: contratoId },
          data: { estado: 'Inactivo' },
        });
        await this.prisma.historicoContrato.create({
          data: {
            contratoId,
            campo: 'estado',
            valorAnterior: 'Activo',
            valorNuevo: 'Inactivo',
            motivo: `Baja: ${tramite.folio}`,
            tramiteId: tramite.id,
          },
        });
        break;
      }
      case 'CambioTarifa': {
        if (d?.tipo_servicio_nuevo) {
          const anterior = await this.prisma.contrato.findUnique({
            where: { id: contratoId },
            select: { tipoServicio: true },
          });
          await this.prisma.contrato.update({
            where: { id: contratoId },
            data: { tipoServicio: d.tipo_servicio_nuevo },
          });
          await this.prisma.historicoContrato.create({
            data: {
              contratoId,
              campo: 'tipoServicio',
              valorAnterior: anterior?.tipoServicio,
              valorNuevo: d.tipo_servicio_nuevo,
              motivo: `Trámite ${tramite.folio}`,
              tramiteId: tramite.id,
            },
          });
        }
        break;
      }
    }
  }

  async addDocumento(
    tramiteId: string,
    data: { nombre: string; tipo: string; url?: string; notas?: string },
  ) {
    await this.findOne(tramiteId);
    return this.prisma.documento.create({ data: { tramiteId, ...data } });
  }

  async verificarDocumento(documentoId: string, verificado: boolean) {
    return this.prisma.documento.update({ where: { id: documentoId }, data: { verificado } });
  }
}
