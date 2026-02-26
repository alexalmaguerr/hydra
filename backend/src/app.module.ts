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
import { QuejasModule } from './modules/quejas/quejas.module';
import { PortalModule } from './modules/portal/portal.module';
import { OrdenesModule } from './modules/ordenes/ordenes.module';
import { ContabilidadModule } from './modules/contabilidad/contabilidad.module';
import { GisModule } from './modules/gis/gis.module';
import { PersonasModule } from './modules/personas/personas.module';
import { TramitesModule } from './modules/tramites/tramites.module';
import { CajaModule } from './modules/caja/caja.module';
import { ConveniosModule } from './modules/convenios/convenios.module';
import { MonitoreoModule } from './modules/monitoreo/monitoreo.module';
import { ConciliacionesModule } from './modules/conciliaciones/conciliaciones.module';

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
    QuejasModule,
    PortalModule,
    OrdenesModule,
    ContabilidadModule,
    GisModule,
    PersonasModule,
    TramitesModule,
    CajaModule,
    ConveniosModule,
    MonitoreoModule,
    ConciliacionesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
