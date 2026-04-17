import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function optionalFkId(value?: string | null): string | null {
  if (value == null) return null;
  const t = String(value).trim();
  return t.length > 0 ? t : null;
}

interface CreatePuntoServicioDto {
  codigo: string;
  domicilioId?: string;
  tipoSuministroId?: string;
  estructuraTecnicaId?: string;
  zonaFacturacionId?: string;
  codigoRecorridoId?: string;
  tipoRelacionPadreId?: string;
  diametroToma?: string;
  materialTuberia?: string;
  profundidadToma?: number;
  tieneValvula?: boolean;
  tieneCaja?: boolean;
  gpsLat?: number;
  gpsLng?: number;
  estado?: string;
  cortable?: boolean;
  motivoNoCortable?: string;
}

interface UpdatePuntoServicioDto {
  domicilioId?: string;
  tipoSuministroId?: string;
  estructuraTecnicaId?: string;
  zonaFacturacionId?: string;
  codigoRecorridoId?: string;
  tipoRelacionPadreId?: string | null;
  diametroToma?: string;
  materialTuberia?: string;
  profundidadToma?: number;
  tieneValvula?: boolean;
  tieneCaja?: boolean;
  gpsLat?: number;
  gpsLng?: number;
  estado?: string;
  cortable?: boolean;
  motivoNoCortable?: string;
}

@Injectable()
export class PuntosServicioService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    estado?: string;
    tipoSuministroId?: string;
    domicilioId?: string;
    cortable?: string;
    page?: number;
    limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where: Record<string, unknown> = {
      ...(params.estado && { estado: params.estado }),
      ...(params.tipoSuministroId && { tipoSuministroId: params.tipoSuministroId }),
      ...(params.domicilioId && { domicilioId: params.domicilioId }),
      ...(params.cortable !== undefined && { cortable: params.cortable === 'true' }),
    };
    const [data, total] = await Promise.all([
      this.prisma.puntoServicio.findMany({
        where,
        include: {
          domicilio: { select: { id: true, calle: true, numExterior: true, codigoPostal: true } },
          tipoSuministro: { select: { id: true, codigo: true, descripcion: true } },
          estructuraTecnica: { select: { id: true, codigo: true, descripcion: true } },
          zonaFacturacion: { select: { id: true, codigo: true, descripcion: true } },
          codigoRecorrido: { select: { id: true, codigo: true, descripcion: true } },
          tipoRelacionPadre: {
            select: { id: true, codigo: true, descripcion: true, metodo: true, reparteConsumo: true },
          },
          puntoServicioPadre: { select: { id: true, codigo: true } },
          _count: { select: { puntosServicioHijos: true, contratos: true } },
        },
        orderBy: { codigo: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.puntoServicio.count({ where }),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const ps = await this.prisma.puntoServicio.findUnique({
      where: { id },
      include: {
        domicilio: {
          include: {
            coloniaINEGI: { include: { municipio: { include: { estado: true } } } },
            municipioINEGI: { include: { estado: true } },
            estadoINEGI: true,
          },
        },
        tipoSuministro: true,
        estructuraTecnica: true,
        zonaFacturacion: true,
        codigoRecorrido: true,
        tipoRelacionPadre: {
          select: { id: true, codigo: true, descripcion: true, metodo: true, reparteConsumo: true },
        },
        puntoServicioPadre: { select: { id: true, codigo: true, estado: true } },
        puntosServicioHijos: {
          select: { id: true, codigo: true, estado: true, reparticionConsumo: true },
        },
        contratos: { select: { id: true, nombre: true, estado: true } },
      },
    });
    if (!ps) throw new NotFoundException('Punto de servicio no encontrado');
    return ps;
  }

  async create(dto: CreatePuntoServicioDto) {
    const existing = await this.prisma.puntoServicio.findUnique({
      where: { codigo: dto.codigo },
    });
    if (existing) throw new BadRequestException(`Código '${dto.codigo}' ya existe`);

    const tipoRelacionPadreId = optionalFkId(dto.tipoRelacionPadreId);
    if (tipoRelacionPadreId) {
      const tr = await this.prisma.catalogoTipoRelacionPS.findUnique({
        where: { id: tipoRelacionPadreId },
        select: { id: true },
      });
      if (!tr) {
        throw new BadRequestException(
          `El tipo de relación PS indicado no existe (tipoRelacionPadreId: ${tipoRelacionPadreId}).`,
        );
      }
    }

    return this.prisma.puntoServicio.create({
      data: {
        codigo: dto.codigo,
        domicilioId: dto.domicilioId ?? null,
        tipoSuministroId: dto.tipoSuministroId ?? null,
        estructuraTecnicaId: dto.estructuraTecnicaId ?? null,
        zonaFacturacionId: dto.zonaFacturacionId ?? null,
        codigoRecorridoId: dto.codigoRecorridoId ?? null,
        tipoRelacionPadreId,
        diametroToma: dto.diametroToma ?? null,
        materialTuberia: dto.materialTuberia ?? null,
        profundidadToma: dto.profundidadToma ?? null,
        tieneValvula: dto.tieneValvula ?? false,
        tieneCaja: dto.tieneCaja ?? false,
        gpsLat: dto.gpsLat ?? null,
        gpsLng: dto.gpsLng ?? null,
        estado: dto.estado ?? 'Activo',
        cortable: dto.cortable ?? true,
        motivoNoCortable: dto.motivoNoCortable ?? null,
      },
      include: {
        tipoSuministro: { select: { id: true, codigo: true, descripcion: true } },
        estructuraTecnica: { select: { id: true, codigo: true, descripcion: true } },
      },
    });
  }

  async update(id: string, dto: UpdatePuntoServicioDto) {
    await this.findOne(id);
    if (dto.tipoRelacionPadreId !== undefined) {
      const tipoRelacionPadreId = optionalFkId(dto.tipoRelacionPadreId);
      if (tipoRelacionPadreId) {
        const tr = await this.prisma.catalogoTipoRelacionPS.findUnique({
          where: { id: tipoRelacionPadreId },
          select: { id: true },
        });
        if (!tr) {
          throw new BadRequestException(
            `El tipo de relación PS indicado no existe (tipoRelacionPadreId: ${tipoRelacionPadreId}).`,
          );
        }
      }
    }

    return this.prisma.puntoServicio.update({
      where: { id },
      data: {
        ...(dto.domicilioId !== undefined && { domicilioId: dto.domicilioId }),
        ...(dto.tipoSuministroId !== undefined && { tipoSuministroId: dto.tipoSuministroId }),
        ...(dto.estructuraTecnicaId !== undefined && { estructuraTecnicaId: dto.estructuraTecnicaId }),
        ...(dto.zonaFacturacionId !== undefined && { zonaFacturacionId: dto.zonaFacturacionId }),
        ...(dto.codigoRecorridoId !== undefined && { codigoRecorridoId: dto.codigoRecorridoId }),
        ...(dto.tipoRelacionPadreId !== undefined && {
          tipoRelacionPadreId: optionalFkId(dto.tipoRelacionPadreId),
        }),
        ...(dto.diametroToma !== undefined && { diametroToma: dto.diametroToma }),
        ...(dto.materialTuberia !== undefined && { materialTuberia: dto.materialTuberia }),
        ...(dto.profundidadToma !== undefined && { profundidadToma: dto.profundidadToma }),
        ...(dto.tieneValvula !== undefined && { tieneValvula: dto.tieneValvula }),
        ...(dto.tieneCaja !== undefined && { tieneCaja: dto.tieneCaja }),
        ...(dto.gpsLat !== undefined && { gpsLat: dto.gpsLat }),
        ...(dto.gpsLng !== undefined && { gpsLng: dto.gpsLng }),
        ...(dto.estado !== undefined && { estado: dto.estado }),
        ...(dto.cortable !== undefined && { cortable: dto.cortable }),
        ...(dto.motivoNoCortable !== undefined && { motivoNoCortable: dto.motivoNoCortable }),
      },
    });
  }

  // --- Jerarquía padre-hijo ---

  async getHijos(id: string) {
    await this.findOne(id);
    const hijos = await this.prisma.puntoServicio.findMany({
      where: { puntoServicioPadreId: id },
      select: {
        id: true,
        codigo: true,
        estado: true,
        cortable: true,
        reparticionConsumo: true,
        tipoRelacionPadre: {
          select: { id: true, codigo: true, descripcion: true, metodo: true, reparteConsumo: true },
        },
        tipoSuministro: { select: { codigo: true, descripcion: true } },
      },
      orderBy: { codigo: 'asc' },
    });
    const totalReparticion = hijos.reduce(
      (sum, h) => sum + Number(h.reparticionConsumo ?? 0),
      0,
    );
    return { hijos, totalReparticion };
  }

  async vincularPadre(
    id: string,
    padreId: string,
    reparticion: number,
    opts?: { tipoRelacionPadreId?: string | null },
  ) {
    if (id === padreId) throw new BadRequestException('Un punto no puede ser su propio padre');
    await this.findOne(id);
    await this.findOne(padreId);

    if (reparticion < 0 || reparticion > 100) {
      throw new BadRequestException('La repartición debe estar entre 0 y 100');
    }

    let tipoRelacionPayload: string | null | undefined = undefined;
    if (opts && 'tipoRelacionPadreId' in opts) {
      tipoRelacionPayload = optionalFkId(opts.tipoRelacionPadreId);
      if (tipoRelacionPayload) {
        const tr = await this.prisma.catalogoTipoRelacionPS.findUnique({
          where: { id: tipoRelacionPayload },
          select: { id: true },
        });
        if (!tr) {
          throw new BadRequestException(
            `El tipo de relación PS indicado no existe (tipoRelacionPadreId: ${tipoRelacionPayload}).`,
          );
        }
      }
    }

    // Validar que la suma de reparticiones de hijos existentes no supere 100
    const hijosActuales = await this.prisma.puntoServicio.findMany({
      where: { puntoServicioPadreId: padreId, id: { not: id } },
      select: { reparticionConsumo: true },
    });
    const sumaActual = hijosActuales.reduce(
      (sum, h) => sum + Number(h.reparticionConsumo ?? 0),
      0,
    );
    if (sumaActual + reparticion > 100) {
      throw new BadRequestException(
        `La suma de reparticiones excedería 100% (actual: ${sumaActual}%, nuevo: ${reparticion}%)`,
      );
    }

    return this.prisma.puntoServicio.update({
      where: { id },
      data: {
        puntoServicioPadreId: padreId,
        reparticionConsumo: reparticion,
        ...(tipoRelacionPayload !== undefined && { tipoRelacionPadreId: tipoRelacionPayload }),
      },
    });
  }

  async desvincularPadre(id: string) {
    await this.findOne(id);
    return this.prisma.puntoServicio.update({
      where: { id },
      data: {
        puntoServicioPadreId: null,
        reparticionConsumo: null,
        tipoRelacionPadreId: null,
      },
    });
  }

  // --- Catálogos operativos ---

  async findTiposCorte() {
    return this.prisma.catalogoTipoCorte.findMany({ orderBy: { codigo: 'asc' } });
  }

  async createTipoCorte(dto: {
    codigo: string;
    descripcion: string;
    impacto?: string;
    requiereCuadrilla?: boolean;
  }) {
    return this.prisma.catalogoTipoCorte.create({ data: dto });
  }

  async updateTipoCorte(id: string, dto: Partial<{ descripcion: string; impacto: string; requiereCuadrilla: boolean; activo: boolean }>) {
    return this.prisma.catalogoTipoCorte.update({ where: { id }, data: dto });
  }

  async findTiposSuministro() {
    return this.prisma.catalogoTipoSuministro.findMany({ orderBy: { codigo: 'asc' } });
  }

  async createTipoSuministro(dto: { codigo: string; descripcion: string; activo?: boolean }) {
    return this.prisma.catalogoTipoSuministro.create({ data: dto });
  }

  async findEstructurasTecnicas() {
    return this.prisma.catalogoEstructuraTecnica.findMany({ orderBy: { codigo: 'asc' } });
  }

  async createEstructuraTecnica(dto: { codigo: string; descripcion: string; activo?: boolean }) {
    return this.prisma.catalogoEstructuraTecnica.create({ data: dto });
  }

  // --- Zonas de facturación ---

  async findZonasFacturacion() {
    return this.prisma.catalogoZonaFacturacion.findMany({ orderBy: { codigo: 'asc' } });
  }

  async createZonaFacturacion(dto: { codigo: string; descripcion: string; activo?: boolean }) {
    return this.prisma.catalogoZonaFacturacion.create({ data: dto });
  }

  async updateZonaFacturacion(id: string, dto: Partial<{ descripcion: string; activo: boolean }>) {
    return this.prisma.catalogoZonaFacturacion.update({ where: { id }, data: dto });
  }

  // --- Códigos de recorrido ---

  async findCodigosRecorrido() {
    return this.prisma.catalogoCodigoRecorrido.findMany({ orderBy: { codigo: 'asc' } });
  }

  async createCodigoRecorrido(dto: { codigo: string; descripcion: string; rutaId?: string; activo?: boolean }) {
    return this.prisma.catalogoCodigoRecorrido.create({ data: dto });
  }

  async updateCodigoRecorrido(id: string, dto: Partial<{ descripcion: string; rutaId: string; activo: boolean }>) {
    return this.prisma.catalogoCodigoRecorrido.update({ where: { id }, data: dto });
  }

  /** Distritos operativos (GIS / rutas), con zona para filtrado en UI. */
  async findDistritos() {
    return this.prisma.distrito.findMany({
      orderBy: [{ zonaId: 'asc' }, { nombre: 'asc' }],
      select: { id: true, nombre: true, zonaId: true },
    });
  }
}
