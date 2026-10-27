/* ==========================================================================
 * ARCHIVO: js/listas/caminante-modal.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: openCaminanteModal, openModalMultiCaminantes, renderMultiSelectCaminantes, agregarCaminantesSeleccionados
 * ========================================================================== */

        async function openCaminanteModal(caminanteId = null) {
            document.getElementById('form-caminante').reset();
            document.getElementById('cam-usu-nota').innerHTML = ''; // Limpiar nota HTML
            document.getElementById('name-error').style.display = 'none';
            document.getElementById('suggestions-list').style.display = 'none';

            const divOpciones = document.getElementById('opciones-caminante');
            const cam = caminatas.find(c => c.id === currentCaminataId);

            // Llenar select de destino de pago
            const selectOtro = document.getElementById('cam-usu-otro-caminante');
            if (selectOtro) {
                selectOtro.innerHTML = '';
                if (cam && cam.pasajeros) {
                    cam.pasajeros.forEach(p => {
                        if (p.id !== caminanteId) {
                            const option = document.createElement('option');
                            option.value = p.id;
                            option.innerText = p.nombre;
                            selectOtro.appendChild(option);
                        }
                    });
                }
            }

            document.getElementById('cam-usu-pago-destino').value = 'este';
            document.getElementById('cam-usu-monto-actual').value = '';
            document.getElementById('cam-usu-monto-otro').value = '';
            togglePagoDestino();

            if (caminanteId) {
                // Modo Edición
                const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
                const pas = cam.pasajeros.find(p => p.id === caminanteId);

                await actualizarEstadoPagoPorMonto(camIndex, pas.id);
                
                document.getElementById('modalCaminanteLabel').innerText = 'Editar Caminante';
                document.getElementById('caminante-id').value = pas.id;
                document.getElementById('cam-usu-nombre').value = pas.nombre;
                document.getElementById('cam-usu-estado').value = pas.estado;
                document.getElementById('cam-usu-monto-cancelado').value = '';
                document.getElementById('cam-usu-nota').innerHTML = pas.nota || '';
                renderHistorialMontos(pas.historialMontos || []);

                // Configurar el interruptor de nota pública
                document.getElementById('cam-usu-nota-publica').checked = pas.notaPublica || false;
                document.getElementById('cam-usu-mostrar-desc-reversion').checked = pas.mostrarDescReversion !== false;
                document.getElementById('cam-usu-mostrar-desc-pago').checked = pas.mostrarDescPago !== false;
                document.getElementById('cam-usu-mostrar-reversiones').checked = pas.mostrarReversiones !== false;
                document.getElementById('cam-usu-mostrar-pagos-activos').checked = pas.mostrarPagosActivos !== false;
                document.getElementById('cam-usu-mostrar-total-lista').checked = pas.mostrarTotalEnLista !== false;
                document.getElementById('cam-usu-mostrar-saldo-pendiente').checked = pas.mostrarSaldoPendiente === true;
                document.getElementById('cam-usu-dolarizar').checked = pas.dolarizar === true;
                document.getElementById('cam-usu-tipo-cambio-dolar').value = pas.tipoCambioDolar || '';
                toggleDolarizar();

                // Mapeo automático de R+X a Ab+X para compatibilidad retroactiva en el dropdown
                let currentAbono = pas.abonos || '';
                currentAbono = currentAbono.replace('R+', 'Ab+');
                checkAbonoByEstado();
                document.getElementById('cam-usu-abonos').value = currentAbono; 
                
                divOpciones.classList.remove('d-none');
            } else {
                // Modo Nuevo
                document.getElementById('modalCaminanteLabel').innerText = 'Agregar Caminante';
                document.getElementById('caminante-id').value = '';
                document.getElementById('cam-usu-abonos').value = '';
                document.getElementById('cam-usu-monto-cancelado').value = '';
                document.getElementById('cam-usu-estado').value = 'pendiente'; // Por defecto pendiente ahora
                checkAbonoByEstado();
                document.getElementById('cam-usu-nota-publica').checked = false; // Privada por defecto al crear
                document.getElementById('cam-usu-mostrar-desc-reversion').checked = true;
                document.getElementById('cam-usu-mostrar-desc-pago').checked = true;
                document.getElementById('cam-usu-mostrar-reversiones').checked = true;
                document.getElementById('cam-usu-mostrar-pagos-activos').checked = true;
                document.getElementById('cam-usu-mostrar-total-lista').checked = true;
                document.getElementById('cam-usu-mostrar-saldo-pendiente').checked = false;
                document.getElementById('cam-usu-dolarizar').checked = false;
                document.getElementById('cam-usu-tipo-cambio-dolar').value = '';
                toggleDolarizar();
                renderHistorialMontos([]);
                divOpciones.classList.add('d-none');
            }

            modalCaminante.show();
        }


        function openModalMultiCaminantes() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam) {
                showToast('No se encontró la caminata', 'danger');
                return;
            }
            document.getElementById('multi-caminantes-buscar').value = '';
            renderMultiSelectCaminantes();
            modalMultiCaminantes.show();
        }


        function renderMultiSelectCaminantes() {
            const cont = document.getElementById('multi-caminantes-lista');
            const buscar = document.getElementById('multi-caminantes-buscar');
            const filtro = (buscar ? buscar.value : '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            if (!cont) return;

            const cam = caminatas.find(c => c.id === currentCaminataId);
            const actuales = new Set((cam && cam.pasajeros ? cam.pasajeros.map(p => p.nombre) : []));
            const base = new Set();

            personasGlobales.forEach(n => { if (n && typeof n === 'string') base.add(n); });
            directorioPersonas.forEach(p => { if (p && p.nombre) base.add(p.nombre); });

            const nombres = Array.from(base)
                .filter(n => !actuales.has(n))
                .filter(n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').includes(filtro))
                .sort((a, b) => a.localeCompare(b));

            if (nombres.length === 0) {
                cont.innerHTML = '<p class="text-muted small text-center mb-0">No hay personas disponibles para agregar.</p>';
                return;
            }

            cont.innerHTML = nombres.map((n, i) => `
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" value="${escapeHtml(n)}" id="multi-cam-${i}">
                    <label class="form-check-label small text-muted" for="multi-cam-${i}">${escapeHtml(n)}</label>
                </div>
            `).join('');
        }


        async function agregarCaminantesSeleccionados() {
            const cont = document.getElementById('multi-caminantes-lista');
            if (!cont) return;
            const checkboxes = cont.querySelectorAll('input[type="checkbox"]:checked');
            const nombres = Array.from(checkboxes).map(cb => cb.value);

            if (nombres.length === 0) {
                showToast('Seleccioná al menos una persona', 'warning');
                return;
            }

            const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
            if (camIndex === -1) return;

            if (!caminatas[camIndex].pasajeros) caminatas[camIndex].pasajeros = [];

            let agregados = 0;
            nombres.forEach((nombre, i) => {
                const nombreNormalizado = nombre.toLowerCase();
                const existe = caminatas[camIndex].pasajeros.some(p => p.nombre.toLowerCase() === nombreNormalizado);
                if (existe) return;

                caminatas[camIndex].pasajeros.push({
                    id: Date.now().toString() + '_' + i,
                    nombre: nombre,
                    estado: 'pendiente',
                    abonos: '',
                    historialMontos: [],
                    nota: '',
                    notaPublica: false,
                    mostrarDescReversion: true,
                    mostrarDescPago: true,
                    mostrarReversiones: true,
                    mostrarPagosActivos: true,
                    mostrarTotalEnLista: true,
                    mostrarSaldoPendiente: false,
                    dolarizar: false,
                    tipoCambioDolar: ''
                });

                if (!personasGlobales.includes(nombre)) personasGlobales.push(nombre);
                if (!directorioPersonas.find(p => p.nombre === nombre)) {
                    directorioPersonas.push({
                        id: Date.now().toString() + '_' + i,
                        nombre: nombre,
                        cedula: '',
                        telefono: '',
                        correo: ''
                    });
                }
                agregados++;
            });

            await saveData();
            renderCaminantes();
            ajustarCantidadBusetas(camIndex);
            updateTotalTransporte();
            updateDineroARecoger();
            modalMultiCaminantes.hide();

            if (agregados > 0) {
                showToast(`${agregados} caminante(s) agregado(s)`, 'success');
            } else {
                showToast('Las personas seleccionadas ya estaban en la lista', 'warning');
            }
        }

