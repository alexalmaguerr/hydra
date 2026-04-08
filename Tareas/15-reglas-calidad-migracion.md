# Tarea 15 — Reglas de Calidad y Marco de Migración de Datos

**PRD reqs:** 32, 33 (parcial)  
**Sección PRD:** "Reglas de calidad, homologación y limpieza de datos"  
**Stack:** NestJS + Prisma + PostgreSQL  
**Dependencias:** T12 (Domicilios), T13 (Catálogos), T14 (Tarifas)

---

## Contexto

El PRD 2026-04-06 establece que antes de la migración se deben definir reglas de calidad, homologación y limpieza de datos. Los procesos de contratación, facturación, cortes, lecturas y administración deben compartir reglas y datos consistentes.

Esta tarea es transversal: no genera un módulo de backend nuevo, sino un framework de validación, reglas de negocio compartidas y scripts de migración.

---

## Objetivo

1. Definir reglas de calidad por dominio: Contratos, Personas, Domicilios, PuntoServicio, Tarifas
2. Reglas de homologación: mapeo legacy → nuevos catálogos
3. Reglas de limpieza: duplicados, inconsistencias, datos faltantes
4. Scripts de validación ejecutables pre-migración
5. Reporte de calidad de datos con métricas
6. Capa de servicios compartidos para reglas de negocio cruzadas

---

## Aceptación (Definition of Done)

- [ ] Documento de reglas de calidad por dominio en `/docs/reglas-calidad-datos.md`
- [ ] Script `scripts/validar-calidad-datos.ts` ejecutable con reporte
- [ ] Script `scripts/homologar-catalogos.ts` para mapeo legacy → nuevos catálogos
- [ ] Script `scripts/limpiar-duplicados.ts` para detección de duplicados en Personas y Domicilios
- [ ] `GET /monitoreo/calidad-datos` endpoint que ejecuta validación y retorna métricas
- [ ] Reglas de consistencia cruzada documentadas y verificables

---

## Reglas de calidad por dominio

### Contratos

| # | Regla | Severidad |
|---|-------|-----------|
| C1 | Todo contrato activo debe tener al menos una Persona con rol Propietario | Error |
| C2 | Todo contrato activo debe tener PuntoServicio asignado | Warning |
| C3 | Todo contrato activo debe tener Domicilio estructurado (no solo string) | Warning |
| C4 | Todo contrato activo debe tener TipoContratacion asignado | Error |
| C5 | El estado del contrato debe ser un valor válido del catálogo | Error |
| C6 | RFC de contrato debe coincidir con RFC de PersonaFiscal asignada | Warning |

### Personas

| # | Regla | Severidad |
|---|-------|-----------|
| P1 | Persona Física debe tener al menos nombre | Error |
| P2 | Persona Moral debe tener razónSocial y RFC | Error |
| P3 | RFC debe tener formato válido (13 caracteres Física, 12 Moral) | Warning |
| P4 | No deben existir personas duplicadas por RFC | Warning |
| P5 | CURP debe tener formato válido (18 caracteres) | Warning |

### Domicilios

| # | Regla | Severidad |
|---|-------|-----------|
| D1 | Todo domicilio debe tener calle y al menos un identificador (CP o colonia) | Error |
| D2 | Código postal debe existir en catálogo INEGI | Warning |
| D3 | Colonia debe pertenecer al municipio correcto | Warning |
| D4 | No deben existir domicilios duplicados (misma calle + número + colonia) | Warning |
| D5 | Dirección concatenada debe estar generada | Info |

### Puntos de servicio

| # | Regla | Severidad |
|---|-------|-----------|
| PS1 | Código de punto de servicio debe ser único | Error |
| PS2 | Todo punto de servicio activo debe tener tipo de suministro | Warning |
| PS3 | Puntos hijo deben tener porcentaje de repartición definido | Warning |
| PS4 | Suma de reparticiones de hijos no debe exceder 100% | Error |

### Tarifas

| # | Regla | Severidad |
|---|-------|-----------|
| T1 | Toda tarifa activa debe tener vigencia desde definida | Error |
| T2 | No deben existir tarifas vigentes superpuestas para el mismo código | Error |
| T3 | Tarifa escalonada debe tener rangos sin huecos | Error |
| T4 | Todo contrato activo debe tener tarifa vigente asignada | Warning |

---

## Reglas de consistencia cruzada (Req 33)

| # | Regla | Procesos involucrados |
|---|-------|-----------------------|
| CC1 | Contrato activo + sin tarifa vigente = inconsistencia | Contratación ↔ Facturación |
| CC2 | Contrato con corte activo debe tener estado correspondiente | Cortes ↔ Contratación |
| CC3 | Lectura registrada debe corresponder a contrato con medidor activo | Lecturas ↔ Contratación |
| CC4 | Pago aplicado debe corresponder a recibo/factura existente | Recaudación ↔ Facturación |
| CC5 | Póliza contable debe cuadrar con facturación del periodo | Facturación ↔ Contabilidad |
| CC6 | Cambio de tipo de contrato debe reflejarse en conceptos y tarifas | Contratación ↔ Facturación |

---

## Script de validación pre-migración

```typescript
// scripts/validar-calidad-datos.ts
interface ResultadoValidacion {
  dominio: string;
  regla: string;
  severidad: 'Error' | 'Warning' | 'Info';
  totalRegistros: number;
  registrosConProblema: number;
  porcentajeCumplimiento: number;
  ejemplos: string[]; // primeros 5 IDs con problema
}

async function validarCalidadDatos(prisma: PrismaClient): Promise<ResultadoValidacion[]> {
  const resultados: ResultadoValidacion[] = [];

  // C1: Contratos sin Propietario
  const contratosSinPropietario = await prisma.contrato.findMany({
    where: { estado: 'Activo', personas: { none: { rol: 'Propietario', activo: true } } },
    select: { id: true },
  });
  resultados.push({
    dominio: 'Contratos', regla: 'C1', severidad: 'Error',
    totalRegistros: await prisma.contrato.count({ where: { estado: 'Activo' } }),
    registrosConProblema: contratosSinPropietario.length,
    porcentajeCumplimiento: /* calcular */,
    ejemplos: contratosSinPropietario.slice(0, 5).map(c => c.id),
  });

  // ... demás reglas

  return resultados;
}
```

---

## Endpoint de calidad de datos

```typescript
// Agregar a MonitoreoService o como servicio independiente:
@Get('calidad-datos')
async getCalidadDatos() {
  // Ejecutar reglas de validación
  // Retornar dashboard con métricas por dominio
}
```

---

## Entregables

1. `/docs/reglas-calidad-datos.md` — documento formal con todas las reglas
2. `scripts/validar-calidad-datos.ts` — script ejecutable con reporte
3. `scripts/homologar-catalogos.ts` — mapeo de datos legacy a nuevos catálogos
4. `scripts/limpiar-duplicados.ts` — detección y resolución de duplicados
5. Integración con T09 (Monitoreo): nuevo tipo de conciliación `CALIDAD_DATOS`
6. Capa de servicios compartidos para validaciones cruzadas

---

## Notas

- Esta tarea debe ejecutarse **antes** de la migración masiva de datos
- Los scripts deben ser idempotentes y seguros para ejecutar múltiples veces
- El reporte de calidad debe servir como gate de aprobación para migración
- Las reglas de consistencia cruzada deben incorporarse al monitoreo periódico (T09)
