/* ==========================================================================
 * ARCHIVO: js/listas/caminata-totales.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: updateCurrencySymbols, updateTotalTransporte, toggleBusetaSection, toggleOtherDesc, updateTimePreview, updateDeudaPorPersona, updateDineroARecoger
 * ========================================================================== */

        function updateCurrencySymbols() {
            const sym = document.getElementById('cam-moneda').value;
            document.querySelectorAll('.currency-symbol').forEach(el => el.innerText = sym);
            updateTotalTransporte();
            updateDineroARecoger();
        }


        function updateTotalTransporte() {
            const sym = document.getElementById('cam-moneda').value || '₡';
            const precioBuseta = Number(document.getElementById('cam-precio-buseta').value || 0);
            const cantidadBuses = Number(document.getElementById('cam-cantidad-busetas').value || 1);
            const total = precioBuseta * cantidadBuses;
            document.getElementById('cam-total-transporte').innerText = `${sym}${total}`;
            updateTotalLibreCaminata();
        }


        function toggleBusetaSection(checkbox) {
            if (!checkbox) return;
            const ids = ['cam-precio-buseta', 'cam-cantidad-busetas', 'cam-cantidad-guias'];

            if (checkbox.checked) {
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    el.disabled = false;
                    el.required = true;
                    if (id === 'cam-cantidad-busetas' && !el.value) el.value = '1';
                    if (id === 'cam-cantidad-guias' && !el.value) el.value = '2';
                });
            } else {
                ids.forEach(id => {
                    const el = document.getElementById(id);
                    if (!el) return;
                    el.disabled = true;
                    el.required = false;
                    if (id === 'cam-precio-buseta' || id === 'cam-cantidad-guias') el.value = '0';
                    if (id === 'cam-cantidad-busetas') el.value = '1';
                });
            }
            updateTotalTransporte();
            updateDeudaPorPersona();
            updateDineroARecoger();
        }


        function toggleOtherDesc() {
            const check = document.getElementById('checkOtros');
            const cont = document.getElementById('otrosDescContainer');
            if (!check || !cont) return;
            cont.classList.toggle('d-none', !check.checked);
            if (!check.checked) {
                const input = document.getElementById('otrosDescripcion');
                if (input) input.value = '';
            }
        }


        function updateTimePreview() {
            const input = document.getElementById('cam-hora-salida');
            const preview = document.getElementById('cam-time-preview');
            if (!input || !preview) return;
            const val = input.value;
            if (!val) {
                preview.innerText = '';
                return;
            }
            const [h, m] = val.split(':').map(Number);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            preview.innerText = `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
        }


        function updateDeudaPorPersona() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const totalCaminantes = cam ? (cam.pasajeros || []).length : 0;
            const guias = Number(document.getElementById('cam-cantidad-guias').value || 0);
            const personasPagan = Math.max(0, totalCaminantes - guias);
            const sym = document.getElementById('cam-moneda').value || '₡';
            const precioBuseta = Number(document.getElementById('cam-precio-buseta').value || 0);
            const cantidadBuses = Number(document.getElementById('cam-cantidad-busetas').value || 1);
            const totalBusetas = precioBuseta * cantidadBuses;
            const deudaDiv = document.getElementById('cam-deuda-por-persona');
            if (deudaDiv) {
                if (personasPagan > 0) {
                    deudaDiv.innerText = `${sym}${Math.round(totalBusetas / personasPagan)}`;
                } else {
                    deudaDiv.innerText = '—';
                }
            }
        }


        function updateDineroARecoger() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const totalCaminantes = cam ? (cam.pasajeros || []).length : 0;
            const guias = Number(document.getElementById('cam-cantidad-guias').value || 0);
            const personasPagan = Math.max(0, totalCaminantes - guias);
            const sym = document.getElementById('cam-moneda').value || '₡';
            const precioCaminata = Number(document.getElementById('cam-precio').value || 0);
            const precioBuseta = Number(document.getElementById('cam-precio-buseta').value || 0);
            const cantidadBuses = Number(document.getElementById('cam-cantidad-busetas').value || 1);
            const totalTransporte = precioBuseta * cantidadBuses;
            const totalCaminata = precioCaminata * personasPagan;
            const totalRecoger = totalCaminata + totalTransporte;
            const recogerDiv = document.getElementById('cam-dinero-a-recoger');
            if (recogerDiv) {
                recogerDiv.innerText = `${sym}${totalRecoger}`;
            }
            const netoDiv = document.getElementById('cam-dinero-menos-transporte');
            if (netoDiv) {
                const neto = totalCaminata;
                const label = document.getElementById('label-dinero-menos-transporte');
                if (neto < 0) {
                    netoDiv.classList.add('text-danger');
                    netoDiv.innerText = `${sym}${neto}`;
                    if (label) label.innerText = 'Dinero a Recoger menos Total de Transporte (faltante)';
                } else {
                    netoDiv.classList.remove('text-danger');
                    netoDiv.innerText = `${sym}${neto}`;
                    if (label) label.innerText = 'Dinero a Recoger menos Total de Transporte';
                }
            }
        }

