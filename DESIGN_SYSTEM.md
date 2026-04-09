# CEA Water Management — Design System

> Estándar visual definido por Stitch para **contract-to-cash-flow**.  
> Toda nueva pantalla, componente o modificación de UI **debe seguir este documento**.

---

## 1. Paleta de Colores

### Brand tokens (Stitch)

| Token         | Hex       | HSL approx              | Uso principal                              |
|---------------|-----------|-------------------------|--------------------------------------------|
| **Primary**   | `#003366` | `211 100% 20%`          | Sidebar, encabezados de sección, énfasis   |
| **Secondary** | `#4A6278` | `207 24% 38%`           | Texto secundario, iconos de nav inactivos  |
| **Tertiary**  | `#007BFF` | `211 100% 50%`          | Botones CTA primarios, links, badges activos |
| **Neutral**   | `#F8FAFC` | `210 40% 98%`           | Fondo de página, fondo de cards            |

### Colores semánticos

| Uso             | Color           | Hex       |
|-----------------|-----------------|-----------|
| Success / Verde | Aprobada, Activo | `#16a34a` |
| Warning / Ámbar | En revisión, Pendiente | `#d97706` |
| Danger / Rojo   | Rechazada, Crítico | `#dc2626` |
| Info / Azul     | Pre-factibilidad, En comité | `#2563eb` |
| Muted text      | Labels tabla, subtítulos | `#64748b` |

### Sidebar

| Token               | Valor                                  |
|---------------------|----------------------------------------|
| Fondo sidebar       | `#0d1b2e` (más oscuro que Primary)     |
| Texto nav inactivo  | `rgba(255,255,255,0.55)`               |
| Texto nav activo    | `#ffffff`                              |
| Fondo item activo   | `rgba(255,255,255,0.12)`               |
| Separador           | `rgba(255,255,255,0.08)`               |

---

## 2. Tipografía

| Rol        | Fuente       | Peso(s)         | Tamaños usados                |
|------------|--------------|-----------------|-------------------------------|
| Headlines  | **Manrope**  | 600, 700        | 28px (H1), 22px (H2), 18px (H3) |
| Body       | **Inter**    | 400, 500        | 14px (default), 13px (small)  |
| Labels     | **Inter**    | 500, 600        | 11px uppercase (col headers)  |
| Numbers    | **Inter**    | 700             | 32–40px (métricas grandes)    |
| Monospace  | system-mono  | 400             | IDs de contrato, series       |

**Regla:** Todos los encabezados de tabla van en `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`.

---

## 3. Layout

### Shell de aplicación

```
┌─────────────────────────────────────────────────────┐
│  Topbar (h-14, sticky)                              │
├────────────┬────────────────────────────────────────┤
│            │  Page Header                           │
│  Sidebar   │  ─────────────────────────────────     │
│  (w-56)    │  KPI Cards (grid 4 cols)               │
│            │  ─────────────────────────────────     │
│            │  Toolbar (filtros + exportar)          │
│            │  Table / Content                       │
│            │  Pagination                            │
└────────────┴────────────────────────────────────────┘
```

- **Sidebar**: `w-56`, fondo `#0d1b2e`, sticky, logo + sección PRINCIPAL + links + SUPPORT/SETTINGS al fondo
- **Contenido**: padding `px-8 py-6`, fondo `bg-neutral` (#F8FAFC)
- **Topbar**: `h-14 bg-white border-b`, search centered, iconos de notif + ayuda + grid + user a la derecha

### Page Header

```tsx
<div className="mb-6 flex items-start justify-between">
  <div>
    {/* Breadcrumb opcional: text-xs text-muted uppercase tracking-wide */}
    <h1 className="text-[28px] font-bold font-display text-foreground">Título</h1>
    <p className="text-sm text-muted-foreground mt-0.5">Subtítulo descriptivo.</p>
  </div>
  <div className="flex gap-2">
    {/* Botones CTA */}
  </div>
</div>
```

---

## 4. Componentes

### 4.1 KPI Card (Métrica)

```
┌──────────────────────────┐
│ LABEL UPPERCASE  12px    │
│                          │
│  1,284          bold 36px│
│                          │
│ ↑ +12% este mes  muted   │
│ [progress bar opcional]  │
└──────────────────────────┘
```

- Fondo: `bg-white`, `rounded-xl`, `shadow-sm`, `border border-border/50`
- Padding: `p-5`
- Label: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`
- Número: `text-4xl font-bold font-display` — color default o `text-primary` para highlight
- Número urgente/crítico: `text-destructive`
- Subtexto: `text-xs text-muted-foreground mt-1`
- Grid de 4 en desktop, 2 en tablet: `grid grid-cols-2 lg:grid-cols-4 gap-4`

### 4.2 Status Badge

Pill redondeada con dot de color:

```tsx
// Variantes
aprobada      → bg-green-100   text-green-800   dot bg-green-500
activo        → bg-green-100   text-green-800   dot bg-green-500
en_comite     → bg-amber-100   text-amber-800   dot bg-amber-500
pendiente     → bg-yellow-100  text-yellow-800  dot bg-yellow-500
pre_factibil  → bg-blue-100    text-blue-800    dot bg-blue-400
en_bodega     → bg-slate-100   text-slate-700   dot bg-slate-400
rechazada     → bg-red-100     text-red-800     dot bg-red-500
suspendido    → bg-red-100     text-red-800     dot bg-red-500  (filled/solid)
critico       → bg-red-500     text-white       icon ▲
```

```tsx
<span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
  Aprobada
</span>
```

### 4.3 Tabla de datos

- Contenedor: `bg-white rounded-xl border border-border/50 overflow-hidden`
- Headers: `bg-muted/40 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-4 py-3`
- Filas: `border-b border-border/50 hover:bg-muted/30 transition-colors`
- Celdas: `px-4 py-3.5 text-sm`
- IDs/links: `text-[#007BFF] font-medium hover:underline cursor-pointer`
- Avatar initials: círculo 32px, bg generado por nombre, texto blanco 12px bold
- Menú acciones: `⋮` botón `ghost` abre `DropdownMenu`

### 4.4 Botones

| Variante   | Apariencia                                                    | Uso                          |
|------------|---------------------------------------------------------------|------------------------------|
| Primary    | `bg-[#007BFF] text-white rounded-lg px-4 py-2 font-medium`   | CTA principal (Nueva ruta, Alta) |
| Secondary  | `bg-white border border-border text-foreground rounded-lg`   | Acciones secundarias          |
| Inverted   | `bg-foreground text-background rounded-lg`                   | Contextos especiales          |
| Outlined   | `border border-[#007BFF] text-[#007BFF] rounded-lg`          | Alternativa a primary         |
| Ghost      | sin fondo, hover suave                                       | Iconos, menús                 |
| Destructive| `bg-red-50 text-red-700 border border-red-200`               | Desactivar, eliminar           |

Todos los botones CTA llevan icono a la izquierda cuando tienen acción creativa:
```tsx
<Button className="bg-[#007BFF] hover:bg-blue-600">
  <Plus className="w-4 h-4 mr-1.5" /> Nueva ruta
</Button>
```

### 4.5 Toolbar de filtros

```tsx
<div className="flex items-center gap-2 mb-4">
  <Button variant="outline" size="sm">
    <SlidersHorizontal className="w-4 h-4 mr-1.5" /> Filtrar
  </Button>
  <Button variant="ghost" size="sm">Exportar CSV</Button>
  {/* Dropdowns de zona, estado */}
  <div className="ml-auto text-xs text-muted-foreground">
    MOSTRANDO 1–10 DE 124
  </div>
</div>
```

### 4.6 Breadcrumb

```tsx
<nav className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
  <span>Infraestructura</span>
  <ChevronRight className="w-3 h-3" />
  <span className="text-foreground font-semibold">Inventario de Medidores</span>
</nav>
```

### 4.7 Info / Insight Card (fondo azul)

Card al pie de sección con fondo degradado para llamadas a la acción secundarias:

```tsx
<div className="rounded-xl bg-gradient-to-br from-[#003366]/80 to-[#007BFF]/60 p-5 text-white">
  <div className="flex gap-3 items-start">
    <div className="p-2 bg-white/10 rounded-lg">
      <BarChart2 className="w-5 h-5" />
    </div>
    <div>
      <h3 className="font-semibold text-sm">Título insight</h3>
      <p className="text-xs text-white/70 mt-1">Descripción.</p>
      <button className="mt-2 text-xs font-semibold underline-offset-2 hover:underline">
        VER REPORTE COMPLETO →
      </button>
    </div>
  </div>
</div>
```

### 4.8 Tabs de sección

```tsx
<div className="inline-flex bg-muted rounded-lg p-0.5 mb-4">
  <button className="px-4 py-1.5 rounded-md text-sm font-medium bg-white shadow-sm">
    Asignados
  </button>
  <button className="px-4 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground">
    En bodega
  </button>
</div>
```

### 4.9 Sidebar Navigation

```tsx
// Grupo
<div>
  <p className="text-[10px] font-semibold uppercase tracking-widest text-white/30 px-3 mb-1">
    Principal
  </p>
  <NavItem icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
  <NavItem icon={Home} label="Infrastructure" to="/infra" active />
</div>

// Item activo
<a className="flex items-center gap-2.5 px-3 py-2 rounded-md bg-white/12 text-white text-sm font-medium">
  <Icon className="w-4 h-4" /> INFRASTRUCTURE
</a>

// Item inactivo
<a className="flex items-center gap-2.5 px-3 py-2 rounded-md text-white/55 hover:bg-white/8 hover:text-white text-sm">
  <Icon className="w-4 h-4" /> SERVICES
</a>
```

---

## 5. Iconografía

- Librería: **Lucide React** (ya instalada)
- Tamaño estándar: `w-4 h-4` en botones/tabla, `w-5 h-5` en nav, `w-6 h-6` en cards destacadas
- Nunca usar emojis como iconos — siempre Lucide
- Iconos de alerta: `AlertTriangle` (crítico), `Info` (informativo), `CheckCircle` (éxito)

---

## 6. Espaciado y Radios

| Token       | Valor   | Uso                          |
|-------------|---------|------------------------------|
| `rounded-sm`| 4px     | badges, inputs pequeños      |
| `rounded-md`| 6px     | botones                      |
| `rounded-lg`| 8px     | cards, dropdowns             |
| `rounded-xl`| 12px    | cards principales, tablas    |
| `rounded-full`| 999px | pills de status, avatars     |

Padding de cards: `p-5` (20px). Gap entre cards: `gap-4` (16px).

---

## 7. Sombras

```css
shadow-sm  → box-shadow: 0 1px 2px rgba(0,0,0,0.05)      /* cards normales */
shadow-md  → box-shadow: 0 4px 6px rgba(0,0,0,0.07)      /* dropdowns, popovers */
shadow-lg  → box-shadow: 0 10px 15px rgba(0,0,0,0.08)    /* modales */
```

---

## 8. Patrones de pantalla

### Pantalla de lista (catálogos, inventarios)
1. Page Header (título + subtítulo + botón CTA)
2. Grid 4 KPI cards
3. Toolbar (filtrar + exportar + contador)
4. Tabla con paginación
5. [Opcional] 2 insight cards al fondo

### Pantalla de detalle / flujo operativo
1. Breadcrumb + Page Header
2. Layout 2 columnas: formulario principal (izq) + panel de contexto (der)
3. Tabs si hay múltiples vistas (Captura / Validaciones / Historial)

### Pantalla tipo kanban / mapa (rutas)
1. Page Header + botón CTA
2. Layout 3 columnas: lista de items sin asignar (izq) + cards principales (centro/der)
3. Cards con imagen/mapa como header, info abajo

---

## 9. Reglas generales

1. **Sin bordes decorativos gruesos** — separación por espacio y sombra, no por border
2. **Fondo de página siempre `#F8FAFC`** — nunca blanco puro ni gris oscuro en modo light
3. **Cards siempre blancas** con `border border-border/50` y `shadow-sm`
4. **Números de KPI en Manrope bold** — nunca en Inter para métricas grandes
5. **CTA principal siempre `#007BFF`**, nunca reutilizar el azul oscuro primary del sidebar como botón
6. **Status badges siempre pill** (`rounded-full`) — nunca cuadrado
7. **Tablas sin zebra striping** — solo hover highlight suave
8. **Paginación**: página activa con `bg-[#007BFF] text-white rounded-md`, resto ghost
9. **Google Fonts**: cargar Manrope (600,700) e Inter (400,500,600) en el `<head>`
10. **No usar `text-black`** — usar `text-foreground` o `text-slate-900` para máxima legibilidad

---

## 10. Tokens CSS (`index.css`)

Los siguientes valores reemplazan los actuales para alinear Tailwind con la paleta Stitch:

```css
:root {
  /* Brand */
  --primary:             211 100% 20%;   /* #003366 */
  --primary-foreground:  0 0% 100%;

  --secondary:           207 24% 38%;    /* #4A6278 */
  --secondary-foreground: 0 0% 100%;

  /* Tertiary como accent/CTA */
  --accent:              211 100% 50%;   /* #007BFF */
  --accent-foreground:   0 0% 100%;

  /* Fondo neutro */
  --background:          210 40% 98%;   /* #F8FAFC */
  --foreground:          215 28% 17%;   /* texto oscuro */

  /* Sidebar */
  --sidebar-background:  215 50% 12%;   /* #0d1b2e */
  --sidebar-foreground:  210 15% 85%;
  --sidebar-primary:     211 100% 50%;  /* tertiary en sidebar */
  --sidebar-accent:      215 45% 18%;
  --sidebar-accent-foreground: 0 0% 100%;
}
```

---

*Última actualización: 2026-04-08. Cualquier cambio al sistema de diseño debe actualizarse en este documento antes de implementarse.*
