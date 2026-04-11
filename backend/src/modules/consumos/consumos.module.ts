import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConsumosController } from './consumos.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ConsumosController],
})
export class ConsumosModule {}
