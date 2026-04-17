import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CatalogosOperativosService {
  constructor(private readonly prisma: PrismaService) {}

  findAdministraciones() {
    return this.prisma.administracion.findMany({
      select: { id: true, nombre: true },
      orderBy: { nombre: 'asc' },
    });
  }

  private activeFilter(activo?: string) {
    if (activo === 'true') return { activo: true };
    if (activo === 'false') return { activo: false };
    return {};
  }

  // ─── Marcas de Medidor ─────────────────────────────────────────────────────

  findMarcasMedidor(filters: { activo?: string }) {
    return this.prisma.catalogoMarcaMedidor.findMany({
      where: this.activeFilter(filters.activo),
      include: { modelos: true },
      orderBy: { nombre: 'asc' },
    });
  }

  createMarcaMedidor(data: { codigo: string; nombre: string }) {
    return this.prisma.catalogoMarcaMedidor.create({ data });
  }

  updateMarcaMedidor(id: string, data: { nombre?: string; activo?: boolean }) {
    return this.prisma.catalogoMarcaMedidor.update({ where: { id }, data });
  }

  // ─── Modelos de Medidor ────────────────────────────────────────────────────

  findModelosMedidor(filters: { activo?: string; marcaId?: string }) {
    return this.prisma.catalogoModeloMedidor.findMany({
      where: {
        ...this.activeFilter(filters.activo),
        ...(filters.marcaId ? { marcaId: filters.marcaId } : {}),
      },
      include: { marca: true },
      orderBy: { nombre: 'asc' },
    });
  }

  createModeloMedidor(data: { marcaId: string; codigo: string; nombre: string }) {
    return this.prisma.catalogoModeloMedidor.create({ data });
  }

  updateModeloMedidor(id: string, data: { nombre?: string; activo?: boolean }) {
    return this.prisma.catalogoModeloMedidor.update({ where: { id }, data });
  }

  // ─── Calibres ──────────────────────────────────────────────────────────────

  findCalibres(filters: { activo?: string }) {
    return this.prisma.catalogoCalibre.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { diametroMm: 'asc' },
    });
  }

  createCalibre(data: { codigo: string; descripcion: string; diametroMm?: number }) {
    return this.prisma.catalogoCalibre.create({ data });
  }

  // ─── Emplazamientos ────────────────────────────────────────────────────────

  findEmplazamientos(filters: { activo?: string }) {
    return this.prisma.catalogoEmplazamiento.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { descripcion: 'asc' },
    });
  }

  // ─── Tipos de Contador ─────────────────────────────────────────────────────

  findTiposContador(filters: { activo?: string }) {
    return this.prisma.catalogoTipoContador.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { descripcion: 'asc' },
    });
  }

  // ─── Formas de Pago ────────────────────────────────────────────────────────

  findFormasPago(filters: { activo?: string; tipoRecaudacion?: string }) {
    return this.prisma.formaPago.findMany({
      where: {
        ...this.activeFilter(filters.activo),
        ...(filters.tipoRecaudacion ? { tipoRecaudacion: filters.tipoRecaudacion } : {}),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  createFormaPago(data: {
    codigo: string;
    nombre: string;
    tipoRecaudacion: string;
    aceptaEfectivo?: boolean;
    aceptaCheque?: boolean;
    aceptaTarjeta?: boolean;
    aceptaTransf?: boolean;
    requiereReferencia?: boolean;
  }) {
    return this.prisma.formaPago.create({ data });
  }

  updateFormaPago(id: string, data: { nombre?: string; activo?: boolean }) {
    return this.prisma.formaPago.update({ where: { id }, data });
  }

  // ─── Oficinas ──────────────────────────────────────────────────────────────

  findOficinas(filters: { activo?: string; administracionId?: string }) {
    return this.prisma.oficina.findMany({
      where: {
        ...this.activeFilter(filters.activo),
        ...(filters.administracionId ? { administracionId: filters.administracionId } : {}),
      },
      include: { administracion: true, tipoOficina: true },
      orderBy: { nombre: 'asc' },
    });
  }

  findTiposOficina(filters: { activo?: string }) {
    return this.prisma.tipoOficina.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { descripcion: 'asc' },
    });
  }

  // ─── Sectores Hidráulicos ──────────────────────────────────────────────────

  findSectoresHidraulicos(filters: { activo?: string; administracionId?: string }) {
    return this.prisma.sectorHidraulico.findMany({
      where: {
        ...this.activeFilter(filters.activo),
        ...(filters.administracionId ? { administracionId: filters.administracionId } : {}),
      },
      include: { administracion: true },
      orderBy: { nombre: 'asc' },
    });
  }

  // ─── Clases de Contrato ────────────────────────────────────────────────────

  findClasesContrato(filters: { activo?: string }) {
    return this.prisma.claseContrato.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { codigo: 'asc' },
    });
  }

  // ─── Tipos de Vía ─────────────────────────────────────────────────────────

  findTiposVia(filters: { activo?: string }) {
    return this.prisma.tipoVia.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { descripcion: 'asc' },
    });
  }

  // ─── Tipos de Variable ────────────────────────────────────────────────────

  findTiposVariable(filters: { activo?: string }) {
    return this.prisma.tipoVariable.findMany({
      where: this.activeFilter(filters.activo),
      orderBy: { nombre: 'asc' },
    });
  }

  // ─── Variables por Tipo Contratación ──────────────────────────────────────

  findVariablesTipoContratacion(tipoContratacionId: string) {
    return this.prisma.variableTipoContratacion.findMany({
      where: { tipoContratacionId },
      include: { tipoVariable: true },
      orderBy: { orden: 'asc' },
    });
  }

  assignVariableTipoContratacion(data: {
    tipoContratacionId: string;
    tipoVariableId: string;
    obligatorio?: boolean;
    valorDefecto?: string;
    orden?: number;
  }) {
    return this.prisma.variableTipoContratacion.upsert({
      where: {
        tipoContratacionId_tipoVariableId: {
          tipoContratacionId: data.tipoContratacionId,
          tipoVariableId: data.tipoVariableId,
        },
      },
      update: {
        obligatorio: data.obligatorio,
        valorDefecto: data.valorDefecto,
        orden: data.orden,
      },
      create: data,
    });
  }

  removeVariableTipoContratacion(tipoContratacionId: string, tipoVariableId: string) {
    return this.prisma.variableTipoContratacion.delete({
      where: {
        tipoContratacionId_tipoVariableId: {
          tipoContratacionId,
          tipoVariableId,
        },
      },
    });
  }
}
