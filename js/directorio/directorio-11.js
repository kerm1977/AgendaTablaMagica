/* ARCHIVO: js/directorio/directorio-11.js */

        // Estadísticas generales del sitio, mostradas arriba de todo en Ajustes.
        function actualizarEstadisticasSitio() {
            const elListas = document.getElementById('stat-listas-activas');
            if (!elListas) return;

            elListas.innerText = caminatas.length;
            document.getElementById('stat-contactos').innerText = directorioPersonas.length;
            document.getElementById('stat-notas').innerText = notas.length;

            const participaciones = obtenerTodasParticipaciones();
            const personasParticiparon = new Set(participaciones.map(p => (p.nombre || '').toLowerCase().trim())).size;
            document.getElementById('stat-personas-participaron').innerText = personasParticiparon;

            const personasRetiradas = new Set(historialRetiros.map(r => (r.nombre || '').toLowerCase().trim())).size;
            document.getElementById('stat-personas-retiradas').innerText = personasRetiradas;

            const totalBuseta = preciosBuseta.reduce((acc, p) => acc + Number(p.monto || 0), 0);
            document.getElementById('stat-total-buseta').innerText = `₡${totalBuseta}`;

            let asistenciaParticiparon = 0;
            let asistenciaNoParticiparon = 0;
            let asistenciaRetirados = 0;
            
            // Usar historial permanente de asistencia para mantener contadores aunque se eliminen caminatas
            historialAsistencia.forEach(reg => {
                if (reg.asistencia === 'participo') asistenciaParticiparon++;
                else if (reg.asistencia === 'no-participo') asistenciaNoParticiparon++;
            });
            
            // Contar retirados únicos del historial de retiros
            const retiradosUnicos = new Set(historialRetiros.map(r => (r.nombre || '').toLowerCase().trim())).size;
            asistenciaRetirados = retiradosUnicos;
            
            document.getElementById('stat-asistencia-participaron').innerText = asistenciaParticiparon;
            document.getElementById('stat-asistencia-no-participaron').innerText = asistenciaNoParticiparon;
            document.getElementById('stat-personas-retiradas').innerText = asistenciaRetirados;

            // NO MODIFICAR: Estadísticas por actividad e inactivos
            const actividadesOrden = ['Caminata', 'Internacional', 'Parque Nacional', 'El Camino de Costa Rica', 'Fiesta', 'Convivio', 'Reunión', 'Otro'];
            const porActividad = {};
            const participantesPorActividad = {};
            const retiradosPorActividad = {};
            actividadesOrden.forEach(a => { 
                porActividad[a] = 0; 
                participantesPorActividad[a] = new Set(); 
                retiradosPorActividad[a] = new Set();
            });

            caminatas.forEach(cam => {
                const act = cam.actividad || 'Otro';
                const agrupado = actividadesOrden.includes(act) ? act : 'Otro';
                porActividad[agrupado] = (porActividad[agrupado] || 0) + 1;
                (cam.pasajeros || []).forEach(pas => {
                    const nombre = (pas.nombre || '').toLowerCase().trim();
                    if (nombre) participantesPorActividad[agrupado].add(nombre);
                });
                
                // Contar retirados para esta caminata específica
                const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                retiradosEnCaminata.forEach(r => {
                    const nombre = (r.nombre || '').toLowerCase().trim();
                    if (nombre) retiradosPorActividad[agrupado].add(nombre);
                });
            });

            const contActividad = document.getElementById('stat-por-actividad');
            if (caminatas.length === 0) {
                contActividad.innerHTML = '<p class="text-muted small text-center my-3 mb-0">Sin caminatas registradas.</p>';
            } else {
                let htmlResult = '';
                let actividadIndex = 0;
                
                actividadesOrden.forEach(act => {
                    const total = porActividad[act] || 0;
                    const participantes = (participantesPorActividad[act] || new Set()).size;
                    const retirados = (retiradosPorActividad[act] || new Set()).size;
                    
                    if (total === 0) return; // Skip actividades sin caminatas
                    
                    actividadIndex++;
                    const collapseId = `collapse-actividad-${actividadIndex}`;
                    
                    // Agregar acordeón para la actividad
                    htmlResult += `
                        <div class="accordion-item border">
                            <h2 class="accordion-header">
                                <button class="accordion-button collapsed fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
                                    <div class="d-flex align-items-center w-100" style="justify-content: space-between;">
                                        <span>${escapeHtml(act)} <span class="text-success">(${participantes})</span> <span class="text-danger">(${retirados})</span></span>
                                        <div class="d-flex flex-column small align-items-end gap-1 text-end" style="flex-shrink: 0; margin-right: 10px;">
                                            <span class="text-muted" title="Caminatas">${total} <i class="fas fa-hiking text-primary"></i></span>
                                            <span class="text-muted" title="Participantes">${participantes} <i class="fas fa-user-check text-success"></i></span>
                                            <span class="text-muted" title="Retirados">${retirados} <i class="fas fa-user-times text-danger"></i></span>
                                        </div>
                                    </div>
                                </button>
                            </h2>
                            <div id="${collapseId}" class="accordion-collapse collapse" data-bs-parent="#stat-por-actividad-accordion">
                                <div class="accordion-body p-0">
                                    <div class="small text-muted mb-2 px-3 pt-2 text-center w-100" style="font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px;">
                                        Descripción
                                    </div>
                                    <hr class="mx-3 my-1" style="border-color: #adb5bd; opacity: 0.4;">
                    `;
                    
                    // Agregar detalle específico según tipo de actividad
                    const caminatasActividad = caminatas.filter(c => (c.actividad || 'Otro') === act);
                    
                    if (act === 'Internacional') {
                        // Agrupar por país
                        const porPais = {};
                        caminatasActividad.forEach(cam => {
                            const pais = cam.pais || 'Otro';
                            if (!porPais[pais]) {
                                porPais[pais] = { caminatas: [], participantes: new Set(), retirados: new Set() };
                            }
                            porPais[pais].caminatas.push(cam);
                            (cam.pasajeros || []).forEach(pas => {
                                const nombre = (pas.nombre || '').toLowerCase().trim();
                                if (nombre) porPais[pais].participantes.add(nombre);
                            });
                            const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                            retiradosEnCaminata.forEach(r => {
                                const nombre = (r.nombre || '').toLowerCase().trim();
                                if (nombre) porPais[pais].retirados.add(nombre);
                            });
                        });
                        
                        Object.keys(porPais).forEach(pais => {
                            const data = porPais[pais];
                            htmlResult += `
                                <div class="list-group-item small ps-4">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>${escapeHtml(pais)}</span>
                                        <div class="d-flex flex-column align-items-end gap-1" style="margin-right: 20px;">
                                            <span class="text-muted">${data.caminatas.length} <i class="fas fa-hiking text-primary"></i></span>
                                            <span class="text-success">${data.participantes.size} <i class="fas fa-user-check"></i></span>
                                            <span class="text-danger">${data.retirados.size} <i class="fas fa-user-times"></i></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    } else if (act === 'El Camino de Costa Rica') {
                        // Agrupar por etapa
                        const porEtapa = {};
                        caminatasActividad.forEach(cam => {
                            const etapa = cam.etapa || 'Sin etapa';
                            if (!porEtapa[etapa]) {
                                porEtapa[etapa] = { caminatas: [], participantes: new Set(), retirados: new Set() };
                            }
                            porEtapa[etapa].caminatas.push(cam);
                            (cam.pasajeros || []).forEach(pas => {
                                const nombre = (pas.nombre || '').toLowerCase().trim();
                                if (nombre) porEtapa[etapa].participantes.add(nombre);
                            });
                            const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                            retiradosEnCaminata.forEach(r => {
                                const nombre = (r.nombre || '').toLowerCase().trim();
                                if (nombre) porEtapa[etapa].retirados.add(nombre);
                            });
                        });
                        
                        Object.keys(porEtapa).forEach(etapa => {
                            const data = porEtapa[etapa];
                            htmlResult += `
                                <div class="list-group-item small ps-4">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>${escapeHtml(etapa)}</span>
                                        <div class="d-flex flex-column align-items-end gap-1" style="margin-right: 20px;">
                                            <span class="text-muted">${data.caminatas.length} <i class="fas fa-hiking text-primary"></i></span>
                                            <span class="text-success">${data.participantes.size} <i class="fas fa-user-check"></i></span>
                                            <span class="text-danger">${data.retirados.size} <i class="fas fa-user-times"></i></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    } else if (act === 'Parque Nacional') {
                        // Mostrar caminadas individuales
                        caminatasActividad.forEach(cam => {
                            const participantesCam = new Set();
                            const retiradosCam = new Set();
                            (cam.pasajeros || []).forEach(pas => {
                                const nombre = (pas.nombre || '').toLowerCase().trim();
                                if (nombre) participantesCam.add(nombre);
                            });
                            const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                            retiradosEnCaminata.forEach(r => {
                                const nombre = (r.nombre || '').toLowerCase().trim();
                                if (nombre) retiradosCam.add(nombre);
                            });
                            
                            htmlResult += `
                                <div class="list-group-item small ps-4">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>${escapeHtml(cam.nombre)}</span>
                                        <div class="d-flex flex-column align-items-end gap-1" style="margin-right: 20px;">
                                            <span class="text-success">${participantesCam.size} <i class="fas fa-user-check"></i></span>
                                            <span class="text-danger">${retiradosCam.size} <i class="fas fa-user-times"></i></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    } else {
                        // Caminata, Fiesta, Convivio, Reunión, Otro: mostrar nombres de caminatas
                        const esCaminataPrincipal = act === 'Caminata';
                        caminatasActividad.forEach(cam => {
                            const participantesCam = new Set();
                            const retiradosCam = new Set();
                            (cam.pasajeros || []).forEach(pas => {
                                const nombre = (pas.nombre || '').toLowerCase().trim();
                                if (nombre) participantesCam.add(nombre);
                            });
                            const retiradosEnCaminata = historialRetiros.filter(r => r.camId === cam.id);
                            retiradosEnCaminata.forEach(r => {
                                const nombre = (r.nombre || '').toLowerCase().trim();
                                if (nombre) retiradosCam.add(nombre);
                            });
                            
                            const margenInferior = esCaminataPrincipal ? 'margin-bottom: 10px;' : '';
                            
                            htmlResult += `
                                <div class="list-group-item small ps-4" style="${margenInferior}">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <span>${escapeHtml(cam.nombre)}</span>
                                        <div class="d-flex flex-column align-items-end gap-1" style="margin-right: 20px;">
                                            <span class="text-success">${participantesCam.size} <i class="fas fa-user-check"></i></span>
                                            <span class="text-danger">${retiradosCam.size} <i class="fas fa-user-times"></i></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                    }
                    
                    htmlResult += `
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                contActividad.innerHTML = htmlResult || '<p class="text-muted small text-center my-3 mb-0">Sin caminatas registradas.</p>';
            }

            // Contador de inactivos
            const inactivos = calcularInactivos();
            document.getElementById('stat-inactivos-count').innerText = inactivos.length;
        }

        async function contarEventosTablaMagica() {
            if (typeof indexedDB === 'undefined') throw new Error('IndexedDB no está disponible');
            if (typeof indexedDB.databases === 'function' && !(await indexedDB.databases()).some(db => db.name === 'PagosAppDB')) return 0;
            return new Promise((resolve, reject) => {
                let ausente = false;
                const request = indexedDB.open('PagosAppDB');
                request.onupgradeneeded = () => { ausente = true; request.transaction.abort(); };
                request.onerror = () => ausente ? resolve(0) : reject(request.error);
                request.onsuccess = () => {
                    const db = request.result;
                    if (!db.objectStoreNames.contains('eventos')) { db.close(); resolve(0); return; }
                    const tx = db.transaction('eventos', 'readonly');
                    const count = tx.objectStore('eventos').count();
                    tx.oncomplete = () => { db.close(); resolve(count.result); };
                    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error || new Error('No se pudo leer Tabla Mágica')); };
                };
            });
        }

        function resumenEstadisticasPlataforma(listas, usuarios, apuntes, eventos) {
            return { caminatas: listas.length, usuarios: usuarios.length, notas: apuntes.length, calendario: eventos.length };
        }

        let versionEstadisticasPlataforma = 0;
        async function actualizarEstadisticasPlataforma() {
            const version = ++versionEstadisticasPlataforma;
            sincronizarCaminatasCalendario();
            const resumen = resumenEstadisticasPlataforma(caminatas, directorioPersonas, notas, calendarioCaminatas);
            const tarjetas = [
                ['Listas de caminatas activas', resumen.caminatas, 'Listas guardadas actualmente'],
                ['Usuarios registrados', resumen.usuarios, 'Registros del directorio'],
                ['Eventos de Tabla Mágica', 'Cargando…', 'Eventos guardados, sin contar borradores', 'estadisticas-total-pagos'],
                ['Notas guardadas', resumen.notas, 'Notas registradas actualmente'],
                ['Eventos del calendario', resumen.calendario, 'Detalle por nombre y fecha abajo']
            ];
            const cont = document.getElementById('estadisticas-resumen-plataforma');
            if (!cont) return;
            cont.innerHTML = tarjetas.map(([titulo, valor, detalle, id]) => `<div class="col-12 col-sm-6"><div class="border rounded p-3 h-100"><div class="small text-muted">${titulo}</div><div ${id ? 'id="' + id + '"' : ''} class="fs-3 fw-bold" style="color:var(--primary-dark);">${valor}</div><div class="small text-muted">${detalle}</div></div></div>`).join('');
            document.getElementById('estadisticas-buscar-eventos').value = '';
            document.getElementById('estadisticas-persona-detalle').replaceChildren();
            renderEventosEstadisticas();
            renderEstadisticasCaminantes();
            try {
                const total = await contarEventosTablaMagica();
                if (version === versionEstadisticasPlataforma) document.getElementById('estadisticas-total-pagos').textContent = total;
            } catch (e) {
                if (version === versionEstadisticasPlataforma) document.getElementById('estadisticas-total-pagos').textContent = 'No disponible';
            }
        }

        function fechaEventoEstadisticas(fecha) {
            if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return null;
            const [anio, mes, dia] = fecha.split('-').map(Number);
            const date = new Date(anio, mes - 1, dia);
            return date.getFullYear() === anio && date.getMonth() === mes - 1 && date.getDate() === dia ? date : null;
        }

        function renderEventosEstadisticas() {
            const cont = document.getElementById('estadisticas-eventos-plataforma');
            if (!cont) return;
            const filtro = (document.getElementById('estadisticas-buscar-eventos').value || '').toLocaleLowerCase('es').trim();
            const eventos = [...calendarioCaminatas].sort((a, b) => String(a.fecha || '9999').localeCompare(String(b.fecha || '9999')) || String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es'));
            cont.replaceChildren();
            eventos.forEach(ev => {
                const fecha = fechaEventoEstadisticas(ev.fecha);
                const fechaVisible = fecha ? formatearFechaCalendario(ev.fecha) : 'Sin fecha válida';
                if (filtro && ![ev.nombre, ev.fecha, fechaVisible].some(v => String(v || '').toLocaleLowerCase('es').includes(filtro))) return;
                const fila = document.createElement('button');
                fila.type = 'button';
                fila.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-3 py-3';
                fila.style.cssText = 'text-align:left;overflow-wrap:anywhere;';
                fila.disabled = !fecha;
                const info = document.createElement('div');
                info.style.minWidth = '0';
                const nombre = document.createElement('div');
                nombre.className = 'fw-bold';
                nombre.textContent = ev.nombre || 'Evento sin nombre';
                const detalle = document.createElement('div');
                detalle.className = 'small text-muted';
                detalle.textContent = 'Fecha del evento: ' + fechaVisible + (ev.tipo === 'salida' ? ' · Salida' : ev.tipo === 'regreso' ? ' · Regreso' : '');
                info.append(nombre, detalle);
                if (ev.createdAt && Number.isFinite(new Date(ev.createdAt).getTime())) {
                    const registro = document.createElement('div');
                    registro.className = 'small text-muted';
                    registro.textContent = 'Guardado el: ' + new Date(ev.createdAt).toLocaleDateString('es-CR', { timeZone: 'America/Costa_Rica' });
                    info.appendChild(registro);
                }
                const acceso = document.createElement('span');
                acceso.className = 'small flex-shrink-0';
                acceso.style.color = 'var(--primary-dark)';
                acceso.textContent = fecha ? 'Ver día →' : 'Sin enlace';
                fila.append(info, acceso);
                fila.addEventListener('click', () => abrirEventoDesdeEstadisticas(ev.id));
                cont.appendChild(fila);
            });
            if (!cont.childElementCount) {
                const vacio = document.createElement('p');
                vacio.className = 'small text-muted py-3';
                vacio.textContent = filtro ? 'No hay eventos que coincidan con la búsqueda.' : 'No hay eventos guardados en el calendario.';
                cont.appendChild(vacio);
            }
        }

        function abrirEventoDesdeEstadisticas(id) {
            const evento = calendarioCaminatas.find(ev => String(ev.id) === String(id));
            const fecha = evento && fechaEventoEstadisticas(evento.fecha);
            if (!fecha) { showToast('El evento ya no existe o no tiene una fecha válida', 'warning'); return; }
            const abrir = () => {
                calendarioMesActual = new Date(fecha.getFullYear(), fecha.getMonth(), 1);
                navigate('calendario');
                abrirDiaCalendario(evento.fecha);
                document.getElementById('calendario-detalle-dia')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            };
            const modal = document.getElementById('modalEstadisticasPlataforma');
            const instancia = bootstrap.Modal.getInstance(modal);
            if (instancia && modal.classList.contains('show')) {
                modal.addEventListener('hidden.bs.modal', abrir, { once: true });
                instancia.hide();
            } else abrir();
        }

        document.getElementById('modalEstadisticasPlataforma')?.addEventListener('show.bs.modal', actualizarEstadisticasPlataforma);


        function renderEstadisticasCaminantes() {
            const cont = document.getElementById('estadisticas-caminantes');
            if (!cont) return;
            cont.replaceChildren();
            caminatas.forEach((cam, i) => {
                const pax = cam.pasajeros || [];
                const item = document.createElement('div');
                item.className = 'accordion-item';
                const hid = 'est-cam-' + i, cid = 'est-cam-col-' + i;
                item.innerHTML = `<h2 class="accordion-header"><button class="accordion-button collapsed py-2" type="button" data-bs-toggle="collapse" data-bs-target="#${cid}"><span class="fw-semibold">${escapeHtml(cam.nombre || 'Sin nombre')}</span><span class="badge ms-2" style="background:var(--primary-dark);">${pax.length}</span></button></h2><div id="${cid}" class="accordion-collapse collapse" data-bs-parent="#estadisticas-caminantes"><div class="accordion-body p-0" id="${hid}-body"></div></div>`;
                const body = item.querySelector(`#${cid} .accordion-body`);
                pax.forEach(p => {
                    const b = document.createElement('button');
                    b.type = 'button';
                    b.className = 'list-group-item list-group-item-action small py-2';
                    b.style.textAlign = 'left';
                    const nomKey = (p.nombre || '').toLowerCase().trim();
                    const totalCaminatasPersona = caminatas.filter(c2 => (c2.pasajeros || []).some(px => (px.nombre || '').toLowerCase().trim() === nomKey)).length;
                    b.innerHTML = `<span class="flex-grow-1">${escapeHtml(p.nombre || 'Sin nombre')}</span><span class="badge rounded-pill text-bg-secondary ms-2">${totalCaminatasPersona}</span>`;
                    b.classList.add('d-flex', 'align-items-center');
                    b.addEventListener('click', () => mostrarFichaEstadisticaPersona(p.nombre));
                    body.appendChild(b);
                });
                if (!pax.length) body.innerHTML = '<p class="small text-muted py-2 px-3 mb-0">Sin caminantes anotados.</p>';
                cont.appendChild(item);
            });
            if (!caminatas.length) cont.innerHTML = '<p class="small text-muted mb-0">Sin listas.</p>';
        }

        function datosPersonaDirectorio(nombre) {
            const n = (nombre || '').toLowerCase().trim();
            return (directorioPersonas || []).find(d => (d.nombre || '').toLowerCase().trim() === n) || null;
        }

        function mostrarFichaEstadisticaPersona(nombre) {
            const panel = document.getElementById('estadisticas-persona-detalle');
            if (!panel) return;
            const n = (nombre || '').toLowerCase().trim();
            const dir = datosPersonaDirectorio(nombre);
            let eventos = [], participadas = 0, pagos = [], devoluciones = [], notasPersona = [], estadosPorCaminata = [];
            caminatas.forEach(cam => {
                (cam.pasajeros || []).forEach(p => {
                    if ((p.nombre || '').toLowerCase().trim() !== n) return;
                    eventos.push(cam.nombre || 'Sin nombre');
                    estadosPorCaminata.push({ cam: cam.nombre || 'Sin nombre', estado: p.estado || '—' });
                    if (p.asistencia === 'participo') participadas++;
                    if (p.nota) notasPersona.push(p.nota);
                    (p.historialMontos || []).forEach(m => {
                        const fila = { cam: cam.nombre, fecha: m.fecha || '', monto: Number(m.monto || 0), moneda: m.monedaPago || cam.moneda || 'Colones', pagadoPor: m.pagadoPor || '', forma: m.formaPago || '', desc: m.descripcionPago || m.descripcionReversion || '' };
                        (m.reversado || m.estadoPago === 'cancelado' ? devoluciones : pagos).push(fila);
                    });
                });
            });
            const retiros = (historialRetiros || []).filter(r => (r.nombre || '').toLowerCase().trim() === n);
            const totalPagado = pagos.reduce((a, x) => a + x.monto, 0);
            const totalDev = devoluciones.reduce((a, x) => a + x.monto, 0);
            const terceros = pagos.filter(x => x.pagadoPor && x.pagadoPor.toLowerCase().trim() !== n);
            const fmt = v => '₡' + v.toLocaleString('es-CR');
            const filaInfo = (l, v) => v ? `<div class="d-flex justify-content-between py-1 border-bottom"><span class="text-muted small">${l}</span><span class="small fw-semibold" style="text-align:right;">${v}</span></div>` : '';
            panel.innerHTML = `
                <div class="border rounded p-3" style="background:var(--bg-card, #fff);">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h6 class="mb-0 fw-bold">${escapeHtml(nombre)}</h6>
                        <button type="button" class="btn-close" aria-label="Cerrar" onclick="this.closest('#estadisticas-persona-detalle').replaceChildren()"></button>
                    </div>
                    ${filaInfo('Nivel', dir && dir.nivel ? escapeHtml(dir.nivel) : 'Sin asignar')}
                    ${filaInfo('Teléfono', dir && dir.telefono ? escapeHtml(dir.telefono) : '')}
                    ${filaInfo('Fecha de nacimiento', dir && dir.fechaNacimiento ? escapeHtml(dir.fechaNacimiento) : '')}
                    <div class="py-1 border-bottom"><div class="text-muted small mb-1">Estado de pago por caminata</div>${estadosPorCaminata.map(e => `<div class="d-flex justify-content-between small"><span>• ${escapeHtml(e.cam)}</span><span class="fw-semibold">${escapeHtml(e.estado)}</span></div>`).join('')}</div>
                    ${filaInfo('Eventos inscritos', eventos.length)}
                    ${filaInfo('Caminatas participadas', participadas)}
                    ${filaInfo('Caminatas retiradas', retiros.length)}
                    ${filaInfo('Total pagado', fmt(totalPagado))}
                    ${filaInfo('Total devuelto', fmt(totalDev))}
                    ${retiros.map(r => `<div class="small text-danger mt-1">Retirada de ${escapeHtml(r.camNombre || '')} · ${escapeHtml(r.fecha || '')}</div>`).join('')}
                    ${devoluciones.map(d => `<div class="small mt-1">↩ ${fmt(d.monto)} devuelto · ${escapeHtml(d.fecha)}${d.desc ? ' · ' + escapeHtml(d.desc) : ''}</div>`).join('')}
                    ${pagos.map(x => `<div class="small text-muted mt-1">💰 ${fmt(x.monto)} · ${escapeHtml(x.fecha)}${x.pagadoPor && x.pagadoPor.toLowerCase().trim() !== n ? ' · pagó: <b>' + escapeHtml(x.pagadoPor) + '</b>' : ''}${x.forma ? ' · ' + escapeHtml(x.forma) : ''}</div>`).join('')}
                    ${terceros.length ? `<div class="small mt-2"><span class="text-muted">Pagos hechos por terceros:</span> ${terceros.map(t => escapeHtml(t.pagadoPor)).join(', ')}</div>` : ''}
                    ${notasPersona.length ? `<div class="small mt-2"><span class="text-muted">Notas:</span> ${notasPersona.map(escapeHtml).join(' · ')}</div>` : ''}
                    ${dir && dir.notas ? `<div class="small mt-1"><span class="text-muted">Detalle directorio:</span> ${escapeHtml(dir.notas)}</div>` : ''}
                    <div class="py-1"><div class="text-muted small mb-1">Caminatas</div>${eventos.map(e => `<div class="small">• ${escapeHtml(e)}</div>`).join('')}</div>
                </div>`;
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
