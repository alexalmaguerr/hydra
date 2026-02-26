import { Module } from '@nestjs/common';
import { ConciliacionesController } from './conciliaciones.controller';
import { ConciliacionesService } from './conciliaciones.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConciliacionesController],
  providers: [ConciliacionesService],
  exports: [ConciliacionesService],
})
export class ConciliacionesModule {}
