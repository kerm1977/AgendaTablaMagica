/* ==========================================================================
 * ARCHIVO: js/listas/pagos-reversiones.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: reversarMonto, editarDescripcionReversion, confirmarReversion, compartirWhatsAppCaminante
 * ========================================================================== */

        function reversarMonto(index) {
            pendingReversionIndex = index;
            document.getElementById('reversion-descripcion').value = '';
            modalReversion.show();
        }


        function editarDescripcionReversion(index) {
            const pasId = document.getElementById('caminante-id').value;
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam || !pasId) return;
            const pas = cam.pasajeros.find(p => p.id === pasId);
            if (!pas || !pas.historialMontos || !pas.historialMontos[index]) return;

            pendingReversionIndex = index;
            const desc = pas.historialMontos[index].descripcionReversion || '';
            document.getElementById('reversion-descripcion').value = desc === 'Sin descripción' ? '' : desc;
            modalReversion.show();
        }


        async function confirmarReversion() {
            if (pendingReversionIndex === null) return;
            const pasId = document.getElementById('caminante-id').value;
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam || !pasId) return;
            const pas = cam.pasajeros.find(p => p.id === pasId);
            if (!pas || !pas.historialMontos || !pas.historialMontos[pendingReversionIndex]) return;

            const descripcion = document.getElementById('reversion-descripcion').value.trim();
            if (!pas.historialMontos[pendingReversionIndex].reversado) {
                pas.historialMontos[pendingReversionIndex].reversado = true;
            }
            pas.historialMontos[pendingReversionIndex].descripcionReversion = descripcion || 'Sin descripción';
            pas.historialMontos[pendingReversionIndex].fechaEdicionReversion = new Date().toLocaleString();

            await saveData();
            renderHistorialMontos(pas.historialMontos);
            const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
            await actualizarEstadoPagoPorMonto(camIndex, pasId);
            modalReversion.hide();
            pendingReversionIndex = null;
        }


        function compartirWhatsAppCaminante() {
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam) return;
            const pasId = document.getElementById('caminante-id').value;
            const pas = cam.pasajeros ? cam.pasajeros.find(p => p.id === pasId) : null;
            const mostrarDescReversion = document.getElementById('cam-usu-mostrar-desc-reversion').checked;
            const mostrarDescPago = document.getElementById('cam-usu-mostrar-desc-pago').checked;
            const mostrarReversiones = document.getElementById('cam-usu-mostrar-reversiones').checked;
            const mostrarPagosActivos = document.getElementById('cam-usu-mostrar-pagos-activos').checked;
            const dolarizar = document.getElementById('cam-usu-dolarizar').checked;
            const tipoCambioDolar = Number(document.getElementById('cam-usu-tipo-cambio-dolar').value) || 1;
            const nombre = limpiarNbsp(document.getElementById('cam-usu-nombre').value) || 'Caminante';
            const sym = dolarizar ? '$' : (cam.moneda || '₡');
            const cv = (monto) => dolarizar ? (Number(monto || 0) / tipoCambioDolar).toFixed(2) : (monto || 0);
            const fechaLugarTexto = cam.tipo === 'Local'
                ? formatDateString(cam.fechaLocal)
                : `Ida: ${formatDateString(cam.fechaIda)} - Regreso: ${formatDateString(cam.fechaRegreso)}`;

            let registro = '';
            if (pas && pas.historialMontos && pas.historialMontos.length > 0) {
                registro = `\n\n*Registro de pagos de ${nombre}:*\n`;
                pas.historialMontos.forEach(item => {
                    if (item.reversado && !mostrarReversiones) return;
                    if (!item.reversado && !mostrarPagosActivos) return;
                    if (item.reversado) {
                        const descRev = mostrarDescReversion && item.descripcionReversion
                            ? ` - ${item.descripcionReversion}`
                            : '';
                        const fechaEdit = mostrarDescReversion && item.fechaEdicionReversion
                            ? ` - editado: ${item.fechaEdicionReversion}`
                            : '';
                        registro += `~${sym}${cv(item.monto)} - ${item.fecha}~ (reversado${descRev}${fechaEdit})\n`;
                    } else {
                        const descPago = mostrarDescPago && item.descripcionPago
                            ? ` - ${item.descripcionPago}`
                            : '';
                        const formaPago = item.formaPago ? ` [${item.formaPago}]` : '';
                        const monedaExtra = !dolarizar && item.monedaPago === 'Dólares' && item.tipoCambio
                            ? ` (USD ${item.montoOriginal} × ${item.tipoCambio} = ${cam.moneda || '₡'}${item.monto})`
                            : '';
                        const fechaEditPago = mostrarDescPago && item.fechaEdicionPago
                            ? ` (editado: ${item.fechaEdicionPago})`
                            : '';
                        let detalleTercero = '';
                        if (item.pagadoPor && item.pagadoPor !== nombre) {
                            detalleTercero = ` (pagado por ${item.pagadoPor})`;
                        }
                        if (item.destinoPago) {
                            const destino = cam.pasajeros.find(p => p.id === item.destinoPago);
                            const destinoNombre = destino ? destino.nombre : 'otro';
                            detalleTercero = ` (a ${destinoNombre} por ${item.pagadoPor || 'alguien'})`;
                        }
                        const estadoAbono = (item.estadoPago || '') + (item.abonos ? ` / ${item.abonos}` : '');
                        registro += `${sym}${cv(item.monto)} - ${item.fecha}${formaPago}${monedaExtra}${descPago}${fechaEditPago}${estadoAbono ? ' [' + estadoAbono + ']' : ''}${detalleTercero}\n`;
                    }
                });
            }

            const notaEsPublica = document.getElementById('cam-usu-nota-publica').checked;
            const notaPublica = notaEsPublica && pas && pas.nota
                ? `\n\nNota:\n${parseHtmlForWhatsApp(pas.nota)}`
                : '';

            const totalPagado = pas && pas.historialMontos
                ? pas.historialMontos.filter(i => !i.reversado).reduce((s, i) => s + Number(i.monto || 0), 0)
                : 0;
            const cancelado = pas && cam.precio && totalPagado >= Number(cam.precio)
                ? `\n\n🟢 Cancelado\nGracias ${nombre}, por haberse unido a una aventura más con La Tribu de Los Libres.`
                : '';

            const mensaje = `*Respaldo de pago*\n\n` +
                            `Caminata: ${cam.nombre}${cam.provincia ? '\nProvincia: ' + cam.provincia : ''}\n` +
                            `Participante: ${nombre}\n` +
                            `Precio total: ${sym}${cv(cam.precio)}\n` +
                            `Monto de reserva: ${sym}${cv(cam.reservaMonto)}\n` +
                            `Fecha límite de reserva: ${formatDateString(cam.reservaFecha)}\n` +
                            `Fecha del lugar: ${fechaLugarTexto}\n` +
                            `Moneda: ${sym}` +
                            registro +
                            notaPublica +
                            cancelado;

            const mensajeLimpio = limpiarNbsp(mensaje);
            window.open(`https://wa.me/?text=${encodeURIComponent(mensajeLimpio)}`, '_blank');
        }

