# Tarea 14 — Motor Tarifario

**PRD reqs:** 26, 27, 28, 29, 30, 31  
**Sección PRD:** "Motor tarifario con fórmulas, vigencias y correctores"  
**Stack:** NestJS + Prisma + PostgreSQL + React/Vite/TypeScript/shadcn-ui  
**Dependencias:** T13 (Tipos contratación para vincular tarifas)

---

## Contexto

El PRD 2026-04-06 requiere un motor tarifario con fórmulas compuestas (precio base + componente proporcional por cantidad), IVA diferenciado, variables como distancia o diámetro, tarifas escalonadas mensuales, tarifas fijas especiales, vigencias históricas, correctores para multas/recargos/descuentos, ajustes manuales con trazabilidad, y actualizaciones automáticas trimestrales.

---

## Objetivo

1. Modelo `Tarifa` con tipos escalonado/fijo/variable y vigencias históricas
2. Correctores tarifarios: penalizaciones, bonificaciones, descuentos, recargos
3. Ajustes manuales excepcionales con trazabilidad y aprobación
4. Motor de cálculo: `calcularMonto(tarifa, variables)` → monto con desglose
5. Actualizaciones automáticas trimestrales con nueva versión
6. Validación de asignación tarifaria por administración, tipo de usuario y servicio

---

## Aceptación (Definition of Done)

- [ ] Migración con `Tarifa`, `CorreccionTarifaria`, `AjusteTarifario`, `ActualizacionTarifaria` aplicada
- [ ] `GET/POST /tarifas` CRUD con filtros por tipo, servicio, vigencia
- [ ] `GET /tarifas/vigentes` retorna tarifas activas a la fecha
- [ ] `POST /tarifas/calcular` recibe tarifa + variables → retorna monto con desglose
- [ ] `GET/POST /correcciones-tarifarias` CRUD de correctores
- [ ] `POST /ajustes-tarifarios` registra ajuste manual con motivo y autorización
- [ ] `POST /actualizaciones-tarifarias/ejecutar` genera nueva versión de tarifas con incremento
- [ ] `POST /tarifas/validar-asignacion` valida tarifa para administración/tipo/servicio
- [ ] Frontend: administración de tarifas con escalonamiento visual
- [ ] Frontend: panel de ajustes manuales con flujo de aprobación

---

## Modelos Prisma (ya aplicados en schema)

```prisma
model Tarifa {
  id              String   @id @default(cuid())
  codigo          String
  nombre          String
  tipoServicio    String   // agua | saneamiento | alcantarillado
  tipoCalculo     String   // escalonado | fijo | variable
  rangoMinM3      Int?
  rangoMaxM3      Int?
  precioUnitario  Decimal?
  cuotaFija       Decimal?
  ivaPct          Decimal  @default(16)
  vigenciaDesde   DateTime
  vigenciaHasta   DateTime?
  activo          Boolean  @default(true)
  version         Int      @default(1)
}

model CorreccionTarifaria {
  id         String @id @default(cuid())
  tarifaId   String
  tipo       String // penalizacion | bonificacion | descuento | recargo
  descripcion String
  formula    String?
  porcentaje Decimal?
  montoFijo  Decimal?
  condiciones Json?
  activo     Boolean @default(true)
}

model AjusteTarifario {
  id            String  @id @default(cuid())
  contratoId    String
  periodo       String
  tipo          String  // manual | automatico
  concepto      String
  montoOriginal Decimal
  montoAjustado Decimal
  motivo        String
  aprobadoPor   String?
}

model ActualizacionTarifaria {
  id               String   @id @default(cuid())
  descripcion      String
  fechaPublicacion DateTime
  fechaAplicacion  DateTime
  fuenteOficial    String?
  estado           String   @default("pendiente")
  tarifasAfectadas Json?
  aplicadoPor      String?
}
```

---

## Paso 1: Motor de cálculo

```typescript
interface CalculoInput {
  tarifaCodigo: string;
  m3Consumidos: number;
  variables?: { distancia?: number; diametro?: number };
  periodo: string;
}

interface CalculoResult {
  subtotal: number;
  iva: number;
  total: number;
  desglose: { concepto: string; monto: number; detalle: string }[];
  tarifaAplicada: { id: string; codigo: string; version: number };
}

@Injectable()
export class MotorTarifarioService {
  async calcular(input: CalculoInput): Promise<CalculoResult> {
    // 1. Buscar tarifa vigente por código y fecha
    // 2. Según tipoCalculo:
    //    - escalonado: iterar rangos y aplicar precio unitario por escalón
    //    - fijo: cuotaFija directa
    //    - variable: precioUnitario × m3
    // 3. Aplicar correctores activos vinculados a la tarifa
    // 4. Calcular IVA según ivaPct
    // 5. Retornar desglose completo
  }

  async ejecutarActualizacionTrimestral(dto: {
    descripcion: string;
    porcentajeIncremento: number;
    fechaAplicacion: string;
    fuenteOficial?: string;
  }) {
    // 1. Obtener todas las tarifas activas
    // 2. Para cada una: cerrar vigencia actual, crear nueva versión con incremento
    // 3. Registrar en ActualizacionTarifaria
  }

  async validarAsignacion(params: {
    tarifaCodigo: string;
    administracionId?: string;
    tipoContratacionId?: string;
    tipoServicio?: string;
  }): Promise<{ valida: boolean; errores: string[] }> {
    // Validar que la tarifa corresponda a la combinación
  }
}
```

---

## Paso 2: Frontend

### Admin de tarifas

- Listado con filtros: tipo servicio, tipo cálculo, vigencia
- Detalle con: escalones (tabla editable), correctores, historial de versiones
- Gráfico de escalonamiento visual (barras por rango)
- Panel de creación de nueva tarifa con preview de cálculo

### Ajustes manuales

- Formulario: contrato, periodo, motivo, monto original → monto ajustado
- Flujo de aprobación: Pendiente → Aprobado/Rechazado
- Histórico de ajustes por contrato

### Actualizaciones trimestrales

- Botón "Ejecutar actualización" con: porcentaje, fecha aplicación, fuente oficial
- Preview: lista de tarifas afectadas con monto actual vs nuevo
- Confirmación antes de aplicar

---

## Preguntas abiertas bloqueantes

- ⚠️ #11: Excepciones tarifarias permitidas y quién autoriza
- ⚠️ #13: Controles de asignación tarifaria por administración/tipo/servicio

---

## Validación

```bash
cd backend && npx prisma migrate dev --name add_motor_tarifario
npm run build

# Calcular tarifa
curl -X POST http://localhost:3001/tarifas/calcular \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tarifaCodigo":"DOM_ESCALONADA","m3Consumidos":15,"periodo":"2026-04"}'

# Validar asignación
curl -X POST http://localhost:3001/tarifas/validar-asignacion \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"tarifaCodigo":"DOM_ESCALONADA","tipoServicio":"agua"}'
```
