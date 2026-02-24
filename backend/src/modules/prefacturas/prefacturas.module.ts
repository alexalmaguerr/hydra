import { Module } from '@nestjs/common';
import { PrefacturasController } from './prefacturas.controller';

@Module({
  controllers: [PrefacturasController],
})
export class PrefacturasModule {}
