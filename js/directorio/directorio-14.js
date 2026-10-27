/* ARCHIVO: js/directorio/directorio-14.js */

        // NO MODIFICAR: Cálculo de inactivos 8 meses o más
        function calcularInactivos() {
            const ochoMeses = 8 * 30 * 24 * 60 * 60 * 1000;
            const ahora = Date.now();
            const participaciones = obtenerTodasParticipaciones();
            const porPersona = {};

            participaciones.forEach(p => {
                const nombre = (p.nombre || '').toLowerCase().trim();
                if (!nombre) return;
                const fecha = new Date(p.fecha || 0).getTime();
                if (!porPersona[nombre] || fecha > porPersona[nombre].fecha) {
                    porPersona[nombre] = { nombre: p.nombre, fecha, camNombre: p.camNombre, telefono: '' };
                }
            });

            const directorioPorNombre = {};
            (directorioPersonas || []).forEach(p => {
                const nombre = (p.nombre || '').toLowerCase().trim();
                if (nombre) directorioPorNombre[nombre] = p;
            });

            const inactivos = [];
            Object.keys(porPersona).forEach(nombre => {
                if (ahora - porPersona[nombre].fecha > ochoMeses) {
                    const p = directorioPorNombre[nombre] || {};
                    inactivos.push({
                        nombre: porPersona[nombre].nombre,
                        telefono: p.telefono || '',
                        ultimaFecha: new Date(porPersona[nombre].fecha).toLocaleDateString('es-CR'),
                        ultimaCaminata: porPersona[nombre].camNombre
                    });
                }
            });

            return inactivos.sort((a, b) => a.nombre.localeCompare(b.nombre));
        }


        // NO MODIFICAR: Envío de mensaje a inactivos por WhatsApp
        function enviarMensajeInactivosWhatsApp() {
            const inactivos = calcularInactivos();
            if (inactivos.length === 0) {
                showToast('No hay inactivos registrados', 'info');
                return;
            }
            const texto = '¡Hola! Hace tiempos has dejado de participar con la tribu. ¿No te sientes bien con el grupo? ¿Algo que podemos hacer por ti? Sería lindo volver a verte caminando con nosotros. 💚';
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }


        function renderPrecios(filterText = "") {
            const listDiv = document.getElementById('lista-precios');
            listDiv.innerHTML = '';

            let precios = [...preciosBuseta];

            if (filterText.trim()) {
                const lower = filterText.toLowerCase();
                precios = precios.filter(p =>
                    (p.nombre || '').toLowerCase().includes(lower) ||
                    (p.provincia || '').toLowerCase().includes(lower) ||
                    (p.tipo || '').toLowerCase().includes(lower) ||
                    String(p.monto).includes(lower)
                );
            }

            const totalDiv = document.getElementById('precios-total-general');

            if (precios.length === 0) {
                listDiv.innerHTML = '<p class="text-muted small text-center my-3">No hay precios que coincidan.</p>';
                if (totalDiv) totalDiv.innerHTML = '';
                return;
            }

            precios.sort((a, b) => {
                const tipoA = (a.tipo || 'Local').toLowerCase();
                const tipoB = (b.tipo || 'Local').toLowerCase();
                if (tipoA !== tipoB) return tipoA.localeCompare(tipoB);
                const provA = (a.provincia || '').toLowerCase();
                const provB = (b.provincia || '').toLowerCase();
                if (provA !== provB) return provA.localeCompare(provB);
                return a.nombre.toLowerCase().localeCompare(b.nombre.toLowerCase());
            });

            const grupos = {};
            precios.forEach(item => {
                const key = item.provincia || 'Sin provincia';
                if (!grupos[key]) grupos[key] = [];
                grupos[key].push(item);
            });

            Object.keys(grupos).sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())).forEach((provincia, index) => {
                const items = grupos[provincia];
                const safeId = 'collapse-precios-' + provincia.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + index;
                const section = document.createElement('div');
                section.className = 'mb-3';

                const header = document.createElement('div');
                header.className = 'd-flex justify-content-between align-items-center';
                header.setAttribute('data-bs-toggle', 'collapse');
                header.setAttribute('data-bs-target', '#' + safeId);
                header.style.cursor = 'pointer';
                header.innerHTML = `
                    <h6 class="fw-bold small mb-0">${escapeHtml(provincia)} <span class="badge bg-secondary" style="font-size: 0.65rem;">${items.length}</span></h6>
                    <i class="fas fa-chevron-down text-muted small"></i>
                `;

                const hr = document.createElement('hr');
                hr.className = 'my-1';

                const collapse = document.createElement('div');
                collapse.id = safeId;
                collapse.className = 'collapse';

                const cont = document.createElement('div');
                cont.className = 'list-group';

                items.forEach(item => {
                    const row = document.createElement('div');
                    row.className = 'list-group-item d-flex justify-content-between align-items-start';
                    const badgeColor = item.tipo === 'Internacional' ? 'bg-info' : 'bg-secondary';
                    const vecesAsignado = caminatas.filter(c => (c.nombre || '').toLowerCase().trim() === (item.nombre || '').toLowerCase().trim()).length;
                    row.innerHTML = `
                        <div class="me-auto">
                            <span class="badge ${badgeColor}" style="font-size: 0.65rem;">${escapeHtml(item.tipo || 'Local')}</span>
                            <div class="fw-medium">${escapeHtml(item.nombre)} <span class="text-muted small">(${vecesAsignado} viaje${vecesAsignado !== 1 ? 's' : ''})</span></div>
                        </div>
                        <div class="d-flex gap-2 align-items-center">
                            <div class="fw-bold text-success me-2">₡${item.monto}</div>
                            <button type="button" class="btn btn-sm btn-outline-primary" onclick="openPrecioBusetaModal('${item.id}')"><i class="fas fa-edit"></i></button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="borrarPrecioBuseta('${item.id}')"><i class="fas fa-trash"></i></button>
                        </div>
                    `;
                    cont.appendChild(row);
                });

                collapse.appendChild(cont);
                section.appendChild(header);
                section.appendChild(hr);
                section.appendChild(collapse);
                listDiv.appendChild(section);
            });

            if (totalDiv) {
                const totalGeneral = precios.reduce((acc, p) => acc + Number(p.monto || 0), 0);
                totalDiv.innerHTML = `Total de todos los precios listados: <span class="text-success">₡${totalGeneral}</span>`;
            }
        }


        // --- STREAMING_CHUNK: JSON Import/Export ---
        function formatCountdown(ms) {
            if (ms <= 0) return 'cualquier momento';
            const horas = Math.floor(ms / (1000 * 60 * 60));
            const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
            return `${horas}h ${minutos}m`;
        }


        function actualizarCuentaRegresivaRespaldo() {
            const el = document.getElementById('respaldo-countdown');
            if (!el) return;
            const ahora = new Date();
            const medianoche = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 0);
            const faltante = medianoche - ahora;
            el.innerText = formatCountdown(faltante);
        }


        async function verificarRespaldoAutomatico() {
            const ahora = Date.now();
            const medianoche = new Date().setHours(0, 0, 0, 0);
            const debeGenerar = (ahora - ultimoRespaldo) >= 24 * 60 * 60 * 1000 || (ahora >= medianoche && new Date(ultimoRespaldo).getDate() !== new Date().getDate());
            
            if (debeGenerar && !TribuRespaldos.restaurando) {
                await exportData();
                ultimoRespaldo = ahora;
                await saveData();
                actualizarCuentaRegresivaRespaldo();
            }
        }

        function aplicarEscalaAccesibilidad() {
            document.documentElement.style.fontSize = escalaFuenteApp + 'px';
            const display = document.getElementById('tamanio-interfaz-valor');
            if (display) display.innerText = escalaFuenteApp + 'px';
        }

        function cambiarEscalaAccesibilidad(delta) {
            escalaFuenteApp = Math.max(12, Math.min(28, escalaFuenteApp + delta));
            aplicarEscalaAccesibilidad();
            localStorage.setItem('escala_fuente_app', escalaFuenteApp);
        }

        function aplicarTema(colorKey) {
            const tema = TEMAS_DISPONIBLES[colorKey] || TEMAS_DISPONIBLES.naranja;
            const root = document.documentElement;
            root.style.setProperty('--primary-color', tema.primary);
            root.style.setProperty('--primary-dark', tema.primaryDark);
            document.body.classList.toggle('tema-oscuro', tema.oscuro);
            const swatches = document.querySelectorAll('.tema-swatch');
            swatches.forEach(s => s.classList.toggle('activo', s.dataset.key === colorKey));
            configTema.temaColor = colorKey;
        }

