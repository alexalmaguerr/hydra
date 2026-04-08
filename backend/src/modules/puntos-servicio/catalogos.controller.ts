import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PuntosServicioService } from './puntos-servicio.service';

@Controller('catalogos')
@UseGuards(JwtAuthGuard)
export class CatalogosController {
  constructor(private readonly service: PuntosServicioService) {}

  // --- Tipos de corte ---

  @Get('tipos-corte')
  findTiposCorte() {
    return this.service.findTiposCorte();
  }

  @Post('tipos-corte')
  createTipoCorte(
    @Body()
    body: {
      codigo: string;
      descripcion: string;
      impacto?: string;
      requiereCuadrilla?: boolean;
    },
  ) {
    return this.service.createTipoCorte(body);
  }

  @Patch('tipos-corte/:id')
  updateTipoCorte(
    @Param('id') id: string,
    @Body()
    body: {
      descripcion?: string;
      impacto?: string;
      requiereCuadrilla?: boolean;
      activo?: boolean;
    },
  ) {
    return this.service.updateTipoCorte(id, body);
  }

  // --- Tipos de suministro ---

  @Get('tipos-suministro')
  findTiposSuministro() {
    return this.service.findTiposSuministro();
  }

  @Post('tipos-suministro')
  createTipoSuministro(
    @Body() body: { codigo: string; descripcion: string; activo?: boolean },
  ) {
    return this.service.createTipoSuministro(body);
  }

  // --- Estructuras técnicas ---

  @Get('estructuras-tecnicas')
  findEstructurasTecnicas() {
    return this.service.findEstructurasTecnicas();
  }

  @Post('estructuras-tecnicas')
  createEstructuraTecnica(
    @Body() body: { codigo: string; descripcion: string; activo?: boolean },
  ) {
    return this.service.createEstructuraTecnica(body);
  }
}
