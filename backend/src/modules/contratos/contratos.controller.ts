import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContratosService } from './contratos.service';
import { CreateContratoDto } from './dto/create-contrato.dto';

class UpdateContratoDto {
  ceaNumContrato?: string | null;
  estado?: string;
  domiciliado?: boolean;
  fechaReconexionPrevista?: string | null;
  bloqueadoJuridico?: boolean;
  razonSocial?: string | null;
  regimenFiscal?: string | null;
  constanciaFiscalUrl?: string | null;
}

@Controller('contratos')
@UseGuards(JwtAuthGuard)
export class ContratosController {
  constructor(private readonly contratosService: ContratosService) {}

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
}
