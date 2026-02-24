---
name: Mejora UI/UX Atención Clientes
overview: "Plan para mejorar la UI y sobre todo la UX de la información en el Módulo de Atención a Clientes: reducir fragmentación, redundancia y sobrecarga cognitiva, y establecer jerarquía y agrupación clara."
todos: []
isProject: false
---

# Plan: Mejora UI/UX del Módulo de Atención a Clientes

## Problemas actuales (resumidos)

- **Fragmentación**: Bloques "Datos Contrato" y "Datos Facturación" partidos en "(continuación)" sin agrupación lógica; el usuario no sabe por qué están separados.
- **Sobrecarga**: Demasiados campos visibles a la vez en el tab General; difícil saber qué es prioritario.
- **Redundancia**: "Parcialidades Vencidas" y "Saldo a favor" repetidos en header, Deuda en Convenio y Deuda Actual; mismo número en varios sitios.
- **Jerarquía débil**: Todas las tarjetas tienen el mismo peso visual; la deuda y el estado del contrato no destacan.
- **Valores vacíos**: Muchos "—" o vacíos sin criterio (ocultar vs. mostrar "Sin dato").
- **Deuda ilegible**: Tres columnas (Deuda total, Convenio, Deuda actual) con cifras similares ($0.00) y conceptos repetidos; "Meses adeudo" ambiguo.
- **Estados planos**: Solo "Estado Toma" usa `StatusBadge`; "Estado" (ALIA) y otros no tienen indicador visual.

---

## 1. Reorganizar la arquitectura de la información

**Objetivo**: Agrupar por significado, no por "lo que cabía en una columna".

- **Un solo bloque "Datos del contrato"** (una tarjeta o un acordeón):
  - Subsecciones con subtítulos: *Identificación* (Contrato, Contrato SIGE, Administración, Fecha Alta, Tipo Contrato, Estado, Estado Toma, Fecha Baja), *Titular y toma* (Propietario, Domicilio Toma, Tipo de Servicio, No tomas), *Ubicación* (Distrito, Sector, Georeferencia), *Otros* (Categoría, Reparte consumo, Actividad).  
  - Eliminar por completo el título "Datos Contrato (continuación)" y unificar en una sola sección con sub-headings o `<dl>` agrupados.
- **Un solo bloque "Datos de facturación"**:
  - Misma idea: una tarjeta con subsecciones (Tarifa y zona, Opciones de recibo, Fechas y límites) en lugar de "Datos Facturación" + "Datos Facturación (continuación)".
- **Datos Fiscales**: Mantener una tarjeta; ya está en una sola card con 2 columnas; opcionalmente agrupar en *Fiscal* (RFC, Régimen, Uso CFDI, Domicilio fiscal) y *Contacto* (Nombre, Domicilio, Correo, Teléfono) con subtítulos dentro de la card.

**Archivo**: [src/pages/AtencionClientes.tsx](src/pages/AtencionClientes.tsx) (aprox. líneas 333–413).

---

## 2. Jerarquía visual: resumen arriba, detalle abajo

**Objetivo**: Que en 3 segundos se vea "contrato, titular, estado y si hay deuda".

- **Fila de resumen bajo la búsqueda** (solo cuando hay contrato seleccionado):
  - Una barra o card compacta con: **Contrato** · **Titular** (nombre) · **Estado** (badge: Activo/Inactivo según Estado Toma) · **Deuda actual** (un solo número) y, si `parcialidadesVencidas > 0`, **Parcialidades vencidas** con estilo de alerta (ej. `text-destructive` o `Alert`).
- **Parcialidades vencidas**: Mostrarlas **una sola vez** en ese resumen (o en un `Alert` justo debajo del resumen). Quitarlas del header derecho y del desglose de Deuda mostrarlas solo una vez en la sección de deuda (en "Deuda Actual" o en un único bloque "Resumen de deuda").
- **Tab General**: Orden sugerido: (1) Resumen contrato + alerta deuda si aplica, (2) Datos del contrato (unificado), (3) Datos Fiscales, (4) Datos de facturación (unificado), (5) Datos Medidores, (6) Datos de Deuda (simplificado).

---

## 3. Simplificar la sección "Datos de Deuda"

**Objetivo**: Un número claro (deuda actual) y un desglose opcional, sin repetir los mismos conceptos.

- **Bloque único "Resumen de deuda"** con:
  - Línea principal: **Deuda actual** (valor que ya se calcula) y, si hay, **Parcialidades vencidas** (una vez) y **Saldo a favor** (una vez).
  - Opción A: Un solo panel con estos 3 conceptos + "Meses en adeudo" (aclarar etiqueta: "Meses en adeudo" o "Meses de atraso") y "Bloqueo de cobro" / "Abogado externo" en una línea secundaria.
  - Opción B: Mantener tres columnas pero **eliminar duplicados**: en "Deuda en Convenio" no repetir Parcialidades vencidas si ya está arriba; en "Deuda Actual" dejar solo Deuda + Saldo a favor y referenciar "Parcialidades vencidas" con un enlace o nota "ver resumen arriba" o no repetir el monto.
- **Etiqueta**: Cambiar "Meses adeudo" por "Meses en adeudo" o "Meses de atraso" y documentar significado de "D" si es código interno (o sustituir por número/leyenda legible).

**Archivo**: [src/pages/AtencionClientes.tsx](src/pages/AtencionClientes.tsx) (aprox. 447–486).

---

## 4. Progressive disclosure para bloques secundarios

**Objetivo**: Reducir ruido en la primera mirada sin perder información.

- Usar **Accordion** (ya existe [src/components/ui/accordion.tsx](src/components/ui/accordion.tsx)) para:
  - **Datos Fiscales** (opcional): acordeón cerrado por defecto; título "Datos Fiscales" con indicador de que hay RFC/Nombre.
  - **Datos de facturación** (opcional): acordeón cerrado por defecto; los datos de contrato, medidores y deuda quedan siempre visibles.
- Alternativa más ligera: mantener todo en tarjetas pero **colapsar filas vacías** en bloques opcionales: si todos los campos de "Código recorrido", "Importe límite", "Desde", "Hasta", "Fecha de Inicio", "Fecha de fin" están vacíos, mostrar una sola línea "Opciones de facturación: sin datos" o no mostrar ese sub-bloque.

---

## 5. Tratamiento de valores vacíos y estados

**Objetivo**: Consistencia y menos ruido.

- **Valor por defecto**: Unificar: si no hay valor, mostrar "—" vía el componente `Row` (ya se usa en parte). Asegurar que `value=""` no deje la etiqueta huérfana; en `Row`, si `value` es `undefined` o `""`, renderizar `"—"`.
- **Estados con badge**: Usar `StatusBadge` (o un variant) para cualquier campo tipo estado: "Estado Toma", "Estado" (ALIA), "Estado" en medidores. Definir mapeo corto (ej. Activo → success, Baja → destructive, ALIA → info) para no inventar muchos colores.
- **Opcional**: Ocultar filas opcionales cuando el valor está vacío en bloques muy largos (ej. Categoría, Actividad, Reparte consumo), o agruparlas en "Otros" colapsable.

---

## 6. Ajustes de estilo y accesibilidad

**Objetivo**: Mejor escaneo sin cambiar el diseño global.

- **Subtítulos dentro de cards**: Clase para sub-headings (ej. `.section-subtitle`: `text-sm font-medium text-muted-foreground mt-3 mb-1`) para Identificación, Ubicación, etc., dentro de "Datos del contrato" y "Datos de facturación".
- **Resumen de contrato**: Usar `Card` o barra con `bg-muted/50` y tipografía un poco más grande para Contrato + Titular + Estado + Deuda.
- **Parcialidades vencidas**: Si se muestran en resumen, usar `Alert` con `variant="destructive"` o `variant="default"` y borde/icono de advertencia para que destaquen.
- **Tab General**: Revisar contraste de etiquetas (`.section-title` y labels de `Row`) y que los focus sean visibles en búsqueda y pestañas (ya usan componentes shadcn).

---

## 7. Recomendaciones UI/UX Pro Max

Aplicar las prioridades y reglas del skill **ui-ux-pro-max** al módulo:

**Accesibilidad (CRÍTICO)**

- Contraste mínimo 4.5:1 en texto normal; etiquetas y valores en `.section-title` / `Row` con `text-foreground` o `text-muted-foreground` (slate-600 mínimo para muted).
- Botones solo icono: `aria-label` en Buscar, "+", Consulta Sige (revisar que los `Button` con solo ícono lo tengan).
- Focus visible: no usar `outline-none` sin reemplazo; asegurar `focus-visible:ring-*` en Input, TabsTrigger, Button (shadcn ya lo aplica; verificar en custom controls).
- Navegación por teclado: orden de tab lógico (búsqueda → Buscar → pestañas → contenido).

**Touch e interacción (CRÍTICO)**

- Áreas de toque mínimas 44×44px en Botones e ítems de pestaña.
- Elementos clickeables: `cursor-pointer` en TabsTrigger, botones, y cualquier card/fila interactiva.
- Transiciones: `transition-colors duration-200` o 150–300ms en hover/focus; evitar `transition: all` y animaciones que muevan layout (scale estable).

**Layout y responsive (ALTO)**

- Probar en 375px, 768px, 1024px, 1440px; sin scroll horizontal en móvil; contenido con `min-w-0` donde haya flex y texto largo para permitir truncado.
- Tablas (Facturas, Lecturas, Medidores, etc.): en móvil considerar `overflow-x-auto` con `min-w-0` en contenedor; o alternativa accesible (lista/stack).

**Tipografía y color (MEDIO)**

- Line-height 1.5–1.75 en bloques de texto; longitud de línea controlada en cards (max-width o grid).
- Números alineados: `font-variant-numeric: tabular-nums` o `tabular-nums` en columnas de importes y fechas (tablas y resumen de deuda).
- Iconos: solo SVG (Lucide ya en uso); tamaños consistentes (p. ej. `h-4 w-4` en botones).

**Animación (MEDIO)**

- Respetar `prefers-reduced-motion`: si hay animaciones (acordeón, alertas), ofrecer variante reducida o `duration-0`.
- Animar solo `transform` y `opacity`; evitar animar width/height para no provocar reflow.

**Reglas profesionales (ui-ux-pro-max)**

- Hover en cards: cambio de color/sombra, sin scale que desplace contenido.
- Colores del tema: usar clases `bg-primary`, `text-destructive`, etc., no valores hex sueltos para mantener dark mode.
- Checklist pre-entrega: sin emojis como iconos, contraste suficiente, focus visible, responsive y `prefers-reduced-motion` respetado.

---

## 8. Web Interface Guidelines (Vercel)

Alinear con las reglas de [web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines):

**Accesibilidad**

- Botones solo icono: `aria-label` descriptivo (p. ej. "Buscar contrato", "Nuevo trámite", "Consulta Sige").
- Controles de formulario: el input de contrato debe tener `<label>` asociado (`htmlFor`/`id`) o `aria-label`.
- Navegación: usar `<button>` para acciones y `<a>` para navegación; no `<div>`/`<span>` con onClick para ir a otra ruta.
- Encabezados: jerarquía h1 → h2 → h3 (page-title, section-title, section-subtitle); considerar skip link al contenido principal si la página crece.
- Actualizaciones asíncronas (toast, validación de búsqueda): `aria-live="polite"` donde aplique.

**Focus**

- Focus visible en todos los interactivos: `focus-visible:ring-*`; nunca `outline: none` sin reemplazo.
- Preferir `:focus-visible` sobre `:focus` para no mostrar anillo en click con ratón.

**Formularios (búsqueda)**

- Input contrato: `autocomplete`, `name` significativo; tipo adecuado (text); si es código, `spellCheck={false}`.
- Placeholder con patrón de ejemplo y terminar en "…" si es truncado (ej. "Ej. CT001…").
- Botón Buscar: mantener habilitado hasta que arranque la petición; mostrar estado de carga (spinner o "Buscando…") durante la búsqueda si es asíncrona.

**Tipografía y contenido**

- Usar "…" (ellipsis Unicode) en lugar de "..." en estados de carga o placeholders.
- Números y moneda: ya se usa `Intl.NumberFormat` en `formatCurrency`; fechas con `Intl.DateTimeFormat` si se muestran fechas formateadas.
- Contenedores de texto largo: `truncate`, `line-clamp-*` o `break-words` en celdas de tabla y valores largos (nombre, dirección); flex children con `min-w-0`.
- Empty states: no mostrar UI rota para array vacío (ej. "Sin medidor asignado" ya está; revisar Facturas/Lecturas/Pagos vacíos).

**Animación**

- Respetar `prefers-reduced-motion`; listar propiedades en `transition` (no `transition: all`).
- Origen de transform correcto en iconos (chevron de acordeón, etc.).

**Touch**

- `touch-action: manipulation` en botones/links para evitar retardo de doble tap.
- Modales/Sheets: `overscroll-behavior: contain` para no arrastrar el fondo.

**Anti-patrones a evitar**

- No `user-scalable=no` en viewport.
- No `onPaste` con `preventDefault`.
- No `transition: all`.
- No `outline-none` sin anillo focus-visible.
- No `<div>` con onClick para navegación; usar `<a>` o router.
- Imágenes (si se añaden): siempre `width`/`height` para evitar CLS.
- Tablas con muchos filas (>50): valorar virtualización o paginación.

---

## Orden de implementación sugerido

1. **Unificar "Datos Contrato" y "Datos Facturación"** en un solo bloque cada uno con subsecciones (sin "(continuación)").
2. **Añadir resumen bajo búsqueda** (contrato, titular, estado, deuda actual, parcialidades una vez) y retirar duplicados del header y de la sección de deuda.
3. **Simplificar "Datos de Deuda"**: un resumen claro, eliminar repeticiones, aclarar "Meses adeudo".
4. **Valores vacíos en `Row`** y **StatusBadge** en todos los campos de estado.
5. **Opcional**: Accordion para Fiscales/Facturación o colapsar filas vacías; subtítulos y Alert de parcialidades.
6. **Validación**: Aplicar checklist UI/UX Pro Max y Web Interface Guidelines (aria-labels, focus, formularios, empty states, tipografía, animación).

---

## Validación post-implementación

Revisar [AtencionClientes.tsx](src/pages/AtencionClientes.tsx) (y componentes que se extraigan) con:

**UI/UX Pro Max**: contraste 4.5:1, iconos SVG/Lucide, `cursor-pointer` en clickeables, hover sin layout shift, transiciones 150–300ms, responsive 375–1440px, `prefers-reduced-motion`, labels en inputs, focus visible.

**Web Interface Guidelines**: formato `file:line` — comprobar aria-label en icon buttons, label/aria-label en input Contrato, focus-visible en controles, "…" en placeholders/loading, `Intl` para fechas/números, empty states, no anti-patrones (no `transition: all`, no outline-none sin reemplazo).

---

## Resumen de archivos a tocar


| Área        | Archivo                                                | Cambios                                                               |
| ----------- | ------------------------------------------------------ | --------------------------------------------------------------------- |
| General tab | [AtencionClientes.tsx](src/pages/AtencionClientes.tsx) | Resumen, unificación de bloques, Deuda, Row vacíos, badges            |
| Estilos     | [index.css](src/index.css)                             | Opcional: `.section-subtitle` si no se usa solo Tailwind              |
| Componente  | [StatusBadge](src/components/StatusBadge.tsx)          | Añadir variantes/mapeo para "Estado" (ALIA) y similares si hace falta |


No se requieren cambios de datos ni de rutas; solo estructura de JSX, orden de secciones, y reutilización de Accordion y Alert.