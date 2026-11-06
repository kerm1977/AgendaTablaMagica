// ============================================================================
// ARCHIVO: js/ota.js — OTA local con @capgo/capacitor-updater (motor de
//   TRIBALs/Emprendedores, réplica exacta del sistema verificado).
//   - Al arrancar: notifyAppReady() (anti-rollback) + chequeo del sello
//   - Push del PC: TribuOta /ota → evento 'tribalOta' → pull (arma el poller)
//   - POLL cada 8 s al sello del PC (respaldo si el evento se pierde: app
//     dormida, cerrada, segundo push)
//   - TAP sobre la versión instalada → URL manual → pull
//     LONG-PRESS → reset() al paquete
//   - Modal descriptivo con TRIBAL_OTA cuando cambia el sello
//   - Botón «Buscar actualización» (Ajustes) envuelto: chequea OTA primero,
//     luego el chequeo GitHub de update.js (intacto)
//   - Consola persistente en #ota-console (Ajustes > Cotizaciones Guardadas):
//     TODOS los pasos con hora, sobrevive al reload tras aplicar una OTA
//   Puerto del teléfono: 8766 · bundle del PC: 8789 (TRIBALs: 8765/8788)
// ============================================================================
(function () {
    'use strict';
    var KEY = 'tribu_ota_url';
    var LOGKEY = 'tribu_ota_log';
    var LASTKEY = 'tribu_ota_last';
    var seen = '';
    try { seen = localStorage.getItem('tribu_ota_seen') || ''; } catch (e) {}

    // ---------------- consola persistente (#ota-console + localStorage) ----
    // cada línea: [hh:mm:ss] [OTA] mensaje — se conserva entre recargas para
    // no perder justo el rastro de la actualización que provocó el reload
    var logLines = [];
    try { logLines = JSON.parse(localStorage.getItem(LOGKEY) || '[]'); }
    catch (e) { logLines = []; }
    function renderLog() {
        var el = document.getElementById('ota-console');
        if (!el) return;
        el.textContent = logLines.length
            ? logLines.join('\n')
            : '— consola OTA vacía: aquí aparece cada paso del actualizador —';
        el.scrollTop = el.scrollHeight;
    }
    function L(m) {
        var line = '[' + new Date().toLocaleTimeString('es-CR') + '] [OTA] ' + m;
        try { console.log(line); } catch (e) {}
        // misma línea repetida → contador ×N en vez de inundar la consola
        var last = logLines[logLines.length - 1] || '';
        var base = last.replace(/ \[×\d+\]$/, '');
        if (base.slice(base.indexOf(']') + 1) ===
            line.slice(line.indexOf(']') + 1)) {
            var rep = /\[×(\d+)\]$/.exec(last);
            logLines[logLines.length - 1] =
                base + ' [×' + ((rep ? +rep[1] : 1) + 1) + ']';
        } else {
            logLines.push(line);
        }
        if (logLines.length > 400) logLines = logLines.slice(-400);
        try { localStorage.setItem(LOGKEY, JSON.stringify(logLines)); }
        catch (e) {}
        renderLog();
    }
    function toast(m, t) {
        try { if (window.showToast) showToast(m, t || 'success'); } catch (e) {}
    }
    function UP() {
        return window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.CapacitorUpdater;
    }
    function HTTP() {
        return window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.CapacitorHttp;
    }
    function OTA() {
        return window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.TribuOta;
    }
    function baseOf(url) { return String(url).replace(/\/bundle\.zip.*$/, ''); }

    L('módulo listo · UP=' + !!UP() + ' HTTP=' + !!HTTP() + ' TribuOta=' +
      !!OTA() + ' · url guardada=' + (localStorage.getItem(KEY) || '—'));
    try {
        L('plugins: ' + Object.keys(window.Capacitor &&
            window.Capacitor.Plugins || {}).join(','));
    } catch (e) {}

    var up = UP();
    if (up && up.notifyAppReady) {
        up.notifyAppReady()
            .then(function () { L('notifyAppReady OK — bundle marcado válido'); })
            .catch(function (e) { L('notifyAppReady falló: ' + e.message); });
    } else L('CapacitorUpdater NO disponible — OTA muerto');

    // ---------------- pull: descarga y aplica via el plugin ----------------
    var pulling = false;
    function pull(url, version, checksum, silent) {
        var P = UP();
        if (!P || !P.download) { L('pull abortado: sin plugin'); return; }
        if (pulling) { L('pull en curso — ignorado ' + url); return; }
        pulling = true;
        L('pull → ' + url);
        L('versión=' + (version || 'ota') + ' · sha256=' +
          (checksum || '(sin checksum — el plugin lo exigirá o fallará)'));
        if (!silent) toast('Descargando OTA…');
        P.download({ url: url, version: String(version || 'ota'),
                     checksum: checksum || '' })
            .then(function (bundle) {
                try {
                    localStorage.setItem(LASTKEY, JSON.stringify({
                        url: url, sha: checksum || '', version: version,
                        when: new Date().toLocaleString('es-CR') }));
                } catch (e) {}
                L('descargado id=' + bundle.id + ' — checksum verificado, ' +
                  'aplicando con set()…');
                toast('Aplicando OTA…');
                return P.set({ id: bundle.id }).catch(function () {
                    L('set() falló → next() para el próximo arranque');
                    return P.next({ id: bundle.id });
                });
            }).then(function () {
                L('aplicado — el WebView conmuta al bundle nuevo y recarga');
            })
            .catch(function (e) {
                pulling = false;
                L('FALLO descarga/aplicar: ' + (e && e.message || e));
                toast('OTA falló: ' + (e && e.message || e), 'danger');
            });
    }

    // ---------------- modal autocontenido (estilos inline, encima de todo) --
    function modal(icono, titulo, lineas, z) {
        var ov = document.createElement('div');
        ov.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.72);' +
            'display:flex;align-items:center;justify-content:center;' +
            'z-index:' + z + ';padding:20px';
        var box = document.createElement('div');
        box.style.cssText = 'background:#1e2430;color:#f1f5f9;border-radius:14px;' +
            'padding:22px;max-width:360px;width:100%;text-align:center;' +
            'box-shadow:0 12px 40px rgba(0,0,0,.5);font-family:inherit';
        box.innerHTML = '<div style="font-size:1.2rem;font-weight:700;' +
            'margin-bottom:10px">' + icono + ' ' + titulo + '</div>' +
            lineas.map(function (l) {
                return '<div style="font-size:.86rem;opacity:.88;' +
                    'margin:4px 0">' + l + '</div>';
            }).join('') +
            '<button id="ota-modal-ok" style="margin-top:14px;background:' +
            '#f97316;color:#fff;border:none;border-radius:8px;padding:' +
            '10px 26px;font-size:1rem;font-weight:600">Listo</button>';
        ov.appendChild(box);
        document.body.appendChild(ov);
        box.querySelector('#ota-modal-ok').addEventListener('click',
            function () { ov.remove(); });
        ov.addEventListener('click', function (e) {
            if (e.target === ov) ov.remove();
        });
    }

    // ---------------- push del PC: TribuOta dispara 'tribalOta' -------------
    var P = OTA();
    if (P && P.addListener) {
        P.addListener('tribalOta', function (e) {
            L('evento tribalOta recibido del PC: url=' + (e && e.url || '—') +
              ' · v=' + (e && e.version || '—') + ' · sha=' +
              (e && e.checksum || '').slice(0, 12) + '…');
            if (e && e.url) {
                try { localStorage.setItem(KEY, e.url); } catch (er) {}
                pull(e.url, e.version || ('ota-' + Date.now()),
                     e.checksum || '');
            }
        });
        L('listener tribalOta armado');
        // ping de conectividad: modal por encima de TODO (z máximo posible)
        P.addListener('tribalPing', function () {
            L('ping recibido del PC — modal de conexión');
            modal('📡', 'Comunicación viva',
                ['La PC habla con Agenda Tribu — OTA listo',
                 new Date().toLocaleString('es-CR')], 2147483647);
        });
        L('listener tribalPing armado');
    } else L('TribuOta.addListener NO disponible — push muerto');

    // ---------------- poller: el sello del PC cada 8 s ----------------
    // corre también AL ARRANCAR: si la actualización llegó con la app
    // cerrada, el sello nuevo espera y el pull arranca silencioso —
    // el usuario solo se entera cuando el modal de OTA aparece solo
    var lastPoll = '', pollFails = 0;
    function pollCheck() {
        var url = localStorage.getItem(KEY);
        if (!url || pulling) return Promise.resolve(false);
        var H = HTTP();
        if (!H) return Promise.resolve(false);
        var stamp = baseOf(url) + '/stamp.json';
        return H.get({ url: stamp }).then(function (r) {
            var d = r && r.data;
            if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) {} }
            if (!d || !d.ts) { L('poll: sello ilegible en ' + stamp); return false; }
            if (d.ts !== lastPoll && d.ts !== seen) {
                L('sello nuevo del PC: ' + d.ts + ' · sha=' +
                  (d.sha || '').slice(0, 12) + '… · n=' + d.n +
                  ' (sello actual ' + (lastPoll || '—') + ')');
                pull(url, d.ts, d.sha, true);   // silencioso: sin toasts
            }
            lastPoll = d.ts;
            if (pollFails) { L('poller recuperado'); pollFails = 0; }
            return true;
        }).catch(function (e) {
            if (!(++pollFails % 10))
                L('poller sin contacto ×' + pollFails + ' (' + stamp + ') — ' +
                  (e && e.message || 'sin respuesta'));
            return false;
        });
    }
    setInterval(pollCheck, 8000);
    setTimeout(pollCheck, 2500);        // chequeo al boot: update pendiente

    // ------------ chequeo manual del OTA (botón «Buscar actualización») -----
    // devuelve true si se disparó un pull (el GitHub check queda moot porque
    // la página recarga); false → sigue el flujo normal de update.js
    function check(verbose) {
        var url = localStorage.getItem(KEY);
        var msg = document.getElementById('app-version-msg');
        if (!url) {
            L('chequeo manual: sin PC OTA configurada — toca la versión ' +
              'instalada para pegar la URL del bundle');
            if (msg) msg.innerHTML =
                'OTA: sin PC configurada — tocá la versión instalada para pegar la URL del bundle.';
            return Promise.resolve(false);
        }
        L('chequeo manual del sello del PC…');
        var stamp = baseOf(url) + '/stamp.json';
        var H = HTTP();
        if (!H) { L('chequeo manual: sin CapacitorHttp'); return Promise.resolve(false); }
        return H.get({ url: stamp }).then(function (r) {
            var d = r && r.data;
            if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) {} }
            if (!d || !d.ts) {
                L('chequeo manual: sello ilegible — ' + JSON.stringify(d));
                if (msg) msg.innerHTML = 'OTA: sello ilegible en el PC.';
                return false;
            }
            lastPoll = d.ts;
            if (d.ts !== seen) {
                L('chequeo manual: hay sello nuevo ' + d.ts + ' → pull');
                pull(url, d.ts, d.sha, false);
                return true;
            }
            L('chequeo manual: al día — sello del PC ' + d.ts +
              ' == aplicado ' + seen);
            if (msg) msg.innerHTML =
                'OTA: al día — sello del PC <b>' + d.ts + '</b> (' + (d.n || 0) + ' archivos).';
            return false;
        }).catch(function (e) {
            L('chequeo manual: PC OTA inalcanzable en ' + stamp + ' — ' +
              (e && e.message || 'sin respuesta'));
            if (msg) msg.innerHTML =
                'OTA: PC inalcanzable en <b>' + stamp + '</b> — ¿está corriendo ota_watch.py?';
            return false;
        });
    }

    // ------------ sello: versión instalada — tap = pull · hold = reset ------
    function tag() { return document.getElementById('app-version-actual'); }
    function wire() {
        var t = tag();
        if (!t || t._otaWired) return;
        t._otaWired = 1;
        t.style.cursor = 'pointer';
        t.title = 'Toca: OTA manual · Mantén: volver al paquete';
        var lp = null;
        t.addEventListener('click', function () {
            if (!UP()) { L('tap sello — sin plugin'); return; }
            var url = window.prompt('URL del bundle OTA',
                localStorage.getItem(KEY) || 'http://192.168.1.100:8789/bundle.zip');
            if (url == null) return;
            url = url.trim();
            try { localStorage.setItem(KEY, url); } catch (e) {}
            pull(url, 'manual-' + Date.now(), '');
        });
        t.addEventListener('pointerdown', function () {
            lp = setTimeout(function () {
                lp = null;
                var P2 = UP();
                if (P2 && P2.reset &&
                    window.confirm('¿Quitar el OTA y volver al paquete?')) {
                    L('reset() → paquete empaquetado');
                    P2.reset();
                }
            }, 650);
        });
        ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
            t.addEventListener(ev, function () { clearTimeout(lp); lp = null; });
        });
        L('sello cableado en #app-version-actual');
    }
    wire();
    setTimeout(wire, 800); setTimeout(wire, 2500);

    // ---------------- «Buscar actualización»: OTA primero, GitHub después ---
    // envuelve la función global de update.js (BLINDADO — no se toca el
    // archivo): primero chequea el sello OTA del PC y, si no hubo pull,
    // deja correr el chequeo normal de versión en GitHub
    var _buscar = window.buscarActualizacion;
    if (typeof _buscar === 'function') {
        window.buscarActualizacion = function () {
            L('«Buscar actualización» → chequeo OTA del PC primero…');
            check(true).then(function (didPull) {
                if (didPull) return;       // pull en curso → la página recarga
                L('OTA sin novedad → sigue el chequeo GitHub de update.js');
                _buscar();
            });
        };
        L('buscarActualizacion envuelta: OTA primero, GitHub después');
    } else L('buscarActualizacion no existe — nada que envolver');

    // ---------------- ping de diagnóstico (botón en Ajustes) ---------------
    // toca el server del TELÉFONO (TribuOta :8766) y luego la PC (:8789) —
    // muestra en un modal si cada eslabón responde
    function ping() {
        L('ping OTA solicitado por el usuario');
        var lineas = [];
        var P2 = OTA();
        if (P2 && P2.status) {
            P2.status().then(function (st) {
                L('status plugin: ' + JSON.stringify(st));
                lineas.push('<b>Teléfono :8766</b> — server ' +
                    (st && st.running ? 'ACTIVO' : 'CAÍDO') +
                    (st && st.devid ? ' · ' + st.devid : ''));
                pingPC(lineas);
            }).catch(function (e) {
                L('status plugin falló: ' + e);
                lineas.push('<b>Teléfono :8766</b> — status() falló');
                pingPC(lineas);
            });
        } else {
            lineas.push('<b>Teléfono :8766</b> — plugin TribuOta NO existe');
            pingPC(lineas);
        }
    }
    function pingPC(lineas) {
        var url = localStorage.getItem(KEY);
        var H = HTTP();
        if (!url) {
            lineas.push('<b>PC :8789</b> — sin URL guardada (todavía no ' +
                'llegó un push ni se pegó la URL manual)');
            modal('📡', 'Ping OTA', lineas, 2147483647);
            L('ping: sin URL de PC guardada');
            return;
        }
        var stamp = baseOf(url) + '/stamp.json';
        if (!H) {
            lineas.push('<b>PC :8789</b> — sin CapacitorHttp');
            modal('📡', 'Ping OTA', lineas, 2147483647);
            return;
        }
        H.get({ url: stamp }).then(function (r) {
            var d = r && r.data;
            if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) {} }
            lineas.push('<b>PC :8789</b> — RESPONDE · sello ' +
                (d && d.ts ? d.ts : 'ilegible') + ' · ' + (d && d.n || 0) +
                ' archivos');
            modal('📡', 'Ping OTA — recibido', lineas, 2147483647);
            L('ping: PC responde ' + (d && d.ts));
        }).catch(function (e) {
            lineas.push('<b>PC :8789</b> — NO RESPONDE en ' + stamp +
                ' (' + (e && e.message || 'sin contacto') + ')');
            modal('📡', 'Ping OTA — falla PC', lineas, 2147483647);
            L('ping: PC no responde — ' + (e && e.message || e));
        });
    }

    // ---------------- API pública ------------------------------------------
    // Inspector por LONG-PRESS — al armarlo queda activo mientras navegás;
    // mantener presionado ~600ms un elemento lo captura al instante:
    // consola OTA + portapapeles + toast. Tocá el botón de nuevo para apagarlo.
    var _inspectOn = false;
    function _insDocs() {
        var arr = [document];
        document.querySelectorAll('iframe').forEach(function (f) {
            try { if (f.contentDocument) arr.push(f.contentDocument); }
            catch (e) {}
        });
        return arr;
    }
    function _insReport(t, e) {
        var acc = t.closest ? (t.closest('button,a,[onclick],[role="button"],i,svg') || t) : t;
        var cadena = [];
        for (var el = acc, n = 0; el && n < 6; el = el.parentElement, n++) {
            var cls = (el.className && el.className.toString().trim()) || '';
            cadena.push(el.tagName + (el.id ? '#' + el.id : '') +
                (cls ? '.' + cls.split(/\s+/).join('.') : '') +
                ' onc=' + (el.getAttribute && el.getAttribute('onclick') || '—'));
        }
        var r = acc.getBoundingClientRect ? acc.getBoundingClientRect() : {};
        var posFija = acc.ownerDocument && acc.ownerDocument.defaultView &&
            acc.ownerDocument.defaultView.getComputedStyle(acc).position === 'fixed';
        var html = (acc.outerHTML || '').replace(/\s+/g, ' ').slice(0, 300);
        var txt = 'INSPECT → ' + cadena.join(' <- ') +
            ' · pos=' + Math.round(r.left || 0) + ',' + Math.round(r.top || 0) +
            (posFija ? ' · FIXED' : '') + ' · ' + html;
        L(txt);
        try {
            if (navigator.clipboard && navigator.clipboard.writeText)
                navigator.clipboard.writeText(txt);
        } catch (e2) {}
        toast('Elemento capturado → consola OTA + portapapeles');
    }
    function _insBind(d) {
        if (d._insBound) return;
        d._insBound = true;
        d.addEventListener('pointerdown', _insDown, true);
        d.addEventListener('pointermove', _insMove, true);
        d.addEventListener('pointerup', _insUp, true);
        d.addEventListener('pointercancel', _insUp, true);
        // contextmenu se dispara ~500ms en Android — NO cancelar el timer,
        // solo matar el menú nativo para que el long-press complete
        d.addEventListener('contextmenu', function (e) { e.preventDefault(); }, true);
    }
    function _insOff() {
        _inspectOn = false;
        _insDocs().forEach(function (d) {
            d.removeEventListener('pointerdown', _insDown, true);
            d.removeEventListener('pointermove', _insMove, true);
            d.removeEventListener('pointerup', _insUp, true);
            d.removeEventListener('pointercancel', _insUp, true);
            d._insBound = false;
        });
        L('inspector apagado');
    }
    var _insT = null, _insX = 0, _insY = 0, _insEl = null;
    function _insDown(e) {
        _insEl = e.target; _insX = e.clientX || 0; _insY = e.clientY || 0;
        clearTimeout(_insT);
        _insT = setTimeout(function () { if (_insEl) _insReport(_insEl, e); }, 600);
    }
    function _insMove(e) {
        if (Math.abs((e.clientX || 0) - _insX) > 25 ||
            Math.abs((e.clientY || 0) - _insY) > 25) {
            clearTimeout(_insT); _insEl = null;
        }
    }
    function _insUp() { clearTimeout(_insT); _insEl = null; }
    function inspect() {
        if (_inspectOn) { _insOff(); toast('Inspector desactivado'); return; }
        _inspectOn = true;
        L('inspector LONG-PRESS armado — mantené presionado el elemento');
        toast('Inspector ON 🔍 — mantené presionado ~1s el elemento sospechoso');
        _insDocs().forEach(_insBind);
        // los iframes (Listas/Tabla Mágica) cargan después — engancharlos
        // cuando carguen para capturar dentro de ellos
        document.querySelectorAll('iframe').forEach(function (f) {
            try {
                f.addEventListener('load', function () {
                    try { _insBind(f.contentDocument); } catch (e) {}
                });
                if (f.contentDocument) _insBind(f.contentDocument);
            } catch (e) {}
        });
    }

    window.TribuOTA = {
        pull: pull, check: check, ping: ping, inspect: inspect,
        log: L,
        reset: function () { var P2 = UP(); if (P2 && P2.reset) P2.reset(); },
        clearLog: function () {
            logLines = [];
            try { localStorage.removeItem(LOGKEY); } catch (e) {}
            renderLog(); L('consola limpiada');
        },
        copyLog: function () {
            var el = document.getElementById('ota-console');
            var txt = el ? el.textContent : logLines.join('\n');
            function ok() { toast('Consola copiada al portapapeles'); }
            function fallback() {
                var ta = document.createElement('textarea');
                ta.value = txt;
                ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta); ta.select();
                try { document.execCommand('copy'); ok(); }
                catch (e2) { toast('No se pudo copiar', 'danger'); }
                ta.remove();
            }
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txt).then(ok, fallback);
                } else fallback();
            } catch (e) { fallback(); }
        },
        url: function () { return localStorage.getItem(KEY); },
        log: L
    };

    // ---------------- modal «última OTA aplicada» (descriptivo) ------------
    var O = window.TRIBAL_OTA;
    L('stamp=' + (O && O.ts) + ' · files=' + (O && O.files) +
      ' · pc=' + (O && O.pc || '—') + ' · seen=' + (seen || '—'));
    if (O && O.ts && O.ts !== seen) {
        try { localStorage.setItem('tribu_ota_seen', O.ts); } catch (e) {}
        var last = {};
        try { last = JSON.parse(localStorage.getItem(LASTKEY) || '{}'); }
        catch (e) {}
        var lineas = [
            '<b>Sello aplicado:</b> ' + O.ts,
            '<b>Contenido:</b> ' + (O.files || 0) + ' archivo(s) enviados ' +
                'desde la PC' + (O.pc ? ' (' + O.pc + ')' : ''),
            last.url ? '<b>Bundle:</b> ' + last.url : null,
            last.sha ? '<b>SHA-256 verificado:</b> ' + last.sha.slice(0, 16) + '…' : null,
            'La app se actualizó por WiFi <b>sin reinstalar el APK</b> — ' +
                'tus datos quedaron intactos.'
        ].filter(Boolean);
        setTimeout(function () {
            modal('📶', 'OTA aplicada', lineas, 10050);
            L('modal «OTA aplicada» mostrado — ' + O.ts);
        }, 600);
    }
    renderLog();
})();
