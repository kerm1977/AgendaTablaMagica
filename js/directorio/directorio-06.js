/* ARCHIVO: js/directorio/directorio-06.js */

        function abrirHistorialRetiros() {
            const cont = document.getElementById('historial-retiros-contenido');
            const footer = document.getElementById('historial-retiros-footer');

            if (!historialRetiros || historialRetiros.length === 0) {
                cont.innerHTML = '<p class="text-muted small fst-italic text-center my-4">Todavía no se ha retirado a nadie de ninguna lista.</p>';
                if (footer) footer.style.display = 'none';
                modalHistorialRetiros.show();
                return;
            }
            if (footer) footer.style.display = 'block';

            // Estadística por persona: cuántas veces se retiró cada quién
            const porPersona = {};
            historialRetiros.forEach(r => {
                const key = r.nombre || 'Desconocido';
                if (!porPersona[key]) porPersona[key] = 0;
                porPersona[key]++;
            });
            const estadisticaHtml = Object.entries(porPersona)
                .sort((a, b) => b[1] - a[1])
                .map(([nombre, cantidad]) => `
                    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                        <span>${escapeHtml(nombre)}</span>
                        <span class="badge bg-secondary">${cantidad} retiro${cantidad !== 1 ? 's' : ''}</span>
                    </div>
                `).join('');

            // Historial completo, más reciente primero
            historialRetirosOrdenado = [...historialRetiros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            historialRetirosPaginaActual = 1;

            cont.innerHTML = `
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-chart-bar"></i> Estadística por persona
                </div>
                <div class="mb-3">${estadisticaHtml}</div>
                <hr>
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-list"></i> Historial completo
                </div>
                <div class="list-group" id="historial-retiros-lista"></div>
                <div class="d-flex justify-content-between align-items-center mt-3" id="historial-retiros-paginacion"></div>
            `;

            renderPaginaHistorialRetiros(1);
            modalHistorialRetiros.show();
        }


        function renderPaginaHistorialRetiros(pagina) {
            const totalPaginas = Math.max(1, Math.ceil(historialRetirosOrdenado.length / RETIROS_POR_PAGINA));
            pagina = Math.min(Math.max(1, pagina), totalPaginas);
            historialRetirosPaginaActual = pagina;

            const inicio = (pagina - 1) * RETIROS_POR_PAGINA;
            const itemsPagina = historialRetirosOrdenado.slice(inicio, inicio + RETIROS_POR_PAGINA);

            const listaHtml = itemsPagina.map(r => `
                <div class="list-group-item">
                    <div class="fw-medium">${escapeHtml(r.nombre || 'Desconocido')}</div>
                    <div class="small text-muted">
                        <i class="fas fa-route me-1"></i>${escapeHtml(r.camNombre || 'Caminata eliminada')}
                        &nbsp;·&nbsp;
                        <i class="fas fa-calendar-alt me-1"></i>${formatearFechaRetiro(r.fecha)}
                    </div>
                </div>
            `).join('');

            document.getElementById('historial-retiros-lista').innerHTML = listaHtml;

            const paginacionDiv = document.getElementById('historial-retiros-paginacion');
            if (totalPaginas <= 1) {
                paginacionDiv.innerHTML = '';
                return;
            }
            paginacionDiv.innerHTML = `
                <button type="button" class="btn btn-outline-secondary btn-sm" ${pagina <= 1 ? 'disabled' : ''} onclick="renderPaginaHistorialRetiros(${pagina - 1})">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                <span class="small text-muted">Página ${pagina} de ${totalPaginas}</span>
                <button type="button" class="btn btn-outline-secondary btn-sm" ${pagina >= totalPaginas ? 'disabled' : ''} onclick="renderPaginaHistorialRetiros(${pagina + 1})">
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }


        function compartirHistorialRetirosWhatsApp() {
            if (!historialRetiros || historialRetiros.length === 0) {
                showToast('No hay retiros registrados para exportar', 'warning');
                return;
            }

            const porPersona = {};
            historialRetiros.forEach(r => {
                const key = r.nombre || 'Desconocido';
                if (!porPersona[key]) porPersona[key] = 0;
                porPersona[key]++;
            });

            let texto = '*Historial de Retiros*\n\n';
            Object.entries(porPersona)
                .sort((a, b) => b[1] - a[1])
                .forEach(([nombre, cantidad]) => {
                    texto += `- ${nombre}: ${cantidad} retiro${cantidad !== 1 ? 's' : ''}\n`;
                });

            texto += '\n*Detalle*\n';
            const ordenado = [...historialRetiros].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            ordenado.forEach(r => {
                texto += `- ${r.nombre || 'Desconocido'} | ${r.camNombre || 'Caminata eliminada'} | ${formatearFechaRetiro(r.fecha)}\n`;
            });

            window.open(`https://wa.me/?text=${encodeURIComponent(texto.trim())}`, '_blank');
        }


        function abrirHistorialParticipacion() {
            const cont = document.getElementById('historial-participacion-contenido');
            const footer = document.getElementById('historial-participacion-footer');
            const todas = obtenerTodasParticipaciones();

            if (todas.length === 0) {
                cont.innerHTML = '<p class="text-muted small fst-italic text-center my-4">Todavía no hay participaciones registradas (ninguna caminata con fecha pasada tiene pasajeros).</p>';
                if (footer) footer.style.display = 'none';
                modalHistorialParticipacion.show();
                return;
            }
            if (footer) footer.style.display = 'block';

            const porPersona = {};
            todas.forEach(r => {
                const key = r.nombre || 'Desconocido';
                if (!porPersona[key]) porPersona[key] = 0;
                porPersona[key]++;
            });
            const estadisticaHtml = Object.entries(porPersona)
                .sort((a, b) => b[1] - a[1])
                .map(([nombre, cantidad]) => `
                    <div class="d-flex justify-content-between align-items-center py-1 border-bottom">
                        <span>${escapeHtml(nombre)}</span>
                        <span class="badge bg-success">${cantidad} participación${cantidad !== 1 ? 'es' : ''}</span>
                    </div>
                `).join('');

            historialParticipacionOrdenado = [...todas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
            historialParticipacionPaginaActual = 1;

            cont.innerHTML = `
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-chart-bar"></i> Estadística por persona
                </div>
                <div class="mb-3">${estadisticaHtml}</div>
                <hr>
                <div class="small text-muted mb-2" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                    <i class="fas fa-list"></i> Historial completo
                </div>
                <div class="list-group" id="historial-participacion-lista"></div>
                <div class="d-flex justify-content-between align-items-center mt-3" id="historial-participacion-paginacion"></div>
            `;

            renderPaginaHistorialParticipacion(1);
            modalHistorialParticipacion.show();
        }


        function renderPaginaHistorialParticipacion(pagina) {
            const totalPaginas = Math.max(1, Math.ceil(historialParticipacionOrdenado.length / PARTICIPACION_POR_PAGINA));
            pagina = Math.min(Math.max(1, pagina), totalPaginas);
            historialParticipacionPaginaActual = pagina;

            const inicio = (pagina - 1) * PARTICIPACION_POR_PAGINA;
            const itemsPagina = historialParticipacionOrdenado.slice(inicio, inicio + PARTICIPACION_POR_PAGINA);

            const listaHtml = itemsPagina.map(r => `
                <div class="list-group-item">
                    <div class="fw-medium">${escapeHtml(r.nombre || 'Desconocido')}</div>
                    <div class="small text-muted">
                        <i class="fas fa-route me-1"></i>${escapeHtml(r.camNombre || 'Caminata eliminada')}
                        &nbsp;·&nbsp;
                        <i class="fas fa-calendar-alt me-1"></i>${formatearFechaRetiro(r.fecha)}
                    </div>
                </div>
            `).join('');

            document.getElementById('historial-participacion-lista').innerHTML = listaHtml;

            const paginacionDiv = document.getElementById('historial-participacion-paginacion');
            if (totalPaginas <= 1) {
                paginacionDiv.innerHTML = '';
                return;
            }
            paginacionDiv.innerHTML = `
                <button type="button" class="btn btn-outline-secondary btn-sm" ${pagina <= 1 ? 'disabled' : ''} onclick="renderPaginaHistorialParticipacion(${pagina - 1})">
                    <i class="fas fa-chevron-left"></i> Anterior
                </button>
                <span class="small text-muted">Página ${pagina} de ${totalPaginas}</span>
                <button type="button" class="btn btn-outline-secondary btn-sm" ${pagina >= totalPaginas ? 'disabled' : ''} onclick="renderPaginaHistorialParticipacion(${pagina + 1})">
                    Siguiente <i class="fas fa-chevron-right"></i>
                </button>
            `;
        }

