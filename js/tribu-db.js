/* ============================================================================
 * ARCHIVO: js/tribu-db.js
 * RESPONSABILIDAD: Capa SQLite real (sql.js / WASM) — espejo del estado de la
 *   agenda. No requiere servidor: la base vive en memoria WASM y su binario
 *   (.sqlite) se persiste en IndexedDB vía localforage. Este mismo archivo
 *   .sqlite es el que se incrustará dentro del APK en la fase Capacitor.
 *
 *   Esquema extraído del mapa técnico del encabezado de la app. Además cada
 *   fila de caminatas/pasajeros guarda el objeto completo en `datos_json`
 *   para que ningún campo se pierda al migrar al esquema definitivo.
 *
 *   API: TribuDB.init() → Promise<bool>
 *        TribuDB.syncFromState(state) → reconstruye todas las tablas
 *        TribuDB.download() → descarga agenda-tribu.sqlite
 *        TribuDB.counts() → {tabla: n}
 *        TribuDB.updateStatus() → refresca #sqlite-status
 *        TribuDB.ready → bool
 * ========================================================================== */
window.TribuDB = (function () {
    'use strict';

    var SQL = null, db = null, ready = false;
    var LF_KEY = 'app_sqlite_db';
    var WASM_PATH = 'vendor/sqljs/sql-wasm.wasm';

    var SCHEMA = [
        'CREATE TABLE IF NOT EXISTS caminatas (' +
        ' id TEXT PRIMARY KEY, nombre TEXT, actividad TEXT, tipo TEXT,' +
        ' lugar TEXT, provincia TEXT, pais TEXT, dificultad TEXT, km TEXT,' +
        ' transporte TEXT, precio REAL, moneda TEXT, reserva_monto REAL,' +
        ' reserva_fecha TEXT, fecha_local TEXT, fecha_ida TEXT,' +
        ' fecha_regreso TEXT, hora_salida TEXT, lugar_salida TEXT,' +
        ' lugares_recoger TEXT, etapa TEXT, parque TEXT,' +
        ' usar_buseta INTEGER, precio_buseta REAL, cantidad_buses INTEGER,' +
        ' cantidad_guias INTEGER, incluye TEXT, otros_descripcion TEXT,' +
        ' formas_pago TEXT, mostrar_incluye INTEGER,' +
        ' mostrar_formas_pago INTEGER, mostrar_instrucciones INTEGER,' +
        ' mostrar_urls INTEGER, mostrar_caminantes INTEGER, equipo TEXT,' +
        ' notas_adicionales TEXT, urls TEXT, vuelo_numero TEXT,' +
        ' vuelo_fecha_salida TEXT, vuelo_hora_salida TEXT,' +
        ' vuelo_fecha_regreso TEXT, vuelo_hora_regreso TEXT,' +
        ' vuelo_lugar_salida TEXT, datos_json TEXT)',

        'CREATE TABLE IF NOT EXISTS pasajeros (' +
        ' id TEXT PRIMARY KEY, caminata_id TEXT, nombre TEXT, cedula TEXT,' +
        ' telefono TEXT, correo TEXT, acompanantes INTEGER, notas TEXT,' +
        ' monto REAL, estado TEXT, abono REAL, pendiente REAL,' +
        ' asistencia TEXT, pago_incluye_buseta INTEGER,' +
        ' pago_incluye_guia INTEGER, pago_incluye_otro TEXT, datos_json TEXT)',

        'CREATE TABLE IF NOT EXISTS directorio_personas (' +
        ' id TEXT PRIMARY KEY, nombre TEXT, tipo TEXT, cedula TEXT,' +
        ' pasaporte TEXT, telefono TEXT, correo TEXT, notas TEXT,' +
        ' pais TEXT, lugar TEXT, fecha_nacimiento TEXT, tipo_sangre TEXT,' +
        ' contacto_emergencia_nombre TEXT, telefono_emergencia TEXT)',

        'CREATE TABLE IF NOT EXISTS notas (' +
        ' id TEXT PRIMARY KEY, titulo TEXT, contenido TEXT,' +
        ' recordatorio_fecha TEXT, recordatorio_completado INTEGER,' +
        ' created_at TEXT)',

        'CREATE TABLE IF NOT EXISTS precios_buseta (' +
        ' id TEXT PRIMARY KEY, tipo TEXT, provincia TEXT, nombre TEXT,' +
        ' monto REAL)',

        'CREATE TABLE IF NOT EXISTS historial_retiros (' +
        ' id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, cam_id TEXT,' +
        ' cam_nombre TEXT, fecha TEXT)',

        'CREATE TABLE IF NOT EXISTS historial_asistencia (' +
        ' id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT, cam_id TEXT,' +
        ' cam_nombre TEXT, cam_actividad TEXT, cam_lugar TEXT,' +
        ' cam_pais TEXT, cam_dificultad TEXT, cam_km TEXT,' +
        ' cam_transporte TEXT, cam_precio REAL, cam_formas_pago TEXT,' +
        ' asistencia TEXT, fecha TEXT, fecha_registro TEXT)',

        'CREATE TABLE IF NOT EXISTS cotizaciones (' +
        ' id TEXT PRIMARY KEY, datos TEXT, fecha TEXT)',

        'CREATE TABLE IF NOT EXISTS config_tema (' +
        ' id INTEGER PRIMARY KEY, titulo_app TEXT, titulo_directorio TEXT,' +
        ' tema_color TEXT, grupos_personalizados TEXT,' +
        ' formas_pago_sinpe TEXT, formas_pago_cuentas TEXT,' +
        ' equipo_requerido TEXT, instrucciones_otras TEXT,' +
        ' instrucciones_normas TEXT, instrucciones_seguridad TEXT,' +
        ' membrete_cotizador TEXT)',

        'CREATE TABLE IF NOT EXISTS consecutivo_factura (' +
        ' id INTEGER PRIMARY KEY, valor INTEGER)',

        'CREATE TABLE IF NOT EXISTS ultimo_respaldo (' +
        ' id INTEGER PRIMARY KEY, valor INTEGER)',

        'CREATE TABLE IF NOT EXISTS datos_extra (' +
        ' k TEXT PRIMARY KEY, v TEXT)'
    ].join(';');

    var TABLAS_SYNC = ['pasajeros', 'caminatas', 'directorio_personas', 'notas',
        'precios_buseta', 'historial_retiros', 'historial_asistencia',
        'cotizaciones', 'config_tema', 'consecutivo_factura', 'ultimo_respaldo',
        'datos_extra'];

    function j(v) { return v == null ? null : JSON.stringify(v); }
    function n(v) { return (v === '' || v == null) ? null : v; }
    function b(v) { return v ? 1 : 0; }
    function f(v) { var x = parseFloat(v); return isFinite(x) ? x : null; }

    async function init() {
        if (ready) return true;
        try {
            if (typeof initSqlJs !== 'function') return false;
            SQL = await initSqlJs({ locateFile: function () { return WASM_PATH; } });
            var saved = null;
            try { saved = await localforage.getItem(LF_KEY); } catch (e) { /* sin copia previa */ }
            db = (saved && saved.length) ? new SQL.Database(new Uint8Array(saved)) : new SQL.Database();
            db.run(SCHEMA);
            ready = true;
            updateStatus();
            return true;
        } catch (e) {
            console.warn('TribuDB: no se pudo iniciar SQLite', e);
            return false;
        }
    }

    // Reconstruye todas las tablas desde el estado en memoria de la app.
    function syncFromState(s) {
        if (!ready || !s) return;
        try {
            db.run('BEGIN');
            TABLAS_SYNC.forEach(function (t) { db.run('DELETE FROM ' + t); });

            var st = db.prepare(
                'INSERT INTO caminatas VALUES (' +
                '?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            (s.caminatas || []).forEach(function (c) {
                st.run([n(c.id), n(c.nombre), n(c.actividad), n(c.tipo),
                    n(c.lugar), n(c.provincia), n(c.pais), n(c.dificultad),
                    n(c.kilometros || c.km), n(c.transporte), f(c.precio),
                    n(c.moneda), f(c.reservaMonto), n(c.reservaFecha),
                    n(c.fechaLocal), n(c.fechaIda), n(c.fechaRegreso),
                    n(c.horaSalida), n(c.lugarSalida), j(c.lugaresRecoger),
                    n(c.etapa), n(c.parque), b(c.usarBuseta !== false),
                    f(c.precioBuseta), f(c.cantidadBuses), f(c.cantidadGuias),
                    j(c.incluye), n(c.otrosDescripcion), j(c.formasPago),
                    b(c.mostrarIncluye !== false), b(c.mostrarFormasPago !== false),
                    b(c.mostrarInstrucciones !== false), b(c.mostrarUrls !== false),
                    b(c.mostrarCaminantes !== false), j(c.equipo),
                    n(c.notasAdicionales), j(c.urls), n(c.numeroVuelo),
                    n(c.vueloFechaSalida), n(c.vueloHoraSalida),
                    n(c.vueloFechaRegreso), n(c.vueloHoraRegreso),
                    n(c.vueloLugarSalida), j(c)]);
            });
            st.free();

            st = db.prepare(
                'INSERT INTO pasajeros VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            (s.caminatas || []).forEach(function (c) {
                (c.pasajeros || []).forEach(function (p) {
                    var abono = 0;
                    (p.historialMontos || []).forEach(function (m) {
                        if (!m.reversado) abono += parseFloat(m.monto) || 0;
                    });
                    st.run([n(p.id), n(c.id), n(p.nombre), n(p.cedula),
                        n(p.telefono), n(p.correo), p.acompanantes || 0,
                        n(p.nota), f(p.monto), n(p.estado),
                        abono || f(p.abonos), null, n(p.asistencia),
                        b(p.pagoIncluyeBuseta), b(p.pagoIncluyeGuia),
                        n(p.pagoIncluyeOtro), j(p)]);
                });
            });
            st.free();

            st = db.prepare(
                'INSERT INTO directorio_personas VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            (s.directorioPersonas || []).forEach(function (p) {
                st.run([n(p.id), n(p.nombre), n(p.tipo), n(p.cedula),
                    n(p.pasaporte), n(p.telefono), n(p.correo), n(p.notas),
                    n(p.pais), n(p.lugar), n(p.fechaNacimiento),
                    n(p.tipoSangre), n(p.contactoEmergenciaNombre),
                    n(p.telefonoEmergencia)]);
            });
            st.free();

            st = db.prepare('INSERT INTO notas VALUES (?,?,?,?,?,?)');
            (s.notas || []).forEach(function (nt) {
                st.run([n(nt.id), n(nt.titulo), n(nt.contenido),
                    n(nt.recordatorioFecha), b(nt.recordatorioCompletado || nt.recordatorioVisto),
                    n(nt.creada || nt.createdAt)]);
            });
            st.free();

            st = db.prepare('INSERT INTO precios_buseta VALUES (?,?,?,?,?)');
            (s.preciosBuseta || []).forEach(function (p) {
                st.run([n(p.id), n(p.tipo), n(p.provincia), n(p.nombre), f(p.monto)]);
            });
            st.free();

            st = db.prepare(
                'INSERT INTO historial_retiros (nombre,cam_id,cam_nombre,fecha) VALUES (?,?,?,?)');
            (s.historialRetiros || []).forEach(function (r) {
                st.run([n(r.nombre), n(r.camId), n(r.camNombre), n(r.fecha)]);
            });
            st.free();

            st = db.prepare(
                'INSERT INTO historial_asistencia (nombre,cam_id,cam_nombre,' +
                'cam_actividad,cam_lugar,cam_pais,cam_dificultad,cam_km,' +
                'cam_transporte,cam_precio,cam_formas_pago,asistencia,fecha,' +
                'fecha_registro) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)');
            (s.historialAsistencia || []).forEach(function (r) {
                st.run([n(r.nombre), n(r.camId), n(r.camNombre),
                    n(r.camActividad), n(r.camLugar), n(r.camPais),
                    n(r.camDificultad), n(r.camKm), n(r.camTransporte),
                    f(r.camPrecio), j(r.camFormasPago), n(r.asistencia),
                    n(r.fecha), n(r.fechaRegistro)]);
            });
            st.free();

            st = db.prepare('INSERT INTO cotizaciones VALUES (?,?,?)');
            (s.cotizacionesGuardadas || []).forEach(function (c) {
                st.run([n(c.id), j(c), n(c.fecha)]);
            });
            st.free();

            var ct = s.configTema || {};
            var ins = ct.instrucciones || {};
            var fp = ct.formasPago || {};
            st = db.prepare('INSERT INTO config_tema VALUES (?,?,?,?,?,?,?,?,?,?,?,?)');
            st.run([1, n(ct.tituloApp), n(ct.tituloDirectorio), n(ct.temaColor),
                j(ct.gruposPersonalizados), j(fp.sinpe), j(fp.cuentas),
                j(ct.equipoRequerido), j(ins.otrasRecomendaciones),
                j(ins.normasGenerales), j(ins.indicacionesSeguridad),
                j(ct.membreteCotizador)]);
            st.free();

            st = db.prepare('INSERT INTO consecutivo_factura VALUES (?,?)');
            st.run([1, s.consecutivoFactura || 1]);
            st.free();

            st = db.prepare('INSERT INTO ultimo_respaldo VALUES (?,?)');
            st.run([1, s.ultimoRespaldo || 0]);
            st.free();

            if (s.extra && typeof s.extra === 'object') {
                st = db.prepare('INSERT INTO datos_extra VALUES (?,?)');
                Object.keys(s.extra).forEach(function (k) {
                    st.run([k, JSON.stringify(s.extra[k])]);
                });
            }
            st.free();

            db.run('COMMIT');
            persist();
            updateStatus();
            return true;
        } catch (e) {
            try { db.run('ROLLBACK'); } catch (_) { /* nada que revertir */ }
            console.warn('TribuDB: error al sincronizar', e);
            return false;
        }
    }

    // Guarda el binario .sqlite en IndexedDB (sobrevive recargas).
    function persist() {
        try {
            var bytes = db.export();
            localforage.setItem(LF_KEY, bytes).catch(function (e) {
                console.warn('TribuDB: no se pudo persistir el .sqlite', e);
            });
        } catch (e) { console.warn('TribuDB: export falló', e); }
    }

    function download() {
        if (!ready) return;
        var bytes = db.export();
        var blob = new Blob([bytes], { type: 'application/x-sqlite3' });
        var a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'agenda-tribu.sqlite';
        a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
    }

    function counts() {
        if (!ready) return {};
        var out = {};
        ['caminatas', 'pasajeros', 'directorio_personas', 'notas',
         'precios_buseta', 'historial_retiros', 'historial_asistencia',
         'cotizaciones'].forEach(function (t) {
            try {
                var r = db.exec('SELECT COUNT(*) FROM ' + t);
                out[t] = (r[0] && r[0].values[0]) ? r[0].values[0][0] : 0;
            } catch (e) { out[t] = 0; }
        });
        return out;
    }

    // Consulta de solo lectura — verificación y futura importación.
    function query(sql) {
        if (!ready) return [];
        try { return db.exec(sql); } catch (e) { return []; }
    }

    function updateStatus() {
        var el = document.getElementById('sqlite-status');
        if (!el) return;
        if (!ready) { el.textContent = 'SQLite no disponible'; return; }
        var c = counts(), total = 0;
        for (var k in c) total += c[k];
        el.textContent = 'SQLite activo · ' + total + ' registros en ' +
            Object.keys(c).length + ' tablas · caminatas: ' + c.caminatas +
            ' · pasajeros: ' + c.pasajeros + ' · directorio: ' +
            c.directorio_personas + ' · notas: ' + c.notas;
    }

    async function exportarCompleto(estado, snapshot) {
        if (!await init()) throw new Error('SQLite no está disponible');
        if (!syncFromState(estado)) throw new Error('No se pudo sincronizar SQLite');
        var copia = new SQL.Database(db.export());
        try {
            copia.run('CREATE TABLE IF NOT EXISTS respaldo_integral (id INTEGER PRIMARY KEY, datos TEXT NOT NULL)');
            copia.run('INSERT OR REPLACE INTO respaldo_integral (id,datos) VALUES (?,?)', [1, JSON.stringify(snapshot)]);
            return copia.export();
        } finally { copia.close(); }
    }

    async function leerCompleto(bytes) {
        if (!await init()) throw new Error('SQLite no está disponible');
        if (new TextDecoder().decode(bytes.slice(0, 16)) !== 'SQLite format 3\u0000') throw new Error('El archivo no es SQLite');
        var copia = new SQL.Database(bytes);
        try {
            var integridad = copia.exec('PRAGMA integrity_check');
            if (!integridad[0] || integridad[0].values[0][0] !== 'ok') throw new Error('Base de datos dañada');
            var fila = copia.exec('SELECT datos FROM respaldo_integral WHERE id=1');
            if (!fila[0] || fila[0].values.length !== 1) throw new Error('El archivo no contiene un respaldo integral de AgendaTribu');
            return JSON.parse(fila[0].values[0][0]);
        } finally { copia.close(); }
    }

    return { init: init, syncFromState: syncFromState, download: download,
             exportarCompleto: exportarCompleto, leerCompleto: leerCompleto,
             counts: counts, query: query, updateStatus: updateStatus,
             get ready() { return ready; } };
})();
