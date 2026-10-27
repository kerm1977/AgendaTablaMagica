/* ============================================================================
 * ARCHIVO: js/respaldos.js
 * RESPONSABILIDAD: Carpeta real de respaldos (File System Access API).
 *   El usuario elige la carpeta "respaldos" UNA vez; el handle queda guardado
 *   en IndexedDB y a partir de ahí la app escribe respaldos automáticos y
 *   manuales directamente al disco — y puede listar/leer archivos que el
 *   usuario haya dejado manualmente en esa misma carpeta para importarlos.
 *
 *   Soporta los dos formatos de la casa sin tocarlos:
 *     · Respaldo_Caminatas_*.json  → formato completo AgendaTribu
 *     · pagos_respaldo_*.json      → formato { events: [] } de Pagos JyK
 *
 *   Sin File System Access API (o sin carpeta elegida) → fallback a la
 *   descarga normal por <a download>.
 *   En Capacitor este módulo se reemplaza por el plugin Filesystem.
 *
 *   API: TribuRespaldos.disponible  → bool
 *        TribuRespaldos.elegirCarpeta() → Promise<nombre|null>
 *        TribuRespaldos.guardar(nombre, texto) → Promise<bool> (true=carpeta)
 *        TribuRespaldos.listar() → Promise<[{name,size,modified}]>
 *        TribuRespaldos.leerArchivo(nombre) → Promise<File|null>
 *        TribuRespaldos.nombreCarpeta() → Promise<string|null>
 *        TribuRespaldos.renderPanel() → refresca #respaldos-status/#respaldos-lista
 * ========================================================================== */
window.TribuRespaldos = (function () {
    'use strict';

    var HANDLE_KEY = 'respaldos_dir_handle';
    var disponible = (typeof window.showDirectoryPicker === 'function');

    async function cargarHandle() {
        if (!disponible || typeof localforage === 'undefined') return null;
        try {
            var h = await localforage.getItem(HANDLE_KEY);
            if (!h) return null;
            var perm = await h.queryPermission({ mode: 'readwrite' });
            if (perm !== 'granted') {
                perm = await h.requestPermission({ mode: 'readwrite' });
            }
            return (perm === 'granted') ? h : null;
        } catch (e) { return null; }
    }

    async function elegirCarpeta() {
        if (!disponible) return null;
        try {
            var h = await window.showDirectoryPicker({ mode: 'readwrite' });
            await localforage.setItem(HANDLE_KEY, h);
            renderPanel();
            return h.name;
        } catch (e) { return null; } // cancelado por el usuario
    }

    async function nombreCarpeta() {
        var h = await cargarHandle();
        return h ? h.name : null;
    }

    // Guarda texto como archivo .json en la carpeta. Devuelve true si escribió
    // en la carpeta; false si tuvo que caer a descarga normal.
    async function guardar(nombre, texto) {
        var h = await cargarHandle();
        if (h) {
            try {
                var fh = await h.getFileHandle(nombre, { create: true });
                var w = await fh.createWritable();
                await w.write(texto);
                await w.close();
                return true;
            } catch (e) {
                console.warn('TribuRespaldos: falló escritura en carpeta', e);
            }
        }
        descargarBlob(nombre, texto);
        return false;
    }

    function descargarBlob(nombre, texto) {
        var blob = new Blob([texto], { type: /\.(db|sqlite)$/i.test(nombre) ? 'application/x-sqlite3' : 'application/json' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
    }

    async function listar() {
        var h = await cargarHandle();
        if (!h) return [];
        var archivos = [];
        try {
            for await (var entry of h.values()) {
                if (entry.kind === 'file' && /\.(json|db|sqlite)$/i.test(entry.name)) {
                    var f = await entry.getFile();
                    archivos.push({ name: entry.name, size: f.size,
                                    modified: f.lastModified });
                }
            }
        } catch (e) { /* permiso revocado o carpeta movida */ }
        archivos.sort(function (a, b) { return b.modified - a.modified; });
        return archivos;
    }

    // Devuelve el archivo como File — listo para importData({target:{files:[f]}})
    async function leerArchivo(nombre) {
        var h = await cargarHandle();
        if (!h) return null;
        try {
            var fh = await h.getFileHandle(nombre);
            return await fh.getFile();
        } catch (e) { return null; }
    }

    function esc(s) {
        return String(s).replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
        });
    }

    // Refresca el panel de Ajustes si existe en pantalla.
    async function renderPanel() {
        var status = document.getElementById('respaldos-status');
        var lista = document.getElementById('respaldos-lista');
        if (!status && !lista) return;
        if (!disponible) {
            if (status) status.innerHTML =
                'Este navegador no soporta carpeta directa — los respaldos ' +
                'se descargan normal y podés moverlos a <b>respaldos/</b>.';
            return;
        }
        var nombre = await nombreCarpeta();
        if (status) {
            status.innerHTML = nombre
                ? 'Carpeta: <b>' + esc(nombre) + '</b>'
                : 'Sin carpeta elegida — los respaldos se descargan normal.';
        }
        if (!lista) return;
        var archivos = nombre ? await listar() : [];
        lista.innerHTML = archivos.length
            ? archivos.map(function (a) {
                return '<div class="d-flex justify-content-between align-items-center ' +
                       'border rounded p-2 mb-1">' +
                       '<span class="small text-truncate me-2" title="' + esc(a.name) + '">' +
                       esc(a.name) + '</span>' +
                       '<button class="btn btn-sm btn-outline-primary flex-shrink-0" ' +
                       'onclick="importarDesdeRespaldos(\'' + esc(a.name) + '\')">' +
                       '<i class="fas fa-file-import"></i></button></div>';
              }).join('')
            : '<div class="small text-muted">No hay respaldos en la carpeta.</div>';
    }

    var restaurando = false;
    var bases = ['PagosAppDB', 'tribuLibresDb'];
    var clavesLocales = ['agendaDatos', 'agendaTribuLibres', 'PagosAppDraft', 'alertaPerdida', 'theme', 'lastBackupTimestamp', 'tribal-fx-rates', 'tribal-fx-input', 'escala_fuente_app', 'tribu_oracion'];
    function claveLocal(k) { return clavesLocales.includes(k) || /^(borrador_nota_|cumple_no_ver_)/.test(k); }
    function claveForage(k) { return k.startsWith('app_') && k !== 'app_sqlite_db'; }

    async function codificar(v) {
        if (v === undefined) return { t: 'undefined' };
        if (typeof v === 'bigint') return { t: 'bigint', v: String(v) };
        if (typeof v === 'number' && !Number.isFinite(v)) return { t: 'number', v: String(v) };
        if (v === null || typeof v !== 'object') return v;
        if (v instanceof Date) return { t: 'date', v: v.toISOString() };
        if (v instanceof Blob) return { t: 'blob', mime: v.type, v: Array.from(new Uint8Array(await v.arrayBuffer())) };
        if (v instanceof ArrayBuffer || ArrayBuffer.isView(v)) {
            var bytes = v instanceof ArrayBuffer ? new Uint8Array(v) : new Uint8Array(v.buffer, v.byteOffset, v.byteLength);
            return { t: 'bytes', kind: v instanceof ArrayBuffer ? 'ArrayBuffer' : v.constructor.name, v: Array.from(bytes) };
        }
        if (Array.isArray(v)) return { t: 'array', v: await Promise.all(v.map(codificar)) };
        return { t: 'object', v: await Promise.all(Object.entries(v).map(async function (e) { return [e[0], await codificar(e[1])]; })) };
    }

    function decodificar(v) {
        if (v === null || typeof v !== 'object') return v;
        if (v.t === 'undefined') return undefined;
        if (v.t === 'bigint') return BigInt(v.v);
        if (v.t === 'number') return Number(v.v);
        if (v.t === 'date') return new Date(v.v);
        if (v.t === 'blob') return new Blob([new Uint8Array(v.v)], { type: v.mime });
        if (v.t === 'bytes') {
            var bytes = new Uint8Array(v.v);
            if (v.kind === 'ArrayBuffer') return bytes.buffer;
            var tipos = { Uint8Array: Uint8Array, Uint8ClampedArray: Uint8ClampedArray, Int8Array: Int8Array, Int16Array: Int16Array, Uint16Array: Uint16Array, Int32Array: Int32Array, Uint32Array: Uint32Array, Float32Array: Float32Array, Float64Array: Float64Array, DataView: DataView };
            if (!tipos[v.kind]) throw new Error('Tipo binario no compatible');
            return new tipos[v.kind](bytes.buffer);
        }
        if (v.t === 'array' && Array.isArray(v.v)) return v.v.map(decodificar);
        if (v.t === 'object' && Array.isArray(v.v)) return Object.fromEntries(v.v.map(function (e) { return [e[0], decodificar(e[1])]; }));
        throw new Error('Datos del respaldo dañados');
    }

    function abrirBase(nombre, esquema) {
        return new Promise(function (resolve, reject) {
            var ausente = false;
            var req = indexedDB.open(nombre);
            req.onupgradeneeded = function () {
                if (!esquema) { ausente = true; req.transaction.abort(); return; }
                esquema.forEach(function (s) {
                    var store = req.result.createObjectStore(s.nombre, { keyPath: s.keyPath, autoIncrement: s.autoIncrement });
                    s.indices.forEach(function (i) { store.createIndex(i.nombre, i.keyPath, { unique: i.unique, multiEntry: i.multiEntry }); });
                });
            };
            req.onsuccess = function () { resolve(req.result); };
            req.onerror = function () { if (ausente) resolve(null); else reject(req.error); };
            req.onblocked = function () { reject(new Error('Cerrá las otras pestañas de la aplicación antes de restaurar')); };
        });
    }

    async function leerBase(nombre) {
        if (typeof indexedDB === 'undefined') return { nombre: nombre, ausente: true, stores: [] };
        var db = await abrirBase(nombre);
        if (!db) return { nombre: nombre, ausente: true, stores: [] };
        try {
            var nombres = Array.from(db.objectStoreNames);
            if (!nombres.length) return { nombre: nombre, stores: [] };
            var stores = await new Promise(function (resolve, reject) {
                var tx = db.transaction(nombres, 'readonly');
                var resultado = nombres.map(function (nombre) {
                    var s = tx.objectStore(nombre);
                    var out = { nombre: nombre, keyPath: s.keyPath, autoIncrement: s.autoIncrement, indices: Array.from(s.indexNames).map(function (n) { var i = s.index(n); return { nombre: n, keyPath: i.keyPath, unique: i.unique, multiEntry: i.multiEntry }; }), registros: [] };
                    s.openCursor().onsuccess = function (e) {
                        var cursor = e.target.result;
                        if (cursor) { out.registros.push({ clave: cursor.primaryKey, valor: cursor.value }); cursor.continue(); }
                    };
                    return out;
                });
                tx.oncomplete = function () { resolve(resultado); };
                tx.onerror = tx.onabort = function () { reject(tx.error || new Error('Error leyendo ' + nombre)); };
            });
            for (var s of stores) s.registros = await Promise.all(s.registros.map(async function (r) { return { clave: await codificar(r.clave), valor: await codificar(r.valor) }; }));
            return { nombre: nombre, stores: stores };
        } finally { db.close(); }
    }

    async function capturar() {
        var forage = {};
        for (var key of await localforage.keys()) {
            if (claveForage(key)) forage[key] = await codificar(await localforage.getItem(key));
        }
        var estado = collectDbState();
        var mapa = { app_caminatas: estado.caminatas, app_personas_global: estado.personasGlobales, app_directorio_personas: estado.directorioPersonas, app_notas: estado.notas, app_consecutivo_factura: estado.consecutivoFactura, app_precios_buseta: estado.preciosBuseta, app_ultimo_respaldo: estado.ultimoRespaldo, app_historial_retiros: estado.historialRetiros, app_historial_asistencia: estado.historialAsistencia, app_cotizaciones_guardadas: estado.cotizacionesGuardadas, app_config_tema: estado.configTema, app_calendario_caminatas: estado.extra.calendario, app_dias_festivos: estado.extra.feriados };
        for (var entry of Object.entries(mapa)) forage[entry[0]] = await codificar(entry[1]);
        var locales = {};
        for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (claveLocal(k)) locales[k] = localStorage.getItem(k); }
        return { formato: 'AgendaTribuCompleto', version: 1, fecha: new Date().toISOString(), localforage: forage, localStorage: locales, indexedDB: await Promise.all(bases.map(leerBase)) };
    }

    function validar(s) {
        if (!s || s.formato !== 'AgendaTribuCompleto' || s.version !== 1 || !s.localforage || !s.localStorage || !Array.isArray(s.indexedDB)) throw new Error('No es un respaldo completo compatible');
        var requeridas = ['app_caminatas', 'app_personas_global', 'app_directorio_personas', 'app_notas', 'app_calendario_caminatas', 'app_dias_festivos', 'app_precios_buseta', 'app_historial_retiros', 'app_historial_asistencia', 'app_cotizaciones_guardadas'];
        requeridas.forEach(function (k) { if (!Array.isArray(decodificar(s.localforage[k]))) throw new Error('Falta información: ' + k); });
        Object.entries(s.localforage).forEach(function (e) { if (!claveForage(e[0])) throw new Error('Clave no permitida'); decodificar(e[1]); });
        Object.entries(s.localStorage).forEach(function (e) { if (!claveLocal(e[0]) || typeof e[1] !== 'string') throw new Error('Configuración no válida'); });
        if (s.indexedDB.length !== bases.length || new Set(s.indexedDB.map(function (b) { return b.nombre; })).size !== bases.length) throw new Error('Faltan bases de datos');
        s.indexedDB.forEach(function (b) {
            if (!bases.includes(b.nombre) || !Array.isArray(b.stores)) throw new Error('Base de datos no válida');
            b.stores.forEach(function (store) {
                if (typeof store.nombre !== 'string' || !Array.isArray(store.registros) || !Array.isArray(store.indices)) throw new Error('Tabla no válida');
                store.registros.forEach(function (r) { decodificar(r.clave); decodificar(r.valor); });
            });
        });
        return s;
    }

    async function escribirBase(b) {
        if (!b.stores.length) {
            var actual = await leerBase(b.nombre);
            if (!actual.stores.length) return;
            b = Object.assign({}, actual, { stores: actual.stores.map(function (s) { return Object.assign({}, s, { registros: [] }); }) });
        }
        var db = await abrirBase(b.nombre, b.stores);
        try {
            b.stores.forEach(function (s) { if (!db.objectStoreNames.contains(s.nombre)) throw new Error('Esquema incompatible: ' + s.nombre); });
            await new Promise(function (resolve, reject) {
                var tx = db.transaction(Array.from(db.objectStoreNames), 'readwrite');
                tx.oncomplete = resolve;
                tx.onerror = tx.onabort = function () { reject(tx.error || new Error('No se pudo restaurar ' + b.nombre)); };
                try {
                    Array.from(db.objectStoreNames).forEach(function (n) { tx.objectStore(n).clear(); });
                    b.stores.forEach(function (s) {
                        var store = tx.objectStore(s.nombre);
                        if (JSON.stringify(store.keyPath) !== JSON.stringify(s.keyPath)) throw new Error('Esquema incompatible');
                        s.registros.forEach(function (r) {
                            var valor = decodificar(r.valor);
                            if (store.keyPath === null) store.put(valor, decodificar(r.clave)); else store.put(valor);
                        });
                    });
                } catch (e) { tx.abort(); reject(e); }
            });
        } finally { db.close(); }
    }

    async function aplicar(s) {
        validar(s);
        for (var b of s.indexedDB) await escribirBase(b);
        for (var k of await localforage.keys()) { if (claveForage(k) && !Object.hasOwn(s.localforage, k)) await localforage.removeItem(k); }
        for (var e of Object.entries(s.localforage)) await localforage.setItem(e[0], decodificar(e[1]));
        for (var i = localStorage.length - 1; i >= 0; i--) { var key = localStorage.key(i); if (claveLocal(key) && !Object.hasOwn(s.localStorage, key)) localStorage.removeItem(key); }
        Object.entries(s.localStorage).forEach(function (e) { localStorage.setItem(e[0], e[1]); });
    }

    async function restaurar(s, bytes) {
        validar(s);
        var anterior = await capturar();
        await localforage.setItem('respaldo_integral_recuperacion', anterior);
        restaurando = true;
        ['frameTablaMagica', 'frameCaminatas'].forEach(function (id) { var f = document.getElementById(id); if (f) f.src = 'about:blank'; });
        try {
            await aplicar(s);
            if (bytes) await localforage.setItem('app_sqlite_db', bytes);
            else await localforage.removeItem('app_sqlite_db');
            location.reload();
        } catch (e) {
            try { await aplicar(anterior); } catch (rollbackError) { console.error('Copia de recuperación conservada', rollbackError); }
            restaurando = false;
            throw e;
        }
    }

    function confirmarRestauracion(s, bytes) {
        validar(s);
        showConfirm('Restaurar respaldo completo', 'Se reemplazarán todos los datos de la aplicación por este respaldo, incluidos pagos, divisas, calendario y ajustes. Se conservará una copia interna previa. ¿Continuar?', async function () {
            try { await restaurar(s, bytes); } catch (e) { showToast('No se pudo restaurar: ' + e.message, 'danger'); }
        }, 'Sí, restaurar todo');
    }

    async function importarCompleto(event) {
        var file = event.target.files[0];
        if (!file) return true;
        var data;
        try { data = JSON.parse(await file.text()); } catch (e) { return false; }
        if (!data.respaldoIntegral) return false;
        try { confirmarRestauracion(data.respaldoIntegral); } catch (e) { showToast(e.message, 'danger'); }
        event.target.value = '';
        return true;
    }

    async function descargarUltimoJSON() {
        try {
            var texto = await localforage.getItem('respaldo_integral_ultimo_json');
            if (!texto) { showToast('Todavía no hay un respaldo automático guardado', 'warning'); return; }
            await guardar('AgendaTribu_ultimo_respaldo_' + Date.now() + '.json', texto);
        } catch (e) { showToast('No se pudo descargar el respaldo: ' + e.message, 'danger'); }
    }

    async function exportarDB() {
        try {
            var snapshot = await capturar();
            var bytes = await TribuDB.exportarCompleto(collectDbState(), snapshot);
            await guardar('AgendaTribu_' + hoyStrCR() + '_' + Date.now() + '.db', bytes);
            renderPanel();
        } catch (e) { showToast('No se pudo respaldar .db: ' + e.message, 'danger'); }
    }

    async function importarDB(event) {
        var file = event.target.files[0];
        if (!file) return;
        try {
            var bytes = new Uint8Array(await file.arrayBuffer());
            var snapshot = await TribuDB.leerCompleto(bytes);
            confirmarRestauracion(snapshot, bytes);
        } catch (e) { showToast('Archivo .db no válido: ' + e.message, 'danger'); }
        event.target.value = '';
    }

    return {
        capturar: capturar,
        validar: validar,
        importarCompleto: importarCompleto,
        descargarUltimoJSON: descargarUltimoJSON,
        exportarDB: exportarDB,
        importarDB: importarDB,
        get restaurando() { return restaurando; },
        disponible: disponible,
        elegirCarpeta: elegirCarpeta,
        guardar: guardar,
        listar: listar,
        leerArchivo: leerArchivo,
        nombreCarpeta: nombreCarpeta,
        renderPanel: renderPanel
    };
})();
