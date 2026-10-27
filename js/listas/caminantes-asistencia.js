/* ==========================================================================
 * ARCHIVO: js/listas/caminantes-asistencia.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: renderAsistenciaCaminantes, marcarAsistencia, limpiarAsistencia, filterCaminantes
 * ========================================================================== */

        function renderAsistenciaCaminantes() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam) return;
            const listDiv = document.getElementById('lista-asistencia-caminantes');
            if (!listDiv) return;

            const resumenDiv = document.getElementById('resumen-asistencia');

            const pasajeros = cam.pasajeros || [];
            if (pasajeros.length === 0) {
                listDiv.innerHTML = '<p class="text-muted small text-center my-3">No hay caminantes en la lista.</p>';
                if (resumenDiv) resumenDiv.className = 'd-none';
                return;
            }

            listDiv.innerHTML = '';
            pasajeros.forEach((pas, index) => {
                const item = document.createElement('div');
                item.className = 'caminante-item flex-column align-items-stretch';

                const redDot = tienePagoPendiente(pas, cam)
                    ? '<span class="status-dot status-pendiente" title="Tiene pago pendiente" style="width: 10px; height: 10px;"></span>'
                    : '';

                let nombreHtml;
                if (pas.asistencia === 'participo') {
                    nombreHtml = `<span class="fw-bold text-success">${escapeHtml(pas.nombre)}</span>`;
                } else if (pas.asistencia === 'no-participo') {
                    nombreHtml = `<span class="fw-medium" style="text-decoration: line-through;">${escapeHtml(pas.nombre)}</span>`;
                } else {
                    nombreHtml = `<span class="fw-medium">${escapeHtml(pas.nombre)}</span>`;
                }

                const siChecked = pas.asistencia === 'participo' ? 'checked' : '';
                const noChecked = pas.asistencia === 'no-participo' ? 'checked' : '';

                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center w-100">
                        <div class="d-flex align-items-center flex-grow-1">
                            <span class="text-muted small me-2 text-end" style="width: 20px;">${index + 1}.</span>
                            ${redDot}
                            ${nombreHtml}
                        </div>
                        <div class="btn-group btn-group-sm" role="group">
                            <input type="radio" class="btn-check" name="asistencia_${pas.id}" id="asistencia_si_${pas.id}" value="participo" ${siChecked} onchange="marcarAsistencia('${escapeJsString(pas.id)}', 'participo')">
                            <label class="btn btn-outline-success" for="asistencia_si_${pas.id}">Participó</label>

                            <input type="radio" class="btn-check" name="asistencia_${pas.id}" id="asistencia_no_${pas.id}" value="no-participo" ${noChecked} onchange="marcarAsistencia('${escapeJsString(pas.id)}', 'no-participo')">
                            <label class="btn btn-outline-danger" for="asistencia_no_${pas.id}">No participó</label>
                        </div>
                    </div>
                `;
                listDiv.appendChild(item);
            });

            const participaron = pasajeros.filter(p => p.asistencia === 'participo').length;
            const noParticiparon = pasajeros.filter(p => p.asistencia === 'no-participo').length;

            if (resumenDiv) {
                resumenDiv.className = 'd-flex justify-content-between small fw-bold text-muted mt-2 pt-2 border-top';
                resumenDiv.innerHTML = `
                    <span class="text-success">Participaron: ${participaron}</span>
                    <span class="text-danger">No participaron: ${noParticiparon}</span>
                `;
            }
        }


        async function marcarAsistencia(pasId, valor) {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam) return;
            const pas = (cam.pasajeros || []).find(p => p.id === pasId);
            if (!pas) return;
            pas.asistencia = valor;
            
            // Guardar en historial permanente de asistencia
            const fechaFin = fechaFinCaminata(cam);
            const nuevoRegistro = {
                nombre: pas.nombre,
                camId: cam.id,
                camNombre: cam.nombre,
                camActividad: cam.actividad || '',
                camLugar: cam.lugar || '',
                camPais: cam.pais || 'Costa Rica',
                camDificultad: cam.dificultad || '',
                camKm: cam.km || '',
                camTransporte: cam.transporte || '',
                camPrecio: cam.precio || '',
                camFormasPago: cam.formasPago || '',
                asistencia: valor,
                fecha: fechaFin,
                fechaRegistro: new Date().toISOString()
            };
            
            // Verificar si ya existe un registro para esta persona y caminata
            const indexExistente = historialAsistencia.findIndex(h => 
                h.nombre === pas.nombre && h.camId === cam.id
            );
            
            if (indexExistente >= 0) {
                // Actualizar registro existente
                historialAsistencia[indexExistente] = nuevoRegistro;
            } else {
                // Agregar nuevo registro
                historialAsistencia.push(nuevoRegistro);
            }
            
            await saveData();
            renderAsistenciaCaminantes();
        }


        function limpiarAsistencia() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam || !cam.pasajeros || cam.pasajeros.length === 0) return;
            showConfirm('Limpiar asistencia', '¿Deseás borrar toda la selección de asistencia de esta caminata?', () => {
                cam.pasajeros.forEach(p => p.asistencia = '');
                saveData();
                renderAsistenciaCaminantes();
                showToast('Selección de asistencia limpiada');
            });
        }


        function filterCaminantes() {
            const val = document.getElementById('search-caminante').value;
            renderCaminantes(val);
        }

