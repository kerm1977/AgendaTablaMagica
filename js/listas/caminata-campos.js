/* ==========================================================================
 * ARCHIVO: js/listas/caminata-campos.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: poblarSelectParquesNacionales, renderFormasPagoCaminata, renderUrlsCaminata, agregarUrlCaminata, eliminarUrlCaminata, renderEquipoCaminata, enviarInstruccionesCaminata
 * ========================================================================== */

        function poblarSelectParquesNacionales() {
            const select = document.getElementById('cam-parque');
            if (!select || select.dataset.poblado === 'true') return;
            let html = '<option value="" selected>Seleccioná un parque</option>';
            PARQUES_NACIONALES.forEach(p => {
                html += `<option value="${escapeHtml(p.nombre)}" data-provincia="${escapeHtml(p.provincia)}">${escapeHtml(p.nombre)}</option>`;
            });
            select.innerHTML = html;
            select.dataset.poblado = 'true';
        }


        function renderFormasPagoCaminata(seleccionados) {
            const cont = document.getElementById('cam-formas-pago-lista');
            const vacio = document.getElementById('cam-formas-pago-vacio');
            if (!cont) return;

            const sinpe = (configTema.formasPago && configTema.formasPago.sinpe) ? configTema.formasPago.sinpe : [];
            const cuentas = (configTema.formasPago && configTema.formasPago.cuentas) ? configTema.formasPago.cuentas : [];
            const todo = [...sinpe, ...cuentas];

            cont.innerHTML = '';
            if (todo.length === 0) {
                if (vacio) vacio.classList.remove('d-none');
                return;
            }
            if (vacio) vacio.classList.add('d-none');

            todo.forEach((valor, i) => {
                const safeId = 'cam-pago-' + i;
                const checked = (seleccionados || []).includes(valor) ? 'checked' : '';
                cont.innerHTML += `
                    <div class="col-12">
                        <input type="checkbox" id="${safeId}" name="cam-formas-pago" value="${escapeHtml(valor)}" class="me-1 d-none" ${checked}>
                        <label for="${safeId}" class="border rounded px-2 py-2 d-block text-start text-break mb-0" style="cursor:pointer;font-size:0.75rem;">${escapeHtml(valor)}</label>
                    </div>
                `;
            });
        }


        function renderUrlsCaminata(urls) {
            const cont = document.getElementById('cam-url-lista');
            if (!cont) return;
            let html = '';
            (urls || []).forEach((u, i) => {
                html += `
                    <div class="input-group mb-2 cam-url-fila" data-index="${i}">
                        <input type="url" class="form-control cam-url-input" value="${escapeHtml(u)}" placeholder="Ej: https://chat.whatsapp.com/...">
                        <button type="button" class="btn btn-outline-danger" onclick="eliminarUrlCaminata(${i})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
            });
            cont.innerHTML = html;
            const btn = document.getElementById('cam-agregar-url');
            if (btn) btn.classList.toggle('d-none', (urls || []).length >= 5);
        }


        function agregarUrlCaminata() {
            const cont = document.getElementById('cam-url-lista');
            const current = Array.from(cont.querySelectorAll('.cam-url-input')).map(input => input.value);
            if (current.length >= 5) return;
            current.push('');
            renderUrlsCaminata(current);
        }


        function eliminarUrlCaminata(index) {
            const cont = document.getElementById('cam-url-lista');
            const current = Array.from(cont.querySelectorAll('.cam-url-input')).map(input => input.value);
            current.splice(index, 1);
            renderUrlsCaminata(current);
        }


        function renderEquipoCaminata(cam) {
            const tbody = document.getElementById('cam-equipo-tbody');
            if (!tbody) return;

            const equipos = configTema.equipoRequerido || [];
            tbody.innerHTML = '';

            equipos.forEach((item, index) => {
                let estado = 'Si';
                if (cam && cam.equipo && cam.equipo[index]) {
                    estado = cam.equipo[index].estado;
                }
                const checkedSi = estado === 'Si' ? 'checked' : '';
                const checkedNo = estado === 'No' ? 'checked' : '';
                const checkedOpc = estado === 'Opcional' ? 'checked' : '';
                tbody.innerHTML += `
                    <tr>
                        <td class="ps-0 fw-medium">${item}</td>
                        <td class="text-center"><input type="radio" name="cam-equip_${index}" value="Si" class="form-check-input" style="cursor: pointer;" ${checkedSi}></td>
                        <td class="text-center"><input type="radio" name="cam-equip_${index}" value="No" class="form-check-input" style="cursor: pointer;" ${checkedNo}></td>
                        <td class="text-center pe-0"><input type="radio" name="cam-equip_${index}" value="Opcional" class="form-check-input" style="cursor: pointer;" ${checkedOpc}></td>
                    </tr>
                `;
            });
        }


        async function enviarInstruccionesCaminata() {
            const form = document.getElementById('form-caminata');
            if (!form.reportValidity()) return;

            await saveCaminataHeader({ preventDefault: () => {} }, true);

            const id = document.getElementById('caminata-id').value;
            const cam = caminatas.find(c => c.id === id);
            if (!cam) {
                showToast('Caminata no encontrada', 'danger');
                return;
            }

            let texto = generarEncabezadoWhatsApp(cam);
            texto += generarBloqueInstrucciones(cam);

            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }

