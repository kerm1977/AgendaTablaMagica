/* ARCHIVO: js/tribu-link.js — Enlace Tribu (telefono<->telefono)
   Canal: el server :8766 del plugin TribuOta + CapacitorHttp.
   Descubre agenda-* en la LAN/hotspot, envia respaldos JSON, .db,
   notas y eventos de calendario; recibe por /transfer + /share. */
(function () {
    function plug() {
        return window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.TribuOta || null;
    }
    function http() {
        return window.Capacitor && window.Capacitor.Plugins &&
            window.Capacitor.Plugins.CapacitorHttp || null;
    }
    function blog(m) {
        try { if (window.TribuOTA) TribuOTA.log('[Link] ' + m); } catch (e) {}
    }
    function b64(u8) {
        var b = '';
        for (var i = 0; i < u8.length; i += 8192)
            b += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
        return btoa(b);
    }

    var TL = {};
    TL.disponible = !!plug();

    TL.misDatos = async function () {
        var p = plug(); return p ? await p.status() : null;
    };
    TL.buscar = async function () {
        var p = plug(); if (!p) return [];
        try { var r = await p.scan(); return (r && r.list) || []; }
        catch (e) { return []; }
    };

    // enviar {kind,name,data} a http://ip:8766/transfer
    TL.enviarA = async function (url, kind, name, data) {
        var H = http(); if (!H) throw 'sin CapacitorHttp';
        var base = url.indexOf('http') === 0 ? url : 'http://' + url + ':8766';
        blog('enviando ' + kind + ' "' + name + '" → ' + base);
        var r = await H.post({
            url: base + '/transfer',
            headers: { 'Content-Type': 'application/json' },
            data: { kind: kind, name: name, data: data }
        });
        blog('enviado OK → ' + base);
        return r;
    };

    // exponer mis datos para que el otro los baje — GET /share
    TL.compartir = async function (data) {
        var p = plug(); if (!p) throw 'sin plugin';
        return await p.setShare({ data: data });
    };
    TL.pullDe = async function (url) {
        var H = http(); if (!H) throw 'sin CapacitorHttp';
        var base = url.indexOf('http') === 0 ? url : 'http://' + url + ':8766';
        return (await H.get({ url: base + '/share' })).data;
    };
    TL.cerrarCompartir = async function () {
        var p = plug(); if (p) await p.clearShare();
    };

    // paquetes por tipo de dato
    TL.datosPorTipo = async function (tipo) {
        if (tipo === 'respaldo') {
            return { kind: 'json', name: 'Respaldo_Caminatas_' + Date.now() + '.json',
                     data: JSON.stringify(await obtenerRespaldoCompleto(), null, 2) };
        }
        if (tipo === 'db') {
            var bytes = await TribuDB.exportarCompleto(
                (typeof collectDbState === 'function' ? collectDbState() : {}));
            var u8 = bytes instanceof ArrayBuffer ? new Uint8Array(bytes) : bytes;
            return { kind: 'db', name: 'AgendaTribu_' + Date.now() + '.db', data: b64(u8) };
        }
        if (tipo === 'notas') {
            return { kind: 'json', name: 'Notas_' + Date.now() + '.json',
                     data: JSON.stringify(await localforage.getItem('app_notas') || []) };
        }
        if (tipo === 'calendario') {
            return { kind: 'json', name: 'Calendario_' + Date.now() + '.json',
                     data: JSON.stringify(await localforage.getItem('app_calendario_caminatas') || []) };
        }
        throw 'tipo desconocido';
    };

    // recepción: el plugin avisa con tribal? no — tribuTransfer; pedimos el paquete
    TL.escuchar = function () {
        var p = plug(); if (!p) return;
        p.addListener('tribuTransfer', async function (ev) {
            try {
                var r = await p.takeTransfer();
                blog('llegó ' + r.kind + ' "' + r.name + '" (' + (ev && ev.size) + 'c)');
                TL.recibir(r);
            } catch (e) { blog('takeTransfer falló: ' + e); }
        });
        blog('listener tribuTransfer armado');
    };

    // al llegar algo: guardarlo como archivo; JSON/.db ofrece importar
    TL.recibir = async function (r) {
        var bytes = r.data;
        if (r.kind === 'db') {
            var bin = atob(r.data), u8 = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
            bytes = u8;
        }
        if (window.TribuRespaldos) {
            try {
                await TribuRespaldos.guardar(r.name, bytes);
                TribuRespaldos.renderPanel && TribuRespaldos.renderPanel();
            } catch (e) { blog('guardar llegada falló: ' + e); }
        }
        var msg = 'Recibido de otro teléfono: ' + r.name + ' (' + r.kind + ')';
        if (/\.(json)$/i.test(r.name) && typeof importData === 'function' &&
            confirm(msg + '.\n\n¿Importarlo ahora? (reemplaza tus datos actuales)')) {
            var f = new File([bytes], r.name, { type: 'application/json' });
            await importData({ target: { files: [f] } });
        } else if (/\.(db|sqlite)$/i.test(r.name) &&
                   window.TribuRespaldos && TribuRespaldos.importarDB &&
                   confirm(msg + '.\n\n¿Importar la base .db ahora?')) {
            var f2 = new File([bytes], r.name, { type: 'application/x-sqlite3' });
            await TribuRespaldos.importarDB({ target: { files: [f2] } });
        } else {
            showToast(msg, 'success');
        }
    };

    window.TribuLink = TL;
})();

// ---- Panel en Ajustes ----------------------------------------------------
async function tribuLinkInit() {
    if (!window.TribuLink || !TribuLink.disponible) return;
    TribuLink.escuchar();
    try {
        var mi = await TribuLink.misDatos();
        var el = document.getElementById('tribu-link-mi');
        if (el && mi) el.innerHTML =
            'Yo soy <b>' + (mi.devname || mi.devid || '?') + '</b> · ' +
            (mi.url || '');
    } catch (e) {}
}

async function tribuLinkBuscar() {
    var list = document.getElementById('tribu-link-list');
    if (!list) return;
    list.innerHTML = '<div class="small text-muted">Buscando en la red…</div>';
    var peers = await TribuLink.buscar();
    if (!peers.length) {
        list.innerHTML = '<div class="small text-muted">Sin teléfonos Tribu ' +
            'al alcance (misma WiFi o hotspot del otro).</div>';
        return;
    }
    var mi = await TribuLink.misDatos();
    var miUrl = mi && mi.url;
    list.innerHTML = peers.filter(function (p) { return p.url !== miUrl; })
        .map(function (p) {
            return '<div class="border rounded p-2 mb-2">' +
                '<div class="fw-bold small"><i class="fas fa-mobile-alt me-1"></i>' +
                (p.devname || p.devid || p.url) + '</div>' +
                '<div class="small text-muted mb-2">' + p.url + '</div>' +
                '<div class="d-flex flex-wrap gap-1">' +
                '<button class="btn btn-sm btn-outline-primary" onclick="tribuLinkEnviar(\'' + p.url + '\',\'respaldo\')">Respaldo JSON</button>' +
                '<button class="btn btn-sm btn-outline-primary" onclick="tribuLinkEnviar(\'' + p.url + '\',\'db\')">Base .db</button>' +
                '<button class="btn btn-sm btn-outline-secondary" onclick="tribuLinkEnviar(\'' + p.url + '\',\'notas\')">Notas</button>' +
                '<button class="btn btn-sm btn-outline-secondary" onclick="tribuLinkEnviar(\'' + p.url + '\',\'calendario\')">Calendario</button>' +
                '</div></div>';
        }).join('') ||
        '<div class="small text-muted">Solo yo estoy en la red.</div>';
}

async function tribuLinkEnviar(url, tipo) {
    try {
        showToast('Preparando ' + tipo + '…');
        var paq = await TribuLink.datosPorTipo(tipo);
        await TribuLink.enviarA(url, paq.kind, paq.name, paq.data);
        showToast('Enviado ' + paq.name, 'success');
    } catch (e) { showToast('Envío falló: ' + (e && e.message || e), 'danger'); }
}
window.addEventListener('load', tribuLinkInit);
