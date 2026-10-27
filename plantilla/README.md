# PLANTILLA TRIBU — Esqueleto de app con conectividad blindada

> **Para el agente IA que trabaje con esto:** lee TODO este archivo primero.
> La conectividad es **SAGRADA** — no modifiques `js/sync.js` salvo que el
> usuario lo pida explícitamente. Está completa, probada y no necesita nada
> más. Tu trabajo es construir la app ENCIMA usando la API descrita abajo.

## Qué contiene

```
plantilla/
├── index.html      ← página mínima: tarjeta de sync + consola en vivo
├── css/tema.css    ← variables de color (modificables a gusto)
├── js/sync.js      ← CONECTIVIDAD COMPLETA — no tocar
└── README.md       ← este archivo
```

## Arquitectura de conectividad (ya resuelta)

- **Servidor A — Tailscale**: PC con `server.js` → `https://{máquina}.{tailnet}`
- **Servidor B — Nube**: `wsgi_app.py` en cualquier PythonAnywhere
- **Failover automático**: el preferido falla 2 veces → cambia al otro →
  cuando vuelve, regresa solo. El usuario elige el preferido con un radio.
- **Token por servidor**: cada base mantiene su sesión; re-login en 401
- **Watchdog cada 30s**: auto-reconecta si se pierde sesión; cola de
  reintentos de push — nada se pierde
- **WebSocket + polling 60s**: cambios en vivo + respaldo por intervalo
- **Credenciales MAYÚSCULAS**: usuario y clave se fuerzan a uppercase
- **Recordar contraseña**: queda guardada en el dispositivo
- **Aislamiento por app**: cada instalación genera `tribu_app_id` único
  (ver `SYNC_APP_ID`) → cabecera `x-app` → el servidor crea
  `tribu_<tu-id>.db` separada — **ninguna app toca la .db de otra**

## ÚNICA línea a cambiar para tu app

En `js/sync.js` — la constante al inicio:

```js
const SYNC_APP_NOMBRE = 'mi-nueva-app';   // ← el nombre de TU aplicación
```

Eso genera tu ID único → tu propia base → tu propia comunicación.

## API de datos (para TU app)

```js
// Guardar/actualizar un item — persiste local + empuja al servidor
tribuGuardar('micoleccion', {id: 'abc', nombre: 'X'});

// Borrar (propaga el borrado a todos los dispositivos)
tribuBorrar('micoleccion', 'abc');

// Leer
const lista = loadColeccion('micoleccion');

// Repintar la UI cuando lleguen cambios remotos — definila vos:
function onSyncCambio() { /* redibujá tu app */ }

// Agregá tus colecciones en SYNC_COLLECTIONS (línea ~14 de sync.js):
const SYNC_COLLECTIONS = ['micoleccion', 'otra', 'config'];
```

Cada item lleva `{id: 'unico'}` + campos libres. El sync añade `_ts`
(timestamp) y `_por` (qué usuario lo tocó) automáticamente.

## Endpoints del servidor (protocolo ya implementado)

`/registro` `/login` `/push` `/pull?desde=` `/snapshot` `/ping`
`/actividad` `/conexion.txt` `/ws` — auth por header `x-token`,
app-id por header `x-app`, CORS abierto.

## Flujo del usuario

1. Expande "Sincronización Global"
2. A (Tailscale PC) o B (Nube) como preferido
3. Usuario + contraseña → Registrar (una vez) → Conectar
4. La consola muestra todo: login, push/pull, WS, failover, watchdog

## Qué YA NO necesitás construir

- Nada de conectividad, auth, failover, reintentos, reconexión,
  persistencia local, ni consola de debug — todo está hecho.
