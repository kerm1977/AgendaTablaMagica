/* ==========================================================================
 * ARCHIVO: js/listas/pagos-confirmar.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: confirmarPago, toggleTipoCambio, toggleDolarizar
 * ========================================================================== */

        async function confirmarPago() {
            const descripcionPago = document.getElementById('pago-descripcion').value.trim();
            const formaPago = document.getElementById('pago-forma').value;

            if (pendingPagoIndex !== null) {
                const pasId = document.getElementById('caminante-id').value;
                const cam = caminatas.find(c => c.id === currentCaminataId);
                if (!cam || !pasId) return;
                const pas = cam.pasajeros.find(p => p.id === pasId);
                if (pas && pas.historialMontos && pas.historialMontos[pendingPagoIndex]) {
                    pas.historialMontos[pendingPagoIndex].descripcionPago = descripcionPago;
                    pas.historialMontos[pendingPagoIndex].formaPago = formaPago;
                    pas.historialMontos[pendingPagoIndex].fechaEdicionPago = new Date().toLocaleString();
                    await saveData();
                    renderHistorialMontos(pas.historialMontos);
                    const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
                    await actualizarEstadoPagoPorMonto(camIndex, pasId);
                }
                pendingPagoIndex = null;
                modalPago.hide();
                return;
            }

            if (!pendingSaveData) return;
            const monedaPago = document.getElementById('pago-moneda').value;
            const tipoCambio = document.getElementById('pago-tipo-cambio').value;
            const tc = monedaPago === 'Dólares' ? Number(tipoCambio) : 1;
            if (monedaPago === 'Dólares' && !tc) {
                showToast("Ingrese el tipo de cambio", "danger");
                return;
            }

            const tipoDestino = pendingSaveData.tipoDestino || 'este';
            const montoNuevo = Number(pendingSaveData.montoNuevo) || 0;

            function crearMontoData(montoOriginal, destinoId) {
                let monto = Number(montoOriginal);
                if (monedaPago === 'Dólares') {
                    monto = monto * tc;
                }
                return {
                    monto: monto,
                    montoOriginal: String(montoOriginal),
                    monedaPago: monedaPago,
                    tipoCambio: monedaPago === 'Dólares' ? tipoCambio : '',
                    fecha: new Date().toLocaleString(),
                    reversado: false,
                    descripcionPago: descripcionPago || '',
                    formaPago: formaPago,
                    destinoPago: destinoId || '',
                    pagadoPor: pendingSaveData.nombre || ''
                };
            }

            let montoDataList = [];

            if (tipoDestino === 'este' || tipoDestino === '') {
                montoDataList.push(crearMontoData(montoNuevo, ''));
            } else if (tipoDestino === 'otro') {
                montoDataList.push(crearMontoData(montoNuevo, pendingSaveData.destinoPago));
            } else if (tipoDestino === 'mitad') {
                const m1 = Math.floor(montoNuevo / 2);
                const m2 = Math.ceil(montoNuevo / 2);
                montoDataList.push(crearMontoData(m1, ''));
                montoDataList.push(crearMontoData(m2, pendingSaveData.destinoPago));
            } else if (tipoDestino === 'personalizado') {
                const m1 = Number(pendingSaveData.montoActual) || 0;
                const m2 = Number(pendingSaveData.montoOtro) || 0;
                if (m1 > 0) montoDataList.push(crearMontoData(m1, ''));
                if (m2 > 0) montoDataList.push(crearMontoData(m2, pendingSaveData.destinoPago));
            }

            await guardarCaminante({ ...pendingSaveData, montoDataList });
            modalPago.hide();
            pendingSaveData = null;
        }


        function toggleTipoCambio() {
            const moneda = document.getElementById('pago-moneda').value;
            const container = document.getElementById('pago-tipo-cambio-container');
            if (moneda === 'Dólares') {
                container.classList.remove('d-none');
            } else {
                container.classList.add('d-none');
                document.getElementById('pago-tipo-cambio').value = '';
            }
        }


        function toggleDolarizar() {
            const dolarizar = document.getElementById('cam-usu-dolarizar').checked;
            const container = document.getElementById('dolarizar-tipo-cambio');
            if (dolarizar) {
                container.classList.remove('d-none');
            } else {
                container.classList.add('d-none');
            }
        }

