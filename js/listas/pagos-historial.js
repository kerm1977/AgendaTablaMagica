/* ==========================================================================
 * ARCHIVO: js/listas/pagos-historial.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: renderHistorialMontos
 * ========================================================================== */

        function renderHistorialMontos(historial) {
            const cont = document.getElementById('historial-montos');
            const totalDiv = document.getElementById('cam-usu-total-recogido');
            cont.innerHTML = '';
            let total = 0;
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const sym = cam ? (cam.moneda || '₡') : '₡';
            const nombre = document.getElementById('cam-usu-nombre').value || 'el caminante';

            if (historial && historial.length > 0) {
                historial.forEach((item, index) => {
                    const row = document.createElement('div');
                    row.className = 'd-flex flex-column w-100 badge bg-light text-secondary border p-1';
                    row.style.fontSize = '0.7rem';
                    row.style.opacity = '0.5';

                    const header = document.createElement('div');
                    header.className = 'd-flex justify-content-between align-items-start w-100';
                    header.style.flexWrap = 'wrap';

                    const texto = document.createElement('span');
                    texto.style.wordBreak = 'break-word';
                    texto.style.whiteSpace = 'normal';
                    texto.style.maxWidth = '100%';
                    if (item.reversado) {
                        const desc = item.descripcionReversion ? ` - ${item.descripcionReversion}` : '';
                        const fechaEdit = item.fechaEdicionReversion ? ` (editado: ${item.fechaEdicionReversion})` : '';
                        texto.innerHTML = `<del>${item.monto} - ${item.fecha}</del> <span class="text-danger">(reversado${desc}${fechaEdit})</span>`;
                        texto.title = 'Doble clic para editar la descripción de reversión';
                        texto.style.cursor = 'pointer';
                        texto.ondblclick = () => editarDescripcionReversion(index);
                    } else {
                        const descPago = item.descripcionPago ? ` - ${item.descripcionPago}` : '';
                        const formaPago = item.formaPago ? ` [${item.formaPago}]` : '';
                        const monedaExtra = item.monedaPago === 'Dólares' && item.tipoCambio
                            ? ` (USD ${item.montoOriginal} × ${item.tipoCambio})`
                            : '';
                        const fechaEditPago = item.fechaEdicionPago ? ` (editado: ${item.fechaEdicionPago})` : '';
                        let detallePago = '';
                        if (item.pagadoPor && item.pagadoPor !== nombre) {
                            detallePago = ` <span class="text-info">(Pagado por ${escapeHtml(item.pagadoPor)})</span>`;
                        }
                        if (item.destinoPago) {
                            const destino = cam && cam.pasajeros ? cam.pasajeros.find(p => p.id === item.destinoPago) : null;
                            const destinoNombre = destino ? destino.nombre : 'otro caminante';
                            detallePago = ` <span class="text-info">(Pago a ${escapeHtml(destinoNombre)} por ${escapeHtml(item.pagadoPor || 'alguien')})</span>`;
                        }
                        const estadoAbono = (item.estadoPago || item.estado || '') + (item.abonos ? ` / ${item.abonos}` : '');
                        texto.innerHTML = `${item.monto} - ${item.fecha}${formaPago}${monedaExtra}${descPago}${fechaEditPago} <span class="badge bg-light text-secondary border" style="font-size:0.65rem;">${estadoAbono}</span>${detallePago}`;
                        texto.title = 'Doble clic para editar la descripción de pago';
                        texto.style.cursor = 'pointer';
                        texto.ondblclick = () => editarPago(index);
                        total += Number(item.monto || 0);
                    }

                    const acciones = document.createElement('span');
                    acciones.style.flexShrink = '0';
                    acciones.style.marginLeft = '0.5rem';
                    if (!item.reversado) {
                        const btn = document.createElement('button');
                        btn.type = 'button';
                        btn.className = 'btn btn-link p-0 text-muted';
                        btn.title = 'Reversar / Devolución';
                        btn.style.fontSize = '0.7rem';
                        btn.onclick = () => reversarMonto(index);
                        btn.innerHTML = '<i class="fas fa-trash-alt"></i>';
                        acciones.appendChild(btn);
                    }

                    header.appendChild(texto);
                    header.appendChild(acciones);
                    row.appendChild(header);

                    cont.appendChild(row);
                });
            }

            if (totalDiv) {
                const precio = Number(cam ? cam.precio || 0 : 0);
                const excedente = total - precio;
                const excedenteHtml = excedente > 0
                    ? `<br><span class="text-success small">Pagó de más: ${sym}${excedente}</span>`
                    : '';
                totalDiv.innerHTML = `Total recogido hasta el momento de ${nombre}: ${sym}${total}${excedenteHtml}`;
            }
        }

