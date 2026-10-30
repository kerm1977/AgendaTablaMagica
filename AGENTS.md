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
  - Botón superior "Compartir mes por WhatsApp" (`exportarMesCalendarioWhatsApp`) es el ÚNICO compartir — el FAB no aparece en calendario.
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
- **Minimizar todos los pagos**: boton #colapsar-todos-pagos SIN clase btn-add-item (estilo inline). Colapsa todas las tarjetas dejando solo nombre+total. NO TOCAR.
- **Colapsables**: secciones colapsan al tocar el h3; EXCEDENTE P.P. y EXCEDENTE GENERAL quedan visibles en Totales colapsado; Excedente visible en Info General colapsada. "Excedente" es el nombre correcto (NO "Ganancia"). NO TOCAR.
- **Botón guardar evento**: flotante cuadrado 56×56 bottom:85px right:20px. NO TOCAR.
- **Swipe**: →izquierda = divisas, izquierda→ = tabla de pagos. NO TOCAR.
- **Colapsar todos los pagos**: botón junto al "+" de Lista de Pagos. NO TOCAR.
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
