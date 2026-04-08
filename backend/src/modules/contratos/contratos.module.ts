import { Module } from '@nestjs/common';
import { ContratosController } from './contratos.controller';
import { ContratosService } from './contratos.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TiposContratacionModule } from '../tipos-contratacion/tipos-contratacion.module';

@Module({
  imports: [PrismaModule, TiposContratacionModule],
  controllers: [ContratosController],
  providers: [ContratosService],
  exports: [ContratosService],
})
export class ContratosModule {}
