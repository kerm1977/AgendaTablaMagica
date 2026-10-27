/* ==========================================================================
 * ARCHIVO: js/listas/caminantes-lista.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: renderCaminantes, tienePagoPendiente
 * ========================================================================== */

        function renderCaminantes(filterText = "") {
            const listDiv = document.getElementById('lista-caminantes');
            listDiv.innerHTML = ''; // Limpiar siempre primero
            
            const cam = caminatas.find(c => c.id === currentCaminataId);
            if(!cam) return;

            const totalCaminantes = (cam.pasajeros || []).length;
            document.getElementById('caminantes-count').innerText = totalCaminantes;

            const guias = Number(cam.cantidadGuias || 2);
            const personasPagan = Math.max(0, totalCaminantes - guias);
            document.getElementById('cam-cantidad-participantes').innerText = totalCaminantes;
            document.getElementById('cam-total-personas-pagan').innerText = personasPagan;

            // Auto-ajustar cantidad de busetas según participantes
            const selectBuses = document.getElementById('cam-cantidad-busetas');
            let busesNecesarias = 1;
            if (totalCaminantes > 31) busesNecesarias = 3;
            else if (totalCaminantes > 17) busesNecesarias = 2;
            if (Number(selectBuses.value) !== busesNecesarias) {
                selectBuses.value = busesNecesarias;
                cam.cantidadBuses = String(busesNecesarias);
                updateTotalTransporte();
            }

            let caminantes = cam.pasajeros || [];

            // Orden de prioridad para la primera buseta (cascada descendente)
            const prioridad = {
                'cancelado': 1,
                'abono': 2,
                'pago-parcial': 3,
                'reservado': 4,
                'reserva-parcial': 5,
                'pendiente': 6
            };

            const ordenarCaminantes = (arr) => {
                const ordenados = [...arr].sort((a, b) => {
                    const pa = prioridad[a.estado] || 99;
                    const pb = prioridad[b.estado] || 99;
                    if (pa !== pb) return pa - pb;
                    return a.nombre.localeCompare(b.nombre);
                });
                const grupo1 = ordenados.filter(p => p.estado !== 'pendiente');
                const grupo2 = ordenados.filter(p => p.estado === 'pendiente');
                return [...grupo1, ...grupo2];
            };

            if(filterText) {
                const lowerFilter = filterText.toLowerCase();
                caminantes = caminantes.filter(p => p.nombre.toLowerCase().includes(lowerFilter));
                caminantes = ordenarCaminantes(caminantes);
            } else {
                caminantes = ordenarCaminantes(caminantes);
            }

            const primerBuseta = caminantes.filter(p => p.estado !== 'pendiente');

            if(caminantes.length === 0) {
                listDiv.innerHTML = '<p class="text-muted small text-center my-3">No hay caminantes en la lista.</p>';
                return;
            }

            caminantes.forEach((pas, index) => {
                const item = document.createElement('div');
                item.className = 'caminante-item flex-column align-items-stretch';
                // Hacer que todo el div sea clickeable
                item.setAttribute('onclick', `openCaminanteModal('${escapeJsString(pas.id)}')`);
                
                const cssClass = `status-${pas.estado}`; // ej: status-reservado

                const coloresEstado = {
                    'pendiente': '#dc3545',
                    'reservado': '#ffc107',
                    'reserva-parcial': '#0d6efd',
                    'pago-parcial': '#6f42c1',
                    'abono': '#fd7e14',
                    'cancelado': '#198758'
                };
                const colorEstado = coloresEstado[pas.estado] || '#6c757d';
                
                // Mostrar abonos si existen
                let abonoHtml = '';
                if (pas.abonos && pas.abonos !== '') {
                    // Traducción retroactiva para vistas antiguas (R+1 -> Ab+1)
                    let displayAbono = pas.abonos.replace('R+', 'Ab+');
                    abonoHtml = `<span class="abono-badge">${escapeHtml(displayAbono)}</span>`;
                }
                
                let notaPreview = '';
                if(pas.nota && pas.nota.trim() !== '') {
                    // Ícono que refleja si la nota es pública o privada
                    const privacyIcon = pas.notaPublica ? '<i class="fas fa-eye text-primary me-1" title="Pública"></i>' : '<i class="fas fa-lock text-warning me-1" title="Privada"></i>';
                    const notaLimpia = escapeHtml(pas.nota.replace(/<[^>]*>?/gm, ' '));
                    notaPreview = `<div class="text-muted w-100 ps-4 mt-1" style="font-size: 0.75rem; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;">${privacyIcon} ${notaLimpia}</div>`;
                }

                let totalPreview = '';
                if (pas.mostrarTotalEnLista !== false) {
                    const totalPagado = (pas.historialMontos || []).filter(i => !i.reversado).reduce((s, i) => s + Number(i.monto || 0), 0);
                    const sym = cam.moneda || '₡';
                    totalPreview = `<div class="text-muted w-100 ps-4" style="font-size: 0.7rem;">Total recogido: ${sym}${totalPagado}</div>`;
                }

                let saldoPreview = '';
                if (pas.mostrarSaldoPendiente) {
                    const totalPagado = (pas.historialMontos || []).filter(i => !i.reversado).reduce((s, i) => s + Number(i.monto || 0), 0);
                    const precio = Number(cam.precio || 0);
                    const saldo = Math.max(0, precio - totalPagado);
                    const sym = cam.moneda || '₡';
                    saldoPreview = `<div class="text-danger w-100 ps-4" style="font-size: 0.7rem;">Saldo pendiente: ${sym}${saldo}</div>`;
                }
                
                item.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center flex-grow-1">
                            <span class="text-muted small me-2 text-end" style="width: 20px;">${index + 1}.</span>
                            <span class="status-dot ${cssClass}" style="background-color: ${colorEstado} !important;"></span>
                            <span class="fw-medium">${escapeHtml(pas.nombre)}</span>
                            ${abonoHtml}
                        </div>
                        <i class="fas fa-ellipsis-v text-muted px-2"></i>
                    </div>
                    ${totalPreview}
                    ${saldoPreview}
                    ${notaPreview}
                `;
                listDiv.appendChild(item);

                // Separador informativo de Buseta #2 entre primer y segundo grupo
                if (index === primerBuseta.length - 1 && index < caminantes.length - 1) {
                    const separador = document.createElement('div');
                    separador.className = 'text-center py-2 my-1';
                    separador.style.background = '#f8f9fa';
                    separador.style.borderTop = '2px dashed #6c757d';
                    separador.style.borderBottom = '2px dashed #6c757d';
                    separador.style.fontSize = '0.8rem';
                    separador.style.fontWeight = '700';
                    separador.style.color = 'var(--primary-dark)';
                    separador.innerHTML = `<i class="fas fa-bus me-1"></i> Buseta #2 <span class="fw-normal text-muted" style="font-size:0.7rem;">(Estado pendiente)</span>`;
                    listDiv.appendChild(separador);
                }
            });

            // Resumen financiero disimulado fuera del recuadro de caminantes
            const resumenDiv = document.getElementById('resumen-financiero');
            if (resumenDiv) {
                const sym = cam.moneda || '₡';
                const totalRecogido = (cam.pasajeros || []).reduce((s, p) => {
                    const pagado = (p.historialMontos || []).filter(i => !i.reversado).reduce((a, i) => a + Number(i.monto || 0), 0);
                    return s + pagado;
                }, 0);
                const totalARecoger = Number(cam.precio || 0) * personasPagan;
                const faltante = Math.max(0, totalARecoger - totalRecogido);
                resumenDiv.style.fontSize = '0.7rem';
                resumenDiv.style.opacity = '0.5';
                resumenDiv.style.color = '#6c757d';
                resumenDiv.style.textAlign = 'right';
                resumenDiv.innerHTML = `Recogido: ${sym}${totalRecogido} &bull; A recoger: ${sym}${totalARecoger} &bull; Faltante: ${sym}${faltante}`;
            }

            updateDeudaPorPersona();
            updateDineroARecoger();
            updateFabState();
            renderAsistenciaCaminantes();
        }


        function tienePagoPendiente(pas, cam) {
            const totalPagado = (pas.historialMontos || []).filter(i => !i.reversado).reduce((s, i) => s + Number(i.monto || 0), 0);
            const saldo = Number(cam.precio || 0) - totalPagado;
            return saldo > 0;
        }

