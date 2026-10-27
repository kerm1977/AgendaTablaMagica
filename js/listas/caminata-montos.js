/* ==========================================================================
 * ARCHIVO: js/listas/caminata-montos.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: actualizarMontoReserva, actualizarMonedaPorTipoPrecio, togglePagoDestino, calcularMontosDivididos, calcularMontoOtro, calcularMontoActual, toTitleCase
 * ========================================================================== */

        // --- STREAMING_CHUNK: Form Utilities ---
        function actualizarMontoReserva() {
            const precioInput = document.getElementById('cam-precio');
            const reservaInput = document.getElementById('cam-reserva-monto');
            if (!precioInput || !reservaInput) return;

            const precio = Number(precioInput.value);
            if (!precio) return;

            let reserva = '';
            if (precio < 10000) {
                reserva = 3000;
            } else if (precio === 15000) {
                reserva = 5000;
            } else if (precio > 50000) {
                reserva = 10000;
            } else {
                return; // no cambiar si no aplica regla, mantener manual
            }

            reservaInput.value = reserva;
        }


        function actualizarMonedaPorTipoPrecio() {
            const actividad = document.getElementById('cam-actividad').value;
            const precio = document.getElementById('cam-precio').value;
            const monedaSelect = document.getElementById('cam-moneda');
            if (!monedaSelect) return;

            if (actividad === 'Internacional') {
                if (precio.length <= 3 && Number(precio) > 0) {
                    monedaSelect.value = '$';
                } else if (precio.length > 3) {
                    monedaSelect.value = '₡';
                }
            }
            updateCurrencySymbols();
        }


        function togglePagoDestino() {
            const tipo = document.getElementById('cam-usu-pago-destino').value;
            const otroContainer = document.getElementById('cam-usu-otro-container');
            const personalizadoContainer = document.getElementById('cam-usu-montos-personalizado');

            if (tipo === 'este') {
                otroContainer.classList.add('d-none');
                personalizadoContainer.classList.add('d-none');
            } else if (tipo === 'otro') {
                otroContainer.classList.remove('d-none');
                personalizadoContainer.classList.add('d-none');
            } else if (tipo === 'mitad') {
                otroContainer.classList.remove('d-none');
                personalizadoContainer.classList.add('d-none');
                calcularMontosDivididos();
            } else if (tipo === 'personalizado') {
                otroContainer.classList.remove('d-none');
                personalizadoContainer.classList.remove('d-none');
            }
        }


        function calcularMontosDivididos() {
            const total = Number(document.getElementById('cam-usu-monto-cancelado').value) || 0;
            const tipo = document.getElementById('cam-usu-pago-destino').value;
            const montoActualInput = document.getElementById('cam-usu-monto-actual');
            const montoOtroInput = document.getElementById('cam-usu-monto-otro');

            if (tipo === 'mitad') {
                montoActualInput.value = Math.floor(total / 2);
                montoOtroInput.value = Math.ceil(total / 2);
            }
        }


        function calcularMontoOtro() {
            const total = Number(document.getElementById('cam-usu-monto-cancelado').value) || 0;
            const actual = Number(document.getElementById('cam-usu-monto-actual').value) || 0;
            document.getElementById('cam-usu-monto-otro').value = Math.max(0, total - actual);
        }


        function calcularMontoActual() {
            const total = Number(document.getElementById('cam-usu-monto-cancelado').value) || 0;
            const otro = Number(document.getElementById('cam-usu-monto-otro').value) || 0;
            document.getElementById('cam-usu-monto-actual').value = Math.max(0, total - otro);
        }


        function toTitleCase(str) {
            if (!str) return str;
            return str.toLowerCase().replace(/(?:^|\s)\S/g, m => m.toUpperCase());
        }

