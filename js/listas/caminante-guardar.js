/* ==========================================================================
 * ARCHIVO: js/listas/caminante-guardar.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: handleNotaPublicaToggle, checkEstadoAbono, checkAbonoByEstado, actualizarEstadoPagoPorMonto, ajustarCantidadBusetas, saveCaminante
 * ========================================================================== */

        // Lógica para confirmar al intentar hacer pública la nota
        function handleNotaPublicaToggle(element) {
            if (element.checked) {
                // Revertir temporalmente para esperar confirmación
                element.checked = false;
                showConfirm(
                    "Advertencia de Privacidad",
                    "¿Estás seguro de que deseas hacer pública esta nota? Al enviar la lista por WhatsApp, este detalle será visible para todas las personas del grupo.",
                    () => {
                        // Confirmado
                        element.checked = true;
                    },
                    "Sí, hacer pública",
                    "btn-warning"
                );
            }
        }


        // Lógica automática para cambio de estado basado en Abono
        function checkEstadoAbono() {
            const abono = document.getElementById('cam-usu-abonos').value;
            const estado = document.getElementById('cam-usu-estado');
            
            if (abono === 'R') {
                estado.value = 'reservado';
            } else if (abono.startsWith('Ab+') || abono.startsWith('R+')) {
                estado.value = 'abono';
            }
        }


        // Lógica automática inversa: Si es Reserva Parcial, borrar Abonos
        function checkAbonoByEstado() {
            const estado = document.getElementById('cam-usu-estado').value;
            const abono = document.getElementById('cam-usu-abonos');
            const abonoActual = abono.value;

            if (estado === 'pendiente') {
                abono.innerHTML = '<option value=""></option>';
                abono.value = '';
                abono.disabled = true;
                abono.classList.add('bg-light');
            } else if (estado === 'reservado') {
                abono.innerHTML = '<option value="">Ninguno</option><option value="R">R (Reserva)</option>';
                abono.value = abonoActual && (abonoActual === 'R' || abonoActual === '') ? abonoActual : '';
                abono.disabled = false;
                abono.classList.remove('bg-light');
            } else if (estado === 'abono') {
                let opciones = '<option value=""></option>';
                for (let i = 1; i <= 30; i++) {
                    opciones += `<option value="Ab+${i}">Ab+${i}</option>`;
                }
                abono.innerHTML = opciones;
                abono.value = abonoActual && abonoActual.startsWith('Ab+') ? abonoActual : '';
                abono.disabled = false;
                abono.classList.remove('bg-light');
            } else {
                abono.innerHTML = '<option value=""></option>';
                abono.value = '';
                abono.disabled = true;
                abono.classList.add('bg-light');
            }
        }


        async function actualizarEstadoPagoPorMonto(camIndex, pasId) {
            const cam = caminatas[camIndex];
            const pas = cam.pasajeros ? cam.pasajeros.find(p => p.id === pasId) : null;
            if (!pas || !pas.historialMontos) return;
            const totalPagado = pas.historialMontos
                .filter(i => !i.reversado)
                .reduce((s, i) => s + Number(i.monto || 0), 0);

            const precio = Number(cam.precio || 0);
            const reservaMonto = Number(cam.reservaMonto || 0);

            // Si alcanzó el precio total, queda cancelado
            if (totalPagado >= precio && precio) {
                pas.estado = 'cancelado';
                pas.abonos = '';
            } else if (totalPagado >= reservaMonto && reservaMonto && pas.estado === 'pendiente') {
                // Si pagó al menos la reserva y aún está pendiente, pasa a reservado.
                // No se sobrescriben estados manuales como 'abono' o 'pago-parcial'.
                pas.estado = 'reservado';
            }

            await saveData();
        }


        function ajustarCantidadBusetas(camIndex) {
            const cam = caminatas[camIndex];
            if (!cam || cam.usarBuseta === false) return;
            const total = (cam.pasajeros || []).length;
            let cantidad = 1;
            if (total > 31) cantidad = 3;
            else if (total > 17) cantidad = 2;
            cam.cantidadBuses = String(cantidad);
            const input = document.getElementById('cam-cantidad-busetas');
            if (input) input.value = String(cantidad);
            updateTotalTransporte();
            updateDeudaPorPersona();
            updateDineroARecoger();
        }


        async function saveCaminante() {
            const nombreInput = document.getElementById('cam-usu-nombre');
            const nombre = nombreInput.value.trim();
            const estado = document.getElementById('cam-usu-estado').value;
            const abonos = document.getElementById('cam-usu-abonos').value;
            const montoNuevo = document.getElementById('cam-usu-monto-cancelado').value;
            const tipoDestino = document.getElementById('cam-usu-pago-destino').value;
            const destinoPago = document.getElementById('cam-usu-otro-caminante').value;
            const montoActual = document.getElementById('cam-usu-monto-actual').value;
            const montoOtro = document.getElementById('cam-usu-monto-otro').value;
            const pasId = document.getElementById('caminante-id').value;
            const notaHtml = limpiarNbsp(document.getElementById('cam-usu-nota').innerHTML);
            const notaPublica = document.getElementById('cam-usu-nota-publica').checked;
            const mostrarDescReversion = document.getElementById('cam-usu-mostrar-desc-reversion').checked;
            const mostrarDescPago = document.getElementById('cam-usu-mostrar-desc-pago').checked;
            const mostrarReversiones = document.getElementById('cam-usu-mostrar-reversiones').checked;
            const mostrarPagosActivos = document.getElementById('cam-usu-mostrar-pagos-activos').checked;
            const mostrarTotalEnLista = document.getElementById('cam-usu-mostrar-total-lista').checked;
            const mostrarSaldoPendiente = document.getElementById('cam-usu-mostrar-saldo-pendiente').checked;
            const dolarizar = document.getElementById('cam-usu-dolarizar').checked;
            const tipoCambioDolar = document.getElementById('cam-usu-tipo-cambio-dolar').value;

            if (dolarizar) {
                document.getElementById('dolarizar-tipo-cambio').classList.remove('d-none');
            } else {
                document.getElementById('dolarizar-tipo-cambio').classList.add('d-none');
            }

            if(!nombre) {
                showToast("El nombre es requerido", "danger");
                return;
            }

            // Validar que no tenga error activo
            if(document.getElementById('name-error').style.display === 'block') {
                 showToast("Corrige el nombre antes de guardar", "danger");
                 return;
            }

            const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
            if(camIndex === -1) return;

            if(!caminatas[camIndex].pasajeros) caminatas[camIndex].pasajeros = [];

            // Validación de Duplicados
            const nombreNormalizado = nombre.toLowerCase();
            const esDuplicado = caminatas[camIndex].pasajeros.some(p => p.nombre.toLowerCase() === nombreNormalizado && p.id !== pasId);

            if (esDuplicado) {
                showToast("Este caminante ya está en la lista", "danger");
                return;
            }

            const data = { nombre, estado, abonos, pasId, notaHtml, notaPublica, mostrarDescReversion, mostrarDescPago, mostrarReversiones, mostrarPagosActivos, mostrarTotalEnLista, mostrarSaldoPendiente, dolarizar, tipoCambioDolar };

            if (montoNuevo) {
                pendingSaveData = { ...data, montoNuevo, tipoDestino, destinoPago, montoActual, montoOtro };
                document.getElementById('pago-descripcion').value = '';
                document.getElementById('pago-forma').value = 'SINPE';
                document.getElementById('pago-moneda').value = 'Colones';
                document.getElementById('pago-tipo-cambio').value = '';
                document.getElementById('pago-tipo-cambio-container').classList.add('d-none');
                modalPago.show();
                return;
            }

            await guardarCaminante({ ...data, montoDataList: [] });
        }

