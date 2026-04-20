# Cursor Agent (CLI) y MCP en este repositorio

Este documento describe cómo lograr **paridad práctica** entre MCP en **Cursor IDE** y **Cursor CLI** (`agent`) al trabajar en la raíz de este proyecto.

## Hecho comprobable en este entorno

- `agent` carga la configuración desde `~/.cursor/mcp.json` y, si existe, `.cursor/mcp.json` en el proyecto (se fusionan; el proyecto tiene prioridad para claves repetidas).
- Con salida no interactiva, el estado típico se obtiene así (PowerShell):

```powershell
$env:CI = "true"
Set-Location C:\Development\contract-to-cash-flow
agent mcp list
```

- En una verificación reciente, la mayoría de servidores aparecieron como `ready`. Los que suelen quedar en `requires_authentication` dependen de **OAuth** (por ejemplo **Notion** y, si lo habilitas, **Linear**).

## Si en la UI del Agent “todos los MCP están en error”

La pantalla interactiva del Agent **no siempre coincide** con el estado real. Hay reportes en el foro de Cursor donde `agent mcp list` (vista “bonita”) marca error, pero `agent mcp list-tools <nombre>` funciona, o donde un fallo agregado de red hace que el listado se vea todo rojo.

**Comprueba el estado real (fuente de verdad) en texto**, desde la raíz del repo:

```powershell
$env:CI = "true"
Set-Location C:\Development\contract-to-cash-flow
agent mcp list
```

En **cmd.exe** (el About del Agent suele mostrar `Shell: cmd`):

```bat
cd /d C:\Development\contract-to-cash-flow
set CI=true
agent mcp list
```

Si aquí ves `ready` en casi todos, los servidores **sí están cargando**; el problema es la **vista del Agent** o un servidor puntual (OAuth / caído), no “que el proyecto no tenga MCP”.

Prueba además un servidor concreto:

```powershell
agent mcp list-tools time
```

### Si en el listado en texto también falla todo

1. **Actualiza el Agent** (corrige regresiones frecuentes): `agent update`, cierra y vuelve a abrir la sesión del Agent.
2. **Sesión de Cursor**: `agent status` / `agent about` y confirma que estás logueado.
3. **Docker Desktop** encendido (muchos de tus MCP usan `docker run`).
4. **Busca el servidor que rompe el lote**: en el foro se describe un comportamiento tipo “todo o nada” cuando hay problemas de red o un MCP mal configurado. Desde `~/.cursor/mcp.json`, desactiva temporalmente mitad de los `"enabled": true` (o comenta entradas con cuidado y JSON válido), vuelve a ejecutar `agent mcp list` con `CI=true`, y **divide por mitades** hasta aislar el servidor que provoca el fallo en cadena.
5. **OAuth**: los que muestran `requires_authentication` no se “arreglan” solos; hay que `agent mcp login notion` (y `linear` si aplica).

### Referencias de la comunidad (mismo síntoma)

- [Errores MCP inexplicables en cursor-agent](https://forum.cursor.com/t/unexplainable-mcp-errors-in-cursor-agent/130710)
- [`cursor-agent mcp list` falla de forma “todo o nada”](https://forum.cursor.com/t/cursor-agent-mcp-list-fails-on-all-or-nothing-basis/142335)

## “Failed to load MCP … has not been approved” (dentro del Agent interactivo)

`agent mcp list` marca `ready` cuando el **servidor puede conectarse**. La **UI del Agent** aplica otra regla: los servidores MCP deben estar **aprobados para cargarse en esa sesión**. Si no, verás errores del estilo:

`Failed to load MCP 'Memory': MCP server "Memory" has not been approved`

### Arreglo inmediato (recomendado)

Arranca el Agent con autoaprobación de servidores MCP:

```powershell
Set-Location C:\Development\contract-to-cash-flow
agent --approve-mcps
```

Eso equivale a la opción documentada en la CLI: **aceptar todos los servidores MCP** al inicio, sin el paso manual en la vista de MCP.

### Alternativa: aprobar servidor por servidor

```powershell
agent mcp enable Memory
agent mcp enable "Sequential Thinking"
# …repite con el nombre exacto de cada entrada en mcp.json
```

Si el comando dice que ya está aprobado pero la UI sigue fallando, suele deberse a **sesión reanudada**, **otro directorio de trabajo** (`--workspace`) o un desajuste de estado; en ese caso **`agent --approve-mcps`** suele ser el atajo fiable.

### Ojo con `approvalMode: "allowlist"` en `~/.cursor/cli-config.json`

Si solo tienes patrones muy restrictivos (por ejemplo solo `Shell(ls)` en `permissions.allow`), el Agent puede pedir aprobación para casi todo lo demás. Eso es **independiente** del mensaje de “servidor no aprobado”, pero afecta a **cuándo puede ejecutar herramientas MCP** después de cargarlas.

Para permitir herramientas MCP bajo allowlist, añade patrones `Mcp(...)` (ver [permisos de la CLI](https://cursor.com/docs/cli/reference/permissions.md)), por ejemplo con cuidado:

```json
"Mcp(*:*)"
```

Evalúa el riesgo antes de usar comodines amplios; en muchos equipos se prefiere listar `Mcp(nombre-servidor:*)` por cada MCP que uses.

## Pasos para que “todo lo que pueda” quede en `ready`

1. **Autenticación OAuth en el CLI** (obligatorio para MCP remotos que usan OAuth y no reutilizan la sesión del IDE en tu máquina):

```powershell
agent mcp login notion
```

Si activas **Linear** en `~/.cursor/mcp.json` (`"enabled": true`), ejecuta también:

```powershell
agent mcp login linear
```

2. **Vuelve a comprobar el estado** con `agent mcp list` (mismo bloque `CI=true` de arriba) hasta que el servidor pase a `ready`.

3. **Modo no interactivo / scripts** (menos fricción con aprobaciones):

```powershell
agent --approve-mcps --print --workspace C:\Development\contract-to-cash-flow -p "tu prompt"
```

4. **Herramientas de un MCP concreto** (diagnóstico rápido):

```powershell
agent mcp list-tools time
```

## Requisitos de entorno (si algo falla solo en CLI)

- **`npx` / Node** en el `PATH` del proceso que lanza `agent` (MCP basados en `npx`).
- **Docker** instalado y accesible en el `PATH` (MCP basados en `docker run`).
- Imágenes locales referenciadas por nombre (por ejemplo builds `*:local`) deben existir en tu Docker.

## Seguridad (recomendado)

- Evita dejar **tokens y API keys en texto plano** en `~/.cursor/mcp.json`. Cursor admite interpolación `${env:NOMBRE}`; define las variables en tu perfil de shell o en un archivo local **no versionado**.
- Si alguna credencial pudo verse fuera de tu control, **rótala** en el proveedor (GitHub, Turso, proveedores de búsqueda, etc.) y actualiza la configuración.

## Límites reales de paridad IDE ↔ CLI

- Los MCP registrados **solo** vía Extension API del IDE (sin entrada equivalente en `mcp.json`) pueden no existir en el host del CLI.
- Algunas extensiones de **UI** de MCP pueden verse reducidas en CLI aunque las herramientas sigan funcionando.

## Referencia oficial

- [MCP en Cursor CLI](https://cursor.com/docs/cli/mcp)
- [Model Context Protocol (MCP) en Cursor](https://cursor.com/docs/mcp)
