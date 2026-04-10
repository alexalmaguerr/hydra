import { Module } from '@nestjs/common';
import { CatalogosOperativosController } from './catalogos-operativos.controller';
import { CatalogosOperativosService } from './catalogos-operativos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CatalogosOperativosController],
  providers: [CatalogosOperativosService],
  exports: [CatalogosOperativosService],
})
export class CatalogosOperativosModule {}
