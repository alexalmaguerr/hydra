import { Module } from '@nestjs/common';
import { MonitoreoController } from './monitoreo.controller';
import { MonitoreoService } from './monitoreo.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MonitoreoController],
  providers: [MonitoreoService],
  exports: [MonitoreoService],
})
export class MonitoreoModule {}
