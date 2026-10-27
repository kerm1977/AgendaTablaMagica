/* ARCHIVO: js/core/nav-ui.js — núcleo Agenda Tribu */
        // === INICIO BLOQUE MODULAR: NAVIGATION & UI HELPERS ===
        // --- NAVIGATION & UI HELPERS ---
        // FLASK: Esta función controla la visibilidad de vistas. En Flask/Jinja2
        //        puede reemplazarse por rutas separadas (/) o HTMX con plantillas.
        //        CRÍTICO: onclick en la bottom-nav y links llama a navigate().
        function abrirCaminatas() {
            const vtm = document.getElementById('vistaTablaMagica');
            if (vtm) vtm.style.display = 'none';
            document.getElementById('vistaCaminatas').style.display = 'block';
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.getElementById('nav-caminatas').classList.add('active');
        }

        function abrirTablaMagica() {
            const vtm = document.getElementById('vistaTablaMagica');
            const frame = document.getElementById('frameTablaMagica');
            if (frame && !frame.src && frame.dataset.src) frame.src = frame.dataset.src;
            if (vtm) vtm.style.display = 'block';
            const vc = document.getElementById('vistaCaminatas');
            if (vc) vc.style.display = 'none';
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.getElementById('nav-tablamagica').classList.add('active');
        }

        function navigate(viewName, title = null) {
            title = title || configTema.tituloApp || TITULO_APP_DEFECTO;
            const vistaCaminatas = document.getElementById('vistaCaminatas');
            if (vistaCaminatas) vistaCaminatas.style.display = 'none';
            const vistaTM = document.getElementById('vistaTablaMagica');
            if (vistaTM) vistaTM.style.display = 'none';
            // Esconder todas
            document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
            // Mostrar target
            document.getElementById(`view-${viewName}`).classList.add('active');
            
            // Update Title
            document.getElementById('app-title').innerText = title;

            // Update Bottom Nav
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            if(viewName === 'home') document.getElementById('nav-home').classList.add('active');
            if(viewName === 'directorio') {
                document.getElementById('nav-directorio').classList.add('active');
                initDirectorioView();
            }
            if(viewName === 'notas') {
                document.getElementById('nav-notas').classList.add('active');
                renderNotas();
            }
            if(viewName === 'settings') {
                document.getElementById('nav-settings').classList.add('active');
                actualizarCuentaRegresivaRespaldo();
                actualizarContadorPreciosAjustes();
                actualizarEstadisticasSitio();
                renderConfigTema();
                renderFormasPago();
                renderInstruccionesAjustes();
                renderMembreteCotizador();
                renderCotizacionesGuardadas();
                if (window.TribuRespaldos) TribuRespaldos.renderPanel();
            }

            // Mostrar el icono "Buseta" solo en la vista de caminata, Directorio siempre
            const navBuseta = document.getElementById('nav-buseta');
            if(viewName === 'caminata') {
                navBuseta.style.display = 'flex';
            } else {
                navBuseta.style.display = 'none';
            }

            // Toggle FAB visibility and functionality
            const fab = document.getElementById('main-fab');
            if(viewName === 'home') {
                fab.style.display = 'flex';
                fab.innerHTML = '<i class="fas fa-plus"></i>';
                fab.onclick = createNewCaminata;
                fab.disabled = false;
                fab.style.backgroundColor = 'var(--primary-color)';
                fab.style.boxShadow = 'none';
                renderHome();
            } else if (viewName === 'caminata') {
                fab.style.display = 'flex';
                fab.innerHTML = '<i class="fab fa-whatsapp" style="font-size: 1.5rem;"></i>';
                fab.onclick = openWhatsAppPreview;
                updateFabState();
            } else if (viewName === 'precios') {
                fab.style.display = 'flex';
                fab.innerHTML = '<i class="fas fa-plus"></i>';
                fab.onclick = () => openPrecioBusetaModal();
                fab.disabled = false;
                fab.style.backgroundColor = 'var(--primary-color)';
                fab.style.boxShadow = 'none';
                renderPrecios();
            } else if (viewName === 'notas') {
                fab.style.display = 'flex';
                fab.innerHTML = '<i class="fas fa-plus"></i>';
                fab.onclick = () => abrirEditorNota();
                fab.disabled = false;
                fab.style.backgroundColor = 'var(--primary-color)';
                fab.style.boxShadow = 'none';
            } else if (viewName === 'directorio') {
                // El botón "Agregar contacto" ya está en el encabezado de esta vista;
                // se oculta el FAB para evitar dos botones "+" superpuestos.
                fab.style.display = 'none';
            } else {
                fab.style.display = 'none';
            }

            currentView = viewName;
            window.scrollTo(0, 0);
        }

        function updateFabState() {
            if (currentView !== 'caminata') return;
            const cam = caminatas.find(c => c.id === currentCaminataId);
            const fab = document.getElementById('main-fab');
            if (!cam) {
                fab.disabled = true;
                fab.style.backgroundColor = '#9ca3af';
                fab.style.boxShadow = 'none';
                return;
            }
            const faltaCaminantes = cam.mostrarCaminantes !== false && (!cam.pasajeros || cam.pasajeros.length === 0);
            if (faltaCaminantes) {
                fab.disabled = true;
                fab.style.backgroundColor = '#9ca3af';
                fab.style.boxShadow = 'none';
            } else {
                fab.disabled = false;
                fab.style.backgroundColor = '#25D366';
                fab.style.boxShadow = 'none';
            }
        }

        function showToast(msg, type = "success") {
            const toast = document.createElement('div');
            toast.className = `position-fixed top-0 start-50 translate-middle-x mt-3 p-3 bg-${type} text-white rounded shadow`;
            toast.style.zIndex = 9999;
            toast.innerText = msg;
            document.body.appendChild(toast);
            setTimeout(() => { toast.remove(); }, 3000);
        }

        // Utilidad para texto enriquecido
        function formatDoc(cmd, value = null) {
            document.execCommand(cmd, false, value);
            document.getElementById('cam-usu-nota').focus();
        }

        // --- CUSTOM CONFIRM MODAL ---
        function showConfirm(title, message, callback, btnText = "Sí, proceder", btnClass = "btn-danger") {
            document.getElementById('confirm-title').innerText = title;
            document.getElementById('confirm-message').innerText = message;
            
            const actionBtn = document.getElementById('confirm-action-btn');
            actionBtn.innerText = btnText;
            actionBtn.className = `btn btn-sm px-4 ${btnClass}`;
            
            confirmActionCallback = callback;
            modalConfirm.show();
        }

        function executeConfirmAction() {
            const cb = confirmActionCallback;
            confirmActionCallback = null;
            modalConfirm.hide();
            if (typeof cb === 'function') {
                setTimeout(cb, 300);
            }
        }

        // --- UTILS: escaping and WhatsApp preview ---
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text == null ? '' : text;
            return div.innerHTML;
        }

        function limpiarNbsp(texto) {
            if (texto == null) return '';
            let t = String(texto);
            // Reemplazar entidad &nbsp; y caracteres Unicode de espacio no separable por espacio común
            t = t.replace(/&nbsp;/gi, ' ').replace(/\u00A0/g, ' ').replace(/\u202F/g, ' ').replace(/\u2007/g, ' ').replace(/\uFEFF/g, '');
            // Colapsar espacios múltiples y espacios iniciales/finales
            t = t.replace(/ {2,}/g, ' ').trim();
            return t;
        }

        function escapeJsString(str) {
            return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"');
        }

        function generarEncabezadoWhatsApp(cam) {
            let texto = '';

            if (cam.actividad === 'Parque Nacional') {
                texto += `*${(cam.nombre || '').toUpperCase()}*\n`;
                if (cam.provincia) texto += `- Provincia: ${cam.provincia}\n`;
            } else if (cam.actividad === 'El Camino de Costa Rica') {
                texto += `*EL CAMINO DE COSTA RICA - ${(cam.nombre || '').toUpperCase()}*\n`;
                if (cam.provincia) texto += `- Provincia: ${cam.provincia}\n`;
            } else if (cam.actividad === 'Internacional') {
                if (cam.provincia) {
                    texto += `*${(cam.provincia || '').toUpperCase()} - ${(cam.nombre || '').toUpperCase()}*\n`;
                } else {
                    texto += `*${(cam.nombre || '').toUpperCase()}*\n`;
                }
            } else {
                texto += `*${(cam.nombre || '').toUpperCase()}*\n`;
                if (cam.actividad) texto += `- Actividad: ${cam.actividad}\n`;
            }

            if (cam.tipo === 'Local') {
                texto += `- Fecha: ${formatDateString(cam.fechaLocal)}\n`;
            } else {
                texto += `- Ida: ${formatDateString(cam.fechaIda)}\n`;
                texto += `- Regreso: ${formatDateString(cam.fechaRegreso)}\n`;
            }

            if (cam.horaSalida) texto += `- Hora de salida: ${cam.horaSalida}\n`;
            if (cam.dificultad) texto += `- Dificultad: ${cam.dificultad}\n`;
            if (cam.kilometros) texto += `- Kilómetros: ${cam.kilometros} km\n`;

            if (cam.actividad === 'Internacional') {
                if (cam.modoTransporte) texto += `- Transporte: ${cam.modoTransporte}\n`;
                if (cam.modoTransporte === 'Aéreo' && cam.aerolinea) texto += `- Aerolínea: ${cam.aerolinea}\n`;
                if (cam.incluirVueloWhatsApp) {
                    if (cam.tieneVuelo && cam.numeroVuelo) texto += `- Vuelo: ${cam.numeroVuelo}\n`;
                    if (cam.tieneFechaVuelo) {
                        if (cam.vueloFechaSalida) texto += `- Salida del vuelo: ${formatDateString(cam.vueloFechaSalida)} ${cam.vueloHoraSalida || ''}\n`;
                        if (cam.vueloFechaRegreso) texto += `- Regreso del vuelo: ${formatDateString(cam.vueloFechaRegreso)} ${cam.vueloHoraRegreso || ''}\n`;
                    }
                }
            }

            texto += `- Precio: ${cam.moneda}${cam.precio}\n`;

            const reservaFechaStr = formatDateStringShort(cam.reservaFecha);
            texto += `- Reserva con: ${cam.moneda}${cam.reservaMonto} (Límite: ${reservaFechaStr})\n`;

            if (cam.mostrarIncluye !== false && cam.incluye && cam.incluye.length > 0) {
                const listaIncluye = cam.incluye.map(item => {
                    if (item === 'Otros' && cam.otrosDescripcion) return `Otros (${cam.otrosDescripcion})`;
                    return item;
                }).join(', ');
                texto += `- Incluye: ${listaIncluye}\n`;
            }

            if (cam.mostrarFormasPago !== false && cam.formasPago && cam.formasPago.length > 0) {
                texto += `- Formas de pago: ${cam.formasPago.join(', ')}\n`;
            }
            if (cam.mostrarUrls !== false && cam.urls && cam.urls.length > 0) {
                cam.urls.forEach(u => { if (u) texto += `- Enlace: ${u}\n`; });
            } else if (cam.mostrarUrls !== false && cam.url) {
                texto += `- Enlace: ${cam.url}\n`;
            }
            if (cam.lugarSalida && cam.lugarSalida !== 'Cada quien llega por sus propios medios') texto += `- Lugar de salida: ${cam.lugarSalida}\n`;
            if (cam.lugaresRecoger && cam.lugaresRecoger.length > 0 && (cam.actividad !== 'Internacional' || cam.tieneLugarSalida)) texto += `- Lugares para recoger: ${cam.lugaresRecoger.join(', ')}\n`;

            return texto;
        }

        function generarBloqueInstrucciones(cam) {
            let texto = '';
            texto += `\n*EQUIPO REQUERIDO:*\n`;

            let hayEquipo = false;
            (cam.equipo || []).forEach(eq => {
                if (eq.estado !== 'No') {
                    texto += `- ${eq.item}: ${eq.estado}\n`;
                    hayEquipo = true;
                }
            });
            if (!hayEquipo) texto += '- Ninguno seleccionado\n';

            const otras = configTema.instrucciones.otrasRecomendaciones || [];
            if (otras.length > 0) {
                texto += `\n*OTRAS RECOMENDACIONES:*\n`;
                otras.forEach(i => texto += `- ${i}\n`);
            }

            const normas = configTema.instrucciones.normasGenerales || [];
            if (normas.length > 0) {
                texto += `\n*NORMAS GENERALES:*\n`;
                normas.forEach(i => texto += `- ${i}\n`);
            }

            const seguridad = configTema.instrucciones.indicacionesSeguridad || [];
            if (seguridad.length > 0) {
                texto += `\n*INDICACIONES DE SEGURIDAD:*\n`;
                seguridad.forEach(i => texto += `- ${i}\n`);
            }

            if (cam.notasAdicionales && cam.notasAdicionales.trim() !== '') {
                texto += `\n*NOTAS ADICIONALES:*\n${cam.notasAdicionales}\n`;
            }

            return texto;
        }

        function generarMensajeWhatsApp(cam) {
            let texto = generarEncabezadoWhatsApp(cam);

            if (cam.mostrarCaminantes !== false) {
                texto += `\n🔴- Pendiente\n`;
                texto += `🟡- Reservado\n`;
                texto += `🔵- Reserva Parcial\n`;
                texto += `🟣- Pago Parcial\n`;
                texto += `🟢- Cancelado\n`;
                texto += `🟠- Abono\n\n`;

                texto += `*LISTA DE ASISTENCIA:*\n`;

                const prioridad = {
                    'cancelado': 1,
                    'abono': 2,
                    'pago-parcial': 3,
                    'reservado': 4,
                    'reserva-parcial': 5,
                    'pendiente': 6
                };
                const pasajerosOrdenados = [...(cam.pasajeros || [])].sort((a, b) => {
                    const pa = prioridad[a.estado] || 99;
                    const pb = prioridad[b.estado] || 99;
                    if (pa !== pb) return pa - pb;
                    return a.nombre.localeCompare(b.nombre);
                });

                pasajerosOrdenados.forEach((pas, index) => {
                    const emoji = EMOJIS_ESTADO[pas.estado] || '⚪';
                    let suffix = "";
                    if (pas.estado === 'abono') {
                        let displayAbono = (pas.abonos || "Ab").replace('R+', 'Ab+');
                        suffix = ` (${displayAbono})`;
                    } else if (pas.estado === 'cancelado') {
                        suffix = " ✅";
                    }
                    texto += `${index + 1}. ${emoji}${limpiarNbsp(pas.nombre)}${suffix}\n`;

                    if (pas.notaPublica && pas.nota && pas.nota.trim() !== '') {
                        let parsedNota = parseHtmlForWhatsApp(pas.nota);
                        if (parsedNota) {
                            texto += `   _Nota: ${parsedNota.replace(/\n/g, '\n   ')}_\n`;
                        }
                    }
                });
            }

            if (cam.mostrarInstrucciones !== false) {
                texto += generarBloqueInstrucciones(cam);
            }

            return limpiarNbsp(texto);
        }

        // === FIN MÓDULO JS: NAVEGACIÓN Y UTILIDADES ===