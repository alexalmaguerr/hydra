import { Module } from '@nestjs/common';
import { TiposContratacionController } from './tipos-contratacion.controller';
import { CatalogosContratacionController } from './catalogos-contratacion.controller';
import { TiposContratacionService } from './tipos-contratacion.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TiposContratacionController, CatalogosContratacionController],
  providers: [TiposContratacionService],
  exports: [TiposContratacionService],
})
export class TiposContratacionModule {}
