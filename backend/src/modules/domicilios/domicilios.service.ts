import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateDomicilioDto {
  calle: string;
  numExterior?: string;
  numInterior?: string;
  coloniaINEGIId?: string;
  codigoPostal?: string;
  localidadINEGIId?: string;
  municipioINEGIId?: string;
  estadoINEGIId?: string;
  entreCalle1?: string;
  entreCalle2?: string;
  referencia?: string;
  gpsLat?: number;
  gpsLng?: number;
}

export interface UpdateDomicilioDto extends Partial<CreateDomicilioDto> {
  validadoINEGI?: boolean;
}

@Injectable()
export class DomiciliosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { codigoPostal?: string; municipioId?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.codigoPostal && { codigoPostal: { contains: params.codigoPostal } }),
      ...(params.municipioId && { municipioINEGIId: params.municipioId }),
    };
    const [data, total] = await Promise.all([
      this.prisma.domicilio.findMany({
        where,
        include: {
          coloniaINEGI: true,
          municipioINEGI: true,
          estadoINEGI: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.domicilio.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const d = await this.prisma.domicilio.findUnique({
      where: { id },
      include: {
        coloniaINEGI: true,
        localidadINEGI: true,
        municipioINEGI: { include: { estado: true } },
        estadoINEGI: true,
        personaLinks: {
          include: { persona: { select: { id: true, nombre: true, rfc: true } } },
        },
      },
    });
    if (!d) throw new NotFoundException('Domicilio no encontrado');
    return d;
  }

  async create(dto: CreateDomicilioDto) {
    const dom = await this.prisma.domicilio.create({
      data: {
        calle: dto.calle,
        numExterior: dto.numExterior ?? null,
        numInterior: dto.numInterior ?? null,
        coloniaINEGIId: dto.coloniaINEGIId ?? null,
        codigoPostal: dto.codigoPostal ?? null,
        localidadINEGIId: dto.localidadINEGIId ?? null,
        municipioINEGIId: dto.municipioINEGIId ?? null,
        estadoINEGIId: dto.estadoINEGIId ?? null,
        entreCalle1: dto.entreCalle1 ?? null,
        entreCalle2: dto.entreCalle2 ?? null,
        referencia: dto.referencia ?? null,
        gpsLat: dto.gpsLat ?? null,
        gpsLng: dto.gpsLng ?? null,
      },
      include: { coloniaINEGI: true, municipioINEGI: true, estadoINEGI: true },
    });
    await this.actualizarDireccionConcatenada(dom.id);
    return this.findOne(dom.id);
  }

  async update(id: string, dto: UpdateDomicilioDto) {
    await this.findOne(id);
    await this.prisma.domicilio.update({
      where: { id },
      data: {
        ...(dto.calle !== undefined && { calle: dto.calle }),
        ...(dto.numExterior !== undefined && { numExterior: dto.numExterior }),
        ...(dto.numInterior !== undefined && { numInterior: dto.numInterior }),
        ...(dto.coloniaINEGIId !== undefined && { coloniaINEGIId: dto.coloniaINEGIId }),
        ...(dto.codigoPostal !== undefined && { codigoPostal: dto.codigoPostal }),
        ...(dto.localidadINEGIId !== undefined && { localidadINEGIId: dto.localidadINEGIId }),
        ...(dto.municipioINEGIId !== undefined && { municipioINEGIId: dto.municipioINEGIId }),
        ...(dto.estadoINEGIId !== undefined && { estadoINEGIId: dto.estadoINEGIId }),
        ...(dto.entreCalle1 !== undefined && { entreCalle1: dto.entreCalle1 }),
        ...(dto.entreCalle2 !== undefined && { entreCalle2: dto.entreCalle2 }),
        ...(dto.referencia !== undefined && { referencia: dto.referencia }),
        ...(dto.gpsLat !== undefined && { gpsLat: dto.gpsLat }),
        ...(dto.gpsLng !== undefined && { gpsLng: dto.gpsLng }),
        ...(dto.validadoINEGI !== undefined && { validadoINEGI: dto.validadoINEGI }),
      },
    });
    await this.actualizarDireccionConcatenada(id);
    return this.findOne(id);
  }

  /** Vincula un domicilio a una persona con un tipo de relación */
  async vincularPersona(domicilioId: string, personaId: string, tipo = 'fiscal', principal = false) {
    await this.findOne(domicilioId);
    return this.prisma.domicilioPersona.upsert({
      where: { personaId_domicilioId_tipo: { personaId, domicilioId, tipo } },
      create: { personaId, domicilioId, tipo, principal },
      update: { principal },
    });
  }

  /** Desvincula un domicilio de una persona */
  async desvincularPersona(domicilioId: string, personaId: string, tipo = 'fiscal') {
    return this.prisma.domicilioPersona.delete({
      where: { personaId_domicilioId_tipo: { personaId, domicilioId, tipo } },
    });
  }

  /** Listado de domicilios de una persona */
  async findByPersona(personaId: string) {
    return this.prisma.domicilioPersona.findMany({
      where: { personaId },
      include: {
        domicilio: {
          include: {
            coloniaINEGI: true,
            municipioINEGI: true,
            estadoINEGI: true,
          },
        },
      },
      orderBy: [{ principal: 'desc' }, { createdAt: 'asc' }],
    });
  }

  /** Búsqueda de colonias INEGI por CP o nombre */
  async buscarColonias(params: { codigoPostal?: string; nombre?: string; municipioId?: string; limit?: number }) {
    const limit = params.limit ?? 30;
    return this.prisma.catalogoColoniaINEGI.findMany({
      where: {
        activo: true,
        ...(params.codigoPostal && { codigoPostal: { contains: params.codigoPostal } }),
        ...(params.nombre && { nombre: { contains: params.nombre, mode: 'insensitive' as const } }),
        ...(params.municipioId && { municipioId: params.municipioId }),
      },
      include: { municipio: { include: { estado: true } } },
      take: limit,
      orderBy: { nombre: 'asc' },
    });
  }

  /** Búsqueda de municipios INEGI */
  async buscarMunicipios(params: { nombre?: string; estadoId?: string; limit?: number }) {
    const limit = params.limit ?? 30;
    return this.prisma.catalogoMunicipioINEGI.findMany({
      where: {
        activo: true,
        ...(params.nombre && { nombre: { contains: params.nombre, mode: 'insensitive' as const } }),
        ...(params.estadoId && { estadoId: params.estadoId }),
      },
      include: { estado: true },
      take: limit,
      orderBy: { nombre: 'asc' },
    });
  }

  /** Todos los estados INEGI */
  async findEstados() {
    return this.prisma.catalogoEstadoINEGI.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  private async actualizarDireccionConcatenada(id: string) {
    const d = await this.prisma.domicilio.findUnique({
      where: { id },
      include: { coloniaINEGI: true, municipioINEGI: true, estadoINEGI: true },
    });
    if (!d) return;

    const partes: string[] = [d.calle];
    if (d.numExterior) partes.push(`#${d.numExterior}`);
    if (d.numInterior) partes.push(`Int. ${d.numInterior}`);
    if (d.coloniaINEGI) partes.push(`Col. ${d.coloniaINEGI.nombre}`);
    if (d.codigoPostal) partes.push(`C.P. ${d.codigoPostal}`);
    if (d.municipioINEGI) partes.push(d.municipioINEGI.nombre);
    if (d.estadoINEGI) partes.push(d.estadoINEGI.nombre);

    await this.prisma.domicilio.update({
      where: { id },
      data: { direccionConcatenada: partes.join(', ') },
    });
  }
}
