    // ============================================================================
    // ARCHIVO: media/fx.js
    // RESPONSABILIDAD: Calculadora de divisas — pestaña #tab-divisas, base USD.
    //   · Banda de referencia arriba: "tipo de cambio del dólar" en TEXTO PLANO
    //     (tasa de referencia + la de open.er-api.com, para comparar)
    //   · Monto + dropdown de la moneda origen
    //   · Lista de conversiones; la tasa de cada fila también es texto plano
    //   · Ajuste manual: TOCAR una tasa la vuelve editable solo en ese momento
    //   Datos/persistencia en media/fxdata.js · red en media/fxnet.js
    // ============================================================================
    (function () {
        'use strict';

        var D = window.TribalFXData;
        var LIST, esc, fmt, find, persist;
        var tab, amtEl, selEl, listEl, statusEl, refEl;
        var st; // { rates, api, stamp }
        var INPUT_KEY = 'tribal-fx-input';

        function refCode() {
            var c = selEl ? selEl.value : 'USD';
            return c === 'USD' ? 'CRC' : c;
        }
        function paintStatus(t) { if (statusEl) statusEl.textContent = t; }
        function stampText() {
            return st.stamp ? ('fuente: open.er-api.com · ' + st.stamp)
                            : 'tasas manuales — toca una tasa para ajustarla';
        }

        // banda superior: tipo de cambio del dólar (referencia vs API) — texto
        function paintRef() {
            var c = find(refCode()), api = st.api[c.code];
            refEl.innerHTML = 'Tipo de cambio del dólar · ' +
                '<b class="fx-rtext" data-c="' + c.code + '" ' +
                'title="Toca para ajustar a mano">1 USD = ' + st.rates[c.code] +
                ' ' + c.sym + '</b>' + (api && api !== st.rates[c.code] ?
                ' <small>open.er-api.com: ' + api + ' ' + c.sym + '</small>' : '');
        }

        function rowHtml(c, a, code, usd) {
            var eq = usd == null ? '—' : fmt(usd * st.rates[c.code]);
            var label = isFinite(a) ? fmt(a) + ' ' + code + ' en ' + c.name
                                    : 'monto en ' + c.name;
            return '<div class="fx-row" data-c="' + c.code + '">' +
                '<span class="fx-flag">' + c.flag + '</span>' +
                '<div class="fx-rtxt"><b>' + eq + ' ' + c.sym + '</b>' +
                '<small>' + esc(label) + '</small></div>' +
                '<span class="fx-rtext" data-c="' + c.code + '" ' +
                'title="Toca para ajustar a mano">1 USD = ' + st.rates[c.code] +
                ' ' + c.sym + '</span></div>';
        }
        function renderList() {
            var a = parseFloat(amtEl.value), code = selEl.value;
            var usd = (isFinite(a) && st.rates[code] > 0) ? a / st.rates[code] : null;
            var html = '';
            LIST.forEach(function (c) {
                if (c.code !== code) html += rowHtml(c, a, code, usd);
            });
            listEl.innerHTML = html;
            paintRef();
        }

        // tocar una tasa (texto plano) la vuelve campo SOLO mientras se edita
        function startEdit(code, holder) {
            var inp = document.createElement('input'), done = false;
            inp.type = 'number'; inp.step = 'any'; inp.min = '0';
            inp.className = 'fx-rate-edit'; inp.value = st.rates[code];
            holder.parentNode.replaceChild(inp, holder);
            inp.focus(); inp.select();
            function end(ok) {
                if (done) return;
                done = true;
                var v = parseFloat(inp.value);
                if (ok && v > 0) {
                    st.rates[code] = v; persist(st);
                    paintStatus('tasa ' + code + ' ajustada a mano');
                }
                renderList();
            }
            inp.addEventListener('keydown', function (e) {
                e.stopPropagation();
                if (e.key === 'Enter') end(true);
                else if (e.key === 'Escape') end(false);
            });
            inp.addEventListener('blur', function () { end(true); });
        }

        function onInput(e) {
            if (e.target === amtEl || e.target === selEl) {
                renderList();
                // anti-crash: el último monto/moneda se conserva
                try {
                    localStorage.setItem(INPUT_KEY, JSON.stringify(
                        { a: amtEl.value, f: selEl.value }));
                } catch (err) { /* solo sesión */ }
            }
        }
        function onClick(e) {
            if (e.target.closest('.fx-fetch')) return fetchRates();
            var rt = e.target.closest('.fx-rtext');
            if (rt) startEdit(rt.getAttribute('data-c'), rt);
        }

        function fetchRates() {
            if (!window.TribalFXNet) return paintStatus('módulo de red ausente');
            paintStatus('consultando open.er-api.com…');
            TribalFXNet.fetch(function (err, res) {
                if (err) return paintStatus('sin conexión — tasas manuales');
                st.api = res.rates; st.stamp = res.stamp || 'en línea';
                var n = 0;
                LIST.forEach(function (c) {
                    var v = res.rates[c.code];
                    if (v > 0 && c.code !== 'USD') { st.rates[c.code] = v; n++; }
                });
                persist(st); renderList();
                paintStatus(stampText() + ' · ' + n + ' actualizadas');
            });
        }

        document.addEventListener('DOMContentLoaded', function () {
            tab = document.getElementById('tab-divisas');
            if (!tab || !D) return;
            LIST = D.LIST; esc = D.esc; fmt = D.fmt; find = D.find; persist = D.persist;
            st = D.load();

            amtEl = tab.querySelector('#fx-amt');
            selEl = tab.querySelector('#fx-sel');
            listEl = tab.querySelector('#fx-list');
            statusEl = tab.querySelector('#fx-status');
            refEl = tab.querySelector('#fx-ref');

            selEl.innerHTML = LIST.map(function (c) {
                return '<option value="' + c.code + '">' + c.flag + ' ' + c.code +
                       ' — ' + esc(c.name) + '</option>';
            }).join('');

            var last = null;
            try { last = JSON.parse(localStorage.getItem(INPUT_KEY) || 'null'); }
            catch (e) { /* sin memoria previa */ }
            selEl.value = (last && last.f) || 'USD';
            if (last && last.a) amtEl.value = last.a;

            tab.addEventListener('input', onInput);
            tab.addEventListener('change', onInput);
            tab.addEventListener('click', onClick);

            renderList();
            paintStatus(stampText());
        });
    })();