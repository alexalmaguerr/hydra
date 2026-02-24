import { Module } from '@nestjs/common';
import { PagosController } from './pagos.controller';
import { PagosExternosController } from './pagos-externos.controller';

@Module({
  controllers: [PagosController, PagosExternosController],
})
export class PagosModule {}
