# REGLAS DEL PROYECTO — Agenda Tribu

## 📜 PROTOCOLO DE MODIFICACIÓN (ley suprema)

1. ANTES de tocar cualquier archivo, leer estas reglas completas.
2. Si el usuario pide modificar algo listado como BLINDADO → pedir
   autorización explícita ANTES de editar — nunca asumir permiso.
3. Solo se modifica un archivo blindado cuando el usuario lo ordena
   en palabras concretas, y solo la parte ordenada.
4. Todo lo demás puede trabajarse con autonomía normal.

## Inventario de blindados (resumen — detalles abajo)

- `divisas.html` · `TABLAMÁGICA_V1.html` · `tablamagica.html` · `js/tablamagica/*`
- `js/update.js` + manifest sin REQUEST_INSTALL_PACKAGES + TribuUpdateBridge + tarjeta de actualización
- Buscador de caminantes (autocompletado + multi-select) en `js/listas/caminata-fechas.js` y `js/listas/caminante-modal.js`
- Chat/compartir/consola (sección propia abajo)
- Parámetros de la agenda: calendario, header, navigate, barra, facturas, guardar caminata, persistencia


## ⛔ ARCHIVOS BLINDADOS — PROHIBIDO MODIFICAR

**Orden explícita y directa del usuario (permanente):**

- `divisas.html` — NUNCA tocar. Ni un punto, ni una letra. Cero modificaciones.
- `TABLAMÁGICA_V1.html` y `tablamagica.html` — quedan EXACTAMENTE como están. Prohibido tocarlos.
- `js/tablamagica/*` (app.js, fxdata.js, fxnet.js, fx.js) — todo lo que pertenece a Tabla Mágica está blindado. Nunca más.

**Excepción ya aplicada por orden explícita:** el título del header pasó de
"Gestión de Pagos JyK" a "Gestión de Pagos" (h4, font-size 1.5rem) — solo ese texto/tamaño.

## ⛔ BLINDADO — BUSCADOR DE CAMINANTES (sagrado, nunca tocar)

- Autocompletado `#cam-usu-nombre` + `#suggestions-list` en
  `js/listas/caminata-fechas.js` — busca en `personasGlobales` +
  `directorioPersonas`, filtra desde la 1ra letra, prioriza los que
  empiezan por el criterio, marca "ya está en la lista" deshabilitado.
- Buscador `#multi-caminantes-buscar` + `renderMultiSelectCaminantes`
  en `js/listas/caminante-modal.js` — mismo comportamiento en el
  multi-select.
- PROHIBIDO modificar cualquiera de los dos sin orden explícita del usuario.

## ⛔ BLINDADO — SISTEMA DE ACTUALIZACIÓN (sagrado, nunca tocar)

- `js/update.js` — sistema completo de actualización (version.json en GitHub,
  DownloadManager del sistema, barra + consola, modal auto/manual/post-update).
  PROHIBIDO modificar sin orden explícita del usuario.
- PROHIBIDO reintroducir `REQUEST_INSTALL_PACKAGES` en el manifest — causa el
  aviso "posiblemente dañina" de Play Protect. La instalación se hace vía
  notificación del sistema del DownloadManager.
- `MainActivity.TribuUpdateBridge` (descargar/progreso via DownloadManager)
  es parte del sistema — no tocar.
- Tarjeta "Actualización de la app" en view-settings — no tocar.

## 🚫 MODO LOCAL PURO (30/oct/2026 — orden del usuario)

- La app NO se conecta a Tailscale ni PythonAnywhere. Todo queda local:
  localForage + IndexedDB + espejo SQLite (TribuDB). No hay push/pull ni WS.
- sync.js fue RETIRADO del HTML junto con la tarjeta Sincronización Global,
  el 💬 chat, el panel, la consola y todos los iconos 🔗 de compartir.
- Motivo: la sincronización sobreescribía datos entre dispositivos
  (notas borradas reaparecían, datos de un teléfono pisaban los de otro).
- RESPALDO COMPLETO de la infraestructura: `respaldo-sincronizacion.zip`
  (+ carpeta `respaldo-sincronizacion/` con LEEME-RESPALDO-SYNC.txt que
  documenta URLs, máquina, tailnet, puerto, colecciones y cómo restaurar).
- No reintroducir conectividad sin orden explícita del usuario.

## ⛔ BLINDADO — CHAT + CONECTIVIDAD + COMPARTIR (preservado en respaldo, no activo)

- Botón 💬 (`<i class="fas fa-comment-dots">` flotante abajo-izquierda + `#chat-badge`), panel `#chat-panel` pantalla completa, `chatTransmitir`/`enviarChat`/`adjuntarChat`/`borrarMensaje`/`renderChat`/`toggleChat`/`renderConectados`/`vaciarChat` (solo local+tombstones, sin wipe broadcast — NUNCA autoborrado), `syncUsuarios` presencia, `chatMensajes` colección 'chat' — entrega WS directa. NUNCA modificar.
- Compartir al chat: `compartirTextoAlChat`/`compartirImagenAlChat`/`compartirNotaAlChat`/`compartirContactoAlChat`/`compartirCaminataAlChat`/`compartirEventoAlChat`/`compartirCalendarioAlChat`/`compartirEventosTMAlChat` + iconos 🔗 en notas/contactos/caminatas/calendario. NUNCA modificar.
- Consola de eventos `verConsolaChat` + `compartirLogSync` (WhatsApp). Firma universal `creadoPor`/`creada`/`modificadoPor`/`modificado` en todos los items sincronizados. Admin usuarios `syncListaUsuarios`/`syncAgregarUsuario`/`syncBloquear`/`syncEliminarUsuario`. NUNCA modificar.
- `plantilla-tribu.zip` contiene el sync.js endurecido completo (982+ líneas) — regenerado 27/10/2026. NUNCA regresar a una versión anterior.
- PROHIBIDO: wipe/borrado automático del chat o colecciones por broadcast; solo borrado local explícito + tombstones por item.

## Parámetros blindados de la agenda (no modificar)

- **Calendario** (`js/calendario.js` + `view-calendario` + `modalCalendario`):
  - Tocar día vacío → abre modal "Agregar al Calendario" con `calendario-fecha` **disabled** (fecha fijada por el día tocado).
  - Tocar día con eventos → abre detalle del día (ver/editar/agregar).
  - Fechas SIEMPRE en hora de Costa Rica (`hoyStrCR()` → `America/Costa_Rica`). Nunca `toISOString()` para fechas.
  - Grid con flexbox (`flex: 1 1 calc(100%/7 - 4px)`, `min-width:0`, `overflow:hidden`) — no volver a grid.
  - Botón superior "Compartir mes por WhatsApp" (`exportarMesCalendarioWhatsApp`) es el ÚNICO compartir.
  - ORDEN POSTERIOR DEL USUARIO (reintegración de FABs): el "+" flotante `.fab-cal` → `abrirModalCalendarioDesdeFAB()` SÍ aparece en calendario.
- **Header**: `nav-settings` es el ícono ⚙ arriba (no existe en barra inferior). `toggleAjustes()`: settings → home → settings (toggle).
- **navigate()** es defensivo: destinos inexistentes NO dejan la pantalla en blanco (`tablamagica`/`caminatas`/`feriados` redirigen a `abrirTablaMagica`/`abrirCaminatas`).
- **Barra inferior**: Listas · Directorio · Tabla Mágica · Notas · Calendario (sin Ajustes, sin Días Festivos, sin Buseta — retirado por orden del usuario; los campos de datos precioBuseta/cantidadBuses/usarBuseta se conservan para compatibilidad).
- **Días Festivos** se abre desde el botón 🚩 dentro de la vista calendario (`abrirCaminatas()`).
- **Facturas**: cada línea del historial de pagos muestra el símbolo de la moneda PAGADA (`$`/`₡` por `item.monedaPago`) + `USD x × sym TC`.
- **`saveCaminataHeader`**: botón dice "Guardar Caminata" y al guardar vuelve a `navigate('home')` siempre.
- Persistencia calendario: `app_calendario_caminatas` + `app_dias_festivos` (localforage, espejo SQLite, respaldos).

## Estructura

- App principal: `AGENDATRIBU_V1 (1).html`
- `feriados.html` — app Días Festivos (iframe via `vistaCaminatas`)
- `js/` — core? (huérfano), listas/, directorio/, notas/, ajustes/, feriados/, calendario.js, tribu-db.js, respaldos.js
- `respaldos/` — backups (AGENDA original + TABLAMAGICA + respaldos JSON)
- `vendor/` — librerías locales (sin CDNs)
- Servidor: `http://localhost:8765`

## ⛔ BLINDADO ADICIONAL — TABLA MÁGICA (nunca más tocar)

- **Tabla resumen de pagos** (`renderTablaResumenPagos` en js/tablamagica/app.js): columnas Tipo de Gasto | Tipo (P/G, P/P) | Monto | Precio PP. Invisible sin pagos, aparece con el primer item. Monto = valor crudo del campo. Precio PP = Monto ÷ capacidad SG. Sin decimales. NO TOCAR.
- **Fórmula grupal**: `precioGrupal / (capacidadSG || 1)` — solo SG, nunca CG. NO TOCAR.
- **Guardados**: lista plana por provincia con hr, numeracion 1,2,3 reiniciando. SIN borde/cuadro (clase evento-guardado-row plana, no evento-guardado-btn). NO TOCAR.
- **Totales tarjetas**: cada metrica (Total a Recoger, Totales por Persona, Excedente P.P, Excedente General) en su .totcard con su formula chiquita DENTRO (totform). FÓRMULAS SAGRADAS: ExcPP=precioEvento-ΣgrandTotal; ExcGeneral=ExcPP×SG; TotalRecoger=precioEvento×SG. NO TOCAR.
- **Minimizar todos los pagos** (ORDEN POSTERIOR 2026-11-05): el botón `#colapsar-todos-pagos` fue ELIMINADO por orden del usuario para desaturar la recarga gráfica — la función vive ahora en el TÍTULO `Lista de Pagos` (`#titulo-lista-pagos`, flecha ▾/▸). Colapsa todas las tarjetas dejando solo nombre+total. El h3 quedó excluido del colapso genérico de secciones en `initSeccionesColapsables`. NO TOCAR.
- **Colapsables**: secciones colapsan al tocar el h3; EXCEDENTE P.P. y EXCEDENTE GENERAL quedan visibles en Totales colapsado; Excedente visible en Info General colapsada. "Excedente" es el nombre correcto (NO "Ganancia"). NO TOCAR.
- **Botón guardar evento**: flotante cuadrado 56×56 bottom:85px right:20px. NO TOCAR.
- **Swipe**: →izquierda = divisas, izquierda→ = tabla de pagos. NO TOCAR.
- **Colapsar todos los pagos** (ORDEN POSTERIOR): ya no hay botón junto al "+" de Lista de Pagos — la acción está en el propio título (ver entrada anterior). NO TOCAR.
- Todo `divisas.html` y lo ya blindado anteriormente sigue intocable.

## ⛔ APK (app-apk) — BLINDADO
- La app empaqueta a `Desktop\app-apk` (Capacitor, appId com.tribu.tablamagica).
- `www/index.html` = copia de `AGENDATRIBU_V1 (1).html` — reconstruir APK tras
  cambios en la agenda.
- Safe-area Samsung: header/inset-top, bottom-nav/inset-bottom, overlays TM y
  feriados bottom calc(56px+inset), fabs bottom:115px, modal-footer +inset.
- Título header → https://www.latribu.top.

## Respaldos integrales y fuente local (implementación solicitada)
- `obtenerRespaldoCompleto()` es asíncrona. Sus consumidores deben usar `await`.
- `js/respaldos.js` captura el estado principal y las bases IndexedDB `PagosAppDB` (todos sus stores) y `tribuLibresDb`, además de preferencias, divisas y borradores de la aplicación. No exporta permisos de carpeta ni datos ajenos a la aplicación.
- Formato integral: `respaldoIntegral.formato = AgendaTribuCompleto`, versión 1. La importación integral reemplaza los datos SOLO tras confirmación, valida antes de escribir y conserva `respaldo_integral_recuperacion` para recuperación. Los JSON antiguos mantienen su importación por combinación.
- SQLite real: `TribuDB.exportarCompleto()` guarda las tablas habituales y la tabla `respaldo_integral`, que conserva la instantánea completa sin perder campos de otros módulos. Importar .db requiere este formato integral; no aceptar un SQLite arbitrario como si fuese un respaldo completo.
- Respaldo automático JSON también queda en localForage como `respaldo_integral_ultimo_json`; se puede descargar desde Ajustes. Los respaldos previos y el espejo SQLite derivado no se incrustan recursivamente dentro de cada JSON.
- La copia externa usa carpeta elegida o descargas del navegador. No afirmar que la descarga automática funciona en Android sin probarla en el teléfono; Java y plugins permanecen intactos.
- Fuente rúnica local: `vendor/acadian-runes.ttf`, declarada en `css/tipografia-tribu.css`, exclusivamente para `#app-title` (LA TRIBU DE LOS LIBRES); solo TRIBU lleva tamaño 135%. Ningún otro título, módulo, nota, tarjeta, campo, importe o fórmula debe usarla. Tabla Mágica y Días Festivos no cargan esta hoja. El enlace y el span de TRIBU deben conservarse también en `restaurarMarcaHeader()`.
- Estadísticas del encabezado: `modalEstadisticasPlataforma`, implementado en `js/directorio/directorio-11.js`. Ya no hay panel de puntos. Recalcula listas guardadas, registros del directorio, notas, eventos de `PagosAppDB.eventos` (solo lectura, sin borradores) y eventos del calendario. Los eventos muestran su fecha y navegan a su día; esta navegación directa también permite consultar eventos pasados, sin modificar el límite de las flechas o el selector.
- Para cambios en los iframes o scripts, renovar sus versiones de carga en la agenda: refrescar solo la página principal puede mantener contenido antiguo.
- Verificación: `node --check` en los JS modificados; comprobar ida y vuelta JSON/.db con SQLite real y IndexedDB aislado, incluyendo rechazo de archivos inválidos y recuperación tras fallo. Nunca probar importaciones destructivas con los datos de producción.

## Servidor de sincronización global (server/)

- server/server.js — Node+Express+node:sqlite+ws, puerto 8780, DB tribu-sync.db. server.bat arranca con doble clic.
- Expuesto fijo via Tailscale Funnel: https://latribu.tailb81e5f.ts.net (PC latribu, tailnet kenth1977@gmail.com) — "tailscale funnel --bg 8780" ya persistente.
- App: js/sync.js + tarjeta Sincronizacion Global en view-settings. Colecciones: caminatas, directorioPersonas, personasGlobales, notas, preciosBuseta, historialRetiros, historialAsistencia. LWW por item (ts mayor gana), push tras saveData (debounce 1.5 s), pull al recibir aviso WS.

## Sincronizacion global (Tailscale Funnel + Node/SQLite)
- Documentacion completa: `SINCRONIZACION.md` — arquitectura, endpoints, tablas, usuarios, instalador portable y reglas de credenciales (TODO MAYUSCULAS).
- URL fija: `https://latribu.tailb81e5f.ts.net` -> `localhost:8780` (`server/server.js`, `server/tribu-sync.db`). Puerto 8780 reservado.
- Cliente: `js/sync.js` (tag `?v=` versionado — bump al cambiar); tarjeta colapsable en Ajustes; consola de conectividad incluida.
- CORS, auth por token (`x-token`), LWW por ts de item, columna `autor` audita quien cambio que. `vendor/instalar-servidor.bat` es el instalador portable.

## OTA local (replicado de TRIBALs — OTA-LOCAL.md, 2026-11-03)

Sistema de actualización 100% LAN (sin nube): empuja `www/` al teléfono sin
reinstalar el APK. Mismo motor: `@capgo/capacitor-updater@6.53.0`.

- **Puertos Agenda Tribu: teléfono :8766, bundle PC :8789.** (TRIBALs usa
  8765/8788 — se eligieron distintos a propósito para que ambas apps
  convivan en el mismo teléfono y un push NUNCA caiga en la app equivocada.
  El discovery filtra `devname` con prefijo `agenda-`.)
- **Teléfono**: `TribuOtaPlugin.java` (`com.tribu.tablamagica`, registrado en
  MainActivity antes de `super.onCreate`) — server auto-arranque en :8766:
  `POST /ota` {url,checksum,version} → `notifyListeners('tribalOta')` ·
  `GET /ping` → `tribalPing` · `GET /id` → devid/devname.
- **JS**: `js/ota.js` + `js/ota_stamp.js` (cargados en el HTML principal tras
  calendario.js): `notifyAppReady()` anti-rollback · listener `tribalOta` →
  `download()+set()` · poller 8 s a `/stamp.json` vía `CapacitorHttp` ·
  sello en `#app-version-actual`: tap → pull manual, mantener → `reset()` ·
  modal «OTA aplicada» por `TRIBAL_OTA.ts` · logs `[OTA]` a consola.
- **PC**: `app-apk\scripts\ota_watch.py` — vigila la FUENTE `Desktop\app`,
  sincroniza lo web a `app-apk\www` (`AGENDATRIBU_V1 (1).html`→`index.html`,
  excluye `agenda.html`, sube `js/`,`css/`,`img/`,`vendor/` + htmls raíz),
  estampa `js/ota_stamp.js`, zipea + SHA-256, sirve `/bundle.zip` +
  `/stamp.json` en :8789, POST a :8766. `ota_push.py` = un envío;
  `ota_server.py` = solo sirve para pull manual. Lanzador: `scripts\OTA-watch.bat`.
- **Manifest**: `usesCleartextTraffic="true"` — sin esto el download muere.
- **El OTA actualiza SOLO `www/`** — Java/plugins exigen APK nuevo.
- `notifyAppReady()` es OBLIGATORIO en cada boot (anti-rollback).
- Prueba de vida: `curl http://<tel>:8766/ping` → modal «Comunicación viva».
- APK con OTA ya compilado: `app-apk\apks\agendatribu-ota.apk` — hay que
  instalarlo UNA vez; desde ahí cada cambio en `Desktop\app` llega solo.
- Gradlew manual (sin `cap sync`: no hay package.json, el cableado de
  plugins es manual en `capacitor.settings.gradle` +
  `app/capacitor.build.gradle` + `assets/capacitor.plugins.json`).
  `www/` se copia a `android/app/src/main/assets/public/` antes de compilar.

## ⛔ BLINDADO — PERSISTENCIA DE DATOS (orden del usuario, 2026-11-03)

**La información del usuario NUNCA retrocede ni se restaura sin permiso.**

- **Localforage driver FIJO a IndexedDB** (`driver: [localforage.INDEXEDDB]`
  en la config de `AGENDATRIBU_V1 (1).html`). PROHIBIDO reintroducir
  `LOCALSTORAGE`/`WEBSQL` como fallback: un driver de respaldo carga un
  snapshot viejo en silencio y los datos «vuelven al pasado» — esa fue la
  causa raíz sospechada de la pérdida de información reportada.
- **Migración legacy ya aplicada**: llaves `WhatsAppListManager/data/*` en
  localStorage se apartan a `respaldo_legacy_*` (se copian a IndexedDB solo
  si la llave no existe allí). Nada se borra.
- **Respaldos = SOLO ESCRITURA**: el respaldo automático cada 24 h
  (`verificarRespaldoAutomatico`) únicamente genera/exporta — nunca carga.
- **Cargar un respaldo = ÚNICA Y EXCLUSIVAMENTE** por importación manual
  desde «Respaldos de base de datos». Ningún camino de código puede
  restaurar datos automáticamente ni al arrancar.
- **Siempre rige la última información guardada** — IndexedDB es la única
  fuente viva de verdad; TribuDB (SQLite) y los JSON son espejos de salida,
  jamás de entrada.

## ⛔ BLINDADO TOTAL — SISTEMA OTA LOCAL (aprobado y funcionando 2026-11-03)

**Verificado de punta a punta en teléfono real (push → download → set → modal).**
PROHIBIDO modificar cualquier pieza sin orden explícita del usuario.

- `js/ota.js` — listener tribalOta/tribalPing · `download({url,version,checksum})`
  + `set({id})` (firma de objeto OBLIGATORIA — args posicionales fallan en
  silencio) · poller 8 s a `/stamp.json` via CapacitorHttp · `tribu_ota_url`
  persistida · consola OTA `#ota-console` + botones (Limpiar/Copiar) ·
  `TribuOTA.ping()` diagnóstico PC↔teléfono · modales con estilos INLINE
  (las clases tribal-* no existen aquí — modales invisibles si se usan).
- `TribuOtaPlugin.java` — server :8766 (`/ota` `{url,checksum,version}`,
  `/ping`, `/id` con devname `agenda-XXXXX` persistente en SharedPreferences).
- `MainActivity.java` — `registerPlugin(TribuOtaPlugin)` +
  **`registerPlugin(CapacitorUpdaterPlugin)` EXPLÍCITO** (sin esto el bridge
  no instancia el updater desde plugins.json → `UP=false` → OTA muerto).
- `capacitor.config.json` — appId `com.tribu.tablamagica` (el updater lanza
  RuntimeException si falta).
- `app-apk/scripts/ota_watch.py` — vigila `Desktop\app` → sync www → sello →
  zip → SHA-256 → sirve :8789 → descubre TODOS los `agenda-*` y pregunta a
  cuál(es) empujar. Puertos agenda: **8766/8789** (TRIBALs usa 8765/8788).
- `usesCleartextTraffic="true"` en manifest — sin esto el download muere.
- `notifyAppReady()` cada boot — anti-rollback de Capgo.
- El OTA actualiza SOLO `www/`; cambios nativos = APK nuevo.
- Acceso: tocar «Versión instalada» → URL manual · mantener → reset paquete.
- Botón «Buscar actualización ⚡» chequea OTA primero, GitHub después.

## ⛔ BLINDADO — LOCALFORAGE NUNCA ANTES DE config() (causó pérdida aparente total 2026-11-03)

PROHIBIDO llamar `localforage.getItem/setItem/...` desde un IIFE o código que
corra ANTES del `localforage.config()` de la app (que se aplica en
DOMContentLoaded). Si se usa antes, localforage se inicializa con la base por
defecto ('localforage') y el config() posterior no aplica → la app lee una
base VACÍA → "se perdió todo" (los datos siguen en WhatsAppListManager, solo
inalcanzables). Toda lectura/escritura localforage nueva debe ejecutarse en
`window load`, `DOMContentLoaded` posterior al config, o dentro de funciones
que se llamen tras la inicialización. Mismo peligro en cualquier módulo.

## ⛔ BLINDADO — PROHIBIDA la clase `.fab` (parásito whatsapp redondo 2026-11-03)

JAMÁS volver a crear una regla CSS `.fab { ... }` en ningún archivo.
`fab` es la clase oficial de FontAwesome Brands — cualquier
`<i class="fab fa-whatsapp">` heredaba `position:fixed` + `border-radius:50%`
+ fondo naranja y se despegaba del botón volviéndose un "botón redondo
anaranjado" fantasma. Diagnosticado con el inspector long-press
(`TribuOTA.inspect()`): el <i> reportaba `FIXED` por esa regla zombie.
- PROHIBIDO `.fab`, `.fab-whatsapp`, cualquier clase que colisione con
  prefijos de FontAwesome (`fa`, `fab`, `fas`, `far`, `fal`).
- ORDEN POSTERIOR DEL USUARIO (2026-11-04): los FABs "+" cuadrados fueron
  REINTEGRADOS — `.fab-listas` (home→createNewCaminata), `.fab-dir`
  (directorio→openAgregarDirectorioModal), `.fab-notas` (notas→abrirEditorNota)
  y `.fab-cal` (calendario→abrirModalCalendarioDesdeFAB). Visibles solo en su
  vista vía `body:has(#view-*.active)`; `display:none` base en el resto.
  El FAB whatsapp redondo sigue eliminado (`navigate('caminata')` lo reemplaza
  el botón cuadrado «Enviar lista por WhatsApp» + `#btn-wa-lista-flotante`).
- Si algún día se requiere un float nuevo, la clase debe llamarse
  `tribu-fab-*` (prefijo propio, nunca `fab-*` ni `fab`).
- `TribuOTA.inspect()` (botón «Identificar elemento 🔍») queda como
  herramienta permanente de diagnóstico — long-press ~1s captura
  tag/id/clases/onclick/padres a la consola OTA + portapapeles.

## ⛔ BLINDADO — Botón flotante «Enviar lista» (aprobado 2026-11-03)

`#btn-wa-lista-flotante` — botón verde WhatsApp (#25D366), `position:fixed`
abajo-derecha (bottom 76px + safe-area, z-1050, radius 10px), dentro de
`#view-caminata` (solo visible al editar una lista). Llama
`openWhatsAppPreview()` — flotante de WhatsApp permitido en la app junto
con los "+" cuadrados reintegrados (`.fab-listas`/`.fab-dir`/`.fab-notas`/
`.fab-cal`, ver sección `.fab`). Su `fa-whatsapp` interno NO toma reglas
`.fab` (esa clase quedó erradicada — ver blindaje anterior).

## Viaje Internacional en Tabla Mágica (orden del usuario, 2026-11-05)

- Trigger en Configuración, debajo de Transporte con `<hr>` separador:
  `#toggle-viaje-btn` (ACTIVADO/DESACTIVADO, persiste `tmViajeInternacional`).
- Al activarlo: "Información General del Evento" → "Información del Viaje",
  "Precio del Evento" → "Precio de Viaje" y "Lista de Pagos" → "Precio de Viaje".
- Campos `#viaje-campos`: país (Centroamérica + MX/US/CO/EC/PE/CL/ES),
  toggle capacidad única (`tmViajeCapUnica` — un solo campo "Capacidad"
  alimenta SG y CG para viajes personales sin guía), fecha ida/regreso,
  número de vuelo, aerolínea (lista fija + "Agregar Otra Manualmente")
  y "Enlaces Check-in" visible solo con aerolínea elegida.
- Persistencia: `draft.evento.viaje` + `evento.viaje`/`viajeActivo` en
  IndexedDB; `viajeCargarDatos` en loadDraft/loadEventData;
  limpiarFormularioNuevo vacía los campos de viaje.
- `updateEventInfoVisibility` queda envuelto (wrapper) para re-aplicar la
  fusión de capacidad sin tocar su lógica blindada.

## ⛔ BLINDADO — Nombre "Lista de Pagos" (orden del usuario, 2026-11-05)

- El título de la sección de pagos en Tabla Mágica se llama SIEMPRE
  "Lista de Pagos" — JAMÁS renombrarlo (ni en modo Viaje Internacional).
- El campo de precio con viaje activo dice "Precio de Eventos"
  (nunca "Precio de Viaje"). Sin viaje sigue "Precio del Evento".
- PROHIBIDO tocar estos nombres sin orden explícita del usuario.

## ⛔ BLINDADO — VIAJE INTERNACIONAL en Tabla Mágica (ordenes acumuladas del usuario, 2026-11-05)

- Trigger en Configuración bajo Transporte (`#toggle-viaje-btn`) + long-press
  ~1 s en "Nuevo Evento" → trigger rápido. Persiste `tmViajeInternacional`.
- Títulos: "Información del Viaje", precio "Precio de Eventos",
  sección SIEMPRE "Lista de Pagos" (ver blindaje propio).
- Campos `#viaje-campos`: país, Modalidad de Capacidad (un solo campo alimenta
  SG+CG para viaje personal), fechas ida/regreso, vuelo, aerolínea
  (45 fijas + "Agregar Otra Manualmente"), Enlaces Check-in autollenado
  por `VIAJE_CHECKIN_LINKS`.
- Grupal = precioGrupal ÷ capacidad (SG) — fórmula ya existente, no tocar.
- Tipo de Gasto: SIN "Todo pegado al mismo lugar"; incluye Estadía, AirBnB,
  Agencia de Viajes, Tour Operadora. `quitarOpcionTodoPegado()` limpia
  selects restaurados de borradores/eventos viejos.
- Tarjetas: selector `#dia` (`.card-dia-select`) ARRIBA entre Ocultar y
  basurero, absoluto centrado top:11px, naranja negrita, "Día N · dd/mm/aaaa"
  dentro del rango ida→regreso; reasigna y ordena tarjetas por día;
  `pago.viajeDia` persiste. SOLO visible en modo viaje.
- `updatePriceFields` PRESERVA el precio digitado al cambiar P/P↔Grupal.
- `pagosHTML` guardado conserva el día vía atributo `selected` en el option.
- PROHIBIDO alterar esta funcionalidad sin orden explícita del usuario.

## ⛔ BLINDADO — TELÉFONOS INTERNACIONALES + BORRADO DE CAMPOS (verificados por el usuario, 2026-11-05)

**Teléfonos con prefijo de país — NO TOCAR:**
- `VIAJE_CODIGOS_PAIS` (mapa país → prefijo `00`+código: CR `00506`, Perú `0051`…).
- `viajeCampoTelefono()` crea Teléfono/WhatsApp/Teléfono Encargado con
  prefijo incrustado + botón WhatsApp (`wa.me` sin el `00`).
- **Listener delegado global** sobre `.tel-encargado, .phone-input`:
  SOLO dígitos (elimina letras/símbolos) + prefijo bloqueado
  (`00`+código reincrustado si se borra). ES LA PIEZA CRÍTICA: los campos
  restaurados desde `pagosHTML` no tienen listeners propios — sin el
  listener delegado el prefijo no funciona. NO quitar.
- `viajeAplicarPrefijosTel()` se llama al cambiar País del Viaje y tras
  `loadDraft`/`loadEventData` — re-prefija todos los teléfonos.
- `viajeNumeroSinPrefijo()` extrae dígitos sin prefijo conocido/suelto.
- Los inputs tel (`type="tel"`) están EXCLUIDOS de totales/resumen —
  un número de teléfono NUNCA es monto (fix verificado).

**Borrado de campos (X) — NO TOCAR:**
- El handler `btn-delete-field` DEBE llamar `saveDraft()` tras
  `formGroup.remove()` — sin eso el campo borrado reaparece al recargar
  porque `pagosHTML` lo conserva. Bug ya corregido y verificado.
- `pagosHTML` captura `innerHTML` — los `option selected` del selector
  de día se fijan vía `setAttribute('selected','')` para persistir.

- PROHIBIDO alterar esta funcionalidad sin orden explícita del usuario.

## ⛔ BLINDADO — CAMPO MAPA (Leaflet) en Tabla Mágica (verificado, 2026-11-05)

- `viajeCampoMapa`: botón "Mostrar Mapa"/"Ocultar Mapa" (colapsado por
  defecto), Leaflet LOCAL `vendor/leaflet/` (sin CDN).
- REGLA CRÍTICA: en campos dinámicos usar `insertAdjacentHTML('beforeend',
  deleteButton)` — NUNCA `innerHTML +=` porque destruye los listeners de
  los hijos (eso mató el botón del mapa). Prohibido volver a innerHTML+=.
- `rehidratarCamposMapa()` reconstruye mapas restaurados de pagosHTML.
- `viajeSincronizarSelectoresCampos()` inyecta opciones nuevas
  (gmaps/waze/mapa) en selectores viejos.
- Enlaces gmaps/waze: botón con ruta, click delegado `.btn-abrir-enlace`,
  modal `viajeModalEnlace` para pegar el link.
- PROHIBIDO tocar sin orden explícita del usuario.

## Puerto OTA :8789 SELLADO (2026-11-06)
- `scripts/ota_guard.py` posee :8789 en EXCLUSIVA (SO_EXCLUSIVEADDRUSE, sin allow_reuse_address): ningun otro proceso/app de la PC puede bindearlo mientras viva.
- Arranca solo con Windows via `OTA-guard.bat` copiado en shell:startup.
- Sirve `ota_out/bundle.zip` + `ota_out/stamp.json` (persistidos por `rebuild()`) — el checksum del push coincide byte a byte con lo servido.
- `ota_push.py` y el watcher usan `ExclusiveHTTPServer` y detectan al guard: si :8789 ya esta poseido, solo POSTean el OTA y salen (causa anterior de "OTA fallo": servidores duplicados con sello viejo).
- Cualquier app nueva que necesite puerto LAN debe elegir otro automaticamente; :8789 es propiedad permanente de Agenda Tribu.

## ⛔ BLINDADO — COMPARTIR PNG A WHATSAPP (verificado por el usuario 2026-11-06 — PROHIBIDO TOCAR)

Funcionando en el teléfono. Cualquier cambio a esta cadena requiere orden explícita.

**Cadena completa:**

1. `compartirPNGWhatsApp(canvas, fileName, texto)` en `js/tablamagica/app.js`:
   - `canvas.toBlob` → FileReader → base64
   - **Camino 1 (nativo)**: `window.TribuShare.sharePng(b64, fileName, texto)` con fallback a 2 args para APKs viejas
   - **Camino 2**: plugins `@capacitor/filesystem` (`directory:'CACHE'`) + `@capacitor/share`
   - **Camino 3**: `navigator.share` con File → descarga local + `wa.me/?text=`
   - Log en cada paso via `tribuLog()` a `#consola-debug`
2. `TribuShareBridge` en `MainActivity.java` (JavascriptInterface `window.TribuShare`):
   - DOS firmas: `sharePng(base64, fileName)` y `sharePng(base64, fileName, texto)` — ambas deben existir (compatibilidad)
   - `runOnUiThread` OBLIGATORIO para lanzar el Intent (los @JavascriptInterface corren en hilo de fondo)
   - Escribe PNG a `getCacheDir()`, `FileProvider.getUriForFile(..., "com.tribu.tablamagica.fileprovider", file)`, `ACTION_SEND` + `EXTRA_STREAM` + `EXTRA_TEXT` + `FLAG_GRANT_READ_URI_PERMISSION`
   - Errores visibles con `Toast` — nunca catch silencioso
3. `AndroidManifest.xml`: FileProvider `androidx.core.content.FileProvider` con authorities `com.tribu.tablamagica.fileprovider` y `@xml/file_paths` con `cache-path` (OBLIGATORIO para compartir archivos)
4. Consumidores: botones PNG 9:16/16:9 de Transporte, Tarjeta de Viaje, Resumen Global, Reconocimientos
5. Consola `#consola-debug` en tab-configuracion + `tribuLog()` — diagnóstico del flujo share

**Errores conocidos ya resueltos (no reintroducir):** "method not found" = firma sin overload; "entregado pero nada pasa" = falta runOnUiThread; share sin texto = firma vieja de 2 args; WebView no soporta navigator.share con archivos → siempre usar el puente nativo primero.
