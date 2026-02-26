import { Module } from '@nestjs/common';
import { ContabilidadController } from './contabilidad.controller';
import { ContabilidadService } from './contabilidad.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContabilidadController],
  providers: [ContabilidadService],
  exports: [ContabilidadService],
})
export class ContabilidadModule {}
