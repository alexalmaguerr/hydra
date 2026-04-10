import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TiposContratacionService } from './tipos-contratacion.service';

@Controller('catalogos')
@UseGuards(JwtAuthGuard)
export class CatalogosContratacionController {
  constructor(private readonly service: TiposContratacionService) {}

  // ─── Conceptos de Cobro ───────────────────────────────────────────────────

  @Get('conceptos-cobro')
  findConceptosCobro(@Query('activo') activo?: string) {
    return this.service.findConceptosCobro({ activo });
  }

  @Post('conceptos-cobro')
  createConceptoCobro(
    @Body()
    body: {
      codigo: string;
      nombre: string;
      tipo: string;
      montoBase?: number;
      ivaPct?: number;
      formula?: string;
      variablesFormula?: object;
    },
  ) {
    return this.service.createConceptoCobro(body);
  }

  @Patch('conceptos-cobro/:id')
  updateConceptoCobro(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      tipo?: string;
      montoBase?: number;
      ivaPct?: number;
      formula?: string;
      variablesFormula?: object;
      activo?: boolean;
    },
  ) {
    return this.service.updateConceptoCobro(id, body);
  }

  // ─── Cláusulas Contractuales ──────────────────────────────────────────────

  @Get('clausulas')
  findClausulas(@Query('activo') activo?: string) {
    return this.service.findClausulas({ activo });
  }

  @Post('clausulas')
  createClausula(
    @Body()
    body: {
      codigo: string;
      titulo: string;
      contenido: string;
      version?: string;
    },
  ) {
    return this.service.createClausula(body);
  }

  @Patch('clausulas/:id')
  updateClausula(
    @Param('id') id: string,
    @Body()
    body: {
      titulo?: string;
      contenido?: string;
      version?: string;
      activo?: boolean;
    },
  ) {
    return this.service.updateClausula(id, body);
  }

  // ─── Catálogos de contrato (P1 / CIG2018) ─────────────────────────────────

  @Get('actividades')
  findActividades(@Query('activo') activo?: string) {
    return this.service.findCatalogoActividades({ activo });
  }

  @Get('grupos-actividad')
  findGruposActividad(@Query('activo') activo?: string) {
    return this.service.findCatalogoGruposActividad({ activo });
  }

  @Get('categorias')
  findCategorias(@Query('activo') activo?: string) {
    return this.service.findCatalogoCategorias({ activo });
  }

  @Get('tipos-relacion-ps')
  findTiposRelacionPS(@Query('activo') activo?: string) {
    return this.service.findCatalogoTiposRelacionPS({ activo });
  }
}
