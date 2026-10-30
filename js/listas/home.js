/* ==========================================================================
 * ARCHIVO: js/listas/home.js — extraído del monolito (bloque LISTAS/CAMINATAS)
 * Funciones: renderHome, filtrarCaminatas, cambiarPaginaCaminatas, createNewCaminata
 * ========================================================================== */
        
        function renderHome() {
            const listContainer = document.getElementById('caminatas-list');
            const emptyState = document.getElementById('empty-state');
            const searchInput = document.getElementById('buscar-caminatas');
            const searchText = searchInput ? searchInput.value.toLowerCase() : '';
            const paginacionDiv = document.getElementById('caminatas-paginacion');
            
            listContainer.innerHTML = '';
            
            let caminatasFiltradas = [...caminatas];
            
            // Aplicar filtro de búsqueda
            if (searchText) {
                const palabras = searchText.trim().split(/\s+/).filter(w => w);
                caminatasFiltradas = caminatasFiltradas.filter(cam => {
                    const texto = [
                        cam.nombre || '',
                        cam.actividad || '',
                        cam.lugar || '',
                        cam.provincia || '',
                        cam.pais || 'Costa Rica',
                        cam.dificultad || '',
                        cam.km || '',
                        cam.transporte || '',
                        cam.lugarSalida || '',
                        cam.lugaresRecoger || '',
                        cam.precio || '',
                        cam.moneda || '',
                        cam.precioBuseta || '',
                        cam.formasPago || '',
                        cam.reservaMonto || '',
                        cam.tipo || '',
                        cam.etapa || '',
                        cam.parque || ''
                    ].join(' ').toLowerCase();
                    return palabras.every(w => texto.includes(w));
                });
            }
            
            if (caminatasFiltradas.length === 0) {
                if (caminatas.length === 0) {
                    emptyState.classList.remove('d-none');
                    emptyState.innerHTML = `
                        <i class="fas fa-hiking fa-4x text-muted mb-3"></i>
                        <h5 class="text-muted">No hay caminatas creadas.</h5>
                        <p class="text-muted small">Toca el botón + para crear una nueva.</p>
                    `;
                } else {
                    emptyState.classList.remove('d-none');
                    emptyState.innerHTML = `
                        <i class="fas fa-search fa-4x text-muted mb-3"></i>
                        <h5 class="text-muted">No se encontraron caminatas con ese criterio.</h5>
                        <p class="text-muted small">Intenta con otra búsqueda.</p>
                    `;
                }
                paginacionDiv.style.display = 'none';
            } else {
                emptyState.classList.add('d-none');
                
                // Ordenar más recientes primero
                const sorted = caminatasFiltradas.reverse();
                
                // Calcular paginación
                const totalPaginas = Math.ceil(sorted.length / CAMINATAS_POR_PAGINA);
                caminatasPaginaActual = Math.min(caminatasPaginaActual, totalPaginas);
                const inicio = (caminatasPaginaActual - 1) * CAMINATAS_POR_PAGINA;
                const fin = inicio + CAMINATAS_POR_PAGINA;
                const caminatasPagina = sorted.slice(inicio, fin);
                
                caminatasPagina.forEach(cam => {
                    // Mantenemos cam.pasajeros en el JSON para no perder compatibilidad con respaldos
                    const caminantesCount = cam.pasajeros ? cam.pasajeros.length : 0;
                    
                    let fechaText = "";
                    if(cam.tipo === 'Local' && cam.fechaLocal) {
                        fechaText = formatDateString(cam.fechaLocal);
                    } else if (cam.tipo === 'Internacional' && cam.fechaIda) {
                         fechaText = `${formatDateStringShort(cam.fechaIda)} al ${formatDateStringShort(cam.fechaRegreso)}`;
                    }

                    const safeId = escapeJsString(cam.id);
                    const card = document.createElement('div');
                    card.className = 'list-card';
                    card.innerHTML = `
                        <div class="d-flex justify-content-between align-items-start">
                            <div onclick="openCaminata('${safeId}')" style="cursor:pointer; flex-grow:1;">
                                <h6 class="mb-1 fw-bold text-primary-dark">${escapeHtml(cam.nombre)}</h6>
                                <div class="text-muted small mb-2">
                                    <i class="far fa-calendar-alt me-1"></i> ${fechaText || 'Fecha no definida'} <br>
                                    <i class="fas fa-users me-1"></i> ${caminantesCount} Caminantes <br>
                                    <i class="fas fa-tag me-1"></i> Precio por persona: ${cam.moneda || '₡'}${Number(cam.precio || 0)} <br>
                                    ${cam.usarBuseta ? `<i class="fas fa-bus me-1"></i> Precio buseta: ${cam.moneda || '₡'}${Number(cam.precioBuseta || 0)}` : ''}
                                </div>
                                <span class="badge bg-secondary">${escapeHtml(cam.tipo)}</span>
                                ${cam._por ? `<span class="badge bg-light text-dark border ms-1"><i class="fas fa-user"></i> ${escapeHtml(cam._por)}</span>` : ''}
                            </div>
                            <button class="btn btn-sm text-danger" aria-label="Eliminar caminata" onclick="confirmarBorradoCaminata('${safeId}')" style="padding:0; margin-left:10px;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    listContainer.appendChild(card);
                });
                
                // Mostrar paginación solo si hay más de una página
                if (totalPaginas > 1) {
                    paginacionDiv.style.display = 'flex';
                    document.getElementById('caminatas-pagina-info').innerText = `Página ${caminatasPaginaActual} de ${totalPaginas}`;
                    document.getElementById('caminatas-anterior').disabled = caminatasPaginaActual <= 1;
                    document.getElementById('caminatas-siguiente').disabled = caminatasPaginaActual >= totalPaginas;
                } else {
                    paginacionDiv.style.display = 'none';
                }
            }
        }

        
        function filtrarCaminatas() {
            caminatasPaginaActual = 1; // Resetear a página 1 al buscar
            renderHome();
        }

        
        function cambiarPaginaCaminatas(delta) {
            caminatasPaginaActual += delta;
            renderHome();
        }


        function createNewCaminata() {
            currentCaminataId = Date.now().toString(); // Generate ID
            
            // UI Resets
            document.getElementById('form-caminata').reset();
            document.getElementById('caminata-id').value = currentCaminataId;
            renderFormasPagoCaminata([]);
            renderUrlsCaminata([]);
            renderEquipoCaminata();
            
            // Limpiar explícitamente el HTML de la vista anterior para evitar caminantes fantasma
            document.getElementById('lista-caminantes').innerHTML = ''; 
            
            // Resetear contadores y resultados calculados
            document.getElementById('caminantes-count').innerText = '0';
            document.getElementById('cam-cantidad-participantes').innerText = '0';
            document.getElementById('cam-total-personas-pagan').innerText = '0';

            // Resetear campos de buseta (modal)
            document.getElementById('cam-usar-buseta').checked = true;
            document.getElementById('cam-precio-buseta').value = '';
            document.getElementById('cam-cantidad-busetas').value = '1';
            document.getElementById('cam-cantidad-guias').value = '2';

            actualizarSugerenciasCaminatas();
            
            toggleDateFields();
            updateCurrencySymbols();
            updateTotalTransporte();
            document.getElementById('caminantes-section').style.display = 'none';
            document.getElementById('detail-title').innerText = "Nueva Caminata";
            
            // Asegurar que el formulario esté expandido al crear
            document.getElementById('collapseHeader').classList.add('show');
            
            const infoCollapse = document.getElementById('collapseInfo');
            if (infoCollapse) { new bootstrap.Collapse(infoCollapse, { toggle: false }).show(); }
            
            navigate('caminata', "Crear Lista");
        }

