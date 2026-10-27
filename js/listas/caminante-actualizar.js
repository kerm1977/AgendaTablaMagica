/* ==========================================================================
 * ARCHIVO: js/listas/caminante-actualizar.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: editarPago, guardarCaminante
 * ========================================================================== */

        function editarPago(index) {
            const pasId = document.getElementById('caminante-id').value;
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if (!cam || !pasId) return;
            const pas = cam.pasajeros.find(p => p.id === pasId);
            if (!pas || !pas.historialMontos || !pas.historialMontos[index]) return;

            const item = pas.historialMontos[index];
            pendingPagoIndex = index;
            document.getElementById('pago-descripcion').value = item.descripcionPago || '';
            document.getElementById('pago-forma').value = item.formaPago || 'SINPE';
            modalPago.show();
        }


        async function guardarCaminante({ nombre, estado, abonos, pasId, notaHtml, notaPublica, mostrarDescReversion, mostrarDescPago, mostrarReversiones, mostrarPagosActivos, mostrarTotalEnLista, mostrarSaldoPendiente, dolarizar, tipoCambioDolar, montoDataList = [] }) {
            const camIndex = caminatas.findIndex(c => c.id === currentCaminataId);
            if (camIndex === -1) return;

            const montoParaActual = montoDataList.find(m => !m.destinoPago) || null;

            if (pasId) {
                // Actualizar
                const pIndex = caminatas[camIndex].pasajeros.findIndex(p => p.id === pasId);
                if(pIndex > -1) {
                    let historialMontos = caminatas[camIndex].pasajeros[pIndex].historialMontos || [];
                    const abonoAnterior = caminatas[camIndex].pasajeros[pIndex].abonos;
                    if (montoParaActual) {
                        historialMontos = [...historialMontos, montoParaActual];
                    }
                    // Si el abono cambió, actualizar todos los pagos del historial
                    if (abonos !== abonoAnterior) {
                        historialMontos.forEach(item => {
                            if (!item.reversado) {
                                item.abonos = abonos;
                            }
                        });
                    }
                    caminatas[camIndex].pasajeros[pIndex].nombre = nombre;
                    caminatas[camIndex].pasajeros[pIndex].estado = estado;
                    caminatas[camIndex].pasajeros[pIndex].abonos = abonos;
                    caminatas[camIndex].pasajeros[pIndex].historialMontos = historialMontos;
                    caminatas[camIndex].pasajeros[pIndex].nota = notaHtml;
                    caminatas[camIndex].pasajeros[pIndex].notaPublica = notaPublica;
                    caminatas[camIndex].pasajeros[pIndex].mostrarDescReversion = mostrarDescReversion;
                    caminatas[camIndex].pasajeros[pIndex].mostrarDescPago = mostrarDescPago;
                    caminatas[camIndex].pasajeros[pIndex].mostrarReversiones = mostrarReversiones;
                    caminatas[camIndex].pasajeros[pIndex].mostrarPagosActivos = mostrarPagosActivos;
                    caminatas[camIndex].pasajeros[pIndex].mostrarTotalEnLista = mostrarTotalEnLista;
                    caminatas[camIndex].pasajeros[pIndex].mostrarSaldoPendiente = mostrarSaldoPendiente;
                    caminatas[camIndex].pasajeros[pIndex].dolarizar = dolarizar;
                    caminatas[camIndex].pasajeros[pIndex].tipoCambioDolar = tipoCambioDolar;
                }
            } else {
                // Nuevo
                const historialMontos = montoParaActual ? [montoParaActual] : [];
                caminatas[camIndex].pasajeros.push({
                    id: Date.now().toString(),
                    nombre: nombre,
                    estado: estado,
                    abonos: abonos,
                    historialMontos: historialMontos,
                    nota: notaHtml,
                    notaPublica: notaPublica,
                    mostrarDescReversion: mostrarDescReversion,
                    mostrarDescPago: mostrarDescPago,
                    mostrarReversiones: mostrarReversiones,
                    mostrarPagosActivos: mostrarPagosActivos,
                    mostrarTotalEnLista: mostrarTotalEnLista,
                    mostrarSaldoPendiente: mostrarSaldoPendiente,
                    dolarizar: dolarizar,
                    tipoCambioDolar: tipoCambioDolar
                });
            }

            // Agregar al directorio global si no existe
            if (!personasGlobales.includes(nombre)) {
                personasGlobales.push(nombre);
            }
            if (!directorioPersonas.find(p => p.nombre === nombre)) {
                directorioPersonas.push({
                    id: Date.now().toString(),
                    nombre: nombre,
                    cedula: '',
                    telefono: '',
                    correo: ''
                });
            }

            const pasIdFinal = pasId || caminatas[camIndex].pasajeros[caminatas[camIndex].pasajeros.length - 1].id;
            await actualizarEstadoPagoPorMonto(camIndex, pasIdFinal);

            // Completar montoData con estado del pasajero que recibió el pago y abono del formulario
            if (montoParaActual) {
                const pasFinal = caminatas[camIndex].pasajeros.find(p => p.id === pasIdFinal);
                if (pasFinal) {
                    montoParaActual.estadoPago = pasFinal.estado;
                    montoParaActual.abonos = abonos;
                }
            }

            // Si hay pagos para otros caminantes, agregar el monto a sus historiales
            const montosParaOtros = montoDataList.filter(m => m.destinoPago);
            for (const montoData of montosParaOtros) {
                const destinoIndex = caminatas[camIndex].pasajeros.findIndex(p => p.id === montoData.destinoPago);
                if (destinoIndex > -1) {
                    caminatas[camIndex].pasajeros[destinoIndex].historialMontos = [...(caminatas[camIndex].pasajeros[destinoIndex].historialMontos || []), montoData];
                    await actualizarEstadoPagoPorMonto(camIndex, montoData.destinoPago);
                    montoData.estadoPago = caminatas[camIndex].pasajeros[destinoIndex].estado;
                    montoData.abonos = abonos;
                }
            }

            if (montosParaOtros.length > 0) {
                const destinoNombres = montosParaOtros.map(m => {
                    const p = caminatas[camIndex].pasajeros.find(x => x.id === m.destinoPago);
                    return p ? p.nombre : '';
                }).filter(n => n).join(', ');
                showToast(`Pago aplicado a ${destinoNombres}`);
            }

            ajustarCantidadBusetas(camIndex);
            await saveData();
            renderCaminantes(document.getElementById('search-caminante').value); // Mantener filtro si existe
            // Forzar un segundo render para asegurar que el color de estado se aplique
            setTimeout(() => renderCaminantes(document.getElementById('search-caminante').value), 50);
            modalCaminante.hide();
        }

