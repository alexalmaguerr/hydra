import { Module } from '@nestjs/common';
import { DomiciliosController } from './domicilios.controller';
import { DomiciliosService } from './domicilios.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DomiciliosController],
  providers: [DomiciliosService],
  exports: [DomiciliosService],
})
export class DomiciliosModule {}
