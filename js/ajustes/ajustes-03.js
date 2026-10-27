/* ARCHIVO: js/ajustes/ajustes-03.js */

        function generarMensajeCotizador(reqsParam = null) {
            const m = configTema.membreteCotizador || {};
            const personas = document.getElementById('cot-personas').value || '1';
            const dias = Number(document.getElementById('cot-dias').value || 1);
            const reqs = reqsParam || cotRequerimientos;

            let fechas = '';
            if (dias > 1) {
                const ingreso = document.getElementById('cot-fecha-ingreso').value;
                const salida = document.getElementById('cot-fecha-salida').value;
                fechas = `Fecha de ingreso: ${ingreso || 'Sin especificar'}\nFecha de salida: ${salida || 'Sin especificar'} (${dias} días)`;
            } else {
                const fecha = document.getElementById('cot-fecha-unica').value;
                fechas = `Fecha del requerimiento: ${fecha || 'Sin especificar'}`;
            }

            let requerimientosTexto = '';
            let notasTexto = '';
            const totalHabitaciones = reqs
                .filter(r => r.tipo === 'hospedaje')
                .reduce((sum, r) => sum + (r.sencilla || 0) + (r.doble || 0) + (r.triple || 0) + (r.cuadruple || 0) + (r.pareja || 0), 0);

            reqs.forEach((req, idx) => {
                if (req.tipo === 'hospedaje') {
                    requerimientosTexto += `Hospedaje ${idx + 1} — Total de habitaciones: ${totalHabitaciones}\n`;
                    if (req.sencilla > 0) requerimientosTexto += `- Habitación Sencilla: ${req.sencilla}\n`;
                    if (req.doble > 0) requerimientosTexto += `- Habitación Doble: ${req.doble}\n`;
                    if (req.triple > 0) requerimientosTexto += `- Habitación Triple: ${req.triple}\n`;
                    if (req.cuadruple > 0) requerimientosTexto += `- Habitación Cuádruple: ${req.cuadruple}\n`;
                    if (req.pareja > 0) requerimientosTexto += `- Habitación Pareja / Matrimonial: ${req.pareja}\n`;
                    requerimientosTexto += '\n';
                } else if (req.tipo === 'nota') {
                    notasTexto += `- ${req.nota}\n`;
                } else {
                    requerimientosTexto += `${etiquetaTipoCotizador(req.tipo)}: ${req.cantidad} personas\n`;
                    if (req.url) requerimientosTexto += `${req.url}\n`;
                }
            });

            let texto = '';
            texto += `Somos La Tribu de Los Libres\n`;
            texto += `La Unión de Cartago Costa Rica\n\n`;
            if (m.telefono1) texto += `Teléfonos:\n${m.telefono1}\n`;
            if (m.telefono2) texto += `${m.telefono2}\n`;
            if (m.facebook) texto += `Facebook: ${m.facebook}\n`;
            if (m.web) texto += `Web: ${m.web}\n`;
            if (m.telefono1 || m.telefono2 || m.facebook || m.web) texto += '\n';

            texto += `Saludos\n\n`;
            texto += `Solicitamos la siguiente información:\n\n`;
            texto += `Cantidad de personas: ${personas}\n`;
            texto += `${fechas}\n`;
            if (requerimientosTexto) {
                texto += `\nLos Requerimientos\n\n${requerimientosTexto}`;
            }
            if (notasTexto) {
                texto += `Notas / Descripción\n\n${notasTexto}\n`;
            }
            texto += `${m.precioFrase || 'Por favor requerimos el precio desglosado por persona y el global en Dólares USD'}\n`;
            texto += `${m.horarioFrase || 'El horario de Atención y con quien conversamos'}\n\n`;
            texto += `${m.banosFrase || 'Por favor, requerimos indicar si las habitaciones tienen baños independientes o si son baños compartidos.'}\n`;
            texto += `${m.cortesiaFrase || 'Por favor, indicar si el guía y el chofer del bus tienen el beneficio de estancia llamado cortesía.'}\n\n`;
            texto += `${m.cierreFrase || 'Muchísimas gracias'}`;

            return texto;
        }


        function compartirWhatsAppCotizador() {
            const texto = generarMensajeCotizador();
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }


        function descargarTxtCotizador() {
            const texto = generarMensajeCotizador();
            const blob = new Blob([texto], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cotizacion-latribu.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }


        function guardarCotizacionActual() {
            if (cotRequerimientos.length === 0) {
                showToast('Agregá al menos un requerimiento para guardar', 'warning');
                return;
            }
            const dias = Number(document.getElementById('cot-dias').value || 1);
            const base = {
                personas: document.getElementById('cot-personas').value || '1',
                dias,
                fechaUnica: document.getElementById('cot-fecha-unica').value,
                fechaIngreso: document.getElementById('cot-fecha-ingreso').value,
                fechaSalida: document.getElementById('cot-fecha-salida').value
            };
            cotRequerimientos.forEach((req, index) => {
                const reqCopia = { ...req };
                const cotizacion = {
                    id: Date.now().toString() + '_' + index,
                    fecha: new Date().toISOString(),
                    ...base,
                    requerimientos: [reqCopia],
                    mensaje: generarMensajeCotizador([reqCopia])
                };
                cotizacionesGuardadas.unshift(cotizacion);
            });
            saveData();
            showToast('Cotizaciones guardadas en tarjetas por aparte', 'success');
        }


        function renderCotizacionesGuardadas() {
            const cont = document.getElementById('cotizaciones-lista');
            const vacio = document.getElementById('cotizaciones-vacio');
            if (!cont || !vacio) return;
            cotizacionesGuardadas = cotizacionesGuardadas || [];
            if (cotizacionesGuardadas.length === 0) {
                cont.innerHTML = '';
                vacio.classList.remove('d-none');
                return;
            }
            vacio.classList.add('d-none');
            cont.innerHTML = cotizacionesGuardadas.map(c => {
                const fecha = new Date(c.fecha).toLocaleString('es-CR');
                const req = c.requerimientos && c.requerimientos[0] ? c.requerimientos[0] : null;
                const tipo = req ? etiquetaTipoCotizador(req.tipo) : 'Cotización';
                const resumen = c.mensaje.split('\n').filter(l => l.includes('Cantidad de personas') || l.includes('Fecha')).join(' · ');
                return `
                    <div class="card border-0 shadow-sm mb-2">
                        <div class="card-body p-3">
                            <div class="d-flex justify-content-between align-items-start mb-2">
                                <h6 class="card-title mb-0 small fw-bold">${tipo} — ${fecha}</h6>
                                <button type="button" class="btn btn-sm text-danger" onclick="eliminarCotizacionGuardada('${c.id}')" title="Eliminar"><i class="fas fa-trash-alt"></i></button>
                            </div>
                            <p class="text-muted small mb-2">${escapeHtml(resumen)}</p>
                            <div class="d-flex gap-2 flex-wrap">
                                <button type="button" class="btn btn-sm btn-outline-secondary" onclick="verCotizacionGuardada('${c.id}')"><i class="fas fa-eye me-1"></i>Ver</button>
                                <button type="button" class="btn btn-sm btn-success" style="background-color: var(--primary-dark);" onclick="compartirCotizacionGuardada('${c.id}')"><i class="fab fa-whatsapp me-1"></i>WhatsApp</button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }


        function eliminarCotizacionGuardada(id) {
            cotizacionesGuardadas = cotizacionesGuardadas.filter(c => c.id !== id);
            saveData();
            renderCotizacionesGuardadas();
            showToast('Cotización eliminada', 'success');
        }


        function verCotizacionGuardada(id) {
            const cot = cotizacionesGuardadas.find(c => c.id === id);
            if (!cot) return;
            const titulo = 'Cotización guardada';
            const body = `<pre style="white-space: pre-wrap; font-size: 0.85rem;">${escapeHtml(cot.mensaje)}</pre>`;
            showConfirm(titulo, body, null, 'Cerrar', 'btn-secondary');
        }


        function compartirCotizacionGuardada(id) {
            const cot = cotizacionesGuardadas.find(c => c.id === id);
            if (!cot) return;
            window.open(`https://wa.me/?text=${encodeURIComponent(cot.mensaje)}`, '_blank');
        }


        function agregarEquipoRequerido() {
            const input = document.getElementById('ajustes-nuevo-equipo');
            if (!input) return;
            const val = input.value.trim();
            if (!val) return;
            if ((configTema.equipoRequerido || []).includes(val)) {
                showToast('Ese ítem ya existe', 'warning');
                return;
            }
            configTema.equipoRequerido = configTema.equipoRequerido || [];
            configTema.equipoRequerido.push(val);
            input.value = '';
            saveData();
            renderInstruccionesAjustes();
            showToast('Equipo agregado', 'success');
        }

