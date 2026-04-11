import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrefacturasController } from './prefacturas.controller';

@Module({
  imports: [PrismaModule],
  controllers: [PrefacturasController],
})
export class PrefacturasModule {}
