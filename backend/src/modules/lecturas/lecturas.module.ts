import { Module } from '@nestjs/common';
import { LecturasController } from './lecturas.controller';

@Module({
  controllers: [LecturasController],
})
export class LecturasModule {}
