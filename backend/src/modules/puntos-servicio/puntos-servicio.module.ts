import { Module } from '@nestjs/common';
import { PuntosServicioController } from './puntos-servicio.controller';
import { CatalogosController } from './catalogos.controller';
import { PuntosServicioService } from './puntos-servicio.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PuntosServicioController, CatalogosController],
  providers: [PuntosServicioService],
  exports: [PuntosServicioService],
})
export class PuntosServicioModule {}
