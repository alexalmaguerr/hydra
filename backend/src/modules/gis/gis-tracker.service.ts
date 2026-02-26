import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const ENTIDADES_GIS = ['Contrato', 'Medidor', 'Zona', 'Distrito', 'Toma', 'Ruta'] as const;
type EntidadGIS = (typeof ENTIDADES_GIS)[number];

@Injectable()
export class GisTrackerService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarCambio(params: {
    entidad: EntidadGIS;
    entidadId: string;
    accion: 'insert' | 'update' | 'delete';
    camposModificados?: Record<string, { anterior: unknown; nuevo: unknown }>;
    datosSnapshot?: object;
  }) {
    return this.prisma.cambioGIS.create({
      data: {
        entidad: params.entidad,
        entidadId: params.entidadId,
        accion: params.accion,
        camposModificados: (params.camposModificados as any) ?? undefined,
        datosSnapshot: (params.datosSnapshot as any) ?? undefined,
      },
    });
  }

  async getCambiosPendientes(params?: { entidades?: EntidadGIS[]; desde?: Date }) {
    const where: any = {
      exportado: false,
      ...(params?.entidades?.length && { entidad: { in: params.entidades } }),
      ...(params?.desde && { createdAt: { gte: params.desde } }),
    };
    return this.prisma.cambioGIS.findMany({
      where,
      orderBy: [{ entidad: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getFechaUltimaSyncExitosa(): Promise<Date | null> {
    const ultima = await this.prisma.logSincronizacion.findFirst({
      where: { tipo: 'GIS', estado: 'exitosa' },
      orderBy: { fechaFin: 'desc' },
      select: { fechaFin: true },
    });
    return ultima?.fechaFin ?? null;
  }
}
