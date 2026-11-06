// ============================================================================
// ARCHIVO: js/ota_mock.js — ARNES DE PRUEBA del OTA, SOLO navegador.
//   En el APK window.Capacitor ya existe → este archivo retorna y NO hace
//   nada (inerte en el telefono). En el navegador define la MISMA API de
//   los plugins nativos para probar el sistema OTA de verdad:
//     · CapacitorHttp.get    → fetch real al servidor OTA del PC
//     · CapacitorUpdater.download → fetch real del bundle.zip + verifica el
//       SHA-256 con WebCrypto (la misma exigencia del plugin nativo)
//     · CapacitorUpdater.set/next/reset → recarga la pagina (= conmutar el
//       bundle, que es lo que hace el plugin tras aplicar)
//     · TribuOta.addListener → guarda listeners; __otaFire(ev,d) los dispara
//   Lo UNICO simulado es el puente nativo: todo el flujo de ota.js (poller,
//   pull, modal, sello) corre con su codigo real.
// ============================================================================
(function () {
    'use strict';
    if (window.Capacitor) return;                  // en el telefono: inerte
    var KEY = 'tribu_ota_url';
    try {
        if (!localStorage.getItem(KEY))
            localStorage.setItem(KEY,
                'http://' + location.hostname + ':8789/bundle.zip');
    } catch (e) {}
    var listeners = {};
    function sha256hex(buf) {
        if (!crypto.subtle) {
            console.warn('[OTA-mock] sin WebCrypto — checksum no verificado');
            return Promise.resolve(null);
        }
        return crypto.subtle.digest('SHA-256', buf).then(function (h) {
            return Array.from(new Uint8Array(h)).map(function (b) {
                return b.toString(16).padStart(2, '0');
            }).join('');
        });
    }
    window.Capacitor = { Plugins: {
        CapacitorHttp: {
            get: function (o) {
                return fetch(o.url)
                    .then(function (r) { return r.json(); })
                    .then(function (d) { return { data: d }; });
            }
        },
        TribuOta: {
            addListener: function (ev, cb) {
                (listeners[ev] = listeners[ev] || []).push(cb);
            },
            status: function () {
                return Promise.resolve({ devid: 'navegador-mock',
                                         devname: 'agenda-mock',
                                         running: true });
            },
            start: function () { return Promise.resolve({}); },
            stop:  function () { return Promise.resolve({}); }
        },
        CapacitorUpdater: {
            notifyAppReady: function () { return Promise.resolve(); },
            download: function (o) {
                console.log('[OTA-mock] descargando ' + o.url);
                return fetch(o.url).then(function (r) {
                    if (!r.ok) throw new Error('HTTP ' + r.status);
                    return r.arrayBuffer();
                }).then(function (buf) {
                    if (!o.checksum)
                        return { id: 'mock-' + Date.now() };
                    return sha256hex(buf).then(function (hex) {
                        if (hex && hex !== o.checksum)
                            throw new Error('checksum mismatch: ' +
                                hex.slice(0, 12) + ' != ' +
                                o.checksum.slice(0, 12));
                        console.log('[OTA-mock] sha256 verificado OK: ' +
                                    (hex || '').slice(0, 12) + '…');
                        return { id: 'mock-' + Date.now() };
                    });
                });
            },
            set: function () {
                return Promise.resolve().then(function () {
                    setTimeout(function () { location.reload(); }, 800);
                });
            },
            next: function () { return Promise.resolve(); },
            reset: function () {
                return Promise.resolve().then(function () {
                    location.reload();
                });
            }
        }
    } };
    // disparo manual de eventos nativos desde consola: __otaFire('tribalPing')
    window.__otaFire = function (ev, data) {
        (listeners[ev] || []).forEach(function (cb) { cb(data); });
    };
})();
