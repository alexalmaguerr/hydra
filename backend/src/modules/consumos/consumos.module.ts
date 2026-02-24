import { Module } from '@nestjs/common';
import { ConsumosController } from './consumos.controller';

@Module({
  controllers: [ConsumosController],
})
export class ConsumosModule {}
