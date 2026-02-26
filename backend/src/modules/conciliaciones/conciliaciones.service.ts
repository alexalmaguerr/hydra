import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

type TipoConciliacion =
  | 'PADRON_VS_GIS'
  | 'RECAUDACION_VS_FACTURACION'
  | 'FACTURACION_VS_CONTABILIDAD';

@Injectable()
export class ConciliacionesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(params: { tipo?: string; periodo?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.periodo && { periodo: params.periodo }),
    };
    const [data, total] = await Promise.all([
      this.prisma.conciliacionReporte.findMany({
        where,
        orderBy: { ejecutadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conciliacionReporte.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async ejecutar(tipo: TipoConciliacion, periodo: string) {
    switch (tipo) {
      case 'RECAUDACION_VS_FACTURACION':
        return this.conciliarRecaudacionVsFacturacion(periodo);
      case 'FACTURACION_VS_CONTABILIDAD':
        return this.conciliarFacturacionVsContabilidad(periodo);
      case 'PADRON_VS_GIS':
        return this.conciliarPadronVsGis(periodo);
      default:
        throw new BadRequestException(`Tipo de conciliación desconocido: ${tipo}`);
    }
  }

  private async conciliarRecaudacionVsFacturacion(periodo: string) {
    const [year, month] = periodo.split('-').map(Number);
    const desde = new Date(year, month - 1, 1);
    const hasta = new Date(year, month, 0, 23, 59, 59);

    const timbrados = await this.prisma.timbrado.findMany({
      where: { periodo, estado: 'Timbrada OK' },
      select: { id: true, total: true },
    });
    const montoFacturacion = timbrados.reduce((s, t) => s + Number(t.total), 0);

    const pagos = await this.prisma.pago.findMany({
      where: { createdAt: { gte: desde, lte: hasta } },
      select: { id: true, monto: true, tipo: true, origen: true },
    });
    const montoRecaudacion = pagos.reduce((s, p) => s + Number(p.monto), 0);

    const diferencias: object[] = [];
    if (Math.abs(montoFacturacion - montoRecaudacion) > 0.01) {
      diferencias.push({
        campo: 'montoTotal',
        facturacion: montoFacturacion,
        recaudacion: montoRecaudacion,
        brecha: montoRecaudacion - montoFacturacion,
      });
    }

    return this.prisma.conciliacionReporte.create({
      data: {
        tipo: 'RECAUDACION_VS_FACTURACION',
        periodo,
        totalSistemaA: timbrados.length,
        totalSistemaB: pagos.length,
        coincidencias: diferencias.length === 0 ? timbrados.length : 0,
        diferencias: diferencias.length,
        montoSistemaA: new Decimal(montoFacturacion),
        montoSistemaB: new Decimal(montoRecaudacion),
        montoDiferencia: new Decimal(montoRecaudacion - montoFacturacion),
        detalles: diferencias,
      },
    });
  }

  private async conciliarFacturacionVsContabilidad(periodo: string) {
    const timbrados = await this.prisma.timbrado.findMany({
      where: { periodo, estado: 'Timbrada OK' },
      select: { id: true, total: true },
    });
    const totalFacturado = timbrados.reduce((s, t) => s + Number(t.total), 0);

    let totalPolizas = 0;
    let numPolizas = 0;
    try {
      const polizas = await this.prisma.poliza.findMany({
        where: { periodo, tipo: 'Facturacion' },
        select: { id: true },
      });
      numPolizas = polizas.length;
      // Poliza doesn't have a total field — sum from lineas
      const lineas = await this.prisma.lineaPoliza.aggregate({
        where: { poliza: { periodo, tipo: 'Facturacion' }, indicador: '40' },
        _sum: { monto: true },
      });
      totalPolizas = Number(lineas._sum.monto ?? 0);
    } catch {
      // Poliza model may not have data yet
    }

    const brecha = totalPolizas - totalFacturado;
    const detalles: object[] =
      Math.abs(brecha) > 0.01
        ? [{ campo: 'monto', facturado: totalFacturado, polizas: totalPolizas, brecha }]
        : [];

    return this.prisma.conciliacionReporte.create({
      data: {
        tipo: 'FACTURACION_VS_CONTABILIDAD',
        periodo,
        totalSistemaA: timbrados.length,
        totalSistemaB: numPolizas,
        coincidencias: detalles.length === 0 ? timbrados.length : 0,
        diferencias: detalles.length,
        montoSistemaA: new Decimal(totalFacturado),
        montoSistemaB: new Decimal(totalPolizas),
        montoDiferencia: new Decimal(brecha),
        detalles,
      },
    });
  }

  private async conciliarPadronVsGis(periodo: string) {
    const contratos = await this.prisma.contrato.count({ where: { estado: 'Activo' } });

    let totalGis = 0;
    let sinGis: string[] = [];
    try {
      const cambiosGis = await this.prisma.cambioGIS.findMany({
        where: { entidad: 'Contrato', exportado: true },
        select: { entidadId: true },
        distinct: ['entidadId'],
      });
      totalGis = cambiosGis.length;
      const idsGis = new Set(cambiosGis.map((c) => c.entidadId));
      const todosContratos = await this.prisma.contrato.findMany({
        where: { estado: 'Activo' },
        select: { id: true },
      });
      sinGis = todosContratos.filter((c) => !idsGis.has(c.id)).map((c) => c.id);
    } catch {
      // CambioGIS may have no data yet
    }

    return this.prisma.conciliacionReporte.create({
      data: {
        tipo: 'PADRON_VS_GIS',
        periodo,
        totalSistemaA: contratos,
        totalSistemaB: totalGis,
        coincidencias: contratos - sinGis.length,
        diferencias: sinGis.length,
        detalles: sinGis.length > 0 ? { contratosSinGis: sinGis.slice(0, 100) } : {},
      },
    });
  }

  async marcarEstado(id: string, estado: string) {
    return this.prisma.conciliacionReporte.update({ where: { id }, data: { estado } });
  }
}
