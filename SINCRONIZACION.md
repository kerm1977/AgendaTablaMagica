# AgendaTribu — Sistema de Sincronización Global

Documento maestro. Todo lo construido para sincronizar varios dispositivos
con una base de datos global sobre una PC servidora, desde cualquier lugar
del mundo.

## Arquitectura

```
Teléfonos (app APK / navegador)
        │  HTTPS + WebSocket
        ▼
https://latribu.tailb81e5f.ts.net        ← URL FIJA (Tailscale Funnel)
        │  proxy
        ▼
PC servidora (cualquier computadora)
  node server.js → localhost:8780 → tribu-sync.db (SQLite)
```

- El teléfono NO necesita USB ni la misma red WiFi — todo va por internet.
- `latribu.top` (la web del café) NO se toca — esto es independiente.

## URL fija — Tailscale Funnel

- URL permanente: **https://latribu.tailb81e5f.ts.net**
- La primera parte (`latribu`) = **nombre de la máquina** en Tailscale.
- La segunda (`tailb81e5f.ts.net`) = **la tailnet** (cuenta kenth1977@gmail.com).
- Si el servidor se mueve a otra PC, el funnel de esa PC da una URL con SU
  nombre de máquina (`otrapc.tailb81e5f.ts.net`) — se actualiza en el campo
  "Máquina Tailscale" de la app, sin tocar nada más.
- Comando que activa el funnel (persistente, sobrevive reinicios):
  `tailscale funnel --bg 8780`

## Archivos

| Archivo | Qué es |
|---|---|
| `server/server.js` | El servidor: Express + node:sqlite + WebSocket. Puerto 8780 |
| `server/package.json` | Dependencias: solo `express` + `ws` (SQLite va en Node 24) |
| `server/tribu-sync.db` | La base de datos global (se crea sola) |
| `server/server.bat` | Arranque manual con doble clic |
| `server/instalar-servidor.bat` | Instalador completo para otra PC |
| `vendor/instalar-servidor.bat` | Copia incluida en la app/APK para descargar |
| `js/sync.js` | Cliente de sync dentro de la app |
| `AGENDATRIBU_V1 (1).html` → tarjeta en `view-settings` | Panel "Sincronización Global" |

## Endpoints del servidor

| Endpoint | Método | Función |
|---|---|---|
| `/registro` | POST | Crear usuario `{usuario, clave}` — normaliza a MAYÚSCULAS |
| `/login` | POST | Devuelve token. Usuario y clave se normalizan a uppercase; lookup `COLLATE NOCASE` |
| `/push` | POST | Sube items `{coleccion, items:[{id,ts,data,borrado}]}` — gana el ts mayor por ítem |
| `/pull?desde=ts` | GET | Baja lo cambiado desde un timestamp |
| `/snapshot` | GET | Descarga completa |
| `/ping` | GET | `{ok:true, ahora:ts}` — prueba de vida |
| `/actividad` | GET | Últimos 60 eventos (acción, usuario, detalle, IP) |
| `/server.js` `/package.json` | GET | Sirven el código para el instalador |
| `/instalar-servidor.bat` | GET | Genera el .bat instalador al vuelo |
| `/ws?token=…` | WebSocket | Canal en vivo — avisa cuando otro dispositivo cambia datos |
| `/` | GET | Página de estado + botón de descarga + consola de actividad |

Auth: todo (salvo `/`, `/ping`, `/registro`, `/login`, `/server.js`,
`/package.json`, `/instalar-servidor.bat`) exige header `x-token`.
CORS habilitado (`Access-Control-Allow-Origin: *` + OPTIONS) — imprescindible
para que el WebView/navegador no bloquee los fetch.

## Tablas de la DB (tribu-sync.db)

- `usuarios(usuario, hash, salt, creado)` — hash = scrypt(clave, salt)
- `tokens(token, usuario, creado)` — sesiones
- `items(coleccion, id, data, ts, borrado, autor)` — datos + quién los hizo
- `actividad(id, ts, accion, usuario, detalle, ip)` — consola (máx. 200)

## Usuarios

| Usuario | Contraseña |
|---|---|
| KENNETH RUIZ | *(clave)* |
| JENNY CECILIANO | *(clave — configurar en el servidor)* |

**REGLA: TODO EN MAYÚSCULAS.** La app y el servidor fuerzan usuario y clave a
uppercase, así que escribir `kenneth`, `Kenneth` o `KENNETH` da igual.
Más usuarios: botón **Registrar** en la app, o `POST /registro`.

## La app — tarjeta "Sincronización Global" (Ajustes)

Colapsada por defecto; tocar el título la expande.

- **Máquina Tailscale**: `latribu` por defecto — nombre de la PC servidora
- **Tailnet**: `tailb81e5f.ts.net` — la cuenta Tailscale
- **Servidor**: URL compuesta `https://{máquina}.{tailnet}` automática
- **Usuario / Contraseña**: en mayúsculas; **se recuerdan** (localStorage)
  — no hay que escribirlas de nuevo salvo reinstalación
- **Conectar / Registrar / 📡 Probar / Desconectar**
- **Descargar instalador de servidor**: baja `instalar-servidor.bat` (o lo
  comparte por WhatsApp desde el teléfono) para montar el server en otra PC
- **Consola de conectividad** (caja negra): log en vivo de cada acción —
  cargas, logins, push/pull por colección, WebSocket, errores JS

## Colecciones sincronizadas

`caminatas · directorioPersonas · personasGlobales · notas · preciosBuseta ·
historialRetiros · historialAsistencia`

- Push: tras cada `saveData()` (debounce 1.5 s) — estampa `_por` (autor) en cada ítem
- Pull: al recibir aviso por WebSocket — merge por `id`, gana el `ts` mayor
- El autor se muestra en tarjetas de caminatas (`👤 usuario`) y notas

## Instalar el servidor en OTRA computadora

1. Copiar `server/` entera, o descargar `instalar-servidor.bat` desde la app
   o desde https://latribu.tailb81e5f.ts.net (botón naranja)
2. En esa PC: instalar **Node.js** + **Tailscale** (login kenth1977@gmail.com)
3. Doble clic a `instalar-servidor.bat` → descarga server.js, instala deps,
   activa funnel, crea autoarranque y levanta el servidor
4. En la app: poner el nombre de ESA máquina en "Máquina Tailscale"

## Consola de actividad (página del servidor)

`https://latribu.tailb81e5f.ts.net` muestra abajo una consola que se
auto-actualiza cada 3 s con cada registro/login/push/pull/ws:
`hora · ACCIÓN · usuario · detalle+user-agent · IP`

## Límites conocidos

- Last-write-wins **por ítem**: si dos teléfonos editan EL MISMO objeto a la
  vez, gana el más reciente (sin merge interno).
- Si la PC servidora se apaga, el funnel responde HTTP 502 y la app trabaja
  offline normal; al volver, resincroniza.
- La DB y el `.bat` no llevan HTTPS propio — lo da el funnel de Tailscale.
