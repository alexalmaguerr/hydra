import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';
import { UpdateContratoDto } from './dto/update-contrato.dto';
import { TiposContratacionService } from '../tipos-contratacion/tipos-contratacion.service';
import { BillingEngineService } from './billing-engine.service';

@Controller('contratos')
@UseGuards(JwtAuthGuard)
export class ContratosController {
  constructor(
    private readonly contratosService: ContratosService,
    private readonly tiposContratacionService: TiposContratacionService,
    private readonly billingEngine: BillingEngineService,
  ) {}

  // IMPORTANT: static routes declared BEFORE /:id
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit = 10,
  ) {
    return this.contratosService.search(q ?? '', limit);
  }

  @Get()
  findAll() {
    return this.contratosService.findAll();
  }

  @Get(':id/flujo-completo')
  getFlujoCompleto(@Param('id') id: string) {
    return this.contratosService.getFlujoCompleto(id);
  }

  @Get(':id/historial')
  getHistorial(@Param('id') id: string) {
    return this.contratosService.getHistorial(id);
  }

  @Get(':id/contexto-atencion')
  getContextoAtencion(@Param('id') id: string) {
    return this.contratosService.getContextoAtencion(id);
  }

  @Get(':id/estado-operativo')
  getEstadoOperativo(@Param('id') id: string) {
    return this.contratosService.getEstadoOperativo(id);
  }

  @Get(':id/texto-contrato')
  getTextoContratoPreview(@Param('id') id: string) {
    return this.contratosService.getTextoContratoPreview(id);
  }

  @Get(':id/contrato-pdf')
  async getContratoPdf(@Param('id') id: string, @Res() res: Response) {
    const html = await this.contratosService.getContratoPdf(id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Post(':id/factura-contratacion')
  crearFacturaContratacion(@Param('id') id: string) {
    return this.contratosService.crearFacturaContratacion(id);
  }

  @Post('preview-facturacion')
  previewFacturacion(
    @Body() body: { tipoContratacionId: string; variables: Record<string, string | number | boolean> },
  ) {
    return this.billingEngine.calcular(body.tipoContratacionId, body.variables ?? {});
  }

  @Get(':id/orden-inspeccion')
  getOrdenInspeccion(@Param('id') id: string) {
    return this.contratosService.getOrdenInspeccionContrato(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contratosService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateContratoDto) {
    return this.contratosService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContratoDto) {
    return this.contratosService.update(id, dto);
  }

  @Post(':id/cambiar-tipo')
  cambiarTipo(
    @Param('id') id: string,
    @Body() body: { nuevoTipoId: string; motivo: string; usuario?: string },
  ) {
    return this.tiposContratacionService.cambiarTipoContrato(
      id,
      body.nuevoTipoId,
      body.motivo,
      body.usuario,
    );
  }
}
