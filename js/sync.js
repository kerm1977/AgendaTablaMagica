/* ==========================================================================
 * ARCHIVO: js/sync.js — sincronización global con el mini servidor
 * Push en cada saveData, pull al recibir aviso por WebSocket.
 * ========================================================================== */

const SYNC_KEY = 'tribu_sync_cfg_v1';
const SYNC_COLLECTIONS = ['caminatas', 'directorioPersonas', 'personasGlobales', 'notas', 'preciosBuseta', 'historialRetiros', 'historialAsistencia', 'calendarioCaminatas', 'diasFestivos', 'chat'];
let chatMensajes = [];
let chatNoLeidos = 0;
function renderBadgeChat() { const b = document.getElementById('chat-badge'); if (b) { b.textContent = chatNoLeidos > 99 ? '99+' : chatNoLeidos; b.style.display = chatNoLeidos ? 'flex' : 'none'; } }
let syncUsuarios = new Set();

const SYNC_MAQUINA_DEFECTO = 'latribu';
const SYNC_TAILNET_DEFECTO = 'tailb81e5f.ts.net';
const SYNC_NUBE_DEFECTO = 'kenth1977';
function syncURLNube() { let h = (syncCfg.nube || SYNC_NUBE_DEFECTO).replace(/^https?:\/\//, '').replace(/\/$/, ''); if (!h.includes('.')) h += '.pythonanywhere.com'; return 'https://' + h; }
const SYNC_URL_FALLBACK = 'https://kenth1977.pythonanywhere.com';
const SYNC_APP_ID = 'com.tribu.tablamagica';
let syncCfg = JSON.parse(localStorage.getItem(SYNC_KEY) || '{}');
if (!syncCfg.maquina) syncCfg.maquina = SYNC_MAQUINA_DEFECTO;
if (!syncCfg.tailnet) syncCfg.tailnet = SYNC_TAILNET_DEFECTO;

function syncURL() { return 'https://' + syncCfg.maquina + '.' + syncCfg.tailnet; }
let syncToken = localStorage.getItem('tribu_sync_token') || '';
let syncTokens = {};   // token por base-URL — cada server tiene su propia sesión
let syncWS = null, syncWSReintenta = false, syncPushTimer = null, syncPullInFlight = false, syncPoll = null, syncActivoURL = '', syncFallos = 0, syncRetryQueue = [], syncWatchdog = null;
let syncAplicando = false; // flag: no re-empujar lo que viene del servidor

function syncGuardarCfg() { localStorage.setItem(SYNC_KEY, JSON.stringify(syncCfg)); }
function syncUltimoTs() { return Number(localStorage.getItem('tribu_sync_ts') || 0); }

let toastTimer = null;
function toastSync(msg, dur = 5000) {
    let el = document.getElementById('toast-sync');
    if (!el) {
        el = document.createElement('div');
        el.id = 'toast-sync';
        el.style.cssText = 'position:fixed;top:calc(64px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);background:#111;color:#4ade80;border:1px solid #4ade80;border-radius:10px;padding:10px 18px;font-size:.85rem;z-index:3000;box-shadow:0 4px 16px rgba(0,0,0,.4);transition:opacity .3s;';
        document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.opacity = '1';
    el.style.display = 'block';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.style.display = 'none', 400); }, dur);
}

const _est = document.createElement('style');
_est.textContent = '@keyframes parpadeo{0%,100%{opacity:1}50%{opacity:.2}}#sync-online-dot{display:none;width:9px;height:9px;border-radius:50%;background:#22c55e;margin-left:6px;animation:parpadeo 1.4s infinite;vertical-align:middle}';
document.head && document.head.appendChild(_est);
setTimeout(() => { const t = document.getElementById('app-title'); if (t && !document.getElementById('sync-online-dot')) { const d = document.createElement('span'); d.id = 'sync-online-dot'; t.appendChild(d); } }, 2000);

function syncEstado(txt, tipo = 'info') {
    const el = document.getElementById('sync-estado');
    if (el) { el.textContent = txt; el.className = 'small d-block mt-2 text-' + tipo; }
    syncLog(txt, tipo);
}

function syncLog(msg, tipo = 'info') {
    const box = document.getElementById('sync-log');
    if (!box) return;
    const col = tipo === 'danger' || tipo === 'err' ? '#f87171' : tipo === 'success' ? '#4ade80' : tipo === 'warning' ? '#facc15' : '#7dd3fc';
    const d = document.createElement('div');
    d.innerHTML = '<span style="color:#555">' + new Date().toLocaleTimeString('es-CR') + '</span> <span style="color:' + col + '">' + String(msg).replace(/</g,'&lt;') + '</span>';
    box.appendChild(d);
    while (box.children.length > 100) box.removeChild(box.firstChild);
    box.scrollTop = box.scrollHeight;
}

window.addEventListener('error', (e) => { try { syncLog('JS error: ' + (e.message || 'error'), 'err'); } catch(_){} });

function syncIdsGet(col) { try { return new Set(JSON.parse(localStorage.getItem('sync_ids_' + col) || '[]')); } catch (e) { return new Set(); } }
function syncIdsSet(col, ids) { localStorage.setItem('sync_ids_' + col, JSON.stringify([...ids])); }

function getColeccion(nom) {
    switch (nom) {
        case 'caminatas': return typeof caminatas !== 'undefined' ? caminatas : null;
        case 'directorioPersonas': return typeof directorioPersonas !== 'undefined' ? directorioPersonas : null;
        case 'personasGlobales': return typeof personasGlobales !== 'undefined' ? personasGlobales : null;
        case 'notas': return typeof notas !== 'undefined' ? notas : null;
        case 'preciosBuseta': return typeof preciosBuseta !== 'undefined' ? preciosBuseta : null;
        case 'historialRetiros': return typeof historialRetiros !== 'undefined' ? historialRetiros : null;
        case 'historialAsistencia': return typeof historialAsistencia !== 'undefined' ? historialAsistencia : null;
        case 'calendarioCaminatas': return typeof calendarioCaminatas !== 'undefined' ? calendarioCaminatas : null;
        case 'diasFestivos': return typeof diasFestivos !== 'undefined' ? diasFestivos : null;
        case 'chat': return chatMensajes;
        default: return null;
    }
}
let syncPendientes = [];   // items remotos esperando a que el global exista
function syncEncolarPendiente(it) {
    syncPendientes.push(it);
    syncLog('pendiente ' + it.coleccion + ' — global no listo aún', 'warning');
    setTimeout(syncAplicarPendientes, 2500);
}
async function syncAplicarPendientes() {
    if (!syncPendientes.length) return;
    const restantes = [];
    let aplicados = 0;
    for (const it of syncPendientes) {
        const arr = getColeccion(it.coleccion);
        if (!arr) { restantes.push(it); continue; }
        const idx = arr.findIndex(x => String(x.id) === String(it.id));
        if (!it.borrado && idx < 0) { arr.push({ id: it.id, ...it.data, _ts: it.ts, _por: it.autor }); aplicados++; }
    }
    syncPendientes = restantes;
    if (aplicados) {
        try { await saveData(); } catch (e) { }
        if (typeof renderNotas === 'function') renderNotas();
        if (typeof renderCaminatas === 'function') renderCaminatas();
        if (typeof renderDirectorio === 'function') renderDirectorio();
        syncLog('aplicados ' + aplicados + ' pendientes — ya visibles', 'success');
        syncEstado('Datos actualizados desde el servidor', 'success');
    }
    if (syncPendientes.length) setTimeout(syncAplicarPendientes, 3000);
}

async function syncFetch(path, body, timeoutMs = 15000) {
    const preferido = syncCfg.servidorPreferido === 'pythonanywhere' ? syncURLNube() : syncURL();
    const otro = preferido === syncURLNube() ? syncURL() : syncURLNube();
    const bases = [syncActivoURL || preferido, preferido === syncActivoURL ? otro : (syncActivoURL ? preferido : otro), otro].filter((v, i, a) => v && a.indexOf(v) === i);
    let ultimo = null;
    for (const base of bases) {
        try {
            const res = await fetch(base.replace(/\/$/, '') + path, {
                method: body ? 'POST' : 'GET',
                headers: { 'Content-Type': 'application/json', 'x-token': syncTokens[base] || syncToken, 'x-app': SYNC_APP_ID },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(timeoutMs)
            });
            if (res.status === 401 && path !== '/login' && syncCfg.usuario && syncCfg.clave) {
                syncLog('re-login en ' + base, 'warning');
                const lj = await (await fetch(base.replace(/\/$/, '') + '/login', {
                    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-app': SYNC_APP_ID },
                    body: JSON.stringify({ usuario: syncCfg.usuario, clave: syncCfg.clave })
                })).json();
                if (lj.token) {
                    syncTokens[base] = lj.token;
                    if (base === (syncCfg.servidorPreferido === 'pythonanywhere' ? syncURLNube() : syncURL())) syncToken = lj.token;
                    const res2 = await fetch(base.replace(/\/$/, '') + path, {
                        method: body ? 'POST' : 'GET',
                        headers: { 'Content-Type': 'application/json', 'x-token': lj.token, 'x-app': SYNC_APP_ID },
                        body: body ? JSON.stringify(body) : undefined
                    });
                    if (base === preferido) syncFallos = 0;
                    syncActivoURL = base;
                    if (!res2.ok) throw new Error(await res2.text());
                    return res2.json();
                }
                throw new Error(lj.error || 're-login falló');
            }
            if (base === preferido) syncFallos = 0;
            syncActivoURL = base;
            if (base !== preferido) syncLog('usando respaldo: ' + base, 'warning');
            if (!res.ok) throw new Error(await res.text());
            return res.json();
        } catch (e) {
            ultimo = e;
            if (base === preferido && syncActivoURL !== otro) {
                syncFallos++;
                if (syncFallos >= 2) { syncActivoURL = otro; syncLog('preferido caído (' + syncFallos + ' fallos) — cambio a respaldo', 'err'); }
            }
        }
    }
    throw ultimo || new Error('sin conexión');
}

// ---- Registro / Login ---------------------------------------------------

async function syncRegistro() {
    syncLeerCampos();
    const usuario = document.getElementById('sync-usuario').value.trim();
    const clave = document.getElementById('sync-clave').value.toUpperCase();
    try {
        syncLog('Registro → ' + usuario, 'warning');
        await syncFetch('/registro', { usuario, clave });
        syncEstado('Usuario registrado, ya podés conectar', 'success');
    } catch (e) {
        syncEstado(e.message.includes('ya existe') ? 'El usuario ya existe, conectá directo' : 'Error: ' + e.message, 'warning');
    }
}

let syncConectando = false;
async function syncConectar() {
    if (syncConectando) { syncLog('ya hay una conexión en curso — esperá', 'warning'); return; }
    syncConectando = true;
    syncLeerCampos();
    syncEstado('Conectando a ' + syncURL() + ' …', 'muted');
    syncCfg.usuario = document.getElementById('sync-usuario').value.trim().toUpperCase();
    const clave = document.getElementById('sync-clave').value.toUpperCase();
    try {
        syncLog('POST ' + syncURL() + '/login', 'warning');
        const r = await fetch(syncURL().replace(/\/$/, '') + '/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: syncCfg.usuario, clave })
        });
        const j = await r.json();
        if (!j.ok) throw new Error(j.error || 'login falló');
        syncLog('Login OK — token recibido', 'success');
        syncToken = j.token;
        localStorage.setItem('tribu_sync_token', syncToken);
        syncCfg.clave = clave;
        syncGuardarCfg();
        syncEstado('Conectado como ' + syncCfg.usuario, 'success');
        syncAbrirWS();
        syncPullCompleto();
    } catch (e) { syncEstado('No conectó: ' + e.message, 'danger'); }
}

// ---- Push (después de cada guardado) ------------------------------------

function syncEncolarPush() {
    if (!syncToken || !syncCfg.maquina || syncAplicando) return;
    clearTimeout(syncPushTimer);
    syncPushTimer = setTimeout(syncPush, 1500); // debounce
}

const syncHuella = {};
const syncItemHash = {};
function syncHashItem(it) {
    const str = JSON.stringify(it);
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h;
}
function syncHuellaDe(arr) {
    let h = 0;
    for (const it of arr) { const str = String(it.id) + ':' + (it._ts || 0) + ':' + (it.titulo || it.nombre || ''); for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0; }
    return h + ':' + arr.length;
}
async function syncPush() {
    if (!syncToken || !syncCfg.maquina) return;
    const ts = Date.now();
    for (const col of SYNC_COLLECTIONS) {
        try {
            const arr0 = getColeccion(col);
            if (!arr0) continue;
            const h = syncHuellaDe(arr0);
            const items = arr0.map(it => {
                const t = it._ts || ts;
                if (!it.creadoPor) { it.creadoPor = it._por || syncCfg.usuario; it.creada = it.creada || new Date(t).toISOString(); }
                it._por = syncCfg.usuario;
                it.modificadoPor = syncCfg.usuario;
                it.modificado = new Date(t).toISOString();
                return { ...it, ts: t };
            });
            const conocidos = syncIdsGet(col);
            const actuales = new Set(items.map(it => String(it.id)));
            const eliminados = [...conocidos].filter(id => !actuales.has(id)).map(id => ({ id, borrado: true, ts }));
            if (h === syncHuella[col] && !eliminados.length && !syncRetryQueue.includes(col)) continue;
            const prev = syncItemHash[col] || (syncItemHash[col] = {});
            const cambios = items.filter(it => syncHashItem(it) !== prev[String(it.id)]);
            items.forEach(it => prev[String(it.id)] = syncHashItem(it));
            if (syncWS && syncWS.readyState === 1 && (cambios.length || eliminados.length)) {
                try { syncWS.send(JSON.stringify({ tipo: 'items', coleccion: col, items: [...cambios, ...eliminados] })); } catch (e) { }
            }
            const r = await syncFetch('/push', { coleccion: col, items: [...items, ...eliminados] }, 30000);
            syncHuella[col] = h;
            syncIdsSet(col, actuales);
            if (eliminados.length) syncLog('borrados propagados ' + col + ': ' + eliminados.length, 'warning');
            if (items.length) syncLog('push ' + col + ' → ' + items.length + ' items', 'info');
        } catch (e) { console.warn('push ' + col, e); syncLog('push ' + col + ' falló: ' + e.message, 'err'); syncRetryQueue.push(col); }
    }
    syncEstado('Sincronizado ' + new Date(ts).toLocaleTimeString('es-CR'), 'success');
}

// ---- Pull (cambios del servidor) ----------------------------------------

async function syncPull(completo = false) {
    if (!syncToken || syncPullInFlight) return;
    syncPullInFlight = true;
    try {
        const r = await syncPullPaginado(completo);
        if (r.items && r.items.length) {
            syncAplicando = true;
            for (const it of r.items) {
                if (it.coleccion === 'tmEventos') { tmMerge(it); continue; }
                const arr = getColeccion(it.coleccion);
                if (!arr) { syncEncolarPendiente(it); continue; }
                const idx = arr.findIndex(x => String(x.id) === String(it.id));
                if (it.borrado) { if (idx >= 0) { arr.splice(idx, 1); const ids = syncIdsGet(it.coleccion); ids.delete(String(it.id)); syncIdsSet(it.coleccion, ids); } continue; }
                if (typeof it.data !== 'object' || !it.data || !Object.keys(it.data).length) continue;   // data vacía → basura
                if (it.coleccion === 'notas' && !(it.data.titulo || '').trim() && !(it.data.contenido || '').trim()) continue;   // anti-fantasma
                if ((it.coleccion === 'directorioPersonas' || it.coleccion === 'personasGlobales') && !(it.data.nombre || '').trim()) continue;   // contacto vacío
                const remoto = { id: it.id, ...it.data, _ts: it.ts, _por: it.autor || it.data._por };
                const ids = syncIdsGet(it.coleccion);
                if (idx >= 0) {
                    if ((arr[idx]._ts || 0) <= it.ts) { arr[idx] = remoto; ids.add(String(it.id)); }
                } else { arr.push(remoto); ids.add(String(it.id)); }
                syncIdsSet(it.coleccion, ids);
            }
            await saveData();
            syncAplicando = false;
            syncLog('pull aplicó ' + r.items.length + ' items remotos', 'info');
            syncBarrerBasura();
            if (typeof renderCaminatas === 'function') renderCaminatas();
            if (typeof renderNotas === 'function') renderNotas();
            if (typeof renderDirectorio === 'function') renderDirectorio();
            if (typeof renderCalendario === 'function') renderCalendario();
            if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(() => { });
            if (typeof renderChat === 'function') renderChat();
            syncEstado('Datos actualizados desde el servidor', 'success');
        }
        localStorage.setItem('tribu_sync_ts', String(r.ahora || Date.now()));
    } catch (e) {
        syncLog('pull falló: ' + (e && e.message ? e.message : e), 'err');
        if (!completo) {   // reintento una vez antes de rendirse
            syncPullInFlight = false;
            await new Promise(r => setTimeout(r, 3000));
            return syncPull(true);
        }
        syncEstado('Error al bajar cambios — ' + (e && e.message ? e.message : e), 'warning');
        syncPullInFlight = false;
        return false;
    }
    syncPullInFlight = false;
    return true;
}

async function syncPullPaginado(completo) {
    const desde = completo ? 0 : syncUltimoTs();
    if (!completo) {   // incremental: 1 request chiquita con paginacion simple
        const items = [];
        let d = desde;
        for (let p = 0; p < 10; p++) {
            const r = await syncFetch('/pull?desde=' + d + '&limit=100', null, 60000);
            const lote = (r && r.items) || [];
            items.push(...lote);
            if (!r || !r.mas || !lote.length) break;
            d = lote[lote.length - 1].ts;
        }
        return { ok: true, items, ahora: Date.now() };
    }
    const items = [];
    for (const col of SYNC_COLLECTIONS.concat(['tmEventos'])) {
        let d = desde;
        for (let p = 0; p < 20; p++) {
            const r = await syncFetch('/pull?desde=' + d + '&coleccion=' + col + '&limit=80', null, 60000);
            const lote = (r && r.items) || [];
            items.push(...lote);
            if (!r || !r.mas || !lote.length) break;
            d = lote[lote.length - 1].ts;
        }
    }
    return { ok: true, items, ahora: Date.now() };
}

// Primera vez / reconexión: subir lo local y bajar lo del servidor
async function syncPullCompleto() {
    try { await syncPush(); } catch (e) { }
    try {
        const r = await syncFetch('/pull?desde=0', null, 60000);
        if (r.items && r.items.length) {
            syncAplicando = true;
            for (const it of r.items) {
                const arr = getColeccion(it.coleccion);
                if (!arr) { syncEncolarPendiente(it); continue; }
                if (it.borrado) continue;
                if (typeof it.data !== 'object' || !it.data || !Object.keys(it.data).length) continue;
                if (it.coleccion === 'notas' && !(it.data.titulo || '').trim() && !(it.data.contenido || '').trim()) continue;
                if ((it.coleccion === 'directorioPersonas' || it.coleccion === 'personasGlobales') && !(it.data.nombre || '').trim()) continue;
                if (!arr.find(x => String(x.id) === String(it.id))) arr.push({ id: it.id, ...it.data, _ts: it.ts, _por: it.autor || it.data._por });
            }
            await saveData();
            syncAplicando = false;
        }
        localStorage.setItem('tribu_sync_ts', String(r.ahora || Date.now()));
        syncEstado('Sincronización inicial lista', 'success');
    } catch (e) { console.warn(e); }
}

// ---- WebSocket (avisos en vivo) ------------------------------------------

function tmOpen() {
    return new Promise((res, rej) => {
        const rq = indexedDB.open('PagosAppDB');
        rq.onsuccess = () => res(rq.result);
        rq.onerror = () => rej(rq.error);
    });
}
async function syncPushTM() {
    if (!syncToken) return;
    try {
        const db = await tmOpen();
        if (!db.objectStoreNames.contains('eventos')) { db.close(); return; }
        const rows = await new Promise((res, rej) => {
            const out = [];
            const cur = db.transaction('eventos', 'readonly').objectStore('eventos').openCursor();
            cur.onsuccess = e => { const c = e.target.result; if (!c) return res(out); out.push({ key: c.key, data: c.value }); c.continue(); };
            cur.onerror = () => rej(cur.error);
        });
        db.close();
        const ts = Date.now();
        const actuales = new Set();
        const items = rows.map(r => {
            actuales.add(String(r.key));
            const d = r.data && typeof r.data === 'object' ? r.data : { valor: r.data };
            return { id: String(r.key), data: { ...d, _tmKey: r.key }, ts: d._ts || ts, borrado: 0 };
        });
        const conocidos = syncIdsGet('tmEventos');
        const eliminados = [...conocidos].filter(id => !actuales.has(id)).map(id => ({ id, borrado: true, ts }));
        if (items.length || eliminados.length) {
            await syncFetch('/push', { coleccion: 'tmEventos', items: [...items, ...eliminados] });
            syncIdsSet('tmEventos', actuales);
            if (items.length) syncLog('push tmEventos → ' + items.length + ' eventos', 'info');
        }
    } catch (e) { syncLog('push TM falló: ' + e.message, 'err'); }
}
async function tmMerge(it) {
    try {
        const db = await tmOpen();
        if (!db.objectStoreNames.contains('eventos')) { db.close(); return; }
        const st = db.transaction('eventos', 'readwrite').objectStore('eventos');
        await new Promise((res, rej) => {
            const get = st.get(it.id);
            get.onsuccess = () => {
                const local = get.result;
                const localTs = (local && local._ts) || 0;
                if (it.borrado) { if (local) st.delete(it.id); res(); return; }
                if (localTs <= it.ts) {
                    const d = it.data || {};
                    const val = { ...d }; delete val._tmKey;
                    if (st.keyPath) { val[st.keyPath] = local && local[st.keyPath] != null ? local[st.keyPath] : it.id; st.put(val); }
                    else st.put(val, it.id);
                }
                res();
            };
            get.onerror = () => rej(get.error);
        });
        db.close();
    } catch (e) { syncLog('merge TM falló: ' + e.message, 'err'); }
}

function chatTransmitir(item) {
    const msg = JSON.stringify({ tipo: 'chat', item });
    if (syncWS && syncWS.readyState === 1) syncWS.send(msg);
    syncFetch('/push', { coleccion: 'chat', items: [{ ...item, ts: Date.now() }] }).catch(() => syncLog('chat sin línea — pendiente', 'err'));
}
function enviarChat() {
    const inp = document.getElementById('chat-input');
    const txt = (inp.value || '').trim();
    if (!txt) return;
    const msg = { id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), de: syncCfg.usuario || 'YO', texto: txt, _ts: Date.now() };
    chatMensajes.push(msg);
    if (chatMensajes.length > 500) chatMensajes.shift();
    inp.value = '';
    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(() => { });
    renderChat();
    chatTransmitir({ id: msg.id, texto: msg.texto });
}
let chatFirma = '';
function renderChat() {
    const lista = document.getElementById('chat-lista');
    if (!lista) return;
    const firma = chatMensajes.length + ':' + (chatMensajes.length ? chatMensajes[chatMensajes.length - 1].id : '');
    if (firma === chatFirma) return;
    chatFirma = firma;
    const html = chatMensajes.slice().sort((a, b) => (a._ts || 0) - (b._ts || 0)).map(m => {
        const mio = String(m.de || '').toUpperCase() === String(syncCfg.usuario || '').toUpperCase() || m.de === 'YO';
        let cuerpo = '';
        if (m.archivo) {
            const t = (m.archivo.tipo || '').split('/')[0];
            if (t === 'image') cuerpo = '<img src="' + m.archivo.b64 + '" style="max-width:200px;border-radius:8px;display:block">';
            else if (t === 'video') cuerpo = '<video src="' + m.archivo.b64 + '" controls style="max-width:200px;border-radius:8px"></video>';
            else if (t === 'audio') cuerpo = '<audio src="' + m.archivo.b64 + '" controls style="max-width:200px"></audio>';
            else cuerpo = '<a href="' + m.archivo.b64 + '" download="' + String(m.archivo.nombre || 'archivo').replace(/"/g, '') + '" style="color:#93c5fd;text-decoration:underline">' + String(m.archivo.nombre || 'archivo').replace(/</g, '&lt;') + '</a>';
        } else if (m.nota) {
            cuerpo = '<div onclick="event.stopPropagation();verNotaCompartida(&quot;' + m.id + '&quot;)" style="cursor:pointer;border:1px solid rgba(255,255,255,.3);border-radius:8px;padding:8px;background:rgba(255,255,255,.06)">'
                + '<div style="font-weight:bold">📝 ' + String(m.nota.titulo || 'Nota').replace(/</g,'&lt;') + '</div>'
                + '<div style="font-size:.7rem;opacity:.8">Compartida por ' + String(m.nota.creadoPor || m.de || '?').replace(/</g,'&lt;') + ' — tocar para ver</div></div>';
        } else cuerpo = '<div>' + String(m.texto || '').replace(/</g, '&lt;').replace(/ %0A /g, '<br>') + '</div>';
        const del = mio ? ' <a href="#" onclick="event.preventDefault();borrarMensaje(&quot;' + m.id + '&quot;)" style="color:#f87171;font-size:.6rem">✕</a>' : '';
        return '<div style="margin:4px 0;text-align:' + (mio ? 'right' : 'left') + '">'
            + '<div style="display:inline-block;max-width:80%;background:' + (mio ? 'var(--primary-dark,#ea580c)' : '#333') + ';color:#fff;border-radius:12px;padding:6px 12px;font-size:.85rem;text-align:left">'
            + cuerpo
            + '<div style="font-size:.65rem;opacity:.75;font-weight:bold">' + String(m.de || '?').replace(/</g, '&lt;') + ' · ' + new Date(m._ts || 0).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' }) + del + '</div>'
            + '</div></div>';
    }).join('');
    lista.innerHTML = html || '<div style="color:#888;text-align:center;padding:12px">Sin mensajes — escribí el primero</div>';
    const irFinal = () => { lista.scrollTop = lista.scrollHeight; };
    irFinal();
    setTimeout(irFinal, 250);
    setTimeout(irFinal, 800);
}
function renderConectados() {
    const dot = document.getElementById('sync-online-dot');
    if (dot) dot.style.display = (syncToken && syncUsuarios.size) ? 'inline-block' : 'none';
    const el = document.getElementById('chat-online');
    if (!el) return;
    const lista = [...syncUsuarios];
    if (syncCfg.usuario) lista.unshift(syncCfg.usuario + ' (vos)');
    el.innerHTML = lista.length ? '🟢 ' + lista.map(u => String(u).replace(/</g, '&lt;')).join(' · ') : '⚪ Solo vos conectado';
}
async function adjuntarChat(inp) {
    const f = inp.files && inp.files[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { toastSync('Archivo muy grande (máx 8MB)'); inp.value = ''; return; }
    const b64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
    const msg0 = { id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), de: syncCfg.usuario || 'YO', texto: '', archivo: { nombre: f.name, tipo: f.type || 'application/octet-stream', b64 }, _ts: Date.now() };
    chatMensajes.push(msg0);
    inp.value = '';
    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(() => { });
    renderChat();
    chatTransmitir({ id: msg0.id, archivo: msg0.archivo });
}
function borrarMensaje(id) {
    const i = chatMensajes.findIndex(m => m.id === id);
    if (i < 0) return;
    chatMensajes.splice(i, 1);
    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(() => { });
    renderChat();
    chatTransmitir({ id, borrado: true });
}
function compartirTextoAlChat(texto) {
    if (!texto || !texto.trim()) return;
    const msg = { id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), de: syncCfg.usuario || 'YO', texto, _ts: Date.now() };
    chatMensajes.push(msg);
    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(() => { });
    renderChat();
    chatTransmitir({ id: msg.id, texto });
    toastSync('📤 Enviado al chat de la Tribu');
}
function compartirImagenAlChat(b64, nombre) {
    if (!b64) return;
    const msg = { id: 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6), de: syncCfg.usuario || 'YO', texto: '', archivo: { nombre: nombre || 'imagen.png', tipo: 'image/png', b64 }, _ts: Date.now() };
    chatMensajes.push(msg);
    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(() => { });
    renderChat();
    chatTransmitir({ id: msg.id, archivo: msg.archivo });
    toastSync('📤 Imagen enviada al chat');
}
function compartirNotaAlChat(id) {
    const n = (typeof notas !== 'undefined' ? notas : []).find(x => String(x.id) === String(id));
    if (!n) return;
    const plain = String(n.contenido || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
    compartirTextoAlChat('📝 ' + (n.titulo || 'Sin título') + ' %0A ' + plain + ' %0A — por ' + (n.creadoPor || n._por || syncCfg.usuario || '?'));
    toastSync('📤 Nota compartida al chat');
}
function verNotaCompartida(id) {
    const m = chatMensajes.find(x => x.id === id);
    if (!m || !m.nota) return;
    const ov = document.createElement('div');
    ov.id = 'nota-compartida-ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2500;background:#111;padding:calc(34px + 12px) 14px 14px;display:flex;flex-direction:column';
    ov.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
        + '<b style="color:#4ade80;font-size:1.05rem">📝 ' + String(m.nota.titulo).replace(/</g,'&lt;') + '</b>'
        + '<button onclick="document.getElementById(&quot;nota-compartida-ov&quot;).remove()" style="background:none;border:none;color:#fff;font-size:24px">×</button></div>'
        + '<div style="flex:1;overflow-y:auto;background:#fff;color:#222;border-radius:10px;padding:14px;font-size:.9rem">' + String(m.nota.contenido || '') + '</div>'
        + '<div style="padding:8px 4px;font-size:.7rem;color:#888">✍️ ' + String(m.nota.creadoPor).replace(/</g,'&lt;') + (m.nota.creada ? ' · ' + new Date(m.nota.creada).toLocaleString('es-CR') : '') + ' — solo lectura</div>';
    document.body.appendChild(ov);
}
function compartirCaminataAlChat(id) {
    const cam = (typeof caminatas !== 'undefined' ? caminatas : []).find(x => String(x.id) === String(id));
    if (!cam) return;
    const internos = ['id','ts','_ts','_por','borrado','nombre','modificadoPor','modificado','creadoPor','creada'];
    const plano = (o, pre) => {
        const out = [];
        for (const k of Object.keys(o || {})) {
            if (internos.includes(k)) continue;
            const v = o[k];
            if (v === null || v === undefined || String(v).trim() === '') continue;
            if (typeof v === 'object') out.push(...plano(v, pre + k + '.'));
            else out.push('• ' + (pre + k) + ': ' + String(v).replace(/</g,'&lt;'));
        }
        return out;
    };
    const lineas = ['🥾 ' + (cam.nombre || cam.actividad || 'Caminata'), ...plano(cam, '')];
    if (cam.creadoPor) lineas.push('— por ' + cam.creadoPor);
    compartirTextoAlChat(lineas.join(' %0A '));
}
function compartirEventoAlChat(evId) {
    const ev = (typeof calendarioCaminatas !== 'undefined' ? calendarioCaminatas : []).find(x => String(x.id) === String(evId));
    if (!ev) return;
    const lineas = ['📅 ' + (ev.nombre || 'Evento')];
    for (const k of Object.keys(ev)) {
        if (['id','caminataId','tipo','_ts','_por','nombre','modificadoPor'].includes(k)) continue;
        const v = ev[k];
        if (v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object') lineas.push(k + ': ' + String(v).replace(/</g,'&lt;'));
    }
    if (ev.creadoPor || ev._por) lineas.push('— por ' + (ev.creadoPor || ev._por));
    compartirTextoAlChat(lineas.join(' | '));
}
function compartirCalendarioAlChat() {
    const evs = (typeof calendarioCaminatas !== 'undefined' ? calendarioCaminatas : []).slice().sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||'')));
    const fest = (typeof diasFestivos !== 'undefined' ? diasFestivos : []).slice().sort((a,b)=>String(a.fecha||'').localeCompare(String(b.fecha||'')));
    const MESES = ['','enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    const out = ['📅 CALENDARIO DE LA TRIBU'];
    let mesAnt = '';
    evs.forEach(e => {
        const f = String(e.fecha || '');
        const my = f.slice(0, 7);
        if (my !== mesAnt && my.length >= 6) { mesAnt = my; const m = MESES[+my.slice(5)] || my; out.push('── ' + m.toUpperCase() + ' ' + my.slice(0,4) + ' ──'); }
        const dia = f.slice(8);
        out.push('• ' + dia + ' · ' + (e.nombre || 'Evento') + (e.fechaFin && e.fechaFin !== e.fecha ? ' → ' + e.fechaFin : ''));
        for (const k of Object.keys(e)) {
            if (['id','ts','_ts','_por','borrado','nombre','fecha','fechaFin','caminataId','tipo','creadoPor','creada','modificado','modificadoPor'].includes(k)) continue;
            const v = e[k];
            if (v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object') out.push('   ' + k + ': ' + String(v).replace(/</g,'&lt;'));
        }
    });
    if (fest.length) { out.push('🚩 DÍAS FESTIVOS:'); fest.forEach(f => out.push('• ' + (f.fecha||'?') + ' · ' + (f.nombre||f.descripcion||''))); }
    if (out.length === 1) out.push('(sin eventos)');
    compartirTextoAlChat(out.join(' %0A '));
}
async function compartirEventosTMAlChat() {
    try {
        const db = await tmOpen();
        if (!db.objectStoreNames.contains('eventos')) { db.close(); return; }
        const rows = await new Promise((res) => { const out=[]; const cur=db.transaction('eventos','readonly').objectStore('eventos').openCursor(); cur.onsuccess=e=>{const c=e.target.result; if(!c)return res(out); out.push(c.value); c.continue();}; });
        db.close();
        if (!rows.length) { toastSync('No hay eventos guardados'); return; }
        const out = ['📊 EVENTOS TABLA MÁGICA (' + rows.length + ')'];
        rows.forEach(ev => {
            out.push('━━ ' + (ev.nombre || ev.nombreEvento || 'Evento'));
            for (const k of Object.keys(ev)) {
                if (['id','_ts','_por','nombre','nombreEvento'].includes(k)) continue;
                const v = ev[k];
                if (v !== null && v !== undefined && String(v).trim() !== '' && typeof v !== 'object') out.push('  ' + k + ': ' + String(v).replace(/</g,'&lt;'));
            }
        });
        compartirTextoAlChat(out.join(' %0A '));
    } catch (e) { toastSync('No pude leer los eventos TM'); }
}
function compartirContactoAlChat(id) {
    const c = (typeof directorioPersonas !== 'undefined' ? directorioPersonas : []).find(x => String(x.id) === String(id));
    if (!c) return;
    const internos = ['id','ts','_ts','_por','borrado','nombre','modificadoPor','modificado','creadoPor','creada'];
    const fijo = (k, et) => {
        const v = c[k];
        return '• ' + et + ': ' + ((v !== null && v !== undefined && String(v).trim() !== '') ? String(v).replace(/</g,'&lt;') : '—');
    };
    const lineas = ['👤 ' + (c.nombre || 'Contacto'),
        fijo('cedula', 'Cédula'), fijo('pasaporte', 'Pasaporte'), fijo('fechaNacimiento', 'Nacimiento'),
        fijo('tipoSangre', 'Tipo de sangre'), fijo('nivelCaminante', 'Nivel de caminante'), fijo('telefono', 'Teléfono'),
        fijo('correo', 'Correo'), fijo('contactoEmergencia', 'Contacto emergencia'), fijo('telefonoEmergencia', 'Tel. emergencia'),
        fijo('notas', 'Notas')];
    const vistos = new Set(internos.concat(['cedula','pasaporte','fechaNacimiento','tipoSangre','nivelCaminante','telefono','correo','contactoEmergencia','telefonoEmergencia','notas']));
    for (const k of Object.keys(c)) {
        if (vistos.has(k)) continue;
        const v = c[k];
        if (v === null || v === undefined || typeof v === 'object' || String(v).trim() === '') continue;
        lineas.push('• ' + k + ': ' + String(v).replace(/</g,'&lt;'));
    }
    const nom = String(c.nombre || '').trim().toUpperCase();
    const enCam = (cam) => ['caminantes','personas','lista','participantes','inscritos'].some(f => (cam[f] || []).some(x => String(x.id) === String(c.id) || String(x.nombre || '').toUpperCase() === nom));
    const pert = (typeof caminatas !== 'undefined' ? caminatas : []).filter(enCam);
    const retiros = (typeof historialRetiros !== 'undefined' ? historialRetiros : []).filter(r => String(r.personaId || '') === String(c.id) || String(r.nombre || '').toUpperCase() === nom || String(r.caminante || '').toUpperCase() === nom);
    const asist = (typeof historialAsistencia !== 'undefined' ? historialAsistencia : []).filter(r => String(r.personaId || '') === String(c.id) || String(r.nombre || '').toUpperCase() === nom || String(r.caminante || '').toUpperCase() === nom);
    lineas.push('— RESUMEN —');
    lineas.push('• Caminatas inscrito: ' + pert.length);
    if (pert.length) pert.forEach(cam => lineas.push('   › ' + (cam.nombre || cam.actividad || 'Caminata')));
    lineas.push('• Participaciones: ' + asist.length);
    lineas.push('• Retiros: ' + retiros.length);
    if (c.creadoPor) lineas.push('— por ' + c.creadoPor);
    compartirTextoAlChat(lineas.join(' %0A '));
}
// interceptar descargas PNG desde el iframe de Tabla Mágica → van al chat también
setTimeout(() => {
    try {
        const f = document.getElementById('frameTablaMagica');
        if (!f || !f.contentWindow) return;
        const orig = f.contentWindow.HTMLAnchorElement.prototype.click;
        f.contentWindow.HTMLAnchorElement.prototype.click = function () {
            try { if (this.href && this.href.startsWith('data:image') && this.download) compartirImagenAlChat(this.href, this.download); } catch (e) { }
            return orig.apply(this, arguments);
        };
    } catch (e) { }
}, 5000);
function vaciarChat() {
    if (!confirm('¿Eliminar TODA la conversación? Se borra en TODOS los dispositivos.')) return;
    chatMensajes.length = 0; chatFirma = '';
    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(()=>{});
    renderChat();
    const items = chatMensajes.map(m => ({ id: m.id, borrado: true, ts: Date.now() }));
    if (items.length) syncFetch('/push', { coleccion: 'chat', items }).catch(() => { });
}
function verConsolaChat() {
    let ov = document.getElementById('chat-log-overlay');
    if (ov) { ov.remove(); return; }
    const src = document.getElementById('sync-log');
    ov = document.createElement('div');
    ov.id = 'chat-log-overlay';
    ov.style.cssText = 'position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.9);padding:calc(34px + 8px) 14px 14px;display:flex;flex-direction:column';
    ov.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><b style="color:#4ade80">📋 Consola de eventos</b><button onclick="verConsolaChat()" style="background:none;border:none;color:#fff;font-size:24px">×</button></div>'
        + '<div style="flex:1;overflow-y:auto;font-family:monospace;font-size:.72rem;color:#0f0;background:#111;border:1px solid #333;border-radius:8px;padding:8px">'
        + (src ? src.innerHTML : 'sin log')
        + '</div>';
    document.body.appendChild(ov);
}
function toggleChat() {
    const p = document.getElementById('chat-panel');
    if (!p) return;
    const abierto = p.style.display === 'flex';
    p.style.display = abierto ? 'none' : 'flex';
    if (!abierto) { chatNoLeidos = 0; renderBadgeChat(); renderChat(); renderConectados(); if (syncToken) syncFetch('/online').then(j => { (j.usuarios||[]).forEach(u=>syncUsuarios.add(u)); renderConectados(); }).catch(()=>{}); }
}
if (typeof localforage !== 'undefined') localforage.getItem('tribu_chat').then(v => { if (Array.isArray(v)) { chatMensajes.length = 0; chatMensajes.push(...v); } }).catch(() => { });

function syncBarrerBasura() {
    let quitados = 0;
    for (const col of SYNC_COLLECTIONS) {
        const arr = getColeccion(col);
        if (!arr) continue;
        const antes = arr.length;
        const vistosId = new Set(), vistosContenido = new Set();
        const limpios = arr.filter(x => {
            if (!x || typeof x !== 'object' || !x.id) return false;
            if (col === 'notas' && !(x.titulo || '').trim() && !(x.contenido || '').trim()) return false;
            if ((col === 'directorioPersonas' || col === 'personasGlobales') && !(x.nombre || '').trim()) return false;
            const iid = String(x.id);
            if (vistosId.has(iid)) return false; vistosId.add(iid);
            const clave = col === 'notas' ? (x.titulo || '').trim() + '|' + (x.contenido || '').trim().slice(0, 80)
                : (x.nombre || x.titulo || '').trim();
            if (clave && vistosContenido.has(clave)) return false; vistosContenido.add(clave);
            return true;
        });
        if (limpios.length !== antes) { arr.length = 0; arr.push(...limpios); quitados += antes - limpios.length; }
    }
    if (quitados) { saveData().catch(() => { }); syncLog('barrido local: ' + quitados + ' basura eliminada', 'success'); if (typeof renderNotas === 'function') renderNotas(); if (typeof renderDirectorio === 'function') renderDirectorio(); }
}

function syncIniciarWatchdog() {
    if (syncWatchdog) return;
    syncWatchdog = setInterval(async () => {
        if (!syncToken && syncCfg.usuario && syncCfg.clave) {
            syncLog('watchdog: sin sesión — auto-reconectando…', 'warning');
            try {
                const j = await syncFetch('/login', { usuario: syncCfg.usuario, clave: syncCfg.clave });
                if (j.token) { syncToken = j.token; localStorage.setItem('tribu_sync_token', j.token); syncTokens[syncActivoURL || syncURL()] = j.token; syncAbrirWS(); syncEstado('Reconectado como ' + syncCfg.usuario, 'success'); }
            } catch (e) { syncLog('watchdog: aún sin línea', 'err'); }
        }
        if (syncActivoURL && syncCfg.servidorPreferido !== 'pythonanywhere' && syncActivoURL === syncURLNube()) {
            try { const r = await fetch(syncURL() + '/ping'); if (r.ok && syncActivoURL !== syncURL()) { syncActivoURL = syncURL(); syncFallos = 0; syncLog('Tailscale volvió — regreso automático', 'success'); } } catch (e) { }
        }
        if (syncToken && syncRetryQueue.length) {
            const cols = [...new Set(syncRetryQueue)]; syncRetryQueue = [];
            syncLog('reintentando push pendiente: ' + cols.join(', '), 'warning');
            syncPush();
        }
    }, 30000);
    setInterval(() => {
        if (syncToken && !document.hidden && navigator.onLine && !syncPullInFlight) syncPull();
    }, 5000);
}

function syncAbrirWS() {
    if (syncWS) syncWS.close();
    const base = syncURL().replace(/^http/, 'ws').replace(/\/$/, '');
    try {
        if (syncPoll) { clearInterval(syncPoll); syncPoll = null; }
        syncWS = new WebSocket(base + '/ws?token=' + syncToken);
        syncWS.onopen = () => syncLog('WS en vivo abierto', 'success');
        syncWS.onmessage = (ev) => {
            let m = null;
            try { m = JSON.parse(ev.data); } catch (e) { }
            if (m && m.tipo === 'conexion') {
                if (m.usuario) { syncUsuarios.add(m.usuario); renderConectados(); }
                if (m.usuario && m.usuario !== syncCfg.usuario) toastSync('🔔 ' + m.usuario + ' se ha conectado a la aplicación');
                return;
            }
            if (m && m.tipo === 'desconexion') {
                if (m.usuario) { syncUsuarios.delete(m.usuario); renderConectados(); }
                if (m.usuario && m.usuario !== syncCfg.usuario) toastSync('⏸ ' + m.usuario + ' se desconectó');
                return;
            }
            if (m && m.tipo === 'items' && Array.isArray(m.items) && m.coleccion) {
                const arr = getColeccion(m.coleccion);
                if (arr) {
                    let camb = 0;
                    syncAplicando = true;
                    for (const it of m.items) {
                        const idx = arr.findIndex(x => String(x.id) === String(it.id));
                        if (it.borrado) { if (idx >= 0) { arr.splice(idx, 1); camb++; } continue; }
                        if (typeof it.data !== 'object' || !it.data || !Object.keys(it.data).length) continue;
                        if (m.coleccion === 'notas' && !(it.data.titulo || '').trim() && !(it.data.contenido || '').trim()) continue;
                        const remoto = { id: it.id, ...it.data, _ts: it.ts || Date.now(), _por: it.autor || it.data._por };
                        if (idx >= 0) { if ((arr[idx]._ts || 0) <= remoto._ts) { arr[idx] = remoto; camb++; } }
                        else { arr.push(remoto); camb++; }
                        if (camb) { const ids = syncIdsGet(m.coleccion); ids.add(String(it.id)); syncIdsSet(m.coleccion, ids); }
                    }
                    if (camb) { saveData().catch(() => { });
                        if (typeof renderCaminatas === 'function') renderCaminatas();
                        if (typeof renderNotas === 'function') renderNotas();
                        if (typeof renderDirectorio === 'function') renderDirectorio();
                        if (typeof renderCalendario === 'function') renderCalendario();
                    }
                    syncAplicando = false;
                    syncLog('WS items → ' + m.coleccion + ': ' + camb + ' aplicados', 'info');
                }
                return;
            }
            if (m && m.tipo === 'item' && m.item && m.coleccion) {
                const it = m.item;
                const arr = getColeccion(m.coleccion);
                if (arr) {
                    const idx = arr.findIndex(x => String(x.id) === String(it.id));
                    if (it.borrado) { if (idx >= 0) arr.splice(idx, 1); }
                    else if (it.data || it.id) {
                        const remoto = { id: it.id, ...(it.data || it), _ts: it.ts || Date.now(), _por: it.autor || (it.data || it)._por };
                        if (idx >= 0) { if ((arr[idx]._ts || 0) <= remoto._ts) arr[idx] = remoto; }
                        else arr.push(remoto);
                    }
                    saveData().catch(() => { });
                    if (typeof renderCaminatas === 'function') renderCaminatas();
                    if (typeof renderNotas === 'function') renderNotas();
                    if (typeof renderDirectorio === 'function') renderDirectorio();
                    if (typeof renderCalendario === 'function') renderCalendario();
                }
                return;
            }
            if (m && m.tipo === 'chat' && m.item) {
                const it = m.item;
                if (it.borrado) { const i = chatMensajes.findIndex(x => x.id === it.id); if (i >= 0) { chatMensajes.splice(i, 1); if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(()=>{}); renderChat(); } }
                else if (!chatMensajes.find(x => x.id === it.id)) {
                    chatMensajes.push({ id: it.id, de: it.de, texto: it.texto, archivo: it.archivo, _ts: it.ts || Date.now() });
                    if (typeof localforage !== 'undefined') localforage.setItem('tribu_chat', chatMensajes).catch(()=>{});
                    renderChat();
                    const pp = document.getElementById('chat-panel');
                    if ((!pp || pp.style.display !== 'flex') && it.de !== syncCfg.usuario) { chatNoLeidos++; renderBadgeChat(); toastSync('💬 ' + (it.de || '?') + ': ' + String(it.texto || (it.archivo ? '📎 ' + it.archivo.nombre : '')).slice(0, 60)); }
                }
                return;
            }
            syncLog('WS avisó cambio remoto', 'warning');
            syncPull();
        };
        syncWS.onclose = () => { syncLog('WS cerrado — reintento en 10s', 'warning'); if (syncToken && !syncWSReintenta) { syncWSReintenta = true; setTimeout(() => { syncWSReintenta = false; syncAbrirWS(); }, 10000); } };
        syncIniciarWatchdog();
        if (!syncPoll) syncPoll = setInterval(async () => {
            if (!syncToken) return;
            const preferido = syncCfg.servidorPreferido === 'pythonanywhere' ? syncURLNube() : syncURL();
            if (syncActivoURL && syncActivoURL !== preferido) {
                try { const r = await fetch(preferido + '/ping'); if (r.ok && syncActivoURL !== preferido) { syncActivoURL = preferido; syncFallos = 0; syncLog('preferido volvió — regreso automático', 'success'); } } catch (e) { }
            }
            syncPull();
        }, 60000);
    } catch (e) { console.warn('ws', e); }
}

async function syncProbar() {
    syncLeerCampos();
    syncEstado('Probando ' + syncURL() + ' …', 'muted');
    const t0 = Date.now();
    try {
        const r = await fetch(syncURL() + '/ping');
        const j = await r.json();
        const ms = Date.now() - t0;
        if (!j.ok) throw new Error('respuesta rara');
        let sesion = 'sin sesión (registrá/conectá)';
        if (syncToken) {
            try { await syncFetch('/pull?desde=0'); sesion = 'sesión válida'; }
            catch (e) { sesion = 'sesión vencida — conectá de nuevo'; }
        }
        syncEstado('En línea ✓ ' + ms + 'ms — ' + sesion, 'success');
    } catch (e) {
        syncEstado('Sin línea — no responde ' + syncURL(), 'danger');
    }
}

async function descargarServidorBat() {
    syncEstado('Preparando instalador…', 'muted');
    let blob = null;
    try {
        const rz = await fetch('vendor/instalador-offline.zip');
        if (rz.ok) { blob = await rz.blob(); blob._nom = 'instalador-offline.zip'; }
    } catch (e) { }
    if (!blob) try {
        const r = await fetch('vendor/instalar-servidor.bat');
        if (r.ok) blob = await r.blob();
    } catch (e) { /* abajo va el plan B */ }
    if (!blob) {
        try {
            const r2 = await fetch(syncURL() + '/instalar-servidor.bat');
            if (r2.ok) blob = await r2.blob();
        } catch (e) { }
    }
    if (!blob) {
        window.open(syncURL() + '/instalar-servidor.bat', '_blank');
        syncEstado('Abriendo descarga en el navegador…', 'warning');
        return;
    }
    try {
        const nombre = blob._nom || 'instalar-servidor.bat';
        // En la APK: escribir en documentos y compartir (WhatsApp, Drive, etc.)
        const ShareNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Share'));
        const FilesystemNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Filesystem) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Filesystem'));
        if (ShareNativo && FilesystemNativo) {
            const b64 = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result).split(',')[1]); rd.onerror = rej; rd.readAsDataURL(blob); });
            const escrito = await FilesystemNativo.writeFile({ path: nombre, data: b64, directory: 'DOCUMENTS', recursive: true });
            await ShareNativo.share({ title: 'Instalador AgendaTribu Sync', text: 'Ejecutá este .bat en la PC que hará de servidor (necesita Node.js + Tailscale)', files: [escrito.uri], dialogTitle: 'Enviar instalador' });
            syncEstado('Instalador listo para compartir', 'success');
            return;
        }
        // Navegador: descarga directa
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
        URL.revokeObjectURL(a.href);
        syncEstado('instalar-servidor.bat descargado', 'success');
    } catch (e) { syncEstado('Error: ' + e.message, 'danger'); }
}

async function descargarInstaladorBat() {
    syncEstado('Bajando instalador .bat…', 'muted');
    try {
        let blob = null;
        try { const r = await fetch('vendor/instalar-servidor.bat'); if (r.ok) blob = await r.blob(); } catch (e) {}
        if (!blob) { const r2 = await fetch(syncURL() + '/instalar-servidor.bat'); blob = await r2.blob(); }
        const ShareNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Share'));
        const FilesystemNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Filesystem) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Filesystem'));
        if (ShareNativo && FilesystemNativo) {
            const b64 = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result).split(',')[1]); rd.onerror = rej; rd.readAsDataURL(blob); });
            const escrito = await FilesystemNativo.writeFile({ path: 'instalar-servidor.bat', data: b64, directory: 'DOCUMENTS', recursive: true });
            await ShareNativo.share({ title: 'Instalador AgendaTribu', files: [escrito.uri], dialogTitle: 'Enviar instalador' });
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = 'instalar-servidor.bat'; a.click();
            URL.revokeObjectURL(a.href);
        }
        syncEstado('instalar-servidor.bat listo', 'success');
    } catch (e) { syncEstado('Error: ' + e.message, 'danger'); }
}

async function descargarWsgiApp() {
    syncEstado('Bajando wsgi_app.py…', 'muted');
    try {
        let blob = null;
        try { const r = await fetch('vendor/wsgi_app.py'); if (r.ok) blob = await r.blob(); } catch (e) {}
        if (!blob) { const r2 = await fetch(syncURL() + '/wsgi_app.py'); blob = await r2.blob(); }
        const ShareNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Share'));
        const FilesystemNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Filesystem) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Filesystem'));
        if (ShareNativo && FilesystemNativo) {
            const b64 = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result).split(',')[1]); rd.onerror = rej; rd.readAsDataURL(blob); });
            const escrito = await FilesystemNativo.writeFile({ path: 'wsgi_app.py', data: b64, directory: 'DOCUMENTS', recursive: true });
            await ShareNativo.share({ title: 'Servidor PythonAnywhere', files: [escrito.uri], dialogTitle: 'Enviar wsgi_app.py' });
        } else {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = 'wsgi_app.py'; a.click();
            URL.revokeObjectURL(a.href);
        }
        syncEstado('wsgi_app.py listo', 'success');
    } catch (e) { syncEstado('Error: ' + e.message, 'danger'); }
}

async function syncProbarNube() {
    syncEstado('Ping a PythonAnywhere…', 'muted');
    const t0 = performance.now();
    try {
        const r = await fetch(syncURLNube() + '/ping');
        const ms = Math.round(performance.now() - t0);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        const j = await r.json();
        if (!j.ok) throw new Error('respuesta inválida');
        // pedir también el marcador de conexión
        let marca = '';
        try { marca = ' — ' + (await (await fetch(syncURLNube() + '/conexion.txt')).text()).split('\n')[0]; } catch (e) { }
        syncEstado('Nube en línea ✓ ' + ms + 'ms', 'success');
        syncLog('ping PythonAnywhere ' + ms + 'ms' + marca, 'success');
    } catch (e) {
        syncEstado('Nube sin línea — ' + e.message, 'danger');
        syncLog('ping PythonAnywhere falló: ' + e.message, 'err');
    }
}

async function syncVerificarAmbos() {
    syncEstado('Verificando ambos servidores…', 'muted');
    async function probar(nombre, base) {
        const t0 = performance.now();
        try {
            const r = await fetch(base.replace(/\/$/, '') + '/ping');
            const ms = Math.round(performance.now() - t0);
            if (!r.ok) return nombre + ': HTTP ' + r.status;
            return nombre + ': ✓ ' + ms + 'ms';
        } catch (e) { return nombre + ': ✗ sin línea'; }
    }
    const [a, b] = await Promise.all([probar('A Tailscale', syncURL()), probar('B Nube', syncURLNube())]);
    syncLog(a, a.includes('✓') ? 'success' : 'err');
    syncLog(b, b.includes('✓') ? 'success' : 'err');
    syncEstado(a + ' · ' + b, a.includes('✓') || b.includes('✓') ? 'success' : 'danger');
}

async function descargarPlantilla() {
    syncEstado('Bajando plantilla…', 'muted');
    try {
        let blob = null;
        try { const r = await fetch('vendor/plantilla-tribu.zip'); if (r.ok) blob = await r.blob(); } catch (e) {}
        const ShareNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Share'));
        const FilesystemNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Filesystem) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Filesystem'));
        if (ShareNativo && FilesystemNativo && blob) {
            const b64 = await new Promise((res, rej) => { const rd = new FileReader(); rd.onload = () => res(String(rd.result).split(',')[1]); rd.onerror = rej; rd.readAsDataURL(blob); });
            const escrito = await FilesystemNativo.writeFile({ path: 'plantilla-tribu.zip', data: b64, directory: 'DOCUMENTS', recursive: true });
            await ShareNativo.share({ title: 'Plantilla Tribu', files: [escrito.uri], dialogTitle: 'Enviar plantilla' });
        } else if (blob) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob); a.download = 'plantilla-tribu.zip'; a.click();
            URL.revokeObjectURL(a.href);
        }
        syncEstado('plantilla-tribu.zip lista', 'success');
    } catch (e) { syncEstado('Error: ' + e.message, 'danger'); }
}

async function syncActualizarEnlaces() {
    syncLog('Verificando enlaces de descarga…', 'warning');
    // Node: versión LTS más reciente vs la que usa el instalador
    try {
        const r = await fetch('https://nodejs.org/dist/index.json');
        const v = (await r.json()).find(x => x.lts);
        syncLog('Node.js instalado en paquete: v24.18.1 · último LTS: ' + (v ? v.version : '?'), 'success');
    } catch (e) { syncLog('nodejs.org no respondió — ' + e.message, 'err'); }
    // Tailscale: enlace del instalador
    try {
        const r2 = await fetch('https://pkgs.tailscale.com/stable/tailscale-setup-latest-amd64.msi', { method: 'HEAD' });
        syncLog('Tailscale setup: enlace ' + (r2.ok ? 'vivo ✓' : 'HTTP ' + r2.status), r2.ok ? 'success' : 'err');
    } catch (e) { syncLog('Tailscale: ' + e.message, 'err'); }
    // páginas oficiales
    syncLog('Páginas: nodejs.org/es/download · tailscale.com/download', 'info');
    syncEstado('Enlaces verificados', 'muted');
}

async function syncListaUsuarios() {
    const box = document.getElementById('sync-usuarios-list');
    try {
        const j = await syncFetch('/usuarios');
        if (box) box.innerHTML = (j.usuarios || []).map(u =>
            '<div style="display:flex;align-items:center;gap:4px;padding:4px 0;border-bottom:1px solid #222;font-size:.75rem">'
            + '<span style="flex:1;color:' + (u.bloqueado ? '#f87171' : '#eee') + '">' + u.usuario + (u.admin ? ' ⭐' : '') + (u.bloqueado ? ' 🚫' : '') + '</span>'
            + (u.admin ? '' : '<button onclick="syncBloquear(&quot;' + u.usuario + '&quot;,' + (u.bloqueado ? 0 : 1) + ')" style="font-size:.65rem;padding:2px 8px;border-radius:6px;border:1px solid #facc15;background:none;color:#facc15;cursor:pointer">' + (u.bloqueado ? 'Desbloquear' : 'Bloquear') + '</button>'
            + '<button onclick="syncEliminarUsuario(&quot;' + u.usuario + '&quot;)" style="font-size:.65rem;padding:2px 8px;border-radius:6px;border:1px solid #f87171;background:none;color:#f87171;cursor:pointer">✕</button>')
            + '</div>').join('') || '<span style="color:#666">—</span>';
        syncLog('usuarios listados: ' + (j.usuarios || []).length, 'info');
    } catch (e) { if (box) box.innerHTML = '<span style="color:#f87171">' + e.message + '</span>'; }
}
async function syncAgregarUsuario() {
    const u = document.getElementById('sync-nuevo-usuario').value.trim().toUpperCase();
    const c = document.getElementById('sync-nuevo-clave').value.toUpperCase();
    if (!u || !c) { syncEstado('Escribí usuario y clave', 'warning'); return; }
    try { await syncFetch('/registro', { usuario: u, clave: c }); syncLog('usuario agregado: ' + u, 'success'); document.getElementById('sync-nuevo-usuario').value = ''; document.getElementById('sync-nuevo-clave').value = ''; syncListaUsuarios(); }
    catch (e) { syncEstado('No agregó: ' + e.message, 'danger'); }
}
async function syncBloquear(u, b) {
    try { await syncFetch('/bloquear', { usuario: u, bloqueado: b }); syncLog(u + (b ? ' bloqueado' : ' desbloqueado'), 'warning'); syncListaUsuarios(); }
    catch (e) { syncEstado('No bloqueó: ' + e.message, 'danger'); }
}
async function syncEliminarUsuario(u) {
    if (!confirm('¿Eliminar a ' + u + '? Pierde acceso para siempre.')) return;
    try { await syncFetch('/eliminar-usuario', { usuario: u }); syncLog(u + ' eliminado', 'err'); syncListaUsuarios(); }
    catch (e) { syncEstado('No eliminó: ' + e.message, 'danger'); }
}

async function syncRestaurarTodo() {
    syncEstado('Restaurando todo desde el servidor…', 'warning');
    localStorage.setItem('tribu_sync_ts', '0');
    try {
        const r = await syncFetch('/pull?desde=0');
        if (r.items && r.items.length) {
            syncAplicando = true;
            for (const it of r.items) {
                if (it.coleccion === 'tmEventos') { tmMerge(it); continue; }
                const arr = getColeccion(it.coleccion);
                if (!arr) { syncEncolarPendiente(it); continue; }
                const idx = arr.findIndex(x => String(x.id) === String(it.id));
                if (it.borrado) { if (idx >= 0) arr.splice(idx, 1); continue; }
                if (typeof it.data !== 'object' || !it.data || !Object.keys(it.data).length) continue;
                if (it.coleccion === 'notas' && !(it.data.titulo || '').trim() && !(it.data.contenido || '').trim()) continue;
                if ((it.coleccion === 'directorioPersonas' || it.coleccion === 'personasGlobales') && !(it.data.nombre || '').trim()) continue;
                const remoto = { id: it.id, ...it.data, _ts: it.ts, _por: it.autor || it.data._por };
                if (idx >= 0) { if ((arr[idx]._ts || 0) <= it.ts) arr[idx] = remoto; }
                else arr.push(remoto);
            }
            await saveData();
            syncAplicando = false;
            if (typeof renderCaminatas === 'function') renderCaminatas();
            if (typeof renderNotas === 'function') renderNotas();
            if (typeof renderDirectorio === 'function') renderDirectorio();
            if (typeof renderCalendario === 'function') renderCalendario();
            syncEstado('Restaurado: ' + r.items.length + ' items del servidor', 'success');
        } else syncEstado('Servidor sin datos nuevos', 'muted');
    } catch (e) { syncEstado('Restaurar falló: ' + e.message, 'danger'); }
}

async function compartirLogSync() {
    const log = document.getElementById('sync-log');
    const texto = 'SYNC LOG — ' + new Date().toLocaleString('es-CR') + String.fromCharCode(10,10) + (log ? log.innerText : '(sin log)');
    const ShareNativo = (window.Capacitor && Capacitor.Plugins && Capacitor.Plugins.Share) || (window.Capacitor && Capacitor.registerPlugin && Capacitor.registerPlugin('Share'));
    try {
        if (ShareNativo) {
            await ShareNativo.share({ title: 'Log sincronización', text: texto, dialogTitle: 'Compartir log de conectividad' });
        } else {
            window.open('https://wa.me/?text=' + encodeURIComponent(texto.substring(0, 7000)), '_blank');
        }
        syncLog('log compartido', 'info');
    } catch (e) {
        try { await navigator.clipboard.writeText(texto); syncEstado('Log copiado al portapapeles', 'muted'); }
        catch (_) { syncEstado('Error compartiendo: ' + e.message, 'danger'); }
    }
}

function syncDesconectar() {
    syncToken = ''; localStorage.removeItem('tribu_sync_token');
    syncTokens = {}; syncRetryQueue = [];
    if (syncWS) syncWS.close();
    if (syncWatchdog) { clearInterval(syncWatchdog); syncWatchdog = null; }
    syncEstado('Desconectado — datos solo locales', 'muted');
}

// ---- Arranque ------------------------------------------------------------

function syncLeerCampos() {
    syncCfg.maquina = (document.getElementById('sync-maquina').value || SYNC_MAQUINA_DEFECTO).trim();
    syncCfg.tailnet = (document.getElementById('sync-tailnet').value || SYNC_TAILNET_DEFECTO).trim();
    const srv = document.querySelector('input[name="sync-servidor"]:checked');
    syncCfg.servidorPreferido = srv ? srv.value : 'tailscale';
    const nb = document.getElementById('sync-nube');
    if (nb) syncCfg.nube = (nb.value || SYNC_NUBE_DEFECTO).trim();
    syncActivoURL = '';
    syncGuardarCfg();
    const r = document.getElementById('sync-url-res');
    if (r) r.textContent = syncURL();
}

function initSync() {
    const elM = document.getElementById('sync-maquina');
    if (elM) {
        elM.value = syncCfg.maquina;
        document.getElementById('sync-tailnet').value = syncCfg.tailnet;
        document.getElementById('sync-usuario').value = syncCfg.usuario || '';
        const nb = document.getElementById('sync-nube'); if (nb) nb.value = syncCfg.nube || SYNC_NUBE_DEFECTO;
        const r = document.getElementById(syncCfg.servidorPreferido === 'pythonanywhere' ? 'sync-srv-pa' : 'sync-srv-ts');
        if (r) r.checked = true;
        document.getElementById('sync-clave').value = syncCfg.clave || '';
        syncLeerCampos();
        elM.addEventListener('input', syncLeerCampos);
        document.getElementById('sync-tailnet').addEventListener('input', syncLeerCampos);
    }
    syncLog('sync.js cargado — ' + syncURL(), 'success');
    if (syncCfg.usuario && syncCfg.clave) syncIniciarWatchdog();
    if (syncToken && syncCfg.maquina) {
        syncAbrirWS();
        syncEstado('Reconectando…', 'muted');
        setTimeout(syncBarrerBasura, 4000);
        syncPull(true).then(ok => {
            if (ok && syncToken) syncEstado('Conectado como ' + syncCfg.usuario + ' — sincronizado', 'success');
            else syncEstado('Sin línea — reintenta con Conectar', 'warning');
        }).catch(() => {
            syncEstado('Sin línea — reintenta con Conectar', 'warning');
        });
    }
    // hook: cada saveData empuja al servidor
    try {
        const original = saveData;
        if (typeof original === 'function') {
            saveData = async function () { const r = await original.apply(this, arguments); syncEncolarPush(); return r; };
        }
    } catch (e) { console.warn('hook saveData', e); }
}
