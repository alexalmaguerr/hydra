import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { DomiciliosModule } from '../domicilios/domicilios.module';
import { PuntosServicioModule } from '../puntos-servicio/puntos-servicio.module';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesService } from './solicitudes.service';

@Module({
  imports: [PrismaModule, DomiciliosModule, PuntosServicioModule],
  controllers: [SolicitudesController],
  providers: [SolicitudesService],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
