import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TimbradosController } from './timbrados.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TimbradosController],
})
export class TimbradosModule {}
