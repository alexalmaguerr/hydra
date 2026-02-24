import { Module } from '@nestjs/common';
import { TimbradosController } from './timbrados.controller';

@Module({
  controllers: [TimbradosController],
})
export class TimbradosModule {}
