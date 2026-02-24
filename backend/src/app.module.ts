import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { ContratosModule } from './modules/contratos/contratos.module';
import { AuthModule } from './modules/auth/auth.module';
import { LecturasModule } from './modules/lecturas/lecturas.module';
import { ConsumosModule } from './modules/consumos/consumos.module';
import { PrefacturasModule } from './modules/prefacturas/prefacturas.module';
import { RecibosModule } from './modules/recibos/recibos.module';
import { TimbradosModule } from './modules/timbrados/timbrados.module';
import { PagosModule } from './modules/pagos/pagos.module';

@Module({
  imports: [
    PrismaModule,
    ContratosModule,
    AuthModule,
    LecturasModule,
    ConsumosModule,
    PrefacturasModule,
    RecibosModule,
    TimbradosModule,
    PagosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
