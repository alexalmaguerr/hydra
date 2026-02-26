import { Module } from '@nestjs/common';
import { TramitesController } from './tramites.controller';
import { TramitesService } from './tramites.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TramitesController],
  providers: [TramitesService],
  exports: [TramitesService],
})
export class TramitesModule {}
