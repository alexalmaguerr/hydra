import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConveniosService } from './convenios.service';

@Controller('convenios')
@UseGuards(JwtAuthGuard)
export class ConveniosController {
  constructor(private readonly service: ConveniosService) {}

  @Get()
  findAll(
    @Query('contratoId') contratoId?: string,
    @Query('estado') estado?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit = 20,
  ) {
    return this.service.findAll({ contratoId, estado, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: object) {
    return this.service.create(body as any);
  }

  @Post(':id/parcialidades/aplicar')
  aplicar(
    @Param('id') id: string,
    @Body() body: { monto: number; tipo: string },
  ) {
    return this.service.aplicarParcialidad(id, body.monto, body.tipo);
  }

  @Post(':id/cancelar')
  cancelar(@Param('id') id: string) {
    return this.service.cancelar(id);
  }
}
