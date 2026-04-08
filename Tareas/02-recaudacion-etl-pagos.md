# Tarea 02 — Recaudación Externa y ETL de Pagos

**PRD reqs:** 12–16  
**Sección PRD:** "Recaudación externa y ETL de pagos"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui

---

## Contexto y estado actual

### Formatos de archivo reales (verificados en Requerimientos/Documentos)

Los archivos de recaudación externa se encuentran en:
`Requerimientos/Documentos/Interfaces-.../Archivos que se reciben de la recaudación externa/Archivos/`

Formatos identificados por banco/recaudador:

| Recaudador | Archivo | Formato |
|---|---|---|
| OXXO | `OXXO 160226.txt` | CSV con comas — campos: tipo, sucursal, fecha(AAAAMMDD), hora, contrato(25 chars), referencia(25 chars), monto |
| BANORTE | `BANORTE 160226.txt` | Posicional — cabecera + detalle, contrato en pos 7–14, monto en pos ~40–52, fecha en pos ~80 |
| BBVABANCOMER | `BBVABANCOMER 160226.txt` | Posicional — contrato pos 4–20, monto pos ~50–65 (formato XXXXXXX.XX), fecha pos ~65–74 (YYYY-MM-DD) |
| BBVA_DOM1 | `BBVA_DOM1.txt` | Posicional 2 tipos de línea (01=cabecera, 02=detalle), contrato pos ~50–68 |
| SANTANDER | `SANTANDER 160226.txt` | Posicional — cuenta en pos 0–14, fecha pos 14–22, monto en pos ~20–34 con signo |
| CITYBANAMEX | `CITYBANAMEX 160226.txt` | Posicional multi-segmento (06, 02, 07) |
| HSBC | `HSBC_fp 160226.txt` | Delimitado por espacios con cabecera, cols: UNIQUE_ID, ASOFDATE, FIELDAMOUNT, EXTLINE1-3 |
| AMEX | `AMEX.txt` | Verificar formato |
| BIMBONET | `BIMBONET 160226.txt` | Verificar formato |
| ELEKTRA | `ELEKTRA 160226.txt` | Verificar formato |
| CAJAS POPULARES | `CAJAFLOR/CAJAGONZ/CAJAINMA` | Verificar formato |
| SORIANA/SUPERQ | `SORIANA/SUPERQ 160226.txt` | Verificar formato |
| REGALII | `REGALII 170226.txt` | Verificar formato |
| SCOTIABANK | `SCOTIABANK 160226.txt` | Verificar formato |
| MUNICIPIO QRO | `MUNICIPIO QUERETARO 20260216.txt` | Verificar formato |
| BRMCEA | `BRMCEA_20260216.TXT` | Verificar formato |

Layout estándar interno: `LAYOUTS_Pagos_20022026.xlsx`  
Formas de pago: `DIF. FORMAS DE PAGO.xlsx`

### Estado actual del código

- `backend/src/modules/pagos/pagos.controller.ts` — STUB: `GET /pagos` retorna `[]`
- `backend/src/modules/pagos/pagos-externos.controller.ts` — STUB: `GET /pagos-externos` retorna `[]`
- `backend/src/modules/pagos/pagos.module.ts` — solo importa controllers
- `frontend/src/pages/Pagos.tsx` — stub sin conexión a backend
- Schema Prisma actual: `Pago` existe pero sin `PagoExterno`

---

## Objetivo

1. ETL multi-formato: normalizar archivos de 15+ recaudadores a layout estándar
2. Bandeja de pagos externos pendientes de conciliación con sugerencia de contrato
3. Aplicar pagos con fecha real del día que el cliente pagó (aunque el archivo llegue días después)
4. Validaciones y rechazo de registros inconsistentes con carpeta de error
5. Reglas de forma de pago por defecto por recaudador

---

## Aceptación (Definition of Done)

- [ ] Migración con modelo `PagoExterno` aplicada
- [ ] `POST /pagos-externos/upload` acepta archivo + recaudador, parsea y almacena
- [ ] Registros inválidos se marcan con `estado = 'rechazado'` y `motivoRechazo`
- [ ] `GET /pagos-externos?estado=pendiente_conciliar` lista los pendientes
- [ ] `POST /pagos-externos/:id/conciliar` asocia pago a contrato/recibo
- [ ] `POST /pagos-externos/:id/rechazar` rechaza con motivo
- [ ] `POST /pagos/aplicar` crea Pago con fecha real del cliente
- [ ] Frontend `Pagos.tsx` muestra bandeja de pendientes con conciliación manual

---

## Paso 1: Migración Prisma

Agregar a `backend/prisma/schema.prisma`:

```prisma
model PagoExterno {
  id                  String   @id @default(cuid())
  recaudador          String   // OXXO | BANORTE | BBVA | SANTANDER | etc.
  archivoNombre       String   @map("archivo_nombre")
  referencia          String?  // referencia interna del recaudador
  contratoRaw         String?  @map("contrato_raw")   // número de contrato tal como vino
  contratoId          String?  @map("contrato_id")    // contrato resuelto en BD
  monto               Decimal  @db.Decimal(10, 2)
  fechaPagoReal       DateTime @map("fecha_pago_real") // fecha real que pagó el cliente (req 14)
  formaPago           String?  @map("forma_pago")
  canal               String?
  oficina             String?
  estado              String   @default("pendiente_conciliar")
  // pendiente_conciliar | conciliado | rechazado
  motivoRechazo       String?  @map("motivo_rechazo")
  reciboId            String?  @map("recibo_id")
  datosRaw            Json?    @map("datos_raw")
  createdAt           DateTime @default(now()) @map("created_at")
  updatedAt           DateTime @updatedAt @map("updated_at")

  @@index([contratoId])
  @@index([estado])
  @@index([recaudador])
  @@index([fechaPagoReal])
  @@map("pagos_externos")
}
```

Ejecutar: `cd backend && npx prisma migrate dev --name add_pagos_externos`

---

## Paso 2: Backend — ETL Service

### Archivo: `backend/src/modules/pagos/etl-pagos.service.ts`

```typescript
import { Injectable } from '@nestjs/common';

export interface RegistroPagoNormalizado {
  contratoRaw: string | null;
  referencia: string | null;
  monto: number;
  fechaPagoReal: Date;
  formaPago: string | null;
  canal: string | null;
  oficina: string | null;
  datosRaw: object;
  error?: string; // si el registro es inválido
}

@Injectable()
export class EtlPagosService {

  // Dispatcher: elige parser según recaudador
  parseArchivo(recaudador: string, contenido: string): RegistroPagoNormalizado[] {
    switch (recaudador.toUpperCase()) {
      case 'OXXO':      return this.parseOXXO(contenido);
      case 'BANORTE':   return this.parseBanorte(contenido);
      case 'BBVA':
      case 'BBVABANCOMER': return this.parseBBVA(contenido);
      case 'BBVA_DOM1': return this.parseBBVADom(contenido);
      case 'SANTANDER': return this.parseSantander(contenido);
      case 'CITYBANAMEX':
      case 'BANAMEX':   return this.parseCityBanamex(contenido);
      case 'HSBC':      return this.parseHSBC(contenido);
      case 'AMEX':      return this.parseGenericoCsv(contenido, 'AMEX');
      case 'BIMBONET':  return this.parseGenericoCsv(contenido, 'BIMBONET');
      case 'ELEKTRA':   return this.parseGenericoCsv(contenido, 'ELEKTRA');
      case 'SORIANA':   return this.parseGenericoCsv(contenido, 'SORIANA');
      case 'SUPERQ':    return this.parseGenericoCsv(contenido, 'SUPERQ');
      case 'REGALII':   return this.parseGenericoCsv(contenido, 'REGALII');
      case 'SCOTIABANK': return this.parseGenericoCsv(contenido, 'SCOTIABANK');
      case 'MUNICIPIO':
      case 'MUNICIPIO_QRO': return this.parseGenericoCsv(contenido, 'MUNICIPIO');
      case 'BRMCEA':    return this.parseGenericoCsv(contenido, 'BRMCEA');
      default:
        // Cajas populares y otros sin parser específico
        return this.parseGenericoCsv(contenido, recaudador);
    }
  }

  // ---- Parsers específicos ----

  private parseOXXO(contenido: string): RegistroPagoNormalizado[] {
    // Formato: tipo,sucursal,fecha(AAAAMMDD),hora,contrato(25),referencia(25),monto
    // Ejemplo: 1 ,El Condado QRF,20260216,15:40,0100710623000000000000000,0000000000000000000000000,0000000000017.00
    return contenido.split('\n')
      .filter(l => l.trim())
      .map(linea => {
        const campos = linea.split(',');
        if (campos.length < 7) return { error: 'Formato inválido', ...this.errorRecord(linea) };

        const contratoRaw = campos[4]?.trim().replace(/^0+/, '') || null;
        const montoStr = campos[6]?.trim();
        const monto = parseFloat(montoStr);
        const fechaStr = campos[2]?.trim(); // AAAAMMDD

        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: this.parseFechaAAAAMMDD(fechaStr),
          formaPago: 'OXXO',
          canal: 'OXXO',
          oficina: campos[1]?.trim() || null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseBanorte(contenido: string): RegistroPagoNormalizado[] {
    // Formato posicional, líneas de detalle (no cabecera)
    // Contrato: primeros ~8 chars de la línea de detalle
    // Monto: aprox pos 40–55 (verificar con LAYOUTS_Pagos_20022026.xlsx)
    const lineas = contenido.split('\n').filter(l => l.trim() && !l.startsWith('001'));
    return lineas.map(linea => {
      const contratoRaw = linea.substring(6, 14).trim().replace(/^0+/, '') || null;
      const montoStr = linea.substring(39, 53).trim();
      const monto = parseFloat(montoStr) / 100; // centavos → pesos
      const fechaStr = linea.substring(78, 86)?.trim();

      if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

      return {
        contratoRaw,
        referencia: linea.substring(0, 6).trim() || null,
        monto,
        fechaPagoReal: this.parseFechaAAAAMMDD(fechaStr),
        formaPago: 'TRANSFERENCIA',
        canal: 'BANORTE',
        oficina: null,
        datosRaw: { raw: linea },
      };
    });
  }

  private parseBBVA(contenido: string): RegistroPagoNormalizado[] {
    // Ejemplo: 058241700000000000002732774  ...  0000000001461.00  0042595612026-02-16 CIUDAD DE 0998Y01
    return contenido.split('\n')
      .filter(l => l.trim())
      .map(linea => {
        const contratoRaw = linea.substring(3, 22).trim().replace(/^0+/, '') || null;
        // Monto: buscar patrón XXXXXXXXX.XX después de ceros
        const montoMatch = linea.match(/0{5,}(\d+\.\d{2})/g);
        const monto = montoMatch ? parseFloat(montoMatch[montoMatch.length - 1].replace(/^0+/, '')) : 0;
        // Fecha YYYY-MM-DD cerca del final
        const fechaMatch = linea.match(/(\d{4}-\d{2}-\d{2})/);
        const fechaStr = fechaMatch?.[1];

        if (!monto || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: fechaStr ? new Date(fechaStr) : new Date(),
          formaPago: 'TRANSFERENCIA',
          canal: 'BBVA',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseBBVADom(contenido: string): RegistroPagoNormalizado[] {
    // Líneas tipo 02 = detalle
    return contenido.split('\n')
      .filter(l => l.startsWith('02'))
      .map(linea => {
        const contratoRaw = linea.substring(60, 80)?.trim().replace(/^0+/, '') || null;
        const montoStr = linea.substring(20, 34)?.trim();
        const monto = parseFloat(montoStr) / 100;
        const fechaStr = linea.substring(34, 42)?.trim();

        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: this.parseFechaAAAAMMDD(fechaStr),
          formaPago: 'DOMICILIACION',
          canal: 'BBVA_DOMICILIACION',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseSantander(contenido: string): RegistroPagoNormalizado[] {
    // Ejemplo: 65500498996  1602202622413687ABO...  +00000000012100  000000036088000...
    return contenido.split('\n')
      .filter(l => l.trim())
      .map(linea => {
        // Fecha en pos 14–22 (DDMMAAAA)
        const fechaDDMMAAAA = linea.substring(14, 22).trim();
        // Monto pos ~33–47 con signo + al inicio
        const montoStr = linea.substring(32, 47).trim().replace('+', '');
        const monto = parseFloat(montoStr) / 100;
        // Contrato en referencia (pos ~50–66 o en descripción)
        const contratoRaw = linea.substring(50, 66)?.trim().replace(/^0+/, '') || null;

        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

        return {
          contratoRaw,
          referencia: linea.substring(0, 14).trim() || null,
          monto,
          fechaPagoReal: this.parseFechaDDMMAAAA(fechaDDMMAAAA),
          formaPago: 'TRANSFERENCIA',
          canal: 'SANTANDER',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseCityBanamex(contenido: string): RegistroPagoNormalizado[] {
    // Multi-segmento: líneas "607001" son detalles
    return contenido.split('\n')
      .filter(l => l.startsWith('607'))
      .map(linea => {
        const contratoRaw = linea.substring(6, 16)?.trim().replace(/^0+/, '') || null;
        const montoStr = linea.substring(26, 40)?.trim();
        const monto = parseFloat(montoStr) / 100;
        const fechaStr = linea.substring(40, 46)?.trim(); // DDMMAA

        if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

        return {
          contratoRaw,
          referencia: null,
          monto,
          fechaPagoReal: this.parseFechaDDMMYY(fechaStr),
          formaPago: 'TRANSFERENCIA',
          canal: 'BANAMEX',
          oficina: null,
          datosRaw: { raw: linea },
        };
      });
  }

  private parseHSBC(contenido: string): RegistroPagoNormalizado[] {
    // Formato con cabecera: UNIQUE_ID ASOFDATE FIELDAMOUNT EXTLINE1 TEXTLINE2 TEXTLINE3
    // Ejemplo: 1  16/02/2026  394  ABONO 1007  5503  00004846671
    const lineas = contenido.split('\n').slice(1).filter(l => l.trim()); // saltar cabecera
    return lineas.map(linea => {
      const partes = linea.trim().split(/\s+/);
      const fechaStr = partes[1]; // DD/MM/YYYY
      const montoStr = partes[2];
      const monto = parseFloat(montoStr);
      // El contrato puede estar en EXTLINE1-3
      const contratoRaw = partes.slice(3).join(' ').trim().replace(/\D/g, '') || null;

      if (isNaN(monto) || monto <= 0) return { error: 'Monto inválido', ...this.errorRecord(linea) };

      return {
        contratoRaw,
        referencia: partes[0] || null,
        monto,
        fechaPagoReal: this.parseFechaSlash(fechaStr),
        formaPago: 'TRANSFERENCIA',
        canal: 'HSBC',
        oficina: null,
        datosRaw: { raw: linea },
      };
    });
  }

  // Parser genérico para recaudadores sin parser específico
  // NOTA: Estos deben ajustarse cuando se documenten sus layouts reales
  private parseGenericoCsv(contenido: string, recaudador: string): RegistroPagoNormalizado[] {
    return contenido.split('\n')
      .filter(l => l.trim())
      .map(linea => ({
        contratoRaw: null,
        referencia: null,
        monto: 0,
        fechaPagoReal: new Date(),
        formaPago: this.formaPagoDefecto(recaudador),
        canal: recaudador,
        oficina: null,
        datosRaw: { raw: linea },
        error: `Parser genérico para ${recaudador}: revisar layout`,
      }));
  }

  // ---- Utilidades de fecha ----
  private parseFechaAAAAMMDD(s?: string): Date {
    if (!s || s.length < 8) return new Date();
    return new Date(`${s.substring(0, 4)}-${s.substring(4, 6)}-${s.substring(6, 8)}`);
  }

  private parseFechaDDMMAAAA(s?: string): Date {
    if (!s || s.length < 8) return new Date();
    return new Date(`${s.substring(4, 8)}-${s.substring(2, 4)}-${s.substring(0, 2)}`);
  }

  private parseFechaDDMMYY(s?: string): Date {
    if (!s || s.length < 6) return new Date();
    const yy = parseInt(s.substring(4, 6));
    const yyyy = yy < 50 ? `20${yy.toString().padStart(2, '0')}` : `19${yy.toString().padStart(2, '0')}`;
    return new Date(`${yyyy}-${s.substring(2, 4)}-${s.substring(0, 2)}`);
  }

  private parseFechaSlash(s?: string): Date {
    if (!s) return new Date();
    const [dd, mm, yyyy] = s.split('/');
    return new Date(`${yyyy}-${mm}-${dd}`);
  }

  private errorRecord(linea: string): Partial<RegistroPagoNormalizado> {
    return { contratoRaw: null, referencia: null, monto: 0, fechaPagoReal: new Date(),
      formaPago: null, canal: null, oficina: null, datosRaw: { raw: linea } };
  }

  // Regla: forma de pago por defecto cuando no viene explícita (req 16)
  formaPagoDefecto(recaudador: string): string {
    const map: Record<string, string> = {
      OXXO: 'EFECTIVO_OXXO',
      BANORTE: 'TRANSFERENCIA',
      BBVA: 'TRANSFERENCIA',
      BBVABANCOMER: 'TRANSFERENCIA',
      BBVA_DOM1: 'DOMICILIACION',
      SANTANDER: 'TRANSFERENCIA',
      BANAMEX: 'TRANSFERENCIA',
      CITYBANAMEX: 'TRANSFERENCIA',
      HSBC: 'TRANSFERENCIA',
      AMEX: 'TARJETA',
      ELEKTRA: 'EFECTIVO_ELEKTRA',
      SORIANA: 'EFECTIVO_SORIANA',
      SUPERQ: 'EFECTIVO_SUPERQ',
      REGALII: 'EFECTIVO_REGALII',
      SCOTIABANK: 'TRANSFERENCIA',
    };
    return map[recaudador.toUpperCase()] ?? 'EFECTIVO';
  }
}
```

### Archivo: `backend/src/modules/pagos/pagos-externos.service.ts`

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EtlPagosService } from './etl-pagos.service';

@Injectable()
export class PagosExternosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly etl: EtlPagosService,
  ) {}

  async uploadArchivo(params: {
    recaudador: string;
    archivoNombre: string;
    contenido: string;
  }) {
    const registros = this.etl.parseArchivo(params.recaudador, params.contenido);
    if (registros.length === 0) throw new BadRequestException('Archivo sin registros');

    let procesados = 0;
    let rechazados = 0;
    const errores: string[] = [];

    for (const r of registros) {
      // Validar monto y contrato (req 15)
      if (r.error || !r.monto || r.monto <= 0) {
        rechazados++;
        errores.push(r.error ?? 'Monto inválido');
        await this.prisma.pagoExterno.create({
          data: {
            recaudador: params.recaudador,
            archivoNombre: params.archivoNombre,
            contratoRaw: r.contratoRaw,
            monto: r.monto || 0,
            fechaPagoReal: r.fechaPagoReal,
            formaPago: r.formaPago ?? this.etl.formaPagoDefecto(params.recaudador),
            canal: r.canal,
            oficina: r.oficina,
            estado: 'rechazado',
            motivoRechazo: r.error ?? 'Validación fallida',
            datosRaw: r.datosRaw,
          },
        });
        continue;
      }

      // Intentar resolver contratoId en BD
      let contratoId: string | null = null;
      if (r.contratoRaw) {
        const contrato = await this.prisma.contrato.findFirst({
          where: { id: { contains: r.contratoRaw } },
          select: { id: true },
        });
        contratoId = contrato?.id ?? null;
      }

      await this.prisma.pagoExterno.create({
        data: {
          recaudador: params.recaudador,
          archivoNombre: params.archivoNombre,
          referencia: r.referencia,
          contratoRaw: r.contratoRaw,
          contratoId,
          monto: r.monto,
          fechaPagoReal: r.fechaPagoReal,
          formaPago: r.formaPago ?? this.etl.formaPagoDefecto(params.recaudador),
          canal: r.canal,
          oficina: r.oficina,
          estado: 'pendiente_conciliar',
          datosRaw: r.datosRaw,
        },
      });
      procesados++;
    }

    return { procesados, rechazados, total: registros.length, errores };
  }

  async findAll(params: { estado?: string; recaudador?: string; page?: number; limit?: number }) {
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const where = {
      ...(params.estado && { estado: params.estado }),
      ...(params.recaudador && { recaudador: params.recaudador }),
    };
    const [data, total] = await Promise.all([
      this.prisma.pagoExterno.findMany({
        where,
        orderBy: { fechaPagoReal: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pagoExterno.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async conciliar(id: string, contratoId: string, reciboId?: string) {
    const pago = await this.prisma.pagoExterno.findUnique({ where: { id } });
    if (!pago) throw new NotFoundException('Pago externo no encontrado');
    if (pago.estado !== 'pendiente_conciliar')
      throw new BadRequestException('El pago ya fue procesado');

    // Crear Pago real en el sistema (req 14 — usar fecha real del cliente)
    const pagoAplicado = await this.prisma.pago.create({
      data: {
        contratoId,
        reciboId: reciboId ?? null,
        monto: pago.monto,
        fecha: pago.fechaPagoReal.toISOString().split('T')[0], // fecha real del cliente
        tipo: pago.formaPago ?? 'EFECTIVO',
        concepto: `Pago externo ${pago.recaudador} - Ref: ${pago.referencia ?? pago.id}`,
        origen: 'externo',
      },
    });

    // Actualizar estado del pago externo
    await this.prisma.pagoExterno.update({
      where: { id },
      data: { estado: 'conciliado', contratoId, reciboId },
    });

    return { pagoExternoId: id, pagoAplicadoId: pagoAplicado.id };
  }

  async rechazar(id: string, motivo: string) {
    const pago = await this.prisma.pagoExterno.findUnique({ where: { id } });
    if (!pago) throw new NotFoundException('Pago externo no encontrado');
    return this.prisma.pagoExterno.update({
      where: { id },
      data: { estado: 'rechazado', motivoRechazo: motivo },
    });
  }
}
```

### Archivo: `backend/src/modules/pagos/pagos-externos.controller.ts`

```typescript
import {
  Controller, Get, Post, Param, Body, Query,
  UploadedFile, UseInterceptors, UseGuards,
  ParseIntPipe, DefaultValuePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PagosExternosService } from './pagos-externos.service';

@Controller('pagos-externos')
@UseGuards(JwtAuthGuard)
export class PagosExternosController {
  constructor(private readonly service: PagosExternosService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('archivo'))
  async upload(
    @UploadedFile() archivo: Express.Multer.File,
    @Body() body: { recaudador: string },
  ) {
    return this.service.uploadArchivo({
      recaudador: body.recaudador,
      archivoNombre: archivo.originalname,
      contenido: archivo.buffer.toString('latin1'),
    });
  }

  @Get()
  findAll(
    @Query('estado') estado?: string,
    @Query('recaudador') recaudador?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  ) {
    return this.service.findAll({ estado, recaudador, page, limit });
  }

  @Post(':id/conciliar')
  conciliar(
    @Param('id') id: string,
    @Body() body: { contratoId: string; reciboId?: string },
  ) {
    return this.service.conciliar(id, body.contratoId, body.reciboId);
  }

  @Post(':id/rechazar')
  rechazar(@Param('id') id: string, @Body() body: { motivo: string }) {
    return this.service.rechazar(id, body.motivo);
  }
}
```

### Actualizar `backend/src/modules/pagos/pagos.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PagosController } from './pagos.controller';
import { PagosExternosController } from './pagos-externos.controller';
import { PagosExternosService } from './pagos-externos.service';
import { EtlPagosService } from './etl-pagos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, MulterModule.register({ limits: { fileSize: 50 * 1024 * 1024 } })],
  controllers: [PagosController, PagosExternosController],
  providers: [PagosExternosService, EtlPagosService],
  exports: [PagosExternosService, EtlPagosService],
})
export class PagosModule {}
```

---

## Paso 3: Frontend — `frontend/src/pages/Pagos.tsx`

```typescript
// Estructura de la página con shadcn-ui Tabs:
//
// Pestaña 1: "Pagos Externos — Por Conciliar"
//   - Filtros: recaudador (dropdown), estado
//   - Tabla: Recaudador, Contrato Raw, Monto, Fecha Pago Real, Forma de Pago, Estado
//   - Por cada fila con estado pendiente_conciliar:
//     - Botón "Conciliar": abre dialog con buscador de contrato y recibo opcional
//     - Botón "Rechazar": abre dialog con campo motivo
//   - Badge de color: pendiente=amarillo, conciliado=verde, rechazado=rojo
//   - Upload button: dropdown selector de recaudador + input archivo
//
// Pestaña 2: "Pagos Nativos"
//   - Lista de pagos con origen='nativo'
//   - Tabla: Contrato, Monto, Fecha, Tipo, Concepto
//
// Pestaña 3: "Upload Archivo"
//   - Selector de recaudador (OXXO, BANORTE, BBVA, SANTANDER, etc.)
//   - Dropzone para archivo .txt
//   - Resultado: procesados, rechazados, lista de errores
```

Agregar en `frontend/src/api/pagos.ts`:

```typescript
export const uploadPagosExternos = (formData: FormData) =>
  api.post('/pagos-externos/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getPagosExternos = (params?: Record<string, string | number>) =>
  api.get('/pagos-externos', { params }).then(r => r.data);

export const conciliarPago = (id: string, data: { contratoId: string; reciboId?: string }) =>
  api.post(`/pagos-externos/${id}/conciliar`, data).then(r => r.data);

export const rechazarPago = (id: string, motivo: string) =>
  api.post(`/pagos-externos/${id}/rechazar`, { motivo }).then(r => r.data);
```

---

## Notas importantes para el ejecutor

1. **Posiciones en archivos planos:** Las posiciones de campos son estimadas con base en las muestras disponibles. **DEBEN validarse** con `LAYOUTS_Pagos_20022026.xlsx` y `DIF. FORMAS DE PAGO.xlsx` antes de producción. Abrir esos archivos con Excel o la librería `xlsx` de Node.

2. **Encoding:** Todos los archivos de recaudación usan ISO-8859-1 (latin1). Usar `buffer.toString('latin1')`.

3. **Fecha real del cliente (req 14):** La fecha que se guarda en `Pago.fecha` debe ser la fecha del campo `fechaPagoReal` del `PagoExterno`, NO la fecha de procesamiento del archivo.

4. **Recaudadores sin parser:** AMEX, BIMBONET, ELEKTRA, SORIANA, SUPERQ, REGALII, SCOTIABANK, MUNICIPIO, BRMCEA usarán el parser genérico hasta que se documente su layout real. El ejecutor debe leer sus archivos de muestra y crear parsers específicos siguiendo el mismo patrón.

5. **Guardrails — NO modificar:**
   - Modelo `Pago` existente en schema — solo agregar `PagoExterno`
   - `backend/src/modules/auth/` — no tocar
   - Migraciones existentes

---

## Validación

```bash
# 1. Migración
cd backend && npx prisma migrate dev --name add_pagos_externos

# 2. Compilar
npm run build

# 3. Upload archivo OXXO de muestra
curl -X POST http://localhost:3001/pagos-externos/upload \
  -H "Authorization: Bearer <token>" \
  -F "archivo=@Requerimientos/Documentos/.../OXXO 160226.txt" \
  -F "recaudador=OXXO"

# 4. Verificar pendientes
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/pagos-externos?estado=pendiente_conciliar"

# 5. Conciliar un pago
curl -X POST http://localhost:3001/pagos-externos/<id>/conciliar \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"contratoId": "<id>"}'
```
