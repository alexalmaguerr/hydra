import { Module } from '@nestjs/common';
import { ConveniosController } from './convenios.controller';
import { ConveniosService } from './convenios.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConveniosController],
  providers: [ConveniosService],
  exports: [ConveniosService],
})
export class ConveniosModule {}
