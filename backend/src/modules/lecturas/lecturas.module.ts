import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { LecturasController } from './lecturas.controller';
import { LecturasService } from './lecturas.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } })],
  controllers: [LecturasController],
  providers: [LecturasService],
  exports: [LecturasService],
})
export class LecturasModule {}
