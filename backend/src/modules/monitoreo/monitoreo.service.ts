import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MonitoreoService {
  constructor(private readonly prisma: PrismaService) {}

  async listarLogs(params: {
    tipo?: string;
    estado?: string;
    desde?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const where = {
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.estado && { estado: params.estado }),
      ...(params.desde && { inicio: { gte: new Date(params.desde) } }),
    };
    const [data, total] = await Promise.all([
      this.prisma.logProceso.findMany({
        where,
        orderBy: { inicio: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.logProceso.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getDashboard() {
    const hace24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const tipos = [
      'ETL_PAGOS',
      'GIS_EXPORT',
      'POLIZA_COBROS',
      'POLIZA_FACTURACION',
      'VALIDACION_LECTURAS',
      'TIMBRADO',
    ];

    const resumen = await Promise.all(
      tipos.map(async (tipo) => {
        const logs = await this.prisma.logProceso.findMany({
          where: { tipo, inicio: { gte: hace24h } },
          orderBy: { inicio: 'desc' },
          take: 10,
          select: {
            id: true,
            estado: true,
            inicio: true,
            fin: true,
            registros: true,
            errores: true,
            duracionMs: true,
            errorMsg: true,
          },
        });
        const ultimo = logs[0] ?? null;
        const errores = logs.filter((l) => l.estado === 'Error').length;
        const saludable =
          logs.length === 0 ||
          ultimo?.estado === 'Completado' ||
          ultimo?.estado === 'Advertencia';
        return { tipo, total: logs.length, errores, ultimo, saludable };
      }),
    );

    return { generadoEn: new Date(), procesos: resumen };
  }

  async registrarManual(dto: {
    tipo: string;
    subTipo?: string;
    estado: string;
    registros?: number;
    errores?: number;
    errorMsg?: string;
    detalle?: object;
    usuarioId?: string;
  }) {
    return this.prisma.logProceso.create({ data: { ...dto } });
  }
}
