/* ==========================================================================
 * ARCHIVO: js/listas/buseta.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: openBusetaModal, renderBusetaInfo, updateTotalDineroCaminata, updateTotalLibreCaminata, saveBuseta
 * ========================================================================== */

        // --- BUSETA MODAL ---
        function openBusetaModal() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const elBuseta = document.getElementById('cam-usar-buseta');
            if (!cam || !elBuseta || typeof modalBuseta === 'undefined' || !modalBuseta) {
                if (!cam) showToast("Guarda el encabezado primero", "warning");
                return;
            }

            document.getElementById('cam-usar-buseta').checked = cam.usarBuseta !== false;
            document.getElementById('cam-cantidad-guias').value = cam.cantidadGuias || '2';

            toggleBusetaSection(document.getElementById('cam-usar-buseta'));
            updateCurrencySymbols();
            renderBusetaInfo();

            modalBuseta.show();
        }


        function renderBusetaInfo() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const totalCaminantes = cam ? (cam.pasajeros || []).length : 0;
            const guias = Number(document.getElementById('cam-cantidad-guias').value || 0);
            document.getElementById('cam-cantidad-participantes').innerText = totalCaminantes;
            document.getElementById('cam-total-personas-pagan').innerText = Math.max(0, totalCaminantes - guias);
            updateTotalTransporte();
            updateTotalDineroCaminata();
            updateTotalLibreCaminata();
        }


        function updateTotalDineroCaminata() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const totalCaminantes = cam ? (cam.pasajeros || []).length : 0;
            const guias = Number(document.getElementById('cam-cantidad-guias').value || 0);
            const personasPagan = Math.max(0, totalCaminantes - guias);
            const sym = document.getElementById('cam-moneda').value || '₡';
            const precioCaminata = Number(document.getElementById('cam-precio').value || 0);
            const div = document.getElementById('cam-total-dinero-caminata');
            if (div) {
                div.innerText = `${sym}${precioCaminata * personasPagan}`;
            }
            updateTotalLibreCaminata();
        }


        function updateTotalLibreCaminata() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const totalCaminantes = cam ? (cam.pasajeros || []).length : 0;
            const guias = Number(document.getElementById('cam-cantidad-guias').value || 0);
            const personasPagan = Math.max(0, totalCaminantes - guias);
            const sym = document.getElementById('cam-moneda').value || '₡';
            const precioCaminata = Number(document.getElementById('cam-precio').value || 0);
            const precioBuseta = Number(document.getElementById('cam-precio-buseta').value || 0);
            const cantidadBuses = Number(document.getElementById('cam-cantidad-busetas').value || 1);
            const div = document.getElementById('cam-total-libre-caminata');
            if (div) {
                const totalCaminata = precioCaminata * personasPagan;
                const totalTransporte = precioBuseta * cantidadBuses;
                div.innerText = `${sym}${totalCaminata - totalTransporte}`;
            }
        }


        async function saveBuseta() {
            const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
            if (camIndex === -1) {
                showToast("No se encontró la caminata", "danger");
                return;
            }

            const usar = document.getElementById('cam-usar-buseta').checked;
            const cantidadGuias = document.getElementById('cam-cantidad-guias').value;

            if (usar && cantidadGuias === '') {
                showToast("Completa la cantidad de guías", "danger");
                return;
            }

            caminatas[camIndex].usarBuseta = usar;
            caminatas[camIndex].cantidadGuias = usar ? cantidadGuias : '0';
            if (!usar) {
                caminatas[camIndex].precioBuseta = '0';
                caminatas[camIndex].cantidadBuses = '1';
            }

            await saveData();
            renderCaminantes();
            modalBuseta.hide();
            showToast("Datos de buseta guardados");
        }

