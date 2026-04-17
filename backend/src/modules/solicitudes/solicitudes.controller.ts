import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SolicitudesService } from './solicitudes.service';

@Controller('solicitudes')
@UseGuards(JwtAuthGuard)
export class SolicitudesController {
  constructor(private readonly service: SolicitudesService) {}

  @Get()
  findAll(
    @Query('estado') estado?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ) {
    return this.service.findAll({ estado, page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.service.updateFormData(id, body);
  }

  @Post(':id/inspeccion')
  upsertInspeccion(@Param('id') id: string, @Body() body: any) {
    return this.service.upsertInspeccion(id, body);
  }

  @Post(':id/aceptar')
  aceptar(@Param('id') id: string) {
    return this.service.aceptar(id);
  }

  @Post(':id/rechazar')
  rechazar(@Param('id') id: string) {
    return this.service.rechazar(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
