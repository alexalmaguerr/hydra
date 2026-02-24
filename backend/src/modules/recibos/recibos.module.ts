import { Module } from '@nestjs/common';
import { RecibosController } from './recibos.controller';

@Module({
  controllers: [RecibosController],
})
export class RecibosModule {}
