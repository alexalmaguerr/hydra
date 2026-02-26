import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('pagos')
@UseGuards(JwtAuthGuard)
export class PagosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('contratoId') contratoId?: string,
    @Query('origen') origen?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    const where = {
      ...(contratoId && { contratoId }),
      ...(origen && { origen }),
    };
    const [data, total] = await Promise.all([
      this.prisma.pago.findMany({
        where,
        include: {
          contrato: { select: { nombre: true } },
          recibo: { select: { id: true, saldoVigente: true } },
        },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pago.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  @Post()
  async crear(
    @Body()
    body: {
      contratoId: string;
      reciboId?: string;
      timbradoId?: string;
      convenioId?: string;
      monto: number;
      tipo: string;
      concepto?: string;
      fecha?: string;
    },
  ) {
    return this.prisma.pago.create({
      data: {
        contratoId: body.contratoId,
        reciboId: body.reciboId ?? null,
        timbradoId: body.timbradoId ?? null,
        convenioId: body.convenioId ?? null,
        monto: body.monto,
        fecha: body.fecha ?? new Date().toISOString().substring(0, 10),
        tipo: body.tipo,
        concepto: body.concepto ?? 'Pago en caja',
        origen: 'nativo',
      },
      include: { recibo: true },
    });
  }
}
