# Tarea 04 — Integración Contable con SAP / ERP

**PRD reqs:** 20–23  
**Sección PRD:** "Integración contable con SAP u otro ERP"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui

---

## Contexto y estado actual

### Archivos de referencia disponibles

Los archivos IDOC reales se encuentran en:
`Requerimientos/Documentos/Interfaces-.../Contabilidad SAP/`

**Estructura IDOC verificada en `1584667 ingresos.txt`:**
```
Aqua_SAP     0000000001584667   ...   01022026000001
Interfaz_AquaCis_SAP_Cabecera  000000000000158466758466800000000  010220260310000102202602  MXN  ASN 1584667 1 2 2026 PAGO
Interfaz_AquaCis_SAP_Posicion  00000000000015846670000010...  40  2228.00  ...  01022026  COBRO VENTANILLA OFICINA  ANTICIPO  2151100001  1001
Interfaz_AquaCis_SAP_Posicion  00000000000015846670000020...  40  10.00   ...  01022026  COBRO VENTANILLA OFICINA  ANTICIPO  2151100001  1009
...
Interfaz_AquaCis_SAP_Posicion  00000000000015846670000070...  15  32297.16  ...  01022026  COBRO VENTANILLA OFICINA  GENERICO  11221111031001
```

Segmentos identificados:
- **Cabecera:** número póliza, fecha, moneda, descripción, tipo (PAGO/FACTURACION)
- **Posición:** número, indicador (40=haber cuenta pasivo, 15=debe cuenta activo), monto, fecha, descripción, texto, cuenta contable (11221111031001 = estructura jerárquica)

**Layouts documentados:**
- `Definicion Layout IDOC_vwork_version_cobros.xlsx` — layout para pólizas de cobros/ingresos
- `Definicion Layout IDOC_vwork_version_facturas.xlsx` — layout para pólizas de facturación

**Archivos de facturación disponibles:**
- `1584885 facturacion.txt`, `1585020 facturacion.txt`, `1585060 facturacion.txt`

### Estado actual del código

- `frontend/src/pages/Contabilidad.tsx` — stub vacío
- No existe módulo `contabilidad` en backend
- Schema Prisma: ningún modelo contable

---

## Objetivo

1. Modelo contable parametrizable: `ReglaContable` mapea transacciones → cuentas contables
2. Generación de pólizas en formato IDOC SAP compatible
3. Tipos de pólizas: Facturación diaria, Cobros/Ingresos, Convenios, Ajustes, Cancelaciones
4. Frontend: generación, preview y exportación de pólizas

---

## Aceptación (Definition of Done)

- [ ] Migración con `Poliza`, `LineaPoliza`, `ReglaContable` aplicada
- [ ] `GET /contabilidad/polizas` lista pólizas con filtros
- [ ] `POST /contabilidad/polizas/generar` genera póliza a partir de transacciones del periodo
- [ ] `GET /contabilidad/polizas/:id/exportar` devuelve archivo en formato IDOC SAP
- [ ] `GET/POST /contabilidad/reglas` CRUD de reglas contables
- [ ] Frontend `Contabilidad.tsx` con generación + preview + exportación
- [ ] Póliza generada es compatible con el layout de los archivos IDOC de referencia

---

## Paso 1: Migración Prisma

```prisma
// Agregar a backend/prisma/schema.prisma

model ReglaContable {
  id               String   @id @default(cuid())
  nombre           String
  tipoTransaccion  String   @map("tipo_transaccion")
  // Pago | Facturacion | Ajuste | Convenio | Cancelacion | Anticipo
  indicador        String   // 40=Haber | 15=Debe | 50=Haber otro | etc.
  cuentaContable   String   @map("cuenta_contable")
  // Ej: 11221111031001 (estructura SAP)
  descripcionSAP   String   @map("descripcion_sap")
  // Texto que aparece en la póliza SAP
  activo           Boolean  @default(true)
  orden            Int      @default(0)
  createdAt        DateTime @default(now()) @map("created_at")
  updatedAt        DateTime @updatedAt @map("updated_at")

  @@index([tipoTransaccion])
  @@map("reglas_contables")
}

model Poliza {
  id              String   @id @default(cuid())
  numero          String   @unique  // número secuencial tipo SAP: 1584667
  tipo            String
  // Facturacion | Cobros | Convenio | Ajuste | Cancelacion | Anticipo
  periodo         String   // AAAAMM
  fecha           DateTime
  descripcion     String
  moneda          String   @default("MXN")
  estado          String   @default("generada")
  // generada | exportada | enviada | error | anulada
  referenciaId    String?  @map("referencia_id")
  // ID del pago, timbrado, etc. que generó la póliza
  errorDetalle    String?  @map("error_detalle")
  archivoIdoc     String?  @map("archivo_idoc")  // contenido IDOC generado
  createdAt       DateTime @default(now()) @map("created_at")
  updatedAt       DateTime @updatedAt @map("updated_at")
  lineas          LineaPoliza[]

  @@index([periodo])
  @@index([tipo])
  @@index([estado])
  @@map("polizas")
}

model LineaPoliza {
  id             String   @id @default(cuid())
  polizaId       String   @map("poliza_id")
  posicion       Int
  indicador      String   // 40 | 15 | 50 etc.
  monto          Decimal  @db.Decimal(12, 2)
  cuentaContable String   @map("cuenta_contable")
  fecha          DateTime
  descripcion    String
  texto          String?
  centroCoste    String?  @map("centro_coste")
  createdAt      DateTime @default(now()) @map("created_at")

  poliza         Poliza   @relation(fields: [polizaId], references: [id], onDelete: Cascade)

  @@index([polizaId])
  @@map("lineas_poliza")
}
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_contabilidad`

---

## Paso 2: Backend — módulo `contabilidad`

Crear `backend/src/modules/contabilidad/`:

### `contabilidad.service.ts`

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContabilidadService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Reglas contables ----
  async getReglas(tipoTransaccion?: string) {
    return this.prisma.reglaContable.findMany({
      where: {
        activo: true,
        ...(tipoTransaccion && { tipoTransaccion }),
      },
      orderBy: [{ tipoTransaccion: 'asc' }, { orden: 'asc' }],
    });
  }

  async createRegla(data: {
    nombre: string; tipoTransaccion: string; indicador: string;
    cuentaContable: string; descripcionSAP: string; orden?: number;
  }) {
    return this.prisma.reglaContable.create({ data });
  }

  // ---- Generación de pólizas ----

  // Genera póliza de cobros/ingresos a partir de pagos del día
  async generarPolizaCobros(fecha: string, periodo: string) {
    const pagos = await this.prisma.pago.findMany({
      where: { fecha },
      include: { contrato: { select: { id: true, zonaId: true } } },
    });

    if (pagos.length === 0) return { message: 'No hay pagos para la fecha indicada' };

    const reglas = await this.getReglas('Pago');
    const numero = await this.generarNumeroPoliza();

    const total = pagos.reduce((s, p) => s + Number(p.monto), 0);

    const lineas = [];
    let posicion = 1;

    // Agrupar por tipo de pago y aplicar reglas
    const porTipo = new Map<string, number>();
    for (const pago of pagos) {
      const key = pago.tipo;
      porTipo.set(key, (porTipo.get(key) ?? 0) + Number(pago.monto));
    }

    for (const [tipo, monto] of porTipo.entries()) {
      const regla = reglas.find(r => r.descripcionSAP.includes(tipo)) ?? reglas[0];
      if (!regla) continue;
      lineas.push({
        posicion: posicion++,
        indicador: regla.indicador,
        monto,
        cuentaContable: regla.cuentaContable,
        fecha: new Date(fecha),
        descripcion: `${regla.descripcionSAP} - ${tipo}`,
        texto: `COBRO ${tipo}`,
      });
    }

    // Línea de contrapartida (cuenta de ingreso)
    lineas.push({
      posicion: posicion++,
      indicador: '15',
      monto: total,
      cuentaContable: '11221111031001', // cuenta de ingresos (parametrizable)
      fecha: new Date(fecha),
      descripcion: 'TOTAL COBROS DEL DIA',
      texto: `TOTAL ${fecha}`,
    });

    const poliza = await this.prisma.poliza.create({
      data: {
        numero,
        tipo: 'Cobros',
        periodo,
        fecha: new Date(fecha),
        descripcion: `COBRO VENTANILLA ${fecha}`,
        moneda: 'MXN',
        lineas: { create: lineas },
      },
      include: { lineas: true },
    });

    // Generar archivo IDOC
    const idoc = this.generarIdoc(poliza);
    await this.prisma.poliza.update({
      where: { id: poliza.id },
      data: { archivoIdoc: idoc, estado: 'exportada' },
    });

    return { polizaId: poliza.id, numero, totalLineas: lineas.length, idoc };
  }

  // Genera póliza de facturación diaria a partir de timbrados
  async generarPolizaFacturacion(fecha: string, periodo: string) {
    const timbrados = await this.prisma.timbrado.findMany({
      where: { fechaEmision: fecha, estado: 'Timbrada OK' },
      include: { contrato: { select: { zonaId: true } } },
    });

    if (timbrados.length === 0) return { message: 'No hay timbrados para la fecha' };

    const numero = await this.generarNumeroPoliza();
    const totalFacturado = timbrados.reduce((s, t) => s + Number(t.total), 0);
    const totalIva = timbrados.reduce((s, t) => s + Number(t.iva), 0);

    const poliza = await this.prisma.poliza.create({
      data: {
        numero,
        tipo: 'Facturacion',
        periodo,
        fecha: new Date(fecha),
        descripcion: `FACTURACION DIARIA ${fecha}`,
        lineas: {
          create: [
            {
              posicion: 1,
              indicador: '01',
              monto: totalFacturado - totalIva,
              cuentaContable: '40000000001001',
              fecha: new Date(fecha),
              descripcion: 'INGRESOS POR FACTURACION',
            },
            {
              posicion: 2,
              indicador: '01',
              monto: totalIva,
              cuentaContable: '21160000001001',
              fecha: new Date(fecha),
              descripcion: 'IVA TRASLADADO',
            },
            {
              posicion: 3,
              indicador: '40',
              monto: totalFacturado,
              cuentaContable: '12110000001001',
              fecha: new Date(fecha),
              descripcion: 'CUENTAS POR COBRAR CLIENTES',
            },
          ],
        },
      },
      include: { lineas: true },
    });

    const idoc = this.generarIdoc(poliza);
    await this.prisma.poliza.update({ where: { id: poliza.id }, data: { archivoIdoc: idoc } });
    return { polizaId: poliza.id, numero, totalFacturado, timbrados: timbrados.length };
  }

  // ---- Generador de formato IDOC SAP ----
  // Replica la estructura de los archivos de referencia
  generarIdoc(poliza: any): string {
    const num = poliza.numero.toString().padStart(10, '0');
    const fecha = poliza.fecha.toISOString().substring(0, 10).replace(/-/g, '');
    const lines: string[] = [];

    // Línea de cabecera IDOC
    lines.push(
      `Aqua_SAP     ${num}` + ' '.repeat(200) + `${fecha}000001`
    );
    // Segmento Cabecera
    lines.push(
      `Interfaz_AquaCis_SAP_Cabecera ` +
      `0000000000${num}${num.substring(2)}00000000` + ' '.repeat(20) +
      `${fecha}0310000${fecha}02  MXN` + ' '.repeat(20) +
      `${fecha}0000000000${num}` + ' '.repeat(16) +
      `ASN ${poliza.numero} ${poliza.descripcion.substring(0, 50)}`
    );

    // Segmentos de posición
    for (const linea of poliza.lineas) {
      const pos = linea.posicion.toString().padStart(6, '0');
      const monto = Number(linea.monto).toFixed(2).padStart(20, ' ');
      lines.push(
        `Interfaz_AquaCis_SAP_Posicion ` +
        `0000000000${num}${pos}00000000` + ' '.repeat(15) +
        `               ${linea.indicador} ${monto}` + ' '.repeat(20) +
        `0.00` + ' '.repeat(16) +
        `${fecha}` + ' '.repeat(20) +
        `${linea.descripcion.substring(0, 30).padEnd(30)}` + ' '.repeat(20) +
        `${linea.texto?.substring(0, 20) ?? ''.padEnd(20)}` + ' '.repeat(20) +
        `${linea.cuentaContable}`
      );
    }

    return lines.join('\n');
  }

  // ---- Listar y buscar pólizas ----
  async findPolizas(params: {
    tipo?: string; periodo?: string; estado?: string; page?: number; limit?: number;
  }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const where = {
      ...(params.tipo && { tipo: params.tipo }),
      ...(params.periodo && { periodo: params.periodo }),
      ...(params.estado && { estado: params.estado }),
    };
    const [data, total] = await Promise.all([
      this.prisma.poliza.findMany({
        where,
        include: { lineas: { orderBy: { posicion: 'asc' } } },
        orderBy: { fecha: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.poliza.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async getPoliza(id: string) {
    const p = await this.prisma.poliza.findUnique({
      where: { id }, include: { lineas: { orderBy: { posicion: 'asc' } } },
    });
    if (!p) throw new NotFoundException('Póliza no encontrada');
    return p;
  }

  private async generarNumeroPoliza(): Promise<string> {
    const ultima = await this.prisma.poliza.findFirst({ orderBy: { numero: 'desc' }, select: { numero: true } });
    const siguiente = ultima ? parseInt(ultima.numero) + 1 : 1584000;
    return siguiente.toString();
  }
}
```

### `contabilidad.controller.ts`

```typescript
import {
  Controller, Get, Post, Param, Body, Query,
  UseGuards, ParseIntPipe, DefaultValuePipe, Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContabilidadService } from './contabilidad.service';

@Controller('contabilidad')
@UseGuards(JwtAuthGuard)
export class ContabilidadController {
  constructor(private readonly service: ContabilidadService) {}

  // ---- Reglas ----
  @Get('reglas')
  getReglas(@Query('tipoTransaccion') tipo?: string) { return this.service.getReglas(tipo); }

  @Post('reglas')
  createRegla(@Body() body: object) { return this.service.createRegla(body as any); }

  // ---- Pólizas ----
  @Get('polizas')
  findPolizas(
    @Query('tipo') tipo?: string,
    @Query('periodo') periodo?: string,
    @Query('estado') estado?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.service.findPolizas({ tipo, periodo, estado, page, limit });
  }

  @Get('polizas/:id')
  getPoliza(@Param('id') id: string) { return this.service.getPoliza(id); }

  @Post('polizas/generar/cobros')
  generarCobros(@Body() body: { fecha: string; periodo: string }) {
    return this.service.generarPolizaCobros(body.fecha, body.periodo);
  }

  @Post('polizas/generar/facturacion')
  generarFacturacion(@Body() body: { fecha: string; periodo: string }) {
    return this.service.generarPolizaFacturacion(body.fecha, body.periodo);
  }

  @Get('polizas/:id/exportar')
  async exportar(@Param('id') id: string, @Res() res: Response) {
    const poliza = await this.service.getPoliza(id);
    const idoc = poliza.archivoIdoc ?? this.service.generarIdoc(poliza);
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="${poliza.numero} ${poliza.tipo}.txt"`);
    res.send(idoc);
  }
}
```

### `contabilidad.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { ContabilidadController } from './contabilidad.controller';
import { ContabilidadService } from './contabilidad.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContabilidadController],
  providers: [ContabilidadService],
  exports: [ContabilidadService],
})
export class ContabilidadModule {}
```

Registrar en `app.module.ts`.

---

## Paso 3: Frontend — `frontend/src/pages/Contabilidad.tsx`

```typescript
// Reemplazar stub con implementación:
//
// Sección 1: "Generar Pólizas"
//   - Selector tipo: Cobros | Facturación | Convenio | Ajuste | Cancelación
//   - Datepicker fecha
//   - Input periodo (AAAAMM)
//   - Botón "Generar"
//   - Preview inmediato del IDOC generado (textarea monospace)
//   - Botón "Exportar .txt" (descarga el archivo IDOC)
//
// Sección 2: "Historial de Pólizas"
//   - Tabla con filtros: tipo, periodo, estado
//   - Columnas: Número, Tipo, Periodo, Fecha, Estado, Total líneas, Acciones
//   - Acciones: Ver detalle, Re-exportar, Ver IDOC
//
// Sección 3: "Reglas Contables"
//   - Tabla de ReglaContable: tipo transacción, indicador, cuenta, descripción SAP
//   - Botón "Nueva regla" (dialog con formulario)
//   - Advertencia: cambiar reglas afecta pólizas futuras, no las ya generadas
```

---

## Seed de reglas contables iniciales

Agregar en `backend/prisma/seed.ts`:

```typescript
const reglas = [
  { nombre: 'Cobro ventanilla - haber', tipoTransaccion: 'Pago', indicador: '40', cuentaContable: '2151100001', descripcionSAP: 'COBRO VENTANILLA OFICINA ANTICIPO', orden: 1 },
  { nombre: 'Ingreso por cobro - debe', tipoTransaccion: 'Pago', indicador: '15', cuentaContable: '11221111031001', descripcionSAP: 'COBRO VENTANILLA OFICINA GENERICO', orden: 2 },
  { nombre: 'Facturación ingresos', tipoTransaccion: 'Facturacion', indicador: '01', cuentaContable: '40000000001001', descripcionSAP: 'INGRESOS AGUA POTABLE', orden: 1 },
  { nombre: 'Facturación IVA', tipoTransaccion: 'Facturacion', indicador: '01', cuentaContable: '21160000001001', descripcionSAP: 'IVA TRASLADADO', orden: 2 },
  { nombre: 'Facturación CxC', tipoTransaccion: 'Facturacion', indicador: '40', cuentaContable: '12110000001001', descripcionSAP: 'CUENTAS POR COBRAR', orden: 3 },
];

for (const regla of reglas) {
  await prisma.reglaContable.upsert({
    where: { id: regla.nombre.toLowerCase().replace(/\s/g, '_') },
    create: regla,
    update: regla,
  });
}
```

---

## Notas importantes para el ejecutor

1. **Formato IDOC exacto:** Las posiciones exactas del formato IDOC deben validarse abriendo `Definicion Layout IDOC_vwork_version_cobros.xlsx` y `Definicion Layout IDOC_vwork_version_facturas.xlsx`. El código generador en `generarIdoc()` es una aproximación basada en los archivos de muestra — **ajustar posiciones según los layouts oficiales**.

2. **Cuentas contables:** Las cuentas contables (`11221111031001`, `2151100001`, etc.) son reales de la muestra. Parametrizarlas en `ReglaContable` permite adaptar el sistema sin reescribir código (req 23).

3. **Tipos de póliza:** Los tipos Convenio, Ajuste y Cancelación siguen el mismo patrón que Cobros y Facturación. Implementar `generarPolizaConvenio()` y `generarPolizaAjuste()` siguiendo la misma estructura.

4. **Guardrails — NO modificar:**
   - Módulos `pagos`, `timbrados` existentes
   - Migraciones previas

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_contabilidad
npm run build

# Generar póliza de cobros
curl -X POST http://localhost:3001/contabilidad/polizas/generar/cobros \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"fecha": "2026-02-16", "periodo": "202602"}'

# Exportar IDOC
curl -H "Authorization: Bearer <token>" \
  http://localhost:3001/contabilidad/polizas/<id>/exportar > poliza.txt

# Comparar con archivos de referencia en Requerimientos/Documentos/Contabilidad SAP/
diff poliza.txt "Requerimientos/Documentos/.../1584667 ingresos.txt"
```
