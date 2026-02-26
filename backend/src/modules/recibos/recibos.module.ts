import { Module } from '@nestjs/common';
import { RecibosController, MensajesReciboController } from './recibos.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RecibosController, MensajesReciboController],
})
export class RecibosModule {}
