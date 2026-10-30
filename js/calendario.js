/* ARCHIVO: js/calendario.js — Calendario de Caminatas (extraído de AGENDATRIBUPRO-2) */
        function hoyStrCR() {
            // Fecha de HOY en hora de Costa Rica (America/Costa_Rica), formato YYYY-MM-DD
            return new Intl.DateTimeFormat('en-CA', {
                timeZone: 'America/Costa_Rica',
                year: 'numeric', month: '2-digit', day: '2-digit'
            }).format(new Date());
        }

        function normalizarCalendario(c) {
            return {
                id: c.id || 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
                nombre: c.nombre || '',
                actividad: c.actividad || 'Caminata',
                caminataId: c.caminataId || '',
                tipo: c.tipo || '',
                hora: c.hora || '',
                etapa: c.etapa || '',
                parque: c.parque || '',
                pais: c.pais || '',
                fecha: c.fecha || hoyStrCR(),
                precioBuseta: Number(c.precioBuseta || 0),
                precioPaquete: Number(c.precioPaquete || 0),
                fechaFin: c.fechaFin || '',
                notas: c.notas || '',
                createdAt: c.createdAt || new Date().toISOString()
            };
        }

        function normalizarFeriado(f) {
            return {
                id: f.id || 'fer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
                fecha: f.fecha || hoyStrCR(),
                nombre: f.nombre || '',
                diaSemana: f.diaSemana || '',
                tipo: f.tipo || 'personalizado',
                caminataNombre: f.caminataNombre || '',
                caminataActividad: f.caminataActividad || ''
            };
        }

        // Rango ocupado por un evento: [fecha, fechaFin || fecha]
        function rangoEvento(ev) {
            const ini = ev.fecha;
            const fin = ev.fechaFin && ev.fechaFin >= ev.fecha ? ev.fechaFin : ev.fecha;
            return { ini, fin };
        }
        function eventoEnDia(ev, fecha) {
            const r = rangoEvento(ev);
            return fecha >= r.ini && fecha <= r.fin;
        }
        function toggleFechaFinCalendario() {
            const chk = document.getElementById('calendario-varios-dias');
            const cont = document.getElementById('calendario-fecha-fin-container');
            if (cont) cont.style.display = (chk && chk.checked) ? '' : 'none';
        }

        function sincronizarCaminatasCalendario() {
            caminatas.forEach(cam => {
                const fechas = [
                    ['salida', cam.vueloFechaSalida || cam.fechaLocal || cam.fechaIda, cam.vueloHoraSalida || cam.horaSalida],
                    ['regreso', cam.vueloFechaRegreso || cam.fechaRegreso, cam.vueloHoraRegreso]
                ];
                fechas.forEach(([tipo, fecha, hora]) => {
                    if (!fecha || (tipo === 'regreso' && fecha === fechas[0][1])) return;
                    const id = 'cal_cam_' + cam.id + (tipo === 'salida' ? '_s' : '_r');
                    let ev = calendarioCaminatas.find(e => e.id === id || (e.caminataId === cam.id && e.tipo === tipo));
                    if (!ev) { ev = { id }; calendarioCaminatas.push(ev); }
                    Object.assign(ev, { caminataId: cam.id, nombre: cam.nombre, actividad: 'Caminata', tipo, fecha, hora: hora || '', precioPaquete: cam.precio || 0 });
                });
            });
        }

        function festivosNacionalesCalendario(anio) {
            const fijos = [[1,1,'Año Nuevo'],[4,11,'Día de Juan Santamaría'],[5,1,'Día del Trabajador'],[7,25,'Anexión de Guanacaste'],[8,2,'Día de la Virgen de los Ángeles'],[8,15,'Día de la Madre'],[9,15,'Día de la Independencia'],[12,25,'Navidad']];
            const a=anio%19,b=Math.floor(anio/100),c=anio%100,d=Math.floor(b/4),e=b%4;
            const f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30;
            const i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
            const mes=Math.floor((h+l-7*m+114)/31),dia=(h+l-7*m+114)%31+1;
            const jueves=new Date(anio,mes-1,dia-3),viernes=new Date(anio,mes-1,dia-2);
            fijos.push([jueves.getMonth()+1,jueves.getDate(),'Jueves Santo'],[viernes.getMonth()+1,viernes.getDate(),'Viernes Santo']);
            return fijos.map(([mes,dia,nombre])=>({fecha:anio+'-'+String(mes).padStart(2,'0')+'-'+String(dia).padStart(2,'0'),nombre}));
        }

        function renderCalendario() {
            sincronizarCaminatasCalendario();
            const cont = document.getElementById('calendario-grid');
            const titulo = document.getElementById('calendario-mes-ano');
            if (!cont || !titulo) return;
            // En calendario el FAB flotante nunca se muestra
            const fabCal = document.getElementById('main-fab');
            if (fabCal) fabCal.style.display = 'none';
            const anio = calendarioMesActual.getFullYear();
            const mes = calendarioMesActual.getMonth();
            const festivosDelAnio = festivosNacionalesCalendario(anio);
            titulo.innerText = MESES[mes] + ' ' + anio + ' ▾';
            titulo.style.cursor = 'pointer';
            titulo.onclick = dropdownMesAnioCalendario;

            const primerDiaMes = new Date(anio, mes, 1).getDay(); // 0=Domingo
            const diasEnMes = new Date(anio, mes + 1, 0).getDate();
            const hoy = hoyStrCR();
            const filtro = (document.getElementById('buscar-calendario')?.value || '').toLowerCase().trim();

            const diaHeaders = ['D', 'L', 'K', 'M', 'J', 'V', 'S'];
            let html = '';
            diaHeaders.forEach(d => html += `<div class="calendario-dia-header">${d}</div>`);

            // Días del mes anterior para rellenar
            const diasAntes = primerDiaMes;
            const ultimoDiaMesAnterior = new Date(anio, mes, 0).getDate();
            for (let i = diasAntes - 1; i >= 0; i--) {
                const d = ultimoDiaMesAnterior - i;
                html += `<div class="calendario-dia otro-mes"><span>${d}</span></div>`;
            }

            for (let d = 1; d <= diasEnMes; d++) {
                const fecha = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                const esHoy = fecha === hoy;
                const feriado = diasFestivos.find(f => f.fecha === fecha) || festivosDelAnio.find(f => f.fecha === fecha);
                const eventosDia = calendarioCaminatas.filter(ev => eventoEnDia(ev, fecha));
                const clases = ['calendario-dia'];
                if (feriado) clases.push('feriado');
                if (esHoy) clases.push('calendario-dia-seleccionado');
                const esDomingo = feriado && feriado.nombre && feriado.nombre.toLowerCase().includes('domingo');

                let eventosHtml = '';
                if (filtro) {
                    const evFiltrados = eventosDia.filter(ev =>
                        (ev.nombre || '').toLowerCase().includes(filtro) ||
                        (ev.actividad || '').toLowerCase().includes(filtro) ||
                        (ev.pais || '').toLowerCase().includes(filtro) ||
                        (ev.parque || '').toLowerCase().includes(filtro)
                    );
                    if (evFiltrados.length > 0) eventosHtml = `<div class="calendario-lista-eventos">${evFiltrados.map(e => `<div class="evt" style="color:${e.tipo==='regreso'?'#16a34a':'var(--primary-color,#f97316)'}">${escapeHtml(e.nombre)}${e.hora?' · '+e.hora:''}</div>`).join('')}</div>`;
                } else {
                    const dots = eventosDia.slice(0, 4).map(e => `<span class="calendario-evento" style="background:${e.tipo==='regreso'?'#16a34a':'var(--primary-color,#f97316)'}"></span>`).join('');
                    if (eventosDia.length) {
                        let lista = eventosDia.slice(0, 2).map(e => `<div class="evt">${escapeHtml(e.nombre)}</div>`).join('');
                        eventosHtml = `<div class="d-flex justify-content-center mt-1">${dots}</div><div class="calendario-lista-eventos">${lista}</div>`;
                    }
                }

                const infoDomingo = esDomingo ? `
                    <div class="w-100" style="font-size:0.6rem;line-height:1.1;margin-top:2px;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">
                        ${feriado.caminataNombre ? `<b>${escapeHtml(feriado.caminataNombre)}</b>` : ''}
                        ${feriado.caminataActividad ? `<div style="font-size:0.55rem;color:#6c757d;">${escapeHtml(feriado.caminataActividad)}</div>` : ''}
                    </div>
                ` : '';

                // Barra de color para eventos multi-día que cubren este día
                const multiDia = eventosDia.find(ev => ev.fechaFin && ev.fechaFin > ev.fecha);
                const barraMulti = multiDia ? `<div class="calendario-multidia" title="${escapeHtml(multiDia.nombre)} (${multiDia.fecha} → ${multiDia.fechaFin})"></div>` : '';

                html += `<div class="${clases.join(' ')}" style="${feriado ? 'background-color:#fff0ed;' : ''}" onclick="clickDiaCalendario('${fecha}')" title="${feriado ? feriado.nombre + ' - ' + feriado.diaSemana : ''}">
                    ${barraMulti}
                    <span class="fw-bold ${esHoy ? 'rounded-circle px-1' : ''}" style="${esHoy ? 'background:var(--primary-dark);color:#fff;' : ''}">${d}</span>

                    ${eventosHtml}
                </div>`;
            }

            // Rellenar final
            const celdasTotales = diasAntes + diasEnMes;
            const resto = (7 - (celdasTotales % 7)) % 7;
            for (let d = 1; d <= resto; d++) {
                html += `<div class="calendario-dia otro-mes"><span>${d}</span></div>`;
            }

            cont.innerHTML = html;
            document.getElementById('calendario-detalle-dia').style.display = 'none';
        }

        function cambiarMesCalendario(delta) {
            const [anio, mes] = hoyStrCR().split('-').map(Number);
            const destino = new Date(calendarioMesActual.getFullYear(), calendarioMesActual.getMonth() + delta, 1);
            if (destino < new Date(anio, mes - 1, 1)) return;
            calendarioMesActual = destino;
            renderCalendario();
        }

        function irHoyCalendario() {
            calendarioMesActual = new Date();
            renderCalendario();
        }

        function filtrarCalendario() {
            renderCalendario();
        }

        // Vista completa del día: overlay fullscreen con los eventos en tarjetas grandes
        function vistaCompletaDiaCalendario() {
            const fecha = calendarioFechaSeleccionada;
            if (!fecha) return;
            const [anio, mes, dia] = fecha.split('-').map(Number);
            const date = new Date(anio, mes - 1, dia);
            const nombreDia = `${dia} ${MESES[mes - 1]} ${anio} - ${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()]}`;
            const eventos = calendarioCaminatas.filter(ev => eventoEnDia(ev, fecha))
                .sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));

            let overlay = document.getElementById('calendario-vista-completa');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'calendario-vista-completa';
                overlay.style.cssText = 'position:fixed;inset:0;z-index:3000;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;padding:1rem;';
                overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
                document.body.appendChild(overlay);
            }

            const cards = eventos.length ? eventos.map(ev => {
                const r = rangoEvento(ev);
                const rangoTxt = r.fin !== r.ini ? ` <span style="color:var(--primary-color,#f97316);">(${r.ini} → ${r.fin})</span>` : '';
                return `<div style="background:#fff;border-radius:10px;padding:1rem;margin-bottom:0.75rem;cursor:pointer;" onclick="document.getElementById('calendario-vista-completa').remove();abrirModalCalendario('${ev.id}')">
                    <div style="font-weight:bold;font-size:1.1rem;color:var(--primary-dark,#ea580c);">${escapeHtml(ev.nombre || '(sin nombre)')}${rangoTxt}</div>
                    <div class="small" style="color:#555;">
                        ${ev.actividad ? 'Actividad: ' + escapeHtml(ev.actividad) + '<br>' : ''}
                        ${ev.etapa ? 'Etapa: ' + escapeHtml(ev.etapa) + '<br>' : ''}
                        ${ev.parque ? 'Parque: ' + escapeHtml(ev.parque) + '<br>' : ''}
                        ${ev.pais ? 'País: ' + escapeHtml(ev.pais) + '<br>' : ''}
                        ${ev.precioBuseta ? 'Buseta: ' + ev.precioBuseta + ' · ' : ''}${ev.precioPaquete ? 'Paquete: ' + ev.precioPaquete : ''}
                        ${ev.notas ? '<br><i>' + escapeHtml(ev.notas) + '</i>' : ''}
                    </div>
                </div>`;
            }).join('') : '<p class="text-center text-muted">Sin eventos este día.</p>';

            overlay.innerHTML = `<div style="background:#f0f2f5;border-radius:12px;max-width:520px;width:100%;max-height:85vh;overflow-y:auto;padding:1rem;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.75rem;">
                    <h5 style="margin:0;font-weight:bold;">${nombreDia}</h5>
                    <button type="button" style="border:0;background:none;font-size:1.4rem;" onclick="document.getElementById('calendario-vista-completa').remove()">✕</button>
                </div>
                ${cards}
                <button type="button" class="btn btn-sm w-100 mt-1" style="background:#25D366;color:#fff;" onclick="exportarCalendarioWhatsApp()"><i class="fab fa-whatsapp me-1"></i> Compartir por WhatsApp</button>
            </div>`;
        }

        // Info completa de la caminata (cuando el evento viene de Listas)
        function renderInfoCaminataDetalle(cam) {
            const f = (label, val) => (val !== undefined && val !== null && String(val).trim() !== '' && String(val) !== '0')
                ? `<div class="small" style="color:#444;"><b>${label}:</b> ${escapeHtml(String(val))}</div>` : '';
            const arr = (v) => Array.isArray(v) ? v.map(e => (e && typeof e === 'object') ? (e.item || e.nombre || e.texto || '') : e).filter(Boolean).join(', ') : (v || '');
            return `<div class="mt-1 p-2" style="background:#fff7ed;border-radius:6px;font-size:0.78rem;">
                <div style="font-weight:800;color:var(--primary-color,#f97316);font-size:0.85rem;margin-bottom:4px;letter-spacing:.4px;text-transform:uppercase;">Información del Evento</div>
                ${f('Provincia', cam.provincia)}
                ${f('País', cam.pais)}
                ${f('Dificultad', cam.dificultad)}
                ${f('Kilometraje', cam.kilometraje)}
                ${f('Fecha', cam.fechaLocal || cam.fechaIda || '')}
                ${f('Fecha regreso', cam.fechaRegreso)}
                ${f('Hora de salida', cam.horaSalida)}
                ${f('Lugar de salida', cam.lugarSalida)}
                ${f('Lugares a recoger', cam.lugaresRecoger)}
                ${f('Transporte', cam.modoTransporte)}
                ${f('Vuelo', cam.vueloNumero)}
                ${f('Precio', (cam.moneda || '₡') + (cam.precio || '0'))}
                ${f('Precio buseta', cam.precioBuseta)}
                ${f('Cantidad busetas', cam.cantidadBuses)}
                ${f('Reserva', (cam.reservaMonto ? (cam.moneda || '₡') + cam.reservaMonto : '') + (cam.reservaFecha ? ' — límite ' + cam.reservaFecha : ''))}<div style='height:8px'></div>
                ${f('Incluye', arr(cam.incluye))}<div style='height:8px'></div>
                ${f('Formas de pago', arr(cam.formasPago))}
                ${cam.equipo && cam.equipo.length ? '<div class="small"><b>Equipo:</b>' + cam.equipo.map(e => '<div style="margin-left:6px;">• ' + escapeHtml(String((e && typeof e === 'object') ? (e.item || e.nombre || '') : e)) + '</div>').join('') + '</div>' : ''}
                ${f('Instrucciones', cam.instrucciones)}
                ${cam.urls ? `<div class="small"><b>Enlaces:</b> ${(Array.isArray(cam.urls)?cam.urls:[cam.urls]).map(u=>`<a href="${escapeHtml(u.url||u)}" target="_blank" style="color:var(--primary-color)">${escapeHtml(u.url||u)}</a>`).join('<br>')}</div>` : ''}
                ${cam.pasajeros && cam.pasajeros.length ? '<div class="small" style="margin-top:6px;"><b>Participantes:</b>' + cam.pasajeros.map((p, i) => '<div style="margin-left:6px;cursor:pointer;color:var(--primary-color,#f97316);text-decoration:underline;" onclick="event.stopPropagation();openCaminata(\'' + cam.id + '\')">' + (i + 1) + '. ' + escapeHtml(p.nombre || '') + '</div>').join('') + '</div>' : ''}
                ${f('Notas', cam.notasAdicionales)}
            </div>`;
        }

        function abrirDiaCalendario(fecha) {
            calendarioFechaSeleccionada = fecha;
            const titulo = document.getElementById('calendario-dia-titulo');
            const cont = document.getElementById('calendario-dia-eventos');
            const det = document.getElementById('calendario-detalle-dia');
            if (!titulo || !cont || !det) return;

            const [anio, mes, dia] = fecha.split('-').map(Number);
            const date = new Date(anio, mes - 1, dia);
            const feriado = diasFestivos.find(f => f.fecha === fecha) || festivosNacionalesCalendario(anio).find(f => f.fecha === fecha);
            titulo.innerText = `${dia} ${MESES[mes - 1]} ${anio} - ${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()]}${feriado ? ' • ' + feriado.nombre : ''}`;

            const eventosDia = calendarioCaminatas.filter(ev => eventoEnDia(ev, fecha)).sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
            const filtro = (document.getElementById('buscar-calendario')?.value || '').toLowerCase().trim();
            const eventosFiltrados = filtro ? eventosDia.filter(ev =>
                (ev.nombre || '').toLowerCase().includes(filtro) ||
                (ev.actividad || '').toLowerCase().includes(filtro)
            ) : eventosDia;

            if (eventosFiltrados.length === 0) {
                cont.innerHTML = '<p class="text-muted small text-center my-3">No hay caminatas programadas este día.</p>';
            } else {
                cont.innerHTML = eventosFiltrados.map(ev => {
                    const cam = ev.caminataId ? (caminatas || []).find(c => c.id === ev.caminataId) : null;
                    return `
                    <div class="list-group-item d-flex justify-content-between align-items-start" style="cursor:pointer;" onclick="abrirModalCalendario('${ev.id}')">
                        <div class="w-100">
                            <div class="fw-bold" style="color:${ev.tipo==='regreso'?'#16a34a':'var(--primary-dark,#ea580c)'}">${escapeHtml(ev.nombre)}${ev.hora ? ' · ' + ev.hora : ''}${ev.tipo ? ' <span class="small">('+(ev.tipo==='regreso'?'Regreso':'Salida')+')</span>' : ''}</div>
                            <div class="small text-muted">${escapeHtml(ev.actividad)} ${ev.pais ? '• ' + escapeHtml(ev.pais) : ''} ${ev.parque ? '• ' + escapeHtml(ev.parque) : ''}</div>
                            ${ev.precioBuseta ? `<div class="small">Buseta: ₡${Number(ev.precioBuseta).toLocaleString()}</div>` : ''}
                            ${ev.precioPaquete ? `<div class="small">Paquete: ₡${Number(ev.precioPaquete).toLocaleString()}</div>` : ''}
                            ${cam ? renderInfoCaminataDetalle(cam) : ''}
                        </div>
                        <i class="fas fa-pen text-muted mt-1"></i>
                    </div>`;
                }).join('');
            }
            if (feriado) cont.insertAdjacentHTML('afterbegin', `<div class="p-2 mb-2 small" style="background:#fff0ed;border-radius:6px;color:#9c3d32;"><strong>Día festivo:</strong> ${escapeHtml(feriado.nombre)}</div>`);
            document.getElementById('calendario-btn-nuevo').onclick = () => nuevoEventoCalendario(fecha);
            det.style.display = 'block';
        }

        function clickDiaCalendario(fecha) {
            // Día con eventos → detalle para ver/editar; día vacío → modal directo con fecha fijada
            const eventosDia = calendarioCaminatas.filter(ev => eventoEnDia(ev, fecha));
            const feriado = diasFestivos.some(f => f.fecha === fecha) || festivosNacionalesCalendario(Number(fecha.slice(0,4))).some(f => f.fecha === fecha);
            if (eventosDia.length > 0 || feriado) {
                abrirDiaCalendario(fecha);
            } else {
                nuevoEventoCalendario(fecha);
            }
        }

        function nuevoEventoCalendario(fecha) {
            calendarioFechaSeleccionada = fecha;
            abrirModalCalendario(null);
            // La fecha queda fija: el día ya se eligió tocando el calendario
            const inputFecha = document.getElementById('calendario-fecha');
            if (inputFecha) inputFecha.disabled = true;
        }

        function abrirModalCalendarioDesdeFAB() {
            calendarioFechaSeleccionada = hoyStrCR();
            abrirModalCalendario(null);
        }

        function abrirModalCalendario(id = null) {
            const titulo = document.getElementById('modalCalendarioTitulo');
            const form = document.getElementById('form-calendario');
            const btnEliminar = document.getElementById('calendario-btn-eliminar');
            const selectParque = document.getElementById('calendario-select-parque');
            form.reset();
            const inputFechaCal = document.getElementById('calendario-fecha');
            if (inputFechaCal) inputFechaCal.disabled = false;

            // Poblar parques nacionales
            if (selectParque && !selectParque.dataset.poblado) {
                let html = '<option value="" selected>Seleccioná un parque</option>';
                PARQUES_NACIONALES.forEach(p => {
                    html += `<option value="${escapeHtml(p.nombre)}" data-provincia="${escapeHtml(p.provincia)}">${escapeHtml(p.nombre)}</option>`;
                });
                selectParque.innerHTML = html;
                selectParque.dataset.poblado = 'true';
            }

            if (id && calendarioCaminatas.find(c => c.id === id)) {
                const ev = calendarioCaminatas.find(c => c.id === id);
                document.getElementById('calendario-evento-id').value = ev.id;
                document.getElementById('calendario-fecha').value = ev.fecha;
                document.getElementById('calendario-fecha-fin').value = ev.fechaFin || '';
                document.getElementById('calendario-varios-dias').checked = !!ev.fechaFin;
                toggleFechaFinCalendario();
                document.getElementById('calendario-nombre').value = ev.nombre || '';
                document.getElementById('calendario-select-actividad').value = ev.actividad || 'Caminata';
                document.getElementById('calendario-select-etapa').value = ev.etapa || '';
                document.getElementById('calendario-select-parque').value = ev.parque || '';
                document.getElementById('calendario-pais').value = ev.pais || '';
                document.getElementById('calendario-precio-buseta').value = ev.precioBuseta || '';
                document.getElementById('calendario-precio-paquete').value = ev.precioPaquete || '';
                document.getElementById('calendario-notas').value = ev.notas || '';
                titulo.innerText = 'Editar Caminata del Calendario';
                btnEliminar.style.display = 'inline-block';
            } else {
                document.getElementById('calendario-evento-id').value = '';
                document.getElementById('calendario-fecha-fin').value = '';
                document.getElementById('calendario-varios-dias').checked = false;
                toggleFechaFinCalendario();
                document.getElementById('calendario-fecha').value = calendarioFechaSeleccionada || hoyStrCR();
                titulo.innerText = 'Agregar al Calendario';
                btnEliminar.style.display = 'none';
            }

            toggleCalendarioActividad();
            modalCalendario.show();
        }

        function toggleCalendarioActividad() {
            const actividad = document.getElementById('calendario-select-actividad').value;
            const etapaCont = document.getElementById('calendario-etapa-container');
            const parqueCont = document.getElementById('calendario-parque-container');
            const paisCont = document.getElementById('calendario-pais-container');
            const nombre = document.getElementById('calendario-nombre');

            etapaCont.classList.add('d-none');
            parqueCont.classList.add('d-none');
            paisCont.classList.add('d-none');

            if (actividad === 'Internacional') {
                paisCont.classList.remove('d-none');
            } else if (actividad === 'El Camino de Costa Rica') {
                etapaCont.classList.remove('d-none');
            } else if (actividad === 'Parque Nacional') {
                parqueCont.classList.remove('d-none');
            }
        }

        function asignarNombreCalendarioDesdeEtapa() {
            const etapa = document.getElementById('calendario-select-etapa').value;
            const nombre = document.getElementById('calendario-nombre');
            if (etapa && document.getElementById('calendario-select-actividad').value === 'El Camino de Costa Rica') {
                nombre.value = etapa;
            }
        }

        function asignarNombreCalendarioDesdeParque() {
            const parque = document.getElementById('calendario-select-parque').value;
            const nombre = document.getElementById('calendario-nombre');
            if (parque && document.getElementById('calendario-select-actividad').value === 'Parque Nacional') {
                nombre.value = parque;
            }
        }

        async function guardarEventoCalendario() {
            const form = document.getElementById('form-calendario');
            if (!form.reportValidity()) return;

            const id = document.getElementById('calendario-evento-id').value;
            const actividad = document.getElementById('calendario-select-actividad').value;
            const etapa = document.getElementById('calendario-select-etapa').value;
            const parque = document.getElementById('calendario-select-parque').value;
            const pais = document.getElementById('calendario-pais').value;
            const nombre = document.getElementById('calendario-nombre').value.trim();
            const fecha = document.getElementById('calendario-fecha').value;

            let nombreFinal = nombre;
            if (actividad === 'El Camino de Costa Rica' && etapa) nombreFinal = etapa;
            if (actividad === 'Parque Nacional' && parque) nombreFinal = parque;

            // Rango de varios días
            const variosDias = document.getElementById('calendario-varios-dias').checked;
            let fechaFin = variosDias ? (document.getElementById('calendario-fecha-fin').value || '') : '';
            if (variosDias && !fechaFin) {
                showToast('Elegí la fecha final del evento', 'warning');
                return;
            }
            if (fechaFin && fechaFin < fecha) {
                showToast('La fecha final no puede ser anterior a la de inicio', 'danger');
                return;
            }
            if (fechaFin === fecha) fechaFin = ''; // un solo día

            // Anti-cruce: el rango nuevo no puede solapar el rango de otro evento.
            // Dos eventos de un solo día en la MISMA fecha sí se permiten.
            const iniNuevo = fecha, finNuevo = fechaFin || fecha;
            const choque = calendarioCaminatas.find(o => {
                if (o.id === id) return false;
                const r = rangoEvento(o);
                const solapa = !(finNuevo < r.ini || iniNuevo > r.fin);
                if (!solapa) return false;
                // permitido: ambos de un solo día en la misma fecha
                return !(iniNuevo === finNuevo && r.ini === r.fin && iniNuevo === r.ini);
            });
            if (choque) {
                const r = rangoEvento(choque);
                showToast(`Choque de fechas con "${choque.nombre}" (${r.ini}${r.fin !== r.ini ? ' → ' + r.fin : ''})`, 'danger');
                return;
            }

            const ev = {
                id: id || 'cal_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
                nombre: nombreFinal,
                actividad,
                etapa,
                parque,
                pais,
                fecha,
                fechaFin,
                precioBuseta: document.getElementById('calendario-precio-buseta').value || 0,
                precioPaquete: document.getElementById('calendario-precio-paquete').value || 0,
                notas: document.getElementById('calendario-notas').value.trim()
            };

            if (id) {
                const idx = calendarioCaminatas.findIndex(c => c.id === id);
                if (idx >= 0) calendarioCaminatas[idx] = normalizarCalendario(ev);
            } else {
                calendarioCaminatas.push(normalizarCalendario(ev));
            }

            await saveData();
            modalCalendario.hide();
            renderCalendario();
            abrirDiaCalendario(fecha);
            showToast('Caminata guardada en el calendario', 'success');
        }

        async function eliminarEventoCalendario() {
            const id = document.getElementById('calendario-evento-id').value;
            if (!id) return;
            if (!confirm('¿Eliminar esta caminata del calendario?')) return;
            calendarioCaminatas = calendarioCaminatas.filter(c => c.id !== id);
            await saveData();
            modalCalendario.hide();
            renderCalendario();
            document.getElementById('calendario-detalle-dia').style.display = 'none';
            showToast('Caminata eliminada del calendario', 'success');
        }

        function generarTextoEventoCalendario(id = null) {
            let eventos = [];
            if (id) {
                const ev = calendarioCaminatas.find(c => c.id === id);
                if (ev) eventos = [ev];
            } else {
                eventos = calendarioCaminatas.filter(ev => eventoEnDia(ev, calendarioFechaSeleccionada));
            }
            if (eventos.length === 0) return '';

            return eventos.map(ev => {
                const [a, m, d] = ev.fecha.split('-');
                const date = new Date(Number(a), Number(m) - 1, Number(d));
                const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()];
                let txt = `🗓️ *${ev.nombre}*\n`;
                txt += `📅 ${d}/${m}/${a} (${diaSemana})\n`;
                txt += `🥾 Actividad: ${ev.actividad}\n`;
                if (ev.pais) txt += `🌍 País: ${ev.pais}\n`;
                if (ev.etapa) txt += `🏞️ Etapa: ${ev.etapa}\n`;
                if (ev.parque) txt += `🏞️ Parque: ${ev.parque}\n`;
                if (ev.precioBuseta) txt += `🚌 Buseta: ₡${Number(ev.precioBuseta).toLocaleString()}\n`;
                if (ev.precioPaquete) txt += `💰 Paquete: ₡${Number(ev.precioPaquete).toLocaleString()}\n`;
                if (ev.notas) txt += `📝 Nota: ${ev.notas}\n`;
                return txt;
            }).join('\n──────────────────\n');
        }

        function exportarCalendarioWhatsApp() {
            const id = document.getElementById('calendario-evento-id').value;
            const texto = generarTextoEventoCalendario(id);
            if (!texto) return showToast('No hay datos para compartir', 'warning');
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }

        function exportarCalendarioTXT() {
            const id = document.getElementById('calendario-evento-id').value;
            const texto = generarTextoEventoCalendario(id);
            if (!texto) return showToast('No hay datos para exportar', 'warning');
            const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Caminata_Calendario_${hoyStrCR()}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('TXT descargado', 'success');
        }

        // --- DÍAS FESTIVOS ---
        function abrirModalFeriados() {
            miniMesFeriado = new Date();
            document.getElementById('feriado-fecha').value = hoyStrCR();
            document.getElementById('feriado-nombre').value = '';
            document.getElementById('feriado-dia').value = '';
            renderFeriadosModal();
            renderMiniCalendarioFeriados();
            modalFeriados.show();
        }

        function renderFeriadosAjustes() {
            const cont = document.getElementById('feriados-resumen');
            if (!cont) return;
            const hoy = hoyStrCR();
            const total = diasFestivos.length;
            const prox = diasFestivos.filter(f => f.fecha >= hoy).sort((a, b) => a.fecha.localeCompare(b.fecha))[0];
            cont.innerHTML = `Total registrados: <b>${total}</b>. ${prox ? `Próximo: <b>${prox.nombre}</b> (${formatearFechaCalendario(prox.fecha)}).` : ''}`;
        }

        function formatearFechaCalendario(fecha) {
            if (!fecha) return '';
            const [a, m, d] = fecha.split('-');
            return `${d}/${m}/${a}`;
        }

        function renderFeriadosModal() {
            const cont = document.getElementById('feriados-lista');
            if (!cont) return;
            if (diasFestivos.length === 0) {
                cont.innerHTML = '<p class="text-muted small text-center my-3">No hay días festivos registrados.</p>';
                return;
            }
            const ordenados = [...diasFestivos].sort((a, b) => a.fecha.localeCompare(b.fecha));
            cont.innerHTML = ordenados.map(f => {
                const esDomingo = f.nombre && f.nombre.toLowerCase().includes('domingo');
                return `
                <div class="list-group-item p-2" data-feriado-id="${f.id}">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                        <div>
                            <div class="fw-bold small">${escapeHtml(f.nombre)}</div>
                            <div class="small text-muted">${formatearFechaCalendario(f.fecha)} ${f.diaSemana ? '• ' + f.diaSemana : ''}</div>
                        </div>
                        <button type="button" class="btn btn-outline-danger btn-sm" onclick="eliminarFeriado('${f.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                    ${esDomingo ? `
                    <div class="row g-1 mt-1 border-top pt-1">
                        <div class="col-6">
                            <input type="text" class="form-control form-control-sm" placeholder="Caminata" value="${escapeHtml(f.caminataNombre || '')}" onchange="guardarCaminataFeriado('${f.id}', 'caminataNombre', this.value)">
                        </div>
                        <div class="col-6">
                            <input type="text" class="form-control form-control-sm" placeholder="Actividad" value="${escapeHtml(f.caminataActividad || '')}" onchange="guardarCaminataFeriado('${f.id}', 'caminataActividad', this.value)">
                        </div>
                    </div>
                    <div class="small text-muted mt-1" style="font-size:0.65rem;">${formatearFechaCalendario(f.fecha)} - ${escapeHtml(f.caminataNombre || 'Sin caminata asignada')} (${escapeHtml(f.caminataActividad || 'Sin actividad')})</div>
                    ` : ''}
                </div>
            `}).join('');
        }

        async function agregarFeriado() {
            const fecha = document.getElementById('feriado-fecha').value;
            const nombre = document.getElementById('feriado-nombre').value.trim();
            const diaSemana = document.getElementById('feriado-dia').value;
            if (!fecha || !nombre) return showToast('Fecha y nombre son requeridos', 'danger');

            const date = new Date(fecha);
            const diaCalculado = diaSemana || ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()];

            const exists = diasFestivos.some(f => f.fecha === fecha && f.nombre.toLowerCase() === nombre.toLowerCase());
            if (exists) return showToast('Este festivo ya existe', 'warning');

            diasFestivos.push(normalizarFeriado({
                fecha,
                nombre,
                diaSemana: diaCalculado,
                tipo: 'personalizado'
            }));
            await saveData();
            document.getElementById('feriado-nombre').value = '';
            document.getElementById('feriado-dia').value = '';
            renderFeriadosModal();
            renderFeriadosAjustes();
            showToast('Feriado agregado', 'success');
        }

        async function eliminarFeriado(id) {
            if (!confirm('¿Eliminar este día festivo?')) return;
            diasFestivos = diasFestivos.filter(f => f.id !== id);
            await saveData();
            renderFeriadosModal();
            renderFeriadosAjustes();
            renderCalendario();
            showToast('Feriado eliminado', 'success');
        }

        async function generarDomingosFestivos() {
            const hoy = new Date();
            const fin = new Date(2028, 11, 31);
            const agregados = [];
            for (let d = new Date(hoy); d <= fin; d.setDate(d.getDate() + 1)) {
                if (d.getDay() === 0) { // Domingo
                    const fecha = d.toISOString().split('T')[0];
                    if (!diasFestivos.some(f => f.fecha === fecha)) {
                        agregados.push(normalizarFeriado({
                            fecha,
                            nombre: 'Domingo',
                            diaSemana: 'Domingo',
                            tipo: 'domingo'
                        }));
                    }
                }
            }
            if (agregados.length === 0) return showToast('Los domingos ya están generados', 'warning');
            diasFestivos = diasFestivos.concat(agregados);
            await saveData();
            renderFeriadosModal();
            renderFeriadosAjustes();
            renderCalendario();
            showToast(`${agregados.length} domingos agregados hasta 2028`, 'success');
        }

        async function guardarCaminataFeriado(id, campo, valor) {
            const idx = diasFestivos.findIndex(f => f.id === id);
            if (idx < 0) return;
            diasFestivos[idx][campo] = valor.trim();
            await saveData();
            renderMiniCalendarioFeriados();
            renderCalendario();
        }

        function generarTextoDomingosConCaminatas() {
            const domingos = diasFestivos
                .filter(f => f.nombre && f.nombre.toLowerCase().includes('domingo'))
                .sort((a, b) => a.fecha.localeCompare(b.fecha));

            if (domingos.length === 0) return '';

            let txt = '📅 DOMINGOS CON CAMINATAS\n';
            txt += '══════════════════════════\n\n';

            txt += domingos.map(f => {
                const [a, m, d] = f.fecha.split('-');
                const date = new Date(Number(a), Number(m) - 1, Number(d));
                const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()];
                let e = `• ${d}/${m}/${a} (${diaSemana})\n`;
                if (f.caminataNombre) e += `  🥾 Caminata: ${f.caminataNombre}\n`;
                if (f.caminataActividad) e += `  📍 Actividad: ${f.caminataActividad}\n`;
                if (!f.caminataNombre && !f.caminataActividad) e += `  (Sin caminata asignada)\n`;
                return e;
            }).join('\n');

            return txt;
        }

        function exportarDomingosWhatsApp() {
            const texto = generarTextoDomingosConCaminatas();
            if (!texto) return showToast('No hay domingos registrados', 'warning');
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }

        function exportarDomingosTXT() {
            const texto = generarTextoDomingosConCaminatas();
            if (!texto) return showToast('No hay domingos registrados', 'warning');
            const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Domingos_Caminatas_${hoyStrCR()}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('TXT de domingos descargado', 'success');
        }

        async function guardarFeriadosManualmente() {
            await saveData();
            modalFeriados.hide();
            renderFeriadosAjustes();
            renderCalendario();
            showToast('Cambios guardados', 'success');
        }

        function generarTextoMesCalendario() {
            const anio = calendarioMesActual.getFullYear();
            const mes = calendarioMesActual.getMonth();
            const inicio = `${anio}-${String(mes + 1).padStart(2, '0')}-01`;
            const finDias = new Date(anio, mes + 1, 0).getDate();
            const fin = `${anio}-${String(mes + 1).padStart(2, '0')}-${String(finDias).padStart(2, '0')}`;
            const eventosMes = calendarioCaminatas.filter(ev => ev.fecha >= inicio && ev.fecha <= fin).sort((a, b) => a.fecha.localeCompare(b.fecha));

            if (eventosMes.length === 0) return '';

            let txt = `🗓️ CALENDARIO ${MESES[mes].toUpperCase()} ${anio}\n`;
            txt += `══════════════════════════════\n\n`;
            txt += `Festivos del mes: ${diasFestivos.filter(f => f.fecha >= inicio && f.fecha <= fin).map(f => `${formatearFechaCalendario(f.fecha)} ${f.nombre}`).join(', ') || 'Ninguno'}\n\n`;

            txt += eventosMes.map(ev => {
                const [a, m, d] = ev.fecha.split('-');
                const date = new Date(Number(a), Number(m) - 1, Number(d));
                const diaSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][date.getDay()];
                let e = `• *${ev.nombre}*\n`;
                e += `  ${d}/${m}/${a} (${diaSemana})\n`;
                e += `  ${ev.actividad}`;
                if (ev.etapa) e += ` - ${ev.etapa}`;
                if (ev.parque) e += ` - ${ev.parque}`;
                if (ev.pais) e += ` (${ev.pais})`;
                e += '\n';
                if (ev.precioBuseta) e += `  🚌 Buseta: ₡${Number(ev.precioBuseta).toLocaleString()}\n`;
                if (ev.precioPaquete) e += `  💰 Paquete: ₡${Number(ev.precioPaquete).toLocaleString()}\n`;
                if (ev.notas) e += `  📝 ${ev.notas}\n`;
                return e;
            }).join('\n');

            return txt;
        }

        function exportarMesCalendarioWhatsApp() {
            const texto = generarTextoMesCalendario();
            if (!texto) return showToast('No hay caminatas en este mes', 'warning');
            window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank');
        }

        function exportarMesCalendarioTXT() {
            const texto = generarTextoMesCalendario();
            if (!texto) return showToast('No hay caminatas en este mes', 'warning');
            const blob = new Blob([texto], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const anio = calendarioMesActual.getFullYear();
            const mes = String(calendarioMesActual.getMonth() + 1).padStart(2, '0');
            a.download = `Calendario_${anio}_${mes}.txt`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            showToast('TXT del mes descargado', 'success');
        }
/* __longpress_dia */
let _lpTimer=null,_lpFecha=null,_calTouch=null,_calSuppressClick=0;
document.addEventListener('touchstart',e=>{
  if(!e.target.closest('#view-calendario')||e.target.closest('input,select,textarea,button,a'))return;
  const t=e.touches[0];
  _calTouch={x:t.clientX,y:t.clientY};
},{passive:true});
document.addEventListener('touchmove',e=>{
  if(!_calTouch)return;
  const t=e.touches[0],dx=t.clientX-_calTouch.x,dy=t.clientY-_calTouch.y;
  if(Math.abs(dx)>15&&Math.abs(dx)>Math.abs(dy)*1.5&&e.cancelable)e.preventDefault();
},{passive:false});
document.addEventListener('touchcancel',()=>{_calTouch=null;clearTimeout(_lpTimer);},{passive:true});
document.addEventListener('touchend',e=>{
  if(!_calTouch)return;
  const t=e.changedTouches[0],dx=t.clientX-_calTouch.x,dy=t.clientY-_calTouch.y;
  _calTouch=null;
  if(Math.abs(dx)<60||Math.abs(dx)<Math.abs(dy)*1.5)return;
  _calSuppressClick=Date.now()+500;
  const [a,m]=hoyStrCR().split('-').map(Number);
  const siguiente=new Date(calendarioMesActual.getFullYear(),calendarioMesActual.getMonth()+(dx<0?1:-1),1);
  if(siguiente<new Date(a,m-1,1))return;
  cambiarMesCalendario(dx<0?1:-1);
},{passive:true});
document.addEventListener('click',e=>{
  if(Date.now()<_calSuppressClick&&e.target.closest('#view-calendario')){e.preventDefault();e.stopImmediatePropagation();}
},true);
document.addEventListener('touchstart',e=>{
  const celda=e.target.closest('.calendario-dia');
  if(!celda||!celda.onclick)return;
  const m=celda.getAttribute('onclick').match(/clickDiaCalendario\('([^']+)'\)/);
  if(!m)return;
  _lpFecha=m[1];
  _lpTimer=setTimeout(()=>{_calSuppressClick=Date.now()+800;menuDiaCalendario(_lpFecha);},600);
},{passive:true});
document.addEventListener('touchend',()=>{clearTimeout(_lpTimer);_lpTimer=null;},{passive:true});
document.addEventListener('touchmove',()=>{clearTimeout(_lpTimer);_lpTimer=null;},{passive:true});

function menuDiaCalendario(fecha){
  const evs=calendarioCaminatas.filter(ev=>eventoEnDia(ev,fecha));
  if(!evs.length)return;
  const ov=document.createElement('div');
  ov.id='cal-menu-dia';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:2000;display:flex;align-items:center;justify-content:center;';
  const ev=evs[0];
  ov.innerHTML='<div style="background:#fff;border-radius:12px;padding:1rem;min-width:220px;box-shadow:0 8px 24px rgba(0,0,0,.3);">'+
    '<div style="font-weight:bold;margin-bottom:0.75rem;">'+escapeHtml(ev.nombre)+' · '+fecha+'</div>'+
    '<button class="btn w-100 mb-2" style="background:#f97316;border-color:#f97316;color:white;" onclick="cerrarMenuDia();'+(ev.caminataId?'openCaminata(\''+ev.caminataId+'\')':'abrirModalCalendario(\''+ev.id+'\')')+'">Editar evento</button>'+
    '<button class="btn w-100" style="border-color:#f97316;color:#c2410c;" onclick="cerrarMenuDia();cambiarFechaEventoCalendario(\''+ev.id+'\')">Cambiar fecha del evento</button>'+
    '<button class="btn btn-link w-100 mt-1" onclick="cerrarMenuDia()">Cancelar</button></div>';
  ov.onclick=(e)=>{if(e.target===ov)ov.remove();};
  document.body.appendChild(ov);
}
function cerrarMenuDia(){document.getElementById('cal-menu-dia')?.remove();}

function cambiarFechaEventoCalendario(evId){
  const ev=calendarioCaminatas.find(c=>c.id===evId);
  if(!ev)return;
  document.getElementById('cal-fecha-modal')?.remove();
  const modal=document.createElement('div');
  modal.id='cal-fecha-modal';
  modal.style.cssText='position:fixed;inset:0;z-index:2200;background:#0006;display:flex;align-items:center;justify-content:center;padding:20px;';
  modal.innerHTML='<form style="background:white;padding:20px;border-radius:12px;width:100%;max-width:360px;"><h5>Cambiar fecha del evento</h5><label for="cal-nueva-fecha">Día, mes y año</label><input id="cal-nueva-fecha" type="date" required class="form-control my-3"><div class="d-flex gap-2"><button type="button" class="btn" style="color:#c2410c;" onclick="this.closest(\'#cal-fecha-modal\').remove()">Cancelar</button><button type="submit" class="btn" style="background:#f97316;color:white;">Guardar fecha</button></div></form>';
  document.body.appendChild(modal);
  const inp=modal.querySelector('input');
  inp.value=ev.fecha;
  modal.querySelector('form').onsubmit=async e=>{
    e.preventDefault();
    const nueva=inp.value;
    if(nueva&&nueva!==ev.fecha){
      const fechaUTC=f=>{const [a,m,d]=f.split('-').map(Number);return Date.UTC(a,m-1,d);};
      const difDias=Math.round((fechaUTC(nueva)-fechaUTC(ev.fecha))/86400000);
      const desplazar=f=>{
        const d=new Date(fechaUTC(f)+difDias*86400000);
        return [d.getUTCFullYear(),String(d.getUTCMonth()+1).padStart(2,'0'),String(d.getUTCDate()).padStart(2,'0')].join('-');
      };
      if(ev.caminataId){
        const cam=caminatas.find(c=>c.id===ev.caminataId);
        if(cam){
          const campos=ev.tipo==='regreso'?['fechaRegreso','vueloFechaRegreso']:['fechaLocal','fechaIda','fechaRegreso','vueloFechaSalida','vueloFechaRegreso'];
          campos.forEach(k=>{if(cam[k])cam[k]=desplazar(cam[k]);});
        }
      }
      if(ev.fechaFin)ev.fechaFin=desplazar(ev.fechaFin);
      ev.fecha=nueva;
      sincronizarCaminatasCalendario();
      await saveData();
      renderCalendario();
      showToast('Evento movido a '+nueva,'success');
    }
    modal.remove();
  };
}

/* __cal_css */
(function(){const s=document.createElement('style');s.textContent='#calendario-grid .calendario-dia.feriado{background-color:#fff0ed;animation:festivoSuave 4s ease-in-out infinite alternate;}@keyframes festivoSuave{from{background-color:#fff0ed;}to{background-color:#fbded8;}}@media(prefers-reduced-motion:reduce){#calendario-grid .calendario-dia.feriado{animation:none;background-color:#fbded8!important;}}';document.head.appendChild(s);})();

function dropdownMesAnioCalendario(){
  document.getElementById('cal-dropdown-mes')?.remove();
  const hoy=new Date();
  const ov=document.createElement('div');
  ov.id='cal-dropdown-mes';
  ov.style.cssText='position:fixed;top:110px;left:50%;transform:translateX(-50%);background:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.25);z-index:2100;max-height:60vh;overflow-y:auto;min-width:200px;';
  const mActual=calendarioMesActual?calendarioMesActual[0]:hoy.getMonth(),aActual=calendarioMesActual?calendarioMesActual[1]:hoy.getFullYear();
  let html='';
  let m=hoy.getMonth(),a=hoy.getFullYear();
  while(a<hoy.getFullYear()+11||m<=11){
    if(a===hoy.getFullYear()+11&&m>11)break;
    const sel=(m===mActual&&a===aActual);
    html+='<div data-m="'+m+'" data-a="'+a+'" style="padding:10px 18px;cursor:pointer;'+(sel?'font-weight:bold;background:#fff3e0;color:var(--primary-color,#f97316);':'')+'">'+MESES[m]+' '+a+'</div>';
    m++;if(m>11){m=0;a++;}
    if(a>hoy.getFullYear()+11)break;
  }
  ov.innerHTML=html;
  ov.onclick=(e)=>{
    const d=e.target.closest('[data-m]');
    if(d){calendarioMesActual=new Date(parseInt(d.dataset.a),parseInt(d.dataset.m),1);renderCalendario();ov.remove();}
  };
  document.body.appendChild(ov);
  setTimeout(()=>document.addEventListener('click',function c(e){if(!ov.contains(e.target)){ov.remove();document.removeEventListener('click',c);}}),10);
}
